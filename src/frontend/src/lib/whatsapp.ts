// WhatsApp deep link utilities for OMKAR JWELLERS order notifications

export const WA_NOTIFICATIONS_KEY = "omkar_whatsapp_notifications";
export const WA_SENT_PREFIX = "omkar_wa_sent_";

/**
 * Build bilingual WhatsApp deep link URL.
 * Phone number is cleaned and prefixed with India country code 91.
 */
export function buildWhatsAppUrl(phone: string, customerName: string): string {
  // Strip all non-digits, remove leading 0 or +91 prefix
  const digits = phone.replace(/\D/g, "");
  const cleaned =
    digits.startsWith("91") && digits.length > 10
      ? digits
      : digits.replace(/^0+/, "");
  const fullPhone = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;

  const message = `नमस्कार ${customerName},\nआपली ऑर्डर तयार आहे. कृपया दुकानात येऊन घेऊन जा.\n– ॐकार ज्वेलर्स\n\nHello ${customerName},\nYour order is ready. Please visit the shop to collect it.\n– Omkar Jewellers`;

  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Open WhatsApp with a pre-filled message.
 * Returns true if opened, false if skipped (phone missing or notifications disabled).
 */
export function triggerWhatsApp(
  phone: string | undefined,
  customerName: string,
  notificationsEnabled: boolean,
): boolean {
  if (!phone || !notificationsEnabled) return false;
  const url = buildWhatsAppUrl(phone, customerName);
  window.open(url, "_blank");
  return true;
}
