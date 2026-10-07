
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import api from "../Api";
import "./SlaughterCollectionManagement.css";

const { Title, Text } = Typography;

// Get today's date in local time as YYYY-MM-DD.
const getLocalDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const blankAnimal = () => ({
  quantity: 1,
  animal_type: "",
  total_kilos: 0,
  price_kilos: 0,
  ante_mortem: 0,
  post_mortem: 0,
  hides: 0,
  slaughter_fee: 0,
  coral_fee: 0,
});

const blankCollection = () => ({
  collection_date: getLocalDateString(),
  or_number: "",
  customer_name: "",
  items: [blankAnimal()],
});

const numberValue = (value) => Number(value || 0);

const animalTotal = (animal) =>
  Number(
    (
      numberValue(animal.price_kilos) +
      numberValue(animal.ante_mortem) +
      numberValue(animal.post_mortem) +
      numberValue(animal.hides) +
      numberValue(animal.slaughter_fee) +
      numberValue(animal.coral_fee)
    ).toFixed(2)
  );

const money = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(numberValue(value));

// Format date-only values without timezone shifts.
// Also supports Laravel timestamps.
const formatDate = (value) => {
  if (!value) return "-";

  const dateString = String(value).trim();
  if (!dateString) return "-";

  const dateOnlyMatch = dateString.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;

    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    // Reject invalid calendar dates.
    if (
      parsed.getFullYear() !== Number(year) ||
      parsed.getMonth() !== Number(month) - 1 ||
      parsed.getDate() !== Number(day)
    ) {
      return "-";
    }

    return parsed.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Convert API date values to the exact format required by an HTML date input.
const toDateInputValue = (value) => {
  if (!value) return "";

  const dateString = String(value).trim();
  const dateOnlyMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));

    if (
      parsed.getFullYear() === Number(year) &&
      parsed.getMonth() === Number(month) - 1 &&
      parsed.getDate() === Number(day)
    ) {
      return `${year}-${month}-${day}`;
    }
  }

  // Timestamp values are converted to the user's local calendar date.
  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) return "";

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getCollectionData = (response) => {
  const payload = response?.data?.data ?? response?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;

  return payload || [];
};

function AnimalCard({
  animal,
  index,
  canRemove,
  onChange,
  onRemove,
}) {
  const fields = [
    ["quantity", "Quantity", "number", 1],
    ["animal_type", "Animal Type", "text"],
    ["total_kilos", "Total Kilos", "number", 0],
    ["price_kilos", "Kilo Amount", "number", 0],
    ["ante_mortem", "Ante-Mortem", "number", 0],
    ["post_mortem", "Post-Mortem", "number", 0],
    ["hides", "Hides", "number", 0],
    ["slaughter_fee", "Slaughter Fee", "number", 0],
    ["coral_fee", "Coral Fee", "number", 0],
  ];

  return (
    <Card
      className="slaughter-collection-animal-card"
      title={<span>Animal entry {index + 1}</span>}
      extra={
        canRemove ? (
          <Button
            danger
            type="text"
            icon={<DeleteOutlined />}
            onClick={onRemove}
          >
            Remove
          </Button>
        ) : null
      }
    >
      <Row gutter={[14, 4]}>
        {fields.map(([field, label, type, min]) => (
          <Col xs={24} sm={12} lg={8} key={field}>
            <Form.Item
              label={label}
              required={field === "animal_type" || field === "quantity"}
            >
              {type === "number" ? (
                <InputNumber
                  className="slaughter-collection-number-input"
                  min={min}
                  precision={field === "quantity" ? 0 : 2}
                  value={numberValue(animal[field])}
                  onChange={(value) => onChange(field, value ?? 0)}
                />
              ) : (
                <Input
                  value={animal[field]}
                  placeholder="Enter animal type"
                  onChange={(event) =>
                    onChange(field, event.target.value)
                  }
                />
              )}
            </Form.Item>
          </Col>
        ))}
      </Row>

      <div className="slaughter-collection-animal-total">
        <Text>Calculated total</Text>
        <strong>{money(animalTotal(animal))}</strong>
      </div>
    </Card>
  );
}

