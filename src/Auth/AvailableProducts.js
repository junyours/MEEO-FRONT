import React, { useState } from "react";
import { Card, Row, Col, Button } from "antd";
import { 
  FaCarrot, 
  FaFish, 
  FaDrumstickBite, 
  FaBacon, 
  FaAppleAlt, 
  FaCookie, 
  FaGift,
  FaLeaf,
  FaEgg,
  FaShoppingBag
} from "react-icons/fa";

import bangusImg from "../assets/images/bangus.jpg";
import galunggongImg from "../assets/images/galunggong.jpg";
import shrimpImg from "../assets/images/shrimp.jpg";
import tamarongImg from "../assets/images/tamarong.jpg";
import tambanImg from "../assets/images/tamban.jpg";
import fishImg from "../assets/images/tamarong.jpg";
import vegetablesImg from "../assets/images/cabbage.jpg";

import cabbageimg from "../assets/images/cabbage.jpg";
import atsalimg from "../assets/images/atsal.jpg";
import carrotimg from "../assets/images/carrot.jpg";
import potatoimg from "../assets/images/potatos.jpg";
import spinachimg from "../assets/images/spinach.jpg";
import onionsimg from "../assets/images/Onions.jpg";
import eggplantimg from "../assets/images/eggplant.jpg";
import tomatoesimg from "../assets/images/tomatoes.jpg";

import chickenImg from "../assets/images/chicken_wings.jpg";
import chickenbreastImg from "../assets/images/ChickenBreast.jpg";
import chickenthighsImg from "../assets/images/chicken_thighs.jpg";
import chickenwingsImg from "../assets/images/chicken_wings.jpg";
import wholechickenImg from "../assets/images/whole_chicken.jpg";
import chickenliverImg from "../assets/images/chicken_liver.jpg";
import chicken_feet from "../assets/images/chicken_feet.jpg";

import porkImg from "../assets/images/PORK-CHOP.jpg";
import porkChopImg from "../assets/images/PORK-CHOP.jpg";
import porkLoinImg from "../assets/images/pork_ham.jpg";
import porkliverImg from "../assets/images/liver.jpg";
import porkribsImg from "../assets/images/pork_ribs.jpg";
import porkbellyImg from "../assets/images/pork_belly.jpg";
import groundPorkImg from "../assets/images/ground_pork.jpg";
import porkshoulderImg from "../assets/images/paa_baboy.jpg";

import fruitsImg from "../assets/images/grapes.jpg";
import watermelonImg from "../assets/images/watermelon.jpeg";
import papayaImg from "../assets/images/papaya.jpg";
import pineappleImg from "../assets/images/pineapple.jpg";
import orangeImg from "../assets/images/orange.jpg";
import bananaImg from "../assets/images/bananas.jpg";
import manggaImg from "../assets/images/mangga.jpg";
import appleImg from "../assets/images/apple.webp";

import bananacueImg from "../assets/images/banana_cue.jpg";
import kamotecueImg from "../assets/images/camote_cue.jpg"
import fishball from "../assets/images/fishball.jpg";
import kikiamImg from "../assets/images/kikiam.jpg";
import squidballImg from "../assets/images/squid_ball.jpg";
import bibingkaImg from "../assets/images/bibingka.jpg";
import putoImg from "../assets/images/puto.webp";
import kakaninImg from "../assets/images/kakanin.webp";
import snacksImg from "../assets/images/pineapple.jpg";
import souvenirsImg from "../assets/images/white_eggs.jpg";

import KeyChain from "../assets/images/keychain.jpg";
import tshirt from "../assets/images/tshirt.png";
import mugs from "../assets/images/mug.webp";
import woven from "../assets/images/woven.jpg";
import hats from "../assets/images/hats.jpg";
import crafts from "../assets/images/craft.jpg";
import cards from "../assets/images/cards.webp";
import magnets from "../assets/images/magnets.jpg";

