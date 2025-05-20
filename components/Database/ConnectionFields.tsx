import React, { useState } from 'react';

interface ConnectionFieldsProps {
  onConnect: (columnMapping: string, processedFolder: string) => void;
}

const ConnectionFields: React.FC<ConnectionFieldsProps> = ({ onConnect }) => {
  const [columnMapping, setColumnMapping] = useState('');
  const [processedFolder, setProcessedFolder] = useState('');

  const handleColumnMappingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColumnMapping(e.target.value);
  };

  const handleProcessedFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProcessedFolder(e.target.value);
  };

  return (
    <div className="connection-fields-section">
      <div className="section-label">Connect Database</div>
      <div className="section-description">A database type is the specific kind of system used to store</div>
      
      <div className="connection-inputs">
        <div className="input-group">
          <label className="input-label" htmlFor="column-mapping">Column Mapping</label>
          <input 
            type="text" 
            id="column-mapping"
            className="text-input" 
            placeholder="olivia@untitledui.com"
            value={columnMapping}
            onChange={handleColumnMappingChange}
          />
          <button className="info-button" aria-label="More information">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="#98A2B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 10.6667V8" stroke="#98A2B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 5.33331H8.00667" stroke="#98A2B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div className="input-group">
          <label className="input-label" htmlFor="processed-folder">Processed Folder</label>
          <input 
            type="text" 
            id="processed-folder"
            className="text-input" 
            placeholder="olivia@untitledui.com"
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
    </div>
  );
};

export default ConnectionFields; 