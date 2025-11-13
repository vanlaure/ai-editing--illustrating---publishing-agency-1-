import React, { useEffect, useState } from 'react';
import { AppView } from '../types';
import { BarChartIcon, BookUpIcon, FilePenIcon, HeadphonesIcon, ImageIcon, MegaphoneIcon, SettingsIcon, VwaLogo } from './icons/IconDefs';

interface ProjectSummary {
    id: string;
    title: string;
    clientName?: string;
}

interface NavbarProps {
    activeView: AppView;
    setActiveView: (view: AppView) => void;
    activeProjectId?: string | null;
    onProjectChange?: (projectId: string | null) => void;
}

const NavButton: React.FC<{
    label: string;
    view: AppView;
    activeView: AppView;
    onClick: (view: AppView) => void;
    Icon: React.FC<any>;
}> = ({ label, view, activeView, onClick, Icon }) => {
    const isActive = activeView === view;
    return (
        <button
            onClick={() => onClick(view)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                isActive 
                ? 'bg-brand-primary/20 text-brand-primary' 
                : 'text-brand-text-secondary hover:bg-brand-border hover:text-brand-text'
            }`}
        >
            <Icon className="w-5 h-5" />
            {label}
        </button>
    );
};

export const Navbar: React.FC<NavbarProps> = ({
    activeView,
    setActiveView,
    activeProjectId,
    onProjectChange,
}) => {
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);

    useEffect(() => {
        if (!onProjectChange) return;
        const load = async () => {
            setIsLoadingProjects(true);
            try {
                const res = await fetch('/api/projects');
                if (!res.ok) return;
                const data = await res.json();
                const mapped: ProjectSummary[] = (data.projects || []).map((p: any) => ({
                    id: p.id,
                    title: p.title,
                    clientName: p.clientName || p.client?.name,
                }));
                setProjects(mapped);
            } catch {
                // best-effort only
            } finally {
                setIsLoadingProjects(false);
            }
        };
        load();
    }, [onProjectChange]);

    const handleCreateProject = async () => {
        if (!onProjectChange) return;
        const title = window.prompt('Project title');
        const clientName = window.prompt('Client name');
        if (!title || !clientName) return;
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, clientName }),
            });
            if (!res.ok) {
                alert('Failed to create project');
                return;
            }
            const data = await res.json();
            const project = data.project;
            const summary: ProjectSummary = {
                id: project.id,
                title: project.title,
                clientName: project.clientName,
            };
            setProjects((prev) => [summary, ...prev]);
            onProjectChange(project.id);
        } catch {
            alert('Failed to create project');
        }
    };

    return (
        <nav className="flex-shrink-0 bg-brand-surface p-2 flex items-center justify-between no-print border-b border-brand-border">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <VwaLogo className="w-8 h-8 text-brand-primary" />
                    <span className="font-bold text-lg hidden sm:inline">AI Agency</span>
                </div>
                <div className="w-px h-6 bg-brand-border"></div>
                <div className="flex items-center gap-1">
                    <NavButton label="Editing" view="editing" activeView={activeView} onClick={setActiveView} Icon={FilePenIcon} />
                    <NavButton label="Illustration" view="illustration" activeView={activeView} onClick={setActiveView} Icon={ImageIcon} />
                    <NavButton label="Audiobooks" view="audiobooks" activeView={activeView} onClick={setActiveView} Icon={HeadphonesIcon} />
                    <NavButton label="Publishing" view="publishing" activeView={activeView} onClick={setActiveView} Icon={BookUpIcon} />
                    <NavButton label="Marketing" view="marketing" activeView={activeView} onClick={setActiveView} Icon={MegaphoneIcon} />
                </div>
            </div>
            <div className="flex items-center gap-3">
                {onProjectChange && (
                    <div className="flex items-center gap-1 text-[10px] text-brand-text-secondary">
                        <span className="hidden sm:inline">Project:</span>
                        <select
                            className="bg-brand-surface border border-brand-border px-2 py-1 rounded-md text-[10px] text-brand-text"
                            value={activeProjectId || ''}
                            onChange={(e) => onProjectChange(e.target.value || null)}
                        >
                            <option value="">{projects.length ? 'All / None' : 'No projects'}</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.title}{p.clientName ? ` · ${p.clientName}` : ''}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={handleCreateProject}
                            className="px-2 py-1 rounded-md border border-brand-primary text-brand-primary text-[9px] hover:bg-brand-primary/10"
                            disabled={isLoadingProjects}
                        >
                            {isLoadingProjects ? '...' : 'New'}
                        </button>
                    </div>
                )}
                <div className="flex items-center gap-1">
                    <NavButton label="Statistics" view="statistics" activeView={activeView} onClick={setActiveView} Icon={BarChartIcon} />
                    <NavButton label="Settings" view="settings" activeView={activeView} onClick={setActiveView} Icon={SettingsIcon} />
                </div>
            </div>
        </nav>
    );
};