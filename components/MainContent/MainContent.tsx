import React from 'react';

interface MainContentProps {
  navId: string;
  subNavId: string;
  children: React.ReactNode;
  selectedChatId?: string; // Optional prop for selected chat ID
  selectedNewChatId?: string; // Optional prop for selected new chat ID
  setNewChatStarted?: (started: boolean) => void; // Optional prop for setting new chat started state
  isBookmarked?:boolean; // Optional prop for checking if a chat is bookmarked
  bookmarks?: any[]; // Optional prop for bookmarks, if needed
  refreshBookmarks?: () => void; // Optional prop for refreshing bookmarks
}

const MainContent: React.FC<MainContentProps> = ({ navId, subNavId, children,selectedChatId,selectedNewChatId,setNewChatStarted,isBookmarked, bookmarks,refreshBookmarks }) => {
  // We only render page-specific content here, no sidebar or subcontent duplication
  return (
    <div className="main-content">
      <div className="content-container">
       {React.Children.map(children, child =>
          React.isValidElement(child) && typeof child.type !== 'string'
            ? React.cloneElement(child as React.ReactElement<any>, {navId, subNavId, selectedChatId,selectedNewChatId,setNewChatStarted,isBookmarked,bookmarks,refreshBookmarks })
            : child
        )}
      </div>
    </div>
  );
};

export default MainContent; 