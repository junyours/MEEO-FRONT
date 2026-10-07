import React, { useState, useEffect } from "react";
import { Card, Row, Col, Tabs, Typography, Alert, Button, Space, Progress, Empty } from "antd";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ReferenceLine, PieChart, Pie, Cell } from "recharts";
import { FiTrendingUp, FiDollarSign, FiBarChart2, FiCalendar, FiRefreshCw, FiPrinter } from "react-icons/fi";
import api from "../Api";
import LoadingOverlay from "./Loading";
import "./css/ExpectedCollectionAnalysis.css";

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
    background: "linear-gradient(135deg, #164e63 0%, #1b6572 100%)",
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
    color: "#ffffff",
    fontVariantNumeric: "tabular-nums"
  },
  textMetricLabelWhite: {
    fontSize: "14px",
    color: "rgba(255, 255, 255, 0.82)",
    fontWeight: "500"
  }
};

// Color palette
const colors = {
  primary: "#1b6572",
  secondary: "#2868a6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  gray: "#6b7280",
  light: "#f9fafb",
  border: "#e5e7eb"
};

const CHART_COLORS = ['#1b6572', '#2f7d70', '#d28a2e', '#2868a6', '#ba5b50', '#687c45', '#8b6d4e', '#398c91'];

const ExpectedCollectionAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

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

  const formatCurrency = (value) => `₱${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const exportToPDF = () => {
    // PDF export functionality
    window.print();
  };

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

  const current_collections = {
    market_daily: Number(data.current_collections?.market_daily || 0),
    market_monthly: Number(data.current_collections?.market_monthly || 0),
    open_space_daily: Number(data.current_collections?.open_space_daily || 0),
    open_space_monthly: Number(data.current_collections?.open_space_monthly || 0),
    taboc_gym_daily: Number(data.current_collections?.taboc_gym_daily || 0),
    taboc_gym_monthly: Number(data.current_collections?.taboc_gym_monthly || 0),
  };
  const monthly_trend = Array.isArray(data.monthly_trend) ? data.monthly_trend : [];
  const normalizeSection = (section) => {
    const totalStalls = Number(section.total_stalls || 0);
    const occupiedStalls = Number(section.occupied_stalls || 0);

    return {
      ...section,
      section_name: section.section_name || 'Unnamed section',
      area_name: section.area_name || 'Unknown area',
      total_stalls: totalStalls,
      occupied_stalls: occupiedStalls,
      available_stalls: Number(section.available_stalls ?? Math.max(0, totalStalls - occupiedStalls)),
    };
  };
  const market_sections = Array.isArray(data.market_sections)
    ? data.market_sections.map(normalizeSection)
    : [];
  const open_space_sections = Array.isArray(data.open_space_sections)
    ? data.open_space_sections.map(normalizeSection)
    : [];
  const totalDailyCollections = current_collections.market_daily
    + current_collections.open_space_daily
    + current_collections.taboc_gym_daily;
  const comparison = {
    market_percentage: totalDailyCollections > 0
      ? Number(((current_collections.market_daily / totalDailyCollections) * 100).toFixed(2))
      : 0,
    open_space_percentage: totalDailyCollections > 0
      ? Number(((current_collections.open_space_daily / totalDailyCollections) * 100).toFixed(2))
      : 0,
    taboc_gym_percentage: totalDailyCollections > 0
      ? Number(((current_collections.taboc_gym_daily / totalDailyCollections) * 100).toFixed(2))
      : 0,
  };

  // Prepare pie chart data for market sections only
  const prepareMarketPieData = () => {
    return market_sections.map(section => {
      const totalStalls = section.total_stalls;
      const occupiedStalls = section.occupied_stalls;
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
    return {
      market: market_sections,
      openSpace: open_space_sections
    };
  };

  const allSections = [...market_sections, ...open_space_sections];
  const totalStalls = allSections.reduce((total, section) => total + section.total_stalls, 0);
  const totalOccupiedStalls = allSections.reduce((total, section) => total + section.occupied_stalls, 0);
  const occupancyRate = totalStalls > 0 ? ((totalOccupiedStalls / totalStalls) * 100).toFixed(1) : 0;

  const prepareOpenSpacePieData = () => {
    return open_space_sections.map(section => {
      const totalStalls = section.total_stalls;
      const occupiedStalls = section.occupied_stalls;
      const occupancyPercentage = totalStalls > 0 ? ((occupiedStalls / totalStalls) * 100).toFixed(1) : 0;
      return {
        name: section.section_name,
        value: parseFloat(occupancyPercentage),
        displayValue: `${occupiedStalls}/${totalStalls}`,
        area: section.area_name,
        totalStalls,
        occupiedStalls
      };
    }).sort((a, b) => b.value - a.value);
  };

  const marketPieData = prepareMarketPieData();
  const sectionDataByArea = prepareSectionDataByArea();
  const openSpacePieData = prepareOpenSpacePieData();

  return (
    <div className="expected-collection-screen" style={styles.container}>
      <Card className="collection-report-header" bordered={false}>
        <div className="collection-report-layout">
          <div className="collection-report-identity">
            <div className="collection-report-mark"><FiBarChart2 /></div>
            <div className="collection-report-copy">
              <Text className="collection-report-eyebrow">REVENUE & OCCUPANCY</Text>
              <Title level={2} className="collection-report-title">
                Expected Collection Analysis
              </Title>
              <Text type="secondary" className="collection-report-subtitle">
                Current rental rates, collection trends, and stall occupancy by area.
              </Text>
            </div>
          </div>
          <Space className="collection-report-actions" wrap>
            <Button icon={<FiPrinter />} onClick={exportToPDF}>Print report</Button>
            <Button
              type="primary"
              icon={<FiRefreshCw />}
              loading={loading}
              onClick={fetchExpectedCollectionData}
            >
              Refresh data
            </Button>
          </Space>
        </div>
      </Card>

      {/* KPI Metrics */}
      <Row className="collection-overview-metrics" gutter={[24, 24]} style={{ marginBottom: "32px" }}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ ...styles.metricCard, ...styles.primaryMetricCard }}
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
              ...styles.metricCard,
              ...styles.primaryMetricCard,
              background: "linear-gradient(135deg, #267a60 0%, #17654d 100%)",
            }}
            bodyStyle={{ padding: "24px" }}
          >
            <div style={{ textAlign: "center" }}>
              <Text style={styles.textMetricLabelWhite}>
                Total Expected Monthly
              </Text>
              <div style={styles.textMetricWhite}>
                {formatCurrency(current_collections.market_monthly + current_collections.open_space_monthly + current_collections.taboc_gym_monthly)}
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
                Stall Occupancy
              </Text>
              <div style={{ ...styles.textMetric, color: colors.primary }}>
                {occupancyRate}%
              </div>
              <Text style={{ fontSize: "12px", color: colors.gray, marginTop: "8px", display: "block" }}>
                {totalOccupiedStalls.toLocaleString()} of {totalStalls.toLocaleString()} stalls occupied
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={styles.metricCard} bodyStyle={{ padding: "24px" }}>
            <div style={{ textAlign: "center" }}>
              <Text style={styles.textMetricLabel}>Available Stalls</Text>
              <div style={{ ...styles.textMetric, color: colors.success }}>
                {Math.max(0, totalStalls - totalOccupiedStalls).toLocaleString()}
              </div>
              <Text style={{ fontSize: "12px", color: colors.gray, marginTop: "8px", display: "block" }}>
                Across {market_sections.length + open_space_sections.length} sections
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <div className="collection-section-heading">
        <div>
          <Text className="collection-section-eyebrow">STALL OCCUPANCY</Text>
          <Title level={3}>Occupancy by service area</Title>
        </div>
        <Text type="secondary">Compare occupied and available stalls by section.</Text>
      </div>
      {/* Market Areas - Dedicated Section */}
      <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
        <Col xs={24}>
          <Card className="occupancy-analysis-card" style={styles.chartCard}>
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
          <Card className="occupancy-analysis-card" style={styles.chartCard}>
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

      <div className="collection-section-heading collection-rates-heading">
        <div>
          <Text className="collection-section-eyebrow">RATE SUMMARY</Text>
          <Title level={3}>Expected collections by service area</Title>
        </div>
        <Text type="secondary">Daily and monthly rental totals.</Text>
      </div>
      <Row className="collection-rate-grid" gutter={[16, 16]} style={{ marginBottom: "32px" }}>
        <Col xs={24} sm={12} lg={8}>
          <Card
            className="collection-rate-card"
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
        <Col xs={24} sm={12} lg={8}>
          <Card
            className="collection-rate-card"
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
        <Col xs={24} sm={12} lg={8}>
          <Card
            className="collection-rate-card"
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
        <Col xs={24} sm={12} lg={8}>
          <Card
            className="collection-rate-card"
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
        <Col xs={24} sm={12} lg={8}>
          <Card
            className="collection-rate-card"
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
        <Col xs={24} sm={12} lg={8}>
          <Card
            className="collection-rate-card"
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
          <Card className="collection-trend-card" style={styles.chartCard}>
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
                              key={`market-dot-${payload.month || payload.index}`}
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
                              key={`openspace-dot-${payload.month || payload.index}`}
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
                              key={`taboc-dot-${payload.month || payload.index}`}
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
