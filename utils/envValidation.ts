/**
 * Environment variable validation utilities
 */

interface EnvValidationError {
  variable: string;
  message: string;
}

export function validateEnvironment(): EnvValidationError[] {
  const errors: EnvValidationError[] = [];

  // Client-side validation
  if (typeof window !== 'undefined') {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiKey || geminiKey === 'your_actual_gemini_api_key_here') {
      errors.push({
        variable: 'VITE_GEMINI_API_KEY',
        message: 'Missing or placeholder Gemini API key. Get from https://makersuite.google.com/app/apikey'
      });
    }

    const imageBackend = import.meta.env.VITE_IMAGE_BACKEND;
    if (!imageBackend || !['pollinations', 'gemini'].includes(imageBackend)) {
      errors.push({
        variable: 'VITE_IMAGE_BACKEND',
        message: 'Invalid or missing image backend. Must be "pollinations" or "gemini"'
      });
    }
  }

  // Server-side validation
  if (typeof window === 'undefined') {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey === 'your_actual_gemini_api_key_here') {
      errors.push({
        variable: 'GEMINI_API_KEY',
        message: 'Missing or placeholder Gemini API key. Configure in server/.env'
      });
    }

    const port = process.env.PORT;
    if (!port || isNaN(Number(port))) {
      errors.push({
        variable: 'PORT',
        message: 'Invalid or missing PORT. Must be a valid port number'
      });
    }
  }

  return errors;
}

export function logEnvErrors(errors: EnvValidationError[]): void {
  if (errors.length === 0) return;

  console.error('🚨 Environment validation errors:');
  errors.forEach(error => {
    console.error(`  ${error.variable}: ${error.message}`);
  });
  console.error('Please fix these issues before running the application.');
}

export function hasCriticalErrors(errors: EnvValidationError[]): boolean {
  return errors.some(error =>
    error.variable.includes('GEMINI_API_KEY') ||
    error.variable === 'PORT'
  );
}