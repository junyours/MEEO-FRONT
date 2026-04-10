import React, { useState, useEffect } from 'react';
import api from '../Api';
import LoadingOverlay from './Loading';
import {
  Card,
  Select,
  Table,
  Row,
  Col,
  Statistic,
  Spin,
  Typography,
  Alert,
  Space,
  Divider,
  Tag,
  Button,
  message,
  Tabs,
  Modal,
  Input,
  Tooltip,
} from 'antd';
import {
  DollarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ShopOutlined,
  CalendarOutlined,
  DownloadOutlined,
  PrinterOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import letterheadTemplate from '../assets/report_template/letterhead_template.jpg';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Monthly Payment Analysis Table Component
const MonthlyPaymentAnalysisTable = ({ paymentDetails, formatCurrency, onOrNumberUpdate, selectedYear }) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthColors = {
    'Jan': '#52c41a',
    'Feb': '#1890ff', 
    'Mar': '#faad14',
    'Apr': '#fa8c16',
    'May': '#eb2f96',
    'Jun': '#13c2c2',
    'Jul': '#8c8c8c',
    'Aug': '#fa8c16',
    'Sep': '#fa8c16',
    'Oct': '#722ed1',
    'Nov': '#f5222d',
    'Dec': '#52c41a'
  };

  // Find the maximum number of payments in any month (set to 31 for days of month)
  const maxPayments = 31;

  // Generate table columns
  const columns = [
    {
      title: 'NO.',
      dataIndex: 'no',
      key: 'no',
      width: 60,
      fixed: 'left',
      render: (text) => <Text strong>{text}</Text>
    }
  ];

  // Add columns for each month (O.R. NO. and AMOUNT pairs)
  months.forEach(month => {
    columns.push({
      title: (
        <div style={{ backgroundColor: monthColors[month], color: 'white', padding: '4px', textAlign: 'center', borderRadius: '4px' }}>
          {month}
        </div>
      ),
      children: [
        {
          title: 'O.R. NO.',
          dataIndex: ['monthData', month, 'or_no'],
          key: `${month}_or_no`,
          width: 120,
          render: (text, record) => {
            // Disable OR number updates for the total row
            if (record.key === 'total') {
              return <Text type="secondary" style={{ cursor: 'not-allowed' }}>-</Text>;
            }
            
            const orNo = text || '-';
            const day = record.no;
            const monthIndex = months.indexOf(month);
            
            // Create date string for the payment (needed for both existing and new OR numbers)
            const paymentDate = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            if (orNo !== '-') {
              // Check if OR number contains multiple values (has "/" separator)
              const hasMultipleOrNumbers = orNo.includes('/');
              
              return (
                <Button
                  type="link"
                  size="small"
                  onClick={() => onOrNumberUpdate(paymentDate)}
                  style={{ 
                    padding: 0, 
                    height: 'auto',
                    fontSize: hasMultipleOrNumbers ? '10px' : 'inherit',
                    lineHeight: hasMultipleOrNumbers ? '1.2' : 'inherit',
                    whiteSpace: hasMultipleOrNumbers ? 'normal' : 'nowrap',
                    wordBreak: hasMultipleOrNumbers ? 'break-all' : 'normal',
                    textAlign: 'center'
                  }}
                >
                  {orNo}
                </Button>
              );
            }
            
            // For cells with '-', make them clickable to add OR number (but not for total row)
            // Check if there are payments for this day
            const dayPayments = paymentDetails[month]?.payments?.filter(payment => {
              try {
                const paymentDate = new Date(payment.date);
                return paymentDate.getDate() === day;
              } catch (error) {
                return false;
              }
            });
            
            const hasPaymentsForDay = dayPayments && dayPayments.length > 0;
            
            if (!hasPaymentsForDay) {
              // Show disabled button for days with no payments
              return (
                <Button
                  type="link"
                  size="small"
                  disabled
                  style={{ 
                    padding: 0, 
                    height: 'auto',
                    fontSize: 'inherit',
                    color: '#bfbfbf',
                    cursor: 'not-allowed',
                    textAlign: 'center'
                  }}
                >
                  <Tooltip title="No payments made for this day">
                    {orNo}
                  </Tooltip>
                </Button>
              );
            }
            
            return (
              <Button
                type="link"
                size="small"
                onClick={() => onOrNumberUpdate(paymentDate)}
                style={{ 
                  padding: 0, 
                  height: 'auto',
                  fontSize: 'inherit',
                  color: '#d9d9d9',
                  textAlign: 'center'
                }}
              >
                <Tooltip title="Click to add OR number">
                  {orNo}
                </Tooltip>
              </Button>
            );
          }
        },
        {
          title: 'AMOUNT',
          dataIndex: ['monthData', month, 'amount'],
          key: `${month}_amount`,
          width: 120,
          align: 'right',
          render: (text) => text ? <Text strong>{formatCurrency(text)}</Text> : <Text type="secondary">-</Text>
        }
      ]
    });
  });

  // Generate table data
  const dataSource = [];
  let monthlyTotals = {};
  
  // Initialize monthly totals
  months.forEach(month => {
    monthlyTotals[month] = 0;
  });
  
  for (let i = 1; i <= 31; i++) {
    const row = { key: i, no: i };
    
    // Add payment data for each month
    const monthData = {};
    months.forEach(month => {
      const monthPayments = paymentDetails[month]?.payments;
      
      // Handle both array and object structures
      let payments = [];
      if (Array.isArray(monthPayments)) {
        payments = monthPayments;
      } else if (monthPayments && typeof monthPayments === 'object') {
        // Convert object to array
        payments = Object.values(monthPayments);
      }
      
      // Group payments by date and sum amounts for the same day
      const dayPayments = payments.filter(payment => {
        try {
          const paymentDate = new Date(payment.date);
          return paymentDate.getDate() === i;
        } catch (error) {
          return false;
        }
      });
      
      // Since backend already groups by date and combines OR numbers, 
      // we just need to get the payment for this day
      const dayPayment = dayPayments[0]; // Get the first (and should be only) payment for this day
      
      if (dayPayment) {
        monthData[month] = {
          or_no: dayPayment.or_no,
          amount: dayPayment.amount
        };
        // Add to monthly total
        monthlyTotals[month] += dayPayment.amount;
      }
    });
    
    row.monthData = monthData;
    dataSource.push(row);
  }
  
  // Add total row
  const totalRow = {
    key: 'total',
    no: 'TOTAL',
    monthData: {}
  };
  months.forEach(month => {
    totalRow.monthData[month] = {
      or_no: '-',
      amount: monthlyTotals[month]
    };
  });
  dataSource.push(totalRow);

  return (
    <div style={{ overflowX: 'auto' }}>
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        scroll={{ x: 2800 }}
        size="small"
        bordered
        rowClassName={(record) => record.key === 'total' ? 'total-row' : ''}
      />
    </div>
  );
};

