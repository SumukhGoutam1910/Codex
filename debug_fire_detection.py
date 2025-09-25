#!/usr/bin/env python3
"""
AI Fire Detection - Debug Mode
This version shows real-time detection info and has lower thresholds for testing
"""

import cv2
import requests
import base64
import json
import time
import os
import sys
from datetime import datetime
from ultralytics import YOLO
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class FireSmokeDetector:
    def __init__(self, model_path='best_03.pt', confidence_threshold=0.5, api_base_url='http://localhost:3000'):
        """
        Initialize the Fire/Smoke Detector with DEBUG settings
        Args:
            model_path: Path to the YOLO model file
            confidence_threshold: Minimum confidence for detections (LOWERED for testing)
            api_base_url: Base URL for the Next.js API
        """
        try:
            self.model = YOLO(model_path)
            print(f"✅ Model loaded successfully: {model_path}")
            print(f"🏷️ Model classes: {list(self.model.names.values())}")
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            print(f"📁 Make sure '{model_path}' exists in the current directory")
            sys.exit(1)
            
        self.confidence_threshold = confidence_threshold
        self.api_base_url = api_base_url
        self.last_detection_time = {}
        self.detection_cooldown = 5  # Reduced cooldown for testing
        
        # Create snapshots directory
        os.makedirs('snapshots', exist_ok=True)
        
        print(f"🎯 Detection confidence threshold: {confidence_threshold} ({confidence_threshold*100}%)")
        print(f"🚨 Alert threshold: 0.6 (60%) - LOWERED FOR TESTING")
        print(f"⏰ Cooldown between alerts: {self.detection_cooldown} seconds")
        
    def process_frame(self, frame, camera_id, camera_name, location, show_debug=True):
        """
        Process a single frame with DEBUG information
        """
        # Perform detection
        results = self.model.predict(source=frame, conf=self.confidence_threshold, verbose=False)
        detections = results[0].boxes
        
        detection_found = False
        highest_confidence = 0
        best_detection = None
        all_detections = []
        
        if detections is not None and len(detections) > 0:
            for det in detections:
                cls_id = int(det.cls[0])
                conf = float(det.conf[0])
                label = self.model.names[cls_id]
                
                all_detections.append({
                    'label': label,
                    'confidence': conf,
                    'bbox': det.xyxy[0].tolist()
                })
                
                if show_debug:
                    print(f"🔍 Detected: {label} ({conf:.2f} confidence)")
                
                # Check if detected object is fire or smoke
                if label.lower() in ['fire', 'smoke']:
                    if conf > highest_confidence:
                        highest_confidence = conf
                        best_detection = {
                            'label': label,
                            'confidence': conf,
                            'bbox': det.xyxy[0].tolist(),
                            'cls_id': cls_id
                        }
                        detection_found = True
                        
                        if show_debug:
                            print(f"🔥 FIRE/SMOKE DETECTED: {label} ({conf:.2f} confidence)")
        
        if show_debug and len(all_detections) == 0:
            print("👁️ No objects detected in frame")
        elif show_debug and not detection_found:
            print(f"📋 Detected {len(all_detections)} objects, but none were fire/smoke")
        
        # LOWERED threshold for testing - alert at 60% instead of 80%
        if detection_found and highest_confidence >= 0.6:  # LOWERED FOR TESTING
            current_time = time.time()
            
            if camera_id not in self.last_detection_time or \
               (current_time - self.last_detection_time[camera_id]) > self.detection_cooldown:
                
                self.last_detection_time[camera_id] = current_time
                print(f"🚨 ALERT THRESHOLD REACHED! Confidence: {highest_confidence:.2f}")
                self.handle_detection(frame, camera_id, camera_name, location, best_detection)
        
        return detection_found, highest_confidence, all_detections
    
    def handle_detection(self, frame, camera_id, camera_name, location, detection):
        """
        Handle fire/smoke detection with detailed logging
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            snapshot_filename = f"snapshots/detection_{camera_id}_{timestamp}.jpg"
            
            # Draw bounding box
            x1, y1, x2, y2 = map(int, detection['bbox'])
            color = (0, 0, 255) if detection['label'].lower() == 'fire' else (0, 255, 255)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, f"{detection['label']}: {detection['confidence']:.2f}", 
                       (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
            
            # Save snapshot
            cv2.imwrite(snapshot_filename, frame)
            print(f"📸 Snapshot saved: {snapshot_filename}")
            
            # Convert to base64
            with open(snapshot_filename, 'rb') as img_file:
                img_base64 = base64.b64encode(img_file.read()).decode('utf-8')
            
            # Send incident report
            print(f"📤 Sending incident report to admin...")
            self.send_incident_report(camera_id, camera_name, location, detection, img_base64, snapshot_filename)
            
        except Exception as e:
            print(f"❌ Error handling detection: {e}")
    
    def send_incident_report(self, camera_id, camera_name, location, detection, image_base64, snapshot_path):
        """
        Send incident report with detailed logging
        """
        try:
            incident_data = {
                'cameraId': camera_id,
                'cameraName': camera_name,
                'location': location,
                'detectionType': detection['label'],
                'confidence': detection['confidence'],
                'timestamp': datetime.now().isoformat(),
                'image': image_base64,
                'snapshotPath': snapshot_path,
                'bbox': detection['bbox'],
                'severity': 'high' if detection['confidence'] > 0.8 else 'medium'
            }
            
            print(f"📋 Incident data prepared:")
            print(f"   🔥 Type: {detection['label']}")
            print(f"   🎯 Confidence: {detection['confidence']:.2f}")
            print(f"   📍 Location: {location}")
            
            response = requests.post(
                f"{self.api_base_url}/api/incidents/create-from-detection",
                json=incident_data,
                headers={'Content-Type': 'application/json'},
                timeout=10,
                verify=False
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ SUCCESS: Incident reported!")
                print(f"🆔 Incident ID: {result.get('incidentId')}")
                print(f"📧 Admin notification: SENT")
                print(f"🌐 Check dashboard: http://localhost:3000")
            else:
                print(f"❌ API Error: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ Network error: {e}")
    
    def monitor_camera_debug(self, stream_url, camera_id, camera_name, location):
        """
        Monitor camera with DEBUG output
        """
        print(f"\n🎥 DEBUG MONITORING STARTED")
        print(f"📹 Camera: {camera_name}")  
        print(f"🔗 Stream: {stream_url}")
        print(f"📍 Location: {location}")
        print(f"🎯 Looking for: fire, smoke")
        print(f"💡 TIP: Hold a lighter or match in front of camera to test")
        print("=" * 60)
        
        if stream_url == "0":
            cap = cv2.VideoCapture(0)  # Webcam
        else:
            cap = cv2.VideoCapture(stream_url)
        
        if not cap.isOpened():
            print(f"❌ Cannot connect to camera: {stream_url}")
            return False
        
        frame_count = 0
        detection_count = 0
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    print(f"❌ Cannot read frame from camera")
                    break
                
                frame_count += 1
                
                # Process every 5th frame for faster response
                if frame_count % 5 == 0:
                    print(f"\n📋 Frame {frame_count} - Analyzing...")
                    detected, confidence, all_detections = self.process_frame(
                        frame, camera_id, camera_name, location, show_debug=True
                    )
                    
                    if detected:
                        detection_count += 1
                        print(f"🎉 Total detections so far: {detection_count}")
                
                # Show frame with detections (optional)
                cv2.imshow(f"🔥 Fire Detection - {camera_name}", frame)
                
                # Press 'q' to quit
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
                
                time.sleep(0.2)  # Faster processing for testing
                
        except KeyboardInterrupt:
            print(f"\n🛑 Monitoring stopped")
        finally:
            cap.release()
            cv2.destroyAllWindows()
            print(f"📊 Final stats: {frame_count} frames processed, {detection_count} fire/smoke detections")

def main():
    if len(sys.argv) < 5:
        print("🔥 AI Fire Detection - DEBUG MODE")
        print("Usage: python debug_fire_detection.py <camera_id> <stream_url> <camera_name> <location>")
        print("\nExamples:")
        print("  python debug_fire_detection.py cam001 0 'Webcam' 'My Room'")
        print("  python debug_fire_detection.py cam002 'http://192.168.1.100:8080/video' 'IP Cam' 'Office'")
        return
    
    camera_id = sys.argv[1]
    stream_url = sys.argv[2] 
    camera_name = sys.argv[3]
    location = sys.argv[4]
    
    print("🔥 FIRE DETECTION - DEBUG MODE")
    print("🧪 Lowered thresholds for easier testing")
    print("📱 Hold a lighter/match in front of camera to test")
    
    detector = FireSmokeDetector()
    detector.monitor_camera_debug(stream_url, camera_id, camera_name, location)

if __name__ == "__main__":
    main()