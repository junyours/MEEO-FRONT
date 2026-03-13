import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Card,
  Button,
  DatePicker,
  Select,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Spin,
  Empty,
  message,
  Divider,
} from 'antd';
import {
  PrinterOutlined,
  DownloadOutlined,
  CalendarOutlined,
  DollarOutlined,
  BarChartOutlined,
  ReloadOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import moment from 'moment';
import api from '../Api';
import './MarketCollectionReport.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const MarketCollectionReport = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(moment());
  const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'));
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [dateRange, setDateRange] = useState(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    const today = moment();
    setSelectedDate(today);
    setSelectedMonth(today.format('YYYY-MM'));
    setSelectedYear(today.year());
  }, []);

  useEffect(() => {
    if ((reportType === 'daily' && (dateRange || selectedMonth)) || (reportType === 'monthly' && selectedYear)) {
      fetchReportData();
    }
  }, [reportType, selectedDate, selectedMonth, selectedYear, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = { type: reportType };

      if (reportType === 'daily') {
        if (dateRange && dateRange[0] && dateRange[1]) {
          params.start_date = dateRange[0].format('YYYY-MM-DD');
          params.end_date = dateRange[1].format('YYYY-MM-DD');
        } else if (selectedMonth) {
          params.month = selectedMonth;
        } else {
          params.date = selectedDate.format('YYYY-MM-DD');
        }
      } else {
        params.year = selectedYear;
      }

      const response = await api.get('/vendor-payments/market-collection-report', { params });
      setReportData(response.data);
    } catch (error) {
      message.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!reportData) {
      message.error('No report data available for PDF generation');
      return;
    }

    setDownloadingPDF(true);
    try {
      const pdfContainer = document.createElement('div');
      pdfContainer.style.position = 'absolute';
      pdfContainer.style.left = '-9999px';
      pdfContainer.style.width = '210mm';
      pdfContainer.style.padding = '20px';
      pdfContainer.style.backgroundColor = 'white';
      pdfContainer.style.fontFamily = 'Arial, sans-serif';

      const header = document.createElement('div');
      header.style.textAlign = 'center';
      header.style.marginBottom = '30px';
      header.innerHTML = `
        <h1 style="margin: 0; font-size: 20px; color: #000; font-weight: bold;">Market Collection Report</h1>
        <div style="font-size: 14px; color: #555; margin-top: 5px;">
          ${reportType === 'daily' ? 'Daily Report' : 'Yearly Report'}
        </div>
      `;

      pdfContainer.appendChild(header);

      const summaryDiv = document.createElement('div');
      summaryDiv.style.marginBottom = '20px';
      summaryDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
          <div style="text-align: center; padding: 15px; border: 1px solid #000;">
            <div style="font-size: 12px; color: #555;">Total Collections</div>
            <div style="font-size: 16px; font-weight: bold;">${fmtMoney(reportData.summary.total_collections)}</div>
          </div>
          <div style="text-align: center; padding: 15px; border: 1px solid #000;">
            <div style="font-size: 12px; color: #555;">Total Transactions</div>
            <div style="font-size: 16px; font-weight: bold;">${reportData.summary.total_transactions}</div>
          </div>
          <div style="text-align: center; padding: 15px; border: 1px solid #000;">
            <div style="font-size: 12px; color: #555;">Missed Days Covered</div>
            <div style="font-size: 16px; font-weight: bold;">${reportData.summary.total_missed_days_covered}</div>
          </div>
          <div style="text-align: center; padding: 15px; border: 1px solid #000;">
            <div style="font-size: 12px; color: #555;">Advance Days</div>
            <div style="font-size: 16px; font-weight: bold;">${reportData.summary.total_advance_days}</div>
          </div>
        </div>
      `;
      pdfContainer.appendChild(summaryDiv);

      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '12px';
      table.innerHTML = `
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="border: 1px solid #000; padding: 8px;">Date</th>
            <th style="border: 1px solid #000; padding: 8px;">Vendor</th>
            <th style="border: 1px solid #000; padding: 8px;">Stall</th>
            <th style="border: 1px solid #000; padding: 8px;">Payment Type</th>
            <th style="border: 1px solid #000; padding: 8px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.data.slice(0, 50).map(item => `
            <tr>
              <td style="border: 1px solid #000; padding: 8px;">${fmtDate(item.payment_date)}</td>
              <td style="border: 1px solid #000; padding: 8px;">${item.vendor_name}</td>
              <td style="border: 1px solid #000; padding: 8px;">${item.section_name} - ${item.stall_number}</td>
              <td style="border: 1px solid #000; padding: 8px;">${item.payment_type}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right;">${fmtMoney(item.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      `;
      pdfContainer.appendChild(table);

      document.body.appendChild(pdfContainer);

      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(pdfContainer);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Market_Collection_Report_${moment().format('YYYY-MM-DD')}.pdf`);
      message.success('PDF downloaded successfully');
    } catch (error) {
      message.error('Failed to generate PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const fmtMoney = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount || 0);
  };

  const fmtDate = (date) => {
    return moment(date).format('LL');
  };

  const getPaymentTypeColor = (type) => {
    const colors = {
      'daily': 'blue',
      'partial': 'orange', 
      'fully paid': 'green',
      'advance': 'purple',
    };
    return colors[type] || 'default';
  };

  const generateYearOptions = () => {
    const currentYear = moment().year();
    return Array.from({ length: 11 }, (_, i) => currentYear - i);
  };

  const reportColumns = [
    {
      title: 'Date',
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (date) => fmtDate(date),
      sorter: (a, b) => new Date(a.payment_date) - new Date(b.payment_date),
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor_name',
      key: 'vendor_name',
    },
    {
      title: 'Stall',
      key: 'stall',
      render: (_, record) => `${record.section_name} - ${record.stall_number}`,
    },
    {
      title: 'Payment Type',
      dataIndex: 'payment_type',
      key: 'payment_type',
      render: (type) => (
        <Tag color={getPaymentTypeColor(type)}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text strong style={{ color: '#52c41a' }}>{fmtMoney(amount)}</Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
  ];


  const renderSummaryCards = (summary) => (
    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Collections"
            value={summary.total_collections}
            formatter={(value) => fmtMoney(value)}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Transactions"
            value={summary.total_transactions}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Missed Days Covered"
            value={summary.total_missed_days_covered}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Advance Days"
            value={summary.total_advance_days}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
    </Row>
  );

  if (loading && !reportData) {
    return <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: '100px' }} />;
  }

  return (
    <div className="market-collection-report-container">
      <div className="report-header">
        <div className="header-content">
          <div className="header-left">
            <Title level={3} style={{ margin: 0 }}>
              <BarChartOutlined style={{ marginRight: 8 }} />
              Market Collection Report
            </Title>
            <Text type="secondary">Financial overview and payment analytics</Text>
          </div>
          <div className="header-right">
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchReportData}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                icon={<PrinterOutlined />}
                onClick={handlePrint}
                disabled={!reportData}
              >
                Print
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownloadPDF}
                disabled={!reportData}
                loading={downloadingPDF}
                type="primary"
              >
                Download PDF
              </Button>
            </Space>
          </div>
        </div>
      </div>

      <Card className="controls-card" style={{ marginBottom: '24px' }}>
        <div className="controls-content">
          <div className="report-type-selector">
            <Text strong style={{ marginRight: 16 }}>Report Type:</Text>
            <Select
              value={reportType}
              onChange={setReportType}
              style={{ width: 150 }}
            >
              <Option value="daily">Daily Report</Option>
              <Option value="monthly">Yearly Report</Option>
            </Select>
          </div>
          
          <div className="date-selector">
            {reportType === 'daily' ? (
              <>
                <Text strong style={{ marginRight: 16 }}>Date Range:</Text>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => {
                    setDateRange(dates);
                    if (dates && dates[0] && dates[1]) {
                      setSelectedMonth(dates[0].format('YYYY-MM'));
                      setSelectedDate(dates[0]);
                    }
                  }}
                  format="YYYY-MM-DD"
                  placeholder={['Start Date', 'End Date']}
                />
              </>
            ) : (
              <>
                <Text strong style={{ marginRight: 16 }}>Year:</Text>
                <Select
                  value={selectedYear}
                  onChange={setSelectedYear}
                  style={{ width: 120 }}
                  placeholder="Select year"
                >
                  {generateYearOptions().map(year => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>
              </>
            )}
          </div>
        </div>
      </Card>

      {reportData ? (
        <div className="report-content">
          <div className="report-title">
            <Title level={4} style={{ textAlign: 'center', marginBottom: '24px' }}>
              {reportType === 'daily' 
                ? reportData.type === 'daily_range'
                  ? `Daily Report: ${reportData.start_date} to ${reportData.end_date}`
                  : `Daily Report for ${fmtDate(reportData.date)}`
                : `Yearly Report for ${reportData.year}`
              }
            </Title>
          </div>

          {renderSummaryCards(reportData.summary)}

          <Card title="Collection Details" style={{ marginBottom: '24px' }}>
            <Table
              columns={reportColumns}
              dataSource={reportData.data}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} records`,
              }}
              scroll={{ x: 800 }}
              loading={loading}
            />
          </Card>
        </div>
      ) : (
        <Card>
          <Empty
            description="No data available. Please select report parameters and generate a report."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}
    </div>
  );
};

export default MarketCollectionReport;
