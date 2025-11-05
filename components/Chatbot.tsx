
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { startChat } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { CloseIcon } from './icons/CloseIcon';
import { Chat } from '@google/genai';

interface ChatbotProps {
    onClose: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ onClose }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', parts: [{ text: "Hello! I'm your AI assistant. How can I help you today?" }] }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            setChat(startChat());
        } catch (error) {
            console.error("Failed to start chat:", error);
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: "Sorry, I'm unable to connect right now." }] }]);
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !chat || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const result = await chat.sendMessageStream({ message: input });
            setIsLoading(false);
            
            let currentModelMessage = '';
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

            for await (const chunk of result) {
                currentModelMessage += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', parts: [{ text: currentModelMessage }] };
                    return newMessages;
                });
            }

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: "I encountered an error. Please try again." }] }]);
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-24 right-6 w-96 h-[32rem] bg-white rounded-2xl shadow-2xl flex flex-col font-sans animate-fade-in-up">
            <header className="flex items-center justify-between p-4 bg-sparrow-blue-900 text-white rounded-t-2xl">
                <div className="flex items-center">
                    <SparklesIcon className="mr-2" />
                    <h3 className="font-bold">AI Assistant</h3>
                </div>
                <button onClick={onClose} aria-label="Close chat">
                    <CloseIcon />
                </button>
            </header>

            <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-sparrow-gold-500 text-white' : 'bg-sparrow-blue-50 text-sparrow-blue-900'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.parts[0].text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                             <div className="max-w-xs px-4 py-2 rounded-2xl bg-sparrow-blue-50 text-sparrow-blue-900">
                                <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-sparrow-blue-400 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-sparrow-blue-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                    <div className="w-2 h-2 bg-sparrow-blue-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <footer className="p-4 border-t border-gray-200">
                <div className="flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-sparrow-gold-500"
                        disabled={!chat}
                    />
                    <button onClick={handleSend} disabled={!chat || isLoading} className="ml-3 p-2 bg-sparrow-gold-500 text-white rounded-full disabled:opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default Chatbot;
