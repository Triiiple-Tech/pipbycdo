This project was set up by GitHub Copilot based on the user's specifications.

Key requirements:
- React (Vite) + Tailwind CSS
- API interaction with a FastAPI backend
- Endpoints:
  - GET /health (or /api/health)
  - POST /api/analyze (multipart/form-data, 'files' key)
  - GET /api/tasks/{task_id}/status
- MVP Workflow:
  - Health check on load
  - File upload (PDF, DOCX)
  - Task polling
  - Display JSON result
  - Error handling
- Supported File Types: PDF, DOCX

Backend start command: uvicorn backend.app.main:app --reload
Base API URL (local): http://localhost:8000
