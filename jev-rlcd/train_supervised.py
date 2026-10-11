"""
Pre-training Script for JEV Model.

Trains the JEV model on the market decision classification target using Cross-Entropy loss
and Brier score / ECE calibration loss. Saves checkpoint for RLCD reinforcement fine-tuning.
"""

import os
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import TensorDataset, DataLoader
from model import JEVModel


def compute_brier_score(probs: torch.Tensor, targets: torch.Tensor, num_classes: int = 3) -> torch.Tensor:
    one_hot = F.one_hot(targets, num_classes=num_classes).float()
    return torch.mean(torch.sum((probs - one_hot) ** 2, dim=-1))


def compute_expected_calibration_error(probs: torch.Tensor, targets: torch.Tensor, n_bins: int = 10) -> float:
    confidences, predictions = torch.max(probs, dim=1)
    accuracies = predictions.eq(targets)

    ece = 0.0
    bin_boundaries = torch.linspace(0, 1, n_bins + 1)

    for i in range(n_bins):
        bin_lower = bin_boundaries[i]
        bin_upper = bin_boundaries[i + 1]

        in_bin = confidences.gt(bin_lower.item()) * confidences.le(bin_upper.item())
        prop_in_bin = in_bin.float().mean().item()

        if prop_in_bin > 0:
            accuracy_in_bin = accuracies[in_bin].float().mean().item()
            avg_confidence_in_bin = confidences[in_bin].mean().item()
            ece += abs(accuracy_in_bin - avg_confidence_in_bin) * prop_in_bin

    return ece


def train_supervised(
    dataset_path: str = "jev-rlcd/data/transformed_dataset.pt",
    checkpoint_path: str = "jev-rlcd/checkpoints/jev_pretrained.pt",
    epochs: int = 30,
    batch_size: int = 32,
    lr: float = 1e-3
):
    os.makedirs(os.path.dirname(checkpoint_path), exist_ok=True)

    if not os.path.exists(dataset_path):
        from transform import transform_data
        dataset = transform_data()
    else:
        dataset = torch.load(dataset_path)

    X_train, Y_train = dataset["X_train"], dataset["Y_train"]
    X_test, Y_test = dataset["X_test"], dataset["Y_test"]

    train_loader = DataLoader(TensorDataset(X_train, Y_train), batch_size=batch_size, shuffle=True)
    test_loader = DataLoader(TensorDataset(X_test, Y_test), batch_size=batch_size, shuffle=False)

    model = JEVModel(feature_dim=dataset["feature_dim"])
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)

    ce_loss_fn = nn.CrossEntropyLoss()

    print(f"=== Starting Supervised Pre-Training ({epochs} Epochs) ===")

    best_loss = float("inf")

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        correct = 0
        total = 0

        for batch_x, batch_y in train_loader:
            optimizer.zero_grad()
            out = model(batch_x)

            # Cross-entropy loss on logits
            ce_loss = ce_loss_fn(out["logits"], batch_y)
            # Brier Score penalty on calibrated probabilities
            brier_loss = compute_brier_score(out["calibrated_probs"], batch_y)

            loss = ce_loss + 0.5 * brier_loss
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * len(batch_y)
            preds = torch.argmax(out["calibrated_probs"], dim=1)
            correct += (preds == batch_y).sum().item()
            total += len(batch_y)

        train_acc = correct / total
        avg_train_loss = total_loss / total

        # Evaluation
        model.eval()
        test_loss = 0.0
        test_correct = 0
        test_total = 0
        all_probs = []
        all_targets = []

        with torch.no_grad():
            for batch_x, batch_y in test_loader:
                out = model(batch_x)
                ce_loss = ce_loss_fn(out["logits"], batch_y)
                brier_loss = compute_brier_score(out["calibrated_probs"], batch_y)
                loss = ce_loss + 0.5 * brier_loss

                test_loss += loss.item() * len(batch_y)
                preds = torch.argmax(out["calibrated_probs"], dim=1)
                test_correct += (preds == batch_y).sum().item()
                test_total += len(batch_y)

                all_probs.append(out["calibrated_probs"])
                all_targets.append(batch_y)

        test_acc = test_correct / test_total
        avg_test_loss = test_loss / test_total

        probs_cat = torch.cat(all_probs, dim=0)
        targets_cat = torch.cat(all_targets, dim=0)
        test_ece = compute_expected_calibration_error(probs_cat, targets_cat)

        if epoch % 5 == 0 or epoch == epochs:
            print(f"Epoch {epoch:02d}/{epochs:02d} | Train Loss: {avg_train_loss:.4f} Acc: {train_acc:.4f} | Test Loss: {avg_test_loss:.4f} Acc: {test_acc:.4f} ECE: {test_ece:.4f}")

        if avg_test_loss < best_loss:
            best_loss = avg_test_loss
            torch.save({
                "model_state": model.state_dict(),
                "feature_dim": dataset["feature_dim"],
                "scaler_mean": dataset["scaler_mean"],
                "scaler_std": dataset["scaler_std"],
                "test_acc": test_acc,
                "test_ece": test_ece
            }, checkpoint_path)

    print(f"Pre-training complete! Saved best model checkpoint to {checkpoint_path}")


if __name__ == "__main__":
    train_supervised()
