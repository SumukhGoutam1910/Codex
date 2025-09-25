#!/usr/bin/env python3
"""
AI Detection System Test Script
This script tests the fire/smoke detection system without needing a real camera.
"""

import cv2
import numpy as np
import requests
import json
import base64
from datetime import datetime
import os

def create_test_image_with_fire():
    """Create a test image with a red rectangle simulating fire"""
    # Create a 640x480 black image
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    
    # Add some background noise
    noise = np.random.randint(0, 50, img.shape, dtype=np.uint8)
    img = cv2.add(img, noise)
    
    # Draw a red rectangle to simulate fire
    cv2.rectangle(img, (200, 150), (400, 350), (0, 0, 255), -1)  # Red filled rectangle
    
    # Add some flickering effect
    overlay = img.copy()
    cv2.rectangle(overlay, (220, 170), (380, 330), (0, 50, 255), -1)
    img = cv2.addWeighted(img, 0.7, overlay, 0.3, 0)
    
    # Add text label
    cv2.putText(img, "FIRE SIMULATION", (200, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
    
    return img

def test_incident_api():
    """Test the incident creation API directly"""
    print("🧪 Testing Incident Creation API...")
    
    # Create test image
    test_img = create_test_image_with_fire()
    
    # Save test image
    os.makedirs('test_snapshots', exist_ok=True)
    test_img_path = 'test_snapshots/test_fire_detection.jpg'
    cv2.imwrite(test_img_path, test_img)
    
    # Convert to base64
    with open(test_img_path, 'rb') as img_file:
        img_base64 = base64.b64encode(img_file.read()).decode('utf-8')
    
    # Create test incident data
    incident_data = {
        'cameraId': 'test_cam_001',
        'cameraName': 'Test Camera',
        'location': 'Test Laboratory',
        'detectionType': 'fire',
        'confidence': 0.95,
        'timestamp': datetime.now().isoformat(),
        'image': img_base64,
        'bbox': [200, 150, 400, 350],  # x1, y1, x2, y2
        'severity': 'high'
    }
    
    try:
        # Send to incident API
        response = requests.post(
            'http://localhost:3000/api/incidents/create-from-detection',
            json=incident_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Test incident created successfully!")
            print(f"📋 Incident ID: {result.get('incidentId')}")
            print(f"📸 Image saved: {result.get('imageUrl')}")
            print(f"🔥 Detection: {incident_data['detectionType']} ({incident_data['confidence']*100:.1f}% confidence)")
            return True
        else:
            print(f"❌ API Test Failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - Make sure Next.js dev server is running (npm run dev)")
        return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_camera_connection(stream_url):
    """Test camera connection without AI detection"""
    print(f"📹 Testing camera connection: {stream_url}")
    
    cap = cv2.VideoCapture(stream_url)
    
    if not cap.isOpened():
        print("❌ Failed to connect to camera")
        return False
    
    # Try to read a frame
    ret, frame = cap.read()
    if not ret:
        print("❌ Failed to read frame from camera")
        cap.release()
        return False
    
    print(f"✅ Camera connected successfully!")
    print(f"📐 Frame size: {frame.shape[1]}x{frame.shape[0]}")
    
    # Save test frame
    os.makedirs('test_snapshots', exist_ok=True)
    cv2.imwrite('test_snapshots/camera_test_frame.jpg', frame)
    print("📸 Test frame saved: test_snapshots/camera_test_frame.jpg")
    
    cap.release()
    return True

def main():
    print("🔥 AI Fire & Smoke Detection System - Test Suite")
    print("=" * 50)
    
    # Test 1: API Connection
    print("\n1. Testing API Connection...")
    api_success = test_incident_api()
    
    # Test 2: Camera Connection (optional)
    test_camera = input("\n2. Test camera connection? Enter camera URL or 0 for webcam (or press Enter to skip): ").strip()
    if test_camera:
        if test_camera == "0":
            test_camera = 0  # Webcam
        camera_success = test_camera_connection(test_camera)
    else:
        print("⏭️ Skipping camera test")
        camera_success = True
    
    # Test 3: Model File Check
    print("\n3. Checking YOLO model file...")
    model_path = 'best_03.pt'
    if os.path.exists(model_path):
        print(f"✅ Model file found: {model_path}")
        model_success = True
    else:
        print(f"❌ Model file not found: {model_path}")
        print("   Make sure you have the trained YOLO model in the project root")
        model_success = False
    
    # Test 4: Dependencies Check
    print("\n4. Checking Python dependencies...")
    required_packages = ['cv2', 'ultralytics', 'requests', 'numpy']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} - Missing")
            missing_packages.append(package)
    
    deps_success = len(missing_packages) == 0
    
    if missing_packages:
        print(f"\n📦 Install missing packages:")
        print(f"   pip install {' '.join(missing_packages)}")
    
    # Summary
    print("\n" + "=" * 50)
    print("🧪 TEST SUMMARY")
    print("=" * 50)
    print(f"API Connection:      {'✅ PASS' if api_success else '❌ FAIL'}")
    print(f"Camera Connection:   {'✅ PASS' if camera_success else '❌ FAIL'}")
    print(f"Model File:          {'✅ PASS' if model_success else '❌ FAIL'}")
    print(f"Dependencies:        {'✅ PASS' if deps_success else '❌ FAIL'}")
    
    all_tests_passed = api_success and camera_success and model_success and deps_success
    
    if all_tests_passed:
        print("\n🎉 All tests passed! Your AI detection system is ready.")
        print("\n🚀 To start monitoring:")
        print("   1. Make sure your Next.js server is running: npm run dev")
        print("   2. Add cameras through the web interface")
        print("   3. The AI detection will start automatically!")
    else:
        print("\n⚠️ Some tests failed. Please fix the issues above before using the system.")
    
    print(f"\n📁 Test files saved to: test_snapshots/")

if __name__ == "__main__":
    main()