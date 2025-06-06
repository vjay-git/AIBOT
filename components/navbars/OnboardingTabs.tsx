import React from 'react';

interface OnboardingTabsProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

const onboardingTabs = [
  { id: 'company-profile', title: 'Company Profile' },
  { id: 'user-management', title: 'User Management' },
  { id: 'tools-integration', title: 'Tools Integration' },
  { id: 'roles-permissions', title: 'Roles & Permissions' },
  // { id: 'subscription-plan', title: 'Subscription Plan' },
  { id: 'license-management', title: 'License Management' },
];

const OnboardingTabs: React.FC<OnboardingTabsProps> = ({ selectedId, onSelect }) => (
  <div className="organization-setup">
    {onboardingTabs.map(tab => (
      <div
        key={tab.id}
        className={`setup-item ${selectedId === tab.id ? 'active' : ''}`}
        onClick={() => onSelect(tab.id)}
      >
        <span>{tab.title}</span>
      </div>
    ))}
  </div>
);

export default OnboardingTabs;
