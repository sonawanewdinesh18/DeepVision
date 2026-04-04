#!/bin/bash

echo "🔍 Checking Backend Server Status..."
echo ""

# Check if backend is running
echo "1. Checking if backend is running on port 8000..."
if curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo "   ✅ Backend is running!"
else
    echo "   ❌ Backend is NOT running!"
    echo "   → Start it with: cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
fi

echo ""

# Check if frontend is running
echo "2. Checking if frontend is running on port 5173..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "   ✅ Frontend is running!"
else
    echo "   ❌ Frontend is NOT running!"
    echo "   → Start it with: cd frontend && npm run dev"
fi

echo ""

# Check backend .env file
echo "3. Checking backend .env file..."
if [ -f "backend/.env" ]; then
    echo "   ✅ backend/.env exists"
    if grep -q "SUPABASE_URL" backend/.env; then
        echo "   ✅ SUPABASE_URL is set"
    else
        echo "   ❌ SUPABASE_URL is missing"
    fi
    if grep -q "SUPABASE_KEY" backend/.env; then
        echo "   ✅ SUPABASE_KEY is set"
    else
        echo "   ❌ SUPABASE_KEY is missing"
    fi
else
    echo "   ❌ backend/.env does NOT exist!"
    echo "   → Copy from: cp backend/.env.example backend/.env"
fi

echo ""

# Check frontend .env file
echo "4. Checking frontend .env file..."
if [ -f "frontend/.env" ]; then
    echo "   ✅ frontend/.env exists"
    if grep -q "VITE_API_URL" frontend/.env; then
        echo "   ✅ VITE_API_URL is set"
    else
        echo "   ❌ VITE_API_URL is missing"
    fi
else
    echo "   ❌ frontend/.env does NOT exist!"
    echo "   → Copy from: cp frontend/.env.example frontend/.env"
fi

echo ""
echo "📋 Summary:"
echo "   If you see ❌ marks above, follow the suggestions to fix them."
echo "   Once everything shows ✅, your app should work!"
