"""
Supervised Fine-Tuning Module for JEV Model.

Provides supervised fine-tuning on domain-specific market decision targets (e.g. regime classification & calibrated probability fitting)
between initial base pre-training and final RLCD policy gradient reinforcement learning.
"""

import os
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
from model import JEVModel
from train_supervised import compute_brier_score, compute_expected_calibration_error


def supervised_fine_tune(
    dataset_path: str = "jev-rlcd/data/transformed_dataset.pt",
    pretrained_checkpoint: str = "jev-rlcd/checkpoints/jev_pretrained.pt",
    finetuned_checkpoint: str = "jev-rlcd/checkpoints/jev_finetuned.pt",
    epochs: int = 15,
    batch_size: int = 32,
    lr: float = 2e-4
):
    os.makedirs(os.path.dirname(finetuned_checkpoint), exist_ok=True)

    dataset = torch.load(dataset_path)
    X_train, Y_train = dataset["X_train"], dataset["Y_train"]
    X_test, Y_test = dataset["X_test"], dataset["Y_test"]

    train_loader = DataLoader(TensorDataset(X_train, Y_train), batch_size=batch_size, shuffle=True)
    test_loader = DataLoader(TensorDataset(X_test, Y_test), batch_size=batch_size, shuffle=False)

    model = JEVModel(feature_dim=dataset["feature_dim"])

    if os.path.exists(pretrained_checkpoint):
        ckpt = torch.load(pretrained_checkpoint)
        model.load_state_dict(ckpt["model_state"])
        print(f"[Supervised Fine-Tuning] Loaded pre-trained weights from {pretrained_checkpoint}")
    else:
        print("[Supervised Fine-Tuning] Pre-trained weights not found, starting from scratch.")

    # Lower learning rate for fine-tuning
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    ce_loss_fn = nn.CrossEntropyLoss()

    print(f"=== Starting Supervised Fine-Tuning Stage ({epochs} Epochs) ===")
    best_loss = float("inf")

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        correct = 0
        total = 0

        for batch_x, batch_y in train_loader:
            optimizer.zero_grad()
            out = model(batch_x)

            ce_loss = ce_loss_fn(out["logits"], batch_y)
            brier_loss = compute_brier_score(out["calibrated_probs"], batch_y)

            # Combined fine-tuning loss with emphasis on probability calibration
            loss = ce_loss + 1.0 * brier_loss
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * len(batch_y)
            preds = torch.argmax(out["calibrated_probs"], dim=1)
            correct += (preds == batch_y).sum().item()
            total += len(batch_y)

        train_acc = correct / total
        avg_train_loss = total_loss / total

        # Test evaluation
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
                loss = ce_loss + 1.0 * brier_loss

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
            }, finetuned_checkpoint)

    print(f"[Supervised Fine-Tuning] Completed successfully! Saved checkpoint to {finetuned_checkpoint}")


if __name__ == "__main__":
    supervised_fine_tune()
