import requests
import base64
import json
import time
import os
import sys
from datetime import datetime
import cv2
from ultralytics import YOLO
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class FireSmokeDetector:
    def __init__(self, model_path='best_03.pt', confidence_threshold=0.7, api_base_url='http://localhost:3000'):
        """
        Initialize the Fire/Smoke Detector
        Args:
            model_path: Path to the YOLO model file
            confidence_threshold: Minimum confidence for detections
            api_base_url: Base URL for the Next.js API
        """
        self.model = YOLO(model_path)
        self.confidence_threshold = confidence_threshold
        self.api_base_url = api_base_url
        self.last_detection_time = {}  # Track last detection per camera to avoid spam
        self.detection_cooldown = 10  # Seconds between detections for same camera
        
        # Create snapshots directory if it doesn't exist
        os.makedirs('snapshots', exist_ok=True)
        
        # CONFIG
        self.camera_url = os.getenv('CAMERA_URL', 0)  # 0 for default webcam, or RTSP/HTTP stream
        self.api_url = os.getenv('API_URL', 'http://localhost:3000/api/incidents/create-from-detection')
        self.confidence_threshold = float(os.getenv('CONFIDENCE_THRESHOLD', 0.1))
        self.alert_threshold = float(os.getenv('ALERT_THRESHOLD', 0.2))
        self.model_path = os.getenv('MODEL_PATH', 'fire_smoke_yolov8.pt')
        
    def send_incident_to_api(self, image_path, label, confidence):
        try:
            with open(image_path, 'rb') as img_file:
                files = {'snapshot': img_file}
                data = {'label': label, 'confidence': confidence}
                response = requests.post(self.api_url, files=files, data=data)
            print(f"[API] Incident sent: {label} ({confidence:.2f}) | Status: {response.status_code}")
        except Exception as e:
            print(f"[API] Error sending incident: {e}")
    
    def monitor_camera(self, stream_url, camera_id, camera_name, location):
        print(f"🎥 Starting monitoring for camera: {camera_name} ({location})")
        print(f"🔗 Stream URL: {stream_url}")
        cap = cv2.VideoCapture(stream_url)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        if not cap.isOpened():
            print(f"❌ Error: Could not open stream for camera {camera_name}")
            return False
        
        frame_count = 0
        detection_count = 0
        last_log_time = time.time()
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    print(f"❌ Error: Could not read frame from camera {camera_name}")
                    break
                
                frame_count += 1
                current_time = time.time()
                
                # Process frame for detection
                results = self.model(frame)
                max_confidence = 0
                detected_objects = []
                
                for r in results:
                    for box in r.boxes:
                        conf = float(box.conf)
                        label = self.model.names[int(box.cls)]
                        max_confidence = max(max_confidence, conf)
                        detected_objects.append(f"{label}({conf:.2f})")
                
                # Log every second
                if current_time - last_log_time >= 1.0:
                    objects_str = ", ".join(detected_objects) if detected_objects else "none"
                    print(f"[FRAME {frame_count}] Max Confidence: {max_confidence:.3f} | Objects: {objects_str}")
                    last_log_time = current_time
                
                # Check for high-confidence fire/smoke detection
                for r in results:
                    for box in r.boxes:
                        conf = float(box.conf)
                        label = self.model.names[int(box.cls)]
                        if label.lower() in ['fire', 'smoke'] and conf >= self.alert_threshold:
                            detected_this_frame = True
                            snapshot_path = f"snapshots/alert_{int(time.time())}.jpg"
                            cv2.imwrite(snapshot_path, frame)
                            print(f"🚨 [ALERT] {label} detected! Confidence: {conf:.3f} | Sending to API")
                            self.send_incident_to_api(snapshot_path, label, conf)
                            detection_count += 1
                
                # Small delay
                time.sleep(0.1)
                
        except KeyboardInterrupt:
            print(f"\n🛑 Monitoring stopped for camera: {camera_name}")
        except Exception as e:
            print(f"❌ Error monitoring camera {camera_name}: {e}")
        finally:
            cap.release()
            cv2.destroyAllWindows()
            print(f"📊 Monitoring complete - Processed {frame_count} frames, {detection_count} alerts sent")
        
        return True

        
    def process_frame(self, frame, camera_id, camera_name, location):
        """
        Process a single frame for fire/smoke detection
        """
        # Perform detection
        results = self.model.predict(source=frame, conf=self.confidence_threshold, verbose=False)
        detections = results[0].boxes
        
        detection_found = False
        highest_confidence = 0
        best_detection = None
        
        if detections is not None and len(detections) > 0:
            for det in detections:
                cls_id = int(det.cls[0])
                conf = float(det.conf[0])
                label = self.model.names[cls_id]
                
                # Check if detected object is fire or smoke
                if label.lower() in ['fire', 'smoke'] and conf > highest_confidence:
                    highest_confidence = conf
                    best_detection = {
                        'label': label,
                        'confidence': conf,
                        'bbox': det.xyxy[0].tolist(),
                        'cls_id': cls_id
                    }
                    detection_found = True
        
        # If high-confidence detection found, process it
        if detection_found and highest_confidence >= 0.8:  # High confidence threshold
            current_time = time.time()
            
            # Check cooldown to avoid spam
            if camera_id not in self.last_detection_time or \
               (current_time - self.last_detection_time[camera_id]) > self.detection_cooldown:
                
                self.last_detection_time[camera_id] = current_time
                self.handle_detection(frame, camera_id, camera_name, location, best_detection)
        
        return detection_found, highest_confidence
    
    def handle_detection(self, frame, camera_id, camera_name, location, detection):
        """
        Handle a fire/smoke detection by saving snapshot and notifying admin
        """
        try:
            # Create snapshot filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            snapshot_filename = f"snapshots/detection_{camera_id}_{timestamp}.jpg"
            
            # Draw bounding box on frame
            x1, y1, x2, y2 = map(int, detection['bbox'])
            color = (0, 0, 255) if detection['label'].lower() == 'fire' else (0, 255, 255)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, f"{detection['label']}: {detection['confidence']:.2f}", 
                       (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
            
            # Save snapshot
            cv2.imwrite(snapshot_filename, frame)
            print(f"🔥 DETECTION ALERT: {detection['label']} detected with {detection['confidence']:.2f} confidence")
            print(f"📸 Snapshot saved: {snapshot_filename}")
            
            # Convert image to base64 for API
            with open(snapshot_filename, 'rb') as img_file:
                img_base64 = base64.b64encode(img_file.read()).decode('utf-8')
            
            # Send incident report to admin
            self.send_incident_report(camera_id, camera_name, location, detection, img_base64, snapshot_filename)
            
        except Exception as e:
            print(f"Error handling detection: {e}")
    
    def send_incident_report(self, camera_id, camera_name, location, detection, image_base64, snapshot_path):
        """
        Send incident report to the Next.js backend
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
                'severity': 'high' if detection['confidence'] > 0.9 else 'medium'
            }
            
            # Send to incident creation API
            response = requests.post(
                f"{self.api_base_url}/api/incidents/create-from-detection",
                json=incident_data,
                headers={'Content-Type': 'application/json'},
                timeout=10,
                verify=False  # For development with self-signed certificates
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Incident reported successfully - ID: {result.get('incidentId')}")
                print(f"📧 Admin notification sent")
            else:
                print(f"❌ Failed to report incident: {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Network error sending incident report: {e}")
        except Exception as e:
            print(f"❌ Error sending incident report: {e}")
    
    def monitor_camera(self, stream_url, camera_id, camera_name, location):
        """
        Monitor a single camera stream for fire/smoke detection
        """
        print(f"🎥 Starting monitoring for camera: {camera_name} ({location})")
        print(f"🔗 Stream URL: {stream_url}")
        
        cap = cv2.VideoCapture(stream_url)
        
        # Set buffer size to reduce latency
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        
        if not cap.isOpened():
            print(f"❌ Error: Could not open stream for camera {camera_name}")
            return False
        
        frame_count = 0
        detection_count = 0
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    print(f"❌ Error: Could not read frame from camera {camera_name}")
                    break
                
                frame_count += 1
                
                # Process every 10th frame to reduce CPU load
                if frame_count % 10 == 0:
                    detected, confidence = self.process_frame(frame, camera_id, camera_name, location)
                    if detected:
                        detection_count += 1
                
                # Optional: Display frame (comment out for headless operation)
                # cv2.imshow(f"Monitor: {camera_name}", frame)
                
                # Check for quit command
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
                
                # Small delay to prevent overwhelming the system
                time.sleep(0.1)
                
        except KeyboardInterrupt:
            print(f"\n🛑 Monitoring stopped for camera: {camera_name}")
        except Exception as e:
            print(f"❌ Error monitoring camera {camera_name}: {e}")
        finally:
            cap.release()
            cv2.destroyAllWindows()
            print(f"📊 Monitoring complete - Processed {frame_count} frames, {detection_count} detections")
        
        return True

def main():
    """
    Main function to start camera monitoring
    Usage: python mdl.py <camera_id> <stream_url> <camera_name> <location>
    """
    print("🚀 Fire/Smoke Detection AI Starting...")
    print(f"📋 Arguments received: {sys.argv}")
    
    if len(sys.argv) < 5:
        print("❌ Usage: python mdl.py <camera_id> <stream_url> <camera_name> <location>")
        print("❌ Example: python mdl.py cam001 'rtsp://192.168.1.100:554/stream' 'Front Door Camera' 'Building Entrance'")
        return
    
    camera_id = sys.argv[1]
    stream_url = sys.argv[2]
    camera_name = sys.argv[3]
    location = sys.argv[4]
    
    print(f"🎯 Camera ID: {camera_id}")
    print(f"🔗 Stream URL: {stream_url}")
    print(f"📷 Camera Name: {camera_name}")
    print(f"📍 Location: {location}")
    
    try:
        # Initialize detector
        print("🔧 Initializing detector...")
        detector = FireSmokeDetector()
        print("✅ Detector initialized successfully")
        
        # Start monitoring
        print("▶️ Starting camera monitoring...")
        detector.monitor_camera(stream_url, camera_id, camera_name, location)
        
    except Exception as e:
        print(f"💥 Fatal error in main: {e}")
        import traceback
        traceback.print_exc()
        return

if __name__ == "__main__":
    main()