
import React, { useState } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import Modal from './common/Modal';
import { MOCK_MENU } from '../constants';
import { MenuItem } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { AudioIcon } from './icons/AudioIcon';
import { generateMenuDescription, suggestPairing, textToSpeech, generateImage } from '../services/geminiService';

// --- Audio Decoding Helpers ---
function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


const Menu: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [aiContent, setAiContent] = useState('');
    const [aiImage, setAiImage] = useState<string | null>(null);
    const [loadingAction, setLoadingAction] = useState<'description' | 'pairing' | 'image' | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState('');
    
    // Using a ref for AudioContext to ensure it's created only once
    const audioContextRef = React.useRef<AudioContext | null>(null);

    const openAIAssistant = (item: MenuItem) => {
        setSelectedItem(item);
        setAiContent('');
        setAiImage(null);
        setError('');
        setIsModalOpen(true);
    };
    
    const handleGenerate = async (generator: (prompt: string) => Promise<string>, promptFn: (item: MenuItem) => string, action: 'description' | 'pairing') => {
        if (!selectedItem) return;
        setLoadingAction(action);
        setError('');
        setAiContent('');
        setAiImage(null);
        try {
            const prompt = promptFn(selectedItem);
            const result = await generator(prompt);
            setAiContent(result);
        } catch (err: any) {
            setError(`Failed to generate content: ${err.message}`);
        } finally {
            setLoadingAction(null);
        }
    };
    
    const handleGenerateDescription = () => handleGenerate(
        generateMenuDescription,
        item => `Generate a creative and appealing menu description for a dish called "${item.name}". It is a ${item.category} and its key ingredients are: ${item.ingredients.join(', ')}. The description should be 2-3 sentences long and evoke a sense of authentic Portuguese cuisine.`,
        'description'
    );
    
    const handleSuggestPairing = () => handleGenerate(
        suggestPairing,
        item => `Suggest a wine or drink pairing for the dish "${item.name}", which is described as: "${item.description}". Recommend a specific type of Portuguese wine or a creative cocktail and briefly explain why it pairs well.`,
        'pairing'
    );

    const handleGenerateImage = async () => {
        if (!selectedItem) return;
        setLoadingAction('image');
        setError('');
        setAiContent('');
        setAiImage(null);
        try {
            const prompt = `A delicious-looking, high-quality photograph of "${selectedItem.name}", which is described as "${selectedItem.description}". The image should be suitable for a restaurant menu, with a clean and appealing background.`;
            const result = await generateImage(prompt, '1:1');
            setAiImage(`data:image/png;base64,${result}`);
        } catch (err: any) {
            setError(`Failed to generate image: ${err.message}`);
        } finally {
            setLoadingAction(null);
        }
    };

    const handleSpeak = async () => {
        if (!aiContent || isSpeaking) return;
        setIsSpeaking(true);
        setError('');
        
        if (!audioContextRef.current) {
             audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const outputAudioContext = audioContextRef.current;

        try {
            const base64Audio = await textToSpeech(aiContent);
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
            
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContext.destination);
            source.onended = () => setIsSpeaking(false);
            source.start();

        } catch (err: any) {
            setError(`Failed to generate audio: ${err.message}`);
            setIsSpeaking(false);
        }
    };

    return (
        <div>
            <h1 className="text-4xl font-bold text-sparrow-blue-900 mb-8 font-serif">Café Menu</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {MOCK_MENU.map(item => (
                    <Card key={item.id} className="flex flex-col">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                        <div className="flex-grow">
                            <div className="flex justify-between items-start">
                                <h2 className="text-2xl font-bold text-sparrow-blue-800">{item.name}</h2>
                                <p className="text-xl font-semibold text-sparrow-gold-500">€{item.price.toFixed(2)}</p>
                            </div>
                            <p className="text-gray-600 mt-2 mb-4">{item.description}</p>
                        </div>
                        <Button variant="secondary" onClick={() => openAIAssistant(item)}>
                            <SparklesIcon className="mr-2" />
                            AI Menu Assistant
                        </Button>
                    </Card>
                ))}
            </div>

            {selectedItem && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`AI Assistant: ${selectedItem.name}`}>
                    <div>
                        <p className="text-gray-600 mb-6">Use AI to enhance your menu. Generate a new description, find the perfect drink pairing, or create a new image for this item.</p>
                        <div className="flex flex-wrap gap-4 mb-6">
                            <Button onClick={handleGenerateDescription} isLoading={loadingAction === 'description'} disabled={!!loadingAction}>Generate Description</Button>
                            <Button onClick={handleSuggestPairing} isLoading={loadingAction === 'pairing'} disabled={!!loadingAction}>Suggest Pairing</Button>
                            <Button onClick={handleGenerateImage} isLoading={loadingAction === 'image'} disabled={!!loadingAction}>Generate Image</Button>
                        </div>

                        {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg">{error}</p>}
                        
                        {loadingAction && <p className="text-gray-500">Generating content...</p>}
                        
                        {aiContent && !loadingAction && (
                            <div className="mt-4 p-4 bg-sparrow-blue-50 border border-sparrow-blue-100 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-sparrow-blue-800 mb-2">AI Suggestion:</h4>
                                        <p className="text-sparrow-blue-900 whitespace-pre-wrap">{aiContent}</p>
                                    </div>
                                    <button onClick={handleSpeak} disabled={isSpeaking} className="text-sparrow-gold-500 hover:text-sparrow-gold-600 disabled:opacity-50 disabled:cursor-not-allowed ml-4">
                                        <AudioIcon className={isSpeaking ? 'animate-pulse' : ''}/>
                                    </button>
                                </div>
                            </div>
                        )}

                        {aiImage && !loadingAction && (
                            <div className="mt-4 p-4 bg-sparrow-blue-50 border border-sparrow-blue-100 rounded-lg">
                                <h4 className="font-bold text-sparrow-blue-800 mb-2">AI Generated Image:</h4>
                                <img src={aiImage} alt="AI generated menu item" className="w-full h-auto object-cover rounded-lg shadow-md" />
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Menu;
