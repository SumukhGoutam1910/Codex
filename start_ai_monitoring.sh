#!/bin/bash
# AI Fire Detection Startup Script
# This script sets up the environment and starts AI monitoring for your camera

echo "🔥 AI Fire Detection System - Live Camera Monitor"
echo "================================================="

# Check if virtual environment exists
if [ ! -d "ai_detection_env" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv ai_detection_env
fi

# Activate virtual environment
echo "⚡ Activating virtual environment..."
source ai_detection_env/bin/activate

# Check if dependencies are installed
echo "🔍 Checking Python dependencies..."
python3 -c "import cv2, ultralytics, requests" 2>/dev/null || {
    echo "📦 Installing AI detection dependencies..."
    pip install opencv-python-headless ultralytics requests numpy pillow urllib3
}

# Check if model file exists
if [ ! -f "best_03.pt" ]; then
    echo "❌ Error: YOLO model file 'best_03.pt' not found!"
    echo "📁 Please ensure your trained fire/smoke detection model is in the project root"
    echo "🔗 Model should be named: best_03.pt"
    exit 1
fi

echo "✅ Environment ready!"
echo ""

# Get camera details from user
echo "📹 Camera Setup:"
echo "================="

# Default values - you can modify these
CAMERA_ID=${1:-"live_cam_001"}
CAMERA_URL=${2:-"0"}  # Default to webcam
CAMERA_NAME=${3:-"Live Camera"}
CAMERA_LOCATION=${4:-"User Location"}

echo "🆔 Camera ID: $CAMERA_ID"
echo "🔗 Stream URL: $CAMERA_URL"
echo "🏷️ Camera Name: $CAMERA_NAME"  
echo "📍 Location: $CAMERA_LOCATION"
echo ""

echo "🚀 Starting AI fire detection monitoring..."
echo "⚠️  Press Ctrl+C to stop monitoring"
echo "🔥 Fire/smoke detection confidence threshold: 80%"
echo "📧 Admin alerts will be sent automatically when fire is detected"
echo ""

# Start the AI detection
python3 mdl.py "$CAMERA_ID" "$CAMERA_URL" "$CAMERA_NAME" "$CAMERA_LOCATION"