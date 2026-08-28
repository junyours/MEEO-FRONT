
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowDownOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  BankOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  RightOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  TeamOutlined,
  TruckOutlined,
  ReconciliationOutlined,
} from "@ant-design/icons";

import Footer from "./Footer";
import EnterpriseNavbar from "./EnterpriseNavbar";
import tambakol from "../assets/tambakol.jpg";
import yellowfin from "../assets/yellowFin.png";

import galunggong from "../assets/galunggong.jpg";

import tamban from "../assets/tamban.jpg";
import pantalan from "../assets/pantalan.jpg";

import fish from "../assets/Fish.jpg";

import LBB from "../assets/LBB.jpg";

import "./Wharf.css";

// =============================================================================
// HERO IMAGES
// =============================================================================

const HERO_IMAGES = [
  {
    source: fish,
    alt: "Fish",
  },
  {
    source: pantalan,
    alt: "Pantalan",
  },
  {
    source: LBB,
    alt: "Luyongbonbon Fish Port",
  },

  {
    source: galunggong,
    alt: "Fresh Galunggong",
  },

    {
    source: yellowfin,
    alt: "Fresh Yellowfin Tuna",
  },
  {
    source: tambakol,
    alt: "Fresh Tambakol",
  },

  {
    source: tamban,
    alt: "Fresh Tamban",
  },
];

