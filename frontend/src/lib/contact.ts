/**
 * Datos de contacto publicos del sitio.
 * FUENTE UNICA DE VERDAD: si cambia el numero o el correo, se edita aqui
 * y queda actualizado en el footer, el boton flotante, el formulario de
 * compra y el correo de confirmacion.
 */

/** Solo digitos, con codigo de pais (formato que exige wa.me). */
export const WHATSAPP_NUMBER = "18092677792";

/** Como se muestra al usuario. */
export const WHATSAPP_DISPLAY = "+1 809 267 7792";

/** Correo de soporte visible. */
export const CONTACT_EMAIL = "soporte@novalinkdo.com";

/** Enlace de WhatsApp, con mensaje pre-cargado opcional. */
export function waLink(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
