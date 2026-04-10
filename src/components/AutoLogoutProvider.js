import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useIdleTimer from '../hooks/useIdleTimer';
import SessionTimeoutModal from './SessionTimeoutModal';
import api from '../Api';

const AutoLogoutContext = createContext();

export const useAutoLogout = () => {
  const context = useContext(AutoLogoutContext);
  if (!context) {
    throw new Error('useAutoLogout must be used within an AutoLogoutProvider');
  }
  return context;
};

const AutoLogoutProvider = ({ 
  children, 
  timeout = 16200, // 4 hours 30 minutes (270 * 60 seconds)
  warningTime = 600 // 10 minutes warning
}) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem('authToken');

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint to revoke token
      await api.post('/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always perform frontend cleanup regardless of API call success
      performLogout();
    }
  };

  const performLogout = () => {
    // Remove auth token from localStorage
    localStorage.removeItem('authToken');
    
    // Set logout flag for cross-tab synchronization
    localStorage.setItem('logout', Date.now().toString());
    
    // Redirect to login page
    navigate('/login');
  };

  const handleIdle = () => {
    setIsModalOpen(false);
    handleLogout();
  };

  const handleWarning = () => {
    setIsModalOpen(true);
  };

  const handleStayLoggedIn = () => {
    setIsModalOpen(false);
  };

  const handleLogoutNow = () => {
    setIsModalOpen(false);
    handleLogout();
  };

  // Initialize idle timer only if user is logged in
  const { timeRemaining, stayLoggedIn } = useIdleTimer(
    isLoggedIn ? timeout : 0, // Disable timer if not logged in
    isLoggedIn ? handleIdle : () => {}, // No-op if not logged in
    isLoggedIn ? handleWarning : () => {}, // No-op if not logged in
    isLoggedIn ? warningTime : 0
  );

  // Check for logout events from other tabs
  React.useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'logout') {
        performLogout();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const value = {
    logout: handleLogout,
    stayLoggedIn,
    isAutoLogoutEnabled: isLoggedIn
  };

  return (
    <AutoLogoutContext.Provider value={value}>
      {children}
      <SessionTimeoutModal
        show={isModalOpen}
        timeRemaining={timeRemaining}
        onStayLoggedIn={handleStayLoggedIn}
        onLogout={handleLogoutNow}
      />
    </AutoLogoutContext.Provider>
  );
};

export default AutoLogoutProvider;
