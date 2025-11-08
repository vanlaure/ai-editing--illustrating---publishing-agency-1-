import { useCallback, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AudiobookProject } from '../types';

export interface ProjectMilestone {
  id: string;
  projectId: string;
  label: string;
  stage: AudiobookProject['status'];
  detail?: string;
  createdAt: Date;
}

export interface ProjectOpsSnapshot {
  projects: AudiobookProject[];
  milestoneMap: Record<string, ProjectMilestone[]>;
  activeStages: Record<string, AudiobookProject['status']>;
  lastUpdated: Date | null;
}

interface UseProjectOpsResult {
  projects: AudiobookProject[];
  milestoneMap: Record<string, ProjectMilestone[]>;
  snapshot: ProjectOpsSnapshot;
  createProject: (project: AudiobookProject) => void;
  updateProject: (projectId: string, updates: Partial<AudiobookProject>) => {
    stageChange?: { from: AudiobookProject['status']; to: AudiobookProject['status']; title: string };
  };
  deleteProject: (projectId: string) => void;
  addMilestone: (projectId: string, stage: AudiobookProject['status'], label: string, detail?: string) => void;
}

export const useProjectOps = (seedProjects: AudiobookProject[] = []): UseProjectOpsResult => {
  const [projects, setProjects] = useState<AudiobookProject[]>(seedProjects);
  const [milestoneMap, setMilestoneMap] = useState<Record<string, ProjectMilestone[]>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const addMilestone = useCallback((projectId: string, stage: AudiobookProject['status'], label: string, detail?: string) => {
    const milestone: ProjectMilestone = {
      id: uuidv4(),
      projectId,
      label,
      stage,
      detail,
      createdAt: new Date(),
    };
    setMilestoneMap(prev => ({
      ...prev,
      [projectId]: [milestone, ...(prev[projectId] || [])],
    }));
    setLastUpdated(new Date());
  }, []);

  const createProject = useCallback((project: AudiobookProject) => {
    setProjects(prev => [...prev, project]);
    addMilestone(project.id, project.status, 'Project created');
  }, [addMilestone]);

  const updateProject = useCallback((projectId: string, updates: Partial<AudiobookProject>) => {
    let stageChange: { from: AudiobookProject['status']; to: AudiobookProject['status']; title: string } | undefined;
    setProjects(prev =>
      prev.map(project => {
        if (project.id !== projectId) return project;
        if (updates.status && updates.status !== project.status) {
          stageChange = { from: project.status, to: updates.status, title: project.title };
        }
        return { ...project, ...updates, updatedAt: new Date() };
      })
    );

    if (stageChange) {
      addMilestone(projectId, stageChange.to, 'Stage advanced', `${stageChange.from} → ${stageChange.to}`);
    } else if (updates.status) {
      addMilestone(projectId, updates.status, 'Stage updated');
    }

    return { stageChange };
  }, [addMilestone]);

  const deleteProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(project => project.id !== projectId));
    setMilestoneMap(prev => {
      const clone = { ...prev };
      delete clone[projectId];
      return clone;
    });
    setLastUpdated(new Date());
  }, []);

  const snapshot: ProjectOpsSnapshot = useMemo(() => ({
    projects,
    milestoneMap,
    activeStages: Object.fromEntries(projects.map(project => [project.id, project.status])),
    lastUpdated,
  }), [projects, milestoneMap, lastUpdated]);

  return {
    projects,
    milestoneMap,
    snapshot,
    createProject,
    updateProject,
    deleteProject,
    addMilestone,
  };
};
