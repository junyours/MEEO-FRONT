import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Input,
  Row,
  Col,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  BarChartOutlined,
  CalendarOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShopOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../Api";
import "./VendorMonthlyBalanceReport.css";

const { Text, Title } = Typography;

const months = [
  ["jan", "Jan"],
  ["feb", "Feb"],
  ["mar", "Mar"],
  ["apr", "Apr"],
  ["may", "May"],
  ["jun", "Jun"],
  ["jul", "Jul"],
  ["aug", "Aug"],
  ["sep", "Sep"],
  ["oct", "Oct"],
  ["nov", "Nov"],
  ["dec", "Dec"],
];

const formatCurrency = (value) =>
  `₱${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const VendorMonthlyBalanceReport = () => {
  const [year, setYear] = useState(dayjs().year());
  const [vendors, setVendors] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchBalances = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/vendor-monthly-balances", {
          params: { year },
        });

        if (isCurrentRequest) {
          setVendors(data.vendors || []);
        }
      } catch (requestError) {
        console.error("Error fetching vendor monthly balances:", requestError);
        if (isCurrentRequest) {
          setVendors([]);
          setError("Unable to load vendor balances. Please try again.");
        }
      } finally {
        if (isCurrentRequest) {
          setLoading(false);
        }
      }
    };

    fetchBalances();
    return () => {
      isCurrentRequest = false;
    };
  }, [year, refreshKey]);

  const filteredVendors = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase();
    if (!query) return vendors;

    return vendors.filter((vendor) =>
      String(vendor.vendor_name || "").toLocaleLowerCase().includes(query)
    );
  }, [searchText, vendors]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, year]);

  const visibleTotal = useMemo(
    () => filteredVendors.reduce((total, vendor) => total + Number(vendor.total_balance || 0), 0),
    [filteredVendors]
  );

  const columns = [
    {
      title: "Vendor",
      dataIndex: "vendor_name",
      key: "vendor_name",
      fixed: "left",
      width: 220,
      render: (name) => <Text strong className="vendor-monthly-name">{name}</Text>,
    },
    ...months.map(([key, title]) => ({
      title,
      dataIndex: key,
      key,
      align: "right",
      width: 128,
      render: (value) => (
        <span className={Number(value) > 0 ? "vendor-monthly-amount" : "vendor-monthly-zero"}>
          {formatCurrency(value)}
        </span>
      ),
    })),
    {
      title: "Total Balance",
      dataIndex: "total_balance",
      key: "total_balance",
      align: "right",
      fixed: "right",
      width: 160,
      render: (total) => (
        <Text strong className="vendor-monthly-total">
          {formatCurrency(total)}
        </Text>
      ),
    },
  ];

  return (
    <main className="vendor-monthly-report">
      <header className="vendor-monthly-header">
        <div className="vendor-monthly-heading">
          <div className="vendor-monthly-title-row">
            <span className="vendor-monthly-title-icon">
              <BarChartOutlined />
            </span>
            <div className="vendor-monthly-title-copy">
              <Text className="vendor-monthly-eyebrow">FINANCIAL REPORT</Text>
              <Title level={2}>Vendor Monthly Balances</Title>
            </div>
          </div>
          <Text className="vendor-monthly-subtitle">
            Review each vendor’s outstanding balance by month and for the full year.
          </Text>
        </div>
        <Space className="vendor-monthly-controls" size={10} wrap>
          <DatePicker
            picker="year"
            value={dayjs().year(year)}
            onChange={(date) => {
              if (date) setYear(date.year());
            }}
            allowClear={false}
            format="YYYY"
            suffixIcon={<CalendarOutlined />}
            aria-label="Select report year"
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => setRefreshKey((key) => key + 1)}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      </header>

      <div className="vendor-monthly-period">
        <Tag color="blue" icon={<CalendarOutlined />}>Fiscal year {year}</Tag>
        <Text type="secondary">Balances are grouped by payment month.</Text>
      </div>

      {error && (
        <Alert
          className="vendor-monthly-error"
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

      <Row gutter={[16, 16]} className="vendor-monthly-summary">
        <Col xs={24} sm={12} xl={8}>
          <Card className="vendor-monthly-stat-card vendor-monthly-stat-outstanding">
            <Statistic
              title="Total outstanding"
              value={visibleTotal}
              precision={2}
              prefix="₱"
              valueStyle={{ color: "#b45309" }}
            />
            <Text type="secondary">
              {searchText ? "Total for matching vendors" : `Combined balance for ${year}`}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={8}>
          <Card className="vendor-monthly-stat-card vendor-monthly-stat-vendors">
            <Statistic
              title="Vendors displayed"
              value={filteredVendors.length}
              prefix={<ShopOutlined />}
              valueStyle={{ color: "#1d4ed8" }}
            />
            <Text type="secondary">
              {searchText ? `Matching ${vendors.length} vendors in the report` : "All vendors"}
            </Text>
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card className="vendor-monthly-stat-card vendor-monthly-search-card">
            <Text className="vendor-monthly-search-label">Search vendors</Text>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search by vendor name"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value);
                setCurrentPage(1);
              }}
              allowClear
              aria-label="Search vendor name"
            />
            <Text type="secondary">Filter the report by vendor name.</Text>
          </Card>
        </Col>
      </Row>

      <Card className="vendor-monthly-table-card">
        <div className="vendor-monthly-table-heading">
          <div>
            <Title level={4}>Monthly breakdown</Title>
            <Text type="secondary">
              {searchText
                ? `${filteredVendors.length} matching ${filteredVendors.length === 1 ? "vendor" : "vendors"}`
                : `Jan – Dec ${year}`}
            </Text>
          </div>
          <Text className="vendor-monthly-currency-note">
            <WalletOutlined /> Amounts in PHP
          </Text>
        </div>
        <Table
          columns={columns}
          dataSource={filteredVendors}
          rowKey="vendor_id"
          loading={loading}
          size="middle"
          pagination={{
            current: currentPage,
            pageSize,
            showSizeChanger: {
              getPopupContainer: () => document.body,
              popupClassName: "vendor-monthly-page-size-dropdown",
            },
            pageSizeOptions: ["15", "30", "50"],
            showTotal: (total, range) => (
              <span className="vendor-monthly-pagination-total">
                Showing <strong>{range[0]}–{range[1]}</strong> of <strong>{total}</strong> vendors
              </span>
            ),
            onChange: (page, nextPageSize) => {
              setCurrentPage(page);
              setPageSize(nextPageSize);
            },
            onShowSizeChange: (page, nextPageSize) => {
              setCurrentPage(page);
              setPageSize(nextPageSize);
            },
          }}
          scroll={{ x: 1916 }}
          locale={{
            emptyText: searchText
              ? "No vendors match your search."
              : "No vendors found for this report.",
          }}
        />
      </Card>
    </main>
  );
};

export default VendorMonthlyBalanceReport;
