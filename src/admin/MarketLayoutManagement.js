import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Tabs,
  Row,
  Col,
  Tag,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DragOutlined,
  ApartmentOutlined,
  ShopOutlined,
  BorderOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { TabPane } = Tabs;
const { Option } = Select;

const MarketLayoutManagement = () => {
  const [areas, setAreas] = useState([]);
  const [sections, setSections] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMarketLayout();
  }, []);

  const fetchMarketLayout = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/market-layout');
      setAreas(response.data);
    } catch (error) {
      message.error('Failed to fetch market layout');
    } finally {
      setLoading(false);
    }
  };

  const handleAddArea = () => {
    setModalType('area');
    setEditingRecord(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEditArea = (area) => {
    setModalType('area');
    setEditingRecord(area);
    setModalVisible(true);
    form.setFieldsValue(area);
  };

  const handleDeleteArea = async (areaId) => {
    try {
      await axios.delete(`/api/market-layout/areas/${areaId}`);
      message.success('Area deleted successfully');
      fetchMarketLayout();
    } catch (error) {
      message.error('Failed to delete area');
    }
  };

  const handleAddSection = () => {
    setModalType('section');
    setEditingRecord(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEditSection = (section) => {
    setModalType('section');
    setEditingRecord(section);
    setModalVisible(true);
    form.setFieldsValue(section);
  };

  const handleDeleteSection = async (sectionId) => {
    try {
      await axios.delete(`/api/market-layout/sections/${sectionId}`);
      message.success('Section deleted successfully');
      fetchMarketLayout();
    } catch (error) {
      message.error('Failed to delete section');
    }
  };

  const handleAddStall = () => {
    setModalType('stall');
    setEditingRecord(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEditStall = (stall) => {
    setModalType('stall');
    setEditingRecord(stall);
    setModalVisible(true);
    form.setFieldsValue(stall);
  };

  const handleDeleteStall = async (stallId) => {
    try {
      await axios.delete(`/api/market-layout/stalls/${stallId}`);
      message.success('Stall deleted successfully');
      fetchMarketLayout();
    } catch (error) {
      message.error('Failed to delete stall');
    }
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (modalType === 'area') {
        if (editingRecord) {
          await axios.put(`/api/market-layout/areas/${editingRecord.id}`, values);
          message.success('Area updated successfully');
        } else {
          await axios.post('/api/market-layout/areas', values);
          message.success('Area created successfully');
        }
      } else if (modalType === 'section') {
        if (editingRecord) {
          await axios.put(`/api/market-layout/sections/${editingRecord.id}`, values);
          message.success('Section updated successfully');
        } else {
          await axios.post('/api/market-layout/sections', values);
          message.success('Section created successfully');
        }
      } else if (modalType === 'stall') {
        if (editingRecord) {
          await axios.put(`/api/market-layout/stalls/${editingRecord.id}`, values);
          message.success('Stall updated successfully');
        } else {
          await axios.post('/api/market-layout/stalls', values);
          message.success('Stall created successfully');
        }
      }
      
      setModalVisible(false);
      fetchMarketLayout();
    } catch (error) {
      message.error('Operation failed');
    }
  };

  const areaColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Column Count',
      dataIndex: 'column_count',
      key: 'column_count',
    },
    {
      title: 'Position',
      key: 'position',
      render: (_, record) => `X: ${record.position_x}, Y: ${record.position_y}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditArea(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this area?"
            onConfirm={() => handleDeleteArea(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const sectionColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Area',
      dataIndex: ['area', 'name'],
      key: 'area',
    },
    {
      title: 'Rate Type',
      dataIndex: 'rate_type',
      key: 'rate_type',
      render: (type) => <Tag color={type === 'daily' ? 'blue' : 'green'}>{type}</Tag>,
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate) => `₱${rate}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditSection(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this section?"
            onConfirm={() => handleDeleteSection(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const stallColumns = [
    {
      title: 'Stall Number',
      dataIndex: 'stall_number',
      key: 'stall_number',
    },
    {
      title: 'Section',
      dataIndex: ['section', 'name'],
      key: 'section',
    },
    {
      title: 'Position',
      key: 'position',
      render: (_, record) => `Row: ${record.row_position}, Col: ${record.column_position}`,
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          available: 'green',
          occupied: 'red',
          inactive: 'gray',
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => <Switch checked={active} disabled />,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditStall(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this stall?"
            onConfirm={() => handleDeleteStall(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderModalContent = () => {
    if (modalType === 'area') {
      return (
        <>
          <Form.Item
            name="name"
            label="Area Name"
            rules={[{ required: true, message: 'Please enter area name' }]}
          >
            <Input placeholder="Enter area name" />
          </Form.Item>
          <Form.Item
            name="column_count"
            label="Column Count"
            rules={[{ required: true, message: 'Please enter column count' }]}
          >
            <InputNumber min={1} placeholder="Enter column count" style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="position_x" label="Position X">
                <InputNumber placeholder="X position" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="position_y" label="Position Y">
                <InputNumber placeholder="Y position" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </>
      );
    } else if (modalType === 'section') {
      return (
        <>
          <Form.Item
            name="name"
            label="Section Name"
            rules={[{ required: true, message: 'Please enter section name' }]}
          >
            <Input placeholder="Enter section name" />
          </Form.Item>
          <Form.Item
            name="area_id"
            label="Area"
            rules={[{ required: true, message: 'Please select an area' }]}
          >
            <Select placeholder="Select area">
              {areas.map(area => (
                <Option key={area.id} value={area.id}>{area.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="rate_type"
            label="Rate Type"
            rules={[{ required: true, message: 'Please select rate type' }]}
          >
            <Select placeholder="Select rate type">
              <Option value="daily">Daily</Option>
              <Option value="monthly">Monthly</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="rate"
            label="Rate"
            rules={[{ required: true, message: 'Please enter rate' }]}
          >
            <InputNumber
              min={0}
              placeholder="Enter rate"
              style={{ width: '100%' }}
              formatter={value => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₱\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="column_index" label="Column Index">
                <InputNumber placeholder="Column index" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="row_index" label="Row Index">
                <InputNumber placeholder="Row index" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </>
      );
    } else if (modalType === 'stall') {
      return (
        <>
          <Form.Item
            name="stall_number"
            label="Stall Number"
            rules={[{ required: true, message: 'Please enter stall number' }]}
          >
            <Input placeholder="Enter stall number" />
          </Form.Item>
          <Form.Item
            name="section_id"
            label="Section"
            rules={[{ required: true, message: 'Please select a section' }]}
          >
            <Select placeholder="Select section">
              {areas.flatMap(area => (area.sections || []).map(section => (
                <Option key={section.id} value={section.id}>
                  {section.name} ({area.name})
                </Option>
              )))}
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              <Option value="available">Available</Option>
              <Option value="occupied">Occupied</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="row_position" label="Row Position">
                <InputNumber placeholder="Row position" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="column_position" label="Column Position">
                <InputNumber placeholder="Column position" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="size" label="Size">
            <Input placeholder="Enter stall size" />
          </Form.Item>
        </>
      );
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Market Layout Management" extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddArea}>
            Add Area
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSection}>
            Add Section
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddStall}>
            Add Stall
          </Button>
        </Space>
      }>
        <Tabs defaultActiveKey="areas">
          <TabPane tab={<span><ApartmentOutlined />Areas</span>} key="areas">
            <Table
              columns={areaColumns}
              dataSource={areas}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab={<span><ShopOutlined />Sections</span>} key="sections">
            <Table
              columns={sectionColumns}
              dataSource={areas.flatMap(area => area.sections || [])}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab={<span><BorderOutlined />Stalls</span>} key="stalls">
            <Table
              columns={stallColumns}
              dataSource={areas.flatMap(area => 
                (area.sections || []).flatMap(section => section.stalls || [])
              )}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={`${editingRecord ? 'Edit' : 'Add'} ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`}
        visible={modalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          {renderModalContent()}
        </Form>
      </Modal>
    </div>
  );
};

export default MarketLayoutManagement;
