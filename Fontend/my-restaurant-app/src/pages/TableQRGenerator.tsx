import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const TableQRGenerator: React.FC = () => {
  const [tableNumber, setTableNumber] = useState('');
  const [generatedQR, setGeneratedQR] = useState('');

  const generateQRCode = () => {
    if (!tableNumber.trim()) {
      alert('Vui lòng nhập số bàn!');
      return;
    }

    const qrUrl = `${window.location.origin}/table/${tableNumber.trim()}`;
    setGeneratedQR(qrUrl);
  };

  const downloadQR = () => {
    const svg = document.getElementById('table-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 300;
    canvas.height = 300;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `table-${tableNumber}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - Bàn ${tableNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
            }
            .qr-container {
              border: 2px dashed #ccc;
              padding: 30px;
              margin: 20px auto;
              width: fit-content;
            }
            h1 { color: #333; margin-bottom: 10px; }
            .table-info { font-size: 18px; color: #666; margin: 10px 0; }
            .instructions { font-size: 14px; color: #888; margin-top: 20px; max-width: 300px; margin-left: auto; margin-right: auto; }
          </style>
        </head>
        <body>
          <h1>🍽️ RESTAURANT QR MENU</h1>
          <div class="table-info">BÀN SỐ ${tableNumber}</div>
          <div class="qr-container">
            ${document.getElementById('table-qr-code')?.outerHTML || ''}
          </div>
          <div class="instructions">
            📱 Quét mã QR này để xem menu và đặt món trực tiếp từ bàn
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{
          fontSize: '28px',
          color: '#333',
          marginBottom: '8px'
        }}>
          🍽️ Table QR Code Generator
        </h1>
        <p style={{
          color: '#666',
          fontSize: '16px'
        }}>
          Tạo mã QR cho bàn ăn để khách hàng có thể đặt món trực tiếp
        </p>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: '32px'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '16px',
            fontWeight: '600',
            color: '#333',
            marginBottom: '8px'
          }}>
            Số bàn:
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="VD: 01, A1, VIP-01..."
              style={{
                flex: 1,
                padding: '14px 16px',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
            <button
              onClick={generateQRCode}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: 'white',
                border: 'none',
                padding: '14px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Tạo QR
            </button>
          </div>
        </div>

        {generatedQR && (
          <div style={{
            textAlign: 'center',
            padding: '32px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '2px dashed #cbd5e1'
          }}>
            <h3 style={{
              fontSize: '20px',
              color: '#333',
              marginBottom: '16px'
            }}>
              🎯 QR Code - Bàn {tableNumber}
            </h3>
            
            <div style={{
              display: 'inline-block',
              padding: '20px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '24px'
            }}>
              <QRCodeSVG
                id="table-qr-code"
                value={generatedQR}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>

            <div style={{
              fontSize: '14px',
              color: '#64748b',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                📱 URL: <a href={generatedQR} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                  {generatedQR}
                </a>
              </div>
              <div>
                Khách hàng quét mã này để truy cập menu và đặt món trực tiếp từ bàn
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={downloadQR}
                style={{
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📥 Tải xuống PNG
              </button>
              
              <button
                onClick={printQR}
                style={{
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🖨️ In QR Code
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedQR);
                  alert('Đã copy URL vào clipboard!');
                }}
                style={{
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📋 Copy URL
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Test Links */}
      <div style={{
        background: '#fff7ed',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #fed7aa'
      }}>
        <h3 style={{
          fontSize: '18px',
          color: '#ea580c',
          marginBottom: '16px'
        }}>
          🧪 Test Links
        </h3>
        <div style={{
          display: 'grid',
          gap: '12px',
          fontSize: '14px'
        }}>
          <div>
            <strong>Bàn 01:</strong>{' '}
            <a href="/table/01" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
              /table/01
            </a>
          </div>
          <div>
            <strong>Bàn A1:</strong>{' '}
            <a href="/table/A1" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
              /table/A1
            </a>
          </div>
          <div>
            <strong>Bàn VIP-01:</strong>{' '}
            <a href="/table/VIP-01" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
              /table/VIP-01
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableQRGenerator;