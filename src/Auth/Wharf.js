
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowDownOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  BankOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  RightOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
} from "@ant-design/icons";

import Footer from "./Footer";

import meeoLogo from "../assets/logo_meeo.png";

import bangus from "../assets/bangus.jpg";
import galunggong from "../assets/galunggong.jpg";
import tilapia from "../assets/fresh_tilapia.webp";
import tamban from "../assets/tamban.jpg";

import fish from "../assets/Fish.jpg";
import FishPort from "../assets/Fishport.jpg";
import LBB from "../assets/LBB.jpg";

import "./Wharf.css";

// =============================================================================
// CONSTANTS
// =============================================================================

const HERO_IMAGES = [
  {
    source: fish,
    alt: "Fish",
  },
  {
    source: FishPort,
    alt: "Fish Port",
  },
  {
    source: LBB,
    alt: "LBB",
  },
  {
    source: bangus,
    alt: "Fresh Bangus",
  },
  {
    source: galunggong,
    alt: "Fresh Galunggong",
  },
  {
    source: tilapia,
    alt: "Fresh Tilapia",
  },
  {
    source: tamban,
    alt: "Fresh Tamban",
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

  const goToMarket = () => {
    navigate("/");
  };

  const goToSlaughter = () => {
    navigate("/slaughter");
  };

  const goToWharf = () => {
    navigate("/wharf");
  };

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
    document
      .querySelector(".enterprise-overview")
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
    <div className="get-started-page enterprise-detail-page">
      <Navbar
        onMarket={goToMarket}
        onSlaughter={goToSlaughter}
        onWharf={goToWharf}
      />

      <HeroSection
        heroIndex={heroIndex}
        onPrevious={() => changeHero(-1)}
        onNext={() => changeHero(1)}
        onSelectImage={setHeroIndex}
        onGetStarted={goToHome}
        onLearnMore={viewServices}
      />

      <OverviewSection />

      {/* =====================================================================
          BOTTOM ACTIONS
          ===================================================================== */}

      <div className="more-info-actions enterprise-actions">
        <button
          className="back-top-button"
          type="button"
          onClick={backToTop}
        >
          <ArrowUpOutlined />
          Back to Top
        </button>

        <button
          className="bottom-get-started"
          type="button"
          onClick={goToHome}
        >
          <RocketOutlined />
          Get Started
          <ArrowRightOutlined />
        </button>
      </div>

      <Footer />
    </div>
  );
};

// =============================================================================
// NAVBAR
// =============================================================================

const Navbar = ({
  onMarket,
  onSlaughter,
  onWharf,
}) => {
  return (
    <nav
      className="landing-navbar"
      aria-label="Economic enterprises"
    >
      {/* ---------------------------------------------------------------------
          Brand
          --------------------------------------------------------------------- */}

      <div className="landing-brand">
        <div className="brand-logo">
          <img
            src={meeoLogo}
            alt="MEEO Opol logo"
          />
        </div>

        <div className="brand-text">
          <strong>MEEO OPOL</strong>

          <span>
            Municipal Economic Enterprise Office
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
          Navigation
          --------------------------------------------------------------------- */}

      <div className="enterprise-nav-links">
        <button
          className="enterprise-nav-link"
          type="button"
          onClick={onMarket}
        >
          Market
        </button>

        <button
          className="enterprise-nav-link"
          type="button"
          onClick={onSlaughter}
        >
          Slaughter
        </button>

        <button
          className="enterprise-nav-link active"
          type="button"
          onClick={onWharf}
        >
          Wharf
        </button>
      </div>
    </nav>
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
}) => {
  const image = HERO_IMAGES[heroIndex];

  return (
    <section
      className="enterprise-hero wharf-hero"
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
      {/* =====================================================================
          HERO CONTENT
          ===================================================================== */}

      <div className="wharf-enterprise-hero-content">
        <span className="enterprise-kicker">
          <EnvironmentOutlined />
          MUNICIPAL WHARF
        </span>

        <h1>
          Supporting our fishing community and{" "}
          <span>local fish trade.</span>
        </h1>

        <p>
          The municipal Fishport is where fishers
          from Opol bring their catch to land, exchange,
          and sell. It connects the local fishing community
          with buyers, vendors, and families who depend on
          fresh seafood.
        </p>

        {/* Key Features */}
        <div className="enterprise-points">
          <span>
            <CheckCircleOutlined />
            Fish landing and selling
          </span>

          <span>
            <CheckCircleOutlined />
            Community access
          </span>

          <span>
            <CheckCircleOutlined />
            Organized operations
          </span>
        </div>

        {/* Hero Actions */}
        <div className="hero-buttons">
          <button
            className="get-started-button"
            type="button"
            onClick={onGetStarted}
          >
            <RocketOutlined />

            <span className="button-label">
              Get Started
            </span>

            <ArrowRightOutlined />
          </button>

          <button
            className="hero-more-info"
            type="button"
            onClick={onLearnMore}
          >
            <InfoCircleOutlined />

            <span className="button-label">
              Learn More
            </span>

            <ArrowDownOutlined />
          </button>
        </div>
      </div>

      {/* =====================================================================
          HERO IMAGE GALLERY
          ===================================================================== */}

      <div className="enterprise-gallery">
        {/* Main Image */}
        <img
          src={image.source}
          alt={image.alt}
          className="enterprise-gallery-image"
        />

        {/* Previous */}
        <button
          className="gallery-arrow gallery-arrow-left"
          type="button"
          onClick={onPrevious}
          aria-label="Previous wharf image"
        >
          <LeftOutlined />
        </button>

        {/* Next */}
        <button
          className="gallery-arrow gallery-arrow-right"
          type="button"
          onClick={onNext}
          aria-label="Next wharf image"
        >
          <RightOutlined />
        </button>

        {/* Gallery Indicators */}
        <div
          className="hero-gallery-dots"
          role="tablist"
          aria-label="Wharf gallery images"
        >
          {HERO_IMAGES.map((heroImage, index) => (
            <button
              key={heroImage.alt}
              className={
                index === heroIndex
                  ? "active"
                  : ""
              }
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
    <section className="enterprise-overview">
      {/* Section Label */}
      <span className="section-label">
        <InfoCircleOutlined />
        WHARF SERVICES
      </span>

      {/* Heading */}
      <h2>
        A working port for{" "}
        <span>Opol's fishing economy.</span>
      </h2>

      {/* Description */}
      <p>
        MEEO helps maintain the wharf as a useful public
        economic enterprise where local fishers can bring
        in their catch and where the community can access
        fresh fish and seafood.
      </p>

      {/* Service Cards */}
      <div className="enterprise-overview-grid">
        <div>
          <ShopOutlined />

          <strong>
            Fish landing
          </strong>

          <small>
            Receiving catch from local fishers
          </small>
        </div>

        <div>
          <BankOutlined />

          <strong>
            Fish trading
          </strong>

          <small>
            Supporting local buying and selling
          </small>
        </div>

        <div>
          <SafetyCertificateOutlined />

          <strong>
            Managed access
          </strong>

          <small>
            Orderly and responsible use
          </small>
        </div>
      </div>
    </section>
  );
};

export default Wharf;
