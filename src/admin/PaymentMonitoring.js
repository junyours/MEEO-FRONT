import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Tag,
  Row,
  Col,
  Statistic,
  Tooltip,
  Badge,
  Tabs,
  InputNumber,
} from 'antd';
import {
  CalendarOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  FilterOutlined,
  UserOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Option } = Select;
const { RangePicker } = DatePicker;

const PaymentMonitoring = () => {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(moment().month() + 1);
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    area_id: null,
    section_id: null,
    stall_id: null,
  });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPaymentMonitoring();
  }, [selectedMonth, selectedYear, filters]);

  const fetchPaymentMonitoring = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/payment-monitoring/monthly-monitoring', {
        params: {
          month: selectedMonth,
          year: selectedYear,
          ...filters,
        },
      });
      setPaymentData(response.data);
    } catch (error) {
      message.error('Failed to fetch payment monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = () => {
    setRecordModalVisible(true);
    form.resetFields();
  };

  const handleRecordPaymentSubmit = async () => {
    try {
      const values = await form.validateFields();
      await axios.post('/api/payment-monitoring/record-payment', values);
      message.success('Payment recorded successfully');
      setRecordModalVisible(false);
      fetchPaymentMonitoring();
    } catch (error) {
      message.error('Failed to record payment');
    }
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      paid: 'green',
      unpaid: 'red',
      partial: 'orange',
    };
    return colors[status] || 'default';
  };

  const getPaymentStatusIcon = (status) => {
    const icons = {
      paid: <CheckCircleOutlined />,
      unpaid: <ExclamationCircleOutlined />,
      partial: <ClockCircleOutlined />,
    };
    return icons[status] || null;
  };

  const generateCalendarColumns = () => {
    if (!paymentData) return [];
    
    const columns = [
      {
        title: 'Vendor',
        key: 'vendor',
        fixed: 'left',
        width: 200,
        render: (_, record) => (
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {record.vendor.first_name} {record.vendor.last_name}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Stall: {record.rental?.stall?.stall_number}
            </div>
          </div>
        ),
      },
      {
        title: 'Section',
        key: 'section',
        width: 120,
        render: (_, record) => record.rental?.stall?.section?.name,
      },
    ];

    // Add day columns
    for (let day = 1; day <= paymentData.days_in_month; day++) {
      columns.push({
        title: day.toString(),
        key: `day_${day}`,
        width: 50,
        align: 'center',
        render: (_, record) => {
          const dayData = record.payment_calendar[day];
          if (!dayData) return null;
          
          return (
            <Tooltip title={`Amount: ₱${dayData.amount || 0}`}>
              <Badge
                status={getPaymentStatusColor(dayData.status)}
                text={dayData.amount > 0 ? '₱' : ''}
              />
            </Tooltip>
          );
        },
      });
    }

    // Add summary columns
    columns.push(
      {
        title: 'Total Paid',
        key: 'total_paid',
        fixed: 'right',
        width: 100,
        render: (_, record) => (
          <Statistic
            value={record.total_paid}
            precision={2}
            prefix="₱"
            valueStyle={{ fontSize: '14px' }}
          />
        ),
      },
      {
        title: 'Outstanding',
        key: 'outstanding',
        fixed: 'right',
        width: 100,
        render: (_, record) => (
          <Statistic
            value={record.outstanding_balance}
            precision={2}
            prefix="₱"
            valueStyle={{ 
              fontSize: '14px',
              color: record.outstanding_balance > 0 ? '#cf1322' : '#3f8600'
            }}
          />
        ),
      },
      {
        title: 'Missed Days',
        key: 'missed_days',
        fixed: 'right',
        width: 80,
        render: (_, record) => (
          <Tag color={record.missed_days > 0 ? 'red' : 'green'}>
            {record.missed_days}
          </Tag>
        ),
      }
    );

    return columns;
  };

  const getLegend = () => (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col>
        <Badge status="green" text="Paid" />
      </Col>
      <Col>
        <Badge status="red" text="Unpaid" />
      </Col>
      <Col>
        <Badge status="orange" text="Partial" />
      </Col>
    </Row>
  );

  const getSummaryStats = () => {
    if (!paymentData) return null;
    
    const vendors = paymentData.vendors;
    const totalVendors = vendors.length;
    const totalPaid = vendors.reduce((sum, v) => sum + v.total_paid, 0);
    const totalOutstanding = vendors.reduce((sum, v) => sum + v.outstanding_balance, 0);
    const totalMissedDays = vendors.reduce((sum, v) => sum + v.missed_days, 0);

    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Vendors"
              value={totalVendors}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Collected"
              value={totalPaid}
              precision={2}
              prefix="₱"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Outstanding Balance"
              value={totalOutstanding}
              precision={2}
              prefix="₱"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Missed Days"
              value={totalMissedDays}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card 
        title={
          <Space>
            <CalendarOutlined />
            Monthly Payment Monitoring
          </Space>
        }
        extra={
          <Space>
            <Select
              value={selectedMonth}
              onChange={setSelectedMonth}
              style={{ width: 120 }}
            >
              {moment.months().map((month, index) => (
                <Option key={index + 1} value={index + 1}>
                  {month}
                </Option>
              ))}
            </Select>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ width: 100 }}
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <Option key={year} value={year}>
                  {year}
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleRecordPayment}
            >
              Record Payment
            </Button>
          </Space>
        }
      >
        {getSummaryStats()}
        {getLegend()}
        
        <Table
          columns={generateCalendarColumns()}
          dataSource={paymentData?.vendors || []}
          rowKey="vendor.id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={false}
          size="small"
        />
      </Card>

      {/* Record Payment Modal */}
      <Modal
        title="Record Payment"
        visible={recordModalVisible}
        onOk={handleRecordPaymentSubmit}
        onCancel={() => setRecordModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="vendor_id"
            label="Vendor"
            rules={[{ required: true, message: 'Please select a vendor' }]}
          >
            <Select
              placeholder="Select vendor"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {paymentData?.vendors?.map(record => (
                <Option key={record.vendor.id} value={record.vendor.id}>
                  {record.vendor.first_name} {record.vendor.last_name} - {record.rental?.stall?.stall_number}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="stall_id"
            label="Stall"
            rules={[{ required: true, message: 'Please select a stall' }]}
          >
            <Select placeholder="Select stall">
              {paymentData?.vendors?.map(record => (
                <Option key={record.rental?.stall?.id} value={record.rental?.stall?.id}>
                  {record.rental?.stall?.stall_number} - {record.rental?.stall?.section?.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="payment_date"
            label="Payment Date"
            rules={[{ required: true, message: 'Please select payment date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber
              min={0}
              placeholder="Enter amount"
              style={{ width: '100%' }}
              formatter={value => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₱\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="payment_type"
            label="Payment Type"
            rules={[{ required: true, message: 'Please select payment type' }]}
          >
            <Select placeholder="Select payment type">
              <Option value="partial">Partial</Option>
              <Option value="fully_paid">Fully Paid</Option>
              <Option value="advance">Advance</Option>
            </Select>
          </Form.Item>

          <Form.Item name="days_covered" label="Days Covered (for advance payments)">
            <InputNumber
              min={1}
              placeholder="Number of days covered"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Enter notes (optional)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PaymentMonitoring;
