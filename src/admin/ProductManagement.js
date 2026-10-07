import React, { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
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
  Grid,
  DatePicker,
  Statistic,
  Divider
} from 'antd';

import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  ReloadOutlined,
  SaveOutlined,
  AppstoreOutlined,
  HistoryOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
  CloseOutlined
} from '@ant-design/icons';

import api from '../Api';
import LoadingOverlay from './Loading';
import './ProductManagement.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { useBreakpoint } = Grid;

const ProductManagement = () => {
  const screens = useBreakpoint();

  // =========================================================
  // GENERAL STATE
  // =========================================================

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  // =========================================================
  // CATEGORY STATE
  // =========================================================

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // =========================================================
  // PRODUCT STATE
  // =========================================================

  const [productModalVisible, setProductModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productDetailLoadingId, setProductDetailLoadingId] = useState(null);

  // =========================================================
  // IMAGE STATE
  // =========================================================

  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  // =========================================================
  // CATEGORY FILTER
  // =========================================================

  const [selectedCategory, setSelectedCategory] = useState('all');

  // =========================================================
  // PRICE HISTORY STATE
  // =========================================================

  const [priceHistoryVisible, setPriceHistoryVisible] = useState(false);
  const [priceHistoryLoading, setPriceHistoryLoading] = useState(false);

  const [priceHistoryProduct, setPriceHistoryProduct] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);

  /*
   * all
   * this_week
   * last_week
   * this_month
   * last_month
   * custom
   */
  const [priceHistoryPeriod, setPriceHistoryPeriod] = useState('all');

  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);

  // =========================================================
  // FORMS
  // =========================================================

  const [form] = Form.useForm();
  const [productForm] = Form.useForm();

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    const initializeData = async () => {
      setPageLoading(true);

      try {
        await Promise.all([
          fetchCategories(),
          fetchProductsByCategory('all')
        ]);
      } catch (error) {
        message.error('Failed to load initial data');
      } finally {
        setPageLoading(false);
      }
    };

    initializeData();
  }, []);

  // =========================================================
  // FETCH CATEGORIES
  // =========================================================

  const fetchCategories = async () => {
    setCategoriesLoading(true);

    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      message.error('Failed to fetch categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  // =========================================================
  // FETCH PRODUCTS
  // =========================================================

  const fetchProductsByCategory = async (categoryId) => {
    setProductsLoading(true);

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
    } finally {
      setProductsLoading(false);
    }
  };

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    setRefreshLoading(true);

    try {
      await Promise.all([
        fetchCategories(),
        fetchProductsByCategory(selectedCategory)
      ]);

      message.success('Data refreshed successfully');
    } catch (error) {
      message.error('Failed to refresh data');
    } finally {
      setRefreshLoading(false);
    }
  };

  // =========================================================
  // CATEGORY CHANGE
  // =========================================================

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    fetchProductsByCategory(categoryId);
  };

  // =========================================================
  // CATEGORY SUBMIT
  // =========================================================

  const handleCategorySubmit = async (values) => {
    setLoading(true);

    try {
      const formData = new FormData();

      if (editingCategory) {
        let imageFile = null;

        if (
          values.image &&
          values.image.file &&
          values.image.file.originFileObj
        ) {
          imageFile = values.image.file.originFileObj;
        } else if (
          values.image &&
          values.image.file instanceof File
        ) {
          imageFile = values.image.file;
        } else if (values.image instanceof File) {
          imageFile = values.image;
        }

        if (imageFile) {
          formData.append('image', imageFile);
        } else if (existingImage) {
          formData.append('existing_image', existingImage);
        }

        if (
          values.name &&
          values.name.trim() !== ''
        ) {
          formData.append('name', values.name);
        }

        if (
          values.description &&
          values.description.trim() !== ''
        ) {
          formData.append('description', values.description);
        }

        if (
          values.color &&
          values.color.trim() !== ''
        ) {
          formData.append('color', values.color);
        }

        if (
          values.icon &&
          values.icon.trim() !== ''
        ) {
          formData.append('icon', values.icon);
        }

        if (formData.entries().next().done) {
          message.info('No changes detected');
          setLoading(false);
          return;
        }

        formData.append('_method', 'PUT');

        await api.post(
          `/categories/${editingCategory.id}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        message.success('Category updated successfully');
      } else {
        formData.append('name', values.name);
        formData.append('description', values.description);
        formData.append(
          'color',
          values.color || '#1890ff'
        );
        formData.append(
          'icon',
          values.icon || 'FaShoppingBag'
        );

        let imageFile = null;

        if (
          values.image &&
          values.image.file &&
          values.image.file.originFileObj
        ) {
          imageFile = values.image.file.originFileObj;
        } else if (
          values.image &&
          values.image.file instanceof File
        ) {
          imageFile = values.image.file;
        } else if (values.image instanceof File) {
          imageFile = values.image;
        }

        if (imageFile) {
          formData.append('image', imageFile);
        }

        await api.post(
          '/categories',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

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

      if (error.response?.data) {
        console.error(
          'Validation errors:',
          error.response.data.errors
        );

        console.error(
          'Error message:',
          error.response.data.message
        );
      }

      message.error('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // PRODUCT SUBMIT
  // =========================================================

  const handleProductSubmit = async (values) => {
    setLoading(true);

    try {
      const formData = new FormData();

      if (editingProduct) {
        let imageFile = null;

        if (
          values.image &&
          values.image.file &&
          values.image.file.originFileObj
        ) {
          imageFile = values.image.file.originFileObj;
        } else if (
          values.image &&
          values.image.file instanceof File
        ) {
          imageFile = values.image.file;
        } else if (values.image instanceof File) {
          imageFile = values.image;
        }

        if (imageFile) {
          formData.append('image', imageFile);
        } else if (existingImage) {
          formData.append(
            'existing_image',
            existingImage
          );
        }

        /*
         * The backend requires these fields on update,
         * so send the complete product data.
         */
        if (
          values.name !== undefined &&
          values.name !== null
        ) {
          formData.append(
            'name',
            values.name
          );
        }

        if (
          values.category_id !== undefined &&
          values.category_id !== null
        ) {
          formData.append(
            'category_id',
            values.category_id
          );
        }

        /*
         * Important:
         * Do not use "if (values.price)" because 0
         * is a valid numeric value.
         */
        if (
          values.price !== undefined &&
          values.price !== null &&
          values.price !== ''
        ) {
          formData.append(
            'price',
            values.price
          );
        }

        if (values.effective_date) {
          formData.append(
            'effective_date',
            values.effective_date.format('YYYY-MM-DD') + ' 00:00:00'
          );
        }

        if (
          values.unit !== undefined &&
          values.unit !== null
        ) {
          formData.append(
            'unit',
            values.unit
          );
        }

        if (
          values.description !== undefined &&
          values.description !== null
        ) {
          formData.append(
            'description',
            values.description
          );
        }

        formData.append(
          'available',
          values.available ? 1 : 0
        );

        formData.append(
          '_method',
          'PUT'
        );

        await api.post(
          `/products/${editingProduct.id}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        message.success(
          'Product updated successfully'
        );
      } else {
        formData.append(
          'name',
          values.name
        );

        formData.append(
          'category_id',
          values.category_id
        );

        formData.append(
          'price',
          values.price
        );

        formData.append(
          'unit',
          values.unit
        );

        formData.append(
          'available',
          values.available ? 1 : 0
        );

        if (
          values.description &&
          values.description.trim() !== ''
        ) {
          formData.append(
            'description',
            values.description
          );
        }

        let imageFile = null;

        if (
          values.image &&
          values.image.file &&
          values.image.file.originFileObj
        ) {
          imageFile = values.image.file.originFileObj;
        } else if (
          values.image &&
          values.image.file instanceof File
        ) {
          imageFile = values.image.file;
        } else if (values.image instanceof File) {
          imageFile = values.image;
        }

        if (imageFile) {
          formData.append(
            'image',
            imageFile
          );
        }

        await api.post(
          '/products',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        message.success(
          'Product added successfully'
        );
      }

      setProductModalVisible(false);
      setEditingProduct(null);
      setExistingImage(null);

      productForm.resetFields();
      setImagePreview(null);

      fetchProductsByCategory(selectedCategory);
    } catch (error) {
      console.error(
        'Product submit error:',
        error
      );

      console.error(
        'Product submit response:',
        error.response?.data
      );

      message.error(
        error.response?.data?.message ||
        'Failed to save product'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // DELETE CATEGORY
  // =========================================================

  const handleDeleteCategory = async (id) => {
    try {
      await api.delete(`/categories/${id}`);

      message.success(
        'Category deleted successfully'
      );

      fetchCategories();
    } catch (error) {
      message.error(
        'Failed to delete category'
      );
    }
  };

  // =========================================================
  // DELETE PRODUCT
  // =========================================================

  const handleDeleteProduct = async (id) => {
    try {
      await api.delete(`/products/${id}`);

      message.success(
        'Product deleted successfully'
      );

      fetchProductsByCategory(
        selectedCategory
      );
    } catch (error) {
      console.error(
        'Delete error:',
        error
      );

      console.error(
        'Error response:',
        error.response?.data
      );

      if (
        error.response?.status === 404
      ) {
        message.error(
          'Product not found - it may have been already deleted'
        );
      } else if (
        error.response?.data?.message
      ) {
        message.error(
          error.response.data.message
        );
      } else {
        message.error(
          'Failed to delete product'
        );
      }
    }
  };

  // =========================================================
  // EDIT CATEGORY
  // =========================================================

  const editCategory = (category) => {
    setEditingCategory(category);
    setExistingImage(category.image);

    form.setFieldsValue({
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon
    });

    if (category.image) {
      setImagePreview(category.image);
    } else {
      setImagePreview(null);
    }

    setCategoryModalVisible(true);
  };

  // =========================================================
  // EDIT PRODUCT
  // =========================================================

  const editProduct = async (product) => {
    setProductDetailLoadingId(product.id);

    try {
      const response = await api.get(
        `/products/${product.id}`
      );

      const productDetails = response.data;

      setEditingProduct(productDetails);

      setExistingImage(
        productDetails.image
      );

      productForm.setFieldsValue({
        name: productDetails.name,
        category_id: productDetails.category_id,
        price: productDetails.price,
        effective_date: dayjs(),
        unit: productDetails.unit,
        description: productDetails.description,
        available:
          productDetails.available === 1 ||
          productDetails.available === true
      });

      setImagePreview(
        productDetails.image || null
      );

      setProductModalVisible(true);
    } catch (error) {
      message.error(
        error.response?.data?.message ||
        'Unable to load product details'
      );
    } finally {
      setProductDetailLoadingId(null);
    }
  };

  // =========================================================
  // IMAGE CHANGE
  // =========================================================

  const handleImageChange = (info) => {
    let file = null;

    if (
      info.file &&
      info.file.originFileObj
    ) {
      file = info.file.originFileObj;
    } else if (
      info.file &&
      info.file instanceof File
    ) {
      file = info.file;
    } else if (
      info.fileList &&
      info.fileList.length > 0
    ) {
      const fileListFile =
        info.fileList[0];

      if (
        fileListFile.originFileObj
      ) {
        file =
          fileListFile.originFileObj;
      } else if (
        fileListFile instanceof File
      ) {
        file = fileListFile;
      }
    }

    if (file) {
      const reader =
        new FileReader();

      reader.onload = (e) => {
        setImagePreview(
          e.target.result
        );
      };

      reader.readAsDataURL(file);
    }
  };

  // =========================================================
  // UPLOAD
  // =========================================================

  const beforeUpload = () => {
    return false;
  };

  // =========================================================
  // PRICE HISTORY
  // =========================================================

  const openPriceHistory = async (product) => {
    setPriceHistoryVisible(true);
    setPriceHistoryLoading(true);

    setPriceHistoryProduct(null);
    setPriceHistory([]);

    setPriceHistoryPeriod('all');

    setCustomStartDate(null);
    setCustomEndDate(null);

    try {
      const response = await api.get(
        `/products/${product.id}/price-history`
      );

      setPriceHistoryProduct(
        response.data.product
      );

      setPriceHistory(
        Array.isArray(response.data.history)
          ? response.data.history
          : []
      );
    } catch (error) {
      console.error(
        'Price history error:',
        error
      );

      message.error(
        error.response?.data?.message ||
        'Failed to load price history'
      );

      setPriceHistoryVisible(false);
    } finally {
      setPriceHistoryLoading(false);
    }
  };

  // =========================================================
  // CLOSE PRICE HISTORY
  // =========================================================

  const closePriceHistory = () => {
    setPriceHistoryVisible(false);
    setPriceHistoryProduct(null);
    setPriceHistory([]);
    setPriceHistoryPeriod('all');
    setCustomStartDate(null);
    setCustomEndDate(null);
  };

  // =========================================================
  // DATE HELPERS
  // =========================================================

  const startOfDay = (date) => {
    const result = new Date(date);

    result.setHours(
      0,
      0,
      0,
      0
    );

    return result;
  };

  const endOfDay = (date) => {
    const result = new Date(date);

    result.setHours(
      23,
      59,
      59,
      999
    );

    return result;
  };

  const startOfWeek = (date) => {
    const result = startOfDay(date);

    /*
     * Monday is the first day of the week.
     *
     * Sunday = 0
     * Monday = 1
     */
    const day =
      result.getDay();

    const difference =
      day === 0
        ? -6
        : 1 - day;

    result.setDate(
      result.getDate() +
      difference
    );

    return result;
  };

  const endOfWeek = (date) => {
    const result =
      startOfWeek(date);

    result.setDate(
      result.getDate() + 6
    );

    return endOfDay(result);
  };

  const startOfMonth = (date) => {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      1,
      0,
      0,
      0,
      0
    );
  };

  const endOfMonth = (date) => {
    return new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
  };

  // =========================================================
  // PERIOD RANGE
  // =========================================================

  const getSelectedPeriodRange = () => {
    const now = new Date();

    switch (priceHistoryPeriod) {
      case 'this_week':
        return {
          start: startOfWeek(now),
          end: endOfWeek(now)
        };

      case 'last_week': {
        const thisWeekStart =
          startOfWeek(now);

        const start =
          new Date(thisWeekStart);

        start.setDate(
          start.getDate() - 7
        );

        const end =
          new Date(thisWeekStart);

        end.setDate(
          end.getDate() - 1
        );

        return {
          start: startOfDay(start),
          end: endOfDay(end)
        };
      }

      case 'this_month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };

      case 'last_month': {
        const start =
          new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
          );

        const end =
          new Date(
            now.getFullYear(),
            now.getMonth(),
            0
          );

        return {
          start: startOfDay(start),
          end: endOfDay(end)
        };
      }

      case 'custom':
        if (
          customStartDate &&
          customEndDate
        ) {
          return {
            start:
              startOfDay(
                customStartDate
              ),
            end:
              endOfDay(
                customEndDate
              )
          };
        }

        return null;

      default:
        return null;
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (value) => {
    if (!value) {
      return '-';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '-';
    }

    return date.toLocaleDateString(
      'en-PH',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }
    );
  };

  const formatDateTime = (value) => {
    if (!value) {
      return '-';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '-';
    }

    return date.toLocaleString(
      'en-PH',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }
    );
  };

  const formatPrice = (value) => {
    const number =
      Number(value);

    if (
      Number.isNaN(number)
    ) {
      return '₱0.00';
    }

    return `₱${number.toLocaleString(
      'en-PH',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )}`;
  };

  // =========================================================
  // FILTER PRICE HISTORY
  // =========================================================

  const filteredPriceHistory =
    useMemo(() => {
      if (
        priceHistoryPeriod ===
        'all'
      ) {
        return [...priceHistory].sort(
          (a, b) =>
            new Date(
              b.effective_date
            ) -
            new Date(
              a.effective_date
            )
        );
      }

      const range =
        getSelectedPeriodRange();

      if (!range) {
        return [];
      }

      return priceHistory
        .filter((item) => {
          const date =
            new Date(
              item.effective_date
            );

          return (
            date >= range.start &&
            date <= range.end
          );
        })
        .sort(
          (a, b) =>
            new Date(
              b.effective_date
            ) -
            new Date(
              a.effective_date
            )
        );
    }, [
      priceHistory,
      priceHistoryPeriod,
      customStartDate,
      customEndDate
    ]);

  // =========================================================
  // PRICE HISTORY SUMMARY
  // =========================================================

  const priceHistorySummary =
    useMemo(() => {
      if (
        !priceHistoryProduct
      ) {
        return {
          startPrice: null,
          endPrice: null,
          change: null,
          percentage: null
        };
      }

      const allHistory =
        [...priceHistory].sort(
          (a, b) =>
            new Date(
              a.effective_date
            ) -
            new Date(
              b.effective_date
            )
        );

      if (
        allHistory.length === 0
      ) {
        return {
          startPrice: Number(
            priceHistoryProduct.current_price
          ),
          endPrice: Number(
            priceHistoryProduct.current_price
          ),
          change: 0,
          percentage: 0
        };
      }

      /*
       * ALL HISTORY
       */
      if (
        priceHistoryPeriod ===
        'all'
      ) {
        const first =
          allHistory[0];

        const last =
          allHistory[
          allHistory.length - 1
          ];

        const startPrice =
          Number(
            first.new_price
          );

        const endPrice =
          Number(
            priceHistoryProduct.current_price
          );

        const change =
          endPrice -
          startPrice;

        const percentage =
          startPrice > 0
            ? (change /
              startPrice) *
            100
            : null;

        return {
          startPrice,
          endPrice,
          change,
          percentage
        };
      }

      const range =
        getSelectedPeriodRange();

      if (!range) {
        return {
          startPrice: null,
          endPrice: null,
          change: null,
          percentage: null
        };
      }

      /*
       * Find the latest known price
       * BEFORE or AT the beginning
       * of the selected period.
       */
      let startingRecord =
        null;

      for (
        let i = 0;
        i < allHistory.length;
        i++
      ) {
        const record =
          allHistory[i];

        const date =
          new Date(
            record.effective_date
          );

        if (
          date <= range.start
        ) {
          startingRecord =
            record;
        } else {
          break;
        }
      }

      /*
       * If there was no history before
       * the period, use the first history
       * record inside the period.
       */
      if (
        !startingRecord
      ) {
        startingRecord =
          allHistory.find(
            (record) =>
              new Date(
                record.effective_date
              ) >= range.start
          );
      }

      /*
       * Find the latest price AT or
       * BEFORE the period end.
       */
      let endingRecord =
        null;

      for (
        let i = 0;
        i < allHistory.length;
        i++
      ) {
        const record =
          allHistory[i];

        const date =
          new Date(
            record.effective_date
          );

        if (
          date <= range.end
        ) {
          endingRecord =
            record;
        } else {
          break;
        }
      }

      /*
       * If the period is current and
       * there is no later history record,
       * use the product's current price.
       */
      const startPrice =
        startingRecord
          ? Number(
            startingRecord.new_price
          )
          : null;

      const endPrice =
        endingRecord
          ? Number(
            endingRecord.new_price
          )
          : null;

      if (
        startPrice === null ||
        endPrice === null
      ) {
        return {
          startPrice,
          endPrice,
          change: null,
          percentage: null
        };
      }

      const change =
        endPrice -
        startPrice;

      const percentage =
        startPrice > 0
          ? (change /
            startPrice) *
          100
          : null;

      return {
        startPrice,
        endPrice,
        change,
        percentage
      };
    }, [
      priceHistory,
      priceHistoryProduct,
      priceHistoryPeriod,
      customStartDate,
      customEndDate
    ]);

  // =========================================================
  // PRICE HISTORY TABLE COLUMNS
  // =========================================================

  const priceHistoryColumns = [
    {
      title: 'Date',
      dataIndex: 'effective_date',
      key: 'effective_date',
      width: 180,
      render: (value) => (
        <Text>
          {formatDateTime(value)}
        </Text>
      )
    },
    {
      title: 'Previous Price',
      dataIndex: 'old_price',
      key: 'old_price',
      width: 150,
      render: (value) => (
        <Text>
          {value === null ||
            value === undefined
            ? 'Initial'
            : formatPrice(value)}
        </Text>
      )
    },
    {
      title: 'New Price',
      dataIndex: 'new_price',
      key: 'new_price',
      width: 140,
      render: (value) => (
        <Text strong>
          {formatPrice(value)}
        </Text>
      )
    },
    {
      title: 'Change',
      dataIndex: 'change_amount',
      key: 'change_amount',
      width: 140,
      render: (
        value,
        record
      ) => {
        if (
          value === null ||
          value === undefined
        ) {
          return (
            <Text type="secondary">
              Initial Price
            </Text>
          );
        }

        const amount =
          Number(value);

        if (amount > 0) {
          return (
            <Text type="danger">
              <ArrowUpOutlined />{' '}
              {formatPrice(
                Math.abs(amount)
              )}
            </Text>
          );
        }

        if (amount < 0) {
          return (
            <Text type="success">
              <ArrowDownOutlined />{' '}
              {formatPrice(
                Math.abs(amount)
              )}
            </Text>
          );
        }

        return (
          <Text>
            {formatPrice(0)}
          </Text>
        );
      }
    },
    {
      title: '% Change',
      dataIndex:
        'change_percentage',
      key: 'change_percentage',
      width: 120,
      render: (value) => {
        if (
          value === null ||
          value === undefined
        ) {
          return (
            <Text type="secondary">
              -
            </Text>
          );
        }

        const percentage =
          Number(value);

        if (
          percentage > 0
        ) {
          return (
            <Tag color="red">
              +{percentage.toFixed(2)}%
            </Tag>
          );
        }

        if (
          percentage < 0
        ) {
          return (
            <Tag color="green">
              {percentage.toFixed(2)}%
            </Tag>
          );
        }

        return (
          <Tag>
            0.00%
          </Tag>
        );
      }
    }
  ];

  // =========================================================
  // CATEGORY TABLE COLUMNS
  // =========================================================

  const categoryColumns = [
    {
      title: 'Category',
      dataIndex: 'image',
      key: 'image',
      width: screens.xs
        ? 220
        : 360,

      render: (
        image,
        record
      ) => (
        <Space
          size={12}
          className="product-identity-cell"
        >
          <Image
            width={
              screens.xs
                ? 42
                : 52
            }
            height={
              screens.xs
                ? 42
                : 52
            }
            src={
              image ||
              '/placeholder-product.jpg'
            }
            preview={false}
            style={{
              objectFit: 'cover',
              borderRadius: 6,
              background:
                '#f2f5f7'
            }}
          />

          <div className="product-identity-copy">
            <Text strong>
              {record.name}
            </Text>

            <Text
              type="secondary"
              className="product-identity-description"
            >
              {record.description ||
                'No description'}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Color',
      dataIndex: 'color',
      key: 'color',
      width: 70,

      render: (color) => (
        <div
          style={{
            width: screens.xs
              ? 15
              : 20,
            height: screens.xs
              ? 15
              : 20,
            backgroundColor:
              color,
            borderRadius: 4
          }}
        />
      ),

      responsive: ['sm']
    },
    {
      title: 'Actions',
      key: 'actions',
      width: screens.xs
        ? 90
        : 180,

      render: (
        _,
        record
      ) => (
        <Space
          size="small"
          className="product-row-actions"
        >
          <Button
            size={
              screens.xs
                ? 'small'
                : 'middle'
            }
            icon={
              <EditOutlined />
            }
            onClick={() =>
              editCategory(
                record
              )
            }
            aria-label={`Edit ${record.name}`}
          >
            {!screens.xs &&
              'Edit'}
          </Button>

          <Popconfirm
            title="Are you sure you want to delete this category?"
            onConfirm={() =>
              handleDeleteCategory(
                record.id
              )
            }
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              size={
                screens.xs
                  ? 'small'
                  : 'middle'
              }
              icon={
                <DeleteOutlined />
              }
              aria-label={`Delete ${record.name}`}
            >
              {!screens.xs &&
                'Delete'}
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // =========================================================
  // PRODUCT TABLE COLUMNS
  // =========================================================

  const productColumns = [
    {
      title: 'Product',
      dataIndex: 'image',
      key: 'image',
      width: screens.xs
        ? 210
        : 330,

      render: (
        image,
        record
      ) => (
        <Space
          size={12}
          className="product-identity-cell"
        >
          <Image
            width={
              screens.xs
                ? 42
                : 52
            }
            height={
              screens.xs
                ? 42
                : 52
            }
            src={
              image ||
              '/placeholder-product.jpg'
            }
            preview={false}
            style={{
              objectFit: 'cover',
              borderRadius: 6,
              background:
                '#f2f5f7'
            }}
          />

          <div className="product-identity-copy">
            <Text strong>
              {record.name}
            </Text>

            <Text
              type="secondary"
              className="product-identity-description"
            >
              {record.category?.name ||
                'Uncategorized'}
            </Text>
          </div>
        </Space>
      )
    },

    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',

      render: (
        price,
        record
      ) => (
        <Text strong>
          ₱
          {Number(price).toLocaleString(
            'en-PH',
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }
          )}
          /
          {record.unit}
        </Text>
      )
    },

    {
      title: 'Status',
      dataIndex: 'available',
      key: 'available',

      render: (
        available
      ) => (
        <Tag
          color={
            available
              ? 'green'
              : 'red'
          }
        >
          {available
            ? 'Available'
            : 'Unavailable'}
        </Tag>
      ),

      responsive: ['sm']
    },

    {
      title: 'Actions',
      key: 'actions',
      width: screens.xs
        ? 170
        : 360,

      render: (
        _,
        record
      ) => (
        <Space
          size="small"
          wrap
          className="product-row-actions"
        >
          <Button
            size={
              screens.xs
                ? 'small'
                : 'middle'
            }
            icon={
              <HistoryOutlined />
            }
            onClick={() =>
              openPriceHistory(
                record
              )
            }
            aria-label={`View price history for ${record.name}`}
          >
            {!screens.xs &&
              'Price History'}
          </Button>

          <Button
            size={
              screens.xs
                ? 'small'
                : 'middle'
            }
            loading={
              productDetailLoadingId ===
              record.id
            }
            icon={
              <EditOutlined />
            }
            onClick={() =>
              editProduct(
                record
              )
            }
            aria-label={`Edit ${record.name}`}
          >
            {!screens.xs &&
              'Edit'}
          </Button>

          <Popconfirm
            title="Are you sure you want to delete this product?"
            onConfirm={() =>
              handleDeleteProduct(
                record.id
              )
            }
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              size={
                screens.xs
                  ? 'small'
                  : 'middle'
              }
              icon={
                <DeleteOutlined />
              }
              aria-label={`Delete ${record.name}`}
            >
              {!screens.xs &&
                'Delete'}
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // =========================================================
  // PRICE HISTORY VIEW
  // =========================================================

  const priceHistoryContent = (
    <>
      {priceHistoryProduct && (
        <>
          <div
            style={{
              marginBottom: 16
            }}
          >
            <Space
              direction="vertical"
              size={2}
            >
              <Text
                type="secondary"
              >
                PRODUCT
              </Text>

              <Title
                level={3}
                style={{
                  margin: 0
                }}
              >
                {
                  priceHistoryProduct.name
                }
              </Title>

              <Text type="secondary">
                Current Price:{' '}
                <Text strong>
                  {formatPrice(
                    priceHistoryProduct.current_price
                  )}
                  /
                  {
                    priceHistoryProduct.unit
                  }
                </Text>
              </Text>
            </Space>
          </div>

          <Card
            size="small"
            style={{
              marginBottom: 16
            }}
          >
            <Space
              wrap
              size="middle"
              style={{
                width: '100%'
              }}
            >
              <Text strong>
                <CalendarOutlined />{' '}
                Period:
              </Text>

              <Select
                value={
                  priceHistoryPeriod
                }
                onChange={(value) =>
                  setPriceHistoryPeriod(
                    value
                  )
                }
                style={{
                  minWidth: screens.xs
                    ? 180
                    : 220
                }}
              >
                <Option value="all">
                  All History
                </Option>

                <Option value="this_week">
                  This Week
                </Option>

                <Option value="last_week">
                  Last Week
                </Option>

                <Option value="this_month">
                  This Month
                </Option>

                <Option value="last_month">
                  Last Month
                </Option>

                <Option value="custom">
                  Custom Range
                </Option>
              </Select>
            </Space>

            {priceHistoryPeriod ===
              'custom' && (
                <>
                  <Divider
                    style={{
                      margin:
                        '16px 0'
                    }}
                  />

                  <Space
                    wrap
                    size="small"
                  >
                    <DatePicker
                      placeholder="Start date"
                      value={
                        customStartDate
                          ? window
                            .moment
                            ? window.moment(
                              customStartDate
                            )
                            : null
                          : null
                      }
                      onChange={(
                        date
                      ) => {
                        if (!date) {
                          setCustomStartDate(
                            null
                          );
                          return;
                        }

                        /*
                         * Ant Design's DatePicker
                         * normally returns a moment
                         * object in AntD v4.
                         */
                        const selected =
                          date.toDate
                            ? date.toDate()
                            : new Date(
                              date
                            );

                        setCustomStartDate(
                          selected
                        );
                      }}
                    />

                    <Text>
                      to
                    </Text>

                    <DatePicker
                      placeholder="End date"
                      value={
                        customEndDate
                          ? window
                            .moment
                            ? window.moment(
                              customEndDate
                            )
                            : null
                          : null
                      }
                      onChange={(
                        date
                      ) => {
                        if (!date) {
                          setCustomEndDate(
                            null
                          );
                          return;
                        }

                        const selected =
                          date.toDate
                            ? date.toDate()
                            : new Date(
                              date
                            );

                        setCustomEndDate(
                          selected
                        );
                      }}
                    />

                    <Button
                      icon={
                        <CloseOutlined />
                      }
                      onClick={() => {
                        setCustomStartDate(
                          null
                        );
                        setCustomEndDate(
                          null
                        );
                      }}
                    >
                      Clear
                    </Button>
                  </Space>
                </>
              )}
          </Card>

          <Row
            gutter={[
              12,
              12
            ]}
            style={{
              marginBottom: 16
            }}
          >
            <Col
              xs={24}
              sm={12}
              md={6}
            >
              <Card
                size="small"
              >
                <Statistic
                  title="Starting Price"
                  value={
                    priceHistorySummary.startPrice ??
                    0
                  }
                  precision={2}
                  prefix="₱"
                />
              </Card>
            </Col>

            <Col
              xs={24}
              sm={12}
              md={6}
            >
              <Card
                size="small"
              >
                <Statistic
                  title="Ending Price"
                  value={
                    priceHistorySummary.endPrice ??
                    0
                  }
                  precision={2}
                  prefix="₱"
                />
              </Card>
            </Col>

            <Col
              xs={24}
              sm={12}
              md={6}
            >
              <Card
                size="small"
              >
                <Statistic
                  title="Price Change"
                  value={
                    Math.abs(
                      priceHistorySummary.change ?? 0
                    )
                  }
                  precision={2}
                  prefix={
                    priceHistorySummary.change > 0 ? (
                      <ArrowUpOutlined />
                    ) : priceHistorySummary.change < 0 ? (
                      <ArrowDownOutlined />
                    ) : (
                      '₱'
                    )
                  }
                  valueStyle={{
                    color:
                      priceHistorySummary.change > 0
                        ? '#cf1322'
                        : priceHistorySummary.change < 0
                          ? '#3f8600'
                          : undefined
                  }}
                  formatter={(value) =>
                    Number(value).toLocaleString(
                      'en-PH',
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }
                    )
                  }
                />
              </Card>
            </Col>

            <Col
              xs={24}
              sm={12}
              md={6}
            >
              <Card
                size="small"
              >
                <Statistic
                  title="% Change"
                  value={
                    Math.abs(
                      priceHistorySummary.percentage ?? 0
                    )
                  }
                  precision={2}
                  suffix="%"
                  valueStyle={{
                    color:
                      priceHistorySummary.percentage > 0
                        ? '#cf1322'
                        : priceHistorySummary.percentage < 0
                          ? '#3f8600'
                          : undefined
                  }}
                  prefix={
                    priceHistorySummary.percentage > 0 ? (
                      <ArrowUpOutlined />
                    ) : priceHistorySummary.percentage < 0 ? (
                      <ArrowDownOutlined />
                    ) : null
                  }
                />
              </Card>
            </Col>
          </Row>

          {priceHistoryPeriod !==
            'all' &&
            getSelectedPeriodRange() && (
              <Text
                type="secondary"
                style={{
                  display: 'block',
                  marginBottom: 12
                }}
              >
                Period:{' '}
                {formatDate(
                  getSelectedPeriodRange()
                    .start
                )}{' '}
                –{' '}
                {formatDate(
                  getSelectedPeriodRange()
                    .end
                )}
              </Text>
            )}

          <Table
            columns={
              priceHistoryColumns
            }
            dataSource={
              filteredPriceHistory
            }
            rowKey={(record) =>
              record.id
            }
            loading={
              priceHistoryLoading
            }
            locale={{
              emptyText:
                priceHistoryPeriod ===
                  'custom' &&
                  (!customStartDate ||
                    !customEndDate)
                  ? 'Select a start and end date'
                  : 'No price changes found for this period'
            }}
            scroll={{
              x: 750
            }}
            size={
              screens.xs
                ? 'small'
                : 'middle'
            }
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: [
                '10',
                '20',
                '50'
              ]
            }}
          />
        </>
      )}
    </>
  );

  // =========================================================
  // PAGE LOADING
  // =========================================================

  if (pageLoading) {
    return (
      <LoadingOverlay
        message="Loading product management data..."
      />
    );
  }

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="product-management-screen">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="product-management-header">
        <div className="product-management-heading">

          <span className="product-management-mark">
            <AppstoreOutlined />
          </span>

          <div>
            <Text className="product-management-eyebrow">
              MARKET CATALOG
            </Text>

            <Title level={2}>
              Products &amp; Categories
            </Title>

            <Text type="secondary">
              Manage product listings, categories,
              pricing, and availability.
            </Text>
          </div>

        </div>
      </header>

      {/* =====================================================
          MAIN TABS
      ====================================================== */}

      <Tabs
        className="product-management-tabs"
        defaultActiveKey="categories"
      >

        {/* ===================================================
            CATEGORIES
        ==================================================== */}

        <TabPane
          tab="Categories"
          key="categories"
        >
          <Card
            className="product-management-card"
            title="Category Management"
            extra={
              <Space
                size="small"
                wrap
              >
                <Button
                  type="primary"
                  icon={
                    <PlusOutlined />
                  }
                  onClick={() => {
                    setEditingCategory(
                      null
                    );

                    form.resetFields();

                    setImagePreview(
                      null
                    );

                    setExistingImage(
                      null
                    );

                    setCategoryModalVisible(
                      true
                    );
                  }}
                  size={
                    screens.xs
                      ? 'small'
                      : 'middle'
                  }
                >
                  Add category
                </Button>

                <Button
                  icon={
                    <ReloadOutlined />
                  }
                  onClick={
                    handleRefresh
                  }
                  loading={
                    refreshLoading
                  }
                  size={
                    screens.xs
                      ? 'small'
                      : 'middle'
                  }
                >
                  Refresh
                </Button>
              </Space>
            }
          >
            <Table
              columns={
                categoryColumns
              }
              dataSource={
                categories
              }
              rowKey="id"
              loading={
                categoriesLoading
              }
              scroll={{
                x: screens.xs
                  ? 400
                  : undefined
              }}
              size={
                screens.xs
                  ? 'small'
                  : 'middle'
              }
            />
          </Card>
        </TabPane>

        {/* ===================================================
            PRODUCTS
        ==================================================== */}

        <TabPane
          tab="Products"
          key="products"
        >
          <Card
            className="product-management-card"
            title="Product Management"
            extra={
              <Space
                size="small"
                wrap
              >
                <Button
                  type="primary"
                  icon={
                    <PlusOutlined />
                  }
                  onClick={() => {
                    setEditingProduct(
                      null
                    );

                    productForm.resetFields();

                    productForm.setFieldsValue({
                      available: true
                    });

                    setImagePreview(
                      null
                    );

                    setExistingImage(
                      null
                    );

                    setProductModalVisible(
                      true
                    );
                  }}
                  size={
                    screens.xs
                      ? 'small'
                      : 'middle'
                  }
                >
                  Add product
                </Button>

                <Button
                  icon={
                    <ReloadOutlined />
                  }
                  onClick={
                    handleRefresh
                  }
                  loading={
                    refreshLoading
                  }
                  size={
                    screens.xs
                      ? 'small'
                      : 'middle'
                  }
                >
                  Refresh
                </Button>
              </Space>
            }
          >

            {/* Product Categories */}

            <Tabs
              activeKey={
                selectedCategory
              }
              onChange={
                handleCategoryChange
              }
              type={
                screens.xs
                  ? 'line'
                  : 'card'
              }
              size={
                screens.xs
                  ? 'small'
                  : 'middle'
              }
              className="product-category-tabs"
              style={{
                marginBottom: 16
              }}
            >

              <TabPane
                tab="All products"
                key="all"
              />

              {categories.map(
                (category) => (
                  <TabPane
                    tab={
                      category.name
                    }
                    key={
                      category.id
                    }
                  />
                )
              )}

            </Tabs>

            <Table
              columns={
                productColumns
              }
              dataSource={
                products
              }
              rowKey="id"
              loading={
                productsLoading
              }
              scroll={{
                x: screens.xs
                  ? 650
                  : undefined
              }}
              size={
                screens.xs
                  ? 'small'
                  : 'middle'
              }
            />

          </Card>
        </TabPane>

      </Tabs>

      {/* =====================================================
          CATEGORY MODAL - MOBILE
      ====================================================== */}

      {screens.xs ? (
        <Drawer
          className="product-management-drawer"
          title={
            editingCategory
              ? 'Edit Category'
              : 'Add Category'
          }
          placement="bottom"
          height="90%"
          onClose={() => {
            setCategoryModalVisible(
              false
            );

            setEditingCategory(
              null
            );

            form.resetFields();

            setImagePreview(
              null
            );

            setExistingImage(
              null
            );
          }}
          visible={
            categoryModalVisible
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={
              handleCategorySubmit
            }
          >

            <Form.Item
              name="name"
              label="Category Name"
              rules={
                !editingCategory
                  ? [
                    {
                      required: true,
                      message:
                        'Please input category name!'
                    }
                  ]
                  : []
              }
            >
              <Input placeholder="Enter category name" />
            </Form.Item>

            <Form.Item
              name="color"
              label="Color"
              rules={
                !editingCategory
                  ? [
                    {
                      required: true,
                      message:
                        'Please select a color!'
                    }
                  ]
                  : []
              }
            >
              <Input type="color" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={
                !editingCategory
                  ? [
                    {
                      required: true,
                      message:
                        'Please input description!'
                    }
                  ]
                  : []
              }
            >
              <Input.TextArea
                rows={3}
                placeholder="Enter category description"
              />
            </Form.Item>

            <Form.Item
              name="image"
              label="Category Image"
            >
              <Upload
                beforeUpload={
                  beforeUpload
                }
                onChange={
                  handleImageChange
                }
                showUploadList={
                  false
                }
                accept="image/*"
                multiple={false}
              >
                <Button
                  icon={
                    <UploadOutlined />
                  }
                  block
                >
                  Select Image
                </Button>
              </Upload>
            </Form.Item>

            {imagePreview && (
              <div
                style={{
                  marginBottom: 16,
                  textAlign:
                    'center'
                }}
              >
                <Image
                  width={
                    screens.xs
                      ? 150
                      : 200
                  }
                  height={
                    screens.xs
                      ? 150
                      : 200
                  }
                  src={
                    imagePreview
                  }
                  style={{
                    objectFit:
                      'cover',
                    borderRadius: 8
                  }}
                />
              </div>
            )}

            <Form.Item>
              <Space
                direction="vertical"
                style={{
                  width: '100%'
                }}
              >
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={
                    loading
                  }
                  icon={
                    <SaveOutlined />
                  }
                  block
                >
                  {editingCategory
                    ? 'Update'
                    : 'Save'}
                </Button>

                <Button
                  onClick={() => {
                    setCategoryModalVisible(
                      false
                    );

                    setEditingCategory(
                      null
                    );

                    form.resetFields();

                    setImagePreview(
                      null
                    );

                    setExistingImage(
                      null
                    );
                  }}
                  block
                >
                  Cancel
                </Button>
              </Space>
            </Form.Item>

          </Form>
        </Drawer>
      ) : (

        /* ===================================================
           CATEGORY MODAL - DESKTOP
        ==================================================== */

        <Modal
          className="product-management-modal"
          title={
            editingCategory
              ? 'Edit Category'
              : 'Add Category'
          }
          visible={
            categoryModalVisible
          }
          onCancel={() => {
            setCategoryModalVisible(
              false
            );

            setEditingCategory(
              null
            );

            form.resetFields();

            setImagePreview(
              null
            );

            setExistingImage(
              null
            );
          }}
          footer={null}
          width={
            screens.md
              ? 600
              : '90%'
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={
              handleCategorySubmit
            }
          >

            <Row gutter={16}>

              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Category Name"
                  rules={
                    !editingCategory
                      ? [
                        {
                          required: true,
                          message:
                            'Please input category name!'
                        }
                      ]
                      : []
                  }
                >
                  <Input placeholder="Enter category name" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="color"
                  label="Color"
                  rules={
                    !editingCategory
                      ? [
                        {
                          required: true,
                          message:
                            'Please select a color!'
                        }
                      ]
                      : []
                  }
                >
                  <Input type="color" />
                </Form.Item>
              </Col>

            </Row>

            <Form.Item
              name="description"
              label="Description"
              rules={
                !editingCategory
                  ? [
                    {
                      required: true,
                      message:
                        'Please input description!'
                    }
                  ]
                  : []
              }
            >
              <Input.TextArea
                rows={3}
                placeholder="Enter category description"
              />
            </Form.Item>

            <Form.Item
              name="image"
              label="Category Image"
            >
              <Upload
                beforeUpload={
                  beforeUpload
                }
                onChange={
                  handleImageChange
                }
                showUploadList={
                  false
                }
                accept="image/*"
                multiple={false}
              >
                <Button
                  icon={
                    <UploadOutlined />
                  }
                >
                  Select Image
                </Button>
              </Upload>
            </Form.Item>

            {imagePreview && (
              <div
                style={{
                  marginBottom: 16,
                  textAlign:
                    'center'
                }}
              >
                <Image
                  width={200}
                  height={200}
                  src={
                    imagePreview
                  }
                  style={{
                    objectFit:
                      'cover',
                    borderRadius: 8
                  }}
                />
              </div>
            )}

            <Form.Item>
              <Space>

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={
                    loading
                  }
                  icon={
                    <SaveOutlined />
                  }
                >
                  {editingCategory
                    ? 'Update'
                    : 'Save'}
                </Button>

                <Button
                  onClick={() => {
                    setCategoryModalVisible(
                      false
                    );

                    setEditingCategory(
                      null
                    );

                    form.resetFields();

                    setImagePreview(
                      null
                    );

                    setExistingImage(
                      null
                    );
                  }}
                >
                  Cancel
                </Button>

              </Space>
            </Form.Item>

          </Form>
        </Modal>
      )}

      {/* =====================================================
          PRODUCT MODAL - MOBILE
      ====================================================== */}

      {screens.xs ? (

        <Drawer
          className="product-management-drawer"
          title={
            editingProduct
              ? 'Edit Product'
              : 'Add Product'
          }
          placement="bottom"
          height="90%"
          onClose={() => {
            setProductModalVisible(
              false
            );

            setEditingProduct(
              null
            );

            productForm.resetFields();

            setImagePreview(
              null
            );

            setExistingImage(
              null
            );
          }}
          visible={
            productModalVisible
          }
        >

          <Form
            form={
              productForm
            }
            layout="vertical"
            onFinish={
              handleProductSubmit
            }
          >

            <Form.Item
              name="name"
              label="Product Name"
              rules={
                !editingProduct
                  ? [
                    {
                      required: true,
                      message:
                        'Please input product name!'
                    }
                  ]
                  : []
              }
            >
              <Input placeholder="Enter product name" />
            </Form.Item>

            <Form.Item
              name="category_id"
              label="Category"
              rules={
                !editingProduct
                  ? [
                    {
                      required: true,
                      message:
                        'Please select a category!'
                    }
                  ]
                  : []
              }
            >
              <Select placeholder="Select category">
                {categories.map(
                  (
                    category
                  ) => (
                    <Option
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                    >
                      {
                        category.name
                      }
                    </Option>
                  )
                )}
              </Select>
            </Form.Item>

            <Row gutter={16}>

              <Col span={12}>
                <Form.Item
                  name="price"
                  label="Price"
                  rules={
                    !editingProduct
                      ? [
                        {
                          required: true,
                          message:
                            'Please input price!'
                        }
                      ]
                      : []
                  }
                >
                  <InputNumber
                    min={0}
                    precision={2}
                    style={{
                      width: '100%'
                    }}
                    placeholder="0.00"
                    prefix="₱"
                  />
                </Form.Item>
              </Col>

              <Form.Item
                noStyle
                shouldUpdate={(previous, current) =>
                  previous.price !== current.price
                }
              >
                {({ getFieldValue }) => {
                  const price = getFieldValue('price');

                  return editingProduct &&
                    price !== undefined &&
                    price !== null &&
                    price !== '' ? (
                    Number(price) !== Number(editingProduct.price) ? (
                    <Col span={24}>
                      <Form.Item
                        name="effective_date"
                        label="Price Effective Date"
                        rules={[
                          {
                            required: true,
                            message: 'Please select when the price takes effect!'
                          }
                        ]}
                      >
                        <DatePicker
                          format="MMMM D, YYYY"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    ) : null
                  ) : null;
                }}
              </Form.Item>

              <Col span={12}>
                <Form.Item
                  name="unit"
                  label="Unit"
                  rules={
                    !editingProduct
                      ? [
                        {
                          required: true,
                          message:
                            'Please input unit!'
                        }
                      ]
                      : []
                  }
                >
                  <Input placeholder="kg, pc, dozen, bunch" />
                </Form.Item>
              </Col>

            </Row>

            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea
                rows={3}
                placeholder="Enter product description"
              />
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
              />
            </Form.Item>

            <Form.Item
              name="image"
              label="Product Image"
            >
              <Upload
                beforeUpload={
                  beforeUpload
                }
                onChange={
                  handleImageChange
                }
                showUploadList={
                  false
                }
                accept="image/*"
                multiple={false}
              >
                <Button
                  icon={
                    <UploadOutlined />
                  }
                  block
                >
                  Select Image
                </Button>
              </Upload>
            </Form.Item>

            {imagePreview && (
              <div
                style={{
                  marginBottom: 16,
                  textAlign:
                    'center'
                }}
              >
                <Image
                  width={
                    screens.xs
                      ? 150
                      : 200
                  }
                  height={
                    screens.xs
                      ? 150
                      : 200
                  }
                  src={
                    imagePreview
                  }
                  style={{
                    objectFit:
                      'cover',
                    borderRadius: 8
                  }}
                />
              </div>
            )}

            <Form.Item>
              <Space
                direction="vertical"
                style={{
                  width: '100%'
                }}
              >

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={
                    loading
                  }
                  icon={
                    <SaveOutlined />
                  }
                  block
                >
                  {editingProduct
                    ? 'Update'
                    : 'Save'}
                </Button>

                <Button
                  onClick={() => {
                    setProductModalVisible(
                      false
                    );

                    setEditingProduct(
                      null
                    );

                    productForm.resetFields();

                    setImagePreview(
                      null
                    );

                    setExistingImage(
                      null
                    );
                  }}
                  block
                >
                  Cancel
                </Button>

              </Space>
            </Form.Item>

          </Form>
        </Drawer>

      ) : (

        /* ===================================================
           PRODUCT MODAL - DESKTOP
        ==================================================== */

        <Modal
          className="product-management-modal"
          title={
            editingProduct
              ? 'Edit Product'
              : 'Add Product'
          }
          visible={
            productModalVisible
          }
          onCancel={() => {
            setProductModalVisible(
              false
            );

            setEditingProduct(
              null
            );

            productForm.resetFields();

            setImagePreview(
              null
            );

            setExistingImage(
              null
            );
          }}
          footer={null}
          width={
            screens.md
              ? 600
              : '90%'
          }
        >

          <Form
            form={
              productForm
            }
            layout="vertical"
            onFinish={
              handleProductSubmit
            }
          >

            <Row gutter={16}>

              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Product Name"
                  rules={
                    !editingProduct
                      ? [
                        {
                          required: true,
                          message:
                            'Please input product name!'
                        }
                      ]
                      : []
                  }
                >
                  <Input placeholder="Enter product name" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="category_id"
                  label="Category"
                  rules={
                    !editingProduct
                      ? [
                        {
                          required: true,
                          message:
                            'Please select a category!'
                        }
                      ]
                      : []
                  }
                >
                  <Select placeholder="Select category">
                    {categories.map(
                      (
                        category
                      ) => (
                        <Option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {
                            category.name
                          }
                        </Option>
                      )
                    )}
                  </Select>
                </Form.Item>
              </Col>

            </Row>

            <Row gutter={16}>

              <Col span={12}>
                <Form.Item
                  name="price"
                  label="Price"
                  rules={
                    !editingProduct
                      ? [
                        {
                          required: true,
                          message:
                            'Please input price!'
                        }
                      ]
                      : []
                  }
                >
                  <InputNumber
                    min={0}
                    precision={2}
                    style={{
                      width: '100%'
                    }}
                    placeholder="0.00"
                    prefix="₱"
                  />
                </Form.Item>
              </Col>

              <Form.Item
                noStyle
                shouldUpdate={(previous, current) =>
                  previous.price !== current.price
                }
              >
                {({ getFieldValue }) => {
                  const price = getFieldValue('price');

                  return editingProduct &&
                    price !== undefined &&
                    price !== null &&
                    price !== '' ? (
                    Number(price) !== Number(editingProduct.price) ? (
                    <Col span={24}>
                      <Form.Item
                        name="effective_date"
                        label="Price Effective Date"
                        rules={[
                          {
                            required: true,
                            message: 'Please select when the price takes effect!'
                          }
                        ]}
                      >
                        <DatePicker
                          format="MMMM D, YYYY"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    ) : null
                  ) : null;
                }}
              </Form.Item>

              <Col span={12}>
                <Form.Item
                  name="unit"
                  label="Unit"
                  rules={
                    !editingProduct
                      ? [
                        {
                          required: true,
                          message:
                            'Please input unit!'
                        }
                      ]
                      : []
                  }
                >
                  <Input placeholder="kg, pc, dozen, bunch" />
                </Form.Item>
              </Col>

            </Row>

            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea
                rows={3}
                placeholder="Enter product description"
              />
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
              />
            </Form.Item>

            <Form.Item
              name="image"
              label="Product Image"
            >
              <Upload
                beforeUpload={
                  beforeUpload
                }
                onChange={
                  handleImageChange
                }
                showUploadList={
                  false
                }
                accept="image/*"
                multiple={false}
              >
                <Button
                  icon={
                    <UploadOutlined />
                  }
                >
                  Select Image
                </Button>
              </Upload>
            </Form.Item>

            {imagePreview && (
              <div
                style={{
                  marginBottom: 16,
                  textAlign:
                    'center'
                }}
              >
                <Image
                  width={200}
                  height={200}
                  src={
                    imagePreview
                  }
                  style={{
                    objectFit:
                      'cover',
                    borderRadius: 8
                  }}
                />
              </div>
            )}

            <Form.Item>
              <Space>

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={
                    loading
                  }
                  icon={
                    <SaveOutlined />
                  }
                >
                  {editingProduct
                    ? 'Update'
                    : 'Save'}
                </Button>

                <Button
                  onClick={() => {
                    setProductModalVisible(
                      false
                    );

                    setEditingProduct(
                      null
                    );

                    productForm.resetFields();

                    setImagePreview(
                      null
                    );

                    setExistingImage(
                      null
                    );
                  }}
                >
                  Cancel
                </Button>

              </Space>
            </Form.Item>

          </Form>

        </Modal>
      )}

      {/* =====================================================
          PRICE HISTORY MODAL / DRAWER
      ====================================================== */}

      {screens.xs ? (

        <Drawer
          className="product-management-drawer"
          title={
            <Space>
              <HistoryOutlined />
              <span>
                Price History
              </span>
            </Space>
          }
          placement="bottom"
          height="92%"
          visible={
            priceHistoryVisible
          }
          onClose={
            closePriceHistory
          }
        >
          {priceHistoryContent}
        </Drawer>

      ) : (

        <Modal
          className="product-management-modal"
          title={
            <Space>
              <HistoryOutlined />
              <span>
                Product Price History
              </span>
            </Space>
          }
          visible={
            priceHistoryVisible
          }
          onCancel={
            closePriceHistory
          }
          footer={[
            <Button
              key="close"
              onClick={
                closePriceHistory
              }
            >
              Close
            </Button>
          ]}
          width={
            screens.xl
              ? 1100
              : '94%'
          }
        >
          {priceHistoryContent}
        </Modal>

      )}

    </div>
  );
};

export default ProductManagement;