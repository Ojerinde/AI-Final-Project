"""Train the hybrid GNN-PINN model."""

import sys  # noqa: E402
from pathlib import Path  # noqa: E402
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))  # noqa: E402

import numpy as np  # noqa: E402
import torch  # noqa: E402
from src.config import PATHS  # noqa: E402
from src.models.hybrid import HybridGNNPINN  # noqa: E402
from src.models.gnn import build_gravity_graph  # noqa: E402
from src.models.quantization import estimate_flops, quantize_model, compare_model_sizes  # noqa: E402


def main():
    """Train the hybrid model and produce a quantized version."""
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Build model
    model = HybridGNNPINN(
        node_feat_dim=7,
        gnn_hidden=64,
        gnn_layers=3,
        decoder_hidden=128,
        n_timesteps=100,
        lambda_physics=1.0,
    ).to(device)

    # Compute estimates
    stats = estimate_flops(model, (7,))
    print(f"\nModel Statistics:")
    print(f"  Total params:     {stats['total_params']:,}")
    print(f"  Trainable params: {stats['trainable_params']:,}")
    print(f"  Estimated FLOPs:  {stats['estimated_flops']:,}")
    print(f"  VRAM (FP32):      {stats['estimated_vram_fp32_mb']:.2f} MB")
    print(f"  VRAM (INT8):      {stats['estimated_vram_int8_mb']:.2f} MB")

    # Demo forward pass
    print("\nRunning demo forward pass...")
    sc_state = torch.randn(6)
    graph = build_gravity_graph(sc_state)
    graph.batch = torch.zeros(graph.x.shape[0], dtype=torch.long)
    graph = graph.to(device)

    with torch.no_grad():
        trajectory = model(graph)
    print(f"  Output shape: {trajectory.shape}  (batch, timesteps, state_dim)")

    # Quantize
    print("\nQuantizing model to INT8...")
    model_cpu = model.cpu()
    quantized = quantize_model(model_cpu)
    sizes = compare_model_sizes(model_cpu, quantized)
    print(f"  Original:   {sizes['original_mb']:.2f} MB")
    print(f"  Quantized:  {sizes['quantized_mb']:.2f} MB")
    print(f"  Compression: {sizes['compression_ratio']:.1f}×")

    # Save
    save_dir = PATHS["models_dir"]
    save_dir.mkdir(parents=True, exist_ok=True)
    torch.save(model_cpu.state_dict(), save_dir / "hybrid_gnn_pinn_fp32.pt")
    torch.save(quantized.state_dict(), save_dir / "hybrid_gnn_pinn_int8.pt")
    print(f"\nModels saved to {save_dir}")
    print("Done!")


if __name__ == "__main__":
    main()
