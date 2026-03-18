from fastapi import FastAPI, BackgroundTasks, HTTPException
from .generator import VignetteGenerator
from .database import DatabaseManager
from .models import ClinicalVignette
import asyncio

app = FastAPI(title="Antics MD AI Service")
generator = VignetteGenerator()
db = DatabaseManager()

@app.get("/generate/one")
async def generate_vignette(topic: str = "Community Acquired Pneumonia"):
    """
    On-demand generation for testing or 'Deep Inquiry'.
    """
    # 1. Fetch real medical facts from Neo4j (Ground Truth)
    facts = db.get_medical_knowledge(topic)
    if not facts:
        raise HTTPException(status_code=404, detail=f"Topic '{topic}' not found in knowledge graph.")
    
    # 2. Fetch USMLE-style template from ChromaDB (Tone/Structure)
    template = db.get_vignette_template(topic)
    
    # 3. Synthesize with Gemini using both sources
    vignette = await generator.synthesize_vignette(facts, template)
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
