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
  CloseOutlined,
} from '@ant-design/icons';
import api from '../Api';
import LoadingOverlay from './Loading';
import './VendorPaymentManagement.css';

const { Title, Text } = Typography;
const { Option } = Select;

const VendorPaymentManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [bulkPaymentModal, setBulkPaymentModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedRentals, setSelectedRentals] = useState([]);
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
  const [useDeposit, setUseDeposit] = useState(false);
  const [selectedPaymentForDeposit, setSelectedPaymentForDeposit] = useState(null);
  const [depositConsumptionModal, setDepositConsumptionModal] = useState(false);
  const [customDepositAmount, setCustomDepositAmount] = useState('');
  const [selectedMonthForDeposit, setSelectedMonthForDeposit] = useState(null);
  const [unoccupiedPaymentModal, setUnoccupiedPaymentModal] = useState(false);
  const [selectedUnoccupiedRental, setSelectedUnoccupiedRental] = useState(null);
  const [unoccupiedPaymentAmount, setUnoccupiedPaymentAmount] = useState(0);
  const [unoccupiedOrNumber, setUnoccupiedOrNumber] = useState('');
  const [unoccupiedPaymentDate, setUnoccupiedPaymentDate] = useState(dayjs());
  const [processingUnoccupiedPayment, setProcessingUnoccupiedPayment] = useState(false);
  const [unoccupiedBalanceLoading, setUnoccupiedBalanceLoading] = useState(false);
  const [analysisStallBalances, setAnalysisStallBalances] = useState({});

  useEffect(() => {
    fetchVendors();
    
  }, []);



  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month},${day},${year}`;
  };

  const fetchVendors = async () => {
    setLoading(true);
    try {
      // Add cache-busting parameter
      const response = await api.get('/vendor-payments?t=' + Date.now());
      
      // Check the specific vendor that was updated
      if (selectedVendor) {
        const updatedVendor = response.data.data.find(v => v.id === selectedVendor.id);
        if (updatedVendor) {
          // Calculate the new total deposit
          const newTotalDeposit = getTotalDepositAmount(updatedVendor);
        }
      }
      
      setVendors(response.data.data);
    } catch (error) {
      message.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
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
        fetchVendors({ showLoading: false }); // Refresh data without blocking the screen
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

  const getUnoccupiedRentalGroups = (vendor, balanceOverrides = analysisStallBalances) => {
    const groups = new Map();

    (vendor?.rentals || []).forEach((rental) => {
      const balanceCents = Math.round(Number(rental.remaining_balance || 0) * 100);
      if (!rental.is_unoccupied || balanceCents <= 0) return;

      const sectionName = String(rental.section_name ?? '').trim();
      const stallNumber = String(rental.stall_number ?? '').trim();
      const key = JSON.stringify([sectionName.toLowerCase(), stallNumber.toLowerCase()]);
      const group = groups.get(key) || {
        key,
        section_name: sectionName,
        stall_number: stallNumber,
        rentals: [],
        balanceCents: 0,
      };

      group.rentals.push(rental);
      group.balanceCents += balanceCents;
      groups.set(key, group);
    });

    return Array.from(groups.values())
      .map(({ balanceCents, ...group }) => ({
        ...group,
        remaining_balance: Object.prototype.hasOwnProperty.call(balanceOverrides, group.key)
          ? Number(balanceOverrides[group.key]) || 0
          : balanceCents / 100,
      }))
      .filter(group => group.remaining_balance > 0);
  };

  const openUnoccupiedPayment = async (vendor) => {
    setSelectedVendor(vendor);
    setAnalysisStallBalances({});
    setSelectedUnoccupiedRental(null);
    setUnoccupiedPaymentAmount(0);
    setUnoccupiedOrNumber('');
    setUnoccupiedPaymentDate(dayjs());
    setUnoccupiedPaymentModal(true);
    setUnoccupiedBalanceLoading(true);

    try {
      const response = await api.get(`/vendor-analysis/vendor/${vendor.id}`, {
        params: { year: dayjs().year(), include_payment_details: false },
      });
      const balanceOverrides = {};
      response.data.section_breakdown?.forEach(section => {
        (section.stall_balances || []).forEach(stall => {
          const key = JSON.stringify([
            String(section.section_name ?? '').trim().toLowerCase(),
            String(stall.stall_number ?? '').trim().toLowerCase(),
          ]);
          balanceOverrides[key] = Number(stall.remaining_balance) || 0;
        });
      });
      setAnalysisStallBalances(balanceOverrides);
      const rentalGroups = getUnoccupiedRentalGroups(vendor, balanceOverrides);
      const initialRentalGroup = rentalGroups.length === 1 ? rentalGroups[0] : null;
      setSelectedUnoccupiedRental(initialRentalGroup);
      setUnoccupiedPaymentAmount(Number(initialRentalGroup?.remaining_balance) || 0);
    } catch (error) {
      const rentalGroups = getUnoccupiedRentalGroups(vendor, {});
      const initialRentalGroup = rentalGroups.length === 1 ? rentalGroups[0] : null;
      setSelectedUnoccupiedRental(initialRentalGroup);
      setUnoccupiedPaymentAmount(Number(initialRentalGroup?.remaining_balance) || 0);
      message.warning('Unable to load Vendor Analysis balances. Using saved rental balances instead.');
    } finally {
      setUnoccupiedBalanceLoading(false);
    }
  };

  const handleUnoccupiedPayment = async () => {
    if (!selectedUnoccupiedRental?.rentals?.length || Number(unoccupiedPaymentAmount) <= 0) {
      message.warning('Enter a payment amount greater than zero.');
      return;
    }

    setProcessingUnoccupiedPayment(true);
    try {
      const response = await api.post(
        '/rented/settle-unoccupied-balances',
        {
          rental_ids: selectedUnoccupiedRental.rentals.map(rental => rental.rental_id),
          amount: Number(unoccupiedPaymentAmount),
          or_number: unoccupiedOrNumber.trim() || null,
          payment_date: unoccupiedPaymentDate?.format('YYYY-MM-DD'),
        }
      );
      message.success(response.data.message || 'Payment recorded.');
      setUnoccupiedPaymentModal(false);
      setSelectedUnoccupiedRental(null);
      fetchVendors();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to record payment.');
    } finally {
      setProcessingUnoccupiedPayment(false);
    }
  };

  const handleRentalSelection = (rentalId, checked) => {
    const rental = selectedVendor?.rentals?.find(r => r.rental_id === rentalId);

    if (rental?.is_unoccupied) {
      message.warning('Removed rentals can only be paid through Pay Balance.');
      return;
    }

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
      const eligibleRentals = vendorRentals.filter(rental => !rental.is_unoccupied && !isStallAlreadyPaidWithAdvance(rental));
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

  const detectPaymentType = (amount, balance, dailyRent, paidToday = false, isMonthly = false, monthlyRent = 0) => {
    if (!amount || amount <= 0) return isMonthly ? 'monthly' : 'daily';

    // For monthly stalls, check against monthly rent
    if (isMonthly) {
      if (amount === monthlyRent) return 'monthly';
      if (amount > monthlyRent) return 'advance';
      return 'partial';
    }

    // For daily stalls (existing logic)
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

    const isMonthly = rental.is_monthly || false;
    const monthlyRent = parseFloat(rental.monthly_rent) || 0;

    const paymentType = detectPaymentType(
      amount, 
      rental.remaining_balance || 0, 
      rental.daily_rent || 0,
      rental.paid_today || false,
      isMonthly,
      monthlyRent
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
    const monthlyRent = parseFloat(rental.monthly_rent) || 0;
    const remainingBalance = parseFloat(rental.remaining_balance) || 0;
    const isMonthly = rental.is_monthly || false;

    switch (paymentType) {
      case 'monthly':
        // Monthly payment: use monthly rent
        amount = monthlyRent;
        break;
      case 'daily':
        // Daily payment: only pay for today, don't deduct missed days
        amount = dailyRent;
        break;
      case 'fully paid':
        // Fully paid: cover missed days + pay today (if not already paid today)
        amount = remainingBalance + (paidToday ? 0 : dailyRent);
        break;
      case 'partial':
        // Keep current amount or set to default (daily rent or monthly rent)
        const currentAmount = paymentForm.getFieldValue([`amount_${rentalId}`]);
        amount = currentAmount ? parseFloat(currentAmount) : (isMonthly ? monthlyRent : dailyRent);
        break;
      case 'advance':
        if (isMonthly) {
          // For monthly stalls: monthly rent + advance
          amount = monthlyRent + (monthlyRent || 0); // Add one month as advance
        } else {
          // For daily stalls: today's due + balance + 1 day advance (daily rent)
          // If already paid today: balance + 1 day advance
          amount = paidToday ? (remainingBalance + dailyRent) : (dailyRent + remainingBalance + dailyRent);
        }
        break;
      default:
        amount = isMonthly ? monthlyRent : dailyRent;
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

    // Check if this is a monthly stall
    const isMonthly = rental.is_monthly || false;
    const monthlyRent = parseFloat(rental.monthly_rent) || 0;

    // If in bulk mode, use the divided amount instead of form value
    let amount = 0;
    let paymentType = isMonthly ? 'monthly' : 'daily';
    
    if (bulkPaymentMode && bulkPaymentData.amount > 0) {
      // Check if this is a daily/monthly payment scenario
      const dailyRent = parseFloat(rental.daily_rent || 0);
      const missedAmount = parseFloat(rental.remaining_balance || 0) || (parseFloat(rental.missed_days || 0) * dailyRent);
      
      if (isMonthly) {
        // For monthly stalls, use monthly rent
        if (bulkPaymentData.paymentType === 'monthly' || bulkPaymentData.paymentType === 'daily') {
          amount = monthlyRent;
          paymentType = 'monthly';
        } else {
          // For other payment types, divide the total amount with rounding adjustment
          const rentalIndex = selectedRentals.indexOf(rentalId);
          const baseAmount = bulkPaymentData.amount / selectedRentals.length;
          const roundedBaseAmount = Math.round(baseAmount * 100) / 100;
          
          // Calculate total rounding error
          const totalRoundedAmount = roundedBaseAmount * selectedRentals.length;
          const roundingError = Math.round((bulkPaymentData.amount - totalRoundedAmount) * 100) / 100;
          
          // Apply rounding adjustment to the last stall
          amount = rentalIndex === selectedRentals.length - 1 ? 
            Math.round((roundedBaseAmount + roundingError) * 100) / 100 : 
            roundedBaseAmount;
          
          // Determine payment type for monthly stall
          const tolerance = 0.01;
          if (Math.abs(amount - monthlyRent) <= tolerance) {
            paymentType = 'monthly';
          } else if (amount > monthlyRent + tolerance) {
            paymentType = 'advance';
          } else {
            paymentType = 'partial';
          }
        }
      } else {
        // For daily stalls (existing logic)
        if (bulkPaymentData.paymentType === 'daily') {
          amount = dailyRent;
          paymentType = 'daily';
        } else {
          // For other payment types, divide the total amount with rounding adjustment
          const rentalIndex = selectedRentals.indexOf(rentalId);
          const baseAmount = bulkPaymentData.amount / selectedRentals.length;
          const roundedBaseAmount = Math.round(baseAmount * 100) / 100;
          
          // Calculate total rounding error
          const totalRoundedAmount = roundedBaseAmount * selectedRentals.length;
          const roundingError = Math.round((bulkPaymentData.amount - totalRoundedAmount) * 100) / 100;
          
          // Apply rounding adjustment to the last stall
          amount = rentalIndex === selectedRentals.length - 1 ? 
            Math.round((roundedBaseAmount + roundingError) * 100) / 100 : 
            roundedBaseAmount;
          
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
      }
    } else {
      // Use form values when not in bulk mode
      amount = parseFloat(paymentForm.getFieldValue([`amount_${rentalId}`]) || 0);
      paymentType = paymentForm.getFieldValue([`payment_type_${rentalId}`]) || (isMonthly ? 'monthly' : 'daily');
    }

    // Calculate remaining balance from missed days * daily rent if no remaining_balance data
    const remainingBalance = rental.remaining_balance !== null && rental.remaining_balance !== undefined
      ? parseFloat(rental.remaining_balance)
      : (parseFloat(rental.missed_days || 0) * parseFloat(rental.daily_rent || 0));

    const dailyRent = parseFloat(rental.daily_rent || 0);

    let missedDaysCovered = 0;
    let advanceDays = 0;
    let newRemainingBalance = remainingBalance;
    let monthlyStatus = '';

    if (amount > 0) {
      if (isMonthly) {
        // Monthly stall logic
        if (paymentType === 'monthly') {
          monthlyStatus = 'Monthly payment processed';
          newRemainingBalance = 0;
        } else if (paymentType === 'partial') {
          monthlyStatus = `Partial monthly payment: ${fmtMoney(amount)} of ${fmtMoney(monthlyRent)}`;
          newRemainingBalance = Math.max(0, monthlyRent - amount);
        } else if (paymentType === 'advance') {
          const extraMonths = Math.floor((amount - monthlyRent) / monthlyRent);
          advanceDays = extraMonths * 30; // Approximate days for display
          monthlyStatus = `Monthly payment + ${extraMonths} month(s) advance`;
          newRemainingBalance = 0;
        }
        missedDaysCovered = 'N/A (Monthly)';
      } else {
        // Daily stall logic (existing logic)
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
    }

    // Determine if today's due is paid based on payment type
    let paidTodayStatus = rental.paid_today || false;
    if (paymentType === 'daily' || paymentType === 'fully paid' || paymentType === 'advance' || paymentType === 'monthly') {
      paidTodayStatus = true;
    }

    return {
      totalRemainingBalance: remainingBalance,
      missedDaysCovered: isMonthly ? monthlyStatus : (paymentType === 'daily' ? '0 days (today only)' : `${missedDaysCovered}/${rental.missed_days || 0} days`),
      paidToday: paidTodayStatus,
      amountEntered: amount,
      remainingBalance: newRemainingBalance,
      advanceDays,
      paymentType,
      dailyRent,
      monthlyRent: isMonthly ? monthlyRent : null,
      isMonthly
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
    // Prevent enabling bulk mode if less than 2 stalls are selected
    if (enabled && selectedRentals.length <= 1) {
      return;
    }
    
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

  // Auto-disable bulk mode when selected rentals changes to 1 or less
  useEffect(() => {
    if (selectedRentals.length <= 1 && bulkPaymentMode) {
      setBulkPaymentMode(false);
    }
  }, [selectedRentals.length, bulkPaymentMode]);

  // Auto-divide when bulk payment amount changes
  useEffect(() => {
    if (bulkPaymentMode && bulkPaymentData.amount > 0 && selectedRentals.length > 1) {
      // Check if entered amount equals total daily rent
      const summary = calculateBulkPaymentSummary();
      const isTotalDailyRent = summary && Math.abs(bulkPaymentData.amount - summary.totalDailyRent) <= 0.01;
      
      if (isTotalDailyRent) {
        // Update bulk payment data to reflect daily payment type
        setBulkPaymentData(prev => ({ ...prev, paymentType: 'daily' }));
        
        selectedRentals.forEach(rentalId => {
          const rental = selectedVendor?.rentals?.find(r => r.rental_id === rentalId);
          if (!rental) return;
          
          const dailyRent = parseFloat(rental.daily_rent || 0);
          
          paymentForm.setFieldsValue({
            [`amount_${rentalId}`]: dailyRent,
            [`payment_type_${rentalId}`]: 'daily'
          });
        });
      } else {
        // Divide the amount among all selected stalls with rounding adjustment
        const baseAmount = bulkPaymentData.amount / selectedRentals.length;
        const roundedBaseAmount = Math.round(baseAmount * 100) / 100;
        
        // Calculate total rounding error
        const totalRoundedAmount = roundedBaseAmount * selectedRentals.length;
        const roundingError = Math.round((bulkPaymentData.amount - totalRoundedAmount) * 100) / 100;
        
        // Determine the most common payment type to update bulk payment data
        const paymentTypeCounts = {};
        
        selectedRentals.forEach((rentalId, index) => {
          // Determine payment type based on actual amount for this stall
          const rental = selectedVendor?.rentals?.find(r => r.rental_id === rentalId);
          if (!rental) return;
          
          const dailyRent = parseFloat(rental.daily_rent || 0);
          const missedAmount = parseFloat(rental.remaining_balance || 0) || (parseFloat(rental.missed_days || 0) * dailyRent);
          
          // Calculate actual amount for this stall (with rounding adjustment for last stall)
          const actualAmount = index === selectedRentals.length - 1 ? 
            Math.round((roundedBaseAmount + roundingError) * 100) / 100 : 
            roundedBaseAmount;
          
          // Auto-determine payment type based on actual amount
          let paymentType = 'partial';
          // Use tolerance for floating point comparison
          const tolerance = 0.01;
          
          if (Math.abs(actualAmount - dailyRent) <= tolerance) {
            paymentType = 'daily';
          } else if (actualAmount > missedAmount + (rental.paid_today ? 0 : dailyRent) + dailyRent + tolerance) {
            paymentType = 'advance';
          } else if (actualAmount >= missedAmount + (rental.paid_today ? 0 : dailyRent) - tolerance) {
            paymentType = 'fully paid';
          }

          paymentTypeCounts[paymentType] = (paymentTypeCounts[paymentType] || 0) + 1;

          paymentForm.setFieldsValue({
            [`amount_${rentalId}`]: actualAmount,
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
        if (bulkPaymentData.paymentType === 'daily') {
          // For daily payments, use individual stall's daily rent
          amounts = selectedRentals.map(rentalId => {
            const rental = selectedVendor?.rentals?.find(r => r.rental_id === rentalId);
            if (!rental) return 0;
            const dailyRent = parseFloat(rental.daily_rent || 0);
            return Math.round(dailyRent * 100) / 100;
          });
        } else {
          // For other payment types, divide the total amount with rounding adjustment
          const baseAmount = bulkPaymentData.amount / selectedRentals.length;
          const roundedBaseAmount = Math.round(baseAmount * 100) / 100;
          
          // Calculate total rounding error
          const totalRoundedAmount = roundedBaseAmount * selectedRentals.length;
          const roundingError = Math.round((bulkPaymentData.amount - totalRoundedAmount) * 100) / 100;
          
          amounts = selectedRentals.map((rentalId, index) => {
            // Add the rounding error to the last stall
            if (index === selectedRentals.length - 1) {
              return Math.round((roundedBaseAmount + roundingError) * 100) / 100;
            }
            return roundedBaseAmount;
          });
        }
        
        // Determine payment types based on calculated amounts
        paymentTypes = selectedRentals.map((rentalId, index) => {
          const rental = selectedVendor?.rentals?.find(r => r.rental_id === rentalId);
          if (!rental) return 'daily';
          
          const dailyRent = parseFloat(rental.daily_rent || 0);
          const missedAmount = parseFloat(rental.remaining_balance || 0) || (parseFloat(rental.missed_days || 0) * dailyRent);
          
          // If bulk payment type is daily, return daily
          if (bulkPaymentData.paymentType === 'daily') {
            return 'daily';
          } else {
            // For other payment types, determine based on actual calculated amount
            const amount = amounts[index];
            
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
      const endpoint = useDeposit && selectedPaymentForDeposit 
        ? `/vendor-payments/consume-deposit/${selectedVendor.id}`
        : `/vendor-payments/bulk/${selectedVendor.id}`;
      
      const payload = useDeposit && selectedPaymentForDeposit
        ? {
            ...pendingPaymentData,
            payment_id: selectedPaymentForDeposit.id,
            consume_deposit: true
          }
        : pendingPaymentData;

      await api.post(endpoint, payload);
      message.success(useDeposit ? 'Deposit consumed successfully' : 'Bulk payment processed successfully');
      setConfirmationModal(false);
      setBulkPaymentModal(false);
      setOrNumber('');
      setPaymentDate(dayjs());
      setUseDeposit(false);
      setSelectedPaymentForDeposit(null);
      fetchVendors({ showLoading: false });
    } catch (error) {
      console.error('Payment error:', error);
      message.error(error.response?.data?.message || 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
      setPendingPaymentData(null);
    }
  };

  const handleDepositConsumption = (vendor) => {
    setSelectedVendor(vendor);
    setDepositConsumptionModal(true);
    setSelectedMonthForDeposit(null);
    setSelectedPaymentForDeposit(null);
    setUseDeposit(true);
    setCustomDepositAmount('');
  };

  const getTotalDepositAmount = (vendor) => {
    const monthlyBalances = vendor.monthly_balances || [];
    return monthlyBalances.reduce((sum, month) => {
      const deposit = month.deposit || 0; // Use backend-provided deposit
      return sum + deposit;
    }, 0);
  };

  const getAvailableMonthsForDeposit = (vendor) => {
    // Use vendor-level monthly balances instead of calculating from individual rentals
    const monthsWithDeposits = [];
    
    // Get vendor monthly balances directly (already calculated correctly at backend)
    const vendorMonthlyBalances = vendor.monthly_balances || [];
    
    vendorMonthlyBalances.forEach((monthBalance, monthIndex) => {
      // Only add months that have deposits
      if (monthBalance.deposit > 0) {
        monthsWithDeposits.push({
          monthIndex: monthIndex,
          month: monthBalance.month,
          totalDeposit: monthBalance.deposit, // Use backend-calculated deposit
          monthlyRate: monthBalance.monthly_rate,
          totalPayments: monthBalance.payment
        });
      }
    });
    
    return monthsWithDeposits;
  };

  const getAvailablePaymentsForDeposit = (vendor) => {
    const paymentsByMonth = new Map();
    vendor.rentals?.forEach(rental => {
      (rental.monthly_balances || []).forEach((monthBalance, monthIndex) => {
        if (monthBalance.payment_id && !paymentsByMonth.has(monthIndex)) {
          paymentsByMonth.set(monthIndex, {
            payment_id: monthBalance.payment_id,
            monthIndex,
          });
        }
      });
    });

    return Array.from(paymentsByMonth.values());
  };

  // Memoized calculations for better performance
  const filteredVendors = useMemo(() => {
    if (!searchText) return vendors;

    return vendors.filter(vendor => {
      const name = (vendor.name || '').toLowerCase();
      const contactNumber = (vendor.contact_number || '').toLowerCase();
      const searchLower = searchText.toLowerCase();

      return name.includes(searchLower) ||
        contactNumber.includes(searchLower);
    });
  }, [vendors, searchText]);

  const stats = useMemo(() => {
    const totalVendors = vendors.length;
    const currentMonth = new Date().getMonth();
    
    // Calculate current month total balance
    const currentMonthBalance = vendors.reduce((sum, vendor) => {
      const monthlyBalances = vendor.monthly_balances || [];
      return sum + (monthlyBalances[currentMonth]?.balance || 0);
    }, 0);
    
    // Calculate year-to-date total balance
    const ytdBalance = vendors.reduce((sum, vendor) => {
      const monthlyBalances = vendor.monthly_balances || [];
      return sum + monthlyBalances
        .slice(0, currentMonth + 1)
        .reduce((monthSum, month) => monthSum + (month.balance || 0), 0);
    }, 0);
    
    const vendorsWithCurrentMonthBalance = vendors.filter(vendor => {
      const monthlyBalances = vendor.monthly_balances || [];
      return (monthlyBalances[currentMonth]?.balance || 0) > 0;
    }).length;

    return { 
      totalVendors, 
      currentMonthBalance, 
      ytdBalance, 
      vendorsWithCurrentMonthBalance 
    };
  }, [vendors]);

  const getPaymentTypeColor = (type) => {
    const colors = {
      'daily': 'blue',
      'partial': 'orange',
      'fully paid': 'green',
      'advance': 'purple',
      'monthly': 'cyan',
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
        const seenRentalKeys = new Set();
        const uniqueRentals = rentals.filter((rental) => {
          const rentalKey = JSON.stringify([
            String(rental.section_name ?? '').trim().toLowerCase(),
            String(rental.stall_number ?? '').trim().toLowerCase(),
          ]);

          if (seenRentalKeys.has(rentalKey)) return false;
          seenRentalKeys.add(rentalKey);
          return true;
        });

        return (
          <div>
            {uniqueRentals.map((rental, index) => (
              <Space key={index} size={4} wrap>
                <Tag className="stall-tag">
                  {rental.section_name} - {rental.stall_number}
                  {rental.is_unoccupied ? ' (Removed)' : ''}
                </Tag>
              </Space>
            ))}
          </div>
        );
      },
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarOutlined style={{ color: '#52c41a' }} />
          <span>Active Stalls</span>
        </div>
      ),
      dataIndex: 'total_stalls',
      key: 'total_stalls',
      render: (count) => (
        <div style={{ textAlign: 'center' }}>
          <Badge
            count={count}
            showZero
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
          <ExclamationCircleOutlined style={{ color: '#c58a2a' }} />
          <span>Balance Due</span>
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
            <Text strong className={currentMonthBalance > 0 ? 'balance-value-due' : 'balance-value-clear'}>
              Due this month: {fmtMoney(currentMonthBalance)}
            </Text>
            <br />
            <Text type="secondary" className="balance-period-note">
              Year-to-date due: {fmtMoney(totalBalanceUpToCurrentMonth)}
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
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MoneyCollectOutlined style={{ color: '#52c41a' }} />
          <span>Available Deposit</span>
        </div>
      ),
      dataIndex: 'total_deposit',
      key: 'total_deposit',
      render: (_, record) => {
        // Calculate total deposit from monthly balances (use backend-provided deposit values)
        const monthlyBalances = record.monthly_balances || [];
        const totalDeposit = monthlyBalances.reduce((sum, month) => {
          const deposit = month.deposit || 0; // Use backend-provided deposit
          return sum + deposit;
        }, 0);

        return (
          <div>
            <Text strong style={{ color: totalDeposit > 0 ? '#52c41a' : '#8c8c8c' }}>
              {fmtMoney(totalDeposit)}
            </Text>
            {totalDeposit > 0 && (
              <div>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  Available for consumption
                </Text>
              </div>
            )}
          </div>
        );
      },
      sorter: (a, b) => {
        const depositA = (a.monthly_balances || []).reduce((sum, month) => (month.deposit || 0) + sum, 0);
        const depositB = (b.monthly_balances || []).reduce((sum, month) => (month.deposit || 0) + sum, 0);
        return depositA - depositB;
      },
    },
    {
      title: 'Paid Today',
      dataIndex: 'paid_today_count',
      key: 'paid_today_count',
      render: (count, record) => {
        return (
          <div>
            <Tag color={count > 0 ? 'green' : 'default'} className="paid-today-tag">
              {count} of {record.total_stalls} paid
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
        const removedRentals = (record.rentals || []).filter(rental => rental.is_unoccupied);
        const hasActiveRentals = (record.rentals || []).some(rental => !rental.is_unoccupied);
        const isRemovedVendor = record.status && record.status !== 'active';
        const showRemovedBalanceAction = removedRentals.length > 0 || isRemovedVendor;
        const rentalsWithBalance = removedRentals.filter(rental => Number(rental.remaining_balance) > 0);

        if (showRemovedBalanceAction && !hasActiveRentals) {
          return (
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Tooltip title={rentalsWithBalance.length > 0 ? 'Choose a removed section and stall to pay' : 'No removed rental balance is available to pay'}>
                <Button
                  className="removed-balance-button"
                  size="small"
                  type="primary"
                  icon={<DollarOutlined />}
                  disabled={rentalsWithBalance.length === 0}
                  aria-label={`Pay removed rental balance for ${record.name || 'vendor'}`}
                  onClick={() => openUnoccupiedPayment(record)}
                >
                  Pay Balance
                </Button>
              </Tooltip>
            </div>
          );
        }

        // Check if vendor has any balances (current or past)
        const hasAnyBalance = record.monthly_balances?.some(month => month.balance > 0) || false;
        
        return (
          <Space>
            {showRemovedBalanceAction && (
              <Tooltip title={rentalsWithBalance.length > 0 ? 'Choose a removed section and stall to pay' : 'No removed rental balance is available to pay'}>
                <Button
                  className="removed-balance-button compact"
                  size="small"
                  type="primary"
                  icon={<DollarOutlined />}
                  disabled={rentalsWithBalance.length === 0}
                  aria-label={`Pay removed rental balance for ${record.name || 'vendor'}`}
                  onClick={() => openUnoccupiedPayment(record)}
                />
              </Tooltip>
            )}
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
            <Tooltip title="Pay Now">
              <Button
                className="action-button black"
                icon={<BankOutlined />}
                size="small"
                onClick={() => handleBulkPayment(record)}
                disabled={record.paid_today_count === record.total_stalls}
              />
            </Tooltip>
            <Tooltip title="Consume Deposit">
              <Button
                className="action-button black"
                icon={<MoneyCollectOutlined />}
                size="small"
                onClick={() => handleDepositConsumption(record)}
                disabled={getTotalDepositAmount(record) <= 0}
                type={getTotalDepositAmount(record) > 0 ? "primary" : "default"}
                style={{
                  backgroundColor: getTotalDepositAmount(record) > 0 ? '#52c41a' : undefined,
                  borderColor: getTotalDepositAmount(record) > 0 ? '#52c41a' : undefined
                }}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  if (initialLoading) {
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
              Review balances, payments, and available deposits for {new Date().getFullYear()}
            </Text>
          </div>
        </div>
        <div className="vendor-header-actions">
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchVendors}
            loading={loading}
            className="header-refresh-button"
            aria-label="Refresh vendor payment data"
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
          <div className="vendor-table-heading">
            <div className="vendor-table-title-icon">
              <BankOutlined />
            </div>
            <div className="vendor-table-heading-copy">
              <div className="vendor-table-title">Vendor Payment Register</div>
              <Text className="vendor-table-description">
                Stall assignments, balances, and available deposits
              </Text>
            </div>
          </div>
          <div className="vendor-search-container">
            <Input
              className="vendor-search-input"
              placeholder="Search vendor name or contact number..."
              prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
              aria-label="Search vendor name or contact number"
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
          locale={{
            emptyText: searchText ? 'No vendors match your search.' : 'No vendor payment accounts found.'
          }}
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



      {/* Bulk Payment Modal */}
      <Modal
        title={
          <div className="vendor-modal-title">
            <BankOutlined />
            <span>Record Payment{selectedVendor?.name ? ` · ${selectedVendor.name}` : ''}</span>
          </div>
        }
        open={bulkPaymentModal}
        onCancel={() => setBulkPaymentModal(false)}
        footer={null}
        width={900}
        centered
        closeIcon={<CloseOutlined />}
        styles={{
          mask: {
            backgroundColor: 'rgba(20, 33, 61, 0.58)',
            backdropFilter: 'blur(6px)',
          },
        }}
        className="vendor-modal bulk-payment-modal"
      >
        <Form
          form={paymentForm}
          onFinish={handleBulkPaymentSubmit}
          layout="vertical"
          className="bulk-payment-form"
        >
          <Alert
            message="Select stalls and enter payment details"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <div className="payment-meta-grid">
            <div>
              <Text strong className="vendor-modal-field-label">OR Number *</Text>
              <Input
                placeholder="Enter Official Receipt Number"
                value={orNumber}
                onChange={(e) => setOrNumber(e.target.value)}
                maxLength={50}
              />
            </div>
            <div>
              <Text strong className="vendor-modal-field-label">Payment Date *</Text>
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
          <div className="bulk-payment-controls">
            <div className="bulk-payment-controls-header">
              <Text strong>Bulk Payment</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Checkbox
                  checked={bulkPaymentMode}
                  onChange={(e) => handleBulkPaymentMode(e.target.checked)}
                  disabled={selectedRentals.length <= 1}
                >
                  Enable bulk mode
                </Checkbox>
                {selectedRentals.length <= 1 && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    (Select 2+ stalls)
                  </Text>
                )}
              </div>
            </div>

              {bulkPaymentMode && (
                <div className="bulk-payment-control-fields">
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
                  checked={selectedRentals.length > 0 && selectedRentals.length === selectedVendor?.rentals?.filter(r => !r.is_unoccupied && !isStallAlreadyPaidWithAdvance(r))?.length}
              indeterminate={
                selectedRentals.length > 0 && selectedRentals.length < selectedVendor?.rentals?.filter(r => !r.is_unoccupied && !isStallAlreadyPaidWithAdvance(r))?.length
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
                className={`payment-rental-option${selectedRentals.includes(rental.rental_id) ? ' is-selected' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <Checkbox
                    checked={selectedRentals.includes(rental.rental_id)}
                    onChange={(e) => handleRentalSelection(rental.rental_id, e.target.checked)}
                    disabled={rental.is_unoccupied || isStallAlreadyPaidWithAdvance(rental)}
                  />
                  <div style={{ marginLeft: '12px', flex: 1 }}>
                    <Text strong>{rental.section_name} - {rental.stall_number}</Text>
                    <div style={{ marginTop: '4px' }}>
                      <Tag color={getStatusColor(rental.status)} style={{ borderRadius: '4px' }}>
                        {rental.is_unoccupied ? 'Removed' : rental.status}
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
                        value={paymentForm.getFieldValue([`payment_type_${rental.rental_id}`]) || (rental.is_monthly ? 'monthly' : 'daily')}
                        onChange={(e) => handlePaymentTypeChange(rental.rental_id, e.target.value)}
                        disabled={bulkPaymentMode}
                        size="small"
                      >
                        {rental.is_monthly ? (
                          <>
                            <Radio.Button value="monthly">Monthly</Radio.Button>
                            <Radio.Button value="partial">Partial</Radio.Button>
                            <Radio.Button value="advance">Advance</Radio.Button>
                          </>
                        ) : (
                          <>
                            <Radio.Button value="daily">Daily</Radio.Button>
                            <Radio.Button value="partial">Partial</Radio.Button>
                            <Radio.Button value="fully paid">Full</Radio.Button>
                            <Radio.Button value="advance">Advance</Radio.Button>
                          </>
                        )}
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
                        {rental.is_monthly ? (
                          <Button
                            size="small"
                            block
                            onClick={() => {
                              const amount = Math.round(parseFloat(rental.monthly_rent) * 100) / 100;
                              handleAmountChange(rental.rental_id, amount);
                              handlePaymentTypeChange(rental.rental_id, 'monthly');
                            }}
                            disabled={bulkPaymentMode}
                            style={{ 
                              fontSize: '11px',
                              padding: '4px 8px',
                              height: 'auto',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            Monthly ({fmtMoney(rental.monthly_rent)})
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            block
                            onClick={() => {
                              const amount = Math.round(parseFloat(rental.daily_rent) * 100) / 100;
                              handleAmountChange(rental.rental_id, amount);
                            }}
                            disabled={bulkPaymentMode}
                            style={{ 
                              fontSize: '11px',
                              padding: '4px 8px',
                              height: 'auto',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            Daily ({fmtMoney(rental.daily_rent)})
                          </Button>
                        )}
                        {(rental.monthly_balances?.[new Date().getMonth()]?.balance || 0) > 0 && !rental.is_monthly && (
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
                            style={{ 
                              fontSize: '11px',
                              padding: '4px 8px',
                              height: 'auto',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
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
                            style={{ 
                              fontSize: '11px',
                              padding: '4px 8px',
                              height: 'auto',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            Balance ({fmtMoney(rental.monthly_balances?.[new Date().getMonth()]?.balance || 0)})
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

      <Modal
        title={
          <div className="vendor-modal-title">
            <DollarOutlined />
            <span>Pay Removed Rental Balance</span>
          </div>
        }
        open={unoccupiedPaymentModal}
        onCancel={() => {
          setUnoccupiedPaymentModal(false);
          setSelectedUnoccupiedRental(null);
        }}
        onOk={handleUnoccupiedPayment}
        confirmLoading={processingUnoccupiedPayment}
        okText="Record Payment"
        okButtonProps={{ disabled: !selectedUnoccupiedRental || Number(unoccupiedPaymentAmount) <= 0 }}
        destroyOnClose
        centered
        width={560}
        closeIcon={<CloseOutlined />}
        className="vendor-modal removed-payment-modal"
      >
        {selectedVendor && (
          <Space direction="vertical" size="middle" className="removed-payment-form">
            <div style={{ width: '100%' }}>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>Section & Stall</Text>
              <Select
                aria-label="Select removed section and stall to pay"
                placeholder="Select a removed stall with a balance"
                value={selectedUnoccupiedRental?.key}
                loading={unoccupiedBalanceLoading}
                disabled={unoccupiedBalanceLoading}
                options={getUnoccupiedRentalGroups(selectedVendor).map(rentalGroup => ({
                    value: rentalGroup.key,
                    label: `${rentalGroup.section_name} - ${rentalGroup.stall_number} · ${fmtMoney(rentalGroup.remaining_balance)} due`,
                  }))}
                style={{ width: '100%' }}
                onChange={(rentalGroupKey) => {
                  const rentalGroup = getUnoccupiedRentalGroups(selectedVendor)
                    .find(group => group.key === rentalGroupKey);
                  setSelectedUnoccupiedRental(rentalGroup || null);
                  setUnoccupiedPaymentAmount(Number(rentalGroup?.remaining_balance) || 0);
                }}
              />
            </div>
            {selectedUnoccupiedRental && (
              <>
                <Alert
                  type="info"
                  showIcon
                  message={`Remaining balance: ${fmtMoney(selectedUnoccupiedRental.remaining_balance)}`}
                  description="This payment will be recorded against the removed rental. Its exit date and stall status will not change."
                />
            <div>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>Amount</Text>
              <InputNumber
                aria-label="Removed rental payment amount"
                min={0.01}
                max={Number(selectedUnoccupiedRental.remaining_balance)}
                precision={2}
                value={unoccupiedPaymentAmount}
                onChange={(value) => setUnoccupiedPaymentAmount(value ?? 0)}
                formatter={(value) => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/₱\s?|(,*)/g, '')}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>Payment Date</Text>
              <DatePicker
                value={unoccupiedPaymentDate}
                onChange={setUnoccupiedPaymentDate}
                format="MMMM D, YYYY"
                disabledDate={(current) => current && current > dayjs().endOf('day')}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>OR Number (optional)</Text>
              <Input
                inputMode="numeric"
                value={unoccupiedOrNumber}
                onChange={(event) => setUnoccupiedOrNumber(event.target.value.replace(/\D/g, ''))}
                maxLength={19}
                placeholder="Enter receipt number"
              />
            </div>
              </>
            )}
          </Space>
        )}
      </Modal>

      {/* Monthly Breakdown Modal */}
      <Modal
        title={
          <div className="vendor-modal-title">
            <CalendarOutlined />
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
        centered
        closeIcon={<CloseOutlined />}
        styles={{
          mask: {
            backgroundColor: 'rgba(20, 33, 61, 0.58)',
            backdropFilter: 'blur(6px)',
          },
        }}
        className="vendor-modal monthly-breakdown-modal"
      >
        {selectedVendorForBreakdown && (
          <div>
            <div className="modal-intro">
              <Text type="secondary">
                Monthly balance calculation: (Daily Rent × Days in Month) - Payments Made
              </Text>
            </div>
            
            <Table
              className="modal-data-table"
              dataSource={selectedVendorForBreakdown.monthly_balances || []}
              rowKey={(record, index) => index}
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
          <div className="vendor-modal-title">
            <CalendarTwoTone />
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
        centered
        closeIcon={<CloseOutlined />}
        styles={{
          mask: {
            backgroundColor: 'rgba(20, 33, 61, 0.58)',
            backdropFilter: 'blur(6px)',
          },
        }}
        className="vendor-modal month-selection-modal"
      >
        {selectedVendorForMonthPayment && (
          <div className="month-selection-content">
            <div className="modal-intro">
              <Text type="secondary">
                Select the months you want to pay the balance for. You can choose multiple months.
              </Text>
            </div>
            
            {/* OR Number, Payment Date, and Custom Amount */}
            <div className="payment-meta-grid">
              <div>
                <Text strong className="vendor-modal-field-label">OR Number *</Text>
                <Input
                  placeholder="Enter Official Receipt Number"
                  value={orNumber}
                  onChange={(e) => setOrNumber(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div>
                <Text strong className="vendor-modal-field-label">Payment Date *</Text>
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
            
            <div className="custom-payment-amount-field">
              <Text strong className="vendor-modal-field-label">Custom Payment Amount (Optional)</Text>
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
            
            <div className="month-selection-grid">
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
                    className={`month-selection-option${isSelected ? ' is-selected' : ''}${hasBalance ? ' has-balance' : ' no-balance'}`}
                    role="checkbox"
                    tabIndex={hasBalance ? 0 : -1}
                    aria-checked={isSelected}
                    aria-disabled={!hasBalance}
                    onClick={() => hasBalance && handleMonthSelection(index)}
                    onKeyDown={(event) => {
                      if (hasBalance && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault();
                        handleMonthSelection(index);
                      }
                    }}
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
            
            <div className="month-selection-summary">
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
        title={
          <div className="vendor-modal-title">
            <CheckCircleOutlined />
            <span>Confirm Payment</span>
          </div>
        }
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
        centered
        closeIcon={<CloseOutlined />}
        styles={{
          mask: {
            backgroundColor: 'rgba(20, 33, 61, 0.58)',
            backdropFilter: 'blur(6px)',
          },
        }}
        className="vendor-modal payment-confirmation-modal"
      >
        {pendingPaymentData && (
          <div className="payment-confirmation-content">
            <Text strong className="modal-section-heading">Payment details</Text>
            
            <div className="confirmation-summary">
              <div className="confirmation-summary-row">
                <Text>OR Number:</Text>
                <Text strong>{pendingPaymentData.or_number}</Text>
              </div>
              <div className="confirmation-summary-row">
                <Text>Payment Date:</Text>
                <Text strong>
                  {pendingPaymentData.payment_date ? 
                    new Date(pendingPaymentData.payment_date).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    }) : 
                    'N/A'
                  }
                </Text>
              </div>
              <div className="confirmation-summary-row">
                <Text>Number of Stalls:</Text>
                <Text strong>{pendingPaymentData.rental_ids.length}</Text>
              </div>
              <div className="confirmation-summary-row">
                <Text>Total Amount:</Text>
                <Text strong>{fmtMoney(pendingPaymentData.amounts.reduce((sum, amount) => sum + amount, 0))}</Text>
              </div>
            </div>

            <Text strong className="modal-section-heading">Stall details</Text>
            
            <div className="confirmation-stall-list">
              {pendingPaymentData.rental_ids.map((rentalId, index) => {
                const rental = selectedVendor?.rentals?.find(r => r.rental_id === rentalId);
                if (!rental) return null;
                
                return (
                  <div key={rentalId} className="confirmation-stall-item">
                    <div className="confirmation-summary-row">
                      <Text>{rental.section_name} - {rental.stall_number}</Text>
                      <Text strong>{fmtMoney(pendingPaymentData.amounts[index])}</Text>
                    </div>
                    <div className="confirmation-stall-type">
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

      {/* Deposit Consumption Modal */}
      <Modal
        title={
          <div className="vendor-modal-title">
            <MoneyCollectOutlined />
            <span>Consume Deposit - {selectedVendor?.name}</span>
          </div>
        }
        open={depositConsumptionModal}
        onCancel={() => {
          setDepositConsumptionModal(false);
          setSelectedPaymentForDeposit(null);
          setUseDeposit(false);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setDepositConsumptionModal(false);
            setSelectedPaymentForDeposit(null);
            setUseDeposit(false);
            setSelectedRentals([]);
            setOrNumber('');
          }}>
            Cancel
          </Button>,
          <Button
            key="consume"
            type="primary"
            loading={processingPayment}
            disabled={!selectedMonthForDeposit || !orNumber.trim() || selectedRentals.length === 0}
            onClick={async () => {
         
              if (!selectedMonthForDeposit) {
                message.error('Please select a month with deposit to consume');
                return;
              }
              if (!orNumber.trim()) {
                message.error('Please enter an OR number');
                return;
              }
              if (selectedRentals.length === 0) {
                message.error('Please select at least one stall to apply deposit to');
                return;
              }

              // Process deposit consumption
              setProcessingPayment(true);
              try {
                
                // Determine the amount to consume - ensure precise decimal handling
                const totalAmountToConsume = customDepositAmount ? 
                  Math.round(parseFloat(customDepositAmount) * 100) / 100 : 
                  Math.round(selectedMonthForDeposit.totalDeposit * 100) / 100;

                // Divide the amount equally among the selected stalls
                const amountPerStall = Math.round((totalAmountToConsume / selectedRentals.length) * 100) / 100;
                
                console.log('After rounding - totalAmountToConsume:', totalAmountToConsume);
                console.log('After division - amountPerStall:', amountPerStall);
                console.log('Number of selected stalls:', selectedRentals.length);
                console.log('Selected rental IDs:', selectedRentals);
                console.log('Selected month:', selectedMonthForDeposit.month);
                console.log('Payment data custom_amount:', totalAmountToConsume);
                console.log('Payment data amounts array:', selectedRentals.map(() => amountPerStall));
                
                // Calculate and log remaining deposit
                const remainingDeposit = selectedMonthForDeposit.totalDeposit - totalAmountToConsume;
                console.log('=== DEPOSIT CALCULATION ===');
                console.log('Original deposit amount:', selectedMonthForDeposit.totalDeposit);
                console.log('Amount to consume:', totalAmountToConsume);
                console.log('Expected remaining deposit:', remainingDeposit);
                console.log('============================');
                

                // Find a payment from the selected month to use as the source
                const availablePayments = getAvailablePaymentsForDeposit(selectedVendor);
                const sourcePayment = availablePayments.find(p => p.monthIndex === selectedMonthForDeposit.monthIndex);
                
                if (!sourcePayment) {
                  message.error('No payment found for selected month');
                  return;
                }

                // Create payment data for deposit consumption
                const paymentData = {
                  rental_ids: selectedRentals,
                  amounts: selectedRentals.map(() => amountPerStall),
                  payment_types: selectedRentals.map(() => 'partial'),
                  or_number: orNumber.trim(),
                  payment_date: paymentDate.format('YYYY-MM-DD'),
                  payment_id: sourcePayment.payment_id,
                  consume_deposit: true,
                  custom_amount: totalAmountToConsume, // Send total amount for backend calculation
                };

                const response = await api.post(`/vendor-payments/consume-deposit/${selectedVendor.id}`, paymentData);

                if (response.data.success) {
                  message.success(`Deposit consumed successfully: ${fmtMoney(totalAmountToConsume)}`);
                  
                  // Reset form and close modal
                  setDepositConsumptionModal(false);
                  setSelectedMonthForDeposit(null);
                  setSelectedPaymentForDeposit(null);
                  setUseDeposit(false);
                  setSelectedRentals([]);
                  setOrNumber('');
                  setPaymentDate(dayjs());
                  setCustomDepositAmount('');
                  
                  // Force refresh with a small delay to ensure backend has updated
                  setTimeout(() => {
                    fetchVendors({ showLoading: false });
                  }, 500);
                } else {
                  message.error('Failed to consume deposit');
                }
              } catch (error) {
                console.error('Deposit consumption error:', error);
                message.error(error.response?.data?.message || 'Failed to consume deposit');
              } finally {
                setProcessingPayment(false);
              }
            }}
          >
            Consume Deposit
          </Button>
        ]}
        width={800}
        centered
        closeIcon={<CloseOutlined />}
        styles={{
          mask: {
            backgroundColor: 'rgba(20, 33, 61, 0.58)',
            backdropFilter: 'blur(6px)',
          },
        }}
        className="vendor-modal deposit-consumption-modal"
      >
        {selectedVendor && (
          <div className="deposit-consumption-content">
            <div className="modal-intro">
              <Text type="secondary">
                Select a month with available deposit to consume. The deposit amount will be used to pay for current or future payments.
              </Text>
            </div>

            <div className="deposit-total-panel">
              <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                Total Available Deposit: {fmtMoney(getTotalDepositAmount(selectedVendor))}
              </Text>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text strong className="vendor-modal-field-label">Select month with deposit</Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Select a month"
                value={selectedMonthForDeposit ? `${selectedMonthForDeposit.month} - Available Deposit: ${fmtMoney(selectedMonthForDeposit.totalDeposit)}` : undefined}
                onChange={(monthIndex) => {
                  const availableMonths = getAvailableMonthsForDeposit(selectedVendor);
                  const selectedMonth = availableMonths.find(m => m.monthIndex === monthIndex);
                  setSelectedMonthForDeposit(selectedMonth);
                }}
              >
                {getAvailableMonthsForDeposit(selectedVendor).map((month) => (
                  <Option key={month.monthIndex} value={month.monthIndex} >
                    <div style={{ 
                      padding: '8px 0',
                      lineHeight: '1.4'
                    }}>
                      <div style={{ marginBottom: '4px' }}>
                        <Text strong style={{ fontSize: '14px', color: '#52c41a' }}>
                          {month.month}
                        </Text>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                          Total Payments: <Text strong>{fmtMoney(month.totalPayments)}</Text>
                        </Text>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                          Monthly Rate: <Text strong>{fmtMoney(month.monthlyRate)}</Text>
                        </Text>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                          Available Deposit: <Text strong style={{ color: '#52c41a' }}>{fmtMoney(month.totalDeposit)}</Text>
                        </Text>
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>

            {selectedMonthForDeposit && (
              <div className="deposit-details-panel">
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>Selected Month Details:</Text>
                </div>
                <div>
                  <Text>Month: <Text strong>{selectedMonthForDeposit.month}</Text></Text>
                  <br />
                  <Text>Total Payments: <Text strong>{fmtMoney(selectedMonthForDeposit.totalPayments)}</Text></Text>
                  <br />
                  <Text>Monthly Rate: <Text strong>{fmtMoney(selectedMonthForDeposit.monthlyRate)}</Text></Text>
                  <br />
                  <Text>Total Available Deposit for {selectedMonthForDeposit.month}: <Text strong style={{ color: '#52c41a' }}>{fmtMoney(selectedMonthForDeposit.totalDeposit)}</Text></Text>
                  <br />
                  <Text>Available to consume: <Text strong style={{ color: '#52c41a' }}>{fmtMoney(selectedMonthForDeposit.totalDeposit)}</Text></Text>
                </div>
              </div>
            )}

            {/* Custom Deposit Amount Input */}
            {selectedMonthForDeposit && (
              <div className="deposit-amount-panel">
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>Amount to use</Text>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <Radio.Group 
                    value={customDepositAmount ? 'custom' : 'full'} 
                    onChange={(e) => {
                      if (e.target.value === 'full') {
                        setCustomDepositAmount('');
                      }
                    }}
                  >
                    <Radio value="full">
                      <Text>Use Full Deposit ({fmtMoney(selectedMonthForDeposit.totalDeposit)})</Text>
                    </Radio>
                    <Radio value="custom">
                      <Text>Custom Amount</Text>
                    </Radio>
                  </Radio.Group>
                </div>
                {customDepositAmount !== null && (
                  <div>
                    <Input
                      placeholder="Enter amount to consume"
                      value={customDepositAmount}
                      onChange={(e) => setCustomDepositAmount(e.target.value)}
                      prefix="₱"
                      type="number"
                      min={0}
                      max={selectedMonthForDeposit.totalDeposit}
                      style={{ width: '100%' }}
                    />
                    {customDepositAmount && parseFloat(customDepositAmount) > selectedMonthForDeposit.totalDeposit && (
                      <Text type="danger" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                        Amount cannot exceed available deposit ({fmtMoney(selectedMonthForDeposit.totalDeposit)})
                      </Text>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* OR Number and Payment Date Input */}
            {selectedMonthForDeposit && (
              <div className="deposit-payment-details">
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>Payment Details for Deposit Consumption:</Text>
                </div>
                
                <div className="payment-meta-grid">
                  <div>
                    <Text strong className="vendor-modal-field-label">OR Number *</Text>
                    <Input
                      placeholder="Enter Official Receipt Number"
                      value={orNumber}
                      onChange={(e) => setOrNumber(e.target.value)}
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <Text strong className="vendor-modal-field-label">Payment Date *</Text>
                    <DatePicker
                      value={paymentDate}
                      onChange={(date) => setPaymentDate(date)}
                      style={{ width: '100%' }}
                      format="MMMM D, YYYY"
                      placeholder="Select payment date"
                    
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <Text strong className="vendor-modal-field-label">Stalls to apply deposit to</Text>
                  <div className="deposit-stall-list">
                    {selectedVendor.rentals?.map((rental) => (
                      <div key={rental.rental_id} className="deposit-stall-item">
                        <Checkbox
                          checked={selectedRentals.includes(rental.rental_id)}
                          onChange={(e) => handleRentalSelection(rental.rental_id, e.target.checked)}
                        >
                          <div>
                            <Text strong>{rental.section_name} - {rental.stall_number}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {rental.is_monthly ? 
                                `Monthly Rate: ${fmtMoney(rental.monthly_rent)}` : 
                                `Daily Rent: ${fmtMoney(rental.daily_rent)}`
                              } | 
                              Status: {rental.status}
                              {rental.remaining_balance > 0 && ` | Balance: ${fmtMoney(rental.remaining_balance)}`}
                            </Text>
                          </div>
                        </Checkbox>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedRentals.length > 0 && (
                  <div style={{ padding: '12px', backgroundColor: '#f6ffed', borderRadius: '6px' }}>
                    <Text strong>
                      Selected Stalls: {selectedRentals.length} | 
                      Deposit to Consume: {fmtMoney(customDepositAmount ? parseFloat(customDepositAmount) : getTotalDepositAmount(selectedVendor))}
                    </Text>
                  </div>
                )}
              </div>
            )}

            <Alert
              message="Deposit Consumption Notice"
              description="Once you consume a deposit, it will be applied to the selected payment and the deposit amount will be reduced accordingly. This action cannot be undone."
              type="info"
              showIcon
              style={{ marginTop: '16px' }}
            />
            
            {!orNumber.trim() && selectedMonthForDeposit && (
              <Alert
                message="OR Number Required"
                description="Please enter an OR number to proceed with deposit consumption."
                type="warning"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}
            
            {selectedRentals.length === 0 && selectedMonthForDeposit && (
              <Alert
                message="Select Stalls"
                description="Please select at least one stall to apply the deposit to."
                type="warning"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}
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
