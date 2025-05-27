import React from 'react';

interface LLMTabsProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

const llmTabs = [
  { id: 'primary-model', title: 'Primary Model' },
  { id: 'secondary-model', title: 'Secondary Model' },
  { id: 'embedded-model', title: 'Embeddings' },
  { id: 'responsive-model', title: 'Responsive Model' },
  { id: 'action-model', title: 'Action Model' },
];

const LLMTabs: React.FC<LLMTabsProps> = ({ selectedId, onSelect }) => (
  <div className="llm-models">
    {llmTabs.map(tab => (
      <div
        key={tab.id}
        className={`model-item ${selectedId === tab.id ? 'active' : ''}`}
        onClick={() => onSelect(tab.id)}
      >
        <span>{tab.title}</span>
      </div>
    ))}
  </div>
);

export default LLMTabs;
