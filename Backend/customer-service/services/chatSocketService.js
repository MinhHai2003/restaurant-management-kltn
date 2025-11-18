const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const Customer = require("../models/Customer");

// Socket helpers will be injected from config/socket to avoid circular deps
let socketApi = {};
const setSocketApi = (api) => {
  socketApi = api;
};

// Handle customer sending message via socket
const handleCustomerMessage = async (socket, data) => {
  try {
    const { conversationId, content, attachments } = data;

    if (!content || !content.trim()) {
      return socket.emit("error", {
        message: "Message content is required",
      });
    }

    // Find or create conversation
    let conversation = null;
    let conversationWasCreated = false;
    
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        customerId: socket.userId,
      });
    }

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        customerId: socket.userId,
        status: "waiting",
      });
      await conversation.save();
      conversationWasCreated = true;
      
      // Emit conversation_created event to customer
      socket.emit("conversation_created", {
        id: conversation._id.toString(),
        customerId: conversation.customerId.toString(),
        status: conversation.status,
        createdAt: conversation.createdAt,
      });
    }

    // Get customer info
    const customer = await Customer.findById(socket.userId);
    
    if (!customer) {
      return socket.emit("error", {
        message: "Customer not found",
      });
    }

    // Create message
    const message = new Message({
      conversationId: conversation._id,
      senderId: socket.userId,
      senderType: "customer",
      senderName: customer.name,
      content: content.trim(),
      attachments: attachments || [],
    });

    await message.save();

    // Update conversation
    conversation.lastMessageAt = new Date();
    conversation.unreadCount.admin += 1;
    if (conversation.status === "waiting" && conversation.adminId) {
      conversation.status = "open";
    }
    await conversation.save();

    // Emit to conversation room
    const messageData = {
      id: message._id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderType: message.senderType,
      senderName: message.senderName,
      content: message.content,
      attachments: message.attachments,
      isRead: message.isRead,
      createdAt: message.createdAt,
    };

    const { emitToConversation, emitToAllAdmins } = socketApi;
    if (typeof emitToConversation !== "function") {
      throw new Error("emitToConversation helper not available");
    }

    emitToConversation(
      conversation._id.toString(),
      "message_received",
      messageData
    );

    // Notify all admins about new message
    emitToAllAdmins &&
      emitToAllAdmins("new_customer_message", {
      conversationId: conversation._id.toString(),
      customerId: conversation.customerId.toString(),
      customerName: customer.name,
      message: content.substring(0, 50),
      timestamp: new Date(),
      });

    // Confirm to sender - include conversation data if it was just created
    socket.emit("message_sent", {
      success: true,
      messageId: message._id.toString(),
      conversationId: conversation._id.toString(),
      conversationCreated: conversationWasCreated,
      conversationStatus: conversation.status,
    });
  } catch (error) {
    console.error("Handle customer message error:", error);
    socket.emit("error", {
      message: "Failed to send message",
      error: error.message,
    });
  }
};

// Handle admin sending message via socket
const handleAdminMessage = async (socket, data) => {
  try {
    const { conversationId, content, attachments } = data;

    if (!content || !content.trim()) {
      return socket.emit("error", {
        message: "Message content is required",
      });
    }

    // Find conversation
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return socket.emit("error", {
        message: "Conversation not found",
      });
    }

    // Create message
    const message = new Message({
      conversationId: conversation._id,
      senderId: socket.userId,
      senderType: "admin",
      senderName: socket.userData.name,
      content: content.trim(),
      attachments: attachments || [],
    });

    await message.save();

    // Update conversation
    conversation.lastMessageAt = new Date();
    conversation.unreadCount.customer += 1;

    // If admin sends first message, assign conversation to them
    if (!conversation.adminId) {
      conversation.adminId = socket.userId;
      conversation.adminName = socket.userData.name;
      conversation.status = "open";
    }

    await conversation.save();

    // Emit to conversation room
    const messageData = {
      id: message._id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderType: message.senderType,
      senderName: message.senderName,
      content: message.content,
      attachments: message.attachments,
      isRead: message.isRead,
      createdAt: message.createdAt,
    };

    const { emitToConversation, emitToCustomer } = socketApi;
    if (typeof emitToConversation !== "function") {
      throw new Error("emitToConversation helper not available");
    }

    emitToConversation(
      conversation._id.toString(),
      "message_received",
      messageData
    );

    // Notify customer
    emitToCustomer &&
      emitToCustomer(conversation.customerId.toString(), "new_admin_message", {
        conversationId: conversation._id,
        adminName: socket.userData.name,
        message: content.substring(0, 50),
        timestamp: new Date(),
      });

    // Confirm to sender
    socket.emit("message_sent", {
      success: true,
      messageId: message._id,
      conversationId: conversation._id,
    });
  } catch (error) {
    console.error("Handle admin message error:", error);
    socket.emit("error", {
      message: "Failed to send message",
      error: error.message,
    });
  }
};

// Handle mark message as read
const handleMarkAsRead = async (socket, data) => {
  try {
    const { messageId } = data;

    const message = await Message.findById(messageId);

    if (!message) {
      return socket.emit("error", {
        message: "Message not found",
      });
    }

    const conversation = await Conversation.findById(
      message.conversationId
    );

    if (!conversation) {
      return socket.emit("error", {
        message: "Conversation not found",
      });
    }

    // Check access
    if (socket.userType === "customer") {
      if (
        conversation.customerId.toString() !== socket.userId.toString()
      ) {
        return socket.emit("error", {
          message: "Access denied",
        });
      }
    }

    // Mark as read
    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();

      // Update conversation unread count
      const userType =
        socket.userType === "customer" ? "customer" : "admin";

      if (conversation.unreadCount[userType] > 0) {
        conversation.unreadCount[userType] -= 1;
        await conversation.save();
      }
    }

    socket.emit("read_confirmed", {
      success: true,
      messageId: message._id,
    });
  } catch (error) {
    console.error("Handle mark as read error:", error);
    socket.emit("error", {
      message: "Failed to mark message as read",
      error: error.message,
    });
  }
};

module.exports = {
  handleCustomerMessage,
  handleAdminMessage,
  handleMarkAsRead,
  setSocketApi,
};

