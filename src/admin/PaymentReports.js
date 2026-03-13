import React, { useState, useEffect, useRef } from "react";
import {
  DatePicker,
  Select
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  EyeOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  RiseOutlined,
  FallOutlined,
  HomeOutlined
} from "@ant-design/icons";
import api from "../Api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import "./PaymentReports.css";
import LoadingOverlay from "./Loading";

const { RangePicker } = DatePicker;

const PaymentReports = () => {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [dateRange, setDateRange] = useState([]);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  // Statistics
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    totalRemainingBalance: 0,
    paymentTypes: {},
    statusDistribution: {}
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [payments, dateRange, paymentTypeFilter, searchText]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const paymentsRes = await api.get("/payments/all");
      setPayments(paymentsRes.data || []);
      calculateStats(paymentsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentsData) => {
    const totalPayments = paymentsData.length;
    const totalAmount = paymentsData.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    
    setStats({
      totalPayments,
      totalAmount,
      totalRemainingBalance: 0,
      paymentTypes: {},
      statusDistribution: {}
    });
  };

  const applyFilters = () => {
    let filtered = [...payments];
    
    // Date range filter
    if (dateRange && dateRange.length === 2) {
      const [start, end] = dateRange;
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        return paymentDate >= start && paymentDate <= end;
      });
    }
    
    // Payment type filter
    if (paymentTypeFilter !== "all") {
      filtered = filtered.filter(payment => payment.payment_type === paymentTypeFilter);
    }
    
    // Search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(payment =>
        (payment.vendor?.fullname || "").toLowerCase().includes(searchLower) ||
        (payment.stall_numbers && payment.stall_numbers.toString()).toLowerCase().includes(searchLower) ||
        (payment.payment_type || "").toLowerCase().includes(searchLower)
      );
    }

    setFilteredPayments(filtered);
  };

  const handleViewPayment = async (payment) => {
    try {
      setLoading(true);
      const response = await api.get(`/payments/details/${payment.payment_ids.join(',')}`);
      setSelectedPayment(response.data);
      setPaymentModalVisible(true);
    } catch (error) {
      console.error('Error fetching payment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const addGovernmentHeader = (doc, pageWidth, margin = 20) => {
    let yPosition = 10;
    
    // Government Header with Logos matching the design
    try {
      // Add Municipality logo on the left
      doc.addImage('/logo_Opol.png', 'PNG', margin, yPosition, 30, 30);
      
      // Add MEE logo on the right
      doc.addImage('/logo_meeo.png', 'PNG', pageWidth - margin - 30, yPosition, 30, 30);
    } catch (error) {
      console.log('Logos not found:', error);
    }
    
    yPosition += 15;
    
    // Centered Government Header
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
    doc.setLineWidth(0);
    
    yPosition += 12;
    
    return yPosition;
  };

  const formatDateForPDF = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatCurrencyForPDF = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const exportToPDF = async () => {
    const data = filteredPayments;
    const filename = "Payment_Report.pdf";
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      
      // Add government header
      let yPosition = addGovernmentHeader(doc, pageWidth, margin);
      
      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Payment Records Report', pageWidth / 2, yPosition, { align: 'center' });
      
      // Date generated
      yPosition += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generated: ${formatDateForPDF(new Date())}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      
      // Prepare table data
      const tableData = data.map((payment, index) => [
        index + 1,
        formatDateForPDF(payment.payment_date),
        payment.vendor?.fullname || "N/A",
        (() => {
          if (Array.isArray(payment.stall_numbers)) {
            return payment.stall_numbers.join(", ");
          } else if (payment.stall_numbers && typeof payment.stall_numbers === 'object') {
            const values = Object.values(payment.stall_numbers);
            return values.length > 0 ? values.join(", ") : "N/A";
          } else {
            return payment.stall_numbers || "N/A";
          }
        })(),
        payment.payment_type?.toUpperCase() || "N/A",
        formatCurrencyForPDF(parseFloat(payment.amount || 0)),
        payment.status || "N/A"
      ]);
      
      // Create table
      autoTable(doc, {
        head: [[
          'No.',
          'Date',
          'Vendor Name',
          'Stall #',
          'Payment Type',
          'Amount',
          'Status'
        ]],
        body: tableData,
        startY: yPosition,
        theme: 'grid',
        styles: { 
          fontSize: 9, 
          cellPadding: 3,
          lineColor: [0, 0, 0],
          textColor: [0, 0, 0]
        },
        headStyles: { 
          fillColor: [255, 255, 255],
          fontStyle: 'bold',
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.5
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });
      
      // Save PDF
      doc.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="pr-payment-reports">
      {/* Header */}
      <header className="pr-header">
        <div className="pr-header-content">
          <div className="pr-header-title-section">
            <div className="pr-header-icon">
              <FileTextOutlined />
            </div>
            <div className="pr-header-text">
              <h2>Payment Reports & Analytics</h2>
              <p>Comprehensive payment analysis and rental status tracking</p>
            </div>
          </div>
          <div className="pr-header-actions">
            <button
              className="pr-button pr-button-secondary"
              onClick={fetchData}
            >
              <ReloadOutlined /> Refresh
            </button>
            <button
              className="pr-button pr-button-primary"
              onClick={exportToPDF}
            >
              <DownloadOutlined /> Export Report
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <section className="pr-filters">
        <div className="pr-filter-row">
          <div className="pr-filter-group">
            <label className="pr-filter-label">Search:</label>
            <input
              type="text"
              className="pr-filter-input"
              placeholder="Search vendor, stall, or type..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="pr-filter-group">
            <label className="pr-filter-label">Date Range:</label>
            <RangePicker
              className="pr-filter-range"
              value={dateRange}
              onChange={setDateRange}
              format="YYYY-MM-DD"
              placeholder={['Start Date', 'End Date']}
            />
          </div>
          <div className="pr-filter-group">
            <label className="pr-filter-label">Payment Type:</label>
            <Select
              className="pr-filter-select"
              value={paymentTypeFilter}
              onChange={setPaymentTypeFilter}
              placeholder="Payment Type"
            >
              <Select.Option value="all">All Types</Select.Option>
              <Select.Option value="daily">Daily</Select.Option>
              <Select.Option value="advance">Advance</Select.Option>
              <Select.Option value="partial">Partial</Select.Option>
              <Select.Option value="fully paid">Fully Paid</Select.Option>
              <Select.Option value="missed">Missed</Select.Option>
            </Select>
          </div>
        </div>
      </section>

      {/* Statistics Cards */}
      <section className="pr-stats-section">
        <div className="pr-stats-grid">
          <div className="pr-stat-card total-payments">
            <div className="pr-stat-content">
              <div className="pr-stat-icon">
                <DollarOutlined />
              </div>
              <div className="pr-stat-details">
                <div className="pr-stat-label">Total Payments</div>
                <div className="pr-stat-value">
                  {stats.totalPayments.toLocaleString()}
                </div>
                <div className="pr-stat-description">
                  <RiseOutlined /> Payment records
                </div>
              </div>
            </div>
          </div>
          <div className="pr-stat-card total-amount">
            <div className="pr-stat-content">
              <div className="pr-stat-icon">
                <DollarOutlined />
              </div>
              <div className="pr-stat-details">
                <div className="pr-stat-label">Total Amount Collected</div>
                <div className="pr-stat-value currency">
                  {formatCurrencyForPDF(stats.totalAmount)}
                </div>
                <div className="pr-stat-description">
                  <RiseOutlined /> Revenue collected
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collection Rate Alert */}
      <div className="pr-alert success">
        <div className="pr-alert-content">
          <div className="pr-alert-icon">
            <CheckCircleOutlined />
          </div>
          <div className="pr-alert-text">
            <strong>Collection Performance:</strong> Total collection of 
            <strong> {formatCurrencyForPDF(stats.totalAmount)}</strong> from 
            <strong> {stats.totalPayments}</strong> payments.
            All payments processed successfully!
          </div>
        </div>
      </div>

      {/* Payment Records Table */}
      <main className="pr-table-container">
        <table className="pr-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Date</th>
              <th>Vendor</th>
              <th>Stall Info</th>
              <th>Payment Type</th>
              <th>Amount</th>
              <th>Missed Days</th>
              <th>Advance Days</th>
              <th>Status</th>
              <th>Collector Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment, index) => (
              <tr key={payment.id}>
                <td>{index + 1}</td>
                <td>{formatDateForPDF(payment.payment_date)}</td>
                <td>
                  <div className="pr-vendor-cell">
                    <div className="pr-vendor-name">{payment.vendor?.fullname || "N/A"}</div>
                    {payment.vendor?.contact_number && (
                      <div className="pr-vendor-contact">{payment.vendor.contact_number}</div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="pr-stall-cell">
                    <div className="pr-stall-number">
                      {(() => {
                        if (Array.isArray(payment.stall_numbers)) {
                          return payment.stall_numbers.join(", ");
                        } else if (payment.stall_numbers && typeof payment.stall_numbers === 'object') {
                          const values = Object.values(payment.stall_numbers);
                          return values.length > 0 ? values.join(", ") : "N/A";
                        } else {
                          return payment.stall_numbers || "N/A";
                        }
                      })()}
                    </div>
                    {payment.stall_count > 1 && (
                      <div className="pr-stall-count">
                        <span className="pr-status-badge">{payment.stall_count} stalls</span>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`pr-status-badge ${payment.payment_type}`}>
                    {payment.payment_type?.toUpperCase() || "N/A"}
                  </span>
                </td>
                <td>
                  <span className="pr-amount">
                    {formatCurrencyForPDF(parseFloat(payment.amount || 0))}
                  </span>
                </td>
                <td>{payment.missed_days ? <span className="pr-status-badge">{payment.missed_days}</span> : "-"}</td>
                <td>{payment.advance_days ? <span className="pr-status-badge">{payment.advance_days}</span> : "-"}</td>
                <td>
                  <span className={`pr-status-badge ${payment.status === 'collected' ? 'occupied' : 'vacant'}`}>
                    {payment.status || 'N/A'}
                  </span>
                </td>
                <td>{payment.collector || "Admin"}</td>
                <td>
                  <button 
                    className="pr-action-button"
                    onClick={() => handleViewPayment(payment)}
                  >
                    <EyeOutlined /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      {/* Payment Detail Modal */}
      {paymentModalVisible && (
        <div className="pr-modal-overlay" onClick={() => setPaymentModalVisible(false)}>
          <div className="pr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pr-modal-header">
              <div className="pr-modal-title">
                <DollarOutlined />
                Payment Details
              </div>
              <button 
                className="pr-modal-close"
                onClick={() => setPaymentModalVisible(false)}
              >
                ✕
              </button>
            </div>
            <div className="pr-modal-body">
              {selectedPayment && (
                <div>
                  {/* Summary Section */}
                  <div className="pr-modal-section">
                    <div className="pr-alert">
                      <div className="pr-alert-content">
                        <div className="pr-alert-icon">
                          <DollarOutlined />
                        </div>
                        <div className="pr-alert-text">
                          <strong>Payment Summary:</strong> Total Amount: 
                          <span style={{ color: '#059669', fontSize: 16, fontWeight: 'bold', margin: '0 8px' }}>
                            ₱{parseFloat(selectedPayment.total_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          | Payment Count: <strong>{selectedPayment.payment_count || 0}</strong>
                          | Total Missed Days: <strong>{selectedPayment.total_missed_days || 0}</strong>
                          | Total Advance Days: <strong>{selectedPayment.total_advance_days || 0}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Individual Payment Details */}
                  <div className="pr-modal-section">
                    <h3 className="pr-modal-section-title">Individual Payment Records</h3>
                    {selectedPayment.payments?.map((payment) => (
                      <div key={payment.id} className="pr-payment-item">
                        <div className="pr-payment-details">
                          <div className="pr-detail-item">
                            <div className="pr-detail-label">Payment ID</div>
                            <div className="pr-detail-value">{payment.id}</div>
                          </div>
                          <div className="pr-detail-item">
                            <div className="pr-detail-label">Payment Date</div>
                            <div className="pr-detail-value">
                              {new Date(payment.payment_date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </div>
                          </div>
                          <div className="pr-detail-item">
                            <div className="pr-detail-label">Stall</div>
                            <div className="pr-detail-value">
                              <span className="pr-status-badge">{payment.rented?.stall?.stall_number || "N/A"}</span>
                            </div>
                          </div>
                          <div className="pr-detail-item">
                            <div className="pr-detail-label">Payment Type</div>
                            <div className="pr-detail-value">
                              <span className={`pr-status-badge ${payment.payment_type}`}>
                                {payment.payment_type?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="pr-detail-item">
                            <div className="pr-detail-label">Amount</div>
                            <div className="pr-detail-value pr-amount">
                              ₱{parseFloat(payment.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div className="pr-detail-item">
                            <div className="pr-detail-label">Missed Days</div>
                            <div className="pr-detail-value">
                              <span className={`pr-status-badge ${payment.missed_days > 0 ? 'missed' : 'daily'}`}>
                                {payment.missed_days || 0}
                              </span>
                            </div>
                          </div>
                          <div className="pr-detail-item">
                            <div className="pr-detail-label">Advance Days</div>
                            <div className="pr-detail-value">
                              <span className={`pr-status-badge ${payment.advance_days > 0 ? 'advance' : 'vacant'}`}>
                                {payment.advance_days || 0}
                              </span>
                            </div>
                          </div>
                          <div className="pr-detail-item">
                            <div className="pr-detail-label">Status</div>
                            <div className="pr-detail-value">
                              <span className={`pr-status-badge ${payment.status === 'collected' ? 'occupied' : 'vacant'}`}>
                                {payment.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Vendor Information */}
                  <div className="pr-modal-section">
                    <h3 className="pr-modal-section-title">Vendor Information</h3>
                    <div className="pr-payment-item">
                      <div className="pr-payment-details">
                        <div className="pr-detail-item">
                          <div className="pr-detail-label">Vendor Name</div>
                          <div className="pr-detail-value">
                            <strong>{selectedPayment.vendor?.first_name + " " + selectedPayment.vendor?.middle_name + " " + selectedPayment.vendor?.last_name || "N/A"}</strong>
                          </div>
                        </div>
                        <div className="pr-detail-item">
                          <div className="pr-detail-label">Contact Number</div>
                          <div className="pr-detail-value">{selectedPayment.vendor?.contact_number || "N/A"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading && <LoadingOverlay message="Loading payment reports..." />}
    </div>
  );
};

export default PaymentReports;
