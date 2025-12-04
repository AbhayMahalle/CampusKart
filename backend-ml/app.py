from flask import Flask, request, jsonify
from flask_cors import CORS
from recommender import Recommender

app = Flask(__name__)
CORS(app)

model = Recommender()
model.load_data()
model.train()

@app.route("/recommend", methods=["POST"])
def recommend():
    body = request.json
    query = body.get("query", "")
    
    results = model.recommend(query=query, top_n=8)
    return jsonify(results)

if __name__ == "__main__":
    app.run(port=5001, debug=True)
