import React, { useEffect, useState } from "react";
import { Alert, Button, Segmented, Spin, Table, Tag } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined, HistoryOutlined, ReloadOutlined } from "@ant-design/icons";
import api from "../Api";
import "./MarketPriceHistory.css";

const periodOptions = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const previousPeriodLabels = {
  day: "Yesterday",
  week: "Last Week",
  month: "Last Month",
  year: "Last Year",
};

const currentPeriodLabels = {
  day: "Today",
  week: "This Week",
  month: "This Month",
  year: "This Year",
};

const comparisonDescriptions = {
  day: "Comparing yesterday with today.",
  week: "Comparing last week with this week.",
  month: "Comparing last month with this month.",
  year: "Comparing last year with this year.",
};

const formatPrice = (value) => {
  if (value === null || value === undefined || value === "") return "—";

  return `₱${Number(value).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
};

const MarketPriceHistory = () => {
  const [period, setPeriod] = useState("week");
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchHistory = async () => {
      setLoading(true);
      setError(false);

      try {
        const response = await api.get("/public/price-history", {
          params: { period },
          signal: controller.signal,
        });
        setHistoryData(response.data);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          console.error("Failed to load public price history:", requestError);
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchHistory();
    return () => controller.abort();
  }, [period, retryCount]);

  const products = historyData?.products || [];
  const productsByCategory = products.reduce((groups, product) => {
    const categoryName = product.category_name || "Uncategorized";
    if (!groups[categoryName]) groups[categoryName] = [];
    groups[categoryName].push(product);
    return groups;
  }, {});
  const summary = products.reduce((counts, product) => {
    counts[product.remarks] = (counts[product.remarks] || 0) + 1;
    return counts;
  }, { increased: 0, decreased: 0, stable: 0, no_data: 0 });

  const columns = [
    {
      title: "Product Name",
      dataIndex: "name",
      key: "name",
      width: 170,
      render: (name) => <strong>{name}</strong>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 250,
      render: (description) => description || "No description",
    },
       {
      title: "Unit",
      dataIndex: "unit",
      key: "unit",
      width: 100,
    },
    {
      title: `${previousPeriodLabels[period]} Price`,
      dataIndex: "past_price",
      key: "past_price",
      width: 150,
      render: formatPrice,
    },
    {
      title: `${currentPeriodLabels[period]} Price`,
      dataIndex: "present_price",
      key: "present_price",
      width: 160,
      render: formatPrice,
    },
 
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
      width: 135,
      render: (remarks) => {
        const isIncrease = remarks === "increased";
        const isDecrease = remarks === "decreased";
        const ChangeIcon = isIncrease
          ? ArrowUpOutlined
          : isDecrease
            ? ArrowDownOutlined
            : null;

        return (
          <Tag color={isIncrease ? "red" : isDecrease ? "green" : remarks === "stable" ? "blue" : "default"}>
            {ChangeIcon && <ChangeIcon />}{" "}
            {remarks === "no_data"
              ? "No Previous Data"
              : remarks.charAt(0).toUpperCase() + remarks.slice(1)}
          </Tag>
        );
      },
    },
  ];

  return (
    <section className="market-price-history" aria-labelledby="market-price-history-heading">
      <header className="market-price-history-header">
        <div>
          <span className="market-price-history-kicker">PRODUCT PRICING</span>
          <h3 id="market-price-history-heading">
            <HistoryOutlined /> Market Price History
          </h3>
          <p>{comparisonDescriptions[period]}</p>
        </div>
        <div className="market-price-history-controls">
          <Segmented
            aria-label="Compare price history by period"
            value={period}
            options={periodOptions}
            onChange={setPeriod}
            className="market-price-history-period"
          />
          <Button
            type="text"
            icon={<ReloadOutlined />}
            aria-label="Refresh price history"
            title="Refresh price history"
            onClick={() => setRetryCount((count) => count + 1)}
          />
        </div>
      </header>

      {historyData && !loading && !error && (
        <div className="market-price-history-range">
          <span>
            {previousPeriodLabels[period]}: {formatDate(historyData.previous_start_date)}
            {historyData.previous_start_date !== historyData.previous_end_date && (
              <> – {formatDate(historyData.previous_end_date)}</>
            )}
          </span>
          <span aria-hidden="true">vs</span>
          <span>
            {currentPeriodLabels[period]}: {formatDate(historyData.current_start_date)}
            {historyData.current_start_date !== historyData.current_end_date && (
              <> – {formatDate(historyData.current_end_date)}</>
            )}
          </span>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="market-price-history-summary" aria-label="Price comparison summary">
          <div className="is-increased"><strong>{summary.increased}</strong><span>Increased</span></div>
          <div className="is-decreased"><strong>{summary.decreased}</strong><span>Decreased</span></div>
          <div className="is-stable"><strong>{summary.stable}</strong><span>Stable</span></div>
         
        </div>
      )}

      <div className="market-price-history-content" aria-live="polite">
        {loading ? (
          <div className="market-price-history-state" role="status">
            <Spin />
            <span>Loading price history...</span>
          </div>
        ) : error ? (
          <Alert
            type="error"
            showIcon
            message="Price history is unavailable."
            action={(
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => setRetryCount((count) => count + 1)}
              >
                Retry
              </Button>
            )}
          />
        ) : products.length === 0 ? (
          <div className="market-price-history-state">
            No available products to display.
          </div>
        ) : (
          <div className="market-price-history-categories">
            {Object.entries(productsByCategory)
              .sort(([firstCategory], [secondCategory]) => firstCategory.localeCompare(secondCategory))
              .map(([categoryName, categoryProducts]) => (
                <section className="market-price-history-category" key={categoryName}>
                  <h4>
                    <span>{categoryName}</span>
                    <span className="market-price-history-category-count">
                      {categoryProducts.length} {categoryProducts.length === 1 ? "product" : "products"}
                    </span>
                  </h4>
                  <Table
                    className="market-price-history-table"
                    columns={columns}
                    dataSource={categoryProducts}
                    rowKey="id"
                    pagination={false}
                    size="middle"
                    scroll={{ x: 950 }}
                  />
                </section>
              ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default MarketPriceHistory;
