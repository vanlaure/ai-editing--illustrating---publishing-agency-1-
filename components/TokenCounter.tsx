

import React from 'react';
import type { TokenUsage } from '../types';

const TokenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
    </svg>
);

interface TokenCounterProps {
    tokenUsage: TokenUsage;
}

const TokenCounter: React.FC<TokenCounterProps> = ({ tokenUsage }) => {
    // FIX: Explicitly cast the result of Object.values to number[] to ensure correct type inference for the reduce operation.
    const totalTokens = (Object.values(tokenUsage) as number[]).reduce((sum, val) => sum + (val || 0), 0);

    // This is a simplified, blended rate for estimation purposes.
    // Real-world pricing is more nuanced (e.g., input vs. output, model-specific rates).
    const COST_PER_MILLION_TOKENS = 1.00; 
    const estimatedCost = (totalTokens / 1_000_000) * COST_PER_MILLION_TOKENS;

    const formattedTokens = new Intl.NumberFormat().format(totalTokens);
    const formattedCost = estimatedCost.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 4, // To show fractions of a cent
    });

    const breakdownItems = [
        { label: 'Analysis', value: tokenUsage.analysis },
        { label: 'Bibles', value: tokenUsage.bibles },
        { label: 'Storyboard', value: tokenUsage.storyboard },
        { label: 'Transitions', value: tokenUsage.transitions },
        { label: 'Image Generation', value: tokenUsage.imageGeneration },
        { label: 'Image Editing', value: tokenUsage.imageEditing },
        { label: 'Video Generation', value: tokenUsage.videoGeneration },
        { label: 'Executive Review', value: tokenUsage.executiveReview },
        { label: 'Visual QA', value: tokenUsage.visualReview },
    ].filter(item => item.value > 0);

    return (
        <div className="relative group flex items-center bg-brand-light-gray/50 px-3 py-1.5 rounded-full">
            <TokenIcon />
            <div className="text-sm">
                <span className="font-semibold text-white">{formattedTokens}</span>
                <span className="text-gray-400"> tokens</span>
                <span className="text-gray-500 mx-1">|</span>
                <span className="text-gray-300">~{formattedCost}</span>
            </div>
            
            {/* Tooltip for breakdown */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-brand-dark border border-brand-light-gray p-3 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <h4 className="font-bold text-white text-base mb-2">Token Usage Breakdown</h4>
                {breakdownItems.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                        {breakdownItems.map(item => (
                            <li key={item.label} className="flex justify-between items-center">
                                <span className="text-gray-400">{item.label}:</span>
                                <span className="font-mono text-brand-cyan font-semibold">{new Intl.NumberFormat().format(item.value)}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500">No usage recorded yet.</p>
                )}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-brand-dark -mb-2"></div>
            </div>
        </div>
    );
};

export default TokenCounter;
