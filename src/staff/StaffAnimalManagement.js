import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Empty,
  Spin,
  Switch,
  Tag,
  Typography,
  Popconfirm,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Beef } from "lucide-react";
import api from "../Api";
import "./StaffAnimalManagement.css";

const { Text, Title } = Typography;

const feeFields = [
  { name: "slaughter_fee_per_kilo", label: "Slaughter fee", unit: "per kilo", precision: 2 },
  { name: "ante_mortem_fee_per_head", label: "Ante-mortem", unit: "per head", precision: 2 },
  { name: "post_mortem_fee_per_kilo", label: "Post-mortem", unit: "per kilo", precision: 2 },
  { name: "coral_fee_per_head", label: "Coral fee", unit: "per head", precision: 2 },
  { name: "permit_to_slh_fee_per_head", label: "Permit fee", unit: "per head", precision: 2 },
  { name: "minimum_weight_kg", label: "Minimum weight", unit: "kg", precision: 3 },
  { name: "minimum_weight_fee", label: "Minimum weight fee", unit: "per head", precision: 2 },
  { name: "hides_fee_per_head", label: "Hides fee", unit: "per head", precision: 2 },
];

const formatAmount = (value, precision = 2) => (
  Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })
);

const StaffAnimalManagement = () => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [deletingAnimalId, setDeletingAnimalId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  const fetchAnimals = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await api.get("/staff/animals");
      if (!Array.isArray(response.data)) {
        throw new Error("Unexpected animal data returned by the server.");
      }
      setAnimals(response.data);
    } catch (error) {
      message.error(
        error.response?.data?.message ||
        error.message ||
        "Unable to load the animal catalog."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        name: values.name.trim(),
      };
      const response = editingAnimal
        ? await api.put(`/staff/animals/${editingAnimal.id}`, payload)
        : await api.post("/staff/animals", payload);
      message.success(
        response.data?.message ||
        (editingAnimal ? "Animal updated successfully." : "Animal added successfully.")
      );
      setModalOpen(false);
      setEditingAnimal(null);
      form.resetFields();
      await fetchAnimals(false);
    } catch (error) {
      const firstValidationError = Object.values(error.response?.data?.errors || {})
        .flat()
        .find(Boolean);
      message.error(
        firstValidationError ||
        error.response?.data?.message ||
        (editingAnimal ? "Unable to update this animal." : "Unable to add this animal.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (animal) => {
    setDeletingAnimalId(animal.id);
    try {
      const response = await api.delete(`/staff/animals/${animal.id}`);
      message.success(response.data?.message || `${animal.name} was removed from the catalog.`);
      setAnimals((current) => current.filter((item) => item.id !== animal.id));
    } catch (error) {
      message.error(
        error.response?.data?.message ||
        `Unable to remove ${animal.name} from the catalog.`
      );
    } finally {
      setDeletingAnimalId(null);
    }
  };

  const filteredAnimals = animals.filter((animal) =>
    String(animal.name || "").toLowerCase().includes(searchText.trim().toLowerCase())
  );

  const openCreateModal = () => {
    setEditingAnimal(null);
    form.resetFields();
    form.setFieldsValue({
      ...Object.fromEntries(feeFields.map(({ name }) => [name, 0])),
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (animal) => {
    setEditingAnimal(animal);
    form.setFieldsValue({
      name: animal.name,
      ...Object.fromEntries(
        feeFields.map(({name}) => [name, Number(animal[name] || 0)])
      ),
      is_active: Boolean(animal.is_active),
    });
    setModalOpen(true);
  };

  return (
    <main className="staff-animal-page">
      <header className="staff-animal-header">
        <div className="staff-animal-header-content">
          <span className="staff-animal-header-icon">
            <Beef size={25} strokeWidth={1.7} />
          </span>
          <div className="staff-animal-header-copy">
            <Text className="staff-animal-eyebrow">SLAUGHTERHOUSE OPERATIONS</Text>
            <Title level={2}>Animal Catalog</Title>
            <Text type="secondary">
              Manage animal types, fee schedules, and catalog availability.
            </Text>
          </div>
        </div>
        <div className="staff-animal-header-actions">
          <Tag className="staff-animal-count-tag">
            {animals.length} {animals.length === 1 ? "animal type" : "animal types"}
          </Tag>
          <Button
            icon={<ReloadOutlined />}
            loading={refreshing}
            onClick={() => fetchAnimals(false)}
          >
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Add animal
          </Button>
        </div>
      </header>

      <Alert
        className="staff-animal-note"
        type="info"
        showIcon
        message="New animals are added to the catalog as active. Their standard fees can be applied when recording slaughterhouse collections."
      />

      <Card className="staff-animal-card" bordered={false}>
        <div className="staff-animal-list-heading">
          <div>
            <Title level={4}>Animal types</Title>
            <Text type="secondary">
              {animals.length} {animals.length === 1 ? "animal type" : "animal types"}
            </Text>
          </div>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search animal types"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="staff-animal-search"
          />
        </div>
        {loading ? (
          <div className="staff-animal-loading"><Spin /></div>
        ) : filteredAnimals.length ? (
          <Row gutter={[16, 16]}>
            {filteredAnimals.map((animal) => (
              <Col xs={24} md={12} xl={8} key={animal.id}>
                <Card className="staff-animal-item-card" bordered>
                  <div className="staff-animal-item-header">
                    <span className="staff-animal-avatar">
                      <Beef size={19} strokeWidth={1.8} />
                    </span>
                    <div className="staff-animal-item-title">
                      <Text strong>{animal.name}</Text>
                      <Text type="secondary">Standard fee schedule</Text>
                    </div>
                    <Tag color={animal.is_active ? "green" : "default"}>
                      {animal.is_active ? "Active" : "Inactive"}
                    </Tag>
                  </div>
                  <Text className="staff-animal-fee-caption">
                    Fee rates and processing thresholds
                  </Text>
                  <div className="staff-animal-fee-grid">
                    {feeFields.map((field) => (
                      <div className="staff-animal-fee" key={field.name}>
                        <Text type="secondary">{field.label}</Text>
                        <strong>
                          {field.name === "minimum_weight_kg" ? "" : "₱"}
                          {formatAmount(animal[field.name], field.precision)}
                          <span>{field.unit}</span>
                        </strong>
                      </div>
                    ))}
                  </div>
                  <div className="staff-animal-card-actions">
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => openEditModal(animal)}
                    >
                      Edit
                    </Button>
                    <Popconfirm
                      title={`Remove ${animal.name}?`}
                      description="This animal type will be removed from the active catalog."
                      okText="Remove"
                      cancelText="Cancel"
                      okButtonProps={{danger: true, loading: deletingAnimalId === animal.id}}
                      onConfirm={() => handleDelete(animal)}
                    >
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        loading={deletingAnimalId === animal.id}
                      >
                        Delete
                      </Button>
                    </Popconfirm>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={searchText ? "No animal types match your search." : "No animal types have been added yet."}
          />
        )}
      </Card>

      <Modal
        className="staff-animal-modal"
        title={
          <div className="staff-animal-modal-title">
            <span className="staff-animal-modal-icon">
              <Beef size={22} strokeWidth={1.8} />
            </span>
            <div>
              <Text className="staff-animal-modal-eyebrow">
                {editingAnimal ? "CATALOG UPDATE" : "NEW CATALOG ENTRY"}
              </Text>
              <Title level={4}>{editingAnimal ? "Edit animal type" : "Add animal type"}</Title>
              <Text type="secondary">
                {editingAnimal
                  ? `Update the details and fee schedule for ${editingAnimal.name}.`
                  : "Set up an animal type and its standard fee schedule."}
              </Text>
            </div>
          </div>
        }
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingAnimal(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingAnimal ? "Save changes" : "Add animal"}
        confirmLoading={saving}
        destroyOnClose
        width={760}
        centered
        maskClosable={!saving}
        keyboard={!saving}
        closable={!saving}
      >
        <Form
          form={form}
          layout="vertical"
          className="staff-animal-form"
          onFinish={handleSave}
          initialValues={{
            ...Object.fromEntries(feeFields.map(({ name }) => [name, 0])),
            is_active: true,
          }}
        >
          <section className="staff-animal-form-section">
            <div className="staff-animal-form-section-heading">
              <Title level={5}>Animal details</Title>
              <Text type="secondary">Identify the animal type and set its availability.</Text>
            </div>
            <Row gutter={18} align="middle">
              <Col xs={24} sm={16}>
                <Form.Item
                  name="name"
                  label="Animal type"
                  rules={[
                    { required: true, whitespace: true, message: "Enter an animal type." },
                    { max: 255, message: "Animal type must be 255 characters or fewer." },
                  ]}
                >
                  <Input autoComplete="off" placeholder="e.g. Cattle" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <div className="staff-animal-status-control">
                  <div>
                    <Text strong>Catalog status</Text>
                    <Text type="secondary">Available for collections</Text>
                  </div>
                  <Form.Item name="is_active" valuePropName="checked" noStyle>
                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                  </Form.Item>
                </div>
              </Col>
            </Row>
          </section>

          <section className="staff-animal-form-section staff-animal-fees-section">
            <div className="staff-animal-form-section-heading">
              <Title level={5}>Standard fee schedule</Title>
              <Text type="secondary">
                Enter the applicable rates. Use zero for fees that do not apply.
              </Text>
            </div>
            <Row gutter={[18, 2]}>
              {feeFields.map((field) => (
                <Col xs={24} sm={12} key={field.name}>
                  <Form.Item
                    name={field.name}
                    label={field.label}
                    rules={[{ type: "number", min: 0, message: "Enter zero or a positive amount." }]}
                  >
                    <InputNumber
                      min={0}
                      precision={field.precision}
                      className="staff-animal-number"
                      prefix={field.name === "minimum_weight_kg" ? null : "₱"}
                      suffix={field.name === "minimum_weight_kg" ? "kg" : null}
                      placeholder={field.name === "minimum_weight_kg" ? "0.000" : "0.00"}
                    />
                  </Form.Item>
                </Col>
              ))}
            </Row>
          </section>
        </Form>
      </Modal>
    </main>
  );
};

export default StaffAnimalManagement;
