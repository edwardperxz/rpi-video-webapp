#!/bin/bash

# Make sure we're running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Install Nginx if not already installed
if ! command -v nginx &> /dev/null; then
    apt-get update
    apt-get install -y nginx
fi

# Stop Nginx to make changes
systemctl stop nginx

# Backup existing default config
if [ -f /etc/nginx/sites-enabled/default ]; then
    mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.backup
fi

# Copy our configuration
cp nginx.conf /etc/nginx/sites-available/rpi-video-webapp
ln -sf /etc/nginx/sites-available/rpi-video-webapp /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

if [ $? -eq 0 ]; then
    # Start Nginx if test was successful
    systemctl start nginx
    echo "Nginx configuration updated and service restarted successfully!"
    echo "Your application should now be accessible on port 80"
else
    # Restore backup if test failed
    echo "Nginx configuration test failed. Rolling back changes..."
    if [ -f /etc/nginx/sites-enabled/default.backup ]; then
        mv /etc/nginx/sites-enabled/default.backup /etc/nginx/sites-enabled/default
    fi
    systemctl start nginx
fi