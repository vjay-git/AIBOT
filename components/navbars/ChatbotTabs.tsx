import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { SubNavItem } from '../../types';
import clsx from 'clsx';

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  bookmarked: boolean;
  folderId?: string;
  bookmarkId?: string;
  messages?: any[];
}

interface ChatFolder {
  id: string;
  name: string;
}

interface ChatbotTabsProps {
  chats: ChatSession[];
  folders: ChatFolder[];
  bookmarks: ChatFolder[];
  selectedId: string;
  onSelect: (id: string) => void;
  isBookmarked: (bookmark: boolean) => void;
  onNewChat?: () => void;
  onCreateFolder?: (name: string) => void;
  onMoveToFolder?: (chatId: string, folderId: string | null) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onToggleBookmark?: (chatId: string) => void;
  refreshChats?: () => void; // Add this prop to refresh chat list after deletion
  setIsFromBookmarks?: (isFromBookmarks: boolean) => void; // Optional prop to set bookmark state
  autoRefreshInterval?: number; // Auto-refresh interval in milliseconds (default: 30000ms = 30s)
  enableAutoRefresh?: boolean; // Enable/disable auto-refresh (default: true)
}

// API function to delete thread
async function deletedThreadById(threadId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/thread/${threadId}`;
  
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete thread: ${res.status} ${errorText}`);
  }
  
  return await res.json();
}

const NAV_ITEMS = [
  {
    key: 'chats',
    icon: <svg width="20" height="20" fill="none"><path d="M4 4h12v10H5.17L4 15.17V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
    label: 'Chats',
    group: 'main',
  },
  {
    key: 'bookmarks',
    icon: <svg width="20" height="20" fill="none"><path d="M6 4h8v12l-4-3-4 3V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
    label: 'Bookmarks',
    group: 'main',
  },
  {
    key: 'settings',
    icon: <svg width="20" height="20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6v4l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    label: 'Settings',
    group: 'secondary',
  },
];

