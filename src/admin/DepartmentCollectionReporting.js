import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  InputNumber,
  Select,
  Row,
  Col,
  Statistic,
  Progress,
  Modal,
  Form,
  Input,
  message,
  Tabs,
  Space,
  Typography,
  Tag,
  Divider,
  Alert,
  Spin,
  Empty,
  Tooltip,
  Badge
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BarChartOutlined,
  TrophyOutlined,
  DollarOutlined,
 
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

import { TbTargetArrow } from "react-icons/tb";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import api from '../Api';
import './DepartmentCollectionReporting.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const DepartmentCollectionReporting = () => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [targetModalVisible, setTargetModalVisible] = useState(false);
  const [collectionModalVisible, setCollectionModalVisible] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('departments');
  const [editingTarget, setEditingTarget] = useState(null);
  const [editingCollection, setEditingCollection] = useState(null);
  const [form] = Form.useForm();
  const [collectionForm] = Form.useForm();

  useEffect(() => {
    fetchDepartments();
    fetchDashboard();
  }, [selectedYear]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/department-collection?year=${selectedYear}`);
      setDepartments(res.data.departments || []);
      setSummary(res.data.summary);
    } catch (err) {
      console.error('Error fetching departments:', err);
      message.error('Failed to fetch department data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await api.get(`/department-collection/dashboard?year=${selectedYear}`);
      setDashboardData(res.data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    }
  };

  const handleUpdateTarget = async (values) => {
    try {
      const res = await api.post('/department-collection/targets', {
        ...values,
        year: selectedYear,
      });
      
      if (res.data.success) {
        message.success('Department target updated successfully');
        setEditingTarget(null);
        fetchDepartments();
      } else {
        message.error(res.data.message || 'Failed to update target');
      }
    } catch (err) {
      console.error('Error updating target:', err);
      message.error('Failed to update department target');
    }
  };

  const handleUpdateMonthlyCollection = async (departmentId, month, amount) => {
    try {
      const res = await api.put(`/department-collection/departments/${departmentId}/collections`, {
        month,
        amount,
        year: selectedYear,
      });
      
      if (res.data.success) {
        message.success('Monthly collection updated successfully');
        setEditingCollection(null);
        fetchDepartments();
      } else {
        message.error(res.data.message || 'Failed to update collection');
      }
    } catch (err) {
      console.error('Error updating collection:', err);
      message.error('Failed to update monthly collection');
    }
  };

  const handleUpdateCollection = async (values) => {
    try {
      const res = await api.put(`/department-collection/departments/${selectedDepartment.id}/collections`, {
        ...values,
        year: selectedYear,
      });
      
      if (res.data.success) {
        message.success('Monthly collection updated successfully');
        setCollectionModalVisible(false);
        collectionForm.resetFields();
        fetchDepartments();
      } else {
        message.error(res.data.message || 'Failed to update collection');
      }
    } catch (err) {
      console.error('Error updating collection:', err);
      message.error('Failed to update monthly collection');
    }
  };

  const handleDeleteTarget = async (targetId) => {
    try {
      await api.delete(`/department-collection/targets/${targetId}`);
      message.success('Department target deleted successfully');
      fetchDepartments();
    } catch (err) {
      console.error('Error deleting target:', err);
      message.error('Failed to delete department target');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#52c41a';
    if (percentage >= 75) return '#faad14';
    if (percentage >= 50) return '#1890ff';
    return '#ff4d4f';
  };

  const getStatusIcon = (met, exceeded) => {
    if (exceeded) return <TrophyOutlined style={{ color: '#52c41a' }} />;
    if (met) return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
  };

  const departmentColumns = [
    {
      title: 'Department',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 200,
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Code: {record.code}
          </Text>
        </div>
      ),
    },
    {
      title: 'Annual Target',
      dataIndex: ['target', 'annual_target'],
      key: 'annual_target',
      width: 150,
      render: (target, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {editingTarget === record.id ? (
            <InputNumber
              value={target}
              onChange={(value) => {
                const updatedDepartments = departments.map(dept => 
                  dept.id === record.id 
                    ? { ...dept, target: { ...dept.target, annual_target: value } }
                    : dept
                );
                setDepartments(updatedDepartments);
              }}
              onPressEnter={() => {
                handleUpdateTarget({
                  department_id: record.id,
                  annual_target: record.target?.annual_target || 0,
                  monthly_targets: record.target?.monthly_targets || {},
                });
              }}
              onBlur={() => setEditingTarget(null)}
              style={{ width: 100 }}
              precision={2}
              formatter={(value) => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          ) : (
            <>
              <Text strong style={{ color: '#1890ff' }}>
                {formatCurrency(target)}
              </Text>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => setEditingTarget(record.id)}
                style={{ padding: 0, height: 20 }}
              />
            </>
          )}
        </div>
      ),
    },
    {
      title: 'January',
      dataIndex: ['collection', 'monthly_collections', 'january'],
      key: 'january',
      width: 120,
      render: (collection, record) => renderMonthlyCell(record, 'january', collection),
    },
    {
      title: 'February',
      dataIndex: ['collection', 'monthly_collections', 'february'],
      key: 'february',
      width: 120,
      render: (collection, record) => renderMonthlyCell(record, 'february', collection),
    },
    {
      title: 'March',
      dataIndex: ['collection', 'monthly_collections', 'march'],
      key: 'march',
      width: 120,
      render: (collection, record) => renderMonthlyCell(record, 'march', collection),
    },
    {
      title: 'April',
      dataIndex: ['collection', 'monthly_collections', 'april'],
      key: 'april',
      width: 120,
      render: (collection, record) => renderMonthlyCell(record, 'april', collection),
    },
    {
      title: 'May',
      dataIndex: ['collection', 'monthly_collections', 'may'],
      key: 'may',
      width: 120,
      render: (collection, record) => renderMonthlyCell(record, 'may', collection),
    },
    {
      title: 'June',
      dataIndex: ['collection', 'monthly_collections', 'june'],
      key: 'june',
      width: 120,
      render: (collection, record) => renderMonthlyCell(record, 'june', collection),
    },
    {
      title: 'July',
      dataIndex: ['collection', 'monthly_collections', 'july'],
      key: 'july',
      width: 120,
      render: (collection, record) => renderMonthlyCell(record, 'july', collection),
    },
    {
      title: 'August',
      dataIndex: ['collection', 'monthly_collections', 'august'],
      key: 'august',
      width: 120,
      render: (collection, record) => renderMonthlyCell(record, 'august', collection),
    },
    {
      title: 'September',
      dataIndex: ['collection', 'monthly_collections', 'september'],
      key: 'september',
      width: 120,
      render: (collection, record) => renderMonthlyCell(record, 'september', collection),
    },
    {
      title: 'October',
      dataIndex: ['collection', 'monthly_collections', 'october'],
      key: 'october',
      width: 120,
      render: (collection, record) => renderMonthlyCell(record, 'october', collection),
    },
    {
      title: 'November',
      dataIndex: ['collection', 'monthly_collections', 'november'],
      key: 'november',
      width: 120,
      render: (collection, record) => renderMonthlyCell(record, 'november', collection),
    },
    {
      title: 'December',
      dataIndex: ['collection', 'monthly_collections', 'december'],
      key: 'december',
      width: 120,
      render: (collection, record) => renderMonthlyCell(record, 'december', collection),
    },
    {
      title: 'Total Collection',
      dataIndex: ['collection', 'total_collection'],
      key: 'total_collection',
      width: 150,
      render: (collection) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatCurrency(collection)}
        </Text>
      ),
    },
    {
      title: 'Progress',
      dataIndex: ['performance', 'progress_percentage'],
      key: 'progress_percentage',
      width: 120,
      render: (percentage) => (
        <div style={{ width: 100 }}>
          <Progress
            percent={Math.round(percentage)}
            strokeColor={getProgressColor(percentage)}
            size="small"
            format={(percent) => `${percent}%`}
          />
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'performance',
      key: 'status',
      width: 120,
      render: (performance) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {getStatusIcon(performance.target_met, performance.exceeded)}
          <Tag color={performance.exceeded ? 'green' : performance.target_met ? 'blue' : 'orange'}>
            {performance.exceeded ? 'Exceeded' : performance.target_met ? 'Met' : 'Below Target'}
          </Tag>
        </div>
      ),
    },
  ];

  const renderMonthlyCell = (record, month, collection) => {
    const editingKey = `${record.id}-${month}`;
    const isEditing = editingCollection === editingKey;
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {isEditing ? (
          <InputNumber
            value={collection}
            onChange={(value) => {
              const updatedDepartments = departments.map(dept => {
                if (dept.id === record.id) {
                  return {
                    ...dept,
                    collection: {
                      ...dept.collection,
                      monthly_collections: {
                        ...dept.collection.monthly_collections,
                        [month]: value
                      }
                    }
                  };
                }
                return dept;
              });
              setDepartments(updatedDepartments);
            }}
            onPressEnter={() => {
              handleUpdateMonthlyCollection(record.id, month, collection);
            }}
            onBlur={() => setEditingCollection(null)}
            style={{ width: 80 }}
            precision={2}
            formatter={(value) => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          />
        ) : (
          <>
            <Text style={{ color: '#52c41a', fontWeight: 500 }}>
              {formatCurrency(collection)}
            </Text>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => setEditingCollection(editingKey)}
              style={{ padding: 0, height: 20 }}
            />
          </>
        )}
      </div>
    );
  };

  const monthlyColumns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
    },
    {
      title: 'Target',
      dataIndex: 'target',
      key: 'target',
      render: (target) => formatCurrency(target),
    },
    {
      title: 'Collection',
      dataIndex: 'collection',
      key: 'collection',
      render: (collection) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatCurrency(collection)}
        </Text>
      ),
    },
    {
      title: 'Progress',
      dataIndex: 'progress_percentage',
      key: 'progress_percentage',
      render: (percentage) => (
        <Progress
          percent={Math.round(percentage)}
          strokeColor={getProgressColor(percentage)}
          size="small"
          format={(percent) => `${percent}%`}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'target_met',
      key: 'target_met',
      render: (met, record) => (
        <Tag color={record.exceeded ? 'green' : met ? 'blue' : 'orange'}>
          {record.exceeded ? 'Exceeded' : met ? 'Met' : 'Below Target'}
        </Tag>
      ),
    },
  ];

  return (
    <div className="department-collection-reporting">
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChartOutlined />
                Department Collection Reporting
              </Title>
            </Col>
            <Col>
              <Space>
                <Select
                  value={selectedYear}
                  onChange={setSelectedYear}
                  style={{ width: 120 }}
                  placeholder="Select Year"
                >
                  {[2024, 2025, 2026, 2027, 2028].map(year => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchDepartments}
                  loading={loading}
                >
                  Refresh
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {summary && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Departments"
                  value={summary.total_departments}
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Target"
                  value={summary.total_target}
                  prefix={<TbTargetArrow />}
                  formatter={(value) => formatCurrency(value)}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Collection"
                  value={summary.total_collection}
                  prefix={<DollarOutlined />}
                  formatter={(value) => formatCurrency(value)}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Overall Progress"
                  value={summary.overall_progress_percentage}
                  prefix={<TrophyOutlined />}
                  suffix="%"
                  precision={1}
                  valueStyle={{ 
                    color: summary.overall_progress_percentage >= 100 ? '#52c41a' : 
                           summary.overall_progress_percentage >= 75 ? '#faad14' : '#ff4d4f'
                  }}
                />
              </Card>
            </Col>
          </Row>
        )}

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Department Overview" key="departments">
            <Spin spinning={loading}>
              {departments.length > 0 ? (
                <Table
                  columns={departmentColumns}
                  dataSource={departments}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  scroll={{ x: 1800, y: 400 }}
                />
              ) : (
                <Empty description="No department data available" />
              )}
            </Spin>
          </TabPane>

          <TabPane tab="Dashboard Analytics" key="dashboard">
            {dashboardData && (
              <div>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={24}>
                    <Alert
                      message={`${selectedYear} Performance Overview`}
                      description={
                        <div>
                          <Badge count={dashboardData.summary.targets_met} style={{ backgroundColor: '#52c41a' }} /> targets met
                          <Badge count={dashboardData.summary.targets_exceeded} style={{ backgroundColor: '#faad14', marginLeft: 16 }} /> targets exceeded
                        </div>
                      }
                      type="info"
                      showIcon
                    />
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={16}>
                    <Card title="Monthly Collection Trend" size="small">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dashboardData.chart_data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                          <Line
                            type="monotone"
                            dataKey="collection"
                            stroke="#1890ff"
                            strokeWidth={2}
                            dot={{ fill: '#1890ff', r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card title="Monthly Totals" size="small">
                      {Object.entries(dashboardData.monthly_totals).map(([month, total]) => (
                        <div key={month} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text>{month}:</Text>
                          <Text strong>{formatCurrency(total)}</Text>
                        </div>
                      ))}
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* Add/Edit Target Modal */}
      <Modal
        title={`${selectedDepartment ? 'Edit' : 'Add'} Department Target - ${selectedYear}`}
        open={targetModalVisible}
        onCancel={() => {
          setTargetModalVisible(false);
          form.resetFields();
          setSelectedDepartment(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setTargetModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            {selectedDepartment ? 'Update' : 'Create'} Target
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateTarget}
        >
          <Form.Item
            name="department_id"
            label="Department"
            rules={[{ required: true, message: 'Please select department' }]}
          >
            <Select placeholder="Select department" disabled={!!selectedDepartment}>
              {departments.map(dept => (
                <Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="annual_target"
            label="Annual Target"
            rules={[{ required: true, message: 'Please enter annual target' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter annual target"
              min={0}
              precision={2}
              formatter={(value) => `₱ ${value}`.replace(/\B(?=(\d{3})+(?=\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item label="Monthly Targets">
            <Row gutter={8}>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                <Col span={8} key={index}>
                  <Form.Item
                    name={['monthly_targets', Object.keys(form.getFieldValue('monthly_targets') || {})[index] || ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'][index]]}
                    label={month}
                    rules={[{ required: true, message: `Please enter ${month} target` }]}
                  >
                    <InputNumber
                      placeholder="0"
                      min={0}
                      precision={2}
                      style={{ width: '100%' }}
                      formatter={(value) => `₱ ${value}`.replace(/\B(?=(\d{3})+(?=\d))/g, ',')}
                    />
                  </Form.Item>
                </Col>
              ))}
            </Row>
          </Form.Item>
        </Form>
      </Modal>

      {/* Update Collection Modal */}
      <Modal
        title={`Update Collection - ${selectedDepartment?.name}`}
        open={collectionModalVisible}
        onCancel={() => {
          setCollectionModalVisible(false);
          collectionForm.resetFields();
          setSelectedDepartment(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setCollectionModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={() => collectionForm.submit()}>
            Update Collection
          </Button>,
        ]}
        width={500}
      >
        <Form
          form={collectionForm}
          layout="vertical"
          onFinish={handleUpdateCollection}
        >
          <Form.Item
            name="month"
            label="Month"
            rules={[{ required: true, message: 'Please select month' }]}
          >
            <Select placeholder="Select month">
              <Option value="january">January</Option>
              <Option value="february">February</Option>
              <Option value="march">March</Option>
              <Option value="april">April</Option>
              <Option value="may">May</Option>
              <Option value="june">June</Option>
              <Option value="july">July</Option>
              <Option value="august">August</Option>
              <Option value="september">September</Option>
              <Option value="october">October</Option>
              <Option value="november">November</Option>
              <Option value="december">December</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="Collection Amount"
            rules={[{ required: true, message: 'Please enter collection amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter collection amount"
              min={0}
              precision={2}
              formatter={(value) => `₱ ${value}`.replace(/\B(?=(\d{3})+(?=\d))/g, ',')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DepartmentCollectionReporting;
