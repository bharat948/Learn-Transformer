"""
Live Inference and Evaluation Engine for JEV (Joint Evaluation Vector).

Simulates live streaming market data feeds, processes input window features,
runs live JEV model decision inference, computes calibrated confidence vectors,
and displays decision recommendations along with portfolio regime metrics.
"""

import sys
import os
import time
import math
import torch
import numpy as np
import pandas as pd
from typing import Dict, Any

# Ensure path includes parent directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from model import JEVModel
from acquire_data import generate_synthetic_financial_data
from transform import compute_rsi, compute_macd


ACTION_NAMES = {
    0: "RISK-OFF (Defensive / Hedged / Cash)",
    1: "NEUTRAL (Hold / Rebalance)",
    2: "RISK-ON (Aggressive Long Growth)"
}

ACTION_COLORS = {
    0: "\033[91m",  # Red
    1: "\033[93m",  # Yellow
    2: "\033[92m"   # Green
}
RESET_COLOR = "\033[0m"


class LiveJEVEngine:
    def __init__(
        self,
        checkpoint_path: str = "jev-rlcd/checkpoints/jev_rlcd.pt",
        seq_length: int = 20
    ):
        self.seq_length = seq_length
        self.checkpoint_path = checkpoint_path

        if not os.path.exists(checkpoint_path):
            checkpoint_path = "jev-rlcd/checkpoints/jev_pretrained.pt"

        if not os.path.exists(checkpoint_path):
            raise FileNotFoundError(f"No checkpoint found at {checkpoint_path}. Please run training first.")

        ckpt = torch.load(checkpoint_path)
        self.feature_dim = ckpt["feature_dim"]
        self.scaler_mean = np.array(ckpt["scaler_mean"])
        self.scaler_std = np.array(ckpt["scaler_std"])

        self.model = JEVModel(feature_dim=self.feature_dim)
        self.model.load_state_dict(ckpt["model_state"])
        self.model.eval()
        print(f"[Live JEV Engine] Successfully loaded JEV model checkpoint from {checkpoint_path}")

    def process_raw_window(self, df_window: pd.DataFrame) -> torch.Tensor:
        """
        Processes a raw rolling pandas window of market data into normalized model sequence tensor.
        """
        asset_cols = [c for c in df_window.columns if c.endswith("_Close")]
        feature_dfs = []

        for c in asset_cols:
            asset_prefix = c.replace("_Close", "")
            close_series = df_window[c]
            ret_series = df_window[f"{asset_prefix}_Return"]

            rsi = compute_rsi(close_series)
            macd = compute_macd(close_series)
            vol_20 = ret_series.rolling(20).std()

            asset_features = pd.DataFrame({
                f"{asset_prefix}_ret": ret_series,
                f"{asset_prefix}_rsi": rsi / 100.0,
                f"{asset_prefix}_macd": macd,
                f"{asset_prefix}_vol20": vol_20
            })
            feature_dfs.append(asset_features)

        vix_normalized = df_window["VIX_Simulated"] / 100.0

        features_df = pd.concat(feature_dfs + [pd.DataFrame({"VIX": vix_normalized})], axis=1)

        # Take last seq_length rows
        raw_matrix = features_df.values[-self.seq_length:]

        # Normalize using training set scaler statistics
        norm_matrix = (raw_matrix - self.scaler_mean) / self.scaler_std

        # Convert to batch tensor [1, seq_length, feature_dim]
        tensor = torch.tensor(norm_matrix, dtype=torch.float32).unsqueeze(0)
        return tensor

    def evaluate_live_step(self, df_window: pd.DataFrame) -> Dict[str, Any]:
        """
        Runs single live evaluation step.
        """
        x_tensor = self.process_raw_window(df_window)
        with torch.no_grad():
            out = self.model(x_tensor)

        probs = out["calibrated_probs"][0].numpy()
        logits = out["logits"][0].numpy()
        jev_vec = out["jev"][0].numpy()
        temp = out["temperature"][0].item()
        confidence = out["confidence"][0].item()

        chosen_action = int(np.argmax(probs))

        return {
            "action": chosen_action,
            "action_name": ACTION_NAMES[chosen_action],
            "probabilities": probs,
            "logits": logits,
            "temperature": temp,
            "confidence": confidence,
            "jev_norm": float(np.linalg.norm(jev_vec))
        }


def run_live_simulation(num_steps: int = 15, delay: float = 0.2):
    """
    Simulates live streaming financial market ticks and outputs JEV decisions.
    """
    print("\n" + "="*70)
    print("        LIVE JEV (JOINT EVALUATION VECTOR) DECISION ENGINE")
    print("="*70)

    # Generate live stream dataset
    df_stream = generate_synthetic_financial_data(num_days=250, seed=123)
    engine = LiveJEVEngine()

    print(f"\nSimulating {num_steps} real-time market updates...\n")

    start_idx = 50  # Ensure enough historical data for rolling indicators
    for t in range(start_idx, start_idx + num_steps):
        df_window = df_stream.iloc[t - 40 : t].copy()
        current_date = df_stream.iloc[t - 1]["Date"].strftime("%Y-%m-%d")
        current_vix = df_stream.iloc[t - 1]["VIX_Simulated"]

        res = engine.evaluate_live_step(df_window)

        color = ACTION_COLORS[res["action"]]
        action_str = f"{color}{res['action_name']}{RESET_COLOR}"

        probs_str = " | ".join([f"P(Act {i}): {p:.1%}" for i, p in enumerate(res["probabilities"])])

        print(f"[{current_date}] VIX: {current_vix:5.1f} | Decision: {action_str}")
        print(f"             Calibrated Probs: [{probs_str}]")
        print(f"             Calibration Temp: {res['temperature']:.2f} | Model Conf: {res['confidence']:.1%}\n")

        time.sleep(delay)

    print("Live JEV evaluation completed successfully!")


if __name__ == "__main__":
    run_live_simulation()