const WHARF_FEES = [
  {
    title: "Stall Fee",
    subtitle: "Per day",
    rows: [
      ["Fish stall", "P50.00"],
      ["Food stall", "P50.00"],
      ["Ambulant vendors", "P20.00"],
    ],
  },
  {
    title: "Unloading Fee",
    subtitle: "Due from fish brokers, traders, and producers",
    rows: [
      ["Per banyera", "P18.00"],
      ["Per tub", "P25.00"],
      ["Big fish (malasugi, liplipan, etc.)", "P20.00 per piece"],
    ],
  },
  {
    title: "Transhipment Fee",
    subtitle: "For fish products transferred at the port",
    rows: [
      ["Per banyera", "P10.00"],
      ["Per tub", "P10.00"],
      ["Big fish (malasugi, liplipan, etc.)", "P20.00 per piece"],
    ],
    note: "Fish producers are exempted from paying the transhipment fee.",
  },
  {
    title: "Berthing Fee / Unholding",
    subtitle: "Per day",
    rows: [
      ["Fish boat", "P100.00"],
      ["Canter / service", "P50.00"],
      ["Light boat / pump boat", "P20.00"],
      ["Speedboat", "P100.00"],
      ["Yacht", "P100.00"],
      ["Transient fishing vessel", "P100.00"],
    ],
  },
  {
    title: "Entrance and Parking Fee",
    subtitle: "Any fraction is considered one 6-hour period",
    rows: [
      ["Heavy vehicles, per 6 hours", "P50.00"],
      ["Light vehicles, per 6 hours", "P30.00"],
      ["Jeep / car / van, per 6 hours", "Rate not provided"],
      ["Pedicab / tricycle, per entrance", "P10.00"],
      ["Motorcycle, per entrance", "P10.00"],
      ["Vehicle sticker, per year", "P1,000.00"],
      ["Cart sticker, per year", "P300.00"],
      ["Motorcycle sticker, per year", "P300.00"],
    ],
    note:
      "Government vehicles are exempted from entrance and parking fees. Producers and local fish traders are exempted when they secure a sticker from the Municipal Treasurer.",
  },
  {
    title: "Entry of Vehicle with Cargoes",
    subtitle: "Per entry",
    rows: [
      ["Heavy vehicles (10-wheelers and above)", "P100.00"],
      ["Light vehicles (6-wheelers)", "P80.00"],
      ["Jeep, pick-up, and other 4-wheelers", "P50.00"],
    ],
  },
  {
    title: "Rental and Other Charges",
    subtitle: "Facility use and basic services",
    rows: [
      ["Office space", "P300.00 / sq. m. / month"],
      ["Land", "P200.00 / sq. m. / month"],
      ["Repairing of fish nets", "P1,500.00 per 5 days"],
      ["Repairing of fish nets beyond 5 days", "P200.00 per day"],
      ["Electricity, separate meter", "P200.00 / office / month"],
      ["Water, separate meter", "P20.00 per day"],
      ["Toilet fee (urinating)", "P3.00"],
      ["Toilet fee (defecating / shower)", "P5.00"],
    ],
  },
  {
    title: "Sharing",
    subtitle: "Distribution per banyera or tub",
    rows: [
      ["Barangay share, every banyera or tub", "P5.00"],
      ["Laborer share, every banyera", "P3.00"],
    ],
  },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const Wharf = () => {
  const navigate = useNavigate();

  const [heroIndex, setHeroIndex] = useState(0);

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const goToHome = () => {
    navigate("/homepage");
  };

  // ---------------------------------------------------------------------------
  // Hero Gallery
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
    document.querySelector(".wharf-overview")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const viewFees = () => {
    document.querySelector(".wharf-fees")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // ---------------------------------------------------------------------------
  // Back To Top
  // ---------------------------------------------------------------------------

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
    <div className="wharf-page">
      {/* =====================================================================
          NAVBAR
          ===================================================================== */}

      <EnterpriseNavbar />

      {/* =====================================================================
          HERO
          ===================================================================== */}

      <HeroSection
        heroIndex={heroIndex}
        onPrevious={() => changeHero(-1)}
        onNext={() => changeHero(1)}
        onSelectImage={setHeroIndex}
        onGetStarted={goToHome}
        onLearnMore={viewServices}
        onViewFees={viewFees}
      />

      {/* =====================================================================
          OVERVIEW / SERVICES
          ===================================================================== */}

      <OverviewSection />

      <FeeScheduleSection />

      {/* =====================================================================
          BOTTOM ACTIONS
          ===================================================================== */}

      <div className="wharf-actions">
        <button
          className="wharf-back-top-button"
          type="button"
          onClick={backToTop}
        >
          <ArrowUpOutlined />
          <span>Back to Top</span>
        </button>

        <button
          className="wharf-bottom-get-started"
          type="button"
          onClick={goToHome}
        >
          <RocketOutlined />
          <span>Go To Homepage</span>
          <ArrowRightOutlined />
        </button>
      </div>

      {/* =====================================================================
          FOOTER
          ===================================================================== */}

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
      className="wharf-hero"
      style={{
        backgroundImage: `
          linear-gradient(
            90deg,
            rgba(12, 28, 49, 0.92),
            rgba(12, 28, 49, 0.35)
          ),
          url(${image.source})
        `,
      }}
    >
      {/* ===================================================================
          HERO CONTENT
          =================================================================== */}

      <div className="wharf-hero-content">
        {/* KICKER */}

        <span className="wharf-kicker">
          <EnvironmentOutlined />
          <span>
            MUNICIPAL ECONOMIC ENTERPRISE OFFICE - FISH PORT
          </span>
        </span>

        {/* HEADING */}

        <h1>
          Supporting our fishing community and{" "}
          <span>local fish trade.</span>
        </h1>

        {/* DESCRIPTION */}

        <p>
          The Opol Fish Port provides essential facilities for
          landing, handling, trading, and distributing fish and
          other aquatic products while supporting local fishers,
          buyers, vendors, traders, and the community.
        </p>

        {/* KEY FEATURES */}

        <div className="wharf-points">
          
        </div>

        {/* HERO ACTIONS */}

        <div className="wharf-hero-buttons">
          <button
            className="wharf-get-started-button"
            type="button"
            onClick={onGetStarted}
          >
            <RocketOutlined />

            <span className="wharf-button-label">
              Go To Homepage
            </span>

            <ArrowRightOutlined />
          </button>

          <button
            className="wharf-hero-more-info"
            type="button"
            onClick={onLearnMore}
          >
            <InfoCircleOutlined />

            <span className="wharf-button-label">
              Explore Services
            </span>

            <ArrowDownOutlined />
          </button>

          <button
            className="wharf-hero-fees-button"
            type="button"
            onClick={onViewFees}
          >
            <DollarOutlined />

            <span className="wharf-button-label">
              View Wharf Fees
            </span>

            <ArrowDownOutlined />
          </button>
        </div>
      </div>

      {/* ===================================================================
          HERO IMAGE GALLERY
          =================================================================== */}

      <div className="wharf-gallery">
        <img
          src={image.source}
          alt={image.alt}
          className="wharf-gallery-image"
        />

        {/* PREVIOUS */}

        <button
          className="wharf-gallery-arrow wharf-gallery-arrow-left"
          type="button"
          onClick={onPrevious}
          aria-label="Previous fish port image"
        >
          <LeftOutlined />
        </button>

        {/* NEXT */}

        <button
          className="wharf-gallery-arrow wharf-gallery-arrow-right"
          type="button"
          onClick={onNext}
          aria-label="Next fish port image"
        >
          <RightOutlined />
        </button>

        {/* GALLERY INDICATORS */}

        <div
          className="wharf-gallery-dots"
          role="tablist"
          aria-label="Fish port gallery images"
        >
          {HERO_IMAGES.map((heroImage, index) => (
            <button
              key={heroImage.alt}
              className={index === heroIndex ? "active" : ""}
              type="button"
              onClick={() => onSelectImage(index)}
              aria-label={`Show ${heroImage.alt}`}
              aria-selected={index === heroIndex}
              role="tab"
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
    <>
      {/* =====================================================================
          MAIN SERVICES
          ===================================================================== */}

      <section className="wharf-overview">
        {/* SECTION LABEL */}

        <span className="wharf-section-label">
          <InfoCircleOutlined />
          FISH PORT SERVICES
        </span>

        {/* HEADING */}

        <h2>
          Supporting Opol's <span>fishing economy.</span>
        </h2>

        {/* DESCRIPTION */}

        <p>
          The Opol Fish Port in Barangay Luyongbonbon provides
          facilities and services that support local fishers,
          fish vendors, buyers, traders, and other fisheries
          stakeholders.
        </p>

        {/* SERVICE CARDS */}

        <div className="wharf-overview-grid">
          {/* SERVICE 1 */}

          <div>
            <ShopOutlined />

            <strong>Fish Landing &amp; Handling</strong>

            <small>
              Provides facilities for fishers to land, unload,
              and properly handle their catch.
            </small>
          </div>

          {/* SERVICE 2 */}

          <div>
            <BankOutlined />

            <strong>Fish Trading</strong>

            <small>
              Supports the buying and selling of fresh fish
              and other aquatic products.
            </small>
          </div>


         

          {/* SERVICE 4 */}

          <div>
            <SafetyCertificateOutlined />

            <strong>Fish Handling &amp; Sanitation</strong>

            <small>
              Promotes proper handling, cleanliness, sanitation,
              and orderly use of fish port facilities.
            </small>
          </div>

         

          
        </div>
      </section>

      {/* =====================================================================
          WHO WE SERVE
          ===================================================================== */}

      <section className="wharf-users">
        <div className="wharf-users-content">
          <span className="wharf-section-label">
            <TeamOutlined />
            WHO WE SERVE
          </span>

          <h2>
            Serving the people behind{" "}
            <span>Opol's fish trade.</span>
          </h2>

          <p>
            The Fish Port connects different groups involved in
            the local fisheries supply chain.
          </p>
        </div>

        <div className="wharf-users-grid">
          {/* FISHERFOLK */}

          <div className="wharf-user-card">
            <ShopOutlined />

            <strong>Fisherfolk</strong>

            <small>
              Bring, land, and handle their catch while
              participating in local fish trade activities.
            </small>
          </div>

          {/* BUYERS & VENDORS */}

          <div className="wharf-user-card">
            <ShopOutlined />

            <strong>Buyers &amp; Vendors</strong>

            <small>
              Connect with local fishers to source fresh
              fish and aquatic products.
            </small>
          </div>

          {/* TRADERS */}

          <div className="wharf-user-card">
            <TruckOutlined />

            <strong>Fish Traders</strong>

            <small>
              Help distribute locally landed fish to markets,
              businesses, and communities.
            </small>
          </div>

          {/* COMMUNITY */}

          <div className="wharf-user-card">
            <TeamOutlined />

            <strong>Local Community</strong>

            <small>
              Benefits from access to fresh seafood and
              a stronger local fisheries economy.
            </small>
          </div>
        </div>
      </section>

      {/* =====================================================================
          HOW THE FISH PORT WORKS
          ===================================================================== */}

      <section className="wharf-process">
        <span className="wharf-section-label">
          <ReconciliationOutlined />
          HOW THE FISH PORT WORKS
        </span>

        <h2>
          From the sea to the <span>local community.</span>
        </h2>

        <p>
          The Fish Port helps move locally caught fish from
          landing to trading and distribution.
        </p>

        <div className="wharf-process-grid">
          {/* STEP 1 */}

          <div className="wharf-process-card">
            <div className="wharf-process-number">01</div>

            <ShopOutlined />

            <strong>Land</strong>

            <small>
              Fishers arrive and bring their catch to the
              fish port.
            </small>
          </div>

          {/* STEP 2 */}

          <div className="wharf-process-card">
            <div className="wharf-process-number">02</div>

            <ShopOutlined />

            <strong>Unload &amp; Handle</strong>

            <small>
              Fish and aquatic products are unloaded and
              handled properly.
            </small>
          </div>

          {/* STEP 3 */}

          <div className="wharf-process-card">
            <div className="wharf-process-number">03</div>

            <ReconciliationOutlined />

            <strong>Trade</strong>

            <small>
              Fishers, buyers, vendors, and traders participate
              in local fish trading.
            </small>
          </div>

          {/* STEP 4 */}

          <div className="wharf-process-card">
            <div className="wharf-process-number">04</div>

            <TruckOutlined />

            <strong>Distribute</strong>

            <small>
              Fresh fish moves toward vendors, markets,
              businesses, and consumers.
            </small>
          </div>
        </div>
      </section>

      {/* =====================================================================
          COMMON FISH
          ===================================================================== */}

      <section className="wharf-catch">
        <div className="wharf-catch-header">
          <span className="wharf-section-label">
            <ShopOutlined />
            LOCAL FISH &amp; AQUATIC PRODUCTS
          </span>

          <h2>
            Examples of <span>local catch.</span>
          </h2>

          <p>
            Examples of fish commonly associated with the
            local fish trade include the following.
          </p>
        </div>

        <div className="wharf-catch-grid">
          {/* BANGUS */}

          <div className="wharf-catch-card">
            <img src={yellowfin} alt="Fresh Yellowfin Tuna" />

            <div>
              <strong>Yellowfin Tuna</strong>
              <small>Fresh tuna</small>
            </div>
          </div>

          {/* GALUNGGONG */}

          <div className="wharf-catch-card">
            <img src={galunggong} alt="Fresh Galunggong" />

            <div>
              <strong>Galunggong</strong>
              <small>Round scad</small>
            </div>
          </div>

          {/* TILAPIA */}

          <div className="wharf-catch-card">
            <img src={tambakol} alt="Fresh Tilapia" />

            <div>
              <strong>Tambakol</strong>
              <small>Freshwater fish</small>
            </div>
          </div>

          {/* TAMBAN */}

          <div className="wharf-catch-card">
            <img src={tamban} alt="Fresh Tamban" />

            <div>
              <strong>Tamban</strong>
              <small>Sardinella</small>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          IMPORTANT INFORMATION
          ===================================================================== */}

      <section className="wharf-information">
        <div className="wharf-information-content">
          <span className="wharf-section-label">
            <InfoCircleOutlined />
            VISITOR INFORMATION
          </span>

          <h2>
            Planning to visit the <span>Fish Port?</span>
          </h2>

          <p>
         For the latest information on fish port fees, operating hours, requirements, and regulations, please coordinate with the Fish Port Office before your visit.
          </p>
        </div>

        <div className="wharf-information-grid">
          {/* LOCATION */}

          <div>
            <EnvironmentOutlined />

            <strong>Location</strong>

            <small>
              Luyongbonbon, Opol, Misamis Oriental
            </small>
          </div>

          {/* FEES */}

          <div>
            <InfoCircleOutlined />

            <strong>Fees &amp; Charges</strong>

            <small>
              Confirm current applicable fees with the
              Fish Port Office.
            </small>
          </div>

       

         
        </div>
      </section>
    </>
  );
};

// =============================================================================
// FEE SCHEDULE
// =============================================================================

const FeeScheduleSection = () => {
  return (
    <section className="wharf-fees" aria-labelledby="wharf-fees-title">
      <div className="wharf-fees-header">
        <span className="wharf-section-label">
          <DollarOutlined />
          FISH PORT FEES AND CHARGES
        </span>

        <h2 id="wharf-fees-title">
          Clear rates for <span>fish port services.</span>
        </h2>

        <p>
          Review the applicable fees for stalls, unloading, transhipment,
          berthing, parking, rentals, and other fish port services.
        </p>
      </div>

      <div className="wharf-fees-grid">
        {WHARF_FEES.map((fee) => (
          <article className="wharf-fee-card" key={fee.title}>
            <div className="wharf-fee-card-header">
              <div>
                <h3>{fee.title}</h3>
                <span>{fee.subtitle}</span>
              </div>
              <DollarOutlined />
            </div>

            <table className="wharf-fee-table">
              <tbody>
                {fee.rows.map(([label, value]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {fee.note && (
              <p className="wharf-fee-note">
                <InfoCircleOutlined />
                <span>{fee.note}</span>
              </p>
            )}
          </article>
        ))}
      </div>

      <div className="wharf-fees-notice">
        <ReconciliationOutlined />
        <p>
          All fees and charges collected shall have an official receipt and/or
          cash ticket. Please confirm current rates and payment procedures with
          the Fish Port Office.
        </p>
      </div>
    </section>
  );
};


export default Wharf;

