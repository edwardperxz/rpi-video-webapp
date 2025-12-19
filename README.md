# RPi Video WebApp - Tutorial Guide

A video streaming web application designed for Raspberry Pi with system monitoring capabilities. This project demonstrates a full-stack web application using Node.js/Express backend, static HTML/CSS/JavaScript frontend, and Nginx for reverse proxy and video streaming.

**Developed by:** Los Cheveronazos · Redes Computacionales · Universidad Tecnológica de Panamá

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Running the Application](#running-the-application)
7. [Usage Guide](#usage-guide)
8. [API Endpoints](#api-endpoints)
9. [Project Structure](#project-structure)
10. [Adding Videos](#adding-videos)
11. [Troubleshooting](#troubleshooting)
12. [Development Notes](#development-notes)

---

## 🎯 Overview

This application provides:

- **Video Streaming**: Browse and watch videos from a centralized library
- **Dynamic Video Loading**: Automatically discovers and displays all videos in the `videos/` folder
- **System Monitoring**: Real-time Raspberry Pi system status dashboard
- **User Management**: Registration and account management interface
- **Responsive Design**: Modern, mobile-friendly UI

---

## ✨ Features

### Video Streaming
- Dynamic video catalog that automatically loads all videos from the `videos/` folder
- Video thumbnails with hover preview
- Full-screen video player with controls
- Support for multiple video formats (MP4, WebM, OGG, MOV, AVI)

### System Monitoring Dashboard
- Real-time system metrics (CPU usage, temperature, memory, storage)
- Network information (IP address, hostname)
- Service status monitoring (Node.js, npm, Nginx, Git, curl, Python)
- Auto-refreshing dashboard (updates every 10 seconds)

### User Interface
- Clean, modern dark theme
- Responsive grid layout for video browsing
- Account management page
- Registration form with validation

---

## 🔧 Prerequisites

Before installing, ensure you have:

- **Node.js** (v14 or higher) and **npm**
- **Nginx** (for production deployment with reverse proxy)
- **Git** (for cloning the repository)
- **Raspberry Pi** (or any Linux system) - optional, works on any system
- Basic knowledge of terminal/command line

### Checking Prerequisites

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check if Nginx is installed (optional for development)
nginx -v
```

---

## 📦 Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd rpi-video-webapp
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- `express` - Web server framework
- `body-parser` - Middleware for parsing request bodies

### Step 3: Prepare Video Files

Create a `videos/` folder in the project root (if it doesn't exist) and add your video files:

```bash
mkdir videos
# Copy your video files to the videos/ folder
# Supported formats: .mp4, .webm, .ogg, .mov, .avi
```

**Note:** Video filenames will automatically become the video titles (without extension).

---

## ⚙️ Configuration

### Server Configuration

The server runs on port **3000** by default. You can modify this in `server.js`:

```javascript
const port = 3000; // Change this if needed
```

### Nginx Configuration (Production)

For production deployment with Nginx reverse proxy:

1. Copy `nginx.conf` to your Nginx configuration directory:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/rpi-video-webapp
   ```

2. Update the `root` path in `nginx.conf` to match your project location:
   ```nginx
   root /path/to/rpi-video-webapp;
   ```

3. Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/rpi-video-webapp /etc/nginx/sites-enabled/
   sudo nginx -t  # Test configuration
   sudo systemctl reload nginx
   ```

4. Run the setup script (if available):
   ```bash
   chmod +x setup-nginx.sh
   ./setup-nginx.sh
   ```

---

## 🚀 Running the Application

### Development Mode

Start the Node.js server:

```bash
npm start
```

Or directly:

```bash
node server.js
```

You should see:
```
Server running at http://0.0.0.0:3000
```

### Accessing the Application

- **Main Page**: `http://localhost:3000/index.html` or `http://localhost:3000/`
- **Video Player**: `http://localhost:3000/watch.html`
- **System Status**: `http://localhost:3000/status.html`
- **Account Page**: `http://localhost:3000/account.html`
- **Registration**: `http://localhost:3000/register.html`

### Production Mode (with Nginx)

1. Start the Node.js server:
   ```bash
   npm start
   ```

2. Ensure Nginx is running:
   ```bash
   sudo systemctl status nginx
   ```

3. Access via your configured domain/IP (e.g., `https://videos.grupo3.local`)

---

## 📖 Usage Guide

### For End Users

#### Browsing Videos

1. Open the main page (`index.html`)
2. All videos in the `videos/` folder are automatically displayed in a grid
3. Click on any video thumbnail or title to watch

#### Watching Videos

1. Click on a video from the main page
2. The video player opens with controls
3. Use browser controls to play, pause, adjust volume, or go fullscreen
4. Click "Volver" (Back) to return to the video list

#### Viewing System Status

1. Navigate to `status.html`
2. View real-time system metrics:
   - Server IP address
   - CPU usage and temperature
   - Memory and storage information
   - Installed services status
3. Click "Sincronizar Datos" to manually refresh

#### Account Management

1. Click "Registrarse / Iniciar" to create an account
2. Fill in the registration form
3. View your account information at "Mi cuenta"
4. Log out using the "Cerrar sesión" button

### For Administrators

#### Adding New Videos

Simply copy video files to the `videos/` folder:

```bash
cp /path/to/new-video.mp4 videos/
```

The video will automatically appear on the main page after refreshing.

**Supported formats:** `.mp4`, `.webm`, `.ogg`, `.mov`, `.avi`

#### Removing Videos

Delete the video file from the `videos/` folder:

```bash
rm videos/video-name.mp4
```

The video will disappear from the list after refreshing.

#### Monitoring System Health

- Check `status.html` for real-time metrics
- Monitor CPU temperature (especially important for Raspberry Pi)
- Check service status indicators
- Review storage usage to ensure sufficient space

---

## 🔌 API Endpoints

### GET `/api/videos`

Returns a list of all available videos.

**Response:**
```json
[
  {
    "filename": "video-name.mp4",
    "path": "videos/video-name.mp4",
    "title": "video-name"
  }
]
```

**Example:**
```bash
curl http://localhost:3000/api/videos
```

### GET `/api/status`

Returns system status information.

**Response:**
```json
{
  "groupName": "Grupo #3 - Los Cheveronazos",
  "serverIP": "192.168.1.100",
  "osVersion": "Raspberry Pi OS",
  "hostname": "raspberrypi",
  "platform": "linux",
  "arch": "arm",
  "uptime": 86400,
  "uptimeHuman": "1 day",
  "hardware": "Raspberry Pi 4 Model B",
  "cpuUsage": 0.25,
  "cpuTemp": 45.5,
  "cpuModel": "ARM Cortex-A72",
  "memory": {
    "total": 4294967296,
    "free": 2147483648
  },
  "storage": {
    "used": "15GB",
    "available": "45GB"
  },
  "network": {...},
  "gpu": {...},
  "clock": {...},
  "processes": {...},
  "services": [
    {
      "name": "Node.js",
      "status": "running"
    }
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Example:**
```bash
curl http://localhost:3000/api/status
```

### POST `/register`

Handles user registration (currently logs data, no database).

**Request Body:**
```json
{
  "username": "user123",
  "password": "password123",
  "firstName": "Juan",
  "lastName": "Pérez"
}
```

---

## 📁 Project Structure

```
rpi-video-webapp/
├── index.html          # Main video browsing page
├── watch.html          # Video player page
├── status.html         # System monitoring dashboard
├── account.html        # User account page
├── register.html       # Registration form
├── styles.css          # Global stylesheet
├── server.js           # Express server and API endpoints
├── package.json        # Node.js dependencies
├── nginx.conf          # Nginx configuration (production)
├── setup-nginx.sh      # Nginx setup script
├── lib/
│   └── system.js       # System monitoring utilities
└── videos/             # Video files directory
    ├── video1.mp4
    ├── video2.mp4
    └── ...
```

### Key Files Explained

- **`server.js`**: Main server file with Express routes and API endpoints
- **`index.html`**: Frontend page that dynamically loads videos via JavaScript
- **`watch.html`**: Video player that reads video path from URL parameters
- **`status.html`**: Dashboard that fetches system data from `/api/status`
- **`lib/system.js`**: Contains functions to gather Raspberry Pi system information

---

## 🎬 Adding Videos

### Method 1: Direct File Copy

```bash
# Copy a video file to the videos folder
cp /path/to/your/video.mp4 videos/

# Or move it
mv /path/to/your/video.mp4 videos/
```

### Method 2: Download Videos

```bash
# Using wget
wget -O videos/video-name.mp4 https://example.com/video.mp4

# Using curl
curl -o videos/video-name.mp4 https://example.com/video.mp4
```

### Video Naming

- Video titles are automatically generated from filenames (extension removed)
- Example: `My Video.mp4` → Title: "My Video"
- Use descriptive filenames for better organization

### Supported Formats

- `.mp4` (recommended)
- `.webm`
- `.ogg`
- `.mov`
- `.avi`

---

## 🔍 Troubleshooting

### Videos Not Appearing

**Problem:** Videos don't show up on the main page.

**Solutions:**
1. Check that videos are in the `videos/` folder (not a subfolder)
2. Verify file extensions are supported (`.mp4`, `.webm`, etc.)
3. Check browser console for JavaScript errors (F12)
4. Verify the server is running: `curl http://localhost:3000/api/videos`
5. Ensure file permissions allow reading: `chmod 644 videos/*.mp4`

### Server Won't Start

**Problem:** `npm start` fails or port is already in use.

**Solutions:**
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process using port 3000
kill -9 <PID>

# Or change the port in server.js
```

### Videos Won't Play

**Problem:** Videos load but don't play.

**Solutions:**
1. Check video file integrity: `ffmpeg -i videos/video.mp4`
2. Verify video codec compatibility (H.264 is most compatible)
3. Check browser console for CORS or loading errors
4. Ensure Nginx is configured correctly for video streaming (if using)

### System Status Not Loading

**Problem:** Status dashboard shows "Error" or no data.

**Solutions:**
1. Verify `/api/status` endpoint works: `curl http://localhost:3000/api/status`
2. Check `lib/system.js` exists and is readable
3. Verify system commands are available (`cat /etc/os-release`, etc.)
4. Check server logs for errors

### Nginx Issues

**Problem:** Nginx reverse proxy not working.

**Solutions:**
1. Test Nginx configuration: `sudo nginx -t`
2. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify Node.js server is running on port 3000
4. Check firewall settings: `sudo ufw status`

---

## 💻 Development Notes

### How Dynamic Video Loading Works

1. **Backend (`server.js`)**:
   - `/api/videos` endpoint reads the `videos/` directory using Node.js `fs` module
   - Filters files by video extensions
   - Returns JSON array with video metadata

2. **Frontend (`index.html`)**:
   - JavaScript `fetch()` calls `/api/videos` on page load
   - Dynamically generates HTML for each video card
   - Uses template literals to create video elements

### Extending the Application

#### Adding New Video Formats

Edit `server.js`, line ~37:

```javascript
const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']; // Add .mkv
```

#### Customizing Video Titles

Modify the title generation in `server.js`:

```javascript
const title = path.basename(file, path.extname(file))
  .replace(/-/g, ' ')  // Replace dashes with spaces
  .replace(/_/g, ' ');  // Replace underscores with spaces
```

#### Adding Video Metadata

Extend the API response to include file size, duration, etc.:

```javascript
const stats = await fs.stat(path.join(videosDir, file));
return {
  filename: file,
  path: videoPath,
  title: title,
  size: stats.size,
  modified: stats.mtime
};
```

### Security Considerations

- **File Access**: Currently serves all files in `videos/` folder. Consider adding authentication.
- **Path Traversal**: The API validates file paths, but consider additional sanitization.
- **CORS**: Configure CORS headers if accessing from different domains.
- **Rate Limiting**: Consider adding rate limiting for API endpoints in production.

### Performance Optimization

- **Video Thumbnails**: Consider generating thumbnails instead of loading full videos for preview
- **Caching**: Implement browser caching for static assets
- **CDN**: Use CDN for video delivery in production
- **Compression**: Enable gzip compression in Nginx

---

## 📝 License

This project is developed for educational purposes as part of a university course.

---

## 🤝 Contributing

This is an educational project. For improvements or bug fixes, please create an issue or submit a pull request.

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review server logs: `tail -f` (if logging is enabled)
3. Check browser console for frontend errors

---

**Happy Streaming! 🎥**