const VendorAnalysis = () => {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [orModalVisible, setOrModalVisible] = useState(false);
  const [selectedPaymentDate, setSelectedPaymentDate] = useState('');
  const [orNumberInput, setOrNumberInput] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await api.get('/vendor-analysis/vendors');
      setVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const handleVendorChange = async (vendorId) => {
    const vendor = vendors.find(v => v.id === parseInt(vendorId));
    setSelectedVendor(vendor);

    if (vendorId) {
      setLoading(true);
      try {
        const response = await api.get(`/vendor-analysis/vendor/${vendorId}`, {
          params: { 
            year: selectedYear,
            section: activeTab === 'all' ? null : activeTab.replace('section-', '')
          }
        });
        setVendorData(response.data);
      } catch (error) {
        console.error('Error fetching vendor analysis:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setVendorData(null);
    }
  };

  const handleYearChange = async (date, year) => {
    const selectedYearValue = year ? parseInt(year) : new Date().getFullYear();
    setSelectedYear(selectedYearValue);
    
    // Refetch data if vendor is selected
    if (selectedVendor) {
      setLoading(true);
      try {
        const response = await api.get(`/vendor-analysis/vendor/${selectedVendor.id}`, {
          params: { 
            year: selectedYearValue,
            section: activeTab === 'all' ? null : activeTab.replace('section-', '')
          }
        });
        setVendorData(response.data);
      } catch (error) {
        console.error('Error fetching vendor analysis:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTabChange = async (activeKey) => {
    setActiveTab(activeKey);
    
    // Refetch data if vendor is selected
    if (selectedVendor) {
      setLoading(true);
      try {
        const response = await api.get(`/vendor-analysis/vendor/${selectedVendor.id}`, {
          params: { 
            year: selectedYear,
            section: activeKey === 'all' ? null : activeKey.replace('section-', '')
          }
        });
        setVendorData(response.data);
      } catch (error) {
        console.error('Error fetching vendor analysis:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatCurrencyForPDF = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getCurrentSectionName = () => {
    if (activeTab === 'all' || !vendorData?.section_breakdown) {
      // When 'All Sections' is selected, concatenate all section names
      if (vendorData?.section_breakdown && vendorData.section_breakdown.length > 0) {
        const sectionNames = vendorData.section_breakdown.map(section => section.section_name);
        return `${sectionNames.join('/')} Sections`;
      }
      return 'All Sections';
    }
    
    const sectionId = activeTab.replace('section-', '');
    const currentSection = vendorData.section_breakdown.find(section => section.section_id == sectionId);
    
    return currentSection ? `${currentSection.section_name} Section` : 'Carenderia Section';
  };

  const addGovernmentHeader = (doc, pageWidth, margin = 20) => {
    let yPosition = 10;
    
    // Government Header with Logos matching the design
    try {
      // Add Municipality logo on the left (circular logo with blue, red, yellow, black elements)
      doc.addImage('/logo_Opol.png', 'PNG', margin, yPosition, 30, 30);
      
      // Add MEE logo on the right (predominantly red and yellow circular logo)
      doc.addImage('/logo_meeo.png', 'PNG', pageWidth - margin - 30, yPosition, 30, 30);
    } catch (error) {
      // Logos not found, continuing without them
    }
    
    yPosition += 15;
    
    // Centered Government Header - matching exact requirements
    doc.setFont('calibri', 'bold');
    doc.setFontSize(12.3);
    doc.text('Republic of the Philippines', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 6;
    doc.setFontSize(12.3);
    doc.text('Province of Misamis Oriental', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 6;
    doc.setFontSize(12.3);
    doc.text('Municipality of Opol', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 6;
    doc.setFontSize(12.5);
    doc.text('MUNICIPAL ECONOMIC ENTERPRISE OFFICE', pageWidth / 2, yPosition, { align: 'center' });
    
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

  const generateDelinquencyNotice = () => {
    if (!vendorData || !selectedVendor) {
      message.error('Please select a vendor first');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [216, 330] // Custom size: 216mm width x 330mm height
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      // Get current date and format it properly
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      // Filter months with balances and only show months before current month
      const monthsWithBalance = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      vendorData.monthly_breakdown.forEach((item, index) => {
        // Only include months before current month and with balance > 0
        if (index < currentMonth && item.balance > 0) {
          monthsWithBalance.push({
            month: `${monthNames[index]} ${currentYear}`,
            balance: item.balance
          });
        }
      });
      
      // If no delinquent months, show message
      if (monthsWithBalance.length === 0) {
        message.info('No delinquent months found for this vendor');
        return;
      }
      
      // Calculate total balance
      const totalBalance = monthsWithBalance.reduce((sum, item) => sum + item.balance, 0);
      
      let yPosition = addGovernmentHeader(doc, pageWidth, margin);
      
      // Title centered and bold
      doc.setFont('calibri', 'bold');
      doc.setFontSize(10.5);
      doc.text('NOTICE OF DELINQUENCY', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      
      // Date below title
      doc.setFontSize(10.5);
      doc.setFont('calibri', 'normal');
      doc.text(formattedDate, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 12;
      
      // Recipient Information Section (left aligned)
      doc.setFontSize(10.5);
      doc.setFont('calibri', 'bold');
      doc.text(selectedVendor.fullname, margin, yPosition);
      yPosition += 7;
      doc.text(getCurrentSectionName(), margin, yPosition);
      
      yPosition += 10;
      doc.text('Dear Sir/Madam:', margin, yPosition);
      
      yPosition += 10;
      
      // Body Content - Formal notice paragraph
      doc.setFont('calibri', 'normal');
      doc.setFontSize(10.5);
      const bodyMaxWidth = pageWidth - 2 * margin; // Max width for text to fit with margins
      const bodyText = [
        'Please be informed that as per record in this office you failed to pay the daily rental for three (3) consecutive days thus your Contract become automatically terminated and rescinded. The said premises shall be vacated peacefully by the Lessee without even any formal notice or demand yet we do the same. Upon cancellation of the contract the Lessee hereby grants to the Lessor the legal right to enter and take possession of the leased premises as though the term of this lease has expired.\nBe notified further that your stall rental delinquencies are as follows:'
      ];
      
      bodyText.forEach(paragraph => {
        const splitText = doc.splitTextToSize(paragraph, bodyMaxWidth);
        splitText.forEach(line => {
          doc.text(line, margin, yPosition);
          yPosition += 5; // Single spacing line height
        });
        if (paragraph !== '') {
          yPosition += 2; // Add a small gap between paragraphs, but not for empty lines
        }
      });
      
      yPosition += 3; // Reduced space before the table
      
      // Delinquency Table - Centered on page
      const tableX = (pageWidth - 100) / 2; // Center the 100mm wide table
      
      // Set consistent line width for all borders
      doc.setLineWidth(0.1);
      
      // Table header with white background
      doc.setFillColor(255, 255, 255);
      doc.rect(tableX, yPosition, 50, 10, 'F');
      doc.rect(tableX + 50, yPosition, 50, 10, 'F');
      
      // Table borders
      doc.rect(tableX, yPosition, 50, 10);
      doc.rect(tableX + 50, yPosition, 50, 10);
      
      doc.setFont('helvetica', 'bold');
      doc.text('DATE', tableX + 5, yPosition + 7);
      doc.text('AMOUNT', tableX + 55, yPosition + 7);
      
      yPosition += 10;
      doc.setFont('helvetica', 'normal');
      
      // Table data rows
      monthsWithBalance.forEach((item, index) => {
        // White background for all cells
        doc.setFillColor(255, 255, 255);
        doc.rect(tableX, yPosition, 50, 8, 'F');
        doc.rect(tableX + 50, yPosition, 50, 8, 'F');
        
        // Row borders with consistent thickness
        doc.rect(tableX, yPosition, 50, 8);
        doc.rect(tableX + 50, yPosition, 50, 8);
        
        // Text content
        doc.text(item.month, tableX + 5, yPosition + 5);
        doc.text(formatCurrencyForPDF(item.balance), tableX + 55, yPosition + 5);
        yPosition += 8;
      });
      
      // Total row with white background
      doc.setFillColor(255, 255, 255);
      doc.rect(tableX, yPosition, 50, 10, 'F');
      doc.rect(tableX + 50, yPosition, 50, 10, 'F');
      doc.rect(tableX, yPosition, 100, 10);
      
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL Php', tableX + 5, yPosition + 7);
      doc.text(formatCurrencyForPDF(totalBalance), tableX + 55, yPosition + 7);
      
      yPosition += 15;
      
      // Footer Instructions
      doc.setFont('calibri', 'normal');
      const footerMaxWidth = pageWidth - 2 * margin; // Max width for text to fit with margins
      const instructions = [
        'Please settle the above-mentioned obligations within five (5) working days upon receipt hereof.\nPlease disregard this notice if payment has been made and for further queries kindly come to my office.\nThank you for giving this matter your most attention.'
      ];
      
      yPosition += 5;
      
      instructions.forEach(paragraph => {
        const splitText = doc.splitTextToSize(paragraph, footerMaxWidth);
        splitText.forEach(line => {
          doc.text(line, margin, yPosition);
          yPosition += 5; // Single spacing line height
        });
        if (paragraph !== '') {
          yPosition += 2; // Add a small gap between paragraphs, but not for empty lines
        }
      });
      
      yPosition += 5; // Minimal space before signature section
      
      doc.setFontSize(10.5);
      doc.setFont('calibri', 'normal');
      doc.text('Prepared by:', margin, yPosition);
      
      yPosition += 10; // Double space between "Prepared by:" and name
      doc.setFont('calibri', 'bold');
      doc.text('MYRANIE A. YAID', margin, yPosition);
      
      yPosition += 10; // Double space between name and 'Noted by:'
      doc.setFont('calibri', 'normal');
      doc.text('Noted by:', margin, yPosition);
      
      yPosition += 10; // Double space between "Noted by:" and name
      doc.setFont('calibri', 'bold');
      doc.text('ARIEL BRIAN Y. ORTIGOZA', margin, yPosition);
      
      yPosition += 5; // Single space between name and designation
      doc.setFontSize(10);
      doc.setFont('calibri', 'normal');
      doc.text('MEEO - designate', margin, yPosition);
      
      yPosition += 3; // 3 spaces between 'MEEO - designate' and 'Received by:'
      // Received By Section
      yPosition += 5; // Minimal space before signature section
      doc.setFontSize(9.7);
      
      // Row 1: Received by
      doc.text('Received by:', margin, yPosition);
      yPosition += 10; // Double space between 'Received by:' and signature line
      doc.line(margin, yPosition, margin + 70, yPosition); // Received by signature line
      yPosition += 5; // Single space between signature line and 'Signature over Printed Name'
      doc.setFontSize(10);
      doc.setFont('calibri', 'normal');
      doc.text('Signature over Printed Name', margin, yPosition);
      yPosition += 10; // Double space before Date and Control No
      
      // Row 2: Date and Control No
      doc.text('Date:', margin, yPosition);
      doc.text('Control No:', margin + 80, yPosition); // Add Control No on same line
      yPosition += 10; // Double space between labels and lines
      doc.line(margin, yPosition, margin + 70, yPosition); // Date line
      doc.line(margin + 80, yPosition, margin + 130, yPosition); // Control No line
      
   
      
      // Save the PDF
      doc.save(`Delinquency_Notice_${selectedVendor.fullname.replace(/\s+/g, '_')}.pdf`);
      message.success('Delinquency notice generated successfully!');
      
    } catch (error) {
      console.error('Error generating delinquency notice:', error);
      message.error('Failed to generate delinquency notice');
    }
  };

  const generateAllDelinquencyNotices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/vendor-analysis/all-vendors-with-balances', {
        params: { year: selectedYear }
      });
      
      const vendorsWithBalances = response.data;
      
      if (vendorsWithBalances.length === 0) {
        message.info('No vendors with delinquent balances found for this year');
        setLoading(false);
        return;
      }
      
      // Generate a single PDF with all vendor notices
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      
      // Get current date and format it properly
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      let currentPage = 0;
      
      vendorsWithBalances.forEach((vendorData, vendorIndex) => {
        // Add new page for each vendor except the first one
        if (currentPage > 0) {
          doc.addPage();
        }
        
        let yPosition = addGovernmentHeader(doc, pageWidth, margin);
        
        // Title centered and bold
        doc.setFont('calibri', 'bold');
        doc.setFontSize(10.5);
        doc.text('NOTICE OF DELINQUENCY', pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 10;
        
        // Date below title
        doc.setFontSize(10.5);
        doc.setFont('calibri', 'normal');
        doc.text(formattedDate, pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 12;
        
        // Recipient Information Section (left aligned)
        doc.setFontSize(10.5);
        doc.setFont('calibri', 'bold');
        doc.text(vendorData.vendor.fullname, margin, yPosition);
        yPosition += 7;
        
        // Get section name for this vendor
        const sectionName = vendorData.section_breakdown && vendorData.section_breakdown.length > 0 
          ? vendorData.section_breakdown.map(section => section.section_name).join('/') + ' Sections'
          : 'All Sections';
        
        doc.text(sectionName, margin, yPosition);
        
        yPosition += 10;
        doc.text('Dear Sir/Madam:', margin, yPosition);
        
        yPosition += 10;
        
        // Body Content - Formal notice paragraph
        doc.setFont('calibri', 'normal');
        doc.setFontSize(10.5);
        const bodyMaxWidth = pageWidth - 2 * margin;
        const bodyText = [
          'Please be informed that as per record in this office you failed to pay the daily rental for three (3) consecutive days thus your Contract become automatically terminated and rescinded. The said premises shall be vacated peacefully by the Lessee without even any formal notice or demand yet we do the same. Upon cancellation of the contract the Lessee hereby grants to the Lessor the legal right to enter and take possession of the leased premises as though the term of this lease has expired.\nBe notified further that your stall rental delinquencies are as follows:'
        ];
        
        bodyText.forEach(paragraph => {
          const splitText = doc.splitTextToSize(paragraph, bodyMaxWidth);
          splitText.forEach(line => {
            doc.text(line, margin, yPosition);
            yPosition += 5;
          });
          if (paragraph !== '') {
            yPosition += 2;
          }
        });
        
        yPosition += 3;
        
        // Delinquency Table - Centered on page
        const tableX = (pageWidth - 100) / 2;
        
        // Set consistent line width for all borders
        doc.setLineWidth(0.1);
        
        // Table header with white background
        doc.setFillColor(255, 255, 255);
        doc.rect(tableX, yPosition, 50, 10, 'F');
        doc.rect(tableX + 50, yPosition, 50, 10, 'F');
        
        // Table borders
        doc.rect(tableX, yPosition, 50, 10);
        doc.rect(tableX + 50, yPosition, 50, 10);
        
        doc.setFont('helvetica', 'bold');
        doc.text('DATE', tableX + 5, yPosition + 7);
        doc.text('AMOUNT', tableX + 55, yPosition + 7);
        
        yPosition += 10;
        doc.setFont('helvetica', 'normal');
        
        // Table data rows
        vendorData.monthsWithBalance.forEach((item) => {
          // White background for all cells
          doc.setFillColor(255, 255, 255);
          doc.rect(tableX, yPosition, 50, 8, 'F');
          doc.rect(tableX + 50, yPosition, 50, 8, 'F');
          
          // Row borders with consistent thickness
          doc.rect(tableX, yPosition, 50, 8);
          doc.rect(tableX + 50, yPosition, 50, 8);
          
          // Text content
          doc.text(item.month, tableX + 5, yPosition + 5);
          doc.text(formatCurrencyForPDF(item.balance), tableX + 55, yPosition + 5);
          yPosition += 8;
        });
        
        // Total row with white background
        doc.setFillColor(255, 255, 255);
        doc.rect(tableX, yPosition, 50, 10, 'F');
        doc.rect(tableX + 50, yPosition, 50, 10, 'F');
        doc.rect(tableX, yPosition, 100, 10);
        
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL Php', tableX + 5, yPosition + 7);
        doc.text(formatCurrencyForPDF(vendorData.totalBalance), tableX + 55, yPosition + 7);
        
        yPosition += 15;
        
        // Footer Instructions
        doc.setFont('calibri', 'normal');
        const footerMaxWidth = pageWidth - 2 * margin;
        const instructions = [
          'Please settle the above-mentioned obligations within five (5) working days upon receipt hereof.\nPlease disregard this notice if payment has been made and for further queries kindly come to my office.\nThank you for giving this matter your most attention.'
        ];
        
        yPosition += 5;
        
        instructions.forEach(paragraph => {
          const splitText = doc.splitTextToSize(paragraph, footerMaxWidth);
          splitText.forEach(line => {
            doc.text(line, margin, yPosition);
            yPosition += 5;
          });
          if (paragraph !== '') {
            yPosition += 2;
          }
        });
        
        yPosition += 5;
        
        doc.setFontSize(10.5);
        doc.setFont('calibri', 'normal');
        doc.text('Prepared by:', margin, yPosition);
        
        yPosition += 10;
        doc.setFont('calibri', 'bold');
        doc.text('MYRANIE A. YAID', margin, yPosition);
        
        yPosition += 10;
        doc.setFont('calibri', 'normal');
        doc.text('Noted by:', margin, yPosition);
        
        yPosition += 10;
        doc.setFont('calibri', 'bold');
        doc.text('ARIEL BRIAN Y. ORTIGOZA', margin, yPosition);
        
        yPosition += 5;
        doc.setFontSize(10);
        doc.setFont('calibri', 'normal');
        doc.text('MEEO - designate', margin, yPosition);
        
        yPosition += 3;
        yPosition += 5;
        doc.setFontSize(9.7);
        
        // Row 1: Received by
        doc.text('Received by:', margin, yPosition);
        yPosition += 10;
        doc.line(margin, yPosition, margin + 70, yPosition);
        yPosition += 5;
        doc.setFontSize(10);
        doc.setFont('calibri', 'normal');
        doc.text('Signature over Printed Name', margin, yPosition);
        yPosition += 10;
        
        // Row 2: Date and Control No
        doc.text('Date:', margin, yPosition);
        doc.text('Control No:', margin + 80, yPosition);
        yPosition += 10;
        doc.line(margin, yPosition, margin + 70, yPosition);
        doc.line(margin + 80, yPosition, margin + 130, yPosition);
        
        currentPage++;
      });
      
      // Save the PDF with all notices
      doc.save(`All_Delinquency_Notices_${selectedYear}.pdf`);
      message.success(`Successfully generated ${vendorsWithBalances.length} delinquency notices!`);
      
    } catch (error) {
      console.error('Error generating all delinquency notices:', error);
      message.error('Failed to generate all delinquency notices');
    } finally {
      setLoading(false);
    }
  };

  const exportYearlyPaymentLedgerPDF = () => {
    if (!vendorData || !selectedVendor) {
      message.error('Please select a vendor first');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3' // A3 landscape: 420mm x 297mm
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      
      // Add government header
      let yPosition = addGovernmentHeader(doc, pageWidth, margin);
      
      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`Monthly Payment Analysis - ${selectedYear}`, pageWidth / 2, yPosition, { align: 'center' });
      
      // Vendor name
      yPosition += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Vendor: ${selectedVendor.fullname}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      
      // Define months and colors
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthColors = {
        'Jan': [82, 196, 26],
        'Feb': [24, 144, 255],
        'Mar': [250, 173, 20],
        'Apr': [250, 140, 22],
        'May': [235, 47, 150],
        'Jun': [19, 194, 194],
        'Jul': [140, 140, 140],
        'Aug': [250, 140, 22],
        'Sep': [250, 140, 22],
        'Oct': [114, 46, 209],
        'Nov': [245, 34, 45],
        'Dec': [82, 196, 26]
      };
      
      // Prepare table data
      const tableData = [];
      let monthlyTotals = {};
      
      // Initialize monthly totals
      months.forEach(month => {
        monthlyTotals[month] = 0;
      });
      
      for (let i = 1; i <= 31; i++) {
        const row = [i]; // NO. column
        
        months.forEach(month => {
          const monthPayments = vendorData.monthly_payment_details?.[month]?.payments;
          let orNo = '-';
          let amount = '-';
          
          if (monthPayments) {
            // Handle both array and object structures
            let payments = [];
            if (Array.isArray(monthPayments)) {
              payments = monthPayments;
            } else if (monthPayments && typeof monthPayments === 'object') {
              payments = Object.values(monthPayments);
            }
            
            // Find payments for this day
            const dayPayments = payments.filter(payment => {
              try {
                const paymentDate = new Date(payment.date);
                return paymentDate.getDate() === i;
              } catch (error) {
                return false;
              }
            });
            
            if (dayPayments.length > 0) {
              // Since backend already groups by date and combines OR numbers,
              // we just need to get the first (and should be only) payment for this day
              const dayPayment = dayPayments[0];
              orNo = dayPayment.or_no || '-';
              amount = formatCurrencyForPDF(dayPayment.amount || 0);
              
              // Add to monthly total
              monthlyTotals[month] += dayPayment.amount || 0;
            }
          }
          
          row.push(orNo, amount);
        });
        
        tableData.push(row);
      }
      
      // Add total row
      const totalRow = ['TOTAL'];
      months.forEach(month => {
        totalRow.push('-', formatCurrencyForPDF(monthlyTotals[month]));
      });
      tableData.push(totalRow);
      
      // Define column widths (25 columns total: 1 NO. + 12 months × 2 columns)
      // Calculate available width and distribute evenly
      const availableWidth = pageWidth - (margin * 2);
      const columnWidths = [12]; // NO. column - smaller
      for (let i = 0; i < 12; i++) {
        columnWidths.push(14, 16); // OR No. and Amount columns - smaller to fit
      }
      
      // Create two-level headers
      const monthHeaders = ['NO.'];
      months.forEach(month => {
        monthHeaders.push(month, month); // Each month spans two columns
      });
      
      const subHeaders = ['NO.'];
      months.forEach(month => {
        subHeaders.push('OR NO.', 'AMOUNT');
      });
      
      // Create the table with two-level headers
      autoTable(doc, {
        head: [monthHeaders, subHeaders],
        body: tableData,
        startY: yPosition,
        theme: 'grid',
        styles: { 
          fontSize: 5, 
          cellPadding: 1, 
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          font: 'helvetica'
        },
        headStyles: {
          fillColor: [240, 240, 240],
          fontSize: 6,
          cellPadding: 2,
          fontStyle: 'bold',
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          textColor: [0, 0, 0] // Black text for all headers
        },
        didParseCell: function(data) {
          if (data.section === 'head') {
            if (data.row.index === 0) {
              // First row of header
              if (data.column.index === 0) {
                // NO. column - merge vertically and center
                data.cell.rowSpan = 2;
                data.cell.styles.halign = 'center';
                data.cell.styles.valign = 'middle';
                data.cell.styles.fillColor = [240, 240, 240]; // Light grey background
                data.cell.styles.textColor = [0, 0, 0]; // Black text
              } else {
                // Month headers - merge horizontally into one cell, center, no background, black text
                const monthIndex = Math.floor((data.column.index - 1) / 2);
                if ((data.column.index - 1) % 2 === 0) {
                  data.cell.colSpan = 2;
                  data.cell.styles.halign = 'center';
                  data.cell.styles.valign = 'middle';
                  data.cell.styles.fillColor = [255, 255, 255]; // White background (no color)
                  data.cell.styles.textColor = [0, 0, 0]; // Black text
                } else {
                  // Hide the second cell of each month pair
                  data.cell.styles.fillColor = [255, 255, 255];
                  data.cell.styles.textColor = [255, 255, 255];
                }
              }
            } else if (data.row.index === 1) {
              // Second row of header (OR NO., AMOUNT)
              if (data.column.index === 0) {
                // Hide the NO. cell in second row as it's merged with first row
                data.cell.styles.fillColor = [255, 255, 255];
                data.cell.styles.textColor = [255, 255, 255];
              } else {
                // Apply light grey background and black text to sub-headers
                data.cell.styles.fillColor = [240, 240, 240];
                data.cell.styles.textColor = [0, 0, 0];
              }
            }
          } else if (data.section === 'body') {
            // Style the total row
            if (data.row.index === tableData.length - 1) { // Last row is total
              data.cell.styles.fillColor = [240, 240, 240];
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.lineWidth = 0.2;
              if (data.column.index === 0) {
                data.cell.styles.fillColor = [200, 200, 200];
                data.cell.styles.textColor = [0, 0, 139]; // Blue color for "TOTAL"
              }
            }
          }
        },
        columnStyles: columnWidths.reduce((acc, width, index) => {
          if (index === 0) {
            // NO. column - center aligned
            acc[index] = { cellWidth: width, halign: 'center', valign: 'middle' };
          } else if (index % 2 === 1) {
            // OR NO. columns - center aligned
            acc[index] = { cellWidth: width, halign: 'center', valign: 'middle' };
          } else {
            // AMOUNT columns - right aligned
            acc[index] = { cellWidth: width, halign: 'right', valign: 'middle' };
          }
          return acc;
        }, {}),
        tableWidth: availableWidth
      });
      
      // Save the PDF
      doc.save(`Yearly_Payment_Ledger_${selectedVendor.fullname.replace(/\s+/g, '_')}_${selectedYear}.pdf`);
      message.success('Yearly payment ledger PDF exported successfully!');
      
    } catch (error) {
      console.error('Error generating yearly payment ledger PDF:', error);
      message.error('Failed to generate yearly payment ledger PDF');
    }
  };

  const exportToPDF = () => {
    if (!vendorData || !selectedVendor) {
      message.error('Please select a vendor first');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set font to support Unicode (if needed)
      doc.setFont('helvetica');
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      
      // Add letterhead template as background
      try {
        doc.addImage(letterheadTemplate, 'JPEG', 0, 0, pageWidth, pageHeight);
      } catch (error) {
        // Letterhead template not found, continuing without it
      }
      
      // Title
      let yPosition = 70; // Start position after letterhead
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Vendor Remaining Balance Report', pageWidth / 2, yPosition, { align: 'center' });
      
      // Date
      yPosition += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      doc.text(`Generated on: ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });
      
      // Vendor Info
      yPosition += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Vendor: ${selectedVendor.fullname}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Year: ${selectedYear}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 20;
      
      // Stall Analysis Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Stall Analysis', pageWidth / 2, yPosition, { align: 'center' });
      
      const stallData = [{
        vendor_name: vendorData.vendor_analysis.vendor_name,
        stall_count: vendorData.vendor_analysis.stall_count,
        daily: formatCurrencyForPDF(vendorData.vendor_analysis.daily),
        monthly: formatCurrencyForPDF(vendorData.vendor_analysis.monthly),
        annual: formatCurrencyForPDF(vendorData.vendor_analysis.annual),
        space_rights: formatCurrencyForPDF(vendorData.vendor_analysis.space_rights)
      }];
      
      autoTable(doc, {
        head: [['Vendor Name', 'Stalls Owned', 'Daily Rate', 'Monthly Rate', 'Annual Rate', 'Space Rights']],
        body: stallData.map(row => [
          row.vendor_name,
          `${row.stall_count} Stall${row.stall_count !== 1 ? 's' : ''}`,
          row.daily,
          row.monthly,
          row.annual,
          row.space_rights
        ]),
        startY: yPosition + 10, // Adjusted for single spacing
        theme: 'grid',
        styles: { 
          fontSize: 9,
          lineWidth: 0.5,
          lineColor: [0, 0, 0]
        },
        headStyles: { 
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 35, halign: 'center' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' },
          4: { cellWidth: 30, halign: 'center' },
          5: { cellWidth: 30, halign: 'center' }
        },
        margin: { left: (pageWidth - 180) / 2 + 5} // Moved 10 units to the right
      });
      
      // Monthly Payment Analysis Table (below Stall Analysis)
      const monthlyData = vendorData.monthly_breakdown.map(item => ({
        month: item.month,
        monthly_rate: formatCurrencyForPDF(item.monthly_rate),
        payment: formatCurrencyForPDF(item.payment),
        balance: formatCurrencyForPDF(item.balance),
        deposit: formatCurrencyForPDF(item.deposit)
      }));
      
      // Add total row
      monthlyData.push({
        month: 'Total',
        monthly_rate: formatCurrencyForPDF(vendorData.monthly_breakdown.reduce((sum, item) => sum + item.monthly_rate, 0)),
        payment: formatCurrencyForPDF(vendorData.yearly_totals.total_payments),
        balance: formatCurrencyForPDF(vendorData.yearly_totals.total_balance),
        deposit: formatCurrencyForPDF(vendorData.monthly_breakdown.reduce((sum, item) => sum + item.deposit, 0))
      });
      
      const stallTableY = doc.lastAutoTable.finalY || yPosition + 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Monthly Payment Analysis', pageWidth / 2, stallTableY + 15, { align: 'center' });
      
      autoTable(doc, {
        head: [['Month', 'Monthly Rate', 'Payment', 'Balance', 'Deposit']],
        body: monthlyData.map((row, index) => [
          row.month,
          row.monthly_rate,
          row.payment,
          row.balance,
          row.deposit
        ]),
        startY: stallTableY + 20, // Adjusted for single spacing
        theme: 'grid',
        styles: { 
          fontSize: 9,
          lineWidth: 0.5,
          lineColor: [0, 0, 0]
        },
        headStyles: { 
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 30, halign: 'center' },
          1: { cellWidth: 35, halign: 'center' },
          2: { cellWidth: 35, halign: 'center' },
          3: { cellWidth: 35, halign: 'center' },
          4: { cellWidth: 35, halign: 'center' }
        },
        didParseCell: function(data) {
          // Style total row
          if (data.row.index === monthlyData.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [255,255, 255];
            data.cell.styles.halign = 'center';
          }
        },
        margin: { left: (pageWidth - 170) / 2 }
      });
      
      // Save the PDF
      doc.save(`Vendor_Analysis_${selectedVendor.fullname.replace(/\s+/g, '_')}_${selectedYear}.pdf`);
      message.success('PDF exported successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('Failed to generate PDF');
    }
  };

  // OR Number Management Functions
  const updateOrNumbersForDate = async (paymentDate, orNumber) => {
    if (!selectedVendor) {
      message.error('Please select a vendor first');
      return;
    }

    try {
      const response = await api.post('/vendor-analysis/update-or-numbers', {
        vendor_id: selectedVendor.id,
        payment_date: paymentDate,
        or_number: orNumber,
        section: activeTab === 'all' ? null : activeTab.replace('section-', '')
      });

      if (response.data.success) {
        message.success(response.data.message);
        // Refresh vendor data to show updated OR numbers while maintaining section context
        await handleTabChange(activeTab);
        return response.data;
      } else {
        message.error(response.data.message);
        return null;
      }
    } catch (error) {
      console.error('Error updating OR numbers:', error);
      message.error('Failed to update OR numbers');
      return null;
    }
  };

  const getOrNumbersForDate = async (paymentDate) => {
    if (!selectedVendor) {
      message.error('Please select a vendor first');
      return null;
    }

    try {
      const response = await api.get('/vendor-analysis/get-or-numbers', {
        params: {
          vendor_id: selectedVendor.id,
          payment_date: paymentDate
        }
      });

      if (response.data.success) {
        return response.data;
      } else {
        message.error(response.data.message);
        return null;
      }
    } catch (error) {
      console.error('Error fetching OR numbers:', error);
      message.error('Failed to fetch OR numbers');
      return null;
    }
  };

  // Function to handle OR number input with modal
  const handleOrNumberUpdate = (paymentDate) => {
    // Check if there are any payments for this date before allowing OR number update
    const hasPaymentsForDate = checkPaymentsExistForDate(paymentDate);
    
    if (!hasPaymentsForDate) {
      message.warning('Cannot add OR number: No payments have been made for this date.');
      return;
    }
    
    setSelectedPaymentDate(paymentDate);
    setOrNumberInput('');
    setOrModalVisible(true);
  };

  // Function to check if payments exist for a specific date
  const checkPaymentsExistForDate = (paymentDate) => {
    const date = new Date(paymentDate);
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[monthIndex];
    
    const monthPayments = vendorData?.monthly_payment_details?.[month]?.payments;
    
    // Handle both array and object structures
    let payments = [];
    if (Array.isArray(monthPayments)) {
      payments = monthPayments;
    } else if (monthPayments && typeof monthPayments === 'object') {
      payments = Object.values(monthPayments);
    }
    
    // Check if there are any payments for this specific day
    const dayPayments = payments.filter(payment => {
      try {
        const paymentDate = new Date(payment.date);
        return paymentDate.getDate() === day;
      } catch (error) {
        return false;
      }
    });
    
    return dayPayments.length > 0;
  };

  const handleOrModalOk = async () => {
    if (!orNumberInput.trim()) {
      message.error('OR number is required');
      return;
    }

    const result = await updateOrNumbersForDate(selectedPaymentDate, orNumberInput.trim());
    if (result) {
      setOrModalVisible(false);
      message.success(`OR number has been updated: ${result.or_number}`);
    }
  };

  const handleOrModalCancel = () => {
    setOrModalVisible(false);
    setOrNumberInput('');
  };

  const stallColumns = [
    {
      title: 'Vendor Name',
      dataIndex: 'vendor_name',
      key: 'vendor_name',
      fixed: 'left',
      width: 200,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Stall Owned',
      dataIndex: 'stall_count',
      key: 'stall_count',
      width: 150,
      align: 'center',
      render: (count) => (
        <Tag color="blue" icon={<ShopOutlined />}>
          {count} Stall{count !== 1 ? 's' : ''}
        </Tag>
      )
    },
    {
      title: 'Daily Rate',
      dataIndex: 'daily',
      key: 'daily',
      align: 'right',
      width: 120,
      render: (value, record) => (
        <Text type="secondary">
          {formatCurrency(value)}
          {record.daily_display && <Text style={{ marginLeft: 4, fontSize: '12px' }}>{record.daily_display}</Text>}
        </Text>
      )
    },
    {
      title: 'Monthly Rate',
      dataIndex: 'monthly',
      key: 'monthly',
      align: 'right',
      width: 130,
      render: (value) => <Text strong>{formatCurrency(value)}</Text>
    },
    {
      title: 'Annual Rate',
      dataIndex: 'annual',
      key: 'annual',
      align: 'right',
      width: 140,
      render: (value) => <Text>{formatCurrency(value)}</Text>
    },
    {
      title: 'Space Rights',
      dataIndex: 'space_rights',
      key: 'space_rights',
      width: 150,
      align: 'right',
      render: (value) => <Text strong>{formatCurrency(value)}</Text>
    }
  ];

  const monthlyColumns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      fixed: 'left',
      width: 100,
      render: (text) => (
        <Space>
          <CalendarOutlined />
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Monthly Rate',
      dataIndex: 'monthly_rate',
      key: 'monthly_rate',
      align: 'right',
      width: 150,
      render: (value) => (
        <Text type="secondary">
          {formatCurrency(value)}
        </Text>
      )
    },
    {
      title: 'Payment',
      dataIndex: 'payment',
      key: 'payment',
      align: 'right',
      width: 150,
      render: (value, record) => {
        const isPaidInFull = value >= record.monthly_rate && value > 0;
        const isPartialPayment = value > 0 && value < record.monthly_rate;
        const hasDeposit = record.deposit > 0;
        
        return (
          <div>
            {isPaidInFull && (
              <div>
                <Text type="success" strong>
                  {formatCurrency(value)}
                </Text>
                <br />
                <Tag color="green" size="small" style={{ marginTop: '2px' }}>
                  <CheckCircleOutlined style={{ marginRight: '2px' }} />
                  Paid in Full
                </Tag>
              </div>
            )}
            {isPartialPayment && (
              <div>
                <Text type="warning" strong>
                  {formatCurrency(value)}
                </Text>
                <br />
                <Tag color="orange" size="small" style={{ marginTop: '2px' }}>
                  <ExclamationCircleOutlined style={{ marginRight: '2px' }} />
                  Partial Payment
                </Tag>
              </div>
            )}
            {value === 0 && (
              <div>
                <Text type="secondary">
                  {formatCurrency(0)}
                </Text>
                <br />
                <Tag color="default" size="small" style={{ marginTop: '2px' }}>
                  <ClockCircleOutlined style={{ marginRight: '2px' }} />
                  No Payment
                </Tag>
              </div>
            )}
            {hasDeposit && (
              <div style={{ marginTop: '2px' }}>
                <Text type="info" style={{ fontSize: '11px' }}>
                  Deposit: {formatCurrency(record.deposit)}
                </Text>
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      align: 'right',
      width: 150,
      render: (value) => {
        // Handle negative zero display
        const displayValue = (value === 0 || Math.abs(value) < 0.01) ? 0 : value;
        return (
          <Text strong className={displayValue > 0 ? 'text-red-500' : 'text-green-500'}>
            {formatCurrency(displayValue)}
          </Text>
        );
      }
    },
    {
      title: 'Deposit',
      dataIndex: 'deposit',
      key: 'deposit',
      align: 'right',
      width: 150,
      render: (value) => {
        if (value > 0) {
          return (
            <Text strong className="text-blue-500">
              {formatCurrency(value)}
            </Text>
          );
        }
        return <Text type="secondary">-</Text>;
      }
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Vendor Selection */}
      <Card className="mb-6 shadow-sm">
        <Title level={2} className="mb-4">
          <DollarOutlined className="mr-2" />
          Vendor Remaining Balance
        </Title>

        <Space size="large" align="center">
          <div>
            <Text strong className="block mb-2">Select Vendor</Text>
            <Select
              style={{ width: 300 }}
              placeholder="Choose a vendor..."
              value={selectedVendor?.id}
              onChange={handleVendorChange}
              size="large"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {vendors.map(vendor => (
                <Option key={vendor.id} value={vendor.id}>
                  {vendor.fullname}
                </Option>
              ))}
            </Select>
          </div>

          {selectedVendor && (
            <div>
              <Text strong className="block mb-2">Select Year</Text>
              <Select
                value={selectedYear}
                onChange={(year) => handleYearChange(null, year)}
                size="large"
                style={{ width: 120 }}
                placeholder="Select year"
              >
                {Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(year => (
                  <Option key={year} value={year}>
                    {year}
                  </Option>
                ))}
              </Select>
            </div>
          )}

          {selectedVendor && (
            <>
              <Button
                type="default"
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchVendors();
                  if (selectedVendor) {
                    handleVendorChange(selectedVendor.id);
                  }
                }}
                size="large"
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={exportToPDF}
                size="large"
                disabled={!vendorData || loading}
                   style={{ backgroundColor: '#ffffffff', borderColor: '#52c41a', color: 'black' }}
           
              >
                Export PDF
              </Button>
              <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={exportYearlyPaymentLedgerPDF}
                size="large"
                disabled={!vendorData || loading}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
              >
                Export Ledger
              </Button>
              <Button
                type="default"
                icon={<PrinterOutlined />}
                onClick={generateDelinquencyNotice}
                size="large"
                disabled={!vendorData || loading}
                style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f', color: 'white' }}
              >
                Print Notice
              </Button>
              <Button
                type="default"
                icon={<PrinterOutlined />}
                onClick={generateAllDelinquencyNotices}
                size="large"
                disabled={loading}
                style={{ backgroundColor: '#ff7875', borderColor: '#ff7875', color: 'white' }}
              >
                Print All Notices
              </Button>
              <Alert
                message={`Displaying: ${selectedVendor.fullname} (${selectedYear})`}
                type="info"
                showIcon
                className="flex-1"
              />
            </>
          )}
        </Space>
      </Card>

      {/* Loading */}
      {loading && <LoadingOverlay message="Loading vendor remaining balance data..." />}

      {/* Vendor Data */}
      {vendorData && !loading && (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Summary Statistics */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="Monthly Total"
                  value={vendorData.totals.monthly}
                  formatter={(value) => formatCurrency(value)}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="Total Paid"
                  value={vendorData.yearly_totals.total_payments}
                  formatter={(value) => formatCurrency(value)}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="Remaining Balance"
                  value={vendorData.yearly_totals.total_balance}
                  formatter={(value) => formatCurrency(value)}
                  valueStyle={{
                    color: vendorData.yearly_totals.total_balance > 0 ? '#ff4d4f' : '#52c41a'
                  }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* Stall Analysis Table */}
          <Card
            title={
              <Space>
                <ShopOutlined />
                <span>Stall Analysis</span>
                <Text type="secondary">({vendorData.vendor.fullname})</Text>
              </Space>
            }
            className="shadow-sm"
          >
         <Table
  rowKey={(record) => record.vendor_name}
  className="plain-table"
  columns={stallColumns}
  dataSource={[vendorData.vendor_analysis]}
  pagination={false}
  scroll={{ x: 1000 }}
/>
          </Card>

          <Divider />

          {/* Monthly Payment Analysis with Section Tabs */}
          <Card
            title={
              <Space>
                <CalendarOutlined />
                <span>Monthly Payment Analysis</span>
                <Text type="secondary">Payment and Balance Breakdown by Section</Text>
              </Space>
            }
            className="shadow-sm"
          >
            <Tabs activeKey={activeTab} onChange={handleTabChange} type="card">
              {/* All Sections Tab */}
              <TabPane tab="All Sections" key="all">
                <Table
                  rowKey={(record) => record.month}
                  className="plain-table"
                  columns={monthlyColumns}
                  dataSource={vendorData.monthly_breakdown}
                  pagination={false}
                  scroll={{ x: 700 }}
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <Text strong>Total</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong>
                          {formatCurrency(vendorData.monthly_breakdown.reduce((sum, item) => sum + item.monthly_rate, 0))}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <Text strong type="success">
                          {formatCurrency(vendorData.yearly_totals.total_payments)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">
                        <Text strong className={vendorData.yearly_totals.total_balance > 0 ? 'text-red-500' : 'text-green-500'}>
                          {formatCurrency(vendorData.yearly_totals.total_balance)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align="right">
                        <Text strong className="text-blue-500">
                          {formatCurrency(vendorData.monthly_breakdown.reduce((sum, item) => sum + item.deposit, 0))}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              </TabPane>

              {/* Individual Section Tabs */}
              {vendorData.section_breakdown?.map((section) => (
                <TabPane 
                  tab={
                    <Space>
                      <ShopOutlined />
                      <span>{section.section_name}</span>
                      <Tag color="blue">{section.stall_count}</Tag>
                    </Space>
                  } 
                  key={`section-${section.section_id}`}
                >
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={6}>
                      <Card size="small">
                        <Statistic
                          title="Daily Rate"
                          value={section.daily_total}
                          formatter={(value) => formatCurrency(value)}
                          valueStyle={{ color: '#1890ff', fontSize: '16px' }}
                          suffix={
                            section.daily_display && (
                              <Text style={{ fontSize: '12px', marginLeft: 4 }}>{section.daily_display}</Text>
                            )
                          }
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                      <Card size="small">
                        <Statistic
                          title="Monthly Rate"
                          value={section.monthly_total}
                          formatter={(value) => formatCurrency(value)}
                          valueStyle={{ color: '#52c41a', fontSize: '16px' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                      <Card size="small">
                        <Statistic
                          title="Annual Rate"
                          value={section.monthly_total * 12}
                          formatter={(value) => formatCurrency(value)}
                          valueStyle={{ color: '#fa8c16', fontSize: '16px' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                      <Card size="small">
                        <Statistic
                          title="Space Rights"
                          value={section.space_rights}
                          formatter={(value) => formatCurrency(value)}
                          valueStyle={{ color: '#722ed1', fontSize: '16px' }}
                        />
                      </Card>
                    </Col>
                  </Row>
                  
                  <Table
                    rowKey={(record) => record.month}
                    className="plain-table"
                    columns={monthlyColumns}
                    dataSource={section.monthly_breakdown}
                    pagination={false}
                    scroll={{ x: 700 }}
                    summary={() => {
                      const totalMonthlyRate = section.monthly_breakdown.reduce((sum, item) => sum + item.monthly_rate, 0);
                      const totalPayments = section.monthly_breakdown.reduce((sum, item) => sum + item.payment, 0);
                      const totalBalance = section.monthly_breakdown.reduce((sum, item) => sum + item.balance, 0);
                      const totalDeposits = section.monthly_breakdown.reduce((sum, item) => sum + item.deposit, 0);
                      
                      return (
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0}>
                            <Text strong>Total</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1} align="right">
                            <Text strong>
                              {formatCurrency(totalMonthlyRate)}
                            </Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={2} align="right">
                            <Text strong type="success">
                              {formatCurrency(totalPayments)}
                            </Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={3} align="right">
                            <Text strong className={totalBalance > 0 ? 'text-red-500' : 'text-green-500'}>
                              {formatCurrency(totalBalance)}
                            </Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={4} align="right">
                            <Text strong className="text-blue-500">
                              {formatCurrency(totalDeposits)}
                            </Text>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      );
                    }}
                  />
                </TabPane>
              ))}
            </Tabs>
          </Card>
          
          {/* Monthly Payment Analysis Table */}
          <Card
            title={
              <Space>
                <CalendarOutlined />
                <span>Monthly Payment Analysis - {selectedYear}</span>
                <Text type="secondary">Detailed Payment Records</Text>
              </Space>
            }
            className="shadow-sm"
          >
            <MonthlyPaymentAnalysisTable 
              paymentDetails={vendorData.monthly_payment_details}
              formatCurrency={formatCurrency}
              onOrNumberUpdate={handleOrNumberUpdate}
              selectedYear={selectedYear}
            />
          </Card>

        </Space>
      )}

      {/* OR Number Modal */}
      <Modal
        title="Add/Update OR Number"
        open={orModalVisible}
        onOk={handleOrModalOk}
        onCancel={handleOrModalCancel}
        okText="Update"
        cancelText="Cancel"
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Payment Date:</Text> {selectedPaymentDate}
          </div>
          <div>
            <Text strong>OR Number:</Text>
            <Input
              placeholder="Enter OR number"
              value={orNumberInput}
              onChange={(e) => setOrNumberInput(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>

      {/* CSS Overrides */}
      <style>{`
  .plain-table .ant-table-thead > tr > th {
    background-color: #ffffff !important;
    color: #000000 !important;
    font-weight: 600;
    border-bottom: 1px solid #f0f0f0;
  }
  .plain-table .ant-table-thead > tr > th::before {
    display: none !important;
  }
  
  /* Table border styling */
  .ant-table {
    border: 1px solid #000000 !important;
    border-radius: 6px !important;
  }
  
  .ant-table-container {
    border: 1px solid #000000 !important;
    border-radius: 6px !important;
  }
  
  .ant-table table {
    border: 1px solid #000000 !important;
    border-radius: 6px !important;
  }
  
  .ant-table-tbody > tr > td {
    border: 1px solid #000000 !important;
  }
  
  .ant-table-thead > tr > th {
    border: 1px solid #000000 !important;
  }
  
  .ant-table-summary > tr > td {
    border: 1px solid #000000 !important;
  }
  
  /* Specific styling for bordered tables */
  .ant-table-bordered .ant-table-tbody > tr > td {
    border: 1px solid #000000 !important;
  }
  
  .ant-table-bordered .ant-table-thead > tr > th {
    border: 1px solid #000000 !important;
  }
  
  .ant-table-bordered .ant-table-summary > tr > td {
    border: 1px solid #000000 !important;
  }
  
  /* Total row styling */
  .total-row {
    background-color: #f0f0f0 !important;
    font-weight: bold !important;
  }
  
  .total-row td {
    background-color: #f0f0f0 !important;
    font-weight: bold !important;
    border-top: 2px solid #000000 !important;
  }
  
  .total-row .ant-table-cell-fix-left {
    background-color: #e6f7ff !important;
    color: #1890ff !important;
  }
`}</style>
    </div>
  );
};

export default VendorAnalysis;