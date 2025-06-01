import React, { ReactNode, useCallback } from 'react';
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
  // Enhanced props for chatbot sidebar
  chats?: any[];
  folders?: any[];
  bookmarks?: any[];
  onNewChat?: () => void;
  isBookmarked: (bookmark: boolean) => void;
  onCreateFolder?: (name: string) => void;
  onMoveToFolder?: (chatId: string, folderId: string | null) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onToggleBookmark?: (chatId: string) => void;
  refreshChats?: () => void; // Add refresh function for chat data
  setIsFromBookmarks?: (isFromBookmarks: boolean) => void; // New prop to set bookmark state
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
  bookmarks,
  onNewChat,
  isBookmarked,
  onCreateFolder,
  onMoveToFolder,
  onRenameFolder,
  onDeleteFolder,
  onDeleteChat,
  onToggleBookmark,
  refreshChats,
  setIsFromBookmarks
}) => {
  // Enhanced section tabs renderer with better error handling
  const renderSectionTabs = useCallback(() => {
    const commonProps = {
      selectedId,
      onSelect
    };

    try {
      switch (sectionType) {
        case 'chatbot':
          return (
            <ChatbotTabs
              chats={chats || []}
              folders={folders || []}
              bookmarks={bookmarks || []}
              selectedId={selectedId}
              onSelect={onSelect}
              isBookmarked={isBookmarked}
              setIsFromBookmarks={setIsFromBookmarks}
              onNewChat={onNewChat}
              onCreateFolder={onCreateFolder}
              onMoveToFolder={onMoveToFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onDeleteChat={onDeleteChat}
              onToggleBookmark={onToggleBookmark}
              refreshChats={refreshChats} // Pass refresh function
            />
          );
        
        case 'onboarding':
          return <OnboardingTabs {...commonProps} />;
        
        case 'settings':
          return <SettingsTabs {...commonProps} />;
        
        case 'llm':
          return <LLMTabs {...commonProps} />;
        
        case 'schema':
          return <SchemaTabs {...commonProps} />;
        
        case 'database':
          return <DbTabs {...commonProps} />;
        
        default:
          return null;
      }
    } catch (error) {
      console.error('Error rendering section tabs:', error);
      return (
        <div className="error-message" style={{ 
          padding: '20px', 
          textAlign: 'center', 
          color: '#dc2626',
          backgroundColor: '#fef2f2',
          borderRadius: '8px',
          margin: '10px 0'
        }}>
          <p>Error loading content. Please try refreshing the page.</p>
        </div>
      );
    }
  }, [
    sectionType, selectedId, onSelect, chats, folders, bookmarks, isBookmarked,
    onNewChat, onCreateFolder, onMoveToFolder, onRenameFolder, onDeleteFolder,
    onDeleteChat, onToggleBookmark, refreshChats
  ]);

  // Check if we should show the default items list
  const shouldShowDefaultItems = ![
    'chatbot', 
    'onboarding', 
    'settings', 
    'llm', 
    'schema', 
    'database'
  ].includes(sectionType || '');

  // Enhanced item selection handler with keyboard support
  const handleItemSelect = useCallback((itemId: string) => {
    try {
      onSelect(itemId);
    } catch (error) {
      console.error('Error selecting item:', error);
    }
  }, [onSelect]);

  // Handle keyboard events for accessibility
  const handleKeyDown = useCallback((event: React.KeyboardEvent, itemId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleItemSelect(itemId);
    }
  }, [handleItemSelect]);

  return (
    <div className="subcontent-container">
      <div className="inner-container">
        {/* Enhanced header with better typography */}
        <div className="subnav-header" role="heading" aria-level={2}>
          {title}
        </div>
        
        {/* Controls section with improved layout */}
        {(searchBox || filters) && (
          <div className="subcontent-controls">
            {searchBox && (
              <div className="subcontent-search" role="search">
                {searchBox}
              </div>
            )}
            {filters && (
              <div className="subcontent-filters">
                {filters}
              </div>
            )}
          </div>
        )}
        
        {/* Main content section */}
        <div className="section-content" role="main">
          {renderSectionTabs()}
        </div>
        
        {/* Default items list with enhanced accessibility */}
        {shouldShowDefaultItems && items.length > 0 && (
          <div 
            className="subnav-items-container" 
            role="navigation" 
            aria-label="Navigation items"
          >
            {items.map((item) => (
              <div
                key={item.id}
                className={`subnav-item-container ${item.id === selectedId ? 'active' : ''}`}
                onClick={() => handleItemSelect(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
                aria-current={item.id === selectedId ? 'page' : undefined}
                tabIndex={0}
                role="button"
                aria-label={`Navigate to ${item.title}`}
                style={{ userSelect: 'none' }}
              >
                <div className="subnav-icon-placeholder" aria-hidden="true"></div>
                <span className="subnav-item-title">{item.title}</span>
                {/* Active indicator for better visual feedback */}
                {item.id === selectedId && (
                  <div className="active-indicator" aria-hidden="true"></div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Additional controls section */}
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