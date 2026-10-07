import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  BarChartOutlined,
  CalendarOutlined,
  DollarOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../Api";
import "./css/SlaughterReportsScreen.css";

const { Title, Text } = Typography;

const chargeLabels = {
  price_kilos: "Kilo Amount",
  ante_mortem: "Ante-Mortem",
  post_mortem: "Post-Mortem",
  hides: "Hides",
  slaughter_fee: "Slaughter Fee",
  coral_fee: "Coral Fee",
};

const money = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

const numberValue = (value) => Number(value || 0);

const currentMonth = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (value) => {
  if (!value) return "Monthly report";
  const [year, month] = value.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
  });
};

const dayLabel = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

export default function SlaughterReports() {
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dailyCollectionsByDate, setDailyCollectionsByDate] = useState({});
  const [dailyDetailsLoadingByDate, setDailyDetailsLoadingByDate] = useState({});
  const latestRequest = useRef(0);

  const loadReport = async (selectedMonth) => {
    const [year, monthNumber] = selectedMonth.split("-");
    const requestId = ++latestRequest.current;
    setLoading(true);
    setDailyCollectionsByDate({});
    setDailyDetailsLoadingByDate({});
    try {
      const response = await api.get("/slaughterhouse/collections/monthly-summary", {
        params: { year: Number(year), month: Number(monthNumber) },
      });
      if (requestId === latestRequest.current) {
        setReport(response.data?.data || null);
      }
    } catch (error) {
      if (requestId === latestRequest.current) {
        message.error(error.response?.data?.message || "Unable to load the slaughter report.");
        setReport(null);
      }
    } finally {
      if (requestId === latestRequest.current) {
        setLoading(false);
      }
    }
  };

  const loadDailyDetails = async (date) => {
    if (
      Object.prototype.hasOwnProperty.call(dailyCollectionsByDate, date) ||
      dailyDetailsLoadingByDate[date]
    ) {
      return;
    }

    setDailyDetailsLoadingByDate((current) => ({ ...current, [date]: true }));
    try {
      const response = await api.get("/slaughterhouse/collections/daily-details", {
        params: { date },
      });
      setDailyCollectionsByDate((current) => ({
        ...current,
        [date]: response.data?.data || [],
      }));
    } catch (error) {
      message.error(error.response?.data?.message || `Unable to load collections for ${dayLabel(date)}.`);
    } finally {
      setDailyDetailsLoadingByDate((current) => ({ ...current, [date]: false }));
    }
  };

  useEffect(() => {
    loadReport(month);
  }, [month]);

  const chargeRows = useMemo(
    () =>
      Object.entries(report?.charges || {}).map(([key, amount]) => ({
        key,
        label: chargeLabels[key] || key,
        amount: numberValue(amount),
        share: report?.grand_total ? (numberValue(amount) / report.grand_total) * 100 : 0,
      })),
    [report]
  );

  const trendData = useMemo(
    () =>
      (report?.daily || []).map((day) => ({
        ...day,
        label: new Date(`${day.date}T00:00:00`).toLocaleDateString("en-PH", { day: "2-digit" }),
        total: numberValue(day.grand_total),
      })),
    [report]
  );

  return (
    <div className="slaughter-report-page">
      <div className="slaughter-report-header">
        <div className="slaughter-report-heading">
          <span className="slaughter-report-mark"><BarChartOutlined /></span>
          <div className="slaughter-report-heading-copy">
            <Text className="slaughter-report-kicker">SLAUGHTERHOUSE REPORTING</Text>
            <Title level={2}>Monthly Collection Report</Title>
            <Text type="secondary">
              Review collections, animal activity, and charge composition for the selected month.
            </Text>
          </div>
        </div>
        <Space direction="vertical" align="start" size={6} className="slaughter-report-month-control">
          <Text strong>Report month</Text>
          <Input
            className="slaughter-month-picker"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            prefix={<CalendarOutlined />}
          />
        </Space>
      </div>

      {loading ? (
        <div className="slaughter-report-loading"><Spin size="large" tip="Loading monthly report" /></div>
      ) : (
        <>
          <div className="slaughter-report-period">
            <div>
              <Text className="slaughter-report-kicker">ACTUAL COLLECTIONS</Text>
              <Title level={3}>{monthLabel(month)}</Title>
            </div>
            <Tag color={report?.transaction_count ? "success" : "default"}>
              {report?.transaction_count || 0} transaction{report?.transaction_count === 1 ? "" : "s"}
            </Tag>
          </div>

          <Row gutter={[16, 16]} className="slaughter-report-stat-row">
            <Col xs={24} sm={12} lg={6}>
              <Card className="slaughter-report-stat-card slaughter-report-stat-card-total">
                <Statistic title="Total collection" value={numberValue(report?.grand_total)} precision={2} prefix="₱" />
                <Text type="secondary">For {monthLabel(month)}</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="slaughter-report-stat-card slaughter-report-stat-card-animals">
                <Statistic title="Animals processed" value={numberValue(report?.animal_count)} prefix={<BarChartOutlined />} />
                <Text type="secondary">Total quantity recorded</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="slaughter-report-stat-card slaughter-report-stat-card-weight">
                <Statistic title="Total weight" value={numberValue(report?.total_kilos)} precision={2} suffix="kg" prefix={<BarChartOutlined />} />
                <Text type="secondary">Combined monthly weight</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="slaughter-report-stat-card slaughter-report-stat-card-average">
                <Statistic title="Average collection" value={report?.transaction_count ? numberValue(report.grand_total) / report.transaction_count : 0} precision={2} prefix="₱" />
                <Text type="secondary">Per transaction</Text>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="slaughter-report-main-grid">
            <Col xs={24} lg={15}>
              <Card title="Daily collection trend" extra={<LineChartOutlined />} className="slaughter-report-card">
                <Text type="secondary" className="slaughter-report-card-description">Collection value recorded on each day of the selected month.</Text>
                {trendData.length ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={trendData} margin={{ top: 10, right: 12, left: 4, bottom: 4 }}>
                      <CartesianGrid stroke="#edf0f4" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₱${value}`} />
                      <Tooltip formatter={(value) => money(value)} labelFormatter={(label) => `Day ${label}`} />
                      <Bar dataKey="total" fill="#d8755b" radius={[4, 4, 0, 0]} barSize={18} />
                      <Line type="monotone" dataKey="total" stroke="#243b53" strokeWidth={2} dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : <Empty description="No collections recorded for this month" />}
              </Card>
            </Col>
            <Col xs={24} lg={9}>
              <Card title="Charge composition" extra={<DollarOutlined />} className="slaughter-report-card">
                <Text type="secondary" className="slaughter-report-card-description">How the monthly collection is divided by charge.</Text>
                <div className="slaughter-charge-report-list">
                  {chargeRows.map((charge) => (
                    <div className="slaughter-charge-report-row" key={charge.key}>
                      <div><span>{charge.label}</span><strong>{money(charge.amount)}</strong></div>
                      <div className="slaughter-charge-share"><span style={{ width: `${Math.min(charge.share, 100)}%` }} /></div>
                      <Text type="secondary">{charge.share.toFixed(1)}% of total collection</Text>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>

          <Card
            title="Daily collection detail"
            extra={<CalendarOutlined />}
            className="slaughter-report-card slaughter-daily-report-card"
          >
            <Text type="secondary">Every calendar day is shown. Expand a day to inspect transactions and animal charges.</Text>
            <Table
              className="slaughter-daily-table"
              rowKey="date"
              dataSource={report?.daily || []}
              pagination={false}
              scroll={{ x: 760 }}
              expandable={{
                rowExpandable: (day) => day.transaction_count > 0,
                onExpand: (expanded, day) => {
                  if (expanded) loadDailyDetails(day.date);
                },
                expandedRowRender: (day) => (
                  dailyDetailsLoadingByDate[day.date] ? (
                    <div className="slaughter-day-detail-loading">
                      <Spin size="small" tip={`Loading transactions for ${dayLabel(day.date)}`} />
                    </div>
                  ) : (
                    <Table
                      className="slaughter-expanded-collections-table"
                      size="small"
                      rowKey="id"
                      pagination={false}
                      dataSource={dailyCollectionsByDate[day.date] || []}
                      locale={{ emptyText: "No transactions found for this day" }}
                      columns={[
                        { title: "OR Number", dataIndex: "or_number" },
                        { title: "Customer", dataIndex: "customer_name" },
                        { title: "Animal entries", render: (_, collection) => collection.items?.length || 0 },
                        { title: "Collection", dataIndex: "grand_total", render: (value) => money(value) },
                      ]}
                      expandable={{
                        expandedRowRender: (collection) => (
                          <Table
                            className="slaughter-animal-items-table"
                            size="small"
                            rowKey="id"
                            pagination={false}
                            dataSource={collection.items || []}
                            columns={[
                              { title: "Animal", dataIndex: "animal_type" },
                              { title: "Quantity", dataIndex: "quantity" },
                              { title: "Kilos", dataIndex: "total_kilos", render: (value) => `${numberValue(value).toFixed(2)} kg` },
                              { title: "Kilo Amount", dataIndex: "price_kilos", render: (value) => money(value) },
                              { title: "Ante-Mortem", dataIndex: "ante_mortem", render: (value) => money(value) },
                              { title: "Post-Mortem", dataIndex: "post_mortem", render: (value) => money(value) },
                              { title: "Hides", dataIndex: "hides", render: (value) => money(value) },
                              { title: "Slaughter Fee", dataIndex: "slaughter_fee", render: (value) => money(value) },
                              { title: "Coral Fee", dataIndex: "coral_fee", render: (value) => money(value) },
                              { title: "Total", dataIndex: "total_amount", render: (value) => money(value) },
                            ]}
                          />
                        ),
                      }}
                    />
                  )
                ),
              }}
              columns={[
                { title: "Day", dataIndex: "date", render: dayLabel },
                { title: "Transactions", dataIndex: "transaction_count" },
                { title: "Animals", dataIndex: "animal_count" },
                { title: "Total kilos", dataIndex: "total_kilos", render: (value) => `${numberValue(value).toFixed(2)} kg` },
                { title: "Daily collection", dataIndex: "grand_total", render: (value) => money(value) },
              ]}
            />
          </Card>

          <Card title="Animal type performance" extra={<BarChartOutlined />} className="slaughter-report-card slaughter-animal-report-card">
            <Table
              rowKey="animal_type"
              dataSource={report?.animal_types || []}
              pagination={false}
              scroll={{ x: 620 }}
              columns={[
                { title: "Animal type", dataIndex: "animal_type" },
                { title: "Quantity", dataIndex: "quantity" },
                { title: "Total kilos", dataIndex: "total_kilos", render: (value) => `${numberValue(value).toFixed(2)} kg` },
                { title: "Collection amount", dataIndex: "grand_total", render: (value) => money(value) },
              ]}
              locale={{ emptyText: "No animal activity for this month" }}
            />
          </Card>

          <Alert
            className="slaughter-report-note"
            type="info"
            showIcon
            message="Reporting rule"
            description="Kilo Amount is counted as its own charge. It is not multiplied by Total Kilos."
          />
        </>
      )}
    </div>
  );
}
