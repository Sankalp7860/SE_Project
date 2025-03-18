from flask import Flask, request, jsonify
import cv2
import numpy as np
import base64
from deepface import DeepFace
import requests
from flask_cors import CORS  # Import Flask-CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

TMDB_API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlZTJhYTBjODE1NTQzNzkxNjIyMmIxZmYyOWE3ZGI4NiIsIm5iZiI6MTc0MDkyODAzOS41MTIsInN1YiI6IjY3YzQ3NDI3MTExY2RkNGVkOGI0YWUyMyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.nmjaNuIPThzM0BrtWckOXBERsIELOoWImWjXHQ9mxqA"

# Emotion-to-genre mapping
GENRE_MAP = {
    "happy": 35,      # Comedy
    "sad": 18,        # Drama
    "angry": 28,      # Action
    "fear": 27,       # Horror
    "surprise": 878,  # Sci-Fi
    "neutral": 10749  # Romance
}

@app.route("/detect-emotion", methods=["POST"])
def detect_emotion():
    try:
        data = request.json["image"].split(",")[1]
        image_bytes = base64.b64decode(data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        analysis = DeepFace.analyze(image, actions=["emotion"], enforce_detection=False)
        emotion = analysis[0]["dominant_emotion"]
        print(emotion)
        
        return jsonify({"emotion": emotion})
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3030, debug=True)
    print("server running ")
