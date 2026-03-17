from fastapi import FastAPI, BackgroundTasks, HTTPException
from .generator import VignetteGenerator
from .database import DatabaseManager
from .models import ClinicalVignette
import asyncio

app = FastAPI(title="Antics MD AI Service")
generator = VignetteGenerator()
db = DatabaseManager()

@app.get("/generate/one")
async def generate_vignette(topic: str = "Pneumonia"):
    """
    On-demand generation for testing or 'Deep Inquiry'.
    """
    # 1. Fetch from Neo4j/ChromaDB (mocked for now)
    facts = {
        "id": "mock_123",
        "disease": topic,
        "symptoms": ["cough", "fever", "chest pain"]
    }
    
    # 2. Synthesize with Gemini
    vignette = await generator.synthesize_vignette(facts)
    return vignette

@app.post("/pipeline/batch")
async def run_batch_pipeline(count: int = 100):
    """
    Nightly batch script trigger to populate the cache.
    """
    # Logic to loop through SNOMED topics and generate 100 vignettes
    # This would be triggered by a Cron job/Celery
    return {"message": f"Started batch generation of {count} vignettes."}

@app.on_event("shutdown")
def shutdown_event():
    db.close()
