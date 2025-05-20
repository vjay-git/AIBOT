import React, { useState } from 'react';

interface CustomizationProps {
  initialSettings?: {
    themeColor: string;
    mode: string;
    welcomeMessage: string;
    language: string;
  };
}

const Customization: React.FC<CustomizationProps> = ({ 
  initialSettings = {
    themeColor: '#5B8DEF',
    mode: 'light',
    welcomeMessage: 'Hi Anush, You can ask about Patient details',
    language: 'en'
  }
}) => {
  const [selectedThemeColor, setSelectedThemeColor] = useState<string>(initialSettings.themeColor);
  const [selectedMode, setSelectedMode] = useState<string>(initialSettings.mode);
  const [welcomeMessage, setWelcomeMessage] = useState<string>(initialSettings.welcomeMessage);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialSettings.language);

  // Theme colors from Figma
  const themeColors = [
    { id: 'red', color: '#E53935' },
    { id: 'orange', color: '#F57C00' },
    { id: 'green', color: '#2E7D32' },
    { id: 'yellow', color: '#FDD835' },
    { id: 'pink', color: '#F8BBD0' },
    { id: 'blue', color: '#5B8DEF' }
  ];

  // Display modes
  const modes = [
    { id: 'light', name: 'Light Mode' },
    { id: 'dark', name: 'Dark Mode' },
    { id: 'auto', name: 'Auto' }
  ];

  // Languages
  const languages = [
    { id: 'en', name: 'English' },
    { id: 'fr', name: 'French' },
    { id: 'de', name: 'German' },
    { id: 'es', name: 'Spanish' }
  ];

  return (
    <div className="customization-container">
      <h1 className="page-title">Customisation</h1>
      
      <div className="sections-container">
        {/* Company Logo Section */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Company Logo</h2>
            <p className="section-description">Upload company logo with transparent background.</p>
          </div>
          
          <div className="logo-upload-container">
            <div className="logo-upload-area">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16L12 8" stroke="#5B8DEF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 11L11.913 8.08704C11.961 8.03897 12.039 8.03897 12.087 8.08704L15 11" stroke="#5B8DEF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 22H16C19.3137 22 22 19.3137 22 16V8C22 4.68629 19.3137 2 16 2H8C4.68629 2 2 4.68629 2 8V16C2 19.3137 4.68629 22 8 22Z" stroke="#5B8DEF" strokeWidth="1.5"/>
              </svg>
              <div className="upload-text">
                <p>Click to upload or drag and drop</p>
                <p className="upload-format">PNG or JPG (max 800x800px)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Theme Color Section */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Theme Colour</h2>
            <p className="section-description">Choose a preferred theme for the app.</p>
          </div>
          
          <div className="color-options">
            {themeColors.map(theme => (
              <div 
                key={theme.id}
                className={`color-option ${selectedThemeColor === theme.color ? 'selected' : ''}`}
                style={{ backgroundColor: theme.color }}
                onClick={() => setSelectedThemeColor(theme.color)}
              />
            ))}
          </div>
        </section>

        {/* Mode Section */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Mode</h2>
            <p className="section-description">Choose light or dark mode, or switch your mode automatically based on your system settings.</p>
          </div>
          
          <div className="mode-options">
            {modes.map(mode => (
              <div 
                key={mode.id}
                className={`mode-option ${selectedMode === mode.id ? 'selected' : ''}`}
                onClick={() => setSelectedMode(mode.id)}
              >
                <div className={`mode-preview ${mode.id}`}>
                  <div className="preview-header"></div>
                  <div className="preview-sidebar"></div>
                  <div className="preview-content"></div>
                </div>
                <div className="mode-label">{mode.name}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Language Section */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Language</h2>
            <p className="section-description">Customise your language.</p>
          </div>
          
          <div className="language-container">
            <div className="field-group">
              <label className="field-label">Language</label>
              <div className="select-container">
                <select 
                  className="select-input"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  <option value="" disabled>Select Language</option>
                  {languages.map(lang => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>
                <span className="select-arrow">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Welcome Message</label>
              <textarea 
                className="welcome-message-input" 
                placeholder="Enter a Welcome message..." 
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
              />
            </div>
          </div>
        </section>
      </div>

      <div className="actions-container">
        <button className="save-button">Save Changes</button>
      </div>
    </div>
  );
};

export default Customization; 