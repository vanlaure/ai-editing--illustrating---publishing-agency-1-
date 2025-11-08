import React, { useState } from 'react';
import type { AudiobookProject } from '../types';
import { ScriptConversionView } from './ScriptConversionView';
import VoiceTalentView from './VoiceTalentView';
import { RecordingSessionView } from './RecordingSessionView';
import { AudioEditingView } from './AudioEditingView';
import CinematicAudiobookView from './CinematicAudiobookView';
import FormatOutputView from './FormatOutputView';
import DistributionPipelineView from './DistributionPipelineView';
import { MarketingAssetsView } from './MarketingAssetsView';
import { RoyaltyAnalyticsView } from './RoyaltyAnalyticsView';

interface AudiobookViewProps {
  audiobookProjects: AudiobookProject[];
  onUpdateAudiobookProject: (projectId: string, updates: Partial<AudiobookProject>) => void;
  onCreateAudiobookProject: (project: AudiobookProject) => void;
  onDeleteAudiobookProject: (projectId: string) => void;
}

type AudiobookTab = 
  | 'manuscript'
  | 'voice'
  | 'recording'
  | 'editing'
  | 'cinematic'
  | 'format'
  | 'distribution'
  | 'marketing'
  | 'analytics';

export const AudiobookView: React.FC<AudiobookViewProps> = ({
  audiobookProjects,
  onUpdateAudiobookProject,
  onCreateAudiobookProject,
  onDeleteAudiobookProject
}) => {
  const [activeTab, setActiveTab] = useState<AudiobookTab>('manuscript');

  const tabs: { id: AudiobookTab; label: string; icon: string; color: string }[] = [
    { id: 'manuscript', label: 'Script Conversion', icon: '📄', color: 'blue' },
    { id: 'voice', label: 'Voice Talent', icon: '🎙️', color: 'purple' },
    { id: 'recording', label: 'Recording', icon: '🔴', color: 'red' },
    { id: 'editing', label: 'Audio Editing', icon: '🎚️', color: 'green' },
    { id: 'cinematic', label: 'Cinematic Audio', icon: '🎬', color: 'orange' },
    { id: 'format', label: 'Format & Output', icon: '💾', color: 'indigo' },
    { id: 'distribution', label: 'Distribution', icon: '🚀', color: 'pink' },
    { id: 'marketing', label: 'Marketing Assets', icon: '📢', color: 'yellow' },
    { id: 'analytics', label: 'Royalty & Analytics', icon: '📊', color: 'teal' }
  ];

  const featuredProject = audiobookProjects[0] || null;
  const audioPreview = featuredProject?.outputs
    ?.flatMap((output) => output.formats)
    .find((format) => format.fileUrl);
  const marketingClip = featuredProject?.marketing?.assets?.[0];

  const getTabColorClasses = (color: string, isActive: boolean) => {
    if (isActive) {
      return 'bg-brand-primary/10 text-brand-primary border border-brand-primary/40 shadow-sm';
    }
    return 'text-brand-text-secondary hover:text-brand-primary hover:bg-brand-surface/80 border border-transparent';
  };

  return (
    <div className="flex flex-col h-full w-full bg-brand-bg text-brand-text">
      {/* Header */}
      <div className="w-full border-b border-brand-border px-6 py-4 bg-brand-surface/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                <span className="text-lg">🎧</span>
              </div>
              <h1 className="text-xl font-semibold text-brand-text">
                Audiobook Production Suite
              </h1>
            </div>
            <p className="text-xs text-brand-text-secondary">
              Plan, produce, and launch immersive audiobooks with the same unified studio workflow.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-lg bg-brand-elevated/80 border border-brand-border/80">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wide text-brand-text-muted">Projects</span>
                <span className="text-sm font-semibold text-brand-primary">{audiobookProjects.length}</span>
              </div>
              <div className="w-px h-6 bg-brand-border/60" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wide text-brand-text-muted">In Production</span>
                <span className="text-sm font-medium text-brand-text">
                  {audiobookProjects.filter(p =>
                    ['planning', 'scripting', 'recording', 'editing', 'mastering', 'distribution'].includes(p.status)
                  ).length}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                const now = new Date();
                const newProject: AudiobookProject = {
                  id: `audiobook-${Date.now()}`,
                  title: 'New Audiobook Project',
                  author: 'Untitled Author',
                  pricing: 'starter',
                  status: 'planning',
                  createdAt: now,
                  updatedAt: now,
                  recordingSessions: [],
                  editingProjects: [],
                  outputs: []
                };
                onCreateAudiobookProject(newProject);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors shadow-sm"
            >
              <span className="text-base leading-none">＋</span>
              <span>New Audiobook Project</span>
            </button>
          </div>
        </div>

        {featuredProject && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-brand-border/70 bg-brand-elevated/60 p-3 space-y-2">
              <p className="text-xs font-semibold text-brand-text">Now playing</p>
              <p className="text-sm font-semibold text-brand-text">{featuredProject.title}</p>
              {audioPreview?.fileUrl ? (
                <audio controls className="w-full" src={audioPreview.fileUrl}>
                  Audio preview not supported.
                </audio>
              ) : (
                <p className="text-[11px] text-brand-text-secondary">Attach a mastered format to preview the mix directly in the suite.</p>
              )}
              <p className="text-[10px] text-brand-text-muted">
                Formats ready: {featuredProject.outputs?.[0]?.formats?.length || 0}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-border/70 bg-brand-elevated/60 p-3 space-y-2">
              <p className="text-xs font-semibold text-brand-text">Marketing teaser</p>
              {marketingClip ? (
                marketingClip.type === 'waveform-video' || marketingClip.type === 'trailer' ? (
                  <video controls className="w-full rounded" src={marketingClip.assetUrl} />
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-brand-text">{marketingClip.title}</p>
                    <a
                      href={marketingClip.assetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-primary text-[11px] underline"
                    >
                      Open asset on {marketingClip.platform}
                    </a>
                  </div>
                )
              ) : (
                <p className="text-[11px] text-brand-text-secondary">No marketing asset linked yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 overflow-x-auto pb-1 w-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                getTabColorClasses(tab.color, activeTab === tab.id)
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden bg-brand-bg w-full">
        {activeTab === 'manuscript' && (
          <ScriptConversionView
            scripts={audiobookProjects
              .filter(p => p.narrationScript)
              .map(p => p.narrationScript!)}
            onScriptCreate={(script) => {
              if (!audiobookProjects[0]) return;
              onUpdateAudiobookProject(audiobookProjects[0].id, {
                narrationScript: script
              });
            }}
            onScriptUpdate={(id, updates) => {
              const project = audiobookProjects.find(p => p.narrationScript?.id === id);
              if (!project) return;
              onUpdateAudiobookProject(project.id, {
                narrationScript: { ...project.narrationScript!, ...updates }
              });
            }}
            onScriptDelete={(id) => {
              const project = audiobookProjects.find(p => p.narrationScript?.id === id);
              if (!project) return;
              onUpdateAudiobookProject(project.id, { narrationScript: undefined });
            }}
          />
        )}

        {activeTab === 'voice' && (
          <VoiceTalentView
            onClose={() => setActiveTab('manuscript')}
          />
        )}

        {activeTab === 'recording' && (
          <RecordingSessionView
            sessions={audiobookProjects.flatMap(p => p.recordingSessions || [])}
            onUpdateSession={(sessionId, updates) => {
              audiobookProjects.forEach(project => {
                const match = project.recordingSessions.find(s => s.id === sessionId);
                if (match) {
                  const updated = project.recordingSessions.map(s =>
                    s.id === sessionId ? { ...s, ...updates } : s
                  );
                  onUpdateAudiobookProject(project.id, { recordingSessions: updated });
                }
              });
            }}
            onAddSession={(session) => {
              if (!audiobookProjects[0]) return;
              const sessions = [...(audiobookProjects[0].recordingSessions || []), session];
              onUpdateAudiobookProject(audiobookProjects[0].id, { recordingSessions: sessions });
            }}
            onDeleteSession={(sessionId) => {
              audiobookProjects.forEach(project => {
                const has = project.recordingSessions.some(s => s.id === sessionId);
                if (has) {
                  const sessions = project.recordingSessions.filter(s => s.id !== sessionId);
                  onUpdateAudiobookProject(project.id, { recordingSessions: sessions });
                }
              });
            }}
          />
        )}

        {activeTab === 'editing' && (
          <AudioEditingView
            projects={audiobookProjects.flatMap(p => p.editingProjects || [])}
            onAddProject={(editingProject) => {
              if (!audiobookProjects[0]) return;
              const editingProjects = [
                ...(audiobookProjects[0].editingProjects || []),
                editingProject
              ];
              onUpdateAudiobookProject(audiobookProjects[0].id, { editingProjects });
            }}
            onUpdateProject={(id, updates) => {
              audiobookProjects.forEach(project => {
                const has = project.editingProjects.some(e => e.id === id);
                if (has) {
                  const updated = project.editingProjects.map(e =>
                    e.id === id ? { ...e, ...updates } : e
                  );
                  onUpdateAudiobookProject(project.id, { editingProjects: updated });
                }
              });
            }}
            onDeleteProject={(id) => {
              audiobookProjects.forEach(project => {
                const has = project.editingProjects.some(e => e.id === id);
                if (has) {
                  const remaining = project.editingProjects.filter(e => e.id !== id);
                  onUpdateAudiobookProject(project.id, { editingProjects: remaining });
                }
              });
            }}
          />
        )}

        {activeTab === 'cinematic' && (
          <div className="h-full flex items-center justify-center px-6">
            <div className="max-w-xl w-full bg-brand-surface/80 border border-brand-border rounded-2xl p-6 shadow-lg flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 text-brand-primary">
                <span className="text-lg">🎬</span>
                <span className="text-xs font-semibold uppercase tracking-wide">Cinematic Audio Mode</span>
              </div>
              <h2 className="text-lg font-semibold text-brand-text">
                Full-Cast & Spatial Audio Coming Online
              </h2>
              <p className="text-xs text-brand-text-secondary leading-relaxed">
                This workspace will connect your approved voice talent, narration scripts, soundscapes, and music cues
                into a unified cinematic mix. It mirrors the Illustration Studio’s pro-tier flow with style-locked,
                production-safe controls.
              </p>
              <ul className="text-[10px] text-brand-text-secondary space-y-1.5">
                <li>• Map characters to human or AI voices with reusable style profiles.</li>
                <li>• Layer ambient soundscapes and music cues per scene and chapter.</li>
                <li>• Toggle spatial audio and export final cinematic audiobook masters.</li>
              </ul>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[9px] text-brand-text-muted">
                  Integrated with your Audiobook projects · Matches studio UX
                </span>
                <span className="px-2 py-1 text-[9px] rounded-full bg-brand-primary/10 text-brand-primary font-medium">
                  In Design Preview
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'format' && (
          <FormatOutputView
            projects={audiobookProjects}
            onUpdateProject={onUpdateAudiobookProject}
          />
        )}

        {activeTab === 'distribution' && (
          <DistributionPipelineView
            projects={audiobookProjects}
            onUpdateProject={onUpdateAudiobookProject}
          />
        )}

        {activeTab === 'marketing' && (
          <MarketingAssetsView
            projects={audiobookProjects}
            onUpdateProject={onUpdateAudiobookProject}
          />
        )}

        {activeTab === 'analytics' && (
          <RoyaltyAnalyticsView
            projects={audiobookProjects}
            onUpdateProject={onUpdateAudiobookProject}
          />
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="bg-brand-surface/95 border-t border-brand-border px-4 py-2 text-[10px] text-brand-text-secondary flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
            <span className="uppercase tracking-wide text-[9px] text-brand-text-muted">Stage</span>
            <span className="font-medium text-brand-text capitalize">
              {activeTab.replace('-', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="uppercase tracking-wide text-[9px] text-brand-text-muted">Projects</span>
            <span className="font-medium text-brand-text">{audiobookProjects.length}</span>
          </div>
          {audiobookProjects.length > 0 && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="uppercase tracking-wide text-[9px] text-brand-text-muted">In Production</span>
                <span className="font-medium text-brand-text">
                  {audiobookProjects.filter(p =>
                    ['planning', 'scripting', 'recording', 'editing', 'mastering', 'distribution'].includes(p.status)
                  ).length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="uppercase tracking-wide text-[9px] text-brand-text-muted">Live</span>
                <span className="font-medium text-emerald-400">
                  {audiobookProjects.filter(p => p.distribution?.status === 'live').length}
                </span>
              </div>
            </>
          )}
        </div>
        <div className="hidden sm:block text-[9px] text-brand-text-muted">
          Seamless Audiobook pipeline · Matches Illustration & Publishing Studio UX
        </div>
      </div>
    </div>
  );
};