const AvailableProducts = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Product image mapping
  const productImages = {
    // Fish products
    'Bangus': bangusImg,
    'Galunggong': galunggongImg,
    'Shrimp': shrimpImg,
    'Tamarong': tamarongImg,
    'Tamban': tambanImg,
    // Vegetable products
    'Premium Tomatoes': tomatoesimg,
    'Red Onions': onionsimg,
    'Organic Cabbage': cabbageimg,
    'Baby Carrots': carrotimg,
    'Russet Potatoes': potatoimg,
    'Bell Peppers': atsalimg,
    'Fresh Spinach': spinachimg,
    'Asian Eggplant': eggplantimg,
    // Chicken products
    'Whole Free-Range Chicken': wholechickenImg,
    'Chicken Breast': chickenbreastImg,
    'Chicken Thighs': chickenthighsImg,
    'Chicken Wings': chickenwingsImg,
    'Farm Eggs': souvenirsImg,
    'Chicken Liver': chickenliverImg,
    'Chicken Feet': chicken_feet,
    // Pork products
    'Pork Belly': porkbellyImg,
    'Pork Loin': porkLoinImg,
    'Pork Ribs': porkribsImg,
    'Pork Chops': porkChopImg,
    'Pork Shoulder': porkshoulderImg,
    'Ground Pork': groundPorkImg,
    'Pork Liver': porkliverImg,
    'Watermelon': watermelonImg,
    'Grapes': fruitsImg,
    'Pineapples': pineappleImg,
    'Papaya': papayaImg,
    'Red Apples': appleImg,
    'Navel Oranges': orangeImg,
    'Lakatan Bananas': bananaImg,
    'Carabao Mangoes': manggaImg,
    'Sweet Banana Cue': bananacueImg,
    'Camote Cue': kamotecueImg,
    'Fish Balls': fishball,
    'Kikiam': kikiamImg,
    'Squid Balls': squidballImg,
    'Bibingka': bibingkaImg,
    'Puto': putoImg,
    'Kakanin': kakaninImg,
    'Custom Keychains': KeyChain,
    'Local T-Shirts': tshirt,
    'Ceramic Mugs': mugs,
    'Woven Bags': woven,
    'Local Hats': hats,
    'Wooden Crafts': crafts,
    'Postcards': cards,
    'Ref Magnets': magnets,
  };

  // Category image mapping
  const categoryImages = {
    'vegetables': vegetablesImg,
    'fish': fishImg,
    'chicken': chickenImg,
    'pork': porkImg,
    'fruits': fruitsImg,
    'snacks': snacksImg,
    'souvenir': souvenirsImg
  };

  // Product categories data
  const productCategories = [
    {
      id: 'vegetables',
      name: 'Fresh Vegetables',
      icon: <FaCarrot />,
      color: '#52c41a',
      description: 'Farm-fresh vegetables sourced directly from local farms - Fresh green produce available daily',
      products: [
        { 
          name: 'Premium Tomatoes', 
          price: '₱45/kg', 
          available: true,
          icon: <FaLeaf />
        },
        { 
          name: 'Red Onions', 
          price: '₱65/kg', 
          available: true,
          icon: <FaLeaf />
        },
        { 
          name: 'Organic Cabbage', 
          price: '₱40/kg', 
          available: true,
          icon: <FaLeaf />
        },
        { 
          name: 'Baby Carrots', 
          price: '₱55/kg', 
          available: true,
          icon: <FaCarrot />
        },
        { 
          name: 'Russet Potatoes', 
          price: '₱50/kg', 
          available: true,
          icon: <FaLeaf />
        },
        { 
          name: 'Bell Peppers', 
          price: '₱85/kg', 
          available: true,
          icon: <FaLeaf />
        },
        { 
          name: 'Fresh Spinach', 
          price: '₱30/bunch', 
          available: true,
          icon: <FaLeaf />
        },
        { 
          name: 'Asian Eggplant', 
          price: '₱60/kg', 
          available: true,
          icon: <FaLeaf />
        }
      ]
    },
    {
      id: 'fish',
      name: 'Fresh Seafood',
      icon: <FaFish />,
      color: '#1890ff',
      description: 'Daily catch from local waters, delivered fresh - Blue ocean bounty from Philippine seas',
      products: [
        { 
          name: 'Bangus', 
          price: '₱130/kg', 
          available: true,
          icon: <FaFish />
        },
        { 
          name: 'Galunggong', 
          price: '₱110/kg', 
          available: true,
          icon: <FaFish />
        },
        { 
          name: 'Fresh Tilapia', 
          price: '₱95/kg', 
          available: true,
          icon: <FaFish />
        },
        { 
          name: 'Tamarong', 
          price: '₱280/kg', 
          available: true,
          icon: <FaFish />
        },
        { 
          name: 'Shrimp', 
          price: '₱320/kg', 
          available: true,
          icon: <FaFish />
        },
        { 
          name: 'Tamban', 
          price: '₱220/kg', 
          available: true,
          icon: <FaFish />
        },
        { 
          name: 'Blue Crabs', 
          price: '₱380/kg', 
          available: true,
          icon: <FaFish />
        },
        { 
          name: 'Green Mussels', 
          price: '₱90/kg', 
          available: true,
          icon: <FaFish />
        }
      ]
    },
    {
      id: 'chicken',
      name: 'Premium Poultry',
      icon: <FaDrumstickBite />,
      color: '#faad14',
      description: 'High-quality poultry products from trusted suppliers - Golden brown chicken and fresh eggs',
      products: [
        { 
          name: 'Whole Free-Range Chicken', 
          price: '₱165/kg', 
          available: true,
          icon: <FaDrumstickBite />
        },
        { 
          name: 'Chicken Breast', 
          price: '₱195/kg', 
          available: true,
          icon: <FaDrumstickBite />
        },
        { 
          name: 'Chicken Thighs', 
          price: '₱155/kg', 
          available: true,
          icon: <FaDrumstickBite />
        },
        { 
          name: 'Chicken Wings', 
          price: '₱175/kg', 
          available: true,
          icon: <FaDrumstickBite />
        },
        { 
          name: 'Farm Eggs', 
          price: '₱8/dozen', 
          available: true,
          icon: <FaEgg />
        },
        { 
          name: 'Chicken Liver', 
          price: '₱90/kg', 
          available: true,
          icon: <FaDrumstickBite />
        },
        { 
          name: 'Chicken Feet', 
          price: '₱80/kg', 
          available: true,
          icon: <FaDrumstickBite />
        }
      ]
    },
    {
      id: 'pork',
      name: 'Quality Pork',
      icon: <FaBacon />,
      color: '#f5222d',
      description: 'Premium cuts of pork from inspected sources - Red meat cuts for Filipino dishes',
      products: [
        { 
          name: 'Pork Belly', 
          price: '₱240/kg', 
          available: true,
          icon: <FaBacon />
        },
        { 
          name: 'Pork Loin', 
          price: '₱300/kg', 
          available: true,
          icon: <FaBacon />
        },
        { 
          name: 'Pork Ribs', 
          price: '₱280/kg', 
          available: true,
          icon: <FaBacon />
        },
        { 
          name: 'Ground Pork', 
          price: '₱220/kg', 
          available: true,
          icon: <FaBacon />
        },
        { 
          name: 'Pork Chops', 
          price: '₱260/kg', 
          available: true,
          icon: <FaBacon />
        },
        { 
          name: 'Pork Shoulder', 
          price: '₱195/kg', 
          available: true,
          icon: <FaBacon />
        },
        { 
          name: 'Pork Liver', 
          price: '₱135/kg', 
          available: true,
          icon: <FaBacon />
        }
      ]
    },
    {
      id: 'fruits',
      name: 'Seasonal Fruits',
      icon: <FaAppleAlt />,
      color: '#eb2f96',
      description: 'Fresh, seasonal fruits from local orchards - Colorful pink sweet treats from tropical Philippines',
      products: [
        { 
          name: 'Lakatan Bananas', 
          price: '₱55/bunch', 
          available: true,
          icon: <FaAppleAlt />
        },
        { 
          name: 'Red Apples', 
          price: '₱135/kg', 
          available: true,
          icon: <FaAppleAlt />
        },
        { 
          name: 'Navel Oranges', 
          price: '₱90/kg', 
          available: true,
          icon: <FaAppleAlt />
        },
        { 
          name: 'Carabao Mangoes', 
          price: '₱120/kg', 
          available: true,
          icon: <FaAppleAlt />
        },
        { 
          name: 'Pineapples', 
          price: '₱70/pc', 
          available: true,
          icon: <FaAppleAlt />
        },
        { 
          name: 'Papaya', 
          price: '₱45/pc', 
          available: true,
          icon: <FaAppleAlt />
        },
        { 
          name: 'Watermelon', 
          price: '₱35/kg', 
          available: true,
          icon: <FaAppleAlt />
        },
        { 
          name: 'Grapes', 
          price: '₱165/kg', 
          available: true,
          icon: <FaAppleAlt />
        }
      ]
    },
    {
      id: 'snacks',
      name: 'Local Delicacies',
      icon: <FaCookie />,
      color: '#722ed1',
      description: 'Traditional Filipino snacks and street food favorites - Purple local treats and Filipino street food',
      products: [
        { 
          name: 'Sweet Banana Cue', 
          price: '₱18/pc', 
          available: true,
          icon: <FaCookie />
        },
        { 
          name: 'Camote Cue', 
          price: '₱15/pc', 
          available: true,
          icon: <FaCookie />
        },
        { 
          name: 'Fish Balls', 
          price: '₱6/pc', 
          available: true,
          icon: <FaCookie />
        },
        { 
          name: 'Kikiam', 
          price: '₱10/pc', 
          available: true,
          icon: <FaCookie />
        },
        { 
          name: 'Squid Balls', 
          price: '₱12/pc', 
          available: true,
          icon: <FaCookie />
        },
        { 
          name: 'Bibingka', 
          price: '₱40/pc', 
          available: true,
          icon: <FaCookie />
        },
        { 
          name: 'Puto', 
          price: '₱10/pc', 
          available: true,
          icon: <FaCookie />
        },
        { 
          name: 'Kakanin', 
          price: '₱30/pc', 
          available: true,
          icon: <FaCookie />
        }
      ]
    },
    {
      id: 'souvenir',
      name: 'Local Souvenirs',
      icon: <FaGift />,
      color: '#13c2c2',
      description: 'Handcrafted souvenirs and local products - Teal handmade crafts and Philippine memorabilia',
      products: [
        { 
          name: 'Custom Keychains', 
          price: '₱45/pc', 
          available: true,
          icon: <FaGift />
        },
        { 
          name: 'Local T-Shirts', 
          price: '₱220/pc', 
          available: true,
          icon: <FaShoppingBag />
        },
        { 
          name: 'Ceramic Mugs', 
          price: '₱135/pc', 
          available: true,
          icon: <FaGift />
        },
        { 
          name: 'Woven Bags', 
          price: '₱165/pc', 
          available: true,
          icon: <FaShoppingBag />
        },
        { 
          name: 'Local Hats', 
          price: '₱95/pc', 
          available: true,
          icon: <FaGift />
        },
        { 
          name: 'Wooden Crafts', 
          price: '₱275/pc', 
          available: true,
          icon: <FaGift />
        },
        { 
          name: 'Postcards', 
          price: '₱20/pc', 
          available: true,
          icon: <FaGift />
        },
        { 
          name: 'Ref Magnets', 
          price: '₱50/pc', 
          available: true,
          icon: <FaGift />
        }
      ]
    }
  ];

  const styles = {
    productNavWrapper: {
      background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
      padding: "20px 0",
      borderBottom: "1px solid #dee2e6",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
    },
    productNav: {
      display: "flex",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: "16px",
      maxWidth: "1200px",
      margin: "0 auto"
    },
    productNavItem: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "16px 20px",
      borderRadius: "16px",
      backgroundColor: "#ffffff",
      border: "2px solid #e9ecef",
      cursor: "pointer",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      minWidth: "120px"
    },
    productNavIcon: {
      fontSize: "28px",
      marginBottom: "8px",
      transition: "transform 0.3s ease"
    },
    productNavText: {
      fontSize: "14px",
      fontWeight: 600,
      color: "#495057",
      textAlign: "center",
      margin: 0
    },
    productsWrapper: { 
      padding: "80px 20px", 
      background: "linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%)",
      minHeight: "100vh",
      position: "relative"
    },
    productsGrid: { 
      maxWidth: "1400px", 
      margin: "0 auto", 
      position: "relative", 
      zIndex: 1 
    },
    productCard: { 
      borderRadius: "20px", 
      overflow: "hidden", 
      boxShadow: "0 8px 32px rgba(0,0,0,0.12)", 
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      height: "100%",
      border: "1px solid rgba(0,0,0,0.05)",
      background: "#ffffff",
      position: "relative"
    },
    categoryHeader: { 
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
      color: "#fff", 
      padding: "32px 24px", 
      textAlign: "center",
      position: "relative",
      overflow: "hidden"
    },
    categoryIcon: { 
      fontSize: "48px", 
      marginBottom: "12px", 
      filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
      transition: "all 0.3s ease"
    },
    categoryTitle: { 
      fontSize: "22px", 
      color:"#000000ff",
      fontWeight: 800, 
      marginBottom: "8px", 
      textShadow: "0 2px 4px rgba(0,0,0,0.3)",
      letterSpacing: "0.3px"
    },
    categoryDesc: { 
      fontSize: "15px", 
      opacity: 0.95, 
      color:"#400909ff",
      textShadow: "0 1px 2px rgba(0,0,0,0.2)",
      lineHeight: 1.5,
      fontWeight: 400
    },
    productItems: { 
      padding: "24px", 
      background: "linear-gradient(135deg, #fafbfc 0%, #f8f9fa 100%)"
    },
    productItemContent: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flex: 1
    },
    productItemDetails: {
      flex: 1
    },
    productName: { 
      fontSize: "15px", 
      fontWeight: 700, 
      color: "#2c3e50", 
      letterSpacing: "0.1px",
      marginBottom: "2px"
    },
    productItemInfo: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: "6px"
    },
    productPrice: { 
      fontSize: "16px", 
      fontWeight: 800, 
      color: "#27ae60", 
      textShadow: "0 1px 2px rgba(39, 174, 96, 0.15)", 
      letterSpacing: "0.2px"
    },
    availableBadge: { 
      padding: "3px 10px", 
      borderRadius: "12px", 
      background: "linear-gradient(135deg, #27ae60, #2ecc71)", 
      color: "#fff", 
      fontSize: "11px", 
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.4px",
      boxShadow: "0 2px 8px rgba(39, 174, 96, 0.25)"
    },
    sectionTitle: { 
      textAlign: "center", 
      fontSize: "clamp(32px, 6vw, 48px)", 
      fontWeight: 900, 
      color: "#2c3e50", 
      marginBottom: 24,
      textShadow: "0 2px 6px rgba(0,0,0,0.08)",
      background: "linear-gradient(135deg, #667eea, #764ba2)",
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      letterSpacing: "1px",
      position: "relative"
    },
    sectionDesc: { 
      textAlign: "center", 
      maxWidth: "900px", 
      margin: "0 auto 60px", 
      fontSize: "clamp(18px, 3.5vw, 20px)", 
      color: "#5a6c7d",
      lineHeight: 1.7,
      fontWeight: 400,
      letterSpacing: "0.1px"
    }
  };

  return (
    <>
      {/* PRODUCTS NAVIGATION BAR */}
      <div style={styles.productNavWrapper}>
        <div style={styles.productNav}>
          {productCategories.map((category) => (
            <div
              key={category.id}
              style={{
                ...styles.productNavItem,
                border: selectedCategory === category.id ? `2px solid ${category.color}` : "2px solid transparent",
                backgroundColor: selectedCategory === category.id ? `${category.color}10` : "transparent"
              }}
              onClick={() => setSelectedCategory(category.id)}
              onMouseEnter={(e) => {
                if (selectedCategory !== category.id) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== category.id) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              <div style={{ ...styles.productNavIcon, color: category.color }}>
                {category.icon}
              </div>
              <div style={styles.productNavText}>{category.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PRODUCTS SECTION */}
      <div style={styles.productsWrapper}>
        <div style={styles.productsGrid}>
          {!selectedCategory ? (
            // Show all categories
            <div>
              <h2 style={styles.sectionTitle}>Available Products</h2>
              <p style={styles.sectionDesc}>
                Browse through our wide selection of fresh products available at the market. From fresh vegetables to local delicacies, we have everything you need.
              </p>
              <Row gutter={[24, 24]}>
                {productCategories.map((category) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={category.id}>
                    <Card
                      hoverable
                      style={{
                        ...styles.productCard,
                        cursor: "pointer"
                      }}
                      onClick={() => setSelectedCategory(category.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-5px)";
                        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
                      }}
                    >
                      <div style={{
                        ...styles.categoryHeader,
                        background: `linear-gradient(135deg, ${category.color}22, ${category.color}44)`
                      }}>
                        <div style={{ ...styles.categoryIcon, color: category.color }}>
                          {category.icon}
                        </div>
                        <div style={styles.categoryTitle}>{category.name}</div>
                        <div style={styles.categoryDesc}>{category.description}</div>
                      </div>
                      <div style={styles.productItems}>
                        <div style={{ textAlign: "center", color: "#090101ff", fontSize: 14 }}>
                          {category.products.length} items available
                        </div> 
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ) : (
            // Show selected category details
            <div>
              {productCategories
                .filter((cat) => cat.id === selectedCategory)
                .map((category) => (
                  <div key={category.id}>
                    <div style={{ marginBottom: 24, textAlign: "center" }}>
                      <Button 
                        onClick={() => setSelectedCategory(null)}
                        style={{ marginBottom: 16 }}
                      >
                        ← Back to All Categories
                      </Button>
                      <h2 style={styles.sectionTitle}>{category.name}</h2>
                      <p style={styles.sectionDesc}>{category.description}</p>
                    </div>
                    <Row gutter={[24, 24]}>
                      {category.products.map((product, index) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={index}>
                          <Card
                            hoverable
                            style={styles.productCard}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "translateY(-5px)";
                              e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.15)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
                            }}
                          >
                            <div style={{
                              ...styles.categoryHeader,
                              backgroundImage: `url(${productImages[product.name] || categoryImages[category.id]})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              position: "relative"
                            }}>
                              <div style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: "rgba(0,0,0,0.4)",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                padding: "20px"
                              }}>
                                <div style={styles.categoryTitle}>{product.name}</div>
                              </div>
                            </div>
                            <div style={styles.productItems}>
                              <div style={styles.productItemContent}>
                                <div style={{
                                  width: 50,
                                  height: 50,
                                  backgroundImage: `url(${productImages[product.name] || fishImg})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                  borderRadius: "8px",
                                  marginRight: 12
                                }}>
                                </div>
                                <div style={styles.productItemDetails}>
                                  <div style={styles.productName}>{product.name}</div>
                                </div>
                              </div>
                              <div style={styles.productItemInfo}>
                                <div style={styles.productPrice}>{product.price}</div>
                                {product.available && (
                                  <div style={styles.availableBadge}>Available</div>
                                )}
                              </div>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AvailableProducts;
