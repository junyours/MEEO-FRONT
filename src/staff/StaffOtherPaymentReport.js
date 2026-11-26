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
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import api from "../Api";
import "./StaffOtherPaymentReport.css";

const { Text, Title } = Typography;

const payerTypes = [
  { value: "Walk in Vendor", label: "Walk-in" },
  { value: "Driver", label: "Driver" },
];

const paymentTypes = [
  { value: "certification", label: "Certification" },
  { value: "special_permit", label: "Special Permit" },
  { value: "rental_fee", label: "Rental Fee" },
  { value: "electricity", label: "Electricity" },
];

const paymentTypePresentation = {
  certification: { icon: <SafetyCertificateOutlined />, color: "#158078" },
  special_permit: { icon: <FileTextOutlined />, color: "#b26722" },
  rental_fee: { icon: <ShopOutlined />, color: "#386e9b" },
  electricity: { icon: <FileTextOutlined />, color: "#77619a" },
};

const formatCurrency = (amount) => new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
}).format(Number(amount) || 0);

const getPaymentStatus = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "paid") return "Paid";
  if (normalized === "void") return "Void";
  return status || "Unknown";
};

const StaffOtherPaymentReport = () => {
  const currentYear = dayjs().year();
  const [year, setYear] = useState(currentYear);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [payerType, setPayerType] = useState("all");
  const [paymentType, setPaymentType] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/vendor-other-payments/staff/payer-report", {
        params: { year },
      });
      if (!Array.isArray(data?.payments)) {
        throw new Error("The payment report returned an unexpected response.");
      }
      setPayments(data.payments);
    } catch (requestError) {
      setPayments([]);
      setError(requestError.response?.data?.message || requestError.message || "Unable to load Walk-in and Driver payment records.");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const summaryByType = useMemo(() => paymentTypes.reduce((result, type) => {
    const typePayments = payments.filter((payment) => (
      payment.payment_type === type.value && payment.status === "paid"
    ));
    result[type.value] = {
      count: typePayments.length,
      amount: typePayments.reduce((total, payment) => total + Number(payment.amount || 0), 0),
      nonPaidCount: payments.filter((payment) => (
        payment.payment_type === type.value && payment.status !== "paid"
      )).length,
    };
    return result;
  }, {}), [payments]);

  const paidTotal = payments.reduce((total, payment) => (
    payment.status === "paid" ? total + Number(payment.amount || 0) : total
  ), 0);
  const paidCount = payments.filter((payment) => payment.status === "paid").length;
  const filteredPayments = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase();
    return payments.filter((payment) => {
      const matchesPayerType = payerType === "all" || payment.payer_type === payerType;
      const matchesPaymentType = paymentType === "all" || payment.payment_type === paymentType;
      const matchesStatus = paymentStatus === "all" || payment.status === paymentStatus;
      const payerLabel = payerTypes.find((type) => type.value === payment.payer_type)?.label;
      const paymentLabel = paymentTypes.find((type) => type.value === payment.payment_type)?.label;
      const searchValues = [
        payment.payer_name,
        payment.payer_type,
        payerLabel,
        payment.or_number,
        payment.payment_type,
        paymentLabel,
      ];
      const matchesSearch = !query
        || searchValues.some((value) => String(value || "").toLocaleLowerCase().includes(query));
      return matchesPayerType && matchesPaymentType && matchesStatus && matchesSearch;
    });
  }, [payerType, paymentStatus, paymentType, payments, searchText]);

  const columns = [
    {
      title: "PAYER",
      dataIndex: "payer_name",
      key: "payer",
      fixed: "left",
      width: 200,
      render: (name, payment) => (
        <div className="vendor-payment-report-vendor">
          <Text strong>{name || "Name not recorded"}</Text>
          <Text type="secondary">{payerTypes.find((type) => type.value === payment.payer_type)?.label || payment.payer_type}</Text>
        </div>
      ),
    },
    {
      title: "PAYMENT CATEGORY",
      dataIndex: "payment_type",
      key: "payment_type",
      width: 175,
      render: (type) => paymentTypes.find((item) => item.value === type)?.label || type,
    },
    {
      title: "AMOUNT",
      dataIndex: "amount",
      key: "amount",
      width: 140,
      render: (amount) => <strong>{formatCurrency(amount)}</strong>,
    },
    {
      title: "OR NUMBER",
      dataIndex: "or_number",
      key: "or_number",
      width: 150,
      render: (orNumber) => orNumber || "—",
    },
    {
      title: "PAYMENT DATE",
      dataIndex: "payment_date",
      key: "payment_date",
      width: 145,
      render: (date) => date ? dayjs(date).format("MMM D, YYYY") : "—",
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status) => (
        <Tag color={status === "paid" ? "success" : status === "void" ? "error" : "default"}>
          {status === "paid" ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          {" "}{getPaymentStatus(status)}
        </Tag>
      ),
    },
  ];

  return (
    <div className="staff-vendor-payment-report">
      <header className="vendor-payment-report-heading">
        <div>
          <span className="vendor-payment-report-eyebrow">REPORTS / OTHER PAYERS</span>
          <Title level={2}>Walk-in &amp; Driver payment report</Title>
          <Text type="secondary">Review walk-in sales and driver certification payments, receipts, and collection totals.</Text>
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
        <section className="vendor-payment-report-summary" aria-label={`${year} Walk-in and Driver collection summary`}>
          <div className="vendor-payment-report-summary-heading">
            <div>
              <span>OTHER PAYER COLLECTIONS</span>
              <strong>{year}</strong>
            </div>
            <Text type="secondary">{paidCount} paid records · {formatCurrency(paidTotal)} collected</Text>
          </div>
          {paymentTypes.map((type) => {
            const summary = summaryByType[type.value];
            const allTypeRecords = summary.count + summary.nonPaidCount;
            const percentPaid = allTypeRecords ? Math.round((summary.count / allTypeRecords) * 100) : 0;
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
                  <strong>{formatCurrency(summary.amount)}</strong>
                  <span>collected</span>
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
                  <span>{summary.count} paid</span>
                  <span>{summary.nonPaidCount} not paid</span>
                </div>
              </div>
            );
          })}
        </section>

        <section className="vendor-payment-report-table-section">
          <div className="vendor-payment-report-table-heading">
            <div>
              <Title level={4}>Payment transactions</Title>
              <Text type="secondary">
                {payments.length} records for Walk-in and Driver payers in {year}.
              </Text>
            </div>
            <span className="vendor-payment-report-result-count">
              <strong>{filteredPayments.length}</strong> {filteredPayments.length === 1 ? "payment" : "payments"} shown
            </span>
          </div>

          <div className="vendor-payment-report-filters">
            <label className="vendor-payment-report-search">
              <span>Search payments</span>
              <Input
                allowClear
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                prefix={<SearchOutlined />}
                placeholder="Search payer or OR number"
                aria-label="Search payer name or OR number"
              />
            </label>
            <label className="vendor-payment-report-filter-control">
              <span>Payer type</span>
              <Select
                aria-label="Filter by payer type"
                value={payerType}
                onChange={setPayerType}
                options={[{ value: "all", label: "All payer types" }, ...payerTypes]}
              />
            </label>
            <label className="vendor-payment-report-filter-control">
              <span>Payment category</span>
              <Select
                aria-label="Filter by payment category"
                value={paymentType}
                onChange={setPaymentType}
                options={[{ value: "all", label: "All categories" }, ...paymentTypes]}
              />
            </label>
            <div className="vendor-payment-report-filter-control vendor-payment-report-status-filter">
              <span>Payment status</span>
              <Radio.Group
                aria-label="Filter payment status"
                value={paymentStatus}
                optionType="button"
                buttonStyle="solid"
                onChange={(event) => setPaymentStatus(event.target.value)}
                options={[
                  { value: "all", label: "All" },
                  { value: "paid", label: "Paid" },
                  { value: "void", label: "Void" },
                ]}
              />
            </div>
          </div>

          <Table
            className="vendor-payment-report-table"
            rowKey="id"
            columns={columns}
            dataSource={filteredPayments}
            pagination={{ pageSize: 12, showSizeChanger: false, hideOnSinglePage: true }}
            scroll={{ x: 920 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No payments match these filters."
                />
              ),
            }}
          />
        </section>
      </Spin>
    </div>
  );
};

export default StaffOtherPaymentReport;
