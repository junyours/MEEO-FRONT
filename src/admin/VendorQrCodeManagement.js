import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  message,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  DownloadOutlined,
  QrcodeOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import api from '../Api';
import './VendorQrCodeManagement.css';

const { Text, Title } = Typography;

const getVendorName = (vendor) => (
  [vendor?.first_name, vendor?.middle_name, vendor?.last_name]
    .filter(Boolean)
    .join(' ')
);

const getQrCode = (vendor) => vendor?.qr_code || vendor?.qrCode || null;

const getRentalLocation = (rental) => {
  const stall = rental?.stall;
  const section = stall?.section;
  const areaName = section?.area?.name;
  return [areaName, section?.name].filter(Boolean).join(' / ');
};

const VendorQrCodeManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [previewVendorId, setPreviewVendorId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingVendorId, setGeneratingVendorId] = useState(null);
  const [qrPng, setQrPng] = useState('');

  const fetchVendors = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await api.get('/vendor-qr-codes');
      if (!Array.isArray(response.data)) {
        throw new Error('Unexpected vendor data returned by the server.');
      }

      setVendors(response.data);
      setSelectedVendorId((currentId) => (
        response.data.some((vendor) => vendor.id === currentId)
          ? currentId
          : response.data[0]?.id ?? null
      ));
    } catch (error) {
      message.error(error.response?.data?.message || error.message || 'Failed to load vendor rentals.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const filteredVendors = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return vendors;

    return vendors.filter((vendor) => {
      const vendorName = getVendorName(vendor).toLowerCase();
      const contact = String(vendor.contact_number || '').toLowerCase();
      const stallNumbers = (vendor.rented || [])
        .map((rental) => String(rental.stall?.stall_number || '').toLowerCase())
        .join(' ');
      return vendorName.includes(query) || contact.includes(query) || stallNumbers.includes(query);
    });
  }, [vendors, searchText]);

  const previewVendor = vendors.find((vendor) => vendor.id === previewVendorId) || null;
  const selectedQrCode = getQrCode(previewVendor);
  const selectedToken = selectedQrCode?.qr_token || '';

  useEffect(() => {
    let isCurrent = true;

    if (!selectedToken) {
      setQrPng('');
      return () => {
        isCurrent = false;
      };
    }

    QRCode.toDataURL(selectedToken, {
      errorCorrectionLevel: 'H',
      margin: 3,
      width: 320,
      color: { dark: '#102a43', light: '#ffffff' },
    })
      .then((dataUrl) => {
        if (isCurrent) setQrPng(dataUrl);
      })
      .catch((error) => {
        if (isCurrent) {
          setQrPng('');
          message.error(`Could not render the QR code: ${error.message}`);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedToken]);

  const handleGenerate = async (vendor) => {
    setSelectedVendorId(vendor.id);
    setGeneratingVendorId(vendor.id);

    try {
      const response = await api.post(`/vendor-qr-codes/${vendor.id}/generate`);
      const qrCode = response.data?.qr_code;
      if (!qrCode?.qr_token) {
        throw new Error('The server did not return a QR token.');
      }

      setVendors((currentVendors) => currentVendors.map((item) => (
        item.id === vendor.id
          ? { ...item, qr_code: qrCode }
          : item
      )));
      message.success(`Vendor QR code ready for ${getVendorName(vendor)}.`);
    } catch (error) {
      message.error(error.response?.data?.message || error.message || 'Failed to generate the QR code.');
    } finally {
      setGeneratingVendorId(null);
    }
  };

  const getFileName = (extension) => {
    const vendorSlug = getVendorName(previewVendor)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'vendor';
    return `${vendorSlug}-vendor-qr.${extension}`;
  };

  const downloadBrandedQr = (format, extension) => {
    if (!qrPng) return;

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const padding = 32;
      const qrSize = 320;
      const nameMaxWidth = canvas.width = qrSize + padding * 2;
      const context = canvas.getContext('2d');

      if (!context) {
        message.error('Your browser could not prepare the QR download.');
        return;
      }

      const vendorName = getVendorName(previewVendor) || 'Vendor';
      context.font = '600 22px Arial, sans-serif';
      const words = vendorName.split(/\s+/);
      const nameLines = [];
      let currentLine = '';

      words.forEach((word) => {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        if (context.measureText(candidate).width <= nameMaxWidth) {
          currentLine = candidate;
        } else {
          if (currentLine) nameLines.push(currentLine);
          currentLine = word;
        }
      });
      if (currentLine) nameLines.push(currentLine);

      const lineHeight = 28;
      const headingHeight = nameLines.length * lineHeight;
      canvas.width = nameMaxWidth;
      canvas.height = padding + headingHeight + 20 + qrSize + padding;

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#102a43';
      context.font = '600 22px Arial, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'top';
      nameLines.forEach((line, index) => {
        context.fillText(line, canvas.width / 2, padding + index * lineHeight);
      });
      context.drawImage(image, padding, padding + headingHeight + 20, qrSize, qrSize);

      try {
        const anchor = document.createElement('a');
        anchor.href = canvas.toDataURL(format, 0.96);
        anchor.download = getFileName(extension);
        anchor.click();
      } catch (error) {
        message.error(`Could not create the ${extension.toUpperCase()} download: ${error.message}`);
      }
    };
    image.onerror = () => message.error('Could not prepare the QR image for download.');
    image.src = qrPng;
  };

  const columns = [
    {
      title: 'Vendor',
      key: 'vendor',
      render: (_, vendor) => (
        <div className="vendor-qr-vendor">
          <span className="vendor-qr-avatar"><UserOutlined /></span>
          <span>
            <Text strong>{getVendorName(vendor) || 'Unnamed vendor'}</Text>
            <Text type="secondary" className="vendor-qr-contact">
              {vendor.contact_number || 'No contact number'}
            </Text>
          </span>
        </div>
      ),
    },
    {
      title: 'Current stalls',
      key: 'stalls',
      render: (_, vendor) => (
        <Space wrap>
          {(vendor.rented || []).map((rental) => (
            <Tag key={rental.id} icon={<ShopOutlined />}>
              {rental.stall?.stall_number || '—'}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'QR status',
      key: 'qr_status',
      render: (_, vendor) => (
        getQrCode(vendor)?.qr_token
          ? <Tag color="green">Generated</Tag>
          : <Tag>Not generated</Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, vendor) => (
        <Button
          type={getQrCode(vendor)?.qr_token ? 'default' : 'primary'}
          icon={<QrcodeOutlined />}
          loading={generatingVendorId === vendor.id}
          onClick={() => {
            setSelectedVendorId(vendor.id);
            if (getQrCode(vendor)?.qr_token) {
              setPreviewVendorId(vendor.id);
            } else {
              handleGenerate(vendor);
            }
          }}
        >
          {getQrCode(vendor)?.qr_token ? 'View QR' : 'Generate'}
        </Button>
      ),
    },
  ];

  return (
    <main className="vendor-qr-page">
      <header className="vendor-qr-heading">
        <div className="vendor-qr-heading-copy">
          <Text className="vendor-qr-eyebrow">VENDOR TOOLS</Text>
          <Title level={2}>Vendor QR Codes</Title>
          <Text type="secondary">Create and download a unique QR code for each vendor.</Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          loading={refreshing}
          onClick={() => fetchVendors(false)}
        >
          Refresh
        </Button>
      </header>

      <Alert
        className="vendor-qr-note"
        type="info"
        showIcon
        message="Each vendor has one QR code, even when they rent stalls in different sections. The code is linked to the vendor, not a specific stall."
      />

      <div className="vendor-qr-layout">
        <Card className="vendor-qr-list-card" bordered={false}>
          <div className="vendor-qr-list-heading">
            <div>
              <Title level={4}>Vendors with active rentals</Title>
              <Text type="secondary">{vendors.length} vendor{vendors.length === 1 ? '' : 's'}</Text>
            </div>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search vendor, contact, or stall"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="vendor-qr-search"
            />
          </div>

          <Spin spinning={loading}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={filteredVendors}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={vendors.length ? 'No vendors match your search.' : 'No vendors with current rented stalls found.'}
                  />
                ),
              }}
              onRow={(vendor) => ({
                onClick: () => setSelectedVendorId(vendor.id),
                className: vendor.id === selectedVendorId ? 'vendor-qr-selected-row' : '',
              })}
            />
          </Spin>
        </Card>

        <Card className="vendor-qr-preview-card" bordered={false}>
          {previewVendor ? (
            <>
              <div className="vendor-qr-preview-heading">
                <span className="vendor-qr-preview-icon"><QrcodeOutlined /></span>
                <div>
                  <Title level={4}>Vendor QR preview</Title>
                  <Text type="secondary">{getVendorName(previewVendor) || 'Unnamed vendor'}</Text>
                </div>
              </div>

              {selectedToken && qrPng ? (
                <>
                  <div className="vendor-qr-image-frame">
                    <img src={qrPng} alt={`QR code for ${getVendorName(previewVendor)}`} />
                  </div>
                  <div className="vendor-qr-stalls">
                    <Text strong>Current stalls</Text>
                    {(previewVendor.rented || []).map((rental) => (
                      <div className="vendor-qr-stall-item" key={rental.id}>
                        <ShopOutlined />
                        <span>
                          <Text strong>Stall {rental.stall?.stall_number || '—'}</Text>
                          <Text type="secondary">{getRentalLocation(rental) || 'Section not set'}</Text>
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="vendor-qr-downloads">
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={() => downloadBrandedQr('image/png', 'png')}
                    >
                      Download PNG
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={() => downloadBrandedQr('image/jpeg', 'jpg')}>
                      Download JPG
                    </Button>
                  </div>
                </>
              ) : (
                <div className="vendor-qr-empty">
                  <Empty
                    image={<QrcodeOutlined />}
                    description="This vendor QR code is not available. Generate it from the vendor list."
                  />
                </div>
              )}
            </>
          ) : (
            <Empty
              image={<QrcodeOutlined />}
              description={
                loading
                  ? 'Loading vendors…'
                  : 'Select “View QR” on a vendor to preview and download their QR code.'
              }
            />
          )}
        </Card>
      </div>
    </main>
  );
};

export default VendorQrCodeManagement;
