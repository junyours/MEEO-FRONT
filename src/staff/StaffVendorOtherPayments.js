import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  Empty,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import api from "../Api";
import "./StaffVendorOtherPayments.css";

const { Text, Title } = Typography;

const paymentTypes = [
  { value: "certification", label: "Certification" },
  { value: "stall_rights", label: "Stall rights" },
  { value: "space_right", label: "Space rights" },
  { value: "dst", label: "Documentary stamp tax" },
  { value: "special_permit", label: "Special Permit" },
  { value: "rental_fee", label: "Rental Fee" },
  { value: "electricity", label: "Electricity" },
];

const rightsPaymentTypes = ["stall_rights", "space_right"];
const annualPaymentTypes = ["certification", "stall_rights", "space_right", "dst"];
const walkInPaymentTypes = ["special_permit", "rental_fee", "electricity"];
const certificatePaymentTypes = ["certification"];
const initialManualAmounts = {
  certification: null,
  dst: null,
  special_permit: null,
  rental_fee: null,
  electricity: null,
};

const activeRentalStatuses = new Set([
  "active",
  "occupied",
  "advance",
  "temp_closed",
  "partial",
  "fully paid",
]);

const formatCurrency = (amount) => new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
}).format(Number(amount) || 0);

const normalize = (value) => String(value ?? "").trim().toLocaleLowerCase();

const formatRentalStatus = (status) => {
  const labels = {
    active: "Active",
    occupied: "Occupied",
    advance: "Advance paid",
    temp_closed: "Temporarily closed",
    partial: "Partially paid",
    "fully paid": "Fully paid",
  };

  return labels[normalize(status)] || String(status || "Unknown").replaceAll("_", " ");
};

const getVendorName = (vendor) => vendor?.name
  || [vendor?.first_name, vendor?.middle_name, vendor?.last_name].filter(Boolean).join(" ")
  || `Vendor ${vendor?.id ?? ""}`;

