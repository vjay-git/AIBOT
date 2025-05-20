import React from 'react';

interface MainContentProps {
  navId: string;
  subNavId: string;
  children: React.ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ navId, subNavId, children }) => {
  // We only render page-specific content here, no sidebar or subcontent duplication
  return (
    <div className="main-content">
      <div className="content-container">
        {children}
      </div>
    </div>
  );
};

export default MainContent; 