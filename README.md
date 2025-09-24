# Fire & Smoke Detection WebApp

A modern, role-based fire safety monitoring system built with Next.js 14, TypeScript, TailwindCSS, and shadcn/ui components.

## 🔥 Features

### Authentication & Role-Based Access
- **User Role**: Access personal cameras and incidents
- **Admin Role**: Full system access including camera management
- **First Responder Role**: Incident response interface with action buttons

### Core Functionality
- **Real-time Monitoring**: Track fire and smoke incidents across connected cameras
- **Dashboard Views**: Role-specific dashboards with relevant system statistics
- **Camera Management**: Admin interface for adding and monitoring cameras
- **Incident Management**: Comprehensive incident tracking with status updates
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Mobile-first responsive interface

### Technical Stack
- **Frontend**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS with shadcn/ui components
- **Authentication**: JWT-based with bcrypt password hashing
- **API**: Next.js serverless API routes
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd fire-smoke-detection-webapp
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 👥 Demo Credentials

### User Account
- **Email**: rohit@example.com
- **Password**: user123
- **Access**: Personal cameras and incidents

### Admin Account
- **Email**: admin@example.com  
- **Password**: admin123
- **Access**: Full system management

### First Responder Account
- **Email**: responder@example.com
- **Password**: responder123
- **Access**: Incident response interface

## 🏗️ Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/login/    # Authentication endpoint
│   │   ├── cameras/       # Camera management
│   │   ├── incidents/     # Incident tracking
│   │   ├── responders/    # Responder units
│   │   └── users/         # User management
│   ├── dashboard/         # Dashboard page
│   ├── cameras/           # Camera management (Admin only)
│   ├── incidents/         # Incident management
│   ├── settings/          # User settings
│   ├── login/             # Login page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (redirects)
├── components/            # Reusable components
│   ├── ui/                # shadcn/ui components
│   └── navbar.tsx         # Navigation component
├── lib/                   # Utilities and configurations
│   ├── auth-context.tsx   # Authentication context
│   ├── types.ts           # TypeScript interfaces
│   ├── mock-data.ts       # Mock data for demo
│   └── utils.ts           # Utility functions
└── public/                # Static assets
```

## 🎯 Role-Based Features

### User Role
- **Dashboard**: Personal camera status and incidents
- **Incidents**: View personal incidents only
- **Settings**: Profile management and preferences

### Admin Role  
- **Dashboard**: System-wide statistics and monitoring
- **Cameras**: Add, monitor, and manage all cameras
- **Incidents**: View and manage all system incidents
- **Settings**: Administrative preferences

### First Responder Role
- **Incidents**: Streamlined incident response interface
- **Actions**: Mark incidents as dispersed, disengage, or request backup
- **Settings**: Responder-specific configurations

## 🛡️ Security Features

- **Password Hashing**: bcrypt for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permission system
- **Input Validation**: Server-side validation for all endpoints

## 🎨 UI Components

Built with shadcn/ui components including:
- **Cards**: Information containers with consistent styling
- **Badges**: Status indicators for incidents and camera status
- **Buttons**: Interactive elements with hover effects
- **Forms**: Accessible form components
- **Navigation**: Responsive navigation with role-based links

## 📱 Responsive Design

- **Mobile-first**: Optimized for mobile devices
- **Tablet Support**: Responsive layouts for tablet screens  
- **Desktop**: Full desktop experience with expanded layouts
- **Dark Mode**: System-wide dark theme support

## 🔧 Development Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🌟 Key Features Implemented

### Authentication System
- JWT-based authentication with role management
- Secure password hashing using bcrypt
- Automatic token validation and refresh
- Role-based route protection

### Mock Data System
- Comprehensive mock database with realistic data
- Users with different roles and hashed passwords
- Camera configurations with RTSP URLs
- Incident data with confidence levels and timestamps
- Responder unit information

### API Routes
- `/api/auth/login` - User authentication
- `/api/users` - User management
- `/api/cameras` - Camera CRUD operations
- `/api/incidents` - Incident tracking
- `/api/responders` - Responder unit data

### Real-time Features
- Automatic incident updates (polling every 5 seconds)
- Live camera status monitoring
- Real-time dashboard statistics
- Instant role-based navigation updates

## 📊 System Statistics

The dashboard provides comprehensive system statistics including:
- Total cameras and online/offline status
- Active incident count and severity breakdown
- System safety status
- User activity metrics (Admin view)

## 🚨 Incident Management

### Incident Types
- **Fire**: High-priority incidents with immediate response
- **Smoke**: Medium-priority incidents requiring investigation

### Status Workflow
1. **Pending Admin**: Newly detected incidents awaiting review
2. **Dispatched**: Units dispatched to location
3. **Resolved**: Incident successfully handled
4. **False Alarm**: Confirmed false positive

### Responder Actions
- **Dispersed**: Mark incident as contained
- **Disengage**: Stand down from incident  
- **Request Backup**: Call for additional units

## 🎯 Future Enhancements

- Real-time WebSocket connections for live updates
- Integration with actual fire detection hardware
- Advanced analytics and reporting
- Mobile push notifications
- Integration with emergency services
- Multi-tenant support for multiple organizations

## 📄 License

This project is part of a hackathon submission and is intended for demonstration purposes.

## 🤝 Contributing

This is a hackathon project. For production use, please implement proper security measures, real hardware integration, and comprehensive testing.

---

**Built with ❤️ for fire safety and emergency response**