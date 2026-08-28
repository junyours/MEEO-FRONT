import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowDownOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  BankOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  RightOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
  DollarOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import Footer from "./Footer";
import EnterpriseNavbar from "./EnterpriseNavbar";

import hog from "../assets/paa_baboy.jpg";
import slaughter from "../assets/slaughter.jpg";
import pig1 from "../assets/pig.jpg";
import pig2 from "../assets/pig2.jpg";
import pig3 from "../assets/pig3.jpg";

import "./Slaughter.css";

// =============================================================================
// HERO IMAGES
// =============================================================================

const HERO_IMAGES = [
  {
    source: slaughter,
    alt: "Municipal Slaughterhouse",
  },
  {
    source: pig1,
    alt: "Livestock Processing",
  },
  {
    source: pig2,
    alt: "Pig Processing",
  },
  {
    source: pig3,
    alt: "Slaughterhouse Operations",
  },
  {
    source: hog,
    alt: "Fresh Pork",
  },
];

const SLAUGHTER_FEES = [
  {
    animal: "Hog(s)",
    note: "Per head / per kilo",
    rows: [
      ["Slaughter fee", "X 3.20 per kilo"],
      ["Ante mortem (AM)", "20 per head"],
      ["Post mortem (PM)", "X 0.50 per kilo"],
      ["Coral fee", "10 per head"],
      ["Permit to SLH (slaughter)", "5 per head"],
      ["Minimum weight", "78 kgs. and below 250.00"],
    ],
  },
  {
    animal: "Cattle",
    note: "Per head / per kilo",
    rows: [
      ["Slaughter fee", "X 4.00 per kilo"],
      ["Ante mortem (AM)", "40 per head"],
      ["Post mortem (PM)", "X 0.50 per kilo"],
      ["Coral fee", "20 per head"],
      ["Permit to SLH (slaughter)", "10 per head"],
      ["Minimum weight", "112 kgs. and below 450.00"],
      ["Hides", "200 per head"],
    ],
  },
  {
    animal: "Carabeef",
    note: "Per head / per kilo",
    rows: [
      ["Slaughter fee", "X 4.50 per kilo"],
      ["Ante mortem (AM)", "40 per head"],
      ["Post mortem (PM)", "X 0.50 per kilo"],
      ["Coral fee", "20 per head"],
      ["Permit to SLH (slaughter)", "10 per head"],
      ["Minimum weight", "112 kgs. and below 500.00"],
      ["Hides", "200 per head"],
    ],
  },
  {
    animal: "Goat / Chevron",
    note: "Per head / per kilo",
    rows: [
      ["Slaughter fee", "Minimum 500"],
      ["Ante mortem (AM)", "20 per head"],
      ["Post mortem (PM)", "X 0.50 per kilo"],
      ["Coral fee", "10 per head"],
      ["Permit to SLH (slaughter)", "5 per head"],
    ],
  },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const Slaughter = () => {
  const navigate = useNavigate();
  const [heroIndex, setHeroIndex] = useState(0);

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const goToHome = () => {
    navigate("/homepage");
  };

  // ---------------------------------------------------------------------------
  // Gallery
  // ---------------------------------------------------------------------------

  const changeHero = (direction) => {
    setHeroIndex((currentIndex) => {
      return (
        (currentIndex + direction + HERO_IMAGES.length) %
        HERO_IMAGES.length
      );
    });
  };

  // ---------------------------------------------------------------------------
  // Section Navigation
  // ---------------------------------------------------------------------------

  const viewServices = () => {
    document
      .querySelector(".slaughter-services")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  const viewFees = () => {
    document
      .querySelector(".slaughter-fees")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  const backToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="slaughter-page">
      <EnterpriseNavbar />

      <HeroSection
        heroIndex={heroIndex}
        onPrevious={() => changeHero(-1)}
        onNext={() => changeHero(1)}
        onSelectImage={setHeroIndex}
        onGetStarted={goToHome}
        onLearnMore={viewServices}
        onViewFees={viewFees}
      />

      <OverviewSection />

   

      <ServicesSection />
     <FeeScheduleSection />
      <InformationSection />

      {/* =====================================================================
          PAGE ACTIONS
          ===================================================================== */}

      <div className="slaughter-actions">
        <button
          className="slaughter-back-top-button"
          type="button"
          onClick={backToTop}
        >
          <ArrowUpOutlined />
          Back to Top
        </button>

        <button
          className="slaughter-bottom-get-started"
          type="button"
          onClick={goToHome}
        >
          <RocketOutlined />
         Go To Homepage
          <ArrowRightOutlined />
        </button>
      </div>

      <Footer />
    </div>
  );
};

// =============================================================================
// HERO SECTION
// =============================================================================

const HeroSection = ({
  heroIndex,
  onPrevious,
  onNext,
  onSelectImage,
  onGetStarted,
  onLearnMore,
  onViewFees,
}) => {
  const image = HERO_IMAGES[heroIndex];

  return (
    <section
      className="slaughter-hero"
      style={{
        backgroundImage: `
          linear-gradient(
            90deg,
            rgba(12, 28, 49, 0.94),
            rgba(12, 28, 49, 0.72) 45%,
            rgba(12, 28, 49, 0.30)
          ),
          url(${image.source})
        `,
      }}
    >
      <div className="slaughter-hero-content">
        <span className="slaughter-kicker">
          <SafetyCertificateOutlined />
          MUNICIPAL ECONOMIC ENTERPRISE OFFICE — SLAUGHTERHOUSE
        </span>

        <h1>
          Safe handling for{" "}
          <span>livestock processing.</span>
        </h1>

        <p>
          The Municipal Slaughterhouse provides an organized facility for
          the slaughtering and dressing of livestock such as hogs, cattle,
          cows, and goats. It supports clean, orderly, and properly managed
          meat-processing activities for the local community.
        </p>

        <div className="slaughter-points">
         
        </div>

        <div className="slaughter-hero-buttons">
          <button
            className="slaughter-get-started-button"
            type="button"
            onClick={onGetStarted}
          >
            <RocketOutlined />

            <span className="slaughter-button-label">
              Go To Homepage
            </span>

            <ArrowRightOutlined />
          </button>

          <button
            className="slaughter-hero-more-info"
            type="button"
            onClick={onLearnMore}
          >
            <InfoCircleOutlined />

            <span className="slaughter-button-label">
             Explore Services
            </span>

            <ArrowDownOutlined />
          </button>

          <button
            className="slaughter-hero-fees-button"
            type="button"
            onClick={onViewFees}
          >
            <DollarOutlined />

            <span className="slaughter-button-label">
              View Slaughter Fees
            </span>

            <ArrowDownOutlined />
          </button>
        </div>
      </div>

      {/* =====================================================================
          IMAGE GALLERY
          ===================================================================== */}

      <div className="slaughter-gallery">
        <img
          src={image.source}
          alt={image.alt}
          className="slaughter-gallery-image"
        />

        <button
          className="slaughter-gallery-arrow gallery-arrow-left"
          type="button"
          onClick={onPrevious}
          aria-label="Previous slaughterhouse image"
        >
          <LeftOutlined />
        </button>

        <button
          className="slaughter-gallery-arrow gallery-arrow-right"
          type="button"
          onClick={onNext}
          aria-label="Next slaughterhouse image"
        >
          <RightOutlined />
        </button>

        <div
          className="slaughter-gallery-dots"
          role="tablist"
          aria-label="Slaughterhouse gallery images"
        >
          {HERO_IMAGES.map((heroImage, index) => (
            <button
              key={heroImage.alt}
              className={index === heroIndex ? "active" : ""}
              type="button"
              onClick={() => onSelectImage(index)}
              aria-label={`Show ${heroImage.alt}`}
              aria-selected={index === heroIndex}
            />
          ))}
        </div>

       
      </div>
    </section>
  );
};

// =============================================================================
// OVERVIEW SECTION
// =============================================================================

const OverviewSection = () => {
  return (
    <section className="slaughter-overview">
      <span className="slaughter-section-label">
        <InfoCircleOutlined />
        ABOUT THE SLAUGHTERHOUSE
      </span>

      <h2>
        Supporting safe and orderly{" "}
        <span>livestock processing.</span>
      </h2>

      <p>
        The municipal slaughterhouse serves as a designated facility where
        livestock can be processed in an organized and sanitary environment.
        MEEO helps support the proper administration and collection of
        applicable slaughterhouse fees and the orderly use of the facility.
      </p>

      <div className="slaughter-overview-grid">
        <div>
          <ShopOutlined />

          <strong>
            Livestock processing
          </strong>

          <small>
            Facility use for hogs, cattle, cows, and goats.
          </small>
        </div>

        <div>
          <SafetyCertificateOutlined />

          <strong>
            Sanitary operations
          </strong>

          <small>
            Supporting clean and responsible handling practices.
          </small>
        </div>

        <div>
          <BankOutlined />

          <strong>
            Managed facility
          </strong>

          <small>
            Organized use and administration of the slaughterhouse.
          </small>
        </div>
      </div>
    </section>
  );
};

// =============================================================================
// FEE SCHEDULE SECTION
// =============================================================================

const FeeScheduleSection = () => {
  return (
    <section className="slaughter-fees" aria-labelledby="slaughter-fees-title">
      <div className="slaughter-fees-header">
        <div>
          <span className="slaughter-section-label">
            <DollarOutlined />
             SLAUGHTER FEE AND CHARGES 
          </span>

          <h2 id="slaughter-fees-title">
            Slaughterhouse <span>fees and charges.</span>
          </h2>
        </div>

        <p>
          Applicable charges for livestock processing, inspection, facility
          use, and related services. Confirm current rates with the
          Municipal Slaughterhouse Office before bringing livestock.
        </p>
      </div>

      <div className="slaughter-fees-grid">
        {SLAUGHTER_FEES.map((fee) => (
          <article className="slaughter-fee-card" key={fee.animal}>
            <div className="slaughter-fee-card-header">
              <div>
                <h3>{fee.animal}</h3>
                <span>{fee.note}</span>
              </div>
              <DollarOutlined />
            </div>

            <div className="slaughter-fee-table-wrap">
              <table className="slaughter-fee-table">
                <tbody>
                  {fee.rows.map(([label, value]) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

// =============================================================================
// SERVICES SECTION
// =============================================================================

const ServicesSection = () => {
  const services = [
    {
      icon: <MedicineBoxOutlined />,
      title: "Slaughtering Services",
      description:
        "Provides a designated facility where livestock may be slaughtered in an orderly and properly managed environment.",
    },
    {
      icon: <SafetyCertificateOutlined />,
      title: "Dressing and Meat Handling",
      description:
        "Supports the proper dressing and handling of slaughtered animals while maintaining cleanliness within the facility.",
    },
    {
      icon: <FileProtectOutlined />,
      title: "Inspection and Compliance",
      description:
        "Supports compliance with applicable meat-safety, sanitation, and livestock-processing requirements.",
    },
    {
      icon: <DollarOutlined />,
      title: "Slaughterhouse Fee Collection",
      description:
        "MEEO is responsible for collecting and recording applicable slaughterhouse fees and ensuring proper payment.",
    },
    {
      icon: <ClockCircleOutlined />,
      title: "Facility Scheduling",
      description:
        "Helps organize the use of the facility and coordinate slaughterhouse activities based on applicable schedules.",
    },
    {
      icon: <TeamOutlined />,
      title: "Community Support",
      description:
        "Provides an organized facility that supports local livestock raisers, meat vendors, buyers, and consumers.",
    },
  ];

  return (
    <section className="slaughter-services">
      <div className="slaughter-services-header">
        <span className="slaughter-section-label">
          <ShopOutlined />
          SLAUGHTERHOUSE SERVICES
        </span>

        <h2>
          Services designed for{" "}
          <span>safe and organized operations.</span>
        </h2>

        <p>
          The municipal slaughterhouse supports several activities involved
          in livestock processing, facility administration, sanitation, and
          compliance.
        </p>
      </div>

      <div className="slaughter-services-grid">
        {services.map((service) => (
          <article
            className="slaughter-service-card"
            key={service.title}
          >
            <div className="slaughter-service-icon">
              {service.icon}
            </div>

            <div className="slaughter-service-content">
              <h3>{service.title}</h3>

              <p>{service.description}</p>
            </div>

            <CheckCircleOutlined className="slaughter-service-check" />
          </article>
        ))}
      </div>
    </section>
  );
};

// =============================================================================
// INFORMATION SECTION
// =============================================================================

const InformationSection = () => {
  return (
    <section className="slaughter-information">
      <div className="slaughter-information-inner">
        <div className="slaughter-information-content">
          <span className="slaughter-section-label">
            <InfoCircleOutlined />
            IMPORTANT INFORMATION
          </span>

          <h2>
            Before using the{" "}
            <span>slaughterhouse.</span>
          </h2>

          <p>
            Requirements, applicable fees, operating schedules, and
            slaughterhouse procedures may depend on the current rules and
            policies of the municipality. For the most accurate and updated
            information, coordinate directly with the MEEO or the
            Municipal Slaughterhouse Office.
          </p>
        </div>

        <div className="slaughter-information-list">
          <div>
            <ClockCircleOutlined />

            <div>
              <strong>Operating Schedule</strong>

              <span>
                Confirm the current operating days and hours before bringing
                livestock to the facility.
              </span>
            </div>
          </div>

          <div>
            <DollarOutlined />

            <div>
              <strong>Applicable Fees</strong>

              <span>
                Confirm current slaughterhouse fees and payment procedures
                with the responsible office.
              </span>
            </div>
          </div>

          <div>
            <FileProtectOutlined />

            <div>
              <strong>Requirements</strong>

              <span>
                Ask about required documents, livestock requirements, and
                applicable inspection procedures.
              </span>
            </div>
          </div>

          <div>
            <SafetyCertificateOutlined />

            <div>
              <strong>Facility Regulations</strong>

              <span>
                Follow the sanitation, safety, handling, and facility-use
                rules implemented by the slaughterhouse.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// =============================================================================
// EXPORT
// =============================================================================

export default Slaughter;