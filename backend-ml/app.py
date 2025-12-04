from flask import Flask, request, jsonify
from flask_cors import CORS
from recommender import SemanticRecommender

app = Flask(__name__)
CORS(app)

recommender = SemanticRecommender()
recommender.load_data()
recommender.compute_embeddings()


@app.route("/recommend", methods=["POST"])
def recommend():
    body = request.get_json(force=True) or {}
    query = (body.get("query") or "").strip()

    if not query:
        items = recommender.default_items(top_n=8)
    else:
        items = recommender.recommend(query=query, top_n=8)

    return jsonify(items)


@app.route("/reload", methods=["POST"])
def reload():
    recommender.load_data()
    recommender.compute_embeddings()
    return jsonify({"status": "reloaded"})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(port=5001, debug=True)
