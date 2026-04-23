import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './VendorManagement.css';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
  
  Tabs,
  Row,
  Col,
  Avatar,
  Typography,
  Statistic,
  Tooltip,
  Badge,

  Empty,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  PhoneOutlined,
  
  SearchOutlined,
  FilterOutlined,

  ReloadOutlined,
  EyeOutlined,
  TeamOutlined,
  UserSwitchOutlined,
  EnvironmentOutlined,

  FilePdfOutlined,
} from '@ant-design/icons';
import api from '../Api';
import LoadingOverlay from './Loading';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Text, Title } = Typography;

// Minimalist Color Scheme
const colors = {
  primary: '#1a1a1a',
  secondary: '#4a4a4a',
  accent: '#2563eb',
  success: '#16a34a',
  warning: '#ea580c',
  danger: '#dc2626',
  background: '#fafafa',
  surface: '#ffffff',
  border: '#e5e5e5',
  text: '#171717',
  textSecondary: '#737373',
  textMuted: '#a3a3a3'
};

// Screen-specific CSS class names
const cssClasses = {
  container: 'vm-container',
  header: 'vm-header',
  statsCard: 'vm-stats-card',
  searchSection: 'vm-search-section',
  tableSection: 'vm-table-section',
  modal: 'vm-modal',
  button: 'vm-button',
  buttonPrimary: 'vm-button-primary',
  input: 'vm-input',
  card: 'vm-card'
};

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10, // Fixed at 10 per page
    total: 0,
  });
  const [form] = Form.useForm();

const fetchVendors = async (isSearchOperation = false) => {
  try {
    if (!isSearchOperation) {
      setLoading(true);
    }

    const queryParams = {
      search: searchText || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    };

    const response = await api.get('/vendor-management', { params: queryParams });

    const vendorData = response.data;

    setVendors(Array.isArray(vendorData) ? vendorData : []);
    setPagination(prev => ({
      ...prev,
      total: Array.isArray(vendorData) ? vendorData.length : 0
    }));

  } catch (error) {
    message.error('Failed to fetch vendors');
  } finally {
    if (!isSearchOperation) {
      setLoading(false);
    }
  }
};


  useEffect(() => {
    fetchVendors(); // Initial load shows loading
  }, []);

useEffect(() => {
  fetchVendors(true); // Search/filter changes don't show loading
}, [searchText, statusFilter]);


  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
  };

  const handleReset = () => {
    setSearchText('');
    setStatusFilter('all');
    setPagination({ current: 1, pageSize: 10, total: 0 });
  };

  const handleAddVendor = () => {
    setEditingVendor(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEditVendor = (vendor) => {
    setEditingVendor(vendor);
    setModalVisible(true);
    form.setFieldsValue(vendor);
  };

  const handleDeleteVendor = async (vendorId) => {
    try {
      await api.delete(`/vendor-management/${vendorId}`);
      message.success('Vendor deleted successfully');
      fetchVendors(); // Show loading for manual operations
    } catch (error) {
      message.error('Failed to delete vendor');
    }
  };

  const handleViewVendor = (vendor) => {
    setSelectedVendor(vendor);
    setDetailModalVisible(true);
  };

  const addGovernmentHeader = (doc, pageWidth, margin = 20) => {
    let yPosition = 10;
    
    // Government Header with Logos matching the design
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

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      
      // Add government header
      let yPosition = addGovernmentHeader(doc, pageWidth, margin);
      
      // Add title after header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(colors.primary);
      doc.text('Vendor Management Report', pageWidth / 2, yPosition, { align: 'center' });
      
      // Add generation date
      yPosition += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0); // Black color
      doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, pageWidth / 2, yPosition, { align: 'center' });
      
      // Prepare table data
      const tableColumns = ['NO.', 'Vendor Name', 'Contact Number', 'Address'];
      const tableData = vendors.map((vendor, index) => {
        const vendorName = vendor.first_name + (vendor.middle_name ? ' ' + vendor.middle_name + ' ' : '') + vendor.last_name;
        const vendorContact = vendor.contact_number || 'N/A';
        const vendorAddress = vendor.address || 'N/A';

        return [
          index + 1,
          vendorName,
          vendorContact,
          vendorAddress
        ];
      });
      
      // Add table
      yPosition += 15; // Add space before table
      autoTable(doc, {
        head: [tableColumns],
        body: tableData,
        startY: yPosition,
        styles: {
          fontSize: 10,
          cellPadding: 3,
          lineColor: [0, 0, 0], // Black border for all cells
          lineWidth: 0.5, // Thicker border for all cells
          textColor: [0, 0, 0], // Black text for all cells
          fontStyle: 'bold', // Bold text for all cells
        },
        headStyles: {
          fillColor: [255, 255, 255], // White background
          textColor: [0, 0, 0], // Black text
          fontSize: 12,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
          textColor: [0, 0, 0], // Black text for alternate rows
          fontStyle: 'bold', // Bold text for alternate rows
        },
        margin: { top: 50, bottom: 30 },
        tableLineColor: [0, 0, 0], // Black border
        tableLineWidth: 0.5, // Thicker border
      });
      
      // Add footer
      const finalY = doc.lastAutoTable.finalY || yPosition + 50;
      doc.setFontSize(9);
      doc.setTextColor(colors.textSecondary);
      
      // Save the PDF
      doc.save(`vendor-management-report-${new Date().toISOString().split('T')[0]}.pdf`);
      message.success('PDF exported successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('Failed to export PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleModalSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      if (editingVendor) {
        await api.put(`/vendor-management/${editingVendor.id}`, values);
        message.success('Vendor updated successfully');
      } else {
        const response = await api.post('/vendor-management', values);
        message.success('Vendor created successfully');
        
        // Immediately add the new vendor to the list
        if (response.data.vendor) {
          setVendors(prev => [response.data.vendor, ...prev]);
          setPagination(prev => ({
            ...prev,
            total: prev.total + 1
          }));
        }
      }
      
      setModalVisible(false);
      form.resetFields();
      setEditingVendor(null);
      
      // Refresh the full list to ensure consistency
      fetchVendors(); 
    } catch (error) {
      console.error(error);
      message.error('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: (
        <div className={`${cssClasses.header}-column`}>
          <span>NO.</span>
        </div>
      ),
      key: 'no',
      width: '8%',
      render: (_, record, index) => (
        <div className={`${cssClasses.tableSection}-no}`}>
          <span>{index + 1}</span>
        </div>
      ),
    },
    {
      title: (
        <div className={`${cssClasses.header}-column`}>
          <span>Vendor Name</span>
        </div>
      ),
      key: 'vendor',
      width: '32%',
      render: (_, record) => (
        <div className={`${cssClasses.tableSection}-vendor`}>
          <div className={`${cssClasses.tableSection}-avatar`}>
            <Avatar 
              size={40}
              icon={<UserOutlined />} 
              src={record.profile_picture} 
            />
          </div>
          <div className={`${cssClasses.tableSection}-vendor-info`}>
            <div className={`${cssClasses.tableSection}-vendor-name`}>
              {record.first_name} {record.middle_name} {record.last_name}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: (
        <div className={`${cssClasses.header}-column`}>
          <span>Contact Details</span>
        </div>
      ),
      key: 'contact',
      width: '30%',
      render: (_, record) => (
        <div className={`${cssClasses.tableSection}-contact`}>
          <div className={`${cssClasses.tableSection}-phone`}>
            <PhoneOutlined />
            <span>{record.contact_number}</span>
          </div>
          {record.address && (
            <div className={`${cssClasses.tableSection}-address`}>
              <EnvironmentOutlined />
              <span>{record.address}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: (
        <div className={`${cssClasses.header}-column`}>
          <span>Status</span>
        </div>
      ),
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      render: (status) => (
        <div className={`${cssClasses.tableSection}-status`}>
          <Tag 
            color={status === 'active' ? 'success' : 'error'}
            className={`${cssClasses.tableSection}-status-tag`}
          >
            {status === 'active' ? 'ACTIVE' : 'INACTIVE'}
          </Tag>
        </div>
      ),
    },
    {
      title: (
        <div className={`${cssClasses.header}-column`}>
          <span>Actions</span>
        </div>
      ),
      key: 'actions',
      width: '20%',
      render: (_, record) => (
        <div className={`${cssClasses.tableSection}-actions`}>
          <Tooltip title="View Details">
            <Button
              style={{
                backgroundColor: 'white',
                color: 'black',
                borderColor: 'black'
              }}
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewVendor(record)}
              className={`${cssClasses.button} ${cssClasses.button}-view`}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f0f0f0';
                e.target.style.borderColor = '#404040';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.color = 'black';
                e.target.style.borderColor = 'black';
              }}
            />
          </Tooltip>
          <Tooltip title="Edit Vendor">
            <Button
              style={{
                backgroundColor: 'white',
                color: 'black',
                borderColor: 'black'
              }}
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditVendor(record)}
              className={`${cssClasses.button} ${cssClasses.button}-edit`}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f0f0f0';
                e.target.style.borderColor = '#404040';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.color = 'black';
                e.target.style.borderColor = 'black';
              }}
            />
          </Tooltip>
          <Tooltip title="Delete Vendor">
            <Popconfirm
              title="Delete Vendor"
              description="Are you sure you want to delete this vendor? This action cannot be undone."
              onConfirm={() => handleDeleteVendor(record.id)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button
                style={{
                  backgroundColor: 'white',
                  color: 'black',
                  borderColor: 'black'
                }}
                size="small"
                icon={<DeleteOutlined />}
                className={`${cssClasses.button} ${cssClasses.button}-delete`}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f0f0f0';
                  e.target.style.borderColor = '#404040';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.color = 'black';
                  e.target.style.borderColor = 'black';
                }}
              />
            </Popconfirm>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className={cssClasses.container}>
      {/* Header Section */}
      <div className={cssClasses.header}>
        <div className={`${cssClasses.header}-content`}>
          <div className={`${cssClasses.header}-title-section`}>
            <h1 className={`${cssClasses.header}-title`}>
              <TeamOutlined />
              Vendor Management
            </h1>
            <p className={`${cssClasses.header}-subtitle`}>
              Manage and monitor all vendor information in one place
            </p>
          </div>
          <Button
            style={{
              backgroundColor: 'white',
              color: 'black',
              borderColor: 'black'
            }}
            icon={<PlusOutlined />}
            onClick={handleAddVendor}
            className={`${cssClasses.buttonPrimary}`}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f0f0f0';
              e.target.style.borderColor = '#404040';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.color = 'black';
              e.target.style.borderColor = 'black';
            }}
          >
            Add New Vendor
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className={`${cssClasses.statsCard}-grid`}>
        <div className={`${cssClasses.statsCard} ${cssClasses.statsCard}-total`}>
          <div className={`${cssClasses.statsCard}-content`}>
            <div className={`${cssClasses.statsCard}-icon`}>
              <TeamOutlined />
            </div>
            <div className={`${cssClasses.statsCard}-info`}>
              <div className={`${cssClasses.statsCard}-value`}>
                {pagination.total}
              </div>
              <div className={`${cssClasses.statsCard}-label`}>
                Total Vendors
              </div>
            </div>
          </div>
        </div>
        
        <div className={`${cssClasses.statsCard} ${cssClasses.statsCard}-active`}>
          <div className={`${cssClasses.statsCard}-content`}>
            <div className={`${cssClasses.statsCard}-icon`}>
              <UserSwitchOutlined />
            </div>
            <div className={`${cssClasses.statsCard}-info`}>
              <div className={`${cssClasses.statsCard}-value`}>
                {vendors.filter(v => v.status === 'active').length}
              </div>
              <div className={`${cssClasses.statsCard}-label`}>
                Active Vendors
              </div>
            </div>
          </div>
        </div>
        
        <div className={`${cssClasses.statsCard} ${cssClasses.statsCard}-inactive`}>
          <div className={`${cssClasses.statsCard}-content`}>
            <div className={`${cssClasses.statsCard}-icon`}>
              <UserOutlined />
            </div>
            <div className={`${cssClasses.statsCard}-info`}>
              <div className={`${cssClasses.statsCard}-value`}>
                {vendors.filter(v => v.status !== 'active').length}
              </div>
              <div className={`${cssClasses.statsCard}-label`}>
                Inactive Vendors
              </div>
            </div>
          </div>
        </div>
        
        <div className={`${cssClasses.statsCard} ${cssClasses.statsCard}-address`}>
          <div className={`${cssClasses.statsCard}-content`}>
            <div className={`${cssClasses.statsCard}-icon`}>
              <EnvironmentOutlined />
            </div>
            <div className={`${cssClasses.statsCard}-info`}>
              <div className={`${cssClasses.statsCard}-value`}>
                {vendors.filter(v => v.address).length}
              </div>
              <div className={`${cssClasses.statsCard}-label`}>
                With Address
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className={cssClasses.searchSection}>
        <div className={`${cssClasses.searchSection}-content`}>
          <div className={`${cssClasses.searchSection}-search`}>
            <Input.Search
              placeholder="Search vendors..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              onSearch={handleSearch}
              className={cssClasses.input}
            />
          </div>
          
          <div className={`${cssClasses.searchSection}-filters`}>
            <Select
              placeholder="Status"
              size="large"
              value={statusFilter}
              onChange={handleStatusFilter}
              className={`${cssClasses.input} ${cssClasses.input}-select`}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
            
            <Button
              style={{
                backgroundColor: 'white',
                color: 'black',
                borderColor: 'black'
              }}
              icon={<ReloadOutlined />}
              onClick={() => fetchVendors()}
              className={cssClasses.button}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f0f0f0';
                e.target.style.borderColor = '#404040';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.color = 'black';
                e.target.style.borderColor = 'black';
              }}
            >
              Refresh
            </Button>
            
            <Button
              style={{
                backgroundColor: 'white',
                color: 'black',
                borderColor: 'black'
              }}
              icon={<FilePdfOutlined />}
              onClick={handleExportPDF}
              className={`${cssClasses.button} ${cssClasses.button}-pdf`}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f0f0f0';
                e.target.style.borderColor = '#404040';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.color = 'black';
                e.target.style.borderColor = 'black';
              }}
            >
              Export PDF
            </Button>
            
            <Button
              style={{
                backgroundColor: 'white',
                color: 'black',
                borderColor: 'black'
              }}
              icon={<FilterOutlined />}
              onClick={handleReset}
              className={cssClasses.button}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f0f0f0';
                e.target.style.borderColor = '#404040';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.color = 'black';
                e.target.style.borderColor = 'black';
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className={cssClasses.tableSection}>
        {loading && <LoadingOverlay message="Loading vendor data..." />}
        <Table
          columns={columns}
          dataSource={vendors}
          loading={loading}
          rowKey="id"
          size="middle"
          bordered={false}
          scroll={{ x: 1000 }}
          className={`${cssClasses.tableSection}-table`}
          pagination={{
            current: pagination.current,
            pageSize: 10,
            total: vendors.length,
            showQuickJumper: false,
            showSizeChanger: false,
            position: ['bottomRight'],
            itemRender: (_, type, originalElement) => {
              if (type === 'prev') return <Button size="small">Previous</Button>;
              if (type === 'next') return <Button size="small">Next</Button>;
              return originalElement;
            },
            onChange: (page) => {
              setPagination(prev => ({ ...prev, current: page }));
            },
          }}
          locale={{
            emptyText: (
              <div className={`${cssClasses.tableSection}-empty`}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No vendors found. Try adjusting your filters."
                />
              </div>
            ),
          }}
        />
      </div>

      {/* Add/Edit Vendor Modal */}
      <Modal
        title={
          <div className={`${cssClasses.modal}-title`}>
            {editingVendor ? 
              <><EditOutlined /> Edit Vendor</> : 
              <><PlusOutlined /> Add Vendor</>
            }
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
        className={cssClasses.modal}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
          requiredMark={false}
          colon={false}
          className={`${cssClasses.modal}-form`}
        >
          <div className={`${cssClasses.modal}-form-header`}>
            <h3>
              {editingVendor ? 'Vendor Information' : 'New Vendor Information'}
            </h3>
          </div>

          <div className={`${cssClasses.modal}-form-row`}>
            <div className={`${cssClasses.modal}-form-field`}>
              <Form.Item
                name="first_name"
                label="First Name *"
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input 
                  placeholder="Enter first name" 
                  size="large"
                  className={cssClasses.input}
                />
              </Form.Item>
            </div>
            <div className={`${cssClasses.modal}-form-field}`}>
              <Form.Item
                name="last_name"
                label="Last Name *"
                rules={[{ required: true, message: 'Please enter last name' }]}
              >
                <Input 
                  placeholder="Enter last name" 
                  size="large"
                  className={cssClasses.input}
                />
              </Form.Item>
            </div>
          </div>

          <div className={`${cssClasses.modal}-form-row`}>
            <div className={`${cssClasses.modal}-form-field}`}>
              <Form.Item 
                name="middle_name" 
                label="Middle Name"
              >
                <Input 
                  placeholder="Enter middle name (optional)" 
                  size="large"
                  className={cssClasses.input}
                />
              </Form.Item>
            </div>
            <div className={`${cssClasses.modal}-form-field}`}>
              <Form.Item
                name="contact_number"
                label="Contact Number *"
                rules={[
                  { required: true, message: 'Please enter contact number' },
                  { pattern: /^[0-9]{10,15}$/, message: 'Please enter a valid phone number' }
                ]}
              >
                <Input 
                  placeholder="Enter contact number" 
                  size="large"
                  className={cssClasses.input}
                />
              </Form.Item>
            </div>
          </div>

          <div className={`${cssClasses.modal}-form-row`}>
            <div className={`${cssClasses.modal}-form-field} ${cssClasses.modal}-form-field-full`}>
              <Form.Item
                name="address"
                label="Address"
              >
                <TextArea
                  placeholder="Enter complete address (street, city, province)"
                  size="large"
                  rows={3}
                  className={cssClasses.input}
                  showCount
                  maxLength={200}
                />
              </Form.Item>
            </div>
          </div>

          <div className={`${cssClasses.modal}-form-note`}>
            <span>* Required fields must be filled</span>
          </div>

          <div className={`${cssClasses.modal}-form-actions`}>
            <Button 
              style={{
                backgroundColor: 'white',
                color: 'black',
                borderColor: 'black'
              }}
              size="large"
              onClick={() => setModalVisible(false)}
              className={cssClasses.button}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f0f0f0';
                e.target.style.borderColor = '#404040';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.color = 'black';
                e.target.style.borderColor = 'black';
              }}
            >
              Cancel
            </Button>
            <Button 
              style={{
                backgroundColor: 'white',
                color: 'black',
                borderColor: 'black'
              }}
              htmlType="submit" 
              loading={loading}
              size="large"
              className={cssClasses.buttonPrimary}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f0f0f0';
                e.target.style.borderColor = '#404040';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.color = 'black';
                e.target.style.borderColor = 'black';
              }}
            >
              {editingVendor ? 'Update Vendor' : 'Create Vendor'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Vendor Details Modal */}
      <Modal
        title={
          <div className={`${cssClasses.modal}-title`}>
            <div className={`${cssClasses.modal}-title-icon`}>
              <UserOutlined />
            </div>
            <div className={`${cssClasses.modal}-title-text`}>
              <h3>Vendor Details</h3>
              <p>View complete vendor information and details</p>
            </div>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button 
            key="close" 
            size="large"
            onClick={() => setDetailModalVisible(false)}
            className={cssClasses.button}
            style={{
              backgroundColor: 'white',
              color: 'black',
              borderColor: 'black'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f0f0f0';
              e.target.style.borderColor = '#404040';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.color = 'black';
              e.target.style.borderColor = 'black';
            }}
          >
            Close
          </Button>
        ]}
        width={1000}
        className={cssClasses.modal}
      >
        {selectedVendor && (
          <div className={`${cssClasses.modal}-content`}>
            {/* Vendor Header */}
            <div className={`${cssClasses.modal}-vendor-header`}>
              <div className={`${cssClasses.modal}-vendor-avatar`}>
                <Avatar 
                  size={64}
                  icon={<UserOutlined />} 
                  src={selectedVendor.profile_picture} 
                />
              </div>
              <div className={`${cssClasses.modal}-vendor-info`}>
                <h4>
                  {selectedVendor.first_name} {selectedVendor.last_name}
                </h4>
                {selectedVendor.middle_name && (
                  <p>"{selectedVendor.middle_name}"</p>
                )}
                <div className={`${cssClasses.modal}-vendor-id`}>
                  <span>Vendor ID: #{selectedVendor.id}</span>
                </div>
              </div>
            </div>

            {/* Information Content */}
            <div className={`${cssClasses.modal}-info-grid`}>
              <div className={`${cssClasses.modal}-info-card`}>
                <h5>Basic Details</h5>
                <div className={`${cssClasses.modal}-info-item`}>
                  <label>Full Name</label>
                  <span>
                    {selectedVendor.first_name} {selectedVendor.middle_name && `${selectedVendor.middle_name} `}{selectedVendor.last_name}
                  </span>
                </div>
                <div className={`${cssClasses.modal}-info-item`}>
                  <label>Contact Number</label>
                  <span>
                    <PhoneOutlined />
                    {selectedVendor.contact_number}
                  </span>
                </div>
                {selectedVendor.address && (
                  <div className={`${cssClasses.modal}-info-item`}>
                    <label>Address</label>
                    <span>
                      <EnvironmentOutlined />
                      {selectedVendor.address}
                    </span>
                  </div>
                )}
              </div>
              
              <div className={`${cssClasses.modal}-info-card`}>
                <h5>Status Information</h5>
                <div className={`${cssClasses.modal}-info-item`}>
                  <label>Current Status</label>
                  <Tag 
                    color={selectedVendor.status === 'active' ? 'success' : 'error'}
                    className={`${cssClasses.modal}-status-tag`}
                  >
                    {selectedVendor.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                  </Tag>
                </div>
                <div className={`${cssClasses.modal}-info-item`}>
                  <label>Registration Date</label>
                  <span>
                    {new Date(selectedVendor.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className={`${cssClasses.modal}-info-item`}>
                  <label>Last Updated</label>
                  <span>
                    {new Date(selectedVendor.updated_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VendorManagement;
