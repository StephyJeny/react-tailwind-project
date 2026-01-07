import express from 'express';
import cors from 'cors';
import sgMail from '@sendgrid/mail';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'email', timestamp: new Date().toISOString() });
});

// Generic email sender for transactional messages
app.post('/api/email/send', async (req, res) => {
  const { to, subject, html, text, kind = 'transactional' } = req.body || {};
  const FROM_EMAIL = process.env.FROM_EMAIL || process.env.VITE_FROM_EMAIL;
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || process.env.VITE_SENDGRID_API_KEY;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
  }

  // Fallback to console in development if SendGrid not configured
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
    return res.status(500).json({ error: 'Failed to send email' });
  }
});

app.listen(PORT, () => {
  console.log(`Email server running on http://localhost:${PORT}`);
});

