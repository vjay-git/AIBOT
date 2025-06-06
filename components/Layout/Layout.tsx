import React, { useState, useEffect, useMemo, createContext, useContext, useCallback } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../Sidebar/Sidebar';
import SubcontentBar from '../SubcontentBar/SubcontentBar';
import MainContent from '../MainContent/MainContent';
import { NavItem, ChatSession, ChatFolder } from '../../types';
import { fetchChatbotData, createFolder, deleteFolder, toggleBookmark, moveToFolder, renameFolder } from '../../utils/apiMocks';
import { getAllChats } from '@/utils/api';

// Navigation items for sidebar
const navItems: NavItem[] = [
  { id: 'dashboard', title: 'Dashboard', route: 'dashboard' },
  { id: 'chatbot', title: 'Chatbot', route: 'chatbot' },
  { id: 'database', title: 'Database', route: 'database' },
  { id: 'schema', title: 'Schema', route: 'schema' },
  { id: 'llm', title: 'LLM', route: 'llm' },
  { id: 'settings', title: 'User Settings', route: 'user-settings' },
  { id: 'onboarding', title: 'Customer Onboarding', route: 'customer-onboarding' },
  { id: 'reports', title: 'Reports', route: 'reports' },
];

// Pages that should not display the SubcontentBar
const pagesWithoutSubcontentBar = ['reports'];

// Define context types for app state management
interface AppStateContextType {
  activeNav: string;
  activeSubNav: string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  chatbotData: any | null;
  isLoading: boolean;
  error: Error | null;
}

// Create context for app state
const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Custom hook to use navigation
function useNavigation(router: any) {
  const [activeNav, setActiveNav] = useState<string>('');
  const [activeSubNav, setActiveSubNav] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    const currentPath = router.pathname;
    const pathSegments = currentPath.split('/');
    const mainRouteSegment = pathSegments[1] || '';

    // Determine the new active navigation item based on the route
    const newNav = navItems.find(item =>
      item.route === mainRouteSegment || (mainRouteSegment === '' && item.id === 'dashboard')
    );

    if (newNav) {
      const newNavId = newNav.id;
      setActiveNav(newNavId);

      // Handle tab query parameter for sections that use it
      if (['settings', 'llm', 'onboarding'].includes(newNavId)) {
        const tab = getTabFromQuery(router.query);
        if (tab) {
          setActiveSubNav(tab);
        } else {
          setActiveSubNav('');
        }
      } else {
        setActiveSubNav('');
      }
    }

    setIsInitialized(true);
  }, [router.pathname, router.query]);

  const handleNavSelect = useCallback((navId: string) => {
    const selectedNav = navItems.find(item => item.id === navId);
    if (selectedNav) {
      router.push(`/${selectedNav.route}`);
    }
  }, [router]);

  const handleSubNavSelect = useCallback((subNavId: string) => {
    setActiveSubNav(subNavId);

    // For sections that use query parameters
    if (['settings', 'llm', 'onboarding'].includes(activeNav)) {
      const routePath = navItems.find(nav => nav.id === activeNav)?.route || '';
      router.push({
        pathname: `/${routePath}`,
        query: { tab: subNavId }
      }, undefined, { shallow: true });
    }
  }, [activeNav, router]);

  return {
    activeNav,
    activeSubNav,
    handleNavSelect,
    handleSubNavSelect,
    isInitialized
  };
}

