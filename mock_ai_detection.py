#!/usr/bin/env python3
"""
Simple AI Fire Detection System - Mock Version
This version simulates fire detection without complex dependencies for initial testing.
"""

import time
import json
import requests
import base64
import os
from datetime import datetime

def create_mock_detection_image():
    """Create a mock fire detection image (base64 encoded red square)"""
    # This represents a 100x100 red square in base64 format (minimal PNG)
    red_square_base64 = """
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==
""".strip()
    return red_square_base64

def simulate_fire_detection(camera_id, camera_name, location):
    """Simulate fire detection and send incident report"""
    print(f"🔥 SIMULATED FIRE DETECTED!")
    print(f"📹 Camera: {camera_name} ({camera_id})")
    print(f"📍 Location: {location}")
    print(f"🎯 Confidence: 95.2%")
    
    # Create incident data
    incident_data = {
        'cameraId': camera_id,
        'cameraName': camera_name,
        'location': location,
        'detectionType': 'fire',
        'confidence': 0.952,
        'timestamp': datetime.now().isoformat(),
        'image': create_mock_detection_image(),
        'bbox': [100, 100, 300, 250],  # Mock bounding box
        'severity': 'high'
    }
    
    try:
        print("📤 Sending incident report to admin dashboard...")
        response = requests.post(
            'http://localhost:3000/api/incidents/create-from-detection',
            json=incident_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ SUCCESS: Incident created!")
            print(f"🆔 Incident ID: {result.get('incidentId')}")
            print(f"📧 Admin notification: SENT")
            print(f"📸 Snapshot saved: {result.get('imageUrl', 'N/A')}")
            return True
        else:
            print(f"❌ FAILED: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR: Make sure Next.js server is running (npm run dev)")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def monitor_camera_mock(camera_id, camera_name, location, detection_interval=30):
    """Mock camera monitoring with periodic fire detection simulation"""
    print(f"🎥 Starting MOCK AI monitoring for: {camera_name}")
    print(f"📍 Location: {location}")
    print(f"⏰ Detection simulation every {detection_interval} seconds")
    print(f"🤖 AI Model: Fire/Smoke Detection v1.0 (Mock)")
    print("=" * 60)
    
    detection_count = 0
    
    try:
        while True:
            print(f"\n⏳ Monitoring... (Detection #{detection_count + 1})")
            print("🔍 Analyzing video frames...")
            time.sleep(2)  # Simulate processing time
            
            # Simulate fire detection (you can modify this logic)
            if detection_count % 3 == 0:  # Detect fire every 3rd check
                success = simulate_fire_detection(camera_id, camera_name, location)
                if success:
                    detection_count += 1
                    print(f"\n🚨 ADMIN ALERT SENT! Total detections: {detection_count}")
                else:
                    print(f"\n⚠️ Failed to send alert to admin dashboard")
            else:
                print("✅ No fire detected - monitoring continues...")
            
            print(f"⏸️ Waiting {detection_interval} seconds until next check...")
            time.sleep(detection_interval)
            
    except KeyboardInterrupt:
        print(f"\n🛑 Monitoring stopped by user")
        print(f"📊 Total fire detections sent: {detection_count}")

def main():
    """Main function - simulate fire detection for your camera"""
    print("🔥 AI FIRE DETECTION SYSTEM - MOCK VERSION")
    print("=" * 50)
    print("🧪 This is a simulation to test the incident reporting system")
    print("🔗 Make sure your Next.js server is running: npm run dev")
    print("=" * 50)
    
    # You can customize these values for your camera
    camera_id = "cam_live_001"
    camera_name = "User's Live Camera"
    location = "User's Location"
    
    print(f"\n📹 Camera ID: {camera_id}")
    print(f"🏷️ Camera Name: {camera_name}")
    print(f"📍 Location: {location}")
    
    # Test API connection first
    print(f"\n🧪 Testing API connection...")
    test_success = simulate_fire_detection(camera_id + "_test", camera_name + " (Test)", location + " (Test)")
    
    if test_success:
        print(f"\n✅ API test successful! Starting continuous monitoring...")
        input("Press Enter to start monitoring (Ctrl+C to stop)...")
        monitor_camera_mock(camera_id, camera_name, location, detection_interval=30)
    else:
        print(f"\n❌ API test failed. Please check:")
        print("1. Next.js server is running: npm run dev")
        print("2. Server is accessible at http://localhost:3000")
        print("3. No firewall blocking the connection")

if __name__ == "__main__":
    main()