import React from 'react';
import type { ExecutiveProducerFeedback } from '../types';

const ScoreGauge: React.FC<{ score: number; label: string }> = ({ score, label }) => {
  const percentage = score * 10;
  const circumference = 2 * Math.PI * 20; // 2 * pi * r
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let colorClass = 'text-green-400';
  if (score < 5) colorClass = 'text-red-400';
  else if (score < 8) colorClass = 'text-yellow-400';

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full" viewBox="0 0 50 50">
          <circle
            className="text-brand-light-gray"
            strokeWidth="5"
            stroke="currentColor"
            fill="transparent"
            r="20"
            cx="25"
            cy="25"
          />
          <circle
            className={`transform -rotate-90 origin-center ${colorClass}`}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="20"
            cx="25"
            cy="25"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-2xl font-bold ${colorClass}`}>
          {score}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold text-gray-300">{label}</p>
    </div>
  );
};

interface ExecutiveProducerFeedbackDisplayProps {
  feedback: ExecutiveProducerFeedback;
}

const ExecutiveProducerFeedbackDisplay: React.FC<ExecutiveProducerFeedbackDisplayProps> = ({ feedback }) => {
  return (
    <div className="bg-brand-dark/50 rounded-lg border border-brand-light-gray p-6">
      <div className="flex items-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-cyan mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <h3 className="text-xl font-bold text-white">Executive Producer's Final Review</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center justify-around bg-brand-light-gray/50 p-4 rounded-lg">
            <ScoreGauge score={feedback.pacing_score} label="Pacing & Rhythm" />
            <ScoreGauge score={feedback.narrative_score} label="Narrative Arc" />
            <ScoreGauge score={feedback.consistency_score} label="Visual Consistency" />
        </div>
        <div className="bg-brand-light-gray/50 p-4 rounded-lg">
             <h4 className="font-semibold text-gray-300 mb-2">Final Notes:</h4>
             <p className="text-gray-300 text-sm leading-relaxed">{feedback.final_notes}</p>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveProducerFeedbackDisplay;