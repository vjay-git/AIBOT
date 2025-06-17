import React from 'react';
import type { AppProps } from 'next/app';
import Layout from '../components/Layout/Layout';
import { useOscarLoading } from '../hooks/useOscarLoading';

// Global styles and fonts
import '../styles/fonts.css'; // Premium fonts

// Layout components styles
import '../components/Layout/Layout.css';
import '../components/MainContent/MainContent.css';
import '../components/SubcontentBar/SubcontentBar.css';
import '../components/Sidebar/Sidebar.css';

//schema component styles
import '../components/schema/ModelDetailsModal.css';

// Database component styles
import '../styles/Database/DatabaseHeader.css';
import '../styles/Database/DatabaseTypeSelect.css';
import '../styles/Database/FileUploader.css';
import '../styles/Database/SheetSelector.css';
import '../styles/Database/ConnectionFields.css';
import '../styles/Database/DatabaseTable.css';
import '../styles/Database/AlignView.css';

// Chatbot component styles
import '../components/Chatbot/styles/ChatHeader.css';
import '../components/Chatbot/styles/ChatMainContent.css';
import '../components/Chatbot/styles/ChatSidebar.css';
import '../components/Chatbot/styles/ChatWindow.css';
import '../components/Chatbot/styles/InputBar.css';
import '../components/Chatbot/styles/MessageBubble.css';
import '../components/Chatbot/styles/ReplyThread.css';
import '../components/navbars/ChatbotTabs.css';

// UserSettings component styles
import '../styles/UserSettings/ProfileSecurity.css';
import '../styles/UserSettings/Customization.css';

// LLM component styles
import '../styles/LLM/PrimaryModel.css';

// Customer Onboarding component styles 
import '../styles/Onboarding/CompanyProfile.css';
import '../styles/Onboarding/UserManagement.css';
import '../styles/Onboarding/ToolsIntegration.css';
import '../styles/Onboarding/RolesPermissions.css';
import '../styles/Onboarding/SubscriptionPlan.css';
import '../styles/Onboarding/LicenseManagement.css';

// Page styles
import './dashboard/Dashboard.css';
import './chatbot/Chatbot.css';
import './customer-onboarding/CustomerOnboarding.css';
import './database/Database.css';
import './llm/LLM.css';
import './reports/Reports.css';
import './schema/Schema.css';
import './user-settings/UserSettings.css';

//Login
import '../components/Login/Login.css';


//schematabs
import '../components/navbars/SchemaTabs.css';

import '../components/Database/ElegantAlignView.css';

// Loading spinner styles
import '../styles/LoadingSpinner.css';

function MyApp({ Component, pageProps }: AppProps) {
  const loading = useOscarLoading();

  // Use getLayout if defined, otherwise wrap in Layout
  const getLayout = (Component as any).getLayout || ((page: React.ReactNode) => <Layout>{page}</Layout>);

  return (
    <>
      <title>SAP Echo</title>
      {loading && <div className="oscar-loading-overlay"><div className="oscar-spinner"></div><div className="oscar-loading-text">Loading...</div></div>}
      {getLayout(<Component {...pageProps} />)}
    </>
  );
}

export default MyApp;