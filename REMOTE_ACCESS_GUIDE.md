# 🏠 Remote Camera Access Guide

## How Remote Camera Access Works

### 🎯 Understanding the Setup

When you're at home, your cameras are on your **local network** (e.g., 192.168.1.100). When you're away from home, you need **remote access** to view these cameras from the internet.

### 🔄 Connection Persistence

**Good News:** Your cameras stay connected 24/7! Here's what happens:

1. **Camera Stays Online**: Your camera remains connected to your home Wi-Fi/network even when you logout
2. **AI Monitoring Continues**: If enabled, AI monitoring runs continuously on your local server
3. **Only External Access Changes**: The camera itself never "logs out" - only how you access it from outside changes

### 🌐 Remote Access Methods

#### Method 1: DDNS + Port Forwarding (FREE)
**Best for: Home users with router access**

1. **Set up DDNS (Dynamic DNS)**:
   - Sign up for free DDNS service:
     - [DuckDNS](https://www.duckdns.org) - Completely free, easy setup
     - [No-IP](https://www.noip.com) - Free tier available
     - [Dynu](https://www.dynu.com) - Free dynamic DNS

2. **Configure Router Port Forwarding**:
   - Forward external port (e.g., 8080) to camera's internal IP:port
   - Example: External 8080 → 192.168.1.100:8080

3. **Access URLs**:
   - **Local**: `http://192.168.1.100:8080/stream`
   - **Remote**: `http://yourname.duckdns.org:8080/stream`

#### Method 2: VPN Access (SECURE)
**Best for: Security-conscious users**

1. **Set up VPN Server at Home**:
   - Use Raspberry Pi with PiVPN
   - Router built-in VPN (if available)
   - Software VPN server

2. **Connect via VPN**:
   - VPN makes you appear "at home"
   - Use local camera URLs even when remote
   - Most secure option

#### Method 3: Cloud Tunneling (EASY)
**Best for: Non-technical users**

1. **Use Tunneling Services**:
   - [ngrok](https://ngrok.com) - Easy setup, free tier
   - [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) - Free
   - [Tailscale](https://tailscale.com) - Easy mesh networking

### 🤖 AI Monitoring Setup

#### Continuous AI Monitoring

1. **AI Process Runs Locally**: The AI monitoring runs on your home computer/server
2. **Persistent Operation**: Continues running even when you're not logged in
3. **Real-time Analysis**: Analyzes camera feed 24/7 for fire/smoke detection
4. **Automatic Alerts**: Sends notifications when incidents are detected

#### Configuration Options

```javascript
// Camera with AI monitoring enabled
{
  name: "Office Camera",
  streamUrl: "http://192.168.1.100:8080/stream",      // Local access
  remoteStreamUrl: "http://yourname.duckdns.org:8080/stream", // Remote access
  metadata: {
    aiMonitoring: true,           // AI enabled
    monitoringActive: true,       // Currently running
    monitoringServerStatus: "running",
    lastDetection: {
      timestamp: "2025-01-15T10:30:00Z",
      type: "smoke",
      confidence: 0.87
    }
  }
}
```

### 📱 Mobile Access Workflow

#### When You're Away From Home:

1. **Open the app on your phone**
2. **Login normally** (your account is cloud-based)
3. **System automatically detects** you're on external network
4. **Switches to remote URLs** for camera access
5. **AI monitoring status** shows in real-time
6. **View live feeds** through secure remote connection

#### Example Access Flow:

```
📱 You (Away) → 🌐 Internet → 🏠 Your Router (Port Forward) → 📹 Camera
                                     ↓
                              🤖 AI Server (Running 24/7)
```

### 🔧 Setup Steps in the App

1. **Add Camera with Both URLs**:
   ```
   Local URL: http://192.168.1.100:8080/stream
   Remote URL: http://yourname.duckdns.org:8080/stream
   DDNS Provider: DuckDNS
   ```

2. **Enable AI Monitoring**:
   - Check "Enable AI Fire/Smoke Detection"
   - Click "Start AI" button when ready

3. **Test Both Access Methods**:
   - Test locally while at home
   - Test remotely from different network

### 🛡️ Security Considerations

#### Recommended Security Measures:

1. **Use HTTPS when possible** (requires SSL certificate)
2. **Change default camera passwords**
3. **Use non-standard ports** (not 8080)
4. **Enable camera authentication**
5. **Consider VPN for maximum security**

#### Port Forwarding Security:
```
Router Configuration:
External Port: 8443 (custom, not default 8080)
Internal IP: 192.168.1.100
Internal Port: 8080
Protocol: TCP
```

### 📊 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   📱 Mobile App  │    │  🌐 Internet    │    │  🏠 Home Network │
│   (Anywhere)    │◄──►│                │◄──►│                 │
│                 │    │                 │    │ 📹 Cameras      │
│ - Remote Access │    │ - DDNS Service  │    │ 🤖 AI Server    │
│ - Live Feeds    │    │ - Port Forward  │    │ 🌐 Router       │
│ - AI Alerts     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🎯 Key Benefits

1. **Always Connected**: Cameras never go offline when you leave
2. **Continuous Monitoring**: AI runs 24/7 for fire/smoke detection  
3. **Flexible Access**: View from anywhere with internet connection
4. **Real-time Alerts**: Instant notifications for safety incidents
5. **Cost Effective**: Use existing equipment with free DDNS services

### ❓ FAQ

**Q: What happens if I lose internet at home?**
A: Local AI monitoring continues, but remote access is unavailable until internet returns.

**Q: Can multiple people access the same camera remotely?**
A: Yes, multiple users can access the same remote camera URL simultaneously.

**Q: How much bandwidth does remote access use?**
A: Depends on camera quality. Typical usage: 1-5 Mbps for HD streams.

**Q: Is the AI monitoring secure?**
A: AI runs locally on your network - video data doesn't leave your home for processing.