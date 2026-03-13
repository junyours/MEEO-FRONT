import React, { useState, useEffect } from "react";
import {
  Layout,
  Row,
  Col,
  Card,
  Typography,
  Select,
  Spin,

  Tooltip,
} from "antd";
import {
  FiTrendingUp,

  FiUser,
  FiHome,
  FiDollarSign,
  FiCalendar,
  
  FiTarget,
  FiPieChart,
  FiBarChart,
  FiAward,
} from "react-icons/fi";
import {
  FaStore,
  FaUsers,

  FaClipboardList,
  FaChartLine,

} from "react-icons/fa";
import { DollarOutlined } from "@ant-design/icons";
import Sidebar from "./Sidebar";
import SectionManager from "./SectionManager";
import AdminApplications from "./ApplicationForm";
import AdminVendorProfiles from "./VendorProfile";
import MarketRegistration from "./MarketRegistration";
import VendorsMissedPayments from "./VendorMissedDay";
import VendorPaymentManagement from "./VendorPaymentManagement";
import MarketReport from "./MarketReport";
import VendorAnalysis from "./VendorAnalysis";
import SlaughterReport from "./SlaughterReport";
import RentalReport from "./RentalReport";



import AdminStallChangeRequests from "./AdminStallChangeRequests";

import CollectorReports from "./CollectorReports";

import Reports from "./Reports";

import StallHistory from "./StallHistory";

import UnremittedPayments from "./UnremittedPayments";
import MarketCollectionReport from "./MarketCollectionReport";
import WharfReport from "./WharfReport";

import MotorPoolReport from "./MotorPoolReport";

import AdminRemoveStall from "./AdminRemoveStall";

import TargetsReports from "./TargetsReports";

import LoadingOverlay from "./Loading";
// import CashTickets from "./CashTickets";
import CashTicketManagement from "./CashTicketManagement";
import RenewalRequests from "./RenewalRequest";


import VendorPaymentCalendar from "./VendorPaymentCalendar";

import ExpectedCollectionAnalysis from "./ExpectedCollectionAnalysis";

import MarketOpenSpaceScreen from "./MarketOpenSpaceScreen";

import DepartmentCollectionReporting from "./DepartmentCollectionReporting";

// New Market Management Components
import VendorManagement from "./VendorManagement";
import PaymentMonitoring from "./PaymentMonitoring";
import TargetCollectionReporting from "./TargetCollectionReporting";
import CertificateManagement from "./CertificateManagement";

import AdminProfile from "./AdminProfile";

import api from "../Api";

import BlocklistedVendors from "./BlockListed";

import PaymentReports from "./PaymentReports";

import StallRateDashboard from "./StallRateDashboard";

import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar
} from 'recharts';


