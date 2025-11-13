import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.tsx';
import './index.css';

// Validate environment on app startup
import { validateEnvironment, logEnvErrors, hasCriticalErrors } from './utils/envValidation';

const errors = validateEnvironment();
logEnvErrors(errors);

if (hasCriticalErrors(errors)) {
  console.error('🚨 Critical environment errors detected. Application cannot start safely.');
  console.error('Please configure the required environment variables and restart.');

  // Show critical error UI
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <svg className="w-8 h-8 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h1 className="text-xl font-bold text-red-800">Configuration Error</h1>
        </div>
        <div className="space-y-2 mb-6">
          {errors.map((error, index) => (
            <div key={index} className="text-sm text-red-700">
              <strong>{error.variable}:</strong> {error.message}
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-600">
          <p className="mb-2">Please check your environment configuration:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>For client: Update .env.local file</li>
            <li>For server: Update server/.env file</li>
            <li>Restart the application after configuration</li>
          </ul>
        </div>
      </div>
    </div>
  );
} else {
  // Normal app startup
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}