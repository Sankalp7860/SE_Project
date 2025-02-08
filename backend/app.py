from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
from dotenv import load_dotenv
from db import users_collection

load_dotenv()

app = Flask(__name__)

# ✅ Allow CORS globally for all routes and methods
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")

    if users_collection.find_one({"email": email}):
        return jsonify({"success": False, "message": "Email already registered"}), 400

    hashed_password = generate_password_hash(data.get("password"))
    user_data = {
        "name": data.get("name"),
        "email": email,
        "password": hashed_password
    }
    users_collection.insert_one(user_data)

    return jsonify({"success": True, "message": "User registered successfully"}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = users_collection.find_one({"email": email})
    
    if not user or not check_password_hash(user["password"], password):
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    token = jwt.encode(
        {"email": email, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
        app.config["SECRET_KEY"],
        algorithm="HS256"
    )

    response = jsonify({"success": True, "token": token})
    
    # ✅ Add necessary CORS headers
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    
    return response

# ✅ Explicitly handle OPTIONS requests (Preflight)
@app.route("/api/login", methods=["OPTIONS"])
@app.route("/api/register", methods=["OPTIONS"])
def preflight():
    response = jsonify({"message": "CORS preflight successful"})
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response

if __name__ == "__main__":
    app.run(debug=True)
