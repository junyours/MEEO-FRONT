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
  Statistic,
  Progress,
  Tag,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BarChartOutlined,
  PieChartOutlined,
  DollarOutlined,

} from '@ant-design/icons';
import { TbTargetArrow } from "react-icons/tb";

import axios from 'axios';
import { Line, Column } from '@ant-design/plots';

const { TabPane } = Tabs;
const { Option } = Select;

const TargetCollectionReporting = () => {
  const [departments, setDepartments] = useState([]);
  const [targets, setTargets] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [monthlyReportData, setMonthlyReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [targetModalVisible, setTargetModalVisible] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [editingTarget, setEditingTarget] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [form] = Form.useForm();
  const [targetForm] = Form.useForm();

  useEffect(() => {
    fetchDepartments();
    fetchTargets();
    fetchReport();
  }, [selectedYear]);

  useEffect(() => {
    if (selectedMonth) {
      fetchMonthlyReport();
    }
  }, [selectedYear, selectedMonth]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/target-collection/departments');
      setDepartments(response.data);
    } catch (error) {
      message.error('Failed to fetch departments');
    }
  };

  const fetchTargets = async () => {
    try {
      const response = await axios.get('/api/target-collection/targets', {
        params: { year: selectedYear }
      });
      setTargets(response.data.targets || []);
    } catch (error) {
      message.error('Failed to fetch targets');
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/target-collection/report', {
        params: { year: selectedYear }
      });
      setReportData(response.data);
    } catch (error) {
      message.error('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/target-collection/monthly-report', {
        params: { 
          year: selectedYear,
          month: selectedMonth 
        }
      });
      setMonthlyReportData(response.data);
    } catch (error) {
      message.error('Failed to fetch monthly report');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = () => {
    setEditingDepartment(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setModalVisible(true);
    form.setFieldsValue(department);
  };

  const handleDeleteDepartment = async (departmentId) => {
    try {
      await axios.delete(`/api/target-collection/departments/${departmentId}`);
      message.success('Department deleted successfully');
      fetchDepartments();
    } catch (error) {
      message.error('Failed to delete department');
    }
  };

  const handleAddTarget = () => {
    setEditingTarget(null);
    setTargetModalVisible(true);
    targetForm.resetFields();
  };

  const handleEditTarget = (target) => {
    setEditingTarget(target);
    setTargetModalVisible(true);
    targetForm.setFieldsValue(target);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingDepartment) {
        await axios.put(`/api/target-collection/departments/${editingDepartment.id}`, values);
        message.success('Department updated successfully');
      } else {
        await axios.post('/api/target-collection/departments', values);
        message.success('Department created successfully');
      }
      
      setModalVisible(false);
      fetchDepartments();
    } catch (error) {
      message.error('Operation failed');
    }
  };

  const handleTargetModalSubmit = async () => {
    try {
      const values = await targetForm.validateFields();
      values.year = selectedYear;
      
      if (editingTarget) {
        await axios.put(`/api/target-collection/targets/${editingTarget.id}`, values);
        message.success('Target updated successfully');
      } else {
        await axios.post('/api/target-collection/targets', values);
        message.success('Target created successfully');
      }
      
      setTargetModalVisible(false);
      fetchTargets();
      fetchReport();
    } catch (error) {
      message.error('Operation failed');
    }
  };

  const handleUpdateMonthlyCollection = async (targetId, month, amount) => {
    try {
      await axios.put(`/api/target-collection/targets/${targetId}/monthly-collection`, {
        month,
        amount,
      });
      message.success('Monthly collection updated successfully');
      fetchReport();
      if (selectedMonth) {
        fetchMonthlyReport();
      }
    } catch (error) {
      message.error('Failed to update monthly collection');
    }
  };

  const departmentColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
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
            onClick={() => handleEditDepartment(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this department?"
            onConfirm={() => handleDeleteDepartment(record.id)}
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

  const targetColumns = [
    {
      title: 'Department',
      dataIndex: ['department', 'name'],
      key: 'department',
    },
    {
      title: 'Annual Target',
      dataIndex: 'annual_target',
      key: 'annual_target',
      render: (target) => `₱${target.toLocaleString()}`,
    },
    {
      title: 'Total Collection',
      key: 'total_collection',
      render: (_, record) => `₱${record.total_collection.toLocaleString()}`,
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => (
        <Progress
          percent={record.progress_percentage}
          size="small"
          status={record.progress_percentage >= 100 ? 'success' : 'active'}
        />
      ),
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
            onClick={() => handleEditTarget(record)}
          />
        </Space>
      ),
    },
  ];

  const reportColumns = [
    {
      title: 'Department',
      dataIndex: ['department', 'name'],
      key: 'department',
      fixed: 'left',
    },
    {
      title: 'Annual Target',
      dataIndex: 'annual_target',
      key: 'annual_target',
      render: (target) => `₱${target.toLocaleString()}`,
    },
    ...['january', 'february', 'march', 'april', 'may', 'june', 
        'july', 'august', 'september', 'october', 'november', 'december'].map(month => ({
      title: month.charAt(0).toUpperCase() + month.slice(1),
      dataIndex: `monthly_collections.${month}`,
      key: month,
      render: (amount, record) => (
        <InputNumber
          value={record.monthly_collections[month]}
          onChange={(value) => handleUpdateMonthlyCollection(record.id, month, value || 0)}
          style={{ width: '100%' }}
          formatter={value => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/₱\s?|(,*)/g, '')}
        />
      ),
    })),
    {
      title: 'Total Collection',
      key: 'total_collection',
      render: (_, record) => `₱${record.total_collection.toLocaleString()}`,
    },
    {
      title: 'Progress %',
      key: 'progress',
      render: (_, record) => (
        <Progress
          percent={record.progress_percentage}
          size="small"
          status={record.progress_percentage >= 100 ? 'success' : 'active'}
        />
      ),
    },
  ];

  const getChartConfig = () => {
    if (!reportData) return null;

    const data = reportData.departments.map(dept => ({
      month: 'Total',
      value: dept.total_collection,
      category: dept.department.name,
    }));

    return {
      data,
      xField: 'category',
      yField: 'value',
      seriesField: 'month',
      color: ['#1890ff', '#52c41a', '#faad14', '#f5222d'],
      columnWidthRatio: 0.8,
      meta: {
        value: {
          alias: 'Collection',
          formatter: (v) => `₱${v.toLocaleString()}`,
        },
      },
    };
  };

  const getLineChartConfig = () => {
    if (!reportData) return null;

    const months = ['january', 'february', 'march', 'april', 'may', 'june',
                   'july', 'august', 'september', 'october', 'november', 'december'];
    
    const data = months.map((month, index) => {
      const monthData = {
        month: month.charAt(0).toUpperCase() + month.slice(1),
        index: index + 1,
      };
      
      reportData.departments.forEach(dept => {
        monthData[dept.department.name] = dept.monthly_collections[month];
      });
      
      return monthData;
    });

    return {
      data,
      xField: 'month',
      yField: 'value',
      seriesField: 'type',
      smooth: true,
      color: ['#1890ff', '#52c41a', '#faad14', '#f5222d'],
    };
  };

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Select
            value={selectedYear}
            onChange={setSelectedYear}
            style={{ width: 120, marginRight: 16 }}
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <Option key={year} value={year}>{year}</Option>
            ))}
          </Select>
          <Select
            value={selectedMonth}
            onChange={setSelectedMonth}
            placeholder="Select month for detailed view"
            style={{ width: 150 }}
            allowClear
          >
            {['January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
              <Option key={index + 1} value={month.toLowerCase()}>{month}</Option>
            ))}
          </Select>
        </Col>
      </Row>

      {reportData && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Target"
                value={reportData.summary.total_target}
                precision={2}
                prefix={<TbTargetArrow  />}
                formatter={(value) => `₱${value.toLocaleString()}`}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Collection"
                value={reportData.summary.total_collection}
                precision={2}
                prefix={<DollarOutlined />}
                formatter={(value) => `₱${value.toLocaleString()}`}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Overall Progress"
                value={reportData.summary.overall_progress}
                precision={1}
                suffix="%"
                prefix={<BarChartOutlined />}
                valueStyle={{ 
                  color: reportData.summary.overall_progress >= 100 ? '#3f8600' : '#cf1322' 
                }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Departments"
                value={reportData.summary.departments_count}
                prefix={<PieChartOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Tabs defaultActiveKey="departments">
        <TabPane tab="Departments" key="departments">
          <Card 
            title="Department Management"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDepartment}>
                Add Department
              </Button>
            }
          >
            <Table
              columns={departmentColumns}
              dataSource={departments}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Targets" key="targets">
          <Card 
            title={`Annual Targets - ${selectedYear}`}
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTarget}>
                Set Target
              </Button>
            }
          >
            <Table
              columns={targetColumns}
              dataSource={targets}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Collection Report" key="report">
          <Card title={`Collection Report - ${selectedYear}`}>
            <Table
              columns={reportColumns}
              dataSource={reportData?.departments || []}
              rowKey="id"
              loading={loading}
              scroll={{ x: 'max-content' }}
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane tab="Charts" key="charts">
          <Row gutter={16}>
            <Col span={24}>
              <Card title="Department Collections Comparison">
                {getChartConfig() && <Column {...getChartConfig()} />}
              </Card>
            </Col>
            <Col span={24} style={{ marginTop: 16 }}>
              <Card title="Monthly Collection Trend">
                {getLineChartConfig() && <Line {...getLineChartConfig()} />}
              </Card>
            </Col>
          </Row>
        </TabPane>

        {monthlyReportData && (
          <TabPane tab={`Monthly Report - ${selectedMonth?.charAt(0).toUpperCase() + selectedMonth?.slice(1)}`} key="monthly">
            <Card title={`Monthly Report - ${selectedMonth?.charAt(0).toUpperCase() + selectedMonth?.slice(1)} ${selectedYear}`}>
              <Table
                columns={[
                  {
                    title: 'Department',
                    dataIndex: 'department.name',
                    key: 'department',
                  },
                  {
                    title: 'Monthly Target',
                    dataIndex: 'monthly_target',
                    key: 'monthly_target',
                    render: (target) => `₱${target.toLocaleString()}`,
                  },
                  {
                    title: 'Monthly Collection',
                    dataIndex: 'monthly_collection',
                    key: 'monthly_collection',
                    render: (collection) => `₱${collection.toLocaleString()}`,
                  },
                  {
                    title: 'Progress',
                    dataIndex: 'monthly_progress',
                    key: 'monthly_progress',
                    render: (progress) => (
                      <Progress
                        percent={progress}
                        size="small"
                        status={progress >= 100 ? 'success' : 'active'}
                      />
                    ),
                  },
                ]}
                dataSource={monthlyReportData.departments}
                rowKey="department.id"
                loading={loading}
                pagination={false}
              />
            </Card>
          </TabPane>
        )}
      </Tabs>

      {/* Department Modal */}
      <Modal
        title={`${editingDepartment ? 'Edit' : 'Add'} Department`}
        visible={modalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Department Name"
            rules={[{ required: true, message: 'Please enter department name' }]}
          >
            <Input placeholder="Enter department name" />
          </Form.Item>
          <Form.Item
            name="code"
            label="Department Code"
            rules={[{ required: true, message: 'Please enter department code' }]}
          >
            <Input placeholder="Enter department code" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Enter description" />
          </Form.Item>
          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Select defaultValue={true}>
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Target Modal */}
      <Modal
        title={`${editingTarget ? 'Edit' : 'Set'} Target - ${selectedYear}`}
        visible={targetModalVisible}
        onOk={handleTargetModalSubmit}
        onCancel={() => setTargetModalVisible(false)}
      >
        <Form form={targetForm} layout="vertical">
          <Form.Item
            name="department_id"
            label="Department"
            rules={[{ required: true, message: 'Please select a department' }]}
          >
            <Select placeholder="Select department">
              {departments.map(dept => (
                <Option key={dept.id} value={dept.id}>{dept.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="annual_target"
            label="Annual Target"
            rules={[{ required: true, message: 'Please enter annual target' }]}
          >
            <InputNumber
              min={0}
              placeholder="Enter annual target"
              style={{ width: '100%' }}
              formatter={value => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₱\s?|(,*)/g, '')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TargetCollectionReporting;
