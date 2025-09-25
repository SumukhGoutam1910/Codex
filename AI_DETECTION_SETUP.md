# AI Fire & Smoke Detection Setup Guide

This guide will help you set up the AI-powered fire and smoke detection system that monitors live camera feeds and automatically alerts admins when incidents are detected.

## Prerequisites

1. **Python 3.8 or higher** installed on your system
2. **pip** (Python package installer)
3. **Camera streams** (RTSP, HTTP, or webcam)
4. **YOLO model file** (`best_03.pt`) in the project root

## Installation Steps

### 1. Install Python Dependencies

```bash
# Navigate to your project directory
cd C:\Users\Sumukh\OneDrive\Desktop\Codex_Web2

# Install required Python packages
pip install -r requirements.txt
```

### 2. Verify Model File

Make sure you have the trained YOLO model file:
- File: `best_03.pt` (should be in project root)
- This is your trained fire/smoke detection model

### 3. Test the Detection System

You can test the AI detection manually:

```bash
# Test with a webcam (camera index 0)
python mdl.py cam001 0 "Test Camera" "Test Location"

# Test with an IP camera stream
python mdl.py cam001 "http://192.168.1.100:8080/video" "Front Door Camera" "Building Entrance"

# Test with an RTSP stream
python mdl.py cam001 "rtsp://192.168.1.100:554/stream" "Security Camera" "Parking Lot"
```

## How It Works

### Automatic Detection Flow

1. **Camera Registration**: When you add cameras through the web interface, they're stored in MongoDB
2. **Background Monitoring**: The Node.js background service automatically starts AI detection for online cameras
3. **Real-time Analysis**: The Python script continuously analyzes video frames using YOLO
4. **Incident Detection**: When fire/smoke is detected with high confidence (>80%):
   - A snapshot is captured and saved
   - An incident report is sent to the admin via API
   - The admin receives immediate notification

### Detection Process

```
Camera Stream → Python AI Script → YOLO Model → Detection Found?
                                                      ↓ (Yes, High Confidence)
                                               Capture Snapshot
                                                      ↓
                                            Send to Admin Dashboard
                                                      ↓
                                             Create Incident Record
```

## Configuration

### Detection Settings

You can modify these settings in `mdl.py`:

```python
# Confidence threshold for detections (0.7 = 70%)
confidence_threshold = 0.7

# High confidence threshold for incident reporting (0.8 = 80%)
high_confidence_threshold = 0.8

# Cooldown between detections for same camera (seconds)
detection_cooldown = 10

# Frame processing interval (process every Nth frame)
frame_interval = 10
```

### API Configuration

The AI script communicates with your Next.js backend:

```python
# API base URL (update if running on different port)
api_base_url = 'http://localhost:3000'

# Incident reporting endpoint
endpoint = '/api/incidents/create-from-detection'
```

## Snapshots

- Incident snapshots are saved to: `snapshots/` directory
- Web-accessible snapshots are saved to: `public/incident-snapshots/`
- Filename format: `detection_[camera_id]_[timestamp].jpg`

## Troubleshooting

### Common Issues

1. **"Module not found" errors**
   ```bash
   pip install -r requirements.txt
   ```

2. **Camera connection failed**
   - Check camera URL/IP address
   - Verify camera is accessible on network
   - Test URL in browser if it's HTTP

3. **Model file not found**
   - Ensure `best_03.pt` is in project root
   - Check file permissions

4. **API connection failed**
   - Make sure Next.js dev server is running (`npm run dev`)
   - Check API endpoint URL in `mdl.py`

### Debug Mode

To see detailed output from AI detection:

```bash
# Run with verbose output
python mdl.py cam001 "your_stream_url" "Camera Name" "Location" --verbose
```

## Production Deployment

For production use:

1. **Run as Service**: Set up the background monitor as a system service
2. **Error Handling**: Implement automatic restart on failures  
3. **Resource Management**: Monitor CPU/memory usage
4. **Log Management**: Set up proper logging and rotation
5. **Security**: Use HTTPS and proper authentication

## Integration with Web Interface

The web interface automatically:
- ✅ Enables AI monitoring for all new cameras
- ✅ Starts background detection processes
- ✅ Shows real-time AI status in dashboard
- ✅ Displays incident alerts to admins
- ✅ Provides camera management controls

## Performance Notes

- **CPU Usage**: YOLO detection is CPU-intensive
- **Memory**: Each camera process uses ~200-500MB RAM
- **Processing**: Analyzes every 10th frame to reduce load
- **Cooldown**: 10-second delay between detections per camera

## Support

If you encounter issues:
1. Check the console logs in your web browser
2. Check the terminal running `npm run dev`
3. Check Python script output
4. Verify camera connectivity
5. Ensure all dependencies are installed

---

**🔥 Fire Safety System Ready!**

Your AI-powered fire and smoke detection system is now set up and ready to protect your space with automated monitoring and instant admin alerts.