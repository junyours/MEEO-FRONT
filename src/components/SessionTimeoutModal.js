import React, { useEffect, useState } from 'react';
import { Modal, Typography, Button, Space, Statistic } from 'antd';
import { ExclamationCircleOutlined, LogoutOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const SessionTimeoutModal = ({ show, initialTime = 600, onStayLoggedIn, onLogout }) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);

  useEffect(() => {
    if (!show) return; // Don't start timer if modal is hidden
    setTimeRemaining(initialTime); // Reset timer when modal shows

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval); // Cleanup on unmount or modal close
  }, [show, initialTime]);

  // Handle logout when timeRemaining reaches 0
  useEffect(() => {
    if (timeRemaining === 0 && show) {
      onLogout();
    }
  }, [timeRemaining, show, onLogout]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      open={show}
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
          <span>Session Timeout Warning</span>
        </Space>
      }
      centered
      closable={false}
      maskClosable={false}
      footer={[
        <Button key="logout" icon={<LogoutOutlined />} onClick={onLogout}>
          Logout Now
        </Button>,
        <Button key="stay" type="primary" onClick={onStayLoggedIn}>
          Stay Logged In
        </Button>
      ]}
      width={400}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Title level={4}>Your session will expire in:</Title>
        
        <div style={{ 
          display: 'inline-block', 
          position: 'relative',
          marginBottom: '20px'
        }}>
          {/* Circular countdown background */}
         <div style={{ 
  width: '120px',
  height: '120px',
  borderRadius: '50%',
  background: `conic-gradient(
    #ff4d4f 0deg ${( (initialTime - timeRemaining) / initialTime) * 360}deg,
    #f0f0f0 ${( (initialTime - timeRemaining) / initialTime) * 360}deg 360deg
  )`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 12px rgba(255, 77, 79, 0.15)',
  border: '3px solid #fff',
}} >
            {/* Inner circle */}
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#ff4d4f',
                fontFamily: 'monospace',
                lineHeight: '1'
              }}>
                {formatTime(timeRemaining)}
              </div>
              <div style={{
                fontSize: '10px',
                color: '#666',
                marginTop: '2px'
              }}>
                remaining
              </div>
            </div>
          </div>
          
          {/* Animated ring effect */}
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: '2px solid #ff4d4f',
            opacity: '0.3',
            animation: 'pulse 2s infinite'
          }} />
        </div>
        
        <Text type="secondary" style={{ display: 'block', marginTop: '16px' }}>
          You will be automatically logged out due to inactivity.
        </Text>
        
        {/* Add keyframes for pulse animation */}
        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.05); opacity: 0.1; }
            100% { transform: scale(1); opacity: 0.3; }
          }
        `}</style>
      </div>
    </Modal>
  );
};

export default SessionTimeoutModal;