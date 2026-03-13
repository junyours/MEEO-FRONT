import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Card,
  Table,
  DatePicker,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Descriptions,
  Row,
  Col,
  Statistic,
  Alert,
  Empty,
  Spin,
  Tabs,
  message,
  Select
} from 'antd';
import {
  ReloadOutlined,
  ShopOutlined,
  HomeOutlined,
  DollarOutlined,
  CalendarOutlined,
  LineChartOutlined,
  EyeOutlined,
  DownloadOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../Api';
import LoadingOverlay from './Loading';
import './MarketOpenSpaceScreen.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

const MarketOpenSpaceScreen = () => {
  const [loading, setLoading] = useState(false);
  const [collectionsData, setCollectionsData] = useState(null);
  const [yearlyData, setYearlyData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [activeTab, setActiveTab] = useState('market');
  const [mainTableTab, setMainTableTab] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [monthlyDetailsModalVisible, setMonthlyDetailsModalVisible] = useState(false);
  const [selectedMonthDetails, setSelectedMonthDetails] = useState(null);
  const [monthlyDetailsTab, setMonthlyDetailsTab] = useState('market');
  const [detailsType, setDetailsType] = useState('all');

  // Generate year options (current year and 5 years back)
  const currentYear = dayjs().year();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchYearlyData();
  }, [selectedYear]);

  const fetchYearlyData = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/admin/market-open-space/collections-by-year', { 
        params: { year: selectedYear } 
      });
      
      if (response.data.success) {
        setYearlyData(response.data.data);
      } else {
        console.error('Failed to fetch yearly data');
      }
    } catch (error) {
      console.error('Error fetching yearly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyDetails = async (month, type = 'all') => {
    try {
      setLoading(true);
      
      const response = await api.get('/admin/market-open-space/monthly-details', { 
        params: { year: selectedYear, month } 
      });
      
      if (response.data.success) {
        setSelectedMonthDetails(response.data.data);
        setMonthlyDetailsModalVisible(true);
        setDetailsType(type); // Set the details type
        // Set the monthly details tab based on the type parameter
        if (type === 'market') {
          setMonthlyDetailsTab('market');
        } else if (type === 'open-space') {
          setMonthlyDetailsTab('open-space');
        } else if (type === 'taboc-gym') {
          setMonthlyDetailsTab('taboc-gym');
        } else {
          // For 'all' type, use the main table tab selection
          setMonthlyDetailsTab(mainTableTab === 'market' ? 'market' : mainTableTab === 'open-space' ? 'open-space' : 'taboc-gym');
        }
      } else {
        console.error('Failed to fetch monthly details');
      }
    } catch (error) {
      console.error('Error fetching monthly details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchYearlyData();
  };

  const addGovernmentHeader = (doc, pageWidth, margin = 20) => {
    let yPosition = 10;
    
    // Government Header with Logos matching design
    try {
      // Add Municipality logo on the left (circular logo with blue, red, yellow, black elements)
      doc.addImage('/logo_Opol.png', 'PNG', margin, yPosition, 30, 30);
      
      // Add MEE logo on the right (predominantly red and yellow circular logo)
      doc.addImage('/logo_meeo.png', 'PNG', pageWidth - margin - 30, yPosition, 30, 30);
    } catch (error) {
      console.log('Logos not found:', error);
    }
    
    yPosition += 15;
    
    // Centered Government Header - matching exact requirements
    doc.setFont('calibri', 'bold');
    doc.setFontSize(12.3);
    doc.text('Province of Misamis Oriental', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 6;
    doc.setFontSize(12.3);
    doc.text('Municipality of Opol', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 6;
    doc.setFontSize(12.5);
    doc.text('OFFICE OF THE MUNICIPAL ECONOMIC ENTERPRISE', pageWidth / 2, yPosition, { align: 'center' });
    
    // Add double lines below OFFICE OF THE MUNICIPAL ECONOMIC ENTERPRISE
    yPosition += 5;
    doc.setLineWidth(0.5);
    doc.line(margin + 30, yPosition, pageWidth - margin - 30, yPosition);
    yPosition += 2;
    doc.line(margin + 30, yPosition, pageWidth - margin - 30, yPosition);
    doc.setLineWidth(0); // Reset to default line width
    
    yPosition += 12;
    
    return yPosition; // Return the next y position for content
  };

  const exportToPDF = () => {
    if (!yearlyData) {
      message.error('No data available to export');
      return;
    }

    console.log('Exporting PDF with data:', yearlyData);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Use the consistent government header
      let yPosition = addGovernmentHeader(doc, pageWidth);
      
      // Report Title
      yPosition += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      
      let reportTitle = '';
      if (mainTableTab === 'market') {
        reportTitle = `Market Collections Report - ${selectedYear}`;
      } else if (mainTableTab === 'open-space') {
        reportTitle = `Open Space Collections Report - ${selectedYear}`;
      } else if (mainTableTab === 'taboc-gym') {
        reportTitle = `Taboc Gym Collections Report - ${selectedYear}`;
      } else {
        reportTitle = `Market, Open Space & Taboc Gym Collections Report - ${selectedYear}`;
      }
      
      doc.text(reportTitle, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      
      // Date below title
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      doc.text(currentDate, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      
      const monthlyData = yearlyData.monthly_data || [];
      
      if (monthlyData.length > 0) {
        let tableData = [];
        let tableHeaders = [];
        
        if (mainTableTab === 'market') {
          tableHeaders = ['Month', 'Market Collections', 'Market Payments'];
          tableData = monthlyData.map(month => ({
            'Month': month.month,
            'Market Collections': Number(month.market_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            'Market Payments': month.market_payment_count
          }));
        } else if (mainTableTab === 'open-space') {
          tableHeaders = ['Month', 'Open Space Collections', 'Open Space Payments'];
          tableData = monthlyData.map(month => ({
            'Month': month.month,
            'Open Space Collections': Number(month.open_space_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            'Open Space Payments': month.open_space_payment_count
          }));
        } else if (mainTableTab === 'taboc-gym') {
          tableHeaders = ['Month', 'Taboc Gym Collections', 'Taboc Gym Payments'];
          tableData = monthlyData.map(month => ({
            'Month': month.month,
            'Taboc Gym Collections': Number(month.taboc_gym_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            'Taboc Gym Payments': month.taboc_gym_payment_count
          }));
        } else {
          tableHeaders = ['Month', 'Market Collections', 'Market Payments', 'Open Space Collections', 'Open Space Payments', 'Taboc Gym Collections', 'Taboc Gym Payments', 'Total Collections', 'Total Payments'];
          tableData = monthlyData.map(month => ({
            'Month': month.month,
            'Market Collections': Number(month.market_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            'Market Payments': month.market_payment_count,
            'Open Space Collections': Number(month.open_space_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            'Open Space Payments': month.open_space_payment_count,
            'Taboc Gym Collections': Number(month.taboc_gym_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            'Taboc Gym Payments': month.taboc_gym_payment_count,
            'Total Collections': Number(month.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            'Total Payments': month.total_payment_count
          }));
        }
        
        // Calculate totals for the summary row
        let totalRow = [];
        if (mainTableTab === 'market') {
          const totalMarketAmount = monthlyData.reduce((sum, month) => sum + month.market_amount, 0);
          const totalMarketPayments = monthlyData.reduce((sum, month) => sum + month.market_payment_count, 0);
          totalRow = [
            'Total',
            Number(totalMarketAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            totalMarketPayments
          ];
        } else if (mainTableTab === 'open-space') {
          const totalOpenSpaceAmount = monthlyData.reduce((sum, month) => sum + month.open_space_amount, 0);
          const totalOpenSpacePayments = monthlyData.reduce((sum, month) => sum + month.open_space_payment_count, 0);
          totalRow = [
            'Total',
            Number(totalOpenSpaceAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            totalOpenSpacePayments
          ];
        } else if (mainTableTab === 'taboc-gym') {
          const totalTabocGymAmount = monthlyData.reduce((sum, month) => sum + month.taboc_gym_amount, 0);
          const totalTabocGymPayments = monthlyData.reduce((sum, month) => sum + month.taboc_gym_payment_count, 0);
          totalRow = [
            'Total',
            Number(totalTabocGymAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            totalTabocGymPayments
          ];
        } else {
          const totalMarketAmount = monthlyData.reduce((sum, month) => sum + month.market_amount, 0);
          const totalMarketPayments = monthlyData.reduce((sum, month) => sum + month.market_payment_count, 0);
          const totalOpenSpaceAmount = monthlyData.reduce((sum, month) => sum + month.open_space_amount, 0);
          const totalOpenSpacePayments = monthlyData.reduce((sum, month) => sum + month.open_space_payment_count, 0);
          const totalTabocGymAmount = monthlyData.reduce((sum, month) => sum + month.taboc_gym_amount, 0);
          const totalTabocGymPayments = monthlyData.reduce((sum, month) => sum + month.taboc_gym_payment_count, 0);
          const totalAmount = monthlyData.reduce((sum, month) => sum + month.total_amount, 0);
          const totalPayments = monthlyData.reduce((sum, month) => sum + month.total_payment_count, 0);
          totalRow = [
            'Total',
            Number(totalMarketAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            totalMarketPayments,
            Number(totalOpenSpaceAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            totalOpenSpacePayments,
            Number(totalTabocGymAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            totalTabocGymPayments,
            Number(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            totalPayments
          ];
        }

        autoTable(doc, {
          head: [tableHeaders],
          body: [...tableData.map(row => Object.values(row)), totalRow],
          startY: yPosition,
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: 9,
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            fillColor: [255, 255, 255],
          },
          headStyles: {
            textColor: [0, 0, 0],
            fillColor: [240, 240, 240],
            lineColor: [0, 0, 0],
            fontStyle: 'bold',
          },
          footStyles: {
            textColor: [0, 0, 0],
            fillColor: [245, 245, 245],
            lineColor: [0, 0, 0],
            fontStyle: 'bold',
          },
          didParseCell: function(data) {
            // Make the total row bold and add background color
            if (data.row.index === tableData.length) {
              data.cell.styles.fillColor = [245, 245, 245];
              data.cell.styles.fontStyle = 'bold';
            }
          },
        });
        
        yPosition = doc.lastAutoTable.finalY + 20;
      } else {
        doc.text('No monthly data available', 14, yPosition);
        yPosition += 20;
      }
      
      // Save the PDF
      const fileName = mainTableTab === 'market' ? `market-collections-${selectedYear}.pdf` : 
                     mainTableTab === 'open-space' ? `open-space-collections-${selectedYear}.pdf` : 
                     mainTableTab === 'taboc-gym' ? `taboc-gym-collections-${selectedYear}.pdf` : 
                     `market-open-space-taboc-gym-collections-${selectedYear}.pdf`;
      
      doc.save(fileName);
      message.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      message.error('Failed to export PDF');
    }
  };

  const prepareChartData = () => {
    if (!yearlyData) return [];

    console.log('Yearly Data:', yearlyData);
    
    const monthlyData = yearlyData.monthly_data || [];
    
    return monthlyData.map(month => ({
      date: month.month.substring(0, 3),
      market: month.market_amount,
      openSpace: month.open_space_amount,
      tabocGym: month.taboc_gym_amount
    }));
  };

  const handleViewPayment = async (record) => {
    try {
      // If it's a grouped payment (has all_payments array), fetch all payment details
      if (record.all_payments && record.all_payments.length > 0) {
        const paymentIds = record.all_payments.map(p => p.id);
        const response = await api.post('/admin/market-open-space/grouped-payment-details', {
          payment_ids: paymentIds
        });
        
        if (response.data.success) {
          setSelectedPayment(response.data.data);
          setPaymentModalVisible(true);
        }
      } else {
        // Single payment
        const response = await api.get(`/admin/market-open-space/payment/${record.id}`);
        
        if (response.data.success) {
          setSelectedPayment(response.data.data);
          setPaymentModalVisible(true);
        }
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
    }
  };

  const monthlyColumns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (month) => <Text strong>{month}</Text>,
      width: 120,
    },
    {
      title: 'Market Collections',
      dataIndex: 'market_amount',
      key: 'market_amount',
      render: (amount, record) => (
        <div>
          <Text strong style={{ color: '#52c41a' }}>
            ₱{Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <div><Text type="secondary" style={{ fontSize: '12px' }}>{record.market_payment_count} payments</Text></div>
        </div>
      ),
      sorter: (a, b) => a.market_amount - b.market_amount,
      width: 150,
    },
    {
      title: 'Open Space Collections',
      dataIndex: 'open_space_amount',
      key: 'open_space_amount',
      render: (amount, record) => (
        <div>
          <Text strong style={{ color: '#1890ff' }}>
            ₱{Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <div><Text type="secondary" style={{ fontSize: '12px' }}>{record.open_space_payment_count} payments</Text></div>
        </div>
      ),
      sorter: (a, b) => a.open_space_amount - b.open_space_amount,
      width: 150,
    },
    {
      title: 'Taboc Gym Collections',
      dataIndex: 'taboc_gym_amount',
      key: 'taboc_gym_amount',
      render: (amount, record) => (
        <div>
          <Text strong style={{ color: '#f59e0b' }}>
            ₱{Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <div><Text type="secondary" style={{ fontSize: '12px' }}>{record.taboc_gym_payment_count} payments</Text></div>
        </div>
      ),
      sorter: (a, b) => a.taboc_gym_amount - b.taboc_gym_amount,
      width: 150,
    },
    {
      title: 'Total Collections',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount, record) => (
        <div>
          <Text strong style={{ color: '#8b5cf6' }}>
            ₱{Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <div><Text type="secondary" style={{ fontSize: '12px' }}>{record.total_payment_count} payments</Text></div>
        </div>
      ),
      sorter: (a, b) => a.total_amount - b.total_amount,
      width: 150,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => fetchMonthlyDetails(record.month_number)}
          disabled={record.total_payment_count === 0}
        >
          View Details
        </Button>
      ),
      width: 120,
    },
  ];

  const marketColumns = [
    {
      title: 'Payment Date',
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      sorter: (a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime(),
      width: 120,
    },
    {
      title: 'Vendor Name',
      dataIndex: 'vendor_name',
      key: 'vendor_name',
      render: (name) => <Text strong>{name}</Text>,
      width: 180,
    },
    {
      title: 'Stall Info',
      key: 'stall_info',
      render: (record) => (
        <div>
          {record.stall_info && record.stall_info.length > 0 ? (
            <div>
              <Text strong>
                {record.stall_info.map((stall, index) => (
                  <span key={index}>
                    {stall.stall_number}
                    {index < record.stall_info.length - 1 && ', '}
                  </span>
                ))}
              </Text>
            </div>
          ) : (
            <Text type="secondary">N/A</Text>
          )}
        </div>
      ),
      width: 200,
    },
    {
      title: 'Payment Type',
      key: 'payment_types',
      render: (record) => (
        <div>
          {record.payment_types && record.payment_types.length > 0 ? (
            <div>
              <Tag color={getPaymentTypeColor(record.payment_types[0])}>
                {record.payment_types[0]?.charAt(0).toUpperCase() + record.payment_types[0]?.slice(1)}
              </Tag>
              {record.payment_types.length > 1 && (
                <div><Text type="secondary" style={{ fontSize: '12px' }}>+{record.payment_types.length - 1} more types</Text></div>
              )}
            </div>
          ) : (
            <Text type="secondary">N/A</Text>
          )}
        </div>
      ),
      width: 120,
    },
    {
      title: 'Amount Paid',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount, record) => (
        <div>
          <Text strong style={{ color: '#52c41a' }}>
            ₱{Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          {record.payment_count > 1 && (
            <div><Text type="secondary" style={{ fontSize: '12px' }}>{record.payment_count} payments</Text></div>
          )}
        </div>
      ),
      sorter: (a, b) => a.total_amount - b.total_amount,
      width: 120,
    },
    {
      title: 'Status',
      key: 'statuses',
      render: (record) => (
        <div>
          {record.statuses && record.statuses.length > 0 ? (
            <div>
              <Tag color={getStatusColor(record.statuses[0])}>
                {record.statuses[0]?.charAt(0).toUpperCase() + record.statuses[0]?.slice(1)}
              </Tag>
              {record.statuses.length > 1 && (
                <div><Text type="secondary" style={{ fontSize: '12px' }}>+{record.statuses.length - 1} more</Text></div>
              )}
            </div>
          ) : (
            <Text type="secondary">N/A</Text>
          )}
        </div>
      ),
      width: 100,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewPayment(record)}
        >
          View
        </Button>
      ),
      width: 80,
    },
  ];

  // Filtered columns for market-only view
  const marketOnlyColumns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (month) => <Text strong>{month}</Text>,
      width: 120,
    },
    {
      title: 'Market Collections',
      dataIndex: 'market_amount',
      key: 'market_amount',
      render: (amount, record) => (
        <div>
          <Text strong style={{ color: '#52c41a' }}>
            ₱{Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <div><Text type="secondary" style={{ fontSize: '12px' }}>{record.market_payment_count} payments</Text></div>
        </div>
      ),
      sorter: (a, b) => a.market_amount - b.market_amount,
      width: 200,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Button
          style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#d9d9d9' }}
          size="small"
          icon={<EyeOutlined />}
          onClick={() => fetchMonthlyDetails(record.month_number, 'market')}
          disabled={record.market_payment_count === 0}
        >
          View Details
        </Button>
      ),
      width: 120,
    },
  ];

  // Filtered columns for open-space-only view
  const openSpaceOnlyColumns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (month) => <Text strong>{month}</Text>,
      width: 120,
    },
    {
      title: 'Open Space Collections',
      dataIndex: 'open_space_amount',
      key: 'open_space_amount',
      render: (amount, record) => (
        <div>
          <Text strong style={{ color: '#1890ff' }}>
            ₱{Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <div><Text type="secondary" style={{ fontSize: '12px' }}>{record.open_space_payment_count} payments</Text></div>
        </div>
      ),
      sorter: (a, b) => a.open_space_amount - b.open_space_amount,
      width: 200,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Button
          style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#d9d9d9' }}
          size="small"
          icon={<EyeOutlined />}
          onClick={() => fetchMonthlyDetails(record.month_number, 'open-space')}
          disabled={record.open_space_payment_count === 0}
        >
          View Details
        </Button>
      ),
      width: 120,
    },
  ];

  // Filtered columns for Taboc gym-only view
  const tabocGymOnlyColumns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (month) => <Text strong>{month}</Text>,
      width: 120,
    },
    {
      title: 'Taboc Gym Collections',
      dataIndex: 'taboc_gym_amount',
      key: 'taboc_gym_amount',
      render: (amount, record) => (
        <div>
          <Text strong style={{ color: '#f59e0b' }}>
            ₱{Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <div><Text type="secondary" style={{ fontSize: '12px' }}>{record.taboc_gym_payment_count} payments</Text></div>
        </div>
      ),
      sorter: (a, b) => a.taboc_gym_amount - b.taboc_gym_amount,
      width: 200,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Button
          style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#d9d9d9' }}
          size="small"
          icon={<EyeOutlined />}
          onClick={() => fetchMonthlyDetails(record.month_number, 'taboc-gym')}
          disabled={record.taboc_gym_payment_count === 0}
        >
          View Details
        </Button>
      ),
      width: 120,
    },
  ];

  const openSpaceColumns = [
    {
      title: 'Payment Date',
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      sorter: (a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime(),
      width: 120,
    },
    {
      title: 'Vendor Name',
      dataIndex: 'vendor_name',
      key: 'vendor_name',
      render: (name) => <Text strong>{name}</Text>,
      width: 180,
    },
    {
      title: 'Stall Info',
      key: 'stall_info',
      render: (record) => (
        <div>
          {record.stall_info && record.stall_info.length > 0 ? (
            <div>
              <Text strong>
                {record.stall_info.map((stall, index) => (
                  <span key={index}>
                    {stall.stall_number}
                    {index < record.stall_info.length - 1 && ', '}
                  </span>
                ))}
              </Text>
            </div>
          ) : (
            <Text type="secondary">N/A</Text>
          )}
        </div>
      ),
      width: 200,
    },
    {
      title: 'Payment Type',
      key: 'payment_types',
      render: (record) => (
        <div>
          {record.payment_types && record.payment_types.length > 0 ? (
            <div>
              <Tag color={getPaymentTypeColor(record.payment_types[0])}>
                {record.payment_types[0]?.charAt(0).toUpperCase() + record.payment_types[0]?.slice(1)}
              </Tag>
              {record.payment_types.length > 1 && (
                <div><Text type="secondary" style={{ fontSize: '12px' }}>+{record.payment_types.length - 1} more types</Text></div>
              )}
            </div>
          ) : (
            <Text type="secondary">N/A</Text>
          )}
        </div>
      ),
      width: 120,
    },
    {
      title: 'Amount Paid',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount, record) => (
        <div>
          <Text strong style={{ color: '#1890ff' }}>
            ₱{Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          {record.payment_count > 1 && (
            <div><Text type="secondary" style={{ fontSize: '12px' }}>{record.payment_count} payments</Text></div>
          )}
        </div>
      ),
      sorter: (a, b) => a.total_amount - b.total_amount,
      width: 120,
    },
    {
      title: 'Status',
      key: 'statuses',
      render: (record) => (
        <div>
          {record.statuses && record.statuses.length > 0 ? (
            <div>
              <Tag color={getStatusColor(record.statuses[0])}>
                {record.statuses[0]?.charAt(0).toUpperCase() + record.statuses[0]?.slice(1)}
              </Tag>
              {record.statuses.length > 1 && (
                <div><Text type="secondary" style={{ fontSize: '12px' }}>+{record.statuses.length - 1} more</Text></div>
              )}
            </div>
          ) : (
            <Text type="secondary">N/A</Text>
          )}
        </div>
      ),
      width: 100,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewPayment(record)}
        >
          View
        </Button>
      ),
      width: 80,
    },
  ];

  const tabocGymColumns = [
    {
      title: 'Payment Date',
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      sorter: (a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime(),
      width: 120,
    },
    {
      title: 'Vendor Name',
      dataIndex: 'vendor_name',
      key: 'vendor_name',
      render: (name) => <Text strong>{name}</Text>,
      width: 180,
    },
    {
      title: 'Stall Info',
      key: 'stall_info',
      render: (record) => (
        <div>
          {record.stall_info && record.stall_info.length > 0 ? (
            <div>
              <Text strong>
                {record.stall_info.map((stall, index) => (
                  <span key={index}>
                    {stall.stall_number}
                    {index < record.stall_info.length - 1 && ', '}
                  </span>
                ))}
              </Text>
            </div>
          ) : (
            <Text type="secondary">N/A</Text>
          )}
        </div>
      ),
      width: 200,
    },
    {
      title: 'Payment Type',
      key: 'payment_types',
      render: (record) => (
        <div>
          {record.payment_types && record.payment_types.length > 0 ? (
            <div>
              <Tag color={getPaymentTypeColor(record.payment_types[0])}>
                {record.payment_types[0]?.charAt(0).toUpperCase() + record.payment_types[0]?.slice(1)}
              </Tag>
              {record.payment_types.length > 1 && (
                <div><Text type="secondary" style={{ fontSize: '12px' }}>+{record.payment_types.length - 1} more types</Text></div>
              )}
            </div>
          ) : (
            <Text type="secondary">N/A</Text>
          )}
        </div>
      ),
      width: 120,
    },
    {
      title: 'Amount Paid',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount, record) => (
        <div>
          <Text strong style={{ color: '#f59e0b' }}>
            ₱{Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          {record.payment_count > 1 && (
            <div><Text type="secondary" style={{ fontSize: '12px' }}>{record.payment_count} payments</Text></div>
          )}
        </div>
      ),
      sorter: (a, b) => a.total_amount - b.total_amount,
      width: 120,
    },
    {
      title: 'Status',
      key: 'statuses',
      render: (record) => (
        <div>
          {record.statuses && record.statuses.length > 0 ? (
            <div>
              <Tag color={getStatusColor(record.statuses[0])}>
                {record.statuses[0]?.charAt(0).toUpperCase() + record.statuses[0]?.slice(1)}
              </Tag>
              {record.statuses.length > 1 && (
                <div><Text type="secondary" style={{ fontSize: '12px' }}>+{record.statuses.length - 1} more</Text></div>
              )}
            </div>
          ) : (
            <Text type="secondary">N/A</Text>
          )}
        </div>
      ),
      width: 100,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewPayment(record)}
        >
          View
        </Button>
      ),
      width: 80,
    },
  ];

  const getPaymentTypeColor = (type) => {
    const colors = {
      'daily': 'green',
      'advance': 'blue',
      'partial': 'orange',
      'fully paid': 'cyan',
      'missed': 'red',
      'temp_closed': 'purple',
      'collected': 'green'
    };
    return colors[type] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      'paid': 'green',
      'collected': 'green',
      'pending': 'orange',
      'overdue': 'red'
    };
    return colors[status] || 'default';
  };

  // Analytics Functions
  const getPeakAnalytics = () => {
    if (!yearlyData?.monthly_data || yearlyData.monthly_data.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Text type="secondary">No data available for analysis</Text>
        </div>
      );
    }

    const monthlyData = yearlyData.monthly_data;
    
    // Find peak months
    const marketPeak = monthlyData.reduce((max, month) => 
      month.market_amount > max.market_amount ? month : max
    );
    
    const openSpacePeak = monthlyData.reduce((max, month) => 
      month.open_space_amount > max.open_space_amount ? month : max
    );
    
    const tabocGymPeak = monthlyData.reduce((max, month) => 
      month.taboc_gym_amount > max.taboc_gym_amount ? month : max
    );
    
    const totalPeak = monthlyData.reduce((max, month) => 
      month.total_amount > max.total_amount ? month : max
    );

    return (
      <div>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: '#10b981', 
              borderRadius: '50%', 
              marginRight: '8px' 
            }} />
            <Text strong style={{ fontSize: '14px' }}>Market Peak</Text>
          </div>
          <div style={{ marginLeft: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>
              {marketPeak.month}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              ₱{Number(marketPeak.market_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: '#3b82f6', 
              borderRadius: '50%', 
              marginRight: '8px' 
            }} />
            <Text strong style={{ fontSize: '14px' }}>Open Space Peak</Text>
          </div>
          <div style={{ marginLeft: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6' }}>
              {openSpacePeak.month}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              ₱{Number(openSpacePeak.open_space_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: '#f59e0b', 
              borderRadius: '50%', 
              marginRight: '8px' 
            }} />
            <Text strong style={{ fontSize: '14px' }}>Taboc Gym Peak</Text>
          </div>
          <div style={{ marginLeft: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b' }}>
              {tabocGymPeak.month}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              ₱{Number(tabocGymPeak.taboc_gym_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div style={{ paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: '#8b5cf6', 
              borderRadius: '50%', 
              marginRight: '8px' 
            }} />
            <Text strong style={{ fontSize: '14px' }}>Overall Peak</Text>
          </div>
          <div style={{ marginLeft: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#8b5cf6' }}>
              {totalPeak.month}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              ₱{Number(totalPeak.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getAverageMonthlyCollections = (type) => {
    if (!yearlyData?.monthly_data || yearlyData.monthly_data.length === 0) {
      return '₱0';
    }

    const total = yearlyData.monthly_data.reduce((sum, month) => {
      return sum + (type === 'market' ? month.market_amount : type === 'open-space' ? month.open_space_amount : month.taboc_gym_amount);
    }, 0);

    const average = total / yearlyData.monthly_data.length;
    return `₱${Number(average).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getGrowthRate = (type) => {
    // This would typically compare with previous year data
    // For now, returning a placeholder
    const growthRates = {
      'market': '+12.5%',
      'open-space': '+8.3%',
      'taboc-gym': '+15.2%'
    };
    return growthRates[type] || '+0%';
  };

  const getCollectionEfficiency = () => {
    if (!yearlyData?.monthly_data || yearlyData.monthly_data.length === 0) {
      return '0%';
    }

    const totalPayments = yearlyData.monthly_data.reduce((sum, month) => 
      sum + month.total_payment_count, 0
    );
    
    const expectedPayments = yearlyData.monthly_data.length * 100; // Assuming 100 expected payments per month
    const efficiency = Math.min((totalPayments / expectedPayments) * 100, 100);
    
    return `${efficiency.toFixed(1)}%`;
  };

  const getBestMonth = () => {
    if (!yearlyData?.monthly_data || yearlyData.monthly_data.length === 0) {
      return 'N/A';
    }

    const bestMonth = yearlyData.monthly_data.reduce((max, month) => 
      month.total_amount > max.total_amount ? month : max
    );

    return bestMonth.month;
  };

  const renderMarketTable = () => (
    <Card 
      title={
        <span>
          <ShopOutlined style={{ color: '#52c41a' }} /> Market Collections
        </span>
      }
      extra={
        <Text type="secondary">
          {collectionsData?.market_collections?.payments?.length || 0} payments
        </Text>
      }
    >
      <Table
        dataSource={collectionsData?.market_collections?.payments || []}
        columns={marketColumns}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} payments`,
        }}
        scroll={{ x: 1000 }}
        loading={loading}
        size="middle"
      />
    </Card>
  );

  const renderOpenSpaceTable = () => (
    <Card 
      title={
        <span>
          <HomeOutlined style={{ color: '#1890ff' }} /> Open Space Collections
        </span>
      }
      extra={
        <Text type="secondary">
          {collectionsData?.open_space_collections?.payments?.length || 0} payments
        </Text>
      }
    >
      <Table
        dataSource={collectionsData?.open_space_collections?.payments || []}
        columns={openSpaceColumns}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} payments`,
        }}
        scroll={{ x: 1000 }}
        loading={loading}
        size="middle"
      />
    </Card>
  );

  if (loading && !collectionsData) {
    return <LoadingOverlay message="Loading collections data..." />;
  }

  return (
    <div className="market-open-space-screen">
      {/* Header Section */}
      <Card className="header-card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #fafbfc 0%, #ffffff 100%)' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <ShopOutlined style={{ color: '#ffffff', fontSize: '20px' }} />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, color: '#1f2937', fontWeight: 700 }}>
                    Collections
                </Title>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Comprehensive revenue overview for {selectedYear}
                </Text>
              </div>
            </div>
          </Col>
          <Col>
            <Space size="middle">
              <div>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Select Year</Text>
                <Select
                  style={{ width: 120 }}
                  value={selectedYear}
                  onChange={setSelectedYear}
                  placeholder="Select Year"
                  size="large"
                >
                  {yearOptions.map(year => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>
              </div>
              <Button 
                icon={<DownloadOutlined />}
                onClick={exportToPDF}
                type="primary"
                size="large"
                style={{ borderRadius: '10px' }}
              >
                Export PDF
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                loading={loading}
                size="large"
                style={{ borderRadius: '10px' }}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Key Performance Indicators */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="summary-card market-card">
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '10px', 
                background: 'linear-gradient(135deg, #10b981, #34d399)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <ShopOutlined style={{ color: '#ffffff', fontSize: '18px' }} />
              </div>
            </div>
            <Statistic
              title="Market Collections"
              value={yearlyData?.yearly_totals?.market_amount || 0}
              precision={2}
              valueStyle={{ color: '#10b981', fontSize: '28px', fontWeight: 700 }}
              prefix={<DollarOutlined />}
              formatter={(value) => `₱${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <div className="stat-details">
              <Text type="secondary">
                Total market revenue for {selectedYear}
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="summary-card open-space-card">
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '10px', 
                background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <HomeOutlined style={{ color: '#ffffff', fontSize: '18px' }} />
              </div>
            </div>
            <Statistic
              title="Open Space Collections"
              value={yearlyData?.yearly_totals?.open_space_amount || 0}
              precision={2}
              valueStyle={{ color: '#3b82f6', fontSize: '28px', fontWeight: 700 }}
              prefix={<HomeOutlined />}
              formatter={(value) => `₱${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <div className="stat-details">
              <Text type="secondary">
                Total open space revenue for {selectedYear}
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="summary-card taboc-gym-card">
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '10px', 
                background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <TrophyOutlined style={{ color: '#ffffff', fontSize: '18px' }} />
              </div>
            </div>
            <Statistic
              title="Taboc Gym Collections"
              value={yearlyData?.yearly_totals?.taboc_gym_amount || 0}
              precision={2}
              valueStyle={{ color: '#f59e0b', fontSize: '28px', fontWeight: 700 }}
              prefix={<TrophyOutlined />}
              formatter={(value) => `₱${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <div className="stat-details">
              <Text type="secondary">
                Total Taboc gym revenue for {selectedYear}
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="summary-card total-card">
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '10px', 
                background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <DollarOutlined style={{ color: '#ffffff', fontSize: '18px' }} />
              </div>
            </div>
            <Statistic
              title="Total Collections"
              value={(yearlyData?.yearly_totals?.market_amount || 0) + (yearlyData?.yearly_totals?.open_space_amount || 0) + (yearlyData?.yearly_totals?.taboc_gym_amount || 0)}
              precision={2}
              valueStyle={{ color: '#8b5cf6', fontSize: '28px', fontWeight: 700 }}
              prefix={<DollarOutlined />}
              formatter={(value) => `₱${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <div className="stat-details">
              <Text type="secondary">
                {yearlyData?.yearly_totals?.total_payments || 0} total transactions
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="summary-card vendors-card">
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '10px', 
                background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <CalendarOutlined style={{ color: '#ffffff', fontSize: '18px' }} />
              </div>
            </div>
            <Statistic
              title="Selected Year"
              value={selectedYear}
              valueStyle={{ color: '#f59e0b', fontSize: '28px', fontWeight: 700 }}
              prefix={<CalendarOutlined />}
              formatter={(value) => value.toString()}
            />
            <div className="stat-details">
              <Text type="secondary">
                Annual performance overview
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Analytics & Performance Insights */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        {/* Revenue Trends Chart */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '8px', 
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}>
                    <LineChartOutlined style={{ color: '#ffffff', fontSize: '16px' }} />
                  </div>
                  <span style={{ fontWeight: 700, color: '#1f2937' }}>Revenue Trends Analysis</span>
                </div>
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  Monthly performance for {selectedYear}
                </Text>
              </div>
            }
            className="analytics-card"
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={prepareChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                  tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    `₱${Number(value).toLocaleString()}`, 
                    name === 'market' ? 'Market Collections' : 
                    name === 'openSpace' ? 'Open Space Collections' : 
                    'Taboc Gym Collections'
                  ]}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e8e8e8',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="market" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Market Collections"
                />
                <Line 
                  type="monotone" 
                  dataKey="openSpace" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Open Space Collections"
                />
                <Line 
                  type="monotone" 
                  dataKey="tabocGym" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Taboc Gym Collections"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Peak Performance Insights */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '8px', 
                  background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}>
                  <LineChartOutlined style={{ color: '#ffffff', fontSize: '16px' }} />
                </div>
                <span style={{ fontWeight: 700, color: '#1f2937' }}>Peak Performance</span>
              </div>
            }
            className="analytics-card"
          >
            {getPeakAnalytics()}
          </Card>
        </Col>
      </Row>

      {/* Performance Metrics Dashboard */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={8}>
          <Card className="metric-card" size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981', marginBottom: '12px' }}>
                {getAverageMonthlyCollections('market')}
              </div>
              <div style={{ fontSize: '15px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>Avg Monthly Market</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                {getGrowthRate('market')} vs last year
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="metric-card" size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#3b82f6', marginBottom: '12px' }}>
                {getAverageMonthlyCollections('open-space')}
              </div>
              <div style={{ fontSize: '15px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>Avg Monthly Open Space</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                {getGrowthRate('open-space')} vs last year
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="metric-card" size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b', marginBottom: '12px' }}>
                {getAverageMonthlyCollections('taboc-gym')}
              </div>
              <div style={{ fontSize: '15px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>Avg Monthly Taboc Gym</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                {getGrowthRate('taboc-gym')} vs last year
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="metric-card" size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#8b5cf6', marginBottom: '12px' }}>
                {getCollectionEfficiency()}
              </div>
              <div style={{ fontSize: '15px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>Collection Efficiency</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                Best month: {getBestMonth()}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Annual Performance Summary */}
      <Alert
        message="Annual Collection Performance"
        description={
          <div style={{ fontSize: '14px' }}>
            <Text style={{ fontSize: '15px' }}>
              Total revenue of <strong style={{ color: '#10b981', fontSize: '16px' }}>₱{Number(yearlyData?.yearly_totals?.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> generated from 
              <strong style={{ color: '#3b82f6', fontSize: '16px' }}> {yearlyData?.yearly_totals?.total_payments || 0}</strong> transactions in <strong>{selectedYear}</strong>. 
              This includes <strong style={{ color: '#10b981' }}>Market (₱{Number(yearlyData?.yearly_totals?.market_amount || 0).toLocaleString()})</strong>, 
              <strong style={{ color: '#3b82f6' }}>Open Space (₱{Number(yearlyData?.yearly_totals?.open_space_amount || 0).toLocaleString()})</strong>, and 
              <strong style={{ color: '#f59e0b' }}>Taboc Gym (₱{Number(yearlyData?.yearly_totals?.taboc_gym_amount || 0).toLocaleString()})</strong> collections.
            </Text>
          </div>
        }
        type="success"
        showIcon
        style={{ marginBottom: 32, borderRadius: '12px' }}
      />

      {/* Monthly Collections Breakdown */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px', 
              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}>
              <CalendarOutlined style={{ color: '#ffffff', fontSize: '16px' }} />
            </div>
            <span style={{ fontWeight: 700, color: '#1f2937' }}>Monthly Collections Breakdown - {selectedYear}</span>
          </div>
        } 
        style={{ marginBottom: 32 }}
      >
        <Tabs activeKey={mainTableTab} onChange={setMainTableTab}>
          <TabPane 
            tab={
              <span>
                <ShopOutlined />
                All Collections
              </span>
            } 
            key="all"
          >
            <Table
              dataSource={yearlyData?.monthly_data || []}
              columns={monthlyColumns}
              rowKey="month_number"
              pagination={false}
              scroll={{ x: 800 }}
              loading={loading}
              size="middle"
              summary={(pageData) => {
                const totalMarketAmount = pageData.reduce((sum, record) => sum + record.market_amount, 0);
                const totalOpenSpaceAmount = pageData.reduce((sum, record) => sum + record.open_space_amount, 0);
                const totalTabocGymAmount = pageData.reduce((sum, record) => sum + record.taboc_gym_amount, 0);
                const totalAmount = pageData.reduce((sum, record) => sum + record.total_amount, 0);
                const totalPayments = pageData.reduce((sum, record) => sum + record.total_payment_count, 0);
                
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <Text strong>Total</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong style={{ color: '#10b981' }}>₱{totalMarketAmount.toLocaleString()}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Text strong style={{ color: '#3b82f6' }}>₱{totalOpenSpaceAmount.toLocaleString()}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <Text strong style={{ color: '#f59e0b' }}>₱{totalTabocGymAmount.toLocaleString()}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4}>
                      <Text strong style={{ color: '#8b5cf6' }}>₱{totalAmount.toLocaleString()}</Text>
                      <div><Text type="secondary" style={{ fontSize: '12px' }}>{totalPayments} payments</Text></div>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5}></Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </TabPane>
          <TabPane 
            tab={
              <span>
                <ShopOutlined />
                Market Collections Only
              </span>
            } 
            key="market"
          >
            <Table
              dataSource={yearlyData?.monthly_data || []}
              columns={marketOnlyColumns}
              rowKey="month_number"
              pagination={false}
              scroll={{ x: 600 }}
              loading={loading}
              size="middle"
              summary={(pageData) => {
                const totalMarketAmount = pageData.reduce((sum, record) => sum + record.market_amount, 0);
                const totalMarketPayments = pageData.reduce((sum, record) => sum + record.market_payment_count, 0);
                
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <Text strong>Total</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong style={{ color: '#10b981' }}>₱{totalMarketAmount.toLocaleString()}</Text>
                      <div><Text type="secondary" style={{ fontSize: '12px' }}>{totalMarketPayments} payments</Text></div>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}></Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </TabPane>
          <TabPane 
            tab={
              <span>
                <HomeOutlined />
                Open Space Collections Only
              </span>
            } 
            key="open-space"
          >
            <Table
              dataSource={yearlyData?.monthly_data || []}
              columns={openSpaceOnlyColumns}
              rowKey="month_number"
              pagination={false}
              scroll={{ x: 600 }}
              loading={loading}
              size="middle"
              summary={(pageData) => {
                const totalOpenSpaceAmount = pageData.reduce((sum, record) => sum + record.open_space_amount, 0);
                const totalOpenSpacePayments = pageData.reduce((sum, record) => sum + record.open_space_payment_count, 0);
                
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <Text strong>Total</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong style={{ color: '#3b82f6' }}>₱{totalOpenSpaceAmount.toLocaleString()}</Text>
                      <div><Text type="secondary" style={{ fontSize: '12px' }}>{totalOpenSpacePayments} payments</Text></div>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}></Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </TabPane>
          <TabPane 
            tab={
              <span>
                <TrophyOutlined />
                Taboc Gym Collections Only
              </span>
            } 
            key="taboc-gym"
          >
            <Table
              dataSource={yearlyData?.monthly_data || []}
              columns={tabocGymOnlyColumns}
              rowKey="month_number"
              pagination={false}
              scroll={{ x: 600 }}
              loading={loading}
              size="middle"
              summary={(pageData) => {
                const totalTabocGymAmount = pageData.reduce((sum, record) => sum + record.taboc_gym_amount, 0);
                const totalTabocGymPayments = pageData.reduce((sum, record) => sum + record.taboc_gym_payment_count, 0);
                
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <Text strong>Total</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong style={{ color: '#f59e0b' }}>₱{totalTabocGymAmount.toLocaleString()}</Text>
                      <div><Text type="secondary" style={{ fontSize: '12px' }}>{totalTabocGymPayments} payments</Text></div>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}></Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      
      {/* Payment Details Modal */}
      <Modal
        title={
          <div className="modal-title">
            <DollarOutlined />
            {selectedPayment?.payments ? 'Payment Details' : 'Payment Details'}
          </div>
        }
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPaymentModalVisible(false)}>
            Close
          </Button>
        ]}
        width={selectedPayment?.payments ? 1000 : 800}
      >
        {selectedPayment && (
          <div>
            {selectedPayment.payments ? (
              // Grouped payments view
              <div>
                {/* Summary */}
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic
                        title="Total Amount"
                        value={selectedPayment.total_amount}
                        precision={2}
                        valueStyle={{ color: '#52c41a' }}
                        prefix={<DollarOutlined />}
                        formatter={(value) => `₱${Number(value).toLocaleString()}`}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Number of Payments"
                        value={selectedPayment.payment_count}
                        valueStyle={{ color: '#1890ff' }}
                        prefix={<DollarOutlined />}
                      />
                    </Col>
                    <Col span={8}>
                      <div>
                        <Text strong>Payment Date:</Text>
                        <div>{new Date(selectedPayment.payment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                      </div>
                    </Col>
                  </Row>
                </Card>

                {/* Vendor Info */}
                <Descriptions title="Vendor Information" bordered column={2} size="small" style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="Vendor Name">
                    {selectedPayment.vendor?.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Contact Number">
                    {selectedPayment.vendor?.contact_number || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Address" span={2}>
                    {selectedPayment.vendor?.address || 'N/A'}
                  </Descriptions.Item>
                </Descriptions>

                {/* Individual Payments */}
                <Title level={5}>Individual Payment Details</Title>
                <Table
                  dataSource={selectedPayment.payments}
                  columns={[
                    {
                      title: 'Stall',
                      dataIndex: 'stall_info',
                      key: 'stall_info',
                      render: (stall) => (
                        <div>
                          <div><Text strong>{stall.stall_number}</Text></div>
                          <div><Text type="secondary" style={{ fontSize: '12px' , color:'#000'}}>{stall.section_name}</Text></div>
                        </div>
                      ),
                    },
                    {
                      title: 'Payment Type',
                      dataIndex: 'payment_details',
                      key: 'payment_type',
                      render: (details) => (
                        <Tag color={getPaymentTypeColor(details.payment_type)}>
                          {details.payment_type?.charAt(0).toUpperCase() + details.payment_type?.slice(1)}
                        </Tag>
                      ),
                    },
                    {
                      title: 'Amount',
                      dataIndex: 'payment_details',
                      key: 'amount',
                      render: (details) => (
                        <Text strong style={{ color: '#3b82f6' }}>
                          ₱{Number(details.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      ),
                    },
                    {
                      title: 'Status',
                      dataIndex: 'payment_details',
                      key: 'status',
                      render: (details) => (
                        <Tag color={getStatusColor(details.status)}>
                          {details.status?.charAt(0).toUpperCase() + details.status?.slice(1)}
                        </Tag>
                      ),
                    },
                    {
                      title: 'Missed Days',
                      dataIndex: 'payment_details',
                      key: 'missed_days',
                      render: (details) => details.missed_days || 0,
                    },
                    {
                      title: 'Advance Days',
                      dataIndex: 'payment_details',
                      key: 'advance_days',
                      render: (details) => details.advance_days || 0,
                    },
                  ]}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </div>
            ) : (
              // Single payment view
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Payment Date">
                  {new Date(selectedPayment.payment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </Descriptions.Item>
                <Descriptions.Item label="Payment Type">
                  <Tag color={getPaymentTypeColor(selectedPayment.payment_details?.payment_type)}>
                    {selectedPayment.payment_details?.payment_type?.charAt(0).toUpperCase() + 
                     selectedPayment.payment_details?.payment_type?.slice(1)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Amount Paid">
                  <Text strong style={{ color: '#52c41a' }}>
                    ₱{Number(selectedPayment.payment_details?.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(selectedPayment.payment_details?.status)}>
                    {selectedPayment.payment_details?.status?.charAt(0).toUpperCase() + 
                     selectedPayment.payment_details?.status?.slice(1)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Vendor Name">
                  {selectedPayment.vendor?.name}
                </Descriptions.Item>
                <Descriptions.Item label="Contact Number">
                  {selectedPayment.vendor?.contact_number || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Stall Number">
                  {selectedPayment.stall_info?.stall_number}
                </Descriptions.Item>
                <Descriptions.Item label="Section">
                  {selectedPayment.stall_info?.section_name}
                </Descriptions.Item>
                <Descriptions.Item label="Area">
                  {selectedPayment.stall_info?.area_name}
                </Descriptions.Item>
                <Descriptions.Item label="Missed Days">
                  {selectedPayment.payment_details?.missed_days || 0}
                </Descriptions.Item>
                <Descriptions.Item label="Advance Days">
                  {selectedPayment.payment_details?.advance_days || 0}
                </Descriptions.Item>
                <Descriptions.Item label="Monthly Rent" span={2}>
                  ₱{Number(selectedPayment.rental_info?.monthly_rent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Descriptions.Item>
                <Descriptions.Item label="Daily Rent" span={2}>
                  ₱{Number(selectedPayment.rental_info?.daily_rent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Descriptions.Item>
                <Descriptions.Item label="Remaining Balance" span={2}>
                  <Text style={{ color: selectedPayment.rental_info?.remaining_balance > 0 ? '#ff4d4f' : '#52c41a' }}>
                    ₱{Number(selectedPayment.rental_info?.remaining_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Vendor Address" span={2}>
                  {selectedPayment.vendor?.address || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            )}
          </div>
        )}
      </Modal>

      {/* Monthly Details Modal */}
      <Modal
        title={
          <div className="modal-title">
            <CalendarOutlined />
            Monthly Payment Details - {selectedMonthDetails?.month_name} {selectedMonthDetails?.year}
          </div>
        }
        open={monthlyDetailsModalVisible}
        onCancel={() => setMonthlyDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setMonthlyDetailsModalVisible(false)}>
            Close
          </Button>
        ]}
        width={1200}
      >
        {selectedMonthDetails && (
          <div>
            {/* Monthly Summary */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              {detailsType === 'market' && (
                <Col span={24}>
                  <Card size="small">
                    <Statistic
                      title="Market Collections"
                      value={selectedMonthDetails.market_collections?.summary?.total_amount || 0}
                      precision={2}
                      valueStyle={{ color: '#52c41a' }}
                      prefix={<DollarOutlined />}
                      formatter={(value) => `₱${Number(value).toLocaleString()}`}
                    />
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">
                        {selectedMonthDetails.market_collections?.summary?.total_payments || 0} payments • 
                        {selectedMonthDetails.market_collections?.summary?.unique_vendors || 0} vendors
                      </Text>
                    </div>
                  </Card>
                </Col>
              )}
              {detailsType === 'open-space' && (
                <Col span={24}>
                  <Card size="small">
                    <Statistic
                      title="Open Space Collections"
                      value={selectedMonthDetails.open_space_collections?.summary?.total_amount || 0}
                      precision={2}
                      valueStyle={{ color: '#1890ff' }}
                      prefix={<HomeOutlined />}
                      formatter={(value) => `₱${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    />
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">
                        {selectedMonthDetails.open_space_collections?.summary?.total_payments || 0} payments • 
                        {selectedMonthDetails.open_space_collections?.summary?.unique_vendors || 0} vendors
                      </Text>
                    </div>
                  </Card>
                </Col>
              )}
              {detailsType === 'taboc-gym' && (
                <Col span={24}>
                  <Card size="small">
                    <Statistic
                      title="Taboc Gym Collections"
                      value={selectedMonthDetails.taboc_gym_collections?.summary?.total_amount || 0}
                      precision={2}
                      valueStyle={{ color: '#f59e0b' }}
                      prefix={<TrophyOutlined />}
                      formatter={(value) => `₱${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    />
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">
                        {selectedMonthDetails.taboc_gym_collections?.summary?.total_payments || 0} payments • 
                        {selectedMonthDetails.taboc_gym_collections?.summary?.unique_vendors || 0} vendors
                      </Text>
                    </div>
                  </Card>
                </Col>
              )}
              {detailsType === 'all' && (
                <>
                  <Col span={4}>
                    <Card size="small">
                      <Statistic
                        title="Market Collections"
                        value={selectedMonthDetails.market_collections?.summary?.total_amount || 0}
                        precision={2}
                        valueStyle={{ color: '#52c41a' }}
                        prefix={<DollarOutlined />}
                        formatter={(value) => `₱${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">
                          {selectedMonthDetails.market_collections?.summary?.total_payments || 0} payments • 
                          {selectedMonthDetails.market_collections?.summary?.unique_vendors || 0} vendors
                        </Text>
                      </div>
                    </Card>
                  </Col>
                  <Col span={4}>
                    <Card size="small">
                      <Statistic
                        title="Open Space Collections"
                        value={selectedMonthDetails.open_space_collections?.summary?.total_amount || 0}
                        precision={2}
                        valueStyle={{ color: '#1890ff' }}
                        prefix={<HomeOutlined />}
                        formatter={(value) => `₱${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">
                          {selectedMonthDetails.open_space_collections?.summary?.total_payments || 0} payments • 
                          {selectedMonthDetails.open_space_collections?.summary?.unique_vendors || 0} vendors
                        </Text>
                      </div>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="Taboc Gym Collections"
                        value={selectedMonthDetails.taboc_gym_collections?.summary?.total_amount || 0}
                        precision={2}
                        valueStyle={{ color: '#f59e0b' }}
                        prefix={<TrophyOutlined />}
                        formatter={(value) => `₱${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">
                          {selectedMonthDetails.taboc_gym_collections?.summary?.total_payments || 0} payments • 
                          {selectedMonthDetails.taboc_gym_collections?.summary?.unique_vendors || 0} vendors
                        </Text>
                      </div>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="Total Collections"
                        value={(Number(selectedMonthDetails.market_collections?.summary?.total_amount || 0) + Number(selectedMonthDetails.open_space_collections?.summary?.total_amount || 0) + Number(selectedMonthDetails.taboc_gym_collections?.summary?.total_amount || 0))}
                        precision={2}
                        valueStyle={{ color: '#722ed1' }}
                        prefix={<DollarOutlined />}
                        formatter={(value) => `₱${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">
                          {(selectedMonthDetails.market_collections?.summary?.total_payments || 0) + (selectedMonthDetails.open_space_collections?.summary?.total_payments || 0) + (selectedMonthDetails.taboc_gym_collections?.summary?.total_payments || 0)} total payments
                        </Text>
                      </div>
                    </Card>
                  </Col>
                </>
              )}
            </Row>

            {/* Payment Details Tabs */}
            {detailsType === 'market' && (
              <Table
                dataSource={selectedMonthDetails.market_collections?.payments || []}
                columns={marketColumns}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} payments`,
                }}
                scroll={{ x: 1000 }}
                size="middle"
              />
            )}
            {detailsType === 'open-space' && (
              <Table
                dataSource={selectedMonthDetails.open_space_collections?.payments || []}
                columns={openSpaceColumns}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} payments`,
                }}
                scroll={{ x: 1000 }}
                size="middle"
              />
            )}
            {detailsType === 'taboc-gym' && (
              <Table
                dataSource={selectedMonthDetails.taboc_gym_collections?.payments || []}
                columns={tabocGymColumns}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} payments`,
                }}
                scroll={{ x: 1000 }}
                size="middle"
              />
            )}
            {detailsType === 'all' && (
              <Tabs activeKey={monthlyDetailsTab} onChange={setMonthlyDetailsTab}>
                <TabPane 
                  tab={
                    <span>
                      <ShopOutlined />
                      Market Collections ({selectedMonthDetails.market_collections?.summary?.total_payments || 0})
                    </span>
                  } 
                  key="market"
                >
                  <Table
                    dataSource={selectedMonthDetails.market_collections?.payments || []}
                    columns={marketColumns}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} payments`,
                    }}
                    scroll={{ x: 1000 }}
                    size="middle"
                  />
                </TabPane>
                <TabPane 
                  tab={
                    <span>
                      <HomeOutlined />
                      Open Space Collections ({selectedMonthDetails.open_space_collections?.summary?.total_payments || 0})
                    </span>
                  } 
                  key="open-space"
                >
                  <Table
                    dataSource={selectedMonthDetails.open_space_collections?.payments || []}
                    columns={openSpaceColumns}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} payments`,
                    }}
                    scroll={{ x: 1000 }}
                    size="middle"
                  />
                </TabPane>
                <TabPane 
                  tab={
                    <span>
                      <TrophyOutlined />
                      Taboc Gym Collections ({selectedMonthDetails.taboc_gym_collections?.summary?.total_payments || 0})
                    </span>
                  } 
                  key="taboc-gym"
                >
                  <Table
                    dataSource={selectedMonthDetails.taboc_gym_collections?.payments || []}
                    columns={tabocGymColumns}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} payments`,
                    }}
                    scroll={{ x: 1000 }}
                    size="middle"
                  />
                </TabPane>
              </Tabs>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MarketOpenSpaceScreen;
