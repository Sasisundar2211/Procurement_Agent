from unittest.mock import patch, MagicMock
import run_all
import submission.run_all


@patch("subprocess.Popen")
@patch("psutil.process_iter", return_value=[])
@patch("time.sleep", side_effect=KeyboardInterrupt)
def test_run_all_shell_false(mock_sleep, mock_process_iter, mock_popen):
    mock_proc = MagicMock()
    mock_proc.poll.return_value = None
    mock_popen.return_value = mock_proc

    run_all.run_all()

    assert mock_popen.call_count == 2
    for call in mock_popen.call_args_list:
        _, kwargs = call
        assert kwargs.get("shell") is False


@patch("subprocess.Popen")
@patch("psutil.process_iter", return_value=[])
@patch("time.sleep", side_effect=KeyboardInterrupt)
def test_submission_run_all_shell_false(mock_sleep, mock_process_iter, mock_popen):
    mock_proc = MagicMock()
    mock_proc.poll.return_value = None
    mock_popen.return_value = mock_proc

    submission.run_all.run_all()

    assert mock_popen.call_count == 2
    for call in mock_popen.call_args_list:
        _, kwargs = call
        assert kwargs.get("shell") is False
