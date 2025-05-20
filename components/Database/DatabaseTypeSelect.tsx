import React, { useState } from 'react';

interface DatabaseTypeOption {
  id: string;
  name: string;
  icon?: string;
}

interface DatabaseTypeSelectProps {
  onSelectType: (type: string) => void;
}

const DatabaseTypeSelect: React.FC<DatabaseTypeSelectProps> = ({ onSelectType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<DatabaseTypeOption | null>(null);

  const databaseTypes: DatabaseTypeOption[] = [
    { id: 'excel', name: 'Microsoft Excel', icon: '🟩' },
    { id: 'oracle', name: 'Oracle Database', icon: '🔴' },
    { id: 'postgresql', name: 'PostgreSQL', icon: '🟦' },
    { id: 'mysql', name: 'My SQL', icon: '🟦' },
    { id: 'sap', name: 'SAP HANA', icon: '🟦' },
    { id: 'google', name: 'Google Cloud SQL', icon: '🟨' },
    { id: 'azure', name: 'Azure SQL Database', icon: '🟦' },
    { id: 'mariadb', name: 'MariaDB', icon: '🟦' },
  ];

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelectType = (type: DatabaseTypeOption) => {
    setSelectedType(type);
    setIsOpen(false);
    onSelectType(type.id);
  };

  return (
    <div className="db-type-section">
      <div className="section-label">Database Type</div>
      <div className="section-description">A database type is the specific kind of system used to store</div>
      
      <div className="dropdown-container">
        <button 
          className="dropdown-button" 
          onClick={toggleDropdown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {selectedType ? (
            <div className="selected-option">
              <span className="option-icon">{selectedType.icon}</span>
              <span className="option-text">{selectedType.name}</span>
            </div>
          ) : (
            <span className="placeholder">Select Model</span>
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
            {databaseTypes.map((type) => (
              <div 
                key={type.id} 
                className="dropdown-item" 
                onClick={() => handleSelectType(type)}
                role="option"
                aria-selected={selectedType?.id === type.id}
              >
                <span className="option-icon">{type.icon}</span>
                <span className="option-text">{type.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseTypeSelect; 