const ChatbotTabs: React.FC<ChatbotTabsProps> = ({
  chats,
  folders,
  selectedId,
  bookmarks,
  onSelect,
  isBookmarked,
  onNewChat,
  onCreateFolder,
  onMoveToFolder,
  onRenameFolder,
  onDeleteFolder,
  onDeleteChat,
  onToggleBookmark,
  refreshChats,
  setIsFromBookmarks,
  autoRefreshInterval = 30000, // Default 30 seconds
  enableAutoRefresh = true // Default enabled
}) => {
  // Local state for tab switching (folders, chats, bookmarks)
  const [activeSection, setActiveSection] = useState<'folders' | 'chats' | 'bookmarks'>('chats');
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({});
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deletingChats, setDeletingChats] = useState<Set<string>>(new Set());
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('chats');
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // UI state for expand/collapse
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [chatsExpanded, setChatsExpanded] = useState(true);
  const [bookmarksExpanded, setBookmarksExpanded] = useState(true);
  const [showAllChats, setShowAllChats] = useState(false);
  const MAX_CHATS_DISPLAY = 5;

  // Simple reverse of chats array (newest first - assuming API returns oldest first)
  const sortedChats = useMemo(() => {
    return [...chats].reverse();
  }, [chats]);

  // Simple reverse of bookmarks array (newest first - assuming API returns oldest first)
  const sortedBookmarks = useMemo(() => {
    return [...bookmarks].reverse();
  }, [bookmarks]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!enableAutoRefresh || !refreshChats) return;

    const handleAutoRefresh = async () => {
      try {
        setIsRefreshing(true);
        await refreshChats();
        setLastRefreshTime(new Date());
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    const intervalId = setInterval(handleAutoRefresh, autoRefreshInterval);

    // Initial refresh on mount
    handleAutoRefresh();

    return () => {
      clearInterval(intervalId);
    };
  }, [enableAutoRefresh, refreshChats, autoRefreshInterval]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(async () => {
    if (!refreshChats || isRefreshing) return;

    try {
      setIsRefreshing(true);
      await refreshChats();
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshChats, isRefreshing]);

  // Helper functions for folder expand/collapse
  const toggleFolderExpand = useCallback((folderId: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  }, []);

  // Bookmarked and unorganized chats
  const bookmarkedChats = sortedChats.filter(chat => chat?.bookmarked);
  const unorganizedChats = sortedChats;

  // FIXED: Updated ChatbotTabs bookmark selection logic
  const handleFolderSelect = useCallback((folderId: string | null, bookmarked: boolean = false, isFromBookmarks: boolean = false) => {
    console.log(`Selected folder: ${folderId}, isFromBookmarks: ${isFromBookmarks}`);
    onSelect(folderId || '');
    
    // IMPORTANT: For bookmarks, always pass true for the bookmark status
    if (isFromBookmarks) {
      isBookmarked(true); // Always true for bookmarks
    } else {
      isBookmarked(bookmarked);
    }

    // FIXED: Always set the isFromBookmarks state, whether true or false
    if (setIsFromBookmarks) {
      setIsFromBookmarks(isFromBookmarks);
    }
  }, [onSelect, isBookmarked, setIsFromBookmarks]);

  // Enhanced delete handler with API integration
  const handleDeleteChat = useCallback(async (chatId: string, chatTitle: string) => {
    // Prevent multiple simultaneous deletions of the same chat
    if (deletingChats.has(chatId)) {
      return;
    }

    // Show confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the chat "${chatTitle}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmDelete) {
      return;
    }

    // Add to deleting set to prevent multiple deletions
    setDeletingChats(prev => new Set(prev).add(chatId));

    try {
      // Call the API to delete the thread
      await deletedThreadById(chatId);
      
      console.log(`Successfully deleted chat: ${chatId}`);
      
      // Call the parent's onDeleteChat handler if provided
      if (onDeleteChat) {
        onDeleteChat(chatId);
      }
      
      // Refresh the chat list to reflect the deletion
      if (refreshChats) {
        await refreshChats();
        setLastRefreshTime(new Date());
      }
      
      // If the deleted chat was selected, clear the selection
      if (selectedId === chatId) {
        onSelect('');
      }

    } catch (error) {
      console.error('Error deleting chat:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to delete chat. Please try again.';
      
      alert(`Error: ${errorMessage}`);
    } finally {
      // Remove from deleting set
      setDeletingChats(prev => {
        const newSet = new Set(prev);
        newSet.delete(chatId);
        return newSet;
      });
    }
  }, [deletingChats, onDeleteChat, refreshChats, selectedId, onSelect]);

  // Enhanced folder creation handler
  const handleCreateFolder = useCallback(() => {
    if (onCreateFolder && newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  }, [onCreateFolder, newFolderName]);

  // Handle keyboard events for folder creation
  const handleFolderInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateFolder();
    } else if (e.key === 'Escape') {
      setShowNewFolderInput(false);
      setNewFolderName('');
    }
  }, [handleCreateFolder]);

  // Format last refresh time
  const formatRefreshTime = useCallback((date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffSeconds < 10) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  return (
    <aside className="chat-sidebar">
      {/* Header with New Chat and Refresh buttons */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {/* Refresh button */}
          <button 
            className="refresh-button-sidebar" 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title={`Last updated: ${formatRefreshTime(lastRefreshTime)}${enableAutoRefresh ? ` (Auto-refresh every ${autoRefreshInterval/1000}s)` : ''}`}
            aria-label="Refresh chats"
            style={{
              background: 'none',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              padding: '6px',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              color: '#1a237e',
              opacity: isRefreshing ? 0.6 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none"
              style={{
                transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)',
                transition: 'transform 1s linear'
              }}
            >
              <path 
                d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M21 3v5h-5" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M3 21v-5h5" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
          
          {/* Last refresh time indicator */}
          <span style={{fontSize:'10px',color:'#666',whiteSpace:'nowrap'}}>
            {formatRefreshTime(lastRefreshTime)}
          </span>
        </div>

        {/* New Chat Button */}
        <button 
          className="new-chat-button-sidebar" 
          onClick={onNewChat} 
          title="Start new chat" 
          aria-label="Start new chat"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="#1a237e" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Auto-refresh status indicator */}
      {enableAutoRefresh && (
        <div style={{
          fontSize: '10px',
          color: '#888',
          textAlign: 'center',
          marginBottom: '8px',
          padding: '2px 8px',
          background: '#f8f9fa',
          borderRadius: '4px',
          border: '1px solid #e9ecef'
        }}>
          Auto-refresh: {autoRefreshInterval / 1000}s
        </div>
      )}

      {/* Folders Section */}
      <div className="section-title" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{color:'#1a237e',fontWeight:600}}>Folders</span>
        <button 
          className="new-chat-button-sidebar" 
          onClick={() => setFoldersExpanded(e => !e)} 
          title={foldersExpanded ? 'Collapse folders' : 'Expand folders'} 
          aria-label="Toggle folders" 
          style={{background:'none',color:'#1a237e',boxShadow:'none',border:'none',fontSize:18}}
        >
          {foldersExpanded ? <span>&#8722;</span> : <span>&#43;</span>}
        </button>
      </div>
      {foldersExpanded && (
        <div className="folder-list">
          {folders.length === 0 ? (
            <div className="empty-list-message">No folders yet</div>
          ) : (
            folders.map(folder => {
              const folderChats = sortedChats.filter(chat => chat.folderId === folder.id);
              // Reverse folder chats as well (newest first)
              const reversedFolderChats = [...folderChats].reverse();
              const isExpanded = expandedFolders[folder.id] ?? false;
              return (
                <div key={folder.id}>
                  <div
                    className={clsx('folder-item', { expanded: isExpanded })}
                    style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}
                    onClick={() => toggleFolderExpand(folder.id)}
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-controls={`folder-chats-${folder.id}`}
                    role="button"
                  >
                    <div style={{display:'flex',alignItems:'center'}}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{marginRight:8}}>
                        <path d="M4 4h16v16H4z" stroke="#1a237e" strokeWidth="1.5"/>
                      </svg>
                      <span>{folder.name}</span>
                    </div>
                    <span className="folder-chevron" style={{marginLeft:8,fontSize:16,transition:'transform 0.25s'}}>
                      {isExpanded ? '\u25BC' : '\u25B6'}
                    </span>
                  </div>
                  <div
                    id={`folder-chats-${folder.id}`}
                    className="chat-list"
                    style={{
                      marginLeft:24,
                      maxHeight: isExpanded ? (reversedFolderChats.length * 48 + 32) + 'px' : '0px',
                      opacity: isExpanded ? 1 : 0,
                      pointerEvents: isExpanded ? 'auto' : 'none',
                    }}
                    aria-hidden={!isExpanded}
                  >
                    {isExpanded && reversedFolderChats.length > 0 && (
                      reversedFolderChats.map(chat => (
                        <div 
                          key={chat.id} 
                          className={clsx('chat-item', { active: selectedId === chat.id })} 
                          onClick={() => handleFolderSelect(chat.id, chat.bookmarked || false, false)} // FIXED: Explicitly pass false for isFromBookmarks
                          tabIndex={0} 
                          role="button"
                        >
                          <div className="chat-info">
                            <span className="chat-title">{chat.title}</span>
                          </div>
                        </div>
                      ))
                    )}
                    {isExpanded && reversedFolderChats.length === 0 && (
                      <div className="empty-list-message">No chats in this folder</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      <hr style={{margin:'16px 0',border:'none',borderTop:'1px solid #eee'}}/>
      
      {/* Chats Section */}
      <div className="section-title" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{color:'#1a237e',fontWeight:600}}>
          Chats 
          <span style={{fontSize:'12px',color:'#888',marginLeft:'4px'}}>
            ({sortedChats.length})
          </span>
        </span>
        <button 
          className="new-chat-button-sidebar" 
          onClick={() => setChatsExpanded(e => !e)} 
          title={chatsExpanded ? 'Collapse chats' : 'Expand chats'} 
          aria-label="Toggle chats" 
          style={{background:'none',color:'#1a237e',boxShadow:'none',border:'none',fontSize:18}}
        >
          {chatsExpanded ? <span>&#8722;</span> : <span>&#43;</span>}
        </button>
      </div>
      {chatsExpanded && (
        <div className="chat-list">
          {(showAllChats ? sortedChats : sortedChats.slice(0, MAX_CHATS_DISPLAY)).map(chat => (
            <div 
              key={chat.id} 
              className={clsx('chat-item', { active: selectedId === chat.id })} 
              onClick={() => handleFolderSelect(chat.id, chat.bookmarked || false, false)} // FIXED: Explicitly pass false for isFromBookmarks
            >
              <div className="chat-info">
                <span className="chat-title">{chat.title}</span>
                {chat.updatedAt && (
                  <span style={{fontSize:'10px',color:'#888',display:'block'}}>
                    {formatRefreshTime(new Date(chat.updatedAt))}
                  </span>
                )}
              </div>
            </div>
          ))}
          {sortedChats.length > MAX_CHATS_DISPLAY && !showAllChats && (
            <div style={{padding:'4px 0'}}>
              <button 
                style={{background:'none',color:'#1a237e',border:'none',fontWeight:600,cursor:'pointer',padding:0}} 
                onClick={()=>setShowAllChats(true)}
              >
                View all {sortedChats.length} &gt;
              </button>
            </div>
          )}
          {showAllChats && sortedChats.length > MAX_CHATS_DISPLAY && (
            <div style={{padding:'4px 0'}}>
              <button 
                style={{background:'none',color:'#1a237e',border:'none',fontWeight:600,cursor:'pointer',padding:0}} 
                onClick={()=>setShowAllChats(false)}
              >
                Show less
              </button>
            </div>
          )}
        </div>
      )}
      <hr style={{margin:'16px 0',border:'none',borderTop:'1px solid #eee'}}/>
      
      {/* Bookmarks Section */}
      <div className="section-title" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{color:'#1a237e',fontWeight:600}}>
          Bookmarks
          <span style={{fontSize:'12px',color:'#888',marginLeft:'4px'}}>
            ({sortedBookmarks.length})
          </span>
        </span>
        <button 
          className="new-chat-button-sidebar" 
          onClick={() => setBookmarksExpanded(e => !e)} 
          title={bookmarksExpanded ? 'Collapse bookmarks' : 'Expand bookmarks'} 
          aria-label="Toggle bookmarks" 
          style={{background:'none',color:'#1a237e',boxShadow:'none',border:'none',fontSize:18}}
        >
          {bookmarksExpanded ? <span>&#8722;</span> : <span>&#43;</span>}
        </button>
      </div>
      {bookmarksExpanded && (
        <div className="folder-list">
          {sortedBookmarks.length === 0 ? (
            <div className="empty-list-message">No bookmarks yet</div>
          ) : (
            sortedBookmarks.map(bookmark => (
              <div 
                key={bookmark.id || bookmark.bookmark_id} 
                className={clsx('chat-item', { active: selectedId === (bookmark.id || bookmark.bookmark_id) })}  
                style={{display:'flex',alignItems:'center'}} 
                onClick={() => handleFolderSelect(bookmark.id || bookmark.bookmark_id, true, true)} // Pass true for both bookmark flags
                tabIndex={0} 
                role="button"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{marginRight:8}}>
                  <path d="M6 4h12v16l-6-4-6 4V4z" stroke="#1a237e" strokeWidth="1.5"/>
                </svg>
                <span>{bookmark.name || bookmark.bookmark_name || 'Unnamed Bookmark'}</span>
              </div>
            ))
          )}
        </div>
      )}
    </aside>
  );
};

export default ChatbotTabs;