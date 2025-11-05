
import React, { useState, useEffect, useRef } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import { SparklesIcon } from './icons/SparklesIcon';
import { UploadIcon } from './icons/UploadIcon';
import { generateImage, editImage, analyzeImage, generateVideo } from '../services/geminiService';

type Tab = 'generate-image' | 'edit-image' | 'analyze-image' | 'generate-video';

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Failed to convert blob to base64"));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const CreativeStudio: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('generate-image');
    
    // States for all tabs
    const [prompt, setPrompt] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Specific states
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [hasVeoKey, setHasVeoKey] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // VEO API Key Check
    useEffect(() => {
        if (activeTab === 'generate-video') {
            checkVeoApiKey();
        }
    }, [activeTab]);

    const checkVeoApiKey = async () => {
        if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
            setHasVeoKey(true);
        } else {
            setHasVeoKey(false);
        }
    };

    const handleSelectVeoKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            // Assume success to avoid race conditions
            setHasVeoKey(true);
        }
    };

    const resetState = () => {
        setPrompt('');
        setImageFile(null);
        setImagePreview(null);
        setResult(null);
        setIsLoading(false);
        setError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        resetState();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            let res;
            switch (activeTab) {
                case 'generate-image':
                    if (!prompt) throw new Error("Prompt is required.");
                    res = await generateImage(prompt, aspectRatio);
                    setResult(`data:image/png;base64,${res}`);
                    break;
                case 'edit-image':
                case 'analyze-image':
                    if (!prompt || !imageFile) throw new Error("Image and prompt are required.");
                    const imageBase64 = await blobToBase64(imageFile);
                    if(activeTab === 'edit-image') {
                        res = await editImage(prompt, imageBase64, imageFile.type);
                        setResult(`data:image/png;base64,${res}`);
                    } else {
                        res = await analyzeImage(prompt, imageBase64, imageFile.type);
                        setResult(res);
                    }
                    break;
                case 'generate-video':
                    if (!prompt) throw new Error("Prompt is required.");
                    let videoImage;
                    if (imageFile) {
                        videoImage = { base64: await blobToBase64(imageFile), mimeType: imageFile.type };
                    }
                    res = await generateVideo(prompt, videoAspectRatio, videoImage);
                    setResult(res); // this is a URL
                    break;
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            if(err.message?.includes('Requested entity was not found')) {
                setHasVeoKey(false);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const renderTabs = () => (
        <div className="flex border-b border-gray-200 mb-6">
            <TabButton tab="generate-image" label="Generate Image" />
            <TabButton tab="edit-image" label="Edit Image" />
            <TabButton tab="analyze-image" label="Analyze Image" />
            <TabButton tab="generate-video" label="Generate Video" />
        </div>
    );

    const TabButton: React.FC<{tab: Tab, label: string}> = ({tab, label}) => (
        <button
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 font-semibold transition-colors duration-200 -mb-px border-b-2 ${
                activeTab === tab 
                ? 'border-sparrow-gold-500 text-sparrow-gold-600' 
                : 'border-transparent text-gray-500 hover:text-sparrow-gold-500'
            }`}
        >
            {label}
        </button>
    );
    
    const ImageUploader = () => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="mx-auto h-48 w-auto rounded-md" />
                    ) : (
                        <>
                            <UploadIcon />
                            <div className="flex text-sm text-gray-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-sparrow-gold-600 hover:text-sparrow-gold-500 focus-within:outline-none">
                                    <span>Upload a file</span>
                                    <input id="file-upload" ref={fileInputRef} name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </>
                    )}
                </div>
            </div>
            {imageFile && <p className="text-sm text-gray-500 mt-2">File: {imageFile.name}</p>}
        </div>
    );

    const PromptInput = ({placeholder}: {placeholder: string}) => (
        <div className="mb-4">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">Prompt</label>
            <textarea id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sparrow-gold-500 focus:border-sparrow-gold-500"
                placeholder={placeholder} />
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'generate-image': return (
                <>
                    <PromptInput placeholder="e.g., A cinematic photo of a pastel de nata on a Lisbon sidewalk cafe table" />
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Aspect Ratio</label>
                        <div className="flex space-x-2">
                            {['1:1', '16:9', '9:16', '4:3', '3:4'].map(ratio => (
                                <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`px-3 py-1 border rounded-md text-sm ${aspectRatio === ratio ? 'bg-sparrow-gold-500 text-white border-sparrow-gold-500' : 'border-gray-300'}`}>{ratio}</button>
                            ))}
                        </div>
                    </div>
                </>
            );
            case 'edit-image': return (
                <>
                    <ImageUploader/>
                    <PromptInput placeholder="e.g., Add a retro filter, make it look like an oil painting"/>
                </>
            );
            case 'analyze-image': return (
                <>
                    <ImageUploader/>
                    <PromptInput placeholder="e.g., What kind of coffee is this? Is it suitable for a dessert menu?"/>
                </>
            );
            case 'generate-video':
                if (!hasVeoKey) return (
                    <div className="text-center p-8 bg-sparrow-blue-50 rounded-lg">
                        <h3 className="text-xl font-bold text-sparrow-blue-800">API Key Required for Video Generation</h3>
                        <p className="text-gray-600 my-4">Veo video generation requires you to select your own API key. This helps manage costs associated with this advanced feature. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-sparrow-gold-600 underline">Learn more about billing.</a></p>
                        <Button onClick={handleSelectVeoKey}>Select API Key</Button>
                    </div>
                );
                return (
                    <>
                        <ImageUploader/>
                        <PromptInput placeholder="e.g., A drone shot flying over a steaming cup of coffee, revealing the Lisbon skyline"/>
                        <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Aspect Ratio</label>
                        <div className="flex space-x-2">
                            {(['16:9', '9:16'] as const).map(ratio => (
                                <button key={ratio} onClick={() => setVideoAspectRatio(ratio)} className={`px-3 py-1 border rounded-md text-sm ${videoAspectRatio === ratio ? 'bg-sparrow-gold-500 text-white border-sparrow-gold-500' : 'border-gray-300'}`}>{ratio}</button>
                            ))}
                        </div>
                    </div>
                    </>
                );
        }
    };

    const renderResult = () => {
        if (isLoading) return (
            <div className="text-center p-8">
                <p className="font-semibold text-sparrow-blue-800">Generating creative content...</p>
                {activeTab === 'generate-video' && <p className="text-sm text-gray-500 mt-2">Video generation can take a few minutes. Please be patient.</p>}
            </div>
        );
        if (error) return <p className="mt-4 text-red-500 bg-red-100 p-3 rounded-lg">{error}</p>;
        if (!result) return null;

        if (activeTab === 'generate-image' || activeTab === 'edit-image') return <img src={result} alt="Generated result" className="rounded-lg shadow-md mx-auto max-w-full h-auto" />;
        if (activeTab === 'analyze-image') return <div className="p-4 bg-sparrow-blue-50 border rounded-lg whitespace-pre-wrap">{result}</div>;
        if (activeTab === 'generate-video') return <video src={result} controls autoPlay className="rounded-lg shadow-md mx-auto max-w-full h-auto" />;

        return null;
    };


    return (
        <div>
            <h1 className="text-4xl font-bold text-sparrow-blue-900 mb-8 font-serif">Creative Studio</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <h2 className="text-2xl font-bold text-sparrow-blue-800 mb-4">Configuration</h2>
                    {renderTabs()}
                    <div>{renderContent()}</div>
                    <Button onClick={handleSubmit} isLoading={isLoading} disabled={isLoading || (activeTab === 'generate-video' && !hasVeoKey)} className="w-full mt-4">
                        <SparklesIcon className="mr-2"/>
                        Generate
                    </Button>
                </Card>
                <Card>
                    <h2 className="text-2xl font-bold text-sparrow-blue-800 mb-4">Result</h2>
                    <div className="min-h-[300px] flex items-center justify-center bg-sparrow-blue-50 rounded-lg">
                        {renderResult() || <p className="text-gray-500">Your generated content will appear here.</p>}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default CreativeStudio;
