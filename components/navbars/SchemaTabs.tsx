import React from 'react';
import { Plus } from 'lucide-react';

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
      <Plus className="add-icon" />
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