import React from "react";
import { Card } from "antd";
import { BankOutlined } from "@ant-design/icons";

const AboutSection = () => {
  const styles = {
    aboutWrapper: { 
      padding: "100px 20px", 
      background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)", 
      display: "flex", 
      flexDirection: "column", 
      gap: 60, 
      justifyContent: "center", 
      alignItems: "center" 
    },
    aboutCard: { 
      maxWidth: 1200, 
      width: "100%", 
      background: "linear-gradient(145deg, #ffffff, #f1f3f5)", 
      borderRadius: 24, 
      padding: "50px 40px", 
      textAlign: "center", 
      boxShadow: "0 30px 80px rgba(0,0,0,0.15)", 
      transition: "transform 0.3s, box-shadow 0.3s",
      border: "1px solid rgba(0,0,0,0.05)"
    },
    aboutIcon: { 
      fontSize: "clamp(48px, 6vw, 64px)", 
      color: "#667eea", 
      marginBottom: 24,
      filter: "drop-shadow(0 4px 8px rgba(102, 126, 234, 0.3))"
    },
    aboutTitle: { 
      fontSize: "clamp(28px, 5vw, 40px)", 
      fontWeight: 900, 
      marginBottom: 24, 
      color: "#2c3e50",
      letterSpacing: "0.5px"
    },
    aboutText: { 
      fontSize: "clamp(16px, 3vw, 20px)", 
      lineHeight: 1.8, 
      color: "#5a6c7d",
      marginBottom: 32
    }
  };

  return (
    <div style={styles.aboutWrapper}>
      <Card style={styles.aboutCard} >
        <BankOutlined style={styles.aboutIcon} />
        <h2 style={styles.aboutTitle}>About Our System</h2>
        <p style={styles.aboutText}>
          We created this system to help our community market work better for everyone. It brings together stall information, vendor details, and market management in one simple place so we can serve our community more effectively.
          <br /><br />
          Our goal is to make market operations clear and fair for all vendors and customers, supporting our local economy and helping our community thrive.
        </p>
      </Card>
    </div>
  );
};

export default AboutSection;
