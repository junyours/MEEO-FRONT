import React from "react";
import { Card } from "antd";
import { BankOutlined, InfoCircleOutlined } from "@ant-design/icons";

const AboutSection = () => {
  const styles = {
    aboutWrapper: { 
      padding: "120px 20px", 
      background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%)", 
      display: "flex", 
      flexDirection: "column", 
      gap: 60, 
      justifyContent: "center", 
      alignItems: "center",
      position: "relative",
      overflow: "hidden"
    },
    aboutCard: { 
      maxWidth: 1200, 
      width: "100%", 
      background: "linear-gradient(145deg, #ffffff, #f8f9fa)", 
      borderRadius: 20, 
      padding: "60px 50px", 
      textAlign: "center", 
      boxShadow: "0 20px 60px rgba(0,0,0,0.08), 0 0 0 1px rgba(102, 126, 234, 0.1)", 
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      border: "1px solid rgba(102, 126, 234, 0.08)",
      position: "relative",
      zIndex: 1
    },
    iconContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "20px",
      marginBottom: "30px"
    },
    aboutIcon: { 
      fontSize: "clamp(48px, 6vw, 64px)", 
      color: "#667eea", 
      filter: "drop-shadow(0 4px 12px rgba(102, 126, 234, 0.25))",
      transition: "all 0.3s ease"
    },
  
    aboutTitle: { 
      fontSize: "clamp(32px, 5vw, 48px)", 
      fontWeight: 800, 
      marginBottom: 30, 
      color: "#1a202c",
      letterSpacing: "-0.5px",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text"
    },
    aboutText: { 
      fontSize: "clamp(20px, 4vw, 28px)", 
      lineHeight: 1.8, 
      color: "#2d3748",
      marginBottom: 32,
      fontWeight: 400,
      letterSpacing: "0.2px"
    }
  };

  return (
    <div style={styles.aboutWrapper}>
      <Card style={styles.aboutCard} >
        <div style={styles.iconContainer}>
     
          <InfoCircleOutlined style={styles.aboutIcon} />
        </div>
        <h2 style={styles.aboutTitle}>About Our System</h2>
        <p style={styles.aboutText}>
          This system was developed to enhance the management and operations of our local market. It integrates stall information, vendor records, and administrative functions into a single platform, enabling more organized, efficient, and reliable market management.
          <br /><br />
          The system is designed to support transparency, fairness, and accountability in market activities. By streamlining processes for both vendors and administrators, it helps to ensures that market operations run smoothly and that all stakeholders are served effectively.
          <br /><br />
          Through this initiative, we aim to strengthen local commerce, support small vendors, and contribute to the continued growth and sustainability of our community.
        </p>
      </Card>
    </div>
  );
};

export default AboutSection;
