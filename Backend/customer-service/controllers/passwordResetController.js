const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const PasswordReset = require("../models/PasswordReset");
const Customer = require("../models/Customer");
const { sendEmail } = require("../services/emailService");

const OTP_TTL_MINUTES = parseInt(process.env.OTP_TTL_MIN) || 10;
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS) || 5;
const RESET_TOKEN_EXPIRY = "5m"; // 5 minutes for reset token

/**
 * Generate a random 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Request password reset - Step 1: Send OTP to email
 * POST /api/customers/password/forgot
 */
exports.requestReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email là bắt buộc",
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Generate OTP
    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    // Save OTP to database
    const passwordReset = new PasswordReset({
      email: normalizedEmail,
      otpHash,
      expiresAt,
      meta: {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get("user-agent") || "",
      },
    });

    await passwordReset.save();

    // Send email with OTP
    const emailSubject = "Mã đặt lại mật khẩu";
    const emailHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f766e;">Đặt lại mật khẩu</h2>
        <p>Xin chào,</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
        <p style="font-size: 18px; font-weight: bold; color: #0f766e; text-align: center; padding: 20px; background: #f0fdfa; border-radius: 8px; margin: 20px 0;">
          Mã OTP của bạn: <span style="font-size: 24px; letter-spacing: 4px;">${otp}</span>
        </p>
        <p>Mã này có hiệu lực trong <strong>${OTP_TTL_MINUTES} phút</strong>.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        <p style="margin-top: 24px;">Trân trọng,<br/>Đội ngũ Nhà hàng</p>
      </div>
    `;

    const emailText = `
Đặt lại mật khẩu

Xin chào,

Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.

Mã OTP của bạn: ${otp}

Mã này có hiệu lực trong ${OTP_TTL_MINUTES} phút.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

Trân trọng,
Đội ngũ Nhà hàng
    `;

    await sendEmail({
      to: normalizedEmail,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    });

    // Always return success (don't reveal if email exists)
    res.json({
      success: true,
      message: "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mã OTP qua email.",
    });
  } catch (error) {
    console.error("Request password reset error:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi. Vui lòng thử lại sau.",
    });
  }
};

/**
 * Verify OTP - Step 2: Verify OTP and issue reset token
 * POST /api/customers/password/verify-otp
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email và mã OTP là bắt buộc",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpString = String(otp).trim();

    // Find the most recent valid, unused OTP for this email
    const passwordReset = await PasswordReset.findOne({
      email: normalizedEmail,
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!passwordReset) {
      return res.status(400).json({
        success: false,
        message: "Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.",
      });
    }

    // Check if max attempts reached
    if (passwordReset.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: "Đã vượt quá số lần thử cho phép. Vui lòng yêu cầu mã OTP mới.",
      });
    }

    // Verify OTP
    const isOtpValid = await bcrypt.compare(otpString, passwordReset.otpHash);

    if (!isOtpValid) {
      // Increment attempts
      passwordReset.attempts += 1;
      await passwordReset.save();

      const remainingAttempts = OTP_MAX_ATTEMPTS - passwordReset.attempts;
      return res.status(400).json({
        success: false,
        message: `Mã OTP không đúng. Bạn còn ${remainingAttempts} lần thử.`,
        remainingAttempts,
      });
    }

    // OTP is valid - generate reset token
    const resetToken = jwt.sign(
      { email: normalizedEmail, passwordResetId: passwordReset._id },
      process.env.RESET_JWT_SECRET || process.env.JWT_SECRET,
      { expiresIn: RESET_TOKEN_EXPIRY }
    );

    // Mark OTP as used
    passwordReset.used = true;
    await passwordReset.save();

    res.json({
      success: true,
      message: "Mã OTP hợp lệ",
      data: {
        resetToken,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi. Vui lòng thử lại sau.",
    });
  }
};

/**
 * Reset password - Step 3: Reset password with token
 * POST /api/customers/password/reset
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword, resetToken } = req.body;

    if (!email || !newPassword || !resetToken) {
      return res.status(400).json({
        success: false,
        message: "Email, mật khẩu mới và reset token là bắt buộc",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(
        resetToken,
        process.env.RESET_JWT_SECRET || process.env.JWT_SECRET
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Reset token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã OTP mới.",
      });
    }

    // Verify email matches token
    if (decoded.email !== normalizedEmail) {
      return res.status(401).json({
        success: false,
        message: "Email không khớp với reset token.",
      });
    }

    // Find customer
    const customer = await Customer.findOne({ email: normalizedEmail });
    if (!customer) {
      // Don't reveal if customer exists
      return res.json({
        success: true,
        message: "Nếu email tồn tại trong hệ thống, mật khẩu đã được đặt lại.",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update customer password
    customer.password = hashedPassword;
    await customer.save();

    // Mark all password reset records for this email as used
    await PasswordReset.updateMany(
      { email: normalizedEmail, used: false },
      { $set: { used: true } }
    );

    res.json({
      success: true,
      message: "Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập với mật khẩu mới.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi. Vui lòng thử lại sau.",
    });
  }
};

