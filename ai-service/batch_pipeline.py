import asyncio
import os
import json
from .database import DatabaseManager
from .generator import VignetteGenerator
from tqdm.asyncio import tqdm
from dotenv import load_dotenv

load_dotenv()

class BatchPipeline:
    def __init__(self):
        self.db = DatabaseManager()
        self.generator = VignetteGenerator()

    async def run(self):
        print("🏗️ Starting Batch Generation Pipeline...")
        
        # 1. Fetch all disease names from Neo4j
        with self.db.neo4j_driver.session() as session:
            result = session.run("MATCH (d:Disease) RETURN d.name as name")
            diseases = [record["name"] for record in result]
        
        print(f"📋 Found {len(diseases)} diseases in knowledge graph.")
        
        # 2. Process each disease
        vignettes_created = 0
        for disease_name in tqdm(diseases):
            try:
                # A. Get facts (Neo4j)
                facts = self.db.get_medical_knowledge(disease_name)
                
                # B. Get template (ChromaDB)
                template = self.db.get_vignette_template(disease_name)
                
                # C. Generate (Gemini)
                vignette = await self.generator.synthesize_vignette(facts, template)
                
                # D. Cache (Supabase)
                vignette_dict = vignette.model_dump()
                # Prepare for Supabase 'daily_vignettes' table format
                supabase_entry = {
                    "topic": disease_name,
                    "data": vignette_dict,
                    "is_active": True
                }
                
                self.db.cache_vignette(supabase_entry)
                vignettes_created += 1
                
            except Exception as e:
                print(f"❌ Failed to generate vignette for {disease_name}: {e}")

        print(f"✅ Pipeline complete! {vignettes_created} vignettes pushed to Supabase.")

    def close(self):
        self.db.close()

if __name__ == "__main__":
    pipeline = BatchPipeline()
    try:
        asyncio.run(pipeline.run())
    finally:
        pipeline.close()
