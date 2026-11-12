# FIIXO 
### AI-Powered Repository Revival and Developer Companion SaaS
> *"Understand. Explain. Repair. Teach."*

---

##  How to Open and Run Fiixo

### 1. Start the Backend API (FastAPI)
In a terminal, run:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```
- **Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check:** [http://localhost:8000/healthz](http://localhost:8000/healthz)

---

### 2. Start the Frontend Workspace (React + Vite)
In a second terminal, run:
```bash
cd frontend
npm run dev
```
- **Interactive Agent Workspace:** [http://localhost:5173](http://localhost:5173)

---

##  Run Automated Tests
All authentication, multi-tenant isolation, and IDOR protection tests can be run via:
```bash
cd backend
venv/bin/pytest tests -v
```

---

##  Key Features Implemented in Phase 1
- **Multi-Tenant Workspace Isolation:** Strict separation of projects, repos, and settings per workspace with zero cross-tenant data leakage.
- **Hierarchical RBAC:** `Owner`, `Admin`, and `Member` permission controls enforced server-side.
- **Enterprise Security:**
  - NIST-compliant memory-hard `scrypt` password hashing.
  - Dual-token JWT session rotation (short-lived access + single-use refresh token rotation).
  - External GitHub OAuth credentials encrypted at rest with AES-256-GCM.
- **Interactive Conversational UI:**
  - Pop-Art/Memphis design with Space Grotesk typography.
  - Reactive Vector SVG Agent Mascot with dynamic visual states.
  - Three-panel developer dashboard (Repositories, Agent Workspace, Live Telemetry feed).
- **Render Ready:** Full `render.yaml` Blueprint with zero-downtime health checks and database migration hooks.
