# ANTICS MD: MASTER SYSTEM ARCHITECTURE

## 1. Project Context & Identity
* **Product Name:** Antic MD
* **Domain:** `anticsmd.hsieh.org`
* **Niche:** Competitive Multiplayer Hospital Operations & Clinical Reasoning Simulator.
* **Shared Auth:** Uses Firebase Project `qrpass-4f170`. 
* **SSO Strategy:** Cross-subdomain session detection via `browserLocalPersistence` (shared with `card.hsieh.org`).

---

## 2. Infrastructure & Data Layers
### A. Client Layer (Frontend)
* **Tech:** Next.js (App Router), Tailwind CSS, Framer Motion.
* **Rendering:** Isometric 2D hospital floor using Phaser.js or Pixi.js.
* **Networking:** WebSockets via **PartyKit** for real-time player movement and state sync.
* **UI Systems:** * Patient Flow Tracker (Real-time unit efficiency dashboard).
    * Hybrid Dialogue Menu (Static RPG buttons + Open-text LLM input).
    * Charting Station Interfaces (Physical goal-points in the game world).

### B. Application Layer (Backend Logic)
* **Real-time Engine:** PartyKit (WebSockets) handles coordinate tracking and proximity math.
* **AI Orchestration:** Python (FastAPI) external service.
* **Task Management:** Cron/Celery triggers the nightly patient generation batch script.
* **Event Logic:** * **Proximity Eavesdropping:** Calculates distance between players to unlock dialogue logs.
    * **Curbside Steal:** Lockout logic when a player charts a patient currently being interviewed by a competitor.

### C. Storage & Retrieval (The RAG Pipeline)
* **Knowledge Layer (Offline):** * **Neo4j AuraDB:** Knowledge Graph for medical ontologies (UMLS/SNOMED) to ensure 100% factual accuracy.
    * **ChromaDB:** Vector DB for MedQA/USMLE vignette templates.
* **Cache Database (Live):** PostgreSQL/Supabase. Stores the daily pool of 100 pre-generated vignettes to eliminate live generation latency.

---

## 3. Generation Strategy
* **Nightly Batch Pipeline:** Python script queries Neo4j/ChromaDB -> LLM synthesizes vignettes -> Formats 80% static RPG branching dialogue -> Injects into Cache DB.
* **Live LLM Reserve:** Gemini API is triggered *only* during "Deep Inquiry" (custom text input) for therapeutic rapport or complex narrative discovery.

---

## 4. Core Gameplay Loop & Mechanics
1. **Spawn:** Patients load from Cache DB and enter the ward floor.
2. **Flow Management:** Players must clear patients to avoid "Bottleneck" thresholds. If congestion is too high, global unit efficiency drops, penalizing all active scores.
3. **Hybrid Interview:** * **Static Options:** Free, instant HPI gathering.
    * **Custom Text:** Costs in-game time/resources but reveals hidden, high-value clinical clues.
4. **Eavesdrop (Curbside Steal):** Competitors in physical proximity see the active interview log.
5. **The Sprint:** First player to physically navigate to a Charting Station and submit the correct diagnosis/pathophysiology claims the points.

---

## 5. Development Directives
* **Data Isolation:** All game-specific data (XP, scores, ward metrics) writes to a `game_stats` collection in Firestore, never the main `users` profile.
* **Performance:** Use PartyKit for "Optimistic UI" movement to ensure the game feels snappy regardless of network ping.
* **Identity:** Maintain shared TypeScript interfaces for the `User` object across the `hsieh.org` ecosystem.