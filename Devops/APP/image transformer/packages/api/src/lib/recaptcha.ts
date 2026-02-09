import { config } from "../config.js";

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export async function verifyCaptcha(token: string): Promise<boolean> {
  // Dev bypass: skip if secret key not configured
  if (!config.recaptchaSecretKey) {
    return true;
  }

  const res = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: config.recaptchaSecretKey,
      response: token,
    }),
  });

  const data = (await res.json()) as { success: boolean };
  return data.success;
}
