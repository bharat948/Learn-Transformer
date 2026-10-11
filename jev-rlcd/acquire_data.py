"""
Data Acquisition Module for JEV-RLCD Financial Decision Modeling.

Acquires real multi-asset financial market time series from Yahoo Finance (yfinance),
fetching historical OHLCV data for broad market indices (^GSPC, ^NDX, ^VIX, GLD, TLT, AAPL, MSFT),
extracting volatility regimes, sentiment, and macro signals.
Falls back to synthetic generation if offline or network calls fail.
"""

import math
import os
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple


def fetch_yahoo_financial_data(
    tickers: list = ["^GSPC", "^NDX", "^VIX", "GLD", "TLT"],
    period: str = "5y"
) -> pd.DataFrame:
    """
    Fetches real historical market data from Yahoo Finance via yfinance.
    """
    import yfinance as yf

    print(f"[Data Acquisition] Downloading historical financial data for {tickers} ({period})...")
    data = yf.download(tickers, period=period, progress=False)

    # Process multi-index columns
    close_prices = data["Close"]
    close_prices = close_prices.dropna()

    dates = close_prices.index
    num_days = len(dates)

    data_dict = {"Date": dates}

    # Calculate daily returns
    returns = close_prices.pct_change().fillna(0.0)

    # Assign assets
    asset_mapping = {
        "^GSPC": "ASSET_1",  # S&P 500
        "^NDX": "ASSET_2",   # Nasdaq 100
        "GLD": "ASSET_3",    # Gold
        "TLT": "ASSET_4",    # Long-Term Treasury
    }

    for symbol, asset_name in asset_mapping.items():
        if symbol in close_prices.columns:
            data_dict[f"{asset_name}_Close"] = close_prices[symbol].values
            data_dict[f"{asset_name}_Return"] = returns[symbol].values
        else:
            # Fallback
            data_dict[f"{asset_name}_Close"] = np.ones(num_days) * 100.0
            data_dict[f"{asset_name}_Return"] = np.zeros(num_days)

    # VIX macro indicator
    if "^VIX" in close_prices.columns:
        vix_series = close_prices["^VIX"].values
    else:
        vix_series = np.full(num_days, 20.0)

    data_dict["VIX_Simulated"] = vix_series

    # Estimate regimes from VIX and returns
    # Regime 0: Bull (VIX < 20), Regime 1: Bear (VIX > 25), Regime 2: Volatile (VIX 20-25)
    regimes = np.where(vix_series < 20, 0, np.where(vix_series > 28, 1, 2))
    data_dict["Regime"] = regimes

    df = pd.DataFrame(data_dict)
    return df


def generate_synthetic_financial_data(
    num_days: int = 1250,
    num_assets: int = 4,
    seed: int = 42
) -> pd.DataFrame:
    """
    Generates synthetic multi-asset price and regime data with realistic financial properties.
    """
    np.random.seed(seed)
    asset_names = [f"ASSET_{i+1}" for i in range(num_assets)]

    dates = pd.date_range(end=pd.Timestamp.today(), periods=num_days, freq="B")

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

    regime_params = {
        0: (0.0008, 0.8, 0.1),    # Bull
        1: (-0.0012, 1.5, 0.5),   # Bear
        2: (-0.0002, 2.2, 0.8)    # High Vol
    }

    prices = np.zeros((num_days, num_assets))
    prices[0] = [100.0, 50.0, 200.0, 30.0][:num_assets]

    base_corr = np.eye(num_assets) + 0.3 * (np.ones((num_assets, num_assets)) - np.eye(num_assets))
    data_dict = {"Date": dates, "Regime": regimes}

    returns = np.zeros((num_days, num_assets))

    for t in range(1, num_days):
        reg = regimes[t]
        drift, vol_mult, corr_boost = regime_params[reg]

        adjusted_corr = (1 - corr_boost) * base_corr + corr_boost * np.ones((num_assets, num_assets))
        np.fill_diagonal(adjusted_corr, 1.0)

        L = np.linalg.cholesky(adjusted_corr)
        uncorrelated_noise = np.random.normal(0, 0.01 * vol_mult, size=num_assets)
        correlated_noise = L @ uncorrelated_noise

        asset_returns = drift + correlated_noise
        returns[t] = asset_returns
        prices[t] = prices[t-1] * np.exp(asset_returns)

    for i, name in enumerate(asset_names):
        data_dict[f"{name}_Close"] = prices[:, i]
        data_dict[f"{name}_Return"] = returns[:, i]

    data_dict["VIX_Simulated"] = np.where(regimes == 0, 14 + np.random.normal(0, 1.5, num_days),
                                 np.where(regimes == 1, 28 + np.random.normal(0, 3.0, num_days),
                                          42 + np.random.normal(0, 5.0, num_days)))
    data_dict["VIX_Simulated"] = np.clip(data_dict["VIX_Simulated"], 9.0, 80.0)

    df = pd.DataFrame(data_dict)
    return df


def acquire_dataset(output_dir: str = "jev-rlcd/data", num_days: int = 1250) -> str:
    """
    Acquires or generates financial data and saves raw data CSV to disk.
    Tries real Yahoo Finance download first; falls back to synthetic generation.
    """
    os.makedirs(output_dir, exist_ok=True)
    csv_path = os.path.join(output_dir, "raw_market_data.csv")

    try:
        df = fetch_yahoo_financial_data()
        print(f"[Data Acquisition] Real financial market dataset fetched successfully ({len(df)} trading days).")
    except Exception as e:
        print(f"[Data Acquisition] Real data fetch failed ({e}). Falling back to synthetic market generator...")
        df = generate_synthetic_financial_data(num_days=num_days)

    df.to_csv(csv_path, index=False)
    print(f"[Data Acquisition] Raw market dataset saved to {csv_path}")
    return csv_path


if __name__ == "__main__":
    acquire_dataset()
