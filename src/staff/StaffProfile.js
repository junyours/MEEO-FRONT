import React, { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Space,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  LockOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import api from "../Api";
import "./StaffProfile.css";

const { Text, Title } = Typography;

const StaffProfile = () => {
  const [usernameForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [otpVisible, setOtpVisible] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingChange, setPendingChange] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [newPassword, setNewPassword] = useState("");

  const passwordRequirements = [
    { label: "At least one uppercase letter", met: /[A-Z]/.test(newPassword) },
    { label: "At least one lowercase letter", met: /[a-z]/.test(newPassword) },
    { label: "At least one number", met: /\d/.test(newPassword) },
    { label: "At least one special character", met: /[^A-Za-z0-9]/.test(newPassword) },
    { label: "Minimum of 10 characters", met: newPassword.length >= 10 },
  ];
  const metPasswordRequirements = passwordRequirements.filter((requirement) => requirement.met).length;

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await api.get("/admin/profile");
        const data = response.data.data || response.data;
        if (!response.data.success || !data.username || !data.email) {
          throw new Error(response.data.message || "Profile information is unavailable.");
        }
        if (active) setProfile(data);
      } catch (error) {
        if (active) {
          message.error(error.response?.data?.message || error.message || "Unable to load your profile.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const startOtpCountdown = () => setCountdown(60);

  const requestCredentialChange = async (type, changes) => {
    setSaving(true);
    try {
      const response = await api.post("/admin/send-otp", { type, ...changes });
      if (!response.data.success) {
        message.error(response.data.message || "Unable to send a verification code.");
        return;
      }
      setPendingChange({ type, changes });
      setOtp("");
      setOtpVisible(true);
      startOtpCountdown();
      message.success("A verification code was sent to your current email address.");
    } catch (error) {
      message.error(error.response?.data?.message || "Unable to send a verification code.");
    } finally {
      setSaving(false);
    }
  };

  const refreshProfile = async () => {
    const response = await api.get("/admin/profile");
    const data = response.data.data || response.data;
    if (!response.data.success || !data.username || !data.email) {
      throw new Error(response.data.message || "Profile information is unavailable.");
    }
    setProfile(data);
  };

  const verifyCredentialChange = async () => {
    if (!pendingChange || otp.length !== 6) {
      message.error("Enter the complete 6-digit verification code.");
      return;
    }

    setSaving(true);
    try {
      const response = await api.post("/admin/verify-otp", {
        otp,
        type: pendingChange.type,
        ...pendingChange.changes,
      });
      if (!response.data.success) {
        message.error(response.data.message || "The verification code could not be confirmed.");
        return;
      }

      setOtpVisible(false);
      setPendingChange(null);
      setOtp("");
      setCountdown(0);
      setNewPassword("");
      usernameForm.resetFields(["username"]);
      emailForm.resetFields(["email"]);
      passwordForm.resetFields();
      message.success("Your account information was updated.");
      try {
        await refreshProfile();
      } catch (error) {
        message.error(error.response?.data?.message || error.message || "Updated successfully, but profile details could not be refreshed.");
      }
    } catch (error) {
      message.error(error.response?.data?.message || "The verification code could not be confirmed.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (values) => {
    if (values.new_password !== values.confirm_password) {
      message.error("The new passwords do not match.");
      return;
    }

    const password = values.new_password || "";
    const requirementsMet = /[A-Z]/.test(password)
      && /[a-z]/.test(password)
      && /\d/.test(password)
      && /[^A-Za-z0-9]/.test(password)
      && password.length >= 10;

    if (!requirementsMet) {
      message.error("Use at least 10 characters, including uppercase, lowercase, a number, and a symbol.");
      return;
    }

    await requestCredentialChange("password", {
      current_password: values.current_password,
      new_password: password,
    });
  };

  const closeOtpModal = () => {
    if (saving) return;
    setOtpVisible(false);
    setPendingChange(null);
    setOtp("");
    setCountdown(0);
  };

  const tabs = [
    {
      key: "username",
      label: <span className="staff-profile-tab"><UserOutlined /> Username</span>,
      children: (
        <div className="staff-profile-form-panel">
          <Alert
            showIcon
            type="info"
            message="Verify this change by email"
            description="A code will be sent to your current email address before your username is changed."
          />
          <Form
            form={usernameForm}
            layout="vertical"
            onFinish={(values) => requestCredentialChange("username", { username: values.username.trim() })}
          >
            <Form.Item label="Current username">
              <Input value={profile?.username || ""} readOnly />
            </Form.Item>
            <Form.Item
              label="New username"
              name="username"
              rules={[
                { required: true, message: "Enter a new username." },
                { min: 3, max: 20, message: "Username must be 3 to 20 characters." },
                { pattern: /^[a-zA-Z0-9_]+$/, message: "Use letters, numbers, and underscores only." },
                {
                  validator: (_, value) => value && value === profile?.username
                    ? Promise.reject(new Error("Enter a username different from your current one."))
                    : Promise.resolve(),
                },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Enter new username" autoComplete="username" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>Update username</Button>
          </Form>
        </div>
      ),
    },
    {
      key: "email",
      label: <span className="staff-profile-tab"><MailOutlined /> Email</span>,
      children: (
        <div className="staff-profile-form-panel">
          <Alert
            showIcon
            type="info"
            message="Verify this change by email"
            description="A code will be sent to your current email address before your email is changed."
          />
          <Form
            form={emailForm}
            layout="vertical"
            onFinish={(values) => requestCredentialChange("email", { email: values.email.trim() })}
          >
            <Form.Item label="Current email">
              <Input value={profile?.email || ""} readOnly />
            </Form.Item>
            <Form.Item
              label="New email address"
              name="email"
              rules={[
                { required: true, message: "Enter a new email address." },
                { type: "email", message: "Enter a valid email address." },
                {
                  validator: (_, value) => value && value.toLowerCase() === profile?.email?.toLowerCase()
                    ? Promise.reject(new Error("Enter an email different from your current one."))
                    : Promise.resolve(),
                },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="name@example.com" autoComplete="email" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>Update email</Button>
          </Form>
        </div>
      ),
    },
    {
      key: "password",
      label: <span className="staff-profile-tab"><LockOutlined /> Password</span>,
      children: (
        <div className="staff-profile-form-panel">
          <Alert
            showIcon
            type="warning"
            message="Keep your account secure"
            description="You will need your current password and an email verification code to complete this change."
          />
          <Form form={passwordForm} layout="vertical" onFinish={handlePasswordSubmit}>
            <Form.Item
              label="Current password"
              name="current_password"
              rules={[{ required: true, message: "Enter your current password." }]}
            >
              <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
            </Form.Item>
            <Form.Item
              label="New password"
              name="new_password"
              rules={[{ required: true, message: "Enter a new password." }]}
            >
              <Input.Password
                prefix={<SafetyCertificateOutlined />}
                autoComplete="new-password"
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </Form.Item>
            <div className="staff-profile-password-checklist" aria-live="polite">
              <div className="staff-profile-password-checklist-heading">
                <strong>Password must contain:</strong>
                <span className={metPasswordRequirements === passwordRequirements.length ? "is-complete" : ""}>
                  {metPasswordRequirements}/{passwordRequirements.length}
                </span>
              </div>
              <ul>
                {passwordRequirements.map((requirement) => (
                  <li className={requirement.met ? "is-met" : ""} key={requirement.label}>
                    <span className="staff-profile-password-check-icon">
                      {requirement.met && <CheckOutlined />}
                    </span>
                    {requirement.label}
                  </li>
                ))}
              </ul>
              <div
                className="staff-profile-password-progress"
                role="progressbar"
                aria-label="Password requirements met"
                aria-valuemin={0}
                aria-valuemax={passwordRequirements.length}
                aria-valuenow={metPasswordRequirements}
              >
                <span style={{ width: `${(metPasswordRequirements / passwordRequirements.length) * 100}%` }} />
              </div>
            </div>
            <Form.Item
              label="Confirm new password"
              name="confirm_password"
              dependencies={["new_password"]}
              rules={[
                { required: true, message: "Confirm your new password." },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || value === getFieldValue("new_password")) return Promise.resolve();
                    return Promise.reject(new Error("The new passwords do not match."));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<SafetyCertificateOutlined />} autoComplete="new-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>Update password</Button>
          </Form>
        </div>
      ),
    },
  ];

  return (
    <div className="staff-profile-page">
      <div className="staff-profile-heading">
        <div>
          <Text className="staff-profile-eyebrow">
            <SafetyCertificateOutlined />
            ACCOUNT SETTINGS
          </Text>
          <Title level={2}>Account profile</Title>
          <Text className="staff-profile-description">Manage your sign-in information and keep your account secure.</Text>
        </div>
        <Tag color="success" icon={<CheckCircleOutlined />}>Account active</Tag>
      </div>

      <div className="staff-profile-grid">
        <Card className="staff-profile-summary" loading={loading}>
          <Text className="staff-profile-card-eyebrow">PROFILE OVERVIEW</Text>
          <div className="staff-profile-identity">
            <Avatar size={68} icon={<UserOutlined />} />
            <div className="staff-profile-identity-copy">
              <Title level={4}>{profile?.username || "Staff account"}</Title>
              <Text>{profile?.email || " "}</Text>
              {profile?.role && <Tag color="blue">{profile.role}</Tag>}
            </div>
          </div>
          <div className="staff-profile-account-details">
            <div>
              <span><SafetyCertificateOutlined /> Account status</span>
              <strong>Active</strong>
            </div>
            <div>
              <span><ClockCircleOutlined /> Member since</span>
              <strong>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</strong>
            </div>
            <div>
              <span><ClockCircleOutlined /> Last profile update</span>
              <strong>{profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : "—"}</strong>
            </div>
          </div>
        </Card>

        <Card className="staff-profile-settings" loading={loading}>
          <div className="staff-profile-settings-heading">
            <div>
              <Title level={4}>Sign-in details</Title>
              <Text>Changes are confirmed using a one-time code sent to your current email.</Text>
            </div>
            <Tag icon={<SafetyCertificateOutlined />}>Email verification</Tag>
          </div>
          <Tabs items={tabs} />
        </Card>
      </div>

      <Modal
        className="staff-profile-otp-modal"
        title="Verify account change"
        open={otpVisible}
        onCancel={closeOtpModal}
        onOk={verifyCredentialChange}
        okText="Verify and update"
        confirmLoading={saving}
        okButtonProps={{ disabled: otp.length !== 6 }}
        maskClosable={!saving}
        closable={!saving}
      >
        <Space direction="vertical" size={16} className="staff-profile-otp-content">
          <Text>Enter the 6-digit code sent to your current email address.</Text>
          <Input
            size="large"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            placeholder="000000"
            className="staff-profile-otp-input"
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            onPressEnter={verifyCredentialChange}
          />
          <Button
            type="link"
            disabled={countdown > 0 || saving}
            onClick={() => pendingChange && requestCredentialChange(pendingChange.type, pendingChange.changes)}
          >
            {countdown > 0 ? `Resend code in ${countdown}s` : "Resend verification code"}
          </Button>
        </Space>
      </Modal>
    </div>
  );
};

export default StaffProfile;
