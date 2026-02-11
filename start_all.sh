#!/bin/bash

echo "Starting AI Music Video Application Suite..."
echo "============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker first."
    exit 1
fi

echo "Starting Docker services..."
docker-compose up -d

echo "Waiting for Docker services to initialize..."
sleep 10

echo "Starting Backend Server..."
cd server
PORT=3002 npm start &
BACKEND_PID=$!
cd ..

echo "Waiting for backend to initialize..."
sleep 5

echo "Starting Frontend Application..."
npm run dev &
FRONTEND_PID=$!

echo "Starting StitchStream Studio (port 4100)..."
cd stitchstream
PORT=4100 npm run dev -- --host --port 4100 &
STITCH_PID=$!
cd ..

echo ""
echo "All services started!"
echo ""
echo "Access Points:"
echo "   Main App: http://localhost:4001"
echo "   ComfyUI: http://localhost:8188"
echo "   Backend API: http://localhost:3002"
echo "   Automatic1111: http://localhost:7860"
echo "   StitchStream: http://localhost:4100"
echo "   n8n: http://localhost:5678"
echo ""
echo "To stop all services:"
echo "   docker-compose down"
echo "   kill $BACKEND_PID $FRONTEND_PID $STITCH_PID"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for user interrupt
wait
