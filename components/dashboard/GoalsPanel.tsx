import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TargetIcon,
  PlusIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  CalendarIcon,
  FlagIcon,
  XIcon,
  EditIcon,
  Trash2Icon,
} from '../icons/IconDefs';

interface Goal {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly' | 'project' | 'custom';
  target: number;
  current: number;
  unit: string;
  deadline?: Date;
  createdAt: Date;
  completedAt?: Date;
  status: 'active' | 'completed' | 'overdue';
  description?: string;
}

interface Milestone {
  id: string;
  goalId: string;
  title: string;
  targetValue: number;
  completedAt?: Date;
  reward?: string;
}

export const GoalsPanel: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Daily Writing Streak',
      type: 'daily',
      target: 1000,
      current: 750,
      unit: 'words',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      status: 'active',
    },
    {
      id: '2',
      title: 'Complete Novel Draft',
      type: 'project',
      target: 80000,
      current: 45200,
      unit: 'words',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: 'active',
      description: 'First draft of sci-fi novel',
    },
    {
      id: '3',
      title: 'Weekly Chapter Goal',
      type: 'weekly',
      target: 3,
      current: 3,
      unit: 'chapters',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      completedAt: new Date(),
      status: 'completed',
    },
  ]);

  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: 'm1', goalId: '2', title: '25% Complete', targetValue: 20000, completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    { id: 'm2', goalId: '2', title: '50% Complete', targetValue: 40000, completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { id: 'm3', goalId: '2', title: '75% Complete', targetValue: 60000 },
    { id: 'm4', goalId: '2', title: 'Final Draft', targetValue: 80000, reward: '🎉 Celebrate!' },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const getProgressPercentage = (goal: Goal) => {
    return Math.min((goal.current / goal.target) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDeadline = (deadline?: Date) => {
    if (!deadline) return null;
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days < 0) return 'Overdue';
    if (days === 0) return `${hours}h remaining`;
    if (days === 1) return '1 day remaining';
    return `${days} days remaining`;
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-brand-text flex items-center gap-2">
            <TargetIcon className="w-6 h-6" />
            Goals & Milestones
          </h2>
          <p className="text-sm text-brand-text-secondary mt-1">
            Track your progress and celebrate achievements
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg font-medium transition-all shadow-sm"
        >
          <PlusIcon className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-brand-surface/80 border border-brand-border/80 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <TargetIcon className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-text">{activeGoals.length}</p>
              <p className="text-xs text-brand-text-secondary">Active Goals</p>
            </div>
          </div>
        </div>

        <div className="bg-brand-surface/80 border border-brand-border/80 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-text">{completedGoals.length}</p>
              <p className="text-xs text-brand-text-secondary">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-brand-surface/80 border border-brand-border/80 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <TrendingUpIcon className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-text">
                {Math.round(activeGoals.reduce((acc, g) => acc + getProgressPercentage(g), 0) / activeGoals.length || 0)}%
              </p>
              <p className="text-xs text-brand-text-secondary">Avg Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-brand-surface/80 border border-brand-border/80 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <FlagIcon className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-text">
                {milestones.filter(m => m.completedAt).length}
              </p>
              <p className="text-xs text-brand-text-secondary">Milestones Hit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Goals */}
      <div>
        <h3 className="text-lg font-semibold text-brand-text mb-4 flex items-center gap-2">
          <TargetIcon className="w-5 h-5" />
          Active Goals
        </h3>
        <div className="space-y-3">
          {activeGoals.map((goal) => {
            const progress = getProgressPercentage(goal);
            const goalMilestones = milestones.filter(m => m.goalId === goal.id);
            
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-brand-surface/80 border border-brand-border/80 rounded-xl p-5 hover:border-brand-primary/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg font-semibold text-brand-text">{goal.title}</h4>
                      <span className="px-2 py-1 bg-brand-primary/20 text-brand-primary text-xs rounded-full font-medium">
                        {goal.type}
                      </span>
                    </div>
                    {goal.description && (
                      <p className="text-sm text-brand-text-secondary">{goal.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-brand-surface-hover rounded-lg transition-colors">
                      <EditIcon className="w-4 h-4 text-brand-text-secondary" />
                    </button>
                    <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2Icon className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-brand-text-secondary">
                      {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
                    </span>
                    <span className="font-semibold text-brand-text">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-brand-surface rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={`h-full ${getProgressColor(progress)} relative`}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </motion.div>
                  </div>
                </div>

                {/* Milestones */}
                {goalMilestones.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-brand-text-secondary uppercase mb-2">Milestones</p>
                    <div className="flex gap-2 flex-wrap">
                      {goalMilestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                            milestone.completedAt
                              ? 'bg-green-500/20 text-green-500'
                              : goal.current >= milestone.targetValue
                              ? 'bg-yellow-500/20 text-yellow-500'
                              : 'bg-brand-surface text-brand-text-secondary'
                          }`}
                        >
                          {milestone.completedAt && <CheckCircleIcon className="w-3 h-3" />}
                          {milestone.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deadline */}
                {goal.deadline && (
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="w-4 h-4 text-brand-text-secondary" />
                    <span className={`${
                      goal.status === 'overdue' ? 'text-red-500' : 'text-brand-text-secondary'
                    }`}>
                      {formatDeadline(goal.deadline)}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}

          {activeGoals.length === 0 && (
            <div className="bg-brand-surface/50 border border-dashed border-brand-border/60 rounded-xl p-8 text-center">
              <TargetIcon className="w-12 h-12 text-brand-text-secondary mx-auto mb-3 opacity-50" />
              <p className="text-brand-text-secondary mb-2">No active goals</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-sm text-brand-primary hover:text-brand-primary-hover font-medium"
              >
                Create your first goal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-brand-text mb-4 flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
            Completed Goals
          </h3>
          <div className="space-y-2">
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                className="bg-brand-surface/50 border border-brand-border/60 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-brand-text">{goal.title}</p>
                    <p className="text-xs text-brand-text-secondary">
                      Completed {goal.completedAt?.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-brand-text-secondary">
                  {goal.target.toLocaleString()} {goal.unit}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};