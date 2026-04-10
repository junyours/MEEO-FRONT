import React, { useEffect, useState, useRef, useCallback } from "react";
import api from "../Api";
import {
  Card,
  Table,
  Typography,
  Button,
  Space,
  Tooltip,
  Progress,
  message,
  Row,
  Col,
  Tag,
  DatePicker,
  Divider,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Popconfirm,ConfigProvider 
} from "antd";
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  PrinterOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import LoadingOverlay from "./Loading";
import dayjs from "dayjs";
import { generateTargetReportPDF } from "./TargetPdf";

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

// Unique class names for this screen
const CSS_CLASSES = {
  container: 'tr-container',
  header: 'tr-header',
  content: 'tr-content',
  card: 'tr-card',
  table: 'tr-table',
  button: 'tr-button',
  buttonPrimary: 'tr-button-primary',
  buttonGhost: 'tr-button-ghost',
  modal: 'tr-modal',
  form: 'tr-form',
  chart: 'tr-chart',
  progress: 'tr-progress',
  tag: 'tr-tag',
  input: 'tr-input',
  title: 'tr-title',
  subtitle: 'tr-subtitle',
  kpi: 'tr-kpi',
  kpiValue: 'tr-kpi-value',
  kpiLabel: 'tr-kpi-label',
  loading: 'tr-loading'
};

// Minimalist color palette
const COLORS = {
  primary: '#2563eb',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  },
  white: '#ffffff',
  border: '#e2e8f0'
};

// Department colors with minimalist palette
const DEPARTMENT_COLORS = [
  COLORS.primary, 
  COLORS.success, 
  COLORS.warning, 
  COLORS.neutral[600]
];

const getDepartmentColor = (departmentName, index) => {
  const name = departmentName.toLowerCase();
  if (name.includes('wharf')) {
    return COLORS.neutral[700];
  }
  return DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length];
};

