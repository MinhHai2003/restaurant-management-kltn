import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { menuService } from '../services/menuService';
import QRPayment from '../components/QRPayment';
import CassoPayment from '../components/CassoPayment';
import orderService from '../services/orderService';
import { useOrderSocket } from '../hooks/useOrderSocket';
import RatingStars from '../components/RatingStars';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
  preparationTime?: number;
  createdAt?: string;
  updatedAt?: string;
  ratings?: {
    average: number;
    count: number;
  };
}

interface TableInfo {
  tableNumber: string;
  capacity: number;
  location: string;
  status: string;
}

interface Order {
  _id: string;
  orderNumber?: string;
  pricing?: {
    total: number;
  };
  items: {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  status: string;
  createdAt: string;
}

interface TableSession {
  sessionId: string;
  tableNumber: string;
  startTime: string;
  orders: Order[];
  totalAmount: number;
  status: 'active' | 'completed';
}

const TableMenuPage: React.FC = () => {
  const { tableNumber } = useParams<{ tableNumber: string }>();
  const navigate = useNavigate();

  // States
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  const [tableSession, setTableSession] = useState<TableSession | null>(null);
  
  // Debug: Log tableSession changes
  useEffect(() => {
    console.log('🔄 [STATE] tableSession updated:', tableSession);
  }, [tableSession]);
  const [sessionPayMethod, setSessionPayMethod] = useState<'cash' | 'banking' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cart & Order States
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({});
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment States
  const [showPayment, setShowPayment] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_paymentMethod, _setPaymentMethod] = useState<'cash' | 'transfer' | null>(null);
  const [isSessionPayment, setIsSessionPayment] = useState(false); // Track if paying for entire session
  
  // Table Payment States
  const [showTablePayment, setShowTablePayment] = useState(false);
  const [tablePaymentOrder, setTablePaymentOrder] = useState<any>(null);

  // Customer Info for session
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [showCustomerForm, _setShowCustomerForm] = useState(false);

  // Socket for real-time dine-in updates
  const { socket, isConnected } = useOrderSocket();

  // Generate session order number
  const generateSessionOrderNumber = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = now.getTime().toString().slice(-6);
    return `TBL-${tableNumber}-${dateStr}-${timeStr}`;
  };

  const [sessionOrderNumber] = useState(() => generateSessionOrderNumber());

  // Generate table payment order number
  const generateTablePaymentOrderNumber = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = now.getTime().toString().slice(-6);
    return `BAN${tableNumber}${dateStr}${timeStr}`;
  };

  // Create table payment order using orderService (same as CheckoutPage)
  const createTablePaymentOrder = async () => {
    try {
      if (!tableSession?.orders?.length) {
        alert('Không có đơn hàng nào để thanh toán');
        return;
      }

      const totalAmount = tableSession.orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
      const orderNumber = generateTablePaymentOrderNumber();
      
      console.log('💳 [TABLE PAYMENT] Creating order with orderService...', {
        orderNumber,
        tableNumber,
        totalAmount,
        ordersCount: tableSession.orders.length
      });
      
      // Debug: Kiểm tra tableNumber
      console.log('🔍 [TABLE PAYMENT] tableNumber from useParams:', tableNumber);
      console.log('🔍 [TABLE PAYMENT] typeof tableNumber:', typeof tableNumber);
      
      // Debug table session structure
      console.log('🔍 [TABLE PAYMENT] Table session orders:', tableSession.orders);
      console.log('🔍 [TABLE PAYMENT] First order items:', tableSession.orders[0]?.items);
      console.log('🔍 [TABLE PAYMENT] First item menuItemId:', tableSession.orders[0]?.items?.[0]?.menuItemId);

      // Get a valid menu item ID from the first order
      const firstOrder = tableSession.orders[0];
      const firstItem = firstOrder?.items?.[0];
      const menuItemId = firstItem?.menuItemId;
      
      if (!menuItemId) {
        throw new Error('Không tìm thấy menu item ID hợp lệ');
      }

      // Prepare order data similar to CheckoutPage
      const orderData = {
        orderNumber, // Frontend generated order number
        items: [{
          menuItemId: menuItemId, // Use real menu item ID from first order
          quantity: 1,
          customizations: "",
          notes: `Thanh toán tổng bàn ${tableNumber} - ${tableSession.orders.length} đơn hàng`
        }],
        delivery: {
          type: 'pickup', // Use 'pickup' instead of 'dine_in' to pass validation
          address: {
            full: `Bàn ${tableNumber}`,
            district: 'N/A',
            city: 'N/A'
          },
          instructions: `Thanh toán tổng bàn ${tableNumber}`
        },
        payment: {
          method: 'banking' // Same as CheckoutPage for transfer
        },
        notes: {
          customer: `Bàn ${tableNumber} thanh toán tổng tiền`,
          kitchen: `Tổng hợp ${tableSession.orders.length} đơn hàng bàn ${tableNumber}`,
          delivery: `Thanh toán tổng bàn ${tableNumber}`
        },
        // Add customer info for guest users (required by backend validation)
        customerInfo: {
          name: `Khách bàn ${tableNumber}`,
          email: `table${tableNumber}@restaurant.com`,
          phone: '0000000000'
        },
        // Add table payment metadata
        tablePaymentData: {
          isTablePayment: true,
          originalOrderIds: tableSession.orders.map(order => order._id), // Sẽ được cập nhật bởi backend
          tableNumber: tableNumber
        },
        // Add calculated pricing
        frontendPricing: {
          subtotal: totalAmount,
          tax: 0,
          deliveryFee: 0,
          loyaltyDiscount: 0,
          couponDiscount: 0,
          total: totalAmount,
          membershipLevel: 'bronze',
          breakdown: {
            originalDeliveryFee: 0,
            freeShipping: false
          }
        }
      };

      console.log('📤 [TABLE PAYMENT] Sending order data:', JSON.stringify(orderData, null, 2));

      // Use orderService.createOrder() - same as CheckoutPage
      const result = await orderService.createOrder(orderData);
      console.log('✅ [TABLE PAYMENT] Order created successfully:', result);
      console.log('🔍 [TABLE PAYMENT] Full result:', JSON.stringify(result, null, 2));

      // Check if order was created successfully (even if validation had warnings)
      if (result && result.success && result.data && result.data.order) {
        const order = result.data.order;
        setTablePaymentOrder(order);
        setShowTablePayment(true);
        
        // Show success message
        alert(`✅ Tạo đơn thanh toán tổng thành công!\nMã đơn: ${order.orderNumber || orderNumber}\nTổng tiền: ${totalAmount.toLocaleString()}₫`);
        return order;
      } else {
        console.error('❌ [TABLE PAYMENT] Validation errors:', result?.errors);
        console.error('❌ [TABLE PAYMENT] Error message:', result?.error);
        console.error('❌ [TABLE PAYMENT] Full result structure:', result);
        throw new Error(result?.error || result?.message || 'Failed to create table payment order');
      }
    } catch (error) {
      console.error('❌ [TABLE PAYMENT] Error creating order:', error);
      alert('❌ Lỗi tạo đơn thanh toán tổng: ' + (error as Error).message);
    }
  };

  // Load table info and start session
  useEffect(() => {
    const initializeTable = async () => {
      if (!tableNumber) {
        setError('Số bàn không hợp lệ');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1. Get table info from table service
        console.log('🍽️ [TABLE] Loading table info for:', tableNumber);
        const tableResponse = await fetch(`http://localhost:5006/api/tables/number/${tableNumber}`);

        if (!tableResponse.ok) {
          throw new Error('Không tìm thấy thông tin bàn');
        }

        const tableData = await tableResponse.json();
        if (tableData.success && tableData.data) {
          setTableInfo(tableData.data.table);
          console.log('✅ [TABLE] Table info loaded:', tableData.data.table);
        }

        // 2. Check/create table session
        console.log('🍽️ [SESSION] Checking table session...');
        const sessionResponse = await fetch(`http://localhost:5006/api/tables/${tableNumber}/session`);

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (sessionData.success && sessionData.data) {
            setTableSession(sessionData.data.session);
            console.log('✅ [SESSION] Active session found:', sessionData.data.session);
          }
        } else {
          // Create new session
          console.log('🆕 [SESSION] Creating new table session...');
          const createSessionResponse = await fetch(`http://localhost:5006/api/tables/${tableNumber}/start-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tableNumber,
              sessionId: `session_${Date.now()}`,
              startTime: new Date().toISOString()
            })
          });

          if (createSessionResponse.ok) {
            const newSessionData = await createSessionResponse.json();
            setTableSession(newSessionData.data.session);
            console.log('✅ [SESSION] New session created:', newSessionData.data.session);
          }
        }

        // 3. Load menu items
        console.log('🍽️ [MENU] Loading menu items...');
        const menuData = await menuService.getMenuItems();
        console.log('🍽️ [MENU] Full menu response:', JSON.stringify(menuData, null, 2));

        if (menuData.success && menuData.data) {
          // Try different possible data structures
          let allItems = [];

          if (Array.isArray(menuData.data)) {
            allItems = menuData.data;
            console.log('🍽️ [MENU] Using menuData.data directly (array)');
          } else if (menuData.data.items && Array.isArray(menuData.data.items)) {
            allItems = menuData.data.items;
            console.log('🍽️ [MENU] Using menuData.data.items');
          } else if ((menuData.data as any).menuItems && Array.isArray((menuData.data as any).menuItems)) {
            allItems = (menuData.data as any).menuItems;
            console.log('🍽️ [MENU] Using menuData.data.menuItems');
          } else {
            console.log('🍽️ [MENU] Trying to find items in:', Object.keys(menuData.data));
            // Try to find any array in the data
            for (const key of Object.keys(menuData.data)) {
              if (Array.isArray((menuData.data as any)[key])) {
                allItems = (menuData.data as any)[key];
                console.log(`🍽️ [MENU] Found items array in: ${key}`);
                break;
              }
            }
          }

          console.log('🍽️ [MENU] Final items array:', allItems);
          console.log('🍽️ [MENU] Items count:', allItems.length);

          if (allItems.length > 0) {
            console.log('🍽️ [MENU] Sample item structure:', allItems[0]);

            const availableItems = allItems.filter((item: MenuItem) => item.available !== false);
            console.log('🍽️ [MENU] Available items after filter:', availableItems.length);

            setMenuItems(availableItems.length > 0 ? availableItems : allItems);
            console.log('✅ [MENU] Menu items set:', availableItems.length > 0 ? availableItems.length : allItems.length, 'items');
          } else {
            console.error('❌ [MENU] No items found in any structure');
          }
        } else {
          console.error('❌ [MENU] Invalid menu response:', menuData);
        }

        // 4. Luôn nạp lại các đơn của bàn để giữ trạng thái sau khi refresh
        await refreshTableSession();

      } catch (error) {
        console.error('❌ [TABLE] Error initializing table:', error);
        setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải thông tin bàn');
      } finally {
        setLoading(false);
      }
    };

    initializeTable();

    // Join socket room for this table to receive realtime orders from other tabs/devices
    if (socket && isConnected && tableNumber) {
      socket.emit('join_table', tableNumber);
    }

    return () => {
      if (socket && isConnected && tableNumber) {
        socket.emit('leave_table', tableNumber);
      }
    };
  }, [tableNumber, socket, isConnected]);

  // Listen to new orders created at this table (others/users)
  useEffect(() => {
    if (!socket) return;
    const handleTableOrderCreated = (data: any) => {
      if (!data?.order) return;
      // Cập nhật session hiện tại với đơn mới
      setTableSession(prev => {
        if (!prev) return prev;
        const exists = (prev.orders || []).some((o: Order) =>
          (o.orderNumber && data.order?.orderNumber && o.orderNumber === data.order.orderNumber) ||
          (o._id && data.order?._id && o._id === data.order._id)
        );
        if (exists) return prev; // tránh cộng trùng khi cùng tab cũng vừa tạo đơn
        return {
          ...prev,
          orders: [...(prev.orders || []), data.order],
          totalAmount: (prev.totalAmount || 0) + (data.order?.pricing?.total || 0)
        } as TableSession;
      });
    };
    socket.on('table_order_created', handleTableOrderCreated);
    const handleTableSessionClosed = (_data: any) => {
      // Khi tab khác hoàn tất thanh toán bàn này → đóng phiên và quay về Home
      setShowPayment(false);
      setIsSessionPayment(false);
      setTableSession(null);
      setTimeout(() => navigate('/'), 500);
    };
    socket.on('table_session_closed', handleTableSessionClosed);
    return () => {
      socket.off('table_order_created', handleTableOrderCreated);
      socket.off('table_session_closed', handleTableSessionClosed);
    };
  }, [socket]);

  // Add item to selection
  const addToSelection = (item: MenuItem) => {
    setSelectedItems(prev => ({
      ...prev,
      [item._id]: (prev[item._id] || 0) + 1
    }));
  };

  // Remove item from selection
  const removeFromSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSelection = { ...prev };
      if (newSelection[itemId] > 1) {
        newSelection[itemId] -= 1;
      } else {
        delete newSelection[itemId];
      }
      return newSelection;
    });
  };

  // Calculate total
  const calculateTotal = () => {
    return Object.entries(selectedItems).reduce((total, [itemId, quantity]) => {
      const item = menuItems.find(m => m._id === itemId);
      return total + (item ? item.price * quantity : 0);
    }, 0);
  };

  // Calculate session total (all orders in this session)
  const calculateSessionTotal = () => {
    if (!tableSession || !tableSession.orders) return 0;
    return tableSession.orders.reduce((total: number, order: Order) => {
      return total + (order.pricing?.total || 0);
    }, 0);
  };

  // Load all orders for this table (not just session)
  const loadTableOrders = async () => {
    try {
      const response = await fetch(`http://localhost:5005/api/orders/dine-in/table-number/${tableNumber}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📋 [TABLE ORDERS] Loaded orders:', result);
        return result.data?.orders || [];
      }
    } catch (error) {
      console.error('❌ [TABLE ORDERS] Error loading orders:', error);
    }
    return [];
  };

  // Calculate total for all unpaid, non-cancelled orders of this table
  const _calculateTableTotal = async () => {
    const orders = await loadTableOrders();
    const unpaidOrders = orders.filter((order: any) =>
      order.payment?.status !== 'completed' &&
      order.payment?.status !== 'paid' &&
      order.status !== 'completed' &&
      order.status !== 'canceled'
    );

    return unpaidOrders.reduce((total: number, order: any) => {
      return total + (order.pricing?.total || 0);
    }, 0);
  };

  // Handle session payment (prepare all unpaid and non-cancelled orders of this table)
  const _handleSessionPayment = async () => {
    console.log('🔥 [SESSION PAYMENT] Starting - Table:', tableNumber);

    const orders = await loadTableOrders();
    console.log('📋 [SESSION PAYMENT] Loaded orders:', orders.length, orders);

    const unpaidOrders = orders.filter((order: any) =>
      order.payment?.status !== 'completed' &&
      order.payment?.status !== 'paid' &&
      order.status !== 'completed' &&
      order.status !== 'canceled'
    );
    console.log('💰 [SESSION PAYMENT] Unpaid orders:', unpaidOrders.length, unpaidOrders);

    if (unpaidOrders.length === 0) {
      console.warn('⚠️ [SESSION PAYMENT] No unpaid orders found');
      alert('Không có đơn hàng nào cần thanh toán!');
      return;
    }

    const totalAmount = unpaidOrders.reduce((total: number, order: any) => {
      return total + (order.pricing?.total || 0);
    }, 0);

    if (totalAmount <= 0) {
      alert('Tổng tiền phải lớn hơn 0!');
      return;
    }

    // Update table session state with all orders
    setTableSession(prev => ({
      sessionId: prev?.sessionId || `session_${Date.now()}`,
      tableNumber: prev?.tableNumber || String(tableNumber),
      startTime: prev?.startTime || new Date().toISOString(),
      status: prev?.status || 'active',
      orders: unpaidOrders,
      totalAmount: totalAmount
    }));

    // Chỉ chuẩn bị dữ liệu; hiển thị QR ở handler tuỳ phương thức
  };

  // Load all unpaid orders for this table and update session display
  const refreshTableSession = async () => {
    try {
      console.log('🔄 [REFRESH] Loading session and orders for table:', tableNumber);

      // Get current table session
      const sessionResponse = await fetch(`http://localhost:5006/api/tables/${tableNumber}/session`);

      // Get unpaid orders for this table
      const ordersResponse = await fetch(`http://localhost:5005/api/orders/dine-in/table-number/${tableNumber}`);

      let currentSession = null;
      let unpaidOrders = [];

      if (sessionResponse.ok) {
        const sessionResult = await sessionResponse.json();
        currentSession = sessionResult.data?.session || null;
      }

      if (ordersResponse.ok) {
        const ordersResult = await ordersResponse.json();
        // Lọc chỉ các đơn chưa hoàn thành và chưa hủy
        const allOrders = ordersResult.data?.orders || [];
        console.log('🔍 [REFRESH] All orders found:', allOrders.length);
        console.log('🔍 [REFRESH] Sample order:', allOrders[0]);
        
        unpaidOrders = allOrders.filter((o: any) =>
          o.payment?.status !== 'completed' &&
          o.payment?.status !== 'paid' &&
          o.status !== 'completed' &&
          o.status !== 'canceled'
        );
        
        console.log('🔍 [REFRESH] Unpaid orders after filter:', unpaidOrders.length);
        console.log('📋 [REFRESH] Found orders for table:', unpaidOrders.length, unpaidOrders);
        console.log('📋 [REFRESH] Orders detail:', unpaidOrders.map((o: any) => ({ id: o._id, amount: o.pricing?.total, status: o.payment?.status })));
      } else {
        console.error('❌ [REFRESH] Failed to fetch orders:', ordersResponse.status);
        const errorText = await ordersResponse.text();
        console.error('❌ [REFRESH] Error details:', errorText);
      }

      // Update session with unpaid orders
      console.log('🔍 [REFRESH] currentSession:', currentSession);
      console.log('🔍 [REFRESH] unpaidOrders.length:', unpaidOrders.length);
      
      if (currentSession && unpaidOrders.length > 0) {
        console.log('✅ [REFRESH] Updating existing session with orders');
        currentSession.orders = unpaidOrders;
        currentSession.totalAmount = unpaidOrders.reduce((total: number, order: any) => {
          return total + (order.pricing?.total || 0);
        }, 0);
        console.log('🔍 [REFRESH] Updated session before setTableSession:', currentSession);
        setTableSession(currentSession);
        console.log('✅ [REFRESH] setTableSession called');
      } else if (currentSession) {
        console.log('⚠️ [REFRESH] Session exists but no unpaid orders');
        // Session exists but no unpaid orders
        currentSession.orders = [];
        currentSession.totalAmount = 0;
        setTableSession(currentSession);
      } else {
        console.log('🆕 [REFRESH] No session, creating recovered session');
        // Không có session nhưng vẫn còn unpaid orders từ phiên cũ → tạo phiên tạm để hiển thị và cho phép thanh toán tổng
        if (unpaidOrders.length > 0) {
          const recoveredSession = {
            sessionId: `recovered_${Date.now()}`,
            tableNumber: String(tableNumber),
            startTime: new Date().toISOString(),
            status: 'active' as const,
            orders: unpaidOrders,
            totalAmount: unpaidOrders.reduce((total: number, order: any) => total + (order.pricing?.total || 0), 0)
          };
          console.log('✅ [REFRESH] Created recovered session:', recoveredSession);
          setTableSession(recoveredSession as unknown as TableSession);
        } else {
          setTableSession(null);
        }
      }

    } catch (error) {
      console.error('❌ [REFRESH] Error refreshing session:', error);
    }
  };

  // Process individual order (for payment completion)
  const processOrder = async () => {
    if (Object.keys(selectedItems).length === 0) {
      throw new Error('Không có món nào được chọn!');
    }

    // For dine-in, use default customer info
    const dineInCustomerInfo = {
      name: 'Khách tại bàn',
      phone: '0000000000',
      email: 'guest@restaurant.local'
    };

    try {
      setIsSubmitting(true);

      // Prepare order items
      const orderItems = Object.entries(selectedItems).map(([itemId, quantity]) => {
        const item = menuItems.find(m => m._id === itemId);
        return {
          menuItemId: itemId,
          name: item?.name || '',
          price: item?.price || 0,
          quantity,
          customizations: '',
          notes: ''
        };
      });

      // Create dine-in order
      const orderData = {
        items: orderItems,
        tableNumber,
        tableSession: tableSession?.sessionId,
        customerInfo: dineInCustomerInfo,
        delivery: {
          type: 'dine_in',
          estimatedTime: 30
        },
        payment: {
          method: 'banking',
          status: 'completed'
        },
        pricing: {
          subtotal: calculateTotal(),
          tax: 0,
          total: calculateTotal()
        },
        notes: orderNotes
      };

      const response = await fetch('http://localhost:5004/api/orders/dine-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Không thể tạo đơn hàng');
      }

      const result = await response.json();
      console.log('✅ [ORDER] Order created:', result);

      // Refresh table session
      await refreshTableSession();

    } catch (error) {
      console.error('❌ [ORDER] Error creating order:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format price
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  // Submit order to kitchen
  const submitOrder = async () => {
    if (Object.keys(selectedItems).length === 0) {
      alert('Vui lòng chọn ít nhất một món!');
      return;
    }

    // For dine-in, use default customer info
    const dineInCustomerInfo = {
      name: 'Khách tại bàn',
      phone: '0000000000',
      email: 'guest@restaurant.local'
    };

    try {
      setIsSubmitting(true);

      // Prepare order items
      const orderItems = Object.entries(selectedItems).map(([itemId, quantity]) => {
        const item = menuItems.find(m => m._id === itemId);
        return {
          menuItemId: itemId,
          name: item?.name || '',
          price: item?.price || 0,
          quantity,
          customizations: '',
          notes: ''
        };
      });

      // Create dine-in order
      const orderData = {
        items: orderItems,
        tableNumber,
        tableSession: tableSession?.sessionId,
        customerInfo: dineInCustomerInfo,
        delivery: {
          type: 'dine_in',
          estimatedTime: 30
        },
        payment: {
          // Không gán phương thức khi gửi bếp; để pending/none
          method: 'none',
          status: 'pending'
        },
        notes: {
          customer: orderNotes,
          kitchen: `Bàn ${tableNumber} - ${dineInCustomerInfo.name}`,
          delivery: ''
        },
        orderNumber: undefined
      };

      console.log('🍽️ [ORDER] Submitting dine-in order:', orderData);

      // Submit to dine-in order endpoint
      const response = await fetch('http://localhost:5005/api/orders/dine-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer guest-session-${tableSession?.sessionId}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể đặt món');
      }

      const result = await response.json();
      console.log('✅ [ORDER] Order submitted successfully:', result);

      // Sau khi gửi bếp thành công
      alert(`Đặt món thành công! Mã đơn: ${result.data.order.orderNumber}\nThời gian chuẩn bị: ${result.data.order.estimatedTime} phút`);

      // Clear selection
      setSelectedItems({});
      setOrderNotes('');

      // Reload session từ backend để đồng bộ chính xác
      await refreshTableSession();

    } catch (error) {
      console.error('❌ [ORDER] Error submitting order:', error);
      alert(`Lỗi đặt món: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Header />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          fontSize: '18px',
          color: '#64748b'
        }}>
          🍽️ Đang tải thông tin bàn...
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Header />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          fontSize: '18px',
          color: '#ef4444',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <div>{error}</div>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Về trang chủ
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header />

      <main style={{ padding: '20px 0', minHeight: '60vh' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>

          {/* Table Header */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '8px'
            }}>
              🍽️ BÀN SỐ {tableNumber}
            </h1>

            {tableInfo && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '24px',
                fontSize: '14px',
                color: '#64748b'
              }}>
                <span>📍 {tableInfo.location}</span>
                <span>👥 {tableInfo.capacity} người</span>
                <span>🟢 {tableInfo.status}</span>
              </div>
            )}

            {tableSession && (
              <div style={{
                marginTop: '16px',
                padding: '16px',
                background: '#f0f9ff',
                borderRadius: '8px',
                border: '1px solid #0ea5e9'
              }}>
                <div style={{ fontSize: '14px', color: '#0ea5e9', fontWeight: '500', marginBottom: '8px' }}>
                  🔗 Phiên bàn: {tableSession.sessionId}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                  Bắt đầu: {new Date(tableSession.startTime).toLocaleTimeString('vi-VN')}
                  {tableSession.orders.length > 0 && (
                    <span> • {tableSession.orders.length} đơn đã đặt</span>
                  )}
                </div>

                {/* Hiển thị tổng tiền session */}
                {tableSession.orders.length > 0 && (
                  <div style={{
                    background: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                        💰 Tổng tiền tất cả đơn:
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc2626' }}>
                        {formatPrice(tableSession.totalAmount)}
                      </span>
                    </div>

                    {/* Chọn phương thức thanh toán tổng */}
                    <div style={{ display: 'flex', gap: '12px', margin: '8px 0 12px 0' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          checked={sessionPayMethod === 'cash'}
                          onChange={() => setSessionPayMethod('cash')}
                        />
                        <span>💰 Tiền mặt</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          checked={sessionPayMethod === 'banking'}
                          onChange={() => setSessionPayMethod('banking')}
                        />
                        <span>📱 Chuyển khoản</span>
                      </label>
                    </div>

                    <button
                      onClick={async () => {
                        console.log('🎯 [BUTTON CLICK] THANH TOÁN TỔNG TẤT CẢ clicked');
                        
                        if (!sessionPayMethod) {
                          alert('Vui lòng chọn phương thức thanh toán (Tiền mặt hoặc Chuyển khoản)!');
                          return;
                        }
                        
                        if (sessionPayMethod === 'cash') {
                          // Xử lý thanh toán tiền mặt như cũ
                          try {
                            const res = await fetch(`http://localhost:5005/api/orders/dine-in/table-number/${tableNumber}/complete`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                paymentMethod: 'cash',
                                paymentData: { method: 'cash' },
                                totalAmount: tableSession?.totalAmount || 0
                              })
                            });
                            if (res.ok) {
                              alert('Đã xác nhận thanh toán tiền mặt cho tất cả đơn!');
                              await refreshTableSession();
                            } else {
                              const t = await res.text();
                              console.error('Cash complete error:', t);
                              alert('Lỗi xác nhận thanh toán tiền mặt');
                            }
                          } catch (e) {
                            console.error('Cash session error:', e);
                            alert('Lỗi mạng khi thanh toán tiền mặt');
                          }
                        } else if (sessionPayMethod === 'banking') {
                          // Tạo đơn hàng thanh toán tổng và hiển thị CassoPayment
                          await createTablePaymentOrder();
                        }
                      }}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #16a34a, #15803d)',
                        color: 'white',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      💳 THANH TOÁN TỔNG TẤT CẢ ({formatPrice(calculateSessionTotal())})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Customer Info Form */}
          {showCustomerForm && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#1e293b'
              }}>
                👤 Thông tin khách hàng
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                    placeholder="Nhập họ tên"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    Email (tuỳ chọn)
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                    placeholder="Nhập email"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Table Session Summary */}
          {tableSession && tableSession.orders && tableSession.orders.length > 0 && (
            <div style={{
              background: '#fff7ed',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              border: '2px solid #fb923c'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#ea580c',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📋 Các đơn đã đặt (Session)
              </h3>

              <div style={{ fontSize: '14px', color: '#9a3412', marginBottom: '12px' }}>
                {tableSession.orders.length} đơn hàng • Tổng: {formatPrice(calculateSessionTotal())}
              </div>

              {tableSession.orders.slice(-3).map((order: Order, index: number) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: index < Math.min(tableSession.orders.length, 3) - 1 ? '1px solid #fed7aa' : 'none',
                  fontSize: '12px'
                }}>
                  <span style={{ color: '#9a3412' }}>
                    {order._id || `Đơn ${index + 1}`}
                  </span>
                  <span style={{ fontWeight: '600', color: '#ea580c' }}>
                    {formatPrice(order.pricing?.total || 0)}
                  </span>
                </div>
              ))}

              {tableSession.orders.length > 3 && (
                <div style={{ fontSize: '12px', color: '#9a3412', marginTop: '8px', textAlign: 'center' }}>
                  ... và {tableSession.orders.length - 3} đơn khác
                </div>
              )}
            </div>
          )}

          {/* Main Content */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

            {/* Menu Items */}
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '20px'
              }}>
                📋 THỰC ĐƠN
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                {menuItems.map(item => (
                  <div
                    key={item._id}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }}
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          marginBottom: '12px'
                        }}
                      />
                    )}

                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '8px'
                    }}>
                      {item.name}
                    </h3>

                    <p style={{
                      fontSize: '14px',
                      color: '#64748b',
                      marginBottom: '12px',
                      lineHeight: '1.5'
                    }}>
                      {item.description}
                    </p>

                    {/* Rating Display */}
                    {item.ratings && item.ratings.count > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px'
                      }}>
                        <RatingStars 
                          value={item.ratings.average} 
                          readonly 
                          size="sm" 
                        />
                        <span style={{
                          fontSize: '12px',
                          color: '#64748b'
                        }}>
                          ({item.ratings.count} đánh giá)
                        </span>
                        {item.ratings.average >= 4.5 && (
                          <span style={{
                            fontSize: '10px',
                            background: '#fbbf24',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: '500'
                          }}>
                            TOP RATED
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>
                      <span style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#dc2626'
                      }}>
                        {formatPrice(item.price)}
                      </span>

                      <span style={{
                        fontSize: '12px',
                        color: '#64748b',
                        background: '#f1f5f9',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}>
                        ⏱️ {item.preparationTime || 15} phút
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      {selectedItems[item._id] ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <button
                            onClick={() => removeFromSelection(item._id)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              border: '1px solid #e2e8f0',
                              background: 'white',
                              color: '#64748b',
                              fontSize: '18px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            −
                          </button>

                          <span style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#1e293b',
                            minWidth: '24px',
                            textAlign: 'center'
                          }}>
                            {selectedItems[item._id]}
                          </span>

                          <button
                            onClick={() => addToSelection(item)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              border: 'none',
                              background: '#dc2626',
                              color: 'white',
                              fontSize: '18px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToSelection(item)}
                          style={{
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#b91c1c';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#dc2626';
                          }}
                        >
                          Chọn món
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              height: 'fit-content',
              position: 'sticky',
              top: '20px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '20px'
              }}>
                🧾 ĐƠN HIỆN TẠI
              </h3>

              {Object.keys(selectedItems).length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '14px',
                  padding: '40px 0'
                }}>
                  Chưa có món nào được chọn
                </div>
              ) : (
                <>
                  <div style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    marginBottom: '20px'
                  }}>
                    {Object.entries(selectedItems).map(([itemId, quantity]) => {
                      const item = menuItems.find(m => m._id === itemId);
                      if (!item) return null;

                      return (
                        <div
                          key={itemId}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 0',
                            borderBottom: '1px solid #f1f5f9'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#1e293b'
                            }}>
                              {item.name}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#64748b'
                            }}>
                              {formatPrice(item.price)} x {quantity}
                            </div>
                          </div>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1e293b'
                          }}>
                            {formatPrice(item.price * quantity)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Notes */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Ghi chú cho bếp:
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="VD: Ít cay, không hành..."
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        resize: 'vertical',
                        minHeight: '60px'
                      }}
                    />
                  </div>

                  {/* Payment Method - removed per request */}

                  {/* Total */}
                  <div style={{
                    borderTop: '2px solid #f1f5f9',
                    paddingTop: '16px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#1e293b'
                    }}>
                      <span>Tổng cộng:</span>
                      <span style={{ color: '#dc2626' }}>{formatPrice(calculateTotal())}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                      onClick={submitOrder}
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        background: isSubmitting
                          ? '#94a3b8'
                          : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                        color: 'white',
                        border: 'none',
                        padding: '16px',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {isSubmitting
                        ? '🍳 Đang gửi bếp...'
                        : '🍳 GỬI BẾP NGAY'
                      }
                    </button>

                    {/* Nút thanh toán tổng đã được loại bỏ theo yêu cầu */}

                    <button
                      onClick={() => setSelectedItems({})}
                      style={{
                        width: '100%',
                        background: 'white',
                        color: '#64748b',
                        border: '1px solid #e2e8f0',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ Xóa tất cả
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* QR Payment Modal */}
      {showPayment && (
        <QRPayment
          amount={isSessionPayment ? (tableSession?.totalAmount || 0) : calculateTotal()}
          orderCode={isSessionPayment ? `SESSION-${tableNumber}-${Date.now()}` : sessionOrderNumber}
          orderInfo={isSessionPayment
            ? `Thanh toán tổng bàn ${tableNumber} - ${tableSession?.orders.length || 0} đơn`
            : `Thanh toán đơn bàn ${tableNumber} - ${customerInfo.name}`
          }
          onPaymentSuccess={async (paymentData: object) => {
            console.log('🎯 [PAYMENT] Payment confirmed:', paymentData);
            console.log('🎯 [PAYMENT] Is session payment:', isSessionPayment);
            console.log('🎯 [PAYMENT] Table session:', tableSession);

            if (isSessionPayment) {
              // Handle session payment - mark all table orders as completed
              try {
                alert(`Thanh toán tổng thành công! Tổng tiền: ${formatPrice(tableSession?.totalAmount || 0)}`);

                // Mark all orders of this table as completed using new API
                const markOrdersResponse = await fetch(`http://localhost:5005/api/orders/dine-in/table-number/${tableNumber}/complete`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    paymentMethod: 'banking',
                    paymentData: paymentData,
                    totalAmount: tableSession?.totalAmount || 0
                  })
                });

                if (markOrdersResponse.ok) {
                  const result = await markOrdersResponse.json();
                  console.log('✅ [PAYMENT] All orders marked as completed:', result.data);
                } else {
                  console.error('❌ [PAYMENT] Failed to mark orders as completed');
                }

                // End table session
                const endSessionResponse = await fetch(`http://localhost:5006/api/tables/${tableNumber}/end-session`, {
                  method: 'POST'
                });

                if (endSessionResponse.ok) {
                  console.log('✅ [SESSION] Session ended successfully');
                  setTableSession(null);
                  setSelectedItems({});
                  setShowPayment(false);
                  setIsSessionPayment(false);

                  setTimeout(() => navigate('/'), 2000);
                }
              } catch (error) {
                console.error('❌ [SESSION] Error ending session:', error);
                alert('Thanh toán thành công nhưng có lỗi khi kết thúc phiên bàn');
              }
            } else {
              // Handle single order payment
              try {
                await processOrder();
                alert(`Thanh toán đơn thành công! Mã đơn: ${sessionOrderNumber}`);

                setSelectedItems({});
                setOrderNotes('');
                setShowPayment(false);

              } catch (error) {
                console.error('❌ [ORDER] Error:', error);
                alert('Có lỗi xảy ra. Vui lòng thử lại!');
              }
            }
          }}
          onClose={() => {
            setShowPayment(false);
            setIsSessionPayment(false);
          }}
        />
      )}

      {/* Table Payment Modal */}
      {showTablePayment && tablePaymentOrder && (
        <CassoPayment
          orderNumber={tablePaymentOrder.orderNumber}
          amount={tablePaymentOrder.total || 0}
          onPaymentConfirmed={async (transaction) => {
            console.log('✅ [TABLE PAYMENT] Payment confirmed:', transaction);
            
            try {
              // Sử dụng API /complete giống như thanh toán tiền mặt
              console.log('🔄 [TABLE PAYMENT] Completing table payment...');
              
              const res = await fetch(`http://localhost:5005/api/orders/dine-in/table-number/${tableNumber}/complete`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paymentMethod: 'banking',
                  paymentData: { method: 'banking' },
                  totalAmount: tablePaymentOrder.total || 0
                })
              });
              
              if (res.ok) {
                console.log('✅ [TABLE PAYMENT] Table payment completed successfully');
              } else {
                const errorText = await res.text();
                console.error('❌ [TABLE PAYMENT] Complete error:', errorText);
                alert('Lỗi xác nhận thanh toán chuyển khoản');
                return;
              }
            } catch (error) {
              console.error('❌ [TABLE PAYMENT] Error completing payment:', error);
              alert('Lỗi mạng khi thanh toán chuyển khoản');
              return;
            }
            
            alert(`Thanh toán tổng bàn ${tableNumber} thành công!\nTổng tiền: ${formatPrice(tablePaymentOrder.total || 0)}`);
            
            // Refresh table session
            refreshTableSession();
            
            // Close modal
            setShowTablePayment(false);
            setTablePaymentOrder(null);
            
            // Navigate to home after 3 seconds
            setTimeout(() => navigate('/'), 3000);
          }}
          onClose={() => {
            setShowTablePayment(false);
            setTablePaymentOrder(null);
          }}
        />
      )}

      <Footer />
    </div>
  );
};

export default TableMenuPage;