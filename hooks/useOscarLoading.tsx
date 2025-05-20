import Router from 'next/router';
import React from 'react';

export function useOscarLoading() {
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleStop = () => setLoading(false);
    Router.events.on('routeChangeStart', handleStart);
    Router.events.on('routeChangeComplete', handleStop);
    Router.events.on('routeChangeError', handleStop);
    return () => {
      Router.events.off('routeChangeStart', handleStart);
      Router.events.off('routeChangeComplete', handleStop);
      Router.events.off('routeChangeError', handleStop);
    };
  }, []);
  return loading;
}
