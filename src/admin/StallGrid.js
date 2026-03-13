import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  Tooltip,
  Spin,
  Button,
  Input,
  Switch,
  message,
  Tabs,
  Table,
  Drawer,
  Typography,
  Space,
  Divider,
  Modal,Empty,
  Form,
  Select,
  InputNumber,
  Upload,
  Row,
  Col,
  Tag,
  Avatar,
  DatePicker,
} from "antd";
import { ToolOutlined, PlusOutlined, UserOutlined, TeamOutlined, DollarOutlined,InfoCircleOutlined,ExclamationCircleOutlined,HistoryOutlined,FileTextOutlined } from "@ant-design/icons";
import api from "../Api";
import "./StallGrid.css";

const { Text } = Typography;
const { TextArea } = Input;

const StallGrid = ({ section, editMode, onAddStall,onRefresh }) => {
  const [stalls, setStalls] = useState(section?.stalls || []);
  const [modalVendor, setModalVendor] = useState(null);
  const [rentedHistory, setRentedHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loadingVendorId, setLoadingVendorId] = useState(null);
  const [vendorCache, setVendorCache] = useState({});
  const [isActive, setIsActive] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [selectedStall, setSelectedStall] = useState(null);
  const [statusLogs, setStatusLogs] = useState([]);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [selectedLogMessage, setSelectedLogMessage] = useState("");
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
const [selectedPaymentHistory, setSelectedPaymentHistory] = useState([]);
const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);
  const [activeVendors, setActiveVendors] = useState([]);
  const [unoccupiedDateModalVisible, setUnoccupiedDateModalVisible] = useState(false);
  const [selectedUnoccupiedDate, setSelectedUnoccupiedDate] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loadingVendors, setLoadingVendors] = useState(false);
  // New payment form states
  const [missedPaymentModalVisible, setMissedPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState('partial');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedRented, setSelectedRented] = useState(null);
  // Edit stall rent rates
  const [editRentModalVisible, setEditRentModalVisible] = useState(false);
  const [editDailyRate, setEditDailyRate] = useState('');
  const [editMonthlyRate, setEditMonthlyRate] = useState('');
  const [editAnnualRate, setEditAnnualRate] = useState('');
  const [editIsMonthly, setEditIsMonthly] = useState(false);
  const [editEffectiveDate, setEditEffectiveDate] = useState(null);
  const [updatingRent, setUpdatingRent] = useState(false);
    const gridRef = useRef(null); 
const primaryButtonStyle = {
  minWidth: 110,
  borderRadius: 999,
  padding: "6px 18px",
  fontWeight: 600,
background: "#5bef44ff", // blue → green
  border: "none",
  color: "#000000ff",
  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.35)",
};

const dangerButtonStyle = {
  minWidth: 120,
  borderRadius: 999,
  padding: "6px 18px",
  fontWeight: 600,
  background: "#ef4444", // strong red
  border: "1px solid #b91c1c",
  color: "#ffffff",
  boxShadow: "0 3px 10px rgba(239,68,68,0.35)",
};

const neutralButtonStyle = {
  minWidth: 100,
  borderRadius: 999,
  padding: "6px 18px",
  fontWeight: 500,
  background: "#f3f4f6", // soft gray
  border: "1px solid #d1d5db",
  color: "#111827",
};

  useEffect(() => {
    setStalls(section?.stalls || []);
  }, [section?.stalls]);

  const fetchVendor = async (stallId) => {
    if (!stallId) return null;
    try {
      setLoadingVendorId(stallId);
      const res = await api.get(`/stall/${stallId}/tenant`);
      const data = res.data; // Use response data directly, not recursive call
      const isVacant =
        !data.vendor?.first_name ||
        !data.vendor?.last_name;

      const formatted = {
        vendor: isVacant
          ? null
          : { 
              fullname: `${data.vendor?.first_name || ""} ${data.vendor?.last_name || ""}`.trim() || "—",
              ...data.vendor
            },
        stall_number: data.stall_number,
        stall_id: data.stall_id,
        status: data.status,
        section_name: data.section?.name || "—",
        daily_rent: data.daily_rent || 0,
        monthly_rent: data.monthly_rent || 0,
        payment_type: data.payment_type || "—",
        missedDays: data.rented?.missed_days || 0,
        missed_days: data.rented?.missed_days || 0, // Add this line for consistency
         nextDueDate: data.next_due_date,
        id: data.id,
        is_active: data.is_active ?? true,
        message: data.message || "",
        rented_id: data.rented_id, // Add this line
        rented: data.rented, // Add this line
        is_monthly: data.is_monthly || false, // Add is_monthly field
      };

      setVendorCache((prev) => ({ ...prev, [stallId]: formatted }));
      return formatted;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setLoadingVendorId(null);
    }
  };

