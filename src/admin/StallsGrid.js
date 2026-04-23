import React, { useState, useEffect } from 'react';
import api from '../Api';
import LoadingOverlay from './Loading';
import dayjs from 'dayjs';
import {
  Card,
  Typography,
  Button,
  Space,
  Tooltip,
  Row,
  Col,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Popconfirm,
  Radio,
  Divider,
  message,
  Empty,
  Statistic,
  Alert,DatePicker,
} from 'antd';
import {
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  ShopOutlined,
  CloseOutlined,
  UserOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import './StallsGrid.css';

const StallsGrid = ({ activity, onStallsUpdated }) => {
    const [stalls, setStalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [vendors, setVendors] = useState([]);
    const [showAddStallModal, setShowAddStallModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedStall, setSelectedStall] = useState(null);

    useEffect(() => {
        fetchStalls();
        fetchVendors();
    }, [activity.id]);

    const fetchStalls = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/event-stalls?activity_id=${activity.id}`);
            const allStalls = response.data.stalls?.data || response.data.stalls || [];
            setStalls(allStalls);
        } catch (error) {
            console.error('Error fetching stalls:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVendors = async () => {
        try {
            const response = await api.get('/event-vendors');
            setVendors(response.data.vendors?.data || response.data.vendors || []);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        }
    };

    const getStallColor = (status) => {
        switch (status) {
            case 'available': return '#28a745';
            case 'occupied': return '#dc3545';
            case 'maintenance': return '#ffc107';
            case 'reserved': return '#17a2b8';
            default: return '#6c757d';
        }
    };

    const handleStallClick = (stall) => {
        if (stall.status === 'available') {
            setSelectedStall(stall);
            setShowAssignModal(true);
        } else if (stall.status === 'occupied') {
            // Show stall details or release option
            alert(`Stall ${stall.stall_number} is occupied by ${stall.assigned_vendor?.full_name || 'Unknown'}`);
        }
    };

    const handleAddSingleStall = (stallInfo) => {
        setSelectedStall(stallInfo);
        setShowAddStallModal(true);
    };

    const renderStallGrid = () => {
        // Separate fixed and ambulant stalls
        const fixedStalls = stalls.filter(s => !s.is_ambulant);
        const ambulantStalls = stalls.filter(s => s.is_ambulant);

        return (
            <>
                {/* Fixed Stalls Grid */}
                {fixedStalls.length > 0 && renderFixedStallsGrid(fixedStalls)}

                {/* Ambulant Stalls List */}
                {ambulantStalls.length > 0 && renderAmbulantStallsList(ambulantStalls)}

                {/* Add Stall Button */}
                <Row justify="center" style={{ marginTop: 24 }}>
                    <Col xs={24} sm={24} md={12} lg={8} xl={6}>
                        <Button 
                            type="primary"
                            icon={<PlusOutlined />}
                            size={window.innerWidth < 768 ? 'middle' : 'large'}
                            onClick={() => setShowAddStallModal(true)}
                            style={{ width: '100%' }}
                        >
                            {window.innerWidth < 768 ? 'Add Stall' : 'Add New Stall'}
                        </Button>
                    </Col>
                </Row>
            </>
        );
    };

    const renderFixedStallsGrid = (fixedStalls) => {
        // Sort stalls by stall number to ensure proper display order
        const sortedStalls = [...fixedStalls].sort((a, b) => {
            const numA = parseInt(a.stall_number) || 0;
            const numB = parseInt(b.stall_number) || 0;
            return numA - numB;
        });

        // Create a responsive grid layout - show all stalls in order
        let cols;
        if (window.innerWidth < 576) {
            cols = Math.min(2, Math.max(1, sortedStalls.length)); // Mobile: max 2 columns
        } else if (window.innerWidth < 768) {
            cols = Math.min(3, Math.max(2, sortedStalls.length)); // Tablet: max 3 columns
        } else if (window.innerWidth < 1024) {
            cols = Math.min(4, Math.max(3, sortedStalls.length)); // Small desktop: max 4 columns
        } else {
            cols = Math.min(5, Math.max(3, sortedStalls.length)); // Large desktop: max 5 columns
        }

        return (
            <Card
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ShopOutlined style={{ color: '#1890ff' }} />
                        <Typography.Text strong>Fixed Stalls Grid</Typography.Text>
                        <Tag color="blue">{fixedStalls.length}</Tag>
                    </div>
                }
                style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                }}
            >
                <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gap: window.innerWidth < 768 ? '8px' : '10px',
                    padding: window.innerWidth < 768 ? '12px' : '20px'
                }}>
                    {sortedStalls.map((stall) => (
                        <Card
                            key={stall.id}
                            size={window.innerWidth < 768 ? 'small' : 'default'}
                            hoverable={true}
                            className={`stall-cell ${stall.status}`}
                            style={{
                                backgroundColor: getStallColor(stall.status),
                                border: window.innerWidth < 768 ? '1px solid #333' : '2px solid #333',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                minHeight: window.innerWidth < 768 ? 60 : 80,
                                padding: window.innerWidth < 768 ? '8px' : '12px'
                            }}
                            onClick={() => handleStallClick(stall)}
                            title={`Stall ${stall.stall_number} - ${stall.status}`}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <Typography.Title level={5} style={{ 
                                    margin: 0, 
                                    fontSize: window.innerWidth < 768 ? 12 : 14,
                                    lineHeight: window.innerWidth < 768 ? 1.2 : 1.4
                                }}>
                                    {stall.stall_number}
                                </Typography.Title>
                                {stall.assigned_vendor && window.innerWidth >= 768 && (
                                    <Typography.Text style={{ fontSize: 10, color: '#666' }}>
                                        <UserOutlined style={{ marginRight: 2 }} />
                                        {stall.assigned_vendor.first_name}
                                    </Typography.Text>
                                )}
                            </div>
                        </Card>
                    ))}
                    
                    {/* Add new stall button at the end */}
                    <Card
                        size="small"
                        hoverable={true}
                        className="add-stall-card"
                        style={{
                            border: '2px dashed #1890ff',
                            backgroundColor: '#f8f9fa',
                            cursor: 'pointer',
                            minHeight: 80,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onClick={() => handleAddSingleStall({ activity_id: activity.id })}
                    >
                        <div style={{ textAlign: 'center' }}>
                            <PlusOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                        </div>
                    </Card>
                </div>
            </Card>
        );
    };

    const renderAmbulantStallsList = (ambulantStalls) => {
        // Get the highest ambulant stall number for proper numbering
        const getAmbulantStallNumber = (index) => {
            // For ambulant stalls, just use index + 1 since they don't have stall numbers
            return index + 1;
        };

        return (
            <Card
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ShopOutlined style={{ color: '#ff6b35' }} />
                        <Typography.Text strong>Ambulant Stalls</Typography.Text>
                        <Tag color="orange">{ambulantStalls.length}</Tag>
                    </div>
                }
                style={{
                    background: '#fff5f0',
                    border: '1px solid #ffd4a3',
                    borderRadius: '12px'
                }}
            >
                <Row gutter={[16, 16]}>
                    {ambulantStalls.map((stall, index) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={stall.id}>
                            <Card
                                hoverable
                                size={window.innerWidth < 768 ? 'small' : 'default'}
                                className={`ambulant-stall-card ${stall.status}`}
                                style={{
                                    borderLeft: window.innerWidth < 768 ? '3px solid #ff6b35' : '4px solid #ff6b35',
                                    backgroundColor: getStallColor(stall.status) === '#28a745' ? '#f6ffed' : 
                                                   getStallColor(stall.status) === '#dc3545' ? '#fff2f0' : 
                                                   getStallColor(stall.status) === '#ffc107' ? '#fffbe6' : '#e6f7ff'
                                }}
                                actions={window.innerWidth >= 768 ? [
                                    <Tooltip title="Edit Stall">
                                        <Button 
                                            type="text" 
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => handleAddSingleStall(stall)}
                                        />
                                    </Tooltip>,
                                    <Tooltip title="Assign Vendor">
                                        <Button 
                                            type="text" 
                                            size="small"
                                            icon={<UserOutlined />}
                                            onClick={() => handleStallClick(stall)}
                                        />
                                    </Tooltip>
                                ] : []}
                            >
                                <div style={{ textAlign: 'center', marginBottom: window.innerWidth < 768 ? 8 : 12 }}>
                                    <Typography.Title level={5} style={{ 
                                        color: '#ff6b35', 
                                        margin: 0,
                                        fontSize: window.innerWidth < 768 ? 14 : 16
                                    }}>
                                        {window.innerWidth < 768 ? `#${getAmbulantStallNumber(index)}` : `AMBULANT #${getAmbulantStallNumber(index)}`}
                                    </Typography.Title>
                                </div>
                                <Typography.Paragraph 
                                    ellipsis={{ rows: window.innerWidth < 768 ? 1 : 2 }} 
                                    style={{ marginBottom: 8, minHeight: window.innerWidth < 768 ? 16 : 20 }}
                                >
                                    {stall.stall_name || `Ambulant Stall ${getAmbulantStallNumber(index)}`}
                                </Typography.Paragraph>
                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography.Text type="secondary" style={{ fontSize: window.innerWidth < 768 ? 11 : 12 }}>Size:</Typography.Text>
                                        <Typography.Text strong style={{ fontSize: window.innerWidth < 768 ? 12 : 13 }}>{stall.size}</Typography.Text>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography.Text type="secondary" style={{ fontSize: window.innerWidth < 768 ? 11 : 12 }}>Rate:</Typography.Text>
                                        <Typography.Text strong style={{ fontSize: window.innerWidth < 768 ? 12 : 13 }}>₱{stall.daily_rate}</Typography.Text>
                                    </div>
                                </Space>
                                {stall.assigned_vendor && (
                                    <div style={{ 
                                        marginTop: window.innerWidth < 768 ? 6 : 8, 
                                        padding: window.innerWidth < 768 ? 6 : 8, 
                                        background: '#f0f0f0', 
                                        borderRadius: 6 
                                    }}>
                                        <Typography.Text style={{ fontSize: window.innerWidth < 768 ? 10 : 12 }}>
                                            <UserOutlined style={{ marginRight: 4 }} />
                                            {stall.assigned_vendor.first_name} {stall.assigned_vendor.last_name}
                                        </Typography.Text>
                                    </div>
                                )}
                            </Card>
                        </Col>
                    ))}
                    
                    {/* Add new ambulant stall card */}
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card
                            hoverable
                            size={window.innerWidth < 768 ? 'small' : 'default'}
                            className="add-ambulant-card"
                            style={{
                                border: window.innerWidth < 768 ? '1.5px dashed #ff6b35' : '2px dashed #ff6b35',
                                backgroundColor: '#fff5f0',
                                cursor: 'pointer',
                                minHeight: window.innerWidth < 768 ? 140 : 180,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: window.innerWidth < 768 ? '12px' : '20px'
                            }}
                            onClick={() => handleAddSingleStall({ activity_id: activity.id, is_ambulant: true })}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <PlusOutlined style={{ 
                                    fontSize: window.innerWidth < 768 ? 24 : 32, 
                                    color: '#ff6b35', 
                                    marginBottom: window.innerWidth < 768 ? 6 : 8 
                                }} />
                                <Typography.Text 
                                    type="secondary" 
                                    style={{ fontSize: window.innerWidth < 768 ? 12 : 14 }}
                                >
                                    {window.innerWidth < 768 ? 'Add Ambulant' : 'Add Ambulant Stall'}
                                </Typography.Text>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Card>
        );
    };

    return (
        <div className="stalls-grid-container" style={{ padding: window.innerWidth < 768 ? '10px' : window.innerWidth < 1024 ? '16px' : '20px' }}>
            <Card
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <Typography.Title level={3} style={{ margin: 0, fontSize: window.innerWidth < 768 ? '20px' : window.innerWidth < 1024 ? '22px' : '24px' }}>
                            {window.innerWidth < 768 ? 'Stalls' : `Stall Layout - ${activity.name}`}
                        </Typography.Title>
                        <Space size={window.innerWidth < 768 ? 'small' : 'middle'}>
                            <Button 
                                type="primary"
                                icon={<PlusOutlined />}
                                size={window.innerWidth < 768 ? 'small' : 'middle'}
                                onClick={() => setShowAddStallModal(true)}
                            >
                                {window.innerWidth < 768 ? 'Add' : 'Add Stall'}
                            </Button>
                        </Space>
                    </div>
                }
                style={{ marginBottom: 24 }}
            >
                {renderStallGrid()}
            </Card>

            <Card title="Legend" style={{ marginTop: 24 }}>
                <Row gutter={window.innerWidth < 768 ? [8, 8] : 16}>
                    <Col xs={12} sm={12} md={6} lg={6}>
                        <Space direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'} size="small">
                            <div style={{ 
                                width: window.innerWidth < 768 ? 12 : 16, 
                                height: window.innerWidth < 768 ? 12 : 16, 
                                backgroundColor: '#28a745', 
                                borderRadius: 3,
                                border: '1px solid #333'
                            }}></div>
                            <Typography.Text style={{ fontSize: window.innerWidth < 768 ? 11 : 14 }}>Available</Typography.Text>
                        </Space>
                    </Col>
                    <Col xs={12} sm={12} md={6} lg={6}>
                        <Space direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'} size="small">
                            <div style={{ 
                                width: window.innerWidth < 768 ? 12 : 16, 
                                height: window.innerWidth < 768 ? 12 : 16, 
                                backgroundColor: '#dc3545', 
                                borderRadius: 3,
                                border: '1px solid #333'
                            }}></div>
                            <Typography.Text style={{ fontSize: window.innerWidth < 768 ? 11 : 14 }}>Occupied</Typography.Text>
                        </Space>
                    </Col>
                    <Col xs={12} sm={12} md={6} lg={6}>
                        <Space direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'} size="small">
                            <div style={{ 
                                width: window.innerWidth < 768 ? 12 : 16, 
                                height: window.innerWidth < 768 ? 12 : 16, 
                                backgroundColor: '#ffc107', 
                                borderRadius: 3,
                                border: '1px solid #333'
                            }}></div>
                            <Typography.Text style={{ fontSize: window.innerWidth < 768 ? 11 : 14 }}>Maintenance</Typography.Text>
                        </Space>
                    </Col>
                    <Col xs={12} sm={12} md={6} lg={6}>
                        <Space direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'} size="small">
                            <div style={{ 
                                width: window.innerWidth < 768 ? 12 : 16, 
                                height: window.innerWidth < 768 ? 12 : 16, 
                                backgroundColor: '#17a2b8', 
                                borderRadius: 3,
                                border: '1px solid #333'
                            }}></div>
                            <Typography.Text style={{ fontSize: window.innerWidth < 768 ? 11 : 14 }}>Reserved</Typography.Text>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Add Stall Modal */}
            <Modal
                title={selectedStall ? 'Edit Stall' : 'Add New Stall'}
                open={showAddStallModal}
                onCancel={() => setShowAddStallModal(false)}
                footer={null}
                width={800}
            >
                <AddStallForm 
                    activity={activity} 
                    selectedStall={selectedStall}
                    onSuccess={() => {
                        fetchStalls();
                        setShowAddStallModal(false);
                        setSelectedStall(null);
                        if (onStallsUpdated) {
                            onStallsUpdated();
                        }
                    }} 
                />
            </Modal>

            {/* Assign Vendor Modal */}
            <Modal
                title={`Assign Vendor to Stall ${selectedStall?.stall_number || ''}`}
                open={showAssignModal}
                onCancel={() => setShowAssignModal(false)}
                footer={null}
                width={600}
            >
                <AssignVendorForm 
                    stall={selectedStall} 
                    vendors={vendors}
                    activity={activity}
                    onSuccess={() => {
                        fetchStalls();
                        setShowAssignModal(false);
                        setSelectedStall(null);
                        if (onStallsUpdated) {
                            onStallsUpdated();
                        }
                    }} 
                />
            </Modal>
        
        {loading && <LoadingOverlay message="Loading Stalls..." />}
        </div>
    );
};

const AddStallForm = ({ activity, onSuccess, selectedStall }) => {
    const [formData, setFormData] = useState({
        activity_id: activity.id,
        stall_number: '',
        stall_name: '',
        description: '',
        size: '',
        location: '',
        daily_rate: '',
        row_position: selectedStall?.row_position || '',
        column_position: selectedStall?.column_position || '',
    });
    
    // Bulk stall creation state
    const [bulkMode, setBulkMode] = useState(!selectedStall);
    const [isAmbulant, setIsAmbulant] = useState(false);
    const [stallCount, setStallCount] = useState('');
    const [rowCount, setRowCount] = useState('');
    const [columnsPerRow, setColumnsPerRow] = useState([]);
    const [bulkStallSize, setBulkStallSize] = useState('');
    const [bulkDailyRate, setBulkDailyRate] = useState('');
    
    const handleRowCountChange = (value) => {
        setRowCount(value);
        setColumnsPerRow(Array.from({ length: parseInt(value) || 0 }, () => ''));
    };
    
    const handleColumnsPerRowChange = (rowIndex, value) => {
        const updated = [...columnsPerRow];
        updated[rowIndex] = value;
        setColumnsPerRow(updated);
    };

    const handleSubmit = async (values) => {
        try {
            if (bulkMode) {
                // Bulk stall creation
                if (isAmbulant) {
                    // Ambulant stall creation
                    if (!stallCount || !bulkStallSize || !bulkDailyRate) {
                        message.error('Please fill all required fields for ambulant stall creation');
                        return;
                    }
                    
                    const bulkData = {
                        stall_count: parseInt(stallCount),
                        is_ambulant: true,
                        stall_name: '',
                        description: '',
                        size: bulkStallSize,
                        location: '',
                        daily_rate: parseFloat(bulkDailyRate),
                    };
                    
                    const response = await api.post(`/event-activities/${activity.id}/bulk-create-stalls`, bulkData);
                    message.success(response.data.message);
                } else {
                    // Fixed stall creation
                    if (!rowCount || columnsPerRow.some((c) => !c) || !bulkStallSize || !bulkDailyRate) {
                        message.error('Please fill all required fields for bulk creation');
                        return;
                    }
                    
                    const totalStalls = columnsPerRow.reduce((sum, cols) => sum + parseInt(cols || 0), 0);
                    
                    const bulkData = {
                        stall_count: totalStalls,
                        is_ambulant: false,
                        stall_name: '',
                        description: '',
                        size: bulkStallSize,
                        location: '',
                        daily_rate: parseFloat(bulkDailyRate),
                        row_count: parseInt(rowCount),
                        column_count: columnsPerRow.map(cols => parseInt(cols || 0)),
                    };
                    
                    const response = await api.post(`/event-activities/${activity.id}/bulk-create-stalls`, bulkData);
                    message.success(response.data.message);
                }
            } else {
                // Single stall creation
                await api.post('/event-stalls', formData);
                message.success('Stall created successfully');
            }
            onSuccess();
        } catch (error) {
            console.error('Error creating stall:', error);
            message.error('Error creating stall');
        }
    };

    return (
        <Form
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={formData}
        >
            {!selectedStall && (
                <Form.Item>
                    <Radio.Group 
                        value={bulkMode} 
                        onChange={(e) => setBulkMode(e.target.value)}
                    >
                        <Radio value={true}>Bulk Create Stalls</Radio>
                        <Radio value={false}>Single Stall</Radio>
                    </Radio.Group>
                </Form.Item>
            )}
            
            {bulkMode && !selectedStall ? (
                <>
                    <Form.Item>
                        <Radio.Group 
                            value={isAmbulant} 
                            onChange={(e) => setIsAmbulant(e.target.value)}
                        >
                            <Radio value={false}>Fixed Stalls (with numbers)</Radio>
                            <Radio value={true}>Ambulant Stalls (no numbers)</Radio>
                        </Radio.Group>
                    </Form.Item>
                    
                    {isAmbulant ? (
                        <>
                            <Form.Item
                                label="Number of Ambulant Stalls"
                                rules={[{ required: true, message: 'Please enter number of ambulant stalls' }]}
                            >
                                <InputNumber
                                    min={1}
                                    max={50}
                                    value={stallCount}
                                    onChange={setStallCount}
                                    placeholder="Number of ambulant stalls"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                            <Alert
                                message="Ambulant stalls don&apos;t require stall numbers or grid positions."
                                type="info"
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        </>
                    ) : (
                        <>
                            <Form.Item
                                label="Number of Rows"
                                rules={[{ required: true, message: 'Please enter number of rows' }]}
                            >
                                <InputNumber
                                    min={1}
                                    value={rowCount}
                                    onChange={(value) => handleRowCountChange(value)}
                                    placeholder="Number of rows"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                            {columnsPerRow.map((col, idx) => (
                                <Form.Item
                                    key={idx}
                                    label={`Columns for Row ${idx + 1}`}
                                    rules={[{ required: true, message: 'Please enter number of columns' }]}
                                >
                                    <InputNumber
                                        min={1}
                                        value={col}
                                        onChange={(value) => handleColumnsPerRowChange(idx, value)}
                                        placeholder="Number of columns"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            ))}
                            <Alert
                                message="Stall numbers will be automatically generated starting from the next available number."
                                type="info"
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        </>
                    )}
                    
                    <Form.Item
                        label="Size"
                        rules={[{ required: true, message: 'Please enter stall size' }]}
                    >
                        <Input
                            value={bulkStallSize}
                            onChange={(e) => setBulkStallSize(e.target.value)}
                            placeholder="e.g., 2x2 meters"
                        />
                    </Form.Item>
                    <Form.Item
                        label="Daily Rate"
                        rules={[{ required: true, message: 'Please enter daily rate' }]}
                    >
                        <InputNumber
                            min={0}
                            step={0.01}
                            value={bulkDailyRate}
                            onChange={(value) => setBulkDailyRate(value)}
                            placeholder="0.00"
                            prefix="₱"
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                </>
            ) : (
                <>
                    <Form.Item
                        label="Stall Number"
                        rules={[{ required: !selectedStall, message: 'Please enter stall number' }]}
                    >
                        <Input
                            value={formData.stall_number}
                            onChange={(e) => setFormData({...formData, stall_number: e.target.value})}
                            placeholder="e.g., 1, 2, 3"
                            disabled={!!selectedStall}
                        />
                    </Form.Item>
                    <Form.Item
                        label="Stall Name"
                    >
                        <Input
                            value={formData.stall_name}
                            onChange={(e) => setFormData({...formData, stall_name: e.target.value})}
                            placeholder="Optional stall name"
                        />
                    </Form.Item>
                    <Form.Item
                        label="Size"
                        rules={[{ required: true, message: 'Please enter stall size' }]}
                    >
                        <Input
                            value={formData.size}
                            onChange={(e) => setFormData({...formData, size: e.target.value})}
                            placeholder="e.g., 2x2 meters"
                        />
                    </Form.Item>
                    <Form.Item
                        label="Daily Rate"
                        rules={[{ required: true, message: 'Please enter daily rate' }]}
                    >
                        <InputNumber
                            min={0}
                            step={0.01}
                            value={formData.daily_rate}
                            onChange={(value) => setFormData({...formData, daily_rate: value})}
                            placeholder="0.00"
                            prefix="₱"
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Row Position"
                                rules={[{ required: !selectedStall, message: 'Please enter row position' }]}
                            >
                                <InputNumber
                                    min={1}
                                    value={formData.row_position}
                                    onChange={(value) => setFormData({...formData, row_position: value})}
                                    placeholder="Row number"
                                    disabled={!!selectedStall?.row_position}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Column Position"
                                rules={[{ required: !selectedStall, message: 'Please enter column position' }]}
                            >
                                <InputNumber
                                    min={1}
                                    value={formData.column_position}
                                    onChange={(value) => setFormData({...formData, column_position: value})}
                                    placeholder="Column number"
                                    disabled={!!selectedStall?.column_position}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item
                        label="Location"
                    >
                        <Input
                            value={formData.location}
                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                            placeholder="e.g., Near entrance"
                        />
                    </Form.Item>
                    <Form.Item
                        label="Description"
                    >
                        <Input.TextArea
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows={3}
                            placeholder="Optional description"
                        />
                    </Form.Item>
                </>
            )}
            
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                    <Button 
                        onClick={() => onSuccess()}
                        icon={<CloseOutlined />}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="primary" 
                        htmlType="submit"
                        icon={selectedStall ? <SaveOutlined /> : <PlusOutlined />}
                    >
                        {selectedStall ? 'Update' : 'Create'} Stall
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

const AssignVendorForm = ({ stall, vendors, activity, onSuccess }) => {
    const [formData, setFormData] = useState({
        vendor_id: '',
        start_date: activity?.start_date ? dayjs(activity.start_date) : null,
        end_date: activity?.end_date ? dayjs(activity.end_date) : null,
        notes: ''
    });

    const handleSubmit = async (values) => {
        try {
            const submitData = {
                ...formData,
                start_date: formData.start_date ? formData.start_date.format('YYYY-MM-DD') : null,
                end_date: formData.end_date ? formData.end_date.format('YYYY-MM-DD') : null,
            };
            await api.post(`/event-stalls/${stall.id}/assign-vendor`, submitData);
            message.success('Vendor assigned successfully');
            onSuccess();
        } catch (error) {
            console.error('Error assigning vendor:', error);
            message.error('Error assigning vendor');
        }
    };

    return (
        <Form
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={formData}
        >
            <Form.Item
                label="Select Vendor"
                rules={[{ required: true, message: 'Please select a vendor' }]}
            >
                <Select
                    value={formData.vendor_id}
                    onChange={(value) => setFormData({...formData, vendor_id: value})}
                    placeholder="Choose a vendor..."
                    showSearch
                    filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                >
                    {vendors.map(vendor => (
                        <Select.Option key={vendor.id} value={vendor.id}>
                            {vendor.first_name} {vendor.last_name}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        label="Start Date"
                        rules={[{ required: true, message: 'Please select start date' }]}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            value={formData.start_date}
                            onChange={(date) => setFormData({...formData, start_date: date})}
                            disabledDate={(current) => {
                                if (!current) return false;
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
                        label="End Date"
                        rules={[{ required: true, message: 'Please select end date' }]}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            value={formData.end_date}
                            onChange={(date) => setFormData({...formData, end_date: date})}
                            disabledDate={(current) => {
                                if (!current) return false;
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
                label="Notes"
            >
                <Input.TextArea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    placeholder="Optional notes"
                />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                    <Button 
                        onClick={() => onSuccess()}
                        icon={<CloseOutlined />}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="primary" 
                        htmlType="submit"
                        icon={<UserOutlined />}
                    >
                        Assign Vendor
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default StallsGrid;
