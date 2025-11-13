/**
 * Server-side environment variable validation utilities
 */

interface EnvValidationError {
  variable: string;
  message: string;
}

export function validateServerEnvironment(): EnvValidationError[] {
  const errors: EnvValidationError[] = [];

  // Server environment validation
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey === 'your_actual_gemini_api_key_here') {
    errors.push({
      variable: 'GEMINI_API_KEY',
      message: 'Missing or placeholder Gemini API key. Set in server/.env file'
    });
  }

  const port = process.env.PORT;
  if (!port || isNaN(Number(port))) {
    errors.push({
      variable: 'PORT',
      message: 'Invalid or missing PORT. Must be a valid port number (default: 4000)'
    });
  }

  return errors;
}

export function logServerEnvErrors(errors: EnvValidationError[]): void {
  if (errors.length === 0) return;

  console.error('🚨 Server environment validation errors:');
  errors.forEach(error => {
    console.error(`  ${error.variable}: ${error.message}`);
  });
  console.error('Please fix these issues before starting the server.');
}

export function hasCriticalServerErrors(errors: EnvValidationError[]): boolean {
  return errors.some(error =>
    error.variable === 'GEMINI_API_KEY' ||
    error.variable === 'PORT'
  );
}