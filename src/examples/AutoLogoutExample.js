import React from 'react';
import { useAutoLogout } from '../components/AutoLogoutProvider';

const AutoLogoutExample = () => {
  const { logout, stayLoggedIn, isAutoLogoutEnabled } = useAutoLogout();

  const handleManualLogout = () => {
    logout();
  };

  const handleResetTimer = () => {
    stayLoggedIn();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Auto Logout System Demo</h2>
      
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#e8f5e8', 
        borderRadius: '5px', 
        marginBottom: '20px' 
      }}>
        <h3>Configuration:</h3>
        <ul>
          <li><strong>Auto Logout:</strong> 90 seconds (1 minute 30 seconds)</li>
          <li><strong>Warning:</strong> Shows at 60 seconds (30 seconds remaining)</li>
          <li><strong>Countdown:</strong> Live timer from 30 → 0 seconds</li>
        </ul>
      </div>

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#fff3cd', 
        borderRadius: '5px', 
        marginBottom: '20px' 
      }}>
        <h3>How to Test:</h3>
        <ol>
          <li>Stay inactive (no mouse, keyboard, scroll, or touch)</li>
          <li>After 60 seconds, warning modal appears with countdown</li>
          <li>Click "Stay Logged In" to reset timer</li>
          <li>Or wait for countdown to reach 0 for auto logout</li>
        </ol>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Manual Controls:</h3>
        <button 
          onClick={handleResetTimer}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          Reset Timer
        </button>
        
        <button 
          onClick={handleManualLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout Now
        </button>
      </div>

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#d1ecf1', 
        borderRadius: '5px' 
      }}>
        <h3>Features:</h3>
        <ul>
          <li>✅ Detects mouse, keyboard, scroll, and touch events</li>
          <li>✅ Cross-tab synchronization (logout in all tabs)</li>
          <li>✅ Prevents infinite redirect loops</li>
          <li>✅ 401 response interceptor in API calls</li>
          <li>✅ Token revocation on backend logout</li>
          <li>✅ Live countdown timer in warning modal</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>Status:</strong> {isAutoLogoutEnabled ? '✅ Auto Logout Enabled' : '❌ Auto Logout Disabled'}</p>
        <p><strong>Tip:</strong> Open this page in multiple tabs to test cross-tab synchronization!</p>
      </div>
    </div>
  );
};

export default AutoLogoutExample;
