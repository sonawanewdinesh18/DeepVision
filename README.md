# DeepVision

DeepVision is a full-stack AI application structured into independent modules.

## 📂 Project Structure

- **`backend/`**: Python API service (e.g. FastAPI/Flask). Manages core business logic and database interactions.
- **`frontend/`**: Node.js/Vite based web client. The user interface of the application.
- **`ai_models/`**: (Placeholder) Will store machine learning models and inference scripts.
- **`docker/`**: (Placeholder) Will contain Dockerfiles and `docker-compose.yml` for containerized deployment.
- **`docs/`**: (Placeholder) Additional project documentation and diagrams.

## 🚀 Getting Started

### Prerequisites
- Node.js (for frontend)
- Python 3.8+ (for backend)

### 1. Backend Setup

```bash
cd backend
# Activate your virtual environment
# Windows
.\dvvenv\Scripts\activate
# Linux/macOS
source dvvenv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
# Assuming a standard setup (adjust if needed)
python main.py
```

### 2. Frontend Setup

```bash
cd frontend
# Install dependencies
npm install

# Start the development server
npm run dev
```

## 🛡️ Environment Variables
Check the respective `.env.example` files in the `backend/` and `frontend/` directories to see required configuration variables.
