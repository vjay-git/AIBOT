// components/navbars/ChatbotTabs.tsx

import React, { useState, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { updateThreadTitle, clearApiCache } from '../../utils/api';

// OPTIMIZED: API functions with better error handling and deduplication
const requestInProgress = new Set<string>();

async function deleteBookmark(bookmarkId: string) {
  const requestKey = `deleteBookmark:${bookmarkId}`;
  
  if (requestInProgress.has(requestKey)) {
    console.log('🔄 Delete bookmark request already in progress:', bookmarkId);
    return;
  }

  requestInProgress.add(requestKey);

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const url = `${baseUrl}/userhistory/bookmark/${bookmarkId}`;

    console.log('🗑️ Deleting bookmark:', bookmarkId);
    const res = await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to delete bookmark: ${res.status} ${errorText}`);
    }

    // Clear related caches
    clearApiCache('bookmark');
    clearApiCache('userHistory');
    
    console.log('✅ Bookmark deleted successfully:', bookmarkId);
    return await res.json();
  } finally {
    requestInProgress.delete(requestKey);
  }
}

async function deletedThreadById(threadId: string) {
  const requestKey = `deleteThread:${threadId}`;
  
  if (requestInProgress.has(requestKey)) {
    console.log('🔄 Delete thread request already in progress:', threadId);
    return;
  }

  requestInProgress.add(requestKey);

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const url = `${baseUrl}/userhistory/thread/${threadId}`;

    console.log('🗑️ Deleting thread:', threadId);
    const res = await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to delete thread: ${res.status} ${errorText}`);
    }

    // Clear related caches
    clearApiCache('thread');
    clearApiCache('userHistory');
    clearApiCache('allChats');
    
    console.log('✅ Thread deleted successfully:', threadId);
    return await res.json();
  } finally {
    requestInProgress.delete(requestKey);
  }
}

async function deleteFolder(folderId: string) {
  const requestKey = `deleteFolder:${folderId}`;
  
  if (requestInProgress.has(requestKey)) {
    console.log('🔄 Delete folder request already in progress:', folderId);
    return;
  }

  requestInProgress.add(requestKey);

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const url = `${baseUrl}/userhistory/aitable/${folderId}`;

    console.log('🗑️ Deleting folder:', folderId);
    const res = await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to delete folder: ${res.status} ${errorText}`);
    }

    // Clear related caches
    clearApiCache('aiTable');
    clearApiCache('userHistory');
    
    console.log('✅ Folder deleted successfully:', folderId);
    return await res.json();
  } finally {
    requestInProgress.delete(requestKey);
  }
}

async function updateBookmarkName(bookmarkId: string, newName: string) {
  const requestKey = `updateBookmark:${bookmarkId}`;
  
  if (requestInProgress.has(requestKey)) {
    console.log('🔄 Update bookmark request already in progress:', bookmarkId);
    return;
  }

  requestInProgress.add(requestKey);

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const url = `${baseUrl}/userhistory/bookmark/${bookmarkId}`;
    
    console.log('📝 Updating bookmark name:', { bookmarkId, newName });
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmark_name: newName.trim() })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to update bookmark: ${res.status} ${errorText}`);
    }

    // Clear related caches
    clearApiCache('bookmark');
    clearApiCache('userHistory');
    
    console.log('✅ Bookmark updated successfully:', bookmarkId);
    return await res.json();
  } finally {
    requestInProgress.delete(requestKey);
  }
}

