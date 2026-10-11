"""
Data Transformation Pipeline for JEV-RLCD.

Transforms raw multi-asset market data into standardized time-series sequence tensors,
calculates technical indicators (RSI, MACD, Bollinger Bands, Volatility ratios),
and generates optimal action/regime decision targets for calibrated training.
"""

import os
import numpy as np
import pandas as pd
import torch
from typing import Tuple, Dict, Any


def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / (loss + 1e-8)
    return 100 - (100 / (1 + rs))


def compute_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> pd.Series:
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    return macd_line - signal_line


def transform_data(
    raw_csv_path: str = "jev-rlcd/data/raw_market_data.csv",
    output_dir: str = "jev-rlcd/data",
    seq_length: int = 20,
    train_ratio: float = 0.8
) -> Dict[str, Any]:
    """
    Transforms raw CSV data into sequential state tensors (X) and future decision targets (Y).

    Decision Target Actions:
    0 = Risk-Off / Short (High Volatility / Bearish future return)
    1 = Neutral / Hold (Sideways / Normal volatility)
    2 = Risk-On / Long (Bullish future return with manageable volatility)
    """
    if not os.path.exists(raw_csv_path):
        from acquire_data import acquire_dataset
        raw_csv_path = acquire_dataset(output_dir=output_dir)

    df = pd.read_csv(raw_csv_path)

    # Feature engineering for each asset
    asset_cols = [c for c in df.columns if c.endswith("_Close")]
    num_assets = len(asset_cols)

    feature_dfs = []

    for c in asset_cols:
        asset_prefix = c.replace("_Close", "")
        close_series = df[c]
        ret_series = df[f"{asset_prefix}_Return"]

        # Technical indicators
        rsi = compute_rsi(close_series)
        macd = compute_macd(close_series)
        vol_20 = ret_series.rolling(20).std()

        asset_features = pd.DataFrame({
            f"{asset_prefix}_ret": ret_series,
            f"{asset_prefix}_rsi": rsi / 100.0,  # Normalized 0-1
            f"{asset_prefix}_macd": macd,
            f"{asset_prefix}_vol20": vol_20
        })
        feature_dfs.append(asset_features)

    # Macro & market features
    vix_normalized = df["VIX_Simulated"] / 100.0
    regime = df["Regime"]

    features_df = pd.concat(feature_dfs + [pd.DataFrame({"VIX": vix_normalized, "Regime": regime})], axis=1)

    # Drop initial NaN rows from rolling windows
    features_df = features_df.dropna().reset_index(drop=True)

    # Extract feature matrix (excluding regime for state X)
    state_cols = [c for c in features_df.columns if c != "Regime"]
    feature_matrix = features_df[state_cols].values

    # Normalize features across time
    mean = np.mean(feature_matrix, axis=0, keepdims=True)
    std = np.std(feature_matrix, axis=0, keepdims=True) + 1e-8
    normalized_features = (feature_matrix - mean) / std

    # Compute future multi-asset average return over forward horizon (e.g., 5 days)
    horizon = 5
    asset_returns = [features_df[f"ASSET_{i+1}_ret"].values for i in range(num_assets)]
    avg_portfolio_return = np.mean(asset_returns, axis=0)

    # Forward cumulative return over horizon
    forward_returns = np.zeros(len(normalized_features))
    for t in range(len(normalized_features) - horizon):
        forward_returns[t] = np.sum(avg_portfolio_return[t+1 : t+1+horizon])

    # Construct Decision Targets
    # Action 0 (Risk-Off) if forward return < -0.015 or VIX > 0.30
    # Action 2 (Risk-On) if forward return > +0.015 and VIX < 0.25
    # Action 1 (Neutral) otherwise
    vix_vals = features_df["VIX"].values
    actions = np.ones(len(normalized_features), dtype=int)
    actions[(forward_returns < -0.01) | (vix_vals > 0.35)] = 0
    actions[(forward_returns > 0.01) & (vix_vals <= 0.35)] = 2

    # Create Sequences (Sequence Length = seq_length)
    X_seqs = []
    Y_actions = []
    Y_returns = []

    for t in range(seq_length, len(normalized_features) - horizon):
        seq = normalized_features[t - seq_length : t]
        X_seqs.append(seq)
        Y_actions.append(actions[t])
        Y_returns.append(forward_returns[t])

    X_tensor = torch.tensor(np.array(X_seqs), dtype=torch.float32)
    Y_action_tensor = torch.tensor(np.array(Y_actions), dtype=torch.long)
    Y_return_tensor = torch.tensor(np.array(Y_returns), dtype=torch.float32)

    # Train / Test split
    split_idx = int(len(X_tensor) * train_ratio)

    processed_data = {
        "X_train": X_tensor[:split_idx],
        "Y_train": Y_action_tensor[:split_idx],
        "R_train": Y_return_tensor[:split_idx],
        "X_test": X_tensor[split_idx:],
        "Y_test": Y_action_tensor[split_idx:],
        "R_test": Y_return_tensor[split_idx:],
        "feature_dim": X_tensor.shape[2],
        "seq_length": seq_length,
        "num_classes": 3,
        "feature_cols": state_cols,
        "scaler_mean": mean.tolist(),
        "scaler_std": std.tolist()
    }

    pt_file = os.path.join(output_dir, "transformed_dataset.pt")
    torch.save(processed_data, pt_file)
    print(f"[Data Transform] Dataset successfully transformed & saved to {pt_file}")
    print(f"               Train samples: {len(processed_data['X_train'])}, Test samples: {len(processed_data['X_test'])}, Feature Dim: {processed_data['feature_dim']}")

    return processed_data


if __name__ == "__main__":
    transform_data()
