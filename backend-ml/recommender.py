import os
import pandas as pd
import torch
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
from supabase import create_client, Client


SUPABASE_URL = "https://lwkswhslkxweneheackj.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3a3N3aHNsa3h3ZW5laGVhY2tqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQwMTAzNSwiZXhwIjoyMDcxOTc3MDM1fQ.w_8ugiGXUbBGtK8R-uNzh63a0RwWtKHSxvS07Za6fB0"


def build_product_text(row: pd.Series) -> str:
    parts = []
    if row.get("name"):
        parts.append(str(row["name"]))
    if row.get("description"):
        parts.append(str(row["description"]))
    if row.get("category"):
        parts.append(str(row["category"]))
    return " ".join(parts)


class SemanticRecommender:
    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        self.model: SentenceTransformer | None = None
        self.df: pd.DataFrame | None = None
        self.embeddings: torch.Tensor | None = None

    def load_data(self) -> pd.DataFrame | None:
        response = self.supabase.table("products").select(
            "id, name, description, price, image_url, category, is_available, approved"
        ).execute()

        data = response.data
        if not data:
            print("No products found in Supabase.")
            return None

        df = pd.DataFrame(data)

        df = df[
            (df.get("is_available", True) == True)
            & (df.get("approved", True) == True)
        ].copy()

        if df.empty:
            print("No available + approved products.")
            return None

        for col in ["name", "description", "category", "image_url"]:
            if col not in df.columns:
                df[col] = ""

        df["text"] = df.apply(build_product_text, axis=1)

        self.df = df.reset_index(drop=True)
        return self.df

    def load_model(self):
        if self.model is None:
            print("Loading Sentence-BERT model (all-MiniLM-L6-v2)...")
            self.model = SentenceTransformer("all-MiniLM-L6-v2")

    def compute_embeddings(self):
        if self.df is None:
            self.load_data()
        if self.df is None or self.df.empty:
            return

        self.load_model()
        corpus = self.df["text"].tolist()
        print(f"Encoding {len(corpus)} products into embeddings...")
        self.embeddings = self.model.encode(
            corpus,
            convert_to_tensor=True,
            normalize_embeddings=True
        )

    def ensure_ready(self):
        if self.df is None:
            self.load_data()
        if self.embeddings is None:
            self.compute_embeddings()

    def recommend(self, query: str, top_n: int = 8) -> List[Dict[str, Any]]:
        query = (query or "").strip()
        if not query:
            return self.default_items(top_n)

        self.ensure_ready()
        if self.df is None or self.embeddings is None or len(self.df) == 0:
            return []

        self.load_model()
        query_embedding = self.model.encode(
            [query],
            convert_to_tensor=True,
            normalize_embeddings=True
        )

        scores = (self.embeddings @ query_embedding.T).squeeze(1)
        top_k = min(top_n, len(self.df))
        top_indices = torch.topk(scores, k=top_k).indices.tolist()

        results = []
        for idx in top_indices:
            row = self.df.iloc[idx]
            results.append(
                {
                    "id": row["id"],
                    "name": row["name"],
                    "description": row.get("description", ""),
                    "price": float(row.get("price", 0) or 0),
                    "category": row.get("category") or "",
                    "image_url": row.get("image_url") or "",
                }
            )
        return results

    def default_items(self, top_n: int = 8) -> List[Dict[str, Any]]:
        if self.df is None:
            self.load_data()
        if self.df is None or self.df.empty:
            return []

        df_small = self.df.head(top_n)
        return [
            {
                "id": row["id"],
                "name": row["name"],
                "description": row.get("description", ""),
                "price": float(row.get("price", 0) or 0),
                "category": row.get("category") or "",
                "image_url": row.get("image_url") or "",
            }
            for _, row in df_small.iterrows()
        ]
