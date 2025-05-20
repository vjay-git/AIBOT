import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SubcontentBar from '../../components/SubcontentBar/SubcontentBar';
import CompanyProfile from '../../components/Onboarding/CompanyProfile';
import UserManagement from '../../components/Onboarding/UserManagement';
import ToolsIntegration from '../../components/Onboarding/ToolsIntegration';
import RolesPermissions from '../../components/Onboarding/RolesPermissions';
import SubscriptionPlan from '../../components/Onboarding/SubscriptionPlan';
import LicenseManagement from '../../components/Onboarding/LicenseManagement';

// Subnav items for customer onboarding
export const onboardingTabs = [
  { id: 'company-profile', title: 'Company Profile' },
  { id: 'user-management', title: 'User Management' },
  { id: 'tools-integration', title: 'Tools Integration' },
  { id: 'roles-permissions', title: 'Roles & Permissions' },
  { id: 'subscription-plan', title: 'Subscription Plan' },
  { id: 'license-management', title: 'License Management' },
];

const CustomerOnboarding = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('company-profile');

  // Set activeTab based on URL query parameter
  useEffect(() => {
    if (router.isReady) {
      const { tab } = router.query;
      if (tab) {
        setActiveTab(tab as string);
      }
    }
  }, [router.isReady, router.query]);

  // Handle tab selection
  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
    router.push({
      pathname: router.pathname,
      query: { ...router.query, tab: tabId },
    }, undefined, { shallow: true });
  };

  // Render the appropriate component based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'company-profile':
        return <CompanyProfile />;
      case 'user-management':
        return <UserManagement />;
      case 'tools-integration':
        return <ToolsIntegration />;
      case 'roles-permissions':
        return <RolesPermissions />;
      case 'subscription-plan':
        return <SubscriptionPlan />;
      case 'license-management':
        return <LicenseManagement />;
      default:
        return <CompanyProfile />;
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default CustomerOnboarding;