import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Button, 
  Table, 
  Tag, 
  Modal, 
  Descriptions, 
  Space,
  Tooltip,
  Spin,
  message,
  Empty,
  Timeline
} from 'antd';
import { 
  ReloadOutlined, 
  DownloadOutlined, 
  ShopOutlined, 
  UserOutlined, 
  CheckCircleOutlined,
  HistoryOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  StarOutlined,
  ApartmentOutlined,
  SunOutlined,
  CloudOutlined,
  HomeOutlined
} from '@ant-design/icons';
import api from '../Api';
import LoadingOverlay from './Loading';
import './StallRateDashboard.css';
import {
  LineChart,
  Line as RechartsLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import letterheadTemplate from '../assets/report_template/letterhead_template.jpg';

const StallRateDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStall, setSelectedStall] = useState(null);
  const [stallModalVisible, setStallModalVisible] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stall-rate-history/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getAreaTypeIcon = (type) => {
    const icons = {
      wet: <ApartmentOutlined />,
      dry: <SunOutlined />,
      open_space: <CloudOutlined />,
      other: <HomeOutlined />
    };
    return icons[type] || icons.other;
  };

  const getAreaTypeColor = (type) => {
    const colors = {
      wet: '#1890ff',
      dry: '#fa8c16',
      open_space: '#52c41a',
      other: '#8c8c8c'
    };
    return colors[type] || colors.other;
  };

  const getStatusColor = (status) => {
    const colors = {
      available: '#52c41a',
      occupied: '#f5222d'  // Changed to red
    };
    return colors[status] || '#52c41a';
  };

  const getDisplayRates = (stall) => {
    // If section has per sqm rate type, check current_rate first (backend calculated rates)
    if (stall.section_rate_type === 'per sqm' && stall.current_rate) {
      if (stall.current_rate.daily_rate || stall.current_rate.monthly_rate) {
        return stall.current_rate;
      }
      // If current_rate exists but is null, calculate from section rates
      if (stall.size && stall.section_rates?.rate) {
        const dailyRent = parseFloat(stall.section_rates.rate) * parseFloat(stall.size);
        const monthlyRent = dailyRent * 30;
        return {
          daily_rate: dailyRent.toFixed(2),
          monthly_rate: monthlyRent.toFixed(2)
        };
      }
    }
    
    // If stall has daily_rate or monthly_rate, use them (highest priority)
    if (stall.daily_rate || stall.monthly_rate) {
      return {
        daily_rate: stall.daily_rate,
        monthly_rate: stall.monthly_rate
      };
    }
    
    // If section has fixed rate type, use section rates
    if (stall.section_rate_type === 'fixed' && stall.section_rates) {
      return {
        daily_rate: stall.section_rates.daily_rate,
        monthly_rate: stall.section_rates.monthly_rate
      };
    }
    
    // Fallback to current_rate or section rates
    if (stall.current_rate && (stall.current_rate.daily_rate || stall.current_rate.monthly_rate)) {
      return stall.current_rate;
    }
    
    // Final fallback to section rates if available
    if (stall.section_rates) {
      return {
        daily_rate: stall.section_rates.daily_rate,
        monthly_rate: stall.section_rates.monthly_rate
      };
    }
    
    // Last resort
    return { daily_rate: null, monthly_rate: null };
  };

  const showStallDetails = (stall) => {
    setSelectedStall(stall);
    setStallModalVisible(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatCurrencyForPDF = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
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

  const exportToPDF = () => {
    if (!dashboardData) {
      message.warning('No data available to export');
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
      
      // Title
      let yPosition = 70; // Start position after letterhead
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Stall Rate & Availability Report', pageWidth / 2, yPosition, { align: 'center' });
      
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
      
      yPosition += 20;
      
      // Market Sections Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Market Sections', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 12;
      
      const marketAreas = dashboardData.areas.filter(area => area.type === 'dry' || area.type === 'wet');
      const openSpaceAreas = dashboardData.areas.filter(area => area.type === 'open_space');
      
      // Market Areas Table
      const marketAreasData = [];
      let marketTotalStalls = 0;
      let marketTotalAvailable = 0;
      let marketTotalOccupied = 0;
      
      marketAreas.forEach(area => {
        area.sections.forEach(section => {
          const availability = section.availability;
          marketTotalStalls += availability.total;
          marketTotalAvailable += availability.available;
          marketTotalOccupied += availability.occupied;
          
          marketAreasData.push([
            section.name,
            availability.total.toString(),
            availability.available.toString(),
            availability.occupied.toString(),
            `${Math.round((availability.occupied / availability.total) * 100)}%`
          ]);
        });
      });
      
      // Add total row
      marketAreasData.push([
        'TOTAL',
        marketTotalStalls.toString(),
        marketTotalAvailable.toString(),
        marketTotalOccupied.toString(),
        `${Math.round((marketTotalOccupied / marketTotalStalls) * 100)}%`
      ]);
      
      autoTable(doc, {
        head: [['Section', 'Total Stalls', 'Available', 'Occupied', 'Occupancy Rate']],
        body: marketAreasData,
        startY: yPosition,
        theme: 'grid',
        styles: { 
          fontSize: 9,
          lineWidth: 0.5,
          lineColor: [0, 0, 0]
        },
        headStyles: { 
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        footStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' },
          4: { cellWidth: 30, halign: 'center' }
        },
        didParseCell: function(data) {
          if (data.row.index === marketAreasData.length - 1) {
            data.cell.styles.fillColor = [240, 240, 240];
            data.cell.styles.fontStyle = 'bold';
          }
        },
        margin: { left: (pageWidth - 160) / 2 }
      });
      
      yPosition = doc.lastAutoTable.finalY + 15;
      
      // Add new page for Open Space Areas if they exist
      if (openSpaceAreas.length > 0) {
        doc.addPage();
        
        // Add letterhead template as background to new page
        try {
          doc.addImage(letterheadTemplate, 'JPEG', 0, 0, pageWidth, pageHeight);
        } catch (error) {
          // Letterhead template not found, continuing without it
        }
        
        let yPosition = 70; // Start position after letterhead
        
        // Title for Open Space
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Open Space Sections', pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 20;
        
        // Open Space Areas Table
        const openSpaceData = [];
        let openSpaceTotalStalls = 0;
        let openSpaceTotalAvailable = 0;
        let openSpaceTotalOccupied = 0;
        
        openSpaceAreas.forEach(area => {
          area.sections.forEach(section => {
            const availability = section.availability;
            openSpaceTotalStalls += availability.total;
            openSpaceTotalAvailable += availability.available;
            openSpaceTotalOccupied += availability.occupied;
            
            openSpaceData.push([
              section.name,
              availability.total.toString(),
              availability.available.toString(),
              availability.occupied.toString(),
              `${Math.round((availability.occupied / availability.total) * 100)}%`
            ]);
          });
        });
        
        // Add total row
        openSpaceData.push([
          'TOTAL',
          openSpaceTotalStalls.toString(),
          openSpaceTotalAvailable.toString(),
          openSpaceTotalOccupied.toString(),
          `${Math.round((openSpaceTotalOccupied / openSpaceTotalStalls) * 100)}%`
        ]);
        
        autoTable(doc, {
          head: [['Section', 'Total Stalls', 'Available', 'Occupied', 'Occupancy Rate']],
          body: openSpaceData,
          startY: yPosition,
          theme: 'grid',
          styles: { 
            fontSize: 9,
            lineWidth: 0.5,
            lineColor: [0, 0, 0]
          },
          headStyles: { 
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold'
          },
          footStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 30, halign: 'center' },
            3: { cellWidth: 30, halign: 'center' },
            4: { cellWidth: 30, halign: 'center' }
          },
          didParseCell: function(data) {
            if (data.row.index === openSpaceData.length - 1) {
              data.cell.styles.fillColor = [240, 240, 240];
              data.cell.styles.fontStyle = 'bold';
            }
          },
          margin: { left: (pageWidth - 160) / 2 }
        });
      }
      
      // Save the PDF
      doc.save(`Stall_Rate_${new Date().toISOString().split('T')[0]}.pdf`);
      message.success('PDF exported successfully!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('Failed to generate PDF');
    }
  };

  const renderStallGrid = (stalls) => {
    return (
      <div className="stall-grid">
        {stalls.map(stall => {
          const rates = getDisplayRates(stall);
          const displayRate = rates.daily_rate;
          
          return (
            <Tooltip
              key={stall.id}
              title={`Stall ${stall.stall_number} - ${stall.status}${displayRate ? ` - ₱${displayRate}/day` : ''}`}
            >
              <div
                className="stall-item"
                style={{ backgroundColor: getStatusColor(stall.status) }}
                onClick={() => showStallDetails(stall)}
              >
                <div className="stall-number">{stall.stall_number}</div>
                <div className="stall-rate">
                  {displayRate ? `₱${displayRate}` : '₱'}
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>
    );
  };

  const rateChangeColumns = [
    {
      title: 'Stall',
      dataIndex: 'stall',
      key: 'stall',
      render: (stall) => (
        <div>
          <div><strong>#{stall.number}</strong></div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{stall.section}</div>
        </div>
      )
    },
    {
      title: 'New Rates',
      key: 'rates',
      render: (record) => (
        <div>
          <div>Daily: ₱{record.daily_rate}</div>
          <div>Monthly: ₱{record.monthly_rate}</div>
        </div>
      )
    },
    {
      title: 'Changed At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => formatDate(date)
    },
    {
      title: 'Effective From',
      dataIndex: 'effective_from',
      key: 'effective_from',
      render: (date) => formatDate(date)
    }
  ];

  const getRateChartData = () => {
    if (!dashboardData?.recent_rate_changes?.length) return [];
    
    return dashboardData.recent_rate_changes.slice(0, 10).reverse().map(change => ({
      date: formatDate(change.effective_from),
      daily_rate: change.daily_rate,
      monthly_rate: change.monthly_rate
    }));
  };

  if (loading) {
    return <LoadingOverlay message="Loading dashboard data..." />;
  }

  if (!dashboardData) {
    return (
      <div className="empty-container">
        <Empty description="No data available" />
      </div>
    );
  }

  return (
    <div className="stall-rate-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header">
          <HistoryOutlined className="title-icon" />
          <h2>Stall Rate & Availability </h2>
        </div>
        <div className="header-actions">
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadDashboardData}
            loading={loading}
          >
            Refresh
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={exportToPDF}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} className="summary-section">
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Areas"
              value={dashboardData.summary.total_areas}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Stalls"
              value={dashboardData.summary.total_stalls}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Available"
              value={dashboardData.summary.available_stalls}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Occupancy Rate"
              value={dashboardData.summary.occupancy_rate}
              suffix="%"
              prefix={<UserOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Market Available Stalls"
              value={(() => {
                const marketAreas = dashboardData.areas.filter(area => area.type === 'dry' || area.type === 'wet');
                return marketAreas.reduce((sum, area) => 
                  sum + area.sections.reduce((sectionSum, section) => sectionSum + section.availability.available, 0), 0
                );
              })()}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Open Space Available Stalls"
              value={(() => {
                const openSpaceAreas = dashboardData.areas.filter(area => area.type === 'open_space');
                return openSpaceAreas.reduce((sum, area) => 
                  sum + area.sections.reduce((sectionSum, section) => sectionSum + section.availability.available, 0), 0
                );
              })()}
              prefix={<CloudOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        {/* Market Sections (Dry and Wet) */}
        <Col xs={24} lg={16}>
          <Card title="Market Sections" className="areas-card">
            <div className="areas-container">
              {(() => {
                const marketAreas = dashboardData.areas.filter(area => area.type === 'dry' || area.type === 'wet');
                const openSpaceAreas = dashboardData.areas.filter(area => area.type === 'open_space');

                return (
                  <>
                    {/* Combined Market Areas Container */}
                    <Card
                      className="area-card market-areas-combined"
                      title={
                        <div className="area-header">
                          <div className="area-title">
                            <span className="area-icon" style={{ color: '#1890ff' }}>
                              <ShopOutlined />
                            </span>
                            <div>
                              <h3>Market Sections</h3>
                            </div>
                          </div>
                          <div className="area-stats">
                            <div className="stat-item">
                              <span className="stat-label">Total Stalls</span>
                              <span className="stat-value">
                                {marketAreas.reduce((sum, area) => 
                                  sum + area.sections.reduce((sectionSum, s) => sectionSum + s.availability.total, 0), 0
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      }
                    >
                      <div className="sections-container">
                        {marketAreas.map(area => 
                          area.sections.map(section => {
                            const availability = section.availability;
                            const occupancyRate = availability.total > 0 
                              ? Math.round((availability.occupied / availability.total) * 100) 
                              : 0;
                            
                            return (
                              <div key={section.id} className="section-item">
                                <div className="section-header">
                                  <h4>
                                    <span 
                                      className="section-indicator"
                                      style={{ 
                                        backgroundColor: area.type === 'wet' ? '#1890ff' : '#fa8c16',
                                        width: '4px',
                                        height: '16px',
                                        display: 'inline-block',
                                        marginRight: '8px',
                                        borderRadius: '2px'
                                      }}
                                    />
                                    {section.name}
                                  </h4>
                                  <div className="section-stats">
                                    <Space size="small">
                                      <Tag color="green">{availability.available} Available</Tag>
                                      <Tag color="red">{availability.occupied} Occupied</Tag>
                                      <Tag>{occupancyRate}% Occupied</Tag>
                                    </Space>
                                  </div>
                                </div>
                                {renderStallGrid(section.stalls)}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </Card>

                    {/* Open Space Areas Container */}
                    {openSpaceAreas.length > 0 && (
                      <Card
                        className="area-card open-space-areas"
                        title={
                          <div className="area-header">
                            <div className="area-title">
                              <span className="area-icon" style={{ color: '#52c41a' }}>
                                <CloudOutlined />
                              </span>
                              <div>
                                <h3>Open Space Sections</h3>
                                <Tag color="#52c41a">Open Space</Tag>
                              </div>
                            </div>
                            <div className="area-stats">
                              <div className="stat-item">
                                <span className="stat-label">Total Stalls</span>
                                <span className="stat-value">
                                  {openSpaceAreas.reduce((sum, area) => 
                                    sum + area.sections.reduce((sectionSum, s) => sectionSum + s.availability.total, 0), 0
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        }
                      >
                        <div className="sections-container">
                          {openSpaceAreas.map(area =>
                            area.sections.map(section => {
                              const availability = section.availability;
                              const occupancyRate = availability.total > 0 
                                ? Math.round((availability.occupied / availability.total) * 100) 
                                : 0;
                              
                              return (
                                <div key={section.id} className="section-item">
                                  <div className="section-header">
                                    <h4>{section.name}</h4>
                                    <div className="section-stats">
                                      <Space size="small">
                                        <Tag color="green">{availability.available} Available</Tag>
                                        <Tag color="red">{availability.occupied} Occupied</Tag>
                                        <Tag>{occupancyRate}% Occupied</Tag>
                                      </Space>
                                    </div>
                                  </div>
                                  {renderStallGrid(section.stalls)}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </Card>
                    )}
                  </>
                );
              })()}
            </div>
          </Card>
        </Col>

        {/* Recent Rate Changes */}
        <Col xs={24} lg={8}>
          <Card 
            title="Recent Rate Changes" 
            className="rate-changes-card"
            extra={
              <Tag color="blue">
                {dashboardData.recent_rate_changes.length} changes
              </Tag>
            }
          >
            <Table
              dataSource={dashboardData.recent_rate_changes}
              columns={rateChangeColumns}
              pagination={false}
              size="small"
              scroll={{ y: 300 }}
              rowKey="id"
            />
          </Card>

          {/* Rate Trend Chart */}
          <Card title="Rate Trend Analysis" className="rate-chart-card">
            {getRateChartData().length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={getRateChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₱${value}`}
                  />
                  <RechartsTooltip 
                    formatter={(value, name) => [`₱${value}`, name]}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                  />
                  <Legend />
                  <RechartsLine 
                    type="monotone" 
                    dataKey="daily_rate" 
                    stroke="#1890ff" 
                    strokeWidth={2}
                    name="Daily Rate"
                  />
                  <RechartsLine 
                    type="monotone" 
                    dataKey="monthly_rate" 
                    stroke="#52c41a" 
                    strokeWidth={2}
                    name="Monthly Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No rate data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Stall Detail Modal */}
      <Modal
        title="Stall Details"
        open={stallModalVisible}
        onCancel={() => setStallModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedStall && (
          <div className="stall-details">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Stall Number">
                #{selectedStall.stall_number}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedStall.status)}>
                  {selectedStall.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Size">
                {selectedStall.size || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Position">
                Row {selectedStall.position?.row}, Col {selectedStall.position?.column}
              </Descriptions.Item>
              <Descriptions.Item label="Daily Rate">
                ₱{getDisplayRates(selectedStall).daily_rate || 'N/A'}
                {selectedStall.section_rate_type === 'fixed' && (
                  <Tag color="purple" size="small" style={{ marginLeft: 8 }}>Fixed Rate</Tag>
                )}
                {selectedStall.section_rate_type === 'per sqm' && (
                  <Tag color="orange" size="small" style={{ marginLeft: 8 }}>Per SQM Rate</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Monthly Rate">
                ₱{getDisplayRates(selectedStall).monthly_rate || 'N/A'}
                {selectedStall.section_rate_type === 'fixed' && (
                  <Tag color="purple" size="small" style={{ marginLeft: 8 }}>Fixed Rate</Tag>
                )}
                {selectedStall.section_rate_type === 'per sqm' && (
                  <Tag color="orange" size="small" style={{ marginLeft: 8 }}>Per SQM Rate</Tag>
                )}
              </Descriptions.Item>
              {selectedStall.section_rate_type && (
                <Descriptions.Item label="Section Rate Type" span={2}>
                  <Tag color={selectedStall.section_rate_type === 'fixed' ? 'purple' : 'orange'}>
                    {selectedStall.section_rate_type === 'per sqm' ? 'Per SQM' : selectedStall.section_rate_type}
                  </Tag>
                  {selectedStall.section_rate_type === 'per sqm' && selectedStall.size && (
                    <span style={{ marginLeft: 8, fontSize: '12px', color: '#666' }}>
                      (Size: {selectedStall.size} sqm × Rate: ₱{selectedStall.section_rates?.rate}/sqm)
                    </span>
                  )}
                </Descriptions.Item>
              )}
              {selectedStall.tenant && (
                <>
                  <Descriptions.Item label="Current Tenant" span={2}>
                    <div className="tenant-info">
                      <div className="font-medium">{selectedStall.tenant.vendor_name}</div>
                      <div className="tenant-details">
                        <Tag color="blue">{selectedStall.tenant.status}</Tag>
                        {selectedStall.tenant.daily_rent && (
                          <span style={{ marginLeft: 8, fontSize: '12px', color: '#666' }}>
                            Rent: ₱{selectedStall.tenant.daily_rent}/day
                          </span>
                        )}
                      </div>
                    </div>
                  </Descriptions.Item>
                </>
              )}
              {!selectedStall.tenant && selectedStall.status === 'occupied' && (
                <Descriptions.Item label="Current Tenant" span={2}>
                  <Tag color="orange">No tenant information available</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedStall.rate_changes.length > 0 && (
              <div className="rate-history">
                <h4>Recent Rate Changes</h4>
                <Timeline>
                  {selectedStall.rate_changes.map((change, index) => (
                    <Timeline.Item key={index}>
                      <div className="rate-change-item">
                        <div className="rate-amounts">
                          Daily: ₱{change.daily_rate} | Monthly: ₱{change.monthly_rate}
                        </div>
                        <div className="effective-date">
                          Effective: {new Date(change.effective_from).toLocaleDateString()}
                        </div>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StallRateDashboard;
