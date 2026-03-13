import React, { useEffect, useState } from "react";
import {
  Button,
  Input,
  Modal,
  Select,
  Form,
  message,
  Space,
  DatePicker,
  InputNumber,
  Table,
  Card,
  Row,
  Col,
  Tag,
  Checkbox,
  Spin,
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  UserOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import api from "../Api";
import StallGrid from "./StallGrid";
import LoadingOverlay from "./Loading"; // ✅ logo-based loader
import "./SectionManager.css";

const { Option } = Select;

const SectionManager = () => {
  const [areas, setAreas] = useState([]);
  const [editMode, setEditMode] = useState(false);

  // ✅ Global loader
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  // Add Area
  const [showAddAreaForm, setShowAddAreaForm] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [areaColumns, setAreaColumns] = useState("");
  const [rowsPerColumn, setRowsPerColumn] = useState([]);

  // Add Section
  const [showAddSectionForm, setShowAddSectionForm] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [rateType, setRateType] = useState("");
  const [rate, setRate] = useState("");
  const [monthlyRate, setMonthlyRate] = useState("");
  const [rightsType, setRightsType] = useState("");
  const [spaceRight, setSpaceRight] = useState("");
  const [stallRight, setStallRight] = useState("");

  // Edit Section
  const [showEditSectionForm, setShowEditSectionForm] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  // Add Stalls
  const [showStallModal, setShowStallModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [rowCount, setRowCount] = useState("");
  const [columnsPerRow, setColumnsPerRow] = useState([]);
  const [stallSize, setStallSize] = useState("");
  const [stallDailyRate, setStallDailyRate] = useState("");
  const [stallMonthlyRate, setStallMonthlyRate] = useState("");

  // ✅ NEW: single stall placement
  const [pendingStallData, setPendingStallData] = useState(null);

  // Multi-Stall Assignment State
  const [showMultiAssignModal, setShowMultiAssignModal] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedAssignSection, setSelectedAssignSection] = useState(null);
  const [selectedAreaType, setSelectedAreaType] = useState(null);
  const [filteredSections, setFilteredSections] = useState([]);
  const [vacantStalls, setVacantStalls] = useState([]);
  const [selectedStalls, setSelectedStalls] = useState([]);
  const [paymentType, setPaymentType] = useState('daily');
  const [customDailyRate, setCustomDailyRate] = useState(null);
  const [customMonthlyRate, setCustomMonthlyRate] = useState(null);
  
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingVacantStalls, setLoadingVacantStalls] = useState(false);
  const [assigningStalls, setAssigningStalls] = useState(false); 

  // ✅ Fetch Areas
  const fetchAreas = async () => {
    try {
      setLoadingMessage("Fetching Market Layout...");
      setLoading(true);

      const response = await api.get("/areas");
      const dataWithVacancies = response.data.data.map((area) => {
        const rowsPerCol =
          area.rows_per_column ||
          Array(area.column_count).fill(area.row_count);

        let vacancies = [];
        rowsPerCol.forEach((rowCount, colIdx) => {
          for (let r = 0; r < rowCount; r++) {
            const sectionData = area.sections?.find(
              (s) => s.column_index === colIdx && s.row_index === r
            ) || null;
            
            vacancies.push({
              id: `vacant-${colIdx + 1}-${r + 1}`,
              section: sectionData ? {
                ...sectionData,
                area_name: area.name // Add area name to section data
              } : null,
            });
          }
        });

        return { ...area, rows_per_column: rowsPerCol, vacancies };
      });
      console.log(response.data.data)
      setAreas(dataWithVacancies);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch areas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  // Handlers for inputs
  const handleColumnsChange = (value) => {
    setAreaColumns(value);
    setRowsPerColumn(Array.from({ length: parseInt(value) || 0 }, () => ""));
  };

  const handleRowChange = (colIndex, value) => {
    const updated = [...rowsPerColumn];
    updated[colIndex] = value;
    setRowsPerColumn(updated);
  };

  const handleRowCountChange = (value) => {
    setRowCount(value);
    setColumnsPerRow(Array.from({ length: parseInt(value) || 0 }, () => ""));
  };

  const handleColumnsPerRowChange = (rowIndex, value) => {
    const updated = [...columnsPerRow];
    updated[rowIndex] = value;
    setColumnsPerRow(updated);
  };

  // ✅ Add Area
  const handleAddArea = async () => {
    if (!newAreaName || !areaColumns || rowsPerColumn.some((r) => !r)) {
      return message.warning("All fields required.");
    }

    setLoadingMessage("Saving New Area...");
    setLoading(true);
    try {
      const response = await api.post("/areas", {
        name: newAreaName,
        column_count: areaColumns,
        rows_per_column: rowsPerColumn,
      });

      const createdArea = response.data.data;
      const vacancies = [];
      rowsPerColumn.forEach((rowCount, colIdx) => {
        for (let r = 0; r < rowCount; r++) {
          vacancies.push({
            id: `vacant-${colIdx + 1}-${r + 1}`,
            section: null,
          });
        }
      });

      setAreas([
        ...areas,
        {
          ...createdArea,
          sections: [],
          vacancies,
          rows_per_column: rowsPerColumn,
        },
      ]);
      setNewAreaName("");
      setAreaColumns("");
      setRowsPerColumn([]);
      setShowAddAreaForm(false);
      message.success("Area added successfully!");
    } catch {
      message.error("Failed to add area.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Add Section
  const handleAddSection = async () => {
    if (!newSectionName || !selectedArea || !rateType || !rightsType || (rightsType === "space_right" && !spaceRight) || (rightsType === "stall_right" && !stallRight))
      return message.warning("All fields required.");

    const vacancy = selectedArea.vacancies[selectedVacancy];
    const [, col, row] = vacancy.id.split("-");
    const column_index = parseInt(col) - 1;
    const row_index = parseInt(row) - 1;

    const payload = {
      name: newSectionName,
      area_id: selectedArea.id,
      rate_type: rateType,
      rights_type: rightsType,
      column_index,
      row_index,
      ...(rateType === "per_sqm" && { rate }),
      ...(rateType === "fixed" && { monthly_rate: monthlyRate }),
      ...(rightsType === "space_right" && { space_right: spaceRight }),
      ...(rightsType === "stall_right" && { stall_right: stallRight }),
    };

    setLoadingMessage("Saving New Section...");
    setLoading(true);
    try {
      const response = await api.post("/sections", payload);
      const newSection = response.data.data;

      const updatedAreas = areas.map((area) => {
        if (area.id === selectedArea.id) {
          const updatedVacancies = [...area.vacancies];
          updatedVacancies[selectedVacancy] = {
            ...updatedVacancies[selectedVacancy],
            section: newSection,
          };
          return {
            ...area,
            vacancies: updatedVacancies,
            sections: [...area.sections, {
              ...newSection,
              area_name: area.name // Add area name to new section
            }],
          };
        }
        return area;
      });

      setAreas(updatedAreas);
      setNewSectionName("");
      setRateType("");
      setRate("");
      setMonthlyRate("");
      setRightsType("");
      setSpaceRight("");
      setStallRight("");
      setSelectedArea(null);
      setSelectedVacancy(null);
      setShowAddSectionForm(false);
      message.success("Section added successfully!");
    } catch (err) {
      console.error(err);
      message.error("Failed to add section.");
    } finally {
      setLoading(false);
    }
  };
  const handleRefresh = async () => {
    await fetchAreas(); // Refetch the areas
    message.success("Stall refreshed!");
  };

  // ✅ Edit Section
  const handleUpdateSection = async () => {
    if (!editingSection) return;

    setLoadingMessage("Updating Section...");
    setLoading(true);
    try {
      const payload = {
        rate_type: rateType,
        ...(rateType === "per_sqm" && { rate }),
        ...(rateType === "fixed" && { monthly_rate: monthlyRate }),
      };

      const response = await api.put(`/sections/${editingSection.id}`, payload);
      const updatedSection = response.data.data;

      const updatedAreas = areas.map((area) => ({
        ...area,
        vacancies: area.vacancies.map((vac) =>
          vac.section?.id === editingSection.id
            ? { ...vac, section: updatedSection }
            : vac
        ),
        sections: area.sections.map((s) => {
          const sectionWithAreaName = s.id === editingSection.id ? updatedSection : s;
          // Add area_name if not already present
          if (!sectionWithAreaName.area_name) {
            sectionWithAreaName.area_name = area.name;
          }
          return sectionWithAreaName;
        }),
      }));

      setAreas(updatedAreas);
      setEditingSection(null);
      setRateType("");
      setRate("");
      setMonthlyRate("");
      setShowEditSectionForm(false);
      message.success("Section updated successfully!");
    } catch (err) {
      console.error(err);
      message.error("Failed to update section.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Add Stalls (bulk + single from empty)
  const handleAddStall = async () => {
    if (!rowCount || columnsPerRow.some((c) => !c))
      return message.warning("Please fill out all fields");

    setLoadingMessage("Adding Stalls...");
    setLoading(true);

    try {
      const newStalls = [];
      let count = (selectedSection.stalls?.length || 0) + 1;

      for (let r = 0; r < parseInt(rowCount); r++) {
        const colCount = parseInt(columnsPerRow[r]);
        for (let c = 1; c <= colCount; c++) {
          const newStall = {
            section_id: selectedSection.id,
            stall_number: `${count}`,
            row_position: r + 1,
            column_position: c,
            size: stallSize,
            daily_rate: stallDailyRate || null,
            monthly_rate: stallMonthlyRate || null,
            status: "vacant",
          };
          const response = await api.post("/addstall", newStall);
          newStalls.push(response.data.data);
          count++;
        }
      }

      message.success(`${newStalls.length} stalls added.`);
      setShowStallModal(false);
      
      // Reset form fields
      setRowCount("");
      setColumnsPerRow([]);
      setStallSize("");
      setStallDailyRate("");
      setStallMonthlyRate("");

      const updatedAreas = areas.map((area) => ({
        ...area,
        vacancies: area.vacancies.map((vac) => {
          if (vac.section?.id === selectedSection.id) {
            return {
              ...vac,
              section: {
                ...vac.section,
                stalls: [...(vac.section.stalls || []), ...newStalls],
                area_name: area.name // Add area name to section
              },
            };
          }
          return vac;
        }),
      }));

      setAreas(updatedAreas);
    } catch (err) {
      console.error(err);
      message.error("Failed to add stalls.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Add single stall from empty cell (trigger modal)
  const handleAddSingleStall = (stallInfo) => {
    setSelectedSection({ id: stallInfo.section_id });
    setPendingStallData(stallInfo);
    setShowStallModal(true);
  };

  // Multi-Stall Assignment Functions
  const fetchVendors = async () => {
    try {
      setLoadingVendors(true);
      const response = await api.get('/market-layout/vendors-for-assignment');
      if (response.data.success) {
        setVendors(response.data.vendors);
      }
    } catch (error) {
      message.error('Failed to fetch vendors');
      console.error(error);
    } finally {
      setLoadingVendors(false);
    }
  };

  const fetchVacantStalls = async (sectionId) => {
    try {
      setLoadingVacantStalls(true);
      const response = await api.get(`/market-layout/vacant-stalls/${sectionId}`);
      if (response.data.success) {
        setVacantStalls(response.data.vacant_stalls);
        setSelectedStalls([]); // Clear selection when fetching new section
      }
    } catch (error) {
      message.error('Failed to fetch vacant stalls');
      console.error(error);
    } finally {
      setLoadingVacantStalls(false);
    }
  };

  const fetchSectionsByAreaType = async (areaType) => {
    try {
      const response = await api.get(`/market-layout/sections-by-area-type?area_type=${areaType}`);
      if (response.data.success) {
        setFilteredSections(response.data.sections);
        setSelectedAssignSection(null); // Clear section selection when area type changes
        setVacantStalls([]); // Clear vacant stalls when area type changes
        setSelectedStalls([]); // Clear stall selection when area type changes
      }
    } catch (error) {
      message.error('Failed to fetch sections');
      console.error(error);
    }
  };

  const handleMultiAssignStalls = async () => {
    if (!selectedVendor || selectedStalls.length === 0) {
      return message.warning('Please fill all required fields');
    }

    try {
      setAssigningStalls(true);
      const payload = {
        vendor_id: selectedVendor,
        stall_ids: selectedStalls,
        payment_type: paymentType,
      };

      const response = await api.post('/market-layout/multi-assign-stalls', payload);
      
      if (response.data.success) {
        message.success(`Successfully assigned ${selectedStalls.length} stalls to vendor`);
        setShowMultiAssignModal(false);
        resetMultiAssignForm();
        fetchAreas(); // Refresh layout
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to assign stalls');
      console.error(error);
    } finally {
      setAssigningStalls(false);
    }
  };

  const resetMultiAssignForm = () => {
    setSelectedVendor(null);
    setSelectedAreaType(null);
    setFilteredSections([]);
    setSelectedAssignSection(null);
    setVacantStalls([]);
    setSelectedStalls([]);
    setPaymentType('both');
    setCustomDailyRate(null);
    setCustomMonthlyRate(null);
  };

  const openMultiAssignModal = () => {
    setShowMultiAssignModal(true);
    fetchVendors();
  };

  // Stall selection for multi-assignment
  const handleStallSelection = (stallId) => {
    setSelectedStalls(prev => 
      prev.includes(stallId) 
        ? prev.filter(id => id !== stallId)
        : [...prev, stallId]
    );
  };

  // Calculate payment breakdown
  const calculatePaymentBreakdown = () => {
    if (selectedStalls.length === 0) return null;

    const selectedStallData = vacantStalls.filter(stall => selectedStalls.includes(stall.id));
    
    // Handle fixed rate sections (per_sqm) - monthly rate is daily_rate * 30
    const enhancedStallData = selectedStallData.map(stall => {
      const dailyRate = customDailyRate || parseFloat(stall.daily_rate || 0) || 0;
      let monthlyRate = customMonthlyRate || parseFloat(stall.monthly_rate || 0) || 0;
      
      // If section uses per_sqm and has size, monthly rate is daily_rate * 30
      if (stall.section?.rate_type === 'per_sqm' && stall.size) {
        monthlyRate = dailyRate * 30;
      }
      
      return {
        stallNumber: stall.stall_number,
        dailyRate: dailyRate,
        monthlyRate: monthlyRate,
        size: parseFloat(stall.size || 0) || 0
      };
    });

    return {
      totalDaily: enhancedStallData.reduce((sum, stall) => sum + stall.dailyRate, 0),
      totalMonthly: enhancedStallData.reduce((sum, stall) => sum + stall.monthlyRate, 0),
      stallCount: selectedStalls.length,
      paymentType: paymentType,
      stallDetails: enhancedStallData
    };
  };

  return (
    <div className={`section-manager ${showStallModal ? "modal-open" : ""}`}>
      <div className="section-header">
        <h2>Market Layout Manager</h2>
        <div className="section-header-actions">
          <Button
            onClick={handleRefresh}
            style={{
              marginRight: 8,
              borderRadius: 999,
              paddingInline: 18,
              fontWeight: "600",
            }}
          >
            Refresh
          </Button>
          <Button
            onClick={() => setEditMode(!editMode)}
            type={editMode ? "default" : "primary"}
            style={{
              backgroundColor: editMode ? "#f0f0f0" : "#043e54ff",
              borderColor: editMode ? "#d9d9d9" : "#0ea5e9",
              color: editMode ? "#000000" : "#fff",
              fontWeight: "600",
              borderRadius: 999,
              paddingInline: 18,
              boxShadow: editMode ? "0 2px 8px rgba(0,0,0,0.1)" : "0 4px 12px rgba(4, 62, 84, 0.3)",
            }}
          >
            {editMode ? "Exit Edit Mode" : "Edit Mode"}
          </Button>
          {editMode && (
            <Button
              onClick={() => setShowAddAreaForm(true)}
              type="primary"
              style={{
                backgroundColor: "#0ea5e9",
                borderColor: "#0ea5e9",
                color: "#fff",
                fontWeight: "600",
                borderRadius: 999,
                paddingInline: 18,
              }}
            >
              + Add Area
            </Button>
          )}
          <Button
            onClick={openMultiAssignModal}
            type="primary"
            icon={<UserOutlined />}
            style={{
              backgroundColor: "#52c41a",
              borderColor: "#52c41a",
              fontWeight: "600",
              borderRadius: 999,
              paddingInline: 18,
              boxShadow: "0 4px 12px rgba(82, 196, 26, 0.3)",
            }}
          >
            Assign Vendor
          </Button>
        </div>
      </div>

      {/* Global Loading Overlay with dynamic message */}
      {loading && <LoadingOverlay message={loadingMessage} />}

      {/* Add Area Modal */}
      <Modal
        title="Add New Area"
        open={showAddAreaForm}
        onCancel={() => setShowAddAreaForm(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowAddAreaForm(false)} style={{
            backgroundColor: "#b1260aff", // Sky Blue
            borderColor: "#87CEEB",
            color: "#fff",
            fontWeight: "bold",
          }}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={handleAddArea} style={{
            backgroundColor: "##043e54ff", // Sky Blue
            borderColor: "#87CEEB",
            color: "#fff",
            fontWeight: "bold",
          }}>
            Save
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Area Name" required>
            <Input value={newAreaName} onChange={(e) => setNewAreaName(e.target.value)} />
          </Form.Item>
          <Form.Item label="Columns" required>
            <Input
              type="number"
              value={areaColumns}
              onChange={(e) => handleColumnsChange(e.target.value)}
            />
          </Form.Item>
          {rowsPerColumn.map((row, idx) => (
            <Form.Item key={idx} label={`Rows for Column ${idx + 1}`} required>
              <Input
                type="number"
                value={row}
                onChange={(e) => handleRowChange(idx, e.target.value)}
              />
            </Form.Item>
          ))}
        </Form>
      </Modal>

      {/* Add Section Modal */}
      <Modal
        title="Add New Section"
        open={showAddSectionForm}
        onCancel={() => setShowAddSectionForm(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowAddSectionForm(false)} style={{
            backgroundColor: "#b1260aff", // Sky Blue
            borderColor: "#87CEEB",
            color: "#fff",
            fontWeight: "bold",
          }}
          >
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={handleAddSection}

            style={{
              backgroundColor: "##043e54ff", // Sky Blue
              borderColor: "#87CEEB",
              color: "#fff",
              fontWeight: "bold",
            }}>
            Save
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Section Name" required>
            <Input value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} />
          </Form.Item>
          <Form.Item label="Rate Type" required>
            <Select value={rateType} onChange={(val) => setRateType(val)}>
              <Option value="per_sqm">Per SQM</Option>
              <Option value="fixed">Fixed</Option>
            </Select>
          </Form.Item>
              {rateType === "per_sqm" && (
            <Form.Item label="Rate per sqm" required>
              <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
            </Form.Item>
          )}
          {rateType === "fixed" && (
            <Form.Item label="Monthly Rate" required>
              <Input type="number" value={monthlyRate} onChange={(e) => setMonthlyRate(e.target.value)} />
            </Form.Item>
          )}
          <Form.Item label="Rights Type" required>
            <Select value={rightsType} onChange={(val) => setRightsType(val)}>
              <Option value="space_right">Space Rights</Option>
              <Option value="stall_right">Stall Rights</Option>
            </Select>
          </Form.Item>
          {rightsType === "space_right" && (
            <Form.Item label="Space Right Amount" required>
              <Input type="number" value={spaceRight} onChange={(e) => setSpaceRight(e.target.value)} />
            </Form.Item>
          )}
          {rightsType === "stall_right" && (
            <Form.Item label="Stall Right Amount" required>
              <Input type="number" value={stallRight} onChange={(e) => setStallRight(e.target.value)} />
            </Form.Item>
          )}
      
        </Form>
      </Modal>

      {/* Edit Section Modal */}
      <Modal
        title={`Edit Section: ${editingSection?.name}`}
        open={showEditSectionForm}
        onCancel={() => setShowEditSectionForm(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowEditSectionForm(false)}

            style={{
              backgroundColor: "#b1260aff", // Sky Blue
              borderColor: "#87CEEB",
              color: "#fff",
              fontWeight: "bold",
            }}>
            Cancel
          </Button>,
          <Button key="update" type="primary" onClick={handleUpdateSection}
            style={{
              backgroundColor: "#043e54ff", // Sky Blue
              borderColor: "#87CEEB",
              color: "#fff",
              fontWeight: "bold",
            }}
          >
            Update
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Rate Type" required>
            <Select value={rateType} onChange={(val) => setRateType(val)}>
              <Option value="per_sqm">Per SQM</Option>
              <Option value="fixed">Fixed</Option>
            </Select>
          </Form.Item>
          {rateType === "per_sqm" && (
            <Form.Item label="Rate per sqm" required>
              <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
            </Form.Item>
          )}
          {rateType === "fixed" && (
            <Form.Item label="Monthly Rate" required>
              <Input type="number" value={monthlyRate} onChange={(e) => setMonthlyRate(e.target.value)} />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Add Stalls Modal */}
      <Modal
        title={`Add Stalls to ${selectedSection?.name}`}
        open={showStallModal}
        onCancel={() => setShowStallModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowStallModal(false)}

            style={{
              backgroundColor: "#b1260aff", // Sky Blue
              borderColor: "#87CEEB",
              color: "#fff",
              fontWeight: "bold",
            }}>
            Cancel
          </Button>,
          <Button key="add" type="primary" onClick={handleAddStall}

            style={{
              backgroundColor: "#043e54ff", // Sky Blue
              borderColor: "#87CEEB",
              color: "#fff",
              fontWeight: "bold",
            }}>
            Add
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Number of Rows" required>
            <Input type="number" value={rowCount} onChange={(e) => handleRowCountChange(e.target.value)} />
          </Form.Item>
          {columnsPerRow.map((col, idx) => (
            <Form.Item key={idx} label={`Columns for Row ${idx + 1}`} required>
              <Input type="number" value={col} onChange={(e) => handleColumnsPerRowChange(idx, e.target.value)} />
            </Form.Item>
          ))}
          <Form.Item label="Size (sqm)">
            <Input type="text" value={stallSize} onChange={(e) => setStallSize(e.target.value)} />
          </Form.Item>
          <Form.Item label="Daily Rate (optional)">
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Leave empty to use section default"
              value={stallDailyRate}
              onChange={(value) => setStallDailyRate(value)}
              min={0}
              precision={2}
            />
          </Form.Item>
          <Form.Item label="Monthly Rate (optional)">
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Leave empty to use section default"
              value={stallMonthlyRate}
              onChange={(value) => setStallMonthlyRate(value)}
              min={0}
              precision={2}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Areas Grid */}
      <div className={`areas ${editMode ? "edit-mode-active" : ""}`}>
        {areas.map((area) => (
          <div key={area.id} className="area">
            <div className="legend">
              <div className="legend-item"><span className="dot vacant-dot" /> Vacant</div>
              <div className="legend-item"><span className="dot occupied-dot" /> Occupied (not paid)</div>
              <div className="legend-item"><span className="dot missed-dot" /> Missed / Overdue</div>
              <div className="legend-item"><span className="dot paid-dot" /> Paid Today</div>
              <div className="legend-item"><span className="dot temporary-dot" /> Temporary Closed</div>
              <div className="legend-item"><span className="dot fully-paid-dot" /> Fully Paid</div>
              <div className="legend-item"><span className="dot partial-dot" /> Partial Payment</div>
              <div className="legend-item"><span className="dot advance-dot" /> Advance Payment</div>
              <div className="legend-item"><span className="dot inactive-dot" /> Inactive Stall</div>

              <div className="legend-item"><span className="dot empty-dot" /> Empty</div>
            </div>

            <div className="area-header"><h3>{area.name}</h3></div>

            <div className="area-grid">
              {area.rows_per_column.map((rowCount, colIdx) => (
                <div key={colIdx} className="area-column">
                  {Array.from({ length: rowCount }, (_, rowIdx) => {
                    const vacId = `vacant-${colIdx + 1}-${rowIdx + 1}`;
                    const vacIndex = area.vacancies.findIndex((v) => v.id === vacId);
                    const vac = area.vacancies[vacIndex];

                    return (
                      <div key={vac.id} className={`vacancy ${vac.section ? "has-section" : "empty"}`}>
                        {vac.section ? (
                          <div className="section-box">
                            <div className="section-header-with-actions">
                              <h4>{vac.section.name} Stalls</h4>
                              {editMode && (
                                <div className="section-actions-inline">
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingSection(vac.section);
                                      setRateType(vac.section.rate_type);
                                      setRate(vac.section.rate || "");
                                      setMonthlyRate(vac.section.monthly_rate || "");
                                      setShowEditSectionForm(true);
                                    }}
                                    size="small"
                                    style={{
                                      backgroundColor: "#043e54ff",
                                      borderColor: "#87CEEB",
                                      color: "#fff",
                                      fontWeight: "bold",
                                      marginRight: 4
                                    }}
                                  >
                                    <EditOutlined /> Edit Section
                                  </Button>
                                  <Button
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSection(vac.section);
                                      setShowStallModal(true);
                                    }}
                                    style={{
                                      backgroundColor: "#043e54ff",
                                      borderColor: "#87CEEB",
                                      color: "#fff",
                                      fontWeight: "bold",
                                      marginRight: 4,
                                    }}
                                  >
                                    <PlusOutlined /> Add Stall
                                  </Button>
                                </div>
                              )}
                            </div>
                            <StallGrid section={vac.section} editMode={editMode} onAddStall={handleAddSingleStall} onRefresh={handleRefresh} />
                          </div>
                        ) : (
                          editMode && (
                            <Button
                              type="dashed"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedArea(area);
                                setSelectedVacancy(vacIndex);
                                setShowAddSectionForm(true);
                              }}
                              style={{
                                backgroundColor: "#043e54ff", // Sky Blue
                                borderColor: "#87CEEB",
                                color: "#fff",
                                fontWeight: "bold",
                                marginRight: 4
                              }}
                            >
                              <PlusOutlined /> Add Section
                            </Button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Multi-Stall Assignment Modal */}
      <Modal
        title="Assign Vendor to Multiple Stalls"
        open={showMultiAssignModal}
        onCancel={() => {
          setShowMultiAssignModal(false);
          resetMultiAssignForm();
        }}
        width={1000}
        footer={[
          <Button key="cancel" onClick={() => {
            setShowMultiAssignModal(false);
            resetMultiAssignForm();
          }}>
            Cancel
          </Button>,
          <Button 
            key="assign" 
            type="primary" 
            onClick={handleMultiAssignStalls}
            loading={assigningStalls}
            disabled={!selectedVendor || selectedStalls.length === 0}
            style={{
              backgroundColor: "#ffffff",
              color: "#000",
              borderColor: "#000000",
            }}
          >
            Assign {selectedStalls.length} Stall{selectedStalls.length !== 1 ? 's' : ''}
          </Button>
        ]}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Form layout="vertical">
              <Form.Item label="Select Vendor" required>
                <Select
                  placeholder="Choose a vendor"
                  value={selectedVendor}
                  onChange={setSelectedVendor}
                  loading={loadingVendors}
                  showSearch
                  filterOption={(input, option) => {
                    const vendor = vendors.find(v => v.id === option.value);
                    if (!vendor) return false;
                    
                    const searchLower = input.toLowerCase();
                    const firstName = (vendor.first_name || '').toLowerCase();
                    const lastName = (vendor.last_name || '').toLowerCase();
                    const fullName = `${vendor.first_name || ''} ${vendor.last_name || ''}`.toLowerCase();
                    const businessName = (vendor.business_name || '').toLowerCase();
                    const contactNumber = (vendor.contact_number || '').toLowerCase();
                    
                    return firstName.includes(searchLower) || 
                           lastName.includes(searchLower) || 
                           fullName.includes(searchLower) || 
                           businessName.includes(searchLower) ||
                           contactNumber.includes(searchLower);
                  }}
                >
                  {vendors.map(vendor => (
                    <Option key={vendor.id} value={vendor.id}>
                      {vendor.first_name} {vendor.last_name} - {vendor.business_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="Select Area Type" required>
                <Select
                  placeholder="Choose area type"
                  value={selectedAreaType}
                  onChange={(areaType) => {
                    setSelectedAreaType(areaType);
                    fetchSectionsByAreaType(areaType);
                  }}
                >
                  <Option value="market">Market</Option>
                  <Option value="open_space">Open Space</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Select Section" required>
                <Select
                  placeholder="Choose a section"
                  value={selectedAssignSection}
                  onChange={(sectionId) => {
                    setSelectedAssignSection(sectionId);
                    fetchVacantStalls(sectionId);
                  }}
                  disabled={!selectedAreaType || filteredSections.length === 0}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {filteredSections.map(section => (
                    <Option key={section.id} value={section.id}>
                      {section.name} ({section.area_name})
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="Payment Type" required>
                <Select
                  value={paymentType}
                  onChange={setPaymentType}
                >
                  <Option value="daily">Daily</Option>
                  <Option value="monthly">Monthly</Option>
                 
                </Select>
              </Form.Item>
            </Form>
          </Col>

          <Col span={12}>
            <Card title="Vacant Stalls" size="small" style={{ height: 400, overflow: 'auto' }}>
              {loadingVacantStalls ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Spin />
                </div>
              ) : vacantStalls.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                  {selectedAssignSection ? 'No vacant stalls available in this section' : 
                   !selectedAreaType ? 'Please select an area type first' :
                   filteredSections.length === 0 ? 'No sections available for this area type' :
                   'Please select a section'}
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Checkbox
                      checked={selectedStalls.length > 0 && selectedStalls.every(stallId => 
                        vacantStalls.some(vacantStall => vacantStall.id === stallId)
                      )}
                      indeterminate={selectedStalls.length > 0 && 
                        selectedStalls.length < vacantStalls.length &&
                        selectedStalls.some(stallId => 
                          vacantStalls.some(vacantStall => vacantStall.id === stallId)
                        )
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStalls(vacantStalls.map(stall => stall.id));
                        } else {
                          setSelectedStalls([]);
                        }
                      }}
                    >
                      Select All ({vacantStalls.length})
                    </Checkbox>
                  </div>
                  {vacantStalls.map(stall => (
                    <div key={stall.id} style={{ marginBottom: 8 }}>
                      <Checkbox
                        checked={selectedStalls.includes(stall.id)}
                        onChange={() => handleStallSelection(stall.id)}
                      >
                        <span style={{ fontWeight: 500 }}>Stall {stall.stall_number}</span>
                        <span style={{ marginLeft: 8, color: '#666', fontSize: 12 }}>
                          Daily: ₱{stall.daily_rate || 0} | Monthly: ₱{stall.monthly_rate || 0}
                        </span>
                      </Checkbox>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {selectedStalls.length > 0 && (
              <Card 
                title="Payment Summary" 
                size="small" 
                style={{ marginTop: 16 }}
                extra={<DollarOutlined style={{ color: '#52c41a' }} />}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 18,
                      fontWeight: 'bold'
                    }}>
                      {selectedStalls.length}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Stalls Selected</div>
                      <div style={{ fontSize: 10, color: '#999' }}>For Assignment</div>
                    </div>
                  </div>
                  {paymentType === 'daily' && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a', marginBottom: 8 }}>
                        ₱{calculatePaymentBreakdown()?.totalDaily?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || 0}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>Daily Rate</div>
                    </div>
                  )}
                  {paymentType === 'monthly' && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981', marginBottom: 8 }}>
                        ₱{calculatePaymentBreakdown()?.totalMonthly?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || 0}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>Monthly Rate</div>
                    </div>
                  )}
                  {paymentType === 'both' && (
                    <>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a', marginBottom: 8 }}>
                          ₱{calculatePaymentBreakdown()?.totalDaily?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || 0}
                        </div>
                        <div style={{ fontSize: 12, color: '#666' }}>Daily Rate</div>
                      </div>
                      <div style={{ textAlign: 'right', marginTop: 8 }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981', marginBottom: 8 }}>
                          ₱{calculatePaymentBreakdown()?.totalMonthly?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || 0}
                        </div>
                        <div style={{ fontSize: 12, color: '#666' }}>Monthly Rate</div>
                      </div>
                    </>
                  )}
                </div>
                
                <div style={{ 
                  height: 1, 
                  background: '#f0f0f0', 
                  margin: '16px 0' 
                }} />
                
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <div style={{ 
                    display: 'inline-block', 
                    padding: '8px 16px', 
                    background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                    color: 'white', 
                    borderRadius: 8,
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)'
                  }}>
                    Assign {selectedStalls.length} Stall{selectedStalls.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </Card>
            )}
          </Col>
        </Row>
      </Modal>
    </div>
  );
};

export default SectionManager;
