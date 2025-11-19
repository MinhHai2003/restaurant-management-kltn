import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './table.css';

const TableQRGenerator: React.FC = () => {
  const [tableNumber, setTableNumber] = useState('');
  const [generatedQR, setGeneratedQR] = useState('');

  const generateQRCode = () => {
    if (!tableNumber.trim()) {
      alert('Vui lòng nhập số bàn!');
      return;
    }

    // Use production URL or current origin
    const baseUrl = import.meta.env.PROD 
      ? 'https://my-restaurant-app-six.vercel.app'
      : window.location.origin;
    
    const qrUrl = `${baseUrl}/table/${tableNumber.trim()}`;
    console.log('🔗 Generated QR URL:', qrUrl);
    setGeneratedQR(qrUrl);
  };

  const downloadQR = () => {
    const svg = document.getElementById('table-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Increase canvas size for better quality
    canvas.width = 1024;
    canvas.height = 1024;

    img.onload = () => {
      // Fill with white background
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `table-${tableNumber}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
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
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '700px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
          color: 'white'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
          }}>
            🍽️
          </div>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 2.8rem)',
            fontWeight: 'bold',
            marginBottom: '12px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
          }}>
            Table QR Code Generator
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 3vw, 1.2rem)',
            opacity: 0.95,
            textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            Tạo mã QR cho bàn ăn để khách hàng có thể đặt món trực tiếp
          </p>
        </div>

        {/* Main Card */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: 'clamp(24px, 5vw, 40px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              fontSize: '18px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '12px'
            }}>
              📋 Số bàn:
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="VD: 01, A1, VIP-01..."
                style={{
                  flex: '1 1 200px',
                  padding: '16px 20px',
                  border: '2px solid #e0e7ff',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  background: '#f8fafc'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.1)';
                  e.target.style.background = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e7ff';
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = '#f8fafc';
                }}
              />
              <button
                onClick={generateQRCode}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(102,126,234,0.4)',
                  flex: '0 0 auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102,126,234,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102,126,234,0.4)';
                }}
              >
                ✨ Tạo QR
              </button>
            </div>
          </div>

          {generatedQR && (
            <div style={{
              textAlign: 'center',
              padding: 'clamp(24px, 5vw, 40px)',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '20px',
              border: '3px dashed #667eea',
              animation: 'fadeIn 0.5s ease-in'
            }}>
              <h3 style={{
                fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 'bold',
                marginBottom: '20px'
              }}>
                🎯 QR Code - Bàn {tableNumber}
              </h3>
              
              <div style={{
                display: 'inline-block',
                padding: '24px',
                background: 'white',
                borderRadius: '20px',
                boxShadow: '0 8px 24px rgba(102,126,234,0.2)',
                marginBottom: '28px',
                border: '4px solid #e0e7ff'
              }}>
                <QRCodeSVG
                  id="table-qr-code"
                  value={generatedQR}
                  size={Math.min(280, window.innerWidth - 120)}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: "",
                    height: 24,
                    width: 24,
                    excavate: true,
                  }}
                />
              </div>

              <div style={{
                fontSize: '14px',
                color: '#475569',
                marginBottom: '28px',
                lineHeight: '1.6',
                padding: '16px',
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e0e7ff'
              }}>
                <div style={{ 
                  fontWeight: '700', 
                  marginBottom: '12px',
                  color: '#1e293b',
                  fontSize: '15px'
                }}>
                  📱 URL QR Code:
                </div>
                <a 
                  href={generatedQR} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ 
                    color: '#667eea',
                    fontWeight: '600',
                    textDecoration: 'none',
                    wordBreak: 'break-all',
                    display: 'block',
                    marginBottom: '12px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  {generatedQR}
                </a>
                <div style={{ 
                  color: '#64748b',
                  fontSize: '13px',
                  fontStyle: 'italic'
                }}>
                  💡 Khách hàng quét mã này để truy cập menu và đặt món trực tiếp từ bàn
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px'
              }}>
                <button
                  onClick={downloadQR}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '14px 20px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.3)';
                  }}
                >
                  📥 Tải PNG
                </button>
                
                <button
                  onClick={printQR}
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '14px 20px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(139,92,246,0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(139,92,246,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,92,246,0.3)';
                  }}
                >
                  🖨️ In QR
                </button>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedQR);
                    alert('✅ Đã copy URL vào clipboard!');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '14px 20px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(245,158,11,0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(245,158,11,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.3)';
                  }}
                >
                  📋 Copy URL
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div style={{
          marginTop: '32px',
          padding: '24px',
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.3)',
          color: 'white'
        }}>
          <h4 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            💡 Gợi ý sử dụng
          </h4>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <li style={{ display: 'flex', gap: '12px' }}>
              <span>✓</span>
              <span>In QR code và đặt trên mỗi bàn để khách tự đặt món</span>
            </li>
            <li style={{ display: 'flex', gap: '12px' }}>
              <span>✓</span>
              <span>Sử dụng số bàn rõ ràng như: 01, 02, A1, VIP-01...</span>
            </li>
            <li style={{ display: 'flex', gap: '12px' }}>
              <span>✓</span>
              <span>Tải về PNG để in với chất lượng cao nhất</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TableQRGenerator;