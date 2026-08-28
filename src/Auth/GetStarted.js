import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Api";
import bg from "../assets/bg.jpg";
import meeoLogo from "../assets/logo_meeo.png";
import opolLogo from "../assets/logo_Opol.png";
import Footer from "./Footer";
import EnterpriseNavbar from "./EnterpriseNavbar";
import MeeoServices from "./MeeoServices";
import AvailableProducts from "./AvailableProducts";
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
RestOutlined ,
  BarChartOutlined,
  ArrowRightOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  SolutionOutlined,
  LeftOutlined,
  RightOutlined,
  PictureOutlined,
  CustomerServiceOutlined,
} from "@ant-design/icons";
import "./GetStarted.css";

const GetStarted = () => {
  const navigate = useNavigate();
  const moreInfoRef = useRef(null);
  const activitiesRef = useRef(null);
  const servicesRef = useRef(null);

  const [moreInfoActive, setMoreInfoActive] = useState(false);
  const [moreInfoVisible, setMoreInfoVisible] = useState(false);
  const [activitiesVisible, setActivitiesVisible] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeInfoModal, setActiveInfoModal] = useState(null);
  const [marketFees, setMarketFees] = useState([]);
  const [marketFeesLoading, setMarketFeesLoading] = useState(false);
  const [marketFeesError, setMarketFeesError] = useState(false);
  const [stallSections, setStallSections] = useState([]);
  const [stallSectionsLoading, setStallSectionsLoading] = useState(false);
  const [stallSectionsError, setStallSectionsError] = useState(false);
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

  const handleViewServices = () => {
    servicesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const openRequirementsModal = () => setActiveInfoModal("requirements");

  const openStallAvailabilityModal = async () => {
    setActiveInfoModal("availability");
    if (stallSections.length > 0 || stallSectionsLoading) return;

    try {
      setStallSectionsLoading(true);
      setStallSectionsError(false);
      const response = await api.get("/sections/available-stalls");
      setStallSections(response.data?.data || response.data || []);
    } catch (error) {
      console.error("Failed to load stall availability:", error);
      setStallSectionsError(true);
    } finally {
      setStallSectionsLoading(false);
    }
  };

  const openFeesModal = async () => {
    setActiveInfoModal("fees");
    if (marketFees.length > 0 || marketFeesLoading) return;

    try {
      setMarketFeesLoading(true);
      setMarketFeesError(false);
      const response = await api.get("/public/market-fees");
      setMarketFees(response.data?.data || []);
    } catch (error) {
      console.error("Failed to load market rental fees:", error);
      setMarketFeesError(true);
    } finally {
      setMarketFeesLoading(false);
    }
  };

  const closeInfoModal = () => setActiveInfoModal(null);

  const getAvailabilitySummary = (areaName) => {
    const matchingSections = stallSections.filter((section) => (
      section.area?.name?.toLowerCase() === areaName
    ));

    return matchingSections.reduce((summary, section) => ({
      total: summary.total + (section.total_stalls || 0),
      available: summary.available + (section.available_stalls_count || 0),
      occupied: summary.occupied + (section.occupied_stalls_count || 0),
      sections: [...summary.sections, section],
    }), { total: 0, available: 0, occupied: 0, sections: [] });
  };

  const getMarketAvailabilitySummary = () => {
    const drySummary = getAvailabilitySummary("dry");
    const wetSummary = getAvailabilitySummary("wet");

    return {
      total: drySummary.total + wetSummary.total,
      available: drySummary.available + wetSummary.available,
      occupied: drySummary.occupied + wetSummary.occupied,
      sections: [...drySummary.sections, ...wetSummary.sections],
    };
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
    <div className="market-get-started-page">
      <EnterpriseNavbar />

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
             MUNICIPAL ECONOMIC ENTERPRISE OFFICE-MARKET
              </span>
            </div>


            <h1>
              A Smarter Way to
              <span>
                Manage Your Market.
              </span>
            </h1>


            <p className="description">
      The Opol Public Market serves as a central marketplace that provides the community with accessible and affordable basic goods and services. 
      It supports the livelihood of vendors, traders, and other market workers by providing opportunities for income and employment. The market also promotes local economic activity, ensures an organized and regulated trading environment, and contributes to the municipality’s revenue through rentals, fees, and other authorized collections. Overall, it plays an important role in meeting 
      the daily needs of the community while supporting local economic development and municipal revenue generation.  
              </p>


         

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

              <button
                className="hero-services-button"
                onClick={handleViewServices}
                aria-label="View Services"
                title="View Services"
              >
                <AppstoreOutlined    />
                <span className="button-label">View Services</span>
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
              onClick={openStallAvailabilityModal}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openStallAvailabilityModal();
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


            <div
              className="information-card information-card-clickable"
              onClick={openFeesModal}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openFeesModal();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="View stall rental and market fees"
            >

              <div className="information-card-icon">
                <DollarOutlined />
              </div>

              <div className="information-card-content">

                <span className="card-label">
                  FINANCIAL INFORMATION
                </span>

                <h3>
                  Stall Rental And Market Fees
                </h3>

                <p>
                  Applicable stall rental, market fees, and
                  payment schedules should be confirmed with
                  the market office.
                </p>

              </div>

              <ArrowRightOutlined className="card-arrow" />

            </div>


            <div
              className="information-card information-card-clickable"
              onClick={openRequirementsModal}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openRequirementsModal();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="View market requirements"
            >

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

          {activeInfoModal && (
            <div className="market-info-modal-backdrop" role="presentation" onMouseDown={closeInfoModal}>
              <div
                className={`market-info-modal ${activeInfoModal === "fees" ? "market-info-modal-fees" : ""}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="market-info-modal-title"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <button className="market-info-modal-close" type="button" onClick={closeInfoModal} aria-label="Close information modal" title="Close">
                  <CloseOutlined />
                </button>
                {activeInfoModal === "availability" ? (
                  <>
                    <span className="section-label"><ShopOutlined /> MARKET INFORMATION</span>
                    <h2 id="market-info-modal-title">Stall Availability</h2>
                    <p className="market-info-modal-intro">Current availability for wet, dry, and open-space market areas.</p>
                    {stallSectionsLoading && <div className="market-info-modal-state">Loading stall availability...</div>}
                    {!stallSectionsLoading && stallSectionsError && <div className="market-info-modal-state market-info-modal-state-error">Unable to load stall availability right now.</div>}
                    {!stallSectionsLoading && !stallSectionsError && stallSections.length === 0 && <div className="market-info-modal-state">No stall availability information is currently available.</div>}
                    {!stallSectionsLoading && !stallSectionsError && stallSections.length > 0 && (
                      <div className="market-availability-panels">
                        {["market", "open space"].map((areaName) => {
                          const summary = areaName === "market"
                            ? getMarketAvailabilitySummary()
                            : getAvailabilitySummary(areaName);
                          if (summary.sections.length === 0) return null;

                          return (
                            <section className={`market-availability-panel market-availability-panel-${areaName.replace(" ", "-")}`} key={areaName}>
                              <div className="market-availability-panel-banner">
                                <HomeOutlined />
                                <strong>{areaName === "open space" ? "Open Space" : "Market Stalls"}</strong>
                                <span>{areaName === "open space" ? "Outdoor Market Areas" : "Wet & Dry Market Areas"}</span>
                              </div>
                              <div className="market-availability-panel-heading">
                                <div>
                                  <span className="market-availability-kicker">{areaName === "open space" ? "OUTDOOR AREA" : "WET & DRY MARKET"}</span>
                                    <h3>{areaName === "open space" ? "Open Space" : "Market Stalls"}</h3>
                                </div>
                                <strong>{summary.total} <small>Total</small></strong>
                              </div>
                              <div className="market-availability-stats">
                                <div><strong>{summary.available}</strong><span>Available</span></div>
                                <div><strong>{summary.occupied}</strong><span>Occupied</span></div>
                                <div><strong>{summary.total}</strong><span>Total</span></div>
                              </div>
                              <div className="market-availability-sections">
                                {summary.sections.map((section) => (
                                  <div className="market-availability-section-row" key={section.id}>
                                    <strong>{section.name}</strong>
                                    <span>{section.available_stalls_count || 0} available</span>
                                    <span>{section.occupied_stalls_count || 0} occupied</span>
                                  </div>
                                ))}
                              </div>
                              <div className="market-availability-occupancy">
                                <div><strong>Occupancy Rate</strong><span>{summary.total > 0 ? Math.round((summary.occupied / summary.total) * 100) : 0}%</span></div>
                                <div className="market-availability-progress"><span style={{ width: `${summary.total > 0 ? (summary.occupied / summary.total) * 100 : 0}%` }} /></div>
                                <div className="market-availability-occupancy-counts"><span>◷ {summary.available} Available</span><span>⊗ {summary.occupied} Occupied</span></div>
                              </div>
                            </section>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : activeInfoModal === "requirements" ? (
                  <>
                    <span className="section-label"><ProfileOutlined /> DOCUMENTATION</span>
                    <h2 id="market-info-modal-title">Market Requirements</h2>
                    <p className="market-info-modal-intro">Prepare the following information and documents before coordinating with the market office.</p>
                    <ul className="market-info-modal-list">
                  
                      <li><CheckCircleOutlined /> Valid government-issued identification</li>
                      <li><CheckCircleOutlined /> Letter Of Intent</li>
                      <li><CheckCircleOutlined /> 2x2 Photo 2pcs</li>
                      <li><CheckCircleOutlined /> Barangay Clearance</li>
                      <li><CheckCircleOutlined /> Valid Resident Certificate/Cedula</li>
                          <li><CheckCircleOutlined /> Must Be A Filipino Citizen</li>
                      <li><CheckCircleOutlined /> Must Be Of Legal Age, Whether Single Or Married</li>
                      <li><CheckCircleOutlined /> Must Be A Resident Of The Municipality Of Opol, Misamis Oriental, Philippines </li>

                      <li><CheckCircleOutlined /> Contract Of Lease</li>

                    </ul>
                    <p className="market-info-modal-note">Requirements may vary by vendor type. Confirm the latest requirements with the Municipal Economic Enterprise Office.</p>
                  </>
                ) : (
                  <>
                    <span className="section-label"><DollarOutlined /> FINANCIAL INFORMATION</span>
                    <h2 id="market-info-modal-title">Stall Rental And Market Fees</h2>
                    <p className="market-info-modal-intro">Current rental rates are grouped below by market section.</p>
                    {marketFeesLoading && <div className="market-info-modal-state">Loading current rental fees...</div>}
                    {!marketFeesLoading && marketFeesError && <div className="market-info-modal-state market-info-modal-state-error">Unable to load rental fees right now.</div>}
                    {!marketFeesLoading && !marketFeesError && marketFees.length === 0 && <div className="market-info-modal-state">No rental fee information is currently available.</div>}
                    {!marketFeesLoading && !marketFeesError && marketFees.length > 0 && (
                      <div className="market-fees-list">
                        {marketFees.map((section) => (
                          <section className="market-fee-group" key={section.id}>
                            <div>
                              <h3>{section.name}</h3>
                              <span>{section.area?.name || "Market section"}</span>
                            </div>
                            <div className="market-fee-stalls">
                              {section.stalls.length > 0 ? section.stalls.map((stall) => (
                                <div className="market-fee-stall" key={stall.id}>
                                  <strong>Stall {stall.stall_number}</strong>
                                  <span><small>Daily rate</small>{stall.daily_rate !== null ? `₱${Number(stall.daily_rate).toLocaleString()}` : "Unavailable"}</span>
                                  <span><small>30-day rate</small>{stall.monthly_rate !== null ? `₱${Number(stall.monthly_rate).toLocaleString()}` : "Unavailable"}</span>
                                </div>
                              )) : <span className="market-fee-empty">No active stalls in this section.</span>}
                            </div>
                          </section>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}


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
                coordinate directly with the Municipal Economic Enterprise Office.
              </p>

            </div>

          </div>

          <div className="market-info-panels">
            <div className={`activities-section ${activitiesVisible ? "section-is-visible" : ""}`} ref={activitiesRef}>
              <div className="activities-section-heading">
                <span className="section-label"><PictureOutlined /> MARKET ACTIVITIES</span>
                <h3>Life at the market</h3>
                <p>Explore announcements, programs, and community activities .</p>
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

            <MeeoServices servicesRef={servicesRef} />
          </div>

          <section className="market-products-section" aria-labelledby="market-products-heading">
            <div className="market-products-section-heading">
              <span className="section-label"><ShopOutlined /> AVAILABLE PRODUCTS</span>
              <h2 id="market-products-heading">Fresh products available at the market</h2>
              <p>Browse current product categories and available items from the public market.</p>
            </div>
            <AvailableProducts />
          </section>


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