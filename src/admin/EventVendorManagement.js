import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Select, Modal, Form, Space, Tag, Statistic, Row, Col, Typography, Avatar, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserOutlined, PhoneOutlined, EnvironmentOutlined, IdcardOutlined, PauseCircleOutlined, PlayCircleOutlined, TeamOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import api from '../Api';
import LoadingOverlay from './Loading';
import './EventVendorManagement.css';
const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const EventVendorManagement = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        contact_number: '',
        address: '',
        status: 'active'
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const response = await api.get('/event-vendors');
            setVendors(response.data.vendors?.data || response.data.vendors || []);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (editingVendor) {
                await api.put(`/event-vendors/${editingVendor.id}`, values);
                message.success('Vendor updated successfully');
            } else {
                await api.post('/event-vendors', values);
                message.success('Vendor created successfully');
            }
            fetchVendors();
            resetForm();
            setShowModal(false);
        } catch (error) {
            console.error('Error saving vendor:', error);
            message.error('Error saving vendor');
        }
    };

    const handleEdit = (vendor) => {
        setEditingVendor(vendor);
        setFormData({
            first_name: vendor.first_name,
            middle_name: vendor.middle_name || '',
            last_name: vendor.last_name,
            contact_number: vendor.contact_number,
            address: vendor.address,
            status: vendor.status
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        Modal.confirm({
            title: 'Are you sure you want to delete this vendor?',
            content: 'This action cannot be undone.',
            okText: 'Yes',
            cancelText: 'No',
            onOk: async () => {
                try {
                    await api.delete(`/event-vendors/${id}`);
                    message.success('Vendor deleted successfully');
                    fetchVendors();
                } catch (error) {
                    console.error('Error deleting vendor:', error);
                    message.error('Error deleting vendor');
                }
            }
        });
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await api.patch(`/event-vendors/${id}/status`, { status: newStatus });
            message.success(`Vendor ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
            fetchVendors();
        } catch (error) {
            console.error('Error updating vendor status:', error);
            message.error('Error updating vendor status');
        }
    };

    const resetForm = () => {
        setFormData({
            first_name: '',
            middle_name: '',
            last_name: '',
            contact_number: '',
            address: '',
            status: 'active'
        });
        setEditingVendor(null);
    };

    const filteredVendors = vendors.filter(vendor => {
        const matchesSearch = 
            `${vendor.first_name} ${vendor.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendor.contact_number?.includes(searchTerm.toLowerCase()) ||
            vendor.address?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || vendor.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const getStatusBadge = (status) => {
        const statusClasses = {
            active: 'badge-success',
            inactive: 'badge-warning',
            suspended: 'badge-danger'
        };
        return `badge ${statusClasses[status] || 'badge-secondary'}`;
    };

    const getActiveCount = () => vendors.filter(v => v.status === 'active').length;
    const getInactiveCount = () => vendors.filter(v => v.status === 'inactive').length;
    const getSuspendedCount = () => vendors.filter(v => v.status === 'suspended').length;

    return (
        <div className="event-vendor-management" style={{ padding: window.innerWidth < 768 ? '10px' : window.innerWidth < 1024 ? '16px' : '20px' }}>
            <Card style={{ marginBottom: 24 }}>
                <Row justify="space-between" align="middle" gutter={[16, 16]}>
                    <Col xs={24} sm={24} md={12} lg={8} xl={6}>
                        <Title level={2} style={{ margin: 0, fontSize: window.innerWidth < 768 ? '20px' : window.innerWidth < 1024 ? '22px' : '24px' }}>Event Vendor Management</Title>
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
                                {window.innerWidth < 768 ? 'Add Vendor' : 'Add New Vendor'}
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
                            title={<span style={{ color: 'white', fontSize: window.innerWidth < 768 ? '12px' : '16px', fontWeight: 500 }}>Total Vendors</span>}
                            value={vendors.length}
                            suffix={<span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: window.innerWidth < 768 ? '12px' : '14px' }}>Registered vendors</span>}
                            valueStyle={{ color: 'white', fontSize: window.innerWidth < 768 ? '20px' : '32px', fontWeight: 'bold' }}
                            prefix={<TeamOutlined style={{ color: 'white', fontSize: window.innerWidth < 768 ? '16px' : '24px', marginRight: '8px' }} />}
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
                            title={<span style={{ color: 'white', fontSize: window.innerWidth < 768 ? '12px' : '16px', fontWeight: 500 }}>Active</span>}
                            value={getActiveCount()}
                            suffix={<span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: window.innerWidth < 768 ? '12px' : '14px' }}>Currently active</span>}
                            valueStyle={{ color: 'white', fontSize: window.innerWidth < 768 ? '20px' : '32px', fontWeight: 'bold' }}
                            prefix={<CheckCircleOutlined style={{ color: 'white', fontSize: window.innerWidth < 768 ? '16px' : '24px', marginRight: '8px' }} />}
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
                            title={<span style={{ color: 'white', fontSize: window.innerWidth < 768 ? '12px' : '16px', fontWeight: 500 }}>Inactive</span>}
                            value={getInactiveCount()}
                            suffix={<span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: window.innerWidth < 768 ? '12px' : '14px' }}>Not active</span>}
                            valueStyle={{ color: 'white', fontSize: window.innerWidth < 768 ? '20px' : '32px', fontWeight: 'bold' }}
                            prefix={<StopOutlined style={{ color: 'white', fontSize: window.innerWidth < 768 ? '16px' : '24px', marginRight: '8px' }} />}
                        />
                    </Card>
                </Col>
            </Row>

            <Card style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={24} md={8} lg={8} xl={8}>
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
                                <Option value="active">Active</Option>
                                <Option value="inactive">Inactive</Option>
                                <Option value="suspended">Suspended</Option>
                            </Select>
                        </div>
                    </Col>
                    <Col xs={24} sm={24} md={16} lg={16} xl={16}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px', color: '#000000d9', fontWeight: 500 }}>Search Vendor</label>
                            <Search
                                placeholder="Search vendors..."
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

            <Row gutter={[16, 16]}>
                {filteredVendors.map((vendor) => (
                    <Col xs={24} sm={12} md={8} lg={8} xl={8} key={vendor.id}>
                        <Card
                            hoverable
                            size={window.innerWidth < 768 ? 'small' : 'middle'}
                            actions={[
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Button 
                                        type="default" 
                                        size="small" 
                                        icon={<EditOutlined />}
                                        onClick={() => handleEdit(vendor)}
                                        style={{ backgroundColor: 'white', color: 'black', borderColor: '#d9d9d9', width: '100%' }}
                                    >
                                        Edit
                                    </Button>
                                    {vendor.status === 'active' ? (
                                        <Button 
                                            type="default" 
                                            size="small" 
                                            icon={<PauseCircleOutlined />}
                                            onClick={() => handleStatusChange(vendor.id, 'inactive')}
                                            style={{ backgroundColor: '#faad14', color: 'black', borderColor: '#faad14', width: '100%' }}
                                        >
                                            Deactivate
                                        </Button>
                                    ) : (
                                        <Button 
                                            type="default" 
                                            size="small" 
                                            icon={<PlayCircleOutlined />}
                                            onClick={() => handleStatusChange(vendor.id, 'active')}
                                            style={{ backgroundColor: '#52c41a', color: 'white', borderColor: '#52c41a', width: '100%' }}
                                        >
                                            Activate
                                        </Button>
                                    )}
                                    <Button 
                                        type="primary" 
                                        danger 
                                        size="small" 
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleDelete(vendor.id)}
                                        style={{ width: '100%' }}
                                    >
                                        Delete
                                    </Button>
                                </Space>
                            ]}
                        >
                            <Card.Meta
                                avatar={
                                    <Avatar size={48} icon={<UserOutlined />} />
                                }
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{vendor.first_name} {vendor.last_name}</span>
                                        <Tag color={vendor.status === 'active' ? 'green' : vendor.status === 'inactive' ? 'orange' : 'red'}>
                                            {vendor.status}
                                        </Tag>
                                    </div>
                                }
                                description={
                                    <div>
                                        <div style={{ marginBottom: 8 }}>
                                            <PhoneOutlined style={{ marginRight: 8 }} />
                                            {vendor.contact_number || 'No contact'}
                                        </div>
                                        <div style={{ marginBottom: 8 }}>
                                            <EnvironmentOutlined style={{ marginRight: 8 }} />
                                            {vendor.address || 'No address'}
                                        </div>
                                        <div style={{ marginBottom: 8 }}>
                                            <IdcardOutlined style={{ marginRight: 8 }} />
                                            ID: {vendor.id}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                                            <div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>Stalls Assigned</div>
                                                <div style={{ fontWeight: 'bold' }}>0</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>Total Payments</div>
                                                <div style={{ fontWeight: 'bold' }}>₱0</div>
                                            </div>
                                        </div>
                                    </div>
                                }
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Modal
                title={editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                open={showModal}
                onCancel={() => setShowModal(false)}
                footer={null}
                width={600}
            >
                <Form
                    onFinish={handleSubmit}
                    layout="vertical"
                    initialValues={formData}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="First Name"
                                name="first_name"
                                rules={[{ required: true, message: 'Please enter first name' }]}
                            >
                                <Input
                                    placeholder="Enter first name"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Middle Name"
                                name="middle_name"
                            >
                                <Input
                                    placeholder="Enter middle name"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="Last Name"
                        name="last_name"
                        rules={[{ required: true, message: 'Please enter last name' }]}
                    >
                        <Input
                            placeholder="Enter last name"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Contact Number"
                        name="contact_number"
                    >
                        <Input
                            placeholder="09123456789"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Address"
                        name="address"
                    >
                        <TextArea
                            rows={3}
                            placeholder="Complete address"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Status"
                        name="status"
                    >
                        <Select>
                            <Option value="active">Active</Option>
                            <Option value="inactive">Inactive</Option>
                            <Option value="suspended">Suspended</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editingVendor ? 'Update' : 'Create'} Vendor
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        
        {loading && <LoadingOverlay message="Loading Vendors..." />}
        </div>
    );
};

export default EventVendorManagement;
