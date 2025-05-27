import React from 'react';

interface SettingsTabsProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

const settingsTabs = [
  { id: 'profile-security', title: 'Profile & Security' },
  { id: 'customisation', title: 'Customisation' },
];

const SettingsTabs: React.FC<SettingsTabsProps> = ({ selectedId, onSelect }) => (
  <div className="user-settings">
    {settingsTabs.map(tab => (
      <div
        key={tab.id}
        className={`settings-item ${selectedId === tab.id ? 'active' : ''}`}
        onClick={() => onSelect(tab.id)}
      >
        <span>{tab.title}</span>
      </div>
    ))}
  </div>
);

export default SettingsTabs;
