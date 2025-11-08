
import React, { useState } from 'react';

interface WritingGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetGoal: (goal: number) => void;
  currentGoal: number;
}

export const WritingGoalModal: React.FC<WritingGoalModalProps> = ({ isOpen, onClose, onSetGoal, currentGoal }) => {
  const [goal, setGoal] = useState(currentGoal);

  const handleSetGoal = () => {
    onSetGoal(goal);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print" onClick={onClose}>
      <div className="bg-brand-surface rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Set Writing Goal</h2>
        <p className="text-sm text-brand-text-secondary mb-4">Set a target word count for your document. Your progress will be tracked in the status bar.</p>
        <div>
          <label htmlFor="word-goal" className="block text-sm font-medium text-brand-text-secondary">Word Count Goal</label>
          <input
            type="number"
            id="word-goal"
            value={goal}
            onChange={(e) => setGoal(parseInt(e.target.value, 10) || 0)}
            className="w-full mt-1 p-2 border border-brand-border rounded-md bg-brand-bg"
            min="0"
            step="50"
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-md font-semibold bg-brand-border hover:bg-brand-border/70">Cancel</button>
          <button onClick={handleSetGoal} className="px-4 py-2 rounded-md font-semibold bg-brand-primary text-white hover:bg-brand-primary-hover">Set Goal</button>
        </div>
      </div>
    </div>
  );
};
