
import React from "react";
import {
  TeamOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  WifiOutlined,
  CarOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import "./MeeoServices.css";

const MeeoServices = ({ servicesRef }) => {
  return (
    <section
      className="meeo-services-section"
      ref={servicesRef}
      aria-labelledby="meeo-services-heading"
    >
      <div className="meeo-services-header">
        <div>
          <div className="meeo-services-title">
            <SafetyCertificateOutlined />
            MARKET AMENITIES AND FACILITIES
          </div>

          <h2 id="meeo-services-heading">
            Market Facilities &amp; Amenities
          </h2>

          <p>
            Convenient and accessible facilities provided for market
            consumers, visitors, vendors, and the local community.
          </p>
        </div>
      </div>

      <div className="meeo-services-content">

        {/* ============================================================
            PUBLIC RESTROOM FACILITIES
            ============================================================ */}
        <div className="meeo-services-intro">
          <div className="meeo-services-intro-icon">
            <TeamOutlined />
          </div>

          <div>
            <h3>Public Restroom Facilities</h3>

            <p>
              The MEEO Office maintains two comfort rooms within the market
              premises to ensure clean and accessible restroom facilities
              for all market consumers, visitors, and vendors.
            </p>
          </div>
        </div>

        <div className="meeo-services-grid">

          {/* Comfort Room 1 */}
          <div className="meeo-service-card">
            <div className="meeo-service-card-icon">
              <TeamOutlined />
            </div>

            <h4>Comfort Room 1</h4>

            <p>
              Located near the Ukay-Ukayan, accessible to all consumers,
              visitors, and vendors.
            </p>

            <div className="meeo-service-details">
              <div className="meeo-service-detail">
                <EnvironmentOutlined />
                <span>Next to the Ukay-Ukayan</span>
              </div>

              <div className="meeo-service-detail">
                <ClockCircleOutlined />
                <span>5:00 AM - 10:00 PM</span>
              </div>
            </div>
          </div>

          {/* Comfort Room 2 */}
          <div className="meeo-service-card">
            <div className="meeo-service-card-icon">
              <TeamOutlined />
            </div>

            <h4>Comfort Room 2</h4>

            <p>
              Located near the fire station, easily accessible to all
              consumers, visitors, and vendors.
            </p>

            <div className="meeo-service-details">
              <div className="meeo-service-detail">
                <EnvironmentOutlined />
                <span>
                  In front of ALS School, beside the Fire Station
                </span>
              </div>

              <div className="meeo-service-detail">
                <ClockCircleOutlined />
                <span>8:00 AM - 5:00 PM</span>
              </div>
            </div>
          </div>

        </div>

        {/* ============================================================
            FREE WIFI & PARKING
            ============================================================ */}
       

        <div className="meeo-services-grid">

          {/* Free Wi-Fi */}
          <div className="meeo-service-card">
            <div className="meeo-service-card-icon">
              <WifiOutlined />
            </div>

            <h4>Free Wi-Fi</h4>

            <p>
              Free Wi-Fi access is available within designated areas of
              the market for consumers, visitors, and vendors.
            </p>

            <div className="meeo-service-details">
              <div className="meeo-service-detail">
                <WifiOutlined />
                <span>Free public Wi-Fi</span>
              </div>

              <div className="meeo-service-detail">
                <ClockCircleOutlined />
                <span>Available during market hours</span>
              </div>
            </div>
          </div>

          {/* Parking Area */}
          <div className="meeo-service-card">
            <div className="meeo-service-card-icon">
              <CarOutlined />
            </div>

            <h4>Parking Area</h4>

            <p>
              Designated parking spaces are available for market
              consumers, visitors, and vendors.
            </p>

            <div className="meeo-service-details">
              <div className="meeo-service-detail">
                <EnvironmentOutlined />
                <span>Designated market parking area</span>
              </div>

              <div className="meeo-service-detail">
                <SafetyCertificateOutlined />
                <span>Follow posted parking guidelines</span>
              </div>
            </div>
          </div>



<div className="meeo-service-card">
  <div className="meeo-service-card-icon">
    <SafetyCertificateOutlined />
  </div>

  <h4>Administrative Office</h4>

  <p>
    Workspace for the market supervisor and collection staff who manage
    daily market operations, assist vendors and consumers, and help enforce
    local market rules and ordinances.
  </p>

  <div className="meeo-service-details">
    <div className="meeo-service-detail">
      <SafetyCertificateOutlined />
      <span>Market Administration &amp; Supervision</span>
    </div>

    <div className="meeo-service-detail">
      <ClockCircleOutlined />
      <span>Available during market hours</span>
    </div>
  </div>
</div>


<div className="meeo-service-card">
  <div className="meeo-service-card-icon">
    <VideoCameraOutlined />
  </div>

  <h4>CCTV & Public Address System</h4>

  <p>
CCTV cameras and a public address (PA) and sound system help support market security, public safety, and clear communication throughout key areas of the market.
  </p>

  <div className="meeo-service-details">
    <div className="meeo-service-detail">
      <VideoCameraOutlined />
      <span>Market Area Surveillance</span>
    </div>

    <div className="meeo-service-detail">
      <SafetyCertificateOutlined />
      <span>Supports Market Security</span>
    </div>

    <div className="meeo-service-detail">
      <ClockCircleOutlined />
      <span>Security Monitoring</span>
    </div>
  </div>
</div>





        </div>

        {/* ============================================================
            FACILITY FEATURES
            ============================================================ */}
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
              <WifiOutlined />
              <span>Free Wi-Fi access for market users</span>
            </div>

            <div className="meeo-feature-item">
              <CarOutlined />
              <span>Designated parking area for visitors</span>
            </div>

            <div className="meeo-feature-item">
              <DollarOutlined />
              <span>Urination fee: ₱3.00 per use</span>
            </div>

            <div className="meeo-feature-item">
              <DollarOutlined />
              <span>Defecation fee: ₱5.00 per use</span>
            </div>

          </div>
        </div>

        {/* ============================================================
            NOTICE
            ============================================================ */}
        <div className="meeo-services-notice">
          <div className="meeo-notice-icon">
            <EnvironmentOutlined />
          </div>

          <div>
            <strong>Please Note</strong>

            <p>
              For more information about facility usage, parking rules,
              Wi-Fi access, maintenance schedules, or to report any
              issues, please visit the MEEO Office during office hours.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default MeeoServices;

