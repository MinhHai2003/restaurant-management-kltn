const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Customer = require("../models/Customer");
const { getIO, emitToConversation, emitToCustomer, emitToAllAdmins } = require("../config/socket");

// Get all conversations (different for customer vs admin)
const getConversations = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Customer can only see their own conversations
    if (req.customerId) {
      query.customerId = req.customerId;
    }

    // Admin can see all conversations, filter by status if provided
    if (req.employeeId && status) {
      query.status = status;
    }

    // Admin can filter by assigned to them or unassigned
    if (req.employeeId && req.query.assigned === "me") {
      query.adminId = req.employeeId;
    } else if (req.employeeId && req.query.assigned === "unassigned") {
      query.adminId = null;
    }

    const conversations = await Conversation.find(query)
      .populate("customerId", "name email avatar phone")
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Conversation.countDocuments(query);

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get conversations",
      error: error.message,
    });
  }
};

// Get single conversation by ID
const getConversationById = async (req, res) => {
  try {
    const { id } = req.params;

    let query = { _id: id };

    // Customer can only see their own conversation
    if (req.customerId) {
      query.customerId = req.customerId;
    }

    const conversation = await Conversation.findOne(query).populate(
      "customerId",
      "name email avatar phone"
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get conversation",
      error: error.message,
    });
  }
};

// Create new conversation (usually auto-created when first message is sent)
const createConversation = async (req, res) => {
  try {
    if (!req.customerId) {
      return res.status(403).json({
        success: false,
        message: "Only customers can create conversations",
      });
    }

    // Check if customer already has an open conversation
    const existingConversation = await Conversation.findOne({
      customerId: req.customerId,
      status: { $in: ["open", "waiting"] },
    });

    if (existingConversation) {
      return res.json({
        success: true,
        data: existingConversation,
        message: "Using existing conversation",
      });
    }

    const conversation = new Conversation({
      customerId: req.customerId,
      status: "waiting",
    });

    await conversation.save();

    const populatedConversation = await Conversation.findById(
      conversation._id
    ).populate("customerId", "name email avatar");

    res.status(201).json({
      success: true,
      data: populatedConversation,
      message: "Conversation created successfully",
    });
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create conversation",
      error: error.message,
    });
  }
};

// Assign conversation to admin
const assignConversation = async (req, res) => {
  try {
    if (!req.employeeId) {
      return res.status(403).json({
        success: false,
        message: "Only employees can assign conversations",
      });
    }

    const { id } = req.params;
    const { adminId, adminName } = req.body;

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    conversation.adminId = adminId || req.employeeId;
    // If adminName not provided, try to get from token or use default
    if (!adminName && !req.employeeName) {
      // Try to get from token (if available in decoded token)
      conversation.adminName = "Admin";
    } else {
      conversation.adminName = adminName || req.employeeName || "Admin";
    }
    conversation.status = "open";

    await conversation.save();

    res.json({
      success: true,
      data: conversation,
      message: "Conversation assigned successfully",
    });
  } catch (error) {
    console.error("Assign conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign conversation",
      error: error.message,
    });
  }
};

// Close conversation (can be done by customer or admin)
const closeConversation = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Check access: customer can only close their own conversation, admin can close any
    if (req.customerId) {
      if (conversation.customerId.toString() !== req.customerId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    } else if (!req.employeeId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    conversation.status = "closed";
    await conversation.save();

    // Emit socket event to notify both customer and admin
    const io = getIO();
    if (io) {
      const closedBy = req.customerId ? "customer" : "admin";
      const closedByName = req.customerId 
        ? (await Customer.findById(req.customerId))?.name || "Customer"
        : req.employeeName || "Admin";

      // Notify all participants in the conversation
      emitToConversation(
        conversation._id.toString(),
        "conversation_closed",
        {
          conversationId: conversation._id.toString(),
          closedBy,
          closedByName,
          status: "closed",
          timestamp: new Date(),
        }
      );

      // Also notify customer directly if closed by admin
      if (!req.customerId && conversation.customerId) {
        emitToCustomer(conversation.customerId.toString(), "conversation_closed", {
          conversationId: conversation._id.toString(),
          closedBy: "admin",
          closedByName: req.employeeName || "Admin",
          status: "closed",
          timestamp: new Date(),
        });
      }

      // Notify all admins if closed by customer
      if (req.customerId) {
        emitToAllAdmins("conversation_closed", {
          conversationId: conversation._id.toString(),
          customerId: conversation.customerId.toString(),
          customerName: (await Customer.findById(conversation.customerId))?.name || "Customer",
          closedBy: "customer",
          status: "closed",
          timestamp: new Date(),
        });
      }
    }

    res.json({
      success: true,
      data: conversation,
      message: "Conversation closed successfully",
    });
  } catch (error) {
    console.error("Close conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to close conversation",
      error: error.message,
    });
  }
};

// Reopen conversation
const reopenConversation = async (req, res) => {
  try {
    if (!req.employeeId) {
      return res.status(403).json({
        success: false,
        message: "Only employees can reopen conversations",
      });
    }

    const { id } = req.params;

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    conversation.status = "open";
    await conversation.save();

    res.json({
      success: true,
      data: conversation,
      message: "Conversation reopened successfully",
    });
  } catch (error) {
    console.error("Reopen conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reopen conversation",
      error: error.message,
    });
  }
};

// Get unread count for a conversation
const getUnreadCount = async (req, res) => {
  try {
    const { conversationId } = req.params;

    let query = { _id: conversationId };

    // Customer can only see their own conversation
    if (req.customerId) {
      query.customerId = req.customerId;
    }

    const conversation = await Conversation.findOne(query);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const unreadCount =
      req.customerId && req.customerId.toString() === conversation.customerId.toString()
        ? conversation.unreadCount.customer
        : conversation.unreadCount.admin;

    res.json({
      success: true,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
      error: error.message,
    });
  }
};

module.exports = {
  getConversations,
  getConversationById,
  createConversation,
  assignConversation,
  closeConversation,
  reopenConversation,
  getUnreadCount,
};

