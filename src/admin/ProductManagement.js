import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Switch, 
  Upload, 
  message, 
  Space,
  Popconfirm,
  Card,
  Image,
  Typography,
  Tabs,
  Tag,
  Row,
  Col,
  Drawer,
  Grid
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UploadOutlined,
  ReloadOutlined,
  SaveOutlined
} from '@ant-design/icons';
import api from '../Api';
import LoadingOverlay from './Loading';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { useBreakpoint } = Grid;

const ProductManagement = () => {
  const screens = useBreakpoint();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [refreshHovered, setRefreshHovered] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null); // Track existing image
  const [selectedCategory, setSelectedCategory] = useState('all'); // Track selected category
  const [form] = Form.useForm();
  const [productForm] = Form.useForm();

  useEffect(() => {
    const initializeData = async () => {
      setPageLoading(true);
      try {
        await Promise.all([
          fetchCategories(),
          fetchProducts()
        ]);
      } catch (error) {
        message.error('Failed to load initial data');
      } finally {
        setPageLoading(false);
      }
    };
    
    initializeData();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      message.error('Failed to fetch categories');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      message.error('Failed to fetch products');
    }
  };

  const fetchProductsByCategory = async (categoryId) => {
    try {
      if (categoryId === 'all') {
        const response = await api.get('/products');
        setProducts(response.data);
      } else {
        const response = await api.get(`/products/category/${categoryId}`);
        setProducts(response.data);
      }
    } catch (error) {
      message.error('Failed to fetch products by category');
    }
  };

  const handleRefresh = async () => {
    setRefreshLoading(true);
    setPageLoading(true);
    try {
      await Promise.all([
        fetchCategories(),
        fetchProducts()
      ]);
      message.success('Data refreshed successfully');
    } catch (error) {
      message.error('Failed to refresh data');
    } finally {
      setPageLoading(false);
      setRefreshLoading(false);
    }
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    fetchProductsByCategory(categoryId);
  };

  const handleCategorySubmit = async (values) => {
    setLoading(true);

    
    try {
      const formData = new FormData();
      
      // For updates, only send fields that have changed
      if (editingCategory) {
        // Check if image is being updated - handle both old and new structures
        let imageFile = null;
        if (values.image && values.image.file && values.image.file.originFileObj) {
          imageFile = values.image.file.originFileObj;
        } else if (values.image && values.image.file instanceof File) {
          imageFile = values.image.file;
        } else if (values.image && values.image instanceof File) {
          imageFile = values.image;
        }
        
      
        if (imageFile) {
          formData.append('image', imageFile);
    
        } else if (existingImage) {
          // Keep existing image if no new image selected
          formData.append('existing_image', existingImage);
        
        }
        
        // Only send other fields if they have actual values (not empty strings)
        if (values.name && values.name.trim() !== '') {
          formData.append('name', values.name);
         
        }
        if (values.description && values.description.trim() !== '') {
          formData.append('description', values.description);
         
        }
        if (values.color && values.color.trim() !== '') {
          formData.append('color', values.color);
       
        }
        if (values.icon && values.icon.trim() !== '') {
          formData.append('icon', values.icon);
          
        }
        
        // Log all FormData entries
    
    
        
        // If no data to update, show message
        if (formData.entries().next().done) {
          message.info('No changes detected');
          setLoading(false);
          return;
        }
       
        // Add _method field for Laravel PUT support with FormData
        formData.append('_method', 'PUT');
        
        const response = await api.post(`/categories/${editingCategory.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      
        message.success('Category updated successfully');
      } else {
        // For new categories, all fields are required
        formData.append('name', values.name);
        formData.append('description', values.description);
        formData.append('color', values.color || '#1890ff');
        formData.append('icon', values.icon || 'FaShoppingBag');
        
        // Handle image for new category
        let imageFile = null;
        if (values.image && values.image.file && values.image.file.originFileObj) {
          imageFile = values.image.file.originFileObj;
        } else if (values.image && values.image.file instanceof File) {
          imageFile = values.image.file;
        } else if (values.image && values.image instanceof File) {
          imageFile = values.image;
        }
        
        if (imageFile) {
          formData.append('image', imageFile);
        }
        
     
    
        
        await api.post('/categories', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        message.success('Category added successfully');
      }

      setCategoryModalVisible(false);
      setEditingCategory(null);
      setExistingImage(null);
      form.resetFields();
      setImagePreview(null);
      fetchCategories();
    } catch (error) {
      console.error('Category submit error:', error);
      console.error('Error response:', error.response);
      if (error.response && error.response.data) {
        console.error('Validation errors:', error.response.data.errors);
        console.error('Error message:', error.response.data.message);
      }
      message.error('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      // For updates, only send fields that have changed
      if (editingProduct) {
        // Check if image is being updated - handle both old and new structures
        let imageFile = null;
        if (values.image && values.image.file && values.image.file.originFileObj) {
          imageFile = values.image.file.originFileObj;
        } else if (values.image && values.image.file instanceof File) {
          imageFile = values.image.file;
        } else if (values.image && values.image instanceof File) {
          imageFile = values.image;
        }
        
        if (imageFile) {
          formData.append('image', imageFile);
        } else if (existingImage) {
          // Keep existing image if no new image selected
          formData.append('existing_image', existingImage);
        }
        
        // Only send other fields if they have actual values (not empty strings)
        if (values.name && values.name.trim() !== '') formData.append('name', values.name);
        if (values.category_id) formData.append('category_id', values.category_id);
        if (values.price) formData.append('price', values.price);
        if (values.unit && values.unit.trim() !== '') formData.append('unit', values.unit);
        if (values.description && values.description.trim() !== '') formData.append('description', values.description);
        formData.append('available', values.available ? 1 : 0);
        
        // If no data to update, show message
        if (formData.entries().next().done) {
          message.info('No changes detected');
          setLoading(false);
          return;
        }
        
     
        // Add _method field for Laravel PUT support with FormData
        formData.append('_method', 'PUT');
        const response = await api.post(`/products/${editingProduct.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        message.success('Product updated successfully');
      } else {
        // For new products, all required fields must be sent
        formData.append('name', values.name);
        formData.append('category_id', values.category_id);
        formData.append('price', values.price);
        formData.append('unit', values.unit);
        formData.append('available', values.available ? 1 : 0);
        
        if (values.description && values.description.trim() !== '') formData.append('description', values.description);
        
        // Handle image for new product
        let imageFile = null;
        if (values.image && values.image.file && values.image.file.originFileObj) {
          imageFile = values.image.file.originFileObj;
        } else if (values.image && values.image.file instanceof File) {
          imageFile = values.image.file;
        } else if (values.image && values.image instanceof File) {
          imageFile = values.image;
        }
        
        if (imageFile) {
          formData.append('image', imageFile);
        }
        
        await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        message.success('Product added successfully');
      }

      setProductModalVisible(false);
      setEditingProduct(null);
      setExistingImage(null);
      productForm.resetFields();
      setImagePreview(null);
      fetchProducts();
    } catch (error) {
      message.error('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      message.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      message.error('Failed to delete category');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
     
      const response = await api.delete(`/products/${id}`);
   
      message.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Delete error:', error);
      console.error('Error response:', error.response?.data);
      
      // Show specific error message
      if (error.response?.status === 404) {
        message.error('Product not found - it may have been already deleted');
      } else if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to delete product');
      }
    }
  };

  const editCategory = (category) => {
    setEditingCategory(category);
    setExistingImage(category.image); // Track existing image
    form.setFieldsValue({
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon
    });
    // Set image preview if image exists
    if (category.image) {
      setImagePreview(category.image);
    } else {
      setImagePreview(null);
    }
    setCategoryModalVisible(true);
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setExistingImage(product.image); // Track existing image
    productForm.setFieldsValue({
      name: product.name,
      category_id: product.category_id,
      price: product.price,
      unit: product.unit,
      description: product.description,
      available: product.available === 1 || product.available === true
    });
    // Set image preview if image exists
    if (product.image) {
      setImagePreview(product.image);
    } else {
      setImagePreview(null);
    }
    setProductModalVisible(true);
  };

  const handleImageChange = (info) => {
    // Debug: log the info object
   
    
    // Handle both old and new Ant Design Upload structures
    let file = null;
    
    if (info.file && info.file.originFileObj) {
      // Old structure
      file = info.file.originFileObj;
    } else if (info.file && info.file instanceof File) {
      // New structure - file is directly a File object
      file = info.file;
    } else if (info.fileList && info.fileList.length > 0) {
      // Try to get file from fileList
      const fileListFile = info.fileList[0];
      if (fileListFile.originFileObj) {
        file = fileListFile.originFileObj;
      } else if (fileListFile instanceof File) {
        file = fileListFile;
      }
    }
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
       
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const beforeUpload = () => {
    // Prevent default upload behavior
    return false;
  };

  const categoryColumns = [
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      width: screens.xs ? 50 : 60,
      render: (image) => (
        <Image
          width={screens.xs ? 40 : 60}
          height={screens.xs ? 40 : 60}
          src={image || '/placeholder-category.jpg'}
          style={{ objectFit: 'cover', borderRadius: 8 }}
        />
      )
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>,
      responsive: ['md']
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      responsive: ['lg']
    },
    {
      title: 'Color',
      dataIndex: 'color',
      key: 'color',
      width: 70,
      render: (color) => (
        <div
          style={{
            width: screens.xs ? 15 : 20,
            height: screens.xs ? 15 : 20,
            backgroundColor: color,
            borderRadius: 4
          }}
        />
      ),
      responsive: ['sm']
    },
    {
      title: 'Actions',
      key: 'actions',
      width: screens.xs ? 80 : 200,
      render: (_, record) => (
        <Space size={screens.xs ? 'small' : 'middle'} direction={screens.xs ? 'vertical' : 'horizontal'}>
          <Button
            style={{
              backgroundColor: 'white',
              color: 'black',
              borderColor: 'black'
            }}
            size={screens.xs ? 'small' : 'middle'}
            icon={<EditOutlined />}
            onClick={() => editCategory(record)}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f0f0f0';
              e.target.style.borderColor = '#404040';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.color = 'black';
              e.target.style.borderColor = 'black';
            }}
          >
            {screens.xs ? '' : 'Edit Category'}
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this category?"
            onConfirm={() => handleDeleteCategory(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              danger
              size={screens.xs ? 'small' : 'middle'}
              icon={<DeleteOutlined />}
            >
              {screens.xs ? '' : 'Delete Category'}
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const productColumns = [
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      width: screens.xs ? 50 : 60,
      render: (image) => (
        <Image
          width={screens.xs ? 40 : 60}
          height={screens.xs ? 40 : 60}
          src={image || '/placeholder-product.jpg'}
          style={{ objectFit: 'cover', borderRadius: 8 }}
        />
      )
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>,
      responsive: ['sm']
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => <Tag color={category?.color}>{category?.name}</Tag>,
      responsive: ['md']
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price, record) => (
        <Text strong>₱{price}/{record.unit}</Text>
      ),
      responsive: ['sm']
    },
    {
      title: 'Status',
      dataIndex: 'available',
      key: 'available',
      render: (available) => (
        <Tag color={available ? 'green' : 'red'}>
          {available ? 'Available' : 'Unavailable'}
        </Tag>
      ),
      responsive: ['md']
    },
    {
      title: 'Actions',
      key: 'actions',
      width: screens.xs ? 80 : 200,
      render: (_, record) => (
        <Space size={screens.xs ? 'small' : 'middle'} direction={screens.xs ? 'vertical' : 'horizontal'}>
          <Button
            style={{
              backgroundColor: 'white',
              color: 'black',
              borderColor: 'black'
            }}
            size={screens.xs ? 'small' : 'middle'}
            icon={<EditOutlined />}
            onClick={() => editProduct(record)}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f0f0f0';
              e.target.style.borderColor = '#404040';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.color = 'black';
              e.target.style.borderColor = 'black';
            }}
          >
            {screens.xs ? '' : 'Edit Product'}
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this product?"
            onConfirm={() => handleDeleteProduct(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              danger
              size={screens.xs ? 'small' : 'middle'}
              icon={<DeleteOutlined />}
            >
              {screens.xs ? '' : 'Delete Product'}
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (pageLoading) {
    return <LoadingOverlay message="Loading product management data..." />;
  }

  return (
    <div style={{ padding: screens.xs ? '12px' : '24px' }}>
      <Title level={screens.xs ? 3 : 2}>Product Management</Title>
      
      <Tabs defaultActiveKey="categories">
        <TabPane tab="Categories" key="categories">
          <Card
            title="Category Management"
            extra={
              <Space direction={screens.xs ? 'vertical' : 'horizontal'} size={screens.xs ? 'small' : 'middle'}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingCategory(null);
                    form.resetFields();
                    setImagePreview(null);
                    setCategoryModalVisible(true);
                  }}
                  style={{
                    backgroundColor: 'white',
                    color: 'black',
                    borderColor: 'black'
                  }}
                  size={screens.xs ? 'small' : 'middle'}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#1890ff';
                    e.target.style.color = 'white';
                    e.target.style.borderColor = '#1890ff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = 'black';
                    e.target.style.borderColor = 'black';
                  }}
                >
                  {screens.xs ? 'Add' : 'Add Category'}
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  loading={refreshLoading}
                  onMouseEnter={() => setRefreshHovered(true)}
                  onMouseLeave={() => setRefreshHovered(false)}
                  style={{
                    backgroundColor: refreshHovered ? '#1890ff' : 'white',
                    color: refreshHovered ? 'white' : 'black',
                    borderColor: refreshHovered ? '#1890ff' : 'black'
                  }}
                  size={screens.xs ? 'small' : 'middle'}
                >
                  {screens.xs ? '' : 'Refresh'}
                </Button>
              </Space>
            }
          >
            <Table
              columns={categoryColumns}
              dataSource={categories}
              rowKey="id"
              loading={pageLoading}
              scroll={{ x: screens.xs ? 400 : undefined }}
              size={screens.xs ? 'small' : 'middle'}
            />
          </Card>
        </TabPane>

        <TabPane tab="Products" key="products">
          <Card
            title="Product Management"
            extra={
              <Space direction={screens.xs ? 'vertical' : 'horizontal'} size={screens.xs ? 'small' : 'middle'}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingProduct(null);
                    productForm.resetFields();
                    productForm.setFieldsValue({ available: true });
                    setImagePreview(null);
                    setProductModalVisible(true);
                  }}
                  style={{
                    backgroundColor: 'white',
                    color: 'black',
                    borderColor: 'black'
                  }}
                  size={screens.xs ? 'small' : 'middle'}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#1890ff';
                    e.target.style.color = 'white';
                    e.target.style.borderColor = '#1890ff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = 'black';
                    e.target.style.borderColor = 'black';
                  }}
                >
                  {screens.xs ? 'Add' : 'Add Product'}
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  loading={refreshLoading}
                  onMouseEnter={() => setRefreshHovered(true)}
                  onMouseLeave={() => setRefreshHovered(false)}
                  style={{
                    backgroundColor: refreshHovered ? '#1890ff' : 'white',
                    color: refreshHovered ? 'white' : 'black',
                    borderColor: refreshHovered ? '#1890ff' : 'black'
                  }}
                  size={screens.xs ? 'small' : 'middle'}
                >
                  {screens.xs ? '' : 'Refresh'}
                </Button>
              </Space>
            }
          >
            <Tabs
              activeKey={selectedCategory}
              onChange={handleCategoryChange}
              type={screens.xs ? 'line' : 'card'}
              size={screens.xs ? 'small' : 'middle'}
              style={{ marginBottom: 16 }}
              scrollable={screens.xs}
            >
              <TabPane 
                tab={
                  <span>
                    <Tag color="blue">{screens.xs ? 'All' : 'All Products'}</Tag>
                  </span>
                } 
                key="all" 
              />
              {categories.map(category => (
                <TabPane 
                  tab={
                    <span>
                      <Tag color={category.color}>{category.name}</Tag>
                    </span>
                  } 
                  key={category.id} 
                />
              ))}
            </Tabs>
            <Table
              columns={productColumns}
              dataSource={products}
              rowKey="id"
              loading={pageLoading}
              scroll={{ x: screens.xs ? 500 : undefined }}
              size={screens.xs ? 'small' : 'middle'}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Category Modal */}
      {screens.xs ? (
        <Drawer
          title={editingCategory ? 'Edit Category' : 'Add Category'}
          placement="bottom"
          height="90%"
          onClose={() => {
            setCategoryModalVisible(false);
            setEditingCategory(null);
            form.resetFields();
            setImagePreview(null);
          }}
          visible={categoryModalVisible}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCategorySubmit}
          >
            <Form.Item
              name="name"
              label="Category Name"
              rules={!editingCategory ? [{ required: true, message: 'Please input category name!' }] : []}
            >
              <Input placeholder="Enter category name" />
            </Form.Item>

            <Form.Item
              name="color"
              label="Color"
              rules={!editingCategory ? [{ required: true, message: 'Please select a color!' }] : []}
            >
              <Input type="color" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={!editingCategory ? [{ required: true, message: 'Please input description!' }] : []}
            >
              <Input.TextArea rows={3} placeholder="Enter category description" />
            </Form.Item>

            <Form.Item
              name="image"
              label="Category Image"
            >
              <Upload
                beforeUpload={beforeUpload}
                onChange={handleImageChange}
                showUploadList={false}
                accept="image/*"
                multiple={false}
              >
                <Button icon={<UploadOutlined />} block>Select Image</Button>
              </Upload>
            </Form.Item>

            {imagePreview && (
              <div style={{ marginBottom: 16, textAlign: 'center' }}>
                <Image
                  width={screens.xs ? 150 : 200}
                  height={screens.xs ? 150 : 200}
                  src={imagePreview}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                />
              </div>
            )}

            <Form.Item>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} block>
                  {editingCategory ? 'Update' : 'Save'}
                </Button>
                <Button onClick={() => {
                  setCategoryModalVisible(false);
                  setEditingCategory(null);
                  form.resetFields();
                  setImagePreview(null);
                }} block>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Drawer>
      ) : (
        <Modal
          title={editingCategory ? 'Edit Category' : 'Add Category'}
          visible={categoryModalVisible}
          onCancel={() => {
            setCategoryModalVisible(false);
            setEditingCategory(null);
            form.resetFields();
            setImagePreview(null);
          }}
          footer={null}
          width={screens.md ? 600 : '90%'}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCategorySubmit}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Category Name"
                  rules={!editingCategory ? [{ required: true, message: 'Please input category name!' }] : []}
                >
                  <Input placeholder="Enter category name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="color"
                  label="Color"
                  rules={!editingCategory ? [{ required: true, message: 'Please select a color!' }] : []}
                >
                  <Input type="color" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="Description"
              rules={!editingCategory ? [{ required: true, message: 'Please input description!' }] : []}
            >
              <Input.TextArea rows={3} placeholder="Enter category description" />
            </Form.Item>

            <Form.Item
              name="image"
              label="Category Image"
            >
              <Upload
                beforeUpload={beforeUpload}
                onChange={handleImageChange}
                showUploadList={false}
                accept="image/*"
                multiple={false}
              >
                <Button icon={<UploadOutlined />}>Select Image</Button>
              </Upload>
            </Form.Item>

            {imagePreview && (
              <div style={{ marginBottom: 16, textAlign: 'center' }}>
                <Image
                  width={200}
                  height={200}
                  src={imagePreview}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                />
              </div>
            )}

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  {editingCategory ? 'Update' : 'Save'}
                </Button>
                <Button onClick={() => {
                  setCategoryModalVisible(false);
                  setEditingCategory(null);
                  form.resetFields();
                  setImagePreview(null);
                }}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      )}

      {/* Product Modal */}
      {screens.xs ? (
        <Drawer
          title={editingProduct ? 'Edit Product' : 'Add Product'}
          placement="bottom"
          height="90%"
          onClose={() => {
            setProductModalVisible(false);
            setEditingProduct(null);
            productForm.resetFields();
            setImagePreview(null);
          }}
          visible={productModalVisible}
        >
          <Form
            form={productForm}
            layout="vertical"
            onFinish={handleProductSubmit}
          >
            <Form.Item
              name="name"
              label="Product Name"
              rules={!editingProduct ? [{ required: true, message: 'Please input product name!' }] : []}
            >
              <Input placeholder="Enter product name" />
            </Form.Item>

            <Form.Item
              name="category_id"
              label="Category"
              rules={!editingProduct ? [{ required: true, message: 'Please select a category!' }] : []}
            >
              <Select placeholder="Select category">
                {categories.map(category => (
                  <Option key={category.id} value={category.id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="price"
                  label="Price"
                  rules={!editingProduct ? [{ required: true, message: 'Please input price!' }] : []}
                >
                  <Input type="number" placeholder="0.00" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="unit"
                  label="Unit"
                  rules={!editingProduct ? [{ required: true, message: 'Please input unit!' }] : []}
                >
                  <Input placeholder="kg, pc, dozen, bunch" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea rows={3} placeholder="Enter product description" />
            </Form.Item>

            <Form.Item
              name="available"
              label="Availability"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch 
                checkedChildren="Available" 
                unCheckedChildren="Unavailable"
                defaultChecked={true}
              />
            </Form.Item>

            <Form.Item
              name="image"
              label="Product Image"
            >
              <Upload
                beforeUpload={beforeUpload}
                onChange={handleImageChange}
                showUploadList={false}
                accept="image/*"
                multiple={false}
              >
                <Button icon={<UploadOutlined />} block>Select Image</Button>
              </Upload>
            </Form.Item>

            {imagePreview && (
              <div style={{ marginBottom: 16, textAlign: 'center' }}>
                <Image
                  width={screens.xs ? 150 : 200}
                  height={screens.xs ? 150 : 200}
                  src={imagePreview}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                />
              </div>
            )}

            <Form.Item>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} block>
                  {editingProduct ? 'Update' : 'Save'}
                </Button>
                <Button onClick={() => {
                  setProductModalVisible(false);
                  setEditingProduct(null);
                  productForm.resetFields();
                  setImagePreview(null);
                }} block>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Drawer>
      ) : (
        <Modal
          title={editingProduct ? 'Edit Product' : 'Add Product'}
          visible={productModalVisible}
          onCancel={() => {
            setProductModalVisible(false);
            setEditingProduct(null);
            productForm.resetFields();
            setImagePreview(null);
          }}
          footer={null}
          width={screens.md ? 600 : '90%'}
        >
          <Form
            form={productForm}
            layout="vertical"
            onFinish={handleProductSubmit}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Product Name"
                  rules={!editingProduct ? [{ required: true, message: 'Please input product name!' }] : []}
                >
                  <Input placeholder="Enter product name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="category_id"
                  label="Category"
                  rules={!editingProduct ? [{ required: true, message: 'Please select a category!' }] : []}
                >
                  <Select placeholder="Select category">
                    {categories.map(category => (
                      <Option key={category.id} value={category.id}>
                        {category.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="price"
                  label="Price"
                  rules={!editingProduct ? [{ required: true, message: 'Please input price!' }] : []}
                >
                  <Input type="number" placeholder="0.00" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="unit"
                  label="Unit"
                  rules={!editingProduct ? [{ required: true, message: 'Please input unit!' }] : []}
                >
                  <Input placeholder="kg, pc, dozen, bunch" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea rows={3} placeholder="Enter product description" />
            </Form.Item>

            <Form.Item
              name="available"
              label="Availability"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch 
                checkedChildren="Available" 
                unCheckedChildren="Unavailable"
                defaultChecked={true}
              />
            </Form.Item>

            <Form.Item
              name="image"
              label="Product Image"
            >
              <Upload
                beforeUpload={beforeUpload}
                onChange={handleImageChange}
                showUploadList={false}
                accept="image/*"
                multiple={false}
              >
                <Button icon={<UploadOutlined />}>Select Image</Button>
              </Upload>
            </Form.Item>

            {imagePreview && (
              <div style={{ marginBottom: 16, textAlign: 'center' }}>
                <Image
                  width={200}
                  height={200}
                  src={imagePreview}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                />
              </div>
            )}

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  {editingProduct ? 'Update' : 'Save'}
                </Button>
                <Button onClick={() => {
                  setProductModalVisible(false);
                  setEditingProduct(null);
                  productForm.resetFields();
                  setImagePreview(null);
                }}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default ProductManagement;
