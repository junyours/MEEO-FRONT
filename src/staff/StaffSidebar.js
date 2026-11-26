import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppstoreOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  DollarCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  FileSearchOutlined,
  HistoryOutlined,
  HomeOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  QrcodeOutlined,
  ShopOutlined,
  ShoppingOutlined,BarChartOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Layout, Menu as AntMenu, Modal, Tooltip, Typography, message } from "antd";
import { Beef } from "lucide-react";
import api from "../Api";
import "./StaffSidebar.css";

const { Sider } = Layout;
const { Title } = Typography;

const menuItems = [
  {
    type: "group",
    key: "workspace",
    label: <span className="staff-sidebar-group-label">OPERATIONS</span>,
    children: [
      { key: "dashboard", icon: <HomeOutlined />, label: "Dashboard" },
         { key: "daily-collections", label: "Daily Collection Overview", icon: <DollarOutlined /> },
      { key: "office-activities", icon: <HistoryOutlined />, label: "Office Activities" },
      { key: "product-management", icon: <ShoppingOutlined />, label: "Product Management" },
          { key: "animal-management", icon: <Beef size={16} strokeWidth={1.8} />, label: "Animal Catalog" },
    ],
  },
  {
    key: "market",
    icon: <ShopOutlined />,
    label: "Market",
    children: [
      { key: "vendor-qr-codes", icon: <QrcodeOutlined />, label: "Vendor QR Codes" },
      { key: "vendor-management", icon: <UserOutlined />, label: "Vendor Management" },
      { key: "market-section-stalls", icon: <AppstoreOutlined />, label: "Market Layout Management" },
      { key: "stall-rate-changes", icon: <HistoryOutlined />, label: "Stall Rate Change History" },
        { key: "remaining-balance", label: "Vendor Balances", icon: <BarChartOutlined /> },
       
    ],
  },
  {
    key: "payments",
    icon: <DollarCircleOutlined />,
    label: "Payments",
    children: [
      { key: "cash-ticket", icon: <CreditCardOutlined />, label: "Cash Ticket Payments" },
      { key: "vendor-payment-calendar", icon: <CalendarOutlined />, label: "Payment Schedule" },
      { key: "vendor-payment", icon: <TeamOutlined />, label: "Payment Settlement" },
      { key: "vendor-other-payments", icon: <FileTextOutlined />, label: "Other Payments & Sales" },
      { key: "payment-management", icon: <DollarOutlined />, label: "Payment Management" },
  
      { key: "slaughter-collections", icon: <MedicineBoxOutlined />, label: "Slaughter Collections" },
    ],
  },
  {
    key: "events",
    icon: <CalendarOutlined />,
    label: "Event Management",
    children: [
      { key: "event-activities", icon: <CalendarOutlined />, label: "Activities" },
      { key: "event-stalls", icon: <ShopOutlined />, label: "Event Stalls" },
      { key: "event-vendors", icon: <TeamOutlined />, label: "Event Vendors" },
      { key: "event-payments", icon: <DollarCircleOutlined />, label: "Event Payments" },
    ],
  },
  {
    key: "reports",
    icon: <BarChartOutlined />,
    label: "Reports",
    children: [
      { key: "vendor-other-payment-report", icon: <FileSearchOutlined />, label: "Vendor Payment Status" },
      { key: "walk-in-driver-payment-report", icon: <FileSearchOutlined />, label: "Walk-in & Driver Payment Report" },
    ],
  },
];

const collapsedMenuItems = menuItems.flatMap((item) =>
  item.type === "group" ? item.children : [item]
);

const StaffSidebar = ({ activeView, collapsed, onCollapse, onNavigate }) => {
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const activeGroup = menuItems.find((item) => item.children?.some((child) => child.key === activeView));
    if (activeGroup && !collapsed) setOpenKeys([activeGroup.key]);
  }, [activeView, collapsed]);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await api.post("/logout");
      ["authToken", "userRole", "userId", "collectorId"].forEach((key) => localStorage.removeItem(key));
      setLogoutOpen(false);
      navigate("/login", { replace: true });
    } catch (error) {
      messageApi.error(error.response?.data?.message || "Unable to log out. Please try again.");
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleOpenChange = (keys) => {
    const newlyOpenedKey = keys.find((key) => !openKeys.includes(key));
    setOpenKeys(newlyOpenedKey ? [newlyOpenedKey] : []);
  };

  const handleNavigate = (key) => {
    onNavigate(key);
    if (window.innerWidth < 768) onCollapse(true);
  };

  const renderIcon = (item) => item.icon
    ? React.cloneElement(item.icon, {
      className: `staff-nav-icon staff-nav-icon-${item.key}`,
    })
    : undefined;

  const renderItems = (items) => items.map((item) => {
    if (item.type === "group") {
      return {
        ...item,
        label: <span className="staff-sidebar-group-label">{item.label}</span>,
        children: renderItems(item.children),
      };
    }

    return {
      ...item,
      title: collapsed ? item.label : undefined,
      label: (
        <span className={`staff-nav-label staff-nav-label-${item.key}`}>
          {item.label}
        </span>
      ),
      icon: item.icon
        ? React.cloneElement(item.icon, {
          className: `staff-nav-icon staff-nav-icon-${item.key}`,
        })
        : undefined,
      onClick: item.children
        ? undefined
        : () => {
          onNavigate(item.key);
          if (window.innerWidth < 768) onCollapse(true);
        },
      children: item.children ? renderItems(item.children) : undefined,
    };
  });

  return (
    <>
      {contextHolder}
      <Sider
        className="staff-sidebar"
        width={272}
        collapsedWidth={window.innerWidth < 768 ? 0 : 78}
        collapsed={collapsed}
        trigger={null}
        theme="light"
      >
        <div className="staff-sidebar-brand">
          <img src="/logo_meeo.png" alt="MEEO" />
          {!collapsed && (
            <div className="staff-sidebar-brand-copy">
              <Title level={5}>Municipal Economic Enterprise Office</Title>
              <span>Opol LGU · CY 2026</span>
            </div>
          )}
        </div>

        <div className="staff-sidebar-nav">
          {collapsed ? (
            <nav className="staff-sidebar-compact-nav" aria-label="Staff navigation">
              {collapsedMenuItems.map((item) => {
                const isActive = item.key === activeView
                  || item.children?.some((child) => child.key === activeView);
                const icon = renderIcon(item);

                if (item.children) {
                  return (
                    <Dropdown
                      key={item.key}
                      placement="rightTop"
                      trigger={["click"]}
                      menu={{
                        className: "staff-sidebar-flyout",
                        items: item.children.map((child) => ({
                          key: child.key,
                          icon: renderIcon(child),
                          label: (
                            <span className={`staff-nav-label staff-nav-label-${child.key}`}>
                              {child.label}
                            </span>
                          ),
                        })),
                        onClick: ({ key }) => handleNavigate(key),
                      }}
                    >
                      <Tooltip title={item.label} placement="right">
                        <button
                          type="button"
                          className={`staff-sidebar-compact-item${isActive ? " is-active" : ""}`}
                          aria-label={item.label}
                        >
                          {icon}
                        </button>
                      </Tooltip>
                    </Dropdown>
                  );
                }

                return (
                  <Tooltip key={item.key} title={item.label} placement="right">
                    <button
                      type="button"
                      className={`staff-sidebar-compact-item${isActive ? " is-active" : ""}`}
                      onClick={() => handleNavigate(item.key)}
                      aria-label={item.label}
                    >
                      {icon}
                    </button>
                  </Tooltip>
                );
              })}
            </nav>
          ) : (
            <AntMenu
              mode="inline"
              selectedKeys={[activeView]}
              openKeys={openKeys}
              onOpenChange={handleOpenChange}
              items={renderItems(menuItems)}
            />
          )}
        </div>

        <div className="staff-sidebar-bottom">
          <Tooltip title={collapsed ? "Sign out" : ""} placement="right">
            <Button
              className="staff-sidebar-logout"
              icon={<LogoutOutlined />}
              onClick={() => setLogoutOpen(true)}
              block
              aria-label="Sign out"
            >
              {!collapsed && "Sign out"}
            </Button>
          </Tooltip>
        </div>
      </Sider>

      <Modal
        title="Sign out"
        open={logoutOpen}
        okText="Sign out"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        confirmLoading={logoutLoading}
        closable={!logoutLoading}
        maskClosable={!logoutLoading}
        onOk={handleLogout}
        onCancel={() => {
          if (!logoutLoading) setLogoutOpen(false);
        }}
      >
        <p>Are you sure you want to sign out of your account?</p>
      </Modal>
    </>
  );
};

export default StaffSidebar;
