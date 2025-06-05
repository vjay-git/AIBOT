import React from 'react';
import Login from '../../components/Login/Login';

// This page doesn't use the main layout since it's a standalone login page
const LoginPage = () => {
  return <Login />;
};

// Export the page without layout
LoginPage.getLayout = (page: React.ReactElement) => page;

export default LoginPage;