// components/LLM/DynamicModelComponent.tsx - Simplified Real API Version

import React, { useState, useEffect } from 'react';

// Fallback constants
// Fallback constants
const FALLBACK_PROVIDERS = [
  { id: 'None', name: 'None', icon: '❌' },
  { id: 'Ollama', name: 'Ollama', icon: '🦙' },
  { id: 'GPT', name: 'GPT', icon: '🤖' },
  { id: 'HuggingFace', name: 'Hugging Face', icon: '🤗' },
  { id: 'Gemini', name: 'Gemini', icon: '💎' },
  { id: 'Claude', name: 'Claude', icon: '🎭' },
];

const FALLBACK_WEBSITES = [
  { id: 'cloud4c', name: 'www.cloud4c.com', url: 'https://www.cloud4c.com' },
  { id: 'github', name: 'github.com', url: 'https://github.com' },
  { id: 'stackoverflow', name: 'stackoverflow.com', url: 'https://stackoverflow.com' },
  { id: 'medium', name: 'medium.com', url: 'https://medium.com' },
  { id: 'techcrunch', name: 'techcrunch.com', url: 'https://techcrunch.com' },
  { id: 'hackernews', name: 'news.ycombinator.com', url: 'https://news.ycombinator.com' },
  { id: 'reddit', name: 'reddit.com', url: 'https://reddit.com' },
  { id: 'aws', name: 'aws.amazon.com', url: 'https://aws.amazon.com' },
  { id: 'azure', name: 'azure.microsoft.com', url: 'https://azure.microsoft.com' },
  { id: 'gcp', name: 'cloud.google.com', url: 'https://cloud.google.com' },
];

interface DynamicModelComponentProps {
  modelType: string; // 'primary', 'secondary', 'embedding', 'response', 'action', 'scrapper'
  title: string;
}

