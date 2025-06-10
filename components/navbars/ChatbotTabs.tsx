// components/navbars/ChatbotTabs.tsx

import React, { useState, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, Trash2, MoreVertical } from "lucide-react";
import { updateThreadTitle } from '../../utils/api';

// —–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Keep your existing API functions unchanged
// —–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

async function deleteBookmark(bookmarkId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/bookmark/${bookmarkId}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
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
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete thread: ${res.status} ${errorText}`);
  }

  return await res.json();
}

async function deleteFolder(folderId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/aitable/${folderId}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete folder: ${res.status} ${errorText}`);
  }

  return await res.json();
}

// —–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Types & Helper
// —–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

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
  forceCollapsed?: boolean; // NEW: allow external control
}

// —–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Component
// —–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

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
  forceCollapsed, // NEW
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [deletingChats, setDeletingChats] = useState<Set<string>>(new Set());
  const [deletingBookmarks, setDeletingBookmarks] = useState<Set<string>>(
    new Set()
  );
  const [deletingFolders, setDeletingFolders] = useState<Set<string>>(new Set());
  const [showAllChats, setShowAllChats] = useState(false);
  const [openMenu, setOpenMenu] = useState<{ type: 'chat' | 'bookmark' | 'folder'; id: string } | null>(null);
  const MAX_CHATS_DISPLAY = 4;

  // Reverse so that newest appears at top
  const sortedChats = useMemo(() => [...chats].reverse(), [chats]);
  const sortedBookmarks = useMemo(() => [...bookmarks].reverse(), [bookmarks]);

  // Use forceCollapsed if provided
  const collapsed = typeof forceCollapsed === 'boolean' ? forceCollapsed : isCollapsed;

  // Toggle sidebar width
  const handleToggleCollapse = () => {
    // Only allow manual toggle if not externally controlled
    if (typeof forceCollapsed === 'boolean') return;
    setIsCollapsed((prev) => !prev);
    const event = new CustomEvent("sidebarToggle", {
      detail: { collapsed: !isCollapsed },
    });
    window.dispatchEvent(event);
  };

  // When a folder/bookmark is clicked
  const handleFolderSelect = useCallback(
    (
      folderId: string | null,
      bookmarked: boolean = false,
      isFromBookmarks: boolean = false,
      isFolderDirect: boolean = false
    ) => {
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

  // When a chat is clicked
  const handleChatSelect = useCallback(
    (chatId: string, bookmarked: boolean = false) => {
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

  // Deletes a chat/thread
  const handleDeleteChat = useCallback(
    async (chatId: string, chatTitle: string) => {
      if (deletingChats.has(chatId)) return;
      if (!window.confirm(`Delete "${chatTitle}"?`)) return;

      setDeletingChats((prev) => {
        const next = new Set(prev);
        next.add(chatId);
        return next;
      });

      try {
        await deletedThreadById(chatId);
        if (onDeleteChat) onDeleteChat(chatId);
        if (refreshChats) await refreshChats();
        if (selectedId === chatId) onSelect("");
      } catch (err) {
        alert(
          `Error: ${
            err instanceof Error ? err.message : "Failed to delete chat."
          }`
        );
      } finally {
        setDeletingChats((prev) => {
          const next = new Set(prev);
          next.delete(chatId);
          return next;
        });
      }
    },
    [deletingChats, onDeleteChat, refreshChats, selectedId, onSelect]
  );

  // Deletes a folder
  const handleDeleteFolder = useCallback(
    async (folderId: string, folderName: string) => {
      if (deletingFolders.has(folderId)) return;
      if (!window.confirm(`Delete folder "${folderName}"? This will permanently delete all data in this folder.`)) return;

      setDeletingFolders((prev) => {
        const next = new Set(prev);
        next.add(folderId);
        return next;
      });

      try {
        await deleteFolder(folderId);
        if (refreshChats) await refreshChats();
        if (selectedId === folderId) onSelect("");
      } catch (err) {
        alert(
          `Error: ${
            err instanceof Error
              ? err.message
              : "Failed to delete folder."
          }`
        );
      } finally {
        setDeletingFolders((prev) => {
          const next = new Set(prev);
          next.delete(folderId);
          return next;
        });
      }
    },
    [deletingFolders, refreshChats, selectedId, onSelect]
  );
  const handleDeleteBookmark = useCallback(
    async (bookmarkId: string, bookmarkName: string) => {
      if (deletingBookmarks.has(bookmarkId)) return;
      if (!window.confirm(`Delete bookmark "${bookmarkName}"?`)) return;

      setDeletingBookmarks((prev) => {
        const next = new Set(prev);
        next.add(bookmarkId);
        return next;
      });

      try {
        await deleteBookmark(bookmarkId);
        if (refreshChats) await refreshChats();
        if (selectedId === bookmarkId) onSelect("");
      } catch (err) {
        alert(
          `Error: ${
            err instanceof Error
              ? err.message
              : "Failed to delete bookmark."
          }`
        );
      } finally {
        setDeletingBookmarks((prev) => {
          const next = new Set(prev);
          next.delete(bookmarkId);
          return next;
        });
      }
    },
    [deletingBookmarks, refreshChats, selectedId, onSelect]
  );

  // Rename handler
  const handleRename = useCallback(async (type: 'chat' | 'bookmark' | 'folder', id: string, oldName: string) => {
    const newName = window.prompt(`Rename ${type === 'chat' ? 'chat' : type === 'bookmark' ? 'bookmark' : 'folder'}`, oldName);
    if (!newName || newName.trim() === oldName) return;
    try {
      if (type === 'chat') {
        await updateThreadTitle(id, newName.trim());
      } else if (type === 'bookmark') {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const url = `${baseUrl}/userhistory/bookmark/${id}`;
        await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookmark_name: newName.trim() })
        });
      } else if (type === 'folder') {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const url = `${baseUrl}/userhistory/aitable/${id}`;
        await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_name: newName.trim() })
        });
      }
      if (refreshChats) await refreshChats();
    } catch (err) {
      alert('Failed to rename.');
    }
  }, [refreshChats]);

  // Menu handlers
  const handleMenuOpen = (type: 'chat' | 'bookmark' | 'folder', id: string) => {
    setOpenMenu({ type, id });
  };
  const handleMenuClose = () => setOpenMenu(null);

  return (
    <div
      className={`chatbot-tabs-container ${
        collapsed ? "collapsed" : ""
      }`}
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      {/* <div className="chatbot-header">
        {!collapsed && (
          <h2 className="header-title">Chat History</h2>
        )}
        <button
          className="toggle-button"
          onClick={handleToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={14} />
          ) : (
            <ChevronLeft size={14} />
          )}
        </button>
      </div>
 */}
      {/* ── Main Content ────────────────────────────────────────────────── */}
      {!collapsed ? (
        <div className="sidebar-scroll-area">
          {/* Folders Section */}
          <div className="folders-section">
            <div className="section-header">
              {/* <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                style={{ marginRight: 4 }}
              >
                <path
                  d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                  stroke="#2563eb"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg> */}
              <span className="section-title">Folders</span>
            </div>

            <div className="folder-list">
              {folders.length === 0 ? (
                <div className="empty-message">No folders yet</div>
              ) : (
                folders.map((folder) => {
                  const isSelected = selectedId === folder.id;
                  const isMenuOpen = openMenu && openMenu.type === 'folder' && openMenu.id === folder.id;
                  return (
                    <div
                      key={folder.id}
                      className={`folder-item ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={() =>
                        handleFolderSelect(folder.id, false, false, true)
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
                        {folder.name}
                      </span>
                      <button
                        className="kebab-menu-btn"
                        onClick={e => { e.stopPropagation(); handleMenuOpen('folder', folder.id); }}
                        title="More options"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {isMenuOpen && (
                        <div className="popup-menu" onClick={e => e.stopPropagation()}>
                          <button className="popup-menu-item" onClick={() => { handleMenuClose(); handleRename('folder', folder.id, folder.name); }}>Rename</button>
                          <button className="popup-menu-item delete" onClick={() => { handleMenuClose(); handleDeleteFolder(folder.id, folder.name); }}>Delete</button>
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
              {/* <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                style={{ marginRight: 4 }}
              >
                <path
                  d="M18 5.375a2.625 2.625 0 0 0-2.625-2.625H4.625A2.625 2.625 0 0 0 2 5.375v6.75A2.625 2.625 0 0 0 4.625 14.75h2.75l3 3.5 3-3.5h2A2.625 2.625 0 0 0 18 12.125v-6.75Z"
                  stroke="#2563eb"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg> */}
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
                    return (
                      <div
                        key={chat.id}
                        className={`chat-item ${
                          isSelected ? "selected" : ""
                        }`}
                        onClick={() =>
                          handleChatSelect(chat.id, chat.bookmarked || false)
                        }
                        style={{ position: 'relative' }}
                      >
                        <span className="chat-name">
                          {chat.title || "Untitled Chat"}
                        </span>
                        <button
                          className="kebab-menu-btn"
                          onClick={e => { e.stopPropagation(); handleMenuOpen('chat', chat.id); }}
                          title="More options"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {isMenuOpen && (
                          <div className="popup-menu" onClick={e => e.stopPropagation()}>
                            <button className="popup-menu-item" onClick={() => { handleMenuClose(); handleRename('chat', chat.id, chat.title); }}>Rename</button>
                            <button className="popup-menu-item delete" onClick={() => { handleMenuClose(); handleDeleteChat(chat.id, chat.title); }}>Delete</button>
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
             {/*  <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                style={{ marginRight: 4 }}
              >
                <path
                  d="M5 3a2 2 0 0 0-2 2v12a1 1 0 0 0 1.447.894L10 16.118l5.553 1.776A1 1 0 0 0 17 17V5a2 2 0 0 0-2-2H5zm0 2h10v11.382l-4.553-1.455a1 1 0 0 0-.894 0L5 16.382V5z"
                  fill="#2563eb"
                />
              </svg> */}
              <span className="section-title">Bookmarks</span>
            </div>

            <div className="bookmark-list">
              {sortedBookmarks.length === 0 ? (
                <div className="empty-message">No bookmarks yet</div>
              ) : (
                sortedBookmarks.map((bookmark) => {
                  const bookmarkId =
                    bookmark.bookmark_id || bookmark.id;
                  const bookmarkName =
                    bookmark.bookmark_name || bookmark.name || "Bookmark";
                  const isSelected = selectedId === bookmarkId;
                  const isMenuOpen = openMenu && openMenu.type === 'bookmark' && openMenu.id === bookmarkId;
                  return (
                    <div
                      key={bookmarkId}
                      className={`bookmark-item ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={() =>
                        handleFolderSelect(bookmarkId, true, true, false)
                      }
                      style={{ position: 'relative' }}
                    >
                      <span className="bookmark-name">
                        {bookmarkName}
                      </span>
                      <button
                        className="kebab-menu-btn"
                        onClick={e => { e.stopPropagation(); handleMenuOpen('bookmark', bookmarkId); }}
                        title="More options"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {isMenuOpen && (
                        <div className="popup-menu" onClick={e => e.stopPropagation()}>
                          <button className="popup-menu-item" onClick={() => { handleMenuClose(); handleRename('bookmark', bookmarkId, bookmarkName); }}>Rename</button>
                          <button className="popup-menu-item delete" onClick={() => { handleMenuClose(); handleDeleteBookmark(bookmarkId, bookmarkName); }}>Delete</button>
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
        /* ── Collapsed State ─────────────────────────────────────────────── */
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
      {openMenu && <div className="popup-menu-backdrop" onClick={handleMenuClose} />}
    </div>
  );
};

export default ChatbotTabs;