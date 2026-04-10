import React, { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import {
  Card,
  Table,
  Button,
  DatePicker,
  Space,
  Typography,
  Tag,
  Tooltip,
  Modal,
  Descriptions,
  Statistic,
  Row,
  Col,
  Spin,
  Empty,
  Badge,
  Avatar,
  Divider,
  Alert,
  Progress,
  Input
} from 'antd';
import {
  CalendarOutlined,
  DollarOutlined,
  UserOutlined,
  EyeOutlined,
  DownloadOutlined,
  FilterOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  ExclamationCircleOutlined,
  AlertOutlined,
  SafetyOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import api from '../Api';
import LoadingOverlay from './Loading';
import './VendorPaymentCalendar.css';

const { Title, Text } = Typography;
const { MonthPicker } = DatePicker;

const VendorPaymentCalendar = () => {
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [vendorPayments, setVendorPayments] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [missedDayModalVisible, setMissedDayModalVisible] = useState(false);
  const [selectedMissedDay, setSelectedMissedDay] = useState(null);
  const [selectedMissedDayVendor, setSelectedMissedDayVendor] = useState(null);
  const [advancePaymentModalVisible, setAdvancePaymentModalVisible] = useState(false);
  const [selectedAdvanceDay, setSelectedAdvanceDay] = useState(null);
  const [selectedAdvanceVendor, setSelectedAdvanceVendor] = useState(null);

  useEffect(() => {
    const currentMonth = dayjs();
    setSelectedMonth(currentMonth);
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchVendorCalendar();
      fetchMonthlyStats();
    }
  }, [selectedMonth]);

  // Memoized filtered vendors for better performance
  const filteredVendors = useMemo(() => {
    if (!searchText) return vendors;
    
    return vendors.filter(record => {
      const vendor = record.vendor || record; // Handle both nested and flat structures
      const searchLower = searchText.toLowerCase();
      return (
        vendor.fullname?.toLowerCase().includes(searchLower) ||
        vendor.contact_number?.includes(searchText) ||
        vendor.email?.toLowerCase().includes(searchLower)
      );
    });
  }, [vendors, searchText]);

  const fetchVendorCalendar = async () => {
    try {
      setLoading(true);
      const monthStr = selectedMonth ? selectedMonth.format('YYYY-MM') : new Date().toISOString().slice(0, 7); // YYYY-MM format
      const res = await api.get(`/vendor-payment-calendar?month=${monthStr}`);
      
      setVendors(res.data.vendors || []);
      setSummary(res.data.summary);
    } catch (err) {
      console.error('Error fetching vendor calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      const monthStr = selectedMonth ? selectedMonth.format('YYYY-MM') : new Date().toISOString().slice(0, 7);
      const res = await api.get(`/vendor-payment-calendar/stats?month=${monthStr}`);
      setMonthlyStats(res.data.stats);
    } catch (err) {
      console.error('Error fetching monthly stats:', err);
    }
  };

  const fetchVendorPaymentsByDate = async (vendorId, date) => {
    try {
      const res = await api.get(`/vendor-payment-calendar/vendor/${vendorId}/date?date=${date}`);
      setVendorPayments(res.data.payments || []);
      setSelectedVendor(res.data.vendor);
      
      // Format date for display
      const formattedDate = date ? dayjs(date).format('MMMM DD, YYYY') : '';
      setSelectedDate(formattedDate);
      setPaymentModalVisible(true);
    } catch (err) {
      console.error('Error fetching vendor payments:', err);
    }
  };

  const handleMissedDayClick = (missedDayInfo, vendor) => {
    // Format date for display
    const formattedDate = missedDayInfo.date ? dayjs(missedDayInfo.date).format('MMMM DD, YYYY') : '';
    
    setSelectedMissedDay({
      ...missedDayInfo,
      date: formattedDate
    });
    setSelectedMissedDayVendor(vendor);
    setMissedDayModalVisible(true);
  };

  const handleAdvanceDayClick = (advanceCoverage, record, day) => {
    // Get all vendor rentals for this day
    const allRentals = record.rentals || [];
    const coveredRentalIds = advanceCoverage.coverages.map(c => c.rental_id);
    
    // Separate covered and uncovered rentals
    const coveredRentals = allRentals.filter(rental => coveredRentalIds.includes(rental.id));
    const uncoveredRentals = allRentals.filter(rental => !coveredRentalIds.includes(rental.id));
    
    // Format date for display
    const dateObj = selectedMonth?.date(day);
    const formattedDate = dateObj ? dateObj.format('MMMM DD, YYYY') : '';
    
    setSelectedAdvanceDay({
      ...advanceCoverage,
      day: day,
      date: formattedDate,
      coveredRentals,
      uncoveredRentals,
      allRentals
    });
    setSelectedAdvanceVendor(record.vendor);
    setAdvancePaymentModalVisible(true);
  };

  const getPaymentTypeColor = (type) => {
    const colors = {
      'daily': 'blue',
      'advance': 'green',
      'partial': 'orange',
      'fully paid': 'purple'
    };
    return colors[type] || 'default';
  };

  const getPaymentTypeIcon = (type) => {
    const icons = {
      'daily': <CalendarOutlined style={{ fontSize: 12 }} />,
      'advance': <ThunderboltOutlined style={{ fontSize: 12 }} />,
      'partial': <ClockCircleOutlined style={{ fontSize: 12 }} />,
      'fully paid': <CheckCircleOutlined style={{ fontSize: 12 }} />
    };
    return icons[type] || <DollarOutlined style={{ fontSize: 12 }} />;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getCurrencyLengthClass = (amount) => {
    const formatted = formatCurrency(amount);
    const length = formatted.length;
    
    if (length <= 8) return 'data-length="1-8"';
    if (length <= 12) return 'data-length="9-12"';
    if (length <= 16) return 'data-length="13-16"';
    if (length <= 20) return 'data-length="17-20"';
    if (length <= 24) return 'data-length="21-24"';
    return 'data-length="25+"';
  };

  const getFormattedDate = (dateString) => {
    return dayjs(dateString).format('MMMM DD, YYYY');
  };

  const getDayName = (day) => {
    const date = selectedMonth ? selectedMonth.date(day) : dayjs().date(day);
    return date.format('ddd'); // Mon, Tue, Wed, etc.
  };

  const generateCalendarColumns = () => {
    const daysInMonth = selectedMonth ? selectedMonth.daysInMonth() : 31;
    const columns = [
      {
        title: 'Vendor',
        dataIndex: ['vendor', 'fullname'],
        key: 'vendor',
        fixed: 'left',
        width: 200,
        render: (text, record) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar icon={<UserOutlined />} size="small" />
            <div>
              <Text strong style={{ fontSize: 12 }}>{text}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 10 }}>
                {record.rentals?.length || 0} stall(s)
              </Text>
            </div>
          </div>
        ),
      },
      {
        title: 'Monthly Total',
        key: 'monthly_total',
        width: 120,
        render: (_, record) => (
          <Text strong style={{ color: '#52c41a' }}>
            {formatCurrency(record.total_monthly_amount)}
          </Text>
        ),
      },
      {
        title: 'Payment Days',
        key: 'payment_days',
        width: 100,
        align: 'center',
        
        render: (_, record) => (
          <Badge 
            count={record.payment_days_count} 
            style={{ backgroundColor: '#1890ff' }}
          />
        ),
      },
     
      {
        title: 'Advance Covered',
        key: 'advance_covered',
        width: 100,
        align: 'center',

        render: (_, record) => (
          <Badge 
            count={record.advance_covered_days || 0} 
            style={{ backgroundColor: '#52c41a' }}
          />
        ),
      },
    ];

    // Add day columns
    for (let day = 1; day <= daysInMonth; day++) {
      columns.push({
        title: `${String(day).padStart(2, '0')}\n${getDayName(day)}`,
        key: `day_${day}`,
        width: 60,
        align: 'center',
        render: (_, record) => {
          const dayPayments = record.payments_by_day[day];
          const missedDayInfo = record.missed_days?.[day];
          const todayUnpaidDayInfo = record.today_unpaid_days?.[day];
          const advanceCoverage = record.advance_coverage?.[day];
          
          // Check if it's covered by advance payment
          if (advanceCoverage) {
            // Get all vendor rentals to determine uncovered stalls
            const allRentals = record.rentals || [];
            const coveredRentalIds = advanceCoverage.coverages.map(c => c.rental_id);
            const uncoveredRentals = allRentals.filter(rental => !coveredRentalIds.includes(rental.id));
            
            return (
              <Tooltip 
                title={
                  <div style={{ maxWidth: 300 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#52c41a' }}>
                      <SafetyOutlined /> Covered by Advance Payment
                    </div>
                    <div><strong>Date:</strong> {getFormattedDate(`${selectedMonth?.year()}-${String(selectedMonth?.month() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}</div>
                    <div><strong>Covered Amount:</strong> {formatCurrency(advanceCoverage.total_covered_amount)}</div>
                    <div><strong>Covered Stalls:</strong> {advanceCoverage.coverages.length}</div>
                    
                    {uncoveredRentals.length > 0 && (
                      <div style={{ marginTop: 8, padding: '8px', backgroundColor: '#fff2e8', borderRadius: '4px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#fa8c16' }}>
                          <AlertOutlined /> Uncovered Stalls ({uncoveredRentals.length}):
                        </div>
                        {uncoveredRentals.map((rental, idx) => (
                          <div key={idx} style={{ fontSize: 11, marginBottom: 2,  color: '#fa8c16' }}>
                            • Stall #{rental.stall_number} - {formatCurrency(rental.daily_rent || rental.monthly_rent)}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div style={{ marginTop: 8, fontSize: 11 }}>
                      <strong>Covered Stalls:</strong>
                      {advanceCoverage.coverages.map((coverage, idx) => (
                        <div key={idx} style={{ marginBottom: 2 }}>
                          • Stall #{coverage.stall_number} (Paid on {dayjs(coverage.payment_date).format('MMM DD, YYYY')})
                          <div style={{ fontSize: 10, color: '#52c41a', marginLeft: 16 }}>
                            Coverage until: {dayjs(coverage.coverage_end_date).format('MMM DD, YYYY')}
                          </div>
                          <div style={{ fontSize: 10, color: '#1890ff', marginLeft: 16 }}>
                            Next due: {dayjs(coverage.next_due_date).format('MMM DD, YYYY')}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 10, fontStyle: 'italic', color: '#666' }}>
                      Click for full details
                    </div>
                  </div>
                }
                mouseLeaveDelay={0}
                mouseEnterDelay={0}
              >
                <div
                  className="advance-covered-cell"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    background: uncoveredRentals.length > 0 
                      ? 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)'
                      : 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: 'white',
                    position: 'relative',
                    border: uncoveredRentals.length > 0 ? '2px solid #d46b08' : '2px solid #389e0d'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Force close any open tooltips
                    document.querySelectorAll('.ant-tooltip').forEach(tooltip => {
                      tooltip.style.display = 'none';
                    });
                    handleAdvanceDayClick(advanceCoverage, record, day);
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <SafetyOutlined style={{ fontSize: 16 }} />
                    {uncoveredRentals.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#ff4d4f',
                        color: 'white',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                      }}>
                        {uncoveredRentals.length}
                      </div>
                    )}
                  </div>
                </div>
              </Tooltip>
            );
          }
          
          // Check if it's today's unpaid day
          if (todayUnpaidDayInfo) {
            return (
              <Tooltip 
                title={
                  <div style={{ maxWidth: 300 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#8c8c8c' }}>
                      <ClockCircleOutlined /> Payment Due Today
                    </div>
                    <div><strong>Date:</strong> {getFormattedDate(todayUnpaidDayInfo.date)}</div>
                    <div><strong>Day:</strong> {todayUnpaidDayInfo.day_of_week}</div>
                    <div><strong>Expected Amount:</strong> {formatCurrency(todayUnpaidDayInfo.total_expected_amount)}</div>
                    <div><strong>Stalls:</strong> {todayUnpaidDayInfo.stalls_count}</div>
                    <div style={{ marginTop: 8, fontSize: 11 }}>
                      {todayUnpaidDayInfo.expected_payments.map((payment, idx) => (
                        <div key={idx} style={{ marginBottom: 2 }}>
                          • Stall #{payment.stall_number} - {formatCurrency(payment.daily_rent || payment.monthly_rent)}
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 10, fontStyle: 'italic', color: '#666' }}>
                      Payment due today - not yet missed
                    </div>
                  </div>
                }
                mouseLeaveDelay={0}
                mouseEnterDelay={0}
              >
                <div
                  className="today-unpaid-cell"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #d9d9d9 0%, #bfbfbf 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: '#595959',
                    position: 'relative',
                    border: '2px solid #8c8c8c'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Force close any open tooltips
                    document.querySelectorAll('.ant-tooltip').forEach(tooltip => {
                      tooltip.style.display = 'none';
                    });
                    handleMissedDayClick(todayUnpaidDayInfo, record.vendor);
                  }}
                >
                  <ClockCircleOutlined style={{ fontSize: 16 }} />
                </div>
              </Tooltip>
            );
          }
          
          // Check if it's a missed day
          if (missedDayInfo) {
            return (
              <Tooltip 
                title={
                  <div style={{ maxWidth: 300 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#ff4d4f' }}>
                      <ExclamationCircleOutlined /> Missed Payment
                    </div>
                    <div><strong>Date:</strong> {getFormattedDate(missedDayInfo.date)}</div>
                    <div><strong>Day:</strong> {missedDayInfo.day_of_week}</div>
                    <div><strong>Expected Amount:</strong> {formatCurrency(missedDayInfo.total_expected_amount)}</div>
                    <div><strong>Stalls:</strong> {missedDayInfo.stalls_count}</div>
                    <div style={{ marginTop: 8, fontSize: 11 }}>
                      {missedDayInfo.expected_payments.map((payment, idx) => (
                        <div key={idx} style={{ marginBottom: 2 }}>
                          • Stall #{payment.stall_number} - {formatCurrency(payment.daily_rent || payment.monthly_rent)}
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 10, fontStyle: 'italic', color: '#666' }}>
                      Click for details
                    </div>
                  </div>
                }
                mouseLeaveDelay={0}
                mouseEnterDelay={0}
              >
                <div
                  className="missed-payment-cell"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: 'white',
                    position: 'relative',
                  
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Force close any open tooltips
                    document.querySelectorAll('.ant-tooltip').forEach(tooltip => {
                      tooltip.style.display = 'none';
                    });
                    handleMissedDayClick(missedDayInfo, record.vendor);
                  }}
                >
                  <ExclamationCircleOutlined style={{ fontSize: 16 }} />
                </div>
              </Tooltip>
            );
          }
          
          // Regular payment day
          if (!dayPayments || dayPayments.length === 0) {
            return <div style={{ width: 40, height: 40 }} />;
          }

          return (
            <Tooltip 
              title={
                <div>
                  {dayPayments.map((payment, idx) => (
                    <div key={idx}>
                      {getPaymentTypeIcon(payment.payment_type)} {formatCurrency(payment.amount)}
                      <br />
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        Stall #{payment.stall_number}
                      </Text>
                    </div>
                  ))}
                </div>
              }
              mouseLeaveDelay={0}
              mouseEnterDelay={0.2}
            >
              <div
                className="payment-cell"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  background: dayPayments.length > 1 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : '#52c41a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: 'white',
                  position: 'relative'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Force close any open tooltips
                  document.querySelectorAll('.ant-tooltip').forEach(tooltip => {
                    tooltip.style.display = 'none';
                  });
                  fetchVendorPaymentsByDate(record.vendor.id, `${selectedMonth.year()}-${String(selectedMonth.month() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
                }}
              >
                {dayPayments.length > 1 ? (
                  <Badge count={dayPayments.length} size="small" />
                ) : (
                  <DollarOutlined style={{ fontSize: 14, color: 'white' }} />
                )}
              </div>
            </Tooltip>
          );
        },
      });
    }

    return columns;
  };

  return (
    <div className="vendor-payment-calendar">
      {loading && <LoadingOverlay message="Loading vendor payment calendar..." />}
      <Card className="main-card">
        <div style={{ marginBottom: 32 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="title-icon">
                  <CalendarOutlined style={{ fontSize: 28, color: '#1890ff' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#262626' }}>Vendor Payment Calendar</div>
                  <Text type="secondary" style={{ fontSize: 14, fontWeight: 400 }}>
                    Track and manage vendor payments with advanced analytics
                  </Text>
                </div>
              </Title>
            </Col>
            <Col>
              <Space size="large">
                <div className="date-picker-container">
                  <MonthPicker
                    placeholder="Select month"
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    format="MMMM YYYY"
                    style={{ borderRadius: 10, height: 40 }}
                    size="large"
                  />
                </div>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchVendorCalendar}
                  loading={loading}
                  style={{ borderRadius: 10, height: 40 }}
                  size="large"
                  type="primary"
                >
                  Refresh
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {summary && (
          <div className="stats-section">
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
              {/* First Column - Number Statistics */}
              <Col xs={24} lg={12}>
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={12} md={12}>
                    <Card className="stat-card vendors-card">
                      <div className="stat-content">
                        <div className="stat-icon-wrapper vendors-icon">
                          <UserOutlined />
                        </div>
                        <div className="stat-value-container">
                          <div className="stat-title">Total Vendors</div>
                          <div className="stat-value" style={{ color: '#1890ff' }}>
                            {summary.total_vendors}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={12}>
                    <Card className="stat-card payment-days-card">
                      <div className="stat-content">
                        <div className="stat-icon-wrapper payment-days-icon">
                          <CalendarOutlined />
                        </div>
                        <div className="stat-value-container">
                          <div className="stat-title">Payment Days</div>
                          <div className="stat-value" style={{ color: '#722ed1' }}>
                            {summary.total_payment_days}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={12}>
                    <Card className="stat-card missed-days-card">
                      <div className="stat-content">
                        <div className="stat-icon-wrapper missed-days-icon">
                          <ExclamationCircleOutlined />
                        </div>
                    
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={12}>
                    <Card className="stat-card advance-covered-card">
                      <div className="stat-content">
                        <div className="stat-icon-wrapper advance-covered-icon">
                          <SafetyOutlined />
                        </div>
                        <div className="stat-value-container">
                          <div className="stat-title">Advance Covered</div>
                          <div className="stat-value" style={{ color: '#52c41a' }}>
                            {summary.total_advance_covered_days || 0}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Col>
              
              {/* Second Column - Currency Statistics */}
              <Col xs={24} lg={12}>
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={12} md={12}>
                    <Card className="stat-card collected-card">
                      <div className="stat-content">
                        <div className="stat-icon-wrapper collected-icon">
                          <DollarOutlined />
                        </div>
                        <div className="stat-value-container">
                          <div className="stat-title">Total Collected</div>
                          <div className="stat-value currency-value" style={{ fontSize: 'clamp(12px, 2vw, 18px)' }}>
                            {formatCurrency(summary.total_amount_collected)}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={12}>
                    <Card className="stat-card average-card">
                      <div className="stat-content">
                        <div className="stat-icon-wrapper average-icon">
                          <DollarOutlined />
                        </div>
                        <div className="stat-value-container">
                          <div className="stat-title">Avg per Vendor</div>
                          <div className="stat-value currency-value" style={{ fontSize: 'clamp(12px, 2vw, 18px)' }}>
                            {formatCurrency(summary.total_vendors > 0 ? summary.total_amount_collected / summary.total_vendors : 0)}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>
          </div>
        )}

        {monthlyStats && (
          <Alert
            message="Monthly Statistics"
            description={
              <Row gutter={16}>
                <Col span={6}>
                  <Text>Total Payments: <Text strong>{monthlyStats.total_payments}</Text></Text>
                </Col>
                <Col span={6}>
                  <Text>Daily: <Text strong>{monthlyStats.payment_types.daily}</Text></Text>
                </Col>
                <Col span={6}>
                  <Text>Advance: <Text strong>{monthlyStats.payment_types.advance}</Text></Text>
                </Col>
                <Col span={6}>
                  <Text>Partial: <Text strong>{monthlyStats.payment_types.partial}</Text></Text>
                </Col>
              </Row>
            }
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {/* Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Input
            className="vendor-search-input"
            placeholder="Search vendor name, contact, or email..."
            prefix={<SearchOutlined style={{ color: '#667eea' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear={true}
            size="small"
            style={{ borderRadius: 4, height: 20, width: 120 }}
          />
        </div>

        {filteredVendors.length > 0 ? (
            <Table
              columns={generateCalendarColumns()}
              dataSource={filteredVendors}
              rowKey={(record) => record.vendor.id}
              scroll={{ x: 1500, y: 600 }}
              pagination={false}
              size="small"
              bordered
              className="payment-calendar-table"
            />
          ) : (
            <Empty
              description="No payment data available for the selected month"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
      </Card>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar icon={<UserOutlined />} />
            <div>
              <div>{selectedVendor?.fullname}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Payments for {selectedDate}
              </Text>
            </div>
          </div>
        }
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPaymentModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Descriptions size="small" column={2}>
            <Descriptions.Item label="Contact">{selectedVendor?.contact_number}</Descriptions.Item>
            <Descriptions.Item label="Email">{selectedVendor?.email}</Descriptions.Item>
          </Descriptions>
        </div>

        <Divider>Payment Details</Divider>

        {vendorPayments.length > 0 ? (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Total Amount"
                    value={vendorPayments.reduce((sum, p) => sum + p.amount, 0)}
                    prefix={<DollarOutlined />}
                    formatter={(value) => formatCurrency(value)}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Number of Payments"
                    value={vendorPayments.length}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
            </Row>

            <Table
              dataSource={vendorPayments}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                {
                  title: 'Payment Type',
                  dataIndex: 'payment_type',
                  key: 'payment_type',
                  render: (type) => (
                    <Tag color={getPaymentTypeColor(type)}>
                      {getPaymentTypeIcon(type)} {type}
                    </Tag>
                  ),
                },
                {
                  title: 'Amount',
                  dataIndex: 'amount',
                  key: 'amount',
                  render: (amount) => (
                    <Text strong style={{ color: '#52c41a' }}>
                      {formatCurrency(amount)}
                    </Text>
                  ),
                },
                {
                  title: 'Stall',
                  dataIndex: 'stall_number',
                  key: 'stall_number',
                  render: (stall) => <Text>#{stall}</Text>,
                },
                {
                  title: 'Daily Rent',
                  dataIndex: 'daily_rent',
                  key: 'daily_rent',
                  render: (rent) => formatCurrency(rent),
                },
              
                {
                  title: 'Advance Days',
                  dataIndex: 'advance_days',
                  key: 'advance_days',
                  render: (days) => days > 0 ? <Tag color="green">{days}</Tag> : '-',
                },
              ]}
            />
          </div>
        ) : (
          <Empty description="No payments found for this date" />
        )}
      </Modal>

      {/* Advance Payment Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar icon={<SafetyOutlined />} style={{ backgroundColor: '#52c41a' }} />
            <div>
              <div>Advance Payment Details</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {selectedAdvanceVendor?.fullname} - {selectedAdvanceDay?.date ? dayjs(selectedAdvanceDay.date).format('MMM DD, YYYY') : ''}
              </Text>
            </div>
          </div>
        }
        open={advancePaymentModalVisible}
        onCancel={() => setAdvancePaymentModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setAdvancePaymentModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={900}
      >
        {selectedAdvanceDay && (
          <div>
            <Alert
              message="Advance Payment Coverage"
              description={`This day is covered by advance payments for ${selectedAdvanceDay.coverages.length} stall(s)`}
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {selectedAdvanceDay.uncoveredRentals?.length > 0 && (
              <Alert
                message="Uncovered Stalls"
                description={`${selectedAdvanceDay.uncoveredRentals.length} stall(s) not covered by advance payment`}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="Covered Amount"
                    value={selectedAdvanceDay.total_covered_amount}
                    prefix={<DollarOutlined />}
                    formatter={(value) => formatCurrency(value)}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="Covered Stalls"
                    value={selectedAdvanceDay.coverages.length}
                    prefix={<SafetyOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="Uncovered Stalls"
                    value={selectedAdvanceDay.uncoveredRentals?.length || 0}
                    prefix={<AlertOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
            </Row>

            <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Vendor">{selectedAdvanceVendor?.fullname}</Descriptions.Item>
              <Descriptions.Item label="Contact">{selectedAdvanceVendor?.contact_number}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedAdvanceVendor?.email}</Descriptions.Item>
              <Descriptions.Item label="Date">{selectedAdvanceDay?.date ? dayjs(selectedAdvanceDay.date).format('MMM DD, YYYY') : ''}</Descriptions.Item>
            </Descriptions>

            <Row gutter={16}>
              <Col span={12}>
                <Divider>Covered Stalls</Divider>
                <Table
                  dataSource={selectedAdvanceDay.coverages}
                  rowKey="rental_id"
                  size="small"
                  pagination={false}
                  columns={[
                    {
                      title: 'Stall Number',
                      dataIndex: 'stall_number',
                      key: 'stall_number',
                      render: (stall) => <Text strong>#{stall}</Text>,
                    },
                    {
                      title: 'Payment Date',
                      dataIndex: 'payment_date',
                      key: 'payment_date',
                      render: (date) => dayjs(date).format('MMM DD, YYYY'),
                    },
                    {
                      title: 'Coverage Days',
                      dataIndex: 'advance_days',
                      key: 'advance_days',
                      render: (days) => <Tag color="green">{days} days</Tag>,
                    },
                    {
                      title: 'Coverage Period',
                      key: 'coverage_period',
                      render: (_, record) => (
                        <div>
                          <Text>Days {record.coverage_from} to {record.coverage_to}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 10 }}>
                            Until: {dayjs(record.coverage_end_date).format('MMM DD, YYYY')}
                          </Text>
                        </div>
                      ),
                    },
                    {
                      title: 'Next Due Date',
                      dataIndex: 'next_due_date',
                      key: 'next_due_date',
                      render: (date) => (
                        <Text style={{ color: '#1890ff' }}>
                          {dayjs(date).format('MMM DD, YYYY')}
                        </Text>
                      ),
                    },
                  ]}
                />
              </Col>
              <Col span={12}>
                <Divider>Uncovered Stalls</Divider>
                <Table
                  dataSource={selectedAdvanceDay.uncoveredRentals || []}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    {
                      title: 'Stall Number',
                      dataIndex: 'stall_number',
                      key: 'stall_number',
                      render: (stall) => <Text strong>#{stall}</Text>,
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status) => (
                        <Tag color={status === 'daily' ? 'blue' : 'orange'}>
                          {status}
                        </Tag>
                      ),
                    },
                    {
                      title: 'Daily Rent',
                      dataIndex: 'daily_rent',
                      key: 'daily_rent',
                      render: (rent) => rent > 0 ? formatCurrency(rent) : '-',
                    },
                    {
                      title: 'Monthly Rent',
                      dataIndex: 'monthly_rent',
                      key: 'monthly_rent',
                      render: (rent) => rent > 0 ? formatCurrency(rent) : '-',
                    },
                    {
                      title: 'Expected Amount',
                      key: 'expected_amount',
                      render: (_, record) => formatCurrency(record.daily_rent || record.monthly_rent),
                    },
                  ]}
                />
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Missed Day Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar icon={<ExclamationCircleOutlined />} style={{ backgroundColor: '#ff4d4f' }} />
            <div>
              <div>Missed Payment Details</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {selectedMissedDayVendor?.fullname} - {selectedMissedDay?.date ? dayjs(selectedMissedDay.date).format('MMM DD, YYYY') : ''}
              </Text>
            </div>
          </div>
        }
        open={missedDayModalVisible}
        onCancel={() => setMissedDayModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setMissedDayModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {selectedMissedDay && (
          <div>
            <Alert
              message="Payment Missed"
              description={`Expected payment was not received on ${selectedMissedDay.day_of_week}, ${selectedMissedDay?.date ? dayjs(selectedMissedDay.date).format('MMM DD, YYYY') : ''}`}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Expected Amount"
                    value={selectedMissedDay.total_expected_amount}
                    prefix={<DollarOutlined />}
                    formatter={(value) => formatCurrency(value)}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Affected Stalls"
                    value={selectedMissedDay.stalls_count}
                    prefix={<AlertOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
            </Row>

            <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Vendor">{selectedMissedDayVendor?.fullname}</Descriptions.Item>
              <Descriptions.Item label="Contact">{selectedMissedDayVendor?.contact_number}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedMissedDayVendor?.email}</Descriptions.Item>
              <Descriptions.Item label="Day of Week">{selectedMissedDay.day_of_week}</Descriptions.Item>
            </Descriptions>

            <Divider>Expected Payment Breakdown</Divider>

            <Table
              dataSource={selectedMissedDay.expected_payments}
              rowKey="rental_id"
              size="small"
              pagination={false}
              columns={[
                {
                  title: 'Stall Number',
                  dataIndex: 'stall_number',
                  key: 'stall_number',
                  render: (stall) => <Text strong>#{stall}</Text>,
                },
                {
                  title: 'Payment Type',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => (
                    <Tag color={status === 'daily' ? 'blue' : 'green'}>
                      {status === 'daily' ? 'Daily' : 'Monthly'}
                    </Tag>
                  ),
                },
                {
                  title: 'Daily Rent',
                  dataIndex: 'daily_rent',
                  key: 'daily_rent',
                  render: (rent) => rent > 0 ? formatCurrency(rent) : '-',
                },
                {
                  title: 'Monthly Rent',
                  dataIndex: 'monthly_rent',
                  key: 'monthly_rent',
                  render: (rent) => rent > 0 ? formatCurrency(rent) : '-',
                },
                {
                  title: 'Expected Amount',
                  key: 'expected_amount',
                  render: (_, record) => formatCurrency(record.daily_rent || record.monthly_rent),
                },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VendorPaymentCalendar;
