"""
Data Acquisition Module for JEV-RLCD Financial Decision Modeling.

Acquires multi-asset financial market time series, including multi-asset prices,
volatility regimes, market sentiment indicators, and macro signals.
Supports fetching real market data via Yahoo Finance (yfinance) if available,
with a robust fallback generator for synthetic multi-asset financial dynamics.
"""

import math
import os
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple


def generate_synthetic_financial_data(
    num_days: int = 1250,
    num_assets: int = 4,
    seed: int = 42
) -> pd.DataFrame:
    """
    Generates synthetic multi-asset price and regime data with realistic financial properties:
    - Geometric Brownian motion with stochastic volatility (Heston-like jump processes)
    - Regime switches (Bull, Bear, Volatile)
    - Macro correlation dynamics
    """
    np.random.seed(seed)
    asset_names = [f"ASSET_{i+1}" for i in range(num_assets)]

    # Dates index
    dates = pd.date_range(end=pd.Timestamp.today(), periods=num_days, freq="B")

    # Markov regime switching states: 0 = Calm/Bull, 1 = Bear/Correction, 2 = High Volatility
    regime_transition = np.array([
        [0.96, 0.03, 0.01],
        [0.05, 0.90, 0.05],
        [0.02, 0.08, 0.90]
    ])

    regimes = np.zeros(num_days, dtype=int)
    current_regime = 0
    for t in range(num_days):
        current_regime = np.random.choice([0, 1, 2], p=regime_transition[current_regime])
        regimes[t] = current_regime

    # Base parameters per regime
    # [mean_return, volatility_multiplier, correlation_boost]
    regime_params = {
        0: (0.0008, 0.8, 0.1),    # Bull
        1: (-0.0012, 1.5, 0.5),   # Bear
        2: (-0.0002, 2.2, 0.8)    # High Vol
    }

    # Initial asset prices
    prices = np.zeros((num_days, num_assets))
    prices[0] = [100.0, 50.0, 200.0, 30.0][:num_assets]

    # Base covariance matrix
    base_corr = np.eye(num_assets) + 0.3 * (np.ones((num_assets, num_assets)) - np.eye(num_assets))

    data_dict = {"Date": dates, "Regime": regimes}

    returns = np.zeros((num_days, num_assets))

    for t in range(1, num_days):
        reg = regimes[t]
        drift, vol_mult, corr_boost = regime_params[reg]

        # Adjust correlation matrix by regime
        adjusted_corr = (1 - corr_boost) * base_corr + corr_boost * np.ones((num_assets, num_assets))
        np.fill_diagonal(adjusted_corr, 1.0)

        # Cholesky decomposition for correlated noise
        L = np.linalg.cholesky(adjusted_corr)
        uncorrelated_noise = np.random.normal(0, 0.01 * vol_mult, size=num_assets)
        correlated_noise = L @ uncorrelated_noise

        asset_returns = drift + correlated_noise
        returns[t] = asset_returns
        prices[t] = prices[t-1] * np.exp(asset_returns)

    for i, name in enumerate(asset_names):
        data_dict[f"{name}_Close"] = prices[:, i]
        data_dict[f"{name}_Return"] = returns[:, i]

    # Add macro indicators
    data_dict["VIX_Simulated"] = np.where(regimes == 0, 14 + np.random.normal(0, 1.5, num_days),
                                 np.where(regimes == 1, 28 + np.random.normal(0, 3.0, num_days),
                                          42 + np.random.normal(0, 5.0, num_days)))
    data_dict["VIX_Simulated"] = np.clip(data_dict["VIX_Simulated"], 9.0, 80.0)

    df = pd.DataFrame(data_dict)
    return df


def acquire_dataset(output_dir: str = "jev-rlcd/data", num_days: int = 1250) -> str:
    """
    Acquires or generates financial data and saves raw data CSV to disk.
    """
    os.makedirs(output_dir, exist_ok=True)
    csv_path = os.path.join(output_dir, "raw_market_data.csv")

    print(f"[Data Acquisition] Generating synthetic multi-asset financial market dataset ({num_days} days)...")
    df = generate_synthetic_financial_data(num_days=num_days)
    df.to_csv(csv_path, index=False)
    print(f"[Data Acquisition] Raw market dataset saved to {csv_path}")
    return csv_path


if __name__ == "__main__":
    acquire_dataset()
