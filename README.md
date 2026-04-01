
# Formulario Operaciones Energía - versión simple

Esta versión fue optimizada para subir fácil a GitHub y deployar en Vercel con muy pocos archivos.

## Estructura
- `index.html`: frontend completo
- `api/send-maintenance-email.js`: función serverless de envío
- `package.json`: dependencia `nodemailer`
- `vercel.json`: configuración de Vercel

## Variables de entorno en Vercel
- SMTP_HOST
- SMTP_PORT
- SMTP_SECURE
- SMTP_USER
- SMTP_PASS
- MAIL_FROM
