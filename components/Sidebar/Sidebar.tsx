import React from 'react';
import { useRouter } from 'next/router';
import { NavItem } from '../../types';
import Image from 'next/image';

interface SidebarProps {
  items: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ items }) => {
  const router = useRouter();
  
  const getActiveStatus = (route: string): boolean => {
    const path = router.pathname.split('/')[1];
    return route === path || (path === '' && route === 'dashboard');
  };

  const handleNavigation = (route: string) => {
    router.push(`/${route}`);
  };

  // Map icon names to image elements
  const getIcon = (id: string) => {
    switch (id) {
      case 'dashboard':
        return (
          <Image 
            src="/assets/icons/Dash.png" 
            alt="Dashboard" 
            width={32} 
            height={32} 
          />
        );
      case 'chatbot':
        return (
          <Image 
            src="/assets/icons/Chatbott.png" 
            alt="Chatbot" 
            width={32} 
            height={32} 
          />
        );
      case 'database':
        return (
          <Image 
            src="/assets/icons/DB.png" 
            alt="Database" 
            width={32} 
            height={32} 
          />
        );
      case 'schema':
        return (
          <Image 
            src="/assets/icons/Schema.png" 
            alt="Schema" 
            width={32} 
            height={32} 
          />
        );
      case 'llm':
        return (
          <Image 
            src="/assets/icons/LLM.png" 
            alt="LLM" 
            width={32} 
            height={32} 
          />
        );
      case 'settings':
        return (
          <Image 
            src="/assets/icons/User.png" 
            alt="Settings" 
            width={32} 
            height={32} 
          />
        );
      case 'onboarding':
        return (
          <Image 
            src="/assets/icons/Org.png" 
            alt="Onboarding" 
            width={32} 
            height={32} 
          />
        );
      case 'reports':
        return (
          <Image 
            src="/assets/icons/Reports.png" 
            alt="Reports" 
            width={32} 
            height={32} 
          />
        );
      default:
        return <div className="icon-placeholder"></div>;
    }
  };

  return (
    <div className="sidebar-container">
      <div className="sidebar-content">
        <div className="logo-container">
          <Image 
            src="/assets/icons/Logo.png" 
            alt="Logo" 
            width={48} 
            height={48}
            className="logo-image" 
          />
        </div>
        
        <div className="nav-items-container">
          {items.map((item) => (
            <div
              key={item.id}
              className={`nav-item-container ${getActiveStatus(item.route) ? 'active' : ''}`}
              onClick={() => handleNavigation(item.route)}
            >
              <div className="icon-wrapper">
                {getIcon(item.id)}
              </div>
              <div className="tooltip">{item.title}</div>
            </div>
          ))}
          <div className="add-button">
            <div className="plus-icon"></div>
          </div>
        </div>
      </div>
      
      <div className="user-profile">
        <div className="avatar1">
          <Image 
            src="/assets/icons/Avatar.png" 
            alt="Logo" 
            width={20} 
            height={20}
            className="logo-image" 
          />
        </div>
        <div className="tooltip">Vijay Kumar<br></br>vijaykumar.g@sap.in</div>
      </div>
    </div>
  );
};

export default Sidebar; 