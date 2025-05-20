import React, { useState } from 'react';

interface SheetSelectorProps {
  sheets: string[];
  onSelectSheet: (sheet: string) => void;
}

const SheetSelector: React.FC<SheetSelectorProps> = ({ sheets, onSelectSheet }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelectSheet = (sheet: string) => {
    setSelectedSheet(sheet);
    setIsOpen(false);
    onSelectSheet(sheet);
  };

  return (
    <div className="sheet-selector-container">
      <div className="selector-label">Select Sheet</div>
      <div className="dropdown-container">
        <button 
          className="dropdown-button" 
          onClick={toggleDropdown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {selectedSheet ? (
            <span>{selectedSheet}</span>
          ) : (
            <span className="placeholder">Select Sheet</span>
          )}
          <svg 
            className={`dropdown-arrow ${isOpen ? 'open' : ''}`} 
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M5 7.5L10 12.5L15 7.5" 
              stroke="#666666" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
        
        {isOpen && (
          <div className="dropdown-menu" role="listbox">
            {sheets.map((sheet) => (
              <div 
                key={sheet} 
                className="dropdown-item" 
                onClick={() => handleSelectSheet(sheet)}
                role="option"
                aria-selected={selectedSheet === sheet}
              >
                {sheet}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SheetSelector; 