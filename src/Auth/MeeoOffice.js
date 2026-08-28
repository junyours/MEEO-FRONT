import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Api";
import {
  ArrowDownOutlined,
  ArrowRightOutlined,
  BankOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  ReloadOutlined,
  RightOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import Footer from "./Footer";
import EnterpriseNavbar from "./EnterpriseNavbar";
import marketImage from "../assets/Market1.jpg";

import wharfImage from "../assets/Fishport.jpg";
import meeoProfilePhoto from "../assets/logo_meeo.png";
import logo_opol from "../assets/logo_Opol.png";
import bag_ong_Opol from "../assets/bag-ong_opol.jpg";
import nathanielAba from "../assets/TanixProf.jpg";
import dean from "../assets/dean.jpg";
import myranie from "../assets/myranie.png";
import mera from "../assets/mera.jpg";
import shirley from "../assets/shirley.png";
import amado from "../assets/amado.png";
import piti from "../assets/piti.png";
import marefi from "../assets/marefi.png";
import oliver from "../assets/oliver.png";
import bernie from "../assets/bernie.png";
import jonathan from "../assets/jonathan.png";
import joefel from "../assets/joefel.png";
import jailyn from "../assets/jailyn.png";
import danCraig from "../assets/danCraig.png";
import payla from "../assets/payla.png";
import bendix from "../assets/bendix.png";
import SirIan from "../assets/SirIan.png";
import Mayor from "../assets/Mayor.png";
import laguitin from "../assets/Laguitin.png";
import daniel from "../assets/Daniel.png";
import jojo from "../assets/jojo.png";
import ronnie from "../assets/ronnie.png";
import marisa from "../assets/marisa.png";
import rabanes from "../assets/rabanes.png";
import noel from "../assets/noel.png";
import nancy from "../assets/nancy.png";
import daanoy from "../assets/daanoy.png";
import gil from "../assets/gil.png";
import nangcas from "../assets/nangcas.png";
import wharfLogo from "../assets/Logo_Wharf.jpg";
import slaughter from "../assets/slaughter.jpg";
import pantalan from "../assets/pantalan.jpg";
import "./MeeoOffice.css";

const galleryImages = [
  { source: bag_ong_Opol, alt: "Bag-ong Opol ", fit: "cover" },
  { source: marketImage, alt: "Public market", fit: "cover" },

  { source: slaughter, alt: "Municipal slaughterhouse", fit: "cover" },
  { source: pantalan, alt: "Pantalan", fit: "cover" },

  { source: meeoProfilePhoto, alt: "Meeo Office", fit: "contain" },
  { source: logo_opol, alt: "Opol Logo", fit: "contain" },
  { source: wharfLogo, alt: "Wharf Logo", fit: "contain" },



];

const enterpriseSummaries = [
  {
    title: "Opol Public Market",
    label: "MARKET",
    description: "Manages vendors, stalls, collections, rentals, and daily market operations.",
    icon: ShopOutlined,
    path: "/market",
    color: "#1769e0",
    background: "#eaf2ff",
  },
  {
    title: "Slaughterhouse",
    label: "SLAUGHTERHOUSE",
    description: "Supports orderly livestock processing through sanitation, inspection, and scheduling.",
    icon: SafetyCertificateOutlined,
    path: "/slaughter",
    color: "#d25b43",
    background: "#fff1ed",
  },
  {
    title: "Wharf",
    label: "WHARF",
    description: "Supports fish landing, local fish trading, and responsible access to the port.",
    icon: BankOutlined,
    path: "/wharf",
    color: "#16845d",
    background: "#e8f7f0",
  },
];

const sharedFunctions = [
  
 
  { icon: FileTextOutlined, title: "Collection and Revenue Administration", 
    description: "Issues official receipts for market stall rentals, berthing fees, and other applicable municipal charges. Issue cash tickets for transient vendors, parking fees, entrance fees, pay toilets and the use of government facilities. Ensure accurate recording,reconciliation, and timely remittance of all collectors. Maintain complete and updated records of daily collections and outstanding account." },
  { icon: BankOutlined, title: "Management of Municipal Facilities",
     description: "Administers and supervises the use of public markets, parking areas, government facilities, docking/berthing areas, slaughterhouse facilities, and other income-generating municipal properties. Establish and implement rules and procedures for the proper, safe, and efficient use of municipal facilities. Monitor facility conditions and recommend maintenance, rehabilitation, or improvement projects." },
  { icon: TeamOutlined, title: "Vendor and Business Regulation", 
    description: "Registers and monitors transient vendors and other temporary users of municipal spaces. Ensure compliance with applicable market rules, sanitary regulations, zoning requirements, and local ordinances. Coordinate with other municipal offices in addressing violations, complaints, and unauthorized use of municipal facilities." },
  { icon: CheckCircleOutlined, title: "Planning, Monitoring, and Revenue Enhancement", 
    description: "Develops measures to improve facility utilization and profitability of municipal economic enterprises. Prepare periodic reports on occupancy, collections, areas, facility utilization, and enterprise performance. Recommend appropriate fees, rental rates, policies, and operational improvements based on applicable laws, ordinances, and market conditions. Identify opportunities for new or improved municipal economic enterprises and revenue-generating activities. " },
 
];

const governmentServiceDetails = [
  "Issuance and renewal of contracts of lease",
  "Acceptance of market stall and open-space applications",
  "Issuance of receipts for market stall rental payments",
  "Issuance of cash tickets to transient vendors",
  "Issuance of cash tickets for users of government facilities",
  "Issuance of cash tickets for parking fees",
  "Issuance of receipts for berthing fees",
  "Issuance of cash tickets for entrance fees",
  "Issuance of receipts for slaughterhouse operations",
];

const organizationalChart = {
  mayor: { fullname: "Hon. Atty. Jayfrancis D. Bago", name: "Municipal Mayor", item: "Municipality of Opol, Misamis Oriental", photo: Mayor },
  head: { name: "Ariel Brian Y. Ortigoza", item: "Economist III", role: "Municipal Economic Enterprise Officer-Designate", photo: SirIan },
  divisions: [
    {
      role: "Collection Incharge",
      name: "SHIRLEY C. CENTILLAS",
      item: "MARKET SUPERVISOR I",
      photo: shirley,
      staff: [
        { role: "Market Fees Collector", item: "Revenue Collection Clerk I", name: "BENDIX B. GOLLOSO", photo: bendix },
        { role: "Slaughter House Fees Collector", item: "Meter Reader", name: "JONATHAN I. DABLIO", photo: jonathan },
        { role: "Collect Sukay For Ambulant Vendors/Parking And Toll Fees", item: "Admin. Aide I", name: "JOEFEL P. LAGUTIN", photo: laguitin },
        { role: "Wharf Incharge And Collect Fishport Fees", item: "Watchman I", name: "Daniel O. Mag-away", photo: daniel },
        { role: "Assist In Market Fees Collection", item: "Job Order", name: "Dan Craig Campaner", photo: danCraig },
        { role: "Assist In Slaughterhouse Fees Collection", item: "Job Order", name: "Mark Jordan", photo: payla },
        { role: "Assist In Parking And Toll Fees", item: "Job Order", name: "Joselito Llena", photo: jojo },
         
        

  

      ],
    },
    {
      role: "Market Operations Incharge",
      name: "Jailyne Jane G. Cartagena",
      item: "Market Specialist II",
      photo: jailyn,
      staff: [
        { role: "Market Maintenance Personnel", item: "Admin. Aide III", name: "Oliver Baculina", photo: oliver },
        { role: "Parking Area Incharge", item: "Admin. Aide III", name: "Bernie Vacalares", photo: bernie },
        { role: "Watchman ", item: "Job Order", name: "Ronnie Barangot", photo: ronnie },
        { role: "Sweeper/Collect Pay Toilet Fees ", item: "Job Order", name: "Marisa Adatan	", photo: marisa },
        { role: "Watchman ", item: "Job Order", name: "Angelito Nangcas	", photo: nangcas },
        { role: "Utility Worker/Collect Pay Toilet Fees", item: "Job Order", name: "Marife Jabla", photo: marefi },
        { role: "Sweeper/Collect Pay Toilet Fees", item: "Job Order", name: "Eleasita Rabanes	", photo: rabanes },
        { role: "Utility And Maintenance Personnel", item: "Job Order", name: "Jofel Daanoy	", photo: joefel },
        { role: "Utility/Watchman-Wharf", item: "Job Order", name: "Gil Bantasan	", photo: gil },
        { role: "Assist In The Issuance Of Cash Ticket/Utility-Wharf", item: "Job Order", name: "Nancy Actub	", photo: nancy },
        { role: "Utility And Maintenance-Wharf", item: "Job Order", name: "Noel Yonson", photo: noel },
        { role: "Watchman-Wharf", item: "Job Order", name: "Raul Daanoy", photo: daanoy },






      ],
    },
    {
      role: "Records Section Incharge",
      name: "MELCHORA G. HANOYAN",
      item: "Admin. Aide III",
      photo: piti,
      staff: [
        { role: "Encoder/Office Clerk", item: "Job Order", name: "Myranie Yaid", photo: myranie },
        { role: "Messenger", item: "Job Order", name: "Amado Cortes", photo: amado },
        { role: "Encoder-Wharf", item: "Job Order", name: "Mera Cagatin", photo: mera },
         { role: "Website Developer/Encoder", item: "Job Order IT", name: "Nathaniel Aba", photo: nathanielAba },
        { role: "Assist In Market Fees Collection/Website Developer", item: "Job Order IT", name: "Dean Francis Quimanhan", photo: dean },
     
      ],
    },
    
  ],
};

const MeeoOffice = () => {
  const navigate = useNavigate();
  const activitiesRef = useRef(null);
  const organizationRef = useRef(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState("");
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const galleryImage = galleryImages[galleryIndex];

  const changeGalleryImage = (direction) => {
    setGalleryIndex((currentIndex) => (
      (currentIndex + direction + galleryImages.length) % galleryImages.length
    ));
  };

  const scrollToEnterprises = () => {
    document.querySelector(".meeo-office-enterprises")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToOfficeMembers = () => {
    organizationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      : date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const loadActivities = async () => {
    try {
      setActivitiesLoading(true);
      setActivitiesError("");
      const response = await api.get("/office-activities");
      if (response.data?.success === false) {
        throw new Error(response.data.message || "Unable to load activities.");
      }

      const loadedActivities = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setActivities(loadedActivities);
      setSelectedActivity((currentActivity) => currentActivity || loadedActivities[0] || null);
      setSelectedImageIndex(0);
    } catch (error) {
      console.error("Failed to load MEEO activities:", error);
      setActivities([]);
      setSelectedActivity(null);
      setActivitiesError("Office activities are temporarily unavailable.");
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleSelectActivity = (activity) => {
    setSelectedActivity(activity);
    setSelectedImageIndex(0);
  };

  const handleActivityImageNavigation = (direction) => {
    const imageCount = getActivityImages(selectedActivity).length;
    setSelectedImageIndex((currentIndex) => (
      (currentIndex + direction + imageCount) % imageCount
    ));
  };

  useEffect(() => {
    loadActivities();
  }, []);

  return (
    <div className="meeo-office-page">
      <EnterpriseNavbar />

      <main>
        <section className="meeo-office-hero" style={{ backgroundImage: `url(${galleryImage.source})` }}>
          <div className="meeo-office-hero-inner">
            <div className="meeo-office-hero-content">
              <span className="meeo-office-eyebrow"><SafetyCertificateOutlined /> MUNICIPAL ECONOMIC ENTERPRISE OFFICE</span>
              <h1>Managing public enterprises for a stronger <span>local economy.</span></h1>
              <p className="meeo-office-hero-description">
              The Municipal Economic Enterprise Office (MEEO) shall manage, administer, regulate, and develop the municipality's public markets,
          commercial spaces, parking areas, berthing facilities, slaughterhouse, and other income-generating government facilities;collect and account for 
          authorized fees and rentals; ensure compliance with applicable laws and ordinances; and undertake measures to improve public service delivery, facility
          utilization, and locally generated revenues.
              </p>
              <div className="meeo-office-hero-points">
            
              </div>
              <div className="meeo-office-hero-actions">
           
                <button className="meeo-office-hero-action meeo-office-hero-action-secondary" type="button" onClick={scrollToEnterprises}>
                  <InfoCircleOutlined /> Exlpore Enterprises <ArrowDownOutlined />
                </button>
                <button className="meeo-office-hero-action meeo-office-hero-action-secondary" type="button" onClick={scrollToOfficeMembers}>
                  <TeamOutlined /> View Organizational Structure <ArrowDownOutlined />
                </button>
              </div>
            </div>

            <div className="meeo-office-hero-gallery">
              <img className={`meeo-office-gallery-image meeo-office-gallery-image-${galleryImage.fit}`} src={galleryImage.source} alt={galleryImage.alt} />
              <button className="meeo-office-gallery-arrow meeo-office-gallery-arrow-left" type="button" onClick={() => changeGalleryImage(-1)} aria-label="Previous MEEO image"><LeftOutlined /></button>
              <button className="meeo-office-gallery-arrow meeo-office-gallery-arrow-right" type="button" onClick={() => changeGalleryImage(1)} aria-label="Next MEEO image"><RightOutlined /></button>
              <div className="meeo-office-gallery-dots" aria-label="MEEO gallery images">
                {galleryImages.map((image, index) => (
                  <button className={`meeo-office-gallery-dot ${index === galleryIndex ? "meeo-office-gallery-dot-active" : ""}`} key={image.alt} type="button" onClick={() => setGalleryIndex(index)} aria-label={`Show ${image.alt}`} aria-current={index === galleryIndex} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="meeo-office-section meeo-office-enterprises" aria-labelledby="meeo-office-enterprise-heading">
          <div className="meeo-office-section-heading">
           
            <h2 id="meeo-office-enterprise-heading">One office, three essential enterprises.</h2>
            <p>Explore how each MEEO enterprise serves the community and supports locally generated revenue.</p>
          </div>
          <div className="meeo-office-enterprise-grid">
            {enterpriseSummaries.map((enterprise) => {
              const Icon = enterprise.icon;
              return (
                <button className="meeo-office-enterprise-card" key={enterprise.path} type="button" onClick={() => navigate(enterprise.path)} style={{ borderTopColor: enterprise.color }}>
                  <span className="meeo-office-enterprise-icon" style={{ color: enterprise.color, background: enterprise.background }}><Icon /></span>
                  <span className="meeo-office-card-label" style={{ color: enterprise.color }}>{enterprise.label}</span>
                  <strong className="meeo-office-card-title">{enterprise.title}</strong>
                  <span className="meeo-office-card-description">{enterprise.description}</span>
                  <span className="meeo-office-card-link" style={{ color: enterprise.color }}>Explore enterprise <ArrowRightOutlined /></span>
                </button>
              );
            })}
          </div>
        </section>

     

        <section className="meeo-office-section meeo-office-functions" aria-labelledby="meeo-office-functions-heading">
          <div className="meeo-office-section-heading">
            <span className="meeo-office-eyebrow"><InfoCircleOutlined /> GOVERNMENT SERVICES</span>
            <h2 id="meeo-office-functions-heading">Delivering better public services through accountable management.</h2>
            <p>Explore the core government services delivered by the Municipal Economic Enterprise Office.</p>
          </div>
          <div className="meeo-office-function-grid">
            {sharedFunctions.map((item) => {
              const Icon = item.icon;
              return <article className="meeo-office-function-card" key={item.title}><Icon /><h3>{item.title}</h3><p>{item.description}</p></article>;
            })}
          </div>
          <article className="meeo-office-service-details-card">
            <div className="meeo-office-service-details-heading">
              <span className="meeo-office-service-details-icon"><FileTextOutlined /></span>
              <div>
                <span className="meeo-office-card-label">SERVICE TRANSACTIONS</span>
                <h3>Government services provided by the MEEO</h3>
                <p>Services and transactions available to the public through the Municipal Economic Enterprise Office.</p>
              </div>
            </div>
            <ul className="meeo-office-service-details-list">
              {governmentServiceDetails.map((service) => (
                <li key={service}><CheckCircleOutlined /> <span>{service}</span></li>
              ))}
            </ul>
          </article>
        </section>

        <section className="meeo-office-section meeo-office-activities" ref={activitiesRef} aria-labelledby="meeo-office-activities-heading">
          <div className="meeo-office-section-heading">
            <span className="meeo-office-eyebrow"><CalendarOutlined /> MEEO ACTIVITIES</span>
            <h2 id="meeo-office-activities-heading">Life across MEEO enterprises.</h2>
            <p>Explore announcements, programs, and community activities from the MEEO office.</p>
          </div>
          {activitiesLoading && (
            <div className="meeo-office-activities-state" role="status">
              <CalendarOutlined />
              <strong>Loading activities...</strong>
              <span>Please wait while we check for the latest updates.</span>
            </div>
          )}
          {!activitiesLoading && activitiesError && (
            <div className="meeo-office-activities-state meeo-office-activities-state-error" role="alert">
              <InfoCircleOutlined />
              <strong>Activities unavailable</strong>
              <span>{activitiesError} Please try again.</span>
              <button type="button" onClick={loadActivities}>
                <ReloadOutlined />
                Try Again
              </button>
            </div>
          )}
          {!activitiesLoading && !activitiesError && activities.length === 0 && (
            <div className="meeo-office-activities-state" role="status">
              <CalendarOutlined />
              <strong>No Activity Right Now</strong>
              <span>New announcements and community activities will appear here when published.</span>
            </div>
          )}
          {!activitiesLoading && !activitiesError && activities.length > 0 && (
            <div className="meeo-office-activities-layout">
              <div className="meeo-office-activities-list">
                {activities.map((activity) => (
                  <button className={`meeo-office-activity-list-item ${selectedActivity?.id === activity.id ? "active" : ""}`} key={activity.id} type="button" onClick={() => handleSelectActivity(activity)}>
                    <img src={activity.image} alt="" />
                    <span><strong>{activity.title}</strong><small>{activity.activity_type}</small></span>
                  </button>
                ))}
              </div>
              <div className="meeo-office-activity-gallery">
                {selectedActivity && (
                  <>
                    <div className="meeo-office-activity-main-image">
                      <img src={getActivityImages(selectedActivity)[selectedImageIndex]} alt={selectedActivity.title} />
                      {getActivityImages(selectedActivity).length > 1 && (
                        <>
                          <button className="meeo-office-activity-gallery-arrow meeo-office-activity-gallery-arrow-left" type="button" onClick={() => handleActivityImageNavigation(-1)} aria-label="Previous activity image"><LeftOutlined /></button>
                          <button className="meeo-office-activity-gallery-arrow meeo-office-activity-gallery-arrow-right" type="button" onClick={() => handleActivityImageNavigation(1)} aria-label="Next activity image"><RightOutlined /></button>
                        </>
                      )}
                    </div>
                    <div className="meeo-office-activity-details">
                      <span>{formatActivityDate(selectedActivity.activity_date)}</span>
                      <h3>{selectedActivity.title}</h3>
                      <p>{selectedActivity.description}</p>
                    </div>
                    <div className="meeo-office-activity-thumbnails">
                      {getActivityImages(selectedActivity).map((image, index) => (
                        <button className={index === selectedImageIndex ? "active" : ""} key={`${image}-${index}`} type="button" onClick={() => setSelectedImageIndex(index)} aria-label={`View image ${index + 1}`}><img src={image} alt="" /></button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
  <section className="meeo-office-section meeo-office-organization" ref={organizationRef} aria-labelledby="meeo-office-organization-heading">
          <div className="meeo-office-section-heading">
            <span className="meeo-office-eyebrow"><TeamOutlined /> OFFICE STRUCTURE</span>
            <h2 id="meeo-office-organization-heading">MEEO Organizational Structure</h2>
            <p>Meet the officers and staff responsible for delivering coordinated public enterprise services.</p>
          </div>
          <div className="meeo-office-org-chart">
            <div className="meeo-office-org-canvas">
            <div className="meeo-office-org-mayor">
              <img className="meeo-office-org-avatar meeo-office-org-avatar-mayor" src={organizationalChart.mayor.photo} alt={organizationalChart.mayor.name} />
              <strong className="meeo-office-org-mayor-fullname">{organizationalChart.mayor.fullname}</strong>
              <strong>{organizationalChart.mayor.name}</strong>
              <span className="meeo-office-org-item">{organizationalChart.mayor.item}</span>
              <span className="meeo-office-org-role">{organizationalChart.mayor.role}</span>
            </div>
            <div className="meeo-office-org-mayor-connector" aria-hidden="true" />
            <div className="meeo-office-org-head">
              <img className="meeo-office-org-avatar meeo-office-org-avatar-head" src={organizationalChart.head.photo} alt={organizationalChart.head.name} />
              <strong>{organizationalChart.head.name}</strong>
              <span className="meeo-office-org-item">{organizationalChart.head.item}</span>
              <span className="meeo-office-org-role">{organizationalChart.head.role}</span>
            </div>
            <div className="meeo-office-org-connector" aria-hidden="true" />
            <div className="meeo-office-org-divisions">
              {organizationalChart.divisions.map((division) => (
                <div className="meeo-office-org-division" key={division.role}>
                  <div className="meeo-office-org-lead">
                    <img className="meeo-office-org-avatar" src={division.photo} alt={division.name} />
                    <strong>{division.name}</strong>
                    <span className="meeo-office-org-item">{division.item}</span>
                    <span className="meeo-office-org-role">{division.role}</span>
                  </div>
                  <div className="meeo-office-org-staff">
                    {division.staff.map((staffMember) => (
                      <div className="meeo-office-org-staff-card" key={staffMember.role}>
                        <img className="meeo-office-org-avatar" src={staffMember.photo} alt={staffMember.name} />
                        <strong>{staffMember.name}</strong>
                        <span className="meeo-office-org-item">{staffMember.item}</span>
                        <span className="meeo-office-org-role">{staffMember.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default MeeoOffice;
