import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProfileSecurity from '../../components/UserSettings/ProfileSecurity';
import Customization from '../../components/UserSettings/Customization';

// Subnav items for user settings


const UserSettings = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>('profile-security');

  // Get the section from URL if present
  useEffect(() => {
    const { tab } = router.query;
    if (tab === 'customisation') {
      setActiveSection('customisation');
    } else if (tab === 'profile-security') {
      setActiveSection('profile-security');
    }
  }, [router.query]);

  // This effect is specifically for handling navigation from the SubcontentBar
  // The Layout component sends a handleSubNavSelect callback to the SubcontentBar
  useEffect(() => {
    // Listen for changes to the URL from the Layout component
    const handleRouteChange = (url: string) => {
      if (url.includes('user-settings')) {
        // Extract the tab parameter if present
        const tabMatch = url.match(/[?&]tab=([^&]*)/);
        const tab = tabMatch ? tabMatch[1] : null;
        
        if (tab === 'customisation') {
          setActiveSection('customisation');
        } else if (tab === 'profile-security') {
          setActiveSection('profile-security');
        }
      }
    };

    // Add event listeners
    router.events.on('routeChangeComplete', handleRouteChange);
    
    // Clean up
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  return (
    <div className="user-settings-content">
      {activeSection === 'profile-security' && <ProfileSecurity />}
      {activeSection === 'customisation' && <Customization />}
    </div>
  );
};

export default UserSettings;