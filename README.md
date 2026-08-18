<div align="center">

# 🛡️ DeepVision — Enterprise AI Deepfake Detection Platform

### *Next-Generation Synthetic Media Forensics Powered by Hybrid Vision Transformers & CNNs*

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.x-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%2015-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br />

```
========================================================================================
⚡ REAL-TIME FORENSICS  •  🧠 HYBRID ViT + CNN ARCHITECTURE  •  📊 FULL-STACK ENTERPRISE TELEMETRY
========================================================================================
```

</div>

---

## 📌 Executive Summary

**DeepVision** is a production-grade, enterprise-scale AI platform engineered to detect synthetic and manipulated facial media across **images** and **videos**. 

By fusing the localized frequency-domain sensitivity of **Convolutional Neural Networks (EfficientNet-B0)** with the global long-range spatial attention of **Vision Transformers (ViT-B/16)**, DeepVision achieves state-of-the-art forensic accuracy while maintaining sub-second inference speeds.

The project features an end-to-end decoupled architecture: a high-throughput **FastAPI** inference backend, a modern **React 19** responsive user and administrative interface, and a **Supabase PostgreSQL** cloud persistence layer with Row-Level Security (RLS).

---

## 🌟 Key Highlights & Engineering Features

### 🧠 Dual-Branch Hybrid AI Engine (`Hybrid_vit.pth`)
- **CNN Feature Extractor (`EfficientNet-B0`)**: Captures high-frequency micro-textures, GAN blending boundaries, localized color distribution anomalies, and pixel-level interpolation seams ($1,280$ feature dimensions).
- **Transformer Feature Extractor (`ViT-B/16`)**: Computes multi-head self-attention across 16x16 image patches to identify global facial geometry inconsistencies, unnatural lighting gradients, and structural warping ($768$ feature dimensions).
- **Multi-Stage MLP Fusion Head**: Concatenates representations into a $2,048$-dimensional feature space followed by Batch Normalization, SiLU non-linearities, and Dropout ($0.40$) for robust generalization.

### ⚡ Adaptive Face Localization & Temporal Video Inference
- **Dual-Cascade Face Localization**: Employs an ensemble of Haar cascades (`alt2` + `default`) with a **30% contextual margin** to isolate facial ROIs without boundary cropping distortion.
- **Direct Bicubic Scaling**: Feeds $224 \times 224$ normalized RGB tensors directly into both network backbones matching the training distribution.
- **Multi-Frame Video Temporal Sampling**: Uniformly samples 16 evenly spaced keyframes across video streams, returning individual frame verdicts, timeline distributions, and overall risk aggregations.

### 🛡️ Enterprise Security & Multi-Client REST Architecture
- **JWT Authentication**: Validates Supabase JWTs with multi-algorithm support (`HS256`, `HS512`, `RS256`, `ES256`) and strict signature verification.
- **Multi-Layer File Validation**: Enforces MIME type checks, magic-byte binary header inspection, and payload size thresholds to eliminate payload spoofing.
- **Row-Level Security (RLS)**: Enforces database-level tenant isolation across all user detection records, audit logs, and feedback submissions.

### 📊 Comprehensive Administrator & Feedback Ecosystem
- **Live System Analytics**: Real-time tracking of scan volume, deepfake detection rates, system accuracy, registered user counts, and average response times.
- **Closed-Loop Feedback Triage**: Users submit false-positive / false-negative claims that feed directly into the admin dashboard with full media preview, claim comparison, and one-click verification.
- **User & AI Model Management**: Full CRUD controls for user provisioning, status toggling, and AI model weight telemetry.

---

## 🏗️ System Architecture

