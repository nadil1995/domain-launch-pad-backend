import { Router, Request, Response } from "express";
import {
  signup,
  login,
  generateVerificationToken,
  verifyEmail,
  generatePasswordResetToken,
  resetPassword,
  AppError,
} from "../services/auth.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email.js";
import { verifyCaptcha } from "../lib/recaptcha.js";
import { requireJwt } from "../middleware/auth.js";
import { prisma } from "../lib/db.js";

const authRouter = Router();

authRouter.post("/auth/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, name, captchaToken } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Verify reCAPTCHA (skipped in dev if secret key not set)
    if (captchaToken !== undefined) {
      const captchaValid = await verifyCaptcha(captchaToken);
      if (!captchaValid) {
        res.status(400).json({ error: "reCAPTCHA verification failed" });
        return;
      }
    }

    const result = await signup(email, password, name);

    // Generate verification token and send email (non-blocking)
    generateVerificationToken(result.user.id)
      .then((token) => sendVerificationEmail(email, token))
      .catch((err) => console.error("Failed to send verification email:", err));

    res.status(201).json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password, captchaToken } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Verify reCAPTCHA (skipped in dev if secret key not set)
    if (captchaToken !== undefined) {
      const captchaValid = await verifyCaptcha(captchaToken);
      if (!captchaValid) {
        res.status(400).json({ error: "reCAPTCHA verification failed" });
        return;
      }
    }

    const result = await login(email, password);
    res.json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/auth/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: "Token is required" });
      return;
    }

    const result = await verifyEmail(token);
    res.json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error("Email verification error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/auth/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    // Always return 200 to avoid leaking email existence
    const token = await generatePasswordResetToken(email);
    if (token) {
      sendPasswordResetEmail(email, token).catch((err) =>
        console.error("Failed to send password reset email:", err)
      );
    }

    res.json({ message: "If an account with that email exists, a reset link has been sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/auth/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ error: "Token and password are required" });
      return;
    }

    const result = await resetPassword(token, password);
    res.json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/auth/resend-verification", requireJwt, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.emailVerified) {
      res.json({ message: "Email already verified" });
      return;
    }

    const token = await generateVerificationToken(userId);
    await sendVerificationEmail(user.email, token);

    res.json({ message: "Verification email sent" });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { authRouter };
