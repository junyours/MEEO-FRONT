import React from "react";
import { Card, Col, Progress, Row, Spin, Statistic, Typography } from "antd";
import "./DashboardDepartmentBalances.css";

const { Text, Title } = Typography;

const formatCurrency = (amount) => `₱${Number(amount || 0).toLocaleString("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;
const formatPercentage = (amount) => `${Number(amount || 0).toFixed(2)}%`;

const DashboardDepartmentBalances = ({ year, departments = [], loading = false }) => {
  const totals = departments.reduce((summary, department) => ({
    target: summary.target + Number(department.annual_target || 0),
    collection: summary.collection + Number(department.current_year_collection || 0),
    remaining: summary.remaining + Number(department.remaining_amount || 0),
  }), { target: 0, collection: 0, remaining: 0 });
  const overallProgress = totals.target > 0
    ? (totals.collection / totals.target) * 100
    : 0;

  return (
    <section className="department-balance-module" aria-labelledby="department-balance-heading" aria-busy={loading}>
      <div className="department-balance-module-heading">
        <div>
          <span className="department-balance-eyebrow">ANNUAL PERFORMANCE</span>
          <Title level={3} id="department-balance-heading">Department Income &amp; Targets</Title>
          <Text type="secondary">Collections, target progress, and remaining balances for {year}.</Text>
        </div>
        {loading && (
          <span className="department-balance-loading" role="status">
            <Spin size="small" /> Updating
          </span>
        )}
      </div>

      <>
          <Row gutter={[16, 16]} className="department-balance-summary">
            <Col xs={24} sm={8}>
              <Card className="department-balance-stat collected-stat">
                <Statistic
                  title="Total Collection"
                  value={totals.collection}
                  formatter={(value) => formatCurrency(value)}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="department-balance-stat progress-stat">
                <Statistic
                  title="Overall Target Progress"
                  value={overallProgress}
                  formatter={(value) => formatPercentage(value)}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="department-balance-stat remaining-stat">
                <Statistic
                  title="Remaining Balance"
                  value={totals.remaining}
                  formatter={(value) => formatCurrency(value)}
                />
              </Card>
            </Col>
          </Row>

          {departments.length > 0 ? (
            <Row gutter={[16, 16]} className="department-balance-cards">
              {departments.map((department) => {
                const progress = Number(department.progress_percentage || 0);
                const remainingBalance = Number(department.remaining_amount || 0);
                const totalCollection = Number(department.current_year_collection || 0);

                return (
                  <Col xs={24} sm={12} xl={8} key={department.id}>
                    <Card className="department-enterprise-card">
                      <div className="department-enterprise-card-heading">
                        <h4>{department.name}</h4>
                      </div>

                      <div className="department-enterprise-collection">
                        <span>Total Collection</span>
                        <strong>{formatCurrency(totalCollection)}</strong>
                      </div>

                      <div className="department-enterprise-progress">
                        <div className="department-enterprise-progress-label">
                          <span>Target Progress</span>
                          <strong>{formatPercentage(progress)}</strong>
                        </div>
                        <Progress
                          percent={Math.min(progress, 100)}
                          showInfo={false}
                          size="small"
                          strokeColor={progress >= 100 ? "#16845d" : "#2563eb"}
                        />
                      </div>

                      <div className="department-enterprise-remaining">
                        <span>Remaining Balance</span>
                        <strong className={remainingBalance > 0 ? "is-outstanding" : "is-settled"}>
                          {formatCurrency(remainingBalance)}
                        </strong>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <Card className="department-balance-empty" bordered={false}>
              No active departments found for {year}.
            </Card>
          )}
      </>
    </section>
  );
};

export default DashboardDepartmentBalances;
