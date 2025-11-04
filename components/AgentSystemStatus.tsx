
import React from 'react';
import type { AgentState } from '../types';
import Spinner from './Spinner';

const CheckIcon = () => (
    <svg className="w-6 h-6 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
);

const StatusIndicator: React.FC<{ status: AgentState['status'] }> = ({ status }) => {
    switch (status) {
        case 'working':
            return <Spinner />;
        case 'done':
            return <CheckIcon />;
        case 'idle':
            return <div className="w-5 h-5 border-2 border-gray-500 rounded-full animate-pulse"></div>
        case 'error':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        default:
            return null;
    }
};

const AgentStatusCard: React.FC<{ agent: AgentState }> = ({ agent }) => {
    const statusColor = agent.status === 'done' ? 'text-gray-400' : 'text-white';
    
    return (
        <li className={`flex items-start space-x-4 p-4 rounded-lg transition-all duration-500 ${agent.status !== 'idle' ? 'bg-brand-light-gray/50' : ''}`}>
            <div className="flex-shrink-0 mt-1 h-6 w-6 flex items-center justify-center">
                <StatusIndicator status={agent.status} />
            </div>
            <div>
                <h4 className={`font-bold ${statusColor}`}>{agent.name}</h4>
                <p className="text-sm text-gray-400">{agent.description}</p>
            </div>
        </li>
    );
};

const AgentSystemStatus: React.FC<{ agents: AgentState[] }> = ({ agents }) => {
    return (
        <div className="flex flex-col items-center w-full">
            <h2 className="text-2xl font-bold mb-2 text-white">Engaging Creative AI Agents</h2>
            <p className="text-gray-400 mb-8">Your team of specialized agents is now crafting your storyboard.</p>
            <div className="w-full max-w-lg bg-brand-dark p-6 rounded-xl border border-brand-light-gray">
                <ul className="space-y-4">
                    {agents.map(agent => (
                        <AgentStatusCard key={agent.name} agent={agent} />
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default AgentSystemStatus;
