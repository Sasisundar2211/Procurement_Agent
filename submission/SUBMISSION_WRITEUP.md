# Kaggle Competition Submission Write-up

## Title

Procurement Price-Drift Enforcement Agent

## Subtitle

Automated detection of price discrepancies in procurement contracts using Python and Pandas.

## Card and Thumbnail Image

_(Please use the generated image `procurement_agent_thumbnail.png` found in the artifacts)_

## Submission Track

Agents

## Project Description

### Problem Statement

In large organizations, procurement processes are often plagued by "price drift"—a phenomenon where the actual price paid on a Purchase Order (PO) exceeds the negotiated contract rate. This occurs due to manual entry errors, outdated system data, or lack of real-time oversight. These small discrepancies, when compounded over thousands of transactions, result in significant financial leakage and compliance risks. Solving this is critical for maintaining financial discipline and ensuring that negotiated savings are actually realized.

### Why agents?

Traditional rule-based systems are often rigid and siloed. An agentic approach is superior because it can act autonomously to bridge the gap between static data (contracts) and dynamic transactions (POs). Agents can:

1.  **Orchestrate complex workflows**: Seamlessly moving from data ingestion to analysis and reporting without human intervention.
2.  **Adapt and Scale**: Future iterations can use LLMs to "read" complex PDF contracts just like a human agent would, something standard scripts cannot do easily.
3.  **Proactive Enforcement**: Instead of just reporting errors at the end of the month, an agent can sit in the loop, flagging or blocking POs in real-time.

### What you created

I built the **Procurement Price-Drift Enforcement Agent**, a modular system designed to detect and flag non-compliant transactions.

**Architecture:**

- **Ingestion Agent**: A dedicated module that ingests real-world public procurement data (e.g., San Francisco City data) and normalizes it into a structured SQL database.
- **Detection Engine**: A logic core that joins Purchase Orders with Contracts and calculates the `price_drift` ratio. It automatically flags any transaction where `unit_price > contract_price`.
- **API Layer**: A high-performance FastAPI backend that exposes these capabilities to external systems.
- **Interactive Dashboard**: A modern React + Tailwind CSS frontend that provides:
  - **Real-time Monitoring**: Visualizing drift stats and active alerts.
  - **Interactive Demo**: A built-in guide to help users understand the system.
  - **Leak Generator**: A simulation tool that injects artificial price leaks into the data to demonstrate the agent's detection capabilities.

### Demo

The system runs as a local web application.

1.  **Dashboard**: The main interface shows a live feed of procurement transactions.
2.  **Detection**: Users can click "Run Detection" to scan thousands of records against contracts.
3.  **Simulation**: The "Generate Leaks" feature creates synthetic non-compliant transactions, which the agent immediately detects and flags with "High Drift" alerts.

_(Insert a link to your YouTube video or a GIF here)_

### The Build

The solution was built using a modern, scalable stack:

- **Python 3.10+**: The core language for agent logic.
- **Pandas**: Used for high-performance data manipulation and vectorised comparison of thousands of records.
- **FastAPI**: Chosen for building a high-performance, asynchronous REST API.
- **React & Tailwind CSS**: For a responsive, professional-grade user interface.
- **SQLite & SQLAlchemy**: For lightweight, serverless data persistence.
- **KaggleHub**: To fetch real-world datasets (San Francisco Procurement Data) for realistic testing.

### If I had more time, this is what I'd do

- **LLM Integration**: I would integrate a multimodal LLM to directly parse scanned PDF contracts, extracting pricing terms automatically.
- **Automated Negotiation**: The agent could be empowered to draft emails to vendors inquiring about the price discrepancy.
- **Predictive Analytics**: Use ML to predict which vendors are most likely to drift in the future based on historical patterns.

## Attachments

- **Code Repository**: [Link to your GitHub Repository or Kaggle Notebook]
  - _Note: Ensure you push the `submission` folder content or the full repo (excluding `data/private`) to a public repository._

## Media Gallery

- _(Optional: Add a link to a YouTube video demonstrating the API running and detecting a drift)_
