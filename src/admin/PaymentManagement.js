import React, { useState, useEffect } from "react";
import {
  Layout,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  message,
  Typography,
  Space,
  Tag,
  Tooltip,
  Row,
  Col,
  Statistic,
  Spin,
  notification,
  Divider,
} from "antd";
import {
  FiEdit,
  FiSave,
  FiX,
  FiDollarSign,
  FiUser,
  FiCalendar,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiEye,
  FiTrash2,
  FiAlertTriangle,
} from "react-icons/fi";
import { DollarOutlined, ShopOutlined } from "@ant-design/icons";
import api from "../Api";
import dayjs from 'dayjs';
import LoadingOverlay from "./Loading";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const PaymentManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [allVendorPayments, setAllVendorPayments] = useState([]);
  const [vendorPayments, setVendorPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewPaymentsModalVisible, setViewPaymentsModalVisible] = useState(false);
  const [detailedPaymentsModalVisible, setDetailedPaymentsModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedPaymentGroup, setSelectedPaymentGroup] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  const primaryColor = "#2563eb";
  const successColor = "#16a34a";
  const warningColor = "#ea580c";
  const dangerColor = "#dc2626";
  const cardBackground = "#ffffff";
  const textPrimary = "#0f172a";
  const textSecondary = "#64748b";

  useEffect(() => {
    fetchAllPayments();
  }, []);

  useEffect(() => {
    if (allVendorPayments.length > 0) {
      fetchVendors();
      fetchStats();
    }
  }, [allVendorPayments]);

  const fetchAllPayments = async () => {
    // Only show loading if we don't have any data yet
    if (allVendorPayments.length === 0) {
      setInitialLoading(true);
    }
    
    try {
      const { data } = await api.get("/payments");
      setAllVendorPayments(data);
    } catch (error) {
      console.error("Error fetching all payments:", error);
      message.error("Failed to fetch payments");
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchVendors = async () => {
    // Only show loading if we don't have any vendors yet
    if (vendors.length === 0) {
      setLoading(true);
    }
    
    try {
      const { data } = await api.get("/vendors");
      
      // Calculate vendor statistics from all payments (no date filtering)
      const vendorStats = {};
      allVendorPayments.forEach(payment => {
        if (!vendorStats[payment.vendor_id]) {
          vendorStats[payment.vendor_id] = {
            total_payments: 0,
            total_amount: 0,
            last_payment: null,
          };
        }
        
        vendorStats[payment.vendor_id].total_payments += 1;
        vendorStats[payment.vendor_id].total_amount += parseFloat(payment.amount || 0);
        
        // Update last payment date
        if (!vendorStats[payment.vendor_id].last_payment || 
            new Date(payment.payment_date) > new Date(vendorStats[payment.vendor_id].last_payment)) {
          vendorStats[payment.vendor_id].last_payment = payment.payment_date;
        }
      });

      // Combine vendor data with payment statistics
      const vendorsWithStats = data.map(vendor => ({
        ...vendor,
        total_payments: vendorStats[vendor.id]?.total_payments || 0,
        total_amount: vendorStats[vendor.id]?.total_amount || 0,
        last_payment: vendorStats[vendor.id]?.last_payment || null,
      }));

      setVendors(vendorsWithStats);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      message.error("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorPayments = async (vendorId, month = null, year = null) => {
    // Only show loading if we don't have any vendor payments yet or if it's a different vendor/date filter
    const shouldShowLoading = vendorPayments.length === 0 || 
      (selectedVendor?.id !== vendorId) || 
      (month !== selectedMonth) || 
      (year !== selectedYear);
    
    if (shouldShowLoading) {
      setPaymentsLoading(true);
    }
    
    try {
      // Fetch fresh data from backend instead of using cached data
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      if (year) params.append('year', year);
      
      const { data } = await api.get(`/vendors/${vendorId}/payments?${params}`);
      
      // Group payments by date and aggregate stall numbers
      const groupedPayments = {};
      data.forEach(payment => {
        const dateKey = payment.payment_date;
        if (!groupedPayments[dateKey]) {
          groupedPayments[dateKey] = {
            payment_date: payment.payment_date,
            total_amount: 0,
            payment_ids: [],
            stall_numbers: new Set(),
            payment_type: payment.payment_type,
            status: payment.status,
            or_numbers: [],
            missed_days: 0,
            advance_days: 0,
            original_payments: []
          };
        }
        
        groupedPayments[dateKey].total_amount += parseFloat(payment.amount || 0);
        groupedPayments[dateKey].payment_ids.push(payment.id);
        groupedPayments[dateKey].or_numbers.push(payment.or_number);
        groupedPayments[dateKey].missed_days += payment.missed_days || 0;
        groupedPayments[dateKey].advance_days += payment.advance_days || 0;
        groupedPayments[dateKey].original_payments.push(payment);
        
        // Add stall number if available
        if (payment.stall && payment.stall.stall_number) {
          groupedPayments[dateKey].stall_numbers.add(payment.stall.stall_number);
        }
      });
      
      // Convert to array and format stall numbers
      const groupedArray = Object.values(groupedPayments).map((group, index) => ({
        ...group,
        id: `grouped-${group.payment_date}-${index}`, // Add unique ID for table rowKey
        stall_numbers: Array.from(group.stall_numbers).sort(),
        payment_count: group.payment_ids.length,
        or_number: group.or_numbers.join(', ')
      }));
      
      setVendorPayments(groupedArray);
      
      // Also update the cached allVendorPayments with fresh data
      const allPaymentsResponse = await api.get("/payments");
      setAllVendorPayments(allPaymentsResponse.data);
      
    } catch (error) {
      console.error("Error fetching vendor payments:", error);
      message.error("Failed to fetch vendor payments");
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/payment-management/stats");
      // Update statistics if needed
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleViewPayments = (vendor) => {
    setSelectedVendor(vendor);
    setViewPaymentsModalVisible(true);
    fetchVendorPayments(vendor.id, selectedMonth, selectedYear);
  };

  const handleViewDetailedPayments = (paymentGroup) => {
    setSelectedPaymentGroup(paymentGroup);
    setDetailedPaymentsModalVisible(true);
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    form.setFieldsValue({
      ...payment,
      payment_date: payment.payment_date ? dayjs(payment.payment_date) : null,
    });
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // Only send fields that have changed
      const updatedData = {};
      
      if (values.or_number !== undefined && values.or_number !== editingPayment.or_number) {
        updatedData.or_number = String(values.or_number || '');
      }
      
      if (values.amount !== undefined && values.amount !== editingPayment.amount) {
        updatedData.amount = parseFloat(values.amount || 0);
      }
      
      if (values.payment_type !== undefined && values.payment_type !== editingPayment.payment_type) {
        updatedData.payment_type = values.payment_type;
      }
      
      if (values.payment_date !== undefined) {
        const formattedDate = values.payment_date ? values.payment_date.format('YYYY-MM-DD') : null;
        if (formattedDate !== editingPayment.payment_date) {
          updatedData.payment_date = formattedDate;
        }
      }
      
      if (values.missed_days !== undefined && values.missed_days !== editingPayment.missed_days) {
        updatedData.missed_days = parseInt(values.missed_days || 0);
      }
      
      if (values.advance_days !== undefined && values.advance_days !== editingPayment.advance_days) {
        updatedData.advance_days = parseInt(values.advance_days || 0);
      }
      
      if (values.status !== undefined && values.status !== editingPayment.status) {
        updatedData.status = values.status;
      }

      if (Object.keys(updatedData).length === 0) {
        message.info("No changes detected");
        return;
      }

      const response = await api.put(`/payments/${editingPayment.id}`, updatedData);
      message.success("Payment updated successfully");
      setEditModalVisible(false);
      setEditingPayment(null);
      
      // Show loading effect while refreshing data
      setModalLoading(true);
      
      try {
        // First refresh the main vendor table
        await fetchVendors();
        
        // Then refresh the modal data
        if (selectedVendor) {
          await fetchVendorPayments(selectedVendor.id, selectedMonth, selectedYear);
        }
        
        // Keep the detailed modal open if it was open, to show updated data
        if (detailedPaymentsModalVisible && selectedPaymentGroup) {
          
          // Wait a moment for the vendorPayments to update, then find the updated group
          setTimeout(() => {
            const currentVendorPayments = vendorPayments.filter(group => 
              group.payment_date === selectedPaymentGroup.payment_date
            );
            
            if (currentVendorPayments.length > 0) {
              // Get the updated payment group
              const updatedGroup = currentVendorPayments[0];
              
              // Find and update the specific payment in original_payments
              const updatedOriginalPayments = updatedGroup.original_payments.map(payment => {
                if (payment.id === editingPayment.id) {
                  // Return the updated payment data
                  return {
                    ...payment,
                    ...updatedData
                  };
                }
                return payment;
              });
              
              // Update the selected payment group with fresh data including updated original_payments
              setSelectedPaymentGroup({
                ...updatedGroup,
                original_payments: updatedOriginalPayments
              });
            }
          }, 100); // Small delay to ensure state is updated
        }
      } finally {
        setModalLoading(false);
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      message.error("Failed to update payment");
      setModalLoading(false);
    }
  };

  const handleCancel = () => {
    setEditModalVisible(false);
    setEditingPayment(null);
    form.resetFields();
  };

  const handleDeletePayment = (payment) => {
    setPaymentToDelete(payment);
    setDeleteModalVisible(true);
  };

  const confirmDeletePayment = async () => {
    if (!paymentToDelete) return;

    try {
      await api.delete(`/payments/${paymentToDelete.id}`);
      message.success("Payment deleted successfully");
      setDeleteModalVisible(false);
      setPaymentToDelete(null);
      
      // Show loading effect while refreshing data
      setModalLoading(true);
      
      try {
        // First refresh the main vendor table
        await fetchAllPayments();
        await fetchVendors();
        
        // Then refresh the modal data
        if (selectedVendor) {
          await fetchVendorPayments(selectedVendor.id, selectedMonth, selectedYear);
        }
        
        // Close detailed modal if no more payments in the group
        if (selectedPaymentGroup && selectedPaymentGroup.original_payments) {
          const remainingPayments = selectedPaymentGroup.original_payments.filter(p => p.id !== paymentToDelete.id);
          if (remainingPayments.length === 0) {
            setDetailedPaymentsModalVisible(false);
            setSelectedPaymentGroup(null);
          } else {
            // Update the selected payment group with remaining payments
            setSelectedPaymentGroup({
              ...selectedPaymentGroup,
              original_payments: remainingPayments,
              payment_count: remainingPayments.length,
              total_amount: remainingPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
            });
          }
        }
      } finally {
        setModalLoading(false);
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      message.error("Failed to delete payment");
      setModalLoading(false);
    }
  };

  const cancelDeletePayment = () => {
    setDeleteModalVisible(false);
    setPaymentToDelete(null);
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    if (selectedVendor) {
      fetchVendorPayments(selectedVendor.id, month, selectedYear);
    }
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    if (selectedVendor) {
      fetchVendorPayments(selectedVendor.id, selectedMonth, year);
    }
  };

  const getPaymentTypeColor = (type) => {
    const colors = {
      daily: "#3b82f6",
      monthly: "#16a34a",
      advance: "#f59e0b",
      penalty: "#dc2626",
    };
    return colors[type] || "#64748b";
  };

  const getStatusColor = (status) => {
    const colors = {
      paid: "#16a34a",
      pending: "#f59e0b",
      overdue: "#dc2626",
      partial: "#8b5cf6",
    };
    return colors[status] || "#64748b";
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch = searchText === "" || 
      `${vendor.first_name} ${vendor.last_name}`.toLowerCase().includes(searchText.toLowerCase()) ||
      vendor.contact_number?.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  const vendorColumns = [
    {
      title: "Vendor Name",
      dataIndex: "first_name",
      key: "vendor_name",
      render: (_, vendor) => (
        <div>
          <Text strong style={{ color: textPrimary }}>
            {`${vendor.first_name} ${vendor.last_name}`}
          </Text>
          <br />
          <Text style={{ fontSize: "12px", color: textSecondary }}>
            {vendor.contact_number || "N/A"}
          </Text>
        </div>
      ),
    },
    {
      title: "Total Payments",
      dataIndex: "total_payments",
      key: "total_payments",
      render: (count) => (
        <Tag color={primaryColor}>
          {count} payments
        </Tag>
      ),
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (amount) => (
        <Text strong style={{ color: successColor }}>
          ₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      ),
      sorter: (a, b) => a.total_amount - b.total_amount,
    },
    {
      title: "Last Payment",
      dataIndex: "last_payment",
      key: "last_payment",
      render: (date) => {
        if (!date) return <Text style={{ color: textPrimary }}>No payments</Text>;
        const paymentDate = new Date(date);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return <Text style={{ color: textPrimary }}>
          {paymentDate.toLocaleDateString('en-US', options)}
        </Text>;
      },
      sorter: (a, b) => new Date(a.last_payment || 0) - new Date(b.last_payment || 0),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, vendor) => (
        <Space>
          <Button
            type="default"
            size="small"
            icon={<FiEye />}
            onClick={() => handleViewPayments(vendor)}
            style={{
              background: "#ffffff",
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
              color: "#000000",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = primaryColor;
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.borderColor = primaryColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.color = "#000000";
              e.currentTarget.style.borderColor = "#d9d9d9";
            }}
          >
            View Payments
          </Button>
        </Space>
      ),
    },
  ];

  const paymentColumns = [
    {
      title: "Date",
      dataIndex: "payment_date",
      key: "payment_date",
      render: (date) => {
        if (!date) return <Text style={{ color: textPrimary }}>N/A</Text>;
        const paymentDate = new Date(date);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return <Text strong style={{ color: textPrimary }}>
          {paymentDate.toLocaleDateString('en-US', options)}
        </Text>;
      },
      sorter: (a, b) => new Date(a.payment_date || 0) - new Date(b.payment_date || 0),
    },
    {
      title: "Payment Type",
      dataIndex: "payment_type",
      key: "payment_type",
      render: (type) => (
        <Tag color={getPaymentTypeColor(type)}>
          {type?.toUpperCase() || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (amount, record) => (
        <div>
          <Text strong style={{ color: successColor }}>
            ₱{amount ? parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
          </Text>
          {record.payment_count > 1 && (
            <div>
              <Text style={{ fontSize: "12px", color: textSecondary }}>
                ({record.payment_count} payments)
              </Text>
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => a.total_amount - b.total_amount,
    },
    {
      title: "Stall Numbers",
      dataIndex: "stall_numbers",
      key: "stall_numbers",
      render: (stallNumbers) => (
        <div>
          {stallNumbers && stallNumbers.length > 0 ? (
            <div>
              {stallNumbers.map((stall, index) => (
                <Tag key={`stall-${index}`} style={{ margin: "2px" }} color="blue">
                  {stall}
                </Tag>
              ))}
            </div>
          ) : (
            <Text style={{ color: textSecondary }}>No stalls</Text>
          )}
        </div>
      ),
    },
    {
      title: "OR Numbers",
      dataIndex: "or_numbers",
      key: "or_numbers",
      render: (orNumbers, record) => {
        if (!orNumbers) {
          return <Text style={{ color: textSecondary, fontSize: "12px" }}>N/A</Text>;
        }
        
        // Convert to string if it's not already
        const orNumbersStr = String(orNumbers);
        
        // If there's only one OR number, show it normally
        if (record.payment_count === 1) {
          return <Text style={{ color: textPrimary, fontSize: "12px" }}>{orNumbersStr}</Text>;
        }
        
        // If there are multiple OR numbers, show them separated by slash
        const uniqueOrNumbers = [...new Set(orNumbersStr.split(',').map(or => or.trim()))];
        if (uniqueOrNumbers.length === 1) {
          return <Text style={{ color: textPrimary, fontSize: "12px" }}>{uniqueOrNumbers[0]}</Text>;
        }
        
        return <Text style={{ color: textPrimary, fontSize: "12px" }}>{uniqueOrNumbers.join('/')}</Text>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase() || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="default"
            size="small"
            icon={<FiEye />}
            onClick={() => handleViewDetailedPayments(record)}
            style={{
              background: "#ffffff",
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
              color: "#000000",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = primaryColor;
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.borderColor = primaryColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.color = "#000000";
              e.currentTarget.style.borderColor = "#d9d9d9";
            }}
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  const totalCollected = vendors.reduce((sum, vendor) => sum + vendor.total_amount, 0);
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter(v => v.total_payments > 0).length;

  return (
    <Content style={{ padding: "24px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <Card
        style={{
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          background: "#ffffff",
          marginBottom: "24px",
          padding: "28px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(37, 99, 235, 0.3)",
              flexShrink: 0,
            }}>
              <DollarOutlined style={{ 
                fontSize: "32px", 
                color: "#ffffff",
                fontWeight: "bold" 
              }} />
            </div>
            <div>
              <Title level={1} style={{ 
                color: "#1a1a1a", 
                margin: 0, 
                marginBottom: "8px", 
                fontSize: "32px", 
                fontWeight: "700",
                lineHeight: "1.2"
              }}>
                Payment Management
              </Title>
              <Text style={{ 
                color: "#6b7280", 
                fontSize: "16px", 
                lineHeight: "1.6",
                fontWeight: "400"
              }}>
                Comprehensive payment tracking system for managing vendor payments and viewing complete payment history
              </Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              background: cardBackground,
            }}
          >
            <Statistic
              title="Total Collected"
              value={totalCollected}
              prefix={<DollarOutlined />}
              precision={2}
              formatter={(value) => `₱${value.toLocaleString()}`}
              valueStyle={{ color: successColor }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              background: cardBackground,
            }}
          >
            <Statistic
              title="Total Vendors"
              value={totalVendors}
              prefix={<FiUser />}
              valueStyle={{ color: primaryColor }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              background: cardBackground,
            }}
          >
            <Statistic
              title="Active Vendors"
              value={activeVendors}
              prefix={<ShopOutlined />}
              valueStyle={{ color: warningColor }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              background: cardBackground,
            }}
          >
            <Statistic
              title="Total Payments"
              value={vendors.reduce((sum, v) => sum + v.total_payments, 0)}
              prefix={<FiFileText />}
              valueStyle={{ color: textPrimary }}
            />
          </Card>
        </Col>
      </Row>

      {/* Loading Overlay */}
      {initialLoading && <LoadingOverlay message="Loading payment data..." />}

      {/* Search and Filters */}
      <Card
        style={{
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          background: cardBackground,
          marginBottom: "24px",
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search by vendor name or contact"
              prefix={<FiSearch />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Button
              icon={<FiRefreshCw />}
              onClick={() => {
                fetchAllPayments();
              }}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                color: "#000000",
                height: "40px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = primaryColor;
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.borderColor = primaryColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.color = "#000000";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Vendors Table */}
      <Card
        style={{
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          background: cardBackground,
        }}
      >
        <Table
          columns={vendorColumns}
          dataSource={filteredVendors}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `Showing ${range[0]} to ${range[1]} of ${total} vendors`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* View Payments Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <FiUser style={{ fontSize: "18px", color: primaryColor }} />
            <div>
              <div>Payments for {selectedVendor?.first_name} {selectedVendor?.last_name}</div>
              <Text style={{ fontSize: "12px", color: textSecondary }}>
                Complete payment history
              </Text>
            </div>
          </div>
        }
        open={viewPaymentsModalVisible}
        onCancel={() => setViewPaymentsModalVisible(false)}
        footer={null}
        width={1000}
        style={{ borderRadius: "12px" }}
      >
        <div style={{ marginBottom: "16px" }}>
          <Row gutter={[16, 16]} align="middle">
            <Col>
              <Text strong>Filter by Month:</Text>
            </Col>
            <Col>
              <Select
                value={selectedMonth}
                onChange={handleMonthChange}
                style={{ width: 150 }}
              >
              <Option key={1} value={1}>January</Option>
              <Option key={2} value={2}>February</Option>
              <Option key={3} value={3}>March</Option>
              <Option key={4} value={4}>April</Option>
              <Option key={5} value={5}>May</Option>
              <Option key={6} value={6}>June</Option>
              <Option key={7} value={7}>July</Option>
              <Option key={8} value={8}>August</Option>
              <Option key={9} value={9}>September</Option>
              <Option key={10} value={10}>October</Option>
              <Option key={11} value={11}>November</Option>
              <Option key={12} value={12}>December</Option>
            </Select>
          </Col>
          <Col>
            <Select
              value={selectedYear}
              onChange={handleYearChange}
              style={{ width: 120 }}
            >
              <Option key={selectedYear} value={selectedYear}>{selectedYear}</Option>
              <Option key={selectedYear - 1} value={selectedYear - 1}>{selectedYear - 1}</Option>
              <Option key={selectedYear - 2} value={selectedYear - 2}>{selectedYear - 2}</Option>
            </Select>
            </Col>
          </Row>
        </div>

        <Table
          columns={paymentColumns}
          dataSource={vendorPayments}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `Showing ${range[0]} to ${range[1]} of ${total} payments`,
          }}
          scroll={{ x: 900 }}
        />
      </Modal>

      {/* Detailed Payments Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <FiFileText style={{ fontSize: "18px", color: primaryColor }} />
            <div>
              <div>All Payments for {selectedPaymentGroup?.payment_date ? new Date(selectedPaymentGroup.payment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</div>
              <Text style={{ fontSize: "12px", color: textSecondary }}>
                {selectedPaymentGroup?.payment_count} payment(s) • Total: ₱{(() => {
                  const payments = selectedPaymentGroup?.original_payments || [];
                  const totalAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
                  return totalAmount.toLocaleString();
                })()}
              </Text>
            </div>
          </div>
        }
        open={detailedPaymentsModalVisible}
        onCancel={() => setDetailedPaymentsModalVisible(false)}
        footer={null}
        width={1000}
        style={{ borderRadius: "12px" }}
      >
        {/* Loading overlay for detailed payments modal */}
        {modalLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            borderRadius: '12px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <LoadingOverlay />
              <div style={{ marginTop: '16px' }}>
                <Text style={{ color: textPrimary, fontSize: '16px' }}>
                  Updating payment data...
                </Text>
              </div>
            </div>
          </div>
        )}
        {/* Calculate total amount for detailed payments */}
        {(() => {
          const payments = selectedPaymentGroup?.original_payments || [];
          const totalAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
          
          return (
              <Table
              columns={[
                {
                  title: "OR Number",
                  dataIndex: "or_number",
                  key: "or_number",
                  render: (text) => (
                    <Text strong style={{ color: textPrimary }}>
                      {text || "N/A"}
                    </Text>
                  ),
                },
                {
                  title: "Payment Type",
                  dataIndex: "payment_type",
                  key: "payment_type",
                  render: (type) => (
                    <Tag color={getPaymentTypeColor(type)}>
                      {type?.toUpperCase() || "N/A"}
                    </Tag>
                  ),
                },
                {
                  title: "Amount",
                  dataIndex: "amount",
                  key: "amount",
                  render: (amount) => (
                    <Text strong style={{ color: successColor }}>
                      ₱{amount ? parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                    </Text>
                  ),
                  sorter: (a, b) => parseFloat(a.amount || 0) - parseFloat(b.amount || 0),
                },
                {
                  title: "Stall",
                  dataIndex: "stall",
                  key: "stall",
                  render: (stall) => (
                    <Text style={{ color: textPrimary }}>
                      {stall?.stall_number || "N/A"}
                    </Text>
                  ),
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  key: "status",
                  render: (status) => (
                    <Tag color={getStatusColor(status)}>
                      {status?.toUpperCase() || "N/A"}
                    </Tag>
                  ),
                },
                {
                  title: "Actions",
                  key: "actions",
                  render: (_, record) => (
                    <Space>
                      <Button
                        type="default"
                        size="small"
                        icon={<FiEdit />}
                        onClick={() => handleEdit(record)}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #d9d9d9",
                          borderRadius: "6px",
                          color: "#000000",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = primaryColor;
                          e.currentTarget.style.color = "#ffffff";
                          e.currentTarget.style.borderColor = primaryColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#ffffff";
                          e.currentTarget.style.color = "#000000";
                          e.currentTarget.style.borderColor = "#d9d9d9";
                        }}
                      >
                        Edit Payment
                      </Button>
                      <Button
                        type="default"
                        size="small"
                        icon={<FiTrash2 />}
                        onClick={() => handleDeletePayment(record)}
                        style={{
                          background: dangerColor,
                          border: "1px solid #dc2626",
                          borderRadius: "6px",
                          color: "#ffffff",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = dangerColor;
                          e.currentTarget.style.color = "#ffffff";
                          e.currentTarget.style.borderColor = "#dc2626";
                          e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0, 0, 0, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = dangerColor;
                          e.currentTarget.style.color = "#ffffff";
                          e.currentTarget.style.borderColor = "#dc2626";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        Delete Payment
                      </Button>
                    </Space>
                  ),
                },
              ]}
              dataSource={selectedPaymentGroup?.original_payments || []}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `Showing ${range[0]} to ${range[1]} of ${total} payments`,
              }}
              scroll={{ x: 800 }}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <Text strong style={{ fontSize: "14px", color: textPrimary }}>
                        TOTAL
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Text 
                        strong 
                        style={{ 
                          fontSize: "16px", 
                          color: successColor,
                          fontWeight: "700"
                        }}
                      >
                        ₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} colSpan={3}>
                      {/* Empty cells for remaining columns */}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          );
        })()}
      </Modal>

      {/* Edit Payment Modal */}
      <Modal
        title="Edit Payment"
        open={editModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" icon={<FiX />} onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<FiSave />}
            onClick={handleSave}
            style={{ background: primaryColor, border: "none" }}
          >
            Save Changes
          </Button>,
        ]}
        width={600}
        style={{ borderRadius: "12px" }}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: "16px" }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="or_number"
                label="OR Number"
                rules={[{ required: true, message: "Please enter OR number" }]}
              >
                <Input placeholder="Enter OR number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="payment_type"
                label="Payment Type"
                rules={[{ required: true, message: "Please select payment type" }]}
              >
                <Select placeholder="Select payment type">
                  <Option value="daily">Daily</Option>
                  <Option value="monthly">Monthly</Option>
                  <Option value="advance">Advance</Option>
                  <Option value="penalty">Penalty</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Amount"
                rules={[{ required: true, message: "Please enter amount" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Enter amount"
                  min={0}
                  precision={2}
                  formatter={(value) => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => value.replace(/₱\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="payment_date"
                label="Payment Date"
                rules={[{ required: true, message: "Please select payment date" }]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="missed_days"
                label="Missed Days"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Enter missed days"
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="advance_days"
                label="Advance Days"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Enter advance days"
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select status" }]}
          >
            <Select placeholder="Select status">
              <Option value="paid">Paid</Option>
              <Option value="pending">Pending</Option>
              <Option value="overdue">Overdue</Option>
              <Option value="partial">Partial</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <FiTrash2 style={{ fontSize: "18px", color: dangerColor }} />
            <div>
              <div>Delete Payment Confirmation</div>
              <Text style={{ fontSize: "12px", color: textSecondary }}>
                This action cannot be undone
              </Text>
            </div>
          </div>
        }
        open={deleteModalVisible}
        onCancel={cancelDeletePayment}
        footer={[
          <Button key="cancel" icon={<FiX />} onClick={cancelDeletePayment}>
            Cancel
          </Button>,
          <Button
            key="delete"
            danger
            icon={<FiTrash2 />}
            onClick={confirmDeletePayment}
            style={{ 
              background: dangerColor, 
              border: "1px solid #dc2626",
              color: "#ffffff"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = dangerColor;
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.borderColor = "#dc2626";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0, 0, 0, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = dangerColor;
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.borderColor = "#dc2626";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Delete Payment
          </Button>,
        ]}
        width={500}
        style={{ borderRadius: "12px" }}
      >
        <div style={{ padding: "16px 0" }}>
          <Text style={{ fontSize: "16px", color: textPrimary }}>
            Are you sure you want to delete this payment?
          </Text>
          {paymentToDelete && (
            <div style={{ marginTop: "16px", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text style={{ fontSize: "12px", color: textSecondary }}>OR Number:</Text>
                  <br />
                  <Text strong style={{ color: textPrimary }}>
                    {paymentToDelete.or_number || "N/A"}
                  </Text>
                </Col>
                <Col span={12}>
                  <Text style={{ fontSize: "12px", color: textSecondary }}>Amount:</Text>
                  <br />
                  <Text strong style={{ color: successColor }}>
                    ₱{paymentToDelete.amount ? parseFloat(paymentToDelete.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                  </Text>
                </Col>
                <Col span={12}>
                  <Text style={{ fontSize: "12px", color: textSecondary }}>Payment Type:</Text>
                  <br />
                  <Tag color={getPaymentTypeColor(paymentToDelete.payment_type)}>
                    {paymentToDelete.payment_type?.toUpperCase() || "N/A"}
                  </Tag>
                </Col>
                <Col span={12}>
                  <Text style={{ fontSize: "12px", color: textSecondary }}>Payment Date:</Text>
                  <br />
                  <Text style={{ color: textPrimary }}>
                    {paymentToDelete.payment_date ? new Date(paymentToDelete.payment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </Text>
                </Col>
              </Row>
            </div>
          )}
          <div style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FiAlertTriangle style={{ color: dangerColor, fontSize: "16px" }} />
              <Text style={{ color: dangerColor, fontSize: "14px" }}>
                Warning: This will permanently remove this payment record from the system.
              </Text>
            </div>
          </div>
        </div>
      </Modal>
    </Content>
  );
};

export default PaymentManagement;
