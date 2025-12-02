# Procurement Agent Frontend

This is a React + Tailwind CSS frontend for the Procurement Price-Drift Enforcement Agent.

## Setup

1.  Install dependencies:
    ```bash
    npm install
    ```

## Running Locally

1.  Start the backend (from the project root):

    ```bash
    uvicorn src.api.fastapi_app:app --reload --port 8000
    ```

2.  Start the frontend (from this directory):

    ```bash
    npm run dev
    ```

3.  Open [http://localhost:5173](http://localhost:5173) in your browser.

## Features

- **Dashboard**: Overview of detections and stats.
- **Real-time Detection**: Trigger detection tasks and view progress.
- **Data Table**: Sortable, filterable table of price drifts.
- **Responsive Design**: Works on desktop and mobile.
