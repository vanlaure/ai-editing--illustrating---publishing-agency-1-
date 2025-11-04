#!/bin/bash
# Download high-quality SDXL model for better image generation

MODEL_URL="https://huggingface.co/SG161222/RealVisXL_V4.0/resolve/main/RealVisXL_V4.0.safetensors"
MODEL_NAME="realvisxlV40.safetensors"
MODEL_DIR="./models/Stable-diffusion"

echo "Downloading RealVisXL V4.0 (6.46 GB) - Best photorealistic SDXL model..."
echo "This will take several minutes depending on your connection."
echo ""

# Create directory if it doesn't exist
mkdir -p "$MODEL_DIR"

# Download with progress
wget --progress=bar:force:noscroll -O "$MODEL_DIR/$MODEL_NAME" "$MODEL_URL"

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Model downloaded successfully to $MODEL_DIR/$MODEL_NAME"
    echo ""
    echo "Next steps:"
    echo "1. Restart ComfyUI: docker-compose restart comfyui"
    echo "2. The model will be automatically available in ComfyUI"
else
    echo ""
    echo "✗ Download failed. Please check your internet connection and try again."
    exit 1
fi