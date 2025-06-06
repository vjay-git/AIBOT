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
  isFromFolder // NEW: Add folder context prop
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
                isFromFolder // NEW: Pass folder context to children
              })
            : child
        )}
      </div>
    </div>
  );
};

export default MainContent;