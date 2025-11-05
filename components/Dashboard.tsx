
import React, { useState } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import { MOCK_RESERVATIONS, MOCK_MENU } from '../constants';
import { SparklesIcon } from './icons/SparklesIcon';
import { getBusinessInsights } from '../services/geminiService';
import { GroundingChunk } from '@google/genai';

const Dashboard: React.FC = () => {
    const [insight, setInsight] = useState('');
    const [sources, setSources] = useState<GroundingChunk[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const upcomingReservations = MOCK_RESERVATIONS.filter(r => r.status === 'upcoming').length;
    const totalReservations = MOCK_RESERVATIONS.length;
    const popularItems = MOCK_MENU.slice(0, 2).map(item => item.name);

    const handleGenerateInsight = async () => {
        setIsLoading(true);
        setError('');
        setInsight('');
        setSources([]);
        try {
            const prompt = `
                Analyze the following daily data for Sparrow Cafes Lisbon.
                - Total Reservations Today: ${totalReservations}
                - Upcoming Reservations: ${upcomingReservations}
                - Today's Most Popular Menu Items: ${popularItems.join(', ')}

                Considering this internal data, and also searching for current local events, weather, and food trends in Lisbon, Portugal, provide a deep-dive, actionable insight for the restaurant manager. The insight should be specific and creative. For example, suggest a special offer related to a local event, a menu adjustment based on weather, or a marketing push based on a new trend. Format as plain text.
            `;
            const { text, sources } = await getBusinessInsights(prompt);
            setInsight(text);
            setSources(sources);
        } catch (err) {
            setError('Failed to generate insight. Please check your API key and try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-4xl font-bold text-sparrow-blue-900 mb-8 font-serif">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Key Metrics */}
                <Card>
                    <h2 className="text-xl font-bold text-sparrow-blue-800 mb-2">Upcoming Reservations</h2>
                    <p className="text-5xl font-bold text-sparrow-gold-500">{upcomingReservations}</p>
                    <p className="text-gray-500">out of {totalReservations} total for today</p>
                </Card>
                <Card>
                    <h2 className="text-xl font-bold text-sparrow-blue-800 mb-2">Today's Revenue</h2>
                    <p className="text-5xl font-bold text-sparrow-gold-500">€1,280</p>
                    <p className="text-green-500">+15% from yesterday</p>
                </Card>
                <Card>
                    <h2 className="text-xl font-bold text-sparrow-blue-800 mb-2">Popular Items</h2>
                    <ul className="space-y-1 mt-3">
                        {popularItems.map(item => <li key={item} className="text-gray-700">{item}</li>)}
                    </ul>
                </Card>

                {/* AI Insight Card */}
                <Card className="md:col-span-2 lg:col-span-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-sparrow-blue-800 mb-2">AI-Powered Deep Dive</h2>
                            <p className="text-gray-600 mb-4 md:mb-0">Generate an advanced insight using live web data and complex reasoning.</p>
                        </div>
                        <Button onClick={handleGenerateInsight} isLoading={isLoading}>
                            <SparklesIcon className="mr-2" />
                            Generate Deep Dive Insight
                        </Button>
                    </div>

                    {error && <p className="mt-4 text-red-500 bg-red-100 p-3 rounded-lg">{error}</p>}
                    
                    {isLoading && (
                        <div className="mt-6 p-4 text-center">
                            <p className="text-gray-500">Generating AI insight with Thinking Mode...</p>
                        </div>
                    )}

                    {insight && !isLoading && (
                        <div className="mt-6 p-4 border-l-4 border-sparrow-gold-500 bg-sparrow-blue-50 rounded-r-lg">
                            <p className="text-sparrow-blue-900 font-medium whitespace-pre-wrap">{insight}</p>
                            {sources.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-sparrow-blue-100">
                                    <h4 className="text-sm font-semibold text-sparrow-blue-800 mb-2">Sources:</h4>
                                    <ul className="list-disc list-inside text-sm space-y-1">
                                        {sources.map((source, index) => source.web && (
                                            <li key={index}>
                                                <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-sparrow-gold-600 hover:underline">
                                                    {source.web.title}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
