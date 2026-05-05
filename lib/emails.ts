import { Resend } from "resend";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface DatosConfirmacion {
  clienteEmail: string;
  clienteNombre: string;
  servicio: string;
  profesional: string;
  fecha: string;
  horaInicio: string;
  duracionMin: number;
  precio: number;
}

export async function enviarConfirmacionReserva(datos: DatosConfirmacion) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fechaFormateada = format(parseISO(datos.fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cita confirmada</title>
</head>
<body style="margin:0;padding:0;background:#fdf6f0;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="background:#1a1412;border-radius:16px 16px 0 0;padding:36px 32px 28px;text-align:center;">
      <img src="https://beautyroomnini.es/logo.png" alt="Beauty Room Nini" width="100" height="100" style="border-radius:50%;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
      <p style="color:#a08880;font-size:12px;margin:0;letter-spacing:1.5px;text-transform:uppercase;">Alcobendas · Madrid</p>
    </div>

    <!-- Confirmación -->
    <div style="background:#ffffff;padding:32px;border-left:1px solid #e8c5ce;border-right:1px solid #e8c5ce;">

      <!-- Saludo -->
      <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-block;background:#f7e8ed;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;margin-bottom:16px;">🌸</div>
        <h2 style="color:#1a1412;font-family:Georgia,serif;font-size:22px;margin:0 0 8px;">¡Tu cita está confirmada!</h2>
        <p style="color:#6b6360;font-size:14px;margin:0;">Hola <strong style="color:#1a1412;">${datos.clienteNombre}</strong>, te esperamos con los brazos abiertos.</p>
      </div>

      <!-- Detalles de la cita -->
      <div style="background:#f7e8ed;border-radius:14px;padding:22px;margin-bottom:24px;">
        <p style="color:#C4728A;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 14px;">Detalles de tu cita</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:9px 0;color:#6b6360;font-size:13px;width:42%;">Servicio</td>
            <td style="padding:9px 0;color:#1a1412;font-size:13px;font-weight:600;">${datos.servicio}</td>
          </tr>
          <tr>
            <td style="padding:9px 0;color:#6b6360;font-size:13px;border-top:1px solid #e8c5ce;">Profesional</td>
            <td style="padding:9px 0;color:#1a1412;font-size:13px;font-weight:600;border-top:1px solid #e8c5ce;">${datos.profesional}</td>
          </tr>
          <tr>
            <td style="padding:9px 0;color:#6b6360;font-size:13px;border-top:1px solid #e8c5ce;">Fecha</td>
            <td style="padding:9px 0;color:#1a1412;font-size:13px;font-weight:600;border-top:1px solid #e8c5ce;text-transform:capitalize;">${fechaFormateada}</td>
          </tr>
          <tr>
            <td style="padding:9px 0;color:#6b6360;font-size:13px;border-top:1px solid #e8c5ce;">Hora</td>
            <td style="padding:9px 0;color:#1a1412;font-size:13px;font-weight:600;border-top:1px solid #e8c5ce;">${datos.horaInicio} h</td>
          </tr>
          <tr>
            <td style="padding:9px 0;color:#6b6360;font-size:13px;border-top:1px solid #e8c5ce;">Duración</td>
            <td style="padding:9px 0;color:#1a1412;font-size:13px;font-weight:600;border-top:1px solid #e8c5ce;">${datos.duracionMin} min</td>
          </tr>
          <tr>
            <td style="padding:10px 0 0;color:#6b6360;font-size:13px;border-top:1px solid #e8c5ce;">Precio</td>
            <td style="padding:10px 0 0;color:#C4728A;font-size:18px;font-weight:700;border-top:1px solid #e8c5ce;">${datos.precio.toFixed(2)} €</td>
          </tr>
        </table>
      </div>

      <!-- Dirección + Google Maps -->
      <a href="https://www.google.com/maps/search/?api=1&query=Calle+Constitución+53+28100+Alcobendas+Madrid"
         target="_blank"
         style="display:block;text-decoration:none;background:#f4f1ef;border-radius:14px;padding:18px 20px;margin-bottom:20px;border:1px solid #e8c5ce;">
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <div style="font-size:22px;line-height:1;">📍</div>
          <div>
            <p style="color:#1a1412;font-size:14px;font-weight:700;margin:0 0 3px;">Calle Constitución 53</p>
            <p style="color:#6b6360;font-size:13px;margin:0 0 6px;">28100 Alcobendas, Madrid</p>
            <p style="color:#C4728A;font-size:12px;font-weight:600;margin:0;">Ver en Google Maps →</p>
          </div>
        </div>
      </a>

      <!-- Botones de acción -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="width:50%;padding-right:6px;">
            <a href="https://wa.me/34604850249?text=Hola%2C%20quiero%20consultar%20mi%20cita"
               target="_blank"
               style="display:block;background:#25D366;color:#ffffff;text-decoration:none;text-align:center;padding:13px 10px;border-radius:12px;font-size:13px;font-weight:700;">
              💬 WhatsApp
            </a>
          </td>
          <td style="width:50%;padding-left:6px;">
            <a href="https://www.instagram.com/beautyroom.nini"
               target="_blank"
               style="display:block;background:linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);color:#ffffff;text-decoration:none;text-align:center;padding:13px 10px;border-radius:12px;font-size:13px;font-weight:700;">
              📸 @beautyroom.nini
            </a>
          </td>
        </tr>
      </table>

      <p style="color:#a08880;font-size:12px;text-align:center;margin:0;line-height:1.6;">
        Si necesitas cancelar o modificar tu cita, contáctanos<br>con al menos <strong>24 horas de antelación</strong>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#1a1412;border-radius:0 0 16px 16px;padding:22px 32px;text-align:center;">
      <p style="color:#a08880;font-size:12px;margin:0 0 4px;">Beauty Room Nini · Calle Constitución 53, Alcobendas</p>
      <p style="color:#6b6360;font-size:11px;margin:0;">📞 604 850 249 · beautyroomnini.es</p>
    </div>

  </div>
</body>
</html>`;

  const result = await resend.emails.send({
    from: "Beauty Room Nini <citas@beautyroomnini.es>",
    to: datos.clienteEmail,
    subject: "🌸 Cita confirmada — Beauty Room Nini",
    html,
  });

  if (result.error) {
    console.error("Resend error:", JSON.stringify(result.error));
    throw new Error(result.error.message);
  }

  return result;
}
