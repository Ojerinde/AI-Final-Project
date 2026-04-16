"""Data loader for cislunar trajectory dataset."""

from __future__ import annotations

import ast
import re

import numpy as np
import pandas as pd
from numpy.typing import NDArray

from src.config import PATHS, COLUMN_NAMES, VECTOR_COLUMNS


def _parse_numpy_vector(s: str) -> NDArray | None:
    """Parse a string like '[-4.79e+08  3.82e+08 -2.11e+08]' into a numpy array.

    Args:
        s: String representation of a numpy array.

    Returns:
        1-D numpy array or None if parsing fails.
    """
    if pd.isna(s):
        return None
    try:
        cleaned = re.sub(r"\s+", ", ", s.strip().strip("[]"))
        return np.array(ast.literal_eval(f"[{cleaned}]"))
    except (ValueError, SyntaxError):
        return None


def load_raw_data(filename: str = "descriptive_data.csv") -> pd.DataFrame:
    """Load the raw CSV trajectory data.

    Args:
        filename: Name of the CSV file inside data/raw/.

    Returns:
        DataFrame with original string columns intact.
    """
    path = PATHS["data_raw"] / filename
    df = pd.read_csv(path)
    return df


def parse_vector_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Expand vector-string columns (r0, v0, r_vmin, r_vmax) into x/y/z scalars.

    Adds columns like r0_x, r0_y, r0_z and drops the original string column.

    Args:
        df: DataFrame from load_raw_data.

    Returns:
        DataFrame with expanded scalar columns.
    """
    df = df.copy()
    for col in VECTOR_COLUMNS:
        if col not in df.columns:
            continue
        parsed = df[col].apply(_parse_numpy_vector)
        df[f"{col}_x"] = parsed.apply(
            lambda v: v[0] if v is not None else np.nan)
        df[f"{col}_y"] = parsed.apply(
            lambda v: v[1] if v is not None else np.nan)
        df[f"{col}_z"] = parsed.apply(
            lambda v: v[2] if v is not None else np.nan)
        df.drop(columns=[col], inplace=True)
    return df


def get_feature_matrix(df: pd.DataFrame, exclude: list[str] | None = None) -> tuple[NDArray, NDArray]:
    """Extract feature matrix X and target vector y.

    Args:
        df: Preprocessed DataFrame (after parse_vector_columns).
        exclude: Column names to exclude from features.

    Returns:
        (X, y) where X is (n_samples, n_features) and y is (n_samples,).
    """
    from src.config import TARGET_COLUMN

    exclude = exclude or ["orb_id", TARGET_COLUMN]
    feature_cols = [c for c in df.columns if c not in exclude]
    X = df[feature_cols].values.astype(np.float64)
    y = df[TARGET_COLUMN].values.astype(np.int64)
    return X, y
