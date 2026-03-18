import os
import chromadb
from datasets import load_dataset
from tqdm import tqdm
from dotenv import load_dotenv

load_dotenv()

class ChromaSeeder:
    def __init__(self):
        self.client = chromadb.HttpClient(
            host=os.getenv("CHROMA_HOST", "localhost"),
            port=int(os.getenv("CHROMA_PORT", 8000))
        )
        self.collection = self.client.get_or_create_collection(name="usmle_vignette_templates")

    def seed(self, limit=100):
        print("🚀 Fetching USMLE dataset from HuggingFace...")
        
        # Using a Parquet-based USMLE dataset to avoid the 'loading script' error
        try:
            # This is a clean version of MedQA in Alpaca format (Parquet)
            dataset = load_dataset("medalpaca/medical_meadow_medqa", split="train", streaming=True)
            print("✅ Using medical_meadow_medqa (Parquet)")
        except Exception as e:
            print(f"❌ Error loading dataset: {e}")
            return
        
        documents = []
        metadatas = []
        ids = []
        
        print(f"📦 Processing first {limit} vignettes...")
        for i, entry in enumerate(tqdm(dataset)):
            if i >= limit:
                break
            
            # In Alpaca format: 
            # 'instruction' is usually the question/task
            # 'input' is the clinical vignette
            # 'output' is the answer
            
            vignette_text = entry.get('input', '')
            if not vignette_text or len(vignette_text) < 50:
                # Fallback to instruction if input is empty
                vignette_text = entry.get('instruction', '')

            if not vignette_text:
                continue
            
            documents.append(vignette_text)
            metadatas.append({
                "source": "MedQA", 
                "answer": entry.get('output', 'Unknown')
            })
            ids.append(f"medqa_{i}")

        if not documents:
            print("⚠️ No documents found to add.")
            return

        # Batch add to Chroma
        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        print(f"✅ Successfully seeded {len(documents)} REAL MedQA vignettes into ChromaDB.")

if __name__ == "__main__":
    seeder = ChromaSeeder()
    seeder.seed(limit=100)
