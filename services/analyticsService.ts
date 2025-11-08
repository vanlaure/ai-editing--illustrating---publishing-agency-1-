import { TelemetrySnapshot } from '../utils/telemetry';

const getEndpoint = () => import.meta.env.VITE_ANALYTICS_ENDPOINT;
const getStudioId = () => import.meta.env.VITE_STUDIO_ID;

export const syncTelemetrySnapshot = async (snapshot: TelemetrySnapshot) => {
  const endpoint = getEndpoint();
  if (!endpoint || typeof fetch === 'undefined') {
    return;
  }

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Studio-ID': getStudioId() || 'local-demo',
      },
      body: JSON.stringify({
        studioId: getStudioId() || 'local-demo',
        capturedAt: new Date().toISOString(),
        snapshot,
      }),
    });
  } catch (error) {
    console.warn('Telemetry sync failed', error);
  }
};
