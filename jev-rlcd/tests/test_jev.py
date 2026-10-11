"""
Unit and Integration Tests for JEV-RLCD Module.
"""

import sys
import os
import unittest
import torch
import pandas as pd
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from acquire_data import generate_synthetic_financial_data
from transform import transform_data, compute_rsi, compute_macd
from model import JEVModel
from train_supervised import compute_brier_score, compute_expected_calibration_error
from live_jev import LiveJEVEngine


class TestJEVRLCD(unittest.TestCase):

    def test_synthetic_data_generation(self):
        df = generate_synthetic_financial_data(num_days=100, num_assets=4)
        self.assertEqual(len(df), 100)
        self.assertIn("ASSET_1_Close", df.columns)
        self.assertIn("VIX_Simulated", df.columns)
        self.assertIn("Regime", df.columns)

    def test_indicators(self):
        prices = pd.Series([10.0, 11.0, 12.0, 11.5, 13.0, 12.5, 14.0, 15.0, 14.5, 16.0, 17.0, 16.5, 18.0, 19.0, 18.5, 20.0])
        rsi = compute_rsi(prices, period=5)
        macd = compute_macd(prices)
        self.assertEqual(len(rsi), len(prices))
        self.assertEqual(len(macd), len(prices))

    def test_jev_model_forward(self):
        batch_size = 8
        seq_len = 20
        feature_dim = 17
        model = JEVModel(feature_dim=feature_dim)
        x = torch.randn(batch_size, seq_len, feature_dim)
        out = model(x)

        self.assertEqual(out["logits"].shape, (batch_size, 3))
        self.assertEqual(out["calibrated_probs"].shape, (batch_size, 3))
        self.assertEqual(out["jev"].shape, (batch_size, 64))
        self.assertTrue(torch.all(out["temperature"] > 0))
        self.assertTrue(torch.all(out["confidence"] >= 0) and torch.all(out["confidence"] <= 1.0))

    def test_calibration_metrics(self):
        probs = torch.tensor([[0.8, 0.1, 0.1], [0.2, 0.7, 0.1]])
        targets = torch.tensor([0, 1])
        brier = compute_brier_score(probs, targets)
        ece = compute_expected_calibration_error(probs, targets)
        self.assertGreaterEqual(brier.item(), 0.0)
        self.assertGreaterEqual(ece, 0.0)

    def test_live_engine_integration(self):
        if not os.path.exists("jev-rlcd/checkpoints/jev_rlcd.pt") and not os.path.exists("jev-rlcd/checkpoints/jev_pretrained.pt"):
            from train_supervised import train_supervised
            train_supervised(epochs=2)

        engine = LiveJEVEngine()
        df_stream = generate_synthetic_financial_data(num_days=100)
        df_window = df_stream.iloc[:50]
        res = engine.evaluate_live_step(df_window)

        self.assertIn(res["action"], [0, 1, 2])
        self.assertEqual(len(res["probabilities"]), 3)
        self.assertGreater(res["temperature"], 0.0)


if __name__ == "__main__":
    unittest.main()
