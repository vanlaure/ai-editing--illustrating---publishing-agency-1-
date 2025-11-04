import React from 'react';
import type { SongAnalysis } from '../types';

interface BeatTimelineVisualizerProps {
    analysis: SongAnalysis | null;
}

const SECTION_COLORS: { [key: string]: string } = {
    intro: 'bg-blue-500',
    verse: 'bg-green-500',
    chorus: 'bg-brand-magenta',
    bridge: 'bg-yellow-500',
    outro: 'bg-purple-500',
    solo: 'bg-orange-500',
    instrumental: 'bg-teal-500',
    default: 'bg-gray-500',
};

const getSectionColor = (sectionName: string) => {
    const name = sectionName.toLowerCase();
    for (const key in SECTION_COLORS) {
        if (name.includes(key)) {
            return SECTION_COLORS[key];
        }
    }
    return SECTION_COLORS.default;
};

const BeatTimelineVisualizer: React.FC<BeatTimelineVisualizerProps> = ({ analysis }) => {
    if (!analysis || analysis.structure.length === 0) {
        return null;
    }

    const totalDuration = analysis.structure[analysis.structure.length - 1].end;

    return (
        <div className="w-full bg-brand-dark p-4 rounded-lg border border-brand-light-gray mb-8">
            <h4 className="text-lg font-bold text-white mb-3">Beat Timeline</h4>
            <div className="relative w-full h-16 bg-brand-light-gray/50 rounded-md overflow-hidden">
                {/* Sections */}
                {analysis.structure.map((section, index) => {
                    const left = (section.start / totalDuration) * 100;
                    const width = ((section.end - section.start) / totalDuration) * 100;
                    const leftClass = `left-[${left.toFixed(3)}%]`;
                    const widthClass = `w-[${width.toFixed(3)}%]`;
                    return (
                        <div
                            key={`section-${index}`}
                            className={`absolute h-full ${getSectionColor(section.name)} opacity-30 ${leftClass} ${widthClass}`}
                            title={`${section.name} (${section.start.toFixed(1)}s - ${section.end.toFixed(1)}s)`}
                        >
                            <span className="absolute top-1 left-2 text-xs font-bold text-white/70 capitalize">
                                {section.name.replace(/_/g, ' ')}
                            </span>
                        </div>
                    );
                })}
                {/* Beats */}
                {analysis.beats.map((beat, index) => {
                    const left = (beat.time / totalDuration) * 100;
                    const heightPercent = 20 + beat.energy * 60; // Energy affects height
                    const opacityVal = 0.3 + beat.energy * 0.7;
                    const leftClass = `left-[${left.toFixed(3)}%]`;
                    const heightClass = `h-[${heightPercent.toFixed(3)}%]`;
                    const opacityClass = `opacity-[${opacityVal.toFixed(3)}]`;

                    return (
                        <div
                            key={`beat-${index}`}
                            className={`absolute bottom-0 w-px bg-brand-cyan ${leftClass} ${heightClass} ${opacityClass}`}
                            title={`Beat at ${beat.time.toFixed(2)}s`}
                        ></div>
                    );
                })}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs">
                {Object.entries(SECTION_COLORS)
                    .filter(([key]) => key !== 'default' && analysis.structure.some(s => s.name.toLowerCase().includes(key)))
                    .map(([name, color]) => (
                        <div key={name} className="flex items-center space-x-1.5">
                            <div className={`w-3 h-3 rounded-sm ${color}`}></div>
                            <span className="capitalize text-gray-300">{name}</span>
                        </div>
                ))}
            </div>
        </div>
    );
};

export default BeatTimelineVisualizer;
