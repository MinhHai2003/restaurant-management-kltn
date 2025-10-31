/**
 * Casso Payment Component
 * Tích hợp thanh toán chuyển khoản tự động qua Casso.vn
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface CassoPaymentProps {
  orderNumber: string;
  amount: number;
  onPaymentConfirmed?: (transaction: any) => void;
  onClose?: () => void;
}

interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  transferContent: string;
  instruction: string;
}

const CassoPayment: React.FC<CassoPaymentProps> = ({ 
  orderNumber,
  amount,
  onPaymentConfirmed,
  onClose 
}) => {
  const [loading, setLoading] = useState(true);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [error, _setError] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'confirmed'>('pending');
  const [countdown, setCountdown] = useState(600); // 10 minutes
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [autoCheckCountdown, setAutoCheckCountdown] = useState(30); // 30 seconds before auto-check

  // Fetch payment instructions from backend
  const fetchPaymentInstructions = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 [Casso Payment] Fetching payment instructions for order:', orderNumber);
      
      const orderApiUrl = (import.meta as any).env?.VITE_ORDER_API || 'http://localhost:5005/api';
      const response = await axios.get(
        `${orderApiUrl}/casso/payment-instructions/${orderNumber}`
      );

      console.log('📋 [Casso Payment] API Response:', response.data);

      if (response.data.success) {
        setBankInfo(response.data.data.payment);
        console.log('✅ [Casso Payment] Bank info set:', response.data.data.payment);
      } else {
        console.warn('⚠️ [Casso Payment] API returned error:', response.data.message);
        console.log('🔄 [Casso Payment] Using fallback bank info instead');
        // Không set error, sử dụng fallback data
      }
    } catch (err: any) {
      console.warn('⚠️ [Casso Payment] Error fetching payment instructions:', err);
      console.log('🔄 [Casso Payment] Using fallback bank info instead');
      // Không set error, sử dụng fallback data
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  // Check payment status
  const checkPaymentStatus = useCallback(async () => {
    // Không check nếu đã confirmed
    if (paymentStatus === 'confirmed') {
      console.log('🔄 [Casso Payment] Payment already confirmed, skipping check');
      return;
    }
    
    try {
      console.log('🔄 [Casso Payment] Starting payment status check...');
      console.log('🔄 [Casso Payment] Order number:', orderNumber);
      console.log('🔄 [Casso Payment] Current payment status:', paymentStatus);
      
      const orderApiUrl = (import.meta as any).env?.VITE_ORDER_API || 'http://localhost:5005/api';
      const response = await axios.get(
        `${orderApiUrl}/casso/payment-status/${orderNumber}`
      );

      console.log('🔍 [Casso Payment] API Response:', response.data);
      console.log('🔍 [Casso Payment] Response status:', response.status);
      console.log('🔍 [Casso Payment] Response success:', response.data.success);
      console.log('🔍 [Casso Payment] Payment data:', response.data.data);

      if (response.data.success && response.data.data.paid) {
        console.log('✅ [Casso Payment] Payment confirmed!');
        console.log('✅ [Casso Payment] Transaction details:', response.data.data.transaction);
        
        // Clear interval ngay lập tức
        if (checkInterval) {
          console.log('🔄 [Casso Payment] Clearing check interval');
          clearInterval(checkInterval);
          setCheckInterval(null);
        }
        
        setPaymentStatus('confirmed');
        
        // Notify parent component
        if (onPaymentConfirmed) {
          console.log('🔄 [Casso Payment] Notifying parent component');
          onPaymentConfirmed(response.data.data.transaction);
        }

        // Auto close after 3 seconds
        setTimeout(() => {
          console.log('🔄 [Casso Payment] Auto closing modal');
          onClose?.();
        }, 3000);
      } else {
        console.log('⏳ [Casso Payment] Payment still pending');
        console.log('⏳ [Casso Payment] Paid status:', response.data.data?.paid);
        console.log('⏳ [Casso Payment] Payment status:', response.data.data?.paymentStatus);
        console.log('⏳ [Casso Payment] Full response data:', JSON.stringify(response.data, null, 2));
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: any; status?: number } };
      console.error('❌ [Casso Payment] Error checking payment status:', err);
      console.error('❌ [Casso Payment] Error response:', error.response?.data);
      console.error('❌ [Casso Payment] Error status:', error.response?.status);
      // Không set error, chỉ log warning
    }
  }, [orderNumber, checkInterval, onPaymentConfirmed, onClose, paymentStatus]);

  useEffect(() => {
    fetchPaymentInstructions();
    
    // Cleanup function
    return () => {
      if (checkInterval) {
        console.log('🔄 [Casso Payment] Component unmounting, clearing interval');
        clearInterval(checkInterval);
      }
    };
  }, [fetchPaymentInstructions, checkInterval]);

  useEffect(() => {
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
  }, []);

  // Auto check countdown timer
  useEffect(() => {
    console.log('🔄 [Casso Payment] Auto-check effect triggered');
    console.log('🔄 [Casso Payment] Auto-check countdown:', autoCheckCountdown);
    console.log('🔄 [Casso Payment] Payment status:', paymentStatus);
    console.log('🔄 [Casso Payment] Check interval exists:', !!checkInterval);
    
    if (autoCheckCountdown > 0 && paymentStatus === 'pending') {
      console.log('🔄 [Casso Payment] Starting countdown timer...');
      
      const timer = setInterval(() => {
        setAutoCheckCountdown(prev => {
          console.log('🔄 [Casso Payment] Countdown:', prev);
          
          if (prev <= 1) {
            console.log('🔄 [Casso Payment] Countdown finished, starting auto-check...');
            
            // Bắt đầu auto-check sau khi countdown kết thúc
            const interval = setInterval(() => {
              console.log('🔄 [Casso Payment] Auto-checking payment status...');
              checkPaymentStatus();
            }, 5000); // Check every 5 seconds
            
            setCheckInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        console.log('🔄 [Casso Payment] Clearing countdown timer');
        clearInterval(timer);
      };
    } else if (autoCheckCountdown === 0 && paymentStatus === 'pending' && !checkInterval) {
      console.log('🔄 [Casso Payment] Countdown already finished, starting auto-check immediately...');
      
      // Nếu countdown đã kết thúc nhưng chưa có interval, bắt đầu ngay
      const interval = setInterval(() => {
        console.log('🔄 [Casso Payment] Auto-checking payment status (immediate)...');
        checkPaymentStatus();
      }, 5000);
      
      setCheckInterval(interval);
    }
  }, [autoCheckCountdown, paymentStatus, checkPaymentStatus, checkInterval]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã sao chép!');
  };

  const handleManualCheck = () => {
    console.log('🔄 [Casso Payment] Manual check button clicked');
    console.log('🔄 [Casso Payment] Setting status to checking');
    setPaymentStatus('checking');
    console.log('🔄 [Casso Payment] Calling checkPaymentStatus...');
    checkPaymentStatus();
  };


  // Generate QR Code using VietQR API (copy từ QRPayment.tsx)
  const generateQRCode = () => {
    // Thông tin ngân hàng (copy chính xác từ QRPayment.tsx)
    const bankInfoData = {
      bankName: 'Vietinbank',
      accountNumber: '106875077043',
      accountName: 'VONG VINH LOI',
      bankCode: 'ICB'  // VietinBank = ICB trong VietQR
    };

    // Luôn sử dụng bankInfoData vì API không trả về đúng thông tin
    const info = bankInfoData;
    
    // Tạo nội dung chuyển khoản với mã đơn hàng
    const transferContent = `DAT MON ${orderNumber}`;
    
    console.log('🔍 [Casso Payment] Generating QR with amount:', amount);
    console.log('🔍 [Casso Payment] Order code:', orderNumber);
    console.log('🔍 [Casso Payment] Transfer content:', transferContent);
    
    // Tạo QR theo chuẩn VietQR (copy chính xác từ QRPayment.tsx)
    // Format: https://img.vietqr.io/image/[BANK_CODE]-[ACCOUNT_NUMBER]-[TEMPLATE].jpg?amount=[AMOUNT]&addInfo=[CONTENT]&accountName=[ACCOUNT_NAME]
    const vietQRUrl = `https://img.vietqr.io/image/${info.bankCode}-${info.accountNumber}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(info.accountName)}`;
    
    console.log('🔍 [Casso Payment] Generated QR URL:', vietQRUrl);
    console.log('🔍 [Casso Payment] Bank info used:', info);
    console.log('🔍 [Casso Payment] Bank code:', info.bankCode);
    console.log('🔍 [Casso Payment] Account number:', info.accountNumber);
    console.log('🔍 [Casso Payment] Account name:', info.accountName);
    console.log('🔍 [Casso Payment] Using hardcoded bank info (API returned invalid data)');
    
    return vietQRUrl;
  };

  if (loading) {
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
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #059669',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p>Đang tải thông tin thanh toán...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h3 style={{ color: '#dc2626', marginBottom: '16px' }}>Lỗi</h3>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              background: '#dc2626',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'confirmed') {
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
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <h3 style={{ color: '#059669', marginBottom: '16px', fontSize: '24px' }}>
            Thanh toán thành công!
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '8px' }}>
            Đơn hàng <strong>{orderNumber}</strong> đã được xác nhận thanh toán.
          </p>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Cảm ơn bạn đã đặt hàng. Đơn hàng đang được xử lý.
          </p>
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
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '16px'
        }}>
          <h3 style={{ margin: 0, color: '#1f2937', fontSize: '20px' }}>
            🏦 Chuyển khoản ngân hàng
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#6b7280',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Order Info */}
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '14px', color: '#0369a1' }}>
            📦 Mã đơn hàng: <strong>{orderNumber}</strong>
          </div>
        </div>

        {/* Countdown */}
        <div style={{
          background: countdown < 60 ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${countdown < 60 ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ 
            color: countdown < 60 ? '#dc2626' : '#059669',
            fontWeight: '600',
            fontSize: '16px'
          }}>
            ⏰ Thời gian còn lại: {formatTime(countdown)}
          </div>
          {countdown < 60 && (
            <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
              Vui lòng hoàn tất thanh toán trước khi hết thời gian!
            </div>
          )}
        </div>

        {/* Auto-check countdown */}
        {autoCheckCountdown > 0 && (
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ 
              color: '#0369a1',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              🔄 Tự động kiểm tra thanh toán sau: {autoCheckCountdown} giây
            </div>
            <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '4px' }}>
              Hoặc click "Kiểm tra thanh toán" để kiểm tra ngay
            </div>
            <div style={{ 
              color: '#666',
              fontSize: '10px',
              marginTop: '4px'
            }}>
              Debug: Status={paymentStatus}, Interval={checkInterval ? 'Active' : 'None'}
            </div>
          </div>
        )}
        
        {/* Debug info when countdown is 0 */}
        {autoCheckCountdown === 0 && paymentStatus === 'pending' && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ 
              color: '#92400e',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              🔄 Auto-check should be running...
            </div>
            <div style={{ 
              color: '#666',
              fontSize: '12px',
              marginTop: '4px'
            }}>
              Debug: Status={paymentStatus}, Interval={checkInterval ? 'Active' : 'None'}, Countdown={autoCheckCountdown}
            </div>
          </div>
        )}

        {/* Amount */}
        <div style={{
          background: '#fef3c7',
          border: '2px solid #fbbf24',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '4px' }}>
            Số tiền cần thanh toán
          </div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#dc2626'
          }}>
            {formatAmount(amount)} VNĐ
          </div>
        </div>

        {/* QR Code */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-block',
            padding: '16px',
            background: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '12px'
          }}>
            <img 
              src={generateQRCode()} 
              alt="QR Code Payment" 
              style={{ width: '280px', height: '280px' }}
              onError={(_e) => {
                console.error('❌ [Casso Payment] Failed to load QR:', generateQRCode());
              }}
              onLoad={() => {
                console.log('✅ [Casso Payment] QR loaded successfully');
              }}
            />
          </div>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
            Quét mã QR bằng ứng dụng ngân hàng để thanh toán
          </p>
        </div>

        {/* Bank Info */}
        {(() => {
          // Use bank info (giống QRPayment.tsx)
          const bankInfoData = {
            bankName: 'Vietinbank',
            accountNumber: '106875077043',
            accountName: 'VONG VINH LOI',
            transferContent: `DAT MON ${orderNumber}`
          };
          
          // Luôn sử dụng bankInfoData vì API không trả về đúng thông tin
          const info = bankInfoData;
          
          return (
            <div style={{
              background: '#f8fafc',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              border: '1px solid #e2e8f0'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#1f2937', fontSize: '16px' }}>
                📋 Thông tin chuyển khoản
              </h4>
              {!bankInfo && (
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '4px',
                  padding: '8px',
                  marginBottom: '12px',
                  fontSize: '12px',
                  color: '#92400e'
                }}>
                  ⚠️ Sử dụng thông tin ngân hàng mặc định
                </div>
              )}
              <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280' }}>Ngân hàng:</span>
                  <span style={{ fontWeight: '600' }}>{info.bankName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280' }}>Số tài khoản:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>
                      {info.accountNumber}
                    </span>
                    <button
                      onClick={() => copyToClipboard(info.accountNumber)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280' }}>Chủ tài khoản:</span>
                  <span style={{ fontWeight: '600' }}>{info.accountName}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: '#fef3c7',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #fbbf24'
                }}>
                  <span style={{ color: '#92400e', fontWeight: '600' }}>Nội dung CK:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', fontFamily: 'monospace', color: '#dc2626' }}>
                      {info.transferContent}
                    </span>
                    <button
                      onClick={() => copyToClipboard(info.transferContent)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Warning */}
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', color: '#dc2626', fontWeight: '600' }}>
            ⚠️ LƯU Ý QUAN TRỌNG:
          </div>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '13px', color: '#991b1b' }}>
            <li>Nhập <strong>ĐÚNG</strong> nội dung chuyển khoản</li>
            <li>Chuyển đúng số tiền <strong>{formatAmount(amount)} VNĐ</strong></li>
            <li>Thanh toán được xác nhận tự động sau 1-3 phút</li>
            <li>Hệ thống sẽ bắt đầu kiểm tra sau 30 giây</li>
            <li>Hoặc click "Kiểm tra thanh toán" để kiểm tra ngay</li>
          </ul>
        </div>

        {/* Instructions */}
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#166534', fontSize: '14px' }}>
            📱 Hướng dẫn thanh toán
          </h4>
          <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#166534', lineHeight: '1.6' }}>
            <li>Mở ứng dụng ngân hàng trên điện thoại</li>
            <li>Chọn chức năng quét QR hoặc chuyển khoản</li>
            <li>Kiểm tra thông tin và xác nhận chuyển khoản</li>
            <li>Hệ thống tự động xác nhận sau 1-3 phút</li>
          </ol>
        </div>

        {/* Status */}
        {paymentStatus === 'checking' && (
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #f3f4f6',
              borderTop: '3px solid #0369a1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px'
            }} />
            <div style={{ color: '#0369a1', fontWeight: '600' }}>
              Đang kiểm tra thanh toán...
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Đóng
          </button>
          <button
            onClick={handleManualCheck}
            disabled={paymentStatus === 'checking'}
            style={{
              flex: 2,
              padding: '14px',
              border: 'none',
              borderRadius: '8px',
              background: paymentStatus === 'checking' ? '#d1d5db' : '#059669',
              color: 'white',
              cursor: paymentStatus === 'checking' ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {paymentStatus === 'checking' ? '⏳ Đang kiểm tra...' : '🔄 Kiểm tra thanh toán'}
          </button>
        </div>

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
};

export default CassoPayment;