export default function SlaughterCollectionManagement() {
  const [collections, setCollections] = useState([]);
  const [summary, setSummary] = useState({
    total_collections: 0,
    animal_entries: 0,
    grand_total: 0,
  });
  const [totalCollections, setTotalCollections] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [formData, setFormData] = useState(blankCollection());
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [details, setDetails] = useState(null);

  const loadCollections = async (
    requestedPage = page,
    requestedPageSize = pageSize,
    requestedSearch = search
  ) => {
    setLoading(true);

    try {
      const params = {};

      if (requestedSearch.trim()) params.search = requestedSearch.trim();
      if (date) params.date = date;
      params.page = requestedPage;
      params.per_page = requestedPageSize;

      const response = await api.get(
        "/slaughterhouse/collections",
        { params }
      );

      const rows = getCollectionData(response);
      setCollections(Array.isArray(rows) ? rows : []);
      setSummary(response.data?.summary || {
        total_collections: 0,
        animal_entries: 0,
        grand_total: 0,
      });
      setTotalCollections(response.data?.pagination?.total || 0);
      setPage(response.data?.pagination?.current_page || requestedPage);
      setPageSize(response.data?.pagination?.per_page || requestedPageSize);
    } catch (error) {
      message.error(
        error.response?.data?.message ||
          "Unable to load slaughter collections."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, [date]);

  const openCreate = () => {
    setEditingId(null);
    setFormData(blankCollection());
    setFormOpen(true);
  };

  const openDetails = async (id) => {
    setDetailsLoading(true);
    setDetails(null);

    try {
      const response = await api.get(`/slaughterhouse/collections/${id}`);
      setDetails(getCollectionData(response));
    } catch (error) {
      message.error(
        error.response?.data?.message ||
          "Unable to load collection details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const openEdit = async (id) => {
    setLoading(true);

    try {
      const response = await api.get(
        `/slaughterhouse/collections/${id}`
      );

      const collection = getCollectionData(response);

      setEditingId(collection.id);
      setFormData({
        collection_date: toDateInputValue(collection.collection_date),
        or_number: collection.or_number || "",
        customer_name: collection.customer_name || "",
        items: (collection.items || []).map((item) => ({
          ...item,
        })),
      });

      setFormOpen(true);
    } catch (error) {
      message.error(
        error.response?.data?.message ||
          "Unable to open collection."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      ),
    }));
  };

  const saveCollection = async () => {
    // Prevent future dates, including manually entered dates.
    if (formData.collection_date > getLocalDateString()) {
      message.error("Future dates are not allowed.");
      return;
    }

    if (
      !formData.collection_date ||
      !formData.or_number.trim() ||
      !formData.customer_name.trim()
    ) {
      message.error(
        "Date, OR Number, and Customer Name are required."
      );
      return;
    }

    if (
      !formData.items.length ||
      formData.items.some(
        (item) => !String(item.animal_type || "").trim()
      )
    ) {
      message.error(
        "Add at least one animal and provide an animal type for every entry."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        collection_date: formData.collection_date,
        or_number: formData.or_number.trim(),
        customer_name: formData.customer_name.trim(),
        items: formData.items.map((item) => ({
          ...(item.id ? { id: item.id } : {}),
          quantity: numberValue(item.quantity),
          animal_type: String(item.animal_type || "").trim(),
          total_kilos: numberValue(item.total_kilos),
          price_kilos: numberValue(item.price_kilos),
          ante_mortem: numberValue(item.ante_mortem),
          post_mortem: numberValue(item.post_mortem),
          hides: numberValue(item.hides),
          slaughter_fee: numberValue(item.slaughter_fee),
          coral_fee: numberValue(item.coral_fee),
        })),
      };

      if (editingId) {
        await api.put(
          `/slaughterhouse/collections/${editingId}`,
          payload
        );
        message.success("Slaughter collection updated.");
      } else {
        await api.post(
          "/slaughterhouse/collections",
          payload
        );
        message.success("Slaughter collection saved.");
      }

      setFormOpen(false);
      await loadCollections();
    } catch (error) {
      const validationErrors = error.response?.data?.errors;
      const firstError =
        validationErrors && Object.values(validationErrors)[0]?.[0];

      message.error(
        firstError ||
          error.response?.data?.message ||
          "Unable to save collection."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteCollection = (id) => {
    Modal.confirm({
      title: "Delete this collection?",
      content:
        "The transaction and its animal entries will be deleted.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await api.delete(
            `/slaughterhouse/collections/${id}`
          );
          message.success("Collection deleted.");
          await loadCollections();
        } catch (error) {
          message.error(
            error.response?.data?.message ||
              "Unable to delete collection."
          );
        }
      },
    });
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "collection_date",
      render: formatDate,
    },
    {
      title: "OR Number",
      dataIndex: "or_number",
    },
    {
      title: "Customer Name",
      dataIndex: "customer_name",
    },
    {
      title: "Animals",
      dataIndex: "items_count",
    },
    {
      title: "Quantity",
      dataIndex: "animal_count",
    },
    {
      title: "Total Kilos",
      dataIndex: "total_kilos",
      render: (value) => numberValue(value).toFixed(2),
    },
    {
      title: "Total Collection",
      dataIndex: "grand_total",
      render: (value, record) =>
        money(
          value ??
            (record.items || []).reduce(
              (sum, item) => sum + animalTotal(item),
              0
            )
        ),
    },
    {
      title: "Action",
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => openDetails(record.id)}
          >
            View
          </Button>

          <Button onClick={() => openEdit(record.id)}>
            Edit
          </Button>

          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteCollection(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="slaughter-collection-management">
      <div className="slaughter-collection-page-heading">
        <div className="slaughter-collection-title-group">
          <div className="slaughter-collection-title-icon">
            <ShopOutlined />
          </div>
          <div className="slaughter-collection-heading-copy">
            <Text className="slaughter-collection-kicker">SLAUGHTERHOUSE OPERATIONS</Text>
            <Title level={2}>Slaughter Collection</Title>
            <Text className="slaughter-collection-heading-description">
              Record, review, and manage daily slaughter transactions
            </Text>
          </div>
        </div>

        <Button
          type="primary"
          className="slaughter-collection-add-button"
          icon={<PlusOutlined />}
          onClick={openCreate}
        >
          Add Collection
        </Button>
      </div>

      <Row gutter={[16, 16]} className="slaughter-collection-summary-row">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Transactions"
              value={summary.total_collections}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Animal Entries"
              value={summary.animal_entries}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Collections"
              value={summary.grand_total}
              precision={2}
              prefix="₱"
            />
          </Card>
        </Col>
      </Row>

      <Card
        className="slaughter-collection-list-card"
        title={
          <div className="slaughter-collection-register-heading">
            <span>Collection Register</span>
            <Text type="secondary">Search, filter, and review recorded transactions</Text>
          </div>
        }
        extra={<Text className="slaughter-collection-register-count">{totalCollections} records</Text>}
      >
        <div className="slaughter-collection-toolbar">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search OR number or customer name"
            aria-label="Search collections by OR number or customer name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onPressEnter={() => {
              setPage(1);
              loadCollections(1, pageSize, search);
            }}
          />

          <Input
            type="date"
            max={getLocalDateString()}
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setPage(1);
            }}
          />

          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => {
              setPage(1);
              loadCollections(1, pageSize, search);
            }}
          >
            Search
          </Button>

          <Button
            icon={<ReloadOutlined />}
            onClick={() => loadCollections(page, pageSize, search)}
          >
            Refresh
          </Button>
          <Text className="slaughter-collection-result-count">
            {totalCollections} result{totalCollections === 1 ? "" : "s"}
          </Text>
        </div>

        <Alert
          className="slaughter-collection-table-note"
          type="info"
          showIcon
          message="Each animal is stored under the same OR Number. Price / Kilo is a charge and is not multiplied by Total Kilos."
        />

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={Array.isArray(collections) ? collections : []}
          pagination={{
            current: page,
            pageSize,
            total: totalCollections,
            showSizeChanger: true,
            pageSizeOptions: [10, 25, 50, 100],
            showTotal: (total, range) =>
              `Showing ${range[0]}–${range[1]} of ${total} collections`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
              loadCollections(nextPage, nextPageSize, search);
            },
          }}
          scroll={{ x: 1050 }}
          locale={{
            emptyText: (
              <Empty description="No slaughter collections found" />
            ),
          }}
        />
      </Card>

      <Modal
        open={formOpen}
        title={
          editingId
            ? "Edit Slaughter Collection"
            : "Add Slaughter Collection"
        }
        onCancel={() => setFormOpen(false)}
        width={980}
        className="slaughter-collection-form-modal"
        footer={[
          <Button
            key="cancel"
            onClick={() => setFormOpen(false)}
          >
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={saving}
            icon={<SaveOutlined />}
            onClick={saveCollection}
          >
            Save Collection
          </Button>,
        ]}
      >
        <div className="slaughter-collection-form-scroll">
          <Card
            className="slaughter-collection-info-card"
            title="Collection information"
          >
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item label="Date" required>
                  <Input
                    type="date"
                    max={getLocalDateString()}
                    value={formData.collection_date}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        collection_date: event.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item label="OR Number" required>
                  <Input
                    value={formData.or_number}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        or_number: event.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item label="Customer Name" required>
                  <Input
                    value={formData.customer_name}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        customer_name: event.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <div className="slaughter-collection-animals-heading">
            <div>
              <Title level={4}>Animal entries</Title>
              <Text type="secondary">
                Price / Kilo is recorded as its own charge and is not
                multiplied by Total Kilos.
              </Text>
            </div>

            <Button
              icon={<PlusOutlined />}
              onClick={() =>
                setFormData({
                  ...formData,
                  items: [...formData.items, blankAnimal()],
                })
              }
            >
              Add Animal
            </Button>
          </div>

          {formData.items.map((animal, index) => (
            <AnimalCard
              key={animal.id || index}
              animal={animal}
              index={index}
              canRemove={formData.items.length > 1}
              onChange={(field, value) =>
                updateItem(index, field, value)
              }
              onRemove={() =>
                setFormData({
                  ...formData,
                  items: formData.items.filter(
                    (_, itemIndex) => itemIndex !== index
                  ),
                })
              }
            />
          ))}

          <div className="slaughter-collection-grand-total">
            <Text>Grand Total Amount</Text>
            <strong>
              {money(
                formData.items.reduce(
                  (sum, item) => sum + animalTotal(item),
                  0
                )
              )}
            </strong>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(details) || detailsLoading}
        title="Slaughter Collection Details"
        loading={detailsLoading}
        onCancel={() => setDetails(null)}
        footer={
          <Button onClick={() => setDetails(null)}>
            Close
          </Button>
        }
        width={980}
        className="slaughter-collection-details-modal"
      >
        {details && (
          <div className="slaughter-collection-details">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Text type="secondary">Date</Text>
                <div>{formatDate(details.collection_date)}</div>
              </Col>

              <Col xs={24} md={8}>
                <Text type="secondary">OR Number</Text>
                <div>{details.or_number}</div>
              </Col>

              <Col xs={24} md={8}>
                <Text type="secondary">Customer Name</Text>
                <div>{details.customer_name}</div>
              </Col>
            </Row>

            {(details.items || []).map((item, index) => (
              <Card
                key={item.id || index}
                size="small"
                title={`Animal entry ${index + 1}`}
                className="slaughter-collection-detail-card"
              >
                <Tag color="blue">{item.animal_type}</Tag>

                <div className="slaughter-collection-detail-grid">
                  {[
                    ["Quantity", item.quantity],
                    ["Total Kilos", item.total_kilos],
                    ["Price / Kilo", money(item.price_kilos)],
                    ["Ante-Mortem", money(item.ante_mortem)],
                    ["Post-Mortem", money(item.post_mortem)],
                    ["Hides", money(item.hides)],
                    ["Slaughter Fee", money(item.slaughter_fee)],
                    ["Coral Fee", money(item.coral_fee)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <Text type="secondary">{label}</Text>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>

                <div className="slaughter-collection-detail-total">
                  Total Amount:{" "}
                  {money(item.total_amount ?? animalTotal(item))}
                </div>
              </Card>
            ))}

            <div className="slaughter-collection-grand-total">
              Total Collection Amount
              <strong>
                {money(
                  details.grand_total ??
                    (details.items || []).reduce(
                      (sum, item) => sum + animalTotal(item),
                      0
                    )
                )}
              </strong>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}