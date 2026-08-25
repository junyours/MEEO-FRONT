import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Api";
import bg from "../assets/bg.jpg";
import meeoLogo from "../assets/logo_meeo.png";
import opolLogo from "../assets/logo_Opol.png";
import Footer from "./Footer";
import Market1 from "../assets/Market1.jpg";
import Market2 from "../assets/Market2.jpg";
import Market3 from "../assets/Market3.jpg";
import {
  AppstoreOutlined,
  UserOutlined,
  FileTextOutlined,
  BankOutlined,
  SearchOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  DollarOutlined,
  ProfileOutlined,
  RocketOutlined,
  HomeOutlined,
  SettingOutlined,
  BarChartOutlined,
  ArrowRightOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  SolutionOutlined,
  LeftOutlined,
  RightOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import "./GetStarted.css";

const GetStarted = () => {
  const navigate = useNavigate();
  const moreInfoRef = useRef(null);
  const activitiesRef = useRef(null);

  const [moreInfoActive, setMoreInfoActive] = useState(false);
  const [moreInfoVisible, setMoreInfoVisible] = useState(false);
  const [activitiesVisible, setActivitiesVisible] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const heroImages = [
  
    { source: Market1, alt: "Market Layout 1", fit: "cover" },

    { source: Market2, alt: "Market Layout 2 ", fit: "Cover" },
    { source: Market3, alt: "Market Layout 3 ", fit: "Cover" },
      {source: bg, alt: "Opol Public Market", fit: "cover"},
 { source: opolLogo, alt: "Municipality of Opol official seal", fit: "contain" },
    { source: meeoLogo, alt: "MEEO Logo ", fit: "contain" },

  ];
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  const handleGetStarted = () => {
    navigate("/homepage");
  };

  const handleMoreInfo = () => {
    moreInfoRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };



const getImageSource = (image) => {
  if (!image) return "";
  return image;
};

const getActivityImages = (activity) => [
  activity.image,
  ...(activity.images || []).map((image) => image.image),
].filter(Boolean);


  const formatActivityDate = (dateValue) => {
    if (!dateValue) return "Date unavailable";

    const datePart = dateValue.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return Number.isNaN(date.getTime())
      ? datePart
      : date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
  };

 const loadActivities = async () => {
  try {
    setActivitiesLoading(true);
    setActivitiesError(false);

    const response = await api.get("/office-activities");

   
    const loadedActivities = response.data?.data || [];



    setActivities(loadedActivities);

    setSelectedActivity(
      (currentActivity) =>
        currentActivity || loadedActivities[0] || null
    );

    setSelectedImageIndex(0);

  } catch (error) {
    console.error("Failed to load office activities:", error);
    console.error("Status:", error.response?.status);
    console.error("Response:", error.response?.data);

    setActivitiesError(true);
  } finally {
    setActivitiesLoading(false);
  }
};

  const handleViewActivities = () => {
    activitiesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleHeroImageNavigation = (direction) => {
    setHeroImageIndex((currentIndex) =>
      (currentIndex + direction + heroImages.length) % heroImages.length
    );
  };

  const handleSelectActivity = (activity) => {
    setSelectedActivity(activity);
    setSelectedImageIndex(0);
  };

  const handleImageNavigation = (direction) => {
    const imageCount = getActivityImages(selectedActivity).length;
    setSelectedImageIndex((currentIndex) =>
      (currentIndex + direction + imageCount) % imageCount
    );
  };

  useEffect(() => {
    loadActivities();

    const observer = new IntersectionObserver(
      ([entry]) => {
        setMoreInfoActive(entry.isIntersecting);
        setMoreInfoVisible(entry.isIntersecting);
      },
      {
        threshold: 0.12,
        rootMargin: "-5% 0px -5% 0px",
      }
    );

    if (moreInfoRef.current) {
      observer.observe(moreInfoRef.current);
    }

    const activitiesObserver = new IntersectionObserver(
      ([entry]) => setActivitiesVisible(entry.isIntersecting),
      { threshold: 0.12, rootMargin: "-5% 0px -5% 0px" }
    );

    if (activitiesRef.current) {
      activitiesObserver.observe(activitiesRef.current);
    }

    return () => {
      if (moreInfoRef.current) {
        observer.unobserve(moreInfoRef.current);
      }

      if (activitiesRef.current) {
        activitiesObserver.unobserve(activitiesRef.current);
      }
    };
  }, []);

  return (
    <div className="get-started-page">
      <nav className="landing-navbar" aria-label="Economic enterprises">
        <div className="landing-brand">
          <div className="brand-logo"><img src={meeoLogo} alt="MEEO Opol logo" /></div>
          <div className="brand-text"><strong>MEEO OPOL</strong><span>Municipal Economic Enterprise Office</span></div>
        </div>
        <div className="enterprise-nav-links">
          <button className="enterprise-nav-link active" type="button" onClick={handleBackToTop}>Market</button>
          <button className="enterprise-nav-link" type="button" onClick={() => navigate("/slaughter")}>Slaughter</button>
          <button className="enterprise-nav-link" type="button" onClick={() => navigate("/wharf")}>Wharf</button>
        </div>
         </nav>

      {/* Background */}
      <div className="background-grid"></div>
      <div className="background-glow glow-one"></div>
      <div className="background-glow glow-two"></div>

      <div className="background-shape shape-two"></div>




      {/* =====================================================
          HERO
      ====================================================== */}
      <section
        className="hero-section market-hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(12, 28, 49, .92), rgba(12, 28, 49, .4)), url(${heroImages[heroImageIndex].source})`,
          backgroundSize: `cover, ${heroImages[heroImageIndex].fit.toLowerCase()}`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >

        <div className="hero-container">

          {/* LEFT */}
          <div className="get-started-content market-hero-content">

            <div className="brand-badge">
              <span className="badge-icon">
                <SafetyCertificateOutlined />
              </span>

              <span>
                MUNICIPAL MARKET MANAGEMENT
              </span>
            </div>


            <h1>
              A Smarter Way to
              <span>
                Manage Your Market.
              </span>
            </h1>


            <p className="description">
             The core function of the Municipal Economic Enterprise Office (MEEO) is to manage and sustain local government-owned economic enterprises—ensuring they generate revenue, remain financially viable, and provide quality services to the community 
            </p>


            {/* TRUST ITEMS */}
            <div className="trust-row">

              <div className="trust-item">
                <CheckCircleOutlined />
                <span>Organized Records</span>
              </div>

              <div className="trust-item">
                <CheckCircleOutlined />
                <span>Efficient Operations</span>
              </div>

              <div className="trust-item">
                <CheckCircleOutlined />
                <span>Reliable Reports</span>
              </div>

            </div>


            {/* FEATURES */}
            <div className="features">

              <div className="feature-item">

                <div className="feature-icon">
                  <AppstoreOutlined />
                </div>

                <div>
                  <strong>Centralized Management</strong>

                  <p>
                    Manage market operations from one
                    organized platform.
                  </p>
                </div>

              </div>


              <div className="feature-item">

                <div className="feature-icon">
                  <TeamOutlined />
                </div>

                <div>
                  <strong>Vendor & Stall Management</strong>

                  <p>
                    Keep vendor and stall information
                    accurate and accessible.
                  </p>
                </div>

              </div>


              <div className="feature-item">

                <div className="feature-icon">
                  <BarChartOutlined />
                </div>

                <div>
                  <strong>Monitoring & Reports</strong>

                  <p>
                    Monitor collections and generate
                    useful operational reports.
                  </p>
                </div>

              </div>

            </div>


            {/* BUTTONS */}
            <div className="hero-buttons">

              <button
                className="get-started-button"
                onClick={handleGetStarted}
                aria-label="Get Started"
                title="Get Started"
              >
                <RocketOutlined />
                <span className="button-label">Get Started</span>
                <ArrowRightOutlined />
              </button>


              <button
                className={`hero-more-info ${
                  moreInfoActive ? "active-glow" : ""
                }`}
                onClick={handleMoreInfo}
                aria-label="Become a Vendor"
                title="Become a Vendor"
              >
                <InfoCircleOutlined />
                <span className="button-label">Become a Vendor</span>
                <ArrowDownOutlined />
              </button>

              <button
                className="hero-activities-button"
                onClick={handleViewActivities}
                aria-label="View Activities"
                title="View Activities"
              >
                <PictureOutlined />
                <span className="button-label">View Activities</span>
                       <ArrowDownOutlined />
              </button>

            </div>


            <div className="secure-text">
              <SafetyCertificateOutlined />
              <span>
                Secure • Reliable • Easy to Use
              </span>
            </div>

          </div>


          {/* =====================================================
              DASHBOARD PREVIEW
          ====================================================== */}
          <div className="dashboard-preview market-gallery">

            <div className="market-image-card">
              <img
                key={heroImages[heroImageIndex].source}
                className={`market-image market-image-${heroImages[heroImageIndex].fit}`}
                src={heroImages[heroImageIndex].source}
                alt={heroImages[heroImageIndex].alt}
              />
              <button className="hero-gallery-arrow hero-gallery-arrow-left" onClick={() => handleHeroImageNavigation(-1)} aria-label="Previous hero image">
                <LeftOutlined />
              </button>
              <button className="hero-gallery-arrow hero-gallery-arrow-right" onClick={() => handleHeroImageNavigation(1)} aria-label="Next hero image">
                <RightOutlined />
              </button>
              <div className="hero-gallery-dots" aria-label="Hero image selector">
                {heroImages.map((image, index) => (
                  <button
                    className={index === heroImageIndex ? "active" : ""}
                    key={image.alt}
                    onClick={() => setHeroImageIndex(index)}
                    aria-label={`Show ${image.alt}`}
                  />
                ))}
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          MORE INFORMATION
      ====================================================== */}
      <section
        className={`more-info-section ${moreInfoVisible ? "section-is-visible" : ""}`}
        ref={moreInfoRef}
      >

        <div className="more-info-container">

          {/* HEADER */}
          <div className="more-info-header">

            <div className="section-label">
              <SolutionOutlined />
              VENDOR INFORMATION CENTER
            </div>

            <h2>
              Interested in Becoming a
              <span>
                Market Vendor?
              </span>
            </h2>

            <p>
              Explore the general process for prospective
              vendors who want to operate at the market in
              Opol, Misamis Oriental.
            </p>

          </div>

          {/* PROCESS FLOW */}
          <div className="process-flow">

            {/* STEP 1 */}
            <div className="process-step">

              <div className="step-number">
                01
              </div>

              <div className="step-content">

                <div className="step-icon">
                  <UserOutlined />
                </div>

                <div className="step-content-header">

                  <div>
                    <span className="step-label">
                      STEP 01
                    </span>

                    <h3>
                      Check Vendor Eligibility
                    </h3>
                  </div>

                </div>

                <p>
                  Determine the type of products or services
                  you intend to sell and check available
                  vendor opportunities at the market.
                </p>

                <div className="step-tag">
                  START HERE
                </div>

              </div>

            </div>


            <div className="process-connector">
              <ArrowDownOutlined />
            </div>


            {/* STEP 2 */}
            <div className="process-step">

              <div className="step-number">
                02
              </div>

              <div className="step-content">

                <div className="step-icon">
                  <FileTextOutlined />
                </div>

                <span className="step-label">
                  STEP 02
                </span>

                <h3>
                  Prepare Requirements
                </h3>

                <p>
                  Prepare the documents and information required
                  by the market office. Requirements may vary
                  depending on the vendor type or stall.
                </p>

                <div className="requirement-mini-list">

                  <span>
                    <CheckCircleOutlined />
                    Valid identification
                  </span>

                  <span>
                    <CheckCircleOutlined />
                    Vendor information
                  </span>

                  <span>
                    <CheckCircleOutlined />
                    Product information
                  </span>

                </div>

              </div>

            </div>


            <div className="process-connector">
              <ArrowDownOutlined />
            </div>


            {/* STEP 3 */}
            <div className="process-step">

              <div className="step-number">
                03
              </div>

              <div className="step-content">

                <div className="step-icon">
                  <BankOutlined />
                </div>

                <span className="step-label">
                  STEP 03
                </span>

                <h3>
                  Visit the Market Office
                </h3>

                <p>
                  Coordinate with the appropriate market office
                  in Opol for vendor application, available
                  stalls, rates, schedules, and current
                  requirements.
                </p>

                <div className="step-location">
                  <EnvironmentOutlined />
                  <span>Opol, Misamis Oriental</span>
                </div>

              </div>

            </div>


            <div className="process-connector">
              <ArrowDownOutlined />
            </div>


            {/* STEP 4 */}
            <div className="process-step">

              <div className="step-number">
                04
              </div>

              <div className="step-content">

                <div className="step-icon">
                  <SearchOutlined />
                </div>

                <span className="step-label">
                  STEP 04
                </span>

                <h3>
                  Application Review
                </h3>

                <p>
                  The submitted information and documents are
                  reviewed by the appropriate personnel based
                  on applicable market policies.
                </p>

                <div className="step-review">
                  <SafetyCertificateOutlined />
                  <span>Application under review</span>
                </div>

              </div>

            </div>


            <div className="process-connector">
              <ArrowDownOutlined />
            </div>


            {/* STEP 5 */}
            <div className="process-step">

              <div className="step-number">
                05
              </div>

              <div className="step-content">

                <div className="step-icon">
                  <ShopOutlined />
                </div>

                <span className="step-label">
                  STEP 05
                </span>

                <h3>
                  Stall Assignment
                </h3>

                <p>
                  If approved and a suitable stall is available,
                  the vendor may proceed with the applicable
                  stall assignment and related procedures.
                </p>

                <div className="step-location">
                  <ShopOutlined />
                  <span>Stall allocation</span>
                </div>

              </div>

            </div>


            <div className="process-connector">
              <ArrowDownOutlined />
            </div>


            {/* STEP 6 */}
            <div className="process-step final-step">

              <div className="step-number">
                06
              </div>

              <div className="step-content">

                <div className="step-icon success-icon">
                  <CheckCircleOutlined />
                </div>

                <span className="step-label">
                  STEP 06
                </span>

                <h3>
                  Start Your Market Business
                </h3>

                <p>
                  Complete the applicable registration and
                  payment procedures, follow market rules,
                  and begin operating your assigned stall.
                </p>

                <div className="step-tag success">
                  READY TO OPERATE
                </div>

              </div>

            </div>

          </div>


          {/* =================================================
              INFORMATION CARDS
          ================================================== */}
          <div className="information-grid">

            <div
              className="information-card information-card-clickable"
              onClick={handleGetStarted}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleGetStarted();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="View stall availability"
            >

              <div className="information-card-icon">
                <ShopOutlined />
              </div>

              <div className="information-card-content">

                <span className="card-label">
                  MARKET INFORMATION
                </span>

                <h3>
                  Stall Availability
                </h3>

                <p>
                  Stall availability may change depending on
                  current occupancy and market administration.
                </p>

              </div>

              <ArrowRightOutlined className="card-arrow" />

            </div>


            <div className="information-card">

              <div className="information-card-icon">
                <DollarOutlined />
              </div>

              <div className="information-card-content">

                <span className="card-label">
                  FINANCIAL INFORMATION
                </span>

                <h3>
                  Stall & Market Fees
                </h3>

                <p>
                  Applicable stall rental, market fees, and
                  payment schedules should be confirmed with
                  the market office.
                </p>

              </div>

              <ArrowRightOutlined className="card-arrow" />

            </div>


            <div className="information-card">

              <div className="information-card-icon">
                <ProfileOutlined />
              </div>

              <div className="information-card-content">

                <span className="card-label">
                  DOCUMENTATION
                </span>

                <h3>
                  Requirements
                </h3>

                <p>
                  Required documents and procedures may change.
                  Confirm the latest requirements with the
                  appropriate municipal office.
                </p>

              </div>

              <ArrowRightOutlined className="card-arrow" />

            </div>

          </div>


          {/* NOTICE */}
          <div className="vendor-notice">

            <div className="notice-icon">
              <InfoCircleOutlined />
            </div>

            <div>

              <strong>
                Important Information
              </strong>

              <p>
                The process shown here is a general guide for
                prospective market vendors. For official
                requirements, fees, stall availability,
                schedules, and approval procedures, please
                coordinate directly with the appropriate
                Municipality of Opol market office.
              </p>

            </div>

          </div>

          <div className={`activities-section ${activitiesVisible ? "section-is-visible" : ""}`} ref={activitiesRef}>
            <div className="activities-section-heading">
              <span className="section-label"><PictureOutlined /> MARKET ACTIVITIES</span>
              <h3>Life at the market</h3>
              <p>Explore announcements, programs, and community activities from the market office.</p>
            </div>

            {activitiesLoading && <div className="activities-state">Loading market activities...</div>}
            {!activitiesLoading && activitiesError && <div className="activities-state activities-state-error">Unable to load activities right now.</div>}
            {!activitiesLoading && !activitiesError && activities.length === 0 && <div className="activities-state">No activities have been published yet.</div>}
            {!activitiesLoading && !activitiesError && activities.length > 0 && (
              <div className="activities-layout">
                <div className="activities-list">
                  {activities.map((activity) => (
                    <button className={`activity-list-item ${selectedActivity?.id === activity.id ? "active" : ""}`} key={activity.id} onClick={() => handleSelectActivity(activity)}>
                      <img src={getImageSource(activity.image)} alt="" />
                      <span><strong>{activity.title}</strong><small>{activity.activity_type}</small></span>
                    </button>
                  ))}
                </div>
                <div className="activity-gallery">
                  {selectedActivity && (
                    <>
                      <div className="activity-main-image">
                        <img src={getActivityImages(selectedActivity)[selectedImageIndex]} alt={selectedActivity.title} />
                        {getActivityImages(selectedActivity).length > 1 && (
                          <>
                            <button className="gallery-arrow gallery-arrow-left" onClick={() => handleImageNavigation(-1)} aria-label="Previous image"><LeftOutlined /></button>
                            <button className="gallery-arrow gallery-arrow-right" onClick={() => handleImageNavigation(1)} aria-label="Next image"><RightOutlined /></button>
                          </>
                        )}
                      </div>
                      <div className="activity-details">
                        <span className="activity-date">{formatActivityDate(selectedActivity.activity_date)}</span>
                        <h4>{selectedActivity.title}</h4>
                        <p>{selectedActivity.description}</p>
                      </div>
                      <div className="activity-thumbnails">
                        {getActivityImages(selectedActivity).map((image, index) => (
                          <button className={index === selectedImageIndex ? "active" : ""} key={`${image}-${index}`} onClick={() => setSelectedImageIndex(index)} aria-label={`View image ${index + 1}`}><img src={image} alt="" /></button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>


          {/* ACTIONS */}
          <div className="more-info-actions">

            <button
              className="back-top-button"
              onClick={handleBackToTop}
            >
              <ArrowUpOutlined />
              Back to Top
            </button>

            <button
              className="bottom-get-started"
              onClick={handleGetStarted}
            >
                   <RocketOutlined />
              <span>
                Get Started
              </span>

              <ArrowRightOutlined />
            </button>

          </div>

        </div>

      </section>


      <Footer />

    </div>
  );
};

export default GetStarted;