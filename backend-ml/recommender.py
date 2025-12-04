import pandas as pd
import numpy as np
import re
from supabase import create_client, Client
from sklearn.feature_extraction.text import TfidfVectorizer, ENGLISH_STOP_WORDS
from sklearn.metrics.pairwise import cosine_similarity


# ===============================================================
#  SUPABASE CONNECTION
# ===============================================================
SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co"
SUPABASE_SERVICE_KEY = "YOUR_SERVICE_ROLE_KEY"   

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


# ===============================================================
#  TEXT CLEANING
# ===============================================================
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"[^a-z0-9 ]", " ", text)
    words = [w for w in text.split() if w not in ENGLISH_STOP_WORDS]
    return " ".join(words)


# ===============================================================
#  RECOMMENDER CLASS
# ===============================================================
class Recommender:
    def __init__(self):
        self.df = None
        self.vectorizer = None
        self.tfidf_matrix = None

    def load_data(self):
        """Fetches live product data from Supabase"""
        response = supabase.table("products").select("*").execute()
        data = response.data

        if not data:
            print("❌ No product data found in Supabase.")
            return None

        df = pd.DataFrame(data)
        df.fillna("", inplace=True)

        # Only available products
        df = df[df["is_available"] == True]

        # Create tags
        df["tags"] = (
            df["name"].apply(clean_text) + " " +
            df["description"].apply(clean_text) + " " +
            df["category"].apply(clean_text)
        )

        self.df = df
        return df

    def train(self):
        """Create TF-IDF matrix from product tags"""
        if self.df is None:
            self.load_data()

        self.vectorizer = TfidfVectorizer(stop_words="english")
        self.tfidf_matrix = self.vectorizer.fit_transform(self.df["tags"])

    def recommend(self, query, top_n=8):
        """Return recommended products based on search query"""
        if not query:
            return []

        if self.df is None:
            self.load_data()

        if self.tfidf_matrix is None:
            self.train()

        query_clean = clean_text(query)
        query_vec = self.vectorizer.transform([query_clean])
        content_scores = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        # Sort by similarity
        top_indices = content_scores.argsort()[-top_n:][::-1]

        # Return only necessary fields
        return self.df.iloc[top_indices][[
            "id",
            "name",
            "description",
            "price",
            "category",
            "image_url"
        ]].to_dict(orient="records")
