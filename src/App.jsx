import React, { useState } from 'react';
import Login from './Login';
import Onboarding from './Onboarding';
import Roadmap from './Roadmap';
import Dashboard from './Dashboard';
import OfficerDashboard from './OfficerDashboard';
import Chatbot from './Chatbot';

export default function App() {
  const [, setRefreshKey] = useState(0);

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userRole = localStorage.getItem('userRole');
  const isOnboarded = localStorage.getItem('isOnboarded') === 'true';
  const roadmapSeen = localStorage.getItem('roadmapSeen') === 'true';

  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  if (!isLoggedIn) {
    return <Login />;
  }

  if (userRole === 'entrepreneur' && !isOnboarded) {
    return <Onboarding onComplete={triggerRefresh} />;
  }

  if (userRole === 'entrepreneur' && !roadmapSeen) {
    return (
      <Roadmap
        onContinue={() => {
          localStorage.setItem('roadmapSeen', 'true');
          triggerRefresh();
        }}
      />
    );
  }

  if (userRole === 'officer') {
    return (
      <>
        <OfficerDashboard />
        <Chatbot />
      </>
    );
  }

  return (
    <>
      <Dashboard />
      <Chatbot />
    </>
  );
}