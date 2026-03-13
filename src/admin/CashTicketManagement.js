import React, { useEffect, useState } from "react";
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
} from "@ant-design/icons";
import LoadingOverlay from "./Loading";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./CashTicketManagement.css";

const { Text, Title } = Typography;
const { Option } = Select;

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

  useEffect(() => {
    fetchCashTicketTypes();
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
      console.log('Logos not found:', error);
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
      const doc = new jsPDF();
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      
      // Add government header
      let yPosition = addGovernmentHeader(doc, pageWidth, margin);
      
      // Get the selected type name for the title
      const selectedTypeName = selectedTicketType === 'all' 
        ? 'All Types'
        : cashTicketTypes.find(t => t.id.toString() === selectedTicketType)?.type || 'Unknown';
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(colors.primary);
      doc.text(`Cash Tickets Report - ${selectedTypeName} - ${viewMode === 'daily' ? dayjs().month(selectedMonth - 1).format('MMMM') : 'Yearly'} ${selectedYear}`, pageWidth / 2, yPosition, { align: 'center' });
      
      // Filter types to show based on selected tab
      const typesToShow = selectedTicketType === 'all' 
        ? cashTicketTypes 
        : cashTicketTypes.filter(type => type.id.toString() === selectedTicketType);
      
      // Prepare table data
      const tableColumns = viewMode === 'daily' 
        ? ['Date', ...typesToShow.map(t => t.type), 'Total']
        : ['Month', ...typesToShow.map(t => t.type), 'Total'];
      
      const tableData = data.map(row => {
        const rowData = viewMode === 'daily'
          ? [dayjs(row.date).format('MMM DD, YYYY')]
          : [row.month_name];
        
        typesToShow.forEach(type => {
          const amount = parseFloat(row.types[type.id]?.amount || 0);
          rowData.push(`${amount.toFixed(2)}`);
        });
        
        // Calculate total for filtered types
        const filteredTotal = typesToShow.reduce((sum, type) => {
          return sum + parseFloat(row.types[type.id]?.amount || 0);
        }, 0);
        
        rowData.push(`${filteredTotal.toFixed(2)}`);
        return rowData;
      });

      // Add table
      autoTable(doc, {
        head: [tableColumns],
        body: tableData,
        startY: yPosition + 10,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [0, 0, 0], // Black borders
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [27, 79, 114],
          textColor: 255,
          lineColor: [0, 0, 0], // Black borders
          lineWidth: 0.1,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
          lineColor: [0, 0, 0], // Black borders
          lineWidth: 0.1,
        },
        margin: { top: yPosition + 10, bottom: 20 },
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

  const generateColumns = () => {
    const columns = [
      {
        title: viewMode === 'daily' ? "Date" : "Month",
        dataIndex: viewMode === 'daily' ? "date" : "month_name",
        key: "date",
        width: 120,
        fixed: 'left',
        render: (date, record) => (
          <div className="date-cell">
            <Text strong>
              {viewMode === 'daily' ? dayjs(date).format("MMM DD, YYYY") : date}
            </Text>
            {viewMode === 'daily' && (
              <Text type="secondary" className="date-weekday">
                {dayjs(date).format('dddd')}
              </Text>
            )}
          </div>
        ),
      },
    ];

    // Add dynamic columns for each cash ticket type or just the selected one
    const typesToShow = selectedTicketType === 'all' 
      ? cashTicketTypes 
      : cashTicketTypes.filter(type => type.id.toString() === selectedTicketType);

    if (typesToShow.length === 0) {
      columns.push({
        title: selectedTicketType === 'all' ? "No Types Available" : "Type Not Found",
        key: "no_types",
        width: 200,
        align: "center",
        render: () => (
          <Text type="secondary">
            {selectedTicketType === 'all' ? "Please add cash ticket types first" : "Selected type not found"}
          </Text>
        ),
      });
    } else {
      typesToShow.forEach(type => {
      columns.push({
        title: type.type,
        key: `type_${type.id}`,
        width: 120,
        align: "right",
        render: (_, record) => {
          const amount = parseFloat(record.types[type.id]?.amount || 0);
          return (
            <Text 
              strong 
              className={amount > 0 ? "amount-active" : "amount-inactive"}
            >
              ₱{amount.toFixed(2)}
            </Text>
          );
        },
      });
    });
    }

    columns.push({
      title: "Total Collected",
      dataIndex: "total",
      key: "total",
      width: 140,
      align: "right",
      fixed: 'right',
      render: (_, record) => {
        // Calculate total based on selected ticket type
        const typesToShow = selectedTicketType === 'all' 
          ? cashTicketTypes 
          : cashTicketTypes.filter(type => type.id.toString() === selectedTicketType);
        
        const filteredTotal = typesToShow.reduce((sum, type) => {
          return sum + parseFloat(record.types[type.id]?.amount || 0);
        }, 0);
        
        return (
          <Text 
            strong 
            className="total-amount"
          >
            ₱{filteredTotal.toFixed(2)}
          </Text>
        );
      },
    });

    if (viewMode === 'daily') {
      columns.push({
        title: "Actions",
        key: "actions",
        width: 100,
        align: "center",
        fixed: 'right',
        render: (_, record) => (
          <Tooltip title={canEdit(record.date) ? "Edit Today's Collections" : "Cannot edit - not today"}>
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              className={canEdit(record.date) ? "btn-edit" : "btn-disabled"}
              onClick={() => {
                if (canEdit(record.date)) {
                  openPaymentModal(record.date);
                } else {
                  message.warning("You can only edit collections for today");
                }
              }}
              disabled={!canEdit(record.date)}
            >
              Edit
            </Button>
          </Tooltip>
        ),
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
                Cash Tickets Management
              </Title>
              <Text className="page-subtitle">
                {viewMode === 'daily' 
                  ? `${dayjs().month(selectedMonth - 1).format('MMMM')} ${selectedYear} - Daily View`
                  : `${selectedYear} - Monthly View`
                }
              </Text>
            </div>
            <div className="header-actions">
              <Button
                icon={<PlusOutlined />}
                onClick={() => openTypeModal()}
                className="btn-primary"
              >
                Add Type
              </Button>
              <Button
                icon={<FilePdfOutlined />}
                onClick={exportToPDF}
                className="btn-danger"
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
                <Radio.Group
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="view-toggle"
                >
                  <Radio.Button value="daily">Daily View</Radio.Button>
                  <Radio.Button value="monthly">Monthly View</Radio.Button>
                </Radio.Group>
              </div>
              <div className="date-controls">
                <DatePicker.YearPicker
                  value={dayjs().year(selectedYear)}
                  onChange={(date) => setSelectedYear(date?.year() || dayjs().year())}
                  placeholder="Select year"
                  className="date-picker"
                />
                {viewMode === 'daily' && (
                  <DatePicker.MonthPicker
                    value={dayjs().month(selectedMonth - 1)}
                    onChange={(date) => setSelectedMonth(date?.month() + 1 || dayjs().month() + 1)}
                    placeholder="Select month"
                    className="date-picker"
                  />
                )}
              </div>
            </div>
          </Card>
        </section>

        {/* Ticket Types Section */}
        <section className="ticket-types-section">
          <Card className="ticket-types-card">
            <Title level={3} className="section-title">
              Cash Ticket Types
            </Title>
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
                        <div className="ticket-type-name">{type.type}</div>
                        <div className="ticket-type-amount">
                          ₱{parseFloat(type.amount || 0).toFixed(2)}
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
                          {type.type}
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
              rowKey={record => viewMode === 'daily' ? record.date : record.month_name}
              pagination={{
                pageSize: viewMode === 'daily' ? 31 : 12,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
              scroll={{ x: (selectedTicketType === 'all' ? cashTicketTypes.length : 1) * 120 + 400 }}
              className="data-table"
            />
          </Card>
        </section>
      </div>

      {/* Add/Edit Cash Ticket Type Modal */}
      <Modal
        title={editingType ? "Edit Cash Ticket Type" : "Add Cash Ticket Type"}
        open={isTypeModalVisible}
        onCancel={() => {
          setIsTypeModalVisible(false);
          setEditingType(null);
          typeForm.resetFields();
        }}
        footer={null}
        className="type-modal"
      >
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
            <Button onClick={() => setIsTypeModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" className="btn-primary">
              {editingType ? "Update" : "Create"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Daily Payments Modal */}
      <Modal
        title={`Edit Collections for ${dayjs(selectedDate).format('MMMM DD, YYYY')}`}
        open={isPaymentModalVisible}
        onCancel={() => {
          setIsPaymentModalVisible(false);
          setDailyPayments({});
        }}
        footer={null}
        className="payment-modal"
      >
        <Form layout="vertical" className="payment-form" onFinish={handleSaveDailyPayments}>
          <div className="payment-items">
            {cashTicketTypes
              .filter(type => selectedTicketType === 'all' || type.id.toString() === selectedTicketType)
              .map(type => (
                <div key={type.id} className="payment-item">
                  <Form.Item label={type.type}>
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
            <Button onClick={() => setIsPaymentModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" className="btn-primary">
              Save Collections
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CashTicketManagement;