// Helper function to safely extract tab from query
function getTabFromQuery(query: any): string | undefined {
  const tab = query?.tab;
  return Array.isArray(tab) ? tab[0] : tab;
}

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Chatbot sidebar state
  const [chatbotChats, setChatbotChats] = useState<ChatSession[]>([]);
  const [chatbotFolders, setChatbotFolders] = useState<ChatFolder[]>([]);
  const [chatbotBookmarks, setChatbotBookmarks] = useState<ChatFolder[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>('');
  const [selectedNewChatId, setSelectedNewChatId] = useState<string>('');
  const [newChatStarted, setNewChatStarted] = useState<boolean>(false);
  
  // Enhanced bookmark state management
  const [currentChatContext, setCurrentChatContext] = useState<{
    isBookmarked: boolean;
    chatId: string | null;
    isNewChat: boolean;
  }>({
    isBookmarked: false,
    chatId: null,
    isNewChat: false
  });

  // Use custom hooks
  const { activeNav, activeSubNav, handleNavSelect, handleSubNavSelect } = useNavigation(router);
  const [chatbotData, setChatbotData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // NEW: Add folder and bookmark context states
  const [isFromBookmarks, setIsFromBookmarks] = useState(false);
  const [isFromFolder, setIsFromFolder] = useState(false);

  // 🔧 ENHANCED: Updated Layout.tsx convertApiToChatbotData function with better debugging
  const convertApiToChatbotData = useCallback((api: any) => {
    try {
      console.log('🔄 Converting API data to chatbot format...');
      console.log('📊 Raw API data:', api);

      // 1. Build unique folders from aitables
      const folders = (api.aitables || []).reduce((acc: any[], t: any) => {
        if (t.table_id && !acc.find((f: any) => f.id === t.table_id)) {
          acc.push({ id: t.table_id, name: t.table_name || 'Unnamed Table' });
        }
        return acc;
      }, []);

      console.log('🗂️ Processed folders:', folders);

      // 2. Convert api.bookmarks to ChatFolder[] with proper handling of query_id formats
      const bookmarks: ChatFolder[] = (api.bookmarks || []).map((bookmark: any) => ({
        id: bookmark.bookmark_id || bookmark.id || '',
        name: bookmark.bookmark_name || bookmark.name || 'Unnamed Bookmark',
        bookmark_id: bookmark.bookmark_id,
        bookmark_name: bookmark.bookmark_name,
        queries: (bookmark.queries || []).map((q: any) => {
          // Handle both string and array formats for query_id
          let queryId: string = '';
          if (typeof q.query_id === 'string') {
            queryId = q.query_id;
          } else if (Array.isArray(q.query_id)) {
            // Take first non-null element from array
            queryId = q.query_id.find((id: any) => id !== null) || '';
          }
          
          return {
            query_id: queryId,
            messages: q.messages || []
          };
        }).filter((q: any) => q.query_id) // Remove entries with empty query_id
      }));

      console.log('🔖 Processed bookmarks:', bookmarks);

      // 3. Build a map of query_id -> table_id (folder id) from aitables.queries
      const queryToTableId: Record<string, string> = {};
      (api.aitables || []).forEach((table: any) => {
        (table.queries || []).forEach((query: any) => {
          if (query.query_id) {
            queryToTableId[query.query_id] = table.table_id;
          }
        });
      });

      // 4. Build a map of query_id -> messages (from api.query)
      const queryMap: Record<string, any[]> = {};
      (api.query || []).forEach((q: any) => {
        if (q.query_id && q.message) {
          if (Array.isArray(q.message[0])) {
            queryMap[q.query_id] = q.message[0];
          } else {
            queryMap[q.query_id] = q.message;
          }
        }
      });

      // 5. Build a map of query_id -> bookmark_id with proper handling
      const queryToBookmarkId: Record<string, string> = {};
      if (api.bookmarks && Array.isArray(api.bookmarks)) {
        api.bookmarks.forEach((bookmark: any) => {
          if (bookmark.queries && Array.isArray(bookmark.queries)) {
            bookmark.queries.forEach((q: any) => {
              let queryId: string = '';
              
              // Handle different query_id formats
              if (typeof q.query_id === 'string') {
                queryId = q.query_id;
              } else if (Array.isArray(q.query_id)) {
                queryId = q.query_id.find((id: any) => id !== null) || '';
              }
              
              if (queryId) {
                queryToBookmarkId[queryId] = bookmark.bookmark_id || bookmark.id || '';
              }
            });
          }
        });
      }

      // 6. Build chatSessions from threads, grouping messages by query_id
      const chatSessions = (api.thread || [])
        .filter((thread: any) => {
          // Skip threads whose title starts with "SQL Generated by LLM:"
          return !(typeof thread.thread_name === "string" && thread.thread_name.startsWith("SQL Generated by LLM:"));
        })
        .map((thread: any, idx: number) => {
          let messages: any[] = [];
          let folderId: string | undefined = undefined;
          let bookmarkId: string | undefined = undefined;

          (thread.querydetails || []).forEach((qd: any) => {
            if (qd.query_id && queryMap[qd.query_id]) {
              if (!folderId && queryToTableId[qd.query_id]) {
                folderId = queryToTableId[qd.query_id];
              }
              // If any query_id in this thread is bookmarked, assign its bookmark id
              if (!bookmarkId && queryToBookmarkId[qd.query_id]) {
                bookmarkId = queryToBookmarkId[qd.query_id];
              }
              const groupedMessages = queryMap[qd.query_id]
                .filter((msg: any) => !(typeof msg.content === "string" && msg.content.startsWith("SQL Generated by LLM:")))
                .map((msg: any, i: number) => ({
                  id: `msg-${qd.query_id}-${i}`,
                  sender: msg.role === "user" ? "user" : "bot",
                  text: msg.content || (msg.results?.data || msg.results || ""),
                  timestamp: new Date(Date.now() - (idx + 1) * 24 * 60 * 60 * 1000 + i * 10000).toISOString(),
                  queryId: qd.query_id,
                  bookmarked: !!queryToBookmarkId[qd.query_id] // Set bookmark status
                }));
              if (groupedMessages.length > 0) {
                messages.push({
                  queryId: qd.query_id,
                  messages: groupedMessages
                });
              }
            } else {
              console.warn(`⚠️ No messages found for query_id: ${qd.query_id} in thread: ${thread.thread_id}`);
            }
          });

          return {
            id: thread.thread_id,
            title: thread.thread_name,
            folderId,
            bookmarkId,
            bookmarked: !!bookmarkId, // Add bookmarked flag
            createdAt: new Date(Date.now() - (idx + 1) * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - (idx + 1) * 24 * 60 * 60 * 1000).toISOString(),
            messages,
            queryIds: (thread.querydetails || []).map((qd: any) => qd.query_id).filter(Boolean)
          };
        })
        .filter(Boolean); // Remove null/undefined entries

      console.log('💬 Processed chat sessions:', chatSessions.length);
      console.log('📈 Summary:', {
        folders: folders.length,
        bookmarks: bookmarks.length,
        chatSessions: chatSessions.length
      });
      
      return { chatSessions, folders, bookmarks };
    } catch (error) {
      console.error('❌ Error converting API data:', error);
      return { chatSessions: [], folders: [], bookmarks: [] };
    }
  }, []);

  const [chatData, setChatData] = useState<any | null>(null);

  // Enhanced chat data loading with better error handling
  const loadChatbotData = useCallback(async () => {
    if (activeNav !== 'chatbot') return;

    console.log('🔄 Loading chatbot data...');
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAllChats();
      console.log('📡 Raw chatbot data received:', data);
      setChatData(data);
      const chatbotData = convertApiToChatbotData(data);
      console.log("✅ Processed chatbot data:", {
        folders: chatbotData.folders.length,
        bookmarks: chatbotData.bookmarks.length,
        chats: chatbotData.chatSessions.length
      });
      
      setChatbotChats(chatbotData.chatSessions || []);
      setChatbotFolders(chatbotData.folders || []);
      setChatbotBookmarks(chatbotData.bookmarks || []);
      
      // Reset selection when data loads if no chat is selected
      if (!selectedChatId && !selectedNewChatId) {
        setSelectedChatId('');
      }
    } catch (err) {
      console.error('❌ Error loading chatbot data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load chatbot data'));
    } finally {
      setIsLoading(false);
    }
  }, [activeNav, convertApiToChatbotData, selectedChatId, selectedNewChatId]);

  // Load chatbot data on nav change
  useEffect(() => {
    loadChatbotData();
  }, [loadChatbotData]);

  // Enhanced new chat handling
  useEffect(() => {
    if (newChatStarted) {
      // Reset states for new chat
      setSelectedNewChatId('');
      setNewChatStarted(false);
      setCurrentChatContext({
        isBookmarked: false,
        chatId: null,
        isNewChat: true
      });
      
      // Reload data after new chat
      loadChatbotData();
    }
  }, [newChatStarted, loadChatbotData]);

  // Enhanced chat selection handler
  const handleSelectChat = useCallback((id: string) => {
    console.log(`💬 Chat selected in Layout: ${id}`);
    setSelectedChatId(id);
    setSelectedNewChatId(''); // Clear new chat when selecting existing chat
    
    // Find the selected chat and determine if it's bookmarked
    const selectedChat = chatbotChats.find(chat => chat.id === id);
    setCurrentChatContext({
      isBookmarked: selectedChat?.bookmarked || !!selectedChat?.bookmarkId || false,
      chatId: id,
      isNewChat: false
    });
  }, [chatbotChats]);

  // Enhanced bookmark state handler
  const handleIsBookmarked = useCallback((bookmark: boolean) => {
    setCurrentChatContext(prev => ({
      ...prev,
      isBookmarked: bookmark
    }));
  }, []);

  // Enhanced new chat handler
  const handleNewChat = useCallback(async () => {
    try {
      console.log('🆕 Creating new chat...');
      // Create a new chat session
      const newChat: ChatSession = {
        id: `chat-${Date.now()}`,
        title: 'New Chat',
        messages: [],
        bookmarked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        queryIds: []
      };
      
      setSelectedNewChatId(newChat.id);
      setSelectedChatId("");
      
      // Reset bookmark context for new chat
      setCurrentChatContext({
        isBookmarked: false,
        chatId: null,
        isNewChat: true
      });
    } catch (error) {
      console.error('❌ Error creating new chat:', error);
      setError(error instanceof Error ? error : new Error('Failed to create new chat'));
    }
  }, []);

  // Enhanced folder management with error handling
  const handleCreateFolder = useCallback(async (name: string) => {
    try {
      const folder = await createFolder(name);
      setChatbotFolders(prev => [...prev, folder]);
    } catch (error) {
      console.error('Error creating folder:', error);
      setError(error instanceof Error ? error : new Error('Failed to create folder'));
    }
  }, []);

  const handleDeleteFolder = useCallback(async (folderId: string) => {
    try {
      await deleteFolder(folderId);
      setChatbotFolders(prev => prev.filter(f => f.id !== folderId));
      setChatbotChats(prev => prev.map(chat => 
        chat.folderId === folderId ? { ...chat, folderId: undefined } : chat
      ));
    } catch (error) {
      console.error('Error deleting folder:', error);
      setError(error instanceof Error ? error : new Error('Failed to delete folder'));
    }
  }, []);

  // FIXED: Updated handleDeleteChat to work with real API
  const handleDeleteChat = useCallback(async (chatId: string) => {
    try {
      // Don't call the mock deleteChat function since we're using real API
      // The actual deletion is handled in ChatbotTabs component using deletedThreadById API
      // This function is just for updating local state after successful deletion
      
      setChatbotChats(prev => prev.filter(chat => chat.id !== chatId));
      
      if (selectedChatId === chatId) {
        const remainingChats = chatbotChats.filter(chat => chat.id !== chatId);
        setSelectedChatId(remainingChats.length > 0 ? remainingChats[0].id : '');
        setCurrentChatContext({
          isBookmarked: false,
          chatId: null,
          isNewChat: false
        });
      }
    } catch (error) {
      console.error('Error in handleDeleteChat:', error);
      setError(error instanceof Error ? error : new Error('Failed to delete chat'));
    }
  }, [selectedChatId, chatbotChats]);

  const handleToggleBookmark = useCallback(async (chatId: string) => {
    try {
      await toggleBookmark(chatId);
      setChatbotChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, bookmarked: !chat.bookmarked } : chat
      ));
      
      // Update current context if this is the selected chat
      if (selectedChatId === chatId) {
        setCurrentChatContext(prev => ({
          ...prev,
          isBookmarked: !prev.isBookmarked
        }));
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      setError(error instanceof Error ? error : new Error('Failed to toggle bookmark'));
    }
  }, [selectedChatId]);

  const handleMoveToFolder = useCallback(async (chatId: string, folderId: string | null) => {
    try {
      await moveToFolder(chatId, folderId);
      setChatbotChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, folderId: folderId || undefined } : chat
      ));
    } catch (error) {
      console.error('Error moving to folder:', error);
      setError(error instanceof Error ? error : new Error('Failed to move chat to folder'));
    }
  }, []);

  const handleRenameFolder = useCallback(async (folderId: string, newName: string) => {
    try {
      await renameFolder(folderId, newName);
      setChatbotFolders(prev => prev.map(f => 
        f.id === folderId ? { ...f, name: newName } : f
      ));
    } catch (error) {
      console.error('Error renaming folder:', error);
      setError(error instanceof Error ? error : new Error('Failed to rename folder'));
    }
  }, []);

  // Enhanced refresh function for chats
  const refreshChats = useCallback(async () => {
    try {
      console.log('🔄 Refreshing chat data...');
      await loadChatbotData();
    } catch (error) {
      console.error('Error refreshing chats:', error);
      setError(error instanceof Error ? error : new Error('Failed to refresh chats'));
    }
  }, [loadChatbotData]);

  // Enhanced refresh bookmarks function
  const refreshBookmarks = useCallback(async () => {
    try {
      await loadChatbotData();
    } catch (error) {
      console.error('Error refreshing bookmarks:', error);
      setError(error instanceof Error ? error : new Error('Failed to refresh bookmarks'));
    }
  }, [loadChatbotData]);

  // Update window chatbotData and notify components when data changes
  useEffect(() => {
    if (chatbotData && typeof window !== 'undefined') {
      (window as any).chatbotData = chatbotData;

      // Use a safer way to notify components
      const event = new CustomEvent('chatbotDataUpdated', {
        detail: { chatbotData }
      });
      window.dispatchEvent(event);
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined' && activeNav !== 'chatbot') {
        delete (window as any).chatbotData;
      }
    };
  }, [chatbotData, activeNav]);

  // Check if the current page should display the SubcontentBar
  const shouldShowSubcontentBar = !pagesWithoutSubcontentBar.includes(activeNav);

  // Create a value object for the context
  const appStateValue = useMemo(() => ({
    activeNav,
    activeSubNav,
    searchTerm,
    setSearchTerm,
    chatbotData,
    isLoading,
    error
  }), [activeNav, activeSubNav, searchTerm, chatbotData, isLoading, error]);

  // Dynamically import subnav config from each page
  let subNavItems = [];
  switch (activeNav) {
    case 'dashboard':
      try { subNavItems = require('../../pages/dashboard/index').dashboardTabs; } catch { }
      break;
    case 'chatbot':
      try { subNavItems = require('../../pages/chatbot/index').chatbotTabs; } catch { }
      break;
    case 'database':
      try { subNavItems = require('../../pages/database/index').databaseTabs; } catch { }
      break;
    case 'schema':
      try { subNavItems = require('../../pages/schema/index').schemaTabs; } catch { }
      break;
    case 'llm':
      try { subNavItems = require('../../pages/llm/index').llmTabs; } catch { }
      break;
    case 'settings':
      try { subNavItems = require('../../pages/user-settings/index').userSettingsTabs; } catch { }
      break;
    case 'onboarding':
      try { subNavItems = require('../../pages/customer-onboarding/index').onboardingTabs; } catch { }
      break;
    case 'reports':
      try { subNavItems = require('../../pages/reports/index').reportsTabs; } catch { }
      break;
    default:
      subNavItems = [];
  }

  // Render search box based on current route
  const renderSearchBox = useCallback(() => {
    if (['schema', 'customer-onboarding', 'dashboard', 'database'].includes(activeNav)) {
      const placeholder =
        activeNav === 'customer-onboarding' ? "Search by Name, Id.no" : "Search";

      return (
        <div className="search-input-container">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="text"
            placeholder={placeholder}
            className="search-input-field"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      );
    }
    return null;
  }, [activeNav, searchTerm]);

  // Render filters based on current route
  const renderFilters = useCallback(() => {
    if (['schema', 'dashboard', 'customer-onboarding'].includes(activeNav)) {
      return (
        <button className="filter-button-container">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H21M3 12H21M3 18H21" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Filters</span>
        </button>
      );
    }
    return null;
  }, [activeNav]);

  // Render additional controls based on current route
  const renderAdditionalControls = useCallback(() => {
    if (activeNav === 'customer-onboarding') {
      return (
        <button className="invite-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Invite
        </button>
      );
    }

    if (activeNav === 'dashboard') {
      return (
        <button className="add-card-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Add Card
        </button>
      );
    }

    return null;
  }, [activeNav]);

  // If there's an error loading chatbot data, show error message
  if (activeNav === 'chatbot' && error) {
    return (
      <div className="layout-container">
        <Sidebar items={navItems} />
        <div className="error-container" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          padding: '2rem'
        }}>
          <p style={{ marginBottom: '1rem', color: '#dc2626' }}>
            There was an error loading the chatbot data. Please try refreshing the page.
          </p>
          <button 
            onClick={() => router.reload()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // UPDATED: Define props for SubcontentBar with folder support
  const subContentBarProps = {
    items: subNavItems || [],
    selectedId: ['onboarding', 'llm', 'settings'].includes(activeNav) ? activeSubNav : selectedChatId,
    onSelect: ['onboarding', 'llm', 'settings'].includes(activeNav) ? handleSubNavSelect : handleSelectChat,
    title: navItems.find(item => item.id === activeNav)?.title || '',
    searchBox: renderSearchBox(),
    filters: renderFilters(),
    additionalControls: renderAdditionalControls(),
    sectionType: activeNav,
    chats: chatbotChats,
    folders: chatbotFolders,
    bookmarks: chatbotBookmarks,
    setIsFromBookmarks: setIsFromBookmarks,
    setIsFromFolder: setIsFromFolder,
    onNewChat: handleNewChat,
    isBookmarked: handleIsBookmarked,
    onCreateFolder: handleCreateFolder,
    onMoveToFolder: handleMoveToFolder,
    onRenameFolder: handleRenameFolder,
    onDeleteFolder: handleDeleteFolder,
    onDeleteChat: handleDeleteChat,
    onToggleBookmark: handleToggleBookmark,
    refreshChats: refreshChats
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleSidebarToggle = (e: any) => {
      setSidebarCollapsed(!!(e.detail && e.detail.collapsed));
    };
    window.addEventListener('sidebarToggle', handleSidebarToggle);
    return () => window.removeEventListener('sidebarToggle', handleSidebarToggle);
  }, []);

  return (
    <AppStateContext.Provider value={appStateValue}>
      <div className={`layout-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${!shouldShowSubcontentBar ? 'without-subcontent' : ''}`}>
        <Sidebar items={navItems} />

        {(shouldShowSubcontentBar && activeNav !== "dashboard")&&(
          <SubcontentBar {...subContentBarProps} />
        )}

        <MainContent 
          navId={activeNav} 
          subNavId={activeSubNav} 
          selectedChatId={selectedChatId} 
          selectedNewChatId={selectedNewChatId} 
          setNewChatStarted={setNewChatStarted} 
          isBookmarked={currentChatContext.isBookmarked} 
          bookmarks={chatbotBookmarks} 
          refreshBookmarks={refreshBookmarks}
          chatData={chatData}
          isFromBookmarks={isFromBookmarks}
          isFromFolder={isFromFolder}
        >
          {children}
        </MainContent>
      </div>
    </AppStateContext.Provider>
  );
};

// Custom hook to use the app state context
export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateContext.Provider');
  }
  return context;
}

export default Layout;