const DynamicModelComponent: React.FC<DynamicModelComponentProps> = ({ 
  modelType, 
  title 
}) => {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whitelistedWebsites, setWhitelistedWebsites] = useState<string[]>([]);
  
  // Local state for editing
  const [editingConfig, setEditingConfig] = useState({
    modelType: 'None',
    ollamaEndpoint: '',
    ollamaModel: '',
    apiKey: '',
    apiBase: '',
  });

  // Load settings from real API
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${baseUrl}/llm_settings`);
      
      if (!response.ok) {
        throw new Error(`Failed to load settings: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Loaded LLM settings:', data);
      setSettings(data);
      
      // Set editing config from loaded data
      const prefix = modelType.toLowerCase();
      setEditingConfig({
        modelType: data[`${prefix}_model_type`] || 'None',
        ollamaEndpoint: data[`${prefix}_ollama_endpoint`] || '',
        ollamaModel: data[`${prefix}_ollama_model`] || '',
        apiKey: data[`${prefix}_api_key`] || '',
        apiBase: data[`${prefix}_api_base`] || '',
      });
      
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load LLM settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save settings to real API
  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const prefix = modelType.toLowerCase();
      
      const updates = {
        [`${prefix}_model_type`]: editingConfig.modelType,
        [`${prefix}_ollama_endpoint`]: editingConfig.ollamaEndpoint,
        [`${prefix}_ollama_model`]: editingConfig.ollamaModel,
      };

      // Only include API fields for non-Ollama providers
      if (editingConfig.modelType !== 'Ollama' && editingConfig.modelType !== 'None') {
        updates[`${prefix}_api_key`] = editingConfig.apiKey;
        updates[`${prefix}_api_base`] = editingConfig.apiBase;
      }

      const response = await fetch(`${baseUrl}/llm_settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...settings, ...updates }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.status}`);
      }

      const result = await response.json();
      console.log('Settings saved:', result);
      
      // Reload settings to get updated data
      await loadSettings();
      
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Remove unused functions
  useEffect(() => {
    loadSettings();
  }, [modelType]);

  // Handle field updates
  const handleFieldChange = (field: string, value: string) => {
    setEditingConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle provider change
  const handleProviderChange = (provider: string) => {
    setEditingConfig(prev => ({
      ...prev,
      modelType: provider,
      // Reset fields when changing provider
      ...(provider === 'None' && {
        ollamaEndpoint: '',
        ollamaModel: '',
        apiKey: '',
        apiBase: '',
      })
    }));
  };

  // Handle website selection for scrapper model
  const handleWebsiteToggle = (websiteId: string) => {
    setWhitelistedWebsites(prev => {
      const isSelected = prev.includes(websiteId);
      return isSelected 
        ? prev.filter(id => id !== websiteId)
        : [...prev, websiteId];
    });
  };

  // Render provider-specific fields
  const renderProviderFields = () => {
    const provider = editingConfig.modelType;

    if (provider === 'None') {
      return (
        <div className="no-provider-message">
          <p>Select a model type to configure settings.</p>
        </div>
      );
    }

    if (provider === 'Ollama') {
      return (
        <div className="provider-fields">
          <div className="form-group">
            <div className="form-label">
              <h3>Ollama Model</h3>
              <p>Specify the Ollama model to use.</p>
            </div>
            <div className="form-field">
              <input
                type="text"
                className="text-input"
                placeholder="e.g., llama3.2:latest"
                value={editingConfig.ollamaModel}
                onChange={(e) => handleFieldChange('ollamaModel', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label">
              <h3>Ollama End Point</h3>
              <p>The endpoint URL for your Ollama instance.</p>
            </div>
            <div className="form-field">
              <input
                type="text"
                className="text-input"
                placeholder="http://localhost:11434/"
                value={editingConfig.ollamaEndpoint}
                onChange={(e) => handleFieldChange('ollamaEndpoint', e.target.value)}
              />
            </div>
          </div>

          {/* Show whitelisted websites only for scrapper model */}
          {modelType === 'scrapper' && renderWhitelistedWebsites()}
        </div>
      );
    }

    // For other providers (GPT, HuggingFace, Gemini, Claude)
    return (
      <div className="provider-fields">
        <div className="form-group">
          <div className="form-label">
            <h3>API Key</h3>
            <p>Enter your {provider} API key.</p>
          </div>
          <div className="form-field">
            <input
              type="password"
              className="text-input"
              placeholder="Enter API Key"
              value={editingConfig.apiKey}
              onChange={(e) => handleFieldChange('apiKey', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <div className="form-label">
            <h3>API Base URL</h3>
            <p>Base URL for the {provider} API (optional).</p>
          </div>
          <div className="form-field">
            <input
              type="text"
              className="text-input"
              placeholder={`Enter ${provider} API base URL`}
              value={editingConfig.apiBase}
              onChange={(e) => handleFieldChange('apiBase', e.target.value)}
            />
          </div>
        </div>

        {/* Show whitelisted websites only for scrapper model */}
        {modelType === 'scrapper' && renderWhitelistedWebsites()}
      </div>
    );
  };

  const renderWhitelistedWebsites = () => {
    return (
      <div className="form-group">
        <div className="form-label">
          <h3>Whitelisted Websites</h3>
          <p>Select websites that are allowed for web scraping.</p>
        </div>
        <div className="form-field">
          <div className="whitelisted-websites">
            {FALLBACK_WEBSITES.map(website => (
              <div 
                key={website.id} 
                className={`website-option ${whitelistedWebsites.includes(website.id) ? 'selected' : ''}`}
                onClick={() => handleWebsiteToggle(website.id)}
              >
                <div className="website-checkbox">
                  <input
                    type="checkbox"
                    id={`website-${website.id}`}
                    checked={whitelistedWebsites.includes(website.id)}
                    onChange={() => handleWebsiteToggle(website.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label htmlFor={`website-${website.id}`}></label>
                </div>
                <div className="website-info">
                  <span className="website-name">{website.name}</span>
                  <span className="website-url">{website.url}</span>
                </div>
              </div>
            ))}
            
            {whitelistedWebsites.length > 0 && (
              <div className="selected-websites-summary">
                <p>{whitelistedWebsites.length} website(s) selected</p>
                <button 
                  type="button"
                  className="clear-selection-btn"
                  onClick={() => setWhitelistedWebsites([])}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="llm-settings-container">
        <div className="loading-state">
          <p>Loading {title} settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="llm-settings-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
        <button onClick={loadSettings}>Retry Loading</button>
      </div>
    );
  }

  const isConnected = editingConfig.modelType !== 'None';
  const hasChanges = settings && (
    editingConfig.modelType !== (settings[`${modelType.toLowerCase()}_model_type`] || 'None') ||
    editingConfig.ollamaEndpoint !== (settings[`${modelType.toLowerCase()}_ollama_endpoint`] || '') ||
    editingConfig.ollamaModel !== (settings[`${modelType.toLowerCase()}_ollama_model`] || '') ||
    editingConfig.apiKey !== (settings[`${modelType.toLowerCase()}_api_key`] || '') ||
    editingConfig.apiBase !== (settings[`${modelType.toLowerCase()}_api_base`] || '')
  );

  return (
    <div className="llm-settings-container">
      <div className="model-header">
        <h1 className="page-title">
          {title}
          {isConnected && (
            <span className="connection-status connected">
              • Connected
            </span>
          )}
        </h1>
        <button onClick={loadSettings} className="test-connection-btn" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="llm-settings-form">
        <div className="form-group">
          <div className="form-label">
            <h2>Model Type</h2>
            <p>Select the AI model type you want to use for processing requests.</p>
          </div>
          <div className="form-field">
            <select
              className="select-input"
              value={editingConfig.modelType}
              onChange={(e) => handleProviderChange(e.target.value)}
            >
              {FALLBACK_PROVIDERS.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {editingConfig.modelType !== 'None' && (
          <div className="form-group">
            <div className="form-label">
              <h2>Details</h2>
              <p>Provide additional details about the selected model configuration.</p>
            </div>
            <div className="form-field">
              {renderProviderFields()}
            </div>
          </div>
        )}

        {editingConfig.modelType !== 'None' && (
          <div className="form-actions">
            <button 
              className="save-button" 
              onClick={saveSettings}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? 'Saving...' : hasChanges ? 'Save Settings' : 'No Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicModelComponent;
