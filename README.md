# Procurement Agent with Gemini

[![License: CC BY-SA 4.0](https://img.shields.io/badge/License-CC%20BY--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)

This project is a procurement agent that uses Gemini to detect price drifts in purchase orders.

## 📋 Quick Links

- [Model Reproducibility Guide](MODEL_REPRODUCIBILITY.md) - Step-by-step instructions to reproduce results
- [Submission Write-up](SUBMISSION_WRITEUP.md) - Detailed project documentation
- [External Data Sources](EXTERNAL_DATA.md) - Data sources and licenses
- [Submission Checklist](submission_checklist.md) - Competition compliance checklist

## 🚀 Quick Start

### Train the Model

```bash
# Generate data
python data_generator.py

# Train (dry run to verify setup)
python train.py --dry-run

# Full training
python train.py --data-path data/public --output-dir models --seed 42
```

### Run Inference

```bash
python inference.py --model-path models/<model_folder> --data-path data/public --print-samples
```

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

## 📄 License

This project is licensed under the **Creative Commons Attribution-ShareAlike 4.0 International License (CC-BY-SA 4.0)**.

See the [LICENSE](LICENSE) file for the complete license text.

This license is required for Kaggle competition winners to enable the Sponsor to use and build upon the winning submission.
