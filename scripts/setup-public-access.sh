#!/bin/bash

# Script to help set up public access to the game server
# This script helps you get a public URL using ngrok or localtunnel

PORT=${PORT:-3000}

echo "🌐 Setting up public access for Stickfighters game server"
echo "=================================================="
echo ""
echo "Choose a tunneling service:"
echo "1. ngrok (recommended)"
echo "2. localtunnel"
echo "3. Show network IP addresses only"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📦 Installing ngrok..."
        if ! command -v ngrok &> /dev/null; then
            echo "ngrok not found. Please install it from https://ngrok.com/download"
            echo "Or use: npm install -g ngrok"
            exit 1
        fi
        echo ""
        echo "🚀 Starting ngrok tunnel on port $PORT..."
        echo "Your public URL will be displayed below:"
        echo ""
        ngrok http $PORT
        ;;
    2)
        echo ""
        echo "📦 Installing localtunnel..."
        if ! command -v lt &> /dev/null; then
            echo "Installing localtunnel..."
            npm install -g localtunnel
        fi
        echo ""
        echo "🚀 Starting localtunnel on port $PORT..."
        echo "Your public URL will be displayed below:"
        echo ""
        lt --port $PORT
        ;;
    3)
        echo ""
        echo "📡 Network IP addresses:"
        echo "=========================="
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1'
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'
        else
            echo "Please check your network settings for your IP address"
        fi
        echo ""
        echo "Note: These IPs are only accessible on your local network."
        echo "For public internet access, use option 1 or 2."
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

