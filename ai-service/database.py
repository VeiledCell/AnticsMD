import os
from neo4j import GraphDatabase
import chromadb
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class DatabaseManager:
    def __init__(self):
        # Neo4j AuraDB (Knowledge Graph)
        self.neo4j_driver = GraphDatabase.driver(
            os.getenv("NEO4J_URI"),
            auth=(os.getenv("NEO4J_USER"), os.getenv("NEO4J_PASSWORD"))
        )
        
        # ChromaDB (Vector DB)
        self.chroma_client = chromadb.HttpClient(
            host=os.getenv("CHROMA_HOST", "localhost"),
            port=int(os.getenv("CHROMA_PORT", 8000))
        )
        self.chroma_collection = self.chroma_client.get_or_create_collection("usmle_vignette_templates")
        
        # Supabase (PostgreSQL Cache)
        self.supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY")
        )

    def get_medical_knowledge(self, topic: str):
        """
        Query Neo4j for clinical facts related to a specific medical topic.
        """
        with self.neo4j_driver.session() as session:
            result = session.run("""
                MATCH (d:Disease)-[:CAUSES]->(s:Symptom)
                WHERE d.name = $name
                RETURN d.name as disease, d.snomed as snomed, collect(s.name) as symptoms
            """, name=topic)
            record = result.single()
            if record:
                return {
                    "disease": record["disease"],
                    "snomed": record["snomed"],
                    "symptoms": record["symptoms"]
                }
            return None

    def get_vignette_template(self, query: str):
        """
        Query ChromaDB for a similar USMLE-style vignette template.
        """
        results = self.chroma_collection.query(
            query_texts=[query],
            n_results=1
        )
        return results['documents'][0] if results['documents'] else None

    def cache_vignette(self, vignette_data: dict):
        """
        Store the synthesized vignette in Supabase for fast game access.
        """
        return self.supabase.table("daily_vignettes").insert(vignette_data).execute()

    def close(self):
        self.neo4j_driver.close()
