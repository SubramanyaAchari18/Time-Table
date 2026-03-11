const EMAIL_FUNCTION_URL = import.meta.env.VITE_CALENDAR_EMAIL_FUNCTION_URL;

export function formatEventReminderEmail(event) {
  const date = new Date(event.eventDate + "T00:00:00");
  const formatted = date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const subject = "Upcoming Exam Reminder";
  const text = [
    "You have an upcoming exam scheduled.",
    "",
    `Event: ${event.title}`,
    `Date: ${formatted}`,
    "",
    "Reminder: This exam is approaching soon. Prepare accordingly.",
  ].join("\n");

  return { to: "", subject, text };
}

export async function sendEventEmailReminder(event, user) {
  if (!EMAIL_FUNCTION_URL) {
    throw new Error(
      "Calendar email function URL is not configured (VITE_CALENDAR_EMAIL_FUNCTION_URL).",
    );
  }
  if (!user.email) {
    throw new Error("User does not have an email address.");
  }

  const email = formatEventReminderEmail(event);

  const body = {
    to: user.email,
    subject: email.subject,
    text: email.text,
    metadata: {
      eventId: event.id,
      userId: event.userId,
      eventDate: event.eventDate,
      eventType: event.eventType,
    },
  };

  const res = await fetch(EMAIL_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error("Failed to send email reminder.");
  }
}
