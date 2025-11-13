#!/bin/bash

# Download Juggernaut XL v9 Rdphoto2 Lightning Model
# This script downloads the ultra-realistic SDXL model for improved image quality

set -e

MODEL_DIR="models/Stable-diffusion"
MODEL_NAME="juggernautXL_v9Rdphoto2Lightning.safetensors"
MODEL_URL="https://civitai.com/api/download/models/456194"

# Create directory if it doesn't exist
mkdir -p "$MODEL_DIR"

echo "=========================================="
echo "Downloading Juggernaut XL v9 Lightning"
echo "=========================================="
echo "Model: $MODEL_NAME"
echo "Size: ~6.5GB"
echo "This may take 10-30 minutes depending on connection"
echo ""

# Check if model already exists
if [ -f "$MODEL_DIR/$MODEL_NAME" ]; then
    echo "⚠️  Model already exists: $MODEL_DIR/$MODEL_NAME"
    read -p "Do you want to re-download? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "✅ Using existing model"
        exit 0
    fi
    echo "Re-downloading..."
fi

# Download with progress bar
echo "📥 Downloading model..."
cd "$MODEL_DIR"

# Try wget first
if command -v wget &> /dev/null; then
    wget --content-disposition --progress=bar:force:noscroll -O "$MODEL_NAME" "$MODEL_URL"
# Fallback to curl
elif command -v curl &> /dev/null; then
    curl -L -o "$MODEL_NAME" --progress-bar "$MODEL_URL"
else
    echo "❌ Error: Neither wget nor curl is installed"
    echo ""
    echo "Manual download instructions:"
    echo "1. Visit: https://civitai.com/models/133005/juggernaut-xl"
    echo "2. Download the 'v9 Rdphoto2 Lightning' version"
    echo "3. Save to: $MODEL_DIR/$MODEL_NAME"
    exit 1
fi

# Verify download
if [ -f "$MODEL_NAME" ]; then
    FILE_SIZE=$(du -h "$MODEL_NAME" | cut -f1)
    echo ""
    echo "✅ Download complete!"
    echo "   File: $MODEL_NAME"
    echo "   Size: $FILE_SIZE"
    echo ""
    echo "Next steps:"
    echo "1. Restart Docker containers: docker-compose restart automatic1111 comfyui"
    echo "2. Restart backend: npm run stack:backend"
    echo "3. Test generation in the app"
else
    echo "❌ Download failed"
    echo ""
    echo "Manual download instructions:"
    echo "1. Visit: https://civitai.com/models/133005/juggernaut-xl"
    echo "2. Download the 'v9 Rdphoto2 Lightning' version"
    echo "3. Save to: $MODEL_DIR/$MODEL_NAME"
    exit 1
fi