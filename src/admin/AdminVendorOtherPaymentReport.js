import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Button,
  Empty,
  Input,
  Progress,
  Radio,
  Select,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ShopOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import api from "../Api";
import "./AdminVendorOtherPaymentReport.css";

const { Text, Title } = Typography;

const paymentTypes = [
  { value: "certification", label: "Certification" },
  { value: "stall_rights", label: "Stall rights" },
  { value: "space_right", label: "Space rights" },
  { value: "dst", label: "Documentary stamp tax" },
];

const rightsPaymentTypes = ["stall_rights", "space_right"];

const paymentTypePresentation = {
  certification: { icon: <SafetyCertificateOutlined />, color: "#158078" },
  stall_rights: { icon: <ShopOutlined />, color: "#b26722" },
  space_right: { icon: <AppstoreOutlined />, color: "#386e9b" },
  dst: { icon: <FileTextOutlined />, color: "#77619a" },
};

const formatCurrency = (amount) => new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
}).format(Number(amount) || 0);

const isEligibleForPaymentType = (vendor, type) => (
  !rightsPaymentTypes.includes(type)
  || vendor.eligible_payment_types?.includes(type)
);

const AdminVendorOtherPaymentReport = () => {
  const currentYear = dayjs().year();
  const [year, setYear] = useState(currentYear);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [paymentType, setPaymentType] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/vendor-other-payments/report", { params: { year } });
      setReport(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load vendor payment status.");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const vendors = report?.vendors || [];
  const totalVendors = report?.summary?.vendor_count || 0;
  const paymentCounts = report?.summary?.payment_counts || {};
  const eligibleVendorCounts = report?.summary?.eligible_vendor_counts || {};
  const paidVendorCount = report?.summary?.paid_vendor_count || 0;
  const unpaidVendorCount = Math.max(0, totalVendors - paidVendorCount);

  const filteredVendors = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase();

    return vendors.filter((vendor) => {
      const paidTypes = paymentTypes
        .filter((type) => (
          isEligibleForPaymentType(vendor, type.value)
          && vendor.payments?.[type.value]
        ))
        .map((type) => type.value);
      const paidInSelectedType = paymentType === "all"
        ? paidTypes.length > 0
        : Boolean(vendor.payments?.[paymentType]);
      const selectedTypeIsApplicable = paymentType === "all"
        || isEligibleForPaymentType(vendor, paymentType);
      const matchesStatus = paymentStatus === "all"
        || (selectedTypeIsApplicable && paymentStatus === "paid" && paidInSelectedType)
        || (selectedTypeIsApplicable && paymentStatus === "unpaid" && !paidInSelectedType);
      const searchValues = [vendor.name, vendor.id, vendor.status];
      const matchesSearch = !query
        || searchValues.some((value) => String(value || "").toLocaleLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [paymentStatus, paymentType, searchText, vendors]);

  const columns = [
    {
      title: "VENDOR",
      dataIndex: "name",
      key: "vendor",
      fixed: "left",
      width: 220,
      render: (name, vendor) => (
        <div className="vendor-payment-report-vendor">
          <Text strong>{name || "Unknown vendor"}</Text>
          <Text type="secondary">ID {vendor.id} · {vendor.status || "No status"}</Text>
        </div>
      ),
    },
    ...paymentTypes.map((type) => ({
      title: type.label.toLocaleUpperCase(),
      dataIndex: ["payments", type.value],
      key: type.value,
      width: 200,
      render: (payment, vendor) => {
        if (!isEligibleForPaymentType(vendor, type.value)) {
          return <Tag>Not applicable</Tag>;
        }

        return payment ? (
          <div className="vendor-payment-report-paid-cell">
            <Tag color="success" icon={<CheckCircleOutlined />}>Paid</Tag>
            <strong>{formatCurrency(payment.amount)}</strong>
            <Text type="secondary">{dayjs(payment.payment_date).format("MMM D, YYYY")}</Text>
            {payment.or_number && <Text type="secondary">OR {payment.or_number}</Text>}
          </div>
        ) : (
          <Tag className="vendor-payment-report-unpaid-tag" icon={<ClockCircleOutlined />}>Not paid</Tag>
        );
      },
    })),
  ];

  return (
    <div className="staff-vendor-payment-report">
      <header className="vendor-payment-report-heading">
        <div>
          <span className="vendor-payment-report-eyebrow">REPORTS / ANNUAL COLLECTIONS</span>
          <Title level={2}>Vendor payment status</Title>
          <Text type="secondary">See which vendors have paid each annual fee and review their receipt details.</Text>
        </div>
        <div className="vendor-payment-report-year-picker">
          <Text>Payment year</Text>
          <Select
            aria-label="Payment year"
            value={year}
            onChange={setYear}
            options={Array.from({ length: Math.min(10, currentYear - 1899) }, (_, index) => ({
              value: currentYear - index,
              label: String(currentYear - index),
            }))}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchReport} loading={loading} aria-label="Refresh report" />
        </div>
      </header>

      {error && (
        <Alert
          className="vendor-payment-report-error"
          type="error"
          showIcon
          message="Report unavailable"
          description={error}
          action={<Button size="small" onClick={fetchReport}>Try again</Button>}
        />
      )}

      <Spin spinning={loading}>
        <section className="vendor-payment-report-summary" aria-label={`${year} annual payment summary`}>
          <div className="vendor-payment-report-summary-heading">
            <div>
              <span>ANNUAL COVERAGE</span>
              <strong>{year}</strong>
            </div>
            <Text type="secondary">Paid vendor count by fee type; rights fees count eligible vendors only</Text>
          </div>
          {paymentTypes.map((type) => {
            const paidCount = Number(paymentCounts[type.value] || 0);
            const eligibleCount = Number(eligibleVendorCounts[type.value] ?? totalVendors);
            const unpaidCount = Math.max(0, eligibleCount - paidCount);
            const percentPaid = eligibleCount ? Math.round((paidCount / eligibleCount) * 100) : 0;
            return (
              <div
                className={`vendor-payment-report-stat vendor-payment-report-stat-${type.value}`}
                key={type.value}
                style={{ "--report-accent": paymentTypePresentation[type.value].color }}
              >
                <div className="vendor-payment-report-stat-heading">
                  <span className="vendor-payment-report-stat-icon" aria-hidden="true">
                    {paymentTypePresentation[type.value].icon}
                  </span>
                  <Text type="secondary">{type.label}</Text>
                </div>
                <div className="vendor-payment-report-stat-value">
                  <strong>{paidCount}</strong>
                  <span>of {eligibleCount} vendors paid</span>
                </div>
                <Progress
                  className="vendor-payment-report-progress"
                  percent={percentPaid}
                  showInfo={false}
                  strokeColor={paymentTypePresentation[type.value].color}
                  trailColor="#e9eef0"
                  size="small"
                />
                <div className="vendor-payment-report-stat-foot">
                  <span>{percentPaid}% collected</span>
                  <span>{unpaidCount} unpaid</span>
                </div>
              </div>
            );
          })}
        </section>

        <section className="vendor-payment-report-table-section">
          <div className="vendor-payment-report-table-heading">
            <div>
              <Title level={4}>Vendor breakdown</Title>
              <Text type="secondary">
                {paidVendorCount} of {totalVendors} vendors have at least one applicable fee paid in {year}; {unpaidVendorCount} have no applicable fees paid.
              </Text>
            </div>
            <span className="vendor-payment-report-result-count">
              <strong>{filteredVendors.length}</strong> {filteredVendors.length === 1 ? "vendor" : "vendors"} shown
            </span>
          </div>

          <div className="vendor-payment-report-filters">
            <label className="vendor-payment-report-search">
              <span>Find vendor</span>
              <Input
                allowClear
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                prefix={<SearchOutlined />}
                placeholder="Search by name or ID"
                aria-label="Search vendor name or ID"
              />
            </label>
            <label className="vendor-payment-report-filter-control">
              <span>Fee type</span>
              <Select
                aria-label="Filter by payment type"
                value={paymentType}
                onChange={(value) => setPaymentType(value)}
                options={[
                  { value: "all", label: "All fee types" },
                  ...paymentTypes,
                ]}
              />
            </label>
            <div className="vendor-payment-report-filter-control vendor-payment-report-status-filter">
              <span>Payment status</span>
              <Radio.Group
                aria-label="Filter vendor payment status"
                value={paymentStatus}
                optionType="button"
                buttonStyle="solid"
                onChange={(event) => setPaymentStatus(event.target.value)}
                options={[
                  { value: "all", label: "All" },
                  { value: "paid", label: "Paid" },
                  { value: "unpaid", label: "Not paid" },
                ]}
              />
            </div>
          </div>
          <Text className="vendor-payment-report-filter-note" type="secondary">
            {paymentType === "all"
              ? "With all fee types selected, Paid means at least one applicable fee is paid; Not paid means no applicable fees are paid."
              : rightsPaymentTypes.includes(paymentType)
                ? `Paid status applies to ${paymentTypes.find((type) => type.value === paymentType)?.label} for vendors with matching rentals.`
                : `Paid status applies to ${paymentTypes.find((type) => type.value === paymentType)?.label}.`}
          </Text>

          <Table
            className="vendor-payment-report-table"
            rowKey="id"
            columns={columns}
            dataSource={filteredVendors}
            pagination={{ pageSize: 12, showSizeChanger: false, hideOnSinglePage: true }}
            scroll={{ x: 1020 }}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No vendors match these filters." /> }}
          />
        </section>
      </Spin>
    </div>
  );
};

export default AdminVendorOtherPaymentReport;