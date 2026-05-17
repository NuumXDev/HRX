# HRX: Multi-Agent AI Recruitment & Strategic Analytics Platform

HRX is a high-density, multi-agent adaptive AI recruitment and technical assessment platform. It transforms standard job workflows into an automated candidate assessment funnel featuring automated resume analysis, live adaptive code editors, verbal Q&A evaluations, a high-performance Kanban applicant pipeline, and a centralized strategic Analytics Control Tower.

---

## 🚀 Key Features

*   **Global Analytics Control Tower:** A centralized dashboard displaying candidate volumes, cumulative throughput funnel charts, skill DNA radar heatmaps, score distributions, and dynamic AI executive pool summaries.
*   **High-Density Kanban Pipeline:** Limitless pipeline view optimized for high candidate volumes, featuring responsive top-3 filters and detailed stage modals.
*   **Standardized "Batch Reject" Workflow:** Fail-fast standard rejection automation that filters candidates across resume checkpoints and interview reports.
*   **Adaptive Technical Assessments:** A stateful evaluation portal running live multi-agent assessments (Verbal Q&A + Monaco Editor tasks) with adaptive difficulty scaling.

---

## 🛠️ Technology Stack

*   **Frontend:** Next.js (App Router), React 19, TypeScript, Lucide Icons, pure animated responsive SVGs, CSS/Tailwind.
*   **Backend:** FastAPI, Python 3.12, SQLAlchemy, Alembic (Migrations), SQLite (Local) / PostgreSQL (Cloud).
*   **AI Engine:** Google Gemini Flash API (AI Studio), Multi-Agent Orchestration, Adaptive Interview Evaluators.

---

## 📂 Project Structure

```
HRX/
├── backend/          # FastAPI Python Server & Database Models
│   ├── app/          # Main application logic
│   └── requirements.txt
├── frontend/         # Next.js TypeScript Frontend React Portal
│   ├── src/          # Source directory (pages, components, layouts)
│   └── package.json
└── README.md
```

---

## 💻 Local Setup & Development

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create your local environment file:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and add your `GEMINI_API_KEY` and `SERPAPI_KEY`.*
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Create your local environment file:
   ```bash
   cp .env.example .env.local
   ```
   *Edit `.env.local` to add your Next Auth secret and scheduling links.*
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
5. Open your browser and go to `http://localhost:3000` to access the HRX dashboard.

---

## ☁️ Cloud Deployment Blueprint

For a 100% free, 24/7 online hosting demo:

### 1. Backend (Render)
*   Deploy as a **Web Service**.
*   **Root Directory:** `backend`
*   **Build Command:** `pip install -r requirements.txt`
*   **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
*   **Environment Variables:** Add `GEMINI_API_KEY` and `SERPAPI_KEY`.

### 2. Frontend (Vercel)
*   Deploy Next.js project.
*   **Root Directory:** `frontend`
*   **Environment Variables:** Add `NEXT_PUBLIC_API_URL` pointing to your live Render backend URL, and `AUTH_SECRET`.
