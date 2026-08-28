import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import meeoLogo from "../assets/logo_meeo.png";
import "./EnterpriseNavbar.css";

const navigationItems = [
  { label: "MEEO", path: "/", tone: "meeo" },
  { label: "Market", path: "/market", tone: "market" },
  { label: "Wharf", path: "/wharf", tone: "wharf" },
  { label: "Slaughter", path: "/slaughter", tone: "slaughter" },
];

const EnterpriseNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="enterprise-navbar" aria-label="Economic enterprises">
      <div className="enterprise-navbar-brand">
        <img className="enterprise-navbar-logo" src={meeoLogo} alt="MEEO Opol logo" />
        <div className="enterprise-navbar-brand-copy">
          <strong>MEEO OPOL</strong>
          <span>Municipal Economic Enterprise Office</span>
        </div>
      </div>

      <div className="enterprise-navbar-links">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <button
              className={`enterprise-navbar-link enterprise-navbar-link-${item.tone}${isActive ? " enterprise-navbar-link-active" : ""}`}
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default EnterpriseNavbar;