```
                                  ┌───────────────────────────────┐
                                  │   CLIENT APPLICATIONS         │
                                  │  • React 19 Web SPA           │
                                  │  • Mobile / Third-Party APIs  │
                                  └───────────────┬───────────────┘
                                                  │
                                                  ▼ HTTPS (Bearer JWT)
                                  ┌───────────────────────────────┐
                                  │  FASTAPI ASGI BACKEND (:8000) │
                                  │  • CORS & Rate Limiting       │
                                  │  • File Magic Byte Validator  │
                                  └───────────────┬───────────────┘
                                                  │
                ┌─────────────────────────────────┼─────────────────────────────────┐
                ▼                                 ▼                                 ▼
    ┌──────────────────────┐          ┌──────────────────────┐          ┌──────────────────────┐
    │  /api/v1/detection   │          │     /api/v1/user     │          │    /api/v1/admin     │
    │  • Image Forensics   │          │  • User Profile      │          │  • System Analytics  │
    │  • Video Keyframing  │          │  • User Analytics    │          │  • User Management   │
    │  • History & Reports │          │  • Feedback Tickets  │          │  • Feedback Triage   │
    └──────────┬───────────┘          └──────────┬───────────┘          └──────────┬───────────┘
               │                                 │                                 │
               └─────────────────────────────────┼─────────────────────────────────┘
                                                 ▼
                                  ┌───────────────────────────────┐
                                  │    BUSINESS SERVICES LAYER    │
                                  │  (Detection, User, Admin)     │
                                  └───────┬───────────────┬───────┘
                                          │               │
                     ┌────────────────────┘               └────────────────────┐
                     ▼                                                         ▼
    ┌─────────────────────────────────┐                       ┌─────────────────────────────────┐
    │     AI INFERENCE ENGINE         │                       │      SUPABASE CLOUD LAYER       │
    │  • Dual-Cascade Face ROI Crop   │                       │  • PostgreSQL 15 Database       │
    │  • EfficientNet-B0 (1280-dim)   │                       │  • Row-Level Security (RLS)     │
    │  • ViT-B/16 (768-dim)           │                       │  • Storage: `detection-media`   │
    │  • 2048-dim MLP Fusion Head     │                       │  • Auth: Built-in GoTrue JWT    │
    └─────────────────────────────────┘                       └─────────────────────────────────┘
```

---

## 🔬 AI Architecture & Mathematical Foundation

```
                                  Input Image / Keyframe
                                            │
                                            ▼
                          ┌───────────────────────────────────┐
                          │   Adaptive Face ROI Extraction    │
                          │   (Dual-Cascade + 30% Margin)     │
                          └─────────────────┬─────────────────┘
                                            │
                                            ▼
                          ┌───────────────────────────────────┐
                          │   Bicubic Normalization (224x224) │
                          └─────────┬───────────────┬─────────┘
                                    │               │
                    ┌───────────────┘               └───────────────┐
                    ▼                                               ▼
     ┌─────────────────────────────┐                 ┌─────────────────────────────┐
     │      EfficientNet-B0        │                 │          ViT-B/16           │
     │   (CNN Feature Extractor)   │                 │ (Vision Transformer Backbone)│
     │                             │                 │                             │
     │  Output: 1,280-dim Vector   │                 │   Output: 768-dim Vector    │
     └──────────────┬──────────────┘                 └──────────────┬──────────────┘
                    │                                               │
                    └───────────────────────┬───────────────────────┘
                                            ▼
                          ┌───────────────────────────────────┐
                          │  Feature Fusion Vector (2,048-dim)│
                          └─────────────────┬─────────────────┘
                                            ▼
                          ┌───────────────────────────────────┐
                          │  Linear(2048 → 1024) + BN + SiLU  │
                          │  Dropout(p = 0.40)                │
                          │  Linear(1024 → 512)  + BN + SiLU  │
                          │  Linear(512 → 2)                  │
                          └─────────────────┬─────────────────┘
                                            ▼
                          ┌───────────────────────────────────┐
                          │        Softmax Classifier         │
                          │  [P(Deepfake), P(Authentic)]      │
                          └───────────────────────────────────┘
```

### Performance & Benchmark Matrix

