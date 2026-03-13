import React, { useState, useEffect } from "react";
import { Card, Row, Col, Tabs, Typography, Spin, Alert, Button, Space, Statistic, Progress, DatePicker, Select, Empty, Table, Tag } from "antd";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ReferenceLine, PieChart, Pie, Cell } from "recharts";
import { FiTrendingUp, FiDollarSign, FiBarChart2, FiCalendar, FiDownload, FiFileText, FiTrendingDown } from "react-icons/fi";
import api from "../Api";
import LoadingOverlay from "./Loading";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Component-specific styles
const styles = {
  container: {
    padding: "32px",
    background: "#fafbfc",
    minHeight: "100vh",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
  },
  header: {
    marginBottom: "40px"
  },
  title: {
    color: "#1a1d23",
    fontWeight: 600,
    marginBottom: "8px",
    fontSize: "28px"
  },
  subtitle: {
    color: "#6b7280",
    fontSize: "16px",
    fontWeight: 400
  },
  metricCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    height: "100%",
    transition: "all 0.2s ease"
  },
  metricCardHover: {
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    transform: "translateY(-2px)"
  },
  primaryMetricCard: {
    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    border: "none",
    color: "#ffffff"
  },
  chartCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    padding: "24px"
  },
  sectionCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "8px"
  },
  iconWrapper: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    color: "#ffffff"
  },
  textMetric: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1a1d23",
    fontVariantNumeric: "tabular-nums"
  },
  textMetricLabel: {
    fontSize: "14px",
    color: "#6b7280",
    fontWeight: "500"
  },
  textMetricWhite: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#000000ff",
    fontVariantNumeric: "tabular-nums"
  },
  textMetricLabelWhite: {
    fontSize: "14px",
    color: "rgba(0, 0, 0, 0.8)",
    fontWeight: "500"
  }
};

// Color palette
const colors = {
  primary: "#4f46e5",
  secondary: "#7c3aed",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  gray: "#6b7280",
  light: "#f9fafb",
  border: "#e5e7eb"
};

