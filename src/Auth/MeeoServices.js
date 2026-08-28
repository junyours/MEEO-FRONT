import React from "react";
import { TeamOutlined, EnvironmentOutlined, ClockCircleOutlined, DollarOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import "./MeeoServices.css";

const MeeoServices = ({ servicesRef }) => {
  return (
    <section className="meeo-services-section" ref={servicesRef} aria-labelledby="meeo-services-heading">
        <div className="meeo-services-header">
          <div>
            <div className="meeo-services-title">
              <SafetyCertificateOutlined />
             MARKET SERVICES
            </div>
            <h2 id="meeo-services-heading">Pay Toilets Facilities</h2>
            <p>Clean and accessible restroom facilities for market consumers, visitors and vendors</p>
          </div>
        </div>

        <div className="meeo-services-content">
          <div className="meeo-services-intro">
            <div className="meeo-services-intro-icon">
              <TeamOutlined />
            </div>
            <div>
              <h3>Public Restroom Facilities</h3>
              <p>The MEEO Office maintains two comfort rooms within the market premises to ensure clean and accessible restroom facilities for all market consumers,visitors and vendors.</p>
            </div>
          </div>

          <div className="meeo-services-grid">
            <div className="meeo-service-card">
              <div className="meeo-service-card-icon">
                <TeamOutlined />
              </div>
              <h4>Comfort Room 1</h4>
              <p>Located near the Ukay-Ukayan, accessible to all consumers, visitors and vendors</p>
              <div className="meeo-service-details">
                <div className="meeo-service-detail">
                  <EnvironmentOutlined />
                  <span>Next To The Ukay-Ukayan</span>
                </div>
                <div className="meeo-service-detail">
                  <ClockCircleOutlined />
                  <span>5:00 AM - 10:00 PM</span>
                </div>
              </div>
            </div>

            <div className="meeo-service-card">
              <div className="meeo-service-card-icon">
                <TeamOutlined />
              </div>
              <h4>Comfort Room 2</h4>
              <p>Located near the fire station, easily accessible to all consumers, visitors and vendors</p>
              <div className="meeo-service-details">
                <div className="meeo-service-detail">
                  <EnvironmentOutlined />
                  <span>In Front Of ALS School Beside Of The Fire Station</span>
                </div>
                <div className="meeo-service-detail">
                  <ClockCircleOutlined />
                  <span>8:00 AM - 5:00 PM</span>
                </div>
              </div>
            </div>
          </div>

          <div className="meeo-services-features">
            <h3>Facility Features</h3>
            <div className="meeo-features-list">
              <div className="meeo-feature-item">
                <SafetyCertificateOutlined />
                <span>Regular cleaning and maintenance</span>
              </div>
              
              <div className="meeo-feature-item">
                <SafetyCertificateOutlined />
                <span>Water supply and proper sanitation</span>
              </div>
              <div className="meeo-feature-item">
                <DollarOutlined />
                <span>Maintenance fee: ₱2.00 per use</span>
              </div>
            </div>
          </div>

          <div className="meeo-services-notice">
            <div className="meeo-notice-icon">
              <EnvironmentOutlined />
            </div>
            <div>
              <strong>Please Note</strong>
              <p>For more information about facility usage, maintenance schedules, or to report any issues, please visit the MEEO Office during office hours.</p>
            </div>
          </div>
        </div>
    </section>
  );
};

export default MeeoServices;