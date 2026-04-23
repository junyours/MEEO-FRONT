import React, { useState, useEffect } from 'react';
import { Button, Table, Card, Input, InputNumber, Select, DatePicker, Modal, Form, Space, Tag, Statistic, Row, Col, Typography, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import api from '../Api';
import LoadingOverlay from './Loading';
import './EventPaymentManagement.css';
const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

// Format amount with commas
const formatAmount = (amount) => {
    const num = parseFloat(amount || 0);
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const EventPaymentManagement = () => {
    const [payments, setPayments] = useState([]);
    const [activities, setActivities] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [formData, setFormData] = useState({
        activity_id: '',
        stall_id: '',
        event_vendor_id: '',
        amount: '',
        payment_date: '',
        or_number: ''
    });
    const [availableStalls, setAvailableStalls] = useState([]);
    const [activityVendors, setActivityVendors] = useState([]);
    const [activitiesLoading, setActivitiesLoading] = useState(false);
    const [vendorsLoading, setVendorsLoading] = useState(false);
    const [stallsLoading, setStallsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterActivity, setFilterActivity] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    useEffect(() => {
        fetchPayments();
        fetchActivities();
        fetchVendors();
    }, [filterActivity, filterStatus, dateRange]);


    const fetchPayments = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filterActivity) params.append('activity_id', filterActivity);
            if (filterStatus !== 'all') params.append('status', filterStatus);
            if (dateRange.from) params.append('date_from', dateRange.from);
            if (dateRange.to) params.append('date_to', dateRange.to);
            
            const response = await api.get(`/event-payments?${params.toString()}`);
            setPayments(response.data.payments.data);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivities = async () => {
        try {
            setActivitiesLoading(true);
            const response = await api.get('/event-activities');
            setActivities(response.data.activities.data);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setActivitiesLoading(false);
        }
    };

    const fetchVendors = async () => {
        try {
            const response = await api.get('/event-vendors');
            setVendors(response.data.vendors?.data || []);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        }
    };

    const fetchVendorsByActivity = async (activityId) => {
        try {
            setVendorsLoading(true);
            const response = await api.get(`/event-payments/vendors/${activityId}`);
            setActivityVendors(response.data.vendors || []);
        } catch (error) {
            console.error('Error fetching vendors for activity:', error);
            setActivityVendors([]);
        } finally {
            setVendorsLoading(false);
        }
    };

    const fetchStallsByVendorAndActivity = async (activityId, vendorId) => {
        try {
            setStallsLoading(true);
            const response = await api.get(`/event-payments/stalls/${activityId}/${vendorId}`);
            setAvailableStalls(response.data.stalls || []);
        } catch (error) {
            console.error('Error fetching stalls for vendor:', error);
            setAvailableStalls([]);
        } finally {
            setStallsLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (editingPayment) {
                await api.put(`/event-payments/${editingPayment.id}`, values);
            } else {
                await api.post('/event-payments', values);
            }
            fetchPayments();
            resetForm();
            setShowModal(false);
        } catch (error) {
            console.error('Error saving payment:', error);
        }
    };

    const handleEdit = (payment) => {
        setEditingPayment(payment);
        const formDataValues = {
            activity_id: payment.activity_id || '',
            stall_id: payment.stall_id || '',
            event_vendor_id: payment.event_vendor_id || '',
            amount: payment.amount,
            payment_date: payment.payment_date?.split('T')[0],
            or_number: payment.or_number
        };
        setFormData(formDataValues);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        Modal.confirm({
            title: 'Are you sure you want to delete this payment?',
            content: 'This action cannot be undone.',
            okText: 'Yes',
            cancelText: 'No',
            onOk: async () => {
                try {
                    await api.delete(`/event-payments/${id}`);
                    message.success('Payment deleted successfully');
                    fetchPayments();
                } catch (error) {
                    console.error('Error deleting payment:', error);
                    message.error('Error deleting payment');
                }
            }
        });
    };

    const resetForm = () => {
        setFormData({
            activity_id: '',
            stall_id: '',
            event_vendor_id: '',
            amount: '',
            payment_date: '',
            or_number: ''
        });
        setEditingPayment(null);
        setAvailableStalls([]);
        setActivityVendors([]);
        setActivitiesLoading(false);
        setVendorsLoading(false);
        setStallsLoading(false);
    };

    const getSelectedActivity = () => {
        return activities.find(activity => activity.id === formData.activity_id);
    };

    const disabledDate = (current) => {
        if (!current || !formData.activity_id) return false;
        
        const selectedActivity = getSelectedActivity();
        if (!selectedActivity) return false;
        
        const startDate = moment(selectedActivity.start_date);
        const endDate = moment(selectedActivity.end_date);
        
        // Disable dates before start date and after end date
        return current && (current < startDate.startOf('day') || current > endDate.endOf('day'));
    };

    const filteredPayments = payments.filter(payment => {
        const matchesSearch = 
            (payment.or_number?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (payment.event_vendor?.first_name?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (payment.event_vendor?.last_name?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (payment.stall?.stall_number?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const getStatusBadge = (status) => {
        const statusClasses = {
            paid: 'badge-success',
            pending: 'badge-warning',
            cancelled: 'badge-danger'
        };
        return `badge ${statusClasses[status] || 'badge-secondary'}`;
    };

    const getTotalAmount = () => {
        return payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    };

    const getPaidAmount = () => {
        return payments
            .filter(payment => payment.status === 'paid')
            .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    };

    return (
        <div className="event-payment-management" style={{ padding: window.innerWidth < 768 ? '10px' : window.innerWidth < 1024 ? '16px' : '20px' }}>
            <Card style={{ marginBottom: 24 }}>
                <Row justify="space-between" align="middle" gutter={[16, 16]}>
                    <Col xs={24} sm={24} md={12} lg={8} xl={6}>
                        <Title level={2} style={{ margin: 0, fontSize: window.innerWidth < 768 ? '20px' : window.innerWidth < 1024 ? '22px' : '24px' }}>Event Payment Management</Title>
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={16} xl={18}>
                        <Space wrap size={[8, 8]} style={{ width: '100%', justifyContent: window.innerWidth < 768 ? 'center' : 'flex-end' }}>
                            <Button 
                                type="default" 
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    resetForm();
                                    setShowModal(true);
                                }}
                                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d9d9d9' }}
                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                            >
                                {window.innerWidth < 768 ? 'Add Payment' : 'Add New Payment'}
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                    <Card 
                        style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)'
                        }}
                    >
                        <Statistic
                            title={<span style={{ color: 'white', fontSize: window.innerWidth < 768 ? '12px' : '16px', fontWeight: 500 }}>Total Payments</span>}
                            value={formatAmount(getTotalAmount())}
                            precision={0}
                            prefix={<span style={{ color: 'white', fontSize: window.innerWidth < 768 ? '16px' : '24px', marginRight: '8px' }}>₱</span>}
                            suffix={<span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: window.innerWidth < 768 ? '12px' : '14px' }}>({payments.length} transactions)</span>}
                            valueStyle={{ color: 'white', fontSize: window.innerWidth < 768 ? '20px' : '32px', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                    <Card 
                        style={{ 
                            background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(82, 196, 26, 0.15)'
                        }}
                    >
                        <Statistic
                            title={<span style={{ color: 'white', fontSize: window.innerWidth < 768 ? '12px' : '16px', fontWeight: 500 }}>Paid Amount</span>}
                            value={formatAmount(getPaidAmount())}
                            precision={0}
                            prefix={<span style={{ color: 'white', fontSize: window.innerWidth < 768 ? '16px' : '24px', marginRight: '8px' }}>₱</span>}
                            suffix={<span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: window.innerWidth < 768 ? '12px' : '14px' }}>({payments.filter(p => p.status === 'paid').length} paid)</span>}
                            valueStyle={{ color: 'white', fontSize: window.innerWidth < 768 ? '20px' : '32px', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                    <Card 
                        style={{ 
                            background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(250, 173, 20, 0.15)'
                        }}
                    >
                        <Statistic
                            title={<span style={{ color: 'white', fontSize: window.innerWidth < 768 ? '12px' : '16px', fontWeight: 500 }}>Pending Amount</span>}
                            value={formatAmount(getTotalAmount() - getPaidAmount())}
                            precision={0}
                            prefix={<span style={{ color: 'white', fontSize: window.innerWidth < 768 ? '16px' : '24px', marginRight: '8px' }}>₱</span>}
                            suffix={<span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: window.innerWidth < 768 ? '12px' : '14px' }}>({payments.filter(p => p.status === 'pending').length} pending)</span>}
                            valueStyle={{ color: 'white', fontSize: window.innerWidth < 768 ? '20px' : '32px', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12} md={6} lg={5} xl={5}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px', color: '#000000d9', fontWeight: 500 }}>Activity</label>
                            <Select 
                                value={filterActivity}
                                onChange={(value) => setFilterActivity(value)}
                                style={{ width: '100%' }}
                                placeholder="All Activities"
                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                            >
                                <Option value="">All Activities</Option>
                                {activities.map(activity => (
                                    <Option key={activity.id} value={activity.id}>
                                        {window.innerWidth < 768 
                                            ? `${activity.name.length > 20 ? activity.name.substring(0, 20) + '...' : activity.name}`
                                            : activity.name
                                        }
                                    </Option>
                                ))}
                            </Select>
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={6} lg={4} xl={4}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px', color: '#000000d9', fontWeight: 500 }}>Status</label>
                            <Select 
                                value={filterStatus}
                                onChange={(value) => setFilterStatus(value)}
                                style={{ width: '100%' }}
                                placeholder="All Status"
                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                            >
                                <Option value="all">All Status</Option>
                                <Option value="paid">Paid</Option>
                                <Option value="pending">Pending</Option>
                                <Option value="cancelled">Cancelled</Option>
                            </Select>
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={6} lg={4} xl={4}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px', color: '#000000d9', fontWeight: 500 }}>Date From</label>
                            <DatePicker
                                value={dateRange.from ? moment(dateRange.from) : null}
                                onChange={(date, dateString) => setDateRange({...dateRange, from: dateString})}
                                style={{ width: '100%' }}
                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                            />
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={6} lg={4} xl={4}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px', color: '#000000d9', fontWeight: 500 }}>Date To</label>
                            <DatePicker
                                value={dateRange.to ? moment(dateRange.to) : null}
                                onChange={(date, dateString) => setDateRange({...dateRange, to: dateString})}
                                style={{ width: '100%' }}
                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                            />
                        </div>
                    </Col>
                    <Col xs={24} sm={24} md={24} lg={7} xl={7}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px', color: '#000000d9', fontWeight: 500 }}>Search Payment</label>
                            <Search
                                placeholder="Search payments..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                prefix={<SearchOutlined />}
                                style={{ width: '100%' }}
                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                            />
                        </div>
                    </Col>
                </Row>
            </Card>

            <Card>
                <Table
                    dataSource={filteredPayments}
                    rowKey="id"
                    pagination={{ 
                        pageSize: window.innerWidth < 768 ? 5 : window.innerWidth < 1024 ? 8 : 10,
                        showSizeChanger: window.innerWidth >= 768,
                        showQuickJumper: window.innerWidth >= 768,
                        showTotal: (total, range) => window.innerWidth < 768 ? `${range[0]}-${range[1]} of ${total}` : `${range[0]}-${range[1]} of ${total} items`
                    }}
                    scroll={{ x: window.innerWidth < 768 ? 800 : 1000 }}
                    size={window.innerWidth < 768 ? 'small' : 'middle'}
                    columns={[
                        {
                            title: 'OR Number',
                            dataIndex: 'or_number',
                            key: 'or_number',
                            render: (text) => text || '-'
                        },
                        {
                            title: 'Activity',
                            dataIndex: ['activity', 'name'],
                            key: 'activity',
                            render: (text) => text || '-'
                        },
                        {
                            title: 'Stall #',
                            dataIndex: ['stall', 'stall_number'],
                            key: 'stall_number',
                            render: (text) => text || '-'
                        },
                        {
                            title: 'Vendor',
                            key: 'vendor',
                            render: (_, record) => record.event_vendor ? 
                                `${record.event_vendor.first_name} ${record.event_vendor.last_name}` : 
                                '-'
                        },
                        {
                            title: 'Amount',
                            dataIndex: 'amount',
                            key: 'amount',
                            render: (amount) => `₱${formatAmount(amount)}`
                        },
                        {
                            title: 'Payment Date',
                            dataIndex: 'payment_date',
                            key: 'payment_date',
                            render: (date) => new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).replace(',', ',')
                        },
                        {
                            title: 'Status',
                            dataIndex: 'status',
                            key: 'status',
                            render: (status) => {
                                const color = status === 'paid' ? 'green' : status === 'pending' ? 'orange' : 'red';
                                return <Tag color={color}>{status}</Tag>;
                            }
                        },
                        {
                            title: 'Actions',
                            key: 'actions',
                            render: (_, record) => (
                                <Space>
                                    <Button 
                                        type="default" 
                                        size="small" 
                                        icon={<EditOutlined />}
                                        onClick={() => handleEdit(record)}
                                        style={{ backgroundColor: 'white', color: 'black', borderColor: '#d9d9d9' }}
                                    >
                                        Edit
                                    </Button>
                                    <Button 
                                        type="primary" 
                                        danger 
                                        size="small" 
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleDelete(record.id)}
                                    >
                                        Delete
                                    </Button>
                                </Space>
                            )
                        }
                    ]}
                />
            </Card>

            <Modal
                title={editingPayment ? 'Edit Payment' : 'Add New Payment'}
                open={showModal}
                onCancel={() => setShowModal(false)}
                footer={null}
                width={600}
            >
                <Form
                    onFinish={handleSubmit}
                    layout="vertical"
                    initialValues={{
                        ...formData,
                        payment_date: formData.payment_date ? moment(formData.payment_date) : null
                    }}
                >
                    <Form.Item
                        label="Activity"
                        name="activity_id"
                        rules={[{ required: true, message: 'Please select an activity' }]}
                    >
                        <Select
                            placeholder="Select Activity"
                            loading={activitiesLoading}
                            onChange={(value) => {
                                const newFormData = {
                                    ...formData, 
                                    activity_id: value, 
                                    event_vendor_id: '',
                                    stall_id: ''
                                };
                                
                                // Reset payment date if it's outside the new activity's date range
                                if (value && formData.payment_date) {
                                    const selectedActivity = activities.find(activity => activity.id === value);
                                    if (selectedActivity) {
                                        const paymentDate = moment(formData.payment_date);
                                        const startDate = moment(selectedActivity.start_date);
                                        const endDate = moment(selectedActivity.end_date);
                                        
                                        if (paymentDate < startDate.startOf('day') || paymentDate > endDate.endOf('day')) {
                                            newFormData.payment_date = '';
                                        }
                                    }
                                } else if (!value) {
                                    newFormData.payment_date = '';
                                }
                                
                                setFormData(newFormData);
                                
                                if (value) {
                                    fetchVendorsByActivity(value);
                                } else {
                                    setActivityVendors([]);
                                    setAvailableStalls([]);
                                }
                            }}
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
                        name="event_vendor_id"
                        rules={[{ required: true, message: 'Please select a vendor' }]}
                    >
                        <Select
                            placeholder="Select Vendor"
                            loading={vendorsLoading}
                            onChange={(value) => {
                               
                                setFormData({
                                    ...formData, 
                                    event_vendor_id: value,
                                    stall_id: ''
                                });
                                if (value && formData.activity_id) {
                                    fetchStallsByVendorAndActivity(formData.activity_id, value);
                                } else {
                                    setAvailableStalls([]);
                                }
                            }}
                            disabled={!formData.activity_id}
                            notFoundContent={vendorsLoading ? "Loading vendors..." : "No vendors available for this activity"}
                        >
                            {activityVendors.map(vendor => (
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
                            placeholder="Select Stall"
                            loading={stallsLoading}
                            onChange={(value) => setFormData({...formData, stall_id: value})}
                            disabled={!formData.event_vendor_id}
                            notFoundContent={stallsLoading ? "Loading stalls..." : "No stalls available for this vendor"}
                        >
                            {availableStalls.map(stall => (
                                <Option key={stall.id} value={stall.id}>
                                    {stall.stall_number} - {stall.stall_name || 'No name'}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Amount"
                                name="amount"
                                rules={[{ required: true, message: 'Please enter amount' }]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    min={0}
                                    step={0.01}
                                    placeholder="Enter amount"
                                    value={formData.amount ? parseFloat(formData.amount) : 0}
                                    onChange={(value) => setFormData({...formData, amount: value})}
                                    formatter={(value) => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(value) => value.replace(/₱\s?|(,*)/g, '')}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Payment Date"
                                name="payment_date"
                                rules={[{ required: true, message: 'Please select payment date' }]}
                            >
                                <DatePicker
                                    style={{ width: '100%' }}
                                    onChange={(date, dateString) => setFormData({...formData, payment_date: dateString})}
                                    disabledDate={disabledDate}
                                    placeholder={formData.activity_id ? "Select payment date" : "Select activity first"}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                       
                    <Form.Item
                        label="OR Number"
                        name="or_number"
                    >
                        <Input
                            placeholder="Enter OR Number"
                            onChange={(e) => setFormData({...formData, or_number: e.target.value})}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editingPayment ? 'Update' : 'Create'} Payment
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        
        {loading && <LoadingOverlay message="Loading Payments..." />}
        </div>
    );
};

export default EventPaymentManagement;
