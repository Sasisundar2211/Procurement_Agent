from pathlib import Path
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

STATIC_DIR = Path(__file__).parent.parent / "src" / "api" / "static"


def test_app_js_does_not_use_inner_html():
    app_js_path = STATIC_DIR / "app.js"
    assert app_js_path.exists(), "app.js must exist"
    content = app_js_path.read_text(encoding="utf-8")

    assert "innerHTML" not in content, "app.js should not use innerHTML due to XSS risks"
    assert "textContent" in content, "app.js should use textContent for safe DOM rendering"


def test_leaks_js_does_not_use_inner_html():
    leaks_js_path = STATIC_DIR / "leaks.js"
    assert leaks_js_path.exists(), "leaks.js must exist"
    content = leaks_js_path.read_text(encoding="utf-8")

    assert "innerHTML" not in content, "leaks.js should not use innerHTML due to XSS risks"
    assert "textContent" in content, "leaks.js should use textContent for safe DOM rendering"


def test_static_files_served_successfully():
    app_resp = client.get("/static/app.js")
    assert app_resp.status_code == 200
    assert "textContent" in app_resp.text
    assert "innerHTML" not in app_resp.text

    leaks_resp = client.get("/static/leaks.js")
    assert leaks_resp.status_code == 200
    assert "textContent" in leaks_resp.text
    assert "innerHTML" not in leaks_resp.text