| Metric | Image Scan | Video Scan (16 Keyframes) |
|---|---|---|
| **Average Latency (CPU)** | `~180ms – 250ms` | `~3.5s – 5.5s` |
| **Average Latency (NVIDIA GPU)** | `< 25ms` | `< 650ms` |
| **Tensor Input Dimensions** | `[1, 3, 224, 224]` | `[16, 3, 224, 224]` |
| **Normalization Parameters** | ImageNet ($\mu=[0.485, 0.456, 0.406], \sigma=[0.229, 0.224, 0.225]$) | ImageNet ($\mu=[0.485, 0.456, 0.406], \sigma=[0.229, 0.224, 0.225]$) |
| **Class Label Encoding** | `0: Deepfake (Fake)` \| `1: Authentic (Real)` | `0: Deepfake (Fake)` \| `1: Authentic (Real)` |

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, Vite 7, React Router v7, Vanilla CSS, Lucide React, Framer Motion |
| **Backend API** | FastAPI, Uvicorn, Pydantic v2, Pydantic Settings, Python-Jose, HTTPX |
| **AI / Deep Learning** | PyTorch 2.x, TorchVision (`EfficientNet-B0`, `ViT-B/16`), OpenCV (`cv2`), Pillow, NumPy |
| **Database & Cloud Storage**| Supabase (PostgreSQL 15), Storage Buckets (`detection-media`), Row-Level Security |
| **DevOps & Containerization** | Docker, Multi-Stage Dockerfile, Nginx Reverse Proxy, Docker Compose |
| **Quality & Tooling** | ESLint 9, Git, Powershell |

---

## 📁 Repository Structure

```
DeepVision/
├── ai_models/                            # Trained PyTorch Model Binaries
│   ├── Hybrid_vit.pth                    # Production weights (EfficientNet-B0 + ViT-B/16)
│   └── final-hybrid-model .ipynb         # Training & Evaluation Jupyter Notebook
│
├── backend/                              # FastAPI Production Backend
│   ├── app/
│   │   ├── main.py                       # FastAPI Application & Model Warmup
│   │   ├── api/v1/                       # REST Endpoints
│   │   │   ├── detection.py              # Image & Video Inference Routes
│   │   │   ├── user.py                   # Profile, Analytics, & Feedback Routes
│   │   │   └── admin.py                  # Telemetry, User & Model Control Routes
│   │   ├── core/                         # Config, Database, Auth & Exceptions
│   │   ├── engine/                       # PyTorch HybridViTCNN & OpenCV Face Detectors
│   │   ├── schemas/                      # Pydantic v2 Validation Models
│   │   └── services/                     # Business Logic Services
│   ├── models/                           # Container mount target for weights
│   ├── Dockerfile                        # Multi-stage hardened Python container
│   ├── docker-compose.yml                # Backend standalone orchestration
│   ├── requirements.txt                  # Pruned dependencies
│   └── .env.example                      # Backend environment template
│
├── database/
│   └── schema.sql                        # PostgreSQL Database DDL, RLS & Storage Triggers
│
├── frontend/                             # React 19 Single Page Application
│   ├── src/
│   │   ├── assets/                       # Static media, SVGs, and demo video (DF.mp4)
│   │   ├── components/
│   │   │   ├── admin/                    # Feedback, Analytics, User Management, Models
│   │   │   ├── user/                     # History, Detector, Analytics Cards, Navbar
│   │   │   ├── auth/                     # Animated Characters, Login/Signup forms
│   │   │   └── common/                   # Skeletons, Loaders, Error Boundaries
│   │   ├── pages/                        # LandingPage, UserDashboard, AdminDashboard
│   │   ├── services/                     # Axios API Layer & Supabase Auth Client
│   │   └── context/                      # Auth & Theme Context Providers
│   ├── nginx.conf                        # Production Nginx reverse proxy configuration
│   ├── Dockerfile                        # Multi-stage React + Nginx container
│   └── package.json                      # Frontend dependencies
│
├── docker-compose.yml                    # Root full-stack Docker Compose file
├── .env.example                          # Monorepo environment configuration template
└── README.md                             # Project documentation
```

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 20+** & npm
- **Docker & Docker Compose** (Optional, for containerized run)
- **Supabase Account** (Free tier supported)

---

