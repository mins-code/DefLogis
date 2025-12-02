# DefLogis: AI Convoy Command 🛡️

**AI-Powered Intelligent Convoy Routing & Movement Management System.**

DefLogis is a modern defense logistics system featuring a tactical dashboard, advanced route optimization powered by Google's Gemini AI, and an immutable audit trail using decentralized ledger technology (Blockchain and IPFS).

## ✨ Features

This system is designed for high-stakes logistics planning and monitoring, ensuring security and verifiability for every deployment.

* **AI-Powered Route Optimization:** Uses the **Gemini 2.5 Flash** model to analyze and generate optimized convoy routes. The AI considers dynamic factors like potential civilian traffic bottlenecks, strategic risk assessment, and real-time weather impacts.
* **Immutable Route Logging (Web3/IPFS):**
    * The complete AI route analysis is uploaded to **IPFS (via Pinata)** to generate a permanent Content Identifier (`ipfsCid`).
    * The `ipfsCid` and a cryptographic hash of the route are logged on an **Ethereum Smart Contract (Polygon Amoy testnet)** to create an undeniable, immutable record of the deployment decision (`txHash`).
* **Tactical Dashboard:** Real-time visualization of active convoy status, progress, key metrics, and live alerts.
* **Role-Based Access:** Personnel login system with defined roles (`COMMANDER`, `LOGISTICS_OFFICER`, `FIELD_AGENT`) and security logs for audit.

## 🏗️ Architecture

The project is split into two main services: a FastAPI backend for data processing and a React frontend for the user interface.

| Component | Technology Stack | Description |
| :--- | :--- | :--- |
| **`convoy-backend`** | Python, FastAPI, Motor (MongoDB), Google GenAI, Web3.py, requests | Provides REST APIs for convoy management, security logging, user authentication, and interfaces with Gemini, MongoDB, IPFS, and the Ethereum blockchain. |
| **`convoy-frontend`** | React, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide-React | The command center web application for military personnel to initiate route analysis, view the tactical dashboard, and monitor deployed units. |

## 🚀 Getting Started

### Prerequisites

1.  **MongoDB Database:** A connection URI is required for the backend to store convoy and log data.
2.  **API Keys & Services:**
    * **Gemini API Key:** For the AI route analysis service.
    * **Pinata Account:** A JWT for uploading route analysis data to IPFS.
    * **Ethereum Testnet Wallet:** A private key for the wallet that will deploy transactions (must contain testnet ETH/MATIC for gas).
    * **Deployed Smart Contract:** The address of the `ConvoyLog` smart contract on the Polygon Amoy testnet (or your chosen network).

### 1. Backend Setup (`convoy-backend`)

1.  Navigate to the backend directory:
    ```bash
    cd convoy-backend
    ```

2.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
    *(Dependencies include `fastapi`, `google-genai`, `motor`, `web3`, etc.)*

3.  Create a `.env` file in the `convoy-backend` directory and populate it with your credentials:
    ```env
    MONGO_URI="mongodb+srv://<USER>:<PASSWORD>@<CLUSTER>/deflogis?appName=Cluster0"
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

    # IPFS (Pinata) CONFIGURATION
    PINATA_JWT="YOUR_PINATA_JWT"

    # ETHEREUM/BLOCKCHAIN CONFIGURATION (Polygon Amoy Testnet)
    ETHEREUM_RPC_URL="YOUR_ALCHEMY_OR_INFURA_RPC_URL"
    PRIVATE_KEY="YOUR_WALLET_PRIVATE_KEY"
    CONTRACT_ADDRESS="0xEC80367065C0ad13b43cd00deD9ea121D4eFaa01" # Replace with your deployed address if different
    ```
    *Note: The `CONTRACT_ADDRESS` is taken from the `.env` file provided.*

4.  Run the FastAPI server:
    ```bash
    uvicorn main:app --reload
    ```
    The API will be available at `http://127.0.0.1:8000` (or the host specified by Uvicorn).

### 2. Frontend Setup (`convoy-frontend`)

1.  Navigate to the frontend directory:
    ```bash
    cd convoy-frontend
    ```

2.  Install Node.js dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  Update the API base URL in the source code if you are running the backend locally or on a different host than the deployed `https://deflogis.onrender.com/api`:
    * File: `convoy-frontend/services/geminiService.ts`
    * File: `convoy-frontend/components/LoginPage.tsx`
    * File: `convoy-frontend/components/RoutePlanner.tsx`

4.  Run the Vite development server:
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The frontend will be available at `http://localhost:3000`.

## 🖥️ Usage

1.  **Landing Page:** Access the application and click **INITIALIZE SEQUENCE**.
2.  **Login:** Use an existing ID or click **New user? Register here** to create a new profile with one of the available roles.
3.  **Route Planning (Route Ops tab):**
    * Enter a **Start Point**, **Destination**, and **Convoy Size**.
    * Click **Initiate Analysis** to send a request to the Gemini AI backend.
    * Review the `RouteAnalysisDetail` for risk level, estimated duration, and strategic notes.
    * Click **AUTHORIZE & DEPLOY** to save the convoy to the database and trigger the immutable logging process on IPFS and the blockchain.
4.  **Monitoring (Command Center/Live Tracking tabs):** View active convoys and their real-time telemetry, including links to the `ipfsCid` and `txHash` in the Route Analysis detail view.
