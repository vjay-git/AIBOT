// components/navbars/LLMTabs.tsx - Updated with Web Scraping Model

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
  { id: 'web-scraping-model', title: 'Web Scraping Model' }, // NEW: Added Web Scraping
];

const LLMTabs: React.FC<LLMTabsProps> = ({ selectedId, onSelect }) => (
  <div className="llm-models">
    {llmTabs.map(tab => (
      <div
        key={tab.id}
        className={`model-item ${selectedId === tab.id ? 'active' : ''}`}
        onClick={() => onSelect(tab.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(tab.id);
          }
        }}
        aria-label={`Select ${tab.title}`}
      >
        <span>{tab.title}</span>
      </div>
    ))}
  </div>
);

export default LLMTabs;