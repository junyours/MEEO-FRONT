import React, { useState, useEffect } from 'react';
import {
    Layout,
    Card,
    Table,
    Button,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    Switch,
    message,
    Typography,
    Space,
    Tag,
    Tooltip,
    Row,
    Col,
    Spin,
    DatePicker,
} from 'antd';

import {
    EditOutlined,
    PlusOutlined,
    DeleteOutlined,
    UserAddOutlined,
    UserDeleteOutlined,
    CloseOutlined,
    SaveOutlined,
    SearchOutlined,
    ShopOutlined,
} from '@ant-design/icons';


import api from '../Api';
import StallsGrid from './StallsGrid';
import LoadingOverlay from './Loading';
import dayjs from 'dayjs';
import './EventStallManagement.css';
const { Title } = Typography;

const EventStallManagement = () => {
    const [stalls, setStalls] = useState([]);
    const [activities, setActivities] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [editingStall, setEditingStall] = useState(null);
    const [selectedStall, setSelectedStall] = useState(null);
    const [showStallsModal, setShowStallsModal] = useState(false);
    const [selectedActivityForStalls, setSelectedActivityForStalls] = useState(null);
    const [formData, setFormData] = useState({
        activity_id: '',
        stall_number: '',
        is_ambulant: false,
        stall_name: '',
        description: '',
        size: '',
        location: '',
        daily_rate: '',
        status: 'available',
        row_position: '',
        column_position: ''
    });
    const [assignFormData, setAssignFormData] = useState({
        vendor_id: '',
        start_date: '',
        end_date: '',
        notes: ''
    });
    const [availableStalls, setAvailableStalls] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [selectedActivity, setSelectedActivity] = useState('');
    const [form] = Form.useForm();
    const [assignForm] = Form.useForm();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const activityId = urlParams.get('activity_id');
       
        if (activityId) {
            setSelectedActivity(activityId);
            setFormData(prev => ({ ...prev, activity_id: activityId }));
        }
        fetchStalls();
        fetchActivities();
        fetchVendors();
    }, []);

    useEffect(() => {
        fetchStalls();
    }, [selectedActivity, filterStatus, filterType]);

    const fetchStalls = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedActivity) params.append('activity_id', selectedActivity);
            if (filterStatus !== 'all') params.append('status', filterStatus);
            
            const response = await api.get(`/event-stalls?${params.toString()}`);
            const allStalls = response.data.stalls?.data || response.data.stalls || [];
            setStalls(allStalls);
        } catch (error) {
            console.error('Error fetching stalls:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivities = async () => {
        try {
            const response = await api.get('/event-activities/active');
            setActivities(response.data.activities);
        } catch (error) {
            console.error('Error fetching activities:', error);
        }
    };

    const fetchVendors = async () => {
        try {
            // Fetch from event_vendors table since vendor_details is for market only
            const response = await api.get('/event-vendors');
        
            
            // Extract vendors from paginated response: response.data.vendors.data
            let vendorsData = [];
            if (response.data && response.data.vendors && Array.isArray(response.data.vendors.data)) {
                vendorsData = response.data.vendors.data;
            } else if (Array.isArray(response.data)) {
                vendorsData = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                vendorsData = response.data.data;
            }
            
         
            setVendors(vendorsData);
        } catch (error) {
            console.error('Error fetching event vendors:', error);
            setVendors([]); // Ensure vendors is always an array
        }
    };

    const fetchAvailableStalls = async (activityId) => {
        try {
            const response = await api.get(`/event-stalls/available/${activityId}`);
            setAvailableStalls(response.data.stalls);
        } catch (error) {
            console.error('Error fetching available stalls:', error);
        }
    };

    const handleSubmit = async (values) => {
        try {
            // Add activity_id to the form values
            const submissionData = {
                ...values,
                activity_id: selectedActivity
            };
            
            if (editingStall) {
                await api.put(`/event-stalls/${editingStall.id}`, submissionData);
                message.success('Stall updated successfully');
            } else {
                await api.post('/event-stalls', submissionData);
                message.success('Stall created successfully');
            }
            fetchStalls();
            resetForm();
            setShowModal(false);
        } catch (error) {
            console.error('Error saving stall:', error);
            message.error('Failed to save stall');
        }
    };

    const handleAssignSubmit = async (values) => {
        try {
            const assignmentData = {
                vendor_id: parseInt(values.vendor_id),
                start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
                end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
                notes: values.notes || null
            };
            
            await api.post(`/event-stalls/${selectedStall.id}/assign-vendor`, assignmentData);
            
            message.success('Vendor assigned successfully');
            fetchStalls();
            setShowAssignModal(false);
            setSelectedStall(null);
            assignForm.resetFields();
        } catch (error) {
            console.error('Error assigning vendor:', error);
            message.error('Failed to assign vendor');
        }
    };

    const handleEdit = (stall) => {
        setEditingStall(stall);
        setFormData({
            activity_id: stall.activity_id,
            stall_number: stall.stall_number,
            is_ambulant: stall.is_ambulant || false,
            stall_name: stall.stall_name,
            description: stall.description,
            size: stall.size,
            location: stall.location,
            daily_rate: stall.daily_rate,
            status: stall.status,
            row_position: stall.row_position || '',
            column_position: stall.column_position || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this stall?')) {
            try {
                await api.delete(`/event-stalls/${id}`);
                fetchStalls();
            } catch (error) {
                console.error('Error deleting stall:', error);
            }
        }
    };

    const handleAssignVendor = (stall) => {
        setSelectedStall(stall);
        const activity = activities.find(a => a.id === stall.activity_id);
        setAssignFormData({
            vendor_id: '',
            start_date: activity?.start_date ? dayjs(activity.start_date) : null,
            end_date: activity?.end_date ? dayjs(activity.end_date) : null,
            notes: ''
        });
        setShowAssignModal(true);
    };

    const handleReleaseStall = async (stallId) => {
        if (window.confirm('Are you sure you want to release this stall?')) {
            try {
                await api.post(`/event-stalls/${stallId}/release`);
                fetchStalls();
            } catch (error) {
                console.error('Error releasing stall:', error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            activity_id: selectedActivity || '',
            stall_number: '',
            is_ambulant: false,
            stall_name: '',
            description: '',
            size: '',
            location: '',
            daily_rate: '',
            status: 'available',
            row_position: '',
            column_position: ''
        });
        setEditingStall(null);
    };

    const filteredStalls = stalls.filter(stall => {
        const matchesStatus = filterStatus === 'all' || stall.status === filterStatus;
        const matchesType = filterType === 'all' || 
                           (filterType === 'ambulant' && stall.is_ambulant) || 
                           (filterType === 'fixed' && !stall.is_ambulant);
        return matchesStatus && matchesType;
    });

    const ambulantStalls = stalls.filter(stall => stall.is_ambulant);
    const fixedStalls = stalls.filter(stall => !stall.is_ambulant).sort((a, b) => {
        // Convert stall numbers to integers for proper numeric sorting
        const numA = parseInt(a.stall_number) || 0;
        const numB = parseInt(b.stall_number) || 0;
        return numA - numB;
    });

    const getStatusBadge = (status) => {
        const statusClasses = {
            available: 'badge-success',
            occupied: 'badge-info',
            maintenance: 'badge-warning',
            reserved: 'badge-secondary'
        };
        return `badge ${statusClasses[status] || 'badge-secondary'}`;
    };

    const columns = [
        {
            title: 'Stall #',
            dataIndex: 'stall_number',
            key: 'stall_number',
            render: (text, record) => {
                if (record.is_ambulant) {
                    return <span style={{ color: '#ff6b35', fontWeight: 'bold' }}>AMBULANT</span>;
                }
                return <strong>{text || '-'}</strong>;
            },
        },
        {
            title: 'Name',
            dataIndex: 'stall_name',
            key: 'stall_name',
            render: (text) => text || '-',
        },
        {
            title: 'Activity',
            dataIndex: ['activity', 'name'],
            key: 'activity',
            render: (text) => text || '-',
        },
        {
            title: 'Size',
            dataIndex: 'size',
            key: 'size',
        },
        {
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
            render: (text) => text || '-',
        },
        {
            title: 'Position',
            dataIndex: 'row_position',
            key: 'position',
            render: (text, record) => {
                return record.row_position && record.column_position ? 
                    `R${record.row_position}C${record.column_position}` : '-';
            },
        },
        {
            title: 'Daily Rate',
            dataIndex: 'daily_rate',
            key: 'daily_rate',
            render: (text) => `₱${text}`,
        },
        {
            title: 'Total Rent',
            dataIndex: 'total_rent',
            key: 'total_rent',
            render: (text) => `₱${text}`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const statusColors = {
                    available: 'green',
                    occupied: 'blue',
                    maintenance: 'orange',
                    reserved: 'default'
                };
                return <Tag color={statusColors[status] || 'default'}>{status}</Tag>;
            },
        },
        {
            title: 'Assigned Vendor',
            dataIndex: 'assigned_vendor',
            key: 'assigned_vendor',
            render: (assigned_vendor) => {
                if (!assigned_vendor) return '-';
                
                // EventVendor model uses first_name, middle_name, last_name
                if (assigned_vendor.first_name) {
                    const middleName = assigned_vendor.middle_name ? ` ${assigned_vendor.middle_name}` : '';
                    return `${assigned_vendor.first_name}${middleName} ${assigned_vendor.last_name}`;
                }
                
                return 'Vendor Assigned';
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                    {record.status === 'available' && (
                        <Tooltip title="Assign Vendor">
                            <Button 
                                type="primary" 
                                size="small"
                                icon={<UserAddOutlined />}
                                onClick={() => handleAssignVendor(record)}
                            />
                        </Tooltip>
                    )}
                    {record.status === 'occupied' && (
                        <Tooltip title="Release Stall">
                            <Button 
                                type="default" 
                                size="small"
                                danger
                                icon={<UserDeleteOutlined />}
                                onClick={() => handleReleaseStall(record.id)}
                            />
                        </Tooltip>
                    )}
                    <Tooltip title="Edit">
                        <Button 
                            type="default" 
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button 
                            type="primary" 
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record.id)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div className="event-stall-management" style={{ padding: window.innerWidth < 768 ? '10px' : window.innerWidth < 1024 ? '16px' : '20px' }}>
            <Card style={{ marginBottom: 24 }}>
                <Row justify="space-between" align="middle" gutter={[16, 16]}>
                    <Col xs={24} sm={24} md={12} lg={8} xl={6}>
                        <Title level={2} style={{ margin: 0, fontSize: window.innerWidth < 768 ? '20px' : window.innerWidth < 1024 ? '22px' : '24px' }}>Event Stall Management</Title>
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={16} xl={18}>
                        <Space wrap size={[8, 8]} style={{ width: '100%', justifyContent: window.innerWidth < 768 ? 'center' : 'flex-end' }}>
                            <Button 
                                type="primary" 
                                icon={<PlusOutlined />}
                                disabled={!selectedActivity}
                                onClick={() => {
                                    resetForm();
                                    setShowModal(true);
                                }}
                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                            >
                                {window.innerWidth < 768 ? 'Add Stall' : 'Add New Stall'}
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Card style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px', color: '#000000d9', fontWeight: 500 }}>Select Activity</label>
                            <Select
                                placeholder="Select Activity"
                                value={selectedActivity}
                                onChange={setSelectedActivity}
                                style={{ width: '100%' }}
                                allowClear
                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                            >
                                <Select.Option value="">All Activities</Select.Option>
                                {activities.map(activity => (
                                    <Select.Option key={activity.id} value={activity.id}>
                                        {window.innerWidth < 768 
                                            ? `${activity.name.length > 25 ? activity.name.substring(0, 25) + '...' : activity.name}`
                                            : activity.name
                                        }
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px', color: '#000000d9', fontWeight: 500 }}>Select Status</label>
                            <Select
                                placeholder="Select Status"
                                value={filterStatus}
                                onChange={setFilterStatus}
                                style={{ width: '100%' }}
                                allowClear
                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                            >
                                <Select.Option value="all">All Status</Select.Option>
                                <Select.Option value="available">Available</Select.Option>
                                <Select.Option value="occupied">Occupied</Select.Option>
                            <Select.Option value="maintenance">Maintenance</Select.Option>
                            <Select.Option value="reserved">Reserved</Select.Option>
                            </Select>
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px', color: '#000000d9', fontWeight: 500 }}>Stall Type</label>
                            <Select
                                placeholder="Stall Type"
                                value={filterType}
                                onChange={setFilterType}
                                style={{ width: '100%' }}
                                allowClear
                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                            >
                                <Select.Option value="all">All Types</Select.Option>
                                <Select.Option value="fixed">Fixed Stalls</Select.Option>
                                <Select.Option value="ambulant">Ambulant Stalls</Select.Option>
                            </Select>
                        </div>
                    </Col>
                </Row>

                {filterType === 'all' && (
                    <>
                        <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
                            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                                <Card 
                                    title={<span><ShopOutlined /> Fixed Stalls</span>}
                                    size={window.innerWidth < 768 ? 'small' : 'middle'}
                                    style={{ backgroundColor: '#f0f8ff' }}
                                >
                                    <p><strong>Total Fixed Stalls:</strong> {fixedStalls.length}</p>
                                    <p><strong>Available:</strong> {fixedStalls.filter(s => s.status === 'available').length}</p>
                                    <p><strong>Occupied:</strong> {fixedStalls.filter(s => s.status === 'occupied').length}</p>
                                </Card>
                            </Col>
                            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                                <Card 
                                    title={<span style={{ color: '#ff6b35' }}>Ambulant Stalls</span>}
                                    size={window.innerWidth < 768 ? 'small' : 'middle'}
                                    style={{ backgroundColor: '#fff5f0' }}
                                >
                                    <p><strong>Total Ambulant Stalls:</strong> {ambulantStalls.length}</p>
                                    <p><strong>Available:</strong> {ambulantStalls.filter(s => s.status === 'available').length}</p>
                                    <p><strong>Occupied:</strong> {ambulantStalls.filter(s => s.status === 'occupied').length}</p>
                                </Card>
                            </Col>
                        </Row>
                        
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <Card 
                                    title={<span><ShopOutlined /> Fixed Stalls</span>}
                                    size={window.innerWidth < 768 ? 'small' : 'middle'}
                                    style={{ backgroundColor: '#f0f8ff', marginBottom: '16px' }}
                                >
                                    <Table
                                        columns={columns}
                                        dataSource={fixedStalls}
                                        rowKey="id"
                                        pagination={{ 
                                            pageSize: window.innerWidth < 768 ? 3 : 5,
                                            showSizeChanger: window.innerWidth >= 768,
                                            showTotal: (total, range) => window.innerWidth < 768 ? `${range[0]}-${range[1]} of ${total}` : `${range[0]}-${range[1]} of ${total} items`
                                        }}
                                        scroll={{ x: window.innerWidth < 768 ? 800 : 1200 }}
                                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                                    />
                                </Card>
                            </Col>
                        </Row>
                        
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <Card 
                                    title={<span style={{ color: '#ff6b35' }}>Ambulant Stalls</span>}
                                    size={window.innerWidth < 768 ? 'small' : 'middle'}
                                    style={{ backgroundColor: '#fff5f0' }}
                                >
                                    <Table
                                        columns={columns}
                                        dataSource={ambulantStalls}
                                        rowKey="id"
                                        pagination={{ 
                                            pageSize: window.innerWidth < 768 ? 3 : 5,
                                            showSizeChanger: window.innerWidth >= 768,
                                            showTotal: (total, range) => window.innerWidth < 768 ? `${range[0]}-${range[1]} of ${total}` : `${range[0]}-${range[1]} of ${total} items`
                                        }}
                                        scroll={{ x: window.innerWidth < 768 ? 800 : 1200 }}
                                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </>
                )}
                
                {filterType !== 'all' && (
                    <Table
                        columns={columns}
                        dataSource={filteredStalls}
                        rowKey="id"
                        pagination={{ 
                            pageSize: window.innerWidth < 768 ? 5 : window.innerWidth < 1024 ? 8 : 10,
                            showSizeChanger: window.innerWidth >= 768,
                            showQuickJumper: window.innerWidth >= 768,
                            showTotal: (total, range) => window.innerWidth < 768 ? `${range[0]}-${range[1]} of ${total}` : `${range[0]}-${range[1]} of ${total} items`
                        }}
                        scroll={{ x: window.innerWidth < 768 ? 800 : 1200 }}
                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                    />
                )}
            </Card>

            {/* Add/Edit Stall Modal */}
            {showModal && (
                <Modal
                    title={editingStall ? 'Edit Stall' : 'Add New Stall'}
                    open={showModal}
                    onCancel={() => setShowModal(false)}
                    width={window.innerWidth < 768 ? '95%' : window.innerWidth < 1024 ? '90%' : 600}
                    style={{ top: window.innerWidth < 768 ? 20 : 50 }}
                    footer={[
                        <Button key="cancel" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>,
                        <Button key="submit" type="primary" htmlType="submit" onClick={() => form.submit()}>
                            {editingStall ? 'Update Stall' : 'Create Stall'}
                        </Button>,
                    ]}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        initialValues={formData}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="is_ambulant"
                                    label="Ambulant Stall"
                                    valuePropName="checked"
                                >
                                    <Switch 
                                        onChange={(checked) => {
                                            if (checked) {
                                                form.setFieldsValue({ stall_number: null });
                                            }
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="stall_number"
                                    label="Stall Number"
                                    rules={[
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (getFieldValue('is_ambulant')) {
                                                    return Promise.resolve();
                                                }
                                                if (!value || value.trim() === '') {
                                                    return Promise.reject(new Error('Please enter stall number'));
                                                }
                                                return Promise.resolve();
                                            },
                                        }),
                                    ]}
                                >
                                    <Input disabled={form.getFieldValue('is_ambulant')} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    name="stall_name"
                                    label="Stall Name"
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="description"
                            label="Description"
                        >
                            <Input.TextArea rows={3} />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="size"
                                    label="Size"
                                    rules={[{ required: true, message: 'Please enter size' }]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="location"
                                    label="Location"
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="daily_rate"
                                    label="Daily Rate"
                                    rules={[{ required: true, message: 'Please enter daily rate' }]}
                                >
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        min={0}
                                        step={0.01}
                                        formatter={value => `₱${value}`}
                                        parser={value => value.replace('₱', '')}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="status"
                                    label="Status"
                                >
                                    <Select>
                                        <Select.Option value="available">Available</Select.Option>
                                        <Select.Option value="occupied">Occupied</Select.Option>
                                        <Select.Option value="maintenance">Maintenance</Select.Option>
                                        <Select.Option value="reserved">Reserved</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        
                        <Form.Item
                            name="notes"
                            label="Notes"
                        >
                            <Input.TextArea rows={3} />
                        </Form.Item>
                    </Form>
                </Modal>
            )}

            {/* Assign Vendor Modal */}
            {showAssignModal && (
                <Modal
                    title={`Assign Vendor to Stall ${selectedStall?.stall_number || ''}`}
                    open={showAssignModal}
                    onCancel={() => setShowAssignModal(false)}
                    footer={null}
                    width={600}
                >
                    <Form
                        form={assignForm}
                        layout="vertical"
                        onFinish={handleAssignSubmit}
                    >
                        <Form.Item
                            name="vendor_id"
                            label="Select Vendor"
                            rules={[{ required: true, message: 'Please select a vendor' }]}
                        >
                            <Select
                                placeholder="Choose a vendor"
                                showSearch
                                filterOption={(input, option) =>
                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                            >
                                {!Array.isArray(vendors) || vendors.length === 0 ? (
                                    <Select.Option disabled>No vendors available</Select.Option>
                                ) : (
                                    vendors.map(vendor => (
                                        <Select.Option key={vendor.id} value={vendor.id}>
                                            {vendor.first_name} {vendor.middle_name} {vendor.last_name}
                                        </Select.Option>
                                    ))
                                )}
                            </Select>
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="start_date"
                                    label="Start Date"
                                    rules={[{ required: true, message: 'Please select start date' }]}
                                >
                                    <DatePicker
                                        style={{ width: '100%' }}
                                        disabledDate={(current) => {
                                            if (!current || !selectedStall) return false;
                                            const activity = activities.find(a => a.id === selectedStall.activity_id);
                                            const activityStart = activity?.start_date ? dayjs(activity.start_date) : null;
                                            const activityEnd = activity?.end_date ? dayjs(activity.end_date) : null;
                                            if (activityStart && current.isBefore(activityStart, 'day')) return true;
                                            if (activityEnd && current.isAfter(activityEnd, 'day')) return true;
                                            return false;
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="end_date"
                                    label="End Date"
                                    dependencies={['start_date']}
                                    rules={[
                                        { required: true, message: 'Please select end date' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || !getFieldValue('start_date')) {
                                                    return Promise.resolve();
                                                }
                                                if (value.isBefore(getFieldValue('start_date'), 'day')) {
                                                    return Promise.reject(new Error('End date must be after start date'));
                                                }
                                                return Promise.resolve();
                                            },
                                        }),
                                    ]}
                                >
                                    <DatePicker
                                        style={{ width: '100%' }}
                                        disabledDate={(current) => {
                                            if (!current || !selectedStall) return false;
                                            const activity = activities.find(a => a.id === selectedStall.activity_id);
                                            const activityStart = activity?.start_date ? dayjs(activity.start_date) : null;
                                            const activityEnd = activity?.end_date ? dayjs(activity.end_date) : null;
                                            if (activityStart && current.isBefore(activityStart, 'day')) return true;
                                            if (activityEnd && current.isAfter(activityEnd, 'day')) return true;
                                            return false;
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="notes"
                            label="Notes"
                        >
                            <Input.TextArea rows={3} />
                        </Form.Item>

                        <Form.Item style={{ marginTop: '20px', textAlign: 'right' }}>
                            <Space>
                                <Button onClick={() => setShowAssignModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="primary" htmlType="submit">
                                    Assign Vendor
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>
            )}

            {/* Stalls Grid Modal */}
            {showStallsModal && selectedActivityForStalls && (
                <Modal
                    title={`Manage Stalls - ${selectedActivityForStalls?.name || ''}`}
                    open={showStallsModal}
                    onCancel={() => setShowStallsModal(false)}
                    footer={null}
                    width={window.innerWidth < 768 ? '95%' : window.innerWidth < 1024 ? '90%' : 1200}
                    style={{ top: window.innerWidth < 768 ? 20 : 50 }}
                >
                    <StallsGrid activity={selectedActivityForStalls} />
                </Modal>
            )}
        
        {loading && <LoadingOverlay message="Loading Stalls..." />}
        </div>
    );
};

export default EventStallManagement;
