import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PrimaryModel from '../../components/LLM/PrimaryModel';

// Placeholder components for other LLM sections
const SecondaryModel = () => <div className="llm-section">Secondary Model content placeholder</div>;
const EmbeddedModel = () => <div className="llm-section">Embedded Model content placeholder</div>;
const ResponsiveModel = () => <div className="llm-section">Responsive Model content placeholder</div>;
const ActionModel = () => <div className="llm-section">Action Model content placeholder</div>;


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
        return <PrimaryModel />;
      case 'secondary-model':
        return <SecondaryModel />;
      case 'embedded-model':
        return <EmbeddedModel />;
      case 'responsive-model':
        return <ResponsiveModel />;
      case 'action-model':
        return <ActionModel />;
      default:
        return <PrimaryModel />;
    }
  };

  return renderContent();
};

export default LLM;