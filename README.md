# Procurement Agent with Gemini

This project is a procurement agent that uses Gemini to detect price drifts in purchase orders.

## Running with Docker

1.  **Build the Docker image:**

    ```bash
    docker build -t procurement-agent .
    ```

2.  **Run the Docker container:**

    ```bash
    docker run -p 8000:8000 procurement-agent
    ```

Open your browser and navigate to `http://localhost:8000` to use the application.


Setup & Installation
1. Clone the repo.
2. Install dependencies: `pip install -r requirements.txt`
3. Set your Google API Key: `export GEMINI_API_KEY="your_key"`
4. Run the backend: `uvicorn main:app --reload`
5. Launch the React dashboard.

 Deployment
The agents are containerized using Docker and are ready for deployment on **Google Cloud Run** to ensure high availability and auto-scaling.
