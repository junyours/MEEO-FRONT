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
} from "@ant-design/icons";

import Footer from "./Footer";

import Market1 from "../assets/Market1.jpg";
import meeoLogo from "../assets/logo_meeo.png";
import hog from "../assets/paa_baboy.jpg";
import pork from "../assets/pork belly.jpg";
import beef from "../assets/images/baka_unod.jpg";
import chicken from "../assets/whole_chicken.jpg";
import liver from "../assets/liver.jpg";

import "./Slaughter.css";

// =============================================================================
// CONSTANTS
// =============================================================================

const HERO_IMAGES = [
  {
    source: Market1,
    alt: "Market Layout",
  },
  {
    source: hog,
    alt: "Pork Products",
  },
  {
    source: pork,
    alt: "Fresh Pork",
  },
  {
    source: beef,
    alt: "Beef Products",
  },
  {
    source: chicken,
    alt: "Chicken Products",
  },
  {
    source: liver,
    alt: "Fresh Liver",
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

  const goToMarket = () => {
    navigate("/");
  };

  const goToSlaughter = () => {
    navigate("/slaughter");
  };

  const goToWharf = () => {
    navigate("/wharf");
  };

  // ---------------------------------------------------------------------------
  // Hero Gallery
  // ---------------------------------------------------------------------------

  const changeHero = (direction) => {
    setHeroIndex((currentIndex) => {
      const nextIndex =
        (currentIndex + direction + HERO_IMAGES.length) %
        HERO_IMAGES.length;

      return nextIndex;
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
      {/* Brand */}
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

      {/* Navigation Links */}
      <div className="enterprise-nav-links">
        <button
          className="enterprise-nav-link"
          type="button"
          onClick={onMarket}
        >
          Market
        </button>

        <button
          className="enterprise-nav-link active"
          type="button"
          onClick={onSlaughter}
        >
          Slaughter
        </button>

        <button
          className="enterprise-nav-link"
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
      className="enterprise-hero slaughter-hero"
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

      <div className="enterprise-hero-content">
        <span className="enterprise-kicker">
          <SafetyCertificateOutlined />
          MUNICIPAL SLAUGHTERHOUSE
        </span>

        <h1>
          Safe handling for{" "}
          <span>livestock processing.</span>
        </h1>

        <p>
          The municipal slaughterhouse is where the
          slaughtering and dressing of animals such as
          cattle, cows, hogs, and goats can be carried out
          in an orderly and properly managed facility for
          the community.
        </p>

        {/* Key Features */}
        <div className="enterprise-points">
          <span>
            <CheckCircleOutlined />
            Cattle and cows
          </span>

          <span>
            <CheckCircleOutlined />
            Hogs and goats
          </span>

          <span>
            <CheckCircleOutlined />
            Sanitary operations
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
          aria-label="Previous slaughterhouse image"
        >
          <LeftOutlined />
        </button>

        {/* Next */}
        <button
          className="gallery-arrow gallery-arrow-right"
          type="button"
          onClick={onNext}
          aria-label="Next slaughterhouse image"
        >
          <RightOutlined />
        </button>

        {/* Gallery Indicators */}
        <div
          className="hero-gallery-dots"
          role="tablist"
          aria-label="Slaughterhouse gallery images"
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
        SLAUGHTERHOUSE SERVICES
      </span>

      {/* Heading */}
      <h2>
        Responsible processing for{" "}
        <span>safe local food supply.</span>
      </h2>

      {/* Description */}
      <p>
        MEEO supports the orderly use of the municipal
        slaughterhouse so livestock processing can be
        coordinated with sanitation, inspection,
        scheduling, and responsible facility management.
      </p>

      {/* Service Cards */}
      <div className="enterprise-overview-grid">
        <div>
          <ShopOutlined />

          <strong>
            Animal processing
          </strong>

          <small>
            For cattle, cows, hogs, and goats
          </small>
        </div>

        <div>
          <SafetyCertificateOutlined />

          <strong>
            Sanitary facility
          </strong>

          <small>
            Supporting clean and safe operations
          </small>
        </div>

        <div>
          <BankOutlined />

          <strong>
            Managed scheduling
          </strong>

          <small>
            Organized use of the facility
          </small>
        </div>
      </div>
    </section>
  );
};

export default Slaughter;