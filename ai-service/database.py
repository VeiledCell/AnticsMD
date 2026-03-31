import os
import hashlib
from neo4j import GraphDatabase
import chromadb
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

def generate_vignette_id(text: str) -> str:
    """Generates a stable 16-character hash for a clinical stem."""
    return hashlib.md5(text.encode('utf-8')).hexdigest()[:16]

class DatabaseManager:
    def __init__(self):
        # ... (rest of init unchanged)
        self.neo4j_driver = GraphDatabase.driver(
            os.getenv("NEO4J_URI"),
            auth=(os.getenv("NEO4J_USER"), os.getenv("NEO4J_PASSWORD"))
        )
        
        self.chroma_client = chromadb.HttpClient(
            host=os.getenv("CHROMA_HOST", "localhost"),
            port=int(os.getenv("CHROMA_PORT", 8000))
        )
        self.chroma_collection = self.chroma_client.get_or_create_collection("usmle_vignette_templates")
        
        self.supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY")
        )

    # ... (get_medical_knowledge and get_vignette_template unchanged)

    def cache_vignette(self, vignette_data: dict):
        """
        Store the synthesized vignette in Supabase.
        Uses upsert to prevent duplicates based on the 'id' (which is the source hash).
        """
        # Ensure the ID is at the top level for Supabase primary key matching
        if "data" in vignette_data and "source_id" in vignette_data["data"]:
            vignette_data["id"] = vignette_data["data"]["source_id"]
            
        return self.supabase.table("daily_vignettes").upsert(vignette_data).execute()

    def close(self):
        self.neo4j_driver.close()