const fetchPaymentDetails = async (rentedId) => {
  try {
    setLoadingPaymentHistory(true);
    const res = await api.get(`/rented/${rentedId}/payments`);

    // Convert object to array if needed
    let payments = res.data;
    if (!Array.isArray(payments)) {
      payments = Object.values(payments);
    }

    // Sort by payment_date descending (latest first)
    payments.sort((a, b) => {
      const dateA = new Date(a.payment_date);
      const dateB = new Date(b.payment_date);
      return dateB - dateA; // latest first
    });

    setSelectedPaymentHistory(payments);
    setPaymentModalVisible(true);
        setShowModal(false);
  } catch (err) {
    console.error("Fetch payment error:", err.response || err);
    message.error("Failed to fetch payment details");
  } finally {
    setLoadingPaymentHistory(false);
  }
};



  const fmtDate = (date) => {
    if (!date) return "-";
    if (date === "Present") return "Present";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const fetchRentedHistory = async (stallId) => {
    try {
      const res = await api.get(`/stall/${stallId}`);
      setRentedHistory(res.data.history || []);
      console.log(res.data.history)
    } catch (err) {
      console.error(err);
      setRentedHistory([]);
    }
  };

  const fetchActiveVendors = async () => {
    try {
      setLoadingVendors(true);
      const res = await api.get('/vendor-management?status=active');
      const vendors = res.data || [];
      setActiveVendors(vendors.filter(v => v.status === 'active'));
    } catch (err) {
      console.error('Error fetching active vendors:', err);
      message.error('Failed to fetch active vendors');
      setActiveVendors([]);
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleAssignVendor = async () => {
    if (!selectedVendor) {
      message.error('Please select a vendor');
      return;
    }

    try {
      const res = await api.post(`/market-layout/stalls/${selectedStall}/assign-vendor`, {
        vendor_id: selectedVendor
      });
      
      message.success('Vendor assigned successfully');
      setShowModal(false);
      setSelectedVendor(null);
      onRefresh(); // Refresh the stall grid
    } catch (err) {
      console.error('Error assigning vendor:', err);
      message.error('Failed to assign vendor');
    }
  };

  const handleUpdateStallRent = async () => {
    if (!selectedStall) return;
    
    try {
      setUpdatingRent(true);
      const response = await api.put(`/stall/${selectedStall}/rent`, {
        daily_rate: editDailyRate || null,
        monthly_rate: editMonthlyRate || null,
        annual_rate: editAnnualRate || null,
        is_monthly: editIsMonthly,
        effective_date: editEffectiveDate ? editEffectiveDate.format('YYYY-MM-DD') : null,
      });
      
      console.log('Update stall rent response:', response);
      console.log('Response data:', response.data);
      console.log('Response status:', response.status);
      
      if (response.data && response.data.success) {
        const updatedCount = response.data.updated_rented_records || 0;
        const effectiveDateMsg = response.data.effective_date && response.data.effective_date !== new Date().toISOString().split('T')[0] 
          ? ` (Effective from ${response.data.effective_date})` 
          : '';
        const successMessage = updatedCount > 0 
          ? `Stall rent rates updated successfully.${effectiveDateMsg} Updated ${updatedCount} active rental record(s).`
          : `Stall rent rates updated successfully.${effectiveDateMsg}`;
        
        message.success(successMessage);
        setEditRentModalVisible(false);
        setShowModal(false); // Close main drawer as well
        setEditDailyRate('');
        setEditMonthlyRate('');
        setEditAnnualRate('');
        setEditIsMonthly(false);
        setEditEffectiveDate(null);
        onRefresh?.(); // Refresh the stall grid
      } else {
        // Handle validation errors
        const errorMessage = response.data?.message || 'Failed to update stall rent rates';
        if (response.status === 422 && response.data.errors) {
          // Display field-specific validation errors
          const errorFields = Object.keys(response.data.errors);
          const errorMessages = errorFields.map(field => {
            const fieldErrors = response.data.errors[field];
            if (Array.isArray(fieldErrors)) {
              return `${field}: ${fieldErrors.join(', ')}`;
            }
            return `${field}: ${fieldErrors}`;
          }).join('\n');
          
          message.error(`Validation failed:\n${errorMessages}`);
        } else {
          // Display general error message
          message.error(errorMessage);
        }
      }
    } catch (err) {
      console.error('Error updating stall rent:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      message.error(err.response?.data?.message || 'Failed to update stall rent rates');
    } finally {
      setUpdatingRent(false);
    }
  };

  const openEditRentModal = () => {
    if (!modalVendor) return;
    setEditDailyRate(modalVendor.daily_rate || '');
    setEditMonthlyRate(modalVendor.monthly_rate || '');
    setEditAnnualRate(modalVendor.annual_rate || '');
    setEditIsMonthly(modalVendor.is_monthly || false);
    setEditEffectiveDate(null); // Reset to null (will use today's date by default)
    setEditRentModalVisible(true);
  };

  const handleMissedPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      message.error('Please enter a valid payment amount');
      return;
    }

    // Use modalVendor directly instead of selectedRented to avoid null state issues
    const rentalData = modalVendor;
    
    if (!rentalData) {
      message.error('No rental data available');
      return;
    }

    // Get the actual rented_id from modalVendor
    const rentalId = rentalData.rented_id;

    if (!rentalId) {
      message.error('Rental ID not found');
      return;
    }

    try {
      setProcessingPayment(true);
      const res = await api.post(`/admin/rented/${rentalId}/pay-missed`, {
        amount: parseFloat(paymentAmount),
        payment_type: getPaymentType()
      });

      if (res.data.success) {
        message.success(res.data.message);
        setMissedPaymentModalVisible(false);
        setPaymentAmount('');
        setPaymentType('partial');
        // Don't clear selectedRented, keep modalVendor for potential subsequent payments
        onRefresh?.(); // Refresh the stall grid
      } else {
        message.error(res.data.message || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      message.error(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const openMissedPaymentModal = (rented) => {
    setSelectedRented(rented);
    setMissedPaymentModalVisible(true);
    // Pre-calculate total missed amount
    const totalMissed = (rented.missed_days || 0) * (rented.daily_rent || 0);
    setPaymentAmount(totalMissed.toString());
  };

  // Helper functions for payment type detection
  const getPaymentType = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return 'partial';
    
    const amount = parseFloat(paymentAmount);
    const totalMissed = (modalVendor.missed_days || 0) * (modalVendor.daily_rent || 0);
    
    if (amount < totalMissed) return 'partial';
    if (amount === totalMissed) return 'fully paid';
    return 'advance';
  };

  const getPaymentTypeLabel = () => {
    const type = getPaymentType();
    switch (type) {
      case 'partial': return 'Partial Payment';
      case 'fully paid': return 'Fully Paid';
      case 'advance': return 'Advance Payment';
      default: return 'Partial Payment';
    }
  };

  const getPaymentTypeIcon = () => {
    const type = getPaymentType();
    switch (type) {
      case 'partial': return '🔄';
      case 'fully paid': return '✅';
      case 'advance': return '⚡';
      default: return '🔄';
    }
  };

  const getPaymentTypeDescription = () => {
    const type = getPaymentType();
    const amount = parseFloat(paymentAmount || 0);
    const totalMissed = (modalVendor.missed_days || 0) * (modalVendor.daily_rent || 0);
    const daysCovered = Math.min(Math.floor(amount / (modalVendor.daily_rent || 1)), modalVendor.missed_days || 0);
    
    switch (type) {
      case 'partial': 
        return `Covers ${daysCovered} of ${modalVendor.missed_days} missed days`;
      case 'fully paid': 
        return `All ${modalVendor.missed_days} missed days will be settled`;
      case 'advance': 
        const advanceDays = Math.floor((amount - totalMissed) / (modalVendor.daily_rent || 1));
        return `Settles all missed days plus ${advanceDays} advance days`;
      default: 
        return '';
    }
  };

  const getPaymentTypeBackground = () => {
    const type = getPaymentType();
    switch (type) {
      case 'partial': return 'linear-gradient(135deg, #fff7e6 0%, #ffeaa7 100%)';
      case 'fully paid': return 'linear-gradient(135deg, #f6ffed 0%, #d3f261 100%)';
      case 'advance': return 'linear-gradient(135deg, #f9f0ff 0%, #d3adf7 100%)';
      default: return '#f5f5f5';
    }
  };

  const getPaymentTypeColor = () => {
    const type = getPaymentType();
    switch (type) {
      case 'partial': return '#fa8c16';
      case 'fully paid': return '#52c41a';
      case 'advance': return '#722ed1';
      default: return '#666';
    }
  };

  const getPaymentTypeTagColor = () => {
    const type = getPaymentType();
    switch (type) {
      case 'partial': return 'orange';
      case 'fully paid': return 'green';
      case 'advance': return 'purple';
      default: return 'default';
    }
  };

  const fetchStatusLogs = async (stallId) => {
    try {
      const res = await api.get(`/stall/${stallId}/status-logs`);
      setStatusLogs(res.data || []);
    } catch (err) {
      console.error(err);
      setStatusLogs([]);
    }
  };

  const handleStallClick = async (stall) => {
    if (!stall) return;

    setShowModal(false);
    setSelectedStall(null);
    setModalVendor(null);
    setStatusLogs([]);
    setMessageText("");

    if (editMode && !stall.id) {
      onAddStall(section.id, stall.row, stall.col);
      return;
    }

    const normalizedStatus = (stall.status || "").toLowerCase();
    if (
      ![
        "occupied",
        "paid",
        "advance",
        "temp_closed",
       "fully_paid",
        "partial",
        "paid_today",
        "missed",
        "vacant",
        "inactive",
      ].includes(normalizedStatus)
    )
      return;

    const data = await fetchVendor(stall.id);
    await fetchRentedHistory(stall.id);
    await fetchStatusLogs(stall.id);

    setModalVendor(
      normalizedStatus === "vacant" ? { ...data, vendor: null } : data
    );
    setIsActive(data?.is_active ?? true);
    setSelectedStall(stall.id);
    
    // Fetch active vendors if stall is vacant
    if (normalizedStatus === "vacant") {
      await fetchActiveVendors();
    }
    
    setShowModal(true);
  };

  const handleRemoveVendor = () => {
    if (!modalVendor?.stall_id) return;
    
    // Show the unoccupied date selection modal
    setUnoccupiedDateModalVisible(true);
    setSelectedUnoccupiedDate(null); // Reset to today
  };

  const confirmRemoveVendor = async () => {
    if (!modalVendor?.stall_id) return;

    try {
      const requestData = {};
      if (selectedUnoccupiedDate) {
        requestData.unoccupied_date = selectedUnoccupiedDate.format('YYYY-MM-DD HH:mm:ss');
      }

      await api.post(`/stall/${modalVendor.stall_id}/remove-vendor`, requestData);
      message.success(
        `Vendor removed from Stall #${modalVendor.stall_number}`
      );

      const updated = await fetchVendor(modalVendor.stall_id);
      await fetchRentedHistory(modalVendor.stall_id);
      await fetchStatusLogs(modalVendor.stall_id);

      if (updated) {
        setModalVendor({ ...updated, vendor: null });
      }

      setStalls((prev) =>
        prev.map((s) =>
          s.id === modalVendor.stall_id ? { ...s, status: "vacant" } : s
        )
      );

      // Close the modal
      setUnoccupiedDateModalVisible(false);
      setSelectedUnoccupiedDate(null);
    } catch (err) {
      console.error(err);
      message.error("Failed to remove vendor from stall.");
    }
  };

  const handleToggleActive = async () => {
    if (!modalVendor) return;
    try {
      await api.put(`/stall/${modalVendor.stall_id}/toggle-active`, {
        is_active: isActive,
        message: messageText,
      });
      message.success(
        `Stall #${modalVendor.stall_number} marked as ${
          isActive ? "Active" : "Inactive"
        }`
      );

      await fetchStatusLogs(modalVendor.stall_id);

      setVendorCache((prev) => ({
        ...prev,
        [modalVendor.stall_id]: {
          ...prev[modalVendor.stall_id],
          is_active: isActive,
          message: messageText,
        },
      }));

      setShowModal(false);
      setMessageText("");
       onRefresh?.();
    } catch (err) {
      console.error(err);
      message.error("Failed to update stall status");
    }
  };

  const fmtMoney = (v) =>
    v === null || v === undefined || isNaN(Number(v))
      ? "₱0.00"
      : `₱${Number(v).toLocaleString("en-PH", {
          minimumFractionDigits: 2,
        })}`;

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "vacant":
        return "#0be63eff";
      case "occupied":
        return "#FFA500";
      case "missed":
        return "#d40b04ff";
      case "paid":
      case "paid_today":
        return "#4ADE80";
      case "inactive":
        return "#808080ff";
      case "temp_closed":
        return "#ff4d00ff";
      case "advance":
        return "#14B8A6";
      case "fully_paid":
        return "#70d404ff";
      case "partial":
        return "#FB923C";

      default:
        return "#894141ff";
    }
  };

  // Enhanced responsive grid with better visual layout
  const renderGrid = () => {
    const rows = Math.max(
      1,
      section?.row_count ||
        (stalls.length > 0
          ? Math.max(...stalls.map((s) => s.row_position || 1))
          : 1)
    );
    const cols = Math.max(
      1,
      section?.column_count ||
        (stalls.length > 0
          ? Math.max(...stalls.map((s) => s.column_position || 1))
          : 1)
    );

    const totalStalls = rows * cols;

    // Create grid cells for all stalls or empty slots
    const gridCells = Array.from({ length: totalStalls }, (_, index) => {
      const r = Math.floor(index / cols) + 1;
      const c = (index % cols) + 1;
      const stall = stalls.find(
        (s) => s.row_position === r && s.column_position === c
      );
      return { stall, row: r, col: c };
    });

    // Check if it's a single row layout and area type
    const isSingleRow = rows === 1 && cols > 1;
    const isWetArea = section?.area_name?.toLowerCase().includes('wet') || 
                       section?.area_type === 'market' ||
                       section?.area_name?.toLowerCase().includes('market');
    
    // For wet areas with single row, display horizontally instead of vertically
    const shouldDisplayHorizontally = isSingleRow && isWetArea;
    
    // Calculate optimal stall size - make them smaller
    let stallSize, gridTemplateColumns, gridTemplateRows, maxWidth;
    
    if (shouldDisplayHorizontally) {
      // For wet areas with single row, display horizontally
      stallSize = Math.max(60, Math.min(80, 600 / Math.max(cols, 10)));
      gridTemplateColumns = `repeat(${cols}, ${stallSize}px)`;
      gridTemplateRows = undefined;
      maxWidth = cols * (stallSize + 10);
    } else if (isSingleRow) {
      // For single row, display vertically in single column with bigger stalls
      stallSize = Math.max(80, Math.min(120, 800 / Math.max(cols, 10)));
      gridTemplateColumns = "1fr"; // Single column
      gridTemplateRows = `repeat(${cols}, ${stallSize}px)`; // One row per stall
      maxWidth = Math.max(200, stallSize + 50); // Wider for better centering
    } else {
      // For multi-row layouts, use original logic but smaller
      stallSize = Math.max(45, Math.min(75, 500 / Math.max(cols, rows)));
      gridTemplateColumns = `repeat(${cols}, ${stallSize}px)`;
      gridTemplateRows = undefined;
      maxWidth = cols * (stallSize + 10);
    }

    const gridStyle = {
          display: "grid",
          gridTemplateColumns: gridTemplateColumns,
          gridTemplateRows: gridTemplateRows,
          gap: shouldDisplayHorizontally ? "8px" : (isSingleRow ? "12px" : "10px"),
          width: "100%",
          maxWidth: maxWidth,
          margin: "0 auto",
          padding: shouldDisplayHorizontally ? "20px" : (isSingleRow ? "25px 20px" : "20px"),
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e2e8f0",
          justifyContent: shouldDisplayHorizontally ? "center" : (isSingleRow ? "center" : "stretch"),
          alignContent: shouldDisplayHorizontally ? "center" : (isSingleRow ? "center" : "stretch"),
        };

    return (
      <div
        ref={gridRef}
        style={gridStyle}
      >
        {gridCells.map(({ stall, row, col }) => {
          const color = stall ? getStatusColor(stall.status) : "#f0f0f0ff";
          
          // For wet areas with horizontal display, reverse numbering to start from right
          // For single row, keep original order (vertical layout)
          // For multi-row, reverse column order to start from right
          // For wet areas with horizontal display, also reverse numbering
          const displayCol = (shouldDisplayHorizontally || !isSingleRow) ? cols - col + 1 : col;
          const displayStallNumber = (shouldDisplayHorizontally || !isSingleRow) ? 
            (cols - col + 1) : col;
          
          const stallNumber = stall ? `#${stall.stall_number}` : "";
          const isSelected = selectedStall === stall?.id;

          // For single row layout, we need to calculate grid position differently
          let gridPosition = {};
          if (shouldDisplayHorizontally) {
            // For wet areas with single row, display horizontally with reversed numbering
            gridPosition = {
              gridColumn: displayCol, // Use reversed column for positioning
              gridRow: 1,
            };
          } else if (isSingleRow) {
            // For single column vertical layout, each stall gets its own row
            gridPosition = {
              gridColumn: 1,
              gridRow: col, // Use column number as row number
            };
          } else {
            // For multi-row layouts, use reversed column order
            gridPosition = {
              gridColumn: displayCol, // Use reversed column number
              gridRow: row,
            };
          }

          return (
            <Tooltip
              key={stall?.id || `${row}-${col}`}
              title={stallNumber || (editMode && !stall?.id ? "Add Stall" : "")}
            >
              <Card
                hoverable={!!stall}
                className="stall-card"
                style={{
                  backgroundColor: color,
                  width: "100%",
                  aspectRatio: "1 / 1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  border: isSelected ? "3px solid #1890ff" : `2px solid ${stall ? "#ffffff" : "#e2e8f0"}`,
                  fontWeight: "bold",
                  fontSize: shouldDisplayHorizontally ? `${stallSize / 3.5}px` : (isSingleRow ? `${stallSize / 4}px` : `${stallSize / 3.5}px`), // Smaller font for horizontal wet areas
                  borderRadius: shouldDisplayHorizontally ? "6px" : (isSingleRow ? "8px" : "12px"),
                  boxSizing: "border-box",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: stall 
                    ? "0 4px 12px rgba(0, 0, 0, 0.15)" 
                    : "0 2px 6px rgba(0, 0, 0, 0.05)",
                  transform: isSelected ? "scale(1.05)" : "scale(1)",
                  position: "relative",
                  overflow: "hidden",
                  ...gridPosition,
                }}
                onClick={() => handleStallClick(stall || { row, col })}
                bodyStyle={{ 
                  padding: 0, 
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: stall ? "#ffffff" : "#64748b",
                  textShadow: stall ? "0 1px 2px rgba(0,0,0,0.3)" : "none",
                }}
              >
                {/* Add subtle gradient overlay */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: stall 
                    ? "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)"
                    : "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, transparent 50%, rgba(0,0,0,0.05) 100%)",
                  pointerEvents: "none",
                }} />
                
                {loadingVendorId === stall?.id ? (
                  <Spin size="small" />
                ) : stall?.status === "inactive" ? (
                  <ToolOutlined style={{ fontSize: shouldDisplayHorizontally ? `${stallSize / 3}px` : (isSingleRow ? `${stallSize / 3}px` : `${stallSize / 4}px`) }} />
                ) : stallNumber || (editMode && !stall?.id ? 
                  <PlusOutlined style={{ fontSize: shouldDisplayHorizontally ? `${stallSize / 3}px` : (isSingleRow ? `${stallSize / 3}px` : `${stallSize / 4}px`), color: "#94a3b8" }} /> : ""
                )}
              </Card>
            </Tooltip>
          );
        })}
      </div>
    );
  };

  const getTabsItems = () => {
    const tabs = [];
    
    // Details Tab - only for occupied stalls
    if (modalVendor.vendor ) {
      tabs.push({
        key: "1",
        label: (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
            Details
          </span>
        ),
        children: (
          <>
            {!isActive && (
              <Card
                type="inner"
                style={{
                  marginBottom: 16,
                  background:
                    "linear-gradient(135deg,#fff1f0 0,#fff0f6 100%)",
                  border: "1px solid #ffccc7",
                  borderRadius: 10,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                }}
              >
                <Space align="start">
                  <ToolOutlined
                    style={{ fontSize: 20, color: "#ff4d4f" }}
                  />
                  <div>
                    <Text
                      strong
                      style={{ fontSize: 15, color: "#cf1322" }}
                    >
                      Under Maintenance
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {modalVendor.message ||
                        "This stall is temporarily unavailable."}
                    </Text>
                  </div>
                </Space>
              </Card>
            )}

            <Card
              size="small"
              style={{
                borderRadius: 12,
                border: "none",
                boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
                marginBottom: 16,
              }}
              bodyStyle={{ padding: 16 }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  rowGap: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Text type="secondary">Vendor</Text>
                  <Text strong>{modalVendor.vendor.fullname}</Text>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Text type="secondary">Section</Text>
                  <Text>{modalVendor.section_name}</Text>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Text type="secondary">Payment Type</Text>
                  <Text>{modalVendor.payment_type}</Text>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  
                  <Text type="secondary">Daily Rent</Text>
                  <Text strong>{fmtMoney(modalVendor.daily_rent)}</Text>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Text type="secondary">Monthly Rent</Text>
                  <Text strong>{fmtMoney(modalVendor.monthly_rent)}</Text>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Text type="secondary">Next Due Date</Text>
                 <Text strong>
    {modalVendor.nextDueDate
      ? fmtDate(modalVendor.nextDueDate)
      : "No due date yet"}
  </Text>
                </div>

                {modalVendor.missed_days >= 1 && (
                  <>
                    <Divider style={{ margin: "8px 0" }} />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text type="secondary">Missed Days</Text>
                      <Text strong>{modalVendor.missed_days}</Text>
                    </div>
                
                  </>
                )}
              </div>
            </Card>
          </>
        ),
      });
    }

    // Rented History Tab
    tabs.push({
      key: "2",
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
          <HistoryOutlined style={{ color: '#722ed1' }} />
          Rented History
        </span>
      ),
      children: (
        <Card
          size="small"
          style={{
            borderRadius: 14,
            border: "1px solid #edf0f5",
            background: "#ffffff",
            boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
          }}
          bodyStyle={{ padding: 16 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div>
              <Text strong style={{ fontSize: 15 }}>
                Rented History
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Track all previous rentals, balances, and missed days for this stall.
              </Text>
            </div>
          </div>

          <Table
            dataSource={rentedHistory}
            rowKey={(record, idx) => idx}
            pagination={false}
            size="small"
            bordered={false}
            scroll={{ x: true }}
            style={{
              borderRadius: 10,
              overflow: "hidden",
            }}
            rowClassName={(_, index) =>
              index % 2 === 0 ? "row-light" : "row-default"
            }
            columns={[
              {
                title: "Vendor",
                dataIndex: "vendor_name",
                render: (text) => (
                  <Text
                    style={{ fontSize: 13, fontWeight: 500 }}
                  >
                    {text}
                  </Text>
                ),
              },
              {
                title: "Start Date",
                dataIndex: "start_date",
                render: (text) => (
                  <Text style={{ fontSize: 12 }}>
                    {fmtDate(text)}
                  </Text>
                ),
              },
              {
                title: "End Date",
                dataIndex: "end_date",
                render: (text) => (
                  <Text style={{ fontSize: 12 }}>
                    {fmtDate(text)}
                  </Text>
                ),
              },
            
              {
                title: "Missed Days",
                dataIndex: "missed_days",
                render: (text) => (
                  <Text
                    style={{
                      fontSize: 12,
                      color: text > 0 ? "#fa541c" : "#52c41a",
                    }}
                  >
                    {text}
                  </Text>
                ),
              },
            ]}
          />
        </Card>
      ),
    });

    // Status Logs Tab
    tabs.push({
      key: "3",
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
          <FileTextOutlined style={{ color: '#fa8c16' }} />
          Status Logs
        </span>
      ),
      children: (
        <>
          <Card
            size="small"
            style={{
              borderRadius: 12,
              border: "none",
              boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
            }}
            bodyStyle={{ padding: 12 }}
          >
            {statusLogs.length === 0 ? (
              <Empty
                description="No status messages found"
                style={{ padding: 40 }}
              />
            ) : (
              <Table
                dataSource={statusLogs.map((log, idx) => ({
                  key: idx,
                  status: log.is_active ? "Active" : "Inactive",
                  message: log.message || "",
                  created_at: fmtDate(log.created_at),
                }))}
                pagination={false}
                size="small"
                bordered={false}
                columns={[
                  {
                    title: "Status",
                    dataIndex: "status",
                    render: (text) => (
                      <Text
                        style={{
                          color: text === "Active" ? "#52c41a" : "#ff4d4f",
                          fontWeight: 600,
                        }}
                      >
                        {text}
                      </Text>
                    ),
                  },
                  {
                    title: "Message",
                    render: (_, record) => (
                      <Button
                        type="link"
                        style={{
                          padding: "2px 10px",
                          borderRadius: 999,
                          border: "1px solid #0ed7fb",
                          background: "linear-gradient(135deg,#e6faff 0,#f5feff 100%)",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                        onClick={() => {
                          setSelectedLogMessage(
                            record.message && record.message.trim() !== ""
                              ? record.message
                              : "No message provided."
                          );
                          setMessageModalVisible(true);
                        }}
                      >
                        View Message
                      </Button>
                    ),
                  },
                  { title: "Changed At", dataIndex: "created_at" },
                ]}
              />
            )}
          </Card>

          <Modal
            title="Stall Status Message"
            open={messageModalVisible}
            onCancel={() => setMessageModalVisible(false)}
            footer={[
              <Button
                key="close"
                type="primary"
                onClick={() => setMessageModalVisible(false)}
              >
                Close
              </Button>,
            ]}
            centered
          >
            <Text
              style={{
                display: "block",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {selectedLogMessage || "No message provided."}
            </Text>
          </Modal>
        </>
      ),
    });

    // Vendor Assignment Tab - only for vacant stalls without vendor
    if (!modalVendor.vendor && modalVendor.status === 'vacant') {
      tabs.push({
        key: "4",
        label: (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
            <TeamOutlined style={{ color: '#52c41a' }} />
            Assign Vendor
          </span>
        ),
        children: (
          <Card
            size="small"
            style={{
              borderRadius: 12,
              border: "1px solid #e6f7ff",
              background: "#fafafa",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
            bodyStyle={{ padding: 20 }}
          >
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 16, color: '#262626' }}>
                Assign Vendor to Stall #{modalVendor.stall_number}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Select an active vendor to assign to this vacant stall
              </Text>
            </div>

            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ marginBottom: 8, display: 'block' }}>
                Available Active Vendors
              </Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Select a vendor to assign"
                loading={loadingVendors}
                value={selectedVendor}
                onChange={setSelectedVendor}
                size="large"
                showSearch
                filterOption={(input, option) => {
                  const vendor = activeVendors.find(v => v.id === option.value);
                  if (!vendor) return false;
                  
                  const searchLower = input.toLowerCase();
                  const firstName = (vendor.first_name || '').toLowerCase();
                  const lastName = (vendor.last_name || '').toLowerCase();
                  const fullName = `${vendor.first_name || ''} ${vendor.last_name || ''}`.toLowerCase();
                  const contactNumber = (vendor.contact_number || '').toLowerCase();
                  
                  return firstName.includes(searchLower) || 
                         lastName.includes(searchLower) || 
                         fullName.includes(searchLower) || 
                         contactNumber.includes(searchLower);
                }}
              >
                {activeVendors.map(vendor => (
                  <Select.Option key={vendor.id} value={vendor.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Avatar size="small" icon={<UserOutlined />} />
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {vendor.first_name} {vendor.last_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                          {vendor.contact_number}
                        </div>
                      </div>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </div>

            {selectedVendor && (
              <Card
                size="small"
                style={{
                  background: '#f0f9ff',
                  border: '1px solid #91d5ff',
                  borderRadius: 8,
                  marginBottom: 20
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar icon={<UserOutlined />} />
                  <div style={{ flex: 1 }}>
                    <Text strong>
                      {activeVendors.find(v => v.id === selectedVendor)?.first_name} {activeVendors.find(v => v.id === selectedVendor)?.last_name}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {activeVendors.find(v => v.id === selectedVendor)?.contact_number}
                    </Text>
                  </div>
                </div>
              </Card>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button onClick={() => setSelectedVendor(null)}>
                Clear Selection
              </Button>
              <Button
                type="primary"
                onClick={handleAssignVendor}
                disabled={!selectedVendor}
                style={{
                  background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(24, 144, 255, 0.15)'
                }}
              >
                Assign Vendor
              </Button>
            </div>
          </Card>
        ),
      });
    }

    // Edit Rent Rates Tab - show for all stalls
    if (modalVendor) {
      tabs.push({
        key: "6",
        label: (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
            <DollarOutlined style={{ color: '#52c41a' }} />
            Edit Rent Rates
          </span>
        ),
        children: (
          <Card
            size="small"
            style={{
              borderRadius: 12,
              border: "1px solid #e6f7ff",
              background: "#fafafa",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
            bodyStyle={{ padding: 20 }}
          >
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 16, color: '#262626' }}>
                Edit Rent Rates for Stall #{modalVendor.stall_number || 'N/A'}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Set individual daily and monthly rent rates for this stall
              </Text>
            </div>

            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ marginBottom: 8, display: 'block' }}>
                Current Rates
              </Text>
              <div style={{ display: 'flex', gap: '16px', marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <Text type="secondary">Daily Rate</Text>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {fmtMoney(modalVendor.daily_rent)}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <Text type="secondary">Monthly Rate</Text>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {fmtMoney(modalVendor.monthly_rent)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="primary"
                onClick={openEditRentModal}
                icon={<DollarOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(82, 196, 26, 0.15)'
                }}
              >
                Edit Rates
              </Button>
            </div>
          </Card>
        ),
      });
    }

    // Missed Payment Tab - only show when there are missed days
    if (modalVendor.vendor && modalVendor.missed_days >= 1) {
      tabs.push({
        key: "5",
        label: (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            Missed Payment
          </span>
        ),
        children: (
          <div style={{ padding: '24px 0' }}>
            {/* Payment Summary Card */}
            <Card
              size="small"
              style={{
                borderRadius: 16,
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                marginBottom: 24,
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>
                  Stall #{modalVendor.stall_number} • {modalVendor.vendor?.fullname}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                      {modalVendor.missed_days || 0}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>Missed Days</div>
                  </div>
                  <div>
                    
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                      {fmtMoney(modalVendor.daily_rent || 0)}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>Daily Rate</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Type Indicator */}
            {paymentAmount && parseFloat(paymentAmount) > 0 && (
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  border: 'none',
                  marginBottom: 20,
                  background: getPaymentTypeBackground(),
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                }}
                bodyStyle={{ padding: '16px' }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: 16, 
                    fontWeight: 'bold',
                    color: getPaymentTypeColor(),
                    marginBottom: 8
                  }}>
                    {getPaymentTypeIcon()} {getPaymentTypeLabel()}
                  </div>
                  <div style={{ fontSize: 13, color: '#666' }}>
                    {getPaymentTypeDescription()}
                  </div>
                </div>
              </Card>
            )}

            {/* Payment Input */}
            <Card
              size="small"
              style={{
                borderRadius: 12,
                border: 'none',
                background: '#ffffff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                marginBottom: 20,
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ fontSize: 16, color: '#262626', display: 'block', marginBottom: 8 }}>
                  Enter Payment Amount
                </Text>
                <InputNumber
                  value={paymentAmount}
                  onChange={(value) => setPaymentAmount(value?.toString() || '')}
                  style={{ 
                    width: '100%',
                    fontSize: 18,
                    fontWeight: 'bold'
                  }}
                  size="large"
                  min={0}
                  step={0.01}
                  formatter={value => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/₱\s?|(,*)/g, '')}
                  placeholder="0.00"
                />
              </div>

              {/* Quick Actions */}
              <div style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 12 }}>
                  Quick Actions:
                </Text>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                  {[1, 3, 7, 15, 30].map(days => (
                    <Button
                      key={days}
                      size="large"
                      onClick={() => {
                        const amount = days * (modalVendor.daily_rent || 0);
                        setPaymentAmount(amount.toString());
                      }}
                      style={{
                        borderRadius: 12,
                        height: 'auto',
                        padding: '12px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        background: days <= (modalVendor.missed_days || 0) ? '#f0f9ff' : '#f6ffed',
                        borderColor: days <= (modalVendor.missed_days || 0) ? '#0ea5e9' : '#52c41a',
                      }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                        {days}
                      </div>
                      <div style={{ fontSize: 11, color: '#666' }}>
                        {days === 1 ? 'day' : 'days'}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                        {fmtMoney(days * (modalVendor.daily_rent || 0))}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Payment Breakdown */}
            {paymentAmount && parseFloat(paymentAmount) > 0 && (
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  border: 'none',
                  background: '#fafafa',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  marginBottom: 20,
                }}
                bodyStyle={{ padding: '20px' }}
              >
                <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 16 }}>
                  Payment Breakdown
                </Text>
                
               
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ color: '#666' }}>Amount Entered:</Text>
                  <Text strong style={{ color: '#1890ff' }}>{fmtMoney(parseFloat(paymentAmount || 0))}</Text>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ color: '#666' }}>Missed Days Covered:</Text>
                  <Text strong style={{ color: '#52c41a' }}>
                    {Math.min(
                      Math.floor(parseFloat(paymentAmount || 0) / (modalVendor.daily_rent || 1)),
                      modalVendor.missed_days || 0
                    )} / {modalVendor.missed_days || 0} days
                  </Text>
                </div>
                
             
                
                {parseFloat(paymentAmount || 0) > (modalVendor.missed_days || 0) * (modalVendor.daily_rent || 0) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text style={{ color: '#666' }}>Advance Days:</Text>
                    <Text strong style={{ color: '#722ed1' }}>
                      {Math.floor((parseFloat(paymentAmount || 0) - ((modalVendor.missed_days || 0) * (modalVendor.daily_rent || 0))) / (modalVendor.daily_rent || 1))} days
                    </Text>
                  </div>
                )}
                
                <Divider style={{ margin: '12px 0' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong style={{ fontSize: 14 }}>Payment Type:</Text>
                  <Tag 
                    color={getPaymentTypeTagColor()}
                    style={{ fontSize: 12, fontWeight: 'bold', padding: '4px 12px' }}
                  >
                    {getPaymentTypeLabel()}
                  </Tag>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button
                size="large"
                onClick={() => {
                  setPaymentAmount('');
                }}
                style={{ 
                  borderRadius: 8,
                  minWidth: 100,
                  height: 44
                }}
              >
                Clear
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  setSelectedRented(modalVendor);
                  handleMissedPayment();
                }}
                loading={processingPayment}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                style={{ 
                  borderRadius: 8,
                  minWidth: 140,
                  height: 44,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                {processingPayment ? 'Processing...' : 'Process Payment'}
              </Button>
            </div>
          </div>
        ),
      });
    }

    return tabs;
  };

  return (
    <div style={{ padding: 16, overflowX: "auto" }}>
      {renderGrid()}

      <Drawer
        title={
          modalVendor ? (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Text strong style={{ fontSize: 18 }}>
                  Stall #{modalVendor.stall_number}
                </Text>
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {modalVendor.section_name || "No section"} • ID:{" "}
                    {modalVendor.stall_id}
                  </Text>
                </div>
              </div>
              {modalVendor.vendor && (
                <div
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    backgroundColor: isActive ? "#f6ffed" : "#fff1f0",
                    border: `1px solid ${isActive ? "#b7eb8f" : "#ffa39e"}`,
                    fontSize: 12,
                    fontWeight: 600,
                    color: isActive ? "#389e0d" : "#cf1322",
                  }}
                >
                  {isActive ? "Active" : "Inactive"}
                </div>
              )}
            </div>
          ) : (
            ""
          )
        }
        placement="right"
        width={520}
        onClose={() => setShowModal(false)}
        open={showModal}
        destroyOnClose
        bodyStyle={{
          padding: 20,
          background:
            "linear-gradient(135deg, #f5f7fa 0%, #f9fafb 40%, #ffffff 100%)",
        }}
      >
        {modalVendor && (
          <>
            <Tabs
              defaultActiveKey="1"
              type="card"
              tabBarGutter={16}
              tabBarStyle={{
                marginBottom: 16,
                fontWeight: 500,
              }}
              items={getTabsItems()}
            />

      <Divider style={{ margin: "16px 0" }} />

      {/* Footer: Status toggle & actions */}
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Card
          size="small"
          style={{
            borderRadius: 12,
            border: "none",
            boxShadow: "0 4px 12px rgba(15,23,42,0.05)",
          }}
          bodyStyle={{ padding: 12 }}
        >
          <Space
            align="center"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <div>
              <Text strong>Stall Status</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Toggle to mark this stall as active or inactive
              </Text>
            </div>
            <Switch
              checked={isActive}
              onChange={setIsActive}
              checkedChildren="Active"
              unCheckedChildren="Inactive"
            />
          </Space>
        </Card>

        <TextArea
          rows={4}
          placeholder="Leave a note about this status change..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          style={{
            borderRadius: 10,
            fontSize: 14,
            padding: 12,
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
          }}
        />

        <Space
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {modalVendor?.vendor?.fullname && (
            <Button
              danger
              onClick={handleRemoveVendor}
                           style={dangerButtonStyle }

            >
              Remove Vendor
            </Button>
          )}
          <Space>
            <Button
              onClick={() => setShowModal(false)}
                 style={neutralButtonStyle}

            >
              Close
            </Button>
            <Button
              type="primary"
              onClick={handleToggleActive}
               style={primaryButtonStyle}
            >
              Save Changes
            </Button>
          </Space>
        </Space>
      </Space>
    </>
  )}
</Drawer>
<Modal
  title={null}
  open={paymentModalVisible}
  onCancel={() => setPaymentModalVisible(false)}
  footer={null}
  width={860}
  centered
  bodyStyle={{
    padding: 0,
    background:
      "linear-gradient(135deg, #f4f6fb 0%, #f9fafb 40%, #ffffff 100%)",
    borderRadius: 18,
    overflow: "hidden",
  }}
>
  <div
    style={{
      padding: "18px 22px 12px",
      borderBottom: "1px solid #edf0f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    }}
  >
    <div>
      <Text strong style={{ fontSize: 18 }}>
        Payment Details
      </Text>
      <br />
      <Text type="secondary" style={{ fontSize: 12 }}>
        Review all payments made for this rent record, including missed and
        advance days.
      </Text>
    </div>

    {/* Small summary chips */}
    {selectedPaymentHistory && selectedPaymentHistory.length > 0 && (
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            background: "#e6f4ff",
            border: "1px solid #91caff",
            fontSize: 11,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              marginRight: 6,
            }}
          >
            Total Payments:
          </span>
          {selectedPaymentHistory.length}
        </div>
        <div
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            background: "#f6ffed",
            border: "1px solid #b7eb8f",
            fontSize: 11,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              marginRight: 6,
            }}
          >
            Latest:
          </span>
          {fmtDate(selectedPaymentHistory[0]?.payment_date)}
        </div>
      </div>
    )}
  </div>

  <div
    style={{
      maxHeight: 420,
      overflow: "auto",
      padding: 16,
    }}
  >
    {loadingPaymentHistory ? (
      <div style={{ padding: "40px 0", textAlign: "center" }}>
        <Spin size="large" />
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Loading payment records…
          </Text>
        </div>
      </div>
    ) : selectedPaymentHistory.length === 0 ? (
      <Card
        size="small"
        style={{
          borderRadius: 14,
          border: "1px dashed #d9d9d9",
          background: "#fafafa",
        }}
        bodyStyle={{ padding: 24, textAlign: "center" }}
      >
        <Empty
          description={
            <span style={{ color: "#8c8c8c" }}>
              No payment records found for this rent history.
            </span>
          }
        />
      </Card>
    ) : (
      <Card
        size="small"
        style={{
          borderRadius: 14,
          border: "1px solid #edf0f5",
          boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
          background: "#ffffff",
        }}
        bodyStyle={{ padding: 12 }}
      >
        <Table
          dataSource={selectedPaymentHistory}
          rowKey={(record, idx) => idx}
          pagination={false}
          size="small"
          bordered={false}
          scroll={{ x: true }}
          style={{ borderRadius: 10, overflow: "hidden" }}
          rowClassName={(_, index) =>
            index % 2 === 0 ? "row-light" : "row-default"
          }
          columns={[
            {
              title: "Type",
              dataIndex: "payment_type",
              render: (text) => (
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 999,
                    background:
                      "linear-gradient(135deg,#e6f4ff 0,#f0f5ff 100%)",
                    border: "1px solid #bae0ff",
                    fontSize: 11,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {text}
                </span>
              ),
            },
            {
              title: "Collector",
              dataIndex: "collector",
              render: (text) => (
                <Text style={{ whiteSpace: "nowrap", fontSize: 12 }}>
                  {text || "-"}
                </Text>
              ),
            },
            {
              title: "Amount",
              dataIndex: "amount",
              align: "right",
              render: (value) => (
                <Text
                  strong
                  style={{
                    color: "#1677ff",
                    whiteSpace: "nowrap",
                    fontSize: 13,
                  }}
                >
                  {fmtMoney(value)}
                </Text>
              ),
            },
            {
              title: "Payment Date",
              dataIndex: "payment_date",
              render: (date) => (
                <Text style={{ whiteSpace: "nowrap", fontSize: 12 }}>
                  {fmtDate(date)}
                </Text>
              ),
            },
            {
              title: "Missed Days",
              dataIndex: "missed_days",
              align: "center",
              render: (value) => (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "#fff7e6",
                    border: "1px solid #ffe7ba",
                    fontSize: 11,
                    minWidth: 40,
                  }}
                >
                  {value ?? 0}
                </span>
              ),
            },
            {
              title: "Advance Days",
              dataIndex: "advance_days",
              align: "center",
              render: (value) => (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "#f6ffed",
                    border: "1px solid #b7eb8f",
                    fontSize: 11,
                    minWidth: 40,
                  }}
                >
                  {value ?? 0}
                </span>
              ),
            },
            {
              title: "Status",
              dataIndex: "status",
              render: (text) => {
                const lower = (text || "").toLowerCase();
                let color = "#595959";
                let bg = "#f5f5f5";
                if (lower === "collected") {
                  color = "#389e0d";
                  bg = "#f6ffed";
                } else if (lower === "remitted") {
                  color = "#0958d9";
                  bg = "#e6f4ff";
                }
                return (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: 999,
                      backgroundColor: bg,
                      color,
                      fontWeight: 600,
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {text}
                  </span>
                );
              },
            },
          ]}
        />
      </Card>
    )}
  </div>

  <div
    style={{
      padding: "10px 18px 14px",
      borderTop: "1px solid #edf0f5",
      display: "flex",
      justifyContent: "flex-end",
      gap: 10,
      background: "#ffffff",
    }}
  >
    <Button
      onClick={() => setPaymentModalVisible(false)}
      style={{
        borderRadius: 999,
        padding: "6px 16px",
        fontWeight: 500,
      }}
    >
      Close
    </Button>
  </div>
