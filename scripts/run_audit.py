"""Run the 5-dimension data quality audit."""

import sys  # noqa: E402
from pathlib import Path  # noqa: E402
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))  # noqa: E402

from src.data import load_raw_data, parse_vector_columns  # noqa: E402
from src.data.quality_audit import run_full_audit  # noqa: E402


def main():
    """Load data, run audit, print results."""
    print("Loading raw data...")
    df = load_raw_data()
    print(f"Loaded {len(df)} rows, {len(df.columns)} columns")

    print("Parsing vector columns...")
    df = parse_vector_columns(df)
    print(f"Expanded to {len(df.columns)} columns")

    print("\nRunning 5-dimension quality audit...")
    results = run_full_audit(df, save_card=True)

    print(f"\n{'='*50}")
    print(f"  Q_total = {results['Q_total']:.4f}")
    print(f"{'='*50}")
    for dim in ["completeness", "consistency", "accuracy", "timeliness", "relevance"]:
        print(f"  {dim.title():15s} → {results[dim]['score']:.4f}")

    if "top_5" in results["relevance"]:
        print(f"\n  Top-5 features by MI: {results['relevance']['top_5']}")

    print(f"\nData card saved to data/processed/data_card.md")


if __name__ == "__main__":
    main()
