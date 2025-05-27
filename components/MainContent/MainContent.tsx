import React from 'react';

interface MainContentProps {
  navId: string;
  subNavId: string;
  children: React.ReactNode;
  selectedChatId?: string; // Optional prop for selected chat ID
  selectedNewChatId?: string; // Optional prop for selected new chat ID
  setNewChatStarted?: (started: boolean) => void; // Optional prop for setting new chat started state
}

const MainContent: React.FC<MainContentProps> = ({ navId, subNavId, children,selectedChatId,selectedNewChatId,setNewChatStarted }) => {
  // We only render page-specific content here, no sidebar or subcontent duplication
  return (
    <div className="main-content">
      <div className="content-container">
       {React.Children.map(children, child =>
          React.isValidElement(child) && typeof child.type !== 'string'
            ? React.cloneElement(child as React.ReactElement<any>, {navId, subNavId, selectedChatId,selectedNewChatId,setNewChatStarted })
            : child
        )}
      </div>
    </div>
  );
};

export default MainContent; 