import React, { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Menu, Card, Row, Col, Statistic, Spin, Button, Drawer, Badge, Progress } from "antd";
import { 
  ShopOutlined, 
  BankOutlined, 
  MobileOutlined, 
  DownloadOutlined, 
  MenuOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  AppleOutlined,
  CoffeeOutlined,
  GiftOutlined,
  HomeOutlined,

  FieldTimeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from "@ant-design/icons";

import api from "../Api";
import Footer from "../Auth/Footer";
import AvailableProducts from "../Auth/AvailableProducts";
import AboutSection from "../Auth/AboutSection";
import bg from "../assets/bg.jpg";
import logo from "../assets/logo_meeo.png";





const Homepage = () => {
  const [active, setActive] = useState("home");
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false); // For mobile menu
  const [displaySectionType, setDisplaySectionType] = useState('main'); // 'main', 'market', 'open_space'

  const handleBackToMain = () => {
    setDisplaySectionType('main');
  };

  // Filter sections by area type
  const getMarketSections = () => {
    return sections.filter(section => 
      section.area && (section.area.name.toLowerCase() === 'dry' || section.area.name.toLowerCase() === 'wet')
    );
  };

  const getOpenSpaceSections = () => {
    return sections.filter(section => 
      section.area && section.area.name.toLowerCase() === 'open space'
    );
  };

  // Process sections data to categorize by area
  const processSectionsData = () => {
    if (!sections || sections.length === 0) return { market: { total: 0, available: 0, occupied: 0 }, openSpace: { total: 0, available: 0, occupied: 0 } };
    
    const marketSections = sections.filter(section => 
      section.area && (section.area.name.toLowerCase() === 'dry' || section.area.name.toLowerCase() === 'wet')
    );
    
    const openSpaceSections = sections.filter(section => 
      section.area && section.area.name.toLowerCase() === 'open space'
    );
    
    const marketStats = marketSections.reduce(
      (acc, section) => ({
        total: acc.total + (section.total_stalls || 0),
        available: acc.available + (section.available_stalls_count || 0),
        occupied: acc.occupied + (section.occupied_stalls_count || 0)
      }),
      { total: 0, available: 0, occupied: 0 }
    );
    
    const openSpaceStats = openSpaceSections.reduce(
      (acc, section) => ({
        total: acc.total + (section.total_stalls || 0),
        available: acc.available + (section.available_stalls_count || 0),
        occupied: acc.occupied + (section.occupied_stalls_count || 0)
      }),
      { total: 0, available: 0, occupied: 0 }
    );
    
    return { market: marketStats, openSpace: openSpaceStats };
  };
  
  const { market, openSpace } = processSectionsData();

  useEffect(() => {
    api
      .get("/sections/available-stalls")
      .then((res) => {
        console.log('API Response:', res); // Debug log
        setSections(res.data.data || res.data || []); // Handle nested data structure
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const styles = {
    page: { 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    heroWrapper: { 
      position: "relative", 
      minHeight: "100vh", 
      background: `url(${bg}) center/cover no-repeat`,
      backgroundAttachment: "fixed"
    },
    overlay: { 
      position: "absolute", 
      inset: 0, 
      background: "linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)", 
      backdropFilter: "blur(8px)", 
      zIndex: 1 
    },
    navbar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 40px",
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
      position: "sticky",
      top: 0,
      zIndex: 1000,
      transition: "all 0.3s ease"
    },
    brand: {
      display: "flex",
      alignItems: "center",
      fontSize: "24px",
      fontWeight: 900,
      color: "#2c3e50",
      letterSpacing: "0.5px",
      textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
    },
    menuDesktop: {
      display: "flex",
      gap: "8px",
      alignItems: "center"
    },
    menuItem: {
      padding: "12px 20px",
      borderRadius: "12px",
      fontWeight: 600,
      color: "#495057",
      cursor: "pointer",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      fontSize: "15px",
      letterSpacing: "0.2px",
      border: "2px solid transparent"
    },
    menuItemHover: {
      background: "linear-gradient(135deg, #667eea, #764ba2)",
      color: "#fff",
      transform: "translateY(-2px)",
      boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
      border: "2px solid rgba(102, 126, 234, 0.3)"
    },
    menuMobileIcon: {
      fontSize: "28px",
      color: "#495057",
      cursor: "pointer",
      padding: "8px",
      borderRadius: "8px",
      transition: "all 0.3s ease"
    },
    hero: { 
      position: "relative", 
      zIndex: 2, 
      minHeight: "calc(100vh - 140px)", 
      display: "flex", 
      flexDirection: "column", 
      justifyContent: "center", 
      alignItems: "center", 
      textAlign: "center", 
      padding: "60px 20px", 
      color: "#fff" 
    },
    heroTitle: { 
      fontSize: "clamp(42px, 8vw, 72px)", 
      fontWeight: 900, 
      marginBottom: 24, 
      textShadow: "0 4px 12px rgba(0,0,0,0.8)",
      letterSpacing: "2px",
      lineHeight: 1.2
    },
    heroSubtitle: { 
      fontSize: "clamp(18px, 4vw, 24px)", 
      maxWidth: 800, 
      lineHeight: 1.8, 
      opacity: 0.95,
      textShadow: "0 2px 8px rgba(0,0,0,0.6)",
      marginBottom: 40
    },
    // Enhanced stall monitoring styles
    stallMonitoringWrapper: {
      padding: "60px 20px",
      background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
      position: "relative"
    },
    stallCard: {
      borderRadius: "24px",
      overflow: "hidden",
      boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      height: "100%",
      background: "#ffffff",
      border: "1px solid rgba(0,0,0,0.05)",
      position: "relative"
    },
    stallCardHover: {
      transform: "translateY(-12px) scale(1.02)",
      boxShadow: "0 30px 80px rgba(0,0,0,0.25)"
    },
    marketCardHeader: {
      background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
      padding: "clamp(20px, 5vw, 32px)",
      textAlign: "center",
      position: "relative",
      overflow: "hidden"
    },
    openSpaceCardHeader: {
      background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      padding: "clamp(20px, 5vw, 32px)",
      textAlign: "center",
      position: "relative",
      overflow: "hidden"
    },
    cardIcon: {
      fontSize: "clamp(40px, 8vw, 64px)",
      color: "#ffffff",
      marginBottom: "12px",
      filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
      transition: "all 0.3s ease"
    },
    cardTitle: {
      fontSize: "clamp(20px, 4vw, 28px)",
      fontWeight: 900,
      color: "#ffffff",
      marginBottom: "6px",
      textShadow: "0 2px 8px rgba(0,0,0,0.3)",
      letterSpacing: "0.5px"
    },
    cardSubtitle: {
      fontSize: "clamp(13px, 3vw, 16px)",
      color: "rgba(255,255,255,0.9)",
      textShadow: "0 1px 4px rgba(0,0,0,0.2)",
      fontWeight: 400
    },
    stallCardContent: {
      padding: "clamp(20px, 5vw, 32px)",
      background: "linear-gradient(135deg, #fafbfc 0%, #f8f9fa 100%)"
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
      gap: "12px",
      marginBottom: "24px"
    },
    statItem: {
      textAlign: "center",
      padding: "16px 12px",
      borderRadius: "12px",
      background: "linear-gradient(145deg, #ffffff, #f1f3f5)",
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      transition: "all 0.3s ease",
      minHeight: "90px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center"
    },
    statItemHover: {
      transform: "translateY(-4px)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)"
    },
    statNumber: {
      fontSize: "clamp(24px, 5vw, 32px)",
      fontWeight: 900,
      marginBottom: "4px",
      letterSpacing: "0.5px",
      lineHeight: 1
    },
    statLabel: {
      fontSize: "clamp(11px, 2.5vw, 14px)",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      opacity: 0.7,
      lineHeight: 1.2
    },
    progressSection: {
      marginTop: "24px"
    },
    progressTitle: {
      fontSize: "clamp(14px, 3.5vw, 16px)",
      fontWeight: 700,
      marginBottom: "12px",
      color: "#2c3e50",
      letterSpacing: "0.2px"
    },
    progressBar: {
      marginBottom: "16px"
    },
    availableStat: {
      color: "#27ae60"
    },
    occupiedStat: {
      color: "#e74c3c"
    },
    totalStat: {
      color: "#3498db"
    },
    sectionWrapper: { 
      padding: "100px 20px", 
      background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
      position: "relative"
    },
    sectionTitle: { 
      textAlign: "center", 
      fontSize: "clamp(36px, 6vw, 56px)", 
      fontWeight: 900, 
      color: "#2c3e50", 
      marginBottom: 20,
      textShadow: "0 2px 4px rgba(0,0,0,0.1)",
      background: "linear-gradient(135deg, #667eea, #764ba2)",
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      letterSpacing: "1px"
    },
    sectionDesc: { 
      textAlign: "center", 
      maxWidth: 900, 
      margin: "0 auto 60px", 
      fontSize: "clamp(16px, 3vw, 20px)", 
      color: "#5a6c7d",
      lineHeight: 1.8,
      fontWeight: 400
    },
    };

  const menuItems = [
    { key: "home", label: "Home" },
    { key: "products", label: "Available Products" },
    { key: "about", label: "About" },
    { key: "login", label: <RouterLink to="/login">Login</RouterLink> },
  ];

  return (
    <div style={styles.page}>
      {/* NAVBAR */}
      <div style={active === "home" ? styles.heroWrapper : { background: "#f4f6f9" }}>
        {active === "home" && <div style={styles.overlay}></div>}

        <div style={styles.navbar}>
          <div style={styles.brand}>
            <img src={logo} alt="logo" height={40} />
            MEEO System
          </div>

          {/* Desktop Menu */}
          <div className="desktop-menu" style={styles.menuDesktop}>
            {window.innerWidth > 768 &&
              menuItems.map((item) => (
                <div
                  key={item.key}
                  style={{ ...styles.menuItem, cursor: "pointer" }}
                  onClick={() => setActive(item.key)}
                >
                  {item.label}
                </div>
              ))}
          </div>

          {/* Mobile Hamburger */}
          {window.innerWidth <= 768 && (
            <MenuOutlined style={styles.menuMobileIcon} onClick={() => setDrawerVisible(true)} />
          )}
        </div>

        {/* Mobile Drawer */}
        <Drawer
          title="Menu"
          placement="right"
          onClose={() => setDrawerVisible(false)}
          visible={drawerVisible}
        >
          {menuItems.map((item) => (
            <div
              key={item.key}
              style={{ padding: "12px 0", fontSize: 18 }}
              onClick={() => {
                setActive(item.key);
                setDrawerVisible(false);
              }}
            >
              {item.label}
            </div>
          ))}
        </Drawer>

        {/* HERO CONTENT */}
        {active === "home" && (
          <div style={styles.hero}>
            <h1 style={styles.heroTitle}>Municipal Economic Enterprise Office</h1>
            <p style={styles.heroSubtitle}>
              A centralized platform for Economic Enterprise Revenue Collections, Stall Rental Monitoring, Vendor Management, and Automated Financial Reporting.
            </p>
          </div>
        )}
      </div>

      {/* AVAILABLE STALLS - MARKET & OPEN SPACE */}
      {active === "home" && (
        <div style={styles.stallMonitoringWrapper}>
          <h2 style={styles.sectionTitle}>Stall Availability </h2>
          <p style={styles.sectionDesc}>
            Simple and clear view of market and open space stall availability to help manage our community market better.
          </p>

          {loading ? (
            <Spin size="large" style={{ display: "block", margin: "80px auto" }} />
          ) : (
            <Row gutter={[16, 16]} justify="center" style={{ maxWidth: "1200px", margin: "0 auto" }}>
              {/* Market Card */}
              <Col xs={24} lg={12}>
                <Card
                  hoverable
                  style={{
                    ...styles.stallCard,
                    border: "none"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-12px) scale(1.02)";
                    e.currentTarget.style.boxShadow = "0 30px 80px rgba(0,0,0,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = "0 20px 60px rgba(0,0,0,0.15)";
                  }}
                >
                  <div style={styles.marketCardHeader}>
                    <HomeOutlined style={styles.cardIcon} />
                    <h3 style={styles.cardTitle}>Market Stalls</h3>
                    <p style={styles.cardSubtitle}>Wet & Dry Market Areas</p>
                  </div>
                  <div style={styles.stallCardContent}>
                    <div style={styles.statsGrid}>
                      <div 
                        style={styles.statItem}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                        }}
                      >
                        <div style={{ ...styles.statNumber, ...styles.availableStat }}>
                          {market.available}
                        </div>
                        <div style={styles.statLabel}>Available</div>
                      </div>
                      <div 
                        style={styles.statItem}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                        }}
                      >
                        <div style={{ ...styles.statNumber, ...styles.occupiedStat }}>
                          {market.occupied}
                        </div>
                        <div style={styles.statLabel}>Occupied</div>
                      </div>
                      <div 
                        style={styles.statItem}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                        }}
                      >
                        <div style={{ ...styles.statNumber, ...styles.totalStat }}>
                          {market.total}
                        </div>
                        <div style={styles.statLabel}>Total</div>
                      </div>
                    </div>
                    
                    {/* Individual Market Sections */}
                    <div style={{ marginTop: "24px" }}>
                      <h4 style={{ 
                        fontSize: "clamp(14px, 3.5vw, 16px)", 
                        fontWeight: 700, 
                        marginBottom: "16px", 
                        color: "#2c3e50",
                        textAlign: "center"
                      }}>
                        Market Sections (Wet & Dry)
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {getMarketSections().map((section) => (
                          <div
                            key={section.id}
                            style={{
                              padding: "12px",
                              borderRadius: "8px",
                              background: "linear-gradient(145deg, #ffffff, #f8f9fa)",
                              border: "1px solid #e9ecef",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              transition: "all 0.3s ease",
                              cursor: "pointer",
                              flexWrap: "wrap",
                              gap: "8px"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "translateX(4px)";
                              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                              e.currentTarget.style.background = "linear-gradient(145deg, #fff5f5, #ffe0e0)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateX(0)";
                              e.currentTarget.style.boxShadow = "none";
                              e.currentTarget.style.background = "linear-gradient(145deg, #ffffff, #f8f9fa)";
                            }}
                          >
                            <div>
                              <div style={{ 
                                fontSize: "clamp(12px, 3vw, 14px)", 
                                fontWeight: 700, 
                                color: "#2c3e50",
                                marginBottom: "2px"
                              }}>
                                {section.name}
                              </div>
                              <div style={{ 
                                fontSize: "clamp(10px, 2.5vw, 12px)", 
                                color: "#666" 
                              }}>
                                {section.area?.name} Area
                              </div>
                            </div>
                            <div style={{ 
                              display: "flex", 
                              gap: "6px",
                              fontSize: "clamp(9px, 2.5vw, 11px)",
                              fontWeight: 600,
                              flexWrap: "wrap",
                              alignItems: "center"
                            }}>
                              <span style={{ 
                                color: "#27ae60",
                                background: "rgba(39, 174, 96, 0.1)",
                                padding: "2px 6px",
                                borderRadius: "4px"
                              }}>
                                {section.available_stalls_count} available
                              </span>
                              <span style={{ 
                                color: "#e74c3c",
                                background: "rgba(231, 76, 60, 0.1)",
                                padding: "2px 6px",
                                borderRadius: "4px"
                              }}>
                                {section.occupied_stalls_count} occupied
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div style={styles.progressSection}>
                      <div style={styles.progressTitle}>Occupancy Rate</div>
                      <Progress 
                        percent={market.total > 0 ? Math.round((market.occupied / market.total) * 100) : 0}
                        strokeColor={{
                          '0%': '#ff6b35',
                          '100%': '#f7931e',
                        }}
                        trailColor="#f0f0f0"
                        strokeWidth={12}
                        style={styles.progressBar}
                        format={(percent) => `${percent}%`}
                      />
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontSize: 'clamp(11px, 3vw, 14px)',
                        color: '#666',
                        fontWeight: 600,
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        <span style={{ color: '#27ae60' }}>
                          <CheckCircleOutlined /> {market.available} Available
                        </span>
                        <span style={{ color: '#e74c3c' }}>
                          <CloseCircleOutlined /> {market.occupied} Occupied
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Open Space Card */}
              <Col xs={24} lg={12}>
                <Card
                  hoverable
                  style={{
                    ...styles.stallCard,
                    border: "none"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-12px) scale(1.02)";
                    e.currentTarget.style.boxShadow = "0 30px 80px rgba(0,0,0,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = "0 20px 60px rgba(0,0,0,0.15)";
                  }}
                >
                  <div style={styles.openSpaceCardHeader}>
                    <FieldTimeOutlined style={styles.cardIcon} />
                    <h3 style={styles.cardTitle}>Open Space</h3>
                    <p style={styles.cardSubtitle}>Outdoor Market Areas</p>
                  </div>
                  <div style={styles.stallCardContent}>
                    <div style={styles.statsGrid}>
                      <div 
                        style={styles.statItem}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                        }}
                      >
                        <div style={{ ...styles.statNumber, ...styles.availableStat }}>
                          {openSpace.available}
                        </div>
                        <div style={styles.statLabel}>Available</div>
                      </div>
                      <div 
                        style={styles.statItem}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                        }}
                      >
                        <div style={{ ...styles.statNumber, ...styles.occupiedStat }}>
                          {openSpace.occupied}
                        </div>
                        <div style={styles.statLabel}>Occupied</div>
                      </div>
                      <div 
                        style={styles.statItem}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                        }}
                      >
                        <div style={{ ...styles.statNumber, ...styles.totalStat }}>
                          {openSpace.total}
                        </div>
                        <div style={styles.statLabel}>Total</div>
                      </div>
                    </div>
                    
                    {/* Individual Open Space Sections */}
                    <div style={{ marginTop: "24px" }}>
                      <h4 style={{ 
                        fontSize: "clamp(14px, 3.5vw, 16px)", 
                        fontWeight: 700, 
                        marginBottom: "16px", 
                        color: "#2c3e50",
                        textAlign: "center"
                      }}>
                        Open Space Sections
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {getOpenSpaceSections().map((section) => (
                          <div
                            key={section.id}
                            style={{
                              padding: "12px",
                              borderRadius: "8px",
                              background: "linear-gradient(145deg, #ffffff, #f8f9fa)",
                              border: "1px solid #e9ecef",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              transition: "all 0.3s ease",
                              cursor: "pointer",
                              flexWrap: "wrap",
                              gap: "8px"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "translateX(4px)";
                              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                              e.currentTarget.style.background = "linear-gradient(145deg, #f0f8ff, #e6f3ff)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateX(0)";
                              e.currentTarget.style.boxShadow = "none";
                              e.currentTarget.style.background = "linear-gradient(145deg, #ffffff, #f8f9fa)";
                            }}
                          >
                            <div>
                              <div style={{ 
                                fontSize: "clamp(12px, 3vw, 14px)", 
                                fontWeight: 700, 
                                color: "#2c3e50",
                                marginBottom: "2px"
                              }}>
                                {section.name}
                              </div>
                              <div style={{ 
                                fontSize: "clamp(10px, 2.5vw, 12px)", 
                                color: "#666" 
                              }}>
                                {section.area?.name} Area
                              </div>
                            </div>
                            <div style={{ 
                              display: "flex", 
                              gap: "6px",
                              fontSize: "clamp(9px, 2.5vw, 11px)",
                              fontWeight: 600,
                              flexWrap: "wrap",
                              alignItems: "center"
                            }}>
                              <span style={{ 
                                color: "#27ae60",
                                background: "rgba(39, 174, 96, 0.1)",
                                padding: "2px 6px",
                                borderRadius: "4px"
                              }}>
                                {section.available_stalls_count} available
                              </span>
                              <span style={{ 
                                color: "#e74c3c",
                                background: "rgba(231, 76, 60, 0.1)",
                                padding: "2px 6px",
                                borderRadius: "4px"
                              }}>
                                {section.occupied_stalls_count} occupied
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div style={styles.progressSection}>
                      <div style={styles.progressTitle}>Occupancy Rate</div>
                      <Progress 
                        percent={openSpace.total > 0 ? Math.round((openSpace.occupied / openSpace.total) * 100) : 0}
                        strokeColor={{
                          '0%': '#4facfe',
                          '100%': '#00f2fe',
                        }}
                        trailColor="#f0f0f0"
                        strokeWidth={12}
                        style={styles.progressBar}
                        format={(percent) => `${percent}%`}
                      />
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontSize: 'clamp(11px, 3vw, 14px)',
                        color: '#666',
                        fontWeight: 600,
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        <span style={{ color: '#27ae60' }}>
                          <CheckCircleOutlined /> {openSpace.available} Available
                        </span>
                        <span style={{ color: '#e74c3c' }}>
                          <CloseCircleOutlined /> {openSpace.occupied} Occupied
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          )}
        </div>
      )}

      
      {/* PRODUCTS SECTION */}
      {active === "products" && <AvailableProducts />}

      {/* ABOUT PAGE */}
      {active === "about" && <AboutSection />}

      <Footer />
    </div>
  );
};

export default Homepage;
