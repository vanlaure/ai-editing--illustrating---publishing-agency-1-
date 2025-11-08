import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { BotIcon, UserIcon, SendIcon } from './icons/IconDefs';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const Message: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    const Icon = isModel ? BotIcon : UserIcon;
    return (
        <div className={`flex gap-3 my-4 ${isModel ? '' : 'flex-row-reverse'}`}>
            <Icon className={`w-8 h-8 flex-shrink-0 rounded-full p-1.5 ${isModel ? 'bg-brand-primary text-white' : 'bg-brand-border'}`} />
            <div className={`p-3 rounded-lg max-w-lg ${isModel ? 'bg-brand-bg' : 'bg-brand-primary/20'}`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
        </div>
    );
};

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, messages, onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 no-print" onClick={onClose}>
            <div className="bg-brand-surface rounded-lg shadow-2xl w-full max-w-2xl flex flex-col" style={{height: '80vh'}} onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-brand-border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <BotIcon className="w-8 h-8 text-brand-primary" />
                        <div>
                            <h2 className="text-xl font-bold">Manuscript Chat Assistant</h2>
                            <p className="text-sm text-brand-text-secondary">Ask anything about your document.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text text-2xl leading-none">&times;</button>
                </div>

                <div className="flex-grow p-4 overflow-y-auto">
                    {messages.map(msg => <Message key={msg.id} message={msg} />)}
                    {isLoading && (
                        <div className="flex gap-3 my-4">
                            <BotIcon className="w-8 h-8 flex-shrink-0 rounded-full p-1.5 bg-brand-primary text-white" />
                            <div className="p-3 rounded-lg bg-brand-bg">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
                                    <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                    <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                <div className="p-4 border-t border-brand-border">
                    <div className="relative">
                        <textarea
                            rows={2}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="e.g., 'Summarize chapter 2' or 'Suggest three alternative titles...'"
                            className="w-full p-2 pr-12 border border-brand-border rounded-md bg-brand-bg resize-none focus:ring-2 focus:ring-brand-primary focus:outline-none"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="absolute bottom-2 right-2 p-2 rounded-md text-brand-primary disabled:text-brand-text-secondary hover:bg-brand-border disabled:hover:bg-transparent"
                            aria-label="Send Message"
                        >
                            <SendIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};