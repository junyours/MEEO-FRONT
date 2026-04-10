import React, { useState, useEffect, useMemo } from "react";
import { Card, Row, Col, Button, Badge, Typography, Spin, message } from "antd";
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
  FaShoppingBag,
  FaArrowLeft
} from "react-icons/fa";
import api from '../Api';

const { Title, Text } = Typography;

const AvailableProducts = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Custom API method for AvailableProducts screen
  const availableProductsApi = {
    getCategories: async () => {
      try {
        const response = await api.get('/public/categories');
        return response.data;
      } catch (error) {
        message.error('Failed to fetch categories');
        throw error;
      }
    },
    
    getProducts: async () => {
      try {
        const response = await api.get('/public/products');
        return response.data;
      } catch (error) {
        message.error('Failed to fetch products');
        throw error;
      }
    },
    
    getAvailableProducts: async () => {
      try {
        const response = await api.get('/public/products/available');
        return response.data;
      } catch (error) {
        message.error('Failed to fetch available products');
        throw error;
      }
    }
  };

  useEffect(() => {
    fetchAvailableData();
  }, []);

  const fetchAvailableData = async () => {
    setLoading(true);
    try {
      const [categoriesData, productsData] = await Promise.all([
        availableProductsApi.getCategories(),
        availableProductsApi.getProducts()
      ]);
      setCategories(categoriesData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching available products data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Map icon names to actual icon components
  const getIconComponent = (iconName) => {
    const iconMap = {
      'FaCarrot': <FaCarrot />,
      'FaFish': <FaFish />,
      'FaDrumstickBite': <FaDrumstickBite />,
      'FaBacon': <FaBacon />,
      'FaAppleAlt': <FaAppleAlt />,
      'FaCookie': <FaCookie />,
      'FaGift': <FaGift />,
      'FaLeaf': <FaLeaf />,
      'FaEgg': <FaEgg />,
      'FaShoppingBag': <FaShoppingBag />
    };
    return iconMap[iconName] || <FaShoppingBag />;
  };

  // Transform categories with their products
  const transformedCategories = useMemo(() => {
    return categories.map(category => ({
      id: category.id.toString(),
      name: category.name,
      icon: getIconComponent(category.icon),
      color: category.color || '#1890ff',
      description: category.description || '',
      image: category.image,
      products: products
        .filter(product => {
          // Handle different data types and structures for category_id
          const productCategoryId = product.category_id || product.category?.id;
          const categoryId = category.id;
          return productCategoryId == categoryId && product.available;
        })
        .map(product => ({
          name: product.name,
          price: `₱${product.price}/${product.unit}`,
          available: product.available,
          icon: getIconComponent(product.category?.icon) || <FaShoppingBag />,
          image: product.image
        }))
    }));
  }, [categories, products]);

  // Memoized filtered categories for performance
  const filteredCategories = useMemo(() => {
    return selectedCategory 
      ? transformedCategories.filter(cat => cat.id === selectedCategory)
      : transformedCategories;
  }, [selectedCategory, transformedCategories]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // Professional styling system
  const styles = {
    // Navigation styles
    nav: {
      wrapper: {
        background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
        padding: "clamp(12px, 3vw, 24px) 0",
        borderBottom: "1px solid #dee2e6",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(10px)"
      },
      container: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 clamp(12px, 3vw, 20px)"
      },
      itemGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: "clamp(8px, 2vw, 16px)",
        justifyContent: "center"
      },
      item: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "clamp(12px, 3vw, 16px) clamp(16px, 4vw, 24px)",
        borderRadius: "clamp(8px, 2vw, 12px)",
        backgroundColor: "#ffffff",
        borderWidth: "2px",
        borderStyle: "solid",
        borderColor: "transparent",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        minWidth: "clamp(100px, 25vw, 140px)",
        position: "relative",
        overflow: "hidden"
      },
      itemActive: (color) => ({
        borderWidth: "2px",
        borderStyle: "solid",
        borderColor: color,
        backgroundColor: `${color}08`,
        transform: "translateY(-2px)",
        boxShadow: `0 8px 24px ${color}25`
      }),
      icon: {
        fontSize: "clamp(24px, 6vw, 32px)",
        marginBottom: "clamp(6px, 1.5vw, 8px)",
        transition: "all 0.3s ease"
      },
      text: {
        fontSize: "clamp(11px, 2.5vw, 14px)",
        fontWeight: 600,
        color: "#495057",
        textAlign: "center",
        margin: 0,
        letterSpacing: "0.3px",
        lineHeight: 1.2
      }
    },

    // Main content styles
    main: {
      wrapper: {
        padding: "clamp(40px, 8vw, 80px) clamp(16px, 4vw, 20px)",
        background: "linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%)",
        minHeight: "calc(100vh - 200px)"
      },
      container: {
        maxWidth: "1400px",
        margin: "0 auto"
      },
      header: {
        textAlign: "center",
        marginBottom: "clamp(30px, 6vw, 60px)"
      },
      title: {
        fontSize: "clamp(24px, 5vw, 48px)",
        fontWeight: 800,
        color: "#2c3e50",
        marginBottom: "clamp(12px, 2.5vw, 16px)",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        letterSpacing: "1px",
        lineHeight: 1.2
      },
      subtitle: {
        fontSize: "clamp(14px, 3vw, 20px)",
        color: "#5a6c7d",
        lineHeight: 1.6,
        maxWidth: "800px",
        margin: "0 auto",
        fontWeight: 400
      }
    },

    // Card styles
    card: {
      base: {
        borderRadius: "clamp(12px, 3vw, 16px)",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        height: "100%",
        border: "1px solid rgba(0,0,0,0.05)",
        background: "#ffffff",
        position: "relative"
      },
      hover: {
        transform: "translateY(-8px)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
      },
      categoryHeader: {
        padding: "clamp(20px, 5vw, 32px) clamp(16px, 4vw, 24px)",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "clamp(120px, 30vw, 160px)"
      },
      categoryOverlay: {
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
        padding: "clamp(12px, 3vw, 20px)"
      },
      productHeader: {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "#fff",
        padding: "clamp(16px, 4vw, 24px) clamp(12px, 3vw, 20px)",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        minHeight: "clamp(100px, 25vw, 140px)"
      },
      icon: {
        fontSize: "clamp(32px, 8vw, 48px)",
        marginBottom: "clamp(8px, 2vw, 12px)",
        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
        transition: "all 0.3s ease"
      },
      title: {
        fontSize: "clamp(16px, 4vw, 20px)",
        fontWeight: 800,
        marginBottom: "clamp(6px, 1.5vw, 8px)",
        textShadow: "0 2px 4px rgba(0,0,0,0.3)",
        letterSpacing: "0.3px",
        lineHeight: 1.2
      },
      description: {
        fontSize: "clamp(12px, 3vw, 14px)",
        opacity: 0.95,
        textShadow: "0 1px 2px rgba(0,0,0,0.2)",
        lineHeight: 1.5,
        fontWeight: 400
      },
      content: {
        padding: "clamp(16px, 4vw, 24px)",
        background: "#ffffff"
      },
      productItem: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "clamp(12px, 3vw, 16px) 0",
        borderBottom: "1px solid #f1f3f5",
        flexDirection: "column",
        gap: "clamp(12px, 3vw, 16px)"
      },
      productInfo: {
        display: "flex",
        alignItems: "center",
        gap: "clamp(8px, 2vw, 12px)",
        flex: 1,
        width: "100%"
      },
      productImage: {
        width: "clamp(40px, 10vw, 48px)",
        height: "clamp(40px, 10vw, 48px)",
        borderRadius: "clamp(6px, 1.5vw, 8px)",
        objectFit: "cover",
        backgroundColor: "#f8f9fa"
      },
      productName: {
        fontSize: "clamp(13px, 3.5vw, 15px)",
        fontWeight: 600,
        color: "#2c3e50",
        margin: 0,
        lineHeight: 1.3
      },
      productDetails: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "clamp(6px, 1.5vw, 8px)",
        width: "100%",
        marginTop: "clamp(8px, 2vw, 12px)"
      },
      price: {
        fontSize: "clamp(14px, 3.5vw, 16px)",
        fontWeight: 800,
        color: "#27ae60",
        letterSpacing: "0.2px"
      },
      badge: {
        padding: "clamp(3px, 1vw, 4px) clamp(8px, 2vw, 12px)",
        borderRadius: "clamp(12px, 3vw, 20px)",
        background: "linear-gradient(135deg, #27ae60, #2ecc71)",
        color: "#fff",
        fontSize: "clamp(9px, 2.5vw, 11px)",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        boxShadow: "0 2px 8px rgba(39, 174, 96, 0.25)"
      }
    },

    // Button styles
    button: {
      back: {
        display: "inline-flex",
        alignItems: "center",
        gap: "clamp(6px, 1.5vw, 8px)",
        padding: "clamp(10px, 2.5vw, 12px) clamp(16px, 4vw, 24px)",
        borderRadius: "clamp(6px, 1.5vw, 8px)",
        border: "2px solid #667eea",
        background: "#ffffff",
        color: "#667eea",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.3s ease",
        marginBottom: "clamp(16px, 4vw, 24px)",
        fontSize: "clamp(12px, 3vw, 14px)"
      },
      backHover: {
        background: "#667eea",
        color: "#ffffff",
        transform: "translateY(-2px)",
        boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)"
      }
    }
  };

  return (
    <>
      {/* Navigation Bar */}
      <nav style={styles.nav.wrapper}>
        <div style={styles.nav.container}>
          <div style={styles.nav.itemGrid}>
            {transformedCategories.map((category) => (
              <div
                key={category.id}
                style={{
                  ...styles.nav.item,
                  ...(selectedCategory === category.id 
                    ? styles.nav.itemActive(category.color) 
                    : {}
                  )
                }}
                onClick={() => setSelectedCategory(category.id)}
                onMouseEnter={(e) => {
                  if (selectedCategory !== category.id) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== category.id) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                  }
                }}
              >
                <div style={{ ...styles.nav.icon, color: category.color }}>
                  {category.icon}
                </div>
                <div style={styles.nav.text}>{category.name}</div>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={styles.main.wrapper}>
        <div style={styles.main.container}>
          {!selectedCategory ? (
            // Category Overview
            <div>
              <header style={styles.main.header}>
                <h1 style={styles.main.title}>Available Products</h1>
                <p style={styles.main.subtitle}>
                  Browse through our wide selection of fresh products available at the market. 
                  From farm-fresh vegetables to local delicacies, we have everything you need for your daily needs.
                </p>
              </header>
              
              <Row gutter={["clamp(12px, 3vw, 24px)", "clamp(12px, 3vw, 24px)"]}>
                {filteredCategories.map((category) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={category.id}>
                    <Card
                      hoverable
                      style={styles.card.base}
                      onClick={() => setSelectedCategory(category.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = styles.card.hover.transform;
                        e.currentTarget.style.boxShadow = styles.card.hover.boxShadow;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.1)";
                      }}
                    >
                      <div style={{
                        ...styles.card.categoryHeader,
                        backgroundImage: `url(${category.image || '/placeholder-category.jpg'})`
                      }}>
                        <div style={styles.card.categoryOverlay}>
                          <div style={{ ...styles.card.icon, color: category.color }}>
                            {category.icon}
                          </div>
                          <h3 style={styles.card.title}>{category.name}</h3>
                          <p style={styles.card.description}>{category.description}</p>
                        </div>
                      </div>
                      <div style={styles.card.content}>
                        <div style={{ textAlign: "center" }}>
                          <Text strong style={{ fontSize: 16, color: "#2c3e50" }}>
                            {category.products.length} Products Available
                          </Text>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ) : (
            // Selected Category Details
            <div>
              {filteredCategories.map((category) => (
                <div key={category.id}>
                  <div style={{ textAlign: "center", marginBottom: 40 }}>
                    <button
                      style={styles.button.back}
                      onClick={() => setSelectedCategory(null)}
                      onMouseEnter={(e) => {
                        Object.assign(e.currentTarget.style, styles.button.backHover);
                      }}
                      onMouseLeave={(e) => {
                        Object.assign(e.currentTarget.style, styles.button.back);
                      }}
                    >
                      <FaArrowLeft />
                      Back to All Categories
                    </button>
                    
                    <header style={styles.main.header}>
                      <h1 style={styles.main.title}>{category.name}</h1>
                      <p style={styles.main.subtitle}>{category.description}</p>
                    </header>
                  </div>
                  
                  <Row gutter={["clamp(12px, 3vw, 24px)", "clamp(12px, 3vw, 24px)"]}>
                    {category.products.length > 0 ? (
                      category.products.map((product, index) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={index}>
                          <Card
                            hoverable
                            style={styles.card.base}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = styles.card.hover.transform;
                              e.currentTarget.style.boxShadow = styles.card.hover.boxShadow;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.1)";
                            }}
                          >
                            <div style={{
                              ...styles.card.productHeader,
                              backgroundImage: `url(${product.image || '/placeholder-product.jpg'})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center"
                            }}>
                              <div style={styles.card.categoryOverlay}>
                                <h3 style={styles.card.title}>{product.name}</h3>
                              </div>
                            </div>
                            <div style={styles.card.content}>
                              <div style={styles.card.productItem}>
                                <div style={styles.card.productInfo}>
                                  <img
                                    src={product.image || '/placeholder-product.jpg'}
                                    alt={product.name}
                                    style={styles.card.productImage}
                                  />
                                  <div>
                                    <h4 style={styles.card.productName}>{product.name}</h4>
                                  </div>
                                </div>
                                <div style={styles.card.productDetails}>
                                  <div style={styles.card.price}>{product.price}</div>
                                  {product.available && (
                                    <Badge style={styles.card.badge}>Available</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Col>
                      ))
                    ) : (
                      <Col xs={24}>
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '60px 20px',
                          background: '#f8f9fa',
                          borderRadius: '12px',
                          border: '2px dashed #dee2e6'
                        }}>
                          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
                            📦
                          </div>
                          <h3 style={{ 
                            fontSize: '20px', 
                            color: '#6c757d', 
                            marginBottom: '8px',
                            fontWeight: 600
                          }}>
                            No Products Available
                          </h3>
                          <p style={{ 
                            fontSize: '16px', 
                            color: '#adb5bd',
                            margin: 0,
                            maxWidth: '400px',
                            marginLeft: 'auto',
                            marginRight: 'auto'
                          }}>
                            There are currently no available products in this category. 
                            Please check back later or browse other categories.
                          </p>
                        </div>
                      </Col>
                    )}
                  </Row>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default AvailableProducts;
