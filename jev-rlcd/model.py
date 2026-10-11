"""
JEV (Joint Evaluation Vector) Neural Network Model Architecture.

The Joint Evaluation Vector model combines sequence modeling (Transformer Encoder / Multi-Head Self-Attention),
latent feature abstraction (JEV representation), and dual heads:
1. Decision Head: Generates decision logits over categorical actions (e.g., Risk-Off, Neutral, Risk-On).
2. Calibration Head: Outputs temperature-scaled confidence metrics and expected uncertainty/calibration vectors.
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple, Dict, Any


class PositionalEncoding(nn.Module):
    def __init__(self, d_model: int, max_len: int = 500):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer('pe', pe.unsqueeze(0))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: [batch_size, seq_len, d_model]
        return x + self.pe[:, :x.size(1)]


class JEVModel(nn.Module):
    """
    Joint Evaluation Vector (JEV) Architecture.

    Processes state input sequence (batch, seq_len, feature_dim) through:
    1. Input projection & Positional Encoding
    2. Multi-layer Transformer Encoder to extract temporal correlations
    3. Latent Joint Evaluation Vector (JEV) Pooling
    4. Action Logits Head (Decision)
    5. Calibration & Uncertainty Head (Probability scaling and confidence score)
    """
    def __init__(
        self,
        feature_dim: int,
        d_model: int = 64,
        nhead: int = 4,
        num_layers: int = 2,
        num_classes: int = 3,
        dim_feedforward: int = 128,
        dropout: float = 0.1
    ):
        super().__init__()
        self.feature_dim = feature_dim
        self.d_model = d_model
        self.num_classes = num_classes

        # Input Linear Projection
        self.input_proj = nn.Linear(feature_dim, d_model)
        self.pos_encoder = PositionalEncoding(d_model)

        # Transformer Encoder Backbone
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)

        # Joint Evaluation Vector (JEV) Projection Head
        self.jev_proj = nn.Sequential(
            nn.Linear(d_model, d_model),
            nn.GELU(),
            nn.LayerNorm(d_model)
        )

        # Decision Logits Head
        self.decision_head = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.GELU(),
            nn.Linear(d_model // 2, num_classes)
        )

        # Calibration Head (Outputs log-temperature for adaptive Softmax scaling + uncertainty confidence)
        self.calibration_head = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.GELU(),
            nn.Linear(d_model // 2, 2)  # [log_temperature, estimated_confidence]
        )

    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """
        Forward pass.
        x: [batch_size, seq_len, feature_dim]

        Returns dict containing:
        - 'logits': Decision logits [batch_size, num_classes]
        - 'calibrated_probs': Temperature-calibrated probabilities [batch_size, num_classes]
        - 'jev': Latent Joint Evaluation Vector [batch_size, d_model]
        - 'temperature': Sample-specific calibration temperature [batch_size, 1]
        - 'confidence': Model estimated confidence score in [0, 1] [batch_size, 1]
        """
        # Step 1: Input projection + positional encoding
        h = self.input_proj(x)
        h = self.pos_encoder(h)

        # Step 2: Transformer Encoder
        enc_out = self.transformer_encoder(h)  # [batch_size, seq_len, d_model]

        # Step 3: Mean pooling over time sequence to obtain representation
        seq_rep = torch.mean(enc_out, dim=1)  # [batch_size, d_model]

        # Step 4: Compute Joint Evaluation Vector (JEV)
        jev = self.jev_proj(seq_rep)  # [batch_size, d_model]

        # Step 5: Decision logits
        logits = self.decision_head(jev)  # [batch_size, num_classes]

        # Step 6: Calibration & Confidence metrics
        calib_out = self.calibration_head(jev)
        log_temp = calib_out[:, 0:1]
        confidence = torch.sigmoid(calib_out[:, 1:2])

        # Softplus to enforce positive temperature (clamped to range [0.2, 5.0])
        temperature = torch.clamp(F.softplus(log_temp) + 0.1, min=0.2, max=5.0)

        # Apply temperature scaling to decision logits
        calibrated_logits = logits / temperature
        calibrated_probs = F.softmax(calibrated_logits, dim=-1)

        return {
            "logits": logits,
            "calibrated_probs": calibrated_probs,
            "jev": jev,
            "temperature": temperature,
            "confidence": confidence
        }


def test_jev_model():
    batch_size = 16
    seq_len = 20
    feature_dim = 17

    model = JEVModel(feature_dim=feature_dim)
    dummy_x = torch.randn(batch_size, seq_len, feature_dim)
    out = model(dummy_x)

    print("[JEV Model Test]")
    print(f"Logits shape: {out['logits'].shape}")
    print(f"Calibrated Probs shape: {out['calibrated_probs'].shape}")
    print(f"JEV vector shape: {out['jev'].shape}")
    print(f"Temperature shape: {out['temperature'].shape}")
    print(f"Confidence shape: {out['confidence'].shape}")
    assert out['logits'].shape == (batch_size, 3)
    assert out['calibrated_probs'].shape == (batch_size, 3)
    assert out['jev'].shape == (batch_size, 64)
    print("JEV Model sanity test passed!")


if __name__ == "__main__":
    test_jev_model()
