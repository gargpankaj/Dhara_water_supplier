from app.main import app


def test_app_boots():
    assert app.title == "Water Supplier Management API"