</Modal>

{/* Missed Payment Modal */}
<Modal
  title={
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#ff4d00ff'
      }} />
      <span>Process Missed Payment</span>
    </div>
  }
  open={missedPaymentModalVisible}
  onCancel={() => {
    setMissedPaymentModalVisible(false);
    setPaymentAmount('');
    setPaymentType('partial');
    setSelectedRented(null);
  }}
  footer={null}
  width={500}
  centered
>
  {selectedRented && (
    <div style={{ padding: '20px 0' }}>
      {/* Rental Info */}
      <div style={{
        background: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text strong>Stall #{selectedRented.stall_number || 'N/A'}</Text>
          <Text type="secondary">{selectedRented.vendor?.fullname || 'Unknown Vendor'}</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text>Missed Days: <Text strong>{selectedRented.missed_days || 0}</Text></Text>
          <Text>Daily Rate: <Text strong>{fmtMoney(selectedRented.daily_rent)}</Text></Text>
        </div>
      </div>

      {/* Payment Form */}
      <Form layout="vertical">
        <Form.Item label="Payment Type" required>
          <Select
            value={paymentType}
            onChange={setPaymentType}
            style={{ width: '100%' }}
            size="large"
          >
            <Select.Option value="partial">Partial Payment</Select.Option>
            <Select.Option value="fully paid">Fully Paid</Select.Option>
            <Select.Option value="advance">Advance Payment</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Amount" required>
          <InputNumber
            value={paymentAmount}
            onChange={(value) => setPaymentAmount(value?.toString() || '')}
            style={{ width: '100%' }}
            size="large"
            min={0}
            step={0.01}
            formatter={value => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/₱\s?|(,*)/g, '')}
          />
        </Form.Item>

        {/* Quick Actions */}
        <div style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, color: '#666' }}>Quick Actions:</Text>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {[1, 3, 7, 15, 30].map(days => (
              <Button
                key={days}
                size="small"
                onClick={() => {
                  const amount = days * (selectedRented.daily_rent || 0);
                  setPaymentAmount(amount.toString());
                  if (days >= (selectedRented.missed_days || 0)) {
                    setPaymentType('advance');
                  } else {
                    setPaymentType('partial');
                  }
                }}
                style={{ borderRadius: 12 }}
              >
                {days} {days === 1 ? 'day' : 'days'} ({fmtMoney(days * (selectedRented.daily_rent || 0))})
              </Button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div style={{
          background: '#e6f7ff',
          border: '1px solid #91d5ff',
          borderRadius: 8,
          padding: 12,
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text>Total Missed Amount:</Text>
            <Text strong>{fmtMoney((selectedRented.missed_days || 0) * (selectedRented.daily_rent || 0))}</Text>
          </div>
        
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button
            onClick={() => {
              setMissedPaymentModalVisible(false);
              setPaymentAmount('');
              setPaymentType('partial');
              setSelectedRented(null);
            }}
            style={{ borderRadius: 8 }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleMissedPayment}
            loading={processingPayment}
            style={{ borderRadius: 8, minWidth: 100 }}
          >
            {processingPayment ? 'Processing...' : 'Process Payment'}
          </Button>
        </div>
      </Form>
    </div>
  )}
</Modal>

      {/* Edit Rent Rates Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarOutlined style={{ color: '#52c41a' }} />
            <span>Edit Rent Rates - Stall #{modalVendor?.stall_number || 'N/A'}</span>
          </div>
        }
        open={editRentModalVisible}
        onCancel={() => {
          setEditRentModalVisible(false);
          setEditDailyRate('');
          setEditMonthlyRate('');
          setEditAnnualRate('');
          setEditIsMonthly(false);
          setEditEffectiveDate(null);
        }}
        footer={null}
        width={500}
        zIndex={1001} // Ensure modal is above other elements
        mask={true} // Add a mask to prevent interaction with elements behind the modal
        centered
      >
        <Form layout="vertical">
          <Form.Item label="Daily Rate (optional)">
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Leave empty to use section default"
              value={editDailyRate}
              onChange={(value) => setEditDailyRate(value)}
              min={0}
              precision={2}
              formatter={value => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₱\s?|(,*)/g, '')}
            />
          </Form.Item>
          
          <Form.Item label="Monthly Rate (optional)">
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Leave empty to use section default"
              value={editMonthlyRate}
              onChange={(value) => setEditMonthlyRate(value)}
              min={0}
              precision={2}
              formatter={value => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₱\s?|(,*)/g, '')}
            />
          </Form.Item>
          
          <Form.Item label="Annual Rate (optional)">
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Leave empty to use section default"
              value={editAnnualRate}
              onChange={(value) => setEditAnnualRate(value)}
              min={0}
              precision={2}
              formatter={value => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₱\s?|(,*)/g, '')}
            />
          </Form.Item>
          
          <Form.Item label="Billing Type">
            <Switch
              checked={editIsMonthly}
              onChange={setEditIsMonthly}
              checkedChildren="Monthly"
              unCheckedChildren="Daily"
              style={{ marginTop: 8 }}
            />
          </Form.Item>

          <Form.Item 
            label="Effective Date (optional)"
            tooltip="When should these rates take effect? Leave empty for immediate effect. Past dates are allowed for historical rate changes."
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="Select effective date"
              value={editEffectiveDate}
              onChange={(date) => setEditEffectiveDate(date)}
                  format="YYYY-MM-DD"
            />
          </Form.Item>

          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae7ff',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16
          }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              💡 Leave fields empty to use section's default rates. Individual stall rates override section defaults.
              Set an effective date to schedule rate changes for future dates.
            </Text>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => {
                setEditRentModalVisible(false);
                setEditDailyRate('');
                setEditMonthlyRate('');
                setEditAnnualRate('');
                setEditEffectiveDate(null);
              }}
              style={{ borderRadius: 8 }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleUpdateStallRent}
              loading={updatingRent}
              style={{ borderRadius: 8, minWidth: 100 }}
            >
              {updatingRent ? 'Updating...' : 'Update Rates'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Unoccupied Date Selection Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 500 }}>Remove Vendor</span>
          </div>
        }
        open={unoccupiedDateModalVisible}
        onCancel={() => {
          setUnoccupiedDateModalVisible(false);
          setSelectedUnoccupiedDate(null);
        }}
        footer={[
          <Button
            onClick={() => {
              setUnoccupiedDateModalVisible(false);
              setSelectedUnoccupiedDate(null);
            }}
            style={{ borderRadius: 6, height: 40 }}
          >
            Cancel
          </Button>,
          <Button
            type="primary"
            danger
            onClick={confirmRemoveVendor}
            style={{ borderRadius: 6, height: 40, minWidth: 120 }}
          >
            Confirm Removal
          </Button>
        ]}
        width={480}
        zIndex={1002}
        centered
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ padding: '24px 24px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #fff5f5 0%, #fff0f0 100%)',
            borderRadius: 8,
            padding: '20px',
            marginBottom: 24,
            border: '1px solid #e8e8e8'
          }}>
            <div style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, color: '#262626', lineHeight: 1.5 }}>
                Are you sure you want to remove <Text strong style={{ color: '#1890ff' }}>{modalVendor?.vendor?.fullname}</Text> from <Text strong style={{ color: '#1890ff' }}>Stall #{modalVendor?.stall_number}</Text>?
              </Text>
            </div>

            <div style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 13, color: '#8c8c8c', display: 'block', marginBottom: 8 }}>
                Select the date when this stall became unoccupied. This ensures accurate monthly rate calculations.
              </Text>
              <DatePicker
                showTime
                style={{ 
                  width: '100%',
                  borderRadius: 6,
                  border: '1px solid #d9d9d9'
                }}
                size="large"
                placeholder="Select unoccupied date and time"
                value={selectedUnoccupiedDate}
                onChange={(date) => setSelectedUnoccupiedDate(date)}
                format="YYYY-MM-DD HH:mm:ss"
                disabledDate={(current) => current && current > new Date()}
              />
            </div>

            <div style={{
              background: '#fff7e6',
              border: '1px solid #ffe58f',
              borderRadius: 6,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <InfoCircleOutlined style={{ color: '#faad14', fontSize: 16 }} />
              <Text style={{ fontSize: 12, color: '#8c8c8c', margin: 0 }}>
                This will mark the stall as vacant and update the rental history with the selected date.
              </Text>
            </div>
          </div>
        </div>
      </Modal>


    </div>
  );
};

export default StallGrid;
