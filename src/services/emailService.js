// Email service for sending verification emails
// You can use SendGrid, Nodemailer with Gmail, or other email providers

class EmailService {
  constructor() {
    // Configure your email provider here
    this.provider = 'console'; // 'sendgrid', 'gmail', 'console' for development
  }

  async sendVerificationEmail(email, verificationToken, userName) {
    const verificationUrl = `${window.location.origin}/auth?verify=${verificationToken}`;
    
    const emailContent = {
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome ${userName}!</h2>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            If you didn't create an account, please ignore this email.
          </p>
        </div>
      `
    };

    return this.sendEmail(emailContent);
  }

  async sendPasswordResetEmail(email, resetToken, userName) {
    const resetUrl = `${window.location.origin}/auth?reset=true&token=${resetToken}`;
    
    const emailContent = {
      to: email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hi ${userName},</p>
          <p>You requested to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #DC2626; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `
    };

    return this.sendEmail(emailContent);
  }

  async sendEmail(emailContent) {
    switch (this.provider) {
      case 'console':
        // Development mode - log to console
        console.log('📧 Email would be sent:');
        console.log('To:', emailContent.to);
        console.log('Subject:', emailContent.subject);
        console.log('Content:', emailContent.html);
        
        // Show notification in UI for development
        this.showDevNotification(emailContent);
        return { success: true, messageId: 'dev-' + Date.now() };

      case 'sendgrid':
        return this.sendWithSendGrid(emailContent);

      case 'gmail':
        return this.sendWithGmail(emailContent);

      default:
        throw new Error('Email provider not configured');
    }
  }

  showDevNotification(emailContent) {
    // Extract verification/reset URL from email content
    const urlMatch = emailContent.html.match(/href="([^"]*(?:verify|token)[^"]*)"/);
    if (urlMatch) {
      const url = urlMatch[1];
      
      // Create a temporary notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: #4F46E5; color: white; padding: 16px; border-radius: 8px;
        max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: Arial, sans-serif; font-size: 14px;
      `;
      
      notification.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">📧 Development Email</div>
        <div style="margin-bottom: 8px;">To: ${emailContent.to}</div>
        <div style="margin-bottom: 12px;">${emailContent.subject}</div>
        <a href="${url}" style="color: #93C5FD; text-decoration: underline;" 
           onclick="this.parentElement.remove()">
          Click here to ${emailContent.subject.includes('Verify') ? 'verify' : 'reset'}
        </a>
        <button onclick="this.parentElement.remove()" 
                style="float: right; background: none; border: none; color: white; cursor: pointer; font-size: 16px;">
          ×
        </button>
      `;
      
      document.body.appendChild(notification);
      
      // Auto-remove after 30 seconds
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 30000);
    }
  }

  async sendWithSendGrid(emailContent) {
    // Implement SendGrid integration
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(import.meta.env.VITE_SENDGRID_API_KEY);
    
    try {
      const msg = {
        to: emailContent.to,
        from: import.meta.env.VITE_FROM_EMAIL,
        subject: emailContent.subject,
        html: emailContent.html,
      };
      
      const response = await sgMail.send(msg);
      return { success: true, messageId: response[0].headers['x-message-id'] };
    } catch (error) {
      console.error('SendGrid error:', error);
      throw new Error('Failed to send email via SendGrid');
    }
  }

  async sendWithGmail(emailContent) {
    // Implement Gmail/Nodemailer integration
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: import.meta.env.VITE_GMAIL_USER,
        pass: import.meta.env.VITE_GMAIL_APP_PASSWORD, // Use App Password, not regular password
      },
    });
    
    try {
      const info = await transporter.sendMail({
        from: import.meta.env.VITE_FROM_EMAIL,
        to: emailContent.to,
        subject: emailContent.subject,
        html: emailContent.html,
      });
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Gmail error:', error);
      throw new Error('Failed to send email via Gmail');
    }
  }
}

export const emailService = new EmailService();