# PIP AI Frontend

This project is a React frontend for the PIP AI application, built with Vite and Tailwind CSS.

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the Vite development server, typically at `http://localhost:5173`.

## Backend API

This frontend interacts with a FastAPI backend. Ensure the backend server is running.

-   **Backend start command:** `uvicorn backend.app.main:app --reload`
-   **Base API URL (local):** `http://localhost:8000`

## Key Features

-   **Health Check:** Verifies API connectivity on load.
-   **File Upload:** Allows users to upload PDF or DOCX files for analysis.
-   **Task Polling:** Periodically checks the status of submitted analysis tasks.
-   **Result Display:** Shows the JSON output from the backend once a task is complete.
-   **Error Handling:** Provides feedback for API or processing errors.

## Available Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Builds the application for production.
-   `npm run lint`: Lints the codebase.
-   `npm run preview`: Serves the production build locally for preview.

## Project Structure (Simplified)

```
/src
├── components    # Reusable UI components
├── services      # API interaction logic (e.g., Axios calls)
├── App.jsx       # Main application component
├── main.jsx      # Entry point
└── index.css     # Global styles & Tailwind directives
```

## API Endpoints Used

-   `GET /health` (or `/api/health`)
-   `POST /api/analyze`
-   `GET /api/tasks/{task_id}/status`
