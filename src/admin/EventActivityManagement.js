import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../Api';
import StallsGrid from './StallsGrid';
import LoadingOverlay from './Loading';
import {
  Card,
  Table,
  Typography,
  Button,
  Space,
  Tooltip,
  Row,
  Col,
  Tag,
  DatePicker,
  Modal,
  Form,
  Input,
  InputNumber,
  Tabs,
  Statistic,
  Alert,
  message,
  Select,
  Popconfirm,
  Radio,
  Divider,
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  DollarOutlined,
  FilePdfOutlined,
  CalendarOutlined,
  SettingOutlined,
  ReloadOutlined,
  CloseOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import './EventActivityManagement.css';

const EventActivityManagement = () => {
    const navigate = useNavigate();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingActivity, setEditingActivity] = useState(null);
    const [showStallsModal, setShowStallsModal] = useState(false);
    const [selectedActivityForStalls, setSelectedActivityForStalls] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        start_date: null,
        end_date: null,
        location: '',
        daily_rental_rate: '',
        status: 'active'
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Format date to "Month,DD,YYYY" format
    const formatDate = (date) => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
        const month = months[date.getMonth()];
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month},${day},${year}`;
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const response = await api.get('/event-activities');
            setActivities(response.data.activities.data || response.data.activities);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            const submitData = {
                ...formData,
                start_date: formData.start_date ? formData.start_date.format('YYYY-MM-DD') : null,
                end_date: formData.end_date ? formData.end_date.format('YYYY-MM-DD') : null,
            };
            
            if (editingActivity) {
                await api.put(`/event-activities/${editingActivity.id}`, submitData);
                message.success('Activity updated successfully');
            } else {
                await api.post('/event-activities', submitData);
                message.success('Activity created successfully');
            }
            fetchActivities();
            resetForm();
            setShowModal(false);
        } catch (error) {
            console.error('Error saving activity:', error);
            message.error('Error saving activity');
        }
    };

    const handleEdit = (activity) => {
        setEditingActivity(activity);
        setFormData({
            name: activity.name,
            description: activity.description,
            start_date: activity.start_date ? new Date(activity.start_date) : null,
            end_date: activity.end_date ? new Date(activity.end_date) : null,
            location: activity.location,
            daily_rental_rate: activity.daily_rental_rate,
            status: activity.status
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/event-activities/${id}`);
            message.success('Activity deleted successfully');
            fetchActivities();
        } catch (error) {
            console.error('Error deleting activity:', error);
            message.error('Error deleting activity');
        }
    };

    const handleManageStalls = (activity) => {
        setSelectedActivityForStalls(activity);
        setShowStallsModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            start_date: null,
            end_date: null,
            location: '',
            daily_rental_rate: '',
            status: 'active'
        });
        setEditingActivity(null);
    };

    const filteredActivities = activities.filter(activity => {
        const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             activity.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || activity.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const getStatusTag = (status) => {
        const statusColors = {
            active: 'success',
            inactive: 'warning',
            completed: 'info',
            cancelled: 'error'
        };
        return statusColors[status] || 'default';
    };

    return (
        <div className="event-activity-management" style={{ padding: window.innerWidth < 768 ? '10px' : window.innerWidth < 1024 ? '16px' : '20px' }}>
            <Card style={{ marginBottom: 24 }}>
                <Row justify="space-between" align="middle" gutter={[16, 16]}>
                    <Col xs={24} sm={24} md={12} lg={8} xl={6}>
                        <Typography.Title level={2} style={{ margin: 0, fontSize: window.innerWidth < 768 ? '20px' : window.innerWidth < 1024 ? '22px' : '24px' }}>Event Activity Management</Typography.Title>
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={16} xl={18}>
                        <Space wrap size={[8, 8]} style={{ width: '100%', justifyContent: window.innerWidth < 768 ? 'center' : 'flex-end' }}>
                            <Button 
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    resetForm();
                                    setShowModal(true);
                                }}
                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                            >
                                {window.innerWidth < 768 ? 'Add Activity' : 'Add New Activity'}
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Card style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={24} md={16} lg={16} xl={16}>
                        <Input
                            placeholder="Search activities..."
                            prefix={<SearchOutlined />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            allowClear
                            size={window.innerWidth < 768 ? 'small' : 'middle'}
                        />
                    </Col>
                    <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                        <Select
                            style={{ width: '100%' }}
                            value={filterStatus}
                            onChange={setFilterStatus}
                            size={window.innerWidth < 768 ? 'small' : 'middle'}
                        >
                            <Select.Option value="all">All Status</Select.Option>
                            <Select.Option value="active">Active</Select.Option>
                            <Select.Option value="inactive">Inactive</Select.Option>
                            <Select.Option value="completed">Completed</Select.Option>
                            <Select.Option value="cancelled">Cancelled</Select.Option>
                        </Select>
                    </Col>
                </Row>
            </Card>

            <Row gutter={[16, 16]}>
                {filteredActivities.map((activity) => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={activity.id}>
                        <Card
                            hoverable
                            size={window.innerWidth < 768 ? 'small' : 'middle'}
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{window.innerWidth < 768 
                                        ? `${activity.name.length > 25 ? activity.name.substring(0, 25) + '...' : activity.name}`
                                        : activity.name
                                    }</span>
                                    <Tag color={getStatusTag(activity.status)}>
                                        {activity.status}
                                    </Tag>
                                </div>
                            }
                            actions={[
                                <Tooltip title="Manage Stalls">
                                    <Button 
                                        type="text" 
                                        icon={<ShopOutlined />}
                                        onClick={() => handleManageStalls(activity)}
                                    />
                                </Tooltip>,
                                <Tooltip title="Edit Activity">
                                    <Button 
                                        type="text" 
                                        icon={<EditOutlined />}
                                        onClick={() => handleEdit(activity)}
                                    />
                                </Tooltip>,
                                <Popconfirm
                                    title="Are you sure you want to delete this activity?"
                                    onConfirm={() => handleDelete(activity.id)}
                                    okText="Yes"
                                    cancelText="No"
                                >
                                    <Tooltip title="Delete Activity">
                                        <Button 
                                            type="text" 
                                            danger
                                            icon={<DeleteOutlined />}
                                        />
                                    </Tooltip>
                                </Popconfirm>
                            ]}
                        >
                            <Typography.Paragraph 
                                ellipsis={{ rows: 2 }} 
                                style={{ marginBottom: 16, minHeight: 40 }}
                            >
                                {activity.description || 'No description'}
                            </Typography.Paragraph>
                            
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                    <span>{activity.location}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                    <span>
                                        {activity.formatted_start_date || formatDate(new Date(activity.start_date))} - 
                                        {activity.formatted_end_date || formatDate(new Date(activity.end_date))}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <ClockCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                    <span>{activity.duration || activity.total_days + ' days'}</span>
                                </div>
                              
                            </Space>
                            
                            <Divider />
                            
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Statistic 
                                        title="Stalls" 
                                        value={activity.stalls_count || 0} 
                                        valueStyle={{ fontSize: 16 }}
                                    />
                                </Col>
                                <Col span={12}>
                                    <Statistic 
                                        title="Assignments" 
                                        value={activity.stall_assignments_count || 0} 
                                        valueStyle={{ fontSize: 16 }}
                                    />
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Modal
                title={editingActivity ? 'Edit Activity' : 'Add New Activity'}
                open={showModal}
                onCancel={() => setShowModal(false)}
                footer={null}
                width={600}
            >
                <Form
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={formData}
                >
                    <Form.Item
                        label="Activity Name"
                        name="name"
                        rules={[{ required: true, message: 'Please enter activity name' }]}
                    >
                        <Input 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </Form.Item>
                    
                    <Form.Item
                        label="Description"
                        name="description"
                    >
                        <Input.TextArea 
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                    </Form.Item>
                    
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Start Date"
                                name="start_date"
                                rules={[{ required: true, message: 'Please select start date' }]}
                            >
                                <DatePicker 
                                    style={{ width: '100%' }}
                                    value={formData.start_date}
                                    onChange={(date) => setFormData({...formData, start_date: date})}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="End Date"
                                name="end_date"
                                rules={[{ required: true, message: 'Please select end date' }]}
                            >
                                <DatePicker 
                                    style={{ width: '100%' }}
                                    value={formData.end_date}
                                    onChange={(date) => setFormData({...formData, end_date: date})}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Form.Item
                        label="Location"
                        name="location"
                        rules={[{ required: true, message: 'Please enter location' }]}
                    >
                        <Input 
                            value={formData.location}
                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                        />
                    </Form.Item>
                    
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Daily Rental Rate"
                                name="daily_rental_rate"
                                rules={[{ required: true, message: 'Please enter daily rental rate' }]}
                            >
                                <InputNumber 
                                    style={{ width: '100%' }}
                                    min={0}
                                    step={0.01}
                                    prefix="₱"
                                    value={formData.daily_rental_rate}
                                    onChange={(value) => setFormData({...formData, daily_rental_rate: value})}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Status"
                                name="status"
                            >
                                <Select 
                                    value={formData.status}
                                    onChange={(value) => setFormData({...formData, status: value})}
                                >
                                    <Select.Option value="active">Active</Select.Option>
                                    <Select.Option value="inactive">Inactive</Select.Option>
                                    <Select.Option value="completed">Completed</Select.Option>
                                    <Select.Option value="cancelled">Cancelled</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button 
                                onClick={() => setShowModal(false)}
                                icon={<CloseOutlined />}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="primary" 
                                htmlType="submit"
                                icon={editingActivity ? <SaveOutlined /> : <PlusOutlined />}
                            >
                                {editingActivity ? 'Update' : 'Create'} Activity
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

        {/* Stalls Grid Modal */}
        <Modal
            title={`Manage Stalls - ${selectedActivityForStalls?.name || ''}`}
            open={showStallsModal}
            onCancel={() => {
                setShowStallsModal(false);
                fetchActivities(); // Refresh activities to update stall counts
            }}
            footer={null}
            width="90%"
            style={{ maxWidth: '1200px' }}
        >
            {selectedActivityForStalls && <StallsGrid activity={selectedActivityForStalls} onStallsUpdated={fetchActivities} />}
        </Modal>
        
        {loading && <LoadingOverlay message="Loading Activities..." />}
        </div>
    );
};

export default EventActivityManagement;
