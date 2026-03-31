import os
import json
import time
from datasets import load_dataset
from neo4j import GraphDatabase
import google.generativeai as genai
from tqdm import tqdm
from dotenv import load_dotenv
from .database import generate_vignette_id

load_dotenv()

# 1. Verify API Key
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ ERROR: GEMINI_API_KEY not found in environment.")
    exit(1)

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.5-flash')

class MedQAKnowledgeExtractor:
    def __init__(self):
        # 2. Verify Neo4j Connection
        uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        user = os.getenv("NEO4J_USER", "neo4j")
        pw = os.getenv("NEO4J_PASSWORD", "password123")
        
        try:
            self.driver = GraphDatabase.driver(uri, auth=(user, pw))
            self.driver.verify_connectivity()
            print(f"✅ Connected to Neo4j at {uri}")
        except Exception as e:
            print(f"❌ ERROR: Could not connect to Neo4j: {e}")
            exit(1)

    def process_question(self, entry):
        vignette = entry.get('input', '') or entry.get('instruction', '')
        answer = entry.get('output', '')

        if not vignette:
            return None

        prompt = f"""
        Analyze this USMLE clinical vignette and extract structured medical knowledge.
        Vignette: {vignette}
        Correct Answer: {answer}

        Return ONLY a JSON object:
        {{
            "disease_name": "Standardized Medical Name",
            "specialty": "e.g., Cardiology, Infectious Disease",
            "key_findings": ["list", "of", "3-5", "pathognomonic", "findings"],
            "difficulty": "Step 1/2/3"
        }}
        """
        try:
            # Synchronous call for stability
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(response_mime_type="application/json")
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"\n⚠️ API or JSON Error: {e}")
            return None

    def run(self, limit=None):
        print(f"🚀 Loading MedQA dataset...")
        dataset = load_dataset("medalpaca/medical_meadow_medqa", split="train", streaming=True)
        
        count = 0
        skipped = 0
        print(f"📦 Extraction started. Target: {limit or 'ALL'}. Rate limit: ~15 per minute.")
        
        with self.driver.session() as session:
            for entry in tqdm(dataset, desc="Processing MedQA"):
                if limit and count >= limit:
                    break
                
                vignette_text = entry.get('input', '') or entry.get('instruction', '')
                source_hash = generate_vignette_id(vignette_text)
                
                # Check if we already have this source hash (RESUMABILITY)
                existing = session.run("MATCH (d:Disease {source_hash: $hash}) RETURN d", hash=source_hash).single()
                if existing:
                    skipped += 1
                    continue

                facts = self.process_question(entry)
                
                if facts and 'disease_name' in facts:
                    try:
                        session.run("""
                            MERGE (d:Disease {name: $disease})
                            SET d.specialty = $specialty, 
                                d.difficulty = $difficulty,
                                d.medqa_instruction = $inst,
                                d.medqa_output = $out,
                                d.source_hash = $hash
                            WITH d
                            UNWIND $findings as finding
                            MERGE (s:Symptom {name: finding})
                            MERGE (d)-[:CAUSES]->(s)
                        """, 
                        disease=facts['disease_name'],
                        specialty=facts['specialty'],
                        difficulty=facts['difficulty'],
                        findings=facts['key_findings'],
                        inst=entry.get('instruction', ''),
                        out=entry.get('output', ''),
                        hash=source_hash
                        )
                        count += 1
                        if count % 10 == 0:
                            print(f"  ✨ Extracted {count} entities (Skipped {skipped} existing)")
                    except Exception as e:
                        print(f"\n❌ Neo4j Write Error: {e}")
                
                # Sleep to respect Gemini Free Tier rate limits
                time.sleep(4)

        print(f"✅ FINISHED! Extracted: {count}, Skipped: {skipped}")

    def close(self):
        if hasattr(self, 'driver'):
            self.driver.close()

if __name__ == "__main__":
    extractor = MedQAKnowledgeExtractor()
    try:
        # You can run this in chunks of 500 or just leave it to run ALL
        extractor.run() 
    finally:
        extractor.close()
