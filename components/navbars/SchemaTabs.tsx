import React from 'react';

interface SchemaTabsProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

const schemaTabs = [
  { id: 'operation-table', title: 'Operation_table' },
  { id: 'trained-models', title: 'Trained Models' },
  { id: 'patient-age-metrics', title: 'Patient age metrics' },
  { id: 'demographics', title: 'Demographics' },
  { id: 'department-doctor', title: 'Department & Doctor' },
  { id: 'age-pattern', title: 'Age Pattern' },
  { id: 'age-complaints', title: 'Age and complains' },
];

const SchemaTabs: React.FC<SchemaTabsProps> = ({ selectedId, onSelect }) => (
  <div className="schema-tables">
    <div className="add-table">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
      </svg>
    </div>
    {schemaTabs.map(tab => (
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

export default SchemaTabs;
