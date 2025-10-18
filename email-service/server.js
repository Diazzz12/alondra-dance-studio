import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';

const app = express();
app.use(helmet());
app.use(cors({ origin: false }));
app.use(bodyParser.json());

// Env vars
const PORT = process.env.PORT || 8080;
const EMAIL_TOKEN = process.env.EMAIL_TOKEN || '';
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false') === 'true';
const SMTP_USERNAME = process.env.SMTP_USERNAME || '';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'notificaciones@alondrapolespace.es';
const FROM_NAME = process.env.FROM_NAME || 'Alondra Pole Space';

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USERNAME,
    pass: SMTP_PASSWORD,
  },
});

app.post('/send-email', async (req, res) => {
  try {
    const token = req.header('X-EMAIL-TOKEN');
    if (!token || token !== EMAIL_TOKEN) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const { to, subject, html, text } = req.body || {};
    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ error: 'missing fields' });
    }
    const info = await transporter.sendMail({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html: html || undefined,
      text: text || undefined,
    });
    return res.status(200).json({ messageId: info.messageId });
  } catch (e) {
    console.error('send-email error:', e);
    return res.status(500).json({ error: String(e?.message ?? e) });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Email service listening on :${PORT}`);
});




