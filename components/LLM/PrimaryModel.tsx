import React, { useState } from 'react';

const PrimaryModel = () => {
  const [selectedModel, setSelectedModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [responseStyle, setResponseStyle] = useState('');
  const [responseLength, setResponseLength] = useState('');
  const [maxTokens, setMaxTokens] = useState('');

  const handleSaveSettings = () => {
    console.log('Saving LLM settings:', {
      selectedModel,
      apiKey,
      responseStyle,
      responseLength,
      maxTokens
    });
    // API call would go here
  };

  return (
    <div className="llm-settings-container">
      <h1 className="page-title">LLM Settings</h1>
      
      <div className="llm-settings-form">
        <div className="form-group">
          <div className="form-label">
            <h2>Model Name</h2>
            <p>Select the AI model type you want to use for processing requests.</p>
          </div>
          <div className="form-field">
            <select 
              className="select-input" 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <option value="">Select Model</option>
              <option value="gpt-4">GPT-4</option>
              <option value="claude-3">Claude 3</option>
              <option value="llama-3">Llama 3</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <div className="form-label">
            <h2>API Key</h2>
            <p>Enter your API key to connect with the selected LLM provider.</p>
          </div>
          <div className="form-field">
            <input 
              type="text" 
              className="text-input" 
              placeholder="Enter the API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <div className="form-label">
            <h2>AI Response Settings</h2>
            <p>Customize how the AI responds based on your team's preferred tone and response length.</p>
          </div>
          <div className="form-field">
            <div className="response-settings">
              <div className="response-setting-item">
                <label>Response Style</label>
                <select 
                  className="select-input"
                  value={responseStyle}
                  onChange={(e) => setResponseStyle(e.target.value)}
                >
                  <option value="">Select Type</option>
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="concise">Concise</option>
                </select>
              </div>
              
              <div className="response-setting-item">
                <label>Max Response Length</label>
                <select 
                  className="select-input"
                  value={responseLength}
                  onChange={(e) => setResponseLength(e.target.value)}
                >
                  <option value="">Select Type</option>
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>
              
              <div className="response-setting-item">
                <label>Max Tokens</label>
                <input 
                  type="text"
                  className="text-input" 
                  placeholder="Enter Maximum Tokens"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button className="save-button" onClick={handleSaveSettings}>Save Settings</button>
        </div>
      </div>
    </div>
  );
};

export default PrimaryModel; 