import React, { ReactNode, useCallback, useRef, useState, useEffect } from 'react';
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
  refreshChats?: () => void;
  setIsFromBookmarks?: (isFromBookmarks: boolean) => void;
  setIsFromFolder?: (isFromFolder: boolean) => void;
  // New props for database section
  selectedDatabaseType?: string;
  onAddDatabase?: () => void;
  connectedDatabases?: string[];
}

const MIN_WIDTH = 200;
const MAX_WIDTH = 420;

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
  setIsFromBookmarks,
  setIsFromFolder,
  selectedDatabaseType,
  onAddDatabase,
  connectedDatabases
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
              setIsFromFolder={setIsFromFolder}
              onNewChat={onNewChat}
              onCreateFolder={onCreateFolder}
              onMoveToFolder={onMoveToFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onDeleteChat={onDeleteChat}
              onToggleBookmark={onToggleBookmark}
              refreshChats={refreshChats}
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
          return (
            <DbTabs 
              {...commonProps}
              selectedDatabaseType={selectedDatabaseType}
              onAddDatabase={onAddDatabase}
              connectedDatabases={connectedDatabases}
            />
          );
        
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
    onDeleteChat, onToggleBookmark, refreshChats, setIsFromBookmarks, setIsFromFolder,
    selectedDatabaseType, onAddDatabase, connectedDatabases
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

  // --- Resizable Sidebar Logic ---
  const [sidebarWidth, setSidebarWidth] = useState(270); // default width
  const isResizing = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      // Calculate new width relative to the left edge of the sidebar
      const sidebarLeft = document.querySelector('.subcontent-container')?.getBoundingClientRect().left || 0;
      let newWidth = e.clientX - sidebarLeft;
      newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
      setSidebarWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, []);

  const handleResizerMouseDown = (e: React.MouseEvent) => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  };

  return (
    <div
      className="subcontent-container resizable-subcontentbar"
      style={{ width: sidebarWidth, minWidth: MIN_WIDTH, maxWidth: MAX_WIDTH }}
    >
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
      
      <div
        className="subcontentbar-resizer"
        onMouseDown={handleResizerMouseDown}
        role="separator"
        aria-orientation="vertical"
        tabIndex={0}
        aria-label="Resize sidebar"
      />
    </div>
  );
};

export default SubcontentBar;