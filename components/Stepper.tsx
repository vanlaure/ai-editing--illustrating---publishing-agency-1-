import React from 'react';
import { Step } from '../types';

interface StepperProps {
  currentStep: Step;
}

const steps = Object.values(Step);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
  </svg>
);

const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
            {stepIdx < currentIndex ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-brand-cyan" />
                </div>
                <div className="relative w-8 h-8 flex items-center justify-center bg-brand-cyan rounded-full">
                  <CheckIcon />
                </div>
                <span className="absolute top-10 -left-2 text-sm text-gray-300">{step}</span>
              </>
            ) : stepIdx === currentIndex ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-brand-light-gray" />
                </div>
                <div className="relative w-8 h-8 flex items-center justify-center bg-brand-dark border-2 border-brand-cyan rounded-full">
                  <span className="h-2.5 w-2.5 bg-brand-cyan rounded-full" />
                </div>
                <span className="absolute top-10 -left-2 text-sm font-semibold text-brand-cyan">{step}</span>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-brand-light-gray" />
                </div>
                <div className="relative w-8 h-8 flex items-center justify-center bg-brand-dark border-2 border-brand-light-gray rounded-full" />
                <span className="absolute top-10 -left-2 text-sm text-gray-500">{step}</span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Stepper;