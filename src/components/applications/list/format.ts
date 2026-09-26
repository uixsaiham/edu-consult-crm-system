/** "21 Aug 2026, 5:01 pm" in UTC so server and browser render the same text. */
export function formatCreated(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const time = d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
  return `${date}, ${time}`;
}

/** WhatsApp chat link; UK numbers starting 07 are converted to +44. */
export function whatsappLink(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("07")) digits = `44${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}
