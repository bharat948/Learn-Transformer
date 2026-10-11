# JEV-RLCD: Joint Evaluation Vector with Reinforcement Learning for Calibrated Decisions

A standalone PyTorch framework implementing the **Joint Evaluation Vector (JEV)** architecture trained via **Reinforcement Learning for Calibrated Decisions (RLCD)** for complex financial portfolio risk and market regime decisions.

---

## Key Components

1. **Data Acquisition (`acquire_data.py`)**:
   - Generates/acquires multi-asset market dynamics, regime shifts (Bull, Bear, Volatile), and macro volatility indicators (VIX).

2. **Transformation (`transform.py`)**:
   - Extracts technical indicators (RSI, MACD, Volatility ratios) and converts raw time series into normalized sequence tensors.

3. **JEV Model Architecture (`model.py`)**:
   - Multi-head Transformer Encoder with a Joint Evaluation Vector (JEV) pooling layer and dual output heads:
     - **Decision Head**: Action logits over market regimes (`Risk-Off`, `Neutral`, `Risk-On`).
     - **Calibration Head**: Temperature-scaled probability bounds and confidence estimates.

4. **Supervised Pre-Training (`train_supervised.py`)**:
   - Pre-trains JEV on market decision targets using Cross-Entropy and Brier Score penalty.

5. **RLCD Fine-Tuning (`train_rlcd.py`)**:
   - Fine-tunes policy using REINFORCE / Policy Gradient with financial payoff rewards minus ECE / Brier miscalibration penalties.

6. **Live Inference Engine (`live_jev.py`)**:
   - Real-time decision interface streaming live market ticks, running JEV inference, and displaying calibrated decision confidence.

---

## Quickstart

```bash
# 1. Acquire Data & Transform
python3 jev-rlcd/acquire_data.py
python3 jev-rlcd/transform.py

# 2. Pre-Train Model
python3 jev-rlcd/train_supervised.py

# 3. RLCD Reinforcement Fine-Tuning
python3 jev-rlcd/train_rlcd.py

# 4. Live JEV Inference Simulation
python3 jev-rlcd/live_jev.py

# 5. Run Unit & Integration Tests
python3 -m unittest jev-rlcd/tests/test_jev.py
```
