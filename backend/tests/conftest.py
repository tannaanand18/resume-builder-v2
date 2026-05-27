import pytest
from app import create_app
from app.extensions import db

@pytest.fixture
def client():
    # 1. Pass the Sandbox config directly INSIDE create_app!
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",  
        "JWT_SECRET_KEY": "this-is-a-super-long-fake-secret-key-just-for-testing-purposes-12345" 
    })

    # 2. Build the Sandbox
    with app.app_context():
        db.create_all() 
        
        # Hand the Crash Test Dummy to the test
        yield app.test_client() 
        
        # 3. Destroy the Sandbox
        db.session.remove()
        db.drop_all()