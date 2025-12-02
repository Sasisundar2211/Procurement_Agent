# Procurement Price-Drift Enforcement Agent

A tool to detect and enforce price-drift in procurement data.

## How to run locally

1.  Generate data:

    ```bash
    python data_generator.py
    ```

    This generates data in `data/private` and `data/public`.

2.  Ingest public data:

    ```bash
    python -c "from src.agents.ingestor import run; run()"
    ```

3.  Start the API:

    ```bash
    uvicorn src.api.fastapi_app:app --reload --port 8000
    ```

4.  Run detection via API:
    curl -X POST http://localhost:8000/api/run-detection

    ```

    ```

## Interactive Demo

The web interface includes a built-in **Demo Guide**.

1.  Open the dashboard at `http://localhost:5173`.
2.  Click the **Help / Demo** icon (?) in the top header.
3.  Follow the on-screen instructions to:
    - **Run Detection**: Scan for price drifts.
    - **Simulate Traffic**: Generate synthetic data with leaks.
    - **Filter Results**: Use the slider and badges to analyze severity.
    - **Export Reports**: Download PDF/CSV summaries.

## LLM Usage

This project can use a Large Language Model (LLM) for certain tasks. The `LLM_PROVIDER` environment variable controls which provider to use.

- `LLM_PROVIDER=local`: (Default) Uses a simple, deterministic local fallback that does not make network requests.
- `LLM_PROVIDER=openai`: Uses the OpenAI API. Requires an `LLM_API_KEY`.

## Compliance

- For compliance details, see `compliance.md`.
- For third-party licenses, see `THIRD_PARTY_NOTICES.md`.
- A template for submission is in `submission_compliance.txt`.

## How to create submission artifact

To create a submission artifact that excludes private data, run the following command:

```bash
python scripts/make_submission_artifact.py
```

## Team Eligibility

- **Team Members:** BOBBILI SOMANADH VASUDEVARA SASI SUNDAR (AI Engineer | Machine Learning Engineer)
- Please confirm that all team members meet the competition's residency and export control rules.