// Minimalist button styles
const buttonStyles = {
  primary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    color: COLORS.white,
    borderRadius: '6px',
    fontWeight: 500,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: 'none',
    height: '36px'
  },
  ghost: {
    color: COLORS.neutral[600],
    backgroundColor: 'transparent',
    borderColor: COLORS.border,
    borderRadius: '6px',
    fontWeight: 500
  }
};

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const TargetsReports = () => {
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [targetValues, setTargetValues] = useState({});
  const [yearRange, setYearRange] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const reportRefs = useRef({});
  const chartRefs = useRef({});
  const progressRefs = useRef({});
  const currentYear = dayjs().year();

  // Optimized change handlers to prevent focus loss
  const handleAnnualChange = useCallback((module, value) => {
    const cleanValue = value.replace(/[^\d]/g, '');
    setTargetValues(prev => ({
      ...prev,
      [module]: cleanValue ? Number(cleanValue) : null,
    }));
  }, []);

  const handleMonthlyChange = useCallback((cellKey, value) => {
    const cleanValue = value.replace(/[^\d]/g, '');
    setTargetValues(prev => ({
      ...prev,
      [cellKey]: cleanValue ? Number(cleanValue) : null,
    }));
  }, []);

  const fetchReports = async (startYear, endYear) => {
    setLoading(true);
    try {
      const res = await api.get(
        `/department-collection?start_year=${startYear}&end_year=${endYear}`
      );
      const data = res.data;
      
      // Transform the data to match expected format for each year
      const transformedReports = {};
      
      if (data.departments && Array.isArray(data.departments)) {
        
        // Group departments by year
        const departmentsByYear = {};
        
        data.departments.forEach(dept => {
          const year = dept.year;
          if (!departmentsByYear[year]) {
            departmentsByYear[year] = [];
          }
          
          departmentsByYear[year].push({
            id: dept.id,
            module: dept.name,
            annual_target: dept.target?.annual_target || 0,
            total_collection: dept.collection?.total_collection || 0,
            progress: dept.performance?.progress_percentage || 0,
            monthly: dept.collection?.monthly_collections ? {
              1: dept.collection.monthly_collections.january || 0,
              2: dept.collection.monthly_collections.february || 0,
              3: dept.collection.monthly_collections.march || 0,
              4: dept.collection.monthly_collections.april || 0,
              5: dept.collection.monthly_collections.may || 0,
              6: dept.collection.monthly_collections.june || 0,
              7: dept.collection.monthly_collections.july || 0,
              8: dept.collection.monthly_collections.august || 0,
              9: dept.collection.monthly_collections.september || 0,
              10: dept.collection.monthly_collections.october || 0,
              11: dept.collection.monthly_collections.november || 0,
              12: dept.collection.monthly_collections.december || 0,
            } : {},
            monthly_targets: dept.target?.monthly_targets || {},
          });
        });
        
        // Set the transformed reports
        Object.assign(transformedReports, departmentsByYear);
      }
      
      setReports(transformedReports);
    } catch (error) {
      console.error(error);
      message.error("Failed to fetch reports");
    }
    setLoading(false);
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/department-collection/departments');
      setDepartments(res.data.departments || []);
    } catch (error) {
      console.error(error);
      message.error("Failed to fetch departments");
    }
  };

  useEffect(() => {
    setYearRange([currentYear, currentYear]);
    fetchReports(currentYear, currentYear);
    fetchDepartments();
  }, []);

  const handleYearChange = (dates) => {
    if (dates && dates.length === 2) {
      const startYear = dates[0].year();
      const endYear = dates[1].year();
      setYearRange([startYear, endYear]);
      fetchReports(startYear, endYear);
    }
  };

  const handleSaveRow = async (row, year) => {
    try {
      const payload = {
        department_id: row.id,
        annual_target: Number(targetValues[row.module] || row.annual_target),
        year: year,
        monthly_targets: row.monthly_targets || {},
      };

      await api.post("/department-collection/targets", payload);

      message.success("Target updated successfully!");
      setEditingRow(null);
      fetchReports(yearRange[0], yearRange[1]);
    } catch (err) {
      console.error(err);
      message.error("Error saving target");
    }
  };

  const handleSaveMonthlyCollection = async (row, year, month, monthIndex) => {
    try {
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                         'july', 'august', 'september', 'october', 'november', 'december'];
      
      const payload = {
        year: year,
        month: monthNames[monthIndex - 1],
        amount: Number(targetValues[`${row.module}-${monthIndex}`] || 0),
      };

      await api.put(`/department-collection/departments/${row.id}/collections`, payload);

      message.success(`${month} collection updated successfully!`);
      setEditingCell(null);
      fetchReports(yearRange[0], yearRange[1]);
    } catch (err) {
      console.error(err);
      message.error("Error saving monthly collection");
    }
  };

  const handleCreateDepartment = async (values) => {
    try {
      await api.post('/department-collection/departments', {
        name: values.name,
        code: values.code,
        description: values.description,
        is_active: values.is_active !== undefined ? values.is_active : true,
      });

      message.success('Department created successfully!');
      setIsModalVisible(false);
      form.resetFields();
      fetchDepartments();
      fetchReports(yearRange[0], yearRange[1]);
    } catch (err) {
      console.error(err);
      message.error('Error creating department');
    }
  };

  const getProgressColor = (percent) => {
    if (percent < 50) return COLORS.danger;
    if (percent < 90) return COLORS.warning;
    return COLORS.success;
  };

  const handlePrint = async (year, reportData) => {
    const pieChartRef = chartRefs.current[year];
    const overallChartRef = progressRefs.current[year];
    await generateTargetReportPDF(year, reportData, pieChartRef, overallChartRef);
  };

  return (
    <div className={CSS_CLASSES.container} style={{
      padding: '24px',
      minHeight: '100vh',
      backgroundColor: COLORS.neutral[50],
    }}>
      {loading && <LoadingOverlay message="Loading target reports..." />}

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Minimalist Header */}
        <Card 
          className={CSS_CLASSES.header}
          bordered={false}
          style={{
            marginBottom: '24px',
            borderRadius: '8px',
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.white,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col>
              <div>
                <Title 
                  level={3} 
                  className={CSS_CLASSES.title}
                  style={{
                    margin: 0,
                    color: COLORS.neutral[900],
                    fontWeight: 600,
                    fontSize: '20px',
                  }}
                >
                  Targets & Collection Overview
                </Title>
                <Text 
                  className={CSS_CLASSES.subtitle}
                  type="secondary"
                  style={{
                    fontSize: '14px',
                    color: COLORS.neutral[500],
                  }}
                >
                  Monitor economic enterprise targets and collection performance
                </Text>
              </div>
            </Col>
            <Col>
              <Space size="middle" align="center">
                <div>
                  <Text strong style={{ 
                    display: "block", 
                    marginBottom: 4,
                    fontSize: '14px',
                    color: COLORS.neutral[700]
                  }}>
                    Year Range
                  </Text>
                  <RangePicker
                    picker="year"
                    onChange={handleYearChange}
                    style={{
                      minWidth: '240px',
                      borderRadius: '6px',
                      border: `1px solid ${COLORS.border}`,
                      height: '36px'
                    }}
                    value={
                      yearRange.length === 2
                        ? [
                            dayjs(`${yearRange[0]}`, "YYYY"),
                            dayjs(`${yearRange[1]}`, "YYYY"),
                          ]
                        : [
                            dayjs(`${currentYear}`, "YYYY"),
                            dayjs(`${currentYear}`, "YYYY"),
                          ]
                    }
                  />
                </div>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    fetchReports(yearRange[0], yearRange[1]);
                    fetchDepartments();
                  }}
                  disabled={loading}
                  style={{
                    borderRadius: '6px',
                    height: '36px',
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.neutral[700]
                  }}
                >
                  Refresh
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  className={CSS_CLASSES.buttonPrimary}
                  style={buttonStyles.primary}
                  onClick={() => setIsModalVisible(true)}
                >
                  Add Department
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Per-year Reports */}
        {yearRange.length === 2 &&
          Array.from(
            { length: yearRange[1] - yearRange[0] + 1 },
            (_, i) => yearRange[0] + i
          ).map((year) => {
            const reportData = reports[year] || [];
            
            // Always show the report if there's data, even if totals are zero
            if (reportData.length === 0) {
              return (
                <Card
                  key={year}
                  className={CSS_CLASSES.card}
                  style={{
                    marginBottom: '24px',
                    borderRadius: '8px',
                    border: `1px solid ${COLORS.border}`,
                    backgroundColor: COLORS.white,
                  }}
                  bordered={false}
                >
                  <Row justify="center" align="middle" style={{ padding: '40px 0' }}>
                    <Col>
                      <div style={{ textAlign: 'center' }}>
                        <Title level={4} style={{ 
                          marginBottom: 8,
                          color: COLORS.neutral[700],
                          fontWeight: 500
                        }}>
                          Target Report for {year}
                        </Title>
                        <Text type="secondary" style={{ color: COLORS.neutral[500] }}>
                          No departments found. Try adding departments or check the year range.
                        </Text>
                      </div>
                    </Col>
                  </Row>
                </Card>
              );
            }

            const totalCollection = reportData.reduce(
              (sum, r) => sum + Number(r.total_collection || 0),
              0
            );
            const totalTarget = reportData.reduce(
              (sum, r) => sum + Number(r.annual_target ?? 0),
              0
            );
            const overallProgress =
              totalTarget > 0
                ? ((totalCollection / totalTarget) * 100).toFixed(2)
                : 0;

            const pieData = reportData.map((r) => {
              const target = r.annual_target ?? 0;
              const value =
                target > 0 ? Math.min((r.total_collection / target) * 100, 100) : 0;
              return {
                name: r.module,
                value,
                collected: r.total_collection ?? 0,
                target,
              };
            });

            const columns = [
              {
                title: "Economic Enterprise",
                dataIndex: "module",
                key: "module",
                fixed: "left",
                render: (text, row, index) => (
                  <Tag
                    className={CSS_CLASSES.tag}
                    color={getDepartmentColor(row.module, index)}
                    style={{
                      borderRadius: '4px',
                      fontWeight: 500,
                      color: "white",
                      padding: "4px 8px",
                      textTransform: "capitalize",
                      fontSize: '13px',
                      border: 'none',
                    }}
                  >
                    {text}
                  </Tag>
                ),
              },
              {
                title: `Annual Target (${year})`,
                dataIndex: "annual_target",
                key: "annual_target",
                render: (text, row) => {
                  const isEditable = year >= currentYear;

                  if (editingRow === row.module) {
                    return (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          minWidth: '200px',
                          gap: '8px',
                        }}
                      >
                        <Input
                          key={`annual-${row.module}`}
                          ref={(el) => {
                            if (el && editingRow === row.module) {
                              el.focus();
                            }
                          }}
                          type="text"
                          value={targetValues[row.module] ? `₱ ${Number(targetValues[row.module]).toLocaleString()}` : ''}
                          onChange={(e) => handleAnnualChange(row.module, e.target.value)}
                          className={CSS_CLASSES.input}
                          style={{
                            width: "100%",
                            borderRadius: '6px',
                            fontSize: '14px',
                            border: `1px solid ${COLORS.border}`,
                            height: '32px'
                          }}
                        />

                        <Tooltip title="Save">
                          <Button
                            shape="circle"
                            icon={<SaveOutlined />}
                            style={{
                              ...buttonStyles.primary,
                              width: '32px',
                              height: '32px'
                            }}
                            onClick={() => handleSaveRow(row, year)}
                          />
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <Button
                            shape="circle"
                            icon={<CloseOutlined />}
                            type="text"
                            danger
                            style={{ 
                              width: '32px',
                              height: '32px',
                              border: `1px solid ${COLORS.danger}`
                            }}
                            onClick={() => setEditingRow(null)}
                          />
                        </Tooltip>
                      </div>
                    );
                  }

                  return (
                    <Space>
                      <Text
                        strong
                        style={{
                          whiteSpace: "nowrap",
                          textAlign: "right",
                          display: "block",
                          fontVariantNumeric: "tabular-nums",
                          fontSize: '14px',
                          color: COLORS.neutral[800]
                        }}
                      >
                        ₱
                        {Number(text ?? 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </Text>

                      {isEditable && (
                        <Tooltip title="Edit Target">
                          <Button
                            icon={<EditOutlined />}
                            className={CSS_CLASSES.buttonGhost}
                            style={{
                              height: '24px',
                              width: '24px',
                              padding: 0,
                              backgroundColor: COLORS.white,
                              color: '#000000',
                              border: `1px solid ${COLORS.border}`,
                              boxShadow: 'none'
                            }}
                            onClick={() => {
                              setTargetValues(prev => ({
                                ...prev,
                                [row.module]: Number(row.annual_target) || 0,
                              }));
                              setEditingRow(row.module);
                            }}
                          />
                        </Tooltip>
                      )}
                    </Space>
                  );
                },
              },
              ...months.map((m, i) => ({
                title: m,
                key: `collection_${m}`,
                align: "right",
                width: 100,
                render: (_, row) => {
                  const cellKey = `${row.module}-${i + 1}`;
                  const isEditable = year >= currentYear;
                  const monthlyCollection = row.monthly?.[i + 1] || 0;

                  if (editingCell === cellKey) {
                    const currentValue = targetValues[cellKey] !== undefined 
                      ? targetValues[cellKey] 
                      : Number(monthlyCollection);
                    const originalValue = Number(monthlyCollection);
                    const hasChanged = currentValue !== originalValue;
                    
                    return (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          minWidth: '140px',
                          gap: '4px',
                          justifyContent: 'flex-end'
                        }}
                      >
                        <Input
                          key={`monthly-${cellKey}`}
                          ref={(el) => {
                            if (el && editingCell === cellKey) {
                              el.focus();
                            }
                          }}
                          type="text"
                          value={targetValues[cellKey] ? `₱ ${Number(targetValues[cellKey]).toLocaleString()}` : ''}
                          onChange={(e) => handleMonthlyChange(cellKey, e.target.value)}
                          className={CSS_CLASSES.input}
                          style={{
                            width: '100px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            textAlign: 'right',
                            border: `1px solid ${COLORS.border}`,
                            height: '24px'
                          }}
                        />

                        {hasChanged && (
                          <Tooltip title="Save">
                            <Button
                              icon={<SaveOutlined />}
                              style={{
                                width: '24px',
                                height: '24px',
                                fontSize: '10px',
                                backgroundColor: COLORS.white,
                                color: '#000000',
                                border: `1px solid ${COLORS.border}`,
                                boxShadow: 'none'
                              }}
                              onClick={() => handleSaveMonthlyCollection(row, year, m, i + 1)}
                            />
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Cancel">
                          <Button
                            size="small"
                            icon={<CloseOutlined />}
                            style={{ 
                              width: '24px',
                              height: '24px',
                              fontSize: '10px',
                              backgroundColor: COLORS.danger,
                              color: COLORS.white,
                              borderColor: COLORS.danger
                            }}
                            onClick={() => setEditingCell(null)}
                          />
                        </Tooltip>
                      </div>
                    );
                  }

                  return (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'flex-end', 
                      gap: '4px' 
                    }}>
                      <Text
                        style={{
                          whiteSpace: "nowrap",
                          fontVariantNumeric: "tabular-nums",
                          fontSize: '13px',
                          color: '#000000'
                        }}
                      >
                        ₱
                        {Number(monthlyCollection).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>

                      {isEditable && (
                        <Tooltip title="Edit Monthly Collection">
                          <Button
                            icon={<EditOutlined />}
                            className={CSS_CLASSES.buttonGhost}
                            style={{
                              height: '24px',
                              width: '24px',
                              fontSize: '12px',
                              padding: 0,
                              backgroundColor: COLORS.white,
                              color: '#000000',
                              border: `1px solid ${COLORS.border}`,
                              boxShadow: 'none'
                            }}
                            onClick={() => {
                              setTargetValues(prev => ({
                                ...prev,
                                [cellKey]: Number(monthlyCollection) || 0,
                              }));
                              setEditingCell(cellKey);
                            }}
                          />
                        </Tooltip>
                      )}
                    </div>
                  );
                },
              })),
              {
                title: "Total Collection",
                key: "total_collection",
                align: "right",
                render: (_, row) => (
                  <Text strong style={{ 
                    fontVariantNumeric: "tabular-nums",
                    fontSize: '14px',
                    color: COLORS.neutral[800]
                  }}>
                    ₱
                    {Number(row.total_collection || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                ),
              },
              {
                title: "Progress",
                key: "progress",
                width: 160,
                render: (_, row) => {
                  const percent = Number(row.progress?.toFixed(2)) || 0;
                  return (
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        minWidth: '120px',
                      }}
                    >
                      <Progress
                        percent={percent}
                        strokeColor={getProgressColor(percent)}
                        trailColor={COLORS.neutral[200]}
                        showInfo={false}
                        className={CSS_CLASSES.progress}
                        style={{ height: '6px', borderRadius: '3px' }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          top: 0,
                          left: "50%",
                          transform: "translateX(-50%)",
                          color: '#000000',
                          fontWeight: 500,
                          fontSize: '12px',
                          lineHeight: '6px'
                        }}
                      >
                        {percent.toFixed(2)}%
                      </span>
                    </div>
                  );
                },
              },
            ];

            // summary monthly totals for collections
            const monthlyCollectionTotals = months.map((_, idx) => {
              const monthIndex = idx + 1; // monthly is 1-based
              return reportData.reduce((sum, row) => {
                const value = Number(row.monthly?.[monthIndex] || 0);
                return sum + value;
              }, 0);
            });

            return (
              <div
                key={year}
                ref={(el) => (reportRefs.current[year] = el)}
                style={{ marginBottom: '32px' }}
              >
                <Card
                  className={CSS_CLASSES.card}
                  bordered={false}
                  style={{
                    borderRadius: '8px',
                    border: `1px solid ${COLORS.border}`,
                    backgroundColor: COLORS.white,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  }}
                  title={
                    <Row justify="space-between" align="middle">
                      <Col>
                        <div>
                          <Title
                            level={4}
                            className={CSS_CLASSES.title}
                            style={{
                              margin: 0,
                              color: COLORS.neutral[900],
                              fontWeight: 600,
                              fontSize: '18px',
                            }}
                          >
                            Target Report for {year}
                          </Title>
                          <Text 
                            className={CSS_CLASSES.subtitle}
                            type="secondary"
                            style={{
                              fontSize: '13px',
                              color: COLORS.neutral[500],
                            }}
                          >
                            Performance breakdown and yearly summary
                          </Text>
                        </div>
                      </Col>
                      <Col>
                        <Button
                          icon={<PrinterOutlined />}
                          className={CSS_CLASSES.buttonPrimary}
                          style={buttonStyles.primary}
                          onClick={() => handlePrint(year, reportData)}
                        >
                          Export PDF
                        </Button>
                      </Col>
                    </Row>
                  }
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Card
                        className={CSS_CLASSES.card}
                        size="small"
                        bordered={false}
                        title={
                          <span style={{ 
                            fontWeight: 600, 
                            color: COLORS.neutral[700],
                            fontSize: '14px'
                          }}>
                            Progress per Department
                          </span>
                        }
                        style={{
                          height: "100%",
                          borderRadius: '8px',
                          border: `1px solid ${COLORS.border}`,
                          backgroundColor: COLORS.neutral[50],
                        }}
                      >
                        <div ref={(el) => (chartRefs.current[year] = el)} className={CSS_CLASSES.chart}>
                          <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={90}
                                label={(entry) =>
                                  `${entry.name}: ${entry.value.toFixed(1)}%`
                                }
                                style={{ fontSize: '11px' }}
                              >
                                {pieData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={getDepartmentColor(entry.name, index)}
                                  />
                                ))}
                              </Pie>
                              <ReTooltip />
                              <Legend 
                                wrapperStyle={{ fontSize: '12px' }}
                                iconType="circle"
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </Col>

                  

                    <Col xs={24} md={12}>
                      <Card
                        className={CSS_CLASSES.card}
                        size="small"
                        bordered={false}
                        title={
                          <span style={{ 
                            fontWeight: 600, 
                            color: COLORS.neutral[700],
                            fontSize: '14px'
                          }}>
                            Overall Progress
                          </span>
                        }
                        style={{
                          height: "100%",
                          borderRadius: '8px',
                          border: `1px solid ${COLORS.border}`,
                          backgroundColor: COLORS.neutral[50],
                          textAlign: "center",
                          paddingBottom: '16px',
                        }}
                      >
                        <div
                          ref={(el) => (progressRefs.current[year] = el)}
                          className={CSS_CLASSES.progress}
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            marginBottom: '16px',
                            marginTop: '8px',
                          }}
                        >
                          <Progress
                            type="circle"
                            percent={Number(overallProgress)}
                            strokeColor={getProgressColor(Number(overallProgress))}
                            trailColor={COLORS.neutral[200]}
                            size={180}
                            format={(percent) => (
                              <div style={{ textAlign: "center" }}>
                                <div
                                  className={CSS_CLASSES.kpiValue}
                                  style={{
                                    fontSize: '22px',
                                    fontWeight: 700,
                                    color: COLORS.neutral[900],
                                    lineHeight: 1.1,
                                  }}
                                >
                                  {percent?.toFixed(2)}%
                                </div>
                                <div
                                  className={CSS_CLASSES.kpiLabel}
                                  style={{
                                    fontSize: '11px',
                                    color: COLORS.neutral[500],
                                    marginTop: '4px',
                                    textTransform: "uppercase",
                                    letterSpacing: '0.5px',
                                  }}
                                >
                                  Overall Achievement
                                </div>
                              </div>
                            )}
                          />
                        </div>

                        <div
                          className={CSS_CLASSES.kpi}
                          style={{
                            marginTop: '12px',
                            padding: '16px',
                            borderRadius: '8px',
                            backgroundColor: COLORS.white,
                            border: `1px solid ${COLORS.border}`,
                          }}
                        >
                          <Row gutter={16}>
                            <Col span={12}>
                              <div
                                style={{
                                  borderRight: `1px solid ${COLORS.border}`,
                                  paddingRight: '12px',
                                }}
                              >
                                <Text
                                  className={CSS_CLASSES.kpiLabel}
                                  style={{
                                    fontSize: '11px',
                                    textTransform: "uppercase",
                                    letterSpacing: '0.5px',
                                    color: COLORS.neutral[500],
                                  }}
                                >
                                  Total Target
                                </Text>
                                <div style={{ marginTop: '4px' }}>
                                  <Text
                                    className={CSS_CLASSES.kpiValue}
                                    style={{
                                      display: "block",
                                      fontSize: '16px',
                                      fontWeight: 700,
                                      color: COLORS.primary,
                                      fontVariantNumeric: "tabular-nums",
                                    }}
                                  >
                                    ₱
                                    {totalTarget.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                    })}
                                  </Text>
                                </div>
                              </div>
                            </Col>

                            <Col span={12}>
                              <div style={{ paddingLeft: '12px' }}>
                                <Text
                                  className={CSS_CLASSES.kpiLabel}
                                  style={{
                                    fontSize: '11px',
                                    textTransform: "uppercase",
                                    letterSpacing: '0.5px',
                                    color: COLORS.neutral[500],
                                  }}
                                >
                                  Total Collection
                                </Text>
                                <div style={{ marginTop: '4px' }}>
                                  <Text
                                    className={CSS_CLASSES.kpiValue}
                                    style={{
                                      display: "block",
                                      fontSize: '16px',
                                      fontWeight: 700,
                                      color: COLORS.success,
                                      fontVariantNumeric: "tabular-nums",
                                    }}
                                  >
                                    ₱
                                    {totalCollection.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                    })}
                                  </Text>

                                  <Text
                                    style={{
                                      fontSize: '10px',
                                      color: COLORS.neutral[500],
                                      marginTop: '2px',
                                      display: "inline-block",
                                    }}
                                  >
                                    {totalTarget > 0
                                      ? `${overallProgress}% of total target`
                                      : "No target set"}
                                  </Text>
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  {/* Monthly Collection Trends - Full Width */}
                  <Card
                    className={CSS_CLASSES.card}
                    bordered={false}
                    style={{
                      marginTop: '20px',
                      borderRadius: '8px',
                      border: `1px solid ${COLORS.border}`,
                      backgroundColor: COLORS.neutral[50],
                    }}
                    title={
                      <span style={{ 
                        fontWeight: 600, 
                        color: COLORS.neutral[700],
                        fontSize: '14px'
                      }}>
                        Monthly Collection Trends - Economic Enterprises Performance
                      </span>
                    }
                  >
                    <div className={CSS_CLASSES.chart}>
                      <ResponsiveContainer width="100%" height={350}>
                        <LineChart
                          data={months.map((month, index) => {
                            const monthData = { month };
                            reportData.forEach((dept) => {
                              monthData[dept.module] = dept.monthly?.[index + 1] || 0;
                            });
                            return monthData;
                          })}
                          margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
                        >
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke={COLORS.neutral[200]}
                            verticalFill={[COLORS.white, COLORS.neutral[50]]}
                            fillOpacity={0.5}
                          />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 12, fontWeight: 500, fill: COLORS.neutral[600] }}
                            stroke={COLORS.neutral[400]}
                            tickLine={{ stroke: COLORS.neutral[400] }}
                            axisLine={{ stroke: COLORS.neutral[400], strokeWidth: 1 }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fontWeight: 500, fill: COLORS.neutral[600] }}
                            stroke={COLORS.neutral[400]}
                            tickLine={{ stroke: COLORS.neutral[400] }}
                            axisLine={{ stroke: COLORS.neutral[400], strokeWidth: 1 }}
                            tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                            label={{ 
                              value: 'Collection Amount (₱)', 
                              angle: -90, 
                              position: 'insideLeft',
                              style: { fontSize: 12, fontWeight: 600, color: COLORS.neutral[600] }
                            }}
                          />
                          <ReTooltip 
                            formatter={(value, name) => [
                              `₱${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                              name
                            ]}
                            contentStyle={{
                              backgroundColor: COLORS.white,
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: '6px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              padding: '8px'
                            }}
                            labelStyle={{ 
                              fontWeight: 600, 
                              color: COLORS.neutral[700],
                              marginBottom: '4px'
                            }}
                          />
                          <Legend 
                            wrapperStyle={{ 
                              fontSize: '12px',
                              fontWeight: 500,
                              paddingTop: '16px'
                            }}
                            iconType="line"
                            iconSize={12}
                          />
                          {reportData.map((dept, index) => (
                            <Line
                              key={dept.module}
                              type="monotone"
                              dataKey={dept.module}
                              stroke={getDepartmentColor(dept.module, index)}
                              strokeWidth={2}
                              dot={{ 
                                fill: getDepartmentColor(dept.module, index), 
                                r: 3,
                                strokeWidth: 1,
                                stroke: COLORS.white
                              }}
                              activeDot={{ 
                                r: 5,
                                stroke: getDepartmentColor(dept.module, index),
                                strokeWidth: 1,
                                fill: COLORS.white
                              }}
                              connectNulls={false}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card
                    className={CSS_CLASSES.card}
                    bordered={false}
                    style={{
                      marginTop: '20px',
                      borderRadius: '8px',
                      border: `1px solid ${COLORS.border}`,
                      backgroundColor: COLORS.neutral[50],
                    }}
                    title={
                      <span style={{ 
                        fontWeight: 600, 
                        color: COLORS.neutral[700],
                        fontSize: '14px'
                      }}>
                        Detailed Targets Table for {year}
                      </span>
                    }
                  >
                 <ConfigProvider
  theme={{
    components: {
      Table: {
        headerBg: COLORS.white,
        headerColor: COLORS.neutral[800],
        borderColor: COLORS.border,
      },
    },
  }}
>
  <Table
    className={CSS_CLASSES.table}
    columns={columns}
    dataSource={reportData}
    rowKey="module"
    pagination={false}
    scroll={{ x: "max-content" }}
    size="middle"
    style={{
      borderRadius: '8px',
      overflow: "hidden",
      border: `1px solid ${COLORS.border}`,
    }}
  />
</ConfigProvider>
                  </Card>
                </Card>
              </div>
            );
          })}
      </div>

      {/* Department Creation Modal */}
      <Modal
        className={CSS_CLASSES.modal}
        title={
          <div style={{ 
            textAlign: 'center', 
            fontSize: '16px', 
            fontWeight: 600,
            color: COLORS.neutral[800]
          }}>
            Create New Department
          </div>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={480}
        style={{ borderRadius: '8px' }}
        bodyStyle={{
          padding: '24px'
        }}
      >
        <Form
          className={CSS_CLASSES.form}
          form={form}
          layout="vertical"
          onFinish={handleCreateDepartment}
          style={{ marginTop: '16px' }}
        >
          <Form.Item
            name="name"
            label={
              <span style={{ 
                fontWeight: 500, 
                color: COLORS.neutral[700],
                fontSize: '14px'
              }}>
                Department Name
              </span>
            }
            rules={[
              { required: true, message: 'Please enter department name' },
              { max: 255, message: 'Name too long' }
            ]}
          >
            <Input
              className={CSS_CLASSES.input}
              placeholder="e.g., Market Operations"
              style={{ 
                borderRadius: '6px',
                border: `1px solid ${COLORS.border}`,
                height: '36px'
              }}
            />
          </Form.Item>

          <Form.Item
            name="code"
            label={
              <span style={{ 
                fontWeight: 500, 
                color: COLORS.neutral[700],
                fontSize: '14px'
              }}>
                Department Code
              </span>
            }
            rules={[
              { required: true, message: 'Please enter department code' },
              { max: 50, message: 'Code too long' }
            ]}
          >
            <Input
              className={CSS_CLASSES.input}
              placeholder="e.g., MKT OPS"
              style={{ 
                borderRadius: '6px',
                border: `1px solid ${COLORS.border}`,
                height: '36px'
              }}
              uppercase
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <span style={{ 
                fontWeight: 500, 
                color: COLORS.neutral[700],
                fontSize: '14px'
              }}>
                Description
              </span>
            }
            rules={[
              { max: 500, message: 'Description too long' }
            ]}
          >
            <Input.TextArea
              className={CSS_CLASSES.input}
              placeholder="Brief description of the department..."
              rows={3}
              style={{ 
                borderRadius: '6px',
                border: `1px solid ${COLORS.border}`
              }}
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label={
              <span style={{ 
                fontWeight: 500, 
                color: COLORS.neutral[700],
                fontSize: '14px'
              }}>
                Active Status
              </span>
            }
            valuePropName="checked"
            initialValue={true}
          >
            <Switch 
              checkedChildren="Active" 
              unCheckedChildren="Inactive"
              style={{ backgroundColor: COLORS.primary }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                }}
                style={{ 
                  borderRadius: '6px', 
                  width: '120px',
                  height: '36px',
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.neutral[600]
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{ 
                  ...buttonStyles.primary, 
                  borderRadius: '6px', 
                  width: '140px',
                  height: '36px',
                }}
              >
                Create Department
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TargetsReports;
