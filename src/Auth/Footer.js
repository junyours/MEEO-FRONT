import React from "react";
import { Layout, Row, Col, Typography, Space } from "antd";
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  BankOutlined,
  FacebookOutlined,
  GlobalOutlined,
  HeartOutlined
} from "@ant-design/icons";
import "./Footer.css";

const { Footer: AntFooter } = Layout;
const { Text, Title, Link } = Typography;

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <AntFooter className="auth-footer">
      <div className="auth-footer-container">
        <Row gutter={[32, 32]} align="top">
          {/* BRAND COLUMN */}
          <Col xs={24} md={12} lg={8}>
            <div className="auth-footer-brand">
              <div className="auth-footer-logo">
                <BankOutlined />
                <Title level={4} className="auth-footer-title">
                  MEEO System
                </Title>
              </div>
              <Text className="auth-footer-description">
                Municipal Economic Enterprise Office management platform for efficient public service delivery.
              </Text>
            </div>
          </Col>

          {/* CONTACT COLUMN */}
          <Col xs={24} md={12} lg={8}>
            <Title level={5} className="auth-footer-heading">
              Contact Information
            </Title>
            <div className="auth-footer-contact">
              <div className="auth-contact-item">
                <EnvironmentOutlined className="auth-contact-icon" />
                <div>
                  <Text className="auth-contact-text">Municipal Economic Enterprise Office</Text>
                  <Text className="auth-contact-subtext">Poblacion, Opol, Misamis Oriental</Text>
                </div>
              </div>
              
              <div className="auth-contact-item">
                <PhoneOutlined className="auth-contact-icon" />
                <div>
                  <Link href="tel:09525663771" className="auth-contact-link">
                    0952 566 3771
                  </Link>
                  <Text className="auth-contact-subtext">Mon-Fri: 8:00 AM - 5:00 PM</Text>
                </div>
              </div>
              
              <div className="auth-contact-item">
                <MailOutlined className="auth-contact-icon" />
                <div>
                  <Link href="mailto:lguopolmeeo@gmail.com" className="auth-contact-link">
                    lguopolmeeo@gmail.com
                  </Link>
                  <Text className="auth-contact-subtext">24/7 Support Available</Text>
                </div>
              </div>
            </div>
          </Col>

          {/* QUICK LINKS COLUMN */}
          <Col xs={24} md={12} lg={8}>
            <Title level={5} className="auth-footer-heading">
              Quick Links
            </Title>
            <div className="auth-footer-links">
              <div className="auth-links-section">
                <Link href="/admin/dashboard" className="auth-footer-link">Admin Dashboard</Link>
                <Link href="/vendor/dashboard" className="auth-footer-link">Vendor Portal</Link>
                <Link href="/collections" className="auth-footer-link">Fund Collection</Link>
                <Link href="/stalls" className="auth-footer-link">Stall Management</Link>
                <Link href="/support" className="auth-footer-link">Support Center</Link>
              </div>
            </div>
          </Col>
        </Row>

        {/* FOOTER BOTTOM */}
        <div className="auth-footer-bottom">
          <Row justify="space-between" align="middle">
            <Col xs={24} md={12}>
              <div className="auth-footer-branding">
                <GlobalOutlined />
                <Text className="auth-copyright-text">
                  © {currentYear} MEEO System. All rights reserved.
                </Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="auth-footer-social">
                <a
                  href="https://www.facebook.com/profile.php?id=61560479091650"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="auth-social-icon"
                  aria-label="Facebook"
                >
                  <FacebookOutlined />
                </a>
              </div>
            </Col>
          </Row>
          
          <div className="auth-footer-credits">
            <Text className="auth-credits-text">
              <HeartOutlined className="auth-heart-icon" />{" "}
              Created by{" "}
              <Link href="https://www.facebook.com/ronnie1016" target="_blank" rel="noreferrer" className="auth-developer-link">
                Ronnie Flores
              </Link>
              {", "}
              <Link href="https://www.facebook.com/izheykhedoq420" target="_blank" rel="noreferrer" className="auth-developer-link">
                Jon Brey Lastimosa
              </Link>
              {", "}
              <Link href="https://www.facebook.com/profile.php?id=61583017889860" target="_blank" rel="noreferrer" className="auth-developer-link">
                Nathaniel Aba
              </Link>
              {" & "}
              <Link href="https://www.facebook.com/dean.franncis.quimanhan" target="_blank" rel="noreferrer" className="auth-developer-link">
                Dean Francis Quimanhan
              </Link>
            </Text>
          </div>
        </div>
      </div>
    </AntFooter>
  );
};

export default Footer;
