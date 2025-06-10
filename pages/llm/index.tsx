// pages/llm/index.tsx - Updated with all model components

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DynamicModelComponent from '../../components/LLM/DynamicModelComponent';

// Export tabs for the Layout component
export const llmTabs = [
  { id: 'primary-model', title: 'Primary Model', parentId: 'llm' },
  { id: 'secondary-model', title: 'Secondary Model', parentId: 'llm' },
  { id: 'embedded-model', title: 'Embeddings', parentId: 'llm' },
  { id: 'responsive-model', title: 'Responsive Model', parentId: 'llm' },
  { id: 'action-model', title: 'Action Model', parentId: 'llm' },
  { id: 'web-scraping-model', title: 'Web Scraping Model', parentId: 'llm' },
];

const LLM = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('primary-model');

  // Set activeTab based on URL query parameter
  useEffect(() => {
    if (router.isReady) {
      const { tab } = router.query;
      if (tab) {
        setActiveTab(tab as string);
      }
    }
  }, [router.isReady, router.query]);

  // Render the appropriate component based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'primary-model':
        return (
          <DynamicModelComponent 
            modelType="primary" 
            title="Primary Model" 
          />
        );
      case 'secondary-model':
        return (
          <DynamicModelComponent 
            modelType="secondary" 
            title="Secondary Model" 
          />
        );
      case 'embedded-model':
        return (
          <DynamicModelComponent 
            modelType="embedding" 
            title="Embeddings Model" 
          />
        );
      case 'responsive-model':
        return (
          <DynamicModelComponent 
            modelType="response" 
            title="Responsive Model" 
          />
        );
      case 'action-model':
        return (
          <DynamicModelComponent 
            modelType="action" 
            title="Action Model" 
          />
        );
      case 'web-scraping-model':
        return (
          <DynamicModelComponent 
            modelType="scrapper" 
            title="Web Scraping Model" 
          />
        );
      default:
        return (
          <DynamicModelComponent 
            modelType="primary" 
            title="Primary Model" 
          />
        );
    }
  };

  return (
    <div className="llm-page">
      {renderContent()}
    </div>
  );
};

export default LLM;