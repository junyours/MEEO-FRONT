import React, { useState, useEffect } from 'react';
import api from '../Api';
import LoadingOverlay from './Loading';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Space, Button, Table, Card, Typography, Select, Row, Col, Statistic, Modal, Form, Input, InputNumber, message, Tag, Spin, Empty, Popconfirm, Tabs, Checkbox } from 'antd';
import { PlusOutlined, SyncOutlined, HistoryOutlined, ShopOutlined, DollarOutlined, LineChartOutlined, TrophyOutlined, CloseOutlined, SearchOutlined, EditOutlined, DeleteOutlined, UserOutlined, FilePdfOutlined, ArrowUpOutlined, ArrowDownOutlined, CalendarOutlined, HomeOutlined, StarOutlined } from '@ant-design/icons';
import './EventSalesReporting.css';

// Make sure autoTable is available on jsPDF instance
window.jsPDF = window.jsPDF || {};
window.jsPDF.autoTable = window.jsPDF.autoTable || {};

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const EventSalesReporting = () => {
    const [form] = Form.useForm();
    const [activities, setActivities] = useState([]);
    const [selectedActivity, setSelectedActivity] = useState('');
    const [salesData, setSalesData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [sortOrder, setSortOrder] = useState('desc');
    const [formData, setFormData] = useState({
        activity_id: '',
        vendor_id: '',
        stall_id: '',
        report_day: '',
        products: []
    });
    const [editFormData, setEditFormData] = useState({
        id: '',
        activity_id: '',
        stall_id: '',
        vendor_id: '',
        report_day: '',
        total_sales: 0,
        products: []
    });
    const [availableVendors, setAvailableVendors] = useState([]);
    const [availableStalls, setAvailableStalls] = useState([]);
    const [existingReportDates, setExistingReportDates] = useState([]);
    const [editingReport, setEditingReport] = useState(null);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteModalData, setDeleteModalData] = useState({ vendor: null, reports: [], selectedReports: [] });
    const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
    const [vendorSearchText, setVendorSearchText] = useState('');
    const [selectedDay, setSelectedDay] = useState('');
    const [daySalesDetails, setDaySalesDetails] = useState(null);

    // Helper function to format amount with commas and 2 decimal places
    const formatAmount = (amount) => {
        if (amount === 0 || amount === '0' || amount === null || amount === undefined) {
            return '-';
        }
        const num = parseFloat(amount);
        if (isNaN(num)) return '-';
        return `P${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Function to filter sales data by vendor name
    const filterSalesDataByVendor = (data, searchText) => {
        if (!searchText || searchText.trim() === '') {
            return data;
        }
        
        const searchLower = searchText.toLowerCase().trim();
        return data.filter(stall => 
            stall.vendor_name && stall.vendor_name.toLowerCase().includes(searchLower)
        );
    };

    // Function to analyze sales for a specific day
    const analyzeDaySales = (data, dayNumber) => {
        if (!data || !dayNumber) {
            return null;
        }

        const dayKey = `day${dayNumber}_income`;
        let lowest = { amount: null, vendor_name: '', stall_number: '' };
        let highest = { amount: null, vendor_name: '', stall_number: '' };

        data.forEach(stall => {
            const dayIncome = parseFloat(stall[dayKey]) || 0;
            
            // Skip zero values for lowest unless all are zero
            if (dayIncome > 0) {
                if (lowest.amount === null || dayIncome < lowest.amount) {
                    lowest = {
                        amount: dayIncome,
                        vendor_name: stall.vendor_name || 'N/A',
                        stall_number: stall.stall_number || 'N/A'
                    };
                }
                
                if (highest.amount === null || dayIncome > highest.amount) {
                    highest = {
                        amount: dayIncome,
                        vendor_name: stall.vendor_name || 'N/A',
                        stall_number: stall.stall_number || 'N/A'
                    };
                }
            }
        });

        // Handle case where all sales are zero
        if (lowest.amount === null && data.length > 0) {
            const firstStall = data[0];
            lowest = {
                amount: 0,
                vendor_name: firstStall.vendor_name || 'N/A',
                stall_number: firstStall.stall_number || 'N/A'
            };
        }

        if (highest.amount === null && data.length > 0) {
            highest = {
                amount: 0,
                vendor_name: data[0].vendor_name || 'N/A',
                stall_number: data[0].stall_number || 'N/A'
            };
        }

        return { lowest, highest };
    };

    // Function to get day options for the selector
    const getDaySelectorOptions = () => {
        if (!selectedActivity) return [];
        
        const activity = activities.find(a => a.id === selectedActivity);
        if (!activity) return [];
        
        const startDate = new Date(activity.start_date);
        const endDate = new Date(activity.end_date);
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        const options = [];
        for (let day = 1; day <= totalDays; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + (day - 1));
            
            options.push({
                value: day.toString(),
                label: `Day ${day} - ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            });
        }
        
        return options;
    };

    // Handle day selection change
    const handleDayChange = (day) => {
        setSelectedDay(day);
        if (day && salesData.length > 0) {
            const details = analyzeDaySales(salesData, day);
            setDaySalesDetails(details);
        } else {
            setDaySalesDetails(null);
        }
    };

    // Helper function to format date period
    const formatDatePeriod = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const options = { month: 'long', day: 'numeric', year: 'numeric' };
        const startFormatted = start.toLocaleDateString('en-US', options);
        const endFormatted = end.toLocaleDateString('en-US', options);
        return `${startFormatted} to ${endFormatted}`;
    };

    // Helper function to split table data into chunks of 5 days
    const splitTableData = (headers, data, maxDaysPerTable = 5) => {
        const dayColumns = headers.filter(h => h.startsWith('Day '));
        const totalDays = dayColumns.length;
        const tables = [];
        
        for (let chunk = 0; chunk < Math.ceil(totalDays / maxDaysPerTable); chunk++) {
            const startDay = chunk * maxDaysPerTable;
            const endDay = Math.min(startDay + maxDaysPerTable, totalDays);
            
            // Create headers for this chunk
            const chunkHeaders = [
                headers[0], // Stall #/Ambulant #
                headers[1], // Vendor Name
                headers[2], // Products/Services
                ...dayColumns.slice(startDay, endDay), // Day columns for this chunk
                'Overall Total' // Total column for this chunk
            ];
            
            // Create data for this chunk
            const chunkData = data.map(row => {
                const chunkRow = [
                    row[0], // Stall #/Ambulant #
                    row[1], // Vendor Name
                    row[2], // Products/Services
                    ...row.slice(3 + startDay, 3 + endDay), // Day data for this chunk
                    0 // Placeholder for total
                ];
                
                // Calculate total for this chunk (sum of day columns in this chunk)
                let chunkTotal = 0;
                for (let i = 3; i < chunkRow.length - 1; i++) {
                    chunkTotal += parseFloat(chunkRow[i]) || 0;
                }
                chunkRow[chunkRow.length - 1] = chunkTotal;
                
                return chunkRow;
            });
            
            tables.push({ headers: chunkHeaders, data: chunkData });
        }
        
        return tables;
    };

    // Helper function to check if content fits on current page
    const checkPageBreak = (doc, yPosition, requiredHeight, isFirstSection = false) => {
        const pageHeight = doc.internal.pageSize.height;
        const currentPage = doc.internal.getNumberOfPages();
        const isOnFirstPage = currentPage === 1;
        
        // For first page, be more lenient - allow content closer to bottom
        const bottomMargin = isOnFirstPage && isFirstSection ? 10 : 20;
        const threshold = pageHeight - bottomMargin;
        
        return yPosition + requiredHeight > threshold;
    };

    // Helper function to add page with header
    const addPageWithHeader = (doc, activity, sectionTitle = null, isContinuation = false) => {
        doc.addPage();
        let yPosition = 15;
        
        // Repeat main title
        doc.setFontSize(16);
        doc.text('Event Sales Report', 105, yPosition, { align: 'center' });
        yPosition += 8;
        
        // Repeat activity info
        doc.setFontSize(9);
        doc.text(`${activity.name} - Continued`, 105, yPosition, { align: 'center' });
        yPosition += 10;
        
        // Add section title if provided
        if (sectionTitle) {
            doc.setFontSize(14);
            const title = isContinuation ? `${sectionTitle} (Continued)` : sectionTitle;
            doc.text(title, 15, yPosition);
            yPosition += 10;
        }
        
        return yPosition;
    };

    // Helper function to calculate actual table height
    const calculateTableHeight = (data) => {
        const baseCellHeight = 6;
        let totalHeight = baseCellHeight; // Header height
        
        data.forEach(row => {
            let rowHeight = baseCellHeight;
            const productsText = row[2];
            if (productsText && typeof productsText === 'string' && productsText.includes(',')) {
                const products = productsText.split(',').map(p => p.trim()).filter(p => p);
                const numProducts = products.length;
                rowHeight = Math.max(baseCellHeight, 3 + (numProducts - 1) * 2.5);
            }
            totalHeight += rowHeight;
        });
        
        return totalHeight;
    };

    // Helper function for drawing tables with borders - completely redesigned
    const drawTable = (doc, startY, headers, data) => {
        let currentY = startY;
        const baseCellHeight = 6; // Base height for single-line cells
        const cellPadding = 2;
        const pageHeight = doc.internal.pageSize.height;
        const pageBottomLimit = 270; // Safe bottom limit for drawing
        
        // Calculate dynamic column widths with better distribution
        const totalColumns = headers.length;
        const pageWidth = doc.internal.pageSize.width - 30;
        
        // Optimized column width allocation with fixed Total column
        const columnWidths = headers.map((header, index) => {
            if (index === 0) return 15; // Stall #/Ambulant # - compact
            if (index === 1) return 25; // Vendor Name - moderate width
            if (index === 2) return 30; // Products/Services - reduced width
            if (header === 'Overall Total') return 25; // Fixed width for Total column
            // Day columns get remaining space
            return Math.max(10, Math.floor((pageWidth - 105) / (totalColumns - 4)));
        });
        
        // Draw headers
        let xPos = 15;
        headers.forEach((header, index) => {
            const width = columnWidths[index];
            doc.setFillColor(240, 240, 240);
            doc.rect(xPos, currentY, width, baseCellHeight, 'F');
            doc.rect(xPos, currentY, width, baseCellHeight, 'S');
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            
            // Center header text
            const headerWidth = doc.getTextWidth(header);
            const headerX = xPos + (width - headerWidth) / 2;
            doc.text(header, headerX, currentY + baseCellHeight - 2);
            xPos += width;
        });
        currentY += baseCellHeight;
        
        // Draw data rows
        data.forEach((row, rowIndex) => {
            xPos = 15;
            
            // Calculate row height based on products content only
            let rowHeight = baseCellHeight;
            const productsText = row[2];
            if (productsText && typeof productsText === 'string' && productsText.includes(',')) {
                const products = productsText.split(',').map(p => p.trim()).filter(p => p);
                const numProducts = products.length;
                // Compact spacing: 2.5 units per product line
                rowHeight = Math.max(baseCellHeight, 3 + (numProducts - 1) * 2.5);
            }
            
            // Check if row will fit on current page, if not add new page
            if (currentY + rowHeight > pageBottomLimit) {
                doc.addPage();
                currentY = 20;
                
                // Repeat headers on new page
                let xPos = 15;
                headers.forEach((header, index) => {
                    const width = columnWidths[index];
                    doc.setFillColor(240, 240, 240);
                    doc.rect(xPos, currentY, width, baseCellHeight, 'F');
                    doc.rect(xPos, currentY, width, baseCellHeight, 'S');
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'bold');
                    
                    // Center header text
                    const headerWidth = doc.getTextWidth(header);
                    const headerX = xPos + (width - headerWidth) / 2;
                    doc.text(header, headerX, currentY + baseCellHeight - 2);
                    xPos += width;
                });
                currentY += baseCellHeight;
            }
            
            // Draw each cell
            row.forEach((cell, index) => {
                const width = columnWidths[index];
                doc.setFillColor(255, 255, 255);
                doc.rect(xPos, currentY, width, rowHeight, 'F');
                doc.rect(xPos, currentY, width, rowHeight, 'S');
                doc.setFontSize(6);
                doc.setFont('helvetica', 'normal');
                
                let text = cell || 'N/A';
                
                // Handle products column with compact bullets
                if (index === 2 && typeof text === 'string' && text.includes(',')) {
                    const products = text.split(',').map(p => p.trim()).filter(p => p);
                    products.forEach((product, productIndex) => {
                        const yPos = currentY + 2.5 + (productIndex * 2.5);
                        doc.text(`• ${product}`, xPos + cellPadding, yPos);
                    });
                } else {
                    // Handle regular cells
                    let displayText = '-';
                    
                    // Format numeric values for day columns and total
                    if (index >= 3) {
                        const numValue = parseFloat(text);
                        if (!isNaN(numValue) && numValue !== 0) {
                            displayText = formatAmount(numValue);
                        }
                    } else if (text !== 'N/A' && text !== null && text !== undefined) {
                        displayText = text.toString();
                    }
                    
                    // Position text based on column type
                    if (headers[index] === 'Overall Total') {
                        // Center-align Overall Total values
                        const textX = xPos + width / 2;
                        const textY = currentY + (rowHeight / 2) + 1;
                        doc.text(displayText, textX, textY, { align: 'center' });
                    } else if (index >= 3) {
                        // Right-align other numeric values (Day columns)
                        const textWidth = doc.getTextWidth(displayText);
                        const textX = xPos + width - textWidth - cellPadding;
                        const textY = currentY + (rowHeight / 2) + 1;
                        doc.text(displayText, textX, textY);
                    } else {
                        // Left-align other values with vertical centering
                        const textY = currentY + (rowHeight / 2) + 1;
                        doc.text(displayText, xPos + cellPadding, textY);
                    }
                }
                
                xPos += width;
            });
            currentY += rowHeight;
        });
        
        return currentY;
    }; // Store the record being edited

    useEffect(() => {
        fetchActivities();
    }, []);

    useEffect(() => {
        if (selectedActivity) {
            fetchSalesReport();
        }
    }, [selectedActivity, sortOrder]);

    useEffect(() => {
        // Reset form when selectedActivity changes
        if (showReportModal) {
            resetForm();
        }
    }, [selectedActivity, showReportModal]);

    const fetchActivities = async () => {
        try {
            const response = await api.get('/event-activities');
            setActivities(response.data.activities || []);
        } catch (error) {
            console.error('Error fetching activities:', error);
        }
    };

    const fetchSalesReport = async () => {
        if (!selectedActivity) return;
        
        try {
            setLoading(true);
            const response = await api.get(`/event-sales/activity/${selectedActivity}?sort_order=${sortOrder}`);
            
           
            
            // Update activities state with fresh data from API response
            const updatedActivity = response.data.activity;
            setActivities(prevActivities => 
                prevActivities.map(activity => 
                    activity.id === updatedActivity.id ? updatedActivity : activity
                )
            );
            
          
            setSalesData(response.data.sales_data);
            setSummary(response.data.summary);
        } catch (error) {
            console.error('Error fetching sales report:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVendors = async (activityId) => {
        try {
            const response = await api.get(`/event-vendors/activity/${activityId}`);
            setAvailableVendors(response.data.vendors || []);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        }
    };

    const fetchAvailableStalls = async (activityId, vendorId) => {
        try {
            const response = await api.get(`/event-stalls?activity_id=${activityId}&vendor_id=${vendorId}&status=occupied`);
            setAvailableStalls(response.data.stalls || []);
        } catch (error) {
            console.error('Error fetching stalls:', error);
        }
    };

    const fetchVendorReportDates = async (activityId, vendorId) => {
        try {
            const response = await api.get(`/event-sales/vendor/${activityId}/${vendorId}/report-dates`);
            const reports = response.data.reports || [];
            setExistingReportDates(reports);
        } catch (error) {
            console.error('Error fetching vendor report dates:', error);
            setExistingReportDates([]);
        }
    };

    const deleteSalesReportByDay = async (activityId, vendorId, reportDate) => {
        try {
            await api.delete('/event-sales/reports/by-day', {
                data: {
                    activity_id: activityId,
                    vendor_id: vendorId,
                    report_date: reportDate
                }
            });
            
            // Refresh the data
            fetchSalesReport();
            fetchVendorReportDates(activityId, vendorId);
            
            message.success('Sales report deleted successfully');
        } catch (error) {
            console.error('Error deleting sales report:', error);
            message.error('Failed to delete sales report');
        }
    };

    const showDeleteModal = async (vendorId, activityId) => {
        try {
            const response = await api.get(`/event-sales/vendor/${activityId}/${vendorId}/report-dates`);
            const reports = response.data.reports || [];
            
            // Create a simple vendor object from the first report or use fallback
            let vendor = null;
            if (reports.length > 0) {
                // Extract vendor info from the first report
                vendor = {
                    id: vendorId,
                    first_name: 'Vendor',
                    last_name: `ID: ${vendorId}`
                };
            } else {
                // Fallback vendor object
                vendor = {
                    id: vendorId,
                    first_name: 'Vendor',
                    last_name: `ID: ${vendorId}`
                };
            }
            
            setDeleteModalData({
                vendor: vendor,
                reports: reports,
                selectedReports: []
            });
            setDeleteModalVisible(true);
        } catch (error) {
            console.error('Error fetching vendor reports for delete:', error);
            message.error('Failed to fetch vendor reports');
        }
    };

    const handleDeleteReportSelection = (reportDate, checked) => {
        setDeleteModalData(prev => ({
            ...prev,
            selectedReports: checked 
                ? [...prev.selectedReports, reportDate]
                : prev.selectedReports.filter(date => date !== reportDate)
        }));
    };

    const handleDeleteSelectedReports = () => {
        if (deleteModalData.selectedReports.length === 0) {
            message.warning('Please select at least one report to delete');
            return;
        }

        // Show confirmation modal
        setConfirmDeleteVisible(true);
    };

    const confirmDeleteReports = async () => {
        try {
            for (const reportDate of deleteModalData.selectedReports) {
                // Format the date to YYYY-MM-DD format (remove timezone)
                const formattedDate = reportDate.includes('T') 
                    ? reportDate.split('T')[0] 
                    : reportDate;
                    
                // Find the stall that belongs to this vendor
                const allReportsResponse = await api.get('/event-sales/activity/' + selectedActivity);
                const allReports = allReportsResponse.data.sales_data || [];
                
                const targetStall = allReports.find(report => report.vendor_id === deleteModalData.vendor.id);
                
                if (targetStall && targetStall.stall_id) {
                    // Get all reports for this stall
                    const stallResponse = await api.get(`/event-sales/stall/${targetStall.stall_id}/history`);
                    const stallReports = stallResponse.data || {};
                    
                    // Find the report matching our date
                    const targetReport = stallReports.sales_history?.find(report => {
                        const reportDate = new Date(report.report_date).toISOString().split('T')[0];
                        return reportDate === formattedDate;
                    });
                    
                    if (targetReport && targetReport.id) {
                        await api.delete(`/event-sales/reports/${targetReport.id}`);
                    } else {
                        throw new Error('No report found for the specified date');
                    }
                } else {
                    throw new Error('No stall found for this vendor');
                }
            }
            
            // Refresh the data
            fetchSalesReport();
            fetchVendorReportDates(selectedActivity, deleteModalData.vendor.id);
            
            setDeleteModalVisible(false);
            setConfirmDeleteVisible(false);
            message.success(`Successfully deleted ${deleteModalData.selectedReports.length} sales report(s)`);
        } catch (error) {
            console.error('Error deleting sales reports:', error);
            console.error('Error details:', error.response?.data);
            message.error('Failed to delete sales reports');
        }
    };

    const handleSubmit = async (values) => {
        try {
            const reportData = {
                ...formData,
                total_sales: calculateTotalSales(),
                ...values
            };
            
            // Console log for debugging
         
            
            const response = await api.post('/event-sales/reports', reportData);
          
            fetchSalesReport();
            resetForm();
            setShowReportModal(false);
            message.success('Sales report created successfully!');
        } catch (error) {
            console.error('Error saving sales report:', error);
           
            if (error.response && error.response.status === 422) {
                // Handle duplicate report error
                
                message.error(error.response.data.message);
            } else {
                message.error('Error creating sales report');
            }
        }
    };

    const handleVerify = async (reportId) => {
        try {
            await api.post(`/activity-sales-reports/${reportId}/verify`);
            fetchSalesReport();
        } catch (error) {
            console.error('Error verifying report:', error);
        }
    };

    const handleUnverify = async (reportId) => {
        try {
            await api.post(`/activity-sales-reports/${reportId}/unverify`);
            fetchSalesReport();
        } catch (error) {
            console.error('Error unverifying report:', error);
        }
    };

    
    const resetForm = () => {
        setFormData({
            activity_id: selectedActivity || '',
            vendor_id: '',
            stall_id: '',
            report_day: '',
            products: []
        });
        setAvailableVendors([]);
        setAvailableStalls([]);
    };


    const addProduct = () => {
        setFormData(prev => ({
            ...prev,
            products: [...prev.products, {
                id: Date.now(),
                name: '',
                unit_sold: '',
                unit_price: '',
                total_sales: 0
            }]
        }));
    };

    const removeProduct = (productId) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products.filter(p => p.id !== productId)
        }));
    };

    const updateProduct = (productId, field, value) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products.map(p => {
                if (p.id === productId) {
                    const updated = { ...p, [field]: value };
                    if (field === 'unit_sold' || field === 'unit_price') {
                        const unitSold = parseFloat(updated.unit_sold) || 0;
                        const unitPrice = parseFloat(updated.unit_price) || 0;
                        updated.total_sales = unitSold * unitPrice;
                    }
                    return updated;
                }
                return p;
            })
        }));
    };

    const calculateTotalSales = () => {
        return formData.products.reduce((sum, product) => sum + (parseFloat(product.total_sales) || 0), 0);
    };

    const generateDayColumns = () => {
        if (!selectedActivity) return [];
        
        const activity = activities.find(a => a.id === selectedActivity);
        if (!activity) return [];
        
        const startDate = new Date(activity.start_date);
        const endDate = new Date(activity.end_date);
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        const dayColumns = [];
        for (let day = 1; day <= totalDays; day++) {
            dayColumns.push({
                title: `Day ${day} income`,
                dataIndex: `day${day}_income`,
                key: `day${day}_income`,
                render: (value) => `₱${(value || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}`,
                align: 'right',
            });
        }
        
        return dayColumns;
    };

    const getDayOptions = () => {
        if (!formData.activity_id) return [];
        
        const activity = activities.find(a => a.id === formData.activity_id);
        if (!activity) return [];
        
                
        // Extract date part and parse as local date to avoid timezone issues
  
        // Handle both date formats: "2026-04-07 00:00:00" and "2026-04-07T00:00:00.000000Z"
        const startDateStr = activity.start_date.includes(' ') 
            ? activity.start_date.split(' ')[0]  // "2026-04-07 00:00:00" -> "2026-04-07"
            : activity.start_date.split('T')[0]; // "2026-04-07T00:00:00" -> "2026-04-07"
            
        const endDateStr = activity.end_date.includes(' ')
            ? activity.end_date.split(' ')[0]
            : activity.end_date.split('T')[0];
        
  
        // Parse as YYYY-MM-DD format to avoid timezone issues
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
   
        const days = [];
        

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayNumber = Math.floor((d - startDate) / (1000 * 60 * 60 * 24)) + 1;
            
            // Create date string by adding days to start date
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + (dayNumber - 1));
            
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const dateISO = `${year}-${month}-${day}`;
      
            const formattedDate = d.toLocaleDateString('en-US', { 
                month: 'long', 
                day: '2-digit', 
                year: 'numeric' 
            }).replace(/(\w+), (\d+), (\d+)/, '$1,$2,$3');
    
            // Check if this date already has a report for the selected vendor
            const hasExistingReport = existingReportDates.some(report => {
                // Handle timezone conversion properly
                let reportDateISO;
                if (report.report_date.includes('T')) {
                    // If it's a datetime string, convert to local date
                    const reportDate = new Date(report.report_date);
                    // Get the local date in YYYY-MM-DD format
                    reportDateISO = reportDate.getFullYear() + '-' + 
                        String(reportDate.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(reportDate.getDate()).padStart(2, '0');
                } else {
                    // If it's already a date string, use as is
                    reportDateISO = report.report_date;
                }
                
                // Additional check: ensure report date is within activity range
                const reportDateObj = new Date(reportDateISO);
                const startDateObj = new Date(startDateStr);
                const endDateObj = new Date(endDateStr);
                const isWithinRange = reportDateObj >= startDateObj && reportDateObj <= endDateObj;
                
                return reportDateISO === dateISO && isWithinRange;
            });
            
            // Always include the day, but mark as disabled if it has an existing report
            days.push({
                value: dateISO,
                label: `Day ${dayNumber}`,
                display: hasExistingReport 
                    ? `Day ${dayNumber} (${formattedDate}) - Sales Report Already Done`
                    : `Day ${dayNumber} (${formattedDate})`,
                disabled: hasExistingReport
            });
        }
        
        return days;
    };

    const getStatusBadge = (verified) => {
        return verified ? 'badge badge-success' : 'badge badge-warning';
    };

    const generateDailyIncomeSummary = () => {
        if (!selectedActivity || salesData.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '48px' }}>
                    <Text type="secondary">No data available for daily income summary.</Text>
                </div>
            );
        }

        const activity = activities.find(a => a.id === selectedActivity);
        if (!activity) {
            return null;
        }
        
        const startDate = new Date(activity.start_date);
        const endDate = new Date(activity.end_date);
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        // Generate daily income data
        const dailyIncomeData = [];
        for (let day = 1; day <= totalDays; day++) {
            const dayIncome = salesData.reduce((total, stall) => {
                const dayKey = `day${day}_income`; // Changed to match the actual data structure
                return total + (parseFloat(stall[dayKey]) || 0);
            }, 0);
            
            dailyIncomeData.push({
                key: day,
                day: `Day ${day}`,
                income: dayIncome
            });
        }

        const columns = [
            {
                title: 'Days',
                dataIndex: 'day',
                key: 'day',
                width: window.innerWidth < 768 ? 100 : 150,
                render: (text) => <strong>{text}</strong>
            },
            {
                title: 'Income',
                dataIndex: 'income',
                key: 'income',
                width: window.innerWidth < 768 ? 150 : 200,
                align: 'right',
                render: (value) => (
                    <span style={{ fontWeight: 'bold', color: '#28a745' }}>
                        ₱{(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                )
            }
        ];

        return (
            <Table
                dataSource={dailyIncomeData}
                rowKey="key"
                pagination={false}
                scroll={{ x: window.innerWidth < 768 ? 300 : 400 }}
                size={window.innerWidth < 768 ? 'small' : 'middle'}
                columns={columns}
                summary={() => {
                    const totalIncome = dailyIncomeData.reduce((sum, day) => sum + day.income, 0);
                    return (
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0}>
                                <strong>Total Income:</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1}>
                                <div style={{ textAlign: 'right' }}>
                                    <strong style={{ color: '#28a745', fontSize: window.innerWidth < 768 ? '14px' : '16px' }}>
                                        ₱{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </strong>
                                </div>
                            </Table.Summary.Cell>
                        </Table.Summary.Row>
                    );
                }}
            />
        );
    };

    const handleEdit = async (record) => {
        try {
            // Fetch actual sales reports for this stall
            const stallId = record.stall_id || record.id; // Try both possible field names
            
            const response = await api.get(`/event-sales/stall/${stallId}/history`);
            const salesReports = response.data.sales_history || [];
            
            if (salesReports.length === 0) {
                message.warning('No sales reports found for this stall');
                return;
            }
            
            // Get activity info for date formatting
            const activity = activities.find(a => a.id === selectedActivity);
            const startDate = new Date(activity.start_date);
            
            // Create available days from actual sales reports
            const availableDays = salesReports.map(report => {
                const reportDate = new Date(report.report_date);
                const dayNumber = report.day_number || 1; // Use database day_number, fallback to 1
                
                return {
                    value: report.id,
                    label: `Day ${dayNumber} (${reportDate.toLocaleDateString()})`,
                    date: report.report_date,
                    day_number: dayNumber,
                    sales: report.total_sales,
                    products: report.products || []
                };
            });
            
            // Set the editing report data
            setEditingReport({
                ...record,
                availableDays
            });
            
            // Store the record being edited
            setEditingRecord({
                Rel_id: record.stall_id,
                vendor_id: record.vendor_id,
            });
            
            // Initialize edit form with first available report's data
            const firstReport = availableDays[0];
            
            // Calculate total sales from products to ensure correct value
            const productsWithTotals = firstReport.products.map(product => {
                const unitSold = parseFloat(product.unit_sold) || 0;
                const unitPrice = parseFloat(product.unit_price) || 0;
                const productTotal = unitSold * unitPrice;
                return {
                    ...product,
                    total_sales: productTotal
                };
            });
            
            const calculatedTotalSales = productsWithTotals.reduce((sum, product) => sum + (product.total_sales || 0), 0);
            
            setEditFormData({
                id: firstReport.value,
                activity_id: selectedActivity,
                stall_id: record.stall_id,
                vendor_id: record.vendor_id,
                report_day: firstReport.value,
                total_sales: calculatedTotalSales,
                products: productsWithTotals
            });
            
            setShowEditModal(true);
            
        } catch (error) {
            message.error('Error preparing edit: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleEditSubmit = async () => {
        try {
            const calculatedTotal = editFormData.products.reduce((sum, product) => sum + (parseFloat(product.total_sales) || 0), 0);
     
                        
            const submitData = {
                ...editFormData,
                vendor_id: editingRecord?.vendor_id || editingRecord?.vendor_name, // Use vendor_id or vendor_name from record
                total_sales: calculatedTotal
            };
            
                        
            await api.put(`/event-sales/reports/${editFormData.id}`, submitData);
            message.success('Sales report updated successfully');
            setShowEditModal(false);
            fetchSalesReport(); // Refresh the data
        } catch (error) {
            console.error('Error updating sales report:', error);
            message.error('Error updating sales report');
        }
    };

    const handleDelete = async (record) => {
        try {
            // For now, we'll show a message since individual sales reports are not directly accessible from the stall data
            message.info('Delete functionality will be implemented for individual sales reports');
        } catch (error) {
            message.error('Error deleting sales report');
        }
    };

    const handleExportToPDF = () => {
        if (!selectedActivity || salesData.length === 0) {
            message.error('Please select an activity and ensure there is sales data');
            return;
        }

        try {
            const activity = activities.find(a => a.id === selectedActivity);
            const doc = new jsPDF();
            
            // Get activity data for days
            const activityData = activities.find(a => a.id === selectedActivity);
            const startDate = new Date(activityData.start_date);
            const endDate = new Date(activityData.end_date);
            const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            
            // Add title
            doc.setFontSize(18);
            doc.text('Event Sales Report', 105, 15, { align: 'center' });
            
            // Add activity info with reduced spacing
            doc.setFontSize(11);
            doc.text(`Activity: ${activity.name}`, 15, 28);
            doc.setFontSize(9);
            doc.text(`Location: ${activity.location}`, 15, 36);
            doc.text(`Period: ${formatDatePeriod(activity.start_date, activity.end_date)}`, 15, 44);
            
            let yPosition = 52; // Reduced initial yPosition
            
            // Fixed Stalls Table with borders - SORT by stall number
            const fixedStalls = salesData.filter(stall => !stall.is_ambulant || stall.is_ambulant === false || stall.is_ambulant === 0);
            if (fixedStalls.length > 0) {
                // Sort fixed stalls by stall number in ascending order
                fixedStalls.sort((a, b) => {
                    const stallNumA = parseInt(a.stall_number) || 0;
                    const stallNumB = parseInt(b.stall_number) || 0;
                    return stallNumA - stallNumB;
                });
                
                // Add title - always on first page
                doc.setFontSize(14);
                doc.text('Fixed Stalls', 15, yPosition);
                yPosition += 10;
                
                // Prepare table data for fixed stalls
                const fixedTableData = [];
                fixedStalls.forEach(stall => {
                    const row = [
                        stall.stall_number || 'N/A',
                        stall.vendor_name || 'N/A',
                        stall.product_services || 'N/A'
                    ];
                    
                    // Add day columns
                    for (let day = 1; day <= totalDays; day++) {
                        const dayKey = `day${day}_income`;
                        row.push(stall[dayKey] || 0);
                    }
                    
                    row.push(stall.total_sales || 0);
                    fixedTableData.push(row);
                });
                
                // Define table headers for fixed stalls
                const fixedHeaders = ['Stall #', 'Vendor Name', 'Products/Services'];
                for (let day = 1; day <= totalDays; day++) {
                    fixedHeaders.push(`Day ${day}`);
                }
                
                // Split fixed stalls table into chunks of 5 days
                const fixedTables = splitTableData(fixedHeaders, fixedTableData, 5);
                
                // Draw each fixed stalls table chunk
                fixedTables.forEach((table, index) => {
                    // Simple approach: if we're past line 240, always start new page
                    if (yPosition > 240) {
                        doc.addPage();
                        yPosition = 20;
                        
                        // Add section title on continuation page
                        doc.setFontSize(14);
                        doc.text('Fixed Stalls (Continued)', 15, yPosition);
                        yPosition += 10;
                    }
                    
                    // Add sub-title only for multi-chunk tables
                    if (fixedTables.length > 1) {
                        doc.setFontSize(12);
                        doc.text(`Days ${index * 5 + 1}-${Math.min((index + 1) * 5, totalDays)}`, 15, yPosition);
                        yPosition += 8;
                    }
                    
                    // Draw table chunk
                    yPosition = drawTable(doc, yPosition, table.headers, table.data);
                    yPosition += 8; // Reduced spacing
                });
                
                yPosition += 15;
            }
            
            // Ambulant Stalls Table with borders
            const ambulantStalls = salesData.filter(stall => stall.is_ambulant === true || stall.is_ambulant === 1);
            if (ambulantStalls.length > 0) {
                // Simple check: add title on current page if there's reasonable space
                const pageHeight = doc.internal.pageSize.height;
                const remainingSpace = pageHeight - yPosition;
                
                if (remainingSpace < 50) { // If less than 50 units, go to new page
                    doc.addPage();
                    yPosition = 20;
                }
                
                // Add title
                doc.setFontSize(14);
                doc.text('Ambulant Stalls', 15, yPosition);
                yPosition += 10;
                
                // Prepare table data for ambulant stalls
                const ambulantTableData = [];
                ambulantStalls.forEach((stall, index) => {
                    const row = [
                        index + 1,
                        stall.vendor_name || 'N/A',
                        stall.product_services || 'N/A'
                    ];
                    
                    // Add day columns
                    for (let day = 1; day <= totalDays; day++) {
                        const dayKey = `day${day}_income`;
                        row.push(stall[dayKey] || 0);
                    }
                    
                    row.push(stall.total_sales || 0);
                    ambulantTableData.push(row);
                });
                
                // Define table headers for ambulant stalls
                const ambulantHeaders = ['Ambulant #', 'Vendor Name', 'Products/Services'];
                for (let day = 1; day <= totalDays; day++) {
                    ambulantHeaders.push(`Day ${day}`);
                }
                
                // Split ambulant stalls table into chunks of 5 days
                const ambulantTables = splitTableData(ambulantHeaders, ambulantTableData, 5);
                
                // Draw each ambulant stalls table chunk
                ambulantTables.forEach((table, index) => {
                    // Simple approach: if we're past line 240, always start new page
                    if (yPosition > 240) {
                        doc.addPage();
                        yPosition = 20;
                        
                        // Add section title on continuation page
                        doc.setFontSize(14);
                        doc.text('Ambulant Stalls (Continued)', 15, yPosition);
                        yPosition += 10;
                    }
                    
                    // Add sub-title only for multi-chunk tables
                    if (ambulantTables.length > 1) {
                        doc.setFontSize(12);
                        doc.text(`Days ${index * 5 + 1}-${Math.min((index + 1) * 5, totalDays)}`, 15, yPosition);
                        yPosition += 8;
                    }
                    
                    // Draw table chunk
                    yPosition = drawTable(doc, yPosition, table.headers, table.data);
                    yPosition += 8; // Reduced spacing
                });
                
                yPosition += 15;
            }
            
            // Daily Income Summary Table with borders
            // Check if we need a new page before starting daily summary
            const summaryTableHeight = (totalDays + 2) * 8 + 20; // More realistic height calculation
            if (yPosition > 180) {
                doc.addPage();
                yPosition = 20;
            }
            
            // Add title only once
            doc.setFontSize(14);
            doc.text('Daily Income Summary', 15, yPosition);
            yPosition += 10;
            
            // Calculate daily income data
            const dailySummaryData = [];
            let grandTotal = 0;
            for (let day = 1; day <= totalDays; day++) {
                const dayIncome = salesData.reduce((total, stall) => {
                    const dayKey = `day${day}_income`;
                    return total + (parseFloat(stall[dayKey]) || 0);
                }, 0);
                
                grandTotal += dayIncome;
                dailySummaryData.push([`Day ${day}`, dayIncome]);
            }
            
            // Add total row
            dailySummaryData.push(['Total Income', grandTotal]);
            
            // Draw daily income summary table manually with borders
            const drawDailySummaryTable = (startY, data) => {
                let currentY = startY;
                const cellHeight = 8;
                const cellPadding = 3;
                
                // Draw headers
                doc.setFillColor(240, 240, 240);
                doc.rect(15, currentY, 30, cellHeight, 'F');
                doc.rect(15, currentY, 30, cellHeight, 'S');
                doc.rect(45, currentY, 40, cellHeight, 'F');
                doc.rect(45, currentY, 40, cellHeight, 'S');
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text('Day', 15 + cellPadding, currentY + cellHeight - 2);
                doc.text('Income', 45 + cellPadding, currentY + cellHeight - 2);
                currentY += cellHeight;
                
                // Draw data rows
                data.forEach((row, rowIndex) => {
                    const isTotalRow = rowIndex === data.length - 1;
                    if (isTotalRow) {
                        doc.setFillColor(240, 240, 240);
                    } else {
                        doc.setFillColor(255, 255, 255);
                    }
                    
                    doc.rect(15, currentY, 30, cellHeight, 'F');
                    doc.rect(15, currentY, 30, cellHeight, 'S');
                    doc.rect(45, currentY, 40, cellHeight, 'F');
                    doc.rect(45, currentY, 40, cellHeight, 'S');
                    
                    doc.setFontSize(9);
                    if (isTotalRow) {
                        doc.setFont('helvetica', 'bold');
                    } else {
                        doc.setFont('helvetica', 'normal');
                    }
                    
                    doc.text(row[0], 15 + cellPadding, currentY + cellHeight - 2);
                    const income = formatAmount(row[1]);
                    doc.text(income, 45 + cellPadding, currentY + cellHeight - 2);
                    currentY += cellHeight;
                });
                
                return currentY;
            };
            
            yPosition = drawDailySummaryTable(yPosition, dailySummaryData);
            
            // Save the PDF
            doc.save(`sales_report_${activity.name}_${new Date().toISOString().split('T')[0]}.pdf`);
            message.success('PDF exported successfully');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            message.error('Error generating PDF');
        }
    };

    return (
        <div className="event-sales-reporting" style={{ padding: window.innerWidth < 768 ? '10px' : window.innerWidth < 1024 ? '16px' : '24px' }}>
            <Card style={{ marginBottom: 24 }}>
                <Row justify="space-between" align="middle" gutter={[16, 16]}>
                    <Col xs={24} sm={24} md={12} lg={8} xl={6}>
                        <Title level={2} style={{ margin: 0, fontSize: window.innerWidth < 768 ? '20px' : window.innerWidth < 1024 ? '22px' : '24px' }}>Sales Reporting</Title>
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={16} xl={18}>
                        <Space wrap size={[8, 8]} style={{ width: '100%', justifyContent: window.innerWidth < 768 ? 'center' : 'flex-end' }}>
                            <Button 
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setFormData(prev => ({
                                        ...prev,
                                        activity_id: selectedActivity,
                                        vendor_id: '',
                                        stall_id: '',
                                        report_day: '',
                                        products: []
                                    }));
                                    setAvailableVendors([]);
                                    setAvailableStalls([]);
                                    if (selectedActivity) {
                                        fetchVendors(selectedActivity);
                                    }
                                    setShowReportModal(true);
                                    // Reset Ant Design form to sync with React state
                                    setTimeout(() => {
                                        form.resetFields();
                                        form.setFieldsValue({
                                            activity_id: selectedActivity,
                                            vendor_id: '',
                                            stall_id: '',
                                            report_day: '',
                                            products: []
                                        });
                                    }, 100);
                                }}
                                disabled={!selectedActivity}
                                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d9d9d9' }}
                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                            >
                                {window.innerWidth < 768 ? 'Add' : 'Add Sales Report'}
                            </Button>
                            <Button 
                                type="primary"
                                icon={<FilePdfOutlined />}
                                onClick={handleExportToPDF}
                                disabled={!selectedActivity || salesData.length === 0}
                                style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f', color: 'white' }}
                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                            >
                                {window.innerWidth < 768 ? 'PDF' : 'Export to PDF'}
                            </Button>
                                                    </Space>
                    </Col>
                </Row>
            </Card>

            <Card style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={24} md={24} lg={8} xl={8}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px', color: '#000000d9', fontWeight: 500 }}>Select Activity</label>
                            <Select 
                                value={selectedActivity}
                                onChange={(value) => setSelectedActivity(value)}
                                placeholder="Choose an activity..."
                                style={{ width: '100%' }}
                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                            >
                                {activities.map(activity => (
                                    <Option key={activity.id} value={activity.id}>
                                        {window.innerWidth < 768 
                                            ? `${activity.name.length > 25 ? activity.name.substring(0, 25) + '...' : activity.name}`
                                            : `${activity.name} (${activity.location})`
                                        }
                                    </Option>
                                ))}
                            </Select>
                        </div>
                    </Col>
                    {selectedActivity && (
                        <>
                            <Col xs={24} sm={12} md={12} lg={8} xl={8}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px', color: '#000000d9', fontWeight: 500 }}>Sort Order</label>
                                    <Select 
                                        value={sortOrder}
                                        onChange={(value) => setSortOrder(value)}
                                        style={{ width: '100%' }}
                                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                                    >
                                        <Option value="desc">{window.innerWidth < 768 ? 'High→Low' : 'Highest to Lowest'}</Option>
                                        <Option value="asc">{window.innerWidth < 768 ? 'Low→High' : 'Lowest to Highest'}</Option>
                                    </Select>
                                </div>
                            </Col>
                            <Col xs={24} sm={12} md={12} lg={8} xl={8}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ visibility: 'hidden' }}>Action</label>
                                    <Button 
                                        icon={<SyncOutlined />}
                                        onClick={fetchSalesReport}
                                        disabled={loading}
                                        style={{ width: '100%', backgroundColor: 'white', color: 'black', borderColor: '#d9d9d9' }}
                                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                                    >
                                        {window.innerWidth < 768 ? '' : 'Refresh'}
                                    </Button>
                                </div>
                            </Col>
                        </>
                    )}
                </Row>
            </Card>

            {selectedActivity && salesData.length > 0 && (
                <Card style={{ marginBottom: 24 }}>
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px', color: '#000000d9', fontWeight: 500 }}>
                                    Search Vendor
                                </label>
                                <Input
                                    placeholder="Type vendor name to search..."
                                    value={vendorSearchText}
                                    onChange={(e) => setVendorSearchText(e.target.value)}
                                    prefix={<SearchOutlined />}
                                    allowClear
                                    size={window.innerWidth < 768 ? 'small' : 'middle'}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px', color: '#000000d9', fontWeight: 500 }}>
                                    Select Day for Analysis
                                </label>
                                <Select
                                    value={selectedDay}
                                    onChange={handleDayChange}
                                    placeholder="Choose a day..."
                                    style={{ width: '100%' }}
                                    size={window.innerWidth < 768 ? 'small' : 'middle'}
                                    allowClear
                                >
                                    {getDaySelectorOptions().map(option => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                            </div>
                        </Col>
                        <Col xs={24} sm={24} md={8} lg={12} xl={12}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'flex-end',
                                height: '100%',
                                fontSize: window.innerWidth < 768 ? '12px' : '14px',
                                color: '#666',
                                flexWrap: 'wrap',
                                gap: '8px'
                            }}>
                                {vendorSearchText && (
                                    <span>
                                        Found {filterSalesDataByVendor(salesData, vendorSearchText).length} of {salesData.length} vendors
                                    </span>
                                )}
                                {selectedDay && daySalesDetails && (
                                    <span style={{ marginLeft: vendorSearchText ? '8px' : '0' }}>
                                        Day {selectedDay} Analysis Available
                                    </span>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Card>
            )}

            {selectedActivity && summary && (
                <div style={{ marginBottom: 24 }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: 16, 
                        gap: '8px'
                    }}>
                        <LineChartOutlined style={{ fontSize: '20px', color: '#262626' }} />
                        <Title level={4} style={{ margin: 0, color: '#262626', fontWeight: 600 }}>
                            Event Sales Overview
                        </Title>
                    </div>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                            <Card 
                                style={{ 
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.25)',
                                    transition: 'all 0.3s ease',
                                    cursor: 'default'
                                }}
                                hoverable
                            >
                                <div style={{ color: 'white', textAlign: 'center' }}>
                                    <div style={{ 
                                        fontSize: window.innerWidth < 768 ? '32px' : '40px', 
                                        fontWeight: 'bold', 
                                        marginBottom: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}>
                                        <ShopOutlined style={{ fontSize: window.innerWidth < 768 ? '28px' : '36px' }} />
                                        {summary.total_stalls || 0}
                                    </div>
                                    <div style={{ 
                                        fontSize: window.innerWidth < 768 ? '13px' : '15px', 
                                        fontWeight: 500,
                                        opacity: 0.95
                                    }}>
                                        Total Participating Stalls
                                    </div>
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                            <Card 
                                style={{ 
                                    background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 32px rgba(82, 196, 26, 0.25)',
                                    transition: 'all 0.3s ease',
                                    cursor: 'default'
                                }}
                                hoverable
                            >
                                <div style={{ color: 'white', textAlign: 'center' }}>
                                    <div style={{ 
                                        fontSize: window.innerWidth < 768 ? '24px' : '32px', 
                                        fontWeight: 'bold', 
                                        marginBottom: '8px',
                                        lineHeight: '1.2'
                                    }}>
                                        ₱{(summary.total_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div style={{ 
                                        fontSize: window.innerWidth < 768 ? '13px' : '15px', 
                                        fontWeight: 500,
                                        opacity: 0.95
                                    }}>
                                        Total Revenue Generated
                                    </div>
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                            <Card 
                                style={{ 
                                    background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 32px rgba(250, 140, 22, 0.25)',
                                    transition: 'all 0.3s ease',
                                    cursor: 'default'
                                }}
                                hoverable
                            >
                                <div style={{ color: 'white', textAlign: 'center' }}>
                                    <div style={{ 
                                        fontSize: window.innerWidth < 768 ? '24px' : '32px', 
                                        fontWeight: 'bold', 
                                        marginBottom: '8px',
                                        lineHeight: '1.2'
                                    }}>
                                        ₱{(summary.lowest_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div style={{ 
                                        fontSize: window.innerWidth < 768 ? '13px' : '15px', 
                                        fontWeight: 500,
                                        opacity: 0.95,
                                        marginBottom: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}>
                                        <ArrowDownOutlined />
                                        Lowest Sales Performance
                                    </div>
                                    {summary.lowest_sales_details && (
                                        <div style={{ 
                                            fontSize: window.innerWidth < 768 ? '10px' : '11px', 
                                            opacity: 0.9, 
                                            lineHeight: '1.4',
                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                            padding: '6px 8px',
                                            borderRadius: '6px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                                <UserOutlined style={{ fontSize: '10px' }} />
                                                {summary.lowest_sales_details.vendor_name}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <CalendarOutlined style={{ fontSize: '10px' }} />
                                                {summary.lowest_sales_details.day} • {summary.lowest_sales_details.date}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <HomeOutlined style={{ fontSize: '10px' }} />
                                                Stall #{summary.lowest_sales_details.stall_number}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                            <Card 
                                style={{ 
                                    background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 32px rgba(255, 77, 79, 0.25)',
                                    transition: 'all 0.3s ease',
                                    cursor: 'default'
                                }}
                                hoverable
                            >
                                <div style={{ color: 'white', textAlign: 'center' }}>
                                    <div style={{ 
                                        fontSize: window.innerWidth < 768 ? '24px' : '32px', 
                                        fontWeight: 'bold', 
                                        marginBottom: '8px',
                                        lineHeight: '1.2'
                                    }}>
                                        ₱{(summary.highest_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div style={{ 
                                        fontSize: window.innerWidth < 768 ? '13px' : '15px', 
                                        fontWeight: 500,
                                        opacity: 0.95,
                                        marginBottom: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}>
                                        <ArrowUpOutlined />
                                        Highest Sales Performance
                                    </div>
                                    {summary.highest_sales_details && (
                                        <div style={{ 
                                            fontSize: window.innerWidth < 768 ? '10px' : '11px', 
                                            opacity: 0.9, 
                                            lineHeight: '1.4',
                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                            padding: '6px 8px',
                                            borderRadius: '6px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                                <UserOutlined style={{ fontSize: '10px' }} />
                                                {summary.highest_sales_details.vendor_name}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <CalendarOutlined style={{ fontSize: '10px' }} />
                                                {summary.highest_sales_details.day} • {summary.highest_sales_details.date}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <HomeOutlined style={{ fontSize: '10px' }} />
                                                Stall #{summary.highest_sales_details.stall_number}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}

            {selectedDay && daySalesDetails && (
                <div style={{ marginBottom: 24 }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: 16, 
                        gap: '8px'
                    }}>
                        <CalendarOutlined style={{ fontSize: '20px', color: '#262626' }} />
                        <Title level={4} style={{ margin: 0, color: '#262626', fontWeight: 600 }}>
                            Day {selectedDay} Performance Analysis
                        </Title>
                    </div>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                            <Card 
                                style={{ 
                                    background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 32px rgba(250, 140, 22, 0.25)',
                                    transition: 'all 0.3s ease',
                                    cursor: 'default'
                                }}
                                hoverable
                            >
                                <div style={{ color: 'white', textAlign: 'center' }}>
                                    <div style={{ 
                                        fontSize: window.innerWidth < 768 ? '20px' : '28px', 
                                        fontWeight: 'bold', 
                                        marginBottom: '8px',
                                        lineHeight: '1.2'
                                    }}>
                                        ₱{(daySalesDetails.lowest.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div style={{ 
                                        fontSize: window.innerWidth < 768 ? '13px' : '15px', 
                                        fontWeight: 500,
                                        opacity: 0.95,
                                        marginBottom: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}>
                                        <ArrowDownOutlined />
                                        Lowest Sales for Day {selectedDay}
                                    </div>
                                    <div style={{ 
                                        fontSize: window.innerWidth < 768 ? '11px' : '13px', 
                                        opacity: 0.9, 
                                        lineHeight: '1.5',
                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        textAlign: 'left'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                            <UserOutlined style={{ marginRight: '8px', fontSize: '12px' }} />
                                            <span style={{ fontWeight: 600 }}>{daySalesDetails.lowest.vendor_name}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                            <HomeOutlined style={{ marginRight: '8px', fontSize: '12px' }} />
                                            <span>Stall #{daySalesDetails.lowest.stall_number}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <LineChartOutlined style={{ marginRight: '8px', fontSize: '12px' }} />
                                            <span>Requires performance improvement</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                            <Card 
                                style={{ 
                                    background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 32px rgba(82, 196, 26, 0.25)',
                                    transition: 'all 0.3s ease',
                                    cursor: 'default'
                                }}
                                hoverable
                            >
                                <div style={{ color: 'white', textAlign: 'center' }}>
                                    <div style={{ 
                                        fontSize: window.innerWidth < 768 ? '20px' : '28px', 
                                        fontWeight: 'bold', 
                                        marginBottom: '8px',
                                        lineHeight: '1.2'
                                    }}>
                                        ₱{(daySalesDetails.highest.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div style={{ 
                                        fontSize: window.innerWidth < 768 ? '13px' : '15px', 
                                        fontWeight: 500,
                                        opacity: 0.95,
                                        marginBottom: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}>
                                        <ArrowUpOutlined />
                                        Highest Sales for Day {selectedDay}
                                    </div>
                                    <div style={{ 
                                        fontSize: window.innerWidth < 768 ? '11px' : '13px', 
                                        opacity: 0.9, 
                                        lineHeight: '1.5',
                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        textAlign: 'left'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                            <UserOutlined style={{ marginRight: '8px', fontSize: '12px' }} />
                                            <span style={{ fontWeight: 600 }}>{daySalesDetails.highest.vendor_name}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                            <HomeOutlined style={{ marginRight: '8px', fontSize: '12px' }} />
                                            <span>Stall #{daySalesDetails.highest.stall_number}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <StarOutlined style={{ marginRight: '8px', fontSize: '12px' }} />
                                            <span>Outstanding performance today</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}

            {!loading && salesData.length > 0 ? (
                <Card>
                    <Tabs defaultActiveKey="all" style={{ marginBottom: 16 }}>
                        <TabPane tab="All Stalls" key="all">
                            <Title level={4} style={{ marginBottom: 16 }}>
                                All Stalls Sales Reporting
                                {vendorSearchText && (
                                    <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal', marginLeft: '8px' }}>
                                        ({filterSalesDataByVendor(salesData, vendorSearchText).length} results)
                                    </span>
                                )}
                            </Title>
                            <Table
                                dataSource={filterSalesDataByVendor(salesData, vendorSearchText)}
                                rowKey={(record, index) => `${record.stall_id}-${index}`}
                                pagination={{ 
                                    pageSize: window.innerWidth < 768 ? 5 : window.innerWidth < 1024 ? 8 : 10,
                                    showSizeChanger: window.innerWidth >= 768,
                                    showQuickJumper: window.innerWidth >= 768,
                                    showTotal: (total, range) => window.innerWidth < 768 ? `${range[0]}-${range[1]} of ${total}` : `${range[0]}-${range[1]} of ${total} items`
                                }}
                                scroll={{ x: window.innerWidth < 768 ? 800 : window.innerWidth < 1024 ? 1000 : 1200 }}
                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                                columns={[
                                    {
                                        title: window.innerWidth < 768 ? '#' : 'NO #',
                                        dataIndex: 'stall_number',
                                        key: 'stall_number',
                                        width: window.innerWidth < 768 ? 60 : 80,
                                    },
                                    {
                                        title: 'Vendor Name',
                                        dataIndex: 'vendor_name',
                                        key: 'vendor_name',
                                        width: window.innerWidth < 768 ? 120 : 150,
                                        ellipsis: true,
                                    },
                                    {
                                        title: 'Stall #',
                                        dataIndex: 'stall_number',
                                        key: 'stall_number_display',
                                        width: window.innerWidth < 768 ? 60 : 80,
                                    },
                                    {
                                        title: window.innerWidth < 768 ? 'Products' : 'Product Services',
                                        dataIndex: 'product_services',
                                        key: 'product_services',
                                        width: window.innerWidth < 768 ? 100 : 150,
                                        ellipsis: true,
                                    },
                                    ...generateDayColumns().map(col => ({
                                        ...col,
                                        width: window.innerWidth < 768 ? 80 : 100,
                                    })),
                                    {
                                        title: window.innerWidth < 768 ? 'Total' : 'Overall total',
                                        dataIndex: 'total_sales',
                                        key: 'total_sales',
                                        width: window.innerWidth < 768 ? 100 : 120,
                                        render: (value) => `₱${(value || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}`,
                                        align: 'right',
                                        style: { fontWeight: 'bold', backgroundColor: '#f0f0f0' }
                                    },
                                    {
                                        title: window.innerWidth < 768 ? '' : 'Actions',
                                        key: 'actions',
                                        width: window.innerWidth < 768 ? 80 : 150,
                                        render: (text, record) => (
                                            <Space size={window.innerWidth < 768 ? 'small' : 'middle'} direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'}>
                                                <Button
                                                    type="text"
                                                    icon={<EditOutlined />}
                                                    onClick={() => handleEdit(record)}
                                                    size={window.innerWidth < 768 ? 'small' : 'middle'}
                                                    style={{ backgroundColor: 'white', color: 'black', borderColor: 'black' }}
                                                >
                                                    {window.innerWidth < 768 ? '' : 'Edit'}
                                                </Button>
                                                <Button
                                                        type="primary"
                                                        danger
                                                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => showDeleteModal(record.vendor_id, selectedActivity)}
                                                    >
                                                        {window.innerWidth < 768 ? '' : 'Delete Reports'}
                                                    </Button>
                                            </Space>
                                        ),
                                    },
                                ]}
                            />
                        </TabPane>
                        <TabPane tab="Fixed Stalls" key="fixed">
                            <Title level={4} style={{ marginBottom: 16 }}>
                                Fixed Stalls Sales Reporting
                                {vendorSearchText && (
                                    <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal', marginLeft: '8px' }}>
                                        ({filterSalesDataByVendor(salesData.filter(stall => !stall.is_ambulant || stall.is_ambulant === false || stall.is_ambulant === 0), vendorSearchText).length} results)
                                    </span>
                                )}
                            </Title>
                            <Table
                                dataSource={filterSalesDataByVendor(salesData.filter(stall => !stall.is_ambulant || stall.is_ambulant === false || stall.is_ambulant === 0), vendorSearchText)}
                                rowKey={(record, index) => `${record.stall_id}-${index}`}
                                pagination={{ 
                                    pageSize: window.innerWidth < 768 ? 5 : window.innerWidth < 1024 ? 8 : 10,
                                    showSizeChanger: window.innerWidth >= 768,
                                    showQuickJumper: window.innerWidth >= 768,
                                    showTotal: (total, range) => window.innerWidth < 768 ? `${range[0]}-${range[1]} of ${total}` : `${range[0]}-${range[1]} of ${total} items`
                                }}
                                scroll={{ x: window.innerWidth < 768 ? 800 : window.innerWidth < 1024 ? 1000 : 1200 }}
                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                                columns={[
                                    {
                                        title: window.innerWidth < 768 ? '#' : 'NO #',
                                        dataIndex: 'stall_number',
                                        key: 'stall_number',
                                        width: window.innerWidth < 768 ? 60 : 80,
                                    },
                                    {
                                        title: 'Vendor Name',
                                        dataIndex: 'vendor_name',
                                        key: 'vendor_name',
                                        width: window.innerWidth < 768 ? 120 : 150,
                                        ellipsis: true,
                                    },
                                    {
                                        title: window.innerWidth < 768 ? 'Products' : 'Product Services',
                                        dataIndex: 'product_services',
                                        key: 'product_services',
                                        width: window.innerWidth < 768 ? 100 : 150,
                                        ellipsis: true,
                                    },
                                    ...generateDayColumns().map(col => ({
                                        ...col,
                                        width: window.innerWidth < 768 ? 80 : 100,
                                    })),
                                    {
                                        title: window.innerWidth < 768 ? 'Total' : 'Overall total',
                                        dataIndex: 'total_sales',
                                        key: 'total_sales',
                                        width: window.innerWidth < 768 ? 100 : 120,
                                        render: (value) => `₱${(value || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}`,
                                        align: 'right',
                                        style: { fontWeight: 'bold', backgroundColor: '#f0f0f0' }
                                    },
                                    {
                                        title: window.innerWidth < 768 ? '' : 'Actions',
                                        key: 'actions',
                                        width: window.innerWidth < 768 ? 80 : 150,
                                        render: (text, record) => (
                                            <Space size={window.innerWidth < 768 ? 'small' : 'middle'} direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'}>
                                                <Button
                                                    type="text"
                                                    icon={<EditOutlined />}
                                                    onClick={() => handleEdit(record)}
                                                    size={window.innerWidth < 768 ? 'small' : 'middle'}
                                                    style={{ backgroundColor: 'white', color: 'black', borderColor: 'black' }}
                                                >
                                                    {window.innerWidth < 768 ? '' : 'Edit'}
                                                </Button>
                                                <Button
                                                        type="primary"
                                                        danger
                                                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => showDeleteModal(record.vendor_id, selectedActivity)}
                                                    >
                                                        {window.innerWidth < 768 ? '' : 'Delete Reports'}
                                                    </Button>
                                            </Space>
                                        ),
                                    },
                                ]}
                            />
                        </TabPane>
                        <TabPane tab="Ambulant Stalls" key="ambulant">
                            <Title level={4} style={{ marginBottom: 16 }}>
                                Ambulant Stalls Sales Reporting
                                {vendorSearchText && (
                                    <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal', marginLeft: '8px' }}>
                                        ({filterSalesDataByVendor(salesData.filter(stall => stall.is_ambulant === true || stall.is_ambulant === 1), vendorSearchText).length} results)
                                    </span>
                                )}
                            </Title>
                            <Table
                                dataSource={filterSalesDataByVendor(salesData.filter(stall => stall.is_ambulant === true || stall.is_ambulant === 1), vendorSearchText)}
                                rowKey={(record, index) => `ambulant-${record.stall_id}-${index}`}
                                pagination={{ 
                                    pageSize: window.innerWidth < 768 ? 5 : window.innerWidth < 1024 ? 8 : 10,
                                    showSizeChanger: window.innerWidth >= 768,
                                    showQuickJumper: window.innerWidth >= 768,
                                    showTotal: (total, range) => window.innerWidth < 768 ? `${range[0]}-${range[1]} of ${total}` : `${range[0]}-${range[1]} of ${total} items`
                                }}
                                scroll={{ x: window.innerWidth < 768 ? 800 : window.innerWidth < 1024 ? 1000 : 1200 }}
                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                                columns={[
                                    {
                                        title: 'Ambulant #',
                                        key: 'ambulant_number',
                                        width: window.innerWidth < 768 ? 80 : 100,
                                        render: (_, record, index) => `${index + 1}`
                                    },
                                    {
                                        title: 'Vendor Name',
                                        dataIndex: 'vendor_name',
                                        key: 'vendor_name',
                                        width: window.innerWidth < 768 ? 120 : 150,
                                        ellipsis: true,
                                    },
                                    {
                                        title: window.innerWidth < 768 ? 'Products' : 'Product Services',
                                        dataIndex: 'product_services',
                                        key: 'product_services',
                                        width: window.innerWidth < 768 ? 100 : 150,
                                        ellipsis: true,
                                    },
                                    ...generateDayColumns().map(col => ({
                                        ...col,
                                        width: window.innerWidth < 768 ? 80 : 100,
                                    })),
                                    {
                                        title: window.innerWidth < 768 ? 'Total' : 'Overall total',
                                        dataIndex: 'total_sales',
                                        key: 'total_sales',
                                        width: window.innerWidth < 768 ? 100 : 120,
                                        render: (value) => `₱${(value || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}`,
                                        align: 'right',
                                        style: { fontWeight: 'bold', backgroundColor: '#f0f0f0' }
                                    },
                                    {
                                        title: window.innerWidth < 768 ? '' : 'Actions',
                                        key: 'actions',
                                        width: window.innerWidth < 768 ? 80 : 150,
                                        render: (text, record) => (
                                            <Space size={window.innerWidth < 768 ? 'small' : 'middle'} direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'}>
                                                <Button
                                                    type="text"
                                                    icon={<EditOutlined />}
                                                    onClick={() => handleEdit(record)}
                                                    size={window.innerWidth < 768 ? 'small' : 'middle'}
                                                    style={{ backgroundColor: 'white', color: 'black', borderColor: 'black' }}
                                                >
                                                    {window.innerWidth < 768 ? '' : 'Edit'}
                                                </Button>
                                                <Button
                                                        type="primary"
                                                        danger
                                                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => showDeleteModal(record.vendor_id, selectedActivity)}
                                                    >
                                                        {window.innerWidth < 768 ? '' : 'Delete Reports'}
                                                    </Button>
                                            </Space>
                                        ),
                                    },
                                ]}
                            />
                        </TabPane>
                        <TabPane tab="Daily Income Summary" key="daily-summary">
                            <Title level={4} style={{ marginBottom: 16 }}>
                                Daily Income Summary
                            </Title>
                            {generateDailyIncomeSummary()}
                        </TabPane>
                    </Tabs>
                </Card>
            ) : selectedActivity ? (
                <Card style={{ textAlign: 'center', padding: '48px' }}>
                    <LineChartOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                    <Title level={3} type="secondary">No Sales Data Available</Title>
                    <Text type="secondary">Start by adding sales reports for this activity.</Text>
                </Card>
            ) : (
                <Card style={{ textAlign: 'center', padding: '48px' }}>
                    <SearchOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                    <Title level={3} type="secondary">Select an Activity</Title>
                    <Text type="secondary">Choose an activity to view and manage sales reports.</Text>
                </Card>
            )}

            {/* Add Sales Report Modal */}
            <Modal
                title="Add Sales Report"
                open={showReportModal}
                onCancel={() => {
                    setShowReportModal(false);
                    setFormData(prev => ({
                        ...prev,
                        vendor_id: '',
                        stall_id: '',
                        report_day: '',
                        products: []
                    }));
                    setAvailableVendors([]);
                    setAvailableStalls([]);
                    // Reset Ant Design form
                    form.resetFields();
                }}
                footer={null}
                width={window.innerWidth < 768 ? '95%' : window.innerWidth < 1024 ? '90%' : 600}
                style={{ top: window.innerWidth < 768 ? 20 : 50 }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        activity_id: selectedActivity || '',
                        vendor_id: '',
                        stall_id: '',
                        report_day: '',
                        products: []
                    }}
                >
                    <Form.Item
                        label="Activity"
                        name="activity_id"
                        rules={[{ required: true, message: 'Please select an activity' }]}
                    >
                        <Select
                            value={formData.activity_id}
                            onChange={(value) => {
                                setFormData({...formData, activity_id: value, vendor_id: '', stall_id: '', report_day: ''});
                                setExistingReportDates([]);
                                if (value) {
                                    fetchVendors(value);
                                }
                            }}
                            placeholder="Select Activity"
                            disabled={!!selectedActivity}
                        >
                            {activities.map(activity => (
                                <Option key={activity.id} value={activity.id}>
                                    {activity.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="Vendor"
                        name="vendor_id"
                        rules={[{ required: true, message: 'Please select a vendor' }]}
                    >
                        <Select
                            value={formData.vendor_id}
                            onChange={(value) => {
                                setFormData({...formData, vendor_id: value, stall_id: '', report_day: ''});
                                if (value && formData.activity_id) {
                                    fetchAvailableStalls(formData.activity_id, value);
                                    fetchVendorReportDates(formData.activity_id, value);
                                } else {
                                    setExistingReportDates([]);
                                }
                            }}
                            placeholder="Select Vendor"
                            disabled={!formData.activity_id}
                            showSearch
                            filterOption={(input, option) => {
                                const vendor = availableVendors.find(v => v.id === option.value);
                                if (!vendor) return false;
                                
                                const fullName = `${vendor.first_name} ${vendor.middle_name || ''} ${vendor.last_name}`.toLowerCase();
                                const searchInput = input.toLowerCase();
                                
                                return fullName.includes(searchInput);
                            }}
                        >
                            {availableVendors.map(vendor => (
                                <Option key={vendor.id} value={vendor.id}>
                                    {vendor.first_name} {vendor.last_name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="Stall"
                        name="stall_id"
                        rules={[{ required: true, message: 'Please select a stall' }]}
                    >
                        <Select
                            value={formData.stall_id}
                            onChange={(value) => setFormData({...formData, stall_id: value})}
                            placeholder="Select Stall"
                            disabled={!formData.vendor_id}
                        >
                            {availableStalls.map(stall => (
                                <Option key={stall.id} value={stall.id}>
                                    {stall.is_ambulant 
                                        ? `Ambulant - ${stall.stall_name || 'No name'}` 
                                        : `${stall.stall_number} - ${stall.stall_name || 'No name'}`
                                    }
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="Report Day"
                        name="report_day"
                        rules={[{ required: true, message: 'Please select a day' }]}
                    >
                        <Select
                            value={formData.report_day}
                            onChange={(value) => setFormData({...formData, report_day: value})}
                            placeholder="Select Day"
                            disabled={!formData.activity_id}
                        >
                            {getDayOptions().map(day => (
                                <Option 
                                    key={day.value} 
                                    value={day.value}
                                    disabled={day.disabled}
                                    style={{ 
                                        color: day.disabled ? '#999' : 'inherit',
                                        backgroundColor: day.disabled ? '#f5f5f5' : 'inherit'
                                    }}
                                >
                                    {day.display}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item label="Products/Services">
                        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
                            <Col xs={24} sm={12} md={8} lg={8} xl={8}><strong>Product/Service Name</strong></Col>
                            <Col xs={12} sm={6} md={4} lg={4} xl={4}><strong>Units Sold</strong></Col>
                            <Col xs={12} sm={6} md={4} lg={4} xl={4}><strong>Unit Price</strong></Col>
                            <Col xs={20} sm={8} md={6} lg={6} xl={6}><strong>Total Sales</strong></Col>
                            <Col xs={4} sm={4} md={2} lg={2} xl={2}></Col>
                        </Row>
                        {formData.products.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed #d9d9d9', borderRadius: '4px' }}>
                                <Text type="secondary">No products added yet</Text>
                            </div>
                        ) : (
                            <div>
                                {formData.products.map((product, index) => (
                                    <Row key={product.id} gutter={[8, 8]} style={{ marginBottom: 16 }}>
                                        <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                                            <Input
                                                placeholder="Product/Service Name"
                                                value={product.name}
                                                onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                                            />
                                        </Col>
                                        <Col xs={12} sm={6} md={4} lg={4} xl={4}>
                                            <InputNumber
                                                placeholder="Units Sold"
                                                value={product.unit_sold}
                                                onChange={(value) => updateProduct(product.id, 'unit_sold', value)}
                                                style={{ width: '100%' }}
                                                min={0}
                                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                                            />
                                        </Col>
                                        <Col xs={12} sm={6} md={4} lg={4} xl={4}>
                                            <InputNumber
                                                placeholder="Unit Price"
                                                value={product.unit_price}
                                                onChange={(value) => updateProduct(product.id, 'unit_price', value)}
                                                style={{ width: '100%' }}
                                                min={0}
                                                prefix="₱"
                                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                                                formatter={(value) => ` ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                parser={(value) => value.replace(/₱\s?|(,*)/g, '')}
                                            />
                                        </Col>
                                        <Col xs={20} sm={8} md={6} lg={6} xl={6}>
                                            <InputNumber
                                                placeholder="Total Sales"
                                                value={product.total_sales}
                                                disabled
                                                style={{ width: '100%', color: 'black' }}
                                                prefix="₱"
                                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                                                formatter={(value) => ` ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                parser={(value) => value.replace(/₱\s?|(,*)/g, '')}
                                            />
                                        </Col>
                                        <Col xs={4} sm={4} md={2} lg={2} xl={2}>
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => removeProduct(product.id)}
                                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                                            />
                                        </Col>
                                    </Row>
                                ))}
                            </div>
                        )}
                    </Form.Item>
                    <Form.Item>
                        <Button 
                            type="dashed" 
                            onClick={addProduct}
                            icon={<PlusOutlined />}
                            style={{ width: '100%', backgroundColor: 'white', color: 'black', borderColor: 'black' }}
                        >
                            Add Product/Service
                        </Button>
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item label="Total Sales">
                                <Input
                                    value={`₱${calculateTotalSales().toLocaleString('en-US', {minimumFractionDigits: 2})}`}
                                    readOnly
                                    style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0', fontSize: '16px', fontWeight: 'bold' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setShowReportModal(false)}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Add Report
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>


            {/* Edit Sales Report Modal */}
            <Modal
                title="Edit Sales Report"
                open={showEditModal}
                onCancel={() => setShowEditModal(false)}
                footer={[
                    <Button key="cancel" onClick={() => setShowEditModal(false)}>
                        Cancel
                    </Button>,
                    <Button key="submit" type="primary" onClick={handleEditSubmit} style={{ backgroundColor: 'white', color: 'black', borderColor: 'black' }}>
                        {window.innerWidth < 768 ? 'Update' : 'Update Sales Report'}
                    </Button>
                ]}
                width={window.innerWidth < 768 ? '95%' : window.innerWidth < 1024 ? '90%' : 800}
                style={{ top: window.innerWidth < 768 ? 20 : 50 }}
            >
                <Form layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Select Day">
                                <Select
                                    value={editFormData.report_day}
                                    onChange={(value) => {
                                        const selectedDay = editingReport?.availableDays?.find(d => d.value === value);
                                   
                                        // Calculate product totals for the selected day
                                        const productsWithTotals = (selectedDay?.products || []).map(product => {
                                            const unitSold = parseFloat(product.unit_sold) || 0;
                                            const unitPrice = parseFloat(product.unit_price) || 0;
                                            const productTotal = unitSold * unitPrice;
                                            return {
                                                ...product,
                                                total_sales: productTotal
                                            };
                                        });
                                        
                                        const calculatedTotal = productsWithTotals.reduce((sum, product) => sum + (product.total_sales || 0), 0);
                                        
                                     
                                        
                                        // Completely replace form data to ensure correct products are loaded
                                        setEditFormData({
                                            id: selectedDay.value,
                                            activity_id: selectedActivity,
                                            stall_id: editingRecord?.stall_id,
                                            vendor_id: editingRecord?.vendor_id || editingRecord?.vendor_name,
                                            report_day: value,
                                            total_sales: calculatedTotal,
                                            products: productsWithTotals
                                        });
                                    }}
                                    style={{ width: '100%' }}
                                >
                                    {editingReport?.availableDays?.map(day => (
                                        <Option key={day.value} value={day.value}>
                                            {day.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Total Sales">
                                <InputNumber
                                    placeholder="Total Sales"
                                    value={editFormData.total_sales}
                                    onChange={(value) => setEditFormData(prev => ({ ...prev, total_sales: value }))}
                                    style={{ width: '100%', color: 'black' }}
                                    prefix="₱"
                                    formatter={(value) => `₱${value.toLocaleString('en-US', {minimumFractionDigits: 2})}`}
                                    disabled
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Products/Services">
                        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
                            <Col xs={24} sm={12} md={8} lg={8} xl={8}><strong>Product/Service Name</strong></Col>
                            <Col xs={12} sm={6} md={4} lg={4} xl={4}><strong>Units Sold</strong></Col>
                            <Col xs={12} sm={6} md={4} lg={4} xl={4}><strong>Unit Price</strong></Col>
                            <Col xs={20} sm={8} md={6} lg={6} xl={6}><strong>Total Sales</strong></Col>
                            <Col xs={4} sm={4} md={2} lg={2} xl={2}></Col>
                        </Row>
                        {editFormData.products.map((product, index) => (
                            <Row key={index} gutter={[8, 8]} style={{ marginBottom: 16 }}>
                                <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                                    <Input
                                        placeholder="Product/Service Name"
                                        value={product.name}
                                        onChange={(e) => {
                                            const newProducts = [...editFormData.products];
                                            newProducts[index].name = e.target.value;
                                            const unitPrice = parseFloat(newProducts[index].unit_price) || 0;
                                            const unitSold = parseFloat(newProducts[index].unit_sold) || 0;
                                            newProducts[index].total_sales = unitPrice * unitSold;
                                            setEditFormData(prev => ({
                                                ...prev,
                                                products: newProducts,
                                                total_sales: newProducts.reduce((sum, p) => sum + (parseFloat(p.total_sales) || 0), 0)
                                            }));
                                        }}
                                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                                    />
                                </Col>
                                <Col xs={12} sm={6} md={4} lg={4} xl={4}>
                                    <InputNumber
                                        placeholder="Units Sold"
                                        value={product.unit_sold}
                                        onChange={(value) => {
                                            const newProducts = [...editFormData.products];
                                            const unitPrice = parseFloat(newProducts[index].unit_price) || 0;
                                            const unitSold = parseFloat(value) || 0;
                                            newProducts[index].unit_sold = value;
                                            newProducts[index].total_sales = unitPrice * unitSold;
                                                                            setEditFormData(prev => ({
                                                ...prev,
                                                products: newProducts,
                                                total_sales: newProducts.reduce((sum, p) => sum + (parseFloat(p.total_sales) || 0), 0)
                                            }));
                                        }}
                                        style={{ width: '100%' }}
                                        min={0}
                                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                                    />
                                </Col>
                                <Col xs={12} sm={6} md={4} lg={4} xl={4}>
                                    <InputNumber
                                        placeholder="Unit Price"
                                        value={product.unit_price}
                                        onChange={(value) => {
                                            const newProducts = [...editFormData.products];
                                            const unitPrice = parseFloat(value) || 0;
                                            const unitSold = parseFloat(newProducts[index].unit_sold) || 0;
                                            newProducts[index].unit_price = value;
                                            newProducts[index].total_sales = unitPrice * unitSold;
                                                                            setEditFormData(prev => ({
                                                ...prev,
                                                products: newProducts,
                                                total_sales: newProducts.reduce((sum, p) => sum + (parseFloat(p.total_sales) || 0), 0)
                                            }));
                                        }}
                                        style={{ width: '100%' }}
                                        min={0}
                                        prefix="₱"
                                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                                        formatter={(value) => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={(value) => value.replace(/₱\s?|(,*)/g, '')}
                                    />
                                </Col>
                                <Col xs={20} sm={8} md={6} lg={6} xl={6}>
                                    <InputNumber
                                        placeholder="Total Sales"
                                        value={product.total_sales}
                                        disabled
                                        style={{ width: '100%', color: 'black' }}
                                        prefix="₱"
                                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                                        formatter={(value) => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={(value) => value.replace(/₱\s?|(,*)/g, '')}
                                    />
                                </Col>
                                <Col xs={4} sm={4} md={2} lg={2} xl={2}>
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => {
                                            const newProducts = editFormData.products.filter((_, i) => i !== index);
                                            setEditFormData(prev => ({
                                                ...prev,
                                                products: newProducts,
                                                total_sales: newProducts.reduce((sum, p) => sum + (parseFloat(p.total_sales) || 0), 0)
                                            }));
                                        }}
                                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                                    />
                                </Col>
                            </Row>
                        ))}
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditFormData(prev => ({
                                    ...prev,
                                    products: [...prev.products, {
                                        name: '',
                                        unit_sold: 0,
                                        unit_price: 0,
                                        total_sales: 0
                                    }]
                                }));
                            }}
                            style={{ backgroundColor: 'white', color: 'black', borderColor: 'black' }}
                        >
                            Add Product/Service
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Delete Reports Modal */}
            <Modal
                title={`Delete Sales Reports - ${deleteModalData.vendor ? `${deleteModalData.vendor.first_name} ${deleteModalData.vendor.last_name}` : ''}`}
                visible={deleteModalVisible}
                onCancel={() => setDeleteModalVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setDeleteModalVisible(false)}>
                        Cancel
                    </Button>,
                    <Button 
                        key="delete" 
                        type="primary" 
                        danger 
                        onClick={handleDeleteSelectedReports}
                        disabled={deleteModalData.selectedReports.length === 0}
                    >
                        Delete Selected ({deleteModalData.selectedReports.length})
                    </Button>
                ]}
                width={600}
            >
                <div style={{ marginBottom: 16 }}>
                    <p>Select the sales reports you want to delete:</p>
                </div>
                
                {deleteModalData.reports.length > 0 ? (
                    <div style={{ 
                        border: '1px solid #d9d9d9', 
                        borderRadius: '6px', 
                        padding: '12px',
                        maxHeight: '300px',
                        overflowY: 'auto'
                    }}>
                        {deleteModalData.reports.map(report => (
                            <div key={report.report_date} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 12px',
                                backgroundColor: '#fff',
                                border: '1px solid #e8e8e8',
                                borderRadius: '4px',
                                marginBottom: '6px'
                            }}>
                                <Checkbox
                                    checked={deleteModalData.selectedReports.includes(report.report_date)}
                                    onChange={(e) => handleDeleteReportSelection(report.report_date, e.target.checked)}
                                >
                                    Day {report.day_number} ({new Date(report.report_date).toLocaleDateString('en-US', { 
                                        month: 'long', 
                                        day: 'numeric', 
                                        year: 'numeric' 
                                    })})
                                </Checkbox>
                                <span style={{ color: '#666', fontSize: '12px' }}>
                                    {report.stall_id ? `Stall ID: ${report.stall_id}` : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '40px 20px',
                        color: '#999'
                    }}>
                        No sales reports found for this vendor.
                    </div>
                )}
            </Modal>

            {/* Confirmation Modal */}
            <Modal
                title="Confirm Delete Sales Reports"
                visible={confirmDeleteVisible}
                onCancel={() => setConfirmDeleteVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setConfirmDeleteVisible(false)}>
                        Cancel
                    </Button>,
                    <Button 
                        key="delete" 
                        type="primary" 
                        danger 
                        onClick={confirmDeleteReports}
                    >
                        Confirm Delete
                    </Button>
                ]}
                width={600}
            >
                <div style={{ marginBottom: 16 }}>
                    <p>Are you sure you want to delete the following sales reports?</p>
                    <p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                        This action cannot be undone.
                    </p>
                </div>
                
                <div style={{ 
                    border: '1px solid #ffccc7', 
                    borderRadius: '6px', 
                    padding: '12px',
                    backgroundColor: '#fff2f0',
                    maxHeight: '200px',
                    overflowY: 'auto'
                }}>
                    <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#ff4d4f' }}>
                        Reports to be deleted ({deleteModalData.selectedReports.length}):
                    </div>
                    {deleteModalData.selectedReports.map(reportDate => {
                        const report = deleteModalData.reports.find(r => r.report_date === reportDate);
                        return (
                            <div key={reportDate} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '6px 12px',
                                backgroundColor: '#fff',
                                border: '1px solid #ffccc7',
                                borderRadius: '4px',
                                marginBottom: '4px'
                            }}>
                                <span>
                                    Day {report?.day_number || 'N/A'} ({new Date(reportDate).toLocaleDateString('en-US', { 
                                        month: 'long', 
                                        day: 'numeric', 
                                        year: 'numeric' 
                                    })})
                                </span>
                                <span style={{ color: '#ff4d4f', fontSize: '12px', fontWeight: 'bold' }}>
                                    {report?.stall_id ? `Stall ${report.stall_id}` : ''}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </Modal>
        
        {loading && <LoadingOverlay message="Loading Sales Reports..." />}
    </div>
    );
};

export default EventSalesReporting;
