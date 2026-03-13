import React, { useState, useEffect } from 'react';
import api from '../Api';
import LoadingOverlay from './Loading';
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
} from 'antd';
import {
  DollarOutlined,
  ShopOutlined,
  PrinterOutlined,
  DownloadOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const { Title, Text } = Typography;

const RentalReport = () => {
  const [loading, setLoading] = useState(false);
  const [rentalData, setRentalData] = useState(null);
  const [totals, setTotals] = useState(null);

  useEffect(() => {
    fetchRentalReport();
  }, []);

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

  const addGovernmentHeader = (doc, pageWidth, margin = 20) => {
    let yPosition = 10;
    
    // Government Header with Logos matching the design
    try {
      // Add Municipality logo on the left
      doc.addImage('/logo_Opol.png', 'PNG', margin, yPosition, 30, 30);
      
      // Add MEE logo on the right
      doc.addImage('/logo_meeo.png', 'PNG', pageWidth - margin - 30, yPosition, 30, 30);
    } catch (error) {
      console.log('Logos not found:', error);
    }
    
    yPosition += 15;
    
    // Centered Government Header
    doc.setFont('helvetica', 'bold');
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
    doc.setLineWidth(0);
    
    yPosition += 12;
    
    return yPosition;
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
      
      doc.setFont('helvetica');
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      
      // Add government header
      let yPosition = addGovernmentHeader(doc, pageWidth, margin);
      
      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Rental Report', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      
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
      doc.text('Summary', margin, yPosition);
      
      yPosition += 8;
      
      // Summary data
      const summaryData = [
        ['Total Daily Rental', totals.daily_rental.toFixed(2)],
        ['Total Monthly Rental', totals.monthly_rental.toFixed(2)],
        ['Total Records', rentalData.length.toString()],
      ];
      
      autoTable(doc, {
        head: [['Description', 'Amount']],
        body: summaryData,
        startY: yPosition,
        theme: 'grid',
        styles: { 
          fontSize: 10, 
          lineWidth: 0.1, 
          lineColor: [0, 0, 0],
          textColor: [0, 0, 0],
          halign: 'center'
        },
        headStyles: { 
          fillColor: [255, 255, 255], 
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
      doc.text('Detailed Rental Report', margin, yPosition);
      
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
      
      autoTable(doc, {
        head: [['NO.', 'Vendor Name', 'Section', 'Stall NO.', 'Daily Rental', 'Monthly Rental']],
        body: tableData,
        startY: yPosition,
        theme: 'grid',
        styles: { 
          fontSize: 9, 
          lineWidth: 0.1, 
          lineColor: [0, 0, 0],
          textColor: [0, 0, 0],
          halign: 'center'
        },
        headStyles: { 
          fillColor: [255, 255, 255], 
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
          // Add header only to first page
          if (data.pageNumber === 1) {
            addGovernmentHeader(doc, pageWidth, margin);
          }
        }
      });
      
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
    },  {
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
        <Row justify="space-between" align="middle">
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
      >
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <Title level={4} style={{ margin: 0, color: '#1f2937' }}>
            Detailed Rental Information
          </Title>
          <Text type="secondary">
            Shows each vendor's rental details grouped by section
          </Text>
        </div>
        
        <Table
          columns={columns}
          dataSource={rentalData}
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
            background: 'white',
            '.ant-table-thead > tr > th': {
              background: '#f8fafc',
              fontWeight: 600,
              color: '#374151'
            }
          }}
        />
      </Card>

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
      `}</style>
    </div>
  );
};

export default RentalReport;
