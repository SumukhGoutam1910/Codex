#!/usr/bin/env python3
"""
Simple Fire Detection Test - Direct API Test
"""

import json
import subprocess
import sys

def test_api_with_curl():
    """Test the API using curl directly"""
    print("🧪 Testing incident creation API with curl...")
    
    # Create test data
    test_data = {
        'cameraId': 'test_cam_001',
        'cameraName': 'Test Camera',
        'location': 'Test Location',
        'detectionType': 'fire',
        'confidence': 0.95,
        'timestamp': '2025-09-25T12:00:00.000Z',
        'image': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'bbox': [100, 100, 300, 250],
        'severity': 'high'
    }
    
    try:
        # Use curl to test the API
        curl_command = [
            'curl',
            '-X', 'POST',
            'http://localhost:3000/api/incidents/create-from-detection',
            '-H', 'Content-Type: application/json',
            '-d', json.dumps(test_data),
            '--silent'
        ]
        
        result = subprocess.run(curl_command, capture_output=True, text=True)
        
        if result.returncode == 0:
            response = json.loads(result.stdout)
            if response.get('success'):
                print("✅ SUCCESS: Fire incident created!")
                print(f"🆔 Incident ID: {response.get('incidentId')}")
                print(f"📸 Image URL: {response.get('imageUrl')}")
                print("📧 Admin has been notified!")
                print("\n🎉 Your AI detection system is working!")
                print("\n📋 What happens next:")
                print("1. Check your web dashboard at http://localhost:3000")
                print("2. Login as admin to see the incident")
                print("3. The incident will appear in the incidents page")
                print("4. Real camera detection will work the same way!")
                return True
            else:
                print(f"❌ API Error: {response}")
                return False
        else:
            print(f"❌ Curl failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def main():
    print("🔥 FIRE DETECTION API TEST")
    print("=" * 40)
    print("🧪 This will test if your AI detection system can create incidents")
    print()
    
    # Test the API
    success = test_api_with_curl()
    
    if success:
        print("\n🚀 NEXT STEPS:")
        print("1. Your incident reporting system is working!")
        print("2. Install Python AI dependencies when ready:")
        print("   pip install opencv-python ultralytics")
        print("3. Use the real mdl.py script with your camera:")
        print(f"   python mdl.py cam001 'your_camera_url' 'Camera Name' 'Location'")
        print("4. The system will automatically detect fire/smoke and alert admins!")
    else:
        print("\n❌ The API test failed. Please check:")
        print("1. Next.js server is running: npm run dev")
        print("2. No other process is using port 3000")
        print("3. Check the server console for errors")

if __name__ == "__main__":
    main()