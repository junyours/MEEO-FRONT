import React, { useState, useEffect } from 'react';
import api from '../Api';
import LoadingOverlay from './Loading';
import dayjs from 'dayjs';
import {
  Card,
  Table,
  Row,
  Col,
  Statistic,
  Spin,
  Typography,
  Button,
  message,
  Space,
  Tag,
  Divider,
  Input,
  Modal,
  Descriptions,
  Badge,
  DatePicker,
  Form,
} from 'antd';
import {
  DollarOutlined,
  ShopOutlined,
  PrinterOutlined,
  DownloadOutlined,
  HomeOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import letterheadTemplate from '../assets/report_template/letterhead_template.jpg';

const { Title, Text } = Typography;

const RentalReport = () => {
  const [loading, setLoading] = useState(false);
  const [rentalData, setRentalData] = useState(null);
  const [totals, setTotals] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [vendorDetails, setVendorDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editingRented, setEditingRented] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ rented_at: '' });
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    fetchRentalReport();
  }, []);

  useEffect(() => {
    if (rentalData) {
      filterData();
    }
  }, [searchTerm, rentalData]);

  const fetchRentalReport = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/rental-report');
      if (response.data.status === 'success') {
        setRentalData(response.data.data);
        setTotals(response.data.totals);
      }
    } catch (error) {
      console.error('Error fetching rental report:', error);
      message.error('Failed to fetch rental report data');
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    if (!searchTerm.trim()) {
      setFilteredData(rentalData);
      return;
    }

    const filtered = rentalData.filter(item => 
      item.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const fetchVendorDetails = async (vendorName) => {
    setDetailsLoading(true);
    try {
      const response = await api.get(`/reports/vendor-details?vendor_name=${encodeURIComponent(vendorName)}`);
      if (response.data.status === 'success') {
        setVendorDetails(response.data.data);
        setDetailsModalVisible(true);
      } else {
        message.error('Failed to fetch vendor details');
      }
    } catch (error) {
      console.error('Error fetching vendor details:', error);
      message.error('Failed to fetch vendor details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewDetails = (record) => {
    setSelectedVendor(record);
    fetchVendorDetails(record.vendor_name);
  };

  const handleEditRentedAt = (stallDetail) => {
    setEditingRented(stallDetail);
    setEditForm({ 
      rented_at: stallDetail.created_at ? dayjs(stallDetail.created_at).format('YYYY-MM-DD') : '' 
    });
    setEditModalVisible(true);
  };

  const handleUpdateRentedAt = async () => {
    if (!editingRented || !editForm.rented_at) {
      message.error('Please select a valid date');
      return;
    }

    setUpdateLoading(true);
    try {
      // We'll need to add the rented_id to the stall details
      const response = await api.put(`/rented/${editingRented.rented_id}/update-rented-at`, {
        rented_at: editForm.rented_at
      });
      
      if (response.data.status === 'success') {
        message.success('Rented at date updated successfully');
        setEditModalVisible(false);
        setEditingRented(null);
        // Refresh vendor details to show updated data
        if (selectedVendor) {
          fetchVendorDetails(selectedVendor.vendor_name);
        }
      } else {
        message.error('Failed to update rented at date');
      }
    } catch (error) {
      console.error('Error updating rented at date:', error);
      message.error('Failed to update rented at date');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setEditingRented(null);
    setEditForm({ rented_at: '' });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'occupied':
        return 'green';
      case 'temp_closed':
      case 'temporary closed':
        return 'orange';
      case 'partial':
        return 'blue';
      case 'fully paid':
        return 'purple';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'temp_closed':
        return 'Temporarily Closed';
      case 'fully paid':
        return 'Fully Paid';
      default:
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatCurrencyForPDF = (amount) => {
    return formatCurrency(amount);
  };

  const exportToPDF = () => {
    if (!rentalData || !totals) {
      message.error('No data available to export');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      
      // Add letterhead template as background
      try {
        doc.addImage(letterheadTemplate, 'JPEG', 0, 0, pageWidth, pageHeight);
      } catch (error) {
        // Letterhead template not found, continuing without it
      }
      
      doc.setFont('helvetica');
      
      // Add government header
      let yPosition = 90; // Moved further down to avoid letterhead background colors
      
      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Rental Report', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      
      // Date - centered
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const generatedText = `Generated: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`;
      const textWidth = doc.getTextWidth(generatedText);
      doc.text(generatedText, (pageWidth - textWidth) / 2, yPosition);
      
      yPosition += 15;
      
      // Summary Statistics
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Summary', margin + 5, yPosition); // Moved slightly right to align with table and avoid colored areas
      
      // Summary data
      const summaryData = [
        ['Total Daily Rental', totals.daily_rental.toFixed(2)],
        ['Total Monthly Rental', totals.monthly_rental.toFixed(2)],
        ['Total Records', rentalData.length.toString()],
      ];
      
      autoTable(doc, {
        head: [['Description', 'Amount']],
        body: summaryData,
        startY: yPosition + 8, // Start table 8mm below the Summary text
        margin: { left: 25, right: 20 }, // Small left margin to avoid colored areas while staying visually aligned
        theme: 'grid',
        styles: { 
          fontSize: 10, 
          lineWidth: 0.1, 
          lineColor: [0, 0, 0],
          textColor: [0, 0, 0],
          halign: 'center',
          fillColor: [255, 255, 255] // White background to ensure readability
        },
        headStyles: { 
          fillColor: [245, 245, 245], 
          textColor: [0, 0, 0],
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 50, halign: 'center' }
        }
      });
      
      yPosition = doc.lastAutoTable.finalY + 15;
      
      // Detailed Report Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Detailed Rental Report', margin, yPosition); // Reverted to original position
      
      yPosition += 8;
      
      // Prepare table data with requested column order and no peso sign
      const tableData = rentalData.map((item, index) => [
        index + 1,
        item.vendor_name,
        item.section_name,
        item.stall_numbers.join(', '),
        item.daily_rental_total.toFixed(2),
        item.monthly_rental_total.toFixed(2),
      ]);
      
      // Split data: first 10 for first page, rest for subsequent pages
      const firstPageData = tableData.slice(0, 10);
      const remainingData = tableData.slice(10);
      
      // First page - only 10 vendors
      autoTable(doc, {
        head: [['#', 'Vendor Name', 'Section', 'Stall Numbers', 'Daily Rental', 'Monthly Rental']],
        body: firstPageData,
        startY: yPosition,
        theme: 'grid',
        styles: { 
          fontSize: 9, 
          lineWidth: 0.1, 
          lineColor: [0, 0, 0],
          textColor: [0, 0, 0],
          halign: 'center',
          fillColor: [255, 255, 255] // White background to ensure readability
        },
        headStyles: { 
          fillColor: [245, 245, 245], 
          textColor: [0, 0, 0],
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 50, halign: 'center' },
          2: { cellWidth: 40, halign: 'center' },
          3: { cellWidth: 35, halign: 'center' },
          4: { cellWidth: 25, halign: 'center' },
          5: { cellWidth: 25, halign: 'center' }
        },
        didDrawPage: (data) => {
          // Header is already handled by letterhead template, no need for additional header
        }
      });
      
      // Add remaining vendors on new pages if there are any
      if (remainingData.length > 0) {
        // Add new page for remaining vendors
        doc.addPage();
        
        // Add remaining vendors table without letterhead
        autoTable(doc, {
          head: [['#', 'Vendor Name', 'Section', 'Stall Numbers', 'Daily Rental', 'Monthly Rental']],
          body: remainingData,
          startY: 20, // Start from top of plain page
          theme: 'grid',
          styles: { 
            fontSize: 9, 
            lineWidth: 0.1, 
            lineColor: [0, 0, 0],
            textColor: [0, 0, 0],
            halign: 'center',
            fillColor: [255, 255, 255] // White background to ensure readability
          },
          headStyles: { 
            fillColor: [245, 245, 245], 
            textColor: [0, 0, 0],
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
            halign: 'center'
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 50, halign: 'center' },
            2: { cellWidth: 40, halign: 'center' },
            3: { cellWidth: 35, halign: 'center' },
            4: { cellWidth: 25, halign: 'center' },
            5: { cellWidth: 25, halign: 'center' }
          },
          didDrawPage: (data) => {
            // No header needed for continuation pages
          }
        });
      }
      
      // Save the PDF
      doc.save(`rental-report-${new Date().toISOString().split('T')[0]}.pdf`);
      message.success('PDF exported successfully');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('Failed to generate PDF');
    }
  };

  const columns = [
    {
      title: 'No.',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (text, record, index) => (
        <Text strong>{index + 1}</Text>
      ),
    },
  
    {
      title: 'Vendor Name',
      dataIndex: 'vendor_name',
      key: 'vendor_name',
      width: 200,
      render: (text) => (
        <Text strong style={{ color: '#1f2937' }}>{text}</Text>
      ),
    },  
    {
      title: 'Section',
      dataIndex: 'section_name',
      key: 'section_name',
      width: 150,
      render: (text) => (
        <Tag color="blue" style={{ borderRadius: 6, fontWeight: 'bold' }}>
          {text}
        </Tag>
      ),
    },
    {
      title: 'Stall Numbers',
      dataIndex: 'stall_numbers',
      key: 'stall_numbers',
      width: 200,
      render: (stallNumbers) => (
        <Space wrap>
          {stallNumbers.map((stall, index) => (
            <Tag key={index} color="green" style={{ borderRadius: 4, fontSize: '11px' }}>
              {stall}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Daily Rental',
      dataIndex: 'daily_rental_total',
      key: 'daily_rental_total',
      width: 120,
      align: 'right',
      render: (amount) => (
        <Text strong style={{ color: '#059669' }}>
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: 'Monthly Rental',
      dataIndex: 'monthly_rental_total',
      key: 'monthly_rental_total',
      width: 130,
      align: 'right',
      render: (amount) => (
        <Text strong style={{ color: '#dc2626' }}>
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (text, record) => (
        <Button
          type="default"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
          className="view-details-btn"
          style={{ 
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            color: '#000000',
            borderColor: '#d9d9d9'
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        background: 'white', 
        padding: '24px', 
        borderRadius: '12px', 
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Space align="center">
              <ShopOutlined style={{ fontSize: '24px', color: '#2563eb' }} />
              <div>
                <Title level={3} style={{ margin: 0, color: '#1f2937' }}>
                  Rental Report
                </Title>
                <Text type="secondary">
                  Vendor rental information by sections and stalls
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchRentalReport}
                size="large"
                disabled={loading}
                style={{ 
                  borderRadius: '8px'
                }}
              >
                Refresh
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={exportToPDF}
                type="primary"
                size="large"
                style={{ 
                  background: '#2563eb', 
                  borderColor: '#2563eb',
                  borderRadius: '8px'
                }}
              >
                Export to PDF
              </Button>
            </Space>
          </Col>
        </Row>
        
        {/* Search Bar */}
        
      </div>

      {/* Summary Cards */}
      {totals && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={8}>
            <Card 
              style={{ 
                borderRadius: '12px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <Statistic
                title={
                  <Space>
                    <DollarOutlined style={{ color: '#059669' }} />
                    <span style={{ color: '#6b7280', fontWeight: 500 }}>Total Daily Rental</span>
                  </Space>
                }
                value={totals.daily_rental}
                formatter={(value) => formatCurrency(value)}
                valueStyle={{ 
                  color: '#059669', 
                  fontWeight: 'bold',
                  fontSize: '24px'
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card 
              style={{ 
                borderRadius: '12px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <Statistic
                title={
                  <Space>
                    <DollarOutlined style={{ color: '#dc2626' }} />
                    <span style={{ color: '#6b7280', fontWeight: 500 }}>Total Monthly Rental</span>
                  </Space>
                }
                value={totals.monthly_rental}
                formatter={(value) => formatCurrency(value)}
                valueStyle={{ 
                  color: '#dc2626', 
                  fontWeight: 'bold',
                  fontSize: '24px'
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card 
              style={{ 
                borderRadius: '12px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <Statistic
                title={
                  <Space>
                    <HomeOutlined style={{ color: '#2563eb' }} />
                    <span style={{ color: '#6b7280', fontWeight: 500 }}>Total Records</span>
                  </Space>
                }
                value={rentalData?.length || 0}
                valueStyle={{ 
                  color: '#2563eb', 
                  fontWeight: 'bold',
                  fontSize: '24px'
                }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Table */}
      <Card 
        style={{ 
          borderRadius: '12px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}
        bodyStyle={{ padding: '0' }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={4} style={{ margin: 0, color: '#1f2937' }}>
                Detailed Rental Information
              </Title>
              <Text type="secondary">
                Shows each vendor's rental details grouped by section
              </Text>
            </div>
            <Input.Search
              placeholder="Search vendors..."
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 250 }}
            />
          </div>
        }
      >
        
        <Table
          columns={columns}
          dataSource={filteredData || rentalData}
          rowKey={(record, index) => index}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} records`,
            style: { padding: '16px' }
          }}
          scroll={{ x: 800 }}
          style={{ 
            background: 'white'
          }}
        />
      </Card>

      {/* Vendor Details Modal */}
      <Modal
        title={`Vendor Details - ${selectedVendor?.vendor_name || ''}`}
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedVendor(null);
          setVendorDetails(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
        destroyOnClose
      >
        <Spin spinning={detailsLoading}>
          {vendorDetails && (
            <div>
              {/* Vendor Summary */}
              <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f8fafc' }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Vendor Name">
                    <Text strong>{vendorDetails.vendor_name}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Stalls">
                    <Badge count={vendorDetails.total_stalls} style={{ backgroundColor: '#52c41a' }} />
                  </Descriptions.Item>
                  <Descriptions.Item label="Section">
                    <Tag color="blue">{vendorDetails.section_name}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Daily Rental">
                    <Text strong style={{ color: '#059669' }}>
                      {formatCurrency(vendorDetails.total_daily_rental)}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Monthly Rental">
                    <Text strong style={{ color: '#dc2626' }}>
                      {formatCurrency(vendorDetails.total_monthly_rental)}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Stall Details */}
              <Title level={5}>Stall Details</Title>
              <Table
                dataSource={vendorDetails.stall_details}
                rowKey="stall_number"
                size="small"
                pagination={false}
                columns={[
                  {
                    title: 'Stall No.',
                    dataIndex: 'stall_number',
                    key: 'stall_number',
                    width: 100,
                    render: (text) => <Tag color="green">{text}</Tag>,
                  },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    width: 150,
                    render: (status) => (
                      <Badge 
                        status={getStatusColor(status)} 
                        text={getStatusText(status)} 
                      />
                    ),
                  },
                  {
                    title: 'Daily Rent',
                    dataIndex: 'daily_rent',
                    key: 'daily_rent',
                    align: 'right',
                    width: 120,
                    render: (amount) => formatCurrency(amount),
                  },
                  {
                    title: 'Monthly Rent',
                    dataIndex: 'monthly_rent',
                    key: 'monthly_rent',
                    align: 'right',
                    width: 120,
                    render: (amount) => formatCurrency(amount),
                  },
                  {
                    title: 'Rented At',
                    dataIndex: 'created_at',
                    key: 'created_at',
                    width: 120,
                    render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : 'N/A',
                  },
                  {
                    title: 'Last Payment',
                    dataIndex: 'last_payment_date',
                    key: 'last_payment_date',
                    width: 120,
                    render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : 'Never',
                  },
                  {
                    title: 'Action',
                    key: 'action',
                    width: 100,
                    align: 'center',
                    render: (text, record) => (
                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditRentedAt(record)}
                        style={{ color: '#1890ff' }}
                      >
                        Edit Record
                      </Button>
                    ),
                  },
                ]}
              />
            </div>
          )}
        </Spin>
      </Modal>

      {/* Edit Rented At Modal */}
      <Modal
        title="Edit Rented At Date"
        open={editModalVisible}
        onOk={handleUpdateRentedAt}
        onCancel={handleCancelEdit}
        confirmLoading={updateLoading}
        okText="Update"
        cancelText="Cancel"
        width={400}
      >
        <Form layout="vertical">
          <Form.Item label="Stall Number">
            <Text strong>{editingRented?.stall_number || 'N/A'}</Text>
          </Form.Item>
          <Form.Item label="Current Rented At">
            <Text>
              {editingRented?.created_at ? dayjs(editingRented.created_at).format('MMMM DD, YYYY') : 'N/A'}
            </Text>
          </Form.Item>
          <Form.Item 
            label="New Rented At Date" 
            required
            help="Select the new rented at date for this stall"
          >
            <DatePicker
              value={editForm.rented_at ? dayjs(editForm.rented_at) : null}
              onChange={(date) => {
                setEditForm({
                  ...editForm,
                  rented_at: date ? date.format('YYYY-MM-DD') : ''
                });
              }}
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder="Select new rented at date"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Custom CSS */}
      <style>{`
        .ant-table-thead > tr > th {
          background: #f8fafc !important;
          font-weight: 600 !important;
          color: #374151 !important;
          border-bottom: 2px solid #e5e7eb !important;
        }
        
        .ant-table-tbody > tr:hover > td {
          background: #f0f9ff !important;
        }
        
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f3f4f6 !important;
        }
        
        .ant-statistic-title {
          margin-bottom: 8px !important;
        }
        
        .ant-card {
          transition: all 0.2s ease !important;
        }
        
        .ant-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
          transform: translateY(-1px) !important;
        }
        
        .view-details-btn:hover {
          background-color: #2563eb !important;
          color: #ffffff !important;
          border-color: #2563eb !important;
        }
      `}</style>
    </div>
  );
};

export default RentalReport;
