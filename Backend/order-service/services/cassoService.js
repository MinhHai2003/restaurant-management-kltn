const axios = require("axios");

class CassoService {
  constructor() {
    this.apiKey = process.env.CASSO_API_KEY;
    this.baseURL = "https://oauth.casso.vn/v2";
    this.webhookSecureToken = process.env.CASSO_WEBHOOK_TOKEN || null; // null = không verify
  }

  /**
   * Get list of transactions from Casso
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.pageSize - Items per page (max 100)
   * @param {string} options.fromDate - From date (DD/MM/YYYY)
   * @param {string} options.toDate - To date (DD/MM/YYYY)
   */
  async getTransactions(options = {}) {
    try {
      const response = await axios.get(`${this.baseURL}/transactions`, {
        headers: {
          Authorization: `apikey ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        params: {
          page: options.page || 1,
          pageSize: options.pageSize || 20,
          fromDate: options.fromDate,
          toDate: options.toDate,
          sort: "DESC",
        },
      });

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("Casso get transactions error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Get single transaction by ID
   * @param {string} transactionId - Casso transaction ID
   */
  async getTransaction(transactionId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/transactions/${transactionId}`,
        {
          headers: {
            Authorization: `apikey ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("Casso get transaction error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Get bank account info
   */
  async getBankAccounts() {
    try {
      const response = await axios.get(`${this.baseURL}/userInfo`, {
        headers: {
          Authorization: `apikey ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("Casso get bank accounts error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Verify webhook signature
   * @param {string} signature - Signature from webhook header
   * @param {Object} payload - Webhook payload
   */
  verifyWebhookSignature(signature, payload) {
    // Casso uses secure token for webhook verification
    // You should implement proper signature verification based on Casso documentation
    return signature === this.webhookSecureToken;
  }

  /**
   * Parse transaction description to extract order number
   * @param {string} description - Transaction description
   * @returns {string|null} - Extracted order number or null
   */
  extractOrderNumber(description) {
    // Common patterns: "DH123456", "ORD-20251005-333944", "DAT MON ORD-...", etc.
    // Adjust regex based on your order number format
    const patterns = [
      /BAN\d+\d{8}\d{6}/i,         // BAN10120251005123456 (table payment format - no dashes)
      /DAT\s+MON\s+(BAN\d+\d{8}\d{6})/i, // DAT MON BAN10120251005123456
      /BAN\d+-\d{8}-\d{6}/i,       // BAN101-20250105-123456 (table payment format - with dashes)
      /DAT\s+MON\s+(BAN\d+-\d{8}-\d{6})/i, // DAT MON BAN101-20250105-123456
      /ORD\d{8}\d{6}/i,            // ORD20251005250918 (new frontend format - no dashes)
      /DAT\s+MON\s+(ORD\d{8}\d{6})/i, // DAT MON ORD20251005250918
      /ORD-\d{8}-\d{6}/i,          // ORD-20251005-333944 (old format)
      /DAT\s+MON\s+(ORD-\d{8}-\d{6})/i, // DAT MON ORD-20251005-333944
      /DH[A-Z0-9]{6,}/i,           // DH123456
      /ORDER[A-Z0-9]{6,}/i,        // ORDER123456
      /\b[A-Z]{2,3}\d{8}\d{6}\b/i, // Generic: XX20251005250918 (no dashes)
      /\b[A-Z]{2,3}-\d{8}-\d{6}\b/i, // Generic: XX-20251005-333944
      /\b\d{8,}\b/,                // 12345678 (8+ digits only)
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) {
        let orderNumber = match[1] ? match[1].toUpperCase() : match[0].toUpperCase();
        
        // Không cần convert nữa vì frontend đã generate đúng format
        // ORD20251005250918 -> giữ nguyên
        
        return orderNumber;
      }
    }

    return null;
  }

  /**
   * Format amount to VND
   * @param {number} amount
   */
  formatAmount(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  }

  /**
   * Generate payment instruction for customer
   * @param {Object} order - Order object
   * @param {Object} bankInfo - Bank account info
   */
  generatePaymentInstruction(order, bankInfo) {
    const transferContent = `${order.orderNumber} ${order.customerInfo.phone}`;
    
    return {
      bankName: bankInfo.bankName || "Ngân hàng",
      accountNumber: bankInfo.accountNumber || "",
      accountName: bankInfo.accountName || "",
      amount: order.pricing.total,
      transferContent: transferContent,
      qrCode: bankInfo.qrCode || null,
      instruction: `
Vui lòng chuyển khoản với nội dung chính xác:
${transferContent}

Số tiền: ${this.formatAmount(order.pricing.total)}
Ngân hàng: ${bankInfo.bankName}
Số tài khoản: ${bankInfo.accountNumber}
Chủ tài khoản: ${bankInfo.accountName}

⚠️ LƯU Ý: Nhập đúng nội dung chuyển khoản để hệ thống tự động xác nhận thanh toán.
      `.trim(),
    };
  }

  /**
   * Check if transaction matches order
   * @param {Object} transaction - Casso transaction
   * @param {Object} order - Order object
   */
  matchTransaction(transaction, order) {
    const orderNumber = this.extractOrderNumber(transaction.description);
    
    if (!orderNumber) {
      return { matched: false, reason: "Không tìm thấy mã đơn hàng trong nội dung chuyển khoản" };
    }

    if (orderNumber !== order.orderNumber) {
      return { matched: false, reason: "Mã đơn hàng không khớp" };
    }

    // Check amount (allow 1000 VND difference for rounding)
    const amountDiff = Math.abs(transaction.amount - order.pricing.total);
    if (amountDiff > 1000) {
      return {
        matched: false,
        reason: `Số tiền không khớp (chuyển ${this.formatAmount(transaction.amount)}, cần ${this.formatAmount(order.pricing.total)})`,
      };
    }

    return { matched: true, orderNumber, transaction };
  }
}

module.exports = new CassoService();

