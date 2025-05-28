import React, { useState } from 'react';
import { SubNavItem } from '../../types';

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  bookmarked: boolean;
  folderId?: string;
  bookmarkId?: string;
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
  isBookmarked: (bookmark:boolean)=> void;
  onNewChat?: () => void;
  onCreateFolder?: (name: string) => void;
  onMoveToFolder?: (chatId: string, folderId: string | null) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onToggleBookmark?: (chatId: string) => void;
}

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
  onToggleBookmark
}) => {
  // Local state for tab switching (folders, chats, bookmarks)
  const [activeSection, setActiveSection] = useState<'folders' | 'chats' | 'bookmarks'>('chats');
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({});
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Helper functions for folder expand/collapse
  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Bookmarked and unorganized chats
  const bookmarkedChats = chats.filter(chat => chat?.bookmarked);
  const unorganizedChats = chats

  const handleFolderSelect = (folderId: string | null, bookmarked: boolean = false) => {
   console.log(`Selected folder: ${folderId}`);
   onSelect(folderId || '');
   isBookmarked(bookmarked);
  }

  return (
    <div className="chatbot-sidebar-content">
      {/* Navigation tabs */}
      <div className="chatbot-nav-tabs">
        <button
          className={`chatbot-nav-tab ${activeSection === 'folders' ? 'active' : ''}`}
          onClick={() => setActiveSection('folders')}
          title="Folders"
          aria-label="Folders"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="currentColor"/>
          </svg>
        </button>
        <button
          className={`chatbot-nav-tab ${activeSection === 'chats' ? 'active' : ''}`}
          onClick={() => setActiveSection('chats')}
          title="Chats"
          aria-label="Chats"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
          </svg>
        </button>
        <button
          className={`chatbot-nav-tab ${activeSection === 'bookmarks' ? 'active' : ''}`}
          onClick={() => setActiveSection('bookmarks')}
          title="Bookmarks"
          aria-label="Bookmarks"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="currentColor"/>
          </svg>
        </button>
      </div>

      {/* Folders Section */}
      {activeSection === 'folders' && (
        <div className="sidebar-section">
          <div className="section-header">
            <div className="section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="#0052FF"/>
              </svg>
              <span>Folders</span>
            </div>
            <button className="add-button" onClick={() => setShowNewFolderInput(true)} aria-label="Add new folder">
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
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="new-folder-input"
                autoFocus
              />
              <div className="new-folder-actions">
                <button
                  className="new-folder-create"
                  onClick={() => {
                    if (onCreateFolder && newFolderName.trim()) {
                      onCreateFolder(newFolderName.trim());
                      setNewFolderName('');
                      setShowNewFolderInput(false);
                    }
                  }}
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
              folders.map(folder => (
                <div key={folder.id} className="folder-container">
                  <div
                    className="folder-header"
                    onClick={() => toggleFolderExpand(folder.id)}
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
                        onClick={e => {
                          e.stopPropagation();
                          if (onRenameFolder) {
                            const newName = prompt('Enter new folder name:', folder.name);
                            if (newName && newName.trim() !== '' && newName !== folder.name) {
                              onRenameFolder(folder.id, newName);
                            }
                          }
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button
                        className="folder-action-button delete-button"
                        onClick={e => {
                          e.stopPropagation();
                          if (onDeleteFolder && window.confirm(`Delete folder "${folder.name}"?`)) {
                            onDeleteFolder(folder.id);
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
                      {chats.filter(chat => chat && chat.folderId === folder.id).length === 0 ? (
                        <div className="empty-folder-message">Folder is empty</div>
                      ) : (
                        chats
                          .filter(chat => chat && chat.folderId === folder.id)
                          .map(chat => (
                            <div
                              key={chat.id}
                              className={`chat-item ${selectedId === chat.id ? 'active' : ''}`}
                              onClick={() => handleFolderSelect(chat.id)}
                            >
                              <div className="chat-icon">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
                                </svg>
                              </div>
                              <span className="chat-title">{chat.title}</span>
                              <div className="chat-actions">
                                <button
                                  className={`bookmark-button ${chat?.bookmarked ? 'bookmarked' : ''}`}
                                  onClick={e => {
                                    e.stopPropagation();
                                    onToggleBookmark && onToggleBookmark(chat.id);
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" fill={chat.bookmarked ? '#0052FF' : 'currentColor'}/>
                                  </svg>
                                </button>
                                <button
                                  className="delete-button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    if (onDeleteChat && window.confirm(`Delete chat "${chat.title}"?`)) {
                                      onDeleteChat(chat.id);
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

      {/* Chats Section */}
      {activeSection === 'chats' && (
        <div className="sidebar-section">
          <div className="section-header">
            <div className="section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="#0052FF"/>
              </svg>
              <span>Chats</span>
            </div>
            <button className="add-button" onClick={onNewChat} aria-label="New chat">
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
                .sort((a, b) => new Date(b?.updatedAt).getTime() - new Date(a?.updatedAt).getTime())
                .map((chat:any) => chat?.messages?.length>0  &&(
                  <div
                    key={chat.id}
                    className={`chat-item ${selectedId === chat?.id ? 'active' : ''}`}
                    onClick={() => handleFolderSelect(chat?.id)}
                  >
                    <div className="chat-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <span className="chat-title">{chat?.title}</span>
                    <div className="chat-actions">
                      <button
                        className={`bookmark-button ${chat.bookmarked ? 'bookmarked' : ''}`}
                        onClick={e => {
                          e.stopPropagation();
                          onToggleBookmark && onToggleBookmark(chat.id);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" fill={chat.bookmarked ? '#0052FF' : 'currentColor'}/>
                        </svg>
                      </button>
                      <button
                        className="delete-button"
                        onClick={e => {
                          e.stopPropagation();
                          if (onDeleteChat && window.confirm(`Delete chat "${chat.title}"?`)) {
                            onDeleteChat(chat.id);
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

      {/* Bookmarks Section */}
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
          <div className="folders-list">
            {bookmarks.length === 0 ? (
              <div className="empty-list-message">No bookmarks yet</div>
            ) : (
              bookmarks.map(bookmark => (
                <div key={bookmark.id} className="folder-container">
                  <div
                    className="folder-header"
                    onClick={() => toggleFolderExpand(bookmark.id)}
                  >
                    <div className="folder-icon-name">
                      <svg
                        className={`folder-expand-icon ${expandedFolders[bookmark.id] ? 'expanded' : ''}`}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="folder-name">{bookmark.name}</span>
                    </div>
                  </div>
                  {expandedFolders[bookmark.id] && (
                    <div className="folder-content">
                      {chats.filter(chat => chat && chat.bookmarkId === bookmark.id).length === 0 ? (
                        <div className="empty-folder-message">No bookmarked chats in this folder</div>
                      ) : (
                        chats
                          .filter(chat => chat && chat.bookmarkId === bookmark.id)
                          .map(chat => (
                            <div
                              key={chat.id}
                              className={`chat-item ${selectedId === chat.id ? 'active' : ''}`}
                              onClick={() => handleFolderSelect(chat.id, true)}
                            >
                              <div className="chat-icon">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
                                </svg>
                              </div>
                              <span className="chat-title">{chat.title}</span>
                              <div className="chat-actions">
                                <button
                                  className={`bookmark-button ${chat?.bookmarkId ? 'bookmarked' : ''}`}
                                  onClick={e => {
                                    e.stopPropagation();
                                    onToggleBookmark && onToggleBookmark(chat.id);
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" fill={chat.bookmarked ? '#0052FF' : 'currentColor'}/>
                                  </svg>
                                </button>
                                <button
                                  className="delete-button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    if (onDeleteChat && window.confirm(`Delete chat "${chat.title}"?`)) {
                                      onDeleteChat(chat.id);
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
    </div>
  );
};

export default ChatbotTabs;
