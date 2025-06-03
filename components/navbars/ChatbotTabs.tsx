// FIXED ChatbotTabs.tsx - Properly implemented sidebar toggle
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';

// Keep your existing API functions unchanged
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

// Helper function - keep unchanged
const extractContext = (title: string): string => {
  if (!title) return 'Chat';
  
  const cleaned = title
    .replace(/^(show me|tell me|what|how|why|when|where|can you|please|help)/i, '')
    .replace(/\?+$/, '')
    .trim();
  
  const words = cleaned.split(' ').filter(word => 
    word.length > 2 && 
    !['the', 'and', 'for', 'are', 'with', 'from', 'about'].includes(word.toLowerCase())
  );
  
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
  // Local state for sidebar collapse
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [deletingChats, setDeletingChats] = useState<Set<string>>(new Set());
  const [deletingBookmarks, setDeletingBookmarks] = useState<Set<string>>(new Set());
  const [showAllChats, setShowAllChats] = useState(false);
  const MAX_CHATS_DISPLAY = 4;

  const sortedChats = useMemo(() => [...chats].reverse(), [chats]);
  const sortedBookmarks = useMemo(() => [...bookmarks].reverse(), [bookmarks]);

  // Toggle collapse handler
  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    
    // Notify parent component about layout change
    const event = new CustomEvent('sidebarToggle', { 
      detail: { collapsed: !isCollapsed } 
    });
    window.dispatchEvent(event);
  };

  // Keep all your existing handlers unchanged
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

  return (
    <div 
      className="chatbot-tabs-container"
      style={{
        width: isCollapsed ? '60px' : '280px',
        height: '100vh',
        backgroundColor: '#f8f9fa',
        borderRight: '1px solid #e9ecef',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        transition: 'width 0.3s ease-in-out',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      
      {/* Header with Toggle Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        padding: isCollapsed ? '16px 8px' : '16px 20px',
        borderBottom: '1px solid #e9ecef',
        minHeight: '60px',
        backgroundColor: '#ffffff'
      }}>
        {!isCollapsed && (
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0
          }}>
            Chat History
          </h2>
        )}
        
        <button
          onClick={handleToggleCollapse}
          style={{
            background: 'none',
            border: '1px solid #e5e7eb',
            color: '#6b7280',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            width: '28px',
            height: '28px',
            backgroundColor: '#ffffff'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight size={14} />
          ) : (
            <ChevronLeft size={14} />
          )}
        </button>
      </div>

      {/* Main Content */}
      {!isCollapsed ? (
        <>
          {/* Folders Section */}
          <div style={{ 
            borderBottom: '1px solid #e9ecef',
            padding: '20px 0 0 0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
              marginBottom: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                
                <span style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#001576'
                }}>
                  Folders
                </span>
              </div>
              <button style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '2px',
                lineHeight: 1
              }}>
                +
              </button>
            </div>
            
            <div style={{ paddingBottom: '20px' }}>
              {folders.length === 0 ? (
                <div style={{
                  padding: '0 20px',
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  No folders yet
                </div>
              ) : (
                folders.map(folder => (
                  <div 
                    key={folder.id}
                    onClick={() => {
                      console.log('🗂️ Folder clicked:', folder.id, folder.name);
                      handleFolderSelect(folder.id, false, false, true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 20px',
                      cursor: 'pointer',
                      backgroundColor: selectedId === folder.id ? '#e0e7ff' : 'transparent',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedId !== folder.id) {
                        e.currentTarget.style.backgroundColor = '#f1f5f9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedId !== folder.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ marginRight: '12px', flexShrink: 0 }}>
                      <path 
                        d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" 
                        stroke="#6b7280" 
                        strokeWidth="1.5" 
                        fill="none"
                      />
                    </svg>
                    <span style={{
                      fontSize: '14px',
                      color: selectedId === folder.id ? '#1f2937' : '#4b5563',
                      fontWeight: selectedId === folder.id ? '500' : '400',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {folder.name}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chats Section */}
          <div style={{ 
            borderBottom: '1px solid #e9ecef',
            padding: '20px 0 0 0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
              marginBottom: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
               
                <span style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#001576'
                }}>
                  Chats
                </span>
              </div>
              <button 
                onClick={onNewChat}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '2px',
                  lineHeight: 1
                }}
              >
                +
              </button>
            </div>
            
            <div style={{ paddingBottom: '12px' }}>
              {sortedChats.length === 0 ? (
                <div style={{
                  padding: '0 20px',
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  No chats yet
                </div>
              ) : (
                <>
                  {(showAllChats ? sortedChats : sortedChats.slice(0, MAX_CHATS_DISPLAY)).map(chat => (
                    <div 
                      key={chat.id}
                      onClick={() => handleChatSelect(chat.id, chat.bookmarked || false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 20px',
                        cursor: 'pointer',
                        backgroundColor: selectedId === chat.id ? '#e0e7ff' : 'transparent',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedId !== chat.id) {
                          e.currentTarget.style.backgroundColor = '#f1f5f9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedId !== chat.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <span style={{
                        fontSize: '14px',
                        color: selectedId === chat.id ? '#1f2937' : '#4b5563',
                        fontWeight: selectedId === chat.id ? '500' : '400',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {extractContext(chat.title)}
                      </span>
                    </div>
                  ))}
                  
                  {sortedChats.length > MAX_CHATS_DISPLAY && (
                    <div 
                      onClick={() => setShowAllChats(!showAllChats)}
                      style={{
                        padding: '8px 20px',
                        cursor: 'pointer',
                        color: '#2563eb',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      {showAllChats ? 'View less' : 'View all >'}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bookmarks Section */}
          <div style={{ 
            padding: '20px 0 20px 0',
            flex: 1
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 20px',
              marginBottom: '12px'
            }}>
              <span style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#001576'
              }}>
                Bookmarks
              </span>
            </div>
            
            <div>
              {sortedBookmarks.length === 0 ? (
                <div style={{
                  padding: '0 20px',
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  No bookmarks yet
                </div>
              ) : (
                sortedBookmarks.map(bookmark => {
                  const bookmarkId = bookmark.bookmark_id || bookmark.id;
                  const bookmarkName = bookmark.bookmark_name || bookmark.name || 'Bookmark';
                  return (
                    <div 
                      key={bookmarkId}
                      onClick={() => {
                        console.log('🔖 Bookmark clicked:', bookmarkId, bookmarkName);
                        handleFolderSelect(bookmarkId, true, true, false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 20px',
                        cursor: 'pointer',
                        backgroundColor: selectedId === bookmarkId ? '#e0e7ff' : 'transparent',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedId !== bookmarkId) {
                          e.currentTarget.style.backgroundColor = '#f1f5f9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedId !== bookmarkId) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <span style={{
                        fontSize: '14px',
                        color: selectedId === bookmarkId ? '#1f2937' : '#4b5563',
                        fontWeight: selectedId === bookmarkId ? '500' : '400',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {bookmarkName}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      ) : (
        /* Collapsed State */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          padding: '20px 0',
          flex: 1
        }}>
          {/* Folder icon */}
          <div 
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Folders"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path 
                d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" 
                stroke="#6b7280" 
                strokeWidth="1.5" 
                fill="none"
              />
            </svg>
          </div>
          
          {/* Chat icon */}
          <div 
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Chats"
            onClick={onNewChat}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path 
                d="M18 5.375a2.625 2.625 0 0 0-2.625-2.625H4.625A2.625 2.625 0 0 0 2 5.375v6.75A2.625 2.625 0 0 0 4.625 14.75h2.75l3 3.5 3-3.5h2A2.625 2.625 0 0 0 18 12.125v-6.75Z" 
                stroke="#6b7280" 
                strokeWidth="1.5" 
                fill="none"
              />
            </svg>
          </div>
          
          {/* Bookmark icon */}
          <div 
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Bookmarks"
          >
            <svg width="18" height="18" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 0 0-2 2v12a1 1 0 0 0 1.447.894L10 16.118l5.553 1.776A1 1 0 0 0 17 17V5a2 2 0 0 0-2-2H5zm0 2h10v11.382l-4.553-1.455a1 1 0 0 0-.894 0L5 16.382V5z" fill="#6b7280"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotTabs;