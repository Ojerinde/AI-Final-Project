"""Tests for the data loader and quality audit."""

import pytest
import numpy as np
import pandas as pd

from src.data.loader import _parse_numpy_vector, load_raw_data, parse_vector_columns
from src.data.quality_audit import (
    audit_completeness, audit_consistency, audit_accuracy,
    audit_timeliness, audit_relevance, run_full_audit,
)


class TestVectorParsing:
    """Tests for numpy vector string parsing."""

    def test_parse_valid_vector(self):
        """Should parse a numpy-style vector string."""
        result = _parse_numpy_vector("[-4.79e+08  3.82e+08 -2.11e+08]")
        assert result is not None
        assert len(result) == 3
        np.testing.assert_allclose(result[0], -4.79e8, rtol=1e-2)

    def test_parse_nan(self):
        """Should return None for NaN."""
        assert _parse_numpy_vector(float("nan")) is None

    def test_parse_invalid(self):
        """Should return None for unparseable strings."""
        assert _parse_numpy_vector("not a vector") is None


class TestDataLoader:
    """Tests for the CSV data loader."""

    def test_load_raw_data(self):
        """Should load the CSV without errors."""
        df = load_raw_data()
        assert len(df) > 0
        assert "orb_id" in df.columns

    def test_parse_vector_columns_expands(self):
        """Should expand r0, v0 etc. into x/y/z scalars."""
        df = load_raw_data()
        expanded = parse_vector_columns(df)
        assert "r0_x" in expanded.columns
        assert "r0" not in expanded.columns


class TestQualityAudit:
    """Tests for the 5-dimension quality audit."""

    @pytest.fixture
    def sample_df(self):
        """Create a small sample DataFrame for testing."""
        df = load_raw_data()
        return parse_vector_columns(df.head(100))

    def test_completeness(self, sample_df):
        """Completeness score should be between 0 and 1."""
        result = audit_completeness(sample_df)
        assert 0 <= result["score"] <= 1

    def test_consistency(self, sample_df):
        """Consistency score should be between 0 and 1."""
        result = audit_consistency(sample_df)
        assert 0 <= result["score"] <= 1

    def test_accuracy(self, sample_df):
        """Accuracy kappa should be computable."""
        result = audit_accuracy(sample_df)
        assert "fleiss_kappa" in result

    def test_relevance(self, sample_df):
        """Relevance should produce MI rankings."""
        result = audit_relevance(sample_df)
        assert "rankings" in result

    def test_full_audit_q_total(self, sample_df):
        """Q_total should be a valid score."""
        result = run_full_audit(sample_df, save_card=False)
        assert 0 <= result["Q_total"] <= 1
