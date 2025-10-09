import React, { useState, useEffect, useCallback } from 'react';

interface QRPaymentProps {
  amount: number;
  orderCode?: string;
  orderInfo?: string;
  onPaymentSuccess?: (paymentData: any) => void;
  onPaymentComplete?: () => void;
  onClose?: () => void;
}

const QRPayment: React.FC<QRPaymentProps> = ({ 
  amount, 
  orderCode, 
  orderInfo,
  onPaymentSuccess, 
  onPaymentComplete,
  onClose 
}) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [countdown, setCountdown] = useState(300); // 5 minutes
  
  // Thông tin ngân hàng
  const bankInfo = {
    bankName: 'Vietinbank',
    accountNumber: '106875077043',
    accountName: 'VONG VINH LOI',
    bankCode: 'ICB'  // VietinBank = ICB trong VietQR
  };

  const generateQRCode = useCallback(() => {
    // Tạo nội dung chuyển khoản với mã đơn hàng
    const transferContent = `DAT MON ${orderCode || Date.now()}`;
    
    console.log('🔍 [QR Payment] Generating QR with amount:', amount);
    console.log('🔍 [QR Payment] Order code:', orderCode);
    console.log('🔍 [QR Payment] Transfer content:', transferContent);
    
    // Tạo QR theo chuẩn VietQR
    // Format: https://img.vietqr.io/image/[BANK_CODE]-[ACCOUNT_NUMBER]-[TEMPLATE].jpg?amount=[AMOUNT]&addInfo=[CONTENT]&accountName=[ACCOUNT_NAME]
    const vietQRUrl = `https://img.vietqr.io/image/${bankInfo.bankCode}-${bankInfo.accountNumber}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankInfo.accountName)}`;
    
    console.log('🔍 [QR Payment] Generated QR URL:', vietQRUrl);
    
    setQrCode(vietQRUrl);
  }, [amount, orderCode, bankInfo.bankCode, bankInfo.accountNumber, bankInfo.accountName]);

  useEffect(() => {
    generateQRCode();
    
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [amount, orderCode, generateQRCode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const handlePaymentConfirm = async () => {
    // Gọi callback ngay lập tức khi người dùng xác nhận thanh toán
    console.log('🎯 [QR Payment] User confirmed payment');
    
    if (onPaymentSuccess) {
      try {
        await onPaymentSuccess({
          amount,
          method: 'bank_transfer',
          transactionId: `TXN${Date.now()}`,
          timestamp: new Date().toISOString(),
          orderCode
        });
        console.log('✅ [QR Payment] Payment processing completed');
      } catch (error) {
        console.error('❌ [QR Payment] Payment processing failed:', error);
        alert('Có lỗi xảy ra khi xử lý đơn hàng. Vui lòng thử lại!');
        return;
      }
    }
    
    // Hiển thị trạng thái thành công
    setPaymentStatus('success');
  };

  if (paymentStatus === 'success') {
    // Tự động đóng modal sau 2 giây
    setTimeout(() => {
      onClose?.();
    }, 2000);
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h3 style={{ color: '#059669', marginBottom: '16px' }}>
            Đang xử lý đơn hàng...
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            Cảm ơn bạn đã thanh toán. Đơn hàng đang được xử lý.
          </p>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #059669',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '480px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '16px'
        }}>
          <h3 style={{ margin: 0, color: '#1f2937' }}>
            💳 Thanh toán chuyển khoản
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        {/* Countdown */}
        <div style={{
          background: countdown < 60 ? '#fef2f2' : '#f0f9ff',
          border: `1px solid ${countdown < 60 ? '#fecaca' : '#bae6fd'}`,
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <div style={{ 
            color: countdown < 60 ? '#dc2626' : '#0369a1',
            fontWeight: '600'
          }}>
            ⏰ Thời gian còn lại: {formatTime(countdown)}
          </div>
          {countdown < 60 && (
            <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
              QR code sắp hết hạn!
            </div>
          )}
        </div>

        {/* Amount */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
            Số tiền cần thanh toán
          </div>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#dc2626'
          }}>
            {formatAmount(amount)} VNĐ
          </div>
        </div>

        {/* QR Code */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-block',
            padding: '16px',
            background: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '12px'
          }}>
            {qrCode ? (
              <img 
                src={qrCode} 
                alt="QR Code Payment" 
                style={{ width: '280px', height: '280px' }}
                onError={(e) => {
                  console.error('❌ [QR Payment] Failed to load QR:', qrCode);
                }}
                onLoad={() => {
                  console.log('✅ [QR Payment] QR loaded successfully');
                }}
              />
            ) : (
              <div style={{
                width: '280px',
                height: '280px',
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280'
              }}>
                Đang tạo mã QR...
              </div>
            )}
          </div>
        </div>

        {/* Bank Info */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#1f2937' }}>
            📋 Thông tin chuyển khoản
          </h4>
          <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Ngân hàng:</span>
              <span style={{ fontWeight: '600' }}>{bankInfo.bankName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Số tài khoản:</span>
              <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>
                {bankInfo.accountNumber}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Chủ tài khoản:</span>
              <span style={{ fontWeight: '600' }}>{bankInfo.accountName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Nội dung:</span>
              <span style={{ fontWeight: '600', fontSize: '12px' }}>
                DAT MON {orderCode || Date.now()}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fed7aa',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#92400e' }}>
            📱 Hướng dẫn thanh toán
          </h4>
          <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#92400e' }}>
            <li>Mở ứng dụng ngân hàng trên điện thoại</li>
            <li>Quét mã QR hoặc nhập thông tin chuyển khoản</li>
            <li>Kiểm tra thông tin và xác nhận chuyển khoản</li>
            <li>Nhấn "Đã thanh toán" khi hoàn thành</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Hủy
          </button>
          <button
            onClick={handlePaymentConfirm}
            disabled={countdown === 0}
            style={{
              flex: 2,
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              background: countdown === 0 ? '#d1d5db' : '#059669',
              color: 'white',
              cursor: countdown === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            ✅ Đã thanh toán
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRPayment;