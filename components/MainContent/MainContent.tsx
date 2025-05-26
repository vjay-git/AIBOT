import React from 'react';

interface MainContentProps {
  navId: string;
  subNavId: string;
  children: React.ReactNode;
  shouldShowSubcontentBar?: boolean;
}

const MainContent: React.FC<MainContentProps> = ({ navId, subNavId, children, shouldShowSubcontentBar }) => {
  return (
    <div className="main-content">
      <div className="content-container">
        {React.Children.map(children, child =>
          React.isValidElement(child) && typeof child.type !== 'string'
            ? React.cloneElement(child as React.ReactElement<any>, {navId, subNavId, shouldShowSubcontentBar })
            : child
        )}
      </div>
    </div>
  );
};

export default MainContent;