import React, { useState, useEffect } from "react";

import "./Sidebar.css";

import {

  Layout,

  Menu,

  Modal,

  Button,

  Badge,

  Typography,

  Tooltip,

} from "antd";

import {

  HomeOutlined,

  

  BarChartOutlined,

  UserOutlined,

  UsersOutlined,

  KeyOutlined,



  CarOutlined,

  FileDoneOutlined,

  PieChartOutlined,

  LogoutOutlined,

  AppstoreOutlined,

  SettingOutlined,

  ApartmentOutlined,



  SwapOutlined,

  FileSearchOutlined,

  MenuOutlined,

  CloseOutlined,

  DollarOutlined,

  

  UserAddOutlined,

  CreditCardOutlined,

  RiseOutlined,

  FileTextOutlined,

  ShopOutlined,

  LineChartOutlined,

  ShoppingOutlined,

  CalendarOutlined,

  DollarCircleOutlined,

  TeamOutlined,

  

} from "@ant-design/icons";

import api from "../Api";



const { Sider } = Layout;

const { Title } = Typography;



const Sidebar = ({ isCollapsed, setIsCollapsed, onMenuClick, activeView }) => {

  const [logoutModal, setLogoutModal] = useState(false);

  const [openMenus, setOpenMenus] = useState([]);

  const [selectedKey, setSelectedKey] = useState(activeView || 'dashboard');

  const [profileCounts, setProfileCounts] = useState({

    vendor: 0,

    mainCollector: 0,

    incharge: 0,

    meatInspector: 0,

  });



  const primaryColor = "#2563eb";
  const backgroundColor = "#f8fafc";
  const cardBackground = "#ffffff";
  const textPrimary = "#0f172a";
  const textSecondary = "#64748b";
  const borderLight = "#e2e8f0";
  const hoverBackground = "#f1f5f9";
  const selectedBackground = "#dbeafe";
  const selectedColor = "#2563eb";





  useEffect(() => {

    api

      .get("/sidebar-data")

      .then((res) => {

        setProfileCounts({

          vendor: res.data.vendorCount,

          mainCollector: res.data.mainCollectorCount,

          incharge: res.data.inchargeCount,

          meatInspector: res.data.meatInspectorCount,

        });

      })

      .catch((err) => console.error(err));

  }, []);

  useEffect(() => {
    if (activeView) {
      setSelectedKey(activeView);
    }
  }, [activeView]);



  const handleLogout = async () => {

    try {

      await api.post("/logout");

      localStorage.removeItem("authToken");

      window.location.href = "/";

    } catch (error) {

      console.error(error);

    }

  };



  const handleOpenChange = (keys) => {

    const latestOpenKey = keys.find((key) => !openMenus.includes(key));

    setOpenMenus(latestOpenKey ? [latestOpenKey] : []);

  };



  const menuItems = [

    {

      key: "dashboard",

      icon: <HomeOutlined />,

      label: "Dashboard",

    }, 
 { key: "product-management", label: "Product Management", icon: <ShoppingOutlined /> },

    {

      key: "market",

      icon: <ShopOutlined />,

      label: "Market",

      children: [

        { key: "vendor-management", label: "Vendor Management", icon: <UserOutlined /> },

       
        { key: "cash-ticket", label: "Cash Ticket Payments", icon: <CreditCardOutlined /> },

        { key: "vendor-payment-calendar", label: "Payment Schedule", icon: <CalendarOutlined /> },

        { key: "market-section-stalls", label: "Market Layout Management", icon: <AppstoreOutlined /> },

        { key: "stall-rate-dashboard", label: "Stall Rates", icon: <RiseOutlined /> },

        { key: "vendor-payment", label: "Payment Settlement", icon: <FileTextOutlined /> },

        { key: "payment-management", label: "Payment Management", icon: <DollarOutlined /> },


      ],

    },

    {

      key: "reports",

      icon: <FileSearchOutlined />,

      label: "Reports",

      children: [

        { key: "target", label: "Targets Report", icon: <LineChartOutlined /> },

        { key: "remaining-balance", label: "Vendor Balances", icon: <BarChartOutlined /> },

        { key: "rental-report", label: "Rental Report", icon: <ShopOutlined /> },
       
        { key: "estimated_collection", label: "Estimates Collection", icon: <LineChartOutlined /> },

        { key: "market-open-space-collections", label: "Collections", icon: <ApartmentOutlined /> },

      

      ],

    },

    {
      key: "events",
      icon: <CalendarOutlined />,
      label: "Event Management",
      children: [
        { key: "event-activities", label: "Activities", icon: <CalendarOutlined /> },
        { key: "event-stalls", label: "Event Stalls", icon: <ShopOutlined /> },
        { key: "event-vendors", label: "Event Vendors", icon: <TeamOutlined /> },
        { key: "event-payments", label: "Event Payments", icon: <DollarCircleOutlined /> },
        { key: "event-sales-reports", label: "Sales Reports", icon: <BarChartOutlined /> },
      ],
    },

  ];



  const renderMenuItems = (items) =>
    items.map((item) => {
      if (item.children) {
        return {
          key: item.key,
          icon: item.icon,
          label: (
            <span className="sidebar-label-multiline">
              {item.label}
            </span>
          ),
          children: renderMenuItems(item.children),
        };
      }
      return {
        key: item.key,
        icon: item.icon,
        label: (
          <span className="sidebar-label-multiline">
            {item.label}
          </span>
        ),
        onClick: () => {
          setSelectedKey(item.key);
          onMenuClick(item.key);
        },
      };
    });



  return (
    <>
      <Sider
        width={280}
        collapsedWidth={80}
        collapsed={isCollapsed}
        style={{
          background: cardBackground,
          borderRight: `1px solid ${borderLight}`,
          transition: "all 0.2s ease",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 10,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* --- Header with Burger --- */}
        <div
          style={{
            padding: "8px 16px", /* Reduced padding for the top section */
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            height: "64px",
          }}
        >
          {!isCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
              <img
                src="/logo_Opol.png"
                alt="logo"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  objectFit: "cover",
                }}
              />
              <Title 
                level={5} 
                style={{
                  color: textPrimary,
                  fontSize: 14,
                  fontWeight: 600,
                  margin: 0,
                  letterSpacing: "0.5px",
                }}
              >
                ADMIN PANEL
              </Title>
            </div>
          )}
          <Tooltip title={isCollapsed ? "Expand Menu" : "Collapse Menu"} placement="right">
            <Button
              type="text"
              icon={isCollapsed ? <MenuOutlined /> : <CloseOutlined />}
              onClick={() => setIsCollapsed((prev) => !prev)}
              style={{
                color: textSecondary,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                borderRadius: 6,
                width: 32,
                height: 32,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hoverBackground;
                e.currentTarget.style.color = textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = textSecondary;
              }}
            />
          </Tooltip>
        </div>

        {/* --- Menu --- */}
        <div 
          style={{
            padding: "8px 16px", /* Reduce padding from 16px to 8px */
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Menu
            mode="inline"
            theme="light"
            selectedKeys={[selectedKey]}
            openKeys={isCollapsed ? [] : openMenus}
            onOpenChange={handleOpenChange}
            items={renderMenuItems(menuItems)}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
            }}
            className="sidebar-menu"
          />
        </div>

        {/* --- Logout --- */}
        <div 
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "16px 20px",
            borderTop: `1px solid ${borderLight}`,
          }}
        >
          <Tooltip title={isCollapsed ? "Logout" : ""} placement="right">
            <Button
              type="primary"
              danger
              icon={<LogoutOutlined />}
              block
              onClick={() => setLogoutModal(true)}
              style={{
                background: "#ef4444",
                border: "none",
                color: "white",
                borderRadius: 8,
                fontWeight: 500,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#dc2626";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ef4444";
              }}
            >
              {!isCollapsed && "Logout"}
            </Button>
          </Tooltip>
        </div>
      </Sider>

      {/* --- Logout Modal --- */}
      <Modal
        title="Confirm Logout"
        open={logoutModal}
        onOk={handleLogout}
        onCancel={() => setLogoutModal(false)}
        okText="Yes, Logout"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to logout?</p>
      </Modal>

      {/* --- Additional CSS for hover/selected menu items --- */}
      <style>
        {`
          /* Highlight submenu items with same color as dashboard */
          .sidebar-menu .ant-menu-sub .ant-menu-item-selected {
            background-color: ${selectedBackground} !important;
            color: ${selectedColor} !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            border-left: 3px solid ${selectedColor} !important;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1) !important;
          }
          
          .sidebar-menu .ant-menu-sub .ant-menu-item.ant-menu-item-selected {
            background-color: ${selectedBackground} !important;
            color: ${selectedColor} !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            border-left: 3px solid ${selectedColor} !important;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1) !important;
          }
          
          .ant-menu-light .ant-menu-sub .ant-menu-item-selected {
            background-color: ${selectedBackground} !important;
            color: ${selectedColor} !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            border-left: 3px solid ${selectedColor} !important;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1) !important;
          }
          
          .ant-menu-light .ant-menu-sub .ant-menu-item.ant-menu-item-selected {
            background-color: ${selectedBackground} !important;
            color: ${selectedColor} !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            border-left: 3px solid ${selectedColor} !important;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1) !important;
          }
          
          /* Most specific selector for submenu children */
          .sidebar-menu.ant-menu-light .ant-menu-sub .ant-menu-item-selected {
            background-color: ${selectedBackground} !important;
            color: ${selectedColor} !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            border-left: 3px solid ${selectedColor} !important;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1) !important;
          }
          
          .sidebar-menu .ant-menu-sub .ant-menu-item-selected:hover {
            background-color: ${selectedBackground} !important;
            color: ${selectedColor} !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            border-left: 3px solid ${selectedColor} !important;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1) !important;
          }
          
          /* Highlight dashboard menu item */
          .sidebar-menu .ant-menu-item-selected[data-menu-id*="dashboard"],
          .sidebar-menu .ant-menu-item-selected:not(.ant-menu-sub .ant-menu-item) {
            background-color: ${selectedBackground} !important;
            color: ${selectedColor} !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            border-left: 3px solid ${selectedColor} !important;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1) !important;
          }
          
          /* Specific dashboard highlighting */
          .sidebar-menu .ant-menu-item-selected[key="dashboard"] {
            background-color: ${selectedBackground} !important;
            color: ${selectedColor} !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            border-left: 3px solid ${selectedColor} !important;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1) !important;
          }
          
          .sidebar-menu .ant-menu-item:hover {
            background-color: ${hoverBackground} !important;
            color: ${textPrimary} !important;
            border-radius: 8px !important;
          }
          
          .ant-menu-light .ant-menu-submenu-title:hover {
            background-color: ${hoverBackground} !important;
            color: ${textPrimary} !important;
            border-radius: 8px !important;
          }
          
          .ant-menu-light .ant-menu-submenu-open > .ant-menu-submenu-title {
            background-color: transparent !important;
            color: ${textSecondary} !important;
            border-radius: 8px !important;
            font-weight: 400 !important;
          }
          
          .ant-menu-light .ant-menu-submenu-open.ant-menu-submenu-selected > .ant-menu-submenu-title {
            background-color: transparent !important;
            color: ${textSecondary} !important;
            border-radius: 8px !important;
            font-weight: 400 !important;
          }
          
          .sidebar-menu .ant-menu-item {
            color: ${textSecondary} !important;
            border-radius: 8px !important;
            margin: 2px 0 !important;
            padding: 10px 16px !important;
            height: auto !important;
            line-height: 1.4 !important;
            transition: all 0.2s ease !important;
            border: none !important;
            white-space: normal !important;
            min-height: 40px !important;
            display: flex !important;
            align-items: center !important;
            position: relative !important;
          }
          
          /* Force multiline labels with specific width */
          .sidebar-menu .ant-menu-item .sidebar-label-multiline,
          .sidebar-menu .ant-menu-submenu-title .sidebar-label-multiline {
            display: block !important;
            white-space: normal !important;
            word-wrap: break-word !important;
            word-break: break-word !important;
            width: 180px !important;
            max-width: 180px !important;
            line-height: 1.3 !important;
            overflow: hidden !important;
            text-align: left !important;
          }
          
          .sidebar-label-multiline {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            line-height: 1.2 !important;
            text-align: left !important;
            word-wrap: break-word !important;
            word-break: break-word !important;
            white-space: normal !important;
            max-width: 200px !important;
            overflow: visible !important;
            text-overflow: clip !important;
          }
          
          .ant-menu-light .ant-menu-submenu-title {
            color: ${textSecondary} !important;
            border-radius: 8px !important;
            margin: 2px 0 !important;
            padding: 10px 16px !important;
            height: auto !important;
            line-height: 1.4 !important;
            transition: all 0.2s ease !important;
            border: none !important;
            white-space: normal !important;
            min-height: 40px !important;
            display: flex !important;
            align-items: center !important;
            position: relative !important;
          }
          
          .ant-menu-light .ant-menu-sub {
            background: transparent !important;
            border-radius: 6px !important;
            margin: 4px 0 0 0 !important;
            padding: 8px !important;
            border: none !important;
          }
          
          .sidebar-menu .ant-menu-sub .ant-menu-item {
            padding: 8px 12px !important;
            margin: 2px 0 !important;
            font-size: 13px !important;
            border-radius: 6px !important;
            white-space: normal !important;
            min-height: 36px !important;
            height: auto !important;
            display: flex !important;
            align-items: center !important;
            position: relative !important;
          }
          
          .sidebar-menu .ant-menu-sub .ant-menu-item:hover {
            background-color: ${hoverBackground} !important;
          }
          
          /* Override Ant Design Menu default spacing in collapsed state */
          .ant-layout-sider-collapsed .sidebar-menu.ant-menu {
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .ant-layout-sider-collapsed .sidebar-menu .ant-menu-item {
            padding: 6px 0 !important; /* Even more reduced padding */
            margin: 0 !important; /* Remove all margin */
            justify-content: center !important;
            text-align: center !important;
            min-height: 32px !important; /* Further reduce minimum height */
            height: 32px !important; /* Set fixed height */
            display: flex !important;
            align-items: center !important;
            flex-direction: column !important;
          }
          
          .ant-layout-sider-collapsed .sidebar-menu .ant-menu-sub .ant-menu-item-selected {
            background-color: ${selectedBackground} !important;
            color: ${selectedColor} !important;
            border-radius: 8px !important;
            border-left: 3px solid ${selectedColor} !important;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1) !important;
          }
          
          .ant-layout-sider-collapsed .sidebar-menu .ant-menu-sub .ant-menu-item.ant-menu-item-selected {
            background-color: ${selectedBackground} !important;
            color: ${selectedColor} !important;
            border-radius: 8px !important;
            border-left: 3px solid ${selectedColor} !important;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1) !important;
          }
          
          .ant-layout-sider-collapsed .ant-menu-item-icon {
            margin-right: 0 !important;
            font-size: 18px !important;
          }
          
          .ant-layout-sider-collapsed .ant-menu-submenu-title {
            padding: 6px 0 !important; /* Match menu item spacing */
            justify-content: center !important;
            text-align: center !important;
            margin: 0 !important; /* Remove all margin */
            min-height: 32px !important; /* Match menu item height */
            height: 32px !important; /* Set fixed height */
            display: flex !important;
            align-items: center !important;
            flex-direction: column !important;
          }
          
          .ant-layout-sider-collapsed .ant-menu-submenu-title .ant-menu-item-icon {
            margin-right: 0 !important;
          }
          
          .ant-layout-sider-collapsed .ant-menu-sub {
            display: none;
          }
        `}
      </style>
    </>
  );

};



export default Sidebar;

