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
    <div style="background:#1a1412;border-radius:16px 16px 0 0;padding:32px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">💅</div>
      <h1 style="color:#C4728A;font-family:Georgia,serif;font-size:24px;margin:0 0 4px;">beauty room nini</h1>
      <p style="color:#f7e8ed;font-size:13px;margin:0;">Alcobendas · Madrid</p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:32px;border-left:1px solid #e8c5ce;border-right:1px solid #e8c5ce;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;">✅</div>
        <h2 style="color:#1a1412;font-family:Georgia,serif;font-size:22px;margin:8px 0 4px;">¡Cita confirmada!</h2>
        <p style="color:#6b6360;font-size:14px;margin:0;">Hola ${datos.clienteNombre}, te esperamos.</p>
      </div>

      <!-- Detalles -->
      <div style="background:#f7e8ed;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#6b6360;font-size:13px;width:40%;">Servicio</td>
            <td style="padding:8px 0;color:#1a1412;font-size:13px;font-weight:600;">${datos.servicio}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b6360;font-size:13px;border-top:1px solid #e8c5ce;">Profesional</td>
            <td style="padding:8px 0;color:#1a1412;font-size:13px;font-weight:600;border-top:1px solid #e8c5ce;">${datos.profesional}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b6360;font-size:13px;border-top:1px solid #e8c5ce;">Fecha</td>
            <td style="padding:8px 0;color:#1a1412;font-size:13px;font-weight:600;border-top:1px solid #e8c5ce;">${fechaFormateada}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b6360;font-size:13px;border-top:1px solid #e8c5ce;">Hora</td>
            <td style="padding:8px 0;color:#1a1412;font-size:13px;font-weight:600;border-top:1px solid #e8c5ce;">${datos.horaInicio}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b6360;font-size:13px;border-top:1px solid #e8c5ce;">Duración</td>
            <td style="padding:8px 0;color:#1a1412;font-size:13px;font-weight:600;border-top:1px solid #e8c5ce;">${datos.duracionMin} min</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b6360;font-size:13px;border-top:1px solid #e8c5ce;">Precio</td>
            <td style="padding:8px 0;color:#C4728A;font-size:15px;font-weight:700;border-top:1px solid #e8c5ce;">${datos.precio.toFixed(2)} €</td>
          </tr>
        </table>
      </div>

      <!-- Dirección -->
      <div style="text-align:center;padding:16px;background:#f4f1ef;border-radius:12px;margin-bottom:24px;">
        <p style="color:#6b6360;font-size:13px;margin:0 0 4px;">📍 Dirección</p>
        <p style="color:#1a1412;font-size:14px;font-weight:600;margin:0;">Alcobendas, Madrid</p>
        <p style="color:#6b6360;font-size:13px;margin:4px 0 0;">Para modificaciones llama al salón</p>
      </div>

      <p style="color:#6b6360;font-size:12px;text-align:center;margin:0;">
        Si necesitas cancelar o modificar tu cita, contáctanos con al menos 24h de antelación.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#1a1412;border-radius:0 0 16px 16px;padding:20px;text-align:center;">
      <p style="color:#6b6360;font-size:12px;margin:0;">Beauty Room Nini · Alcobendas, Madrid</p>
    </div>
  </div>
</body>
</html>`;

  const result = await resend.emails.send({
    from: "Beauty Room Nini <citas@beautyroomnini.es>",
    to: datos.clienteEmail,
    subject: "✅ Cita confirmada — Beauty Room Nini",
    html,
  });

  if (result.error) {
    console.error("Resend error:", JSON.stringify(result.error));
    throw new Error(result.error.message);
  }

  return result;
}
