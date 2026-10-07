import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Descriptions,
  Row,
  Col,
  Statistic,
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
import letterheadTemplate from '../assets/report_template/letterhead_template.jpg';
import api from '../Api';
import LoadingOverlay from './Loading';
import './MarketOpenSpaceScreen.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const MarketOpenSpaceScreen = () => {
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [yearlyData, setYearlyData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
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
        message.error(response.data.message || 'Unable to load yearly collection totals');
      }
    } catch (error) {
      console.error('Error fetching yearly data:', error);
      message.error('Unable to load yearly collection totals');
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
        message.error(response.data.message || 'Unable to load monthly payment details');
      }
    } catch (error) {
      console.error('Error fetching monthly details:', error);
      message.error('Unable to load monthly payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchYearlyData();
  };

  const waitForBrowserPaint = () => new Promise(resolve => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
  });

  const exportToPDF = async () => {
    if (!yearlyData) {
      message.error('No data available to export');
      return;
    }

    setIsExporting(true);
    setExportProgress(8);
    try {
      await waitForBrowserPaint();

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 35;
      
      // Add letterhead template as background only on first page
      try {
        doc.addImage(letterheadTemplate, 'JPEG', 0, 0, pageWidth, pageHeight);
      } catch (error) {
        // Letterhead template not found, continuing without it
      }
      
      // Title - positioned after letterhead
      let yPosition = 55; // Start position after letterhead
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      
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
      
      // Position title to avoid background collision
      const titleX = pageWidth / 2 + 10; // Shift title slightly to the right
      doc.text(reportTitle, titleX, yPosition, { align: 'center' });
      
      // Date below title
      yPosition += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      doc.text(`Generated on: ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      setExportProgress(28);
      await waitForBrowserPaint();
      
      const monthlyData = yearlyData.monthly_data || [];
      
      if (monthlyData.length > 0) {
        let tableData = [];
        let tableHeaders = [];
        
        if (mainTableTab === 'market') {
          tableHeaders = ['Month', 'Market Collections'];
          tableData = monthlyData.map(month => [
            month.month,
            Number(month.market_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ]);
        } else if (mainTableTab === 'open-space') {
          tableHeaders = ['Month', 'Open Space Collections'];
          tableData = monthlyData.map(month => [
            month.month,
            Number(month.open_space_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ]);
        } else if (mainTableTab === 'taboc-gym') {
          tableHeaders = ['Month', 'Taboc Gym Collections'];
          tableData = monthlyData.map(month => [
            month.month,
            Number(month.taboc_gym_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ]);
        } else {
          tableHeaders = ['Month', 'Market Collections', 'Open Space Collections', 'Taboc Gym Collections', 'Total Collections'];
          tableData = monthlyData.map(month => [
            month.month,
            Number(month.market_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Number(month.open_space_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Number(month.taboc_gym_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Number(month.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ]);
        }
        
        // Calculate totals for summary row
        let totalRow = [];
        if (mainTableTab === 'market') {
          const totalMarketAmount = monthlyData.reduce((sum, month) => sum + month.market_amount, 0);
          totalRow = [
            'Total',
            Number(totalMarketAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ];
        } else if (mainTableTab === 'open-space') {
          const totalOpenSpaceAmount = monthlyData.reduce((sum, month) => sum + month.open_space_amount, 0);
          totalRow = [
            'Total',
            Number(totalOpenSpaceAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ];
        } else if (mainTableTab === 'taboc-gym') {
          const totalTabocGymAmount = monthlyData.reduce((sum, month) => sum + month.taboc_gym_amount, 0);
          totalRow = [
            'Total',
            Number(totalTabocGymAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ];
        } else {
          const totalMarketAmount = monthlyData.reduce((sum, month) => sum + month.market_amount, 0);
          const totalOpenSpaceAmount = monthlyData.reduce((sum, month) => sum + month.open_space_amount, 0);
          const totalTabocGymAmount = monthlyData.reduce((sum, month) => sum + month.taboc_gym_amount, 0);
          const totalAmount = monthlyData.reduce((sum, month) => sum + month.total_amount, 0);
          totalRow = [
            'Total',
            Number(totalMarketAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Number(totalOpenSpaceAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Number(totalTabocGymAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Number(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ];
        }

        setExportProgress(62);
        await waitForBrowserPaint();

        // Dynamic column styles based on selected tab
        const getColumnStyles = () => {
          if (mainTableTab === 'all') {
            return {
              0: { cellWidth: 23, halign: 'left' },
              1: { cellWidth: 35, halign: 'right' },
              2: { cellWidth: 35, halign: 'right' },
              3: { cellWidth: 35, halign: 'right' },
              4: { cellWidth: 37, halign: 'right' }
            };
          } else {
            return {
              0: { cellWidth: 30, halign: 'left' },
              1: { cellWidth: 60, halign: 'right' }
            };
          }
        };

        let startYValue = yPosition + 15;
        let tableMargins;

        if (mainTableTab === 'all') {
          const centeredMargin = (pageWidth - 165) / 2;
          tableMargins = {
            left: centeredMargin + 8,
            right: centeredMargin - 8,
            bottom: 15,
          };
        } else {
          const tableWidth = 90;
          const centeredMargin = (pageWidth - tableWidth) / 2;
          tableMargins = {
            left: centeredMargin,
            right: centeredMargin,
            bottom: 15,
          };
        }

        setExportProgress(82);
        await waitForBrowserPaint();

        autoTable(doc, {
          head: [tableHeaders],
          body: [...tableData, totalRow],
          startY: startYValue,
          theme: 'grid',
          styles: {
            fontSize: mainTableTab === 'all' ? 7 : 9,
            cellPadding: 3,
            fillColor: [255, 255, 255], // White background for all cells
            lineColor: [0, 0, 0], // Black borders
            lineWidth: 0.1,
            halign: 'center', // Center align all cells
            valign: 'middle',
            textColor: [0, 0, 0] // Black font color for all data
          },
          headStyles: {
            fillColor: [255, 255, 255], // White background for header
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineColor: [0, 0, 0],
            lineWidth: 0.1
          },
          footStyles: {
                    fillColor: [255, 255, 255], // White background for header
 
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle'
          },
          columnStyles: getColumnStyles(),
          margin: tableMargins,
          didParseCell: function(data) {
            // Center align all data cells except for first column (Month)
            if (data.column.index !== 0) {
              data.cell.styles.halign = 'center';
            }
            // Style the total row
            if (data.row.index === tableData.length) {
              data.cell.styles.fillColor = [255,255, 255];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        });
        
        yPosition = doc.lastAutoTable.finalY + 20;
      } else {
        doc.text('No monthly data available', margin, yPosition);
        yPosition += 20;
      }

      setExportProgress(94);
      await waitForBrowserPaint();
      
      // Save PDF
      const fileName = mainTableTab === 'market' ? `market-collections-${selectedYear}.pdf` : 
                     mainTableTab === 'open-space' ? `open-space-collections-${selectedYear}.pdf` : 
                     mainTableTab === 'taboc-gym' ? `taboc-gym-collections-${selectedYear}.pdf` : 
                     `market-open-space-taboc-gym-collections-${selectedYear}.pdf`;
      
      doc.save(fileName);
      setExportProgress(100);
      message.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      message.error('Failed to export PDF');
    } finally {
      await new Promise(resolve => window.setTimeout(resolve, 250));
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const prepareChartData = () => {
    if (!yearlyData) return [];
    
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

    const monthsElapsed = selectedYear === currentYear ? dayjs().month() + 1 : 12;
    const average = total / monthsElapsed;
    return `₱${Number(average).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getMonthlyAveragePeriod = () => {
    if (selectedYear === currentYear) {
      return `Year-to-date average through ${dayjs().format('MMMM')}`;
    }

    return `12-month average for ${selectedYear}`;
  };

  const getRecordedPaymentCount = () => {
    if (!yearlyData?.monthly_data || yearlyData.monthly_data.length === 0) {
      return '0';
    }

    const totalPayments = yearlyData.monthly_data.reduce((sum, month) => 
      sum + month.total_payment_count, 0
    );

    return totalPayments.toLocaleString();
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

  if (loading && !yearlyData) {
    return <LoadingOverlay message="Loading collections data..." />;
  }

  return (
    <div className="market-open-space-screen">
      {isExporting && (
        <div className="pdf-export-overlay" role="status" aria-live="polite">
          <div className="pdf-export-loader">
            <div
              className="pdf-export-progress"
              style={{ '--pdf-progress': `${exportProgress}%` }}
              aria-label={`Generating PDF: ${exportProgress}%`}
            >
              <span>{exportProgress}%</span>
            </div>
            <strong>Exporting PDF</strong>
            <span className="pdf-export-caption">Preparing collections report</span>
          </div>
        </div>
      )}
      {/* Header Section */}
      <Card className="header-card market-report-masthead">
        <div className="market-report-masthead-row">
          <div className="market-report-title-wrap">
            <div className="market-report-mark"><ShopOutlined /></div>
            <div>
              <Text className="market-report-eyebrow">COLLECTIONS REPORT</Text>
              <Title level={2} className="market-report-title">Annual Collections Overview</Title>
              <Text type="secondary">Yearly totals, monthly trends, and payment details.</Text>
            </div>
          </div>
          <div className="market-report-controls">
            <div className="market-year-control">
              <Text strong className="market-control-label">Report year</Text>
              <Select
                aria-label="Report year"
                style={{ width: 132 }}
                value={selectedYear}
                onChange={setSelectedYear}
                size="large"
              >
                {yearOptions.map(year => (
                  <Option key={year} value={year}>{year}</Option>
                ))}
              </Select>
            </div>
            <Space wrap>
              <Button
                icon={<DownloadOutlined />}
                onClick={exportToPDF}
                type="primary"
                size="large"
                disabled={!yearlyData || loading || isExporting}
              >
                Export PDF
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
                size="large"
              >
                Refresh
              </Button>
            </Space>
          </div>
        </div>
        <div className="market-report-guide">
          <span className="market-report-guide-label">INCLUDED AREAS</span>
          <span>Market <span aria-hidden="true">·</span> Open Space <span aria-hidden="true">·</span> Taboc Gym</span>
        </div>
      </Card>

      {/* Key Performance Indicators */}
      <div className="report-section-heading">
        <div>
          <span className="report-section-eyebrow">01 / FINANCIAL SUMMARY</span>
          <span className="report-section-title">Annual collections at a glance</span>
        </div>
        <span className="report-section-note">Amounts shown in Philippine pesos</span>
      </div>
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="summary-card market-card">
            <Statistic
              title="Market Collections"
              value={yearlyData?.yearly_totals?.market_amount || 0}
              precision={2}
              valueStyle={{ color: '#10b981', fontSize: '28px', fontWeight: 700 }}
              prefix={<ShopOutlined />}
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
            <Statistic
              title="Total Collections"
              value={yearlyData?.yearly_totals?.total_amount || 0}
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
      </Row>

      {/* Analytics & Performance Insights */}
      <div className="report-section-heading">
        <div>
          <span className="report-section-eyebrow">02 / PERFORMANCE ANALYSIS</span>
          <span className="report-section-title">Trends and peak collection periods</span>
        </div>
        <span className="report-section-note">Monthly view for {selectedYear}</span>
      </div>
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
      <div className="report-section-heading compact-section-heading">
        <div>
          <span className="report-section-eyebrow">03 / OPERATING METRICS</span>
          <span className="report-section-title">Monthly averages and transaction volume</span>
        </div>
      </div>
      <Row className="performance-metrics-row" gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={8}>
          <Card className="metric-card" size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981', marginBottom: '12px' }}>
                {getAverageMonthlyCollections('market')}
              </div>
              <div style={{ fontSize: '15px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>Avg Monthly Market</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                {getMonthlyAveragePeriod()}
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
                {getMonthlyAveragePeriod()}
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
                {getMonthlyAveragePeriod()}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="metric-card" size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#8b5cf6', marginBottom: '12px' }}>
                {getRecordedPaymentCount()}
              </div>
              <div style={{ fontSize: '15px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>Payment Groups</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                Grouped by vendor and payment date · Peak: {getBestMonth()}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Monthly Collections Breakdown */}
      <Card
        className="monthly-report-card"
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
          <div className="collection-modal-heading">
            <span className="collection-modal-icon"><DollarOutlined /></span>
            <div>
              <Text className="collection-modal-eyebrow">COLLECTION RECORD</Text>
              <span>{selectedPayment?.payments ? 'Grouped Payment Details' : 'Payment Details'}</span>
            </div>
          </div>
        }
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPaymentModalVisible(false)}>
            Close
          </Button>
        ]}
        width={selectedPayment?.payments ? 'min(1080px, calc(100vw - 32px))' : 'min(900px, calc(100vw - 32px))'}
        centered
        destroyOnClose
        className="collections-detail-modal"
        styles={{ body: { maxHeight: 'calc(100vh - 190px)', overflowY: 'auto' } }}
      >
        {selectedPayment && (
          <div>
            {selectedPayment.payments ? (
              // Grouped payments view
              <div>
                {/* Summary */}
                <div className="payment-summary-strip">
                  <Row gutter={[16, 12]}>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Total Amount"
                        value={selectedPayment.total_amount}
                        precision={2}
                        valueStyle={{ color: '#52c41a' }}
                        prefix={<DollarOutlined />}
                        formatter={(value) => `₱${Number(value).toLocaleString()}`}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Number of Payments"
                        value={selectedPayment.payment_count}
                        valueStyle={{ color: '#1890ff' }}
                        prefix={<DollarOutlined />}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <div className="payment-summary-date">
                        <Text type="secondary">Payment date</Text>
                        <Text strong>{new Date(selectedPayment.payment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Vendor Info */}
                <Descriptions className="payment-vendor-description" title="Vendor Information" bordered column={{ xs: 1, sm: 2 }} size="small">
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
                <Title level={5} className="payment-table-heading">Individual Payments</Title>
                <Table
                  className="modal-payment-table"
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
                  size="middle"
                />
              </div>
            ) : (
              // Single payment view
              <div className="payment-detail-sections">
              <Descriptions title="Payment" bordered column={{ xs: 1, sm: 2 }} size="small">
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
                <Descriptions.Item label="Missed Days">
                  {selectedPayment.payment_details?.missed_days || 0}
                </Descriptions.Item>
                <Descriptions.Item label="Advance Days">
                  {selectedPayment.payment_details?.advance_days || 0}
                </Descriptions.Item>
              </Descriptions>
              <Descriptions title="Vendor" bordered column={{ xs: 1, sm: 2 }} size="small">
                <Descriptions.Item label="Vendor Name">
                  {selectedPayment.vendor?.name}
                </Descriptions.Item>
                <Descriptions.Item label="Contact Number">
                  {selectedPayment.vendor?.contact_number || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Address">
                  {selectedPayment.vendor?.address || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
              <Descriptions title="Rental" bordered column={{ xs: 1, sm: 2 }} size="small">
                <Descriptions.Item label="Stall Number">
                  {selectedPayment.stall_info?.stall_number}
                </Descriptions.Item>
                <Descriptions.Item label="Section">
                  {selectedPayment.stall_info?.section_name}
                </Descriptions.Item>
                <Descriptions.Item label="Area">
                  {selectedPayment.stall_info?.area_name}
                </Descriptions.Item>
                <Descriptions.Item label="Monthly Rent">
                  ₱{Number(selectedPayment.rental_info?.monthly_rent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Descriptions.Item>
                <Descriptions.Item label="Daily Rent">
                  ₱{Number(selectedPayment.rental_info?.daily_rent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Descriptions.Item>
                <Descriptions.Item label="Remaining Balance">
                  <Text style={{ color: selectedPayment.rental_info?.remaining_balance > 0 ? '#ff4d4f' : '#52c41a' }}>
                    ₱{Number(selectedPayment.rental_info?.remaining_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Monthly Details Modal */}
      <Modal
        title={
          <div className="collection-modal-heading">
            <span className="collection-modal-icon"><CalendarOutlined /></span>
            <div>
              <Text className="collection-modal-eyebrow">MONTHLY COLLECTIONS</Text>
              <span>{selectedMonthDetails?.month_name} {selectedMonthDetails?.year} Details</span>
            </div>
          </div>
        }
        open={monthlyDetailsModalVisible}
        onCancel={() => setMonthlyDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setMonthlyDetailsModalVisible(false)}>
            Close
          </Button>
        ]}
        width="min(1240px, calc(100vw - 32px))"
        centered
        destroyOnClose
        className="monthly-collections-modal"
        styles={{ body: { maxHeight: 'calc(100vh - 190px)', overflowY: 'auto' } }}
      >
        {selectedMonthDetails && (
          <div className="monthly-details-content">
            {/* Monthly Summary */}
            <Row className="collection-month-summary" gutter={[12, 12]}>
              {detailsType === 'market' && (
                <Col span={24}>
                  <Card size="small" className="collection-summary-card">
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
                  <Card size="small" className="collection-summary-card">
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
                  <Card size="small" className="collection-summary-card">
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
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small" className="collection-summary-card">
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
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small" className="collection-summary-card">
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
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small" className="collection-summary-card">
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
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small" className="collection-summary-card collection-total-summary">
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
                className="modal-payment-table"
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
                className="modal-payment-table"
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
                className="modal-payment-table"
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
              <Tabs className="monthly-payment-tabs" activeKey={monthlyDetailsTab} onChange={setMonthlyDetailsTab}>
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
                    className="modal-payment-table"
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
                    className="modal-payment-table"
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
                    className="modal-payment-table"
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
