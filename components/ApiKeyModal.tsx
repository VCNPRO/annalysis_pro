import React, { useState, useEffect } from 'react';
import { setApiKey, getApiKey } from '../constants';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
    const [apiKey, setApiKeyInput] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Carregar la API key des de localStorage
        const savedKey = getApiKey();
        if (savedKey) {
            setApiKeyInput(savedKey);
        }
    }, []);

    const handleSave = () => {
        if (!apiKey.trim()) {
            setError('Si us plau, introdueix una clau API vàlida');
            return;
        }

        // Desar a localStorage
        setApiKey(apiKey.trim());

        setError('');
        onClose();

        // Recarregar la pàgina per aplicar la nova clau
        window.location.reload();
    };

    const handleGetKey = () => {
        window.open('https://aistudio.google.com/apikey', '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-blue-200">
                <h2 className="text-2xl font-bold text-blue-800 mb-4">
                    Configura la clau API de Gemini
                </h2>

                <p className="text-sm text-gray-600 mb-4">
                    Per utilitzar l'anàlisi de vídeo, necessites una clau API de Google AI Studio.
                </p>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                            Clau API
                        </label>
                        <input
                            id="apiKey"
                            type="password"
                            value={apiKey}
                            onChange={(e) => {
                                setApiKeyInput(e.target.value);
                                setError('');
                            }}
                            placeholder="AIza..."
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-600">{error}</p>
                        )}
                    </div>

                    <button
                        onClick={handleGetKey}
                        className="w-full text-sm text-blue-600 hover:text-blue-700 underline text-left"
                    >
                        No tens una clau API? Obtén-ne una gratuïta aquí
                    </button>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleSave}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Desar
                        </button>
                        {getApiKey() && (
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Cancel·lar
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-600">
                        <strong className="text-blue-800">Nota:</strong> La teva clau API es desa localment al teu navegador i mai es comparteix amb tercers.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
