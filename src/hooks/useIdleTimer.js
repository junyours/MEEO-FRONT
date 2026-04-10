import { useState, useEffect, useRef, useCallback } from 'react';

const useIdleTimer = (timeout, onIdle, onWarning, warningTime = 30) => {
  const [isIdle, setIsIdle] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  
  // Use ref to track showWarning state immediately
  const showWarningRef = useRef(false);
  
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const countdownRef = useRef(null);
  const events = useRef([
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ]);

  const resetTimer = useCallback(() => {
    // Don't set up timers if timeout is 0 (disabled)
    if (timeout === 0) {
      return;
    }
    
    clearTimeout(timeoutRef.current);
    clearTimeout(warningTimeoutRef.current);
    clearInterval(countdownRef.current);
    
    setIsIdle(false);
    showWarningRef.current = false;
    setShowWarning(false);
    // Don't reset timeRemaining to 0 here - let it be managed by the countdown

    // Set warning timeout (show modal after timeout - warningTime seconds)
    warningTimeoutRef.current = setTimeout(() => {
      showWarningRef.current = true;
      setShowWarning(true);
      setTimeRemaining(warningTime);
      
      if (onWarning) {
        onWarning();
      }

      // Start countdown from warningTime down to 0
      countdownRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            if (onIdle) {
              onIdle();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, (timeout - warningTime) * 1000);

    // Remove the main timeout since countdown handles the final logout
  }, [timeout, onIdle, onWarning, warningTime]);

  const stayLoggedIn = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    resetTimer();

    const handleActivity = () => {
      // Don't reset timer when countdown is active (modal is showing)
      if (!showWarningRef.current) {
        resetTimer();
      }
    };

    events.current.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Sync logout across tabs using localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'logout') {
        window.location.href = '/login';
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearTimeout(timeoutRef.current);
      clearTimeout(warningTimeoutRef.current);
      clearInterval(countdownRef.current);
      
      events.current.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [resetTimer]);

  return {
    isIdle,
    timeRemaining,
    showWarning,
    stayLoggedIn,
    resetTimer
  };
};

export default useIdleTimer;