### 2. Database & Storage Initialization (Supabase)
1. Navigate to your [Supabase Dashboard](https://supabase.com/dashboard) and open the **SQL Editor**.
2. Paste and run the entire SQL script from [`database/schema.sql`](database/schema.sql).
3. This sets up:
   - Tables: `profiles`, `detections`, `detection_analytics`, `user_settings`, `feedback`
   - Buckets: `detection-media` (Public Access)
   - Triggers for automatic profile provisioning upon user signup.

---

### 3. Option A: 1-Click Docker Deployment (Recommended)

From the project root:

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Add your Supabase credentials into .env

# 3. Launch full stack (Backend + Frontend + Nginx)
docker compose up -d --build

# 4. View logs
docker compose logs -f
```

- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`

---

### 4. Option B: Manual Local Development Setup

#### 🔹 Backend Setup:
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, etc.

# Start FastAPI development server
python -m uvicorn main:app --reload --port 8000
```

#### 🔹 Frontend Setup:
```bash
cd frontend

# Install packages
npm install

# Configure environment
cp .env.example .env
# Fill in VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

# Start Vite development server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 📡 REST API Reference

### 🔍 Detection Forensics (`/api/v1/detection`)
| Method | Endpoint | Description | Auth |
|---|---|---|:---:|
| `POST` | `/api/v1/detection/analyze` | Upload media (`multipart/form-data`) for deepfake classification | 🔒 Required |
| `GET` | `/api/v1/detection/history` | Paginated forensic scan history for the authenticated user | 🔒 Required |
| `GET` | `/api/v1/detection/{id}` | Detailed forensic breakdown, frame timeline, and media URLs | 🔒 Required |
| `DELETE`| `/api/v1/detection/{id}` | Delete detection record and clean up associated storage assets | 🔒 Required |

### 👤 User Services (`/api/v1/user`)
| Method | Endpoint | Description | Auth |
|---|---|---|:---:|
| `GET` | `/api/v1/user/me` | Retrieve authenticated user profile | 🔒 Required |
| `PUT` | `/api/v1/user/me` | Update display name and avatar URL | 🔒 Required |
| `GET` | `/api/v1/user/me/stats` | Volume statistics (total scans, authentic count, fake count) | 🔒 Required |
| `GET` | `/api/v1/user/settings` | Get user preferences (theme, language, alerts) | 🔒 Required |
| `PUT` | `/api/v1/user/settings` | Update user preferences | 🔒 Required |
| `POST` | `/api/v1/user/feedback` | Submit false-positive or false-negative report | 🔒 Required |

### 🛡️ Admin & Telemetry (`/api/v1/admin`)
| Method | Endpoint | Description | Auth |
|---|---|---|:---:|
| `GET` | `/api/v1/admin/stats` | Real-time platform metrics (total scans, active users, accuracy) | 🔑 Admin |
| `GET` | `/api/v1/admin/activity` | Global real-time detection activity feed | 🔑 Admin |
| `GET` | `/api/v1/admin/chart-data` | Temporal distribution of authentic vs deepfake scans | 🔑 Admin |
| `GET` | `/api/v1/admin/users` | Paginated user management table | 🔑 Admin |
| `POST` | `/api/v1/admin/users` | Provision new user account | 🔑 Admin |
| `PUT` | `/api/v1/admin/users/{id}/toggle-status` | Suspend or activate a user account | 🔑 Admin |
| `GET` | `/api/v1/admin/feedback` | Real-time user feedback triage feed with media previews | 🔑 Admin |
| `PUT` | `/api/v1/admin/feedback/{id}` | Resolve feedback and record administrator verification notes | 🔑 Admin |
| `DELETE`| `/api/v1/admin/feedback/{id}` | Delete a feedback ticket | 🔑 Admin |

---

## 🔒 Security & Quality Assurance

- **Zero Lint Errors**: Frontend codebase adheres strictly to ESLint with 0 errors (`npm run lint`).
- **Production Bundling**: Optimized Vite production builds generated in $<6$ seconds.
- **Container Hardening**: Multi-stage Docker builds run under an unprivileged `appuser:1000` account with no root escalations.
- **Data Protection**: Supabase Row-Level Security (RLS) guarantees complete tenant data isolation.

---

## 👨‍💻 Author & Contributions

**Dinesh Sonawane**  
*AI/ML Engineer & Full-Stack Developer*

- **GitHub**: [@sonawanedinesh18](https://github.com/sonawanedinesh18)
- **Email**: `dineshsonawanew2004@gmail.com `
- **LinkedIn**: [Dinesh Sonawane](https://www.linkedin.com/in/dinesh-sonawane-827360343/)

---

## 📄 License
This project is open-source software licensed under the [MIT License](LICENSE).
