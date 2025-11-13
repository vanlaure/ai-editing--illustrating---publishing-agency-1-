import { AiTaskConfig, AiTaskId } from '../types';

/**
 * Central AI configuration per logical task.
 * All model choices and tuning live here.
 */
const TASK_CONFIG: Record<AiTaskId, AiTaskConfig> = {
  'editing.compliance': {
    model: 'gemini-2.5-pro',
    temperature: 0.2,
    maxOutputTokens: 2048,
  },
  'editing.costPlan': {
    model: 'gemini-2.5-pro',
    temperature: 0.3,
    maxOutputTokens: 2048,
  },
  'editing.scenario': {
    model: 'gemini-2.5-pro',
    temperature: 0.4,
    maxOutputTokens: 3072,
  },
  'editing.seriesBible': {
    model: 'gemini-2.5-pro',
    temperature: 0.25,
    maxOutputTokens: 4096,
  },
  'illustration.brief': {
    model: 'gemini-2.5-pro',
    temperature: 0.6,
    maxOutputTokens: 2048,
  },
  'publishing.metadata': {
    model: 'gemini-2.5-pro',
    temperature: 0.3,
    maxOutputTokens: 2048,
  },
  'publishing.exports': {
    model: 'gemini-2.5-pro',
    temperature: 0.1,
    maxOutputTokens: 1024,
  },
  'marketing.campaign': {
    model: 'gemini-2.5-pro',
    temperature: 0.6,
    maxOutputTokens: 2048,
  },
  'marketing.scenario': {
    model: 'gemini-2.5-pro',
    temperature: 0.5,
    maxOutputTokens: 2048,
  },
};

/**
 * Returns the configuration for a given AI task.
 * Falls back to a safe default if not explicitly configured.
 */
export const getAiConfig = (task: AiTaskId | string): AiTaskConfig => {
  const cfg = TASK_CONFIG[task as AiTaskId];
  if (cfg) return cfg;
  return {
    model: 'gemini-2.5-pro',
    temperature: 0.4,
    maxOutputTokens: 2048,
  };
};