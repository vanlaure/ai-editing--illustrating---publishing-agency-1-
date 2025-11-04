const fs = require('fs').promises;
const path = require('path');

const SERVER_URL = 'http://localhost:3002';
const COMFYUI_URL = 'http://localhost:8188';

// Test storyboard card
const testCard = {
  imageUrl: null, // Will be populated from existing image
  prompt: "cinematic slow motion, camera panning right, dramatic lighting, city skyline at sunset",
  negative_prompt: "blurry, low quality, distorted, deformed, jerky motion",
  duration: 3,
  camera_motion: "pan_right",
  width: 512,
  height: 512
};

async function getTestImage() {
  try {
    // Find an existing test image from outputs
    const outputsDir = path.join(__dirname, 'outputs');
    const files = await fs.readdir(outputsDir);
    const imageFile = files.find(f => f.endsWith('.png') && !f.includes('frames'));
    
    if (imageFile) {
      const imagePath = path.join(outputsDir, imageFile);
      const imageBuffer = await fs.readFile(imagePath);
      return `data:image/png;base64,${imageBuffer.toString('base64')}`;
    }
    
    throw new Error('No test image found in outputs directory');
  } catch (error) {
    console.error('Error loading test image:', error);
    throw error;
  }
}

async function testVideoGeneration(quality) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing ${quality.toUpperCase()} quality video generation`);
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    const requestBody = {
      ...testCard,
      quality
    };
    
    console.log(`\nRequest body:`, {
      ...requestBody,
      imageUrl: requestBody.imageUrl ? `${requestBody.imageUrl.substring(0, 50)}...` : 'null'
    });
    
    console.log(`\nSending request to ${SERVER_URL}/api/comfyui/generate-video-clip...`);
    
    const response = await fetch(`${SERVER_URL}/api/comfyui/generate-video-clip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`\n✅ SUCCESS (${elapsedTime}s)`);
    console.log(`Video URL: ${result.videoUrl}`);
    console.log(`Prompt ID: ${result.promptId}`);
    
    if (result.frameUrl) {
      console.log(`Frame URL: ${result.frameUrl}`);
    }
    
    return result;
    
  } catch (error) {
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n❌ FAILED (${elapsedTime}s)`);
    console.error(`Error: ${error.message}`);
    throw error;
  }
}

async function checkComfyUIHealth() {
  try {
    console.log('Checking ComfyUI health...');
    const response = await fetch(`${SERVER_URL}/api/comfyui/health`);
    const data = await response.json();
    
    if (data.available) {
      console.log('✅ ComfyUI is available');
      console.log(`   Queue running: ${data.queue_running || 0}`);
      console.log(`   Queue pending: ${data.queue_pending || 0}`);
      return true;
    } else {
      console.log('❌ ComfyUI is not available');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to check ComfyUI health:', error.message);
    return false;
  }
}

async function checkHunyuanVideoNodes() {
  try {
    console.log('\nChecking HunyuanVideo nodes...');
    const response = await fetch(`${COMFYUI_URL}/object_info`);
    const objectInfo = await response.json();
    
    const hunyuanNodes = Object.keys(objectInfo).filter(key => 
      key.toLowerCase().includes('hunyu')
    );
    
    if (hunyuanNodes.length > 0) {
      console.log(`✅ Found ${hunyuanNodes.length} HunyuanVideo nodes:`);
      hunyuanNodes.forEach(node => console.log(`   - ${node}`));
      return true;
    } else {
      console.log('❌ No HunyuanVideo nodes found');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to check HunyuanVideo nodes:', error.message);
    return false;
  }
}

async function main() {
  console.log('\n🎬 Video Generation Mode Test\n');
  
  // Check ComfyUI health
  const isHealthy = await checkComfyUIHealth();
  if (!isHealthy) {
    console.error('\n❌ ComfyUI is not available. Please start ComfyUI and try again.');
    process.exit(1);
  }
  
  // Check HunyuanVideo nodes
  const hasHunyuanNodes = await checkHunyuanVideoNodes();
  
  // Load test image
  console.log('\nLoading test image...');
  testCard.imageUrl = await getTestImage();
  console.log('✅ Test image loaded');
  
  // Test Draft mode (AnimateDiff)
  let draftResult;
  try {
    draftResult = await testVideoGeneration('draft');
  } catch (error) {
    console.error('\nDraft mode test failed:', error.message);
  }
  
  // Test High Quality mode (HunyuanVideo) - only if nodes are available
  let highQualityResult;
  if (hasHunyuanNodes) {
    try {
      highQualityResult = await testVideoGeneration('high');
    } catch (error) {
      console.error('\nHigh quality mode test failed:', error.message);
    }
  } else {
    console.log('\n⚠️  Skipping High Quality mode test (HunyuanVideo nodes not available)');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Draft mode (AnimateDiff):     ${draftResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`High quality mode (HunyuanVideo): ${hasHunyuanNodes ? (highQualityResult ? '✅ PASSED' : '❌ FAILED') : '⚠️  SKIPPED'}`);
  
  if (draftResult) {
    console.log(`\nDraft video: ${draftResult.videoUrl}`);
  }
  if (highQualityResult) {
    console.log(`High quality video: ${highQualityResult.videoUrl}`);
  }
  
  console.log('\n✅ Tests complete\n');
}

main().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});