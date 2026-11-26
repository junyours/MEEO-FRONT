import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CalendarOutlined,
  EditOutlined,
  HistoryOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShopOutlined,
  SwapOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../Api";
import "./StaffStallRateChanges.css";

const { Text, Title } = Typography;

const formatCurrency = (value) => (
  value === null || value === undefined
    ? "—"
    : `₱${Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
);

const RateChange = ({ previous, current }) => (
  <div className="staff-rate-comparison">
    <Text className={previous == null ? "staff-rate-before is-initial" : "staff-rate-before"}>
      {formatCurrency(previous)}
    </Text>
    <SwapOutlined className="staff-rate-arrow" />
    <Text strong className="staff-rate-after">{formatCurrency(current)}</Text>
  </div>
);

const StaffStallRateChanges = () => {
  const [rateChanges, setRateChanges] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingChange, setEditingChange] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const openEditModal = (change) => {
    setEditingChange(change);
    form.setFieldsValue({
      effective_from: dayjs(change.effective_from),
      daily_rate: change.new_rates.daily_rate == null ? null : Number(change.new_rates.daily_rate),
      monthly_rate: change.new_rates.monthly_rate == null ? null : Number(change.new_rates.monthly_rate),
      annual_rate: change.new_rates.annual_rate == null ? null : Number(change.new_rates.annual_rate),
      is_monthly: Boolean(change.is_monthly),
    });
  };

  const closeEditModal = () => {
    if (saving) return;
    setEditingChange(null);
    form.resetFields();
  };

  const saveRateChange = async (values) => {
    if (!editingChange) return;

    setSaving(true);
    try {
      await api.put(`/staff/stall-rate-changes/${editingChange.id}`, {
        effective_from: values.effective_from?.format("YYYY-MM-DD") || null,
        daily_rate: values.daily_rate ?? null,
        monthly_rate: values.monthly_rate ?? null,
        annual_rate: values.annual_rate ?? null,
        is_monthly: Boolean(values.is_monthly),
      });
      message.success("Stall rate history updated.");
      setEditingChange(null);
      form.resetFields();
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      console.error("Unable to update stall rate history:", requestError);
      message.error(
        requestError.response?.data?.message || "Unable to update this rate record. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchRateChanges = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/staff/stall-rate-changes");
        if (isCurrentRequest) {
          setRateChanges(data.rate_changes || []);
        }
      } catch (requestError) {
        console.error("Unable to load stall rate changes:", requestError);
        if (isCurrentRequest) {
          setRateChanges([]);
          setError("Unable to load stall rate history. Please try again.");
        }
      } finally {
        if (isCurrentRequest) {
          setLoading(false);
        }
      }
    };

    fetchRateChanges();
    return () => {
      isCurrentRequest = false;
    };
  }, [refreshKey]);

  const years = useMemo(
    () => [...new Set(rateChanges.map((change) => dayjs(change.effective_from).year()))]
      .sort((a, b) => b - a),
    [rateChanges]
  );

  const filteredChanges = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase();

    return rateChanges.filter((change) => {
      const matchesYear = selectedYear === "all"
        || dayjs(change.effective_from).year() === selectedYear;
      const matchesSearch = !query || [
        change.stall_number,
        change.section_name,
        change.vendor_before_change,
      ].some((value) => String(value || "").toLocaleLowerCase().includes(query));

      return matchesYear && matchesSearch;
    });
  }, [rateChanges, searchText, selectedYear]);

  const affectedStalls = useMemo(
    () => new Set(filteredChanges.map((change) => change.stall_id)).size,
    [filteredChanges]
  );
  const vendorsIdentified = useMemo(
    () => new Set(filteredChanges.map((change) => change.vendor_before_change).filter(Boolean)).size,
    [filteredChanges]
  );
  const yearOptions = [
    { value: "all", label: "All years" },
    ...years.map((year) => ({ value: year, label: String(year) })),
  ];

  const columns = [
    {
      title: "Effective date",
      dataIndex: "effective_from",
      key: "effective_from",
      width: 150,
      render: (date) => (
        <div className="staff-rate-date">
          <CalendarOutlined />
          <Text strong>{dayjs(date).format("MMM D, YYYY")}</Text>
        </div>
      ),
    },
    {
      title: "Stall",
      key: "stall",
      width: 190,
      render: (_, record) => (
        <div className="staff-rate-stall">
          <Avatar shape="square" icon={<ShopOutlined />} />
          <span>
            <Text strong>Stall {record.stall_number}</Text>
            <Text type="secondary">{record.section_name}</Text>
          </span>
        </div>
      ),
    },
    {
      title: "Vendor before change",
      dataIndex: "vendor_before_change",
      key: "vendor_before_change",
      width: 220,
      render: (vendor) => vendor
        ? (
          <div className="staff-rate-vendor">
            <Avatar size="small" icon={<UserOutlined />} />
            <Text>{vendor}</Text>
          </div>
        )
        : <Tag className="staff-rate-vacant-tag">No vendor recorded</Tag>,
    },
    {
      title: "Daily rate",
      key: "daily_rate",
      width: 185,
      render: (_, record) => (
        <RateChange
          previous={record.previous_rates?.daily_rate}
          current={record.new_rates.daily_rate}
        />
      ),
    },
    {
      title: "Monthly rate",
      key: "monthly_rate",
      width: 195,
      render: (_, record) => (
        <RateChange
          previous={record.previous_rates?.monthly_rate}
          current={record.new_rates.monthly_rate}
        />
      ),
    },
    {
      title: "Annual rate",
      key: "annual_rate",
      width: 185,
      render: (_, record) => (
        <RateChange
          previous={record.previous_rates?.annual_rate}
          current={record.new_rates.annual_rate}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => openEditModal(record)}
          aria-label={`Edit rate history for stall ${record.stall_number}`}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <main className="staff-rate-history">
      <header className="staff-rate-header">
        <div className="staff-rate-heading">
          <span className="staff-rate-heading-icon"><HistoryOutlined /></span>
          <div>
            <Text className="staff-rate-eyebrow">MARKET OPERATIONS</Text>
            <Title level={2}>Stall Rate Change History</Title>
            <Text type="secondary">
              Review stall rate updates and see which vendor occupied the stall before each change.
            </Text>
          </div>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => setRefreshKey((key) => key + 1)}
          loading={loading}
        >
          Refresh
        </Button>
      </header>

      {error && (
        <Alert
          className="staff-rate-error"
          type="error"
          showIcon
          message={error}
          action={
            <Button size="small" onClick={() => setRefreshKey((key) => key + 1)}>
              Try again
            </Button>
          }
        />
      )}

      <Row gutter={[16, 16]} className="staff-rate-summary">
        <Col xs={24} sm={8}>
          <Card className="staff-rate-stat-card staff-rate-stat-changes">
            <Statistic title="Rate records" value={filteredChanges.length} prefix={<HistoryOutlined />} />
            <Text type="secondary">Matching rate history entries</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="staff-rate-stat-card staff-rate-stat-stalls">
            <Statistic title="Stalls affected" value={affectedStalls} prefix={<ShopOutlined />} />
            <Text type="secondary">Unique stalls in this view</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="staff-rate-stat-card staff-rate-stat-vendors">
            <Statistic title="Vendors identified" value={vendorsIdentified} prefix={<UserOutlined />} />
            <Text type="secondary">Vendors recorded before an update</Text>
          </Card>
        </Col>
      </Row>

      <Card className="staff-rate-table-card">
        <div className="staff-rate-table-toolbar">
          <div>
            <Title level={4}>Rate history</Title>
            <Text type="secondary">
              {filteredChanges.length} {filteredChanges.length === 1 ? "record" : "records"}
              {selectedYear !== "all" ? ` · ${selectedYear}` : ""}
            </Text>
          </div>
          <Space className="staff-rate-filters" wrap>
            <Select
              aria-label="Filter by year"
              value={selectedYear}
              onChange={setSelectedYear}
              options={yearOptions}
              className="staff-rate-year-filter"
            />
            <Input
              aria-label="Search stall, section, or vendor"
              prefix={<SearchOutlined />}
              placeholder="Search stall, section, or vendor"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              allowClear
              className="staff-rate-search"
            />
          </Space>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredChanges}
          loading={loading}
          scroll={{ x: 1230 }}
          pagination={{
            defaultPageSize: 15,
            showSizeChanger: true,
            pageSizeOptions: ["15", "30", "50"],
            showTotal: (total, range) => `Showing ${range[0]}–${range[1]} of ${total} records`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={searchText || selectedYear !== "all"
                  ? "No rate changes match these filters."
                  : "No stall rate changes have been recorded."}
              />
            ),
          }}
        />
      </Card>

      <Modal
        title={`Edit rate history · Stall ${editingChange?.stall_number || ""}`}
        open={Boolean(editingChange)}
        onCancel={closeEditModal}
        onOk={() => form.submit()}
        okText="Save changes"
        confirmLoading={saving}
        closable={!saving}
        maskClosable={!saving}
        destroyOnClose
      >
        {editingChange && (
          <>
            <Alert
              className="staff-rate-edit-note"
              type="info"
              showIcon
              message={`Vendor before change: ${editingChange.vendor_before_change || "No vendor recorded"}`}
              description="Vendor information is based on the stall rental record and cannot be changed here."
            />
            <Form
              form={form}
              layout="vertical"
              onFinish={saveRateChange}
              preserve={false}
            >
              <Form.Item
                label="Effective Date (optional)"
                name="effective_from"
                tooltip="Leave empty to apply the correction immediately. Past dates are allowed for historical corrections."
              >
                <DatePicker
                  className="staff-rate-edit-date"
                  format="MMM D, YYYY"
                  placeholder="Select effective date"
                  allowClear
                />
              </Form.Item>
              <Form.Item label="Billing Type" name="is_monthly" valuePropName="checked">
                <Switch checkedChildren="Monthly" unCheckedChildren="Daily" />
              </Form.Item>
              <Row gutter={12}>
                {[
                  ["daily_rate", "Daily rate"],
                  ["monthly_rate", "Monthly rate"],
                  ["annual_rate", "Annual rate"],
                ].map(([field, label]) => (
                  <Col xs={24} key={field}>
                    <Form.Item label={`${label} (optional)`} name={field}>
                      <InputNumber
                        className="staff-rate-edit-input"
                        min={0}
                        precision={2}
                        prefix="₱"
                        placeholder="Not set"
                      />
                    </Form.Item>
                  </Col>
                ))}
              </Row>
              <Alert
                className="staff-rate-edit-guidance"
                type="info"
                showIcon
                message="Leave rate fields empty to use the section’s default rates."
                description="Individual stall rates override section defaults. Leave the effective date empty to apply the correction immediately; choose a future date to schedule it."
              />
            </Form>
          </>
        )}
      </Modal>
    </main>
  );
};

export default StaffStallRateChanges;
