import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaEnvelope, 
  FaLock, 
  FaUser, 
  FaBuilding, 
  FaChartLine, 
  FaShieldAlt, 
  FaMobileAlt, 
  FaArrowLeft,
  FaExclamationTriangle,
  FaLock as FaLockIcon,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaTimes,
  FaKey,
  FaUserShield,
  FaSecurityIcon,
  FaAlertTriangle,
  FaQuestionCircle,
  FaEnvelopeOpenText,
  FaPaperPlane
} from 'react-icons/fa';
import { FaArrowsRotate } from "react-icons/fa6";
import { AiOutlineEye, AiOutlineEyeInvisible, AiOutlineUser, AiOutlineSafety } from 'react-icons/ai';
import { 
  Layout, 
  Typography, 
  Divider, 
  Space, 
  Card, 
  Button, 
  Form, 
  Input, 
  message,
  Steps,
  Row,
  Col,
  Alert,
  Progress,
  Spin,
  Modal,
  Input as AntInput
} from 'antd';
import api from '../Api';
import logo from '../assets/logo_meeo.png';
import bg from '../assets/bg.jpg';
import Footer from './Footer';

const { Text, Link, Title } = Typography;
const { Step } = Steps;

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '', captcha: '', otp: '' });
  const [fieldErrors, setFieldErrors] = useState({ username: '', password: '', captcha: '', otp: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaHash, setCaptchaHash] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtpValues, setResetOtpValues] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetMethod, setResetMethod] = useState('');
  const [resetCountdown, setResetCountdown] = useState(0);
  const [resetFieldErrors, setResetFieldErrors] = useState({});
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const canvasRef = useRef(null);
  const otpInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const resetOtpInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  const navigate = useNavigate();
  const location = useLocation();

  // Generate captcha code
  const generateCaptcha = async () => {
    try {
      const response = await api.get('/auth/captcha');
      if (response.data.image && response.data.hash) {
        // Backend returned JSON with image and hash
        displayCaptchaImage(response.data.image);
        setCaptchaHash(response.data.hash);
      } else if (response.data.startsWith('data:image')) {
        // Backend returned image data directly (backward compatibility)
        displayCaptchaImage(response.data);
        setCaptchaHash('');
      } else {
        // Backend returned text code (fallback)
        setCaptchaCode(response.data);
        drawCaptcha(response.data);
        setCaptchaHash('');
        console.log(response.data);
      }
    } catch (err) {
      console.error('Failed to generate captcha:', err);
      // Fallback to client-side generation
      generateClientCaptcha();
    }
  };

  // Fallback client-side captcha generation
  const generateClientCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    drawCaptcha(code);
  };

  // Draw captcha on canvas
  const drawCaptcha = (code) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    ctx.fillStyle = '#f0f2f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add noise lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
    
    // Draw text
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#2c3e50';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw each character with slight rotation
    for (let i = 0; i < code.length; i++) {
      ctx.save();
      ctx.translate(30 + i * 25, 30);
      ctx.rotate((Math.random() - 0.5) * 0.3);
      ctx.fillText(code[i], 0, 0);
      ctx.restore();
    }
  };

  // Display captcha image from backend
  const displayCaptchaImage = (imageData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    
    img.src = imageData;
  };

  // Start countdown for OTP resend
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

  // Lockout management functions
  const startLockoutCountdown = (seconds = 60) => {
    setLockoutCountdown(seconds);
    const timer = setInterval(() => {
      setLockoutCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsLocked(false);
          clearFailedAttempts();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const incrementFailedAttempts = () => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    localStorage.setItem('failedAttempts', newAttempts.toString());
    
    if (newAttempts >= 5) {
      // Lock the user for 60 seconds
      const lockoutTime = Date.now() + 60000; // 60 seconds from now
      localStorage.setItem('lockoutTime', lockoutTime.toString());
      setIsLocked(true);
      startLockoutCountdown(60);
      message.error('Too many failed attempts. Account locked for 60 seconds.');
    } else {
      const remaining = 5 - newAttempts;
      message.warning(`${remaining} attempt${remaining > 1 ? 's' : ''} remaining before lockout.`);
    }
  };

  const clearFailedAttempts = () => {
    setFailedAttempts(0);
    setIsLocked(false);
    setLockoutCountdown(0);
    localStorage.removeItem('failedAttempts');
    localStorage.removeItem('lockoutTime');
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
  };

  const clearCaptcha = () => {
    setCaptchaHash('');
    setForm(prev => ({ ...prev, captcha: '' }));
  };

  // OTP handling functions
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

  const clearOtp = () => {
    setOtpValues(['', '', '', '', '', '']);
    otpInputRefs[0].current?.focus();
  };

  const getOtpCode = () => otpValues.join('');

  const verifyOtp = async () => {
    const otpCode = getOtpCode();
    if (otpCode.length !== 6) {
      message.error('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', {
        username: form.username,
        otp: otpCode
      });

      if (response.data.success) {
        setOtpVerified(true);
        setShowOtpModal(false);
        message.success('OTP verified! Logging in...');
        
        // Complete login
        await completeLogin(response.data.token, response.data.user);
      } else {
        message.error(response.data.message || 'Invalid OTP');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'OTP verification failed');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step) => {
    const errors = {};
    
    if (step === 0) {
      if (!form.username.trim()) errors.username = 'Username is required';
      if (!form.password.trim()) errors.password = 'Password is required';
      if (!form.captcha.trim()) errors.captcha = 'Captcha is required';
      else if (form.captcha.length !== 6) errors.captcha = 'Captcha must be 6 characters';
      // Note: Captcha validation is done on backend
    } else if (step === 1) {
      if (!form.otp.trim()) errors.otp = 'OTP is required';
      else if (form.otp.length !== 6) errors.otp = 'OTP must be 6 digits';
    }
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return false;
    }
    
    return true;
  };

  const validateForm = () => {
    return validateStep(currentStep);
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    // Check if user is locked out
    if (isLocked) {
      message.error(`Account is locked. Please wait ${lockoutCountdown} seconds.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (currentStep === 0) {
        // Step 1: Validate credentials and captcha
        const response = await api.post('/auth/validate-credentials', {
          username: form.username,
          password: form.password,
          captcha: form.captcha,
          captcha_hash: captchaHash
        });

        if (response.data.success) {
          setTempUser(response.data.user);
          setShowOtpModal(true);
          message.success('Credentials verified! Sending OTP...');
          
          // Send OTP
          await sendOTP();
        } else {
          setError(response.data.message || 'Invalid credentials');
          setShake(true);
          setTimeout(() => setShake(false), 500);
          generateCaptcha(); // Refresh captcha on error
          incrementFailedAttempts(); // Increment failed attempts
          // Set captcha field error if it's a captcha validation error
          if (response.data.message && response.data.message.toLowerCase().includes('captcha')) {
            setFieldErrors({ ...fieldErrors, captcha: response.data.message });
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      if (currentStep === 0) {
        generateCaptcha(); // Refresh captcha on error
        incrementFailedAttempts(); // Increment failed attempts
        // Set captcha field error if it's a captcha validation error
        if (err.response?.data?.message && err.response.data.message.toLowerCase().includes('captcha')) {
          setFieldErrors({ ...fieldErrors, captcha: err.response.data.message });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async () => {
    try {
      const response = await api.post('/auth/send-otp', {
        username: form.username
      });

      if (response.data.success) {
        setOtpSent(true);
        startCountdown();
        
        // Show success message with email hint if available
        if (response.data.email_hint) {
          message.success(`OTP sent! ${response.data.email_hint}`);
        } else {
          message.success('OTP sent to your email!');
        }
      } else {
        throw new Error(response.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
      throw err;
    }
  };

  const resendOTP = async () => {
    if (countdown > 0) return;
    
    try {
      await sendOTP();
      message.success('OTP resent successfully!');
    } catch (err) {
      message.error('Failed to resend OTP');
    }
  };

  const completeLogin = async (token, userData) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', JSON.stringify(userData.role));
    localStorage.setItem('userId', userData.id);

    if (userData.role.includes('incharge_collector') && userData.collector_id) {
      localStorage.setItem('collectorId', userData.collector_id);
    }

    // Clear failed attempts on successful login
    clearFailedAttempts();

    const rolePaths = {
      admin: '/admin/dashboard',
      vendor: '/vendor/dashboard',
      incharge_collector: '/incharge_collector/dashboard',
      main_collector: '/main_collector/dashboard',
      collector_staff: '/collector_staff/dashboard',
    };

    navigate(rolePaths[userData.role] || '/');
  };

  // Forgot Password Functions
  const handleResetOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    
    const newOtpValues = [...resetOtpValues];
    newOtpValues[index] = value;
    setResetOtpValues(newOtpValues);
    
    if (value && index < 5 && resetOtpInputRefs[index + 1]?.current) {
      resetOtpInputRefs[index + 1].current.focus();
    }
  };

  const handleResetOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtpValues = [...resetOtpValues];
      
      if (resetOtpValues[index]) {
        newOtpValues[index] = '';
        setResetOtpValues(newOtpValues);
      } else if (index > 0 && resetOtpInputRefs[index - 1]?.current) {
        newOtpValues[index - 1] = '';
        setResetOtpValues(newOtpValues);
        resetOtpInputRefs[index - 1].current.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0 && resetOtpInputRefs[index - 1]?.current) {
      resetOtpInputRefs[index - 1].current.focus();
    } else if (e.key === 'ArrowRight' && index < 5 && resetOtpInputRefs[index + 1]?.current) {
      resetOtpInputRefs[index + 1].current.focus();
    }
  };

  const handleResetOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newOtpValues = pastedData.split('');
      setResetOtpValues(newOtpValues);
      resetOtpInputRefs[5].current?.focus();
    }
  };

  const clearResetOtp = () => {
    setResetOtpValues(['', '', '', '', '', '']);
    resetOtpInputRefs[0].current?.focus();
  };

  const getResetOtpCode = () => resetOtpValues.join('');

  const startResetCountdown = () => {
    setResetCountdown(60);
    const timer = setInterval(() => {
      setResetCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const validateForgotPasswordStep = (step) => {
    const errors = {};
    
    if (step === 0) {
      if (!resetEmail.trim()) errors.email = 'Email or username is required';
    } else if (step === 2) {
      if (!newPassword.trim()) errors.newPassword = 'New password is required';
      if (newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters';
      if (!confirmPassword.trim()) errors.confirmPassword = 'Please confirm your password';
      if (newPassword !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    }
    
    setResetFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const sendResetEmail = async () => {
    if (!validateForgotPasswordStep(0)) return;
    
    setIsSendingEmail(true);
    try {
      // First check if username/email exists
      const checkResponse = await api.post('/auth/check-username', {
        username: resetEmail
      });

      if (!checkResponse.data.exists) {
        setResetFieldErrors({ email: 'Username or email does not exist' });
        return;
      }

      // If username/email exists, proceed with sending reset email
      const response = await api.post('/auth/forgot-password', {
        email: resetEmail
      });

      if (response.data.success) {
        setForgotPasswordStep(1);
        message.success('Password reset link sent to your email!');
      } else {
        message.error(response.data.message || 'Failed to send reset email');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const sendResetOtp = async () => {
    if (!validateForgotPasswordStep(0)) return;
    
    setIsSendingOtp(true);
    try {
      // First check if username/email exists
      const checkResponse = await api.post('/auth/check-username', {
        username: resetEmail
      });

      if (!checkResponse.data.exists) {
        setResetFieldErrors({ email: 'Username or email does not exist' });
        return;
      }

      // If username/email exists, proceed with sending OTP
      const response = await api.post('/auth/send-reset-otp', {
        email: resetEmail
      });

      if (response.data.success) {
        setForgotPasswordStep(2);
        startResetCountdown();
        message.success('OTP sent to your email!');
      } else {
        message.error(response.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyResetOtp = async () => {
    const otpCode = getResetOtpCode();
    if (otpCode.length !== 6) {
      message.error('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-reset-otp', {
        email: resetEmail,
        otp: otpCode
      });

      if (response.data.success) {
        setForgotPasswordStep(3);
        message.success('OTP verified! Please set your new password.');
      } else {
        message.error(response.data.message || 'Invalid OTP');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resendResetOtp = async () => {
    if (resetCountdown > 0) return;
    
    try {
      const response = await api.post('/auth/send-reset-otp', {
        email: resetEmail
      });

      if (response.data.success) {
        startResetCountdown();
        message.success('OTP resent successfully!');
      } else {
        message.error('Failed to resend OTP');
      }
    } catch (err) {
      message.error('Failed to resend OTP');
    }
  };

  const resetPassword = async () => {
    if (!validateForgotPasswordStep(3)) return;
    
    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        email: resetEmail,
        password: newPassword,
        password_confirmation: confirmPassword
      });

      if (response.data.success) {
        message.success('Password reset successfully!');
        closeForgotPassword();
      } else {
        message.error(response.data.message || 'Failed to reset password');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep(0);
    setResetEmail('');
    setResetOtpValues(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setResetMethod('');
    setResetCountdown(0);
    setResetFieldErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleNext();
  };

  useEffect(() => {
    setLoaded(true);
    generateCaptcha(); // Generate captcha on component mount
    
    // Load failed attempts from localStorage
    const storedAttempts = localStorage.getItem('failedAttempts');
    const storedLockoutTime = localStorage.getItem('lockoutTime');
    
    if (storedAttempts) {
      setFailedAttempts(parseInt(storedAttempts));
    }
    
    if (storedLockoutTime) {
      const lockoutTime = parseInt(storedLockoutTime);
      const currentTime = Date.now();
      const remainingTime = Math.max(0, Math.ceil((lockoutTime - currentTime) / 1000));
      
      if (remainingTime > 0) {
        setIsLocked(true);
        setLockoutCountdown(remainingTime);
        startLockoutCountdown(remainingTime);
      } else {
        // Lockout period has expired
        clearFailedAttempts();
      }
    }
    
    const role = JSON.parse(localStorage.getItem('userRole'));
    const token = localStorage.getItem('authToken');
    if (!role || !token) return;

    const rolePaths = {
      admin: '/admin/dashboard',
      vendor: '/vendor/dashboard',
      incharge_collector: '/incharge_collector/dashboard',
      main_collector: '/main_collector/dashboard',
      collector_staff: '/collector_staff/dashboard',
    };

    if (['/', '/login'].includes(location.pathname)) {
      setTimeout(() => {
        navigate(rolePaths[role] || '/', { replace: true });
      }, 100);
    }
  }, [location.pathname, navigate]);

  // Enhanced styles with hierarchical design
  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Inter, Segoe UI, sans-serif',
    position: 'relative',
    overflow: 'hidden',
    padding: '20px',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)'
  };

  const bgStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `url(${bg}) center center / cover no-repeat`,
    filter: 'blur(12px) brightness(0.2) contrast(1.2) saturate(1.1)',
    zIndex: -2,
    transform: 'scale(1.1)'
  };

  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.88) 25%, rgba(51, 65, 85, 0.84) 50%, rgba(71, 85, 105, 0.80) 75%, rgba(100, 116, 139, 0.76) 100%)',
    zIndex: -1,
  };

  const animatedBgStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.15) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
    zIndex: -1,
    animation: 'float 6s ease-in-out infinite'
  };

  const cardWrapperStyle = {
    width: '100%',
    maxWidth: '1200px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '24px',
    display: 'flex',
    overflow: 'hidden',
    boxShadow: '0 60px 120px rgba(0, 0, 0, 0.5), 0 30px 60px rgba(0, 0, 0, 0.3), 0 15px 30px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    animation: shake ? 'shake 0.5s' : '',
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
    position: 'relative'
  };

  const formContainerStyle = {
    flex: 1.2,
    padding: '70px 60px',
    color: '#1e293b',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
    borderRadius: '24px 0 0 24px',
    position: 'relative',
    overflow: 'hidden'
  };

  const formContainerPattern = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(102, 126, 234, 0.03) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(118, 75, 162, 0.03) 0%, transparent 50%)',
    pointerEvents: 'none'
  };

  const logoContainerStyle = {
    flex: 0.8,
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #334155 60%, #475569 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 80px',
    position: 'relative',
    overflow: 'hidden'
  };

  const logoContainerPattern = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(102, 126, 234, 0.08) 0%, transparent 70%), radial-gradient(circle at 20% 80%, rgba(118, 75, 162, 0.06) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.04) 0%, transparent 50%)',
    animation: 'pulse 4s ease-in-out infinite'
  };

  const logoStyle = {
    maxWidth: '480px',
    maxHeight: '480px',
    objectFit: 'contain',
    filter: 'drop-shadow(0 20px 40px rgba(255, 255, 255, 0.15))',
    animation: 'float 1.5s ease-in-out infinite',
    position: 'relative',
    zIndex: 1
  };

  const titleStyle = {
    fontSize: '36px',
    marginBottom: '16px',
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: '-1px',
    lineHeight: '1.1',
    background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  };

  const subtitleStyle = {
    fontSize: '18px',
    marginBottom: '40px',
    color: '#64748b',
    lineHeight: '1.6',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: '0.2px'
  };

  const inputContainerStyle = {
    position: 'relative',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: '20px',
    padding: '6px',
    border: '2px solid #e2e8f0',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden'
  };

  const inputContainerFocus = {
    borderColor: '#667eea',
    boxShadow: '0 0 0 6px rgba(102, 126, 234, 0.15), 0 10px 25px rgba(102, 126, 234, 0.2)',
    backgroundColor: '#ffffff',
    transform: 'translateY(-2px) scale(1.02)'
  };

  const iconStyle = {
    color: '#667eea',
    fontSize: '20px',
    marginRight: '16px',
    minWidth: '28px',
    transition: 'all 0.3s ease'
  };

  const inputStyle = {
    flex: 1,
    padding: '18px 16px',
    fontSize: '16px',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#1e293b',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    fontFamily: 'Inter, sans-serif',
    letterSpacing: '0.3px'
  };

  const otpInputStyle = {
    width: '56px',
    height: '56px',
    textAlign: 'center',
    fontSize: '22px',
    fontWeight: '700',
    border: '2px solid #e9ecef',
    borderRadius: '16px',
    margin: '0 6px',
    background: '#f8f9fa',
    color: '#2c3e50',
    transition: 'all 0.3s ease',
    outline: 'none',
    fontFamily: 'Inter, sans-serif'
  };

  const otpInputFocusStyle = {
    borderColor: '#667eea',
    boxShadow: '0 0 0 6px rgba(102, 126, 234, 0.2), 0 8px 25px rgba(102, 126, 234, 0.3)',
    background: '#ffffff',
    transform: 'scale(1.05)'
  };

  const togglePasswordStyle = {
    fontSize: '22px',
    color: '#667eea',
    cursor: 'pointer',
    marginRight: '16px',
    transition: 'all 0.3s ease',
    padding: '8px',
    borderRadius: '12px'
  };

  const buttonStyle = {
    padding: '20px 32px',
    width: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontSize: '18px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    marginTop: '32px',
    boxShadow: '0 15px 35px rgba(102, 126, 234, 0.4), 0 8px 20px rgba(102, 126, 234, 0.3)',
    letterSpacing: '0.5px',
    fontFamily: 'Inter, sans-serif',
    position: 'relative',
    overflow: 'hidden',
    textTransform: 'none'
  };

  const buttonHoverStyle = {
    transform: 'translateY(-3px) scale(1.02)',
    boxShadow: '0 20px 45px rgba(102, 126, 234, 0.5), 0 12px 30px rgba(102, 126, 234, 0.4)',
    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
  };

  const fieldErrorStyle = {
    color: '#ef4444',
    fontSize: '14px',
    marginBottom: '16px',
    marginTop: '6px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'rgba(239, 68, 68, 0.08)',
    borderRadius: '12px',
    border: '1px solid rgba(239, 68, 68, 0.15)'
  };

  const errorStyle = {
    color: '#ef4444',
    fontSize: '15px',
    marginTop: '24px',
    textAlign: 'center',
    padding: '16px 20px',
    background: 'rgba(239, 68, 68, 0.08)',
    borderRadius: '16px',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    fontWeight: '500'
  };

  const lockoutStyle = {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#fff',
    padding: '32px',
    borderRadius: '20px',
    marginTop: '24px',
    textAlign: 'center',
    boxShadow: '0 15px 35px rgba(239, 68, 68, 0.4), 0 8px 20px rgba(239, 68, 68, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(20px)',
    position: 'relative',
    overflow: 'hidden'
  };

  const securityIndicatorStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '24px',
    padding: '16px 24px',
    background: failedAttempts > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(102, 126, 234, 0.08)',
    borderRadius: '16px',
    border: `2px solid ${failedAttempts > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(102, 126, 234, 0.15)'}`,
    transition: 'all 0.3s ease'
  };

  const featuresStyle = {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '50px',
    flexWrap: 'wrap',
    gap: '30px'
  };

  const featureStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    flex: 1,
    minWidth: '120px'
  };

  const featureIconStyle = {
    fontSize: '40px',
    color: '#667eea',
    marginBottom: '16px',
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.2)'
  };

  const featureTextStyle = {
    fontSize: '16px',
    color: '#5a6c7d',
    fontWeight: '500',
    letterSpacing: '0.2px'
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <div style={containerStyle}>
        <div style={bgStyle}></div>
        <div style={overlayStyle}></div>
        <div style={animatedBgStyle}></div>

        <div style={cardWrapperStyle}>
          <div style={formContainerStyle}>
            <div style={formContainerPattern}></div>
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
              <div style={{ marginBottom: '30px' }}>
                <img 
                  src={logo} 
                  alt="MEEO Logo" 
                  style={{ 
                    width: '100px', 
                    height: '100px',
                    marginBottom: '8px',
                    filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.15))'
                  }} 
                />
              </div>
              <h2 style={titleStyle}>Login</h2>
              <p style={subtitleStyle}>
                Municipal Economic Enterprise Office Management System
                <br />
                <span style={{ color: '#667eea', fontWeight: '600' }}>Multi-Factor Security Login</span>
              </p>
            </div>

            {/* Security Status Indicator */}
            <div style={securityIndicatorStyle} className="security-indicator">
              <FaShieldAlt style={{ 
                color: failedAttempts > 0 ? '#e74c3c' : '#667eea',
                fontSize: '16px'
              }} />
              <span style={{ 
                fontSize: '14px', 
                fontWeight: '500',
                color: failedAttempts > 0 ? '#e74c3c' : '#667eea'
              }}>
                {failedAttempts === 0 ? 'Security Status: Secure' : 
                 failedAttempts >= 5 ? 'Security Status: Locked' :
                 `Failed Attempts: ${failedAttempts}/5`}
              </span>
            </div>

            {/* Progress Steps */}
            <div style={{ marginBottom: '40px' }}>
              <Steps current={currentStep} size="small">
                <Step title="Credentials" icon={<FaUser />} />
                <Step title="Verification" icon={<FaShieldAlt />} />
              </Steps>
            </div>

            {/* Lockout Warning */}
            {isLocked && (
              <div style={lockoutStyle} className="lockout-warning">
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔒</div>
                <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '600' }}>
                  Account Temporarily Locked
                </h3>
                <p style={{ margin: '0', fontSize: '14px', opacity: 0.9 }}>
                  Too many failed login attempts. Please wait:
                </p>
                <div 
                  style={{ 
                    fontSize: '32px', 
                    fontWeight: '700', 
                    margin: '12px 0',
                    fontFamily: 'monospace'
                  }}
                  className="countdown-timer"
                >
                  {Math.floor(lockoutCountdown / 60).toString().padStart(2, '0')}:
                  {(lockoutCountdown % 60).toString().padStart(2, '0')}
                </div>
                <p style={{ margin: '0', fontSize: '12px', opacity: 0.8 }}>
                  You can try again after the countdown expires
                </p>
              </div>
            )}

            {/* Step 1: Credentials & Captcha */}
            <div>
              <form onSubmit={handleSubmit}>
                <div 
                  style={{ ...inputContainerStyle, ...(fieldErrors.username ? inputContainerFocus : {}) }}
                >
                  <FaEnvelope style={iconStyle} />
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.parentElement.style.borderColor = '#667eea';
                      e.target.parentElement.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.parentElement.style.borderColor = '#e9ecef';
                      e.target.parentElement.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {fieldErrors.username && <div style={fieldErrorStyle}>{fieldErrors.username}</div>}

                <div 
                  style={{ ...inputContainerStyle, ...(fieldErrors.password ? inputContainerFocus : {}) }}
                >
                  <FaLock style={iconStyle} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.parentElement.style.borderColor = '#667eea';
                      e.target.parentElement.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.parentElement.style.borderColor = '#e9ecef';
                      e.target.parentElement.style.boxShadow = 'none';
                    }}
                  />
                  <span 
                    onClick={() => setShowPassword(!showPassword)} 
                    style={togglePasswordStyle}
                  >
                    {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                  </span>
                </div>
                {fieldErrors.password && <div style={fieldErrorStyle}>{fieldErrors.password}</div>}

                {/* Captcha Section */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#5a6c7d', fontWeight: '500' }}>
                    Security Verification
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <canvas
                      ref={canvasRef}
                      width={180}
                      height={60}
                      style={{
                        border: '2px solid #e9ecef',
                        borderRadius: '8px',
                        background: '#f8f9fa'
                      }}
                    />
                    <Button
                      type="link"
                      onClick={generateCaptcha}
                      style={{ padding: '4px 8px', height: 'auto' }}
                      icon={<FaArrowsRotate />}
                    >
                      Refresh
                    </Button>
                  </div>
                  <div 
                    style={{ ...inputContainerStyle, ...(fieldErrors.captcha ? inputContainerFocus : {}) }}
                  >
                    <AiOutlineSafety style={iconStyle} />
                    <input
                      type="text"
                      name="captcha"
                      value={form.captcha}
                      onChange={handleChange}
                      placeholder="Enter captcha code"
                      style={inputStyle}
                      maxLength={6}
                    />
                  </div>
                  {fieldErrors.captcha && <div style={fieldErrorStyle}>{fieldErrors.captcha}</div>}
                </div>

                <button
                  type="submit"
                  style={{
                    ...buttonStyle,
                    opacity: isLocked ? 0.5 : 1,
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    background: isLocked ? 
                      'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)' : 
                      buttonStyle.background
                  }}
                  disabled={loading || isLocked}
                  onMouseOver={(e) => {
                    if (!isLocked) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 16px 40px rgba(102, 126, 234, 0.5)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isLocked) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.4)';
                    }
                  }}
                >
                  {loading ? <Spin size="small" /> : 
                   isLocked ? 'Account Locked' : 'Login'}
                </button>

                {/* Forgot Password Link */}
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#667eea',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: '4px 8px',
                      transition: 'all 0.3s ease',
                      fontFamily: 'Inter, sans-serif'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.color = '#5a67d8';
                      e.target.style.textDecoration = 'none';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.color = '#667eea';
                      e.target.style.textDecoration = 'underline';
                    }}
                  >
                    <FaQuestionCircle style={{ marginRight: '6px', fontSize: '12px' }} />
                    Forgot Password?
                  </button>
                </div>
              </form>
            </div>

            {error && <div style={errorStyle}>{error}</div>}
          </div>

          <div style={logoContainerStyle}>
            <div style={logoContainerPattern}></div>
            <img src={logo} alt="MEEO Logo" style={logoStyle} />
          </div>
        </div>

        {/* OTP Modal */}
        <Modal
          open={showOtpModal}
          onCancel={() => {
            setShowOtpModal(false);
            setOtpValues(['', '', '', '', '', '']);
          }}
          footer={null}
          width={420}
          centered
          styles={{
            body: { padding: '40px 35px', textAlign: 'center', background: '#fff' },
            header: { display: 'none' }
          }}
          closeIcon={null}
          maskClosable={false}
        >
          {/* OTP Icon */}
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.25)'
          }}>
            <FaMobileAlt style={{ fontSize: '32px', color: '#fff' }} />
          </div>

          {/* Title */}
          <h2 style={{ 
            margin: '0 0 6px', 
            fontSize: '22px', 
            fontWeight: '600', 
            color: '#1a1a1a',
            fontFamily: 'Inter, sans-serif'
          }}>
            Verify OTP
          </h2>

          {/* Description */}
          <p style={{ 
            margin: '0 0 32px', 
            fontSize: '14px', 
            color: '#6b7280',
            lineHeight: '1.5',
            fontFamily: 'Inter, sans-serif'
          }}>
            Enter the 6-digit code sent to your email address
          </p>
          
          {/* OTP Input Fields */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', gap: '10px' }}>
            {otpValues.map((value, index) => (
              <AntInput
                key={index}
                ref={otpInputRefs[index]}
                value={value}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                onPaste={index === 0 ? handleOtpPaste : undefined}
                maxLength={1}
                placeholder="-"
                style={{
                  width: '48px',
                  height: '48px',
                  textAlign: 'center',
                  fontSize: '20px',
                  fontWeight: '700',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  background: '#f9fafb',
                  color: '#1f2937',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '0.5px'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  e.target.style.background = '#ffffff';
                  e.target.style.transform = 'scale(1.02)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = '#f9fafb';
                  e.target.style.transform = 'scale(1)';
                }}
              />
            ))}
          </div>

          {/* Clear and Resend Section */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '28px',
            padding: '0 8px'
          }}>
            <Button
              type="text"
              onClick={clearOtp}
              style={{ 
                padding: '4px 8px', 
                height: 'auto', 
                fontSize: '13px',
                color: '#6b7280',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Clear All
            </Button>
            
            <span style={{ color: '#6b7280', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
              Didn't receive code?{' '}
            </span>
            <Button
              type="link"
              onClick={resendOTP}
              disabled={countdown > 0}
              style={{ 
                padding: '4px 8px', 
                height: 'auto', 
                fontSize: '13px',
                color: '#667eea',
                fontWeight: '500',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
            </Button>
          </div>

          {/* Verify OTP Button */}
          <button
            onClick={verifyOtp}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.3px'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            }}
          >
            {loading ? <Spin size="small" /> : 'Verify OTP'}
          </button>
        </Modal>

        {/* Forgot Password Modal */}
        <Modal
          open={showForgotPassword}
          onCancel={closeForgotPassword}
          footer={null}
          width={forgotPasswordStep === 1 ? 400 : 480}
          centered
          styles={{
            body: { padding: '40px 35px', textAlign: 'center', background: '#fff' },
            header: { display: 'none' }
          }}
          closeIcon={
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(102, 126, 234, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(102, 126, 234, 0.2)';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(102, 126, 234, 0.1)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            <FaTimes style={{ 
              color: '#667eea', 
              fontSize: '16px',
              fontWeight: 'bold'
            }} />
          </div>
          }
          maskClosable={false}
        >
          {/* Forgot Password Icon */}
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 6px 20px rgba(245, 158, 11, 0.25)'
          }}>
            <FaKey style={{ fontSize: '32px', color: '#fff' }} />
          </div>

          {/* Step 0: Enter Email/Username */}
          {forgotPasswordStep === 0 && (
            <>
              <h2 style={{ 
                margin: '0 0 6px', 
                fontSize: '22px', 
                fontWeight: '600', 
                color: '#1a1a1a',
                fontFamily: 'Inter, sans-serif'
              }}>
                Forgot Password
              </h2>
              <p style={{ 
                margin: '0 0 32px', 
                fontSize: '14px', 
                color: '#6b7280',
                lineHeight: '1.5',
                fontFamily: 'Inter, sans-serif'
              }}>
                Enter your email or username to reset your password
              </p>
              
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  ...inputContainerStyle,
                  ...(resetFieldErrors.email ? inputContainerFocus : {})
                }}>
                  <FaEnvelope style={iconStyle} />
                  <input
                    type="text"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email or username"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.parentElement.style.borderColor = '#667eea';
                      e.target.parentElement.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.parentElement.style.borderColor = '#e9ecef';
                      e.target.parentElement.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {resetFieldErrors.email && <div style={fieldErrorStyle}>{resetFieldErrors.email}</div>}
              </div>

              {/* Reset Method Selection */}
              <div style={{ marginBottom: '24px' }}>
                <p style={{ 
                  margin: '0 0 12px', 
                  fontSize: '14px', 
                  color: '#374151',
                  fontWeight: '500',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Choose reset method:
                </p>
                <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                  <button
                    onClick={sendResetEmail}
                    disabled={isSendingEmail}
                    style={{
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: '500',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: isSendingEmail ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontFamily: 'Inter, sans-serif',
                      opacity: isSendingEmail ? 0.7 : 1,
                      transform: isSendingEmail ? 'none' : 'translateY(0)'
                    }}
                    onMouseOver={(e) => {
                      if (!isSendingEmail) {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isSendingEmail) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {isSendingEmail ? <Spin size="small" /> : <FaEnvelopeOpenText />}
                    {isSendingEmail ? 'Sending...' : 'Send Reset Link via Email'}
                  </button>
                  
                  <button
                    onClick={sendResetOtp}
                    disabled={isSendingOtp}
                    style={{
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: '500',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: isSendingOtp ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontFamily: 'Inter, sans-serif',
                      opacity: isSendingOtp ? 0.7 : 1,
                      transform: isSendingOtp ? 'none' : 'translateY(0)'
                    }}
                    onMouseOver={(e) => {
                      if (!isSendingOtp) {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isSendingOtp) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {isSendingOtp ? <Spin size="small" /> : <FaMobileAlt />}
                    {isSendingOtp ? 'Sending...' : 'Send OTP Code'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step 1: Email Sent Confirmation */}
          {forgotPasswordStep === 1 && (
            <>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.25)'
              }}>
                <FaPaperPlane style={{ fontSize: '36px', color: '#fff' }} />
              </div>
              
              <h2 style={{ 
                margin: '0 0 12px', 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#1a1a1a',
                fontFamily: 'Inter, sans-serif'
              }}>
                Reset Link Sent!
              </h2>
              <p style={{ 
                margin: '0 0 24px', 
                fontSize: '14px', 
                color: '#6b7280',
                lineHeight: '1.5',
                fontFamily: 'Inter, sans-serif'
              }}>
                We've sent a password reset link to your email address.
                Please check your inbox and follow the instructions.
              </p>
              
              <button
                onClick={closeForgotPassword}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Got it, thanks!
              </button>
            </>
          )}

          {/* Step 2: Enter OTP */}
          {forgotPasswordStep === 2 && (
            <>
              <h2 style={{ 
                margin: '0 0 6px', 
                fontSize: '22px', 
                fontWeight: '600', 
                color: '#1a1a1a',
                fontFamily: 'Inter, sans-serif'
              }}>
                Enter OTP Code
              </h2>
              <p style={{ 
                margin: '0 0 32px', 
                fontSize: '14px', 
                color: '#6b7280',
                lineHeight: '1.5',
                fontFamily: 'Inter, sans-serif'
              }}>
                Enter the 6-digit code sent to your email address
              </p>
              
              {/* OTP Input Fields */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', gap: '10px' }}>
                {resetOtpValues.map((value, index) => (
                  <AntInput
                    key={index}
                    ref={resetOtpInputRefs[index]}
                    value={value}
                    onChange={(e) => handleResetOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleResetOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleResetOtpPaste : undefined}
                    maxLength={1}
                    placeholder="-"
                    style={{
                      width: '48px',
                      height: '48px',
                      textAlign: 'center',
                      fontSize: '20px',
                      fontWeight: '700',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      background: '#f9fafb',
                      color: '#1f2937',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      fontFamily: 'Inter, sans-serif',
                      letterSpacing: '0.5px'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                      e.target.style.background = '#ffffff';
                      e.target.style.transform = 'scale(1.02)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = '#f9fafb';
                      e.target.style.transform = 'scale(1)';
                    }}
                  />
                ))}
              </div>

              {/* Clear and Resend Section */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '28px',
                padding: '0 8px'
              }}>
                <Button
                  type="text"
                  onClick={clearResetOtp}
                  style={{ 
                    padding: '4px 8px', 
                    height: 'auto', 
                    fontSize: '13px',
                    color: '#6b7280',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  Clear All
                </Button>
                
                <span style={{ color: '#6b7280', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
                  Didn't receive code?{' '}
                </span>
                <Button
                  type="link"
                  onClick={resendResetOtp}
                  disabled={resetCountdown > 0}
                  style={{ 
                    padding: '4px 8px', 
                    height: 'auto', 
                    fontSize: '13px',
                    color: '#667eea',
                    fontWeight: '500',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  {resetCountdown > 0 ? `Resend in ${resetCountdown}s` : 'Resend OTP'}
                </Button>
              </div>

              {/* Verify OTP Button */}
              <button
                onClick={verifyResetOtp}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '0.3px'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }}
              >
                {loading ? <Spin size="small" /> : 'Verify OTP'}
              </button>
            </>
          )}

          {/* Step 3: Set New Password */}
          {forgotPasswordStep === 3 && (
            <>
              <h2 style={{ 
                margin: '0 0 6px', 
                fontSize: '22px', 
                fontWeight: '600', 
                color: '#1a1a1a',
                fontFamily: 'Inter, sans-serif'
              }}>
                Set New Password
              </h2>
              <p style={{ 
                margin: '0 0 32px', 
                fontSize: '14px', 
                color: '#6b7280',
                lineHeight: '1.5',
                fontFamily: 'Inter, sans-serif'
              }}>
                Enter your new password below
              </p>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  ...inputContainerStyle,
                  ...(resetFieldErrors.newPassword ? inputContainerFocus : {})
                }}>
                  <FaLock style={iconStyle} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.parentElement.style.borderColor = '#667eea';
                      e.target.parentElement.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.parentElement.style.borderColor = '#e9ecef';
                      e.target.parentElement.style.boxShadow = 'none';
                    }}
                  />
                  <span 
                    onClick={() => setShowPassword(!showPassword)} 
                    style={togglePasswordStyle}
                  >
                    {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                  </span>
                </div>
                {resetFieldErrors.newPassword && <div style={fieldErrorStyle}>{resetFieldErrors.newPassword}</div>}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  ...inputContainerStyle,
                  ...(resetFieldErrors.confirmPassword ? inputContainerFocus : {})
                }}>
                  <FaLock style={iconStyle} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.parentElement.style.borderColor = '#667eea';
                      e.target.parentElement.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.parentElement.style.borderColor = '#e9ecef';
                      e.target.parentElement.style.boxShadow = 'none';
                    }}
                  />
                  <span 
                    onClick={() => setShowPassword(!showPassword)} 
                    style={togglePasswordStyle}
                  >
                    {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                  </span>
                </div>
                {resetFieldErrors.confirmPassword && <div style={fieldErrorStyle}>{resetFieldErrors.confirmPassword}</div>}
              </div>

              {/* Reset Password Button */}
              <button
                onClick={resetPassword}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '0.3px'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }}
              >
                {loading ? <Spin size="small" /> : 'Reset Password'}
              </button>
            </>
          )}
        </Modal>

        <style>
          {`
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
            
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.05); }
              100% { transform: scale(1); }
            }
            
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            @keyframes glow {
              0% { box-shadow: 0 0 5px rgba(102, 126, 234, 0.5); }
              50% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.8), 0 0 30px rgba(102, 126, 234, 0.6); }
              100% { box-shadow: 0 0 5px rgba(102, 126, 234, 0.5); }
            }
            
            @keyframes countdownPulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.1); opacity: 0.8; }
              100% { transform: scale(1); opacity: 1; }
            }
            
            @media (max-width: 768px) {
              div[style*='flex-direction: row'] {
                flex-direction: column !important;
              }
              
              .featuresStyle {
                flex-direction: column;
                gap: 16px;
              }
              
              .featureStyle {
                flexDirection: 'row';
                justifyContent: 'flex-start';
                textAlign: 'left';
                padding: '0 20px';
              }
              
              .featureIconStyle {
                marginRight: '16px';
                marginBottom: 0;
              }
              
              .featureTextStyle {
                textAlign: 'left';
              }
            }
            
            input:focus {
              outline: none !important;
            }
            
            button:disabled {
              opacity: 0.7;
              cursor: not-allowed;
              transform: none !important;
            }
            
            .security-indicator {
              animation: slideIn 0.5s ease-out;
            }
            
            .lockout-warning {
              animation: pulse 2s infinite;
            }
            
            .countdown-timer {
              animation: countdownPulse 1s infinite;
            }
            
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
            
            @keyframes pulse {
              0%, 100% { opacity: 0.8; }
              50% { opacity: 1; }
            }
          `}
        </style>
      </div>
      
      <Footer />
    </Layout>
  );
};

export default Login;
