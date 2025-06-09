import React, { useState } from 'react';

interface ConnectionFieldsProps {
  onConnect: (processedFolder: string) => void; // Removed columnMapping parameter
  selectedDatabaseType?: string;
}

const ConnectionFields: React.FC<ConnectionFieldsProps> = ({ onConnect, selectedDatabaseType }) => {
  const [processedFolder, setProcessedFolder] = useState('');
  
  // PostgreSQL specific fields
  const [hostUrl, setHostUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleProcessedFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProcessedFolder(e.target.value);
  };

  const handleConnect = () => {
    if (selectedDatabaseType === 'postgresql') {
      // For PostgreSQL, we might want to include the connection details
      onConnect(processedFolder);
      console.log('PostgreSQL Connection Details:', { hostUrl, username, password });
    } else {
      onConnect(processedFolder);
    }
  };

  // Render PostgreSQL specific fields
  const renderPostgreSQLFields = () => (
    <>
      <div className="input-group">
        <label className="input-label" htmlFor="host-url">Host URL</label>
        <input 
          type="text" 
          id="host-url"
          className="text-input" 
          placeholder="localhost:5432 or your-host.com:5432"
          value={hostUrl}
          onChange={(e) => setHostUrl(e.target.value)}
        />
        <button className="info-button" aria-label="Host URL information">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="#98A2B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 10.6667V8" stroke="#98A2B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 5.33331H8.00667" stroke="#98A2B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      
      <div className="input-group">
        <label className="input-label" htmlFor="username">Username</label>
        <input 
          type="text" 
          id="username"
          className="text-input" 
          placeholder="Enter your PostgreSQL username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button className="info-button" aria-label="Username information">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="#98A2B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 10.6667V8" stroke="#98A2B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 5.33331H8.00667" stroke="#98A2B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      
      <div className="input-group">
        <label className="input-label" htmlFor="password">Password</label>
        <input 
          type="password" 
          id="password"
          className="text-input" 
          placeholder="Enter your PostgreSQL password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="info-button" aria-label="Password information">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="#98A2B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 10.6667V8" stroke="#98A2B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 5.33331H8.00667" stroke="#98A2B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </>
  );

  return (
    <div className="connection-fields-section">
      <div className="section-label">
        {selectedDatabaseType === 'postgresql' ? 'PostgreSQL Connection' : 'Connect Database'}
      </div>
      <div className="section-description">
        {selectedDatabaseType === 'postgresql' 
          ? 'Enter your PostgreSQL database connection details'
          : 'A database type is the specific kind of system used to store'
        }
      </div>
      
      <div className="connection-inputs">
        {/* Show PostgreSQL specific fields when PostgreSQL is selected */}
        {selectedDatabaseType === 'postgresql' && renderPostgreSQLFields()}
        
        {/* Common fields for all database types - REMOVED Column Mapping */}
        <div className="input-group">
          <label className="input-label" htmlFor="processed-folder">Processed Folder</label>
          <input 
            type="text" 
            id="processed-folder"
            className="text-input" 
            placeholder="Enter processed folder path"
            value={processedFolder}
            onChange={handleProcessedFolderChange}
          />
          <button className="info-button" aria-label="More information">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="#98A2B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 10.6667V8" stroke="#98A2B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 5.33331H8.00667" stroke="#98A2B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Connect Button */}
      <div className="connection-actions">
        <button 
          className="connect-button"
          onClick={handleConnect}
          disabled={selectedDatabaseType === 'postgresql' && (!hostUrl || !username || !password || !processedFolder)}
        >
          {selectedDatabaseType === 'postgresql' ? 'Connect to PostgreSQL' : 'Connect'}
        </button>
      </div>
    </div>
  );
};

export default ConnectionFields;