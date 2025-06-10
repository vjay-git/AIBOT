import React from 'react';

interface MainContentProps {
  navId: string;
  subNavId: string;
  children: React.ReactNode;
  selectedChatId?: string;
  selectedNewChatId?: string;
  chatData?: any;
  setNewChatStarted?: (started: boolean) => void;
  isBookmarked?: boolean;
  bookmarks?: any[];
  refreshBookmarks?: () => void;
  isFromBookmarks?: boolean;
  isFromFolder?: boolean; // NEW: Add folder context prop
  // Dashboard props
  dashboardKeys?: string[];
  setDashboardKeys?: (keys: string[]) => void;
  dashboardData?: any;
  setDashboardData?: (data: any) => void;
  selectedDashboard?: string;
  setSelectedDashboard?: (id: string) => void;
  addDashboardDialogOpen?: boolean;
  setAddDashboardDialogOpen?: (open: boolean) => void;
  setDefaultDashboardId?: (id: string) => void;
  onEditDashboard: (id: string) => void; // New prop for editing dashboard
  // New props for editing dashboard
  editDashboardDialogOpen?: boolean;
  setEditDashboardDialogOpen?: (open: boolean) => void;
  editDashboardId?: string;
  setEditDashboardId?: (id: string) => void;
  editDashboardTitle?: string;
  setEditDashboardTitle?: (title: string) => void;
  editDashboardDescription?: string;
  setEditDashboardDescription?: (desc: string) => void;
  editDashboardAiTables?: string[];
  setEditDashboardAiTables?: (tables: string[]) => void;
}

const MainContent: React.FC<MainContentProps> = ({ 
  navId, 
  subNavId, 
  children,
  selectedChatId,
  selectedNewChatId,
  chatData,
  setNewChatStarted,
  isBookmarked, 
  bookmarks,
  refreshBookmarks, 
  isFromBookmarks,
  isFromFolder, // NEW: Add folder context prop
  // Dashboard props
  dashboardKeys,
  setDashboardKeys,
  dashboardData,
  setDashboardData,
  selectedDashboard,
  setSelectedDashboard,
  addDashboardDialogOpen,
  setAddDashboardDialogOpen,
  setDefaultDashboardId,
  onEditDashboard,
  // New props for editing dashboard
  editDashboardDialogOpen,
  setEditDashboardDialogOpen,
  editDashboardId,
  setEditDashboardId,
  editDashboardTitle,
  setEditDashboardTitle,
  editDashboardDescription,
  setEditDashboardDescription,
  editDashboardAiTables,
  setEditDashboardAiTables
}) => {
  // We only render page-specific content here, no sidebar or subcontent duplication
  return (
    <div className="main-content">
      <div className="content-container">
       {React.Children.map(children, child =>
          React.isValidElement(child) && typeof child.type !== 'string'
            ? React.cloneElement(child as React.ReactElement<any>, {
                navId, 
                subNavId, 
                selectedChatId,
                selectedNewChatId,
                chatData, 
                setNewChatStarted,
                isBookmarked,
                bookmarks,
                refreshBookmarks,
                isFromBookmarks,
                isFromFolder, // NEW: Pass folder context to children
                // Dashboard props
                dashboardKeys,
                setDashboardKeys,
                dashboardData,
                setDashboardData,
                selectedDashboard,
                setSelectedDashboard,
                addDashboardDialogOpen,
                setAddDashboardDialogOpen,
                setDefaultDashboardId,
                onEditDashboard,
                // Pass dashboard edit dialog state as props
                editDashboardDialogOpen,
                setEditDashboardDialogOpen,
                editDashboardId,
                setEditDashboardId,
                editDashboardTitle,
                setEditDashboardTitle,
                editDashboardDescription,
                setEditDashboardDescription,
                editDashboardAiTables,
                setEditDashboardAiTables
              })
            : child
        )}
      </div>
    </div>
  );
};

export default MainContent;