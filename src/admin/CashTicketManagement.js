import React, { useEffect, useMemo, useState } from "react";
import api from "../Api";
import {
  Card,
  Table,
  Typography,
  Button,
  Space,
  Tooltip,
  Row,
  Col,
  Tag,
  DatePicker,
  Modal,
  Form,
  Input,
  InputNumber,
  Tabs,
  Statistic,
  Alert,
  message,
  Select,
  Popconfirm,
  Radio,
  Divider,
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  DollarOutlined,
  FilePdfOutlined,
  CalendarOutlined,
  SettingOutlined,
  ReloadOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import LoadingOverlay from "./Loading";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import letterheadTemplate from '../assets/report_template/letterhead_template.jpg';
import "./CashTicketManagement.css";

const { Text, Title } = Typography;
const { Option } = Select;

// Helper function to format amount with commas
const formatAmount = (amount) => {
  return parseFloat(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const getTicketLabel = (ticket) => {
  if (!ticket) return 'Ticket';
  return ticket.enterprise ? `${ticket.enterprise} · ${ticket.type}` : ticket.type;
};

// Minimalist color scheme
const colors = {
  primary: '#1a1a1a',
  secondary: '#666666',
  accent: '#2563eb',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  background: '#ffffff',
  surface: '#f8fafc',
  border: '#e2e8f0',
  text: '#1e293b',
  textSecondary: '#64748b',
};

const CashTicketManagement = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [cashTicketTypes, setCashTicketTypes] = useState([]);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'monthly'
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [isTypeModalVisible, setIsTypeModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dailyPayments, setDailyPayments] = useState({});
  const [typeForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [selectedTicketType, setSelectedTicketType] = useState('all'); // 'all' or specific type id

  const selectedTypeName = useMemo(() => {
    if (selectedTicketType === 'all') return 'All Cash Ticket Types';
    const foundType = cashTicketTypes.find(type => type.id.toString() === selectedTicketType);
    return foundType ? getTicketLabel(foundType) : 'Selected Ticket Type';
  }, [selectedTicketType, cashTicketTypes]);

  const summaryStats = useMemo(() => {
    const visibleTypes = selectedTicketType === 'all'
      ? cashTicketTypes
      : cashTicketTypes.filter(type => type.id.toString() === selectedTicketType);

    const totalCollected = data.reduce((sum, row) => {
      const rowTotal = visibleTypes.reduce((rowSum, type) => {
        return rowSum + parseFloat(row.types?.[type.id]?.amount || 0);
      }, 0);
      return sum + rowTotal;
    }, 0);

    return {
      totalCollected,
      totalTypes: cashTicketTypes.length,
      entries: data.length,
      currentView: viewMode === 'daily'
        ? `${dayjs().month(selectedMonth - 1).format('MMMM')} ${selectedYear}`
        : `${selectedYear}`,
    };
  }, [data, selectedTicketType, cashTicketTypes, viewMode, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchCashTicketTypes();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth, viewMode]);

  const fetchCashTicketTypes = async () => {
    try {
      const res = await api.get('/cash-ticket-types');
      setCashTicketTypes(res.data.data || []);
    } catch (error) {
      console.error('Error fetching cash ticket types:', error);
      if (error.response?.status === 404) {
        message.info("No cash ticket types found. Please add some types first.");
        setCashTicketTypes([]);
      } else {
        message.error("Failed to fetch cash ticket types");
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let res;
      if (viewMode === 'daily') {
        res = await api.get(`/cash-ticket-types/daily-collections?month=${selectedMonth}&year=${selectedYear}`);
      } else {
        res = await api.get(`/cash-ticket-types/monthly-collections?year=${selectedYear}`);
      }
      setData(res.data.data.daily_data || res.data.data.monthly_data || []);
    } catch (error) {
      console.error('Error fetching collections data:', error);
      message.error("Failed to fetch data");
    }
    setLoading(false);
  };

  const handleCreateType = async (values) => {
    try {
      await api.post('/cash-ticket-types', values);
      message.success("Cash ticket type created successfully!");
      setIsTypeModalVisible(false);
      typeForm.resetFields();
      fetchCashTicketTypes();
    } catch (error) {
      console.error(error);
      message.error("Failed to create cash ticket type");
    }
  };

  const handleUpdateType = async (id, values) => {
    try {
      await api.put(`/cash-ticket-types/${id}`, values);
      message.success("Cash ticket type updated successfully!");
      setIsTypeModalVisible(false);
      setEditingType(null);
      typeForm.resetFields();
      fetchCashTicketTypes();
    } catch (error) {
      console.error(error);
      message.error("Failed to update cash ticket type");
    }
  };

  const handleDeleteType = async (id) => {
    try {
      await api.delete(`/cash-ticket-types/${id}`);
      message.success("Cash ticket type deleted successfully!");
      fetchCashTicketTypes();
      fetchData();
    } catch (error) {
      console.error(error);
      message.error("Failed to delete cash ticket type");
    }
  };

  const openTypeModal = (type = null) => {
    if (type) {
      setEditingType(type);
      typeForm.setFieldsValue(type);
    } else {
      setEditingType(null);
      typeForm.resetFields();
    }
    setIsTypeModalVisible(true);
  };

  const openPaymentModal = (date = null) => {
    const defaultDate = date || dayjs().format('YYYY-MM-DD');
    setSelectedDate(defaultDate);
    
    // Find existing data for this date
    const existingData = data.find(row => row.date === defaultDate);
    
    // Initialize payment form with existing data or defaults
    const initialPayments = {};
    cashTicketTypes.forEach(type => {
      if (existingData && existingData.types && existingData.types[type.id]) {
        // Use existing data
        initialPayments[type.id] = { 
          amount: parseFloat(existingData.types[type.id].amount || 0),
          notes: existingData.types[type.id].notes || ''
        };
      } else {
        // Use defaults
        initialPayments[type.id] = { amount: 0, notes: '' };
      }
    });
    setDailyPayments(initialPayments);
    setIsPaymentModalVisible(true);
  };

  const handleSaveDailyPayments = async () => {
    try {
      const payments = Object.entries(dailyPayments)
        .filter(([_, data]) => data.amount > 0)
        .map(([cash_ticket_id, data]) => ({
          cash_ticket_id: parseInt(cash_ticket_id),
          amount: data.amount,
          notes: data.notes
        }));

      await api.post('/cash-ticket-types/save-daily-payments', {
        date: selectedDate,
        payments
      });

      message.success("Daily payments saved successfully!");
      setIsPaymentModalVisible(false);
      setDailyPayments({});
      fetchData();
    } catch (error) {
      console.error(error);
      message.error("Failed to save daily payments");
    }
  };

  const addGovernmentHeader = (doc, pageWidth, margin = 20) => {
    let yPosition = 10;
    
    // Government Header with Logos matching design
    try {
      // Add Municipality logo on the left (circular logo with blue, red, yellow, black elements)
      doc.addImage('/logo_Opol.png', 'PNG', margin, yPosition, 30, 30);
      
      // Add MEE logo on the right (predominantly red and yellow circular logo)
      doc.addImage('/logo_meeo.png', 'PNG', pageWidth - margin - 30, yPosition, 30, 30);
    } catch (error) {
      // Logos not found, continuing without them
    }
    
    yPosition += 15;
    
    // Centered Government Header - matching exact requirements
    doc.setFont('calibri', 'bold');
    doc.setFontSize(12.3);
    doc.text('Province of Misamis Oriental', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 6;
    doc.setFontSize(12.3);
    doc.text('Municipality of Opol', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 6;
    doc.setFontSize(12.5);
    doc.text('OFFICE OF THE MUNICIPAL ECONOMIC ENTERPRISE', pageWidth / 2, yPosition, { align: 'center' });
    
    // Add double lines below OFFICE OF THE MUNICIPAL ECONOMIC ENTERPRISE
    yPosition += 5;
    doc.setLineWidth(0.5);
    doc.line(margin + 30, yPosition, pageWidth - margin - 30, yPosition);
    yPosition += 2;
    doc.line(margin + 30, yPosition, pageWidth - margin - 30, yPosition);
    doc.setLineWidth(0); // Reset to default line width
    
    yPosition += 12;
    
    return yPosition; // Return the next y position for content
  };

  const exportToPDF = () => {
    try {
      setLoading(true);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 35;
      
      // Add letterhead template as background only on first page
      try {
        doc.addImage(letterheadTemplate, 'JPEG', 0, 0, pageWidth, pageHeight);
      } catch (error) {
        // Letterhead template not found, continuing without it
      }
      
      // Get the selected type name for the title
      const selectedTypeName = selectedTicketType === 'all' 
        ? 'All Types'
        : cashTicketTypes.find(t => t.id.toString() === selectedTicketType)?.type || 'Unknown';
      
      // Title - positioned after letterhead
      let yPosition = 55; // Start position after letterhead
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(`Cash Tickets Report - ${selectedTypeName} - ${viewMode === 'daily' ? dayjs().month(selectedMonth - 1).format('MMMM') : 'Yearly'} ${selectedYear}`, pageWidth / 2, yPosition, { align: 'center' });
      
      // Date
      yPosition += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      doc.text(`Generated on: ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      
      // Filter types to show based on selected tab
      const typesToShow = selectedTicketType === 'all' 
        ? cashTicketTypes 
        : cashTicketTypes.filter(type => type.id.toString() === selectedTicketType);
      
      // Prepare table data
      const tableColumns = viewMode === 'daily' 
        ? ['Date', ...typesToShow.map(getTicketLabel), 'Total']
        : ['Month', ...typesToShow.map(getTicketLabel), 'Total'];
      
      const tableData = data.map(row => {
        const rowData = viewMode === 'daily'
          ? [dayjs(row.date).format('MMM DD, YYYY')]
          : [row.month_name];
        
        typesToShow.forEach(type => {
          const amount = parseFloat(row.types[type.id]?.amount || 0);
          rowData.push(`${formatAmount(amount)}`);
        });
        
        // Calculate total for filtered types
        const filteredTotal = typesToShow.reduce((sum, type) => {
          return sum + parseFloat(row.types[type.id]?.amount || 0);
        }, 0);
        
        rowData.push(`${formatAmount(filteredTotal)}`);
        return rowData;
      });

      // Add table with white background and borders for all cells
      autoTable(doc, {
        head: [tableColumns],
        body: tableData,
        startY: yPosition + 10,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          fillColor: [255, 255, 255], // White background for all cells
          lineColor: [0, 0, 0], // Black borders
          lineWidth: 0.1,
          halign: 'center', // Center align all cells
          valign: 'middle'
        },
        headStyles: {
          fillColor: [255, 255, 255], // White background for header
          textColor: [0, 0, 0], // Black text for header
          lineColor: [0, 0, 0], // Black borders
          lineWidth: 0.1,
          fontStyle: 'bold',
          halign: 'center', // Center align header
          valign: 'middle'
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255], // White background for alternate rows
          lineColor: [0, 0, 0], // Black borders
          lineWidth: 0.1,
          halign: 'center', // Center align alternate rows
          valign: 'middle'
        },
        margin: { left: margin, right: margin, bottom: 25 },
      });

      // Save the PDF
      doc.save(`cash-tickets-${selectedTypeName.replace(/\s+/g, '-').toLowerCase()}-${viewMode}-${selectedYear}${viewMode === 'daily' ? `-${selectedMonth}` : ''}.pdf`);
      message.success("PDF exported successfully!");
    } catch (error) {
      console.error(error);
      message.error("Failed to export PDF");
    } finally {
      setLoading(false);
    }
  };

  const isToday = (date) => {
    return dayjs(date).isSame(dayjs(), 'day');
  };

  const canEdit = (date) => {
    if (viewMode !== 'daily') return false;
    
    const today = dayjs();
    const targetDate = dayjs(date);
    
    // Allow editing for today and past days, but not future days
    return targetDate.isSame(today, 'day') || targetDate.isBefore(today, 'day');
  };

 const getRowKey = (record, index) => {
  if (viewMode === 'daily') {
    return record.date
      ? `daily-${record.date}`
      : `daily-row-${index}`;
  }

  return record.month_name
    ? `monthly-${record.month_name}-${index}`
    : `monthly-row-${index}`;
};

const generateColumns = () => {
  const columns = [
    {
      title: viewMode === 'daily' ? "Date" : "Month",
      dataIndex: viewMode === 'daily' ? "date" : "month_name",
      key: viewMode === 'daily' ? "date" : "month",
      width: 160,
      fixed: 'left',
      align: 'left',
      render: (date, record) => {
        const hasCollection = viewMode === 'daily'
          ? Object.values(record.types || {}).some(value => parseFloat(value?.amount || 0) > 0)
          : true;

        return (
          <div className="date-cell">
            <Text strong>
              {viewMode === 'daily'
                ? dayjs(date).format("MMM DD, YYYY")
                : date}
            </Text>

            {viewMode === 'daily' && (
              <div className="date-meta">
                <Text type="secondary" className="date-weekday">
                  {dayjs(date).format('dddd')}
                </Text>
               
              </div>
            )}
          </div>
        );
      },
    },
  ];

  // Add dynamic columns for each cash ticket type
  const typesToShow =
    selectedTicketType === 'all'
      ? cashTicketTypes
      : cashTicketTypes.filter(
          type => type.id.toString() === selectedTicketType
        );

  if (typesToShow.length === 0) {
    columns.push({
      title:
        selectedTicketType === 'all'
          ? "No Types Available"
          : "Type Not Found",
      key: "no_types",
      width: 200,
      align: "center",
      render: () => (
        <Text type="secondary">
          {selectedTicketType === 'all'
            ? "Please add cash ticket types first"
            : "Selected type not found"}
        </Text>
      ),
    });
  } else {
    typesToShow.forEach(type => {
      columns.push({
        title: getTicketLabel(type),
        key: `type_${type.id}`,
        width: 160,
        align: "center",
        render: (_, record) => {
          const amount = parseFloat(
            record.types?.[type.id]?.amount || 0
          );

          return (
            <Text
              strong
              className={
                amount > 0
                  ? "amount-active"
                  : "amount-inactive"
              }
            >
              ₱{formatAmount(amount)}
            </Text>
          );
        },
      });
    });
  }

  // Total column
  columns.push({
    title: "Total Collected",
    dataIndex: "total",
    key: "total",
    width: 140,
    align: "center",
    fixed: 'right',
    render: (_, record) => {
      const filteredTotal = typesToShow.reduce((sum, type) => {
        return (
          sum +
          parseFloat(
            record.types?.[type.id]?.amount || 0
          )
        );
      }, 0);

      return (
        <Text
          strong
          className="total-amount"
        >
          ₱{formatAmount(filteredTotal)}
        </Text>
      );
    },
  });

  // Actions column - Daily only
  if (viewMode === 'daily') {
    columns.push({
      title: "Actions",
      key: "actions",
      width: 100,
      align: "center",
      fixed: 'right',
      render: (_, record) => {
        const editable = canEdit(record.date);

        return (
          <Tooltip
            title={
              editable
                ? "Record or update this day's collections"
                : "Collection editing is only available for current and past dates"
            }
          >
            <Button
              size="small"
              icon={<EditOutlined />}
              className={
                editable
                  ? "btn-edit"
                  : "btn-disabled"
              }
              onClick={() => {
                if (editable) {
                  openPaymentModal(record.date);
                } else {
                  message.warning(
                    "You can only record collections for today or earlier dates"
                  );
                }
              }}
              disabled={!editable}
            >
              {editable ? 'Record' : 'Locked'}
            </Button>
          </Tooltip>
        );
      },
    });
  }

  return columns;
};

  return (
    <div className="cash-ticket-management">
      {loading && <LoadingOverlay message="Loading..." />}

      <div className="container">
        {/* Header Section */}
        <header className="page-header">
          <div className="header-content">
            <div className="header-text">
              <Title level={1} className="page-title">
                Cash Ticket Collections
              </Title>
              <Text className="page-subtitle">
                {viewMode === 'daily' 
                  ? `Log and review daily cash ticket collections for ${dayjs().month(selectedMonth - 1).format('MMMM')} ${selectedYear}`
                  : `Review monthly cash ticket collections and totals for ${selectedYear}`
                }
              </Text>
            </div>
            <div className="header-actions">
              <Button
                className="action-button-secondary"
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchCashTicketTypes();
                  fetchData();
                }}
              >
                Refresh
              </Button>
              <Button
                className="action-button-primary"
                icon={<PlusOutlined />}
                onClick={() => openTypeModal()}
              >
                Add Type
              </Button>
              <Button
                className="action-button-secondary"
                icon={<FilePdfOutlined />}
                onClick={exportToPDF}
              >
                Export PDF
              </Button>
            </div>
          </div>
        </header>

        {/* Controls Section */}
        <section className="controls-section">
          <Card className="controls-card">
            <div className="controls-content">
              <div className="view-controls">
                <span className="control-label">Collection View</span>
                <Radio.Group
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="view-toggle"
                >
                  <Radio.Button value="daily">Daily Collection</Radio.Button>
                  <Radio.Button value="monthly">Monthly Summary</Radio.Button>
                </Radio.Group>
              </div>
              <div className="date-controls">
                <div className="date-field">
                  <span className="control-label">Year</span>
                  <DatePicker.YearPicker
                    value={dayjs().year(selectedYear)}
                    onChange={(date) => setSelectedYear(date?.year() || dayjs().year())}
                    placeholder="Select year"
                    className="date-picker"
                  />
                </div>
                {viewMode === 'daily' && (
                  <div className="date-field">
                    <span className="control-label">Month</span>
                    <DatePicker.MonthPicker
                      value={dayjs().month(selectedMonth - 1)}
                      onChange={(date) => setSelectedMonth(date?.month() + 1 || dayjs().month() + 1)}
                      placeholder="Select month"
                      className="date-picker"
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </section>

        <section className="summary-section">
          <div className="summary-grid">
            <div className="summary-card summary-card-primary">
              <span className="summary-label">Collection Total</span>
              <strong>₱{formatAmount(summaryStats.totalCollected)}</strong>
              <small>{selectedTypeName}</small>
            </div>
            <div className="summary-card summary-card-secondary">
              <span className="summary-label">Recorded Entries</span>
              <strong>{summaryStats.entries}</strong>
              <small>{viewMode === 'daily' ? 'Daily collection rows' : 'Monthly collection rows'}</small>
            </div>
            <div className="summary-card summary-card-success">
              <span className="summary-label">Collection Mode</span>
              <strong>{viewMode === 'daily' ? 'Daily' : 'Monthly'}</strong>
              <small>{summaryStats.currentView}</small>
            </div>
          </div>
        </section>

        {/* Ticket Types Section */}
        <section className="ticket-types-section">
          <Card className="ticket-types-card">
            <div className="section-header-row">
              <Title level={3} className="section-title">
                Cash Ticket Types
              </Title>
              <span className="section-badge">{cashTicketTypes.length} Active</span>
            </div>
            {cashTicketTypes.length === 0 ? (
              <Alert
                message="No Cash Ticket Types"
                description="Click 'Add Type' to create your first cash ticket type."
                type="info"
                className="empty-alert"
              />
            ) : (
              <div className="ticket-types-grid">
                {cashTicketTypes.map(type => (
                  <Card
                    key={type.id}
                    className="ticket-type-card"
                    onClick={() => openTypeModal(type)}
                    hoverable
                  >
                    <div className="ticket-type-content">
                      <div className="ticket-type-icon">
                        <DollarOutlined />
                      </div>
                      <div className="ticket-type-info">
                        <div className="ticket-type-enterprise">
                          {type.enterprise || 'Enterprise not assigned'}
                        </div>
                        <div className="ticket-type-name">{type.type}</div>
                        <div className="ticket-type-amount">
                          ₱{formatAmount(type.amount || 0)} per ticket
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* Main Table Section */}
        <section className="table-section">
          <Card className="table-card">
            <div className="table-header">
              <Alert
                message={`${viewMode === 'daily' ? 'Daily' : 'Monthly'} Collections`}
                description={
                  viewMode === 'daily'
                    ? "View and manage collections for each day. You can only edit today's collections."
                    : "View monthly collections for the entire year. Monthly view is read-only."
                }
                type="info"
                className="table-alert"
              />
              
              {/* Ticket Type Tabs */}
              {cashTicketTypes.length > 0 && (
                <Tabs
                  activeKey={selectedTicketType}
                  onChange={(key) => setSelectedTicketType(key)}
                  className="ticket-tabs"
                >
                  <Tabs.TabPane 
                    tab={
                      <span className="tab-label">
                        <DollarOutlined />
                        All Types
                      </span>
                    } 
                    key="all" 
                  />
                  {cashTicketTypes.map(type => (
                    <Tabs.TabPane 
                      tab={
                        <span className="tab-label">
                          <DollarOutlined />
                          {getTicketLabel(type)}
                        </span>
                      } 
                      key={type.id.toString()} 
                    />
                  ))}
                </Tabs>
              )}
            </div>
            
          <Table
  columns={generateColumns()}
  dataSource={data}
  rowKey={getRowKey}
  pagination={{
    pageSize: viewMode === 'daily' ? 31 : 12,
    showSizeChanger: false,
    showQuickJumper: true,
    showTotal: (total, range) =>
      `${range[0]}-${range[1]} of ${total} items`,
  }}
  scroll={{
    x:
      (selectedTicketType === 'all'
        ? cashTicketTypes.length
        : 1) * 160 + 400,
  }}
  className="data-table"
/>
          </Card>
        </section>
      </div>

      {/* Add/Edit Cash Ticket Type Modal */}
      <Modal
        title={
          <div className="modal-title-wrap">
            <span className="modal-title-badge">{editingType ? 'Update' : 'New'}</span>
            <span>{editingType ? "Cash Ticket Type" : "Cash Ticket Type"}</span>
          </div>
        }
        open={isTypeModalVisible}
        onCancel={() => {
          setIsTypeModalVisible(false);
          setEditingType(null);
          typeForm.resetFields();
        }}
        footer={null}
        width={760}
        centered
        closeIcon={<CloseOutlined />}
        styles={{
          mask: {
            backgroundColor: 'rgba(20, 33, 61, 0.58)',
            backdropFilter: 'blur(6px)',
          },
        }}
        className="type-modal"
      >
        <div className="modal-intro">
          <div className="modal-intro-icon">
            <PlusOutlined />
          </div>
          <div className="modal-intro-copy">
            <strong>{editingType ? 'Update account details' : 'Create a new ticket category'}</strong>
            <span>{editingType ? 'Adjust the selected ticket type and pricing.' : 'Define the ticket category used for daily cash collection entries.'}</span>
          </div>
        </div>

        <Form
          form={typeForm}
          layout="vertical"
          className="type-form"
          onFinish={(values) => {
            if (editingType) {
              handleUpdateType(editingType.id, values);
            } else {
              handleCreateType(values);
            }
          }}
        >
          <Form.Item
            name="type"
            label="Type Name"
            rules={[{ required: true, message: "Please enter type name" }]}
          >
            <Input placeholder="e.g., Market, Toilet, Parking" />
          </Form.Item>

          <Form.Item
            name="enterprise"
            label="Enterprise"
            rules={[{ required: true, message: "Please enter the enterprise name" }]}
          >
            <Select placeholder="Select an enterprise">
              <Option value="Market">Market</Option>
              <Option value="Wharf">Wharf</Option>
              <Option value="Slaughterhouse">Slaughterhouse</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: "Please enter quantity" }]}
          >
            <InputNumber
              placeholder="Enter quantity"
              min={1}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: "Please enter amount" }]}
          >
            <InputNumber
              placeholder="Enter amount"
              min={0}
              precision={2}
              style={{ width: "100%" }}
              formatter={value => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₱\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea placeholder="Optional notes" rows={3} />
          </Form.Item>

          <Divider />
          
          <div className="form-actions">
            <Button
              className="modal-button-secondary"
              onClick={() => setIsTypeModalVisible(false)}
            >
              Cancel
            </Button>
            <Button
              htmlType="submit" 
              className="btn-primary"
            >
              {editingType ? "Update" : "Create"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Daily Payments Modal */}
      <Modal
        title={
          <div className="modal-title-wrap">
            <span className="modal-title-badge">Collection</span>
            <span>{dayjs(selectedDate).format('MMMM DD, YYYY')}</span>
          </div>
        }
        open={isPaymentModalVisible}
        onCancel={() => {
          setIsPaymentModalVisible(false);
          setDailyPayments({});
        }}
        footer={null}
        width={760}
        centered
        closeIcon={<CloseOutlined />}
        styles={{
          mask: {
            backgroundColor: 'rgba(20, 33, 61, 0.58)',
            backdropFilter: 'blur(6px)',
          },
        }}
        className="payment-modal"
      >
        <div className="modal-summary-card">
          <span className="summary-chip">Selected Collection</span>
          <strong>{dayjs(selectedDate).format('dddd, MMMM DD, YYYY')}</strong>
          <small>{selectedTypeName}</small>
        </div>

        <Form layout="vertical" className="payment-form" onFinish={handleSaveDailyPayments}>
          <div className="payment-items">
            {cashTicketTypes
              .filter(type => selectedTicketType === 'all' || type.id.toString() === selectedTicketType)
              .map(type => (
                <div key={type.id} className="payment-item">
                  <div className="payment-item-header">
                    <span>{getTicketLabel(type)}</span>
                    <span className="payment-item-tag">Ticket</span>
                  </div>
                  <Form.Item className="payment-field">
                    <InputNumber
                      placeholder="0.00"
                      min={0}
                      precision={2}
                      style={{ width: "100%" }}
                      formatter={value => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/₱\s?|(,*)/g, '')}
                      value={dailyPayments[type.id]?.amount || 0}
                      onChange={(value) => {
                        setDailyPayments(prev => ({
                          ...prev,
                          [type.id]: {
                            ...prev[type.id],
                            amount: value || 0
                          }
                        }));
                      }}
                    />
                  </Form.Item>
                </div>
              ))}
          </div>

          <Divider />
          
          <div className="form-actions">
            <Button
              className="modal-button-secondary"
              onClick={() => setIsPaymentModalVisible(false)}
            >
              Cancel
            </Button>
            <Button
              htmlType="submit" 
              className="btn-primary"
            >
              Save Collections
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CashTicketManagement;
