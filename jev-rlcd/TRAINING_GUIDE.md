# JEV-RLCD: Comprehensive Pipeline Guide & Training Documentation

This document serves as the complete operational guide for acquiring data, transforming time-series features, pre-training, fine-tuning, and evaluating the **Joint Evaluation Vector (JEV)** model using **Reinforcement Learning for Calibrated Decisions (RLCD)**.

---

## 1. Pipeline Overview & Architecture Flow

The pipeline executes sequentially in three distinct training phases:

```
[ 1. Acquire & Transform ] ---> [ 2. Base Pre-Training ] ---> [ 3. Supervised Fine-Tuning (SFT) ] ---> [ 4. RLCD Reinforcement Learning ] ---> [ 5. Live Inference & Eval ]
  (acquire_data.py & transform.py)  (train_supervised.py)           (train_finetune.py)                   (train_rlcd.py)                       (live_jev.py)
```

---

## 2. Step-by-Step Training Execution Guide

### Step 1: Data Acquisition (`acquire_data.py`)
Downloads 5 years of historical financial market history via Yahoo Finance (`^GSPC` S&P 500, `^NDX` Nasdaq 100, `GLD` Gold, `TLT` Treasuries, and `^VIX` Volatility index). Falls back to Markov-switching Geometric Brownian Motion if offline.

```bash
python3 jev-rlcd/acquire_data.py
# Output: jev-rlcd/data/raw_market_data.csv
```

### Step 2: Sequence Feature Transformation (`transform.py`)
Extracts Technical Momentum indicators (RSI, MACD), rolling volatility windows, normalizes time-series tensors, and labels forward horizon market regime targets.

```bash
python3 jev-rlcd/transform.py
# Output: jev-rlcd/data/transformed_dataset.pt
```

### Step 3: Base Supervised Pre-Training (`train_supervised.py`)
Trains the initial Transformer JEV representation backbone with Cross-Entropy and Brier Score loss.

```bash
python3 jev-rlcd/train_supervised.py
# Output Checkpoint: jev-rlcd/checkpoints/jev_pretrained.pt
```

### Step 4: Supervised Fine-Tuning (SFT) Stage (`train_finetune.py`)
Fine-tunes the JEV model to align probability calibration and temperature scaling parameters specifically for decision targets.

```bash
python3 jev-rlcd/train_finetune.py
# Output Checkpoint: jev-rlcd/checkpoints/jev_finetuned.pt
```

### Step 5: Reinforcement Learning for Calibrated Decisions (`train_rlcd.py`)
Fine-tunes the policy with REINFORCE policy gradient using financial payoff returns minus Brier Score miscalibration penalties.

```bash
python3 jev-rlcd/train_rlcd.py
# Output Checkpoint: jev-rlcd/checkpoints/jev_rlcd.pt
```

---

## 3. Live Evaluation & Testing

### Live Real-Time Market Simulation (`live_jev.py`)
Runs live streaming market tick simulation against the final trained RLCD checkpoint, printing decision actions, calibrated probabilities, and confidence bounds.

```bash
python3 jev-rlcd/live_jev.py
```

### Automated Unit Test Suite (`tests/test_jev.py`)
Runs automated assertions covering data generation, indicator math, Transformer forward pass, calibration metrics (ECE & Brier Score), and live engine execution.

```bash
python3 -m unittest jev-rlcd/tests/test_jev.py
```
