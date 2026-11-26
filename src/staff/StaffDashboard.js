import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Layout, Select, Space, Tag, Typography } from "antd";
import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MenuOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import StaffSidebar from "./StaffSidebar";
import StaffProfile from "./StaffProfile";
import OfficeActivity from "../admin/OfficeActivity";
import ProductManagement from "../admin/ProductManagement";
import VendorQrCodeManagement from "../admin/VendorQrCodeManagement";
import VendorManagement from "../admin/VendorManagement";
import SectionManager from "../admin/SectionManager";
import CashTicketManagement from "../admin/CashTicketManagement";
import VendorPaymentCalendar from "../admin/VendorPaymentCalendar";
import VendorPaymentManagement from "../admin/VendorPaymentManagement";
import PaymentManagement from "../admin/PaymentManagement";
import SlaughterCollectionManagement from "../admin/SlaughterCollectionManagement";
import EventActivityManagement from "../admin/EventActivityManagement";
import EventStallManagement from "../admin/EventStallManagement";
import EventVendorManagement from "../admin/EventVendorManagement";
import EventPaymentManagement from "../admin/EventPaymentManagement";
import VendorAnalysis from "../admin/VendorAnalysis";
import StaffDailyCollectionOverview from "./StaffDailyCollectionOverview";
import StaffStallRateChanges from "./StaffStallRateChanges";
import StaffAnimalManagement from "./StaffAnimalManagement";
import StaffVendorOtherPayments from "./StaffVendorOtherPayments";
import StaffVendorOtherPaymentReport from "./StaffVendorOtherPaymentReport";
import StaffOtherPaymentReport from "./StaffOtherPaymentReport";
import Footer from "../Auth/Footer";
import "./StaffDashboard.css";

const { Content, Header } = Layout;
const { Text, Title } = Typography;

const activityByPeriod = {
  week: [
    { day: "Mon", activities: 18, payments: 12 },
    { day: "Tue", activities: 24, payments: 17 },
    { day: "Wed", activities: 20, payments: 15 },
    { day: "Thu", activities: 28, payments: 21 },
    { day: "Fri", activities: 31, payments: 24 },
    { day: "Sat", activities: 22, payments: 18 },
    { day: "Sun", activities: 12, payments: 8 },
  ],
  month: [
    { day: "Week 1", activities: 112, payments: 74 },
    { day: "Week 2", activities: 136, payments: 92 },
    { day: "Week 3", activities: 124, payments: 86 },
    { day: "Week 4", activities: 158, payments: 108 },
  ],
};

const metrics = [
  { title: "Active vendors", value: "248", note: "+12 this month", icon: <TeamOutlined />, color: "#2563eb", view: "vendor-management" },
  { title: "Market occupancy", value: "86%", note: "214 of 248 stalls", icon: <ShopOutlined />, color: "#0f9f78", view: "market-section-stalls" },
  { title: "Payments recorded", value: "₱184,650", note: "Today's sample total", icon: <WalletOutlined />, color: "#7c3aed", view: "payment-management" },
  { title: "Pending activities", value: "08", note: "3 need attention", icon: <ClockCircleOutlined />, color: "#e58a16", view: "office-activities" },
];

const quickLinks = [
  { label: "Office Activities", description: "Review office work and logs", icon: <CalendarOutlined />, view: "office-activities" },
  { label: "Product Management", description: "Update products and inventory", icon: <CheckCircleOutlined />, view: "product-management" },
  { label: "Vendor Management", description: "Manage vendor records", icon: <TeamOutlined />, view: "vendor-management" },
  { label: "Payment Management", description: "Review payment operations", icon: <WalletOutlined />, view: "payment-management" },
];

const pendingItems = [
  { title: "Review vendor applications", meta: "4 applications awaiting review", view: "vendor-management", color: "gold" },
  { title: "Confirm today's cash tickets", meta: "12 tickets need reconciliation", view: "cash-ticket", color: "blue" },
  { title: "Prepare weekend market layout", meta: "Due today · Market operations", view: "market-section-stalls", color: "purple" },
  
];