const { Content, Header } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [stats, setStats] = useState({
    rentedStalls: 0,
    availableStalls: 0,
    vendors: 0,
    incharges: 0,
    main: 0,
    meat: 0,
    today_expected_collection: 0,
    monthly_expected_collection: 0,
  });
  const [sectionStats, setSectionStats] = useState([]);
  const [departmentIncome, setDepartmentIncome] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({
    total_collected_this_year: 0,
    total_remaining_balance: 0,
    total_collected_all_time: 0,
    year_over_year_growth: 0,
    previous_year_collected: 0,
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const primaryColor = "#2563eb";
  const successColor = "#16a34a";
  const warningColor = "#ea580c";
  const dangerColor = "#dc2626";
  const neutralColor = "#64748b";
  const backgroundColor = "#f8fafc";
  const cardBackground = "#ffffff";
  const textPrimary = "#0f172a";
  const textSecondary = "#64748b";

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/dashboard/stats?year=${selectedYear}`);
        setStats(data.basic_stats);
        setSectionStats(data.section_statistics);
        setDepartmentIncome(data.department_income);
        setFinancialSummary(data.financial_summary);
        setAvailableYears(data.available_years);
      } catch (error) {
        console.warn(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [selectedYear]);

  const StatCard = ({ title, value, icon, color, targetView, subtitle }) => (
    <Card
      hoverable
      onClick={() => targetView && setActiveView(targetView)}
      style={{
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        background: cardBackground,
        height: "100%",
        transition: "all 0.2s ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
      bodyStyle={{ padding: 20 }}
      className="stat-card"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            background: color,
            color: "white",
            borderRadius: 8,
            padding: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontSize: 12,
              color: textSecondary,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "block",
              marginBottom: 4,
            }}
          >
            {title}
          </Text>
          <Text
            strong
            style={{
              fontSize: 24,
              color: textPrimary,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.2,
              fontWeight: 600,
              display: "block",
            }}
          >
            {value}
          </Text>
          {subtitle && (
            <Text
              style={{
                fontSize: 11,
                color: textSecondary,
                fontWeight: 400,
                display: "block",
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          )}
        </div>
      </div>
    </Card>
  );

  const renderDashboard = () => (
    <div
      style={{
        padding: "24px",
        maxWidth: "100%",
        margin: "0 auto",
        background: backgroundColor,
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: 32,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <Title
            level={2}
            style={{
              margin: 0,
              color: textPrimary,
              fontWeight: 600,
              fontSize: 28,
              marginBottom: 4,
            }}
          >
            Dashboard Overview
          </Title>
          <Text style={{ color: textSecondary, fontSize: 14 }}>
            Municipal Economic Enterprise Office - Market Management System
          </Text>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: cardBackground,
            padding: "12px 16px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <FiCalendar style={{ color: primaryColor, fontSize: 16 }} />
          <Text style={{ color: textSecondary, fontSize: 14, fontWeight: 500 }}>
            {new Date().getFullYear()}
          </Text>
        </div>
      </div>

      {/* Statistics Overview */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Available Stalls"
            value={stats.availableStalls}
            icon={<FaStore />}
            color="#10b981"
            targetView="market-section-stalls"
            subtitle="total available"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Rented Stalls"
            value={stats.rentedStalls}
            icon={<FaStore />}
            color="#f59e0b"
            targetView="market-section-stalls"
            subtitle="currently occupied"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Vendors"
            value={stats.vendors}
            icon={<FaUsers />}
            color="#3b82f6"
            targetView="vendor-management"
            subtitle="registered vendors"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Rentals"
            value={stats.rentedStalls}
            icon={<FaClipboardList />}
            color="#8b5cf6"
            targetView="vendor-management"
            subtitle="active contracts"
          />
        </Col>
      </Row>

      {/* Revenue Overview */}
      <div style={{ marginBottom: 32 }}>
        <Title
          level={3}
          style={{
            margin: 0,
            color: textPrimary,
            fontWeight: 600,
            fontSize: 20,
            marginBottom: 16,
          }}
        >
          Revenue Analytics
        </Title>
      </div>
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              height: "100%",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
            bodyStyle={{ padding: 20 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  borderRadius: 8,
                  padding: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                <FiDollarSign />
              </div>
              <div style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "rgba(255,255,255,0.9)",
                    display: "block",
                    marginBottom: 4,
                    fontWeight: 500,
                  }}
                >
                  Today's Expected
                </Text>
                <Text
                  strong
                  style={{
                    fontSize: 22,
                    color: "white",
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1.2,
                    fontWeight: 600,
                  }}
                >
                  ₱{stats.today_expected_collection?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
              height: "100%",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
            bodyStyle={{ padding: 20 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  borderRadius: 8,
                  padding: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                <FiCalendar />
              </div>
              <div style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "rgba(255,255,255,0.9)",
                    display: "block",
                    marginBottom: 4,
                    fontWeight: 500,
                  }}
                >
                  Monthly Expected
                </Text>
                <Text
                  strong
                  style={{
                    fontSize: 22,
                    color: "white",
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1.2,
                    fontWeight: 600,
                  }}
                >
                  ₱{stats.monthly_expected_collection?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
              height: "100%",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
            bodyStyle={{ padding: 20 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  borderRadius: 8,
                  padding: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                <FiTarget />
              </div>
              <div style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "rgba(255,255,255,0.9)",
                    display: "block",
                    marginBottom: 4,
                    fontWeight: 500,
                  }}
                >
                  Market Daily
                </Text>
                <Text
                  strong
                  style={{
                    fontSize: 22,
                    color: "white",
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1.2,
                    fontWeight: 600,
                  }}
                >
                  ₱{stats.market_daily_collection?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
              height: "100%",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
            bodyStyle={{ padding: 20 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  borderRadius: 8,
                  padding: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                <FiHome />
              </div>
              <div style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "rgba(255,255,255,0.9)",
                    display: "block",
                    marginBottom: 4,
                    fontWeight: 500,
                  }}
                >
                  Open Space Daily
                </Text>
                <Text
                  strong
                  style={{
                    fontSize: 22,
                    color: "white",
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1.2,
                    fontWeight: 600,
                  }}
                >
                  ₱{stats.open_space_daily_collection?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
              height: "100%",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
            bodyStyle={{ padding: 20 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 10,
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FiAward style={{ color: "white", fontSize: 20 }} />
              </div>
              <div style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "rgba(255,255,255,0.9)",
                    display: "block",
                    marginBottom: 4,
                    fontWeight: 500,
                  }}
                >
                  Taboc Gym Daily
                </Text>
                <Text
                  strong
                  style={{
                    fontSize: 22,
                    color: "white",
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1.2,
                    fontWeight: 600,
                  }}
                >
                  ₱{stats.taboc_gym_daily_collection?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Performance Analytics */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={16}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: cardBackground,
              height: "100%",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
            bodyStyle={{ padding: 24 }}
          >
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    background: primaryColor,
                    color: "white",
                    borderRadius: 8,
                    padding: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                  }}
                >
                  <FiBarChart />
                </div>
                <div>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: textPrimary,
                      display: "block",
                    }}
                  >
                    Revenue Performance
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: textSecondary,
                    }}
                  >
                    Market, Open Space & Taboc Gym comparison
                  </Text>
                </div>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={[
                { name: 'Daily Revenue', Market: stats.market_daily_collection || 0, 'Open Space': stats.open_space_daily_collection || 0, 'Taboc Gym': stats.taboc_gym_daily_collection || 0 },
                { name: 'Monthly Revenue', Market: stats.market_monthly_collection || 0, 'Open Space': stats.open_space_monthly_collection || 0, 'Taboc Gym': stats.taboc_gym_monthly_collection || 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: textSecondary, fontSize: 12 }} 
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  tick={{ fill: textSecondary, fontSize: 12 }} 
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: cardBackground, 
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    padding: '12px'
                  }}
                  formatter={(value, name) => [`₱${value.toLocaleString()}`, name]}
                />
                <Bar dataKey="Market" fill={primaryColor} radius={[6, 6, 0, 0]} />
                <Bar dataKey="Open Space" fill={successColor} radius={[6, 6, 0, 0]} />
                <Bar dataKey="Taboc Gym" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card
              hoverable
              style={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                background: cardBackground,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    background: successColor,
                    color: "white",
                    borderRadius: 8,
                    padding: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                  }}
                >
                  <FiTarget />
                </div>
                <div>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: textPrimary,
                      display: "block",
                    }}
                  >
                    Top Performer
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: textSecondary,
                    }}
                  >
                    This period
                  </Text>
                </div>
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <Text
                  strong
                  style={{
                    fontSize: 20,
                    color: successColor,
                    fontVariantNumeric: "tabular-nums",
                    display: "block",
                  }}
                >
                  {stats.top_performer?.name || 'Market'}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    color: textPrimary,
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 600,
                  }}
                >
                  ₱{(stats.top_performer?.amount || 0).toLocaleString()}
                </Text>
              </div>
              
              {stats.top_performer?.growth === 'positive' && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FiTrendingUp style={{ color: successColor, fontSize: 14 }} />
                  <Text
                    style={{
                      fontSize: 12,
                      color: successColor,
                      fontWeight: 600,
                    }}
                  >
                    {stats.top_performer?.percentage || 0}% growth
                  </Text>
                </div>
              )}
            </Card>
            
            <Card
              hoverable
              style={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                background: cardBackground,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    background: warningColor,
                    color: "white",
                    borderRadius: 8,
                    padding: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                  }}
                >
                  <FiTrendingUp />
                </div>
                <div style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: textPrimary,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Growth Rate
                  </Text>
                  <Text
                    strong
                    style={{
                      fontSize: 18,
                      color: warningColor,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {stats.collection_comparison?.market_daily_vs_expected > 0 ? '+' : ''}{Math.abs(stats.collection_comparison?.market_daily_vs_expected || 0)}%
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: textSecondary,
                    }}
                  >
                    vs last period
                  </Text>
                </div>
              </div>
            </Card>
          </div>
        </Col>
      </Row>

      {/* Financial Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: cardBackground,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  background: primaryColor,
                  color: "white",
                  borderRadius: 8,
                  padding: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                <DollarOutlined />
              </div>
              <div style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: textSecondary,
                    display: "block",
                    marginBottom: 2,
                  }}
                >
                  Collected This Year
                </Text>
                <Text
                  strong
                  style={{
                    fontSize: 16,
                    color: textPrimary,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  ₱{financialSummary.total_collected_this_year_formatted || '0.00'}
                </Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: cardBackground,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  background: warningColor,
                  color: "white",
                  borderRadius: 8,
                  padding: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                <FaClipboardList />
              </div>
              <div style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: textSecondary,
                    display: "block",
                    marginBottom: 2,
                  }}
                >
                  Remaining Balance
                </Text>
                <Text
                  strong
                  style={{
                    fontSize: 16,
                    color: textPrimary,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  ₱{financialSummary.total_remaining_balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: cardBackground,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  background: financialSummary.year_over_year_growth >= 0 
                    ? successColor 
                    : dangerColor,
                  color: "white",
                  borderRadius: 8,
                  padding: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                <FiTrendingUp />
              </div>
              <div style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: textSecondary,
                    display: "block",
                    marginBottom: 2,
                  }}
                >
                  Year-over-Year Growth
                </Text>
                <Text
                  strong
                  style={{
                    fontSize: 16,
                    color: financialSummary.year_over_year_growth >= 0 ? successColor : dangerColor,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {financialSummary.year_over_year_growth >= 0 ? "+" : ""}{financialSummary.year_over_year_growth.toFixed(2)}%
                </Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: cardBackground,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  background: "#8b5cf6",
                  color: "white",
                  borderRadius: 8,
                  padding: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                <FaChartLine />
              </div>
              <div style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: textSecondary,
                    display: "block",
                    marginBottom: 2,
                  }}
                >
                  All Time Collections
                </Text>
                <Text
                  strong
                  style={{
                    fontSize: 16,
                    color: textPrimary,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  ₱{financialSummary.total_collected_all_time_formatted || '0.00'}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Section Statistics and Department Income */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FaChartLine style={{ color: primaryColor }} />
                <span>Section Performance Overview</span>
              </div>
            }
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: cardBackground,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {sectionStats.map((section, index) => (
                <div
                  key={section.id}
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    background: backgroundColor,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 14, color: textPrimary }}>
                      {section.name}
                    </Text>
                    <div
                      style={{
                        background: section.occupancy_rate >= 80 ? successColor : 
                                   section.occupancy_rate >= 50 ? warningColor : dangerColor,
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {section.occupancy_rate.toFixed(1)}% Occupied
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                      <Text style={{ fontSize: 12, color: textSecondary }}>
                        Stall Status
                      </Text>
                      <div style={{ marginTop: 2 }}>
                        <Text style={{ fontSize: 12, color: textPrimary }}>
                          <span style={{ color: successColor, fontWeight: 600 }}>{section.rented_stalls}</span> occupied / 
                          <span style={{ color: textSecondary, fontWeight: 600 }}> {section.available_stalls}</span> available
                          {section.other_status_stalls > 0 && (
                            <span style={{ color: warningColor, fontWeight: 600 }}> / {section.other_status_stalls} other</span>
                          )}
                        </Text>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Text style={{ fontSize: 12, color: textSecondary }}>
                        Total Stalls
                      </Text>
                      <div style={{ marginTop: 2 }}>
                        <Text strong style={{ fontSize: 13, color: textPrimary }}>
                          {section.total_stalls}
                        </Text>
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    width: "100%", 
                    height: 4, 
                    background: "#e2e8f0", 
                    borderRadius: 2, 
                    overflow: "hidden",
                  }}>
                    <div
                      style={{
                        width: `${section.occupancy_rate}%`,
                        height: "100%",
                        background: section.occupancy_rate >= 80 ? successColor : 
                                   section.occupancy_rate >= 50 ? warningColor : dangerColor,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <DollarOutlined style={{ color: successColor }} />
                <span>Department Income & Targets</span>
              </div>
            }
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: cardBackground,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {departmentIncome.map((dept) => (
                <div
                  key={dept.id}
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    background: backgroundColor,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Text strong style={{ fontSize: 14, color: textPrimary }}>
                        {dept.name}
                      </Text>
                      {dept.annual_target > 0 ? (
                        <div
                          style={{
                            background: dept.progress_percentage >= 100 ? successColor : 
                                       dept.progress_percentage >= 75 ? warningColor : dangerColor,
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {dept.progress_percentage.toFixed(1)}% Complete
                        </div>
                      ) : (
                        <div
                          style={{
                            background: neutralColor,
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          No Target Set
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {dept.annual_target > 0 ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <Text style={{ fontSize: 11, color: textSecondary }}>
                          Target: ₱{dept.annual_target_formatted?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                        <Text style={{ fontSize: 11, color: textSecondary }}>
                          Collected: ₱{dept.current_year_collection_formatted?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      </div>
                      
                      <div style={{ width: "100%", background: "#e2e8f0", borderRadius: 2, height: 4 }}>
                        <div
                          style={{
                            width: `${Math.min(dept.progress_percentage, 100)}%`,
                            background: dept.progress_percentage >= 100 ? successColor : 
                                       dept.progress_percentage >= 75 ? warningColor : dangerColor,
                            height: "100%",
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      
                      <div style={{ marginTop: 6, textAlign: "right" }}>
                        <Text 
                          style={{ 
                            fontSize: 11, 
                            fontWeight: 600,
                            color: dept.remaining_balance <= 0 ? successColor : dangerColor,
                          }}
                        >
                          {dept.remaining_balance <= 0 ? "Target Met" : `Remaining: ₱${dept.remaining_amount_formatted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </Text>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: "12px 0" }}>
                      <Text style={{ fontSize: 12, color: textSecondary }}>
                        No annual target set for this department
                      </Text>
                      <div style={{ marginTop: 6 }}>
                        <Text style={{ fontSize: 12, color: successColor, fontWeight: 600 }}>
                          Collected: ₱{dept.total_collected?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </Text>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );


    const renderContent = () => {

  switch (activeView) {
    case "profile":
      return <AdminProfile />;
    case "payment-monitoring":
      return <PaymentMonitoring />;

    case "target-collection":
      return <TargetCollectionReporting />;
case "vendor-management":
  return <VendorManagement />;
    case "department-collection":
      return <DepartmentCollectionReporting />;
case "cash-ticket":
  return <CashTicketManagement />;
    case "certificate-management":
      return <CertificateManagement />;
case "market-collection-reports":
  return <MarketCollectionReport />;
    case "market-section-stalls":
      return <SectionManager />;
case "remaining-balance":
  return <VendorAnalysis />;
case "rental-report":
  return <RentalReport />;
    case "market-registration":
      return <MarketRegistration />;

    case "market-vendor-applications":
      return <AdminApplications />;

    case "market-stall-change":
      return <AdminStallChangeRequests />;

    case "market-remittance":
      return <MarketReport />;

    case "renewal":
      return <RenewalRequests />;

    case "slaughter-remittance":
      return <SlaughterReport />;

    case "motorpool-remittance":
      return <MotorPoolReport />;

    case "wharf-remittance":
      return <WharfReport />;

    case "unremitted":
      return <UnremittedPayments />;

    case "vendor-accounts":
      return <AdminVendorProfiles />;

    case "target":
      return <TargetsReports />;

    case "vendor-payment":
      return <VendorPaymentManagement />;

    case "department":
      return <Reports />;

    case "collector":
      return <CollectorReports />;

    case "remove-stall":
      return <AdminRemoveStall />;

    case "vendor-payments":
      return <VendorsMissedPayments />;

    case "vendor-payment-calendar":
      return <VendorPaymentCalendar />;

    case "stall":
      return <StallHistory />;

    case "payment-reports":
      return <PaymentReports />;

    case "block-listed":
      return <BlocklistedVendors />;
case "estimated_collection":
return <ExpectedCollectionAnalysis />;

case "market-open-space-collections":
return <MarketOpenSpaceScreen />;

case "stall-rate-dashboard":
  return <StallRateDashboard />;

    default:
      return renderDashboard();
  }
};



  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: backgroundColor,
      }}
    >
      <Sidebar
        onMenuClick={setActiveView}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeView={activeView}
      />

      <Layout
        style={{
          marginLeft: isSidebarCollapsed ? 80 : 280,
          transition: "margin-left 0.2s ease",
        }}
      >
        <Header
          style={{
            background: cardBackground,
            color: textPrimary,
            padding: "16px 24px",
            fontSize: 16,
            fontWeight: 600,
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            height: "64px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src="/logo_meeo.png"
              alt="logo"
              style={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                objectFit: "cover",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: textPrimary,
                }}
              >
                Admin Dashboard
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: textSecondary,
                  fontWeight: 400,
                }}
              >
                Municipal Economic Enterprise Office
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                fontSize: 11,
                lineHeight: 1.3,
              }}
            >
              <span style={{ color: textSecondary }}>Signed in as</span>
              <span style={{ fontWeight: 500, fontSize: 13, color: textPrimary }}>administrator</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#f8fafc",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => setActiveView("profile")}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f1f5f9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f8fafc";
              }}
            >
              <FiUser
                style={{ 
                  fontSize: 16, 
                  color: textPrimary,
                }} 
              />
            </div>
          </div>
        </Header>

        <Content style={{ padding: 0 }}>{renderContent()}</Content>
      </Layout>

      {loading && <LoadingOverlay message="Loading Dashboard..." />}
    </Layout>
  );

 };



export default AdminDashboard;

