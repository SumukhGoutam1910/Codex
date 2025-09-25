@echo off
echo 🔥 AI Fire Detection System - Quick Start
echo ========================================

echo 📦 Installing Python dependencies...
pip install -r requirements.txt

echo.
echo 🧪 Running system tests...
python test_ai_detection.py

echo.
echo 🚀 Starting Next.js development server...
echo Press Ctrl+C to stop the server when done
npm run dev