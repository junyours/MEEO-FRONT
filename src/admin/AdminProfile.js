import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Modal,
  Row,
  Col,
  Typography,
  Divider,
  Space,
  Alert,
  Spin,
  Tabs,
  Badge,
  Avatar,
  Tag
} from 'antd';
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaKey,
  FaShieldAlt,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import api from '../Api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const AdminProfile = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [changeType, setChangeType] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    if (profileData) {
      form.setFieldsValue({
        current_username: profileData.username,
        username: '',
        current_email: profileData.email,
        email: ''
      });
    }
  }, [profileData, form]);

  const fetchProfileData = async () => {
    try {
      const response = await api.get('/admin/profile');
      
      const profileData = response.data.data || response.data;
      
      setProfileData(profileData);
      form.setFieldsValue({
        current_username: profileData.username,
        username: '',
        current_email: profileData.email,
        email: ''
      });
    } catch (error) {
      message.error('Failed to fetch profile data');
    }
  };

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;
    
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);
    
    // Auto-focus next input
    if (value && index < 5 && otpInputRefs[index + 1]?.current) {
      otpInputRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtpValues = [...otpValues];
      
      if (otpValues[index]) {
        // Clear current input
        newOtpValues[index] = '';
        setOtpValues(newOtpValues);
      } else if (index > 0 && otpInputRefs[index - 1]?.current) {
        // Move to previous input and clear it
        newOtpValues[index - 1] = '';
        setOtpValues(newOtpValues);
        otpInputRefs[index - 1].current.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0 && otpInputRefs[index - 1]?.current) {
      otpInputRefs[index - 1].current.focus();
    } else if (e.key === 'ArrowRight' && index < 5 && otpInputRefs[index + 1]?.current) {
      otpInputRefs[index + 1].current.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newOtpValues = pastedData.split('');
      setOtpValues(newOtpValues);
      otpInputRefs[5].current?.focus();
    }
  };

  const getOtpCode = () => otpValues.join('');

  const sendOTP = async (type = null, changes = null) => {
    try {
      setLoading(true);
      
      const otpType = type || changeType;
      const otpChanges = changes || pendingChanges;
      
      if (!otpType) {
        message.error('No change type specified');
        return;
      }
      
      const requestData = {
        type: otpType,
        ...otpChanges
      };
      
      const response = await api.post('/admin/send-otp', requestData);

      if (response.data.success) {
        setOtpModalVisible(true);
        startCountdown();
        message.success('OTP sent to your email for verification');
      } else {
        message.error(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    const otpCode = getOtpCode();
    if (otpCode.length !== 6) {
      message.error('Please enter all 6 digits');
      return;
    }

    try {
      setLoading(true);
      
      if (!changeType) {
        message.error('No change type specified');
        return;
      }
      
      const response = await api.post('/admin/verify-otp', {
        otp: otpCode,
        type: changeType,
        ...pendingChanges
      });

      if (response.data.success) {
        setOtpVerified(true);
        setOtpModalVisible(false);
        message.success('OTP verified! Updating your credentials...');
        
        await applyChanges();
      } else {
        message.error(response.data.message || 'Invalid OTP');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const applyChanges = async () => {
    try {
      setLoading(true);
      const response = await api.put('/admin/profile', pendingChanges);

      if (response.data.success) {
        message.success('Profile updated successfully!');
        fetchProfileData();
        resetForm();
      } else {
        message.error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setChangeType('');
    setPendingChanges({});
    setOtpVerified(false);
    setOtpValues(['', '', '', '', '', '']);
    form.resetFields(['current_password', 'new_password', 'confirm_password']);
  };

  const handleUsernameChange = async (values) => {
    if (!values.username || values.username === profileData.username) {
      return;
    }

    const changes = { username: values.username };
    
    // Send OTP with direct parameters
    await sendOTP('username', changes);
    
    // Set state after successful OTP request
    setChangeType('username');
    setPendingChanges(changes);
  };

  const handleEmailChange = async (values) => {
    if (!values.email || values.email === profileData.email) {
      return;
    }

    const changes = { email: values.email };
    
    // Send OTP with direct parameters
    await sendOTP('email', changes);
    
    // Set state after successful OTP request
    setChangeType('email');
    setPendingChanges(changes);
  };

  const handlePasswordChange = async (values) => {
    if (!values.current_password || !values.new_password || !values.confirm_password) {
      return;
    }

    if (values.new_password !== values.confirm_password) {
      message.error('New passwords do not match');
      return;
    }

    if (values.new_password.length < 10) {
      message.error('Password must be at least 10 characters long');
      return;
    }

    const requirements = getPasswordRequirements(values.new_password);
    const unmetRequirements = requirements.filter(req => !req.met);
    
    if (unmetRequirements.length > 0) {
      setShakeRequirements(true);
      setTimeout(() => setShakeRequirements(false), 500);
      message.error('Password does not meet all requirements');
      return;
    }

    const changes = {
      current_password: values.current_password,
      new_password: values.new_password
    };
    
    await sendOTP('password', changes);
    
    setChangeType('password');
    setPendingChanges(changes);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    
    if (password.length >= 10) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    
    return Math.min(strength, 100);
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState([]);
  const [shakeRequirements, setShakeRequirements] = useState(false);
  const otpInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    setPasswordRequirements(getPasswordRequirements(currentPassword));
  }, [currentPassword]);

  const getPasswordRequirements = (password) => {
    const requirements = [
      { text: 'At least one Uppercase letter', met: /[A-Z]/.test(password) },
      { text: 'At least one lowercase letter', met: /[a-z]/.test(password) },
      { text: 'At least one number', met: /[0-9]/.test(password) },
      { text: 'At least one Special Character', met: /[^A-Za-z0-9]/.test(password) },
      { text: 'Minimum of 10 characters', met: password.length >= 10 }
    ];
    return requirements;
  };

  const getRequirementsStatus = (password) => {
    const requirements = getPasswordRequirements(password);
    const metCount = requirements.filter(req => req.met).length;
    const totalCount = requirements.length;
    const percentage = (metCount / totalCount) * 100;
    
    let status = 'weak';
    let color = '#ff4d4f';
    
    if (percentage >= 80) {
      status = 'strong';
      color = '#52c41a';
    } else if (percentage >= 60) {
      status = 'good';
      color = '#1890ff';
    } else if (percentage >= 40) {
      status = 'fair';
      color = '#faad14';
    }
    
    return { status, color, metCount, totalCount, percentage };
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength < 30) return '#ff4d4f';
    if (strength < 60) return '#faad14';
    if (strength < 80) return '#1890ff';
    return '#52c41a';
  };

  const getPasswordStrengthText = (strength) => {
    if (strength < 30) return 'Weak';
    if (strength < 60) return 'Fair';
    if (strength < 80) return 'Good';
    return 'Strong';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Today';
    
    const date = new Date(dateString);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const month = months[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month},${day},${year}`;
  };

  return (
    <div className="admin-profile-container">
      {/* Header */}
      <header className="admin-profile-header">
        <div className="header-content">
          <div className="header-title-section">
            <div className="admin-avatar-icon">
              <FaUser />
            </div>
            <div className="title-text">
              <h1 className="page-title">Admin Profile</h1>
              <p className="page-subtitle">Manage your account credentials and security settings</p>
            </div>
          </div>
          <div className="status-badge">
            <Badge status="success" text="Active" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-profile-main">
        <div className="content-grid">
          {/* Profile Summary Card */}
          <aside className="profile-summary-card">
            <Card className="summary-card">
              <div className="profile-info">
                <Avatar className="profile-avatar" icon={<FaUser />} />
                <h2 className="profile-name">{profileData.username}</h2>
                <p className="profile-email">{profileData.email}</p>
                <Tag className="admin-tag" color="blue">Administrator</Tag>
              </div>
              
              <Divider className="divider" />
              
              <div className="account-details">
                <div className="detail-row">
                  <span className="detail-label">Account Status</span>
                  <Tag color="success">Active</Tag>
                </div>
                <div className="detail-row">
                  <span className="detail-label">2FA Status</span>
                  <Tag color="processing">Enabled</Tag>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Last Updated</span>
                  <span className="detail-value">{formatDate(profileData.updated_at)}</span>
                </div>
              </div>
            </Card>
          </aside>

          {/* Settings Tabs */}
          <section className="settings-section">
            <Card className="settings-card">
              <Tabs className="settings-tabs" defaultActiveKey="username" size="large">
                {/* Username Change Tab */}
                <TabPane
                  tab={
                    <span className="tab-label">
                      <FaUser />
                      Username
                    </span>
                  }
                  key="username"
                >
                  <Alert
                    className="info-alert"
                    message="Username Change"
                    description="Changing your username will require OTP verification. You'll receive a verification code at your registered email."
                    type="info"
                    showIcon
                  />

                  <Form
                    className="change-form"
                    form={form}
                    layout="vertical"
                    onFinish={handleUsernameChange}
                  >
                    <Form.Item
                      label="Current Username"
                      name="current_username"
                    >
                      <Input
                        className="disabled-input"
                        value={profileData.username}
                        disabled
                      />
                    </Form.Item>

                    <Form.Item
                      label="New Username"
                      name="username"
                      rules={[
                        { required: true, message: 'Please enter new username' },
                        { min: 3, message: 'Username must be at least 3 characters' },
                        { max: 20, message: 'Username must not exceed 20 characters' },
                        { pattern: /^[a-zA-Z0-9_]+$/, message: 'Username can only contain letters, numbers, and underscores' }
                      ]}
                    >
                      <Input
                        className="form-input"
                        prefix={<FaUser />}
                        placeholder="Enter new username"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        className="submit-button"
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        size="large"
                      >
                        Change Username
                      </Button>
                    </Form.Item>
                  </Form>
                </TabPane>

                {/* Email Change Tab */}
                <TabPane
                  tab={
                    <span className="tab-label">
                      <FaEnvelope />
                      Email
                    </span>
                  }
                  key="email"
                >
                  <Alert
                    className="info-alert"
                    message="Email Change"
                    description="Changing your email will require OTP verification. You'll receive a verification code at your current email address."
                    type="info"
                    showIcon
                  />

                  <Form
                    className="change-form"
                    form={form}
                    layout="vertical"
                    onFinish={handleEmailChange}
                  >
                    <Form.Item
                      label="Current Email"
                      name="current_email"
                    >
                      <Input
                        className="disabled-input"
                        value={profileData.email}
                        disabled
                      />
                    </Form.Item>

                    <Form.Item
                      label="New Email"
                      name="email"
                      rules={[
                        { required: true, message: 'Please enter new email' },
                        { type: 'email', message: 'Please enter a valid email address' }
                      ]}
                    >
                      <Input
                        className="form-input"
                        prefix={<FaEnvelope />}
                        placeholder="Enter new email address"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        className="submit-button"
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        size="large"
                      >
                        Change Email
                      </Button>
                    </Form.Item>
                  </Form>
                </TabPane>

                {/* Password Change Tab */}
                <TabPane
                  tab={
                    <span className="tab-label">
                      <FaLock />
                      Password
                    </span>
                  }
                  key="password"
                >
                  <Alert
                    className="info-alert"
                    message="Password Change"
                    description="For security reasons, you'll need to verify the change with OTP sent to your email."
                    type="info"
                    showIcon
                  />

                  <Form
                    className="change-form"
                    layout="vertical"
                    onFinish={handlePasswordChange}
                  >
                    <Form.Item
                      label="Current Password"
                      name="current_password"
                      rules={[{ required: true, message: 'Please enter current password' }]}
                    >
                      <Input.Password
                        className="form-input"
                        prefix={<FaLock />}
                        placeholder="Enter current password"
                        size="large"
                        iconRender={(visible) => (visible ? <FaEye /> : <FaEyeSlash />)}
                      />
                    </Form.Item>

                    <Form.Item
                      label="New Password"
                      name="new_password"
                      rules={[
                        { required: true, message: 'Please enter new password' },
                        { min: 10, message: 'Password must be at least 10 characters' }
                      ]}
                    >
                      <Input.Password
                        className="form-input"
                        prefix={<FaKey />}
                        placeholder="Enter new password"
                        size="large"
                        onChange={(e) => {
                          const password = e.target.value;
                          setCurrentPassword(password);
                          setPasswordRequirements(getPasswordRequirements(password));
                        }}
                        iconRender={(visible) => (visible ? <FaEye /> : <FaEyeSlash />)}
                      />
                    </Form.Item>

                    <div className={`password-requirements ${shakeRequirements ? 'shake' : ''}`}>
                      <div className="requirements-header">
                        <Text className="requirements-title">Password Must Contain:</Text>
                        <span className="requirements-count" style={{ color: getRequirementsStatus(currentPassword).color }}>
                          {getRequirementsStatus(currentPassword).metCount}/{getRequirementsStatus(currentPassword).totalCount}
                        </span>
                      </div>
                      <div className="requirements-list">
                        {passwordRequirements.map((req, index) => (
                          <div key={index} className={`requirement-item ${req.met ? 'met' : 'unmet'}`}>
                            <span className="requirement-icon">{req.met ? '✓' : '○'}</span>
                            <span className="requirement-text">{req.text}</span>
                          </div>
                        ))}
                      </div>
                      <div className="requirements-progress">
                        <div 
                          className="progress-bar"
                          style={{ 
                            width: `${getRequirementsStatus(currentPassword).percentage}%`,
                            backgroundColor: getRequirementsStatus(currentPassword).color
                          }}
                        />
                      </div>
                    </div>

                    <Form.Item
                      label="Confirm New Password"
                      name="confirm_password"
                      dependencies={['new_password']}
                      rules={[
                        { required: true, message: 'Please confirm new password' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('new_password') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Passwords do not match'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        className="form-input"
                        prefix={<FaKey />}
                        placeholder="Confirm new password"
                        size="large"
                        iconRender={(visible) => (visible ? <FaEye /> : <FaEyeSlash />)}
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        className="submit-button"
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        size="large"
                      >
                        Change Password
                      </Button>
                    </Form.Item>
                  </Form>
                </TabPane>
              </Tabs>
            </Card>
          </section>
        </div>
      </main>

      {/* OTP Verification Modal */}
      <Modal
        className="otp-modal"
        title={
          <div className="modal-title">
            <FaShieldAlt />
            <span>Verify OTP</span>
          </div>
        }
        visible={otpModalVisible}
        onCancel={() => {
          setOtpModalVisible(false);
          resetForm();
        }}
        footer={null}
        width={400}
        centered
      >
        <div className="modal-content">
          <Text className="modal-description">
            Enter the 6-digit code sent to your email
          </Text>
          
          <div className="otp-inputs">
            {otpValues.map((value, index) => (
              <Input
                key={index}
                ref={otpInputRefs[index]}
                className="otp-input"
                value={value}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                onPaste={handleOtpPaste}
                maxLength={1}
              />
            ))}
          </div>

          <div className="resend-section">
            {countdown > 0 ? (
              <Text className="countdown-text">
                Resend OTP in <span className="countdown-timer">{countdown}s</span>
              </Text>
            ) : (
              <Button className="resend-button" type="link" onClick={sendOTP} disabled={loading}>
                Resend OTP
              </Button>
            )}
          </div>

          <div className="modal-actions">
            <Button
              className="cancel-button"
              onClick={() => {
                setOtpModalVisible(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              className="verify-button"
              type="primary"
              onClick={verifyOTP}
              loading={loading}
            >
              Verify
            </Button>
          </div>
        </div>
      </Modal>

      <style >{`
        .admin-profile-container {
          padding: 24px;
          background: #fafbfc;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .admin-profile-header {
          margin-bottom: 32px;
        }

        .header-content {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e1e4e8;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-title-section {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .admin-avatar-icon {
          background: #f6f8fa;
          border-radius: 10px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0969da;
          font-size: 24px;
        }

        .title-text h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
          color: #24292f;
        }

        .title-text p {
          margin: 4px 0 0 0;
          color: #656d76;
          font-size: 16px;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 32px;
        }

        .profile-summary-card .summary-card {
          border-radius: 12px;
          border: 1px solid #e1e4e8;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          height: fit-content;
        }

        .profile-info {
          text-align: center;
          padding: 24px 24px 20px;
        }

        .profile-avatar {
          width: 80px;
          height: 80px;
          background: #0969da;
          margin-bottom: 16px;
          font-size: 32px;
        }

        .profile-name {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 600;
          color: #24292f;
        }

        .profile-email {
          margin: 0 0 16px 0;
          color: #656d76;
          font-size: 14px;
        }

        .admin-tag {
          margin-bottom: 16px;
        }

        .divider {
          margin: 0 24px 20px;
        }

        .account-details {
          padding: 0 24px 24px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .detail-row:last-child {
          margin-bottom: 0;
        }

        .detail-label {
          color: #656d76;
          font-size: 14px;
        }

        .detail-value {
          color: #24292f;
          font-size: 14px;
          font-weight: 500;
        }

        .settings-section .settings-card {
          border-radius: 12px;
          border: 1px solid #e1e4e8;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .settings-tabs .ant-tabs-tab {
          padding: 12px 24px;
          font-weight: 500;
        }

        .tab-label {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .info-alert {
          margin-bottom: 24px;
          border-radius: 8px;
        }

        .change-form {
          max-width: 480px;
        }

        .disabled-input {
          background: #f6f8fa !important;
          color: #24292f !important;
          border-color: #d0d7de !important;
        }

        .form-input {
          border-radius: 8px;
          border-color: #d0d7de;
          padding: 12px 16px;
        }

        .form-input:focus {
          border-color: #0969da;
          box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
        }

        .submit-button {
          width: 100%;
          height: 48px;
          border-radius: 8px;
          background: #ffffff;
          border: 2px solid #000000ff;
          color: #000000ff;
          font-weight: 500;
          font-size: 16px;
        }

        .submit-button:hover {
          background: #ffffff;
          color: #ffffff;
        }

        .otp-modal .ant-modal-content {
          border-radius: 12px;
        }

        .modal-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 18px;
          font-weight: 600;
          color: #24292f;
        }

        .modal-content {
          text-align: center;
          padding: 20px 0;
        }

        .modal-description {
          display: block;
          margin-bottom: 24px;
          color: #656d76;
          font-size: 16px;
        }

        .otp-inputs {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 24px;
        }

        .otp-input {
          width: 45px;
          height: 45px;
          text-align: center;
          font-size: 18px;
          font-weight: 600;
          border: 2px solid #d0d7de;
          border-radius: 8px;
        }

        .otp-input:focus {
          border-color: #0969da;
          box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
        }

        .resend-section {
          margin-bottom: 24px;
        }

        .countdown-text {
          color: #656d76;
        }

        .countdown-timer {
          color: #0969da;
          font-weight: 600;
        }

        .resend-button {
          color: #0969da;
          font-weight: 500;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .cancel-button {
          border-radius: 8px;
          padding: 0 24px;
          height: 40px;
        }

        .verify-button {
          background: #0969da;
          border: none;
          border-radius: 8px;
          padding: 0 24px;
          height: 40px;
          font-weight: 500;
        }

        .verify-button:hover {
          background: #0860ca;
        }

        .password-requirements {
          margin: 16px 0;
          padding: 16px;
          background: #f6f8fa;
          border-radius: 8px;
          border: 1px solid #d0d7de;
        }

        .requirements-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .requirements-title {
          font-weight: 600;
          color: #24292f;
        }

        .requirements-count {
          font-weight: 600;
          font-size: 14px;
          padding: 2px 8px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.05);
        }

        .requirements-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }

        .requirement-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .requirement-item.met {
          color: #52c41a;
        }

        .requirement-item.unmet {
          color: #ff4d4f;
        }

        .requirement-icon {
          font-weight: 600;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .requirement-item.met .requirement-icon {
          color: #52c41a;
        }

        .requirement-item.unmet .requirement-icon {
          color: #ff4d4f;
        }

        .requirement-text {
          font-size: 13px;
        }

        .requirements-progress {
          height: 4px;
          background: #e1e4e8;
          border-radius: 2px;
          overflow: hidden;
          margin-top: 8px;
        }

        .progress-bar {
          height: 100%;
          transition: all 0.3s ease;
          border-radius: 2px;
        }

        @keyframes shake {
          0% { transform: translateX(0); }
          10% { transform: translateX(-5px); }
          20% { transform: translateX(5px); }
          30% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          50% { transform: translateX(-5px); }
          60% { transform: translateX(5px); }
          70% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
          90% { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }

        .password-requirements.shake {
          animation: shake 0.5s;
        }

        @media (max-width: 768px) {
          .content-grid {
            grid-template-columns: 1fr;
          }

          .header-content {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .header-title-section {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminProfile;
