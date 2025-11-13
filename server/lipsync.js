import path from 'path';
import fs from 'fs/promises';
import { promisify } from 'util';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

/**
 * Run a lip-sync engine (Wav2Lip or SadTalker) to sync mouth motion to audio.
 *
 * Environment variables to control integration:
 * - LIPSYNC_ENGINE: 'wav2lip' | 'sadtalker' (default: 'wav2lip')
 * - LIPSYNC_CMD: command template with placeholders {video} {audio} {output}
 *                If provided, overrides engine-specific defaults.
 *                Example (Docker):
 *                docker run --rm -v "{PWD}:/work" wav2lip:latest \
 *                  python3 -m Wav2Lip --face "{video}" --audio "{audio}" --outfile "{output}"
 */
async function runLipSync({ videoPath, audioPath, outputPath }) {
  const engine = (process.env.LIPSYNC_ENGINE || 'wav2lip').toLowerCase();
  const cwd = process.cwd();

  const quote = (p) => `"${p}"`;

  let command;
  if (process.env.LIPSYNC_CMD) {
    command = process.env.LIPSYNC_CMD
      .replace('{video}', videoPath)
      .replace('{audio}', audioPath)
      .replace('{output}', outputPath)
      .replace('{PWD}', cwd);
  } else if (engine === 'sadtalker') {
    // Minimal SadTalker CLI (adjust to your install). This commonly requires a source face image, but
    // here we assume a video-based reenactment wrapper is available. Users should override via LIPSYNC_CMD.
    // Fallback: copy input video unchanged if engine unavailable.
    throw new Error('SadTalker integration requires LIPSYNC_CMD. Set env LIPSYNC_CMD to your SadTalker command.');
  } else {
    // Default to Wav2Lip
    command = `python3 -m Wav2Lip --face ${quote(videoPath)} --audio ${quote(audioPath)} --outfile ${quote(outputPath)}`;
  }

  // Ensure paths exist
  await fs.access(videoPath);
  await fs.access(audioPath);

  console.log(`[LipSync] Running: ${command}`);
  const { stdout, stderr } = await execAsync(command, { windowsHide: true });
  if (stdout) console.log(`[LipSync] stdout:`, stdout.substring(0, 4000));
  if (stderr) console.log(`[LipSync] stderr:`, stderr.substring(0, 4000));

  // Confirm output exists
  await fs.access(outputPath);
  return outputPath;
}

export { runLipSync };

