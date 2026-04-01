import nodemailer from 'nodemailer';

const REQUIRED = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM'];

function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
}

function createTransporter() {
  validateEnv();
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function clean(v = '') { return String(v).replace(/\r/g, '').trim(); }

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

    const safeMeta = metadata && typeof metadata === 'object'
      ? Object.entries(metadata)
          .map(([k, v]) => `${k}: ${clean(v)}`)
          .join('\n')
      : '';

    const finalBody = safeMeta ? `${clean(body)}\n\n-----\nMetadata\n${safeMeta}` : clean(body);

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: clean(to),
      cc: clean(cc),
      subject: clean(subject),
      text: finalBody,
      replyTo: process.env.SMTP_USER,
    });

    return res.status(200).json({ ok: true, messageId: info.messageId });
  } catch (error) {
    const raw = error?.message || 'Error enviando correo';
    const msg = /535-5\.7\.8|BadCredentials|Username and Password not accepted/i.test(raw)
      ? 'Autenticación rechazada por Gmail. En Vercel debes usar SMTP_USER=energiapatio@gmail.com y en SMTP_PASS una Contraseña de aplicación de Google de 16 dígitos, no la clave normal de la cuenta.'
      : raw;
    return res.status(500).json({ ok: false, error: msg });
  }
}
