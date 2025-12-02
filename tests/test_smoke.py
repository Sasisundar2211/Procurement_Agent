"""
Smoke tests for training and inference entry points.

These tests verify that the entry points can be imported and run in dry-run mode
without performing actual training. They are designed to run quickly as part of CI/CD.
"""

import os
import sys
import pytest
import tempfile
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestTrainImport:
    """Test that train.py can be imported and basic functions work."""

    def test_import_train_module(self):
        """Verify train.py can be imported without errors."""
        import train
        assert hasattr(train, 'main')
        assert hasattr(train, 'train_model')
        assert hasattr(train, 'save_model_artifact')
        assert hasattr(train, 'setup_data')

    def test_get_git_commit_hash(self):
        """Verify git commit hash retrieval works."""
        import train
        commit_hash = train.get_git_commit_hash()
        # Should return a string (either a hash or 'unknown')
        assert isinstance(commit_hash, str)
        assert len(commit_hash) > 0

    def test_setup_data_dry_run(self):
        """Verify data setup works in dry-run mode."""
        import train
        result = train.setup_data("data/public", dry_run=True)
        assert result is True

    def test_train_model_dry_run(self):
        """Verify training works in dry-run mode."""
        import train
        metrics = train.train_model(
            data_path="data/public",
            output_dir="models",
            epochs=1,
            batch_size=32,
            learning_rate=0.001,
            seed=42,
            dry_run=True
        )
        assert metrics is not None
        assert metrics.get("status") == "dry_run"

    def test_save_model_artifact_dry_run(self):
        """Verify model saving works in dry-run mode."""
        import train
        hyperparams = {"epochs": 1, "batch_size": 32}
        metrics = {"status": "dry_run"}
        
        model_path = train.save_model_artifact(
            output_dir="models",
            hyperparams=hyperparams,
            metrics=metrics,
            dry_run=True
        )
        assert model_path is not None
        assert "procurement_model_" in model_path


class TestInferenceImport:
    """Test that inference.py can be imported and basic functions work."""

    def test_import_inference_module(self):
        """Verify inference.py can be imported without errors."""
        import inference
        assert hasattr(inference, 'main')
        assert hasattr(inference, 'load_model')
        assert hasattr(inference, 'load_data')
        assert hasattr(inference, 'detect_price_drifts')

    def test_load_model_missing_path(self):
        """Verify load_model handles missing path gracefully."""
        import inference
        with pytest.raises(FileNotFoundError):
            inference.load_model("/nonexistent/path")

    def test_load_model_default_config(self):
        """Verify load_model returns defaults when config missing."""
        import inference
        with tempfile.TemporaryDirectory() as tmpdir:
            config = inference.load_model(tmpdir)
            assert config is not None
            assert "drift_threshold" in config
            assert config["drift_threshold"] == 1.05

    def test_detect_price_drifts_empty_contracts(self):
        """Verify drift detection handles empty contracts gracefully."""
        import inference
        import pandas as pd
        
        pos_df = pd.DataFrame({
            'po_id': [1, 2],
            'unit_price': [100, 200],
            'contract_id': ['C1', 'C2']
        })
        contracts_df = pd.DataFrame()
        
        result = inference.detect_price_drifts(pos_df, contracts_df)
        assert result.empty

    def test_detect_price_drifts_basic(self):
        """Verify drift detection identifies drifts correctly."""
        import inference
        import pandas as pd
        
        pos_df = pd.DataFrame({
            'po_id': ['PO1', 'PO2', 'PO3'],
            'unit_price': [110, 100, 150],
            'contract_id': ['C1', 'C1', 'C2']
        })
        contracts_df = pd.DataFrame({
            'contract_id': ['C1', 'C2'],
            'contract_unit_price': [100, 100]
        })
        
        # Threshold 1.05 = 5% above contract price
        result = inference.detect_price_drifts(pos_df, contracts_df, drift_threshold=1.05)
        
        assert len(result) == 2  # PO1 (10% over) and PO3 (50% over)
        assert 'PO1' in result['po_id'].values
        assert 'PO3' in result['po_id'].values
        assert 'PO2' not in result['po_id'].values


class TestCLIDryRun:
    """Test CLI entry points in dry-run mode."""

    def test_train_cli_dry_run(self):
        """Verify train.py CLI works in dry-run mode."""
        import subprocess
        result = subprocess.run(
            [sys.executable, 'train.py', '--dry-run'],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        )
        assert result.returncode == 0
        assert "DRY RUN" in result.stdout

    def test_train_cli_help(self):
        """Verify train.py help works."""
        import subprocess
        result = subprocess.run(
            [sys.executable, 'train.py', '--help'],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        )
        assert result.returncode == 0
        assert "--data-path" in result.stdout
        assert "--output-dir" in result.stdout
        assert "--dry-run" in result.stdout

    def test_inference_cli_help(self):
        """Verify inference.py help works."""
        import subprocess
        result = subprocess.run(
            [sys.executable, 'inference.py', '--help'],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        )
        assert result.returncode == 0
        assert "--model-path" in result.stdout
        assert "--data-path" in result.stdout
        assert "--print-samples" in result.stdout


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
