import React from 'react';

interface DbTabsProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

const dbTabs = [
  
  { id: 'add-database', title: 'Database' }
];

const DbTabs: React.FC<DbTabsProps> = ({ selectedId, onSelect }) => (
  <div className="db-tables">
    {dbTabs.map(tab => (
      <div
        key={tab.id}
        className={`table-item ${selectedId === tab.id ? 'active' : ''}`}
        onClick={() => onSelect(tab.id)}
      >
        <span>{tab.title}</span>
      </div>
    ))}
  </div>
);

export default DbTabs;
