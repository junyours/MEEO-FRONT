import React, { memo, useEffect, useRef, useState } from "react";
import { Card, Col, message, Row, Select, Spin, Typography } from "antd";
import { FaStore } from "react-icons/fa";
import { FiAward, FiHome } from "react-icons/fi";
import api from "../Api";

const { Text, Title } = Typography;

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
].map((label, index) => ({ value: index + 1, label }));

const DashboardSourceCollections = memo(function DashboardSourceCollections({ year }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [sourceCollections, setSourceCollections] = useState({
    month: "",
    market: 0,
    wharf: 0,
    slaughter: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const requestSequence = useRef(0);

  useEffect(() => {
    const requestId = ++requestSequence.current;
    setLoading(true);
    setLoadError(false);

    api.get("/dashboard/stats", {
      params: { year, month: selectedMonth, source_only: 1 },
    })
      .then(({ data }) => {
        if (requestId === requestSequence.current) {
          setSourceCollections(data.collection_sources || {
            month: "",
            market: 0,
            wharf: 0,
            slaughter: 0,
          });
        }
      })
      .catch((error) => {
        if (requestId === requestSequence.current) {
          setLoadError(true);
          message.error(error.response?.data?.message || "Unable to load collection sources.");
        }
      })
      .finally(() => {
        if (requestId === requestSequence.current) {
          setLoading(false);
        }
      });

    return () => {
      requestSequence.current += 1;
    };
  }, [year, selectedMonth]);

  const formatCurrency = (amount) => `₱${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const selectedMonthLabel = months.find(({ value }) => value === selectedMonth)?.label || "Selected month";
  const displayedAmount = (amount) => {
    if (loading || loadError) return <span className="source-collection-pending">—</span>;
    return formatCurrency(amount);
  };

  return (
    <>
      <div className="source-collections-heading">
        <div>
          <Title level={3}>Collections by Source</Title>
          <Text type="secondary">{selectedMonthLabel} {year} collections</Text>
        </div>
        <div className="source-collections-controls">
          {loading && (
            <span className="source-collections-loading" role="status" aria-live="polite">
              <Spin size="small" />
              <Text type="secondary">Updating totals</Text>
            </span>
          )}
          {loadError && <Text type="danger">Totals unavailable</Text>}
          <Text type="secondary">Month</Text>
          <Select
            aria-label="Select collection month"
            value={selectedMonth}
            onChange={setSelectedMonth}
            options={months}
            style={{ width: 150 }}
            size="middle"
            loading={loading}
          />
        </div>
      </div>
      <Row className="source-collections-row" gutter={[16, 16]} style={{ marginBottom: 28 }} aria-busy={loading}>
        <Col xs={24} sm={8}>
          <Card className="source-collection-card market-source-card">
            <div className="source-collection-label"><FaStore /> Market</div>
            <div className="source-collection-value">{displayedAmount(sourceCollections.market)}</div>
            <div className="source-collection-note">Payments + Market cash tickets</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="source-collection-card wharf-source-card">
            <div className="source-collection-label"><FiHome /> Wharf</div>
            <div className="source-collection-value">{displayedAmount(sourceCollections.wharf)}</div>
            <div className="source-collection-note">Wharf cash tickets</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="source-collection-card slaughter-source-card">
            <div className="source-collection-label"><FiAward /> Slaughter</div>
            <div className="source-collection-value">{displayedAmount(sourceCollections.slaughter)}</div>
            <div className="source-collection-note">Slaughterhouse collections</div>
          </Card>
        </Col>
      </Row>
    </>
  );
});

export default DashboardSourceCollections;
