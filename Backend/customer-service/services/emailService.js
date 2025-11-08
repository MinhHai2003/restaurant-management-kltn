const sgMail = require("@sendgrid/mail");

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log("[EMAIL SERVICE] SendGrid API initialized");
} else {
  console.warn("[EMAIL SERVICE] SENDGRID_API_KEY is not configured. Emails will be logged instead of sent.");
}

const stripHtml = (value = "") => value.replace(/<[^>]*>?/gm, "");

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
    const fromAddress = process.env.EMAIL_FROM || "no-reply@restaurant.local";
    
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
    console.error("[EMAIL SERVICE] Failed to send email via SendGrid API:", {
      error: error.message,
      code: error.code,
      response: error.response?.body,
      to,
      subject,
    });
    
    return { 
      delivered: false, 
      simulated: false,
      reason: error.message || "Unknown error",
      error: {
        code: error.code,
        response: error.response?.body,
      }
    };
  }
};

module.exports = {
  sendEmail,
};