const CHART_COLORS = ['#4f46e5', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

const ExpectedCollectionAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [areaFilter, setAreaFilter] = useState('all');

  useEffect(() => {
    fetchExpectedCollectionData();
  }, []);

  const fetchExpectedCollectionData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/expected-collection-analysis');
      
      if (response.data.status === 'success') {
        setData(response.data.data);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching expected collection data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const exportToPDF = () => {
    // PDF export functionality
    window.print();
  };

  // Table columns for sections breakdown
  const sectionColumns = [
    {
      title: 'Section Name',
      dataIndex: 'section_name',
      key: 'section_name',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Area',
      dataIndex: 'area_name',
      key: 'area_name',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Daily Rate',
      dataIndex: 'total_daily',
      key: 'total_daily',
      render: (value) => <Text style={{ color: '#667eea' }}>{formatCurrency(value)}</Text>,
      sorter: (a, b) => a.total_daily - b.total_daily,
    },
    {
      title: 'Monthly Rate',
      dataIndex: 'total_monthly',
      key: 'total_monthly',
      render: (value) => <Text style={{ color: '#f093fb' }}>{formatCurrency(value)}</Text>,
      sorter: (a, b) => a.total_monthly - b.total_monthly,
    },
    {
      title: 'Stalls',
      dataIndex: 'stalls',
      key: 'stalls',
      render: (stalls) => (
        <div>
          {stalls.map((stall, index) => (
            <div key={index} style={{ marginBottom: 4, padding: 8, background: '#f8f9fa', borderRadius: 4 }}>
              <Text strong>Stall {stall.stall_number}</Text>
              <div style={{ fontSize: 12, color: '#718096' }}>
                Daily: {formatCurrency(stall.daily_rate)} | Monthly: {formatCurrency(stall.monthly_rate)}
              </div>
              <div style={{ fontSize: 12, color: '#718096' }}>
                Vendor: {stall.vendor_name} | Status: <Tag color="green">{stall.status}</Tag>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#2d3748' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: '4px 0', color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <LoadingOverlay message="Loading collection analytics..." />;
  }

  if (error) {
    return (
      <Alert
        message="Analytics Error"
        description={error}
        type="error"
        showIcon
        closable
        style={{ margin: '20px' }}
        action={
          <Button size="small" onClick={fetchExpectedCollectionData}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!data) {
    return (
      <Empty
        description="No collection data available"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        style={{ padding: '100px' }}
      />
    );
  }

  const { current_collections, monthly_trend, market_sections, open_space_sections, comparison } = data;

  // Prepare pie chart data for market sections only
  const prepareMarketPieData = () => {
    return market_sections.map(section => {
      const totalStalls = section.total_stalls || section.stalls?.length || 0;
      const occupiedStalls = section.occupied_stalls || 0;
      const occupancyPercentage = totalStalls > 0 ? ((occupiedStalls / totalStalls) * 100).toFixed(1) : 0;
      
      return {
        name: section.section_name,
        value: parseFloat(occupancyPercentage),
        displayValue: `${occupiedStalls}/${totalStalls}`,
        area: section.area_name,
        totalStalls: totalStalls,
        occupiedStalls: occupiedStalls
      };
    }).sort((a, b) => b.value - a.value);
  };

  // Prepare section data grouped by area type
  const prepareSectionDataByArea = () => {
    const marketSections = market_sections.filter(section => 
      section.area_name.toLowerCase().includes('wet') || 
      section.area_name.toLowerCase().includes('dry')
    ).map(section => ({
      ...section,
      total_stalls: section.total_stalls || section.stalls?.length || 0,
      occupied_stalls: section.occupied_stalls || 0,
      available_stalls: section.available_stalls || (section.total_stalls || section.stalls?.length || 0) - (section.occupied_stalls || 0)
    }));
    
    const openSpaceSections = open_space_sections.filter(section => 
      !section.area_name.toLowerCase().includes('wet') && 
      !section.area_name.toLowerCase().includes('dry')
    ).map(section => ({
      ...section,
      total_stalls: section.total_stalls || section.stalls?.length || 0,
      occupied_stalls: section.occupied_stalls || 0,
      available_stalls: section.available_stalls || (section.total_stalls || section.stalls?.length || 0) - (section.occupied_stalls || 0)
    }));

    return {
      market: marketSections,
      openSpace: openSpaceSections
    };
  };

  // Calculate additional metrics for better understanding
  const calculateTotalStalls = () => {
    const allSections = [...market_sections, ...open_space_sections];
    return allSections.reduce((total, section) => total + section.stalls.length, 0);
  };

  const calculateOccupancyRate = () => {
    const allSections = [...market_sections, ...open_space_sections];
    const totalStalls = allSections.reduce((total, section) => total + section.stalls.length, 0);
    const occupiedStalls = allSections.reduce((total, section) => total + (section.occupied_stalls || 0), 0);
    return totalStalls > 0 ? ((occupiedStalls / totalStalls) * 100).toFixed(1) : 0;
  };

  // Prepare pie chart data for open space sections
  const prepareOpenSpacePieData = () => {
    return open_space_sections.map(section => {
      const totalStalls = section.total_stalls || section.stalls?.length || 0;
      const occupiedStalls = section.occupied_stalls || 0;
      const occupancyPercentage = totalStalls > 0 ? ((occupiedStalls / totalStalls) * 100).toFixed(1) : 0;
      
      return {
        name: section.section_name,
        value: parseFloat(occupancyPercentage),
        displayValue: `${occupiedStalls}/${totalStalls}`,
        area: section.area_name,
        totalStalls: totalStalls,
        occupiedStalls: occupiedStalls
      };
    }).sort((a, b) => b.value - a.value);
  };

  const totalStalls = calculateTotalStalls();
  const occupancyRate = calculateOccupancyRate();
  const marketPieData = prepareMarketPieData();
  const sectionDataByArea = prepareSectionDataByArea();
  const openSpacePieData = prepareOpenSpacePieData();

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <Title level={1} style={styles.title}>
          Expected Collection Analysis
        </Title>
        <Text style={styles.subtitle}>
          Comprehensive overview of market and open space revenue projections
        </Text>
      </div>

      {/* KPI Metrics */}
      <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ ...styles.primaryMetricCard, ...styles.metricCard }}
            bodyStyle={{ padding: "24px" }}
          >
            <div style={{ textAlign: "center" }}>
              <Text style={styles.textMetricLabelWhite}>
                Total Expected Daily
              </Text>
              <div style={styles.textMetricWhite}>
                {formatCurrency(current_collections.market_daily + current_collections.open_space_daily + current_collections.taboc_gym_daily)}
              </div>
              <Text style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", marginTop: "8px", display: "block" }}>
                Combined daily revenue from all stalls
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ 
              ...styles.primaryMetricCard, 
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              ...styles.metricCard 
            }}
            bodyStyle={{ padding: "24px" }}
          >
            <div style={{ textAlign: "center" }}>
              <Text style={styles.textMetricLabelWhite}>
                Total Expected Monthly
              </Text>
              <div style={styles.textMetricWhite}>
                {formatCurrency(current_collections.market_monthly + current_collections.open_space_monthly)}
              </div>
              <Text style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", marginTop: "8px", display: "block" }}>
                Combined monthly revenue from all stalls
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={styles.metricCard} bodyStyle={{ padding: "24px" }}>
            <div style={{ textAlign: "center" }}>
              <Text style={styles.textMetricLabel}>
                Market Efficiency
              </Text>
              <div style={{ ...styles.textMetric, color: colors.primary }}>
                {comparison.market_percentage}%
              </div>
              <Text style={{ fontSize: "12px", color: colors.gray, marginTop: "8px", display: "block" }}>
                Market's share of total revenue
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={styles.metricCard} bodyStyle={{ padding: "24px" }}>
            <div style={{ textAlign: "center" }}>
              <Text style={styles.textMetricLabel}>
                Open Space Efficiency
              </Text>
              <div style={{ ...styles.textMetric, color: colors.success }}>
                {comparison.open_space_percentage}%
              </div>
              <Text style={{ fontSize: "12px", color: colors.gray, marginTop: "8px", display: "block" }}>
                Open space's share of total revenue
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Additional Metrics */}
      <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={styles.metricCard} bodyStyle={{ padding: "24px" }}>
            <div style={{ textAlign: "center" }}>
              <Text style={styles.textMetricLabel}>
                Total Stalls
              </Text>
              <div style={styles.textMetric}>
                {totalStalls}
              </div>
              <Text style={{ fontSize: "12px", color: colors.gray, marginTop: "8px", display: "block" }}>
                Total number of stalls across all sections
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={styles.metricCard} bodyStyle={{ padding: "24px" }}>
            <div style={{ textAlign: "center" }}>
              <Text style={styles.textMetricLabel}>
                Occupancy Rate
              </Text>
              <div style={{ ...styles.textMetric, color: colors.info }}>
                {occupancyRate}%
              </div>
              <Text style={{ fontSize: "12px", color: colors.gray, marginTop: "8px", display: "block" }}>
                Percentage of occupied stalls
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={styles.metricCard} bodyStyle={{ padding: "24px" }}>
            <div style={{ textAlign: "center" }}>
              <Text style={styles.textMetricLabel}>
                Market Sections
              </Text>
              <div style={styles.textMetric}>
                {market_sections.length}
              </div>
              <Text style={{ fontSize: "12px", color: colors.gray, marginTop: "8px", display: "block" }}>
                Number of market area sections
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={styles.metricCard} bodyStyle={{ padding: "24px" }}>
            <div style={{ textAlign: "center" }}>
              <Text style={styles.textMetricLabel}>
                Open Space Sections
              </Text>
              <div style={styles.textMetric}>
                {open_space_sections.length}
              </div>
              <Text style={{ fontSize: "12px", color: colors.gray, marginTop: "8px", display: "block" }}>
                Number of open space sections
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Market Areas - Dedicated Section */}
      <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
        <Col xs={24}>
          <Card style={styles.chartCard}>
            <Title level={3} style={{ marginBottom: "16px", textAlign: "center", color: "#1a1d23" }}>
              Market Areas - Occupancy Analysis
            </Title>
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
              <Text style={{ color: colors.gray, fontSize: "14px" }}>
                Detailed occupancy breakdown for market sections only
              </Text>
            </div>
            <Row gutter={24}>
              <Col xs={24} lg={12}>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={marketPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => {
                        const displayName = name.length > 12 ? name.substring(0, 12) + '...' : name;
                        return `${displayName}: ${value}%`;
                      }}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={1}
                    >
                      {marketPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => {
                        const data = props.payload;
                        return [
                          `${value}% occupied (${data.occupiedStalls}/${data.totalStalls} stalls)`,
                          data.name
                        ];
                      }}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        padding: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Market Areas Legend */}
                <div style={{ marginTop: "16px", padding: "16px", background: colors.light, borderRadius: "8px" }}>
                  <Title level={5} style={{ marginBottom: "12px", color: "#1a1d23", textAlign: "center" }}>
                    Market Areas Occupancy Rates
                  </Title>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
                    {marketPieData.map((section, index) => (
                      <div key={index} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "2px",
                          backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                        }} />
                        <Text style={{ fontSize: "12px", color: colors.gray }}>
                          {section.name.split(' (')[0]} ({section.value}%)
                        </Text>
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
              <Col xs={24} lg={12}>
                <div style={{ 
                  background: colors.light,
                  borderRadius: "12px",
                  padding: "20px",
                  height: "520px",
                  overflow: "auto"
                }}>
                  <Title level={4} style={{ marginBottom: "16px", color: "#1a1d23", textAlign: "center" }}>
                    Market Areas Section Overview
                  </Title>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {sectionDataByArea.market.map((section, index) => {
                      const occupancyPercentage = section.total_stalls > 0 ? 
                        ((section.occupied_stalls / section.total_stalls) * 100).toFixed(1) : 0;
                      return (
                        <div key={index} style={styles.sectionCard}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "3px",
                              backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                            }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: "600", color: "#1a1d23", fontSize: "14px" }}>
                                {section.section_name}
                              </div>
                              <div style={{ fontSize: "12px", color: colors.gray }}>
                                {section.total_stalls} total stalls • {occupancyPercentage}% occupied
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "16px" }}>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "16px", fontWeight: "700", color: colors.danger }}>
                                  {section.occupied_stalls}
                                </div>
                                <div style={{ fontSize: "11px", color: colors.gray }}>Occupied</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "16px", fontWeight: "700", color: colors.success }}>
                                  {section.available_stalls}
                                </div>
                                <div style={{ fontSize: "11px", color: colors.gray }}>Available</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Open Space Areas - Dedicated Section */}
      <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
        <Col xs={24}>
          <Card style={styles.chartCard}>
            <Title level={3} style={{ marginBottom: "16px", textAlign: "center", color: "#1a1d23" }}>
              Open Space Areas - Occupancy Analysis
            </Title>
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
              <Text style={{ color: colors.gray, fontSize: "14px" }}>
                Detailed occupancy breakdown for open space sections only
              </Text>
            </div>
            <Row gutter={24}>
              <Col xs={24} lg={12}>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={openSpacePieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => {
                        const displayName = name.length > 12 ? name.substring(0, 12) + '...' : name;
                        return `${displayName}: ${value}%`;
                      }}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={1}
                    >
                      {openSpacePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => {
                        const data = props.payload;
                        return [
                          `${value}% occupied (${data.occupiedStalls}/${data.totalStalls} stalls)`,
                          data.name
                        ];
                      }}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        padding: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Open Space Legend */}
                <div style={{ marginTop: "16px", padding: "16px", background: colors.light, borderRadius: "8px" }}>
                  <Title level={5} style={{ marginBottom: "12px", color: "#1a1d23", textAlign: "center" }}>
                    Open Space Occupancy Rates
                  </Title>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
                    {openSpacePieData.map((section, index) => (
                      <div key={index} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "2px",
                          backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                        }} />
                        <Text style={{ fontSize: "12px", color: colors.gray }}>
                          {section.name.split(' (')[0]} ({section.value}%)
                        </Text>
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
              <Col xs={24} lg={12}>
                <div style={{ 
                  background: colors.light,
                  borderRadius: "12px",
                  padding: "20px",
                  height: "520px",
                  overflow: "auto"
                }}>
                  <Title level={4} style={{ marginBottom: "16px", color: "#1a1d23", textAlign: "center" }}>
                    Open Space Sections Overview
                  </Title>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {sectionDataByArea.openSpace.map((section, index) => {
                      const occupancyPercentage = section.total_stalls > 0 ? 
                        ((section.occupied_stalls / section.total_stalls) * 100).toFixed(1) : 0;
                      return (
                        <div key={index} style={styles.sectionCard}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "3px",
                              backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                            }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: "600", color: "#1a1d23", fontSize: "14px" }}>
                                {section.section_name}
                              </div>
                              <div style={{ fontSize: "12px", color: colors.gray }}>
                                {section.total_stalls} total stalls • {occupancyPercentage}% occupied
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "16px" }}>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "16px", fontWeight: "700", color: colors.danger }}>
                                  {section.occupied_stalls}
                                </div>
                                <div style={{ fontSize: "11px", color: colors.gray }}>Occupied</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "16px", fontWeight: "700", color: colors.success }}>
                                  {section.available_stalls}
                                </div>
                                <div style={{ fontSize: "11px", color: colors.gray }}>Available</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Current Collections Summary */}
      <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={styles.metricCard}
            bodyStyle={{ padding: "24px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                ...styles.iconWrapper,
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
              }}>
                <FiDollarSign />
              </div>
              <div style={{ flex: 1 }}>
                <Text style={styles.textMetricLabel}>
                  Market Daily
                </Text>
                <div style={styles.textMetric}>
                  {formatCurrency(current_collections.market_daily)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={styles.metricCard}
            bodyStyle={{ padding: "24px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                ...styles.iconWrapper,
                background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`
              }}>
                <FiCalendar />
              </div>
              <div style={{ flex: 1 }}>
                <Text style={styles.textMetricLabel}>
                  Market Monthly
                </Text>
                <div style={styles.textMetric}>
                  {formatCurrency(current_collections.market_monthly)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={styles.metricCard}
            bodyStyle={{ padding: "24px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                ...styles.iconWrapper,
                background: `linear-gradient(135deg, ${colors.success} 0%, #059669 100%)`
              }}>
                <FiTrendingUp />
              </div>
              <div style={{ flex: 1 }}>
                <Text style={styles.textMetricLabel}>
                  Open Space Daily
                </Text>
                <div style={styles.textMetric}>
                  {formatCurrency(current_collections.open_space_daily)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={styles.metricCard}
            bodyStyle={{ padding: "24px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                ...styles.iconWrapper,
                background: `linear-gradient(135deg, ${colors.warning} 0%, #d97706 100%)`
              }}>
                <FiBarChart2 />
              </div>
              <div style={{ flex: 1 }}>
                <Text style={styles.textMetricLabel}>
                  Open Space Monthly
                </Text>
                <div style={styles.textMetric}>
                  {formatCurrency(current_collections.open_space_monthly)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={styles.metricCard}
            bodyStyle={{ padding: "24px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                ...styles.iconWrapper,
                background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
              }}>
                <FiTrendingUp />
              </div>
              <div style={{ flex: 1 }}>
                <Text style={styles.textMetricLabel}>
                  Taboc Gym Daily
                </Text>
                <div style={styles.textMetric}>
                  {formatCurrency(current_collections.taboc_gym_daily)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={styles.metricCard}
            bodyStyle={{ padding: "24px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                ...styles.iconWrapper,
                background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
              }}>
                <FiBarChart2 />
              </div>
              <div style={{ flex: 1 }}>
                <Text style={styles.textMetricLabel}>
                  Taboc Gym Monthly
                </Text>
                <div style={styles.textMetric}>
                  {formatCurrency(current_collections.taboc_gym_monthly)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card style={styles.chartCard}>
            <Tabs defaultActiveKey="monthly-trend" size="large" tabBarStyle={{ marginBottom: "24px" }}>
              <TabPane 
                tab={
                  <span style={{ fontSize: "16px", fontWeight: "600" }}>
                    <FiCalendar style={{ marginRight: "8px" }} />
                    Monthly Collection Trend
                  </span>
                } 
                key="monthly-trend"
              >
                <div>
                  <Title level={4} style={{ marginBottom: "16px", color: "#1a1d23" }}>
                    Monthly Collection Trend (12 Months)
                  </Title>
                  <div style={{ marginBottom: "16px", textAlign: "center" }}>
                    <Text style={{ color: colors.gray, fontSize: "14px" }}>
                      Peak months are highlighted based on vendor rental activity
                    </Text>
                  </div>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={monthly_trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: colors.gray, fontSize: 12 }}
                        axisLine={{ stroke: colors.border }}
                      />
                      <YAxis 
                        tick={{ fill: colors.gray, fontSize: 12 }}
                        axisLine={{ stroke: colors.border }}
                        tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div style={{
                                backgroundColor: '#ffffff',
                                border: data.is_peak_month ? `2px solid ${colors.warning}` : `1px solid ${colors.border}`,
                                borderRadius: '8px',
                                padding: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              }}>
                                <p style={{ margin: 0, fontWeight: 600, color: '#1a1d23' }}>
                                  {label} {data.is_peak_month && '🔥 Peak Month'}
                                </p>
                                <p style={{ margin: '4px 0', fontSize: 12, color: colors.gray }}>
                                  Active Rentals: {data.rental_count || 0}
                                </p>
                                {payload.map((entry, index) => (
                                  <p key={index} style={{ margin: '4px 0', color: entry.color }}>
                                    {entry.name}: {formatCurrency(entry.value)}
                                  </p>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: 20 }}
                        iconType="line"
                      />
                      <ReferenceLine 
                        y={current_collections.market_monthly} 
                        stroke={colors.secondary} 
                        strokeDasharray="5 5" 
                        label="Market Monthly Target" 
                      />
                      <ReferenceLine 
                        y={current_collections.open_space_monthly} 
                        stroke={colors.warning} 
                        strokeDasharray="5 5" 
                        label="Open Space Monthly Target" 
                      />
                      <ReferenceLine 
                        y={current_collections.taboc_gym_monthly} 
                        stroke="#f59e0b" 
                        strokeDasharray="5 5" 
                        label="Taboc Gym Monthly Target" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="market_monthly" 
                        stroke={colors.secondary} 
                        strokeWidth={3}
                        dot={(props) => {
                          const { cx, cy, payload } = props;
                          return (
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={payload.is_peak_month ? 8 : 6}
                              fill={payload.is_peak_month ? colors.warning : colors.secondary}
                              stroke="#fff"
                              strokeWidth={2}
                              style={{
                                filter: payload.is_peak_month ? `drop-shadow(0 0 6px ${colors.warning}80)` : 'none'
                              }}
                            />
                          );
                        }}
                        activeDot={{ r: 8 }}
                        name="Market Monthly"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="open_space_monthly" 
                        stroke={colors.warning} 
                        strokeWidth={3}
                        dot={(props) => {
                          const { cx, cy, payload } = props;
                          return (
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={payload.is_peak_month ? 8 : 6}
                              fill={payload.is_peak_month ? colors.success : colors.warning}
                              stroke="#fff"
                              strokeWidth={2}
                              style={{
                                filter: payload.is_peak_month ? `drop-shadow(0 0 6px ${colors.success}80)` : 'none'
                              }}
                            />
                          );
                        }}
                        activeDot={{ r: 8 }}
                        name="Open Space Monthly"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="taboc_gym_monthly" 
                        stroke="#f59e0b" 
                        strokeWidth={3}
                        dot={(props) => {
                          const { cx, cy, payload } = props;
                          return (
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={payload.is_peak_month ? 8 : 6}
                              fill={payload.is_peak_month ? '#fbbf24' : '#f59e0b'}
                              stroke="#fff"
                              strokeWidth={2}
                              style={{
                                filter: payload.is_peak_month ? `drop-shadow(0 0 6px #fbbf2480)` : 'none'
                              }}
                            />
                          );
                        }}
                        activeDot={{ r: 8 }}
                        name="Taboc Gym Monthly"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  
                  {/* Peak Months Legend */}
                  <div style={{ marginTop: "16px", textAlign: "center" }}>
                    <Space>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ 
                          width: "12px", 
                          height: "12px", 
                          borderRadius: "50%", 
                          background: colors.warning,
                          boxShadow: `0 0 6px ${colors.warning}80`
                        }} />
                        <Text style={{ fontSize: "12px", color: colors.gray }}>Peak Month</Text>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ 
                          width: "12px", 
                          height: "12px", 
                          borderRadius: "50%", 
                          background: colors.secondary
                        }} />
                        <Text style={{ fontSize: "12px", color: colors.gray }}>Regular Month</Text>
                      </div>
                    </Space>
                  </div>
                </div>
              </TabPane>
              
              <TabPane 
                tab={
                  <span style={{ fontSize: "16px", fontWeight: "600" }}>
                    <FiBarChart2 style={{ marginRight: "8px" }} />
                    Comparison Analysis
                  </span>
                } 
                key="comparison"
              >
                <div>
                  <Title level={4} style={{ marginBottom: "24px", color: "#1a1d23" }}>
                    Market vs Open Space Comparison
                  </Title>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={[
                      { 
                        name: 'Daily Collections', 
                        Market: current_collections.market_daily, 
                        'Open Space': current_collections.open_space_daily,
                        'Taboc Gym': current_collections.taboc_gym_daily
                      },
                      { 
                        name: 'Monthly Collections', 
                        Market: current_collections.market_monthly, 
                        'Open Space': current_collections.open_space_monthly,
                        'Taboc Gym': current_collections.taboc_gym_monthly
                      },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: colors.gray, fontSize: 12 }}
                        axisLine={{ stroke: colors.border }}
                      />
                      <YAxis 
                        tick={{ fill: colors.gray, fontSize: 12 }}
                        axisLine={{ stroke: colors.border }}
                        tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ paddingTop: 20 }}
                      />
                      <Bar 
                        dataKey="Market" 
                        fill={colors.primary} 
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar 
                        dataKey="Open Space" 
                        fill={colors.success} 
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar 
                        dataKey="Taboc Gym" 
                        fill="#f59e0b" 
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {/* Comparison Summary */}
                  <Row gutter={[16, 16]} style={{ marginTop: "32px" }}>
                    <Col xs={24} sm={8}>
                      <div style={{ 
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                        borderRadius: "12px",
                        padding: "20px",
                        color: "#ffffff"
                      }}>
                        <Text style={{ fontSize: "14px", opacity: 0.9, display: "block", marginBottom: "8px" }}>
                          Market Share
                        </Text>
                        <div style={{ fontSize: "28px", fontWeight: "700", fontVariantNumeric: "tabular-nums" }}>
                          {comparison.market_percentage}%
                        </div>
                        <Text style={{ fontSize: "14px", opacity: 0.9, display: "block", marginTop: "4px" }}>
                          {formatCurrency(current_collections.market_daily)} market daily
                        </Text>
                      </div>
                    </Col>
                    <Col xs={24} sm={8}>
                      <div style={{ 
                        background: `linear-gradient(135deg, ${colors.success} 0%, #059669 100%)`,
                        borderRadius: "12px",
                        padding: "20px",
                        color: "#ffffff"
                      }}>
                        <Text style={{ fontSize: "14px", opacity: 0.9, display: "block", marginBottom: "8px" }}>
                          Open Space Share
                        </Text>
                        <div style={{ fontSize: "28px", fontWeight: "700", fontVariantNumeric: "tabular-nums" }}>
                          {comparison.open_space_percentage}%
                        </div>
                        <Text style={{ fontSize: "14px", opacity: 0.9, display: "block", marginTop: "4px" }}>
                          {formatCurrency(current_collections.open_space_daily)} open space daily
                        </Text>
                      </div>
                    </Col>
                    <Col xs={24} sm={8}>
                      <div style={{ 
                        background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
                        borderRadius: "12px",
                        padding: "20px",
                        color: "#ffffff"
                      }}>
                        <Text style={{ fontSize: "14px", opacity: 0.9, display: "block", marginBottom: "8px" }}>
                          Taboc Gym Share
                        </Text>
                        <div style={{ fontSize: "28px", fontWeight: "700", fontVariantNumeric: "tabular-nums" }}>
                          {comparison.taboc_gym_percentage}%
                        </div>
                        <Text style={{ fontSize: "14px", opacity: 0.9, display: "block", marginTop: "4px" }}>
                          {formatCurrency(current_collections.taboc_gym_daily)} taboc gym daily
                        </Text>
                      </div>
                    </Col>
                  </Row>
                </div>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ExpectedCollectionAnalysis;
