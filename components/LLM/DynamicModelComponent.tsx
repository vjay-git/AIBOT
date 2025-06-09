// components/LLM/DynamicModelComponent.tsx - Simplified Real API Version

import React, { useState, useEffect } from 'react';

// Fallback constants
const FALLBACK_PROVIDERS = [
  { id: 'ChatGPT', name: 'Chat GPT', icon: '🤖' },
  { id: 'Gemini', name: 'Gemini', icon: '💎' },
  { id: 'Claude', name: 'Claude', icon: '🎭' },
  { id: 'Deepseek', name: 'Deepseek', icon: '🔍' },
  { id: 'Perplexity', name: 'Perplexity', icon: '🔄' },
  { id: 'Ollama', name: 'Ollama', icon: '🦙' },
  { id: 'Copilot', name: 'Copilot', icon: '🚁' },
  { id: 'None', name: 'None', icon: '❌' },
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
  const [error, setError] = useState<string | null>(null);
  const [whitelistedWebsites, setWhitelistedWebsites] = useState<string[]>([]);

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
      
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load LLM settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save settings to real API
  const saveSettings = async (updates: any) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
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
    }
  };

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Get current config for the model type
  const getCurrentConfig = () => {
    if (!settings) return null;
    
    const prefix = modelType.toLowerCase();
    return {
      modelType: settings[`${prefix}_model_type`] || 'None',
      ollamaEndpoint: settings[`${prefix}_ollama_endpoint`] || '',
      ollamaModel: settings[`${prefix}_ollama_model`] || '',
    };
  };

  // Handle field updates
  const handleFieldUpdate = async (field: string, value: string) => {
    const prefix = modelType.toLowerCase();
    const fieldKey = `${prefix}_${field}`;
    
    const updates = {
      [fieldKey]: value
    };
    
    await saveSettings(updates);
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
    const config = getCurrentConfig();
    if (!config) return null;

    const provider = config.modelType;

    if (provider === 'None' || !provider) {
      return (
        <div className="no-provider-message">
          <p>Model type: {provider}</p>
          <p>This model is not currently configured.</p>
        </div>
      );
    }

    if (provider === 'Ollama') {
      return (
        <div className="provider-fields">
          <div className="form-group">
            <div className="form-label">
              <h3>Ollama Model</h3>
              <p>Current model configuration from API</p>
            </div>
            <div className="form-field">
              <div className="read-only-field">
                {config.ollamaModel || 'Not configured'}
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="form-label">
              <h3>Ollama End Point</h3>
              <p>Current endpoint configuration from API</p>
            </div>
            <div className="form-field">
              <div className="read-only-field">
                {config.ollamaEndpoint || 'Not configured'}
              </div>
            </div>
          </div>

          {/* Show whitelisted websites only for scrapper model */}
          {modelType === 'scrapper' && renderWhitelistedWebsites()}
        </div>
      );
    }

    // For other providers (would need API support)
    return (
      <div className="provider-fields">
        <div className="form-group">
          <div className="form-label">
            <h3>Provider Configuration</h3>
            <p>{provider} is configured but detailed settings are not available in current API</p>
          </div>
          <div className="form-field">
            <div className="read-only-field">
              {provider} - Configuration managed externally
            </div>
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

  const config = getCurrentConfig();
  const isConnected = config && config.modelType !== 'None';

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
        <button onClick={loadSettings} className="test-connection-btn">
          Refresh
        </button>
      </div>

      <div className="llm-settings-form">
        <div className="form-group">
          <div className="form-label">
            <h2>Model Type</h2>
            <p>Current model type configuration from API</p>
          </div>
          <div className="form-field">
            <div className="provider-selector">
              <div className="selected-provider">
                <div className="provider-display">
                  <span className="provider-icon">
                    {FALLBACK_PROVIDERS.find(p => p.id === config?.modelType)?.icon || '❓'}
                  </span>
                  <span className="provider-name">
                    {config?.modelType || 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <div className="form-label">
            <h2>Details</h2>
            <p>Current configuration details from API</p>
          </div>
          <div className="form-field">
            {renderProviderFields()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicModelComponent;