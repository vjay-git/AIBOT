// components/LLM/DynamicModelComponent.tsx - Fixed API Integration

import React, { useState, useEffect } from 'react';

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
  
  // Local state for editing - now properly handles different providers
  const [editingConfig, setEditingConfig] = useState({
    modelType: 'None',
    // Ollama fields
    ollamaEndpoint: '',
    ollamaModel: '',
    // GPT fields
    gptApiKey: '',
    gptApiBase: '',
    gptModel: '',
    gptDeployment: '',
    gptApiVersion: '',
    // Generic fields for other providers
    apiKey: '',
    apiBase: '',
    model: '',
  });

  // Helper function to get the correct field names based on provider and model type
  const getFieldName = (provider: string, field: string): string => {
    const prefix = modelType.toLowerCase();
    
    if (provider === 'Ollama') {
      return `${prefix}_ollama_${field}`;
    } else if (provider === 'GPT') {
      // GPT uses global fields, not per-model-type
      return `gpt_${field}`;
    } else {
      // For other providers, use generic pattern
      return `${prefix}_${field}`;
    }
  };

  // Load settings from real API
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://20.204.162.66:5001';
      const response = await fetch(`${baseUrl}/llm_settings`);
      
      if (!response.ok) {
        throw new Error(`Failed to load settings: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Loaded LLM settings:', data);
      setSettings(data);
      
      // Set editing config from loaded data
      const prefix = modelType.toLowerCase();
      const currentProvider = data[`${prefix}_model_type`] || 'None';
      
      setEditingConfig({
        modelType: currentProvider,
        // Ollama fields
        ollamaEndpoint: data[`${prefix}_ollama_endpoint`] || '',
        ollamaModel: data[`${prefix}_ollama_model`] || '',
        // GPT fields (global)
        gptApiKey: data.gpt_api_key || '',
        gptApiBase: data.gpt_api_base || '',
        gptModel: data.gpt_model || '',
        gptDeployment: data.gpt_deployment || '',
        gptApiVersion: data.gpt_api_version || '',
        // Generic fields (for future providers)
        apiKey: data[`${prefix}_api_key`] || '',
        apiBase: data[`${prefix}_api_base`] || '',
        model: data[`${prefix}_model`] || '',
      });
      
      // Load whitelisted websites if available
      if (data[`${prefix}_whitelisted_websites`]) {
        try {
          const websites = JSON.parse(data[`${prefix}_whitelisted_websites`]);
          setWhitelistedWebsites(Array.isArray(websites) ? websites : []);
        } catch (e) {
          console.warn('Failed to parse whitelisted websites:', e);
          setWhitelistedWebsites([]);
        }
      }
      
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
      
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://20.204.162.66:5001';
      const prefix = modelType.toLowerCase();
      
      // Prepare updates based on the selected provider
      const updates: any = {
        ...settings, // Keep existing settings
        [`${prefix}_model_type`]: editingConfig.modelType,
      };

      if (editingConfig.modelType === 'Ollama') {
        updates[`${prefix}_ollama_endpoint`] = editingConfig.ollamaEndpoint;
        updates[`${prefix}_ollama_model`] = editingConfig.ollamaModel;
      } else if (editingConfig.modelType === 'GPT') {
        // GPT uses global settings
        updates.gpt_api_key = editingConfig.gptApiKey;
        updates.gpt_api_base = editingConfig.gptApiBase;
        updates.gpt_model = editingConfig.gptModel;
        updates.gpt_deployment = editingConfig.gptDeployment;
        updates.gpt_api_version = editingConfig.gptApiVersion;
      } else if (editingConfig.modelType !== 'None') {
        // For other providers, use generic fields
        updates[`${prefix}_api_key`] = editingConfig.apiKey;
        updates[`${prefix}_api_base`] = editingConfig.apiBase;
        updates[`${prefix}_model`] = editingConfig.model;
      }

      // Add whitelisted websites for scrapper model
      if (modelType === 'scrapper' && whitelistedWebsites.length > 0) {
        updates[`${prefix}_whitelisted_websites`] = JSON.stringify(whitelistedWebsites);
      }

      const response = await fetch(`${baseUrl}/llm_settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save settings: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Settings saved:', result);
      
      // Reload settings to get updated data
      await loadSettings();
      
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(`Failed to save settings: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

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
      // Don't reset fields when changing provider - keep them for user convenience
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

  // Check if there are unsaved changes
  const hasChanges = () => {
    if (!settings) return false;
    
    const prefix = modelType.toLowerCase();
    const currentProvider = settings[`${prefix}_model_type`] || 'None';
    
    // Check model type change
    if (editingConfig.modelType !== currentProvider) return true;
    
    // Check provider-specific fields
    if (editingConfig.modelType === 'Ollama') {
      return (
        editingConfig.ollamaEndpoint !== (settings[`${prefix}_ollama_endpoint`] || '') ||
        editingConfig.ollamaModel !== (settings[`${prefix}_ollama_model`] || '')
      );
    } else if (editingConfig.modelType === 'GPT') {
      return (
        editingConfig.gptApiKey !== (settings.gpt_api_key || '') ||
        editingConfig.gptApiBase !== (settings.gpt_api_base || '') ||
        editingConfig.gptModel !== (settings.gpt_model || '') ||
        editingConfig.gptDeployment !== (settings.gpt_deployment || '') ||
        editingConfig.gptApiVersion !== (settings.gpt_api_version || '')
      );
    } else if (editingConfig.modelType !== 'None') {
      return (
        editingConfig.apiKey !== (settings[`${prefix}_api_key`] || '') ||
        editingConfig.apiBase !== (settings[`${prefix}_api_base`] || '') ||
        editingConfig.model !== (settings[`${prefix}_model`] || '')
      );
    }
    
    return false;
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

          {modelType === 'scrapper' && renderWhitelistedWebsites()}
        </div>
      );
    }

    if (provider === 'GPT') {
      return (
        <div className="provider-fields">
          <div className="form-group">
            <div className="form-label">
              <h3>API Key</h3>
              <p>Enter your GPT API key.</p>
            </div>
            <div className="form-field">
              <input
                type="password"
                className="text-input"
                placeholder="Enter API Key"
                value={editingConfig.gptApiKey}
                onChange={(e) => handleFieldChange('gptApiKey', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label">
              <h3>API Base URL</h3>
              <p>Base URL for the GPT API.</p>
            </div>
            <div className="form-field">
              <input
                type="text"
                className="text-input"
                placeholder="https://api.openai.com/v1"
                value={editingConfig.gptApiBase}
                onChange={(e) => handleFieldChange('gptApiBase', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label">
              <h3>Model</h3>
              <p>GPT model to use (e.g., gpt-4, gpt-3.5-turbo).</p>
            </div>
            <div className="form-field">
              <input
                type="text"
                className="text-input"
                placeholder="gpt-4o"
                value={editingConfig.gptModel}
                onChange={(e) => handleFieldChange('gptModel', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label">
              <h3>Deployment</h3>
              <p>Azure OpenAI deployment name (if using Azure).</p>
            </div>
            <div className="form-field">
              <input
                type="text"
                className="text-input"
                placeholder="gpt-4o"
                value={editingConfig.gptDeployment}
                onChange={(e) => handleFieldChange('gptDeployment', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label">
              <h3>API Version</h3>
              <p>API version for Azure OpenAI.</p>
            </div>
            <div className="form-field">
              <input
                type="text"
                className="text-input"
                placeholder="2024-02-15-preview"
                value={editingConfig.gptApiVersion}
                onChange={(e) => handleFieldChange('gptApiVersion', e.target.value)}
              />
            </div>
          </div>

          {modelType === 'scrapper' && renderWhitelistedWebsites()}
        </div>
      );
    }

    // For other providers (HuggingFace, Gemini, Claude)
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

        <div className="form-group">
          <div className="form-label">
            <h3>Model</h3>
            <p>Specify the {provider} model to use.</p>
          </div>
          <div className="form-field">
            <input
              type="text"
              className="text-input"
              placeholder={`Enter ${provider} model name`}
              value={editingConfig.model}
              onChange={(e) => handleFieldChange('model', e.target.value)}
            />
          </div>
        </div>

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
  const hasUnsavedChanges = hasChanges();

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
              <h2>Configuration</h2>
              <p>Configure the settings for the selected model type.</p>
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
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Settings' : 'No Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicModelComponent;