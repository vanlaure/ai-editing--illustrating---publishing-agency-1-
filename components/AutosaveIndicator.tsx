import React, { useState, useEffect } from 'react';

const Spinner = () => (
  <svg 
    className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4"
    ></circle>
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const CheckIcon = () => (
    <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
    </svg>
);

interface AutosaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved';
}

const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({ status }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<React.ReactNode>(null);

  useEffect(() => {
    if (status === 'saving') {
      setVisible(true);
      setMessage(
        <>
          <Spinner /> Saving...
        </>
      );
    } else if (status === 'saved') {
      setVisible(true);
      setMessage(
        <>
          <CheckIcon /> All changes saved
        </>
      );
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!visible) {
    return null;
  }

  return (
    <div className={`flex items-center text-sm transition-opacity duration-300 ${status === 'saved' ? 'text-green-400' : 'text-gray-400'}`}>
        {message}
    </div>
  );
};

export default AutosaveIndicator;