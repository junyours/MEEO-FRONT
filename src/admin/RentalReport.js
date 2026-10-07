import React, { useState, useEffect } from 'react';
import api from '../Api';
import LoadingOverlay from './Loading';
import dayjs from 'dayjs';
import {
  Table,
  Spin,
  Typography,
  Button,
  message,
  Space,
  Tag,
  Input,
  Modal,
  Descriptions,
  Badge,
  DatePicker,
  Form,
  Alert,
  Empty,
} from 'antd';
import {
  DollarOutlined,
  ShopOutlined,
  DownloadOutlined,
  HomeOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import letterheadTemplate from '../assets/report_template/letterhead_template.jpg';
import './RentalReport.css';

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
  const [deletingRented, setDeletingRented] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const fetchVendorDetails = async (vendorId) => {
    setDetailsLoading(true);
    setVendorDetails(null);
    setDetailsModalVisible(true);
    try {
      const response = await api.get(`/reports/vendor-details?vendor_id=${vendorId}`);
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
    fetchVendorDetails(record.vendor_id);
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
          fetchVendorDetails(selectedVendor.vendor_id);
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

  const handleDeleteRented = (stallDetail) => {
    setDeletingRented(stallDetail);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRented) {
      message.error('No record selected for deletion');
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await api.delete(`/rented/${deletingRented.rented_id}/delete-record`);
      
      if (response.data.status === 'success') {
        message.success('Rented record deleted successfully');
        setDeleteModalVisible(false);
        setDeletingRented(null);
        // Refresh vendor details to show updated data
        if (selectedVendor) {
          fetchVendorDetails(selectedVendor.vendor_id);
        }
        // Also refresh the main rental report
        fetchRentalReport();
      } else {
        message.error('Failed to delete rented record');
      }
    } catch (error) {
      console.error('Error deleting rented record:', error);
      message.error('Failed to delete rented record');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setDeletingRented(null);
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
      case 'unoccupied':
        return 'default';
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
      case 'unoccupied':
        return 'Removed';
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
        <Text className="rental-report-vendor-name">{text}</Text>
      ),
    },  
    {
      title: 'Section',
      dataIndex: 'section_name',
      key: 'section_name',
      width: 150,
      render: (text) => (
        <div className="rental-report-section-tags">
          {(text || '').split(',').map((section) => section.trim()).filter(Boolean).map((section) => (
            <Tag key={section} color="blue" className="rental-report-section-tag">{section}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Stall Numbers',
      dataIndex: 'stall_numbers',
      key: 'stall_numbers',
      width: 200,
      render: (stallNumbers) => (
        <div className="rental-report-stall-tags">
          {stallNumbers.map((stall, index) => (
            <Tag key={index} color="green" className="rental-stall-tag">
              {stall}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Rental Status',
      dataIndex: 'rental_statuses',
      key: 'rental_statuses',
      width: 180,
      render: (statuses = []) => (
        <Tag color={getStatusColor(statuses[0])} className="rental-status-tag">
          {getStatusText(statuses[0])}
        </Tag>
      ),
    },
    {
      title: 'Daily Rental',
      dataIndex: 'daily_rental_total',
      key: 'daily_rental_total',
      width: 140,
      align: 'right',
      render: (amount) => (
        <Text className="rental-amount-daily">
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: 'Monthly Rental',
      dataIndex: 'monthly_rental_total',
      key: 'monthly_rental_total',
      width: 145,
      align: 'right',
      render: (amount) => (
        <Text className="rental-amount-monthly">
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 135,
      align: 'center',
      render: (text, record) => (
        <Button
          type="default"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
          className="view-details-btn"
          aria-label={`View rental details for ${record.vendor_name}`}
        >
          View Details
        </Button>
      ),
    },
  ];

  if (loading && !rentalData) {
    return <LoadingOverlay />;
  }

  return (
    <main className="rental-report-page">
      <header className="rental-report-header">
        <div className="rental-report-heading">
          <div className="rental-report-heading-icon"><ShopOutlined /></div>
          <div>
            <Title level={2}>Rental Report</Title>
            <Text className="rental-report-subtitle">Vendor occupancy and rental rates by section</Text>
          </div>
        </div>
        <Space className="rental-report-actions" size={8}>
          <Button icon={<ReloadOutlined />} onClick={fetchRentalReport} loading={loading}>
            Refresh
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={exportToPDF} disabled={!rentalData?.length}>
            Export PDF
          </Button>
        </Space>
      </header>

      {totals && (
        <section className="rental-report-metrics" aria-label="Rental totals">
          <div className="rental-metric rental-metric--daily">
            <div className="rental-metric-label"><DollarOutlined /> Daily Rental</div>
            <div className="rental-metric-value">{formatCurrency(totals.daily_rental)}</div>
          </div>
          <div className="rental-metric rental-metric--monthly">
            <div className="rental-metric-label"><DollarOutlined /> Monthly Rental</div>
            <div className="rental-metric-value">{formatCurrency(totals.monthly_rental)}</div>
          </div>
          <div className="rental-metric rental-metric--vendors">
            <div className="rental-metric-label"><HomeOutlined /> Vendors</div>
            <div className="rental-metric-value">{rentalData?.length || 0}</div>
          </div>
        </section>
      )}

      <section className="rental-report-table-shell" aria-label="Vendor rental list">
        <div className="rental-report-table-toolbar">
          <div className="rental-report-table-heading">
            <Title level={3}>Vendor rentals</Title>
            <Text type="secondary">
              {filteredData?.length || 0} vendor{filteredData?.length === 1 ? '' : 's'}
              {searchTerm ? ' matching your search' : ' across all sections'}
            </Text>
          </div>
          <Input.Search
            className="rental-report-search"
            placeholder="Search vendor name"
            aria-label="Search vendors"
            allowClear
            value={searchTerm}
            onChange={(event) => handleSearch(event.target.value)}
            onSearch={handleSearch}
            prefix={<SearchOutlined />}
          />
        </div>
        <Table
          className="rental-report-table"
          columns={columns}
          dataSource={filteredData || rentalData || []}
          loading={loading}
          rowKey="vendor_id"
          locale={{ emptyText: <Empty description={searchTerm ? 'No vendors match this search' : 'No rental records'} /> }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} vendors`,
          }}
          scroll={{ x: 1050 }}
        />
      </section>

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
        width={1120}
        className="rental-report-modal"
        destroyOnClose
      >
        <Spin spinning={detailsLoading}>
          {vendorDetails && (
            <div>
              <div className="rental-detail-summary">
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Vendor Name">
                    <Text strong>{vendorDetails.vendor_name}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Stalls">
                    <Badge count={vendorDetails.total_stalls} color="#176b66" />
                  </Descriptions.Item>
                  <Descriptions.Item label="Section">
                    <div className="rental-report-section-tags">
                      {(vendorDetails.section_name || '').split(',').map((section) => section.trim()).filter(Boolean).map((section) => (
                        <Tag key={section} color="blue" className="rental-report-section-tag">{section}</Tag>
                      ))}
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Daily Rental">
                    <Text className="rental-amount-daily">
                      {formatCurrency(vendorDetails.total_daily_rental)}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Monthly Rental">
                    <Text className="rental-amount-monthly">
                      {formatCurrency(vendorDetails.total_monthly_rental)}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
              </div>

              {Object.entries(
                vendorDetails.stall_details.reduce((sections, stallDetail) => {
                  const sectionName = stallDetail.section_name || 'Other';
                  sections[sectionName] = sections[sectionName] || [];
                  sections[sectionName].push(stallDetail);
                  return sections;
                }, {})
              ).map(([sectionName, stallDetails]) => (
                <section key={sectionName} className="rental-section-block">
                  <div className="rental-section-heading">
                    <Title level={4}>{sectionName}</Title>
                    <Text className="rental-section-count">
                      {stallDetails.length} rental record{stallDetails.length === 1 ? '' : 's'}
                    </Text>
                  </div>
                  <Table
                    className="rental-history-table"
                    dataSource={stallDetails}
                    rowKey="rented_id"
                    size="small"
                    pagination={false}
                    scroll={{ x: 930 }}
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
                        title: 'Exit Date',
                        dataIndex: 'end_date',
                        key: 'end_date',
                        width: 120,
                        render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : '-',
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
                        width: 150,
                        align: 'center',
                        render: (text, record) => (
                          <Space size="small">
                            <Button
                              type="link"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleEditRentedAt(record)}
                              style={{ color: '#1890ff' }}
                            >
                              Edit
                            </Button>
                            <Button
                              type="link"
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteRented(record)}
                              style={{ color: '#ff4d4f' }}
                            >
                              Delete
                            </Button>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </section>
              ))}
            </div>
          )}
          {!detailsLoading && !vendorDetails && (
            <Empty description="Rental details could not be loaded" />
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

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Rented Record"
        open={deleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmLoading={deleteLoading}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        width={400}
      >
        <div>
          <p>Are you sure you want to delete this rented record?</p>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Stall Number">
              <Text strong>{deletingRented?.stall_number || 'N/A'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Badge 
                status={getStatusColor(deletingRented?.status)} 
                text={getStatusText(deletingRented?.status)} 
              />
            </Descriptions.Item>
            <Descriptions.Item label="Daily Rent">
              {formatCurrency(deletingRented?.daily_rent || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Rented At">
              {deletingRented?.created_at ? dayjs(deletingRented.created_at).format('MMMM DD, YYYY') : 'N/A'}
            </Descriptions.Item>
          </Descriptions>
          <Alert
            message="Warning"
            description="This action cannot be undone. The rented record will be permanently deleted."
            type="warning"
            showIcon
            style={{ marginTop: '16px' }}
          />
        </div>
      </Modal>

    </main>
  );
};

export default RentalReport;