const StaffVendorOtherPayments = () => {
  const [vendors, setVendors] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [paidTypes, setPaidTypes] = useState([]);
  const [availablePaymentTypes, setAvailablePaymentTypes] = useState([]);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityError, setEligibilityError] = useState("");
  const [paymentMode, setPaymentMode] = useState("vendor");
  const [selectedVendorId, setSelectedVendorId] = useState();
  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState([]);
  const [selectedRentalIdsByType, setSelectedRentalIdsByType] = useState({
    stall_rights: [],
    space_right: [],
  });
  const [unitAmounts, setUnitAmounts] = useState({});
  const [orNumber, setOrNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(dayjs());
  const [manualAmounts, setManualAmounts] = useState(initialManualAmounts);
  const [payerName, setPayerName] = useState("");

  const loadData = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [vendorResponse, stallResponse] = await Promise.all([
        api.get("/vendor-payments"),
        api.get("/stalls"),
      ]);
      const vendorData = vendorResponse.data?.data;
      const stallData = stallResponse.data;
      if (!Array.isArray(vendorData) || !Array.isArray(stallData)) {
        throw new Error("Vendor or stall data was returned in an unexpected format.");
      }
      setVendors(vendorData);
      setStalls(stallData);
    } catch (error) {
      setLoadError(error.response?.data?.message || error.message || "Unable to load vendor and stall information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const paymentYear = paymentDate?.year() || dayjs().year();

  useEffect(() => {
    if (paymentMode !== "vendor" || !selectedVendorId) {
      setPaidTypes([]);
      setAvailablePaymentTypes([]);
      setEligibilityError("");
      setEligibilityLoading(false);
      return undefined;
    }

    let cancelled = false;
    setEligibilityLoading(true);
    setEligibilityError("");
    api.get("/vendor-other-payments/eligibility", {
      params: { vendor_id: selectedVendorId, year: paymentYear },
    })
      .then((response) => {
        if (!cancelled) {
          setPaidTypes(response.data?.paid_types || []);
          setAvailablePaymentTypes(response.data?.available_payment_types || []);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setPaidTypes([]);
          setAvailablePaymentTypes([]);
          setEligibilityError(error.response?.data?.message || "Could not verify this vendor's yearly payment status.");
        }
      })
      .finally(() => {
        if (!cancelled) setEligibilityLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [paymentMode, selectedVendorId, paymentYear]);

  const selectedVendor = vendors.find((vendor) => String(vendor.id) === String(selectedVendorId));
  const visiblePaymentTypes = paymentTypes.filter((type) => {
    const modePaymentTypes = paymentMode === "vendor"
      ? annualPaymentTypes
      : paymentMode === "walk_in"
        ? walkInPaymentTypes
        : certificatePaymentTypes;

    return modePaymentTypes.includes(type.value);
  });

  const rentalRowsByType = useMemo(() => {
    if (!selectedVendor) return { stall_rights: [], space_right: [] };

    return rightsPaymentTypes.reduce((result, paymentType) => {
      const requiredSectionRightsType = paymentType === "stall_rights" ? "stall_right" : "space_right";
      result[paymentType] = (selectedVendor.rentals || [])
        .filter((rental) => !rental.is_unoccupied && activeRentalStatuses.has(normalize(rental.status)))
        .map((rental) => {
          const stall = stalls.find((item) => (
            normalize(item.stall_number) === normalize(rental.stall_number)
            && normalize(item.section?.name) === normalize(rental.section_name)
          ));
          const section = stall?.section;
          const rightsValue = paymentType === "stall_rights" ? section?.stall_rights : section?.space_right;
          const amountKey = `${paymentType}:${rental.rental_id}`;
          const baseAmount = Number(rightsValue || 0);

          return {
            key: String(rental.rental_id),
            rentalId: rental.rental_id,
            amountKey,
            stallId: stall?.id,
            sectionId: section?.id,
            stallNumber: rental.stall_number,
            sectionName: rental.section_name,
            status: rental.status,
            sectionRightsType: section?.rights_type,
            baseAmount,
            amount: Number(unitAmounts[amountKey] ?? baseAmount),
            rightsValue,
            missingStall: !stall,
          };
        })
        .filter((row) => row.missingStall || normalize(row.sectionRightsType) === requiredSectionRightsType);

      return result;
    }, {});
  }, [selectedVendor, stalls, unitAmounts]);

  const selectedRowsByType = rightsPaymentTypes.reduce((result, paymentType) => {
    result[paymentType] = (rentalRowsByType[paymentType] || [])
      .filter((row) => (selectedRentalIdsByType[paymentType] || []).includes(row.key));
    return result;
  }, {});
  const categoryTotals = paymentTypes.reduce((result, type) => {
    result[type.value] = rightsPaymentTypes.includes(type.value)
      ? selectedRowsByType[type.value].reduce((total, row) => total + row.amount, 0)
      : Number(manualAmounts[type.value] || 0);
    return result;
  }, {});
  const totalAmount = selectedPaymentTypes.reduce((total, type) => total + categoryTotals[type], 0);
  const selectedPaidTypes = selectedPaymentTypes.filter((type) => paidTypes.includes(type));
  const selectedUnavailableRightsTypes = selectedPaymentTypes.filter((type) => (
    rightsPaymentTypes.includes(type) && !availablePaymentTypes.includes(type)
  ));
  const transactionRecordCount = selectedPaymentTypes.reduce((count, type) => (
    count + (rightsPaymentTypes.includes(type) ? selectedRowsByType[type].length : 1)
  ), 0);
  const incompleteRightsType = selectedPaymentTypes.find((type) => (
    rightsPaymentTypes.includes(type) && selectedRowsByType[type].length === 0
  ));
  const unmatchedStallSelected = selectedPaymentTypes.some((type) => (
    rightsPaymentTypes.includes(type) && selectedRowsByType[type].some((row) => row.missingStall)
  ));
  const invalidRightsAmountType = selectedPaymentTypes.find((type) => (
    rightsPaymentTypes.includes(type) && selectedRowsByType[type].some((row) => row.amount <= 0)
  ));
  const invalidManualAmountType = selectedPaymentTypes.find((type) => (
    !rightsPaymentTypes.includes(type) && categoryTotals[type] <= 0
  ));
  const submissionBlockReason = paymentMode === "vendor" && !selectedVendor
    ? "Select a vendor to begin."
    : selectedPaymentTypes.length === 0
      ? "Select at least one payment category."
      : paymentMode === "vendor" && eligibilityLoading
        ? `Checking ${paymentYear} payment eligibility...`
        : paymentMode === "vendor" && eligibilityError
          ? "Payment eligibility could not be verified. Resolve the error above before continuing."
          : paymentMode === "vendor" && selectedPaidTypes.length > 0
            ? `Remove already-paid categories: ${selectedPaidTypes.map((type) => paymentTypes.find((item) => item.value === type)?.label).join(", ")}.`
            : paymentMode === "vendor" && selectedUnavailableRightsTypes.length > 0
              ? "Remove rights categories without matching rented stalls."
              : paymentMode !== "vendor" && !payerName.trim()
                ? paymentMode === "certificate" ? "Enter the driver's name." : "Enter the walk-in customer's name."
              : !orNumber.trim()
                ? "Enter the official receipt number."
                : !paymentDate || paymentDate.isAfter(dayjs(), "day")
                  ? "Choose a valid payment date."
                  : incompleteRightsType
                    ? `Select at least one stall for ${paymentTypes.find((type) => type.value === incompleteRightsType)?.label}.`
                    : unmatchedStallSelected
                      ? "Refresh the stall register to resolve the selected stall."
                      : invalidRightsAmountType
                        ? `Enter a positive amount for each selected ${paymentTypes.find((type) => type.value === invalidRightsAmountType)?.label} stall.`
                        : invalidManualAmountType
                          ? `Enter an amount for ${paymentTypes.find((type) => type.value === invalidManualAmountType)?.label}.`
                          : "";

  const resetForm = () => {
    setSelectedVendorId(undefined);
    setSelectedPaymentTypes([]);
    setSelectedRentalIdsByType({ stall_rights: [], space_right: [] });
    setUnitAmounts({});
    setOrNumber("");
    setPaymentDate(dayjs());
    setManualAmounts({ ...initialManualAmounts });
    setPayerName("");
  };

  const handleSubmit = async () => {
    if (selectedPaymentTypes.length === 0) {
      message.error("Select at least one payment category.");
      return;
    }
    if (paymentMode === "vendor" && (eligibilityLoading || eligibilityError)) {
      message.error("Verify the vendor's annual payment status before recording this payment.");
      return;
    }
    if (paymentMode === "vendor" && selectedPaidTypes.length > 0) {
      message.error(`Already paid this year: ${selectedPaidTypes.map((type) => paymentTypes.find((item) => item.value === type)?.label).join(", ")}.`);
      return;
    }
    if (paymentMode === "vendor" && selectedUnavailableRightsTypes.length > 0) {
      message.error("One or more selected rights categories have no matching rented stalls.");
      return;
    }
    if (paymentMode === "vendor" && !selectedVendor) {
      message.error("Select a vendor before recording the payment.");
      return;
    }
    if (paymentMode !== "vendor" && !payerName.trim()) {
      message.error(paymentMode === "certificate" ? "Enter the driver's name." : "Enter the walk-in customer's name.");
      return;
    }
    if (!orNumber.trim()) {
      message.error("Enter the official receipt number.");
      return;
    }
    if (!paymentDate || paymentDate.isAfter(dayjs(), "day")) {
      message.error("Choose a valid payment date that is not in the future.");
      return;
    }
    for (const paymentType of selectedPaymentTypes) {
      if (rightsPaymentTypes.includes(paymentType)) {
        const selectedRows = selectedRowsByType[paymentType];
        if (selectedRows.length === 0) {
          message.error(`Select at least one stall for ${paymentTypes.find((type) => type.value === paymentType)?.label}.`);
          return;
        }
        if (selectedRows.some((row) => row.missingStall)) {
          message.error("Some selected stalls could not be matched to the stall register. Refresh the data before continuing.");
          return;
        }
        if (selectedRows.some((row) => row.amount <= 0)) {
          message.error(`Enter a positive amount for every selected ${paymentType === "stall_rights" ? "stall-rights" : "space-rights"} stall.`);
          return;
        }
      } else if (categoryTotals[paymentType] <= 0) {
        message.error(`Enter an amount greater than zero for ${paymentTypes.find((type) => type.value === paymentType)?.label}.`);
        return;
      }
    }

    const records = selectedPaymentTypes.flatMap((paymentType) => {
      const common = {
        vendor_id: paymentMode === "vendor" ? selectedVendor.id : null,
        payer_name: payerName.trim() || null,
        payer_type: paymentMode === "vendor"
          ? "Vendor"
          : paymentMode === "certificate"
            ? "Driver"
            : "Walk in Vendor",
        payment_type: paymentType,
        or_number: orNumber.trim(),
        payment_date: paymentDate.format("YYYY-MM-DD"),
        status: "paid",
      };

      if (rightsPaymentTypes.includes(paymentType)) {
        return selectedRowsByType[paymentType].map((row) => ({
          ...common,
          stall_id: row.stallId,
          section_id: row.sectionId,
          rented_id: row.rentalId,
          amount: Number(row.amount.toFixed(2)),
        }));
      }

      return [{
        ...common,
        stall_id: null,
        section_id: null,
        rented_id: null,
        amount: Number(categoryTotals[paymentType].toFixed(2)),
      }];
    });

    setSaving(true);
    try {
      await api.post("/vendor-other-payments", { payments: records });
      message.success(`${records.length} payment ${records.length === 1 ? "record" : "records"} saved.`);
      resetForm();
    } catch (error) {
      message.error(error.response?.data?.message || "Payment could not be saved. Check that the Vendor Other Payments API is available.");
    } finally {
      setSaving(false);
    }
  };

  const columnsForType = (paymentType) => [
    {
      title: "STALL",
      dataIndex: "stallNumber",
      key: "stallNumber",
      render: (stallNumber, row) => (
        <div className="other-payment-stall-cell">
          <strong>Stall {stallNumber}</strong>
          <Text type="secondary">{row.sectionName || "Unassigned section"}</Text>
        </div>
      ),
    },
    {
      title: paymentType === "stall_rights" ? "STALL RIGHTS RATE" : "SPACE RIGHTS RATE",
      dataIndex: "baseAmount",
      key: "rightsRate",
      render: (amount, row) => row.rightsValue == null
        || Number(row.rightsValue) <= 0
        ? <Tag color="orange">No default rate</Tag>
        : formatCurrency(amount),
    },
    {
      title: "PAYMENT AMOUNT",
      dataIndex: "amount",
      key: "amount",
      width: 180,
      render: (amount, row) => (
        <InputNumber
          aria-label={`Payment amount for stall ${row.stallNumber}`}
          min={0.01}
          precision={2}
          prefix="₱"
          value={amount || null}
          disabled={row.missingStall}
          onChange={(value) => setUnitAmounts((current) => ({ ...current, [row.amountKey]: value }))}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "RENTAL",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={normalize(status) === "temp_closed" ? "gold" : normalize(status) === "partial" ? "orange" : "green"}>
          {formatRentalStatus(status)}
        </Tag>
      ),
    },
  ];

  return (
    <div className="staff-other-payments">
      <header className="other-payment-heading">
        <div className="other-payment-heading-copy">
          <span className="other-payment-eyebrow">MARKET OPERATIONS / PAYMENTS</span>
          <Title level={2}>Other payments &amp; product sales</Title>
          <Text type="secondary">Record annual vendor fees or repeatable fees for walk-in customers.</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>Refresh data</Button>
      </header>

      {loadError && (
        <Alert
          className="other-payment-alert"
          type="error"
          showIcon
          message="Could not load payment options"
          description={loadError}
          action={<Button size="small" onClick={loadData}>Try again</Button>}
        />
      )}

      <Spin spinning={loading}>
        <div className="other-payment-workspace">
          <main className="other-payment-form">
            <section className="other-payment-section">
              <div className="other-payment-section-heading">
                <span className="other-payment-step">01</span>
                <div>
                  <Title level={4}>Choose a collection type</Title>
                  <Text type="secondary">Choose vendor annual fees, a walk-in product sale, or certificate issuance.</Text>
                </div>
              </div>

              <div className="other-payment-fields">
                <div className="other-payment-field other-payment-mode-field">
                  <span>Collection type</span>
                  <Radio.Group
                    className="other-payment-mode-control"
                    value={paymentMode}
                    onChange={(event) => {
                      setPaymentMode(event.target.value);
                      setSelectedVendorId(undefined);
                      setSelectedPaymentTypes([]);
                      setSelectedRentalIdsByType({ stall_rights: [], space_right: [] });
                      setUnitAmounts({});
                      setManualAmounts({ ...initialManualAmounts });
                      setPayerName("");
                    }}
                  >
                    <Radio.Button value="vendor">Vendor annual fees</Radio.Button>
                    <Radio.Button value="walk_in">Walk-in product sale</Radio.Button>
                    <Radio.Button value="certificate">Certificate issuance</Radio.Button>
                  </Radio.Group>
                  <Text className="other-payment-category-hint" type="secondary">
                    {paymentMode === "vendor"
                      ? "Certification, Stall Rights, Space Rights, and DST can be collected once per vendor per year. Payer type: Vendor."
                      : paymentMode === "walk_in"
                        ? "Special Permit, Rental Fee, and Electricity are for customers without a vendor account. Payer type: Walk in Vendor."
                        : "This tab accepts certification payments only. Payer type: Driver."
                    }
                  </Text>
                </div>

                {paymentMode === "vendor" && (
                  <label className="other-payment-field">
                    <span>Vendor <small>Required</small></span>
                    <Select
                      showSearch
                      allowClear
                      value={selectedVendorId}
                      placeholder="Search vendor name or ID"
                      optionFilterProp="label"
                      onChange={(value) => {
                        setSelectedVendorId(value);
                        setSelectedPaymentTypes([]);
                        setSelectedRentalIdsByType({ stall_rights: [], space_right: [] });
                        setUnitAmounts({});
                        setManualAmounts({ ...initialManualAmounts });
                      }}
                      options={vendors.map((vendor) => ({
                        value: vendor.id,
                        label: `${getVendorName(vendor)} · ID ${vendor.id}`,
                      }))}
                      suffixIcon={<UserOutlined />}
                    />
                  </label>
                )}

                <div className="other-payment-field other-payment-type-field">
                  <span>Payment categories</span>
                  <Text className="other-payment-category-hint" type="secondary">
                    Select one or more categories to include on this receipt.
                  </Text>
                  <Checkbox.Group
                    className="other-payment-category-control"
                    value={selectedPaymentTypes}
                    options={visiblePaymentTypes.map((type) => {
                      const alreadyPaid = paidTypes.includes(type.value);
                      const rightsTypeUnavailable = rightsPaymentTypes.includes(type.value)
                        && !availablePaymentTypes.includes(type.value);
                      const selected = selectedPaymentTypes.includes(type.value);
                      const statusLabel = alreadyPaid
                        ? "Paid this year"
                        : rightsTypeUnavailable
                          ? "No matching stall"
                          : selected
                            ? "Included"
                            : paymentMode === "walk_in" ? "Repeatable" : "Once per year";

                      return {
                        value: type.value,
                        label: (
                          <span className={`other-payment-category-copy${alreadyPaid ? " is-paid" : rightsTypeUnavailable ? " is-unavailable" : selected ? " is-selected" : ""}`}>
                            <strong>{type.label}</strong>
                            <small>{statusLabel}</small>
                          </span>
                        ),
                        disabled: paymentMode === "vendor" && (eligibilityLoading
                          || !selectedVendor
                          || (alreadyPaid && !selected)
                          || (rightsTypeUnavailable && !selected)),
                      };
                    })}
                    onChange={setSelectedPaymentTypes}
                  />
                  {paymentMode === "vendor" && selectedVendor && eligibilityLoading && (
                    <Text className="other-payment-eligibility-note" type="secondary">
                      Checking {paymentYear} payment status...
                    </Text>
                  )}
                  {paymentMode === "vendor" && selectedVendor && eligibilityError && (
                    <Alert className="other-payment-eligibility-alert" type="error" showIcon message={eligibilityError} />
                  )}
                </div>
              </div>
            </section>

            {selectedPaymentTypes.length === 0 ? (
              <section className="other-payment-section">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select one or more payment categories to enter their details." />
              </section>
            ) : selectedPaymentTypes.map((paymentType, index) => {
              const label = paymentTypes.find((type) => type.value === paymentType)?.label;

              if (rightsPaymentTypes.includes(paymentType)) {
                const rentalRows = rentalRowsByType[paymentType] || [];
                const selectedRows = selectedRowsByType[paymentType];
                const rightsLabel = paymentType === "stall_rights" ? "stall-rights" : "space-rights";

                return (
                  <section className="other-payment-section other-payment-stalls-section" key={paymentType}>
                    <div className="other-payment-section-heading">
                      <span className="other-payment-step">{String(index + 2).padStart(2, "0")}</span>
                      <div>
                        <Title level={4}>{label}</Title>
                        <Text type="secondary">Select stalls in matching sections. Each selected stall is charged its {rightsLabel} rate.</Text>
                      </div>
                      {selectedRows.length > 0 && <Tag color="blue">{selectedRows.length} selected</Tag>}
                    </div>

                    {!selectedVendor ? (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select a vendor to view their rented stalls." />
                    ) : rentalRows.length === 0 ? (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`No active stalls in a ${rightsLabel} section.`} />
                    ) : (
                      <Table
                        className="other-payment-table"
                        columns={columnsForType(paymentType)}
                        dataSource={rentalRows}
                        rowSelection={{
                          selectedRowKeys: selectedRentalIdsByType[paymentType],
                          onChange: (keys) => setSelectedRentalIdsByType((current) => ({ ...current, [paymentType]: keys })),
                          getCheckboxProps: (row) => ({ disabled: row.missingStall }),
                        }}
                        pagination={false}
                        scroll={{ x: 660 }}
                        size="middle"
                      />
                    )}
                    <div className="other-payment-category-total">
                      <span>{label} subtotal</span>
                      <strong>{formatCurrency(categoryTotals[paymentType])}</strong>
                    </div>
                  </section>
                );
              }

              return (
                <section className="other-payment-section" key={paymentType}>
                  <div className="other-payment-section-heading">
                    <span className="other-payment-step">{String(index + 2).padStart(2, "0")}</span>
                    <div>
                      <Title level={4}>{label}</Title>
                      <Text type="secondary">Enter the amount shown on the supporting document.</Text>
                    </div>
                  </div>
                  <div className="other-payment-fields">
                    <label className="other-payment-field">
                      <span>{label} amount</span>
                      <InputNumber
                        min={0.01}
                        precision={2}
                        prefix="₱"
                        value={manualAmounts[paymentType]}
                        onChange={(value) => setManualAmounts((current) => ({ ...current, [paymentType]: value }))}
                        placeholder="0.00"
                        style={{ width: "100%" }}
                      />
                    </label>
                    <div className="other-payment-category-total">
                      <span>{label} subtotal</span>
                      <strong>{formatCurrency(categoryTotals[paymentType])}</strong>
                    </div>
                  </div>
                </section>
              );
            })}

            <section className="other-payment-section">
              <div className="other-payment-section-heading">
                <span className="other-payment-step">{String(selectedPaymentTypes.length + 2).padStart(2, "0")}</span>
                <div>
                  <Title level={4}>Receipt information</Title>
                  <Text type="secondary">Enter the official receipt details for this collection.</Text>
                </div>
              </div>
              <div className="other-payment-fields">
                <label className="other-payment-field">
                  <span>OR number</span>
                  <Input value={orNumber} onChange={(event) => setOrNumber(event.target.value)} placeholder="Enter receipt number" maxLength={100} />
                </label>
                <label className="other-payment-field">
                  <span>Payment date</span>
                  <DatePicker
                    value={paymentDate}
                    onChange={setPaymentDate}
                    disabledDate={(date) => date.isAfter(dayjs(), "day")}
                    format="MMM D, YYYY"
                    style={{ width: "100%" }}
                  />
                </label>
                <label className="other-payment-field">
                  <span>
                    {paymentMode === "certificate" ? "Driver name" : "Payer name"}
                    <small>{paymentMode === "vendor" ? "Optional" : "Required"}</small>
                  </span>
                  <Input
                    value={payerName}
                    onChange={(event) => setPayerName(event.target.value)}
                    placeholder={paymentMode === "certificate"
                      ? "Enter the driver's name"
                      : paymentMode === "walk_in" ? "Enter the customer's name" : "Name on receipt"}
                    maxLength={255}
                  />
                </label>
              </div>
            </section>
          </main>

          <aside className="other-payment-summary">
            <div className="other-payment-summary-top">
              <span className="other-payment-summary-icon"><SafetyCertificateOutlined /></span>
              <div>
                <Text type="secondary">PAYMENT SUMMARY</Text>
                <Title level={4}>Review collection</Title>
              </div>
            </div>
            <div className="other-payment-summary-vendor">
              <span className="other-payment-summary-icon other-payment-vendor-icon"><ShopOutlined /></span>
              <div>
                <Text type="secondary">
                  {paymentMode === "vendor" ? "Vendor" : paymentMode === "certificate" ? "Driver" : "Walk-in customer"}
                </Text>
                <strong>
                  {paymentMode === "vendor"
                    ? selectedVendor ? getVendorName(selectedVendor) : "Not selected"
                    : payerName.trim() || "Name required"}
                </strong>
                {paymentMode === "vendor" && selectedVendor && <small>Vendor ID {selectedVendor.id}</small>}
              </div>
            </div>
            <div className="other-payment-summary-line">
              <span>Payer type</span>
              <strong>
                {paymentMode === "vendor" ? "Vendor" : paymentMode === "certificate" ? "Driver" : "Walk in Vendor"}
              </strong>
            </div>
            <div className="other-payment-summary-line">
              <span>Categories</span>
              <strong>{selectedPaymentTypes.length || "None selected"}</strong>
            </div>
            {selectedPaymentTypes.map((type) => (
              <div className="other-payment-summary-line" key={type}>
                <span>{paymentTypes.find((item) => item.value === type)?.label}</span>
                <strong>{formatCurrency(categoryTotals[type])}</strong>
              </div>
            ))}
            {rightsPaymentTypes.some((type) => selectedPaymentTypes.includes(type)) && (
              <div className="other-payment-summary-line">
                <span>Stalls selected</span>
                <strong>{rightsPaymentTypes.reduce((count, type) => count + selectedRowsByType[type].length, 0)}</strong>
              </div>
            )}
            <div className="other-payment-summary-total">
              <span>Total to collect</span>
              <strong>{formatCurrency(totalAmount)}</strong>
            </div>
            <div className="other-payment-summary-note">
              <CheckCircleOutlined />
              <span>
                {selectedPaymentTypes.length > 0
                  ? paymentMode === "vendor"
                    ? `${selectedPaymentTypes.length} annual fee ${selectedPaymentTypes.length === 1 ? "category" : "categories"} will be recorded for this vendor.`
                    : paymentMode === "certificate"
                      ? "A certificate issuance payment will be recorded for this driver."
                      : `${selectedPaymentTypes.length} repeatable ${selectedPaymentTypes.length === 1 ? "fee" : "fees"} will be recorded for this customer.`
                  : "Select payment categories to review the transaction total."}
              </span>
            </div>
            <div className={`other-payment-submit-guidance${submissionBlockReason ? " is-blocked" : " is-ready"}`} role="status">
              {submissionBlockReason ? <InfoCircleOutlined /> : <CheckCircleOutlined />}
              <span>{submissionBlockReason || `${transactionRecordCount} payment records are ready to submit together.`}</span>
            </div>
            <Button
              type="primary"
              size="large"
              block
              icon={<FileTextOutlined />}
              loading={saving}
              disabled={Boolean(submissionBlockReason) || saving}
              onClick={handleSubmit}
            >
              Record payment
            </Button>
            <Space className="other-payment-summary-footnote" align="start">
              <Text type="secondary">
                {transactionRecordCount > 0
                  ? `${transactionRecordCount} payment ${transactionRecordCount === 1 ? "record" : "records"} will be saved in one transaction.`
                  : "Choose categories and complete their payment details to continue."}
              </Text>
            </Space>
          </aside>
        </div>
      </Spin>
    </div>
  );
};

export default StaffVendorOtherPayments;