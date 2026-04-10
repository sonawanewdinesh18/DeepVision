# DeepVision - AI-Powered Deepfake Detection Platform

![DeepVision Logo](frontend/src/assets/LOGO.png)

DeepVision is a comprehensive web application for detecting deepfakes in images and videos using advanced AI models. The platform provides both user and admin interfaces for managing detections, subscriptions, and analytics.

## 🚀 Features

### User Features
- **Upload & Analyze**: Upload images or videos for deepfake detection
- **Real-time Results**: Get instant detection results with confidence scores
- **Detection History**: Track all your previous detections
- **Dashboard Analytics**: View your detection statistics and trends
- **Subscription Plans**: Choose from Free, Pro, or Enterprise plans

### AI Detection Features
- **Dual Model System**: Separate optimized models for images and videos
- **Professional Validation**: Comprehensive file format, size, and quality checks
- **Real-time Processing**: Fast inference with detailed confidence scores
- **Batch Processing**: Support for multiple file uploads
- **Model Monitoring**: Admin dashboard for AI model status and performance

### Admin Features
- **Analytics Dashboard**: Comprehensive platform metrics and insights
- **User Management**: Manage users, roles, and subscriptions
- **Subscription Management**: Handle pricing plans and billing
- **AI Model Management**: Monitor model status and performance metrics
- **Feedback System**: Review and respond to user feedback

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Framer Motion** for animations
- **Supabase** for authentication and database
- **Lucide React** for icons
- **Sonner** for toast notifications

### Backend
- **FastAPI** (Python)
- **Supabase** for database and storage
- **PyTorch** for AI model inference
- **OpenCV** for video processing
- **Pillow** for image processing
- **Pydantic** for data validation

### AI/ML Stack
- **PyTorch** - Deep learning framework
- **TorchVision** - Computer vision models
- **OpenCV** - Video/image processing
- **NumPy** - Numerical computing
- **Separate Models** - Dedicated image and video detection models

### Database
- **PostgreSQL** (via Supabase)
- Row Level Security (RLS) enabled
- Automated triggers and functions

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.9+
- Supabase account
- Git

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/deepvision.git
cd deepvision
```

### 2. Frontend Setup

```bash
cd frontend
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your Supabase credentials
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your Supabase credentials
```

### 4. AI Models Setup

```bash
# Install AI dependencies
cd backend
pip install torch torchvision opencv-python pillow numpy

# Add your trained models to ai_models directory
cp /path/to/your/image_model.pth ai_models/deepvision_image_v1.pth
cp /path/to/your/video_model.pth ai_models/deepvision_video_v1.pth

# Test AI integration
python test_ai_integration.py
```

**📖 For detailed AI setup instructions, see [AI_SETUP_GUIDE.md](AI_SETUP_GUIDE.md)**

### 5. Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL migrations in order:
   ```bash
   # In Supabase SQL Editor, run these files in order:
   database/complete_setup.sql
   database/migrations/001_enable_rls.sql
   database/migrations/002_pricing_plans.sql
   database/migrations/003_fix_profiles.sql
   database/migrations/004_user_settings_notifications.sql
   database/migrations/005_add_user_active_status.sql
   database/triggers/auth_trigger.sql
   ```

3. (Optional) Seed admin user:
   ```bash
   database/seeds/admin_user.sql
   ```

## 🚀 Running the Application

### Development Mode

**Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

**Backend:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --reload
# Runs on http://localhost:8000
```

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

**Backend:**
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 📁 Project Structure

```
deepvision/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── admin/       # Admin panel components
│   │   │   ├── user/        # User dashboard components
│   │   │   ├── common/      # Shared components
│   │   │   └── ui/          # UI components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context providers
│   │   ├── services/        # API services
│   │   ├── utils/           # Utility functions
│   │   └── assets/          # Static assets
│   └── package.json
│
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── api/             # API routes
│   │   │   └── v1/          # API v1 endpoints
│   │   ├── core/            # Core configuration
│   │   ├── models/          # Data models
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utility functions
│   ├── main.py              # FastAPI app entry
│   └── requirements.txt
│
├── database/                 # Database files
│   ├── migrations/          # SQL migrations
│   ├── seeds/               # Seed data
│   └── triggers/            # Database triggers
│
├── ai_models/               # AI model files (not included)
├── docs/                    # Documentation
└── README.md
```

## 🔐 Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
VITE_ADMIN_EMAIL=XYZ@GMAIL.COM
```

### Backend (.env)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
SUPABASE_STORAGE_BUCKET=detection-media
STRIPE_SECRET_KEY=your_stripe_secret_key
MODEL_PATH=./models/deepvision_v1.pth
FRONTEND_URL=http://localhost:5173
```

## 🎨 Key Features Explained

### User Dashboard
- Upload media files for detection
- View detection results with confidence scores
- Access detection history
- Manage account settings

### Admin Dashboard
- **Analytics**: View platform-wide metrics
- **User Management**: CRUD operations on users, bulk actions, search/filter
- **Subscription Management**: Manage plans, pricing, and user subscriptions
- **Model Management**: Configure AI models
- **Feedback**: Review user feedback

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm run test

# Backend tests
cd backend
pytest
```

## 📝 API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Supabase for backend infrastructure
- React and Vite teams
- FastAPI framework
- All open-source contributors

## 📧 Contact

For questions or support, please open an issue on GitHub or contact the maintainers.

## 🔒 Security

- Never commit `.env` files
- Keep Supabase keys secure
- Use environment variables for all sensitive data
- Enable RLS on all database tables
- Regularly update dependencies

## 🚧 Roadmap

- [ ] Mobile app (React Native)
- [ ] Batch processing
- [ ] Advanced analytics
- [ ] API rate limiting
- [ ] Webhook integrations
- [ ] Multi-language support

---

Made with ❤️ by the DeepVision Team
