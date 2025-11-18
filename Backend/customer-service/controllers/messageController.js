const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const Customer = require("../models/Customer");

// Get messages for a conversation
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Verify conversation exists and user has access
    let conversationQuery = { _id: conversationId };

    if (req.customerId) {
      conversationQuery.customerId = req.customerId;
    }

    const conversation = await Conversation.findOne(conversationQuery);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Get messages
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ conversationId });

    // Reverse to show oldest first
    messages.reverse();

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get messages",
      error: error.message,
    });
  }
};

// Send a new message
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, attachments } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    // Verify conversation exists and user has access
    let conversationQuery = { _id: conversationId };

    if (req.customerId) {
      conversationQuery.customerId = req.customerId;
    }

    let conversation = await Conversation.findOne(conversationQuery);

    // If conversation doesn't exist and user is customer, create it
    if (!conversation && req.customerId) {
      conversation = new Conversation({
        customerId: req.customerId,
        status: "waiting",
      });
      await conversation.save();
    }

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Determine sender info
    let senderId, senderType, senderName;

    if (req.customerId) {
      const customer = await Customer.findById(req.customerId);
      senderId = req.customerId;
      senderType = "customer";
      senderName = customer.name;
    } else if (req.employeeId) {
      senderId = req.employeeId;
      senderType = "admin";
      senderName = req.employeeName || "Admin";
    } else {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Create message
    const message = new Message({
      conversationId: conversation._id,
      senderId,
      senderType,
      senderName,
      content: content.trim(),
      attachments: attachments || [],
    });

    await message.save();

    // Update conversation
    conversation.lastMessageAt = new Date();
    
    // Increment unread count for the other party
    if (senderType === "customer") {
      conversation.unreadCount.admin += 1;
      // If conversation is waiting, change to open if admin is assigned
      if (conversation.status === "waiting" && conversation.adminId) {
        conversation.status = "open";
      }
    } else {
      conversation.unreadCount.customer += 1;
      // If admin sends first message, assign conversation to them
      if (!conversation.adminId) {
        conversation.adminId = senderId;
        conversation.adminName = senderName;
        conversation.status = "open";
      }
    }

    await conversation.save();

    // Populate message with conversation info
    const populatedMessage = await Message.findById(message._id);

    res.status(201).json({
      success: true,
      data: populatedMessage,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

// Mark message as read
const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Verify user has access to this conversation
    const conversation = await Conversation.findById(
      message.conversationId
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Check access
    if (req.customerId) {
      if (
        conversation.customerId.toString() !== req.customerId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    } else if (req.employeeId) {
      // Admin can read any message
    } else {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Mark as read
    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();

      // Update conversation unread count
      const userType =
        req.customerId &&
        req.customerId.toString() === conversation.customerId.toString()
          ? "customer"
          : "admin";

      if (conversation.unreadCount[userType] > 0) {
        conversation.unreadCount[userType] -= 1;
        await conversation.save();
      }
    }

    res.json({
      success: true,
      data: message,
      message: "Message marked as read",
    });
  } catch (error) {
    console.error("Mark message as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark message as read",
      error: error.message,
    });
  }
};

// Mark all messages in conversation as read
const markAllAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify conversation exists and user has access
    let conversationQuery = { _id: conversationId };

    if (req.customerId) {
      conversationQuery.customerId = req.customerId;
    }

    const conversation = await Conversation.findOne(conversationQuery);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Determine user type
    const userType =
      req.customerId &&
      req.customerId.toString() === conversation.customerId.toString()
        ? "customer"
        : "admin";

    // Mark all unread messages as read
    const result = await Message.updateMany(
      {
        conversationId,
        isRead: false,
        senderType: userType === "customer" ? "admin" : "customer",
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    // Reset unread count
    conversation.unreadCount[userType] = 0;
    await conversation.save();

    res.json({
      success: true,
      data: {
        updatedCount: result.modifiedCount,
      },
      message: "All messages marked as read",
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all messages as read",
      error: error.message,
    });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markMessageAsRead,
  markAllAsRead,
};

