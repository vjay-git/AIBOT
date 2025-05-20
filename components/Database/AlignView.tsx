import React, { useState } from 'react';

interface AlignmentRow {
  id: string;
  aiTable: string;
  aiField1: string;
  aiField2: string;
  systemDefaultValue: string;
}

interface AlignViewProps {
  data: AlignmentRow[];
  onCopy: (id: string) => void;
  onOptions: (id: string) => void;
}

const AlignView: React.FC<AlignViewProps> = ({ data, onCopy, onOptions }) => {
  const [selectedMapping, setSelectedMapping] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleMappingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMapping(e.target.value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredData = data.filter(row => 
    row.aiTable.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.aiField1.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.aiField2.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.systemDefaultValue.includes(searchTerm)
  );

  return (
    <div className="align-view-container">
      <div className="align-controls">
        <div className="mapping-select">
          <div className="select-label">Select Mapping</div>
          <select 
            className="mapping-dropdown" 
            value={selectedMapping}
            onChange={handleMappingChange}
          >
            <option value="">Select Mapping</option>
            <option value="mapping1">Default_System.csv</option>
            <option value="mapping2">Custom_System.csv</option>
          </select>
        </div>
      </div>

      <div className="align-results">
        <div className="results-header">
          <div className="csv-name">
            Default_System.csv
            <span className="result-count">100 Result Found</span>
          </div>
          <button className="create-button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3.33331V12.6666" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.33301 8H12.6663" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Create
          </button>
        </div>

        <div className="search-filters">
          <div className="search-container">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="search-icon">
              <path d="M14 14L10 10M11.3333 6.66667C11.3333 9.244 9.244 11.3333 6.66667 11.3333C4.08934 11.3333 2 9.244 2 6.66667C2 4.08934 4.08934 2 6.66667 2C9.244 2 11.3333 4.08934 11.3333 6.66667Z" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search" 
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <button className="filters-button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.66699 4H13.3337" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 8H12" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.66699 12H9.33366" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Filters
          </button>
        </div>

        <div className="align-table">
          <div className="align-table-header">
            <div className="checkbox-cell align-cell">
              <input 
                type="checkbox" 
                className="checkbox"
              />
            </div>
            <div className="align-cell">ai_table</div>
            <div className="align-cell">ai_field</div>
            <div className="align-cell">ai_field</div>
            <div className="align-cell">System_default_value</div>
            <div className="align-cell actions-column"></div>
          </div>

          <div className="align-table-body">
            {filteredData.map((row) => (
              <div key={row.id} className="align-table-row">
                <div className="checkbox-cell align-cell">
                  <input 
                    type="checkbox" 
                    className="checkbox"
                  />
                </div>
                <div className="align-cell">{row.aiTable}</div>
                <div className="align-cell">{row.aiField1}</div>
                <div className="align-cell">{row.aiField2}</div>
                <div className="align-cell">{row.systemDefaultValue}</div>
                <div className="align-cell actions-column">
                  <button 
                    className="copy-button" 
                    onClick={() => onCopy(row.id)}
                    aria-label="Copy row data"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.3337 6H7.33366C6.59828 6 6.00033 6.59795 6.00033 7.33333V13.3333C6.00033 14.0687 6.59828 14.6667 7.33366 14.6667H13.3337C14.069 14.6667 14.667 14.0687 14.667 13.3333V7.33333C14.667 6.59795 14.069 6 13.3337 6Z" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3.33366 10H2.66699C2.31337 10 1.97423 9.85953 1.72418 9.60948C1.47413 9.35943 1.33366 9.02029 1.33366 8.66667V2.66667C1.33366 2.31304 1.47413 1.9739 1.72418 1.72386C1.97423 1.47381 2.31337 1.33333 2.66699 1.33333H8.66699C9.02061 1.33333 9.35975 1.47381 9.6098 1.72386C9.85985 1.9739 10.0003 2.31304 10.0003 2.66667V3.33333" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button 
                    className="options-button" 
                    onClick={() => onOptions(row.id)}
                    aria-label="More options"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.00033 8.66667C8.36852 8.66667 8.66699 8.36819 8.66699 8C8.66699 7.63181 8.36852 7.33334 8.00033 7.33334C7.63214 7.33334 7.33366 7.63181 7.33366 8C7.33366 8.36819 7.63214 8.66667 8.00033 8.66667Z" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12.6663 8.66667C13.0345 8.66667 13.333 8.36819 13.333 8C13.333 7.63181 13.0345 7.33334 12.6663 7.33334C12.2981 7.33334 11.9997 7.63181 11.9997 8C11.9997 8.36819 12.2981 8.66667 12.6663 8.66667Z" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3.33366 8.66667C3.70185 8.66667 4.00033 8.36819 4.00033 8C4.00033 7.63181 3.70185 7.33334 3.33366 7.33334C2.96547 7.33334 2.66699 7.63181 2.66699 8C2.66699 8.36819 2.96547 8.66667 3.33366 8.66667Z" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlignView; 