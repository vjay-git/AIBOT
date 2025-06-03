import React, { useState, useCallback, useEffect, useMemo } from 'react';

// API function to delete bookmark
async function deleteBookmark(bookmarkId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/bookmark/${bookmarkId}`;
  
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete bookmark: ${res.status} ${errorText}`);
  }
  
  return await res.json();
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
  bookmark_id?: string;
  bookmark_name?: string;
  queries?: Array<{
    query_id: string | string[];
    messages?: any[];
  }>;
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
  refreshChats?: () => void;
  setIsFromBookmarks?: (isFromBookmarks: boolean) => void;
  setIsFromFolder?: (isFromFolder: boolean) => void;
  autoRefreshInterval?: number;
  enableAutoRefresh?: boolean;
}

// Helper function to extract meaningful context from chat title
const extractContext = (title: string): string => {
  if (!title) return 'Chat';
  
  // Remove common prefixes and clean up
  const cleaned = title
    .replace(/^(show me|tell me|what|how|why|when|where|can you|please|help)/i, '')
    .replace(/\?+$/, '')
    .trim();
  
  // Extract key context (first few meaningful words)
  const words = cleaned.split(' ').filter(word => 
    word.length > 2 && 
    !['the', 'and', 'for', 'are', 'with', 'from', 'about'].includes(word.toLowerCase())
  );
  
  // Return first 2-3 key words or fallback
  const context = words.slice(0, 2).join(' ');
  return context || title.split(' ').slice(0, 2).join(' ') || 'Chat';
};

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
  setIsFromFolder,
  autoRefreshInterval = 30000,
  enableAutoRefresh = true
}) => {
  const [deletingChats, setDeletingChats] = useState<Set<string>>(new Set());
  const [deletingBookmarks, setDeletingBookmarks] = useState<Set<string>>(new Set());
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllChats, setShowAllChats] = useState(false);
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [chatsExpanded, setChatsExpanded] = useState(true);
  const [bookmarksExpanded, setBookmarksExpanded] = useState(true);
  const MAX_CHATS_DISPLAY = 6;

  const sortedChats = useMemo(() => [...chats].reverse(), [chats]);
  const sortedBookmarks = useMemo(() => [...bookmarks].reverse(), [bookmarks]);

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
    handleAutoRefresh();
    return () => clearInterval(intervalId);
  }, [enableAutoRefresh, refreshChats, autoRefreshInterval]);

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

  // 🔧 FIXED: handleFolderSelect with proper debugging and context setting
  const handleFolderSelect = useCallback((folderId: string | null, bookmarked: boolean = false, isFromBookmarks: boolean = false, isFolderDirect: boolean = false) => {
    console.log('🗂️ Folder selected:', { 
      folderId, 
      bookmarked, 
      isFromBookmarks, 
      isFolderDirect,
      willSetIsFromFolder: !!isFolderDirect 
    });
    
    onSelect(folderId || '');
    
    if (isFromBookmarks) {
      isBookmarked(true);
    } else {
      isBookmarked(bookmarked);
    }
    
    if (setIsFromBookmarks) {
      console.log('Setting isFromBookmarks to:', isFromBookmarks);
      setIsFromBookmarks(isFromBookmarks);
    }
    
    if (setIsFromFolder) {
      console.log('Setting isFromFolder to:', !!isFolderDirect);
      setIsFromFolder(!!isFolderDirect);
    }
  }, [onSelect, isBookmarked, setIsFromBookmarks, setIsFromFolder]);

  // Updated: handle chat select to clear folder context
  const handleChatSelect = useCallback((chatId: string, bookmarked: boolean = false) => {
    console.log('💬 Chat selected:', { chatId, bookmarked });
    onSelect(chatId);
    isBookmarked(bookmarked);
    if (setIsFromBookmarks) {
      console.log('Clearing isFromBookmarks');
      setIsFromBookmarks(false);
    }
    if (setIsFromFolder) {
      console.log('Clearing isFromFolder');
      setIsFromFolder(false);
    }
  }, [onSelect, isBookmarked, setIsFromBookmarks, setIsFromFolder]);

  const handleDeleteChat = useCallback(async (chatId: string, chatTitle: string) => {
    if (deletingChats.has(chatId)) return;
    if (!window.confirm(`Delete "${extractContext(chatTitle)}"?`)) return;
    
    setDeletingChats(prev => new Set(prev).add(chatId));
    try {
      await deletedThreadById(chatId);
      if (onDeleteChat) onDeleteChat(chatId);
      if (refreshChats) await refreshChats();
      if (selectedId === chatId) onSelect('');
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to delete chat.'}`);
    } finally {
      setDeletingChats(prev => { const newSet = new Set(prev); newSet.delete(chatId); return newSet; });
    }
  }, [deletingChats, onDeleteChat, refreshChats, selectedId, onSelect]);

  const handleDeleteBookmark = useCallback(async (bookmarkId: string, bookmarkName: string) => {
    if (deletingBookmarks.has(bookmarkId)) return;
    if (!window.confirm(`Delete bookmark "${bookmarkName}"?`)) return;
    
    setDeletingBookmarks(prev => new Set(prev).add(bookmarkId));
    try {
      await deleteBookmark(bookmarkId);
      if (refreshChats) await refreshChats();
      if (selectedId === bookmarkId) onSelect('');
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to delete bookmark.'}`);
    } finally {
      setDeletingBookmarks(prev => { const newSet = new Set(prev); newSet.delete(bookmarkId); return newSet; });
    }
  }, [deletingBookmarks, refreshChats, selectedId, onSelect]);

  const formatRefreshTime = useCallback((date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  return (
    <div style={{
      height: '100vh',
      background: 'linear-gradient(145deg, #fafbfc 0%, #f4f6f8 100%)',
      borderRight: '1px solid #e1e5e9',
      display: 'flex',
      flexDirection: 'column',
      width: '280px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* Header */}
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: '1px solid #eaecef',
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: '#6a737d'
        }}>
          <button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              color: '#6a737d',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none"
              style={{
                transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)',
                transition: 'transform 1s linear'
              }}
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M21 3v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M3 21v-5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <span>{formatRefreshTime(lastRefreshTime)}</span>
        </div>

        <button 
          onClick={onNewChat}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            color: 'white',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 0' }}>
        
        {/* Folders Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px 8px',
            cursor: 'pointer'
          }} onClick={() => setFoldersExpanded(!foldersExpanded)}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#586069',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Folders ({folders.length})
            </div>
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none"
              style={{
                transform: foldersExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                color: '#586069'
              }}
            >
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          
          {foldersExpanded && (
            <div>
              {folders.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#959da5',
                  fontSize: '13px'
                }}>
                  No folders yet
                </div>
              ) : (
                folders.map(folder => {
                  const folderChats = chats.filter(chat => chat.folderId === folder.id);
                  
                  return (
                    <div key={folder.id}>
                      <div 
                        onClick={() => {
                          console.log('🗂️ Folder clicked:', folder.id, folder.name);
                          handleFolderSelect(folder.id, false, false, true);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 20px',
                          cursor: 'pointer',
                          background: selectedId === folder.id 
                            ? 'linear-gradient(90deg, rgba(102, 126, 234, 0.08) 0%, transparent 100%)'
                            : 'transparent',
                          borderLeft: selectedId === folder.id ? '3px solid #667eea' : '3px solid transparent',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedId !== folder.id) {
                            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.04)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedId !== folder.id) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                          <path 
                            d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" 
                            stroke="#667eea" 
                            strokeWidth="1.5" 
                            fill={selectedId === folder.id ? 'rgba(102, 126, 234, 0.1)' : 'none'}
                          />
                        </svg>
                        
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: selectedId === folder.id ? '#24292e' : '#586069',
                          flex: 1
                        }}>
                          {folder.name}
                        </span>
                        
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '12px',
                          color: '#959da5'
                        }}>
                          ({folderChats.length})
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Recent Chats */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px 8px',
            cursor: 'pointer'
          }} onClick={() => setChatsExpanded(!chatsExpanded)}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#586069',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Recent ({sortedChats.length})
            </div>
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none"
              style={{
                transform: chatsExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                color: '#586069'
              }}
            >
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          
          {chatsExpanded && (
            <div>
              {(showAllChats ? sortedChats : sortedChats.slice(0, MAX_CHATS_DISPLAY)).map(chat => (
                <div 
                  key={chat.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    borderLeft: selectedId === chat.id ? '3px solid #667eea' : '3px solid transparent',
                    background: selectedId === chat.id 
                      ? 'linear-gradient(90deg, rgba(102, 126, 234, 0.08) 0%, transparent 100%)'
                      : 'transparent',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedId !== chat.id) {
                      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedId !== chat.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div 
                    onClick={() => handleChatSelect(chat.id, chat.bookmarked || false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flex: 1,
                      minWidth: 0
                    }}
                  >
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                      marginRight: '12px',
                      flexShrink: 0
                    }} />
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: selectedId === chat.id ? '#24292e' : '#586069',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {extractContext(chat.title)}
                      </div>
                      {chat.updatedAt && (
                        <div style={{
                          fontSize: '11px',
                          color: '#959da5',
                          marginTop: '2px'
                        }}>
                          {formatRefreshTime(new Date(chat.updatedAt))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id, chat.title); }}
                    disabled={deletingChats.has(chat.id)}
                    title="Delete chat"
                    style={{
                      background: 'rgba(215, 58, 73, 0.1)',
                      border: '1px solid rgba(215, 58, 73, 0.2)',
                      padding: '6px',
                      cursor: 'pointer',
                      color: '#d73a49',
                      opacity: 1,
                      transition: 'all 0.2s ease',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '8px',
                      minWidth: '24px',
                      height: '24px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(215, 58, 73, 0.2)';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(215, 58, 73, 0.1)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}

              {sortedChats.length > MAX_CHATS_DISPLAY && (
                <div style={{ padding: '8px 20px' }}>
                  <button 
                    onClick={() => setShowAllChats(!showAllChats)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#667eea',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      padding: '4px 0'
                    }}
                  >
                    {showAllChats ? 'Show less' : `View all ${sortedChats.length}`}
                  </button>
                </div>
              )}

              {sortedChats.length === 0 && (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#959da5',
                  fontSize: '13px'
                }}>
                  No chats yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bookmarks */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px 8px',
            cursor: 'pointer'
          }} onClick={() => setBookmarksExpanded(!bookmarksExpanded)}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#586069',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Bookmarks ({sortedBookmarks.length})
            </div>
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none"
              style={{
                transform: bookmarksExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                color: '#586069'
              }}
            >
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          
          {bookmarksExpanded && (
            <div>
              {sortedBookmarks.map(bookmark => {
                const bookmarkId = bookmark.bookmark_id || bookmark.id;
                const bookmarkName = bookmark.bookmark_name || bookmark.name || 'Bookmark';
                return (
                  <div 
                    key={bookmarkId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 20px',
                      cursor: 'pointer',
                      borderLeft: selectedId === bookmarkId ? '3px solid #f9ca24' : '3px solid transparent',
                      background: selectedId === bookmarkId 
                        ? 'linear-gradient(90deg, rgba(249, 202, 36, 0.08) 0%, transparent 100%)'
                        : 'transparent',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedId !== bookmarkId) {
                        e.currentTarget.style.background = 'rgba(249, 202, 36, 0.04)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedId !== bookmarkId) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div 
                      onClick={() => {
                        console.log('🔖 Bookmark clicked:', bookmarkId, bookmarkName);
                        handleFolderSelect(bookmarkId, true, true, false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        flex: 1,
                        minWidth: 0
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: '12px', flexShrink: 0 }}>
                        <path d="M6 4h12v16l-6-4-6 4V4z" stroke="#f9ca24" strokeWidth="1.5" fill={selectedId === bookmarkId ? '#f9ca24' : 'none'}/>
                      </svg>
                      
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: selectedId === bookmarkId ? '#24292e' : '#586069',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {bookmarkName}
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteBookmark(bookmarkId, bookmarkName); }}
                      disabled={deletingBookmarks.has(bookmarkId)}
                      title="Delete bookmark"
                      style={{
                        background: 'rgba(215, 58, 73, 0.1)',
                        border: '1px solid rgba(215, 58, 73, 0.2)',
                        padding: '8px',
                        cursor: 'pointer',
                        color: '#d73a49',
                        opacity: 1,
                        transition: 'all 0.2s ease',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: '8px',
                        minWidth: '28px',
                        height: '28px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(215, 58, 73, 0.2)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(215, 58, 73, 0.1)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                );
              })}

              {sortedBookmarks.length === 0 && (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#959da5',
                  fontSize: '13px'
                }}>
                  No bookmarks yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Auto-refresh indicator */}
      {enableAutoRefresh && (
        <div style={{
          padding: '8px 20px',
          borderTop: '1px solid #eaecef',
          background: 'rgba(255,255,255,0.8)',
          fontSize: '11px',
          color: '#959da5',
          textAlign: 'center'
        }}>
          Auto-refresh: {autoRefreshInterval / 1000}s
        </div>
      )}
    </div>
  );
};

export default ChatbotTabs;