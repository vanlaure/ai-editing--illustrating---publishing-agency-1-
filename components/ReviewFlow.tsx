import React from 'react';
import { CheckIcon } from './icons/IconDefs';

type StepStatus = 'pending' | 'in-progress' | 'complete';

interface ReviewFlowStep {
  id: 'Assistant' | 'Editor' | 'Expert';
  label: string;
  description: string;
  status: StepStatus;
  outstanding?: number;
}

interface ReviewFlowProps {
  steps: ReviewFlowStep[];
  activeStep: string;
  onStepSelect: (stepId: ReviewFlowStep['id']) => void;
}

const statusBadgeStyles: Record<StepStatus, string> = {
  complete: 'bg-brand-primary text-white border-brand-primary',
  'in-progress': 'bg-brand-primary/10 text-brand-primary border-brand-primary/40',
  pending: 'bg-brand-border text-brand-text-secondary border-brand-border',
};

const statusLabels: Record<StepStatus, string> = {
  complete: 'Complete',
  'in-progress': 'In Progress',
  pending: 'Next Up',
};

export const ReviewFlow: React.FC<ReviewFlowProps> = ({ steps, activeStep, onStepSelect }) => {
  return (
    <div className="border-b border-brand-border bg-brand-surface/70 px-4 py-3 space-y-2">
      <p className="text-[10px] uppercase tracking-wide text-brand-text-secondary font-semibold">Systemized Review Flow</p>
      <div className="space-y-2">
        {steps.map((step, index) => {
          const isActive = activeStep === step.id;
          const badgeClasses = statusBadgeStyles[step.status];
          return (
            <button
              key={step.id}
              onClick={() => onStepSelect(step.id)}
              className={`w-full flex items-start gap-3 rounded-md border px-3 py-2 text-left transition-colors ${isActive ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border/70 hover:bg-brand-border/50'}`}
            >
              <span className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold ${badgeClasses}`}>
                {step.status === 'complete' ? <CheckIcon className="w-4 h-4" /> : index + 1}
              </span>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-brand-text">{step.label}</p>
                  {step.outstanding ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-border text-brand-text-secondary">
                      {step.outstanding} pending
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-brand-text-secondary">{step.description}</p>
                <p className="text-[10px] text-brand-text-muted uppercase">{statusLabels[step.status]}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

