import nodemailer from 'nodemailer';

const REQUIRED = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM'];

function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
  }
}

function createTransporter() {
  validateEnv();

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function sanitize(text = '') {
  return String(text).replace(/\r/g, '').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  try {
    const { to, cc, subject, body, metadata } = req.body || {};

    if (!to || !subject || !body) {
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios: to, subject, body' });
    }

    const transporter = createTransporter();

    const cleanTo = sanitize(to);
    const cleanCc = sanitize(cc || '');
    const cleanSubject = sanitize(subject);
    const cleanBody = String(body || '').trim();

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: cleanTo,
      cc: cleanCc || undefined,
      subject: cleanSubject,
      text: cleanBody,
      replyTo: process.env.REPLY_TO || undefined,
      headers: metadata?.activo
        ? {
            'X-Patio-Activo': sanitize(metadata.activo),
            'X-Patio-Prioridad': sanitize(metadata.prioridad || ''),
            'X-Patio-Tecnico': sanitize(metadata.tecnico || ''),
          }
        : undefined,
    });

    return res.status(200).json({
      ok: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Error interno enviando correo',
    });
  }
}
