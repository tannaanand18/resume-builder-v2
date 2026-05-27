from app import create_app
from flask import jsonify
from app.extensions import db
from sqlalchemy import text
import os


app = create_app()   # FIRST create app

@app.route("/")
def home():
    return jsonify({"message": "Backend is working"})

@app.route("/test-db")
def test_db():
    try:
        db.session.execute(text("SELECT 1"))
        return {"message": "Database connected successfully"}
    except Exception as e:
        return {"error": str(e)}

print(app.url_map)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
