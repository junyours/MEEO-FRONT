import React, { useState, useEffect } from 'react';
import api from '../Api';
import LoadingOverlay from './Loading';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Space, Button, Table, Card, Typography, Select, Row, Col, Statistic, Modal, Form, Input, InputNumber, message, Tag, Spin, Empty, Popconfirm, Tabs } from 'antd';
import { PlusOutlined, SyncOutlined, HistoryOutlined, ShopOutlined, DollarOutlined, LineChartOutlined, TrophyOutlined, CloseOutlined, SearchOutlined, EditOutlined, DeleteOutlined, UserOutlined, FilePdfOutlined } from '@ant-design/icons';
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
    const [editingReport, setEditingReport] = useState(null);
    const [editingRecord, setEditingRecord] = useState(null);

    // Helper function to format amount with commas and 2 decimal places
    const formatAmount = (amount) => {
        if (amount === 0 || amount === '0' || amount === null || amount === undefined) {
            return '-';
        }
        const num = parseFloat(amount);
        if (isNaN(num)) return '-';
        return `P${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

    // Helper function for drawing tables with borders - completely redesigned
    const drawTable = (doc, startY, headers, data) => {
        let currentY = startY;
        const baseCellHeight = 6; // Base height for single-line cells
        const cellPadding = 2;
        
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
        data.forEach(row => {
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
            setActivities(response.data.activities.data);
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
            const response = await api.get(`/event-vendors?activity_id=${activityId}`);
            setAvailableVendors(response.data.vendors.data || []);
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
    
            days.push({
                value: dateISO,
                label: `Day ${dayNumber}`,
                display: `Day ${dayNumber} (${formattedDate})`
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
            doc.setFontSize(20);
            doc.text('Event Sales Report', 105, 20, { align: 'center' });
            
            // Add activity info
            doc.setFontSize(12);
            doc.text(`Activity: ${activity.name}`, 15, 35);
            doc.setFontSize(10);
            doc.text(`Location: ${activity.location}`, 15, 45);
            doc.text(`Period: ${formatDatePeriod(activity.start_date, activity.end_date)}`, 15, 55);
            
            let yPosition = 70;
            
            // Fixed Stalls Table with borders
            const fixedStalls = salesData.filter(stall => !stall.is_ambulant || stall.is_ambulant === false || stall.is_ambulant === 0);
            if (fixedStalls.length > 0) {
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
                    // Dynamic page-break check based on estimated table height
                    const estimatedTableHeight = table.data.length * 8 + 20; // Estimate: 8 units per row + headers + spacing
                    const pageHeight = doc.internal.pageSize.height;
                    const bottomMargin = 30;
                    
                    if (yPosition + estimatedTableHeight > pageHeight - bottomMargin) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    
                    // Add table title if multiple chunks
                    if (fixedTables.length > 1) {
                        doc.setFontSize(12);
                        doc.text(`Fixed Stalls - Days ${index * 5 + 1}-${Math.min((index + 1) * 5, totalDays)}`, 15, yPosition);
                        yPosition += 8;
                    } else {
                        doc.setFontSize(14);
                        doc.text('Fixed Stalls', 15, yPosition);
                        yPosition += 10;
                    }
                    
                    // Draw table chunk
                    yPosition = drawTable(doc, yPosition, table.headers, table.data);
                    yPosition += 12; // Spacing between tables
                });
                
                yPosition += 15;
            }
            
            // Ambulant Stalls Table with borders
            const ambulantStalls = salesData.filter(stall => stall.is_ambulant === true || stall.is_ambulant === 1);
            if (ambulantStalls.length > 0) {
                // Check if we need a new page
                if (yPosition > 200) {
                    doc.addPage();
                    yPosition = 20;
                }
                
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
                    // Dynamic page-break check based on estimated table height
                    const estimatedTableHeight = table.data.length * 8 + 20; // Estimate: 8 units per row + headers + spacing
                    const pageHeight = doc.internal.pageSize.height;
                    const bottomMargin = 30;
                    
                    if (yPosition + estimatedTableHeight > pageHeight - bottomMargin) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    
                    // Add table title if multiple chunks
                    if (ambulantTables.length > 1) {
                        doc.setFontSize(12);
                        doc.text(`Ambulant Stalls - Days ${index * 5 + 1}-${Math.min((index + 1) * 5, totalDays)}`, 15, yPosition);
                        yPosition += 8;
                    } else {
                        doc.setFontSize(14);
                        doc.text('Ambulant Stalls', 15, yPosition);
                        yPosition += 10;
                    }
                    
                    // Draw table chunk
                    yPosition = drawTable(doc, yPosition, table.headers, table.data);
                    yPosition += 12; // Spacing between tables
                });
                
                yPosition += 15;
            }
            
            // Daily Income Summary Table with borders
            if (yPosition > 200) {
                doc.addPage();
                yPosition = 20;
            }
            
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

            {selectedActivity && summary && (
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                        <Card 
                            style={{ 
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)'
                            }}
                        >
                            <Statistic
                                title={<span style={{ color: 'white', fontSize: window.innerWidth < 768 ? '12px' : '16px', fontWeight: 500 }}>Total Stalls</span>}
                                value={summary.total_stalls || 0}
                                valueStyle={{ color: 'white', fontSize: window.innerWidth < 768 ? '20px' : '32px', fontWeight: 'bold' }}
                                prefix={<ShopOutlined style={{ color: 'white', fontSize: window.innerWidth < 768 ? '16px' : '24px', marginRight: '8px' }} />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                        <Card 
                            style={{ 
                                background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 4px 20px rgba(82, 196, 26, 0.15)'
                            }}
                        >
                            <Statistic
                                title={<span style={{ color: 'white', fontSize: window.innerWidth < 768 ? '12px' : '16px', fontWeight: 500 }}>Total Sales</span>}
                                value={summary.total_sales || 0}
                                precision={2}
                                prefix={<span style={{ color: 'white', fontSize: window.innerWidth < 768 ? '16px' : '24px', marginRight: '8px' }}>₱</span>}
                                valueStyle={{ color: 'white', fontSize: window.innerWidth < 768 ? '20px' : '32px', fontWeight: 'bold' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                        <Card 
                            style={{ 
                                background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 4px 20px rgba(250, 173, 20, 0.15)'
                            }}
                        >
                            <Statistic
                                title={<span style={{ color: 'white', fontSize: window.innerWidth < 768 ? '12px' : '16px', fontWeight: 500 }}>Lowest Sales</span>}
                                value={summary.lowest_sales || 0}
                                precision={2}
                                prefix={<span style={{ color: 'white', fontSize: window.innerWidth < 768 ? '16px' : '24px', marginRight: '8px' }}>₱</span>}
                                valueStyle={{ color: 'white', fontSize: window.innerWidth < 768 ? '20px' : '32px', fontWeight: 'bold' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                        <Card 
                            style={{ 
                                background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 4px 20px rgba(255, 77, 79, 0.15)'
                            }}
                        >
                            <Statistic
                                title={<span style={{ color: 'white', fontSize: window.innerWidth < 768 ? '12px' : '16px', fontWeight: 500 }}>Highest Sale</span>}
                                value={summary.highest_sales || 0}
                                precision={2}
                                prefix={<span style={{ color: 'white', fontSize: window.innerWidth < 768 ? '16px' : '24px', marginRight: '8px' }}>₱</span>}
                                valueStyle={{ color: 'white', fontSize: window.innerWidth < 768 ? '20px' : '32px', fontWeight: 'bold' }}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {!loading && salesData.length > 0 ? (
                <Card>
                    <Tabs defaultActiveKey="all" style={{ marginBottom: 16 }}>
                        <TabPane tab="All Stalls" key="all">
                            <Title level={4} style={{ marginBottom: 16 }}>
                                All Stalls Sales Reporting
                            </Title>
                            <Table
                                dataSource={salesData}
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
                                                <Popconfirm
                                                    title="Are you sure you want to delete this sales report?"
                                                    description="This action cannot be undone."
                                                    onConfirm={() => handleDelete(record)}
                                                    okText="Yes"
                                                    cancelText="No"
                                                >
                                                    <Button
                                                        type="primary"
                                                        danger
                                                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                                                        icon={<DeleteOutlined />}
                                                    >
                                                        {window.innerWidth < 768 ? '' : 'Delete'}
                                                    </Button>
                                                </Popconfirm>
                                            </Space>
                                        ),
                                    },
                                ]}
                            />
                        </TabPane>
                        <TabPane tab="Fixed Stalls" key="fixed">
                            <Title level={4} style={{ marginBottom: 16 }}>
                                Fixed Stalls Sales Reporting
                            </Title>
                            <Table
                                dataSource={salesData.filter(stall => !stall.is_ambulant || stall.is_ambulant === false || stall.is_ambulant === 0)}
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
                                                <Popconfirm
                                                    title="Are you sure you want to delete this sales report?"
                                                    description="This action cannot be undone."
                                                    onConfirm={() => handleDelete(record)}
                                                    okText="Yes"
                                                    cancelText="No"
                                                >
                                                    <Button
                                                        type="primary"
                                                        danger
                                                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                                                        icon={<DeleteOutlined />}
                                                    >
                                                        {window.innerWidth < 768 ? '' : 'Delete'}
                                                    </Button>
                                                </Popconfirm>
                                            </Space>
                                        ),
                                    },
                                ]}
                            />
                        </TabPane>
                        <TabPane tab="Ambulant Stalls" key="ambulant">
                            <Title level={4} style={{ marginBottom: 16 }}>
                                Ambulant Stalls Sales Reporting
                            </Title>
                            <Table
                                dataSource={salesData.filter(stall => stall.is_ambulant === true || stall.is_ambulant === 1)}
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
                                                <Popconfirm
                                                    title="Are you sure you want to delete this sales report?"
                                                    description="This action cannot be undone."
                                                    onConfirm={() => handleDelete(record)}
                                                    okText="Yes"
                                                    cancelText="No"
                                                >
                                                    <Button
                                                        type="primary"
                                                        danger
                                                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                                                        icon={<DeleteOutlined />}
                                                    >
                                                        {window.innerWidth < 768 ? '' : 'Delete'}
                                                    </Button>
                                                </Popconfirm>
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
                                setFormData({...formData, activity_id: value, vendor_id: '', stall_id: ''});
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
                                setFormData({...formData, vendor_id: value, stall_id: ''});
                                if (value && formData.activity_id) {
                                    fetchAvailableStalls(formData.activity_id, value);
                                }
                            }}
                            placeholder="Select Vendor"
                            disabled={!formData.activity_id}
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
                                <Option key={day.value} value={day.value}>
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
        
        {loading && <LoadingOverlay message="Loading Sales Reports..." />}
    </div>
    );
};

export default EventSalesReporting;
