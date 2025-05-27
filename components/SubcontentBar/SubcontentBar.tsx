import React, { ReactNode } from 'react';
import { SubNavItem } from '../../types';
import ChatbotTabs from '../navbars/ChatbotTabs';
import OnboardingTabs from '../navbars/OnboardingTabs';
import SettingsTabs from '../navbars/SettingsTabs';
import LLMTabs from '../navbars/LLMTabs';
import SchemaTabs from '../navbars/SchemaTabs';
import DbTabs from '../navbars/DbTabs';

interface SubcontentBarProps {
  items: SubNavItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  title: string;
  searchBox?: ReactNode;
  filters?: ReactNode;
  additionalControls?: ReactNode;
  sectionType?: string;
  // New props for chatbot sidebar
  chats?: any[];
  folders?: any[];
  onNewChat?: () => void;
  onCreateFolder?: (name: string) => void;
  onMoveToFolder?: (chatId: string, folderId: string | null) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onToggleBookmark?: (chatId: string) => void;
}

const SubcontentBar: React.FC<SubcontentBarProps> = ({ 
  items, 
  selectedId, 
  onSelect, 
  title,
  searchBox,
  filters,
  additionalControls,
  sectionType,
  chats,
  folders,
  onNewChat,
  onCreateFolder,
  onMoveToFolder,
  onRenameFolder,
  onDeleteFolder,
  onDeleteChat,
  onToggleBookmark
}) => {
  // Only keep UI state (activeSection, expandedFolders, etc.) in ChatbotTabs
  const renderSectionTabs = () => {
    if (sectionType === 'chatbot') {
      return (
        <ChatbotTabs
          chats={chats || []}
          folders={folders || []}
          selectedId={selectedId}
          onSelect={onSelect}
          onNewChat={onNewChat}
          onCreateFolder={onCreateFolder}
          onMoveToFolder={onMoveToFolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
          onDeleteChat={onDeleteChat}
          onToggleBookmark={onToggleBookmark}
        />
      );
    }
    if (sectionType === 'onboarding') {
      return (
        <OnboardingTabs
          selectedId={selectedId}
          onSelect={onSelect}
        />
      );
    }
    if (sectionType === 'settings') {
      return (
        <SettingsTabs
          selectedId={selectedId}
          onSelect={onSelect}
        />
      );
    }
    if (sectionType === 'llm') {
      return (
        <LLMTabs
          selectedId={selectedId}
          onSelect={onSelect}
        />
      );
    }
    if (sectionType === 'schema') {
      return (
        <SchemaTabs
          selectedId={selectedId}
          onSelect={onSelect}
        />
      );
    }
    if (sectionType === 'database') {
      return (
        <DbTabs
          selectedId={selectedId}
          onSelect={onSelect}
        />
      );
    }
    return null;
  };

  return (
    <div className="subcontent-container">
      <div className="inner-container">
        <div className="subnav-header">{title}</div>
        {(searchBox || filters) && (
          <div className="subcontent-controls">
            {searchBox && <div className="subcontent-search">{searchBox}</div>}
            {filters && <div className="subcontent-filters">{filters}</div>}
          </div>
        )}
        {renderSectionTabs()}
        {(sectionType !== 'chatbot' && sectionType !== 'onboarding' && sectionType !== 'settings' && sectionType !== 'llm' && sectionType !== 'schema' && sectionType !== 'database' && items.length > 0) && (
          <div className="subnav-items-container">
            {items.map((item) => (
              <div
                key={item.id}
                className={`subnav-item-container ${item.id === selectedId ? 'active' : ''}`}
                onClick={() => onSelect(item.id)}
                aria-current={item.id === selectedId ? 'page' : undefined}
                tabIndex={0}
                role="button"
                style={{ userSelect: 'none' }}
              >
                <div className="subnav-icon-placeholder"></div>
                {item.title}
              </div>
            ))}
          </div>
        )}
        {additionalControls && (
          <div className="subcontent-additional-controls">
            {additionalControls}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubcontentBar;
