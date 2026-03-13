import React, { useState, useEffect, useMemo } from 'react';

import dayjs from 'dayjs';
import {
  Table,
  Card,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  Radio,
  Input,
  Checkbox,
  Space,
  Tag,
  Typography,
  Divider,
  DatePicker,
  Alert,
  Row,
  Col,


  message,
  Tooltip,
  Badge,

  
} from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ShopOutlined,
  CalendarOutlined,
  CalendarTwoTone,
  DownloadOutlined,
  PrinterOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  BankOutlined,
  ReloadOutlined,
  SearchOutlined,
  MoneyCollectOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import api from '../Api';
import LoadingOverlay from './Loading';
import './VendorPaymentManagement.css';

const { Title, Text } = Typography;
const { Option } = Select;

const VendorPaymentManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentHistoryModal, setPaymentHistoryModal] = useState(false);
  const [bulkPaymentModal, setBulkPaymentModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [selectedRentals, setSelectedRentals] = useState([]);
  const [rentalDetailsModal, setRentalDetailsModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [paymentForm] = Form.useForm();
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bulkPaymentAmount, setBulkPaymentAmount] = useState(null);
  const [bulkPaymentType, setBulkPaymentType] = useState('daily');
  const [useBulkPayment, setUseBulkPayment] = useState(false);
  const [paymentBreakdownTrigger, setPaymentBreakdownTrigger] = useState({});
  const [bulkPaymentMode, setBulkPaymentMode] = useState(false);
  const [bulkPaymentData, setBulkPaymentData] = useState({
    paymentType: 'daily',
    amount: 0,
    customAmount: false
  });
  const [orNumber, setOrNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(dayjs()); // Default to today
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  const [stallRenderKey, setStallRenderKey] = useState(0);
  const [monthlyBreakdownModal, setMonthlyBreakdownModal] = useState(false);
  const [selectedVendorForBreakdown, setSelectedVendorForBreakdown] = useState(null);
  const [monthSelectionModal, setMonthSelectionModal] = useState(false);
  const [selectedVendorForMonthPayment, setSelectedVendorForMonthPayment] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [customPaymentAmount, setCustomPaymentAmount] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/vendor-payments');
      setVendors(response.data.data);
    } catch (error) {
      message.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async (vendorId) => {
    try {
      const response = await api.get(`/vendor-payments/history/${vendorId}`);
      setPaymentHistory(response.data.payments);
      setSelectedVendor(response.data.vendor);
      setPaymentHistoryModal(true);
    } catch (error) {
      message.error('Failed to fetch payment history');
    }
  };

  const handleRentalDetails = (vendor) => {
    setSelectedVendor(vendor);
    setRentalDetailsModal(true);
  };

  const handlePaySelectedMonths = (vendor) => {
    setSelectedVendorForMonthPayment(vendor);
    setSelectedMonths([]);
    setMonthSelectionModal(true);
  };

  const handleMonthSelection = (monthIndex) => {
    const currentMonth = new Date().getMonth();
    
    // Prevent selection of future months
    if (monthIndex > currentMonth) {
      message.warning('Cannot select future months for payment');
      return;
    }
    
    setSelectedMonths(prev => {
      const isSelecting = !prev.includes(monthIndex);
      const newSelection = isSelecting 
        ? [...prev, monthIndex]
        : prev.filter(m => m !== monthIndex);
      
      // Auto-populate payment date to last day of last selected month
      if (newSelection.length > 0) {
        const currentYear = new Date().getFullYear();
        const lastSelectedMonth = Math.max(...newSelection);
        
        // Get the last day of the selected month
        const lastDayOfMonth = new Date(currentYear, lastSelectedMonth + 1, 0).getDate();
        const autoPaymentDate = dayjs(`${currentYear}-${lastSelectedMonth + 1}-${lastDayOfMonth}`);
        
        setPaymentDate(autoPaymentDate);
      }
      
      return newSelection;
    });
  };

  const handlePaySelectedMonthsBalance = async () => {
    if (selectedMonths.length === 0) {
      message.error('Please select at least one month to pay');
      return;
    }

    // Get rentals with balances in selected months
    const rentalsWithSelectedMonthBalance = selectedVendorForMonthPayment.rentals?.filter(rental => {
      const monthlyBalances = rental.monthly_balances || [];
      return selectedMonths.some(monthIndex => (monthlyBalances[monthIndex]?.balance || 0) > 0);
    }) || [];

    if (rentalsWithSelectedMonthBalance.length === 0) {
      message.error('No rentals found with balances in selected months');
      return;
    }

    // Calculate total balance for selected months
    const totalBalance = selectedMonths.reduce((sum, monthIndex) => {
      return sum + selectedVendorForMonthPayment.monthly_balances?.[monthIndex]?.balance || 0;
    }, 0);

    // Use custom amount if provided, otherwise use total balance
    const paymentAmount = customPaymentAmount ? parseFloat(customPaymentAmount) : totalBalance;

    if (paymentAmount <= 0) {
      message.error('Please enter a valid payment amount');
      return;
    }

    // Prepare payment data
    const paymentData = {
      selected_months: selectedMonths,
      rental_ids: rentalsWithSelectedMonthBalance.map(r => r.rental_id),
      or_number: orNumber.trim(),
      payment_date: paymentDate.format('YYYY-MM-DD'),
      custom_amount: paymentAmount, // Send custom amount to backend
    };

    setProcessingPayment(true);
    try {
      const response = await api.post(`/vendor-payments/selected-months/${selectedVendorForMonthPayment.id}`, paymentData);
      
      if (response.data.success) {
        message.success('Selected months payment processed successfully');
        setMonthSelectionModal(false);
        setOrNumber('');
        setPaymentDate(dayjs());
        setSelectedMonths([]);
        setCustomPaymentAmount(''); // Reset custom amount
        fetchVendors(); // Refresh data
      } else {
        message.error('Failed to process selected months payment');
      }
    } catch (error) {
      console.error('Selected months payment error:', error);
      message.error(error.response?.data?.message || 'Failed to process selected months payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleMonthlyBreakdown = (vendor) => {
    setSelectedVendorForBreakdown(vendor);
    setMonthlyBreakdownModal(true);
  };

  const handleBulkPayment = (vendor) => {
    setSelectedVendor(vendor);
    setSelectedRentals([]);
    setBulkPaymentModal(true);
    setBulkPaymentMode(false);
    setOrNumber(''); // Reset OR number
    setPaymentDate(dayjs()); // Reset payment date to today
    setBulkPaymentData({
      paymentType: 'daily',
      amount: 0,
      customAmount: false
    });
    paymentForm.resetFields();
  };

  const handleRentalSelection = (rentalId, checked) => {
    const rental = selectedVendor?.rentals?.find(r => r.rental_id === rentalId);

    if (checked && rental && isStallAlreadyPaidWithAdvance(rental)) {
      const today = new Date();
      const dueDate = new Date(rental.next_due_date);
      const dueDateStr = dueDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
      message.warning(`This stall has an active advance payment and cannot be paid until ${dueDateStr}. Next due date: ${dueDateStr}`);
      return;
    }

    setSelectedRentals(prev =>
      checked
        ? [...prev, rentalId]
        : prev.filter(id => id !== rentalId)
    );
  };

  const handleSelectAllRentals = (vendorRentals, checked) => {
    if (checked) {
      // Only select rentals that don't have active advance payments
      const eligibleRentals = vendorRentals.filter(rental => !isStallAlreadyPaidWithAdvance(rental));
      setSelectedRentals(eligibleRentals.map(r => r.rental_id));
    } else {
      setSelectedRentals([]);
      setBulkPaymentAmount(null);
      setBulkPaymentType('daily');
      setBulkPaymentMode(false);
      paymentForm.resetFields();
    }
  };

  const isStallAlreadyPaidWithAdvance = (rental) => {
    const paidToday = rental.paid_today || false;
    const remainingBalance = parseFloat(rental.remaining_balance) || 0;
    const hasAdvancePayment = rental.status === 'advance';
    const nextDueDate = rental.next_due_date;

    // Check if stall has active advance payment and next due date is in the future
    if (hasAdvancePayment && nextDueDate) {
      const today = new Date();
      const dueDate = new Date(nextDueDate);
      
      // If next due date is after today, advance is still active
      if (dueDate > today) {
        return true;
      }
    }

    return paidToday && remainingBalance === 0 && hasAdvancePayment;
  };

  const detectPaymentType = (amount, balance, dailyRent, paidToday = false) => {
    if (!amount || amount <= 0) return 'daily';

    if (amount === dailyRent) return 'daily';
    
    const fullyPaidAmount = balance + (paidToday ? 0 : dailyRent);
    const advanceAmount = balance + (paidToday ? 0 : dailyRent) + dailyRent;
    
    if (amount > advanceAmount) return 'advance';
    if (amount >= fullyPaidAmount) return 'fully paid';
    return 'partial';
  };

  const handleAmountChange = (rentalId, amount) => {
    const rental = selectedVendor?.rentals?.find(r => r.rental_id === rentalId);
    if (!rental) return;

    const paymentType = detectPaymentType(
      amount, 
      rental.remaining_balance || 0, 
      rental.daily_rent || 0,
      rental.paid_today || false
    );
    paymentForm.setFieldsValue({
      [`payment_type_${rentalId}`]: paymentType,
      [`amount_${rentalId}`]: amount
    });

    // Trigger payment breakdown re-render
    setPaymentBreakdownTrigger(prev => ({
      ...prev,
      [rentalId]: Date.now()
    }));
  };

  const handlePaymentTypeChange = (rentalId, paymentType) => {
    const rental = selectedVendor?.rentals?.find(r => r.rental_id === rentalId);
    if (!rental) return;

    let amount = 0;
    const paidToday = rental.paid_today || false;
    const dailyRent = parseFloat(rental.daily_rent) || 0;
    const remainingBalance = parseFloat(rental.remaining_balance) || 0;

    switch (paymentType) {
      case 'daily':
        // Daily payment: only pay for today, don't deduct missed days
        amount = dailyRent;
        break;
      case 'fully paid':
        // Fully paid: cover missed days + pay today (if not already paid today)
        amount = remainingBalance + (paidToday ? 0 : dailyRent);
        break;
      case 'partial':
        // Keep current amount or set to daily rent as default
        const currentAmount = paymentForm.getFieldValue([`amount_${rentalId}`]);
        amount = currentAmount ? parseFloat(currentAmount) : dailyRent;
        break;
      case 'advance':
        // For advance: today's due + balance + 1 day advance (daily rent)
        // If already paid today: balance + 1 day advance
        amount = paidToday ? (remainingBalance + dailyRent) : (dailyRent + remainingBalance + dailyRent);
        break;
      default:
        amount = dailyRent;
    }

    // Ensure amount is a number
    amount = parseFloat(amount) || 0;

    paymentForm.setFieldsValue({
      [`payment_type_${rentalId}`]: paymentType,
      [`amount_${rentalId}`]: amount
    });

    // Trigger payment breakdown re-render
    setPaymentBreakdownTrigger(prev => ({
      ...prev,
      [rentalId]: Date.now()
    }));
  };

  const calculatePaymentBreakdown = (rentalId) => {
    const rental = selectedVendor?.rentals?.find(r => r.rental_id === rentalId);
    if (!rental) return null;

    // If in bulk mode, use the divided amount instead of form value
    let amount = 0;
    let paymentType = 'daily';
    
    if (bulkPaymentMode && bulkPaymentData.amount > 0) {
      // Check if this is a daily payment scenario
      const dailyRent = parseFloat(rental.daily_rent || 0);
      const missedAmount = parseFloat(rental.remaining_balance || 0) || (parseFloat(rental.missed_days || 0) * dailyRent);
      
      // If bulk payment type is daily, use individual stall's daily rent
      if (bulkPaymentData.paymentType === 'daily') {
        amount = dailyRent;
        paymentType = 'daily';
      } else {
        // For other payment types, divide the total amount
        amount = selectedRentals.length > 1 ? 
          Math.round((bulkPaymentData.amount / selectedRentals.length) * 100) / 100 : 
          bulkPaymentData.amount;
        
        // Determine payment type based on amount
        // Use tolerance for floating point comparison
        const tolerance = 0.01;
        
        if (Math.abs(amount - dailyRent) <= tolerance) {
          paymentType = 'daily';
        } else if (amount > missedAmount + (rental.paid_today ? 0 : dailyRent) + dailyRent + tolerance) {
          paymentType = 'advance';
        } else if (amount >= missedAmount + (rental.paid_today ? 0 : dailyRent) - tolerance) {
          paymentType = 'fully paid';
        } else {
          paymentType = 'partial';
        }
      }
    } else {
      // Use form values when not in bulk mode
      amount = parseFloat(paymentForm.getFieldValue([`amount_${rentalId}`]) || 0);
      paymentType = paymentForm.getFieldValue([`payment_type_${rentalId}`]) || 'daily';
    }

    // Calculate remaining balance from missed days * daily rent if no remaining_balance data
    const remainingBalance = rental.remaining_balance !== null && rental.remaining_balance !== undefined
      ? parseFloat(rental.remaining_balance)
      : (parseFloat(rental.missed_days || 0) * parseFloat(rental.daily_rent || 0));

    const dailyRent = parseFloat(rental.daily_rent || 0);

    let missedDaysCovered = 0;
    let advanceDays = 0;
    let newRemainingBalance = remainingBalance;

    if (amount > 0) {
      if (paymentType === 'daily') {
        // Daily payment: only pays for today, doesn't cover missed days
        missedDaysCovered = 0;
        newRemainingBalance = remainingBalance; // No change to missed days balance
      } else if (paymentType === 'partial') {
        missedDaysCovered = Math.floor(amount / dailyRent);
        newRemainingBalance = Math.max(0, remainingBalance - amount);
      } else if (paymentType === 'fully paid') {
        // Fully paid: covers all missed days
        missedDaysCovered = Math.ceil(remainingBalance / dailyRent);
        newRemainingBalance = 0;
      } else if (paymentType === 'advance') {
        const missedDays = Math.ceil(remainingBalance / dailyRent);
        // Match backend calculation: use effectiveRemaining (same as remainingBalance) + todayDue
        const todayDue = dailyRent; // Backend adds today's due if not paid today
        const totalRequired = remainingBalance + todayDue;
        const extraAmount = amount - totalRequired;
        advanceDays = Math.max(0, Math.floor(extraAmount / dailyRent));
        // Show total days covered: missed days + advance days
        missedDaysCovered = missedDays + advanceDays;
        newRemainingBalance = 0;
      }
    }

    // Determine if today's due is paid based on payment type
    let paidTodayStatus = rental.paid_today || false;
    if (paymentType === 'daily' || paymentType === 'fully paid' || paymentType === 'advance') {
      paidTodayStatus = true;
    }

    return {
      totalRemainingBalance: remainingBalance,
      missedDaysCovered: paymentType === 'daily' ? '0 days (today only)' : `${missedDaysCovered}/${rental.missed_days || 0} days`,
      paidToday: paidTodayStatus,
      amountEntered: amount,
      remainingBalance: newRemainingBalance,
      advanceDays,
      paymentType,
      dailyRent
    };
  };

  const calculateBulkPaymentSummary = () => {
    if (!selectedVendor || selectedRentals.length === 0) return null;

    const selectedRentalsData = selectedVendor.rentals.filter(r => selectedRentals.includes(r.rental_id));
    
    let totalDailyRent = 0;
    let totalMissedAmount = 0;
    let totalAmount = 0;
    const paymentTypeBreakdown = {};

    selectedRentalsData.forEach(rental => {
      const dailyRent = parseFloat(rental.daily_rent || 0);
      const missedAmount = parseFloat(rental.remaining_balance || 0) || (parseFloat(rental.missed_days || 0) * dailyRent);
      
      totalDailyRent += dailyRent;
      totalMissedAmount += missedAmount;

      // Always read from form fields to get actual current values
      const amount = parseFloat(paymentForm.getFieldValue([`amount_${rental.rental_id}`]) || 0);
      const paymentType = paymentForm.getFieldValue([`payment_type_${rental.rental_id}`]) || 'daily';

      totalAmount += amount;
      paymentTypeBreakdown[paymentType] = (paymentTypeBreakdown[paymentType] || 0) + 1;
    });

    return {
      totalStalls: selectedRentals.length,
      totalDailyRent: Math.round(totalDailyRent * 100) / 100,
      totalMissedAmount: Math.round(totalMissedAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      paymentTypeBreakdown,
      savings: 0 // Calculate savings differently if needed
    };
  };

  const handleBulkPaymentMode = (enabled) => {
    setBulkPaymentMode(enabled);
    if (enabled && selectedRentals.length > 1) {
      // Auto-calculate amounts for bulk mode
      const summary = calculateBulkPaymentSummary();
      if (summary) {
        const totalAmount = Math.round((summary.totalMissedAmount + summary.totalDailyRent) * 100) / 100;
        setBulkPaymentData(prev => ({
          ...prev,
          amount: totalAmount
        }));
      }
    }
  };

  // Auto-divide when bulk payment amount changes
  useEffect(() => {
    console.log('useEffect triggered:', { bulkPaymentMode, amount: bulkPaymentData.amount, stallsCount: selectedRentals.length, paymentType: bulkPaymentData.paymentType });
    
    if (bulkPaymentMode && bulkPaymentData.amount > 0 && selectedRentals.length > 1) {
      // Check if entered amount equals total daily rent
      const summary = calculateBulkPaymentSummary();
      const isTotalDailyRent = summary && Math.abs(bulkPaymentData.amount - summary.totalDailyRent) <= 0.01;
      
      if (isTotalDailyRent) {
        console.log('Amount equals total daily rent - using individual daily rents');
        
        // Update bulk payment data to reflect daily payment type
        setBulkPaymentData(prev => ({ ...prev, paymentType: 'daily' }));
        
        selectedRentals.forEach(rentalId => {
          const rental = selectedVendor?.rentals?.find(r => r.rental_id === rentalId);
          if (!rental) return;
          
          const dailyRent = parseFloat(rental.daily_rent || 0);
          
          console.log('Setting stall:', { rentalId, amount: dailyRent, paymentType: 'daily' });
          
          paymentForm.setFieldsValue({
            [`amount_${rentalId}`]: dailyRent,
            [`payment_type_${rentalId}`]: 'daily'
          });
        });
      } else {
        // Divide the amount among all selected stalls and auto-determine payment type
        const amountPerStall = Math.round((bulkPaymentData.amount / selectedRentals.length) * 100) / 100;
        
        console.log('Dividing amount:', { total: bulkPaymentData.amount, perStall: amountPerStall, stalls: selectedRentals.length });
        
        // Determine the most common payment type to update bulk payment data
        const paymentTypeCounts = {};
        
        selectedRentals.forEach(rentalId => {
          // Determine payment type based on amount per stall
          const rental = selectedVendor?.rentals?.find(r => r.rental_id === rentalId);
          if (!rental) return;
          
          const dailyRent = parseFloat(rental.daily_rent || 0);
          const missedAmount = parseFloat(rental.remaining_balance || 0) || (parseFloat(rental.missed_days || 0) * dailyRent);
          
          // Auto-determine payment type based on entered amount
          let paymentType = 'partial';
          // Use tolerance for floating point comparison
          const tolerance = 0.01;
          
          if (Math.abs(amountPerStall - dailyRent) <= tolerance) {
            paymentType = 'daily';
          } else if (amountPerStall > missedAmount + (rental.paid_today ? 0 : dailyRent) + dailyRent + tolerance) {
            paymentType = 'advance';
          } else if (amountPerStall >= missedAmount + (rental.paid_today ? 0 : dailyRent) - tolerance) {
            paymentType = 'fully paid';
          }

          paymentTypeCounts[paymentType] = (paymentTypeCounts[paymentType] || 0) + 1;

          console.log('Setting stall:', { rentalId, amount: amountPerStall, paymentType });

          paymentForm.setFieldsValue({
            [`amount_${rentalId}`]: amountPerStall,
            [`payment_type_${rentalId}`]: paymentType
          });
        });
        
        // Update bulk payment data to the most common payment type
        const mostCommonPaymentType = Object.keys(paymentTypeCounts).reduce((a, b) => 
          paymentTypeCounts[a] > paymentTypeCounts[b] ? a : b
        );
        setBulkPaymentData(prev => ({ ...prev, paymentType: mostCommonPaymentType }));
      }
      
      // Force re-render of stall inputs
      setStallRenderKey(prev => prev + 1);
    }
  }, [bulkPaymentData.amount, bulkPaymentData.paymentType, bulkPaymentMode, selectedRentals.length, selectedVendor?.rentals]);

  const applyBulkPaymentToAll = () => {
    // Don't apply bulk payment if bulk mode is enabled (useEffect handles it)
    if (bulkPaymentMode) return;
    
    selectedRentals.forEach(rentalId => {
      const rental = selectedVendor?.rentals?.find(r => r.rental_id === rentalId);
      if (!rental) return;

      let amount = 0;
      const dailyRent = parseFloat(rental.daily_rent || 0);
      const missedAmount = parseFloat(rental.remaining_balance || 0) || (parseFloat(rental.missed_days || 0) * dailyRent);

      switch (bulkPaymentData.paymentType) {
        case 'daily':
          amount = dailyRent;
          break;
        case 'fully paid':
          amount = missedAmount + (rental.paid_today ? 0 : dailyRent);
          break;
        case 'advance':
          amount = missedAmount + dailyRent + (bulkPaymentData.customAmount ? bulkPaymentData.amount - (missedAmount + dailyRent) : dailyRent);
          break;
        case 'partial':
          amount = bulkPaymentData.customAmount ? bulkPaymentData.amount : dailyRent;
          break;
        default:
          amount = dailyRent;
      }

      // Round the amount to 2 decimal places to avoid floating-point precision issues
      amount = Math.round(amount * 100) / 100;

      paymentForm.setFieldsValue({
        [`payment_type_${rentalId}`]: bulkPaymentData.paymentType,
        [`amount_${rentalId}`]: amount
      });

      setPaymentBreakdownTrigger(prev => ({
        ...prev,
        [rentalId]: Date.now()
      }));
    });
  };




  const handleBulkPaymentSubmit = async (values) => {
    // Validate OR number
    if (!orNumber.trim()) {
      message.error('OR Number is required');
      return;
    }

    // Check if any selected rentals are already paid with advance
    const alreadyPaidRentals = selectedRentals.map(rentalId => {
      const rental = selectedVendor?.rentals?.find(r => r.rental_id === rentalId);
      return rental && isStallAlreadyPaidWithAdvance(rental) ? rental : null;
    }).filter(Boolean);

    if (alreadyPaidRentals.length > 0) {
      const stallNames = alreadyPaidRentals.map(r => `${r.section_name} - ${r.stall_number}`).join(', ');
      message.error(`Cannot process payment for following stall(s): ${stallNames}. These stalls are already paid today, have no remaining missed amount, and have active advance payments.`);
      return;
    }

    // Prepare payment data for confirmation
    setProcessingPayment(true);
    try {
      // Calculate advance days for each rental
      const advanceDaysData = selectedRentals.map(rentalId => {
        const breakdown = calculatePaymentBreakdown(rentalId);
        return breakdown ? breakdown.advanceDays : 0;
      });

      // Collect amounts and payment types based on mode
      let amounts, paymentTypes;
      
      if (bulkPaymentMode) {
        // In bulk mode, calculate amounts based on bulk payment data
        amounts = selectedRentals.map(rentalId => {
          const rental = selectedVendor?.rentals?.find(r => r.rental_id === rentalId);
          if (!rental) return 0;
          
          const dailyRent = parseFloat(rental.daily_rent || 0);
          
          // If bulk payment type is daily, use individual stall's daily rent
          if (bulkPaymentData.paymentType === 'daily') {
            return Math.round(dailyRent * 100) / 100;
          } else {
            // For other payment types, divide the total amount
            const amount = selectedRentals.length > 1 ? 
              Math.round((bulkPaymentData.amount / selectedRentals.length) * 100) / 100 : 
              bulkPaymentData.amount;
            return Math.round(amount * 100) / 100;
          }
        });
        
        // Determine payment types based on calculated amounts
        paymentTypes = selectedRentals.map(rentalId => {
          const rental = selectedVendor?.rentals?.find(r => r.rental_id === rentalId);
          if (!rental) return 'daily';
          
          const dailyRent = parseFloat(rental.daily_rent || 0);
          const missedAmount = parseFloat(rental.remaining_balance || 0) || (parseFloat(rental.missed_days || 0) * dailyRent);
          
          // If bulk payment type is daily, return daily
          if (bulkPaymentData.paymentType === 'daily') {
            return 'daily';
          } else {
            // For other payment types, determine based on divided amount
            const amount = selectedRentals.length > 1 ? 
              Math.round((bulkPaymentData.amount / selectedRentals.length) * 100) / 100 : 
              bulkPaymentData.amount;
            
            // Use tolerance for floating point comparison
            const tolerance = 0.01;
            
            if (Math.abs(amount - dailyRent) <= tolerance) {
              return 'daily';
            } else if (amount > missedAmount + (rental.paid_today ? 0 : dailyRent) + dailyRent + tolerance) {
              return 'advance';
            } else if (amount >= missedAmount + (rental.paid_today ? 0 : dailyRent) - tolerance) {
              return 'fully paid';
            } else {
              return 'partial';
            }
          }
        });
      } else {
        // In individual mode, get from form values
        amounts = selectedRentals.map(id => {
          const amount = values[`amount_${id}`];
          return amount !== undefined && amount !== null ? Math.round(parseFloat(amount) * 100) / 100 : 0;
        });
        paymentTypes = selectedRentals.map(id => values[`payment_type_${id}`] || 'daily');
      }

      const paymentData = {
        rental_ids: selectedRentals,
        amounts: amounts,
        payment_types: paymentTypes,
        advance_days: advanceDaysData,
        or_number: orNumber.trim(),
        payment_date: paymentDate.format('YYYY-MM-DD'), // Add payment date
      };

      // Set pending payment data and show confirmation modal
      setPendingPaymentData(paymentData);
      setConfirmationModal(true);
    } catch (error) {
      console.error('Payment preparation error:', error);
      message.error('Failed to prepare payment data');
    } finally {
      setProcessingPayment(false);
    }
  };

  const confirmPayment = async () => {
    if (!pendingPaymentData) return;
    
    setProcessingPayment(true);
    try {
      await api.post(`/vendor-payments/bulk/${selectedVendor.id}`, pendingPaymentData);
      message.success('Bulk payment processed successfully');
      setConfirmationModal(false);
      setBulkPaymentModal(false);
      setOrNumber(''); // Reset OR number
      setPaymentDate(dayjs()); // Reset payment date to today
      fetchVendors();
    } catch (error) {
      console.error('Bulk payment error:', error);
      message.error(error.response?.data?.message || 'Failed to process bulk payment');
    } finally {
      setProcessingPayment(false);
      setPendingPaymentData(null);
    }
  };

  // Memoized calculations for better performance
  const filteredVendors = useMemo(() => {
    if (!searchText) return vendors;

    return vendors.filter(vendor => {
      const name = (vendor.name || '').toLowerCase();
      const contactNumber = (vendor.contact_number || '').toLowerCase();
      const email = (vendor.email || '').toLowerCase();
      const searchLower = searchText.toLowerCase();

      return name.includes(searchLower) ||
        contactNumber.includes(searchLower) ||
        email.includes(searchLower);
    });
  }, [vendors, searchText]);

  const stats = useMemo(() => {
    const totalVendors = filteredVendors.length;
    const currentMonth = new Date().getMonth();
    
    // Calculate current month total balance
    const currentMonthBalance = filteredVendors.reduce((sum, vendor) => {
      const monthlyBalances = vendor.monthly_balances || [];
      return sum + (monthlyBalances[currentMonth]?.balance || 0);
    }, 0);
    
    // Calculate year-to-date total balance
    const ytdBalance = filteredVendors.reduce((sum, vendor) => {
      const monthlyBalances = vendor.monthly_balances || [];
      return sum + monthlyBalances
        .slice(0, currentMonth + 1)
        .reduce((monthSum, month) => monthSum + (month.balance || 0), 0);
    }, 0);
    
    const vendorsWithCurrentMonthBalance = filteredVendors.filter(vendor => {
      const monthlyBalances = vendor.monthly_balances || [];
      return (monthlyBalances[currentMonth]?.balance || 0) > 0;
    }).length;

    return { 
      totalVendors, 
      currentMonthBalance, 
      ytdBalance, 
      vendorsWithCurrentMonthBalance 
    };
  }, [filteredVendors]);

  const getPaymentTypeColor = (type) => {
    const colors = {
      'daily': 'blue',
      'partial': 'orange',
      'fully paid': 'green',
      'advance': 'purple',
    };
    return colors[type] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      'occupied': 'red',
      'temp_closed': 'orange',
      'partial': 'cyan',
      'fully paid': 'green',
    };
    return colors[status] || 'default';
  };

  const fmtMoney = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount || 0);
  };

  const fmtDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const vendorColumns = [
    {
      title: 'Vendor Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className="vendor-name-cell">
          <div className="vendor-avatar">
            {text?.charAt(0)?.toUpperCase() || 'V'}
          </div>
          <div className="vendor-info">
            <div className="vendor-name">{text || 'N/A'}</div>
            <div className="vendor-contact">{record.contact_number}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Section & Stalls',
      key: 'stalls',
      render: (_, record) => {
        // Ensure rentals is an array
        const rentals = Array.isArray(record.rentals) ? record.rentals : [];

        return (
          <div>
            {rentals.map((rental, index) => (
              <Tag key={index} className="stall-tag">
                {rental.section_name} - {rental.stall_number}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarOutlined style={{ color: '#52c41a' }} />
          <span>Total Stalls</span>
        </div>
      ),
      dataIndex: 'total_stalls',
      key: 'total_stalls',
      render: (count) => (
        <div style={{ textAlign: 'center' }}>
          <Badge
            count={count}
            style={{
              backgroundColor: '#52c41a',
              fontSize: '12px',
              fontWeight: '600'
            }}
          />
        </div>
      ),
      sorter: (a, b) => a.total_stalls - b.total_stalls,
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarOutlined style={{ color: '#52c41a' }} />
          <span>Monthly Balance</span>
        </div>
      ),
      dataIndex: 'total_monthly_balance',
      key: 'total_monthly_balance',
      render: (_, record) => {
        // Calculate current month balance (up to current date)
        const currentMonth = new Date().getMonth();
        const monthlyBalances = record.monthly_balances || [];
        const currentMonthBalance = monthlyBalances[currentMonth]?.balance || 0;
        
        // Also calculate total balance for all months up to current month
        const totalBalanceUpToCurrentMonth = monthlyBalances
          .slice(0, currentMonth + 1)
          .reduce((sum, month) => sum + (month.balance || 0), 0);

        return (
          <div>
            <Text strong style={{ color: currentMonthBalance > 0 ? '#ff4d4f' : '#52c41a' }}>
              Current Month: {fmtMoney(currentMonthBalance)}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Total Balance: {fmtMoney(totalBalanceUpToCurrentMonth)}
            </Text>
          </div>
        );
      },
      sorter: (a, b) => {
        const currentMonth = new Date().getMonth();
        const balanceA = a.monthly_balances?.[currentMonth]?.balance || 0;
        const balanceB = b.monthly_balances?.[currentMonth]?.balance || 0;
        return balanceA - balanceB;
      },
    },
    {
      title: 'Paid Today',
      dataIndex: 'paid_today_count',
      key: 'paid_today_count',
      render: (count, record) => {
        const rentals = Array.isArray(record.rentals) ? record.rentals : [];

        return (
          <div>
            <Tag color={count > 0 ? 'green' : 'default'}>
              {count} / {rentals.length}
            </Tag>
            {count > 0 && <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: '4px' }} />}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        // Check if vendor has any balances (current or past)
        const hasAnyBalance = record.monthly_balances?.some(month => month.balance > 0) || false;
        
        return (
          <Space>
            <Tooltip title="Pay Selected Months">
              <Button
                className="action-button black"
                icon={<CalendarTwoTone />}
                size="small"
                onClick={() => handlePaySelectedMonths(record)}
                disabled={!hasAnyBalance}
                type={hasAnyBalance ? "primary" : "default"}
              />
            </Tooltip>
            <Tooltip title="View Monthly Breakdown">
              <Button
                className="action-button black"
                icon={<CalendarOutlined />}
                size="small"
                onClick={() => handleMonthlyBreakdown(record)}
              />
            </Tooltip>
            <Tooltip title="View Rental Details">
              <Button
                className="action-button black"
                icon={<InfoCircleOutlined />}
                size="small"
                onClick={() => handleRentalDetails(record)}
              />
            </Tooltip>
            <Tooltip title="View Payment History">
              <Button
                className="action-button black"
                icon={<EyeOutlined />}
                size="small"
                onClick={() => fetchPaymentHistory(record.id)}
              />
            </Tooltip>
            <Tooltip title="Pay Now">
              <Button
                className="action-button black"
                icon={<BankOutlined />}
                size="small"
                onClick={() => handleBulkPayment(record)}
                disabled={record.paid_today_count === (Array.isArray(record.rentals) ? record.rentals.length : 0)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  const paymentHistoryColumns = [
    {
      title: 'Date',
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (date) => (
        <Text className="payment-history-date">{fmtDate(date)}</Text>
      ),
    },
    {
      title: 'Stall',
      key: 'stall',
      render: (_, record) => (
        <div className="payment-history-stall">
          <div className="payment-history-stall-name">
            {record.section_name} - {record.stall_number}
          </div>
          <Text className="payment-history-stall-rent">
            {fmtMoney(record.daily_rent)}/day
          </Text>
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text className="payment-history-amount">{fmtMoney(amount)}</Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'payment_type',
      key: 'payment_type',
      render: (type) => {
        const typeClass = type.toLowerCase().replace(' ', '-');
        return (
          <Tag className={`payment-history-type-tag ${typeClass}`}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Tag>
        );
      },
    },
    {
      title: 'Details',
      key: 'details',
      render: (_, record) => (
        <div className="payment-history-details">
          {record.missed_days > 0 && (
            <div className="payment-history-detail-item">
              <Text >Missed Days: </Text>
              <Text>{record.missed_days}</Text>
            </div>
          )}
          {record.advance_days > 0 && (
            <div className="payment-history-detail-item">
              <Text >Advance Days: </Text>
              <Text>{record.advance_days}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusClass = status.toLowerCase();
        return (
          <Tag className={`payment-history-status-tag ${statusClass}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Tag>
        );
      },
    },
  ];

  if (loading) {
    return <LoadingOverlay message="Loading vendor payment data..." />;
  }

  return (
    <div className="vendor-payment-management">
      {/* Header */}
      <div className="vendor-header">
        <div className="header-title">
          <BankOutlined className="title-icon" />
          <div>
            <Title level={1} style={{ margin: 0 }}>
              Vendor Payment Management
            </Title>
            <Text className="vendor-header-subtitle">
              Comprehensive vendor payment tracking and management system
            </Text>
          </div>
        </div>
        <div className="vendor-header-actions">
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchVendors}
            size="large"
            className="action-button black"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon purple">
            <UserOutlined />
          </div>
          <div className="stat-card-value">{stats.totalVendors}</div>
          <div className="stat-card-label">Total Vendors</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon blue">
            <CalendarTwoTone />
          </div>
          <div className="stat-card-value">{fmtMoney(stats.currentMonthBalance)}</div>
          <div className="stat-card-label">Current Month Balance</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon green">
            <CalendarOutlined />
          </div>
          <div className="stat-card-value">{fmtMoney(stats.ytdBalance)}</div>
          <div className="stat-card-label">Year-to-Date Balance</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon orange">
            <ExclamationCircleOutlined />
          </div>
          <div className="stat-card-value">{stats.vendorsWithCurrentMonthBalance}</div>
          <div className="stat-card-label">Vendors with Balance</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="vendor-table-card">
        <div className="vendor-table-header">
          <div className="vendor-table-title">
            <div className="vendor-table-title-icon">
              <BankOutlined />
            </div>
            Vendor Payment Management
          </div>
          <div className="vendor-search-container">
            <Input
              className="vendor-search-input"
              placeholder="Search vendor name, contact, or email..."
              prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear={true}
            />
          </div>
        </div>
        <Table
          className="vendor-table"
          columns={vendorColumns}
          dataSource={filteredVendors}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} vendors${searchText ? ` (filtered from ${vendors.length})` : ''}`
          }}
          scroll={{ x: 1200 }}
          rowClassName={(record) =>
            record.total_remaining_balance > 0 ? 'vendor-row-with-balance' : 'vendor-row-no-balance'
          }
        />
      </div>

      {/* Payment History Modal */}
      <Modal
        className="vendor-modal"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClockCircleOutlined style={{ color: '#722ed1', fontSize: '20px' }} />
            <span style={{ fontSize: '16px', fontWeight: 600 }}>
              Payment History - {selectedVendor?.name}
            </span>
          </div>
        }
        open={paymentHistoryModal}
        onCancel={() => setPaymentHistoryModal(false)}
        footer={null}
        width={1000}
      >
        <Table
          className="payment-history-table"
          columns={paymentHistoryColumns}
          dataSource={paymentHistory}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ y: 400 }}
        />
      </Modal>

      {/* Rental Details Modal */}
      <Modal
        className="vendor-modal"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <InfoCircleOutlined style={{ color: '#1890ff', fontSize: '26px' }} />
            <span style={{ fontSize: '24px', fontWeight: 600 }}>
              Rental Details - {selectedVendor?.name}
            </span>
          </div>
        }
        open={rentalDetailsModal}
        onCancel={() => setRentalDetailsModal(false)}
        footer={null}
        width={1000}
      >
        <div style={{ padding: '16px 0' }}>
          {selectedVendor?.rentals?.map((rental) => (
            <Card
              key={rental.rental_id}
              size="small"
              style={{
                marginBottom: '16px',
                borderRadius: '8px',
                border: '1px solid #d9d9d9',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong style={{ fontSize: '14px', color: '#262626' }}>
                      <ShopOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                      Stall Information
                    </Text>
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ marginBottom: '4px' }}>
                        <Text style={{ fontSize: '16px', color: '#262626' }} type="secondary">Section Name & Stall Number:</Text>
                        <div style={{ fontWeight: 500, marginTop: '2px' }}>
                          {rental.section_name} - {rental.stall_number}
                        </div>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <Text style={{ fontSize: '16px', color: '#262626' }} type="secondary">Status:</Text>
                        <div style={{ marginTop: '2px' }}>
                          <Tag color={getStatusColor(rental.status)} style={{ borderRadius: '6px' }}>
                            {rental.status}
                          </Tag>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong style={{ fontSize: '14px', color: '#262626' }}>
                      <MoneyCollectOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                      Payment Details
                    </Text>
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ marginBottom: '4px' }}>
                        <Text style={{ fontSize: '16px', color: '#262626' }} type="secondary">Daily Rent:</Text>
                        <div style={{ fontWeight: 500, marginTop: '2px' }}>
                          {fmtMoney(rental.daily_rent)}
                        </div>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <Text style={{ fontSize: '16px', color: '#262626' }} type="secondary">Monthly Rent:</Text>
                        <div style={{ fontWeight: 500, marginTop: '2px' }}>
                          {fmtMoney(rental.monthly_rent)}
                        </div>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <Text style={{ fontSize: '16px', color: '#262626' }} type="secondary">Current Month Balance:</Text>
                        <div style={{
                          fontWeight: 'bold',
                          marginTop: '2px',
                          color: '#ff4d4f'
                        }}>
                          {(() => {
                            const currentMonth = new Date().getMonth();
                            const monthlyBalances = rental.monthly_balances || [];
                            const currentMonthBalance = monthlyBalances[currentMonth]?.balance || 0;
                            return fmtMoney(currentMonthBalance);
                          })()}
                        </div>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <Text style={{ fontSize: '16px', color: '#262626' }} type="secondary">Section:</Text>
                        <div style={{ fontWeight: 500, marginTop: '2px' }}>
                          <Tag color="blue" style={{ borderRadius: '6px' }}>
                            {rental.section_name}
                          </Tag>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong style={{ fontSize: '14px', color: '#262626' }}>
                      <CalendarTwoTone style={{ marginRight: '8px', color: '#722ed1' }} />
                      Payment Information
                    </Text>
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ marginBottom: '4px' }}>
                        <Text style={{ fontSize: '16px', color: '#262626' }} type="secondary">Missed Days:</Text>
                        <div style={{ fontWeight: 500, marginTop: '2px' }}>
                          {rental.missed_days} days
                        </div>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <Text style={{ fontSize: '16px', color: '#262626' }} type="secondary">Next Due Date:</Text>
                        <div style={{ fontWeight: 500, marginTop: '2px' }}>
                          {rental.next_due_date ? fmtDate(rental.next_due_date) : 'Not set'}
                        </div>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <Text style={{ fontSize: '16px', color: '#262626' }} type="secondary">Paid Today:</Text>
                        <div style={{ marginTop: '2px' }}>
                          {rental.paid_today ? (
                            <Tag color="green" icon={<CheckCircleOutlined />} style={{ borderRadius: '6px' }}>
                              Yes
                            </Tag>
                          ) : (
                            <Tag color="default" style={{ borderRadius: '6px' }}>
                              No
                            </Tag>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
              {rental.missed_days > 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  backgroundColor: '#fff2f0',
                  borderRadius: '6px',
                  border: '1px solid #ffccc7'
                }}>
                  <Text type="secondary" style={{ fontSize: '15px', color: 'black' }}>
                    <ExclamationCircleOutlined style={{ marginRight: '4px', color: '#ff4d4f' }} />
                    This stall has {rental.missed_days} missed day(s) with total missed amount of {fmtMoney(rental.missed_days * rental.daily_rent)}
                  </Text>
                </div>
              )}
            </Card>
          ))}
        </div>
      </Modal>

      {/* Bulk Payment Modal */}
      <Modal
        title={`Payment - ${selectedVendor?.name}`}
        open={bulkPaymentModal}
        onCancel={() => setBulkPaymentModal(false)}
        footer={null}
        width={900}
        style={{ borderRadius: '8px' }}
      >
        <Form
          form={paymentForm}
          onFinish={handleBulkPaymentSubmit}
          layout="vertical"
        >
          <Alert
            message="Select stalls and enter payment details"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          {/* OR Number Input */}
          <div style={{ marginBottom: '16px' }}>
            <Text strong style={{ marginBottom: '8px', display: 'block' }}>OR Number *</Text>
            <Input
              placeholder="Enter Official Receipt Number"
              value={orNumber}
              onChange={(e) => setOrNumber(e.target.value)}
              style={{ width: '100%' }}
              maxLength={50}
            />
          </div>

          {/* Payment Date Picker */}
          <div style={{ marginBottom: '16px' }}>
            <Text strong style={{ marginBottom: '8px', display: 'block' }}>Payment Date *</Text>
            <DatePicker
              value={paymentDate}
              onChange={(date) => setPaymentDate(date)}
              style={{ width: '100%' }}
              format="MMMM D, YYYY"
              placeholder="Select payment date"
              disabledDate={(current) => current && current > dayjs().endOf('day')}
            />
          </div>

          {/* Enhanced Payment Summary */}
          {selectedRentals.length > 0 && (
            <div className="payment-summary-container">
              <div className="payment-summary-header">
                <div className="payment-summary-title">
                  <TrophyOutlined className="summary-icon" />
                  <Text strong>Payment Summary</Text>
                </div>
               
              </div>

              <div className="payment-summary-content">
                {(() => {
                  const summary = calculateBulkPaymentSummary();
                  if (!summary) return null;

                  const isAllSelected = selectedRentals.length === selectedVendor?.rentals?.filter(r => !isStallAlreadyPaidWithAdvance(r))?.length;
                  const showDetailedBreakdown = selectedRentals.length > 0;

                  return (
                    <>
                      {/* Professional Payment Summary Cards */}
                      <div className="payment-summary-cards">
                        <div className="payment-summary-card total-card">
                          <div className="payment-card-icon">
                            <MoneyCollectOutlined />
                          </div>
                          <div className="payment-card-value">
                            {fmtMoney(summary.totalAmount)}
                          </div>
                          <div className="payment-card-title">
                            <Text strong>Total Amount</Text>
                           
                          </div>
                        </div>

                        <div className="payment-summary-card stalls-card">
                          <div className="payment-card-icon">
                            <ShopOutlined />
                          </div>
                          <div className="payment-card-value">
                            {summary.totalStalls}
                          </div>
                          <div className="payment-card-title">
                            <Text strong>Total Selected Stalls</Text>
                          </div>
                          <div className="payment-card-subtitle">
                            Stalls for payment
                          </div>
                        </div>

                        <div className="payment-summary-card breakdown-card">
                          <div className="payment-card-icon">
                            <TrophyOutlined />
                          </div>
                          <div className="payment-card-value">
                            {fmtMoney(summary.totalDailyRent)}
                          </div>
                          <div className="payment-card-title">
                            <Text strong>Daily Rent Total</Text>
                          </div>
                          <div className="payment-card-subtitle">
                            Missed: {fmtMoney(summary.totalMissedAmount)}
                          </div>
                        </div>
                      </div>

                      {/* Detailed Breakdown */}
                      {showDetailedBreakdown && (
                        <div className="summary-breakdown-section">
                          <div className="breakdown-header">
                            <Text strong>Payment Breakdown</Text>
                          </div>
                          
                          <div className="breakdown-content">
                            {/* Payment Type Distribution */}
                            <div className="breakdown-card">
                              <div className="breakdown-card-title">
                                <Text>Payment Type Distribution</Text>
                              </div>
                              <div className="payment-types-grid">
                                {Object.entries(summary.paymentTypeBreakdown).map(([type, count]) => (
                                  <div key={type} className="payment-type-item">
                                    <Tag color={getPaymentTypeColor(type)} className="payment-type-tag">
                                      {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </Tag>
                                    <Text strong>{count}</Text>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Stall-by-Stall Breakdown */}
                            <div className="breakdown-card">
                              <div className="breakdown-card-title">
                                <Text>Stall Details</Text>
                              </div>
                              <div className="stall-breakdown-list">
                                {selectedRentals.map(rentalId => {
                                  const rental = selectedVendor?.rentals?.find(r => r.rental_id === rentalId);
                                  if (!rental) return null;

                                  let amount = 0;
                                  let paymentType = 'daily';

                                  if (bulkPaymentMode && bulkPaymentData.amount > 0) {
                                    // Check if this is a daily payment scenario
                                    const dailyRent = parseFloat(rental.daily_rent || 0);
                                    const missedAmount = parseFloat(rental.remaining_balance || 0) || (parseFloat(rental.missed_days || 0) * dailyRent);
                                    
                                    // If bulk payment type is daily, use individual stall's daily rent
                                    if (bulkPaymentData.paymentType === 'daily') {
                                      amount = dailyRent;
                                      paymentType = 'daily';
                                    } else {
                                      // For other payment types, divide the total amount
                                      amount = selectedRentals.length > 1 ? 
                                        Math.round((bulkPaymentData.amount / selectedRentals.length) * 100) / 100 : 
                                        bulkPaymentData.amount;
                                      
                                      // Determine payment type based on amount
                                      // Use tolerance for floating point comparison
                                      const tolerance = 0.01;
                                      
                                      if (Math.abs(amount - dailyRent) <= tolerance) {
                                        paymentType = 'daily';
                                      } else if (amount > missedAmount + (rental.paid_today ? 0 : dailyRent) + dailyRent + tolerance) {
                                        paymentType = 'advance';
                                      } else if (amount >= missedAmount + (rental.paid_today ? 0 : dailyRent) - tolerance) {
                                        paymentType = 'fully paid';
                                      } else {
                                        paymentType = 'partial';
                                      }
                                    }
                                  } else {
                                    paymentType = bulkPaymentData.paymentType;
                                    const dailyRent = parseFloat(rental.daily_rent || 0);
                                    const missedAmount = parseFloat(rental.remaining_balance || 0) || (parseFloat(rental.missed_days || 0) * dailyRent);
                                    
                                    switch (paymentType) {
                                      case 'daily':
                                        amount = dailyRent;
                                        break;
                                      case 'fully paid':
                                        amount = missedAmount + (rental.paid_today ? 0 : dailyRent);
                                        break;
                                      case 'advance':
                                        amount = missedAmount + dailyRent + (bulkPaymentData.customAmount ? bulkPaymentData.amount - (missedAmount + dailyRent) : dailyRent);
                                        break;
                                      case 'partial':
                                        amount = bulkPaymentData.customAmount ? bulkPaymentData.amount : dailyRent;
                                        break;
                                      default:
                                        amount = dailyRent;
                                    }
                                  }
                                  amount = parseFloat(paymentForm.getFieldValue([`amount_${rentalId}`]) || 0);
                                  paymentType = paymentForm.getFieldValue([`payment_type_${rentalId}`]) || 'daily';

                                  return (
                                    <div key={rentalId} className="stall-breakdown-item">
                                      <div className="stall-info">
                                        <Text strong>{rental.section_name} - {rental.stall_number}</Text>
                                        <Tag color={getPaymentTypeColor(paymentType)} size="small">
                                          {paymentType}
                                        </Tag>
                                      </div>
                                      <div className="stall-amount">
                                        <Text strong>{fmtMoney(amount)}</Text>
                                        {(rental.remaining_balance || 0) > 0 && (
                                          <Text type="secondary" style={{ fontSize: '12px' }}>
                                            Missed: {fmtMoney(rental.remaining_balance || 0)}
                                          </Text>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Savings Information */}
                            {summary.savings > 0 && (
                              <div className="breakdown-card savings-card">
                                <div className="savings-content">
                                  <div className="savings-info">
                                    <Text strong>Potential Savings</Text>
                                    <Text type="secondary">With advance payment</Text>
                                  </div>
                                  <div className="savings-amount">
                                    <Text strong style={{ color: '#52c41a' }}>
                                      {fmtMoney(summary.savings)}
                                    </Text>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Bulk Payment Controls */}
          <div style={{
            background: '#fafafa',
            padding: '16px',
            borderRadius: '6px',
            marginBottom: '16px',
            border: '1px solid #e8e8e8'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <Text strong>Bulk Payment</Text>
              <Checkbox
                checked={bulkPaymentMode}
                onChange={(e) => handleBulkPaymentMode(e.target.checked)}
              >
                Enable bulk mode
              </Checkbox>
            </div>

              {bulkPaymentMode && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ marginBottom: '8px', display: 'block' }}>Payment Type</Text>
                    <Radio.Group
                      value={bulkPaymentData.paymentType}
                      onChange={(e) => setBulkPaymentData(prev => ({ ...prev, paymentType: e.target.value }))}
                      size="small"
                    >
                      <Radio.Button value="daily">Daily</Radio.Button>
                      <Radio.Button value="partial">Partial</Radio.Button>
                      <Radio.Button value="fully paid">Full</Radio.Button>
                      <Radio.Button value="advance">Advance</Radio.Button>
                    </Radio.Group>
                  </div>
                  <div style={{ width: '150px' }}>
                    <Text strong style={{ marginBottom: '8px', display: 'block' }}>Amount</Text>
                    <InputNumber
                      style={{ width: '100%' }}
                      formatter={value => {
                        const roundedValue = value ? Math.round(parseFloat(value) * 100) / 100 : 0;
                        return `₱ ${roundedValue}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                      }}
                      parser={value => value.replace(/₱\s?|(,*)/g, '')}
                      min={0}
                      placeholder="Amount"
                      size="small"
                      value={bulkPaymentData.amount}
                      onChange={(value) => setBulkPaymentData(prev => ({ ...prev, amount: value, customAmount: true }))}
                    />
                  </div>
                  <div style={{ width: '120px' }}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Button
                        size="small"
                        block
                        onClick={applyBulkPaymentToAll}
                        type="primary"
                      >
                        Apply to All
                      </Button>
                      <Button
                        size="small"
                        block
                        onClick={() => {
                          const summary = calculateBulkPaymentSummary();
                          if (summary) {
                            setBulkPaymentData(prev => ({
                              ...prev,
                              amount: Math.round(summary.totalDailyRent * 100) / 100,
                              paymentType: 'daily'
                            }));
                          }
                        }}
                      >
                        All Daily ({fmtMoney(calculateBulkPaymentSummary()?.totalDailyRent || 0)})
                      </Button>
                    </Space>
                  </div>
                </div>
              )}

            </div>

          <div style={{ marginBottom: '16px' }}>
            <Checkbox
              checked={selectedRentals.length === selectedVendor?.rentals?.filter(r => !isStallAlreadyPaidWithAdvance(r))?.length}
              indeterminate={
                selectedRentals.length > 0 && selectedRentals.length < selectedVendor?.rentals?.filter(r => !isStallAlreadyPaidWithAdvance(r))?.length
              }
              onChange={(e) => handleSelectAllRentals(selectedVendor?.rentals || [], e.target.checked)}
            >
              <Text strong>Select All ({selectedRentals.length} selected)</Text>
            </Checkbox>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {selectedVendor?.rentals?.map((rental) => (
              <div
                key={rental.rental_id}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  border: selectedRentals.includes(rental.rental_id) ? '1px solid #1890ff' : '1px solid #e8e8e8',
                  borderRadius: '6px',
                  backgroundColor: selectedRentals.includes(rental.rental_id) ? '#f6ffed' : '#ffffff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <Checkbox
                    checked={selectedRentals.includes(rental.rental_id)}
                    onChange={(e) => handleRentalSelection(rental.rental_id, e.target.checked)}
                    disabled={isStallAlreadyPaidWithAdvance(rental)}
                  />
                  <div style={{ marginLeft: '12px', flex: 1 }}>
                    <Text strong>{rental.section_name} - {rental.stall_number}</Text>
                    <div style={{ marginTop: '4px' }}>
                      <Tag color={getStatusColor(rental.status)} style={{ borderRadius: '4px' }}>
                        {rental.status}
                      </Tag>
                      {(rental.monthly_balances?.[new Date().getMonth()]?.balance || 0) > 0 && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Balance: {fmtMoney(rental.monthly_balances?.[new Date().getMonth()]?.balance || 0)}
                        </Text>
                      )}
                      {isStallAlreadyPaidWithAdvance(rental) && (
                        <Tag color="green" style={{ marginLeft: '4px' }}>
                          Already paid
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>

                {selectedRentals.includes(rental.rental_id) && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ marginBottom: '8px', display: 'block' }}>Payment Type</Text>
                      <Radio.Group
                        key={`payment_type_${rental.rental_id}_${stallRenderKey}`}
                        value={paymentForm.getFieldValue([`payment_type_${rental.rental_id}`]) || 'daily'}
                        onChange={(e) => handlePaymentTypeChange(rental.rental_id, e.target.value)}
                        disabled={bulkPaymentMode}
                        size="small"
                      >
                        <Radio.Button value="daily">Daily</Radio.Button>
                        <Radio.Button value="partial">Partial</Radio.Button>
                        <Radio.Button value="fully paid">Full</Radio.Button>
                        <Radio.Button value="advance">Advance</Radio.Button>
                      </Radio.Group>
                    </div>
                    <div style={{ width: '150px' }}>
                      <Form.Item
                        key={`amount_${rental.rental_id}_${stallRenderKey}`}
                        name={`amount_${rental.rental_id}`}
                        label="Amount"
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          formatter={value => {
                            const roundedValue = value ? Math.round(parseFloat(value) * 100) / 100 : 0;
                            return `₱ ${roundedValue}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                          }}
                          parser={value => value.replace(/₱\s?|(,*)/g, '')}
                          min={0}
                          placeholder="Amount"
                          size="small"
                          onChange={(value) => handleAmountChange(rental.rental_id, value)}
                          disabled={bulkPaymentMode}
                        />
                      </Form.Item>
                    </div>
                    <div style={{ width: '100px' }}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Button
                          size="small"
                          block
                          onClick={() => {
                            const amount = Math.round(parseFloat(rental.daily_rent) * 100) / 100;
                            handleAmountChange(rental.rental_id, amount);
                          }}
                          disabled={bulkPaymentMode}
                        >
                          Daily ({fmtMoney(rental.daily_rent)})
                        </Button>
                        {(rental.monthly_balances?.[new Date().getMonth()]?.balance || 0) > 0 && (
                          <Button
                            size="small"
                            block
                            onClick={() => {
                              const currentMonthBalance = rental.monthly_balances?.[new Date().getMonth()]?.balance || 0;
                              const fullAmount = Math.round((currentMonthBalance + (rental.paid_today ? 0 : rental.daily_rent)) * 100) / 100;
                              handleAmountChange(rental.rental_id, fullAmount);
                              handlePaymentTypeChange(rental.rental_id, 'fully paid');
                            }}
                            disabled={bulkPaymentMode}
                          >
                            Full ({fmtMoney((rental.monthly_balances?.[new Date().getMonth()]?.balance || 0) + (rental.paid_today ? 0 : rental.daily_rent))})
                          </Button>
                        )}
                        {(rental.monthly_balances?.[new Date().getMonth()]?.balance || 0) > 0 && (
                          <Button
                            size="small"
                            block
                            type="primary"
                            onClick={() => {
                              const currentMonthBalance = rental.monthly_balances?.[new Date().getMonth()]?.balance || 0;
                              handleAmountChange(rental.rental_id, currentMonthBalance);
                              handlePaymentTypeChange(rental.rental_id, 'partial');
                            }}
                            disabled={bulkPaymentMode}
                            style={{ marginTop: '4px' }}
                          >
                            Pay Balance ({fmtMoney(rental.monthly_balances?.[new Date().getMonth()]?.balance || 0)})
                          </Button>
                        )}
                      </Space>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'right', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
            <Space>
              <Button onClick={() => setBulkPaymentModal(false)}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={processingPayment}
                disabled={selectedRentals.length === 0}
              >
                {processingPayment ? 'Processing...' : `Pay ${selectedRentals.length} Stall${selectedRentals.length !== 1 ? 's' : ''}`}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Monthly Breakdown Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarOutlined style={{ color: '#52c41a' }} />
            <span>Monthly Balance Breakdown - {selectedVendorForBreakdown?.name}</span>
          </div>
        }
        open={monthlyBreakdownModal}
        onCancel={() => setMonthlyBreakdownModal(false)}
        footer={[
          <Button key="close" onClick={() => setMonthlyBreakdownModal(false)}>
            Close
          </Button>
        ]}
        width={1000}
      >
        {selectedVendorForBreakdown && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <Text type="secondary">
                Monthly balance calculation: (Daily Rent × Days in Month) - Payments Made
              </Text>
            </div>
            
            <Table
              dataSource={selectedVendorForBreakdown.monthly_balances || []}
              columns={[
                {
                  title: 'Month',
                  dataIndex: 'month',
                  key: 'month',
                  render: (month, record, index) => {
                    const currentMonth = new Date().getMonth();
                    const isPastMonth = index < currentMonth;
                    const isCurrentMonth = index === currentMonth;
                    const isFutureMonth = index > currentMonth;
                    
                    return (
                      <Tag 
                        color={
                          isPastMonth ? 'orange' : 
                          isCurrentMonth ? 'blue' : 
                          'default'
                        } 
                        style={{ fontWeight: 'bold' }}
                      >
                        {month}
                        {isPastMonth && ' (Past)'}
                        {isCurrentMonth && ' (Current)'}
                        {isFutureMonth && ' (Future)'}
                      </Tag>
                    );
                  },
                },
                {
                  title: 'Monthly Rate',
                  dataIndex: 'monthly_rate',
                  key: 'monthly_rate',
                  align: 'right',
                  render: (amount) => (
                    <Text strong>{fmtMoney(amount)}</Text>
                  ),
                },
                {
                  title: 'Payment',
                  dataIndex: 'payment',
                  key: 'payment',
                  align: 'right',
                  render: (amount) => (
                    <Text style={{ color: '#52c41a' }}>{fmtMoney(amount)}</Text>
                  ),
                },
                {
                  title: 'Balance',
                  dataIndex: 'balance',
                  key: 'balance',
                  align: 'right',
                  render: (amount) => (
                    <Text strong style={{ 
                      color: amount > 0 ? '#ff4d4f' : '#52c41a' 
                    }}>
                      {fmtMoney(amount)}
                    </Text>
                  ),
                },
                {
                  title: 'Deposit',
                  dataIndex: 'deposit',
                  key: 'deposit',
                  align: 'right',
                  render: (amount, record) => {
                    const deposit = Math.max(0, record.payment - record.monthly_rate);
                    if (deposit > 0) {
                      return (
                        <div>
                          <Text strong style={{ color: '#52c41a' }}>
                            {fmtMoney(deposit)}
                          </Text>
                        
                        </div>
                      );
                    }
                    return <Text type="secondary">-</Text>;
                  },
                },
              ]}
              pagination={false}
              size="small"
              summary={(pageData) => {
                const totalMonthlyRate = pageData.reduce((sum, record) => sum + (record.monthly_rate || 0), 0);
                const totalPayment = pageData.reduce((sum, record) => sum + (record.payment || 0), 0);
                const totalBalance = pageData.reduce((sum, record) => sum + (record.balance || 0), 0);
                const totalDeposit = pageData.reduce((sum, record) => {
                  const deposit = Math.max(0, record.payment - record.monthly_rate);
                  return sum + deposit;
                }, 0);
                
                return (
                  <Table.Summary>
                    <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
                      <Table.Summary.Cell index={0}>
                        <Text strong style={{ fontSize: '14px' }}>TOTAL</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}  align="right">
                        <Text strong style={{ fontSize: '14px' }}>{fmtMoney(totalMonthlyRate)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}  align="right">
                        <Text strong style={{ fontSize: '14px', color: '#52c41a' }}>
                          {fmtMoney(totalPayment)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}  align="right">
                        <Text strong style={{ 
                          fontSize: '14px',
                          color: totalBalance > 0 ? '#ff4d4f' : '#52c41a' 
                        }}>
                          {fmtMoney(totalBalance)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}  align="right">
                        <Text strong style={{ fontSize: '14px', color: '#52c41a' }}>
                          {fmtMoney(totalDeposit)}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
            
            <div style={{ marginTop: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '6px' }}>
              <Text strong style={{ color: '#1890ff' }}>
                💡 Note: This shows the monthly balance for each month. 
                Positive balance means payment is still due for that month.
              </Text>
            </div>
          </div>
        )}
      </Modal>

      {/* Month Selection Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarTwoTone style={{ color: '#52c41a' }} />
            <span>Select Months to Pay - {selectedVendorForMonthPayment?.name}</span>
          </div>
        }
        open={monthSelectionModal}
        onCancel={() => setMonthSelectionModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setMonthSelectionModal(false)}>
            Cancel
          </Button>,
          <Button
            key="pay"
            type="primary"
            onClick={handlePaySelectedMonthsBalance}
            disabled={selectedMonths.length === 0 || !orNumber.trim()}
            loading={processingPayment}
          >
            Pay Selected Months ({selectedMonths.length})
          </Button>
        ]}
        width={900}
      >
        {selectedVendorForMonthPayment && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <Text type="secondary">
                Select the months you want to pay the balance for. You can choose multiple months.
              </Text>
            </div>
            
            {/* OR Number, Payment Date, and Custom Amount */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <Text strong style={{ marginBottom: '8px', display: 'block' }}>OR Number *</Text>
                <Input
                  placeholder="Enter Official Receipt Number"
                  value={orNumber}
                  onChange={(e) => setOrNumber(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Text strong style={{ marginBottom: '8px', display: 'block' }}>Payment Date *</Text>
                <DatePicker
                  value={paymentDate}
                  onChange={(date) => setPaymentDate(date)}
                  style={{ width: '100%' }}
                  format="MMMM D, YYYY"
                  placeholder="Select payment date"
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ marginBottom: '8px', display: 'block' }}>Custom Payment Amount (Optional)</Text>
              <Input
                placeholder="Enter custom amount or leave empty to pay total balance"
                value={customPaymentAmount}
                onChange={(e) => setCustomPaymentAmount(e.target.value)}
                prefix="₱"
                style={{ width: '100%' }}
              />
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Leave empty to pay total balance for selected months, or enter custom amount to pay specific amount
              </Text>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {selectedVendorForMonthPayment.monthly_balances?.map((monthData, index) => {
                const currentMonth = new Date().getMonth();
                const isPastMonth = index < currentMonth;
                const isCurrentMonth = index === currentMonth;
                const isFutureMonth = index > currentMonth;
                const hasBalance = monthData.balance > 0;
                const isSelected = selectedMonths.includes(index);
                
                return (
                  <div
                    key={index}
                    style={{
                      padding: '12px',
                      border: `2px solid ${isSelected ? '#1890ff' : hasBalance ? '#ff4d4f' : '#d9d9d9'}`,
                      borderRadius: '8px',
                      backgroundColor: isSelected ? '#f6ffed' : hasBalance ? '#fff2f0' : '#fafafa',
                      cursor: hasBalance ? 'pointer' : 'not-allowed',
                      opacity: hasBalance ? 1 : 0.6,
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => hasBalance && handleMonthSelection(index)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <Tag 
                        color={
                          isPastMonth ? 'orange' : 
                          isCurrentMonth ? 'blue' : 
                          'default'
                        } 
                        style={{ fontWeight: 'bold' }}
                      >
                        {monthData.month}
                        {isPastMonth && ' (Past)'}
                        {isCurrentMonth && ' (Current)'}
                        {isFutureMonth && ' (Future)'}
                      </Tag>
                      <Checkbox checked={isSelected} disabled={!hasBalance} />
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      Monthly Rate: <Text strong>{fmtMoney(monthData.monthly_rate)}</Text>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      Payment: <Text style={{ color: '#52c41a' }}>{fmtMoney(monthData.payment)}</Text>
                    </div>
                    
                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                      Balance: <Text strong style={{ 
                        color: monthData.balance > 0 ? '#ff4d4f' : '#52c41a' 
                      }}>
                        {fmtMoney(monthData.balance)}
                      </Text>
                    </div>
                    
                    {!hasBalance && (
                      <div style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
                        No balance to pay
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div style={{ marginTop: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '6px' }}>
              <Text strong style={{ color: '#1890ff' }}>
                📋 Selected Summary: {selectedMonths.length} month(s) selected
              </Text>
              {selectedMonths.length > 0 && (
                <>
                  <div style={{ marginTop: '4px' }}>
                    <Text type="secondary">
                      Total Balance: {fmtMoney(
                        selectedMonths.reduce((sum, monthIndex) => {
                          return sum + (selectedVendorForMonthPayment.monthly_balances?.[monthIndex]?.balance || 0);
                        }, 0)
                      )}
                    </Text>
                  </div>
                  {customPaymentAmount && (
                    <div style={{ marginTop: '4px' }}>
                      <Text type="warning">
                        Custom Amount: {fmtMoney(parseFloat(customPaymentAmount) || 0)}
                      </Text>
                    </div>
                  )}
                  {!customPaymentAmount && (
                    <div style={{ marginTop: '4px' }}>
                      <Text type="success">
                        Will Pay: Total Balance
                      </Text>
                    </div>
                  )}
                </>
              )}
              {!orNumber.trim() && (
                <div style={{ marginTop: '4px' }}>
                  <Text type="danger" style={{ fontSize: '12px' }}>
                    ⚠️ Please enter OR number to proceed
                  </Text>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Confirmation Modal */}
      <Modal
        title="Confirm Payment"
        open={confirmationModal}
        onCancel={() => {
          setConfirmationModal(false);
          setPendingPaymentData(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setConfirmationModal(false);
            setPendingPaymentData(null);
          }}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={processingPayment}
            onClick={confirmPayment}
          >
            Confirm Payment
          </Button>
        ]}
        width={600}
      >
        {pendingPaymentData && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Payment Details:</Text>
            </div>
            
            <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text>OR Number:</Text>
                <Text strong>{pendingPaymentData.or_number}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text>Payment Date:</Text>
                <Text strong>{pendingPaymentData.payment_date}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text>Number of Stalls:</Text>
                <Text strong>{pendingPaymentData.rental_ids.length}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Total Amount:</Text>
                <Text strong>{fmtMoney(pendingPaymentData.amounts.reduce((sum, amount) => sum + amount, 0))}</Text>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>Stall Details:</Text>
            </div>
            
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {pendingPaymentData.rental_ids.map((rentalId, index) => {
                const rental = selectedVendor?.rentals?.find(r => r.rental_id === rentalId);
                if (!rental) return null;
                
                return (
                  <div key={rentalId} style={{ 
                    padding: '8px', 
                    marginBottom: '4px', 
                    background: '#fafafa', 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>{rental.section_name} - {rental.stall_number}</Text>
                      <Text strong>{fmtMoney(pendingPaymentData.amounts[index])}</Text>
                    </div>
                    <div style={{ color: '#666', marginTop: '2px' }}>
                      Type: {pendingPaymentData.payment_types[index]}
                    </div>
                  </div>
                );
              })}
            </div>

            <Alert
              message="Please confirm all payment details are correct before proceeding."
              type="warning"
              showIcon
              style={{ marginTop: '16px' }}
            />
          </div>
        )}
      </Modal>

      <style>{`
        .vendor-row-with-balance {
          background-color: #fff2f0;
          border-left: 4px solid #ff4d4f;
        }
        .vendor-row-no-balance {
          background-color: #f6ffed;
          border-left: 4px solid #52c41a;
        }
        .vendor-row-with-balance:hover,
        .vendor-row-no-balance:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default VendorPaymentManagement;