async function updateFolderName(folderId: string, newName: string) {
  const requestKey = `updateFolder:${folderId}`;
  
  if (requestInProgress.has(requestKey)) {
    console.log('🔄 Update folder request already in progress:', folderId);
    return;
  }

  requestInProgress.add(requestKey);

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const url = `${baseUrl}/userhistory/aitable/${folderId}`;
    
    console.log('📝 Updating folder name:', { folderId, newName });
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_name: newName.trim() })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to update folder: ${res.status} ${errorText}`);
    }

    // Clear related caches
    clearApiCache(`aiTable:${folderId}`);
    clearApiCache('userHistory');
    
    console.log('✅ Folder updated successfully:', folderId);
    return await res.json();
  } finally {
    requestInProgress.delete(requestKey);
  }
}

// Types & Helper
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
  queries?: Array<{ query_id: string | string[]; messages?: any[] }>;
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
  forceCollapsed?: boolean;
}

// Component
const ChatbotTabs: React.FC<ChatbotTabsProps> = ({
  chats,
  folders,
  bookmarks,
  selectedId,
  onSelect,
  isBookmarked,
  onNewChat,
  onDeleteChat,
  refreshChats,
  setIsFromBookmarks,
  setIsFromFolder,
  forceCollapsed,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [showAllChats, setShowAllChats] = useState(false);
  const [openMenu, setOpenMenu] = useState<{ type: 'chat' | 'bookmark' | 'folder'; id: string } | null>(null);
  const MAX_CHATS_DISPLAY = 4;

  // OPTIMIZED: Memoized sorted arrays to prevent unnecessary re-renders
  const sortedChats = useMemo(() => {
    console.log('🔄 Recomputing sorted chats');
    return [...chats].reverse();
  }, [chats]);

  const sortedBookmarks = useMemo(() => {
    console.log('🔄 Recomputing sorted bookmarks');
    return [...bookmarks].reverse();
  }, [bookmarks]);

  const sortedFolders = useMemo(() => {
    console.log('🔄 Recomputing sorted folders');
    return [...folders];
  }, [folders]);

  // Use forceCollapsed if provided
  const collapsed = typeof forceCollapsed === 'boolean' ? forceCollapsed : isCollapsed;

  // Toggle sidebar width
  const handleToggleCollapse = useCallback(() => {
    // Only allow manual toggle if not externally controlled
    if (typeof forceCollapsed === 'boolean') return;
    setIsCollapsed((prev) => !prev);
    const event = new CustomEvent("sidebarToggle", {
      detail: { collapsed: !isCollapsed },
    });
    window.dispatchEvent(event);
  }, [isCollapsed, forceCollapsed]);

  // OPTIMIZED: When a folder/bookmark is clicked
  const handleFolderSelect = useCallback(
    (
      folderId: string | null,
      bookmarked: boolean = false,
      isFromBookmarks: boolean = false,
      isFolderDirect: boolean = false
    ) => {
      console.log('📁 Folder/Bookmark selected:', { folderId, bookmarked, isFromBookmarks, isFolderDirect });
      onSelect(folderId || "");
      if (isFromBookmarks) {
        isBookmarked(true);
      } else {
        isBookmarked(bookmarked);
      }
      if (setIsFromBookmarks) {
        setIsFromBookmarks(isFromBookmarks);
      }
      if (setIsFromFolder) {
        setIsFromFolder(!!isFolderDirect);
      }
    },
    [onSelect, isBookmarked, setIsFromBookmarks, setIsFromFolder]
  );

  // OPTIMIZED: When a chat is clicked
  const handleChatSelect = useCallback(
    (chatId: string, bookmarked: boolean = false) => {
      console.log('💬 Chat selected:', { chatId, bookmarked });
      onSelect(chatId);
      isBookmarked(bookmarked);
      if (setIsFromBookmarks) {
        setIsFromBookmarks(false);
      }
      if (setIsFromFolder) {
        setIsFromFolder(false);
      }
    },
    [onSelect, isBookmarked, setIsFromBookmarks, setIsFromFolder]
  );

  // OPTIMIZED: Delete functions with proper state management
  const handleDeleteChat = useCallback(
    async (chatId: string, chatTitle: string) => {
      if (deletingItems.has(chatId)) {
        console.log('🔄 Chat deletion already in progress:', chatId);
        return;
      }
      
      if (!window.confirm(`Delete "${chatTitle}"?`)) return;

      setDeletingItems((prev) => new Set(prev).add(chatId));

      try {
        await deletedThreadById(chatId);
        if (onDeleteChat) onDeleteChat(chatId);
        if (refreshChats) {
          console.log('🔄 Refreshing chats after deletion');
          await refreshChats();
        }
        if (selectedId === chatId) onSelect("");
        console.log('✅ Chat deleted and UI updated:', chatId);
      } catch (err) {
        console.error('❌ Failed to delete chat:', err);
        alert(
          `Error: ${
            err instanceof Error ? err.message : "Failed to delete chat."
          }`
        );
      } finally {
        setDeletingItems((prev) => {
          const next = new Set(prev);
          next.delete(chatId);
          return next;
        });
      }
    },
    [deletingItems, onDeleteChat, refreshChats, selectedId, onSelect]
  );

  const handleDeleteFolder = useCallback(
    async (folderId: string, folderName: string) => {
      if (deletingItems.has(folderId)) {
        console.log('🔄 Folder deletion already in progress:', folderId);
        return;
      }
      
      if (!window.confirm(`Delete folder "${folderName}"? This will permanently delete all data in this folder.`)) return;

      setDeletingItems((prev) => new Set(prev).add(folderId));

      try {
        await deleteFolder(folderId);
        if (refreshChats) {
          console.log('🔄 Refreshing chats after folder deletion');
          await refreshChats();
        }
        if (selectedId === folderId) onSelect("");
        console.log('✅ Folder deleted and UI updated:', folderId);
      } catch (err) {
        console.error('❌ Failed to delete folder:', err);
        alert(
          `Error: ${
            err instanceof Error
              ? err.message
              : "Failed to delete folder."
          }`
        );
      } finally {
        setDeletingItems((prev) => {
          const next = new Set(prev);
          next.delete(folderId);
          return next;
        });
      }
    },
    [deletingItems, refreshChats, selectedId, onSelect]
  );

  const handleDeleteBookmark = useCallback(
    async (bookmarkId: string, bookmarkName: string) => {
      if (deletingItems.has(bookmarkId)) {
        console.log('🔄 Bookmark deletion already in progress:', bookmarkId);
        return;
      }
      
      if (!window.confirm(`Delete bookmark "${bookmarkName}"?`)) return;

      setDeletingItems((prev) => new Set(prev).add(bookmarkId));

      try {
        await deleteBookmark(bookmarkId);
        if (refreshChats) {
          console.log('🔄 Refreshing chats after bookmark deletion');
          await refreshChats();
        }
        if (selectedId === bookmarkId) onSelect("");
        console.log('✅ Bookmark deleted and UI updated:', bookmarkId);
      } catch (err) {
        console.error('❌ Failed to delete bookmark:', err);
        alert(
          `Error: ${
            err instanceof Error
              ? err.message
              : "Failed to delete bookmark."
          }`
        );
      } finally {
        setDeletingItems((prev) => {
          const next = new Set(prev);
          next.delete(bookmarkId);
          return next;
        });
      }
    },
    [deletingItems, refreshChats, selectedId, onSelect]
  );

  // OPTIMIZED: Rename handler with proper state management
  const handleRename = useCallback(async (type: 'chat' | 'bookmark' | 'folder', id: string, oldName: string) => {
    if (updatingItems.has(id)) {
      console.log('🔄 Update already in progress for:', id);
      return;
    }

    const newName = window.prompt(`Rename ${type === 'chat' ? 'chat' : type === 'bookmark' ? 'bookmark' : 'folder'}`, oldName);
    if (!newName || newName.trim() === oldName) return;

    setUpdatingItems((prev) => new Set(prev).add(id));

    try {
      if (type === 'chat') {
        await updateThreadTitle(id, newName.trim());
      } else if (type === 'bookmark') {
        await updateBookmarkName(id, newName.trim());
      } else if (type === 'folder') {
        await updateFolderName(id, newName.trim());
      }
      
      if (refreshChats) {
        console.log('🔄 Refreshing chats after rename');
        await refreshChats();
      }
      console.log(`✅ ${type} renamed successfully:`, id);
    } catch (err) {
      console.error(`❌ Failed to rename ${type}:`, err);
      alert(`Failed to rename ${type}.`);
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [refreshChats, updatingItems]);

  // Menu handlers
  const handleMenuOpen = useCallback((type: 'chat' | 'bookmark' | 'folder', id: string) => {
    setOpenMenu({ type, id });
  }, []);

  const handleMenuClose = useCallback(() => setOpenMenu(null), []);

  // OPTIMIZED: Close menu on outside click with useCallback
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    handleMenuClose();
  }, [handleMenuClose]);

  return (
    <div
      className={`chatbot-tabs-container ${
        collapsed ? "collapsed" : ""
      }`}
    >
      {/* Main Content */}
      {!collapsed ? (
        <div className="sidebar-scroll-area">
          {/* Folders Section */}
          <div className="folders-section">
            <div className="section-header">
              <span className="section-title">Folders</span>
            </div>

            <div className="folder-list">
              {sortedFolders.length === 0 ? (
                <div className="empty-message">No folders yet</div>
              ) : (
                sortedFolders.map((folder) => {
                  const isSelected = selectedId === folder.id;
                  const isMenuOpen = openMenu && openMenu.type === 'folder' && openMenu.id === folder.id;
                  const isDeleting = deletingItems.has(folder.id);
                  const isUpdating = updatingItems.has(folder.id);
                  
                  return (
                    <div
                      key={folder.id}
                      className={`folder-item ${
                        isSelected ? "selected" : ""
                      } ${isDeleting ? "deleting" : ""} ${isUpdating ? "updating" : ""}`}
                      onClick={() =>
                        !isDeleting && !isUpdating && handleFolderSelect(folder.id, false, false, true)
                      }
                      style={{ position: 'relative' }}
                    >
                      <svg
                        className="folder-icon"
                        width="16"
                        height="16"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                          stroke="#6b7280"
                          strokeWidth="1.5"
                          fill="none"
                        />
                      </svg>
                      <span className="folder-name">
                        {isUpdating ? 'Updating...' : folder.name}
                      </span>
                      {!isDeleting && !isUpdating && (
                        <button
                          className="kebab-menu-btn"
                          onClick={e => { 
                            e.stopPropagation(); 
                            handleMenuOpen('folder', folder.id); 
                          }}
                          title="More options"
                        >
                          <MoreVertical size={16} />
                        </button>
                      )}
                      {isMenuOpen && (
                        <div className="popup-menu" onClick={e => e.stopPropagation()}>
                          <button 
                            className="popup-menu-item" 
                            onClick={() => { 
                              handleMenuClose(); 
                              handleRename('folder', folder.id, folder.name); 
                            }}
                            disabled={isUpdating}
                          >
                            Rename
                          </button>
                          <button 
                            className="popup-menu-item delete" 
                            onClick={() => { 
                              handleMenuClose(); 
                              handleDeleteFolder(folder.id, folder.name); 
                            }}
                            disabled={isDeleting}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chats Section */}
          <div className="chats-section">
            <div className="section-header">
              <span className="section-title">Chats</span>
              <button
                className="add-button"
                onClick={onNewChat}
                title="New chat"
              >
                +
              </button>
            </div>

            <div className="chat-list">
              {sortedChats.length === 0 ? (
                <div className="empty-message">No chats yet</div>
              ) : (
                <>
                  {(showAllChats
                    ? sortedChats
                    : sortedChats.slice(0, MAX_CHATS_DISPLAY)
                  ).map((chat) => {
                    const isSelected = selectedId === chat.id;
                    const isMenuOpen = openMenu && openMenu.type === 'chat' && openMenu.id === chat.id;
                    const isDeleting = deletingItems.has(chat.id);
                    const isUpdating = updatingItems.has(chat.id);
                    
                    return (
                      <div
                        key={chat.id}
                        className={`chat-item ${
                          isSelected ? "selected" : ""
                        } ${isDeleting ? "deleting" : ""} ${isUpdating ? "updating" : ""}`}
                        onClick={() =>
                          !isDeleting && !isUpdating && handleChatSelect(chat.id, chat.bookmarked || false)
                        }
                        style={{ position: 'relative' }}
                      >
                        <span className="chat-name">
                          {isUpdating ? 'Updating...' : (chat.title || "Untitled Chat")}
                        </span>
                        {!isDeleting && !isUpdating && (
                          <button
                            className="kebab-menu-btn"
                            onClick={e => { 
                              e.stopPropagation(); 
                              handleMenuOpen('chat', chat.id); 
                            }}
                            title="More options"
                          >
                            <MoreVertical size={16} />
                          </button>
                        )}
                        {isMenuOpen && (
                          <div className="popup-menu" onClick={e => e.stopPropagation()}>
                            <button 
                              className="popup-menu-item" 
                              onClick={() => { 
                                handleMenuClose(); 
                                handleRename('chat', chat.id, chat.title); 
                              }}
                              disabled={isUpdating}
                            >
                              Rename
                            </button>
                            <button 
                              className="popup-menu-item delete" 
                              onClick={() => { 
                                handleMenuClose(); 
                                handleDeleteChat(chat.id, chat.title); 
                              }}
                              disabled={isDeleting}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {sortedChats.length > MAX_CHATS_DISPLAY && (
                    <div
                      className="view-toggle"
                      onClick={() =>
                        setShowAllChats((prev) => !prev)
                      }
                    >
                      {showAllChats ? "View less" : "View all >"}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bookmarks Section */}
          <div className="bookmarks-section">
            <div className="section-header">
              <span className="section-title">Bookmarks</span>
            </div>

            <div className="bookmark-list">
              {sortedBookmarks.length === 0 ? (
                <div className="empty-message">No bookmarks yet</div>
              ) : (
                sortedBookmarks.map((bookmark) => {
                  const bookmarkId = bookmark.bookmark_id || bookmark.id;
                  const bookmarkName = bookmark.bookmark_name || bookmark.name || "Bookmark";
                  const isSelected = selectedId === bookmarkId;
                  const isMenuOpen = openMenu && openMenu.type === 'bookmark' && openMenu.id === bookmarkId;
                  const isDeleting = deletingItems.has(bookmarkId);
                  const isUpdating = updatingItems.has(bookmarkId);
                  
                  return (
                    <div
                      key={bookmarkId}
                      className={`bookmark-item ${
                        isSelected ? "selected" : ""
                      } ${isDeleting ? "deleting" : ""} ${isUpdating ? "updating" : ""}`}
                      onClick={() =>
                        !isDeleting && !isUpdating && handleFolderSelect(bookmarkId, true, true, false)
                      }
                      style={{ position: 'relative' }}
                    >
                      <span className="bookmark-name">
                        {isUpdating ? 'Updating...' : bookmarkName}
                      </span>
                      {!isDeleting && !isUpdating && (
                        <button
                          className="kebab-menu-btn"
                          onClick={e => { 
                            e.stopPropagation(); 
                            handleMenuOpen('bookmark', bookmarkId); 
                          }}
                          title="More options"
                        >
                          <MoreVertical size={16} />
                        </button>
                      )}
                      {isMenuOpen && (
                        <div className="popup-menu" onClick={e => e.stopPropagation()}>
                          <button 
                            className="popup-menu-item" 
                            onClick={() => { 
                              handleMenuClose(); 
                              handleRename('bookmark', bookmarkId, bookmarkName); 
                            }}
                            disabled={isUpdating}
                          >
                            Rename
                          </button>
                          <button 
                            className="popup-menu-item delete" 
                            onClick={() => { 
                              handleMenuClose(); 
                              handleDeleteBookmark(bookmarkId, bookmarkName); 
                            }}
                            disabled={isDeleting}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed State */
        <div className="collapsed-content">
          {/* Folder icon */}
          <div className="collapsed-icon" title="Folders">
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
            >
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
            className="collapsed-icon"
            title="Chats"
            onClick={onNewChat}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M18 5.375a2.625 2.625 0 0 0-2.625-2.625H4.625A2.625 2.625 0 0 0 2 5.375v6.75A2.625 2.625 0 0 0 4.625 14.75h2.75l3 3.5 3-3.5h2A2.625 2.625 0 0 0 18 12.125v-6.75Z"
                stroke="#6b7280"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          </div>

          {/* Bookmark icon */}
          <div className="collapsed-icon" title="Bookmarks">
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
            >
              <path
                d="M5 3a2 2 0 0 0-2 2v12a1 1 0 0 0 1.447.894L10 16.118l5.553 1.776A1 1 0 0 0 17 17V5a2 2 0 0 0-2-2H5zm0 2h10v11.382l-4.553-1.455a1 1 0 0 0-.894 0L5 16.382V5z"
                fill="#6b7280"
              />
            </svg>
          </div>
        </div>
      )}
      
      {/* Close menu on click outside */}
      {openMenu && (
        <div 
          className="popup-menu-backdrop" 
          onClick={handleBackdropClick}
        />
      )}
    </div>
  );
};

export default ChatbotTabs;