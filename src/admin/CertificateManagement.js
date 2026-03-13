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
  Popconfirm,
  Tabs,
  Tag,
  Row,
  Col,
  Statistic,
  Badge,
  Tooltip,
  Descriptions,
} from 'antd';
import {
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PrinterOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const CertificateManagement = () => {
  const [certificates, setCertificates] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [expired, setExpired] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [renewModalVisible, setRenewModalVisible] = useState(false);
  const [revokeModalVisible, setRevokeModalVisible] = useState(false);
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [form] = Form.useForm();
  const [renewForm] = Form.useForm();
  const [revokeForm] = Form.useForm();

  useEffect(() => {
    fetchCertificates();
    fetchTemplates();
    fetchExpiringSoon();
    fetchExpired();
  }, []);

  const fetchCertificates = async (params = {}) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/certificates', { params });
      setCertificates(response.data.data || response.data);
    } catch (error) {
      message.error('Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/certificates/templates');
      setTemplates(response.data);
    } catch (error) {
      message.error('Failed to fetch templates');
    }
  };

  const fetchExpiringSoon = async () => {
    try {
      const response = await axios.get('/api/certificates/expiring-soon');
      setExpiringSoon(response.data);
    } catch (error) {
      message.error('Failed to fetch expiring soon certificates');
    }
  };

  const fetchExpired = async () => {
    try {
      const response = await axios.get('/api/certificates/expired');
      setExpired(response.data);
    } catch (error) {
      message.error('Failed to fetch expired certificates');
    }
  };

  const handleAddCertificate = () => {
    setEditingCertificate(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEditCertificate = (certificate) => {
    setEditingCertificate(certificate);
    setModalVisible(true);
    form.setFieldsValue({
      ...certificate,
      issue_date: moment(certificate.issue_date),
      expiry_date: moment(certificate.expiry_date),
    });
  };

  const handleDeleteCertificate = async (certificateId) => {
    try {
      await axios.delete(`/api/certificates/${certificateId}`);
      message.success('Certificate deleted successfully');
      fetchCertificates();
      fetchExpiringSoon();
      fetchExpired();
    } catch (error) {
      message.error('Failed to delete certificate');
    }
  };

  const handleRenewCertificate = (certificate) => {
    setSelectedCertificate(certificate);
    setRenewModalVisible(true);
    renewForm.resetFields();
  };

  const handleRevokeCertificate = (certificate) => {
    setSelectedCertificate(certificate);
    setRevokeModalVisible(true);
    revokeForm.resetFields();
  };

  const handleGeneratePdf = (certificate) => {
    setSelectedCertificate(certificate);
    setPdfModalVisible(true);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingCertificate) {
        await axios.put(`/api/certificates/${editingCertificate.id}`, values);
        message.success('Certificate updated successfully');
      } else {
        await axios.post('/api/certificates', values);
        message.success('Certificate created successfully');
      }
      
      setModalVisible(false);
      fetchCertificates();
      fetchExpiringSoon();
      fetchExpired();
    } catch (error) {
      message.error('Operation failed');
    }
  };

  const handleRenewSubmit = async () => {
    try {
      const values = await renewForm.validateFields();
      await axios.post(`/api/certificates/${selectedCertificate.id}/renew`, values);
      message.success('Certificate renewed successfully');
      setRenewModalVisible(false);
      fetchCertificates();
      fetchExpiringSoon();
      fetchExpired();
    } catch (error) {
      message.error('Failed to renew certificate');
    }
  };

  const handleRevokeSubmit = async () => {
    try {
      const values = await revokeForm.validateFields();
      await axios.post(`/api/certificates/${selectedCertificate.id}/revoke`, values);
      message.success('Certificate revoked successfully');
      setRevokeModalVisible(false);
      fetchCertificates();
      fetchExpiringSoon();
      fetchExpired();
    } catch (error) {
      message.error('Failed to revoke certificate');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'green',
      expired: 'red',
      revoked: 'orange',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      active: <CheckCircleOutlined />,
      expired: <ExclamationCircleOutlined />,
      revoked: <CloseCircleOutlined />,
    };
    return icons[status] || null;
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = moment();
    const expiry = moment(expiryDate);
    return expiry.diff(today, 'days');
  };

  const columns = [
    {
      title: 'Certificate Number',
      dataIndex: 'certificate_number',
      key: 'certificate_number',
      fixed: 'left',
      width: 180,
    },
    {
      title: 'Vendor Name',
      key: 'vendor_name',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.vendor_first_name} {record.vendor_last_name}
          </div>
          {record.vendor && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              ID: {record.vendor.id}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Template',
      dataIndex: 'template_name',
      key: 'template_name',
    },
    {
      title: 'Stall Number',
      dataIndex: 'stall_number',
      key: 'stall_number',
    },
    {
      title: 'Issue Date',
      dataIndex: 'issue_date',
      key: 'issue_date',
      render: (date) => moment(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      render: (date) => {
        const daysUntil = getDaysUntilExpiry(date);
        const color = daysUntil <= 30 && daysUntil > 0 ? 'orange' : 'inherit';
        return (
          <span style={{ color }}>
            {moment(date).format('MMM DD, YYYY')}
            {daysUntil > 0 && daysUntil <= 30 && (
              <Tag color="orange" style={{ marginLeft: 8 }}>
                {daysUntil} days
              </Tag>
            )}
          </span>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="View/Edit">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditCertificate(record)}
            />
          </Tooltip>
          <Tooltip title="Generate PDF">
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              size="small"
              onClick={() => handleGeneratePdf(record)}
            />
          </Tooltip>
          {record.status === 'active' && (
            <>
              <Tooltip title="Renew">
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  size="small"
                  onClick={() => handleRenewCertificate(record)}
                />
              </Tooltip>
              <Tooltip title="Revoke">
                <Button
                  type="primary"
                  danger
                  icon={<CloseCircleOutlined />}
                  size="small"
                  onClick={() => handleRevokeCertificate(record)}
                />
              </Tooltip>
            </>
          )}
          <Popconfirm
            title="Are you sure you want to delete this certificate?"
            onConfirm={() => handleDeleteCertificate(record.id)}
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

  const getSummaryStats = () => {
    const activeCount = certificates.filter(c => c.status === 'active').length;
    const expiredCount = certificates.filter(c => c.status === 'expired').length;
    const revokedCount = certificates.filter(c => c.status === 'revoked').length;
    const expiringSoonCount = expiringSoon.length;

    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Certificates"
              value={activeCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Expiring Soon (30 days)"
              value={expiringSoonCount}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Expired Certificates"
              value={expiredCount}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Revoked Certificates"
              value={revokedCount}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
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
            <FileTextOutlined />
            Certificate Management
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCertificate}>
            Issue Certificate
          </Button>
        }
      >
        {getSummaryStats()}

        <Tabs defaultActiveKey="all">
          <TabPane tab={`All Certificates (${certificates.length})`} key="all">
            <Table
              columns={columns}
              dataSource={certificates}
              rowKey="id"
              loading={loading}
              scroll={{ x: 'max-content' }}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane tab={`Expiring Soon (${expiringSoon.length})`} key="expiring">
            <Table
              columns={columns}
              dataSource={expiringSoon}
              rowKey="id"
              loading={loading}
              scroll={{ x: 'max-content' }}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane tab={`Expired (${expired.length})`} key="expired">
            <Table
              columns={columns}
              dataSource={expired}
              rowKey="id"
              loading={loading}
              scroll={{ x: 'max-content' }}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Add/Edit Certificate Modal */}
      <Modal
        title={`${editingCertificate ? 'Edit' : 'Issue'} Certificate`}
        visible={modalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="template_name"
            label="Certificate Template"
            rules={[{ required: true, message: 'Please select a template' }]}
          >
            <Select placeholder="Select template">
              {templates.map(template => (
                <Option key={template.name} value={template.name}>
                  {template.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="vendor_first_name"
                label="First Name"
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input placeholder="Enter first name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="vendor_middle_name" label="Middle Name">
                <Input placeholder="Enter middle name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="vendor_last_name"
                label="Last Name"
                rules={[{ required: true, message: 'Please enter last name' }]}
              >
                <Input placeholder="Enter last name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="stall_number" label="Stall Number">
            <Input placeholder="Enter stall number" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="issue_date"
                label="Issue Date"
                rules={[{ required: true, message: 'Please select issue date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="expiry_date"
                label="Expiry Date"
                rules={[{ required: true, message: 'Please select expiry date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} placeholder="Enter notes (optional)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Renew Certificate Modal */}
      <Modal
        title="Renew Certificate"
        visible={renewModalVisible}
        onOk={handleRenewSubmit}
        onCancel={() => setRenewModalVisible(false)}
      >
        <Form form={renewForm} layout="vertical">
          <Form.Item
            name="new_expiry_date"
            label="New Expiry Date"
            rules={[{ required: true, message: 'Please select new expiry date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="renewal_notes" label="Renewal Notes">
            <TextArea rows={3} placeholder="Enter renewal notes" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Revoke Certificate Modal */}
      <Modal
        title="Revoke Certificate"
        visible={revokeModalVisible}
        onOk={handleRevokeSubmit}
        onCancel={() => setRevokeModalVisible(false)}
      >
        <Form form={revokeForm} layout="vertical">
          <Form.Item
            name="revocation_reason"
            label="Revocation Reason"
            rules={[{ required: true, message: 'Please enter revocation reason' }]}
          >
            <TextArea rows={4} placeholder="Enter reason for revocation" />
          </Form.Item>
        </Form>
      </Modal>

      {/* PDF Preview Modal */}
      <Modal
        title="Certificate PDF Preview"
        visible={pdfModalVisible}
        onCancel={() => setPdfModalVisible(false)}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />}>
            Print Certificate
          </Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />}>
            Download PDF
          </Button>,
        ]}
        width={800}
      >
        {selectedCertificate && (
          <div style={{ padding: '20px', border: '1px solid #d9d9d9' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2>CERTIFICATE OF BUSINESS OPERATION</h2>
              <p>MEEO Office</p>
            </div>
            
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Certificate Number" span={2}>
                {selectedCertificate.certificate_number}
              </Descriptions.Item>
              <Descriptions.Item label="Vendor Name" span={2}>
                {selectedCertificate.vendor_first_name} {selectedCertificate.vendor_middle_name} {selectedCertificate.vendor_last_name}
              </Descriptions.Item>
              <Descriptions.Item label="Stall Number">
                {selectedCertificate.stall_number}
              </Descriptions.Item>
              <Descriptions.Item label="Certificate Type">
                {selectedCertificate.template_name}
              </Descriptions.Item>
              <Descriptions.Item label="Issue Date">
                {moment(selectedCertificate.issue_date).format('MMMM DD, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Expiry Date">
                {moment(selectedCertificate.expiry_date).format('MMMM DD, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Tag color={getStatusColor(selectedCertificate.status)}>
                  {selectedCertificate.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            
            {selectedCertificate.notes && (
              <div style={{ marginTop: '20px' }}>
                <strong>Notes:</strong>
                <p>{selectedCertificate.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CertificateManagement;
