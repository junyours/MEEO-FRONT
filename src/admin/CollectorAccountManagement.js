import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  KeyOutlined,
  MailOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import api from '../Api';
import './CollectorAccountManagement.css';

const { Text, Title } = Typography;

const CollectorAccountManagement = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resettingAccountId, setResettingAccountId] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const fetchAccounts = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await api.get('/admin/collector-accounts');

      if (!Array.isArray(response.data)) {
        throw new Error('Unexpected account data returned by the server.');
      }

      setAccounts(response.data);
    } catch (error) {
      message.error(
        error.response?.data?.message ||
        error.message ||
        'Failed to load collector and staff accounts.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const filteredAccounts = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return accounts;
    }

    return accounts.filter((account) => (
      String(account.username || '').toLowerCase().includes(query) ||
      String(account.email || '').toLowerCase().includes(query) ||
      String(account.role || '').toLowerCase().includes(query)
    ));
  }, [accounts, searchText]);

  const handleCreate = async (values) => {
    setSaving(true);

    try {
      const response = await api.post('/admin/collector-accounts', {
        username: values.username.trim(),
        email: values.email.trim().toLowerCase(),
        role: values.role,
      });

      message.success(
        response.data?.message ||
        'Account created with the default password.'
      );

      setCreateModalOpen(false);
      form.resetFields();

      await fetchAccounts(false);
    } catch (error) {
      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(validationErrors)
          .flat()
          .find(Boolean);

        message.error(
          firstError ||
          error.response?.data?.message ||
          'Failed to create the account.'
        );
      } else {
        message.error(
          error.response?.data?.message ||
          'Failed to create the account.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (account) => {
    setResettingAccountId(account.id);

    try {
      const response = await api.post(
        `/admin/collector-accounts/${account.id}/reset-default-password`
      );

      message.success(
        response.data?.message ||
        `Default password restored for ${account.username}.`
      );

      setAccounts((currentAccounts) =>
        currentAccounts.map((item) =>
          item.id === account.id
            ? { ...item, is_default_password: true }
            : item
        )
      );
    } catch (error) {
      message.error(
        error.response?.data?.message ||
        `Failed to reset ${account.username}'s password.`
      );
    } finally {
      setResettingAccountId(null);
    }
  };

  const handleOpenCreateModal = () => {
    form.resetFields();
    form.setFieldsValue({
      role: 'collector',
    });
    setCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
    form.resetFields();
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (username) => (
        <Space>
          <span className="collector-account-avatar">
            <UserOutlined />
          </span>
          <Text strong>{username}</Text>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => (
        <Space size={6}>
          <MailOutlined />
          <Text>{email || '—'}</Text>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'collector' ? 'blue' : 'purple'}>
          {role === 'collector' ? 'Collector' : 'Staff'}
        </Tag>
      ),
    },
    {
      title: 'Password status',
      dataIndex: 'is_default_password',
      key: 'password_status',
      render: (isDefault) => (
        <Tag color={isDefault ? 'green' : 'default'}>
          {isDefault ? 'Default password active' : 'Custom password'}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (createdAt) =>
        createdAt
          ? new Date(createdAt).toLocaleDateString()
          : '—',
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, account) => (
        <Popconfirm
          title="Reset this account to the default password?"
          description={
            <>
              <div>
                The password for <strong>{account.username}</strong> will be
                changed back to the default password.
              </div>
              <div style={{ marginTop: 6 }}>
                Default password: <strong>p@ssword123</strong>
              </div>
              <div style={{ marginTop: 6 }}>
                Existing sessions will be signed out.
              </div>
            </>
          }
          okText="Reset password"
          cancelText="Cancel"
          onConfirm={() => handleReset(account)}
        >
          <Button
            icon={<KeyOutlined />}
            loading={resettingAccountId === account.id}
            disabled={account.is_default_password}
          >
            Reset to default
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <main className="collector-account-page">
      <header className="collector-account-header">
        <div className="collector-account-header-copy">
          <Text className="collector-account-eyebrow">
            ACCESS MANAGEMENT
          </Text>

          <Title level={2}>
            Collector &amp; Staff Accounts
          </Title>

          <Text type="secondary">
            Create login accounts and restore the default password when needed.
          </Text>
        </div>

        <Space>
          <Button
            icon={<ReloadOutlined />}
            loading={refreshing}
            onClick={() => fetchAccounts(false)}
          >
            Refresh
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreateModal}
          >
            Create account
          </Button>
        </Space>
      </header>

      <Alert
        className="collector-account-note"
        type="info"
        showIcon
        message="New Collector and Staff accounts use p@ssword123 as their default password. Admins can restore this password when an account holder forgets their password."
      />

      <Card
        className="collector-account-card"
        bordered={false}
      >
        <div className="collector-account-list-header">
          <div>
            <Title level={4}>
              Managed accounts
            </Title>

            <Text type="secondary">
              {accounts.length} account
              {accounts.length === 1 ? '' : 's'}
            </Text>
          </div>

          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search username, email or role"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="collector-account-search"
          />
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredAccounts}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
          }}
          locale={{
            emptyText: searchText
              ? 'No accounts match your search.'
              : 'No collector or staff accounts yet.',
          }}
        />
      </Card>

      <Modal
        title="Create collector or staff account"
        open={createModalOpen}
        onCancel={handleCloseCreateModal}
        onOk={() => form.submit()}
        okText="Create account"
        confirmLoading={saving}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{
            role: 'collector',
          }}
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[
              {
                required: true,
                message: 'Enter a username.',
              },
              {
                max: 255,
                message:
                  'Username must be 255 characters or fewer.',
              },
            ]}
          >
            <Input
              autoComplete="off"
              placeholder="Enter a unique username"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email address"
            rules={[
              {
                required: true,
                message: 'Enter an email address.',
              },
              {
                type: 'email',
                message: 'Enter a valid email address.',
              },
              {
                max: 255,
                message:
                  'Email must be 255 characters or fewer.',
              },
            ]}
          >
            <Input
              type="email"
              prefix={<MailOutlined />}
              autoComplete="off"
              placeholder="example@email.com"
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="Account role"
            rules={[
              {
                required: true,
                message: 'Choose an account role.',
              },
            ]}
          >
            <Select
              options={[
                {
                  value: 'collector',
                  label: 'Collector',
                },
                {
                  value: 'staff',
                  label: 'Staff',
                },
              ]}
            />
          </Form.Item>

          <div className="collector-account-password-note">
            <KeyOutlined />

            <Text>
              The default password for this account will be:
              <strong> p@ssword123</strong>
            </Text>
          </div>
        </Form>
      </Modal>
    </main>
  );
};

export default CollectorAccountManagement;