const screenLabels = {
  dashboard: "Staff dashboard",
  profile: "My profile",
  "office-activities": "Office Activities",
  "product-management": "Product Management",
  "vendor-qr-codes": "Vendor QR Codes",
  "vendor-management": "Vendor Management",
  "market-section-stalls": "Market Layout Management",
  "remaining-balance": "Vendor Balances",
  "cash-ticket": "Cash Ticket Payments",
  "daily-collections": "Daily Collection Overview",
  "stall-rate-changes": "Stall Rate Change History",

  "vendor-payment-calendar": "Payment Schedule",
  "vendor-payment": "Payment Settlement",
  "vendor-other-payments": "Other Payments & Sales",
  "vendor-other-payment-report": "Vendor Payment Status",
  "walk-in-driver-payment-report": "Walk-in & Driver Payment Report",
  "payment-management": "Payment Management",
  "slaughter-collections": "Slaughter Collections",
  "animal-management": "Animal Catalog",
  "event-activities": "Event Activities",
  "event-stalls": "Event Stalls",
  "event-vendors": "Event Vendors",
  "event-payments": "Event Payments",
};

const StaffDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [screenSize, setScreenSize] = useState(() => ({
    width: window.innerWidth,
    isMobile: window.innerWidth < 768,
  }));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 768);
  const [period, setPeriod] = useState("week");
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const requestedView = pathSegments[0] === "staff" ? pathSegments[1] : null;
  const pageTitle = screenLabels[requestedView] ? requestedView : "dashboard";
  const activeView = pageTitle;
  const compact = screenSize.isMobile;

  const goTo = (view) => {
    navigate(`/staff/${view}`);
    if (compact) setSidebarCollapsed(true);
  };

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      setScreenSize({ width, isMobile });
      setSidebarCollapsed((collapsed) => {
        if (isMobile !== compact) return isMobile;
        return collapsed;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [compact]);

  useEffect(() => {
    const expectedPath = `/staff/${pageTitle}`;
    if (location.pathname !== expectedPath) {
      navigate(expectedPath, { replace: true });
    }
  }, [location.pathname, navigate, pageTitle]);

  const renderOverview = () => (
    <div className="staff-overview">
      <section className="staff-welcome">
        <div>
          <span className="staff-eyebrow">OPOL LGU · OPERATIONS</span>
          <Title level={2}>Good day, team</Title>
          <Text>Here’s your operational snapshot. Select a work area to get started.</Text>
        </div>
        <div className="staff-welcome-date">
          <CalendarOutlined />
          <span>{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
        </div>
      </section>

      <div className="staff-metrics-grid">
        {metrics.map((metric) => (
          <Card
            className="staff-metric-card"
            key={metric.title}
            hoverable
            onClick={() => goTo(metric.view)}
          >
            <div className="staff-metric-top">
              <span className="staff-metric-icon" style={{ background: `${metric.color}14`, color: metric.color }}>{metric.icon}</span>
              <ArrowRightOutlined className="staff-metric-arrow" />
            </div>
            <Text className="staff-metric-title">{metric.title}</Text>
            <Title level={3}>{metric.value}</Title>
            <Text className="staff-metric-note">{metric.note}</Text>
          </Card>
        ))}
      </div>

      <div className="staff-dashboard-columns">
        <Card
          className="staff-panel staff-activity-panel"
          title={
            <div className="staff-panel-heading">
              <div>
                <Title level={4}>Operations activity</Title>
                <Text>Activity across key workflows</Text>
              </div>
              <Select
                aria-label="Activity chart period"
                value={period}
                onChange={setPeriod}
                options={[
                  { value: "week", label: "This week" },
                  { value: "month", label: "This month" },
                ]}
              />
            </div>
          }
        >
          <div className="staff-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityByPeriod[period]} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#edf1f5" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#8290a3", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8290a3", fontSize: 12 }} />
                <Tooltip cursor={{ fill: "#f4f7fb" }} />
                <Bar dataKey="activities" name="Office activities" fill="#2563eb" radius={[5, 5, 0, 0]} />
                <Bar dataKey="payments" name="Payments" fill="#5bc2a5" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="staff-panel staff-tasks-panel" title={<div className="staff-panel-heading"><div><Title level={4}>Needs your attention</Title><Text>Priorities for the team</Text></div><Tag color="blue">3 items</Tag></div>}>
          <div className="staff-pending-list">
            {pendingItems.map((item, index) => (
              <button className="staff-pending-item" key={item.title} onClick={() => goTo(item.view)}>
                <span className="staff-pending-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="staff-pending-copy"><strong>{item.title}</strong><small>{item.meta}</small></span>
                <Tag color={item.color}>{index === 0 ? "Review" : index === 1 ? "Today" : "Plan"}</Tag>
              </button>
            ))}
          </div>
          <Button className="staff-link-button" type="link" onClick={() => goTo("office-activities")}>
            View office activities <ArrowRightOutlined />
          </Button>
        </Card>
      </div>

      <section className="staff-quick-section">
        <div className="staff-section-heading">
          <div><Title level={4}>Quick access</Title><Text>Jump directly into a frequently used area</Text></div>
        </div>
        <div className="staff-quick-grid">
          {quickLinks.map((link) => (
            <button className="staff-quick-link" key={link.view} onClick={() => goTo(link.view)}>
              <span className="staff-quick-icon">{link.icon}</span>
              <span className="staff-quick-copy"><strong>{link.label}</strong><small>{link.description}</small></span>
              <ArrowRightOutlined className="staff-quick-arrow" />
            </button>
          ))}
        </div>
      </section>

      <Card className="staff-note">
        <Space align="start">
          <CheckCircleOutlined />
          <span><strong>Dashboard data preview</strong><br />Numbers and chart activity on this page are sample data and are not connected to live reports.</span>
        </Space>
      </Card>
    </div>
  );

  const renderPage = () => {
    switch (pageTitle) {
      case "office-activities": return <OfficeActivity />;
      case "product-management": return <ProductManagement />;
      case "vendor-qr-codes": return <VendorQrCodeManagement />;
      case "vendor-management": return <VendorManagement />;
      case "market-section-stalls": return <SectionManager />;
      case "daily-collections": return <StaffDailyCollectionOverview />;
      case "stall-rate-changes": return <StaffStallRateChanges />;
      case "remaining-balance": return <VendorAnalysis />;
      case "cash-ticket": return <CashTicketManagement />;
      case "vendor-payment-calendar": return <VendorPaymentCalendar />;
      case "vendor-payment": return <VendorPaymentManagement />;
      case "vendor-other-payments": return <StaffVendorOtherPayments />;
      case "vendor-other-payment-report": return <StaffVendorOtherPaymentReport />;
      case "walk-in-driver-payment-report": return <StaffOtherPaymentReport />;
      case "payment-management": return <PaymentManagement />;
      case "slaughter-collections": return <SlaughterCollectionManagement />;
      case "animal-management": return <StaffAnimalManagement />;
      case "event-activities": return <EventActivityManagement />;
      case "event-stalls": return <EventStallManagement />;
      case "event-vendors": return <EventVendorManagement />;
      case "event-payments": return <EventPaymentManagement />;
      case "profile": return <StaffProfile />;
      default: return renderOverview();
    }
  };

  return (
    <Layout className="staff-layout">
      <StaffSidebar
        activeView={pageTitle}
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        onNavigate={goTo}
      />
      <Layout
        className={`staff-main-layout${sidebarCollapsed ? " is-collapsed" : ""}${compact ? " is-mobile" : ""}`}
        style={{
          marginLeft: compact ? 0 : sidebarCollapsed ? 78 : 272,
        }}
      >
        <Header className="staff-header">
          <div className="staff-header-breadcrumb">
            <Button
              className="staff-header-menu-button"
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            />
            <span className="staff-header-divider" aria-hidden="true" />
            <nav className="staff-header-crumbs" aria-label="Breadcrumb">
              {activeView !== "dashboard" && (
                <>
                  <span className="staff-header-parent">Dashboard</span>
                  <span className="staff-header-chevron" aria-hidden="true">/</span>
                </>
              )}
              <span className="staff-header-current">{screenLabels[activeView] || "Dashboard"}</span>
            </nav>
          </div>
          <div className="staff-header-account">
            <span className="staff-account-status" aria-hidden="true" />
            <span className="staff-header-account-copy">
              <span>Signed in as</span>
              <strong>staff</strong>
            </span>
            <Button
              className="staff-avatar-button"
              type="text"
              aria-label="Open profile settings"
              title="Profile settings"
              onClick={() => goTo("profile")}
            >
              <UserOutlined aria-hidden="true" />
            </Button>
          </div>
        </Header>
        <Content className="staff-content">
          <div className="staff-page-content">{renderPage()}</div>
          <Footer />
        </Content>
      </Layout>
      {compact && !sidebarCollapsed && (
        <button className="staff-mobile-scrim" aria-label="Close navigation" onClick={() => setSidebarCollapsed(true)} />
      )}
    </Layout>
  );
};

export default StaffDashboard;
