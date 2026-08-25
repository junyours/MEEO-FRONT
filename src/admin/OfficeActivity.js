import React, { useEffect, useState } from "react";
import {
    Table,
    Card,
    Button,
    Modal,
    Form,
    Input,
    Select,
    DatePicker,
    Upload,
    Image,
    Space,
    Tag,
    Typography,
    Row,
    Col,
    Divider,
    Popconfirm,
    Empty,
    message,
    Tooltip,
} from "antd";

import {
    PlusOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    UploadOutlined,
    PictureOutlined,
    CalendarOutlined,
    FileTextOutlined,
    ReloadOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";
import api from "../Api"; // Adjust the path as necessary

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const activityTypes = [
    "Meeting",
    "Seminar",
    "Training",
    "Workshop",
    "Environmental Program",
    "Community Outreach",
    "Office Program",
    "Other",
];

const OfficeActivity = () => {
    // =========================================================
    // STATES
    // =========================================================

    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);

    const [modalType, setModalType] = useState(null);
    // null | "add" | "edit" | "view"

    const [selectedActivity, setSelectedActivity] =
        useState(null);

    const [saving, setSaving] = useState(false);

    const [coverImage, setCoverImage] = useState(null);

    const [galleryImages, setGalleryImages] =
        useState([]);

    const [existingImages, setExistingImages] =
        useState([]);

    const [deletedImageIds, setDeletedImageIds] =
        useState([]);

    const [form] = Form.useForm();

    // =========================================================
    // FETCH ACTIVITIES
    // =========================================================

    const fetchActivities = async () => {
        try {
            setLoading(true);

            const response = await api.get(
                "/office-activities"
            );

            setActivities(response.data.data || []);
        } catch (error) {
            console.error(error);

            message.error(
                "Failed to load office activities."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    // =========================================================
    // BASE64 CONVERSION
    // =========================================================

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.readAsDataURL(file);

            reader.onload = () =>
                resolve(reader.result);

            reader.onerror = (error) =>
                reject(error);
        });
    };

    // =========================================================
    // VALIDATE IMAGE
    // =========================================================

    const validateImage = (file) => {
        if (!file.type.startsWith("image/")) {
            message.error(
                "Only image files are allowed."
            );

            return false;
        }

        const isLt5M =
            file.size / 1024 / 1024 < 5;

        if (!isLt5M) {
            message.error(
                "Each image must be smaller than 5MB."
            );

            return false;
        }

        return true;
    };

    // =========================================================
    // COVER IMAGE
    // =========================================================

    const handleCoverImage = async ({ file }) => {
        if (!file) return;

        if (!validateImage(file)) return;

        try {
            const base64 =
                await convertToBase64(file);

            setCoverImage(base64);
        } catch (error) {
            console.error(error);

            message.error(
                "Failed to process cover image."
            );
        }
    };

    // =========================================================
    // GALLERY IMAGES
    // =========================================================

    const handleGalleryImages = async ({
        fileList,
    }) => {
        const convertedImages = [];

        for (const item of fileList) {
            const file = item.originFileObj;

            if (!file) continue;

            if (!validateImage(file)) {
                continue;
            }

            try {
                const base64 =
                    await convertToBase64(file);

                convertedImages.push({
                    uid: file.uid,
                    name: file.name,
                    base64,
                });
            } catch (error) {
                console.error(error);
            }
        }

        setGalleryImages(convertedImages);
    };

    // =========================================================
    // RESET FORM
    // =========================================================

    const resetForm = () => {
        form.resetFields();

        setCoverImage(null);
        setGalleryImages([]);
        setExistingImages([]);
        setDeletedImageIds([]);
        setSelectedActivity(null);
    };

    // =========================================================
    // OPEN ADD
    // =========================================================

    const openAddModal = () => {
        resetForm();

        setModalType("add");
    };

    // =========================================================
    // OPEN VIEW
    // =========================================================

    const openViewModal = async (activity) => {
        try {
            const response = await api.get(
                `/office-activities/${activity.id}`
            );

            setSelectedActivity(
                response.data.data
            );

            setModalType("view");
        } catch (error) {
            console.error(error);

            message.error(
                "Failed to load activity details."
            );
        }
    };

    // =========================================================
    // OPEN EDIT
    // =========================================================

    const openEditModal = async (activity) => {
        try {
            const response = await api.get(
                `/office-activities/${activity.id}`
            );

            const data = response.data.data;

            setSelectedActivity(data);

            form.setFieldsValue({
                title: data.title,

                description:
                    data.description,

                activity_type:
                    data.activity_type,

                activity_date:
                    dayjs(data.activity_date),
            });

            setCoverImage(null);

            setGalleryImages([]);

            setExistingImages(
                data.images || []
            );

            setDeletedImageIds([]);

            setModalType("edit");
        } catch (error) {
            console.error(error);

            message.error(
                "Failed to load activity."
            );
        }
    };

    // =========================================================
    // CLOSE MODAL
    // =========================================================

    const closeModal = () => {
        if (!saving) {
            setModalType(null);

            resetForm();
        }
    };

    // =========================================================
    // CREATE / UPDATE
    // =========================================================

    const handleSubmit = async (values) => {
        try {
            setSaving(true);

            // =================================================
            // CREATE
            // =================================================

            if (modalType === "add") {
                if (!coverImage) {
                    message.error(
                        "Please upload a cover image."
                    );

                    setSaving(false);

                    return;
                }

                const payload = {
                    title: values.title,

                    description:
                        values.description,

                    activity_type:
                        values.activity_type,

                    activity_date:
                        values.activity_date.format(
                            "YYYY-MM-DD"
                        ),

                    image: coverImage,

                    gallery_images:
                        galleryImages.map(
                            (image) =>
                                image.base64
                        ),
                };

                await api.post(
                    "/office-activities",
                    payload
                );

                message.success(
                    "Office activity created successfully."
                );
            }

            // =================================================
            // UPDATE
            // =================================================

            if (modalType === "edit") {
                const payload = {
                    title: values.title,

                    description:
                        values.description,

                    activity_type:
                        values.activity_type,

                    activity_date:
                        values.activity_date.format(
                            "YYYY-MM-DD"
                        ),

                    gallery_images:
                        galleryImages.map(
                            (image) =>
                                image.base64
                        ),

                    delete_image_ids:
                        deletedImageIds,
                };

                // Only send image if changed
                if (coverImage) {
                    payload.image = coverImage;
                }

                await api.put(
                    `/office-activities/${selectedActivity.id}`,
                    payload
                );

                message.success(
                    "Office activity updated successfully."
                );
            }

            closeModal();

            fetchActivities();
        } catch (error) {
            console.error(error);

            if (
                error.response?.data?.errors
            ) {
                const errors =
                    error.response.data.errors;

                Object.values(errors).forEach(
                    (messages) => {
                        messages.forEach(
                            (msg) =>
                                message.error(msg)
                        );
                    }
                );
            } else {
                message.error(
                    error.response?.data?.message ||
                        "Failed to save activity."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // DELETE ACTIVITY
    // =========================================================

    const handleDelete = async (activity) => {
        try {
            setLoading(true);

            await api.delete(
                `/office-activities/${activity.id}`
            );

            message.success(
                "Office activity deleted successfully."
            );

            fetchActivities();
        } catch (error) {
            console.error(error);

            message.error(
                error.response?.data?.message ||
                    "Failed to delete activity."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // DELETE GALLERY IMAGE FROM EDIT
    // =========================================================

    const removeExistingImage = (imageId) => {
        setExistingImages((prev) =>
            prev.filter(
                (image) => image.id !== imageId
            )
        );

        setDeletedImageIds((prev) => [
            ...prev,
            imageId,
        ]);
    };

    // =========================================================
    // TABLE COLUMNS
    // =========================================================

    const columns = [
        {
            title: "Activity",
            key: "activity",
            render: (_, record) => (
                <Space>
                    {record.image ? (
                        <img
                            src={record.image}
                            alt={record.title}
                            style={{
                                width: 70,
                                height: 55,
                                objectFit: "cover",
                                borderRadius: 8,
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: 70,
                                height: 55,
                                borderRadius: 8,
                                background:
                                    "#f0f2f5",
                                display: "flex",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "center",
                            }}
                        >
                            <PictureOutlined />
                        </div>
                    )}

                    <div>
                        <Text strong>
                            {record.title}
                        </Text>

                        <br />

                        <Text
                            type="secondary"
                            style={{
                                fontSize: 12,
                            }}
                        >
                            {record.description
                                ?.length > 60
                                ? record.description.substring(
                                      0,
                                      60
                                  ) + "..."
                                : record.description}
                        </Text>
                    </div>
                </Space>
            ),
        },

        {
            title: "Type",
            dataIndex: "activity_type",
            key: "activity_type",
            render: (type) => (
                <Tag color="blue">
                    {type}
                </Tag>
            ),
        },

        {
            title: "Activity Date",
            dataIndex: "activity_date",
            key: "activity_date",
            render: (date) => (
                <Space>
                    <CalendarOutlined />

                    {dayjs(date).format(
                        "MMMM DD, YYYY"
                    )}
                </Space>
            ),
        },

        {
            title: "Photos",
            key: "photos",
            align: "center",
            render: (_, record) => (
                <Tag>
                    {(record.images?.length || 0) +
                        (record.image ? 1 : 0)}{" "}
                    photos
                </Tag>
            ),
        },

        {
            title: "Actions",
            key: "actions",
            align: "center",

            render: (_, record) => (
                <Space>
                    <Tooltip title="View">
                        <Button
                            type="text"
                            icon={
                                <EyeOutlined />
                            }
                            onClick={() =>
                                openViewModal(
                                    record
                                )
                            }
                        />
                    </Tooltip>

                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            icon={
                                <EditOutlined />
                            }
                            onClick={() =>
                                openEditModal(
                                    record
                                )
                            }
                        />
                    </Tooltip>

                    <Popconfirm
                        title="Delete this activity?"
                        description="All gallery images will also be deleted."
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{
                            danger: true,
                        }}
                        onConfirm={() =>
                            handleDelete(
                                record
                            )
                        }
                    >
                        <Tooltip title="Delete">
                            <Button
                                type="text"
                                danger
                                icon={
                                    <DeleteOutlined />
                                }
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div
            style={{
                padding: 24,
                background: "#f5f7fa",
                minHeight: "100vh",
            }}
        >
            {/* =================================================
                HEADER
            ================================================= */}

            <div
                style={{
                    display: "flex",
                    justifyContent:
                        "space-between",
                    alignItems: "center",
                    marginBottom: 24,
                    gap: 16,
                }}
            >
                <div>
                    <Title
                        level={2}
                        style={{
                            marginBottom: 4,
                        }}
                    >
                        Office Activities
                    </Title>

                    <Text type="secondary">
                        Manage office events,
                        meetings, programs,
                        seminars, and other
                        activities.
                    </Text>
                </div>

                <Space>
                    <Button
                        icon={
                            <ReloadOutlined />
                        }
                        onClick={
                            fetchActivities
                        }
                    >
                        Refresh
                    </Button>

                    <Button
                        type="primary"
                        icon={
                            <PlusOutlined />
                        }
                        size="large"
                        onClick={
                            openAddModal
                        }
                    >
                        Add Activity
                    </Button>
                </Space>
            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <Card
                bordered={false}
                style={{
                    borderRadius: 12,
                    boxShadow:
                        "0 2px 8px rgba(0,0,0,0.05)",
                }}
            >
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={activities}
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (
                            total
                        ) =>
                            `Total ${total} activities`,
                    }}
                    scroll={{
                        x: 900,
                    }}
                />
            </Card>

            {/* =================================================
                ADD / EDIT MODAL
            ================================================= */}

            <Modal
                open={
                    modalType === "add" ||
                    modalType === "edit"
                }
                onCancel={closeModal}
                footer={null}
                width={950}
                destroyOnClose
                title={
                    <Space>
                        {modalType ===
                        "add" ? (
                            <PlusOutlined />
                        ) : (
                            <EditOutlined />
                        )}

                        <span>
                            {modalType ===
                            "add"
                                ? "Add Office Activity"
                                : "Edit Office Activity"}
                        </span>
                    </Space>
                }
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={
                        handleSubmit
                    }
                >
                    <Row gutter={24}>
                        {/* LEFT */}

                        <Col
                            xs={24}
                            lg={15}
                        >
                            <Card
                                size="small"
                                bordered={false}
                                style={{
                                    background:
                                        "#fafafa",
                                }}
                            >
                                <Title
                                    level={5}
                                >
                                    Activity Information
                                </Title>

                                <Divider />

                                <Form.Item
                                    label="Activity Title"
                                    name="title"
                                    rules={[
                                        {
                                            required:
                                                true,
                                            message:
                                                "Please enter the activity title.",
                                        },
                                    ]}
                                >
                                    <Input
                                        size="large"
                                        placeholder="Enter activity title"
                                    />
                                </Form.Item>

                                <Row
                                    gutter={
                                        16
                                    }
                                >
                                    <Col
                                        xs={
                                            24
                                        }
                                        md={
                                            12
                                        }
                                    >
                                        <Form.Item
                                            label="Activity Type"
                                            name="activity_type"
                                            rules={[
                                                {
                                                    required:
                                                        true,
                                                    message:
                                                        "Please select an activity type.",
                                                },
                                            ]}
                                        >
                                            <Select
                                                size="large"
                                                placeholder="Select type"
                                                options={activityTypes.map(
                                                    (
                                                        type
                                                    ) => ({
                                                        label:
                                                            type,
                                                        value:
                                                            type,
                                                    })
                                                )}
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col
                                        xs={
                                            24
                                        }
                                        md={
                                            12
                                        }
                                    >
                                        <Form.Item
                                            label="Activity Date"
                                            name="activity_date"
                                            rules={[
                                                {
                                                    required:
                                                        true,
                                                    message:
                                                        "Please select a date.",
                                                },
                                            ]}
                                        >
                                            <DatePicker
                                                size="large"
                                                style={{
                                                    width:
                                                        "100%",
                                                }}
                                                format="MMMM DD, YYYY"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item
                                    label="Description"
                                    name="description"
                                    rules={[
                                        {
                                            required:
                                                true,
                                            message:
                                                "Please enter a description.",
                                        },
                                    ]}
                                >
                                    <TextArea
                                        rows={
                                            7
                                        }
                                        showCount
                                        maxLength={
                                            2000
                                        }
                                        placeholder="Describe the office activity..."
                                    />
                                </Form.Item>
                            </Card>

                            {/* GALLERY */}

                            {modalType ===
                                "edit" && (
                                <Card
                                    size="small"
                                    bordered={
                                        false
                                    }
                                    style={{
                                        marginTop: 16,
                                        background:
                                            "#fafafa",
                                    }}
                                >
                                    <Title
                                        level={
                                            5
                                        }
                                    >
                                        Existing Gallery
                                    </Title>

                                    <Divider />

                                    {existingImages.length ===
                                    0 ? (
                                        <Empty
                                            image={
                                                Empty.PRESENTED_IMAGE_SIMPLE
                                            }
                                            description="No gallery images"
                                        />
                                    ) : (
                                        <Row
                                            gutter={[
                                                12,
                                                12,
                                            ]}
                                        >
                                            {existingImages.map(
                                                (
                                                    image
                                                ) => (
                                                    <Col
                                                        xs={
                                                            12
                                                        }
                                                        sm={
                                                            8
                                                        }
                                                        md={
                                                            6
                                                        }
                                                        key={
                                                            image.id
                                                        }
                                                    >
                                                        <div>
                                                            <Image
                                                                src={
                                                                    image.image
                                                                }
                                                                style={{
                                                                    width:
                                                                        "100%",
                                                                    height: 110,
                                                                    objectFit:
                                                                        "cover",
                                                                    borderRadius: 8,
                                                                }}
                                                            />

                                                            <Button
                                                                danger
                                                                size="small"
                                                                block
                                                                icon={
                                                                    <DeleteOutlined />
                                                                }
                                                                style={{
                                                                    marginTop: 5,
                                                                }}
                                                                onClick={() =>
                                                                    removeExistingImage(
                                                                        image.id
                                                                    )
                                                                }
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    </Col>
                                                )
                                            )}
                                        </Row>
                                    )}
                                </Card>
                            )}

                            <Card
                                size="small"
                                bordered={false}
                                style={{
                                    marginTop: 16,
                                    background:
                                        "#fafafa",
                                }}
                            >
                                <Title
                                    level={5}
                                >
                                    {modalType ===
                                    "edit"
                                        ? "Add More Photos"
                                        : "Activity Gallery"}
                                </Title>

                                <Text type="secondary">
                                    You can select
                                    multiple images.
                                </Text>

                                <Divider />

                                <Upload
                                    listType="picture-card"
                                    multiple
                                    accept="image/*"
                                    beforeUpload={() =>
                                        false
                                    }
                                    onChange={
                                        handleGalleryImages
                                    }
                                >
                                    <div>
                                        <PlusOutlined />

                                        <div
                                            style={{
                                                marginTop: 8,
                                            }}
                                        >
                                            Add Photos
                                        </div>
                                    </div>
                                </Upload>
                            </Card>
                        </Col>

                        {/* RIGHT */}

                        <Col
                            xs={24}
                            lg={9}
                        >
                            <Card
                                size="small"
                                bordered={false}
                                style={{
                                    background:
                                        "#fafafa",
                                }}
                            >
                                <Title
                                    level={5}
                                >
                                    Cover Image
                                </Title>

                                <Divider />

                                {coverImage ||
                                selectedActivity?.image ? (
                                    <Image
                                        src={
                                            coverImage ||
                                            selectedActivity?.image
                                        }
                                        preview
                                        style={{
                                            width:
                                                "100%",
                                            height: 240,
                                            objectFit:
                                                "cover",
                                            borderRadius: 10,
                                            marginBottom: 12,
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            height: 240,
                                            border:
                                                "2px dashed #d9d9d9",
                                            borderRadius: 10,
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            justifyContent:
                                                "center",
                                            background:
                                                "#fff",
                                            marginBottom: 12,
                                        }}
                                    >
                                        <Space
                                            direction="vertical"
                                            align="center"
                                        >
                                            <PictureOutlined
                                                style={{
                                                    fontSize: 32,
                                                    color: "#1677ff",
                                                }}
                                            />

                                            <Text type="secondary">
                                                No cover
                                                image
                                            </Text>
                                        </Space>
                                    </div>
                                )}

                                <Upload
                                    accept="image/*"
                                    showUploadList={
                                        false
                                    }
                                    beforeUpload={() =>
                                        false
                                    }
                                    onChange={
                                        handleCoverImage
                                    }
                                >
                                    <Button
                                        block
                                        icon={
                                            <UploadOutlined />
                                        }
                                    >
                                        {modalType ===
                                        "edit"
                                            ? "Change Cover Image"
                                            : "Upload Cover Image"}
                                    </Button>
                                </Upload>

                                <Text
                                    type="secondary"
                                    style={{
                                        display:
                                            "block",
                                        marginTop: 8,
                                        fontSize: 12,
                                    }}
                                >
                                    Maximum 5MB.
                                    JPG, PNG, or
                                    WEBP.
                                </Text>
                            </Card>

                            <Card
                                size="small"
                                bordered={false}
                                style={{
                                    marginTop: 16,
                                    background:
                                        "#fafafa",
                                }}
                            >
                                <Space
                                    direction="vertical"
                                    style={{
                                        width:
                                            "100%",
                                    }}
                                >
                                    <Text strong>
                                        {modalType ===
                                        "edit"
                                            ? "Save your changes"
                                            : "Ready to add this activity?"}
                                    </Text>

                                    <Text type="secondary">
                                        Make sure the
                                        activity
                                        information
                                        and images
                                        are correct.
                                    </Text>

                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        size="large"
                                        block
                                        loading={
                                            saving
                                        }
                                        icon={
                                            modalType ===
                                            "edit" ? (
                                                <EditOutlined />
                                            ) : (
                                                <PlusOutlined />
                                            )
                                        }
                                    >
                                        {modalType ===
                                        "edit"
                                            ? "Save Changes"
                                            : "Add Activity"}
                                    </Button>
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* =================================================
                VIEW DETAILS MODAL
            ================================================= */}

            <Modal
                open={
                    modalType === "view"
                }
                onCancel={closeModal}
                footer={null}
                width={900}
                title="Activity Details"
            >
                {selectedActivity && (
                    <div>
                        {/* COVER */}

                        <Image
                            src={
                                selectedActivity.image
                            }
                            width="100%"
                            height={350}
                            style={{
                                objectFit:
                                    "cover",
                                borderRadius: 12,
                            }}
                        />

                        {/* INFORMATION */}

                        <div
                            style={{
                                marginTop: 20,
                            }}
                        >
                            <Space
                                direction="vertical"
                                size={8}
                            >
                                <Title
                                    level={2}
                                    style={{
                                        margin: 0,
                                    }}
                                >
                                    {
                                        selectedActivity.title
                                    }
                                </Title>

                                <Space>
                                    <Tag color="blue">
                                        {
                                            selectedActivity.activity_type
                                        }
                                    </Tag>

                                    <Text type="secondary">
                                        <CalendarOutlined />{" "}
                                        {" "}
                                        {dayjs(
                                            selectedActivity.activity_date
                                        ).format(
                                            "MMMM DD, YYYY"
                                        )}
                                    </Text>
                                </Space>
                            </Space>

                            <Divider />

                            <Title
                                level={4}
                            >
                                Description
                            </Title>

                            <Paragraph
                                style={{
                                    whiteSpace:
                                        "pre-wrap",
                                }}
                            >
                                {
                                    selectedActivity.description
                                }
                            </Paragraph>
                        </div>

                        {/* GALLERY */}

                        <Divider />

                        <Title
                            level={4}
                        >
                            Activity Gallery
                        </Title>

                        {selectedActivity
                            .images
                            ?.length > 0 ? (
                            <Row
                                gutter={[
                                    12,
                                    12,
                                ]}
                            >
                                {selectedActivity.images.map(
                                    (
                                        image
                                    ) => (
                                        <Col
                                            xs={
                                                12
                                            }
                                            sm={
                                                8
                                            }
                                            md={
                                                6
                                            }
                                            key={
                                                image.id
                                            }
                                        >
                                            <Image
                                                src={
                                                    image.image
                                                }
                                                width="100%"
                                                height={
                                                    150
                                                }
                                                style={{
                                                    objectFit:
                                                        "cover",
                                                    borderRadius: 8,
                                                }}
                                            />
                                        </Col>
                                    )
                                )}
                            </Row>
                        ) : (
                            <Empty
                                image={
                                    Empty.PRESENTED_IMAGE_SIMPLE
                                }
                                description="No additional photos"
                            />
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default OfficeActivity;