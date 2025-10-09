const cassoService = require("../services/cassoService");
const CassoTransaction = require("../models/CassoTransaction");
const Order = require("../models/Order");

/**
 * 🔔 Webhook handler - Casso will call this endpoint when new transaction received
 */
exports.handleWebhook = async (req, res) => {
  try {
    console.log("🔔 [CASSO WEBHOOK] Received webhook:", JSON.stringify(req.body, null, 2));

    // Verify webhook signature (if configured)
    const signature = req.headers["x-casso-signature"] || req.headers["secure-token"];
    
    // ⚠️ Chỉ verify nếu có CASSO_WEBHOOK_TOKEN trong .env
    if (process.env.CASSO_WEBHOOK_TOKEN) {
      const isValid = cassoService.verifyWebhookSignature(signature, req.body);
      
      if (!isValid && process.env.NODE_ENV === "production") {
        console.error("❌ [CASSO WEBHOOK] Invalid signature");
        return res.status(401).json({
          success: false,
          message: "Invalid webhook signature",
        });
      }
    } else {
      console.warn("⚠️ [CASSO WEBHOOK] No CASSO_WEBHOOK_TOKEN configured - webhook is not secured!");
    }

    // Casso webhook data structure
    const transactions = req.body.data || [req.body];

    const results = [];

    for (const txn of transactions) {
      try {
        // Check if transaction already exists
        const existingTxn = await CassoTransaction.findOne({ cassoId: txn.id });
        
        if (existingTxn) {
          console.log(`⚠️ [CASSO] Transaction ${txn.id} already processed`);
          results.push({
            cassoId: txn.id,
            status: "duplicate",
            message: "Transaction already exists",
          });
          continue;
        }

        // Save transaction to database
        const cassoTransaction = new CassoTransaction({
          cassoId: txn.id,
          tid: txn.tid,
          amount: txn.amount,
          description: txn.description,
          when: new Date(txn.when),
          bankAccountId: txn.bank_account_id,
          bankSubAccId: txn.bank_sub_acc_id,
          cusum_balance: txn.cusum_balance,
          raw_data: txn,
        });

        await cassoTransaction.save();
        console.log(`✅ [CASSO] Transaction ${txn.id} saved to database`);

        // Try to match with order
        const orderNumber = cassoService.extractOrderNumber(txn.description);

        if (!orderNumber) {
          console.log(`⚠️ [CASSO] Cannot extract order number from: ${txn.description}`);
          await cassoTransaction.markAsUnmatched("Không tìm thấy mã đơn hàng trong nội dung chuyển khoản");
          results.push({
            cassoId: txn.id,
            status: "unmatched",
            message: "No order number found",
          });
          continue;
        }

        // Find order by order number
        const order = await Order.findOne({
          orderNumber: orderNumber,
          "payment.method": "banking",
          "payment.status": { $in: ["pending", "awaiting_payment"] },
        });

        if (!order) {
          console.log(`⚠️ [CASSO] Order ${orderNumber} not found or already paid`);
          await cassoTransaction.markAsUnmatched(
            `Không tìm thấy đơn hàng ${orderNumber} hoặc đơn hàng đã được thanh toán`
          );
          results.push({
            cassoId: txn.id,
            status: "unmatched",
            message: "Order not found or already paid",
            orderNumber: orderNumber,
          });
          continue;
        }

        // Verify transaction matches order
        const matchResult = cassoService.matchTransaction(txn, order);

        if (!matchResult.matched) {
          console.log(`❌ [CASSO] Transaction does not match order: ${matchResult.reason}`);
          await cassoTransaction.markAsUnmatched(matchResult.reason);
          results.push({
            cassoId: txn.id,
            status: "mismatch",
            message: matchResult.reason,
            orderNumber: orderNumber,
          });
          continue;
        }

        // Update order payment status
        order.payment.status = "paid";
        order.payment.transactionId = txn.id;
        order.payment.paidAt = new Date(txn.when);
        order.payment.cassoData = {
          tid: txn.tid,
          amount: txn.amount,
          description: txn.description,
        };

        // Update order status based on current status
        if (order.status === "pending") {
          await order.updateStatus("confirmed", "Thanh toán đã được xác nhận qua Casso");
        }

        // 💳 Handle table payment order - update all original orders
        if (order.tablePaymentData?.isTablePayment && order.tablePaymentData?.originalOrderIds) {
          console.log(`💳 [TABLE PAYMENT] Processing table payment for order ${order.orderNumber}`);
          
          const originalOrders = await Order.find({
            _id: { $in: order.tablePaymentData.originalOrderIds }
            // Bỏ điều kiện 'payment.status': { $ne: 'paid' } để đảm bảo tìm thấy tất cả đơn gốc
          });

          console.log(`💳 [TABLE PAYMENT] Found ${originalOrders.length} original orders to update`);

          for (const originalOrder of originalOrders) {
            originalOrder.payment.status = 'paid';
            originalOrder.payment.transactionId = txn.id;
            originalOrder.payment.paidAt = new Date(txn.when);
            originalOrder.payment.cassoData = {
              tid: txn.tid,
              amount: txn.amount,
              description: txn.description,
              paidViaTablePayment: order.orderNumber
            };

            // Update order status to completed (vì đã thanh toán xong)
            if (originalOrder.status === "pending" || originalOrder.status === "confirmed") {
              await originalOrder.updateStatus("completed", `Thanh toán đã được xác nhận qua đơn thanh toán tổng ${order.orderNumber}`);
            }

            await originalOrder.save();
            console.log(`✅ [TABLE PAYMENT] Updated original order ${originalOrder.orderNumber} to paid`);
          }

          console.log(`✅ [TABLE PAYMENT] All ${originalOrders.length} original orders updated to paid`);
          
          // Update table payment order status to completed
          if (order.status === "pending") {
            await order.updateStatus("completed", `Thanh toán tổng bàn đã hoàn thành - ${originalOrders.length} đơn hàng đã được thanh toán`);
            console.log(`✅ [TABLE PAYMENT] Updated table payment order ${order.orderNumber} to completed`);
          }
        }

        await order.save();

        // Mark transaction as matched
        await cassoTransaction.markAsMatched(
          order,
          `Đã khớp với đơn hàng ${order.orderNumber}`
        );

        console.log(`✅ [CASSO] Payment confirmed for order ${order.orderNumber}`);

        // 🔔 Send real-time notification via Socket.io
        if (req.io) {
          // Notify customer
          if (order.customerId) {
            req.io.to(`user_${order.customerId}`).emit("payment_confirmed", {
              type: "payment_confirmed",
              orderId: order._id,
              orderNumber: order.orderNumber,
              amount: txn.amount,
              transactionId: txn.id,
              message: `Thanh toán đơn hàng ${order.orderNumber} đã được xác nhận`,
            });
          }

          // Notify staff
          req.io.to("role_admin").to("role_cashier").to("role_manager").emit("payment_received", {
            type: "payment_received",
            orderId: order._id,
            orderNumber: order.orderNumber,
            amount: txn.amount,
            customerName: order.customerInfo.name,
            message: `Đã nhận thanh toán ${cassoService.formatAmount(txn.amount)} cho đơn hàng ${order.orderNumber}`,
          });
        }

        results.push({
          cassoId: txn.id,
          status: "matched",
          orderNumber: order.orderNumber,
          orderId: order._id,
          amount: txn.amount,
          message: "Payment confirmed successfully",
        });

      } catch (error) {
        console.error(`❌ [CASSO] Error processing transaction ${txn.id}:`, error);
        results.push({
          cassoId: txn.id,
          status: "error",
          message: error.message,
        });
      }
    }

    // Return response to Casso
    res.json({
      success: true,
      message: "Webhook processed",
      results: results,
    });

  } catch (error) {
    console.error("❌ [CASSO WEBHOOK] Error:", error);
    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
      error: error.message,
    });
  }
};

/**
 * 📋 Get payment instructions for an order
 */
exports.getPaymentInstructions = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order belongs to customer (for authenticated users)
    // Chỉ check nếu user đã đăng nhập và order có customerId
    if (req.customerId && !req.isGuest && order.customerId && order.customerId.toString() !== req.customerId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get bank account info
    const bankAccountsResult = await cassoService.getBankAccounts();
    
    if (!bankAccountsResult.success || !bankAccountsResult.data.bankAccs?.length) {
      return res.status(500).json({
        success: false,
        message: "Cannot get bank account information",
      });
    }

    // Use first bank account
    const bankInfo = bankAccountsResult.data.bankAccs[0];

    // Generate payment instructions
    const paymentInfo = cassoService.generatePaymentInstruction(order, {
      bankName: bankInfo.bank_name,
      accountNumber: bankInfo.bank_acc_no,
      accountName: bankInfo.bank_acc_name,
    });

    res.json({
      success: true,
      message: "Payment instructions generated",
      data: {
        order: {
          orderNumber: order.orderNumber,
          total: order.pricing.total,
          status: order.status,
          paymentStatus: order.payment.status,
        },
        payment: paymentInfo,
      },
    });

  } catch (error) {
    console.error("Get payment instructions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get payment instructions",
      error: error.message,
    });
  }
};

/**
 * 🔍 Check payment status for an order
 */
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    console.log(`🔍 [PAYMENT STATUS] Checking payment status for order: ${orderNumber}`);

    const order = await Order.findOne({ orderNumber });
    
    if (!order) {
      console.log(`❌ [PAYMENT STATUS] Order not found: ${orderNumber}`);
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    
    console.log(`✅ [PAYMENT STATUS] Order found: ${order.orderNumber}, Status: ${order.status}, Payment: ${order.payment?.status}`);

    // Check if order belongs to customer (for authenticated users)
    // Chỉ check nếu user đã đăng nhập và order có customerId
    if (req.customerId && !req.isGuest && order.customerId && order.customerId.toString() !== req.customerId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Find matching transaction
    let transaction = await CassoTransaction.findOne({
      orderNumber: orderNumber,
      matchStatus: "matched",
    });

    // Nếu chưa có transaction, tự động kiểm tra Casso API
    if (!transaction && order.payment.status === "pending") {
      console.log(`🔄 [Auto-check] Checking Casso for order ${orderNumber}...`);
      
      try {
        // Lấy transactions từ Casso
        const transactionsResult = await cassoService.getTransactions({
          page: 1,
          pageSize: 10
        });

        if (transactionsResult.success) {
          const transactions = transactionsResult.data?.records || [];
          console.log(`🔍 [Auto-check] Found ${transactions.length} transactions from Casso`);
          
          // Tìm transaction phù hợp
          for (const txn of transactions) {
            console.log(`🔍 [Auto-check] Processing transaction: ${txn.id}, Description: "${txn.description}"`);
            const extractedOrderNumber = cassoService.extractOrderNumber(txn.description);
            console.log(`🔍 [Auto-check] Extracted order number: "${extractedOrderNumber}", Looking for: "${orderNumber}"`);
            
            if (extractedOrderNumber === orderNumber) {
              console.log(`✅ [Auto-check] Found matching transaction: ${txn.id}`);
              
              // Kiểm tra xem transaction đã tồn tại chưa
              const existingTxn = await CassoTransaction.findOne({ cassoId: txn.id });
              if (existingTxn) {
                transaction = existingTxn;
                break;
              }

              // Tạo transaction mới
              const newTransaction = new CassoTransaction({
                cassoId: txn.id,
                tid: txn.tid,
                amount: txn.amount,
                description: txn.description,
                when: new Date(txn.when),
                bankAccountId: txn.bank_account_id,
                bankSubAccId: txn.bank_sub_acc_id,
                cusum_balance: txn.cusum_balance,
                raw_data: txn,
              });

              await newTransaction.save();

              // Match transaction với order
              const matchResult = cassoService.matchTransaction(txn, order);
              if (matchResult.matched) {
                // Cập nhật order
                order.payment.status = "paid";
                order.payment.transactionId = txn.id;
                order.payment.paidAt = new Date(txn.when);
                order.payment.cassoData = {
                  tid: txn.tid,
                  amount: txn.amount,
                  description: txn.description,
                };

                if (order.status === "pending") {
                  await order.updateStatus("confirmed", "Thanh toán đã được xác nhận qua Casso");
                }

                await order.save();

                // Mark transaction as matched
                await newTransaction.markAsMatched(
                  order,
                  `Đã khớp với đơn hàng ${order.orderNumber}`
                );

                transaction = newTransaction;
                console.log(`🎉 [Auto-check] Order ${orderNumber} marked as PAID!`);
                break;
              } else {
                await newTransaction.markAsUnmatched(matchResult.reason);
              }
            }
          }
        }
      } catch (error) {
        console.error(`❌ [Auto-check] Error processing order ${orderNumber}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: "Payment status retrieved",
      data: {
        orderNumber: order.orderNumber,
        paymentStatus: order.payment.status,
        paid: order.payment.status === "paid",
        paidAt: order.payment.paidAt,
        amount: order.pricing.total,
        transaction: transaction ? {
          id: transaction.cassoId,
          amount: transaction.amount,
          description: transaction.description,
          when: transaction.when,
        } : null,
      },
    });

  } catch (error) {
    console.error("Check payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check payment status",
      error: error.message,
    });
  }
};

/**
 * 📊 Get all transactions (Admin only)
 */
exports.getAllTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      matchStatus,
      startDate,
      endDate,
    } = req.query;

    const query = {};
    
    if (matchStatus) {
      query.matchStatus = matchStatus;
    }

    if (startDate || endDate) {
      query.when = {};
      if (startDate) query.when.$gte = new Date(startDate);
      if (endDate) query.when.$lte = new Date(endDate);
    }

    const transactions = await CassoTransaction.find(query)
      .sort({ when: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate("orderId", "orderNumber status customerInfo pricing");

    const total = await CassoTransaction.countDocuments(query);

    res.json({
      success: true,
      message: "Transactions retrieved successfully",
      data: {
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
    });

  } catch (error) {
    console.error("Get all transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve transactions",
      error: error.message,
    });
  }
};

/**
 * 🔄 Manually match unmatched transaction (Admin only)
 */
exports.manualMatch = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { orderNumber } = req.body;

    const transaction = await CassoTransaction.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const order = await Order.findOne({ orderNumber });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update order payment
    order.payment.status = "paid";
    order.payment.transactionId = transaction.cassoId;
    order.payment.paidAt = transaction.when;

    if (order.status === "pending") {
      await order.updateStatus("confirmed", "Thanh toán đã được xác nhận thủ công");
    }

    await order.save();

    // Update transaction
    await transaction.markAsMatched(order, `Manually matched by admin`);

    res.json({
      success: true,
      message: "Transaction matched successfully",
      data: {
        transaction,
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.payment.status,
        },
      },
    });

  } catch (error) {
    console.error("Manual match error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to match transaction",
      error: error.message,
    });
  }
};

module.exports = exports;

