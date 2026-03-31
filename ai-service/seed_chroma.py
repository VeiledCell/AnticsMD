import os
import chromadb
from datasets import load_dataset
from tqdm import tqdm
from dotenv import load_dotenv

load_dotenv()

from .database import generate_vignette_id

class ChromaSeeder:
    def __init__(self):
        # ... (rest of init)
        self.client = chromadb.HttpClient(
            host=os.getenv("CHROMA_HOST", "localhost"),
            port=int(os.getenv("CHROMA_PORT", 8000))
        )
        self.collection = self.client.get_or_create_collection(name="usmle_vignette_templates")

    def seed(self, limit=None):
        print("🚀 Fetching USMLE dataset from HuggingFace...")
        try:
            dataset = load_dataset("medalpaca/medical_meadow_medqa", split="train", streaming=True)
            print("✅ Using medical_meadow_medqa (Parquet)")
        except Exception as e:
            print(f"❌ Error loading dataset: {e}")
            return

        # 1. Fetch existing IDs to avoid re-embedding (Saves memory/RAM)
        print("🔍 Checking existing entries in ChromaDB...")
        existing_ids = set()
        try:
            # We fetch IDs in chunks if it's very large, but 10k is manageable
            results = self.collection.get(include=[])
            existing_ids = set(results['ids'])
            print(f"⏭️ Skipping {len(existing_ids)} items already in database.")
        except Exception as e:
            print(f"⚠️ Could not fetch existing IDs: {e}")

        documents = []
        metadatas = []
        ids = []

        print(f"📦 Processing vignettes (Limit: {limit or 'ALL'})...")
        for i, entry in enumerate(tqdm(dataset)):
            if limit and i >= limit:
                break

            vignette_text = entry.get('input', '') or entry.get('instruction', '')
            if not vignette_text or len(vignette_text) < 20:
                continue

            unique_id = generate_vignette_id(vignette_text)
            
            # SKIP IF ALREADY EXISTS
            if unique_id in existing_ids:
                continue

            documents.append(vignette_text)
            metadatas.append({
                "source": "MedQA", 
                "answer": entry.get('output', 'Unknown')
            })
            ids.append(unique_id)

            # Batch upsert every 50 to be extremely safe with memory
            if len(documents) >= 50:
                self.collection.upsert(documents=documents, metadatas=metadatas, ids=ids)
                documents, metadatas, ids = [], [], []

        # Final batch
        if documents:
            self.collection.upsert(documents=documents, metadatas=metadatas, ids=ids)

        print(f"✅ Successfully seeded all vignettes into ChromaDB.")

if __name__ == "__main__":
    seeder = ChromaSeeder()
    seeder.seed() # No limit

