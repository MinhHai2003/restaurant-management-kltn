const sgMail = require("@sendgrid/mail");

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log("[EMAIL SERVICE] SendGrid API initialized");
} else {
  console.warn("[EMAIL SERVICE] SENDGRID_API_KEY is not configured. Emails will be logged instead of sent.");
}

const stripHtml = (value = "") => value.replace(/<[^>]*>?/gm, "");

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Get valid from address
const getFromAddress = () => {
  const emailFrom = process.env.EMAIL_FROM || "";
  
  // If EMAIL_FROM is a valid email, use it
  if (isValidEmail(emailFrom)) {
    return emailFrom;
  }
  
  // If EMAIL_FROM contains email in format "Name <email@domain.com>", extract email
  const emailMatch = emailFrom.match(/<([^>]+)>/);
  if (emailMatch && isValidEmail(emailMatch[1])) {
    return emailMatch[1];
  }
  
  // If EMAIL_FROM is not a valid email, try to use SENDGRID_FROM_EMAIL or default
  const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL;
  if (sendgridFromEmail && isValidEmail(sendgridFromEmail)) {
    return sendgridFromEmail;
  }
  
  // Default fallback - SendGrid requires a verified sender email
  // This should be set in Railway environment variables
  console.warn("[EMAIL SERVICE] EMAIL_FROM is not a valid email address. Using default.");
  return "noreply@restaurant.local"; // This will fail if not verified in SendGrid
};

/**
 * Send email via SendGrid with fallback to console log
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional, will be generated from HTML if not provided)
 * @returns {Promise<Object>} Result object with delivered, simulated, and error info
 */
const sendEmail = async ({ to, subject, html, text }) => {
  // Check if SendGrid API is configured
  if (!process.env.SENDGRID_API_KEY) {
    console.log("[EMAIL SERVICE] SENDGRID_API_KEY not configured. Simulated email send:", {
      to,
      subject,
      preview: stripHtml(html || text || ""),
    });
    return { delivered: false, simulated: true };
  }

  try {
    const fromAddress = getFromAddress();
    
    // Validate from address
    if (!isValidEmail(fromAddress)) {
      console.error("[EMAIL SERVICE] Invalid from address:", fromAddress);
      return {
        delivered: false,
        simulated: false,
        reason: `Invalid from address: ${fromAddress}. Please set EMAIL_FROM or SENDGRID_FROM_EMAIL to a valid email address.`,
      };
    }
    
    console.log("[EMAIL SERVICE] Attempting to send email via SendGrid API:", {
      from: fromAddress,
      to,
      subject,
    });

    const msg = {
      to,
      from: fromAddress,
      subject,
      text: text || stripHtml(html || ""),
      html: html || text?.replace(/\n/g, "<br />") || "",
    };

    const [response] = await sgMail.send(msg);

    console.log("[EMAIL SERVICE] Email sent successfully via SendGrid API:", {
      statusCode: response.statusCode,
      messageId: response.headers["x-message-id"],
      to,
      subject,
    });

    return { 
      delivered: true, 
      info: { 
        messageId: response.headers["x-message-id"],
        statusCode: response.statusCode,
      } 
    };
  } catch (error) {
    const errorDetails = {
      error: error.message,
      code: error.code,
      to,
      subject,
    };
    
    // Log detailed error response from SendGrid
    if (error.response?.body) {
      errorDetails.response = error.response.body;
      if (error.response.body.errors) {
        errorDetails.errors = error.response.body.errors;
        console.error("[EMAIL SERVICE] SendGrid API errors:", error.response.body.errors);
      }
    }
    
    console.error("[EMAIL SERVICE] Failed to send email via SendGrid API:", errorDetails);
    
    return { 
      delivered: false, 
      simulated: false,
      reason: error.message || "Unknown error",
      error: {
        code: error.code,
        response: error.response?.body,
        errors: error.response?.body?.errors,
      }
    };
  }
};

module.exports = {
  sendEmail,
};

