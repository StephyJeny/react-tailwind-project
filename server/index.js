import express from 'express';
import cors from 'cors';
import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'email', timestamp: new Date().toISOString() });
});

// Verify SMTP connectivity and credentials
app.get('/api/email/verify-smtp', async (req, res) => {
  const FROM_EMAIL = process.env.FROM_EMAIL || process.env.VITE_FROM_EMAIL;
  const SMTP_HOST = process.env.SMTP_HOST || process.env.VITE_SMTP_HOST;
  const SMTP_PORT = Number(process.env.SMTP_PORT || process.env.VITE_SMTP_PORT || 587);
  const SMTP_SECURE = String(process.env.SMTP_SECURE || process.env.VITE_SMTP_SECURE || 'false') === 'true';
  const SMTP_USER = process.env.SMTP_USER || process.env.VITE_SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS || process.env.VITE_SMTP_PASS;

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      authMethod: 'LOGIN',
      tls: { minVersion: 'TLSv1.2' }
    });
    await transporter.verify();
    res.json({ ok: true, host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_SECURE, user: SMTP_USER });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: 'SMTP verification failed',
      details: error?.response || error?.message || error?.code || 'Unknown error'
    });
  }
});

// Generic email sender for transactional messages
app.post('/api/email/send', async (req, res) => {
  const { to, subject, html, text, kind = 'transactional' } = req.body || {};
  const FROM_EMAIL = process.env.FROM_EMAIL || process.env.VITE_FROM_EMAIL;
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || process.env.VITE_SENDGRID_API_KEY;
  const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || process.env.VITE_EMAIL_PROVIDER || 'sendgrid';
  const SMTP_HOST = process.env.SMTP_HOST || process.env.VITE_SMTP_HOST;
  const SMTP_PORT = Number(process.env.SMTP_PORT || process.env.VITE_SMTP_PORT || 587);
  const SMTP_SECURE = String(process.env.SMTP_SECURE || process.env.VITE_SMTP_SECURE || 'false') === 'true';
  const SMTP_USER = process.env.SMTP_USER || process.env.VITE_SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS || process.env.VITE_SMTP_PASS;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
  }

  // Choose provider: sendgrid or smtp; fallback to console
  if (EMAIL_PROVIDER.toLowerCase() === 'smtp') {
    if (!FROM_EMAIL || !SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn('[email] SMTP not fully configured. Logging email to console.');
      console.log({ to, subject, html });
      return res.json({ success: true, messageId: 'dev-' + Date.now(), fallback: true });
    }
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
        authMethod: 'LOGIN',
        tls: { minVersion: 'TLSv1.2' }
      });
      const info = await transporter.sendMail({
        from: FROM_EMAIL,
        to,
        subject,
        html,
        text: text || '',
        headers: {
          'List-Unsubscribe': '<mailto:noreply@' + (String(FROM_EMAIL).split('@')[1] || 'example.com') + '>'
        }
      });
      return res.json({ success: true, messageId: info.messageId });
    } catch (error) {
      console.error('[email] SMTP error:', error);
      const details = typeof error === 'string'
        ? error
        : (error?.response || error?.message || error?.code || 'Unknown SMTP error');
      return res.status(500).json({ error: 'Failed to send email', details });
    }
  }

  // Default: SendGrid provider
  if (!SENDGRID_API_KEY || !FROM_EMAIL) {
    console.warn('[email] SendGrid not configured. Logging email to console.');
    console.log({ to, subject, html });
    return res.json({ success: true, messageId: 'dev-' + Date.now(), fallback: true });
  }

  try {
    sgMail.setApiKey(SENDGRID_API_KEY);
    const msg = {
      to,
      from: FROM_EMAIL,
      subject,
      html,
      text: text || '',
      headers: {
        'List-Unsubscribe': '<mailto:noreply@' + (FROM_EMAIL.split('@')[1] || 'example.com') + '>',
      },
      mailSettings: {
        sandboxMode: { enable: false },
      },
      categories: [kind],
    };

    const [response] = await sgMail.send(msg);
    const messageId = response.headers['x-message-id'] || response.headers['x-message-id'];
    return res.json({ success: true, messageId });
  } catch (error) {
    console.error('[email] SendGrid error:', error?.response?.body || error);
    const details = error?.response?.body?.errors || error?.message || 'Unknown SendGrid error';
    return res.status(500).json({ error: 'Failed to send email', details });
  }
});

app.listen(PORT, () => {
  console.log(`Email server running on http://localhost:${PORT}`);
});
