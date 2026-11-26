import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../Api";
import "./DailyCollectionOverview.css";

const { Text, Title } = Typography;

const formatCurrency = (amount) =>
  `₱${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const DailyCollectionOverview = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [summary, setSummary] = useState(null);
  const [collections, setCollections] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/daily-collections", {
        params: { date: selectedDate.format("YYYY-MM-DD") },
      });
      setSummary(data.summary);
      setCollections(data.collections);
    } catch (error) {
      console.error("Unable to load daily collection overview:", error);
      message.error("Unable to load daily collections. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const filteredCollections = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return collections.filter((collection) => {
      const matchesFilter = activeFilter === "all"
        || (activeFilter === "collected" && collection.status === "collected")
        || (activeFilter === "not_collected" && collection.status !== "collected");
      const searchableValues = [
        collection.vendor_name,
        collection.collector_name,
        collection.stall_numbers,
        collection.section_names,
        collection.or_number,
      ];
      const matchesSearch = !query
        || searchableValues.some((value) => String(value || "").toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, collections, searchText]);

  const columns = [
    {
      title: "Vendor",
      dataIndex: "vendor_name",
      key: "vendor",
      render: (name) => <Text strong>{name || "Unknown vendor"}</Text>,
    },
    {
      title: "Stall",
      dataIndex: "stall_numbers",
      key: "stall",
      render: (stalls, record) => (
        <div>
          <Text strong>{stalls || "—"}</Text>
          {record.section_names && (
            <Text className="daily-collection-secondary" type="secondary">
              {record.section_names}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Collector",
      dataIndex: "collector_name",
      key: "collector",
      render: (name) => name || "—",
    },
    {
      title: "Expected",
      dataIndex: "amount_to_pay",
      key: "amount",
      align: "right",
      render: (amount) => <Text strong>{formatCurrency(amount)}</Text>,
    },
    {
      title: "Collected",
      dataIndex: "collected_amount",
      key: "collected_amount",
      align: "right",
      render: (amount) => (
        <Text className="daily-collection-collected-amount">
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: "Outstanding",
      dataIndex: "uncollected_amount",
      key: "uncollected_amount",
      align: "right",
      render: (amount) => (
        <Text className="daily-collection-outstanding-amount">
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        if (status === "collected") {
          return <Tag color="success" icon={<CheckCircleOutlined />}>Collected</Tag>;
        }
        return <Tag color="warning" icon={<ClockCircleOutlined />}>Not collected</Tag>;
      },
    },
    {
      title: "OR number",
      dataIndex: "or_number",
      key: "or_number",
      render: (number) => number || "—",
    },
    {
      title: "Collected at",
      dataIndex: "collected_at",
      key: "collected_at",
      render: (date) => date ? dayjs(date).format("h:mm A") : "—",
    },
  ];

  const expectedTotal = Number(summary?.expected_total || 0);
  const collectedTotal = Number(summary?.collected_total || 0);
  const uncollectedTotal = Number(summary?.uncollected_total || 0);
  const collectionRate = expectedTotal > 0
    ? Math.min(100, Math.round((collectedTotal / expectedTotal) * 100))
    : 0;

  const tabItems = [
    { key: "all", label: `All (${summary?.collection_count || 0})` },
    { key: "collected", label: `Collected (${summary?.collected_count || 0})` },
    { key: "not_collected", label: `Not collected (${summary?.uncollected_count || 0})` },
  ];

  return (
    <div className="daily-collection-overview">
      <div className="daily-collection-header">
        <div className="daily-collection-title-group">
          <Text className="daily-collection-eyebrow">COLLECTIONS</Text>
          <Title level={2}>Daily collection overview</Title>
          <Text type="secondary">
            A clear view of today’s collections and outstanding payments.
          </Text>
        </div>
        <Space className="daily-collection-controls" wrap>
          <DatePicker
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            disabledDate={(date) => date.isAfter(dayjs(), "day")}
            allowClear={false}
            format="MMM D, YYYY"
            aria-label="Select collection date"
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchCollections}
            loading={loading}
          >
            Refresh data
          </Button>
        </Space>
      </div>

      <div className="daily-collection-date-label">
        <span className="daily-collection-date-dot" />
        <span>
          Showing collections for <strong>{selectedDate.format("MMMM D, YYYY")}</strong>
        </span>
      </div>

      <Row gutter={[16, 16]} className="daily-collection-metrics">
        <Col xs={24} sm={12} xl={6}>
          <Card className="daily-collection-metric">
            <Statistic
              title="Total Expected"
              value={expectedTotal}
              precision={2}
              prefix="₱"
              valueStyle={{ color: "#1d4ed8" }}
            />
            <Text type="secondary">{summary?.collection_count || 0} collection records</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="daily-collection-metric collected">
            <Statistic
              title={selectedDate.isSame(dayjs(), "day") ? "Collected Today" : "Collected"}
              value={collectedTotal}
              precision={2}
              prefix="₱"
              valueStyle={{ color: "#15803d" }}
            />
            <Text type="secondary">{summary?.collected_count || 0} fully collected</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="daily-collection-metric outstanding">
            <Statistic
              title="Not Collected"
              value={uncollectedTotal}
              precision={2}
              prefix="₱"
              valueStyle={{ color: "#b45309" }}
            />
            <Text type="secondary">{summary?.uncollected_count || 0} still outstanding</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="daily-collection-metric progress">
            <div className="daily-collection-progress-heading">
              <Text type="secondary">Collection Progress</Text>
              <WalletOutlined />
            </div>
            <Progress percent={collectionRate} strokeColor="#2563eb" />
            <Text type="secondary">{collectionRate}% of expected amount collected</Text>
          </Card>
        </Col>
      </Row>

      <Card className="daily-collection-table-card">
        <div className="daily-collection-table-heading">
          <div className="daily-collection-table-copy">
            <Title level={4}>Collection records</Title>
            <Text type="secondary">
              Review payment status, amounts received, and remaining balances.
            </Text>
          </div>
          <Input
            className="daily-collection-search"
            prefix={<SearchOutlined />}
            placeholder="Search vendor, stall, collector, or OR number"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            allowClear
          />
        </div>
        <Tabs
          activeKey={activeFilter}
          onChange={setActiveFilter}
          items={tabItems}
        />
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredCollections}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `${total} ${total === 1 ? "record" : "records"}`,
          }}
          locale={{ emptyText: <Empty description="No collection records for this date" /> }}
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
};

export default DailyCollectionOverview;
