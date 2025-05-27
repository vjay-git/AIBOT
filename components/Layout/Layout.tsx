import React, { useState, useEffect, useMemo, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../Sidebar/Sidebar';
import SubcontentBar from '../SubcontentBar/SubcontentBar';
import MainContent from '../MainContent/MainContent';
import { NavItem, ChatSession, ChatFolder } from '../../types';
import { fetchChatbotData, createFolder, deleteFolder, deleteChat, toggleBookmark, moveToFolder, renameFolder } from '../../utils/apiMocks';

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
    const mainRouteSegment = pathSegments[1] || ''; // e.g., 'dashboard', 'user-settings', or empty for root

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

  const handleNavSelect = (navId: string) => {
    const selectedNav = navItems.find(item => item.id === navId);
    if (selectedNav) {
      router.push(`/${selectedNav.route}`);
    }
  };
  
  const handleSubNavSelect = (subNavId: string) => {
    setActiveSubNav(subNavId);
    
    // For sections that use query parameters
    if (['settings', 'llm', 'onboarding'].includes(activeNav)) {
      const routePath = navItems.find(nav => nav.id === activeNav)?.route || '';
      router.push({
        pathname: `/${routePath}`,
        query: { tab: subNavId }
      }, undefined, { shallow: true });
    }
  };

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

// Custom hook to manage chatbot data
function useChatbotData(activeNav: string) {
  const [chatbotData, setChatbotData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    
    const initializeChatbotData = async () => {
      if (activeNav !== 'chatbot') return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await fetchChatbotData();
        
        if (isMounted) {
          setChatbotData({
            chatSessions: data.chatSessions,
            folders: data.folders,
            activeChatId: data.activeChatId,
            handleSelectChat: (id: string) => {
              if (router.pathname.includes('/chatbot')) {
                return;
              }
              router.push('/chatbot');
            },
            handleNewChat: () => {
              router.push('/chatbot');
            },
            handleToggleBookmark: (id: string) => {
              router.push('/chatbot');
            },
            handleCreateFolder: (name: string) => {
              router.push('/chatbot');
            },
            handleMoveToFolder: (chatId: string, folderId: string | null) => {
              router.push('/chatbot');
            },
            handleRenameFolder: () => {},
            handleDeleteFolder: () => {}
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    initializeChatbotData();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [activeNav, router]);

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
        // Only remove from window when navigating away from chatbot section
        delete (window as any).chatbotData;
      }
    };
  }, [chatbotData, activeNav]);

  return { chatbotData, isLoading, error };
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
  const [selectedChatId, setSelectedChatId] = useState<string>('');
  
  // Use custom hooks
  const { activeNav, activeSubNav, handleNavSelect, handleSubNavSelect } = useNavigation(router);
  const { chatbotData, isLoading, error } = useChatbotData(activeNav);
  
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
      try { subNavItems = require('../../pages/dashboard/index').dashboardTabs; } catch {}
      break;
    case 'chatbot':
      try { subNavItems = require('../../pages/chatbot/index').chatbotTabs; } catch {}
      break;
    case 'database':
      try { subNavItems = require('../../pages/database/index').databaseTabs; } catch {}
      break;
    case 'schema':
      try { subNavItems = require('../../pages/schema/index').schemaTabs; } catch {}
      break;
    case 'llm':
      try { subNavItems = require('../../pages/llm/index').llmTabs; } catch {}
      break;
    case 'settings':
      try { subNavItems = require('../../pages/user-settings/index').userSettingsTabs; } catch {}
      break;
    case 'onboarding':
      try { subNavItems = require('../../pages/customer-onboarding/index').onboardingTabs; } catch {}
      break;
    case 'reports':
      try { subNavItems = require('../../pages/reports/index').reportsTabs; } catch {}
      break;
    default:
      subNavItems = [];
  }

  // Load chatbot data on nav change
  useEffect(() => {
    if (activeNav === 'chatbot') {
      fetchChatbotData().then(data => {
        setChatbotChats(data.chatSessions || []);
        setChatbotFolders(data.folders || []);
        setSelectedChatId(data.activeChatId || (data.chatSessions?.[0]?.id ?? ''));
      });
    }
  }, [activeNav]);

  // Sidebar actions
  const handleSelectChat = (id: string) => {
    setSelectedChatId(id);
    // Optionally update route/query if needed
  };
  const handleNewChat = async () => {
    // Create a new chat session (mock)
    const newChat: ChatSession = {
      id: `chat-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      bookmarked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setChatbotChats(prev => [newChat, ...prev]);
    setSelectedChatId(newChat.id);
  };
  const handleCreateFolder = async (name: string) => {
    const folder = await createFolder(name);
    setChatbotFolders(prev => [...prev, folder]);
  };
  const handleDeleteFolder = async (folderId: string) => {
    await deleteFolder(folderId);
    setChatbotFolders(prev => prev.filter(f => f.id !== folderId));
    setChatbotChats(prev => prev.map(chat => chat.folderId === folderId ? { ...chat, folderId: undefined } : chat));
  };
  const handleDeleteChat = async (chatId: string) => {
    await deleteChat(chatId);
    setChatbotChats(prev => prev.filter(chat => chat.id !== chatId));
    if (selectedChatId === chatId) {
      setSelectedChatId(chatbotChats.length > 0 ? chatbotChats[0].id : '');
    }
  };
  const handleToggleBookmark = async (chatId: string) => {
    await toggleBookmark(chatId);
    setChatbotChats(prev => prev.map(chat => chat.id === chatId ? { ...chat, bookmarked: !chat.bookmarked } : chat));
  };
  const handleMoveToFolder = async (chatId: string, folderId: string | null) => {
    await moveToFolder(chatId, folderId);
    setChatbotChats(prev => prev.map(chat => chat.id === chatId ? { ...chat, folderId: folderId || undefined } : chat));
  };
  const handleRenameFolder = async (folderId: string, newName: string) => {
    await renameFolder(folderId, newName);
    setChatbotFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: newName } : f));
  };
  
  // Render search box based on current route
  const renderSearchBox = () => {
    if (['schema', 'customer-onboarding', 'dashboard', 'database'].includes(activeNav)) {
      const placeholder = 
        activeNav === 'customer-onboarding' ? "Search by Name, Id.no" : 
        "Search";
      
      return (
        <div className="search-input-container">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
  };
  
  // Render filters based on current route
  const renderFilters = () => {
    if (['schema', 'dashboard', 'customer-onboarding'].includes(activeNav)) {
      return (
        <button className="filter-button-container">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H21M3 12H21M3 18H21" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Filters</span>
        </button>
      );
    }
    return null;
  };
  
  // Render additional controls based on current route
  const renderAdditionalControls = () => {
    if (activeNav === 'customer-onboarding') {
      return (
        <button className="invite-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Invite
        </button>
      );
    }
    
    if (activeNav === 'dashboard') {
      return (
        <button className="add-card-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Add Card
        </button>
      );
    }
    
    return null;
  };

  // If there's an error loading chatbot data, we could show an error message
  if (activeNav === 'chatbot' && error) {
    return (
      <div className="layout-container">
        <Sidebar items={navItems} />
        <div className="error-container">
          <p>There was an error loading the chatbot data. Please try refreshing the page.</p>
          <button onClick={() => router.reload()}>Refresh</button>
        </div>
      </div>
    );
  }
  
  // Define props for SubcontentBar
  const subContentBarProps = {
    items: subNavItems || [],
    selectedId: selectedChatId,
    onSelect: handleSelectChat,
    title: navItems.find(item => item.id === activeNav)?.title || '',
    searchBox: renderSearchBox(),
    filters: renderFilters(),
    additionalControls: renderAdditionalControls(),
    sectionType: activeNav,
    chats: chatbotChats,
    folders: chatbotFolders,
    onNewChat: handleNewChat,
    onCreateFolder: handleCreateFolder,
    onMoveToFolder: handleMoveToFolder,
    onRenameFolder: handleRenameFolder,
    onDeleteFolder: handleDeleteFolder,
    onDeleteChat: handleDeleteChat,
    onToggleBookmark: handleToggleBookmark
  };
  
  return (
    <AppStateContext.Provider value={appStateValue}>
      <div className={`layout-container ${!shouldShowSubcontentBar ? 'without-subcontent' : ''}`}>
        <Sidebar items={navItems} />
        
        {shouldShowSubcontentBar && (
          <SubcontentBar {...subContentBarProps} />
        )}
        
        <MainContent navId={activeNav} subNavId={activeSubNav}>
          {isLoading && activeNav === 'chatbot' ? (
            <div className="loading-container">Loading chatbot data...</div>
          ) : (
            children
          )}
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