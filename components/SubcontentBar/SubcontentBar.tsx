import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { SubNavItem } from '../../types';

interface SubcontentBarProps {
  items: SubNavItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  title: string;
  searchBox?: ReactNode;
  filters?: ReactNode;
  additionalControls?: ReactNode;
  sectionType?: string; // For section-specific UI elements
}

const SubcontentBar: React.FC<SubcontentBarProps> = ({ 
  items, 
  selectedId, 
  onSelect, 
  title,
  searchBox,
  filters,
  additionalControls,
  sectionType
}) => {
  // Add state to track if chatbot data is loaded
  const [chatbotDataLoaded, setChatbotDataLoaded] = useState(false);
  
  // Add state to track active section in chatbot
  const [activeSection, setActiveSection] = useState<'folders' | 'chats' | 'bookmarks'>('chats');
  
  // Keep track of previous section to detect navigation changes
  const prevSectionRef = useRef<string | undefined>(undefined);
  
  // Move state declarations from renderChatFolders to the component top level
  const [expandedFolders, setExpandedFolders] = useState<{[key: string]: boolean}>({});
  const [draggedChatId, setDraggedChatId] = useState<string | null>(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // State to keep track of local chats and folders
  const [localChats, setLocalChats] = useState<any[]>([]);
  const [localFolders, setLocalFolders] = useState<any[]>([]);
  
  // Reset data loaded flag when changing sections
  useEffect(() => {
    if (prevSectionRef.current !== sectionType) {
      console.log(`Section changed from ${prevSectionRef.current} to ${sectionType}`);
      
      if (sectionType === 'chatbot') {
        // Reset loading state when navigating to chatbot section
        setChatbotDataLoaded(false);
      }
      
      prevSectionRef.current = sectionType;
    }
  }, [sectionType]);
  
  // Force re-render when chatbotData becomes available
  useEffect(() => {
    if (sectionType === 'chatbot') {
      console.log('Checking for chatbotData in SubcontentBar');
      
      // Check if chatbotData is available
      const checkChatbotData = () => {
        if (typeof window !== 'undefined') {
          console.log('Window chatbotData status:', !!(window as any).chatbotData);
          
          if ((window as any).chatbotData) {
            console.log('ChatbotData found, updating state');
            setChatbotDataLoaded(true);
            
            // Initialize local state with chatbotData
            if ((window as any).chatbotData.chatSessions) {
              setLocalChats((window as any).chatbotData.chatSessions);
            }
            if ((window as any).chatbotData.folders) {
              setLocalFolders((window as any).chatbotData.folders);
            }
            
            return true;
          }
        }
        return false;
      };
      
      // Immediately check
      const hasData = checkChatbotData();
      
      // Add event listener for chatbotData updates
      const handleDataUpdated = () => {
        console.log('ChatbotDataUpdated event received');
        checkChatbotData();
      };
      
      if (typeof window !== 'undefined') {
        window.addEventListener('chatbotDataUpdated', handleDataUpdated);
      }
      
      if (!hasData) {
        console.log('No chatbotData found, setting up interval check');
        // Set up an interval to check for chatbotData (in case it's added after component mount)
        const intervalId = setInterval(() => {
          const found = checkChatbotData();
          if (found) {
            console.log('ChatbotData found during interval check, clearing interval');
            clearInterval(intervalId);
          }
        }, 500);
        
        // Clean up interval and event listener
        return () => {
          console.log('Cleaning up chatbotData check interval');
          clearInterval(intervalId);
          if (typeof window !== 'undefined') {
            window.removeEventListener('chatbotDataUpdated', handleDataUpdated);
          }
        };
      }
      
      // Clean up event listener
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('chatbotDataUpdated', handleDataUpdated);
        }
      };
    }
  }, [sectionType, chatbotDataLoaded]);
  
  // Define handlers at the component level
  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };
  
  const handleDragStart = (chatId: string) => {
    setDraggedChatId(chatId);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
  };
  
  const handleDrop = (e: React.DragEvent, folderId: string, handleMoveToFolder: Function) => {
    e.preventDefault();
    if (draggedChatId) {
      handleMoveToFolder(draggedChatId, folderId);
      setDraggedChatId(null);
    }
  };
  
  const handleCreateNewFolder = (handleCreateFolder: Function) => {
    if (newFolderName.trim()) {
      handleCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  // Handlers for chat operations
  const handleToggleBookmark = (id: string) => {
    // Update local state immediately
    setLocalChats(prevChats => prevChats.map(chat => 
      chat.id === id ? { ...chat, bookmarked: !chat.bookmarked } : chat
    ));
    console.log('Toggle bookmark', id);
  };

  const handleCreateFolder = (name: string) => {
    // Generate a new folder ID
    const newFolderId = `folder-${Date.now()}`;
    // Add new folder to local state
    const newFolder = { id: newFolderId, name };
    setLocalFolders(prev => [...prev, newFolder]);
    console.log('Create folder', name);
    return newFolder;
  };

  const handleMoveToFolder = (chatId: string, folderId: string | null) => {
    // Update local state immediately
    setLocalChats((prevChats: any[]) => prevChats.map((chat: any) => 
      chat.id === chatId ? { ...chat, folderId: folderId === null ? undefined : folderId } : chat
    ));
    console.log('Move to folder', chatId, folderId);
  };

  const handleRenameFolder = (folderId: string, newName: string) => {
    // Update local state immediately
    setLocalFolders(prevFolders => prevFolders.map(folder => 
      folder.id === folderId ? { ...folder, name: newName } : folder
    ));
    console.log('Rename folder', folderId, newName);
  };

  const handleDeleteFolder = (folderId: string) => {
    // Remove folder from local state
    setLocalFolders(prevFolders => prevFolders.filter(folder => folder.id !== folderId));
    
    // Update chats that were in this folder to have no folder
    setLocalChats(prevChats => prevChats.map(chat => 
      chat.folderId === folderId ? { ...chat, folderId: undefined } : chat
    ));
    
    console.log('Delete folder', folderId);
  };

  const handleDeleteChat = (chatId: string) => {
    // Remove chat from local state
    setLocalChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    console.log('Delete chat', chatId);
  };
  
  // Render folder structure for chatbot section
  const renderChatFolders = () => {
    if (sectionType !== 'chatbot') return null;
    
    // Access the chatbotData from the window object
    const chatbotData = typeof window !== 'undefined' ? (window as any).chatbotData : null;
    
    if (!chatbotData) {
      console.log('ChatbotData not found in renderChatFolders');
      
      // Add a fallback to manually fetch data if it's taking too long
      const handleManualLoad = async () => {
        try {
          console.log('Manually fetching chatbot data');
          const { fetchChatbotData } = await import('../../utils/apiMocks');
          const data = await fetchChatbotData();
          
          console.log('Manual fetch successful, updating window.chatbotData');
          if (typeof window !== 'undefined') {
            (window as any).chatbotData = {
              chatSessions: data.chatSessions,
              folders: data.folders,
              activeChatId: data.activeChatId,
              handleSelectChat: (id: string) => console.log('Select chat:', id),
              handleNewChat: () => console.log('New chat'),
              handleToggleBookmark: (id: string) => console.log('Toggle bookmark:', id),
              handleCreateFolder: (name: string) => console.log('Create folder:', name),
              handleMoveToFolder: (chatId: string, folderId: string | null) => 
                console.log('Move to folder:', chatId, 'to', folderId),
              handleRenameFolder: () => {},
              handleDeleteFolder: () => {},
              handleDeleteChat: () => {}
            };
            
            window.dispatchEvent(new Event('chatbotDataUpdated'));
            setChatbotDataLoaded(true);
          }
        } catch (error) {
          console.error('Error in manual load:', error);
        }
      };
      
      return (
        <div className="folder-structure">
          <div className="loading-folders">
            Loading chatbot data...
            <button 
              onClick={() => handleManualLoad()}
              style={{ 
                marginLeft: '10px',
                padding: '4px 8px',
                fontSize: '12px',
                background: '#0052FF',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Load Data
            </button>
            <button 
              onClick={() => {
                console.log('Manual refresh triggered');
                window.location.reload();
              }}
              style={{ 
                marginLeft: '10px',
                padding: '4px 8px',
                fontSize: '12px',
                background: '#333',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    
    // Add type definitions for ChatSession and ChatFolder
    interface ChatSession {
      id: string;
      title: string;
      updatedAt: string;
      bookmarked: boolean;
      folderId?: string;
    }
    
    interface ChatFolder {
      id: string;
      name: string;
    }
    
    // Use the component-level state
    const folders = localFolders;
    const chatSessions = localChats;
    const { 
      activeChatId = null,
      handleSelectChat = (id: string) => onSelect(id),
      handleNewChat = () => console.log('New chat'),
    } = chatbotData;
    
    // Get bookmarked chats from local state
    const bookmarkedChats = localChats.filter((chat: ChatSession) => chat.bookmarked);
    
    // Sort chats by most recently updated
    const recentChats = [...localChats]
      .sort((a: ChatSession, b: ChatSession) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
      
    // Get chats that are not in any folder
    const unorganizedChats = localChats.filter((chat: ChatSession) => !chat.folderId);
    
    return (
      <div className="chatbot-sidebar-content">
        {/* Navigation tabs */}
        <div className="chatbot-nav-tabs">
          <button 
            className={`chatbot-nav-tab ${activeSection === 'folders' ? 'active' : ''}`}
            onClick={() => setActiveSection('folders')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="currentColor"/>
            </svg>
            <span>Folders</span>
          </button>
          <button 
            className={`chatbot-nav-tab ${activeSection === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveSection('chats')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
            </svg>
            <span>Chats</span>
          </button>
          <button 
            className={`chatbot-nav-tab ${activeSection === 'bookmarks' ? 'active' : ''}`}
            onClick={() => setActiveSection('bookmarks')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="currentColor"/>
            </svg>
            <span>Bookmarks</span>
          </button>
        </div>

        {/* Folders Section - only show when folders tab is active */}
        {activeSection === 'folders' && (
        <div className="sidebar-section">
          <div className="section-header">
            <div className="section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="#0052FF"/>
              </svg>
              <span>Folders</span>
            </div>
            <button 
              className="add-button"
              onClick={() => setShowNewFolderInput(true)}
              aria-label="Add new folder"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          
          {showNewFolderInput && (
            <div className="new-folder-input-container">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="new-folder-input"
                autoFocus
              />
              <div className="new-folder-actions">
                <button 
                  className="new-folder-create" 
                  onClick={() => handleCreateNewFolder(handleCreateFolder)}
                  disabled={!newFolderName.trim()}
                >
                  Create
                </button>
                <button 
                  className="new-folder-cancel" 
                  onClick={() => {
                    setShowNewFolderInput(false);
                    setNewFolderName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          <div className="folders-list">
            {folders.length === 0 ? (
              <div className="empty-list-message">No folders yet</div>
            ) : (
              folders.map((folder: ChatFolder) => (
                <div key={folder.id} className="folder-container">
                  <div 
                    className="folder-header"
                    onClick={() => toggleFolderExpand(folder.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, folder.id, handleMoveToFolder)}
                  >
                    <div className="folder-icon-name">
                      <svg 
                        className={`folder-expand-icon ${expandedFolders[folder.id] ? 'expanded' : ''}`}
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="folder-name">{folder.name}</span>
                    </div>
                    <div className="folder-actions">
                      <button 
                        className="folder-action-button rename-button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Implement folder rename functionality
                          const newName = prompt("Enter new folder name:", folder.name);
                          if (newName && newName.trim() !== '' && newName !== folder.name) {
                            handleRenameFolder(folder.id, newName);
                          }
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button 
                        className="folder-action-button delete-button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete "${folder.name}" folder?`)) {
                            handleDeleteFolder(folder.id);
                          }
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {expandedFolders[folder.id] && (
                    <div className="folder-content">
                      {chatSessions.filter((chat: ChatSession) => chat.folderId === folder.id).length === 0 ? (
                        <div className="empty-folder-message">Folder is empty</div>
                      ) : (
                        chatSessions
                          .filter((chat: ChatSession) => chat.folderId === folder.id)
                          .map((chat: ChatSession) => (
                            <div 
                              key={chat.id} 
                              className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                              onClick={() => handleSelectChat(chat.id)}
                              draggable
                              onDragStart={() => handleDragStart(chat.id)}
                            >
                              <div className="chat-icon">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
                                </svg>
                              </div>
                              <span className="chat-title">{chat.title}</span>
                              <div className="chat-actions">
                                <button 
                                  className={`bookmark-button ${chat.bookmarked ? 'bookmarked' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleBookmark(chat.id);
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" fill={chat.bookmarked ? "#0052FF" : "currentColor"}/>
                                  </svg>
                                </button>
                                <button 
                                  className="delete-button" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Are you sure you want to delete "${chat.title}" chat?`)) {
                                      handleDeleteChat(chat.id);
                                    }
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        )}
        
        {/* Chats Section - only show when chats tab is active */}
        {activeSection === 'chats' && (
        <div className="sidebar-section">
          <div className="section-header">
            <div className="section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="#0052FF"/>
              </svg>
              <span>Chats</span>
            </div>
            <button 
              className="add-button"
              onClick={handleNewChat}
              aria-label="New chat"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          
          <div className="chats-list">
            {unorganizedChats.length === 0 ? (
              <div className="empty-list-message">No chats yet</div>
            ) : (
              unorganizedChats
                .sort((a: ChatSession, b: ChatSession) => 
                  new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                )
                .map((chat: ChatSession) => (
                  <div 
                    key={chat.id} 
                    className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                    onClick={() => handleSelectChat(chat.id)}
                    draggable
                    onDragStart={() => handleDragStart(chat.id)}
                  >
                    <div className="chat-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <span className="chat-title">{chat.title}</span>
                    <div className="chat-actions">
                      <button 
                        className={`bookmark-button ${chat.bookmarked ? 'bookmarked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleBookmark(chat.id);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" fill={chat.bookmarked ? "#0052FF" : "currentColor"}/>
                        </svg>
                      </button>
                      <button 
                        className="delete-button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete "${chat.title}" chat?`)) {
                            handleDeleteChat(chat.id);
                          }
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
        )}
        
        {/* Bookmarks Section - only show when bookmarks tab is active */}
        {activeSection === 'bookmarks' && (
        <div className="sidebar-section">
          <div className="section-header">
            <div className="section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="#0052FF"/>
              </svg>
              <span>Bookmarks</span>
            </div>
          </div>
          
          <div className="bookmarks-list">
            {bookmarkedChats.length === 0 ? (
              <div className="empty-list-message">No bookmarked chats</div>
            ) : (
              bookmarkedChats
                .sort((a: ChatSession, b: ChatSession) => 
                  new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                )
                .map((chat: ChatSession) => (
                  <div 
                    key={chat.id} 
                    className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <div className="chat-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <span className="chat-title">{chat.title}</span>
                    <div className="chat-actions">
                      <button 
                        className="bookmark-button bookmarked"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleBookmark(chat.id);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="#0052FF"/>
                        </svg>
                      </button>
                      <button 
                        className="delete-button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete "${chat.title}" chat?`)) {
                            handleDeleteChat(chat.id);
                          }
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
        )}
      </div>
    );
  };
  
  // Render organization setup navigation for onboarding section
  const renderOrganizationSetup = () => {
    if (sectionType !== 'onboarding') return null;
    
    return (
      <div className="organization-setup">
        <div className={`setup-item ${selectedId === 'company-profile' ? 'active' : ''}`} onClick={() => onSelect('company-profile')}>
          <span>Company Profile</span>
        </div>
        <div className={`setup-item ${selectedId === 'user-management' ? 'active' : ''}`} onClick={() => onSelect('user-management')}>
          <span>User Management</span>
        </div>
        <div className={`setup-item ${selectedId === 'tools-integration' ? 'active' : ''}`} onClick={() => onSelect('tools-integration')}>
          <span>Tools Integration</span>
        </div>
        <div className={`setup-item ${selectedId === 'roles-permissions' ? 'active' : ''}`} onClick={() => onSelect('roles-permissions')}>
          <span>Roles & Permissions</span>
        </div>
        <div className={`setup-item ${selectedId === 'subscription-plan' ? 'active' : ''}`} onClick={() => onSelect('subscription-plan')}>
          <span>Subscription Plan</span>
        </div>
        <div className={`setup-item ${selectedId === 'license-management' ? 'active' : ''}`} onClick={() => onSelect('license-management')}>
          <span>License Management</span>
        </div>
      </div>
    );
  };
  
  // Render user settings navigation for settings section
  const renderUserSettings = () => {
    if (sectionType !== 'settings') return null;
    
    return (
      <div className="user-settings">
        <div className={`settings-item ${selectedId === 'profile-security' ? 'active' : ''}`} onClick={() => onSelect('profile-security')}>
          <span>Profile & Security</span>
        </div>
        <div className={`settings-item ${selectedId === 'customisation' ? 'active' : ''}`} onClick={() => onSelect('customisation')}>
          <span>Customisation</span>
        </div>
      </div>
    );
  };
  
  // Render LLM model navigation
  const renderLLMModels = () => {
    if (sectionType !== 'llm') return null;
    
    return (
      <div className="llm-models">
        <div className={`model-item ${selectedId === 'primary-model' ? 'active' : ''}`} onClick={() => onSelect('primary-model')}>
          <span>Primary Model</span>
        </div>
        <div className={`model-item ${selectedId === 'secondary-model' ? 'active' : ''}`} onClick={() => onSelect('secondary-model')}>
          <span>Secondary Model</span>
        </div>
        <div className={`model-item ${selectedId === 'embedded-model' ? 'active' : ''}`} onClick={() => onSelect('embedded-model')}>
          <span>Embeddings</span>
        </div>
        <div className={`model-item ${selectedId === 'responsive-model' ? 'active' : ''}`} onClick={() => onSelect('responsive-model')}>
          <span>Responsive Model</span>
        </div>
        <div className={`model-item ${selectedId === 'action-model' ? 'active' : ''}`} onClick={() => onSelect('action-model')}>
          <span>Action Model</span>
        </div>
      </div>
    );
  };
  
  // Render schema tables navigation
  const renderSchemaTables = () => {
    if (sectionType !== 'schema') return null;
    
    return (
      <div className="schema-tables">
        <div className="add-table">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
          </svg>
        </div>
        <div className={`table-item ${selectedId === 'operation-table' ? 'active' : ''}`} onClick={() => onSelect('operation-table')}>
          <span>Operation_table</span>
        </div>
        <div className={`table-item ${selectedId === 'trained-models' ? 'active' : ''}`} onClick={() => onSelect('trained-models')}>
          <span>Trained Models</span>
        </div>
        <div className={`table-item ${selectedId === 'patient-age-metrics' ? 'active' : ''}`} onClick={() => onSelect('patient-age-metrics')}>
          <span>Patient age metrics</span>
        </div>
        <div className={`table-item ${selectedId === 'demographics' ? 'active' : ''}`} onClick={() => onSelect('demographics')}>
          <span>Demographics</span>
        </div>
        <div className={`table-item ${selectedId === 'department-doctor' ? 'active' : ''}`} onClick={() => onSelect('department-doctor')}>
          <span>Department & Doctor</span>
        </div>
        <div className={`table-item ${selectedId === 'age-pattern' ? 'active' : ''}`} onClick={() => onSelect('age-pattern')}>
          <span>Age Pattern</span>
        </div>
        <div className={`table-item ${selectedId === 'age-complaints' ? 'active' : ''}`} onClick={() => onSelect('age-complaints')}>
          <span>Age and complains</span>
        </div>
      </div>
    );
  };

  return (
    <div className="subcontent-container">
      <div className="inner-container">
        <div className="subnav-header">{title}</div>
        
        {/* Search box and filters */}
        {(searchBox || filters) && (
          <div className="subcontent-controls">
            {searchBox && <div className="subcontent-search">{searchBox}</div>}
            {filters && <div className="subcontent-filters">{filters}</div>}
          </div>
        )}
        
        {/* Section-specific UI elements */}
        {renderChatFolders()}
        {renderOrganizationSetup()}
        {renderUserSettings()}
        {renderLLMModels()}
        {renderSchemaTables()}
        
        {/* Default navigation items for other sections, excluding chatbot and onboarding */}
        {(sectionType !== 'chatbot' && sectionType !== 'onboarding' && items.length > 0) && (
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
        
        {/* Additional controls (if any) */}
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