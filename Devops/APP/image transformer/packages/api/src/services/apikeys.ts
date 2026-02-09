import crypto from "node:crypto";
import { prisma } from "../lib/db.js";

const KEY_PREFIX = "imgf_";

/**
 * Generate a new API key for a user.
 * Returns the raw key (shown once) and the saved record.
 */
export async function createApiKey(userId: string, name: string) {
  const raw = KEY_PREFIX + crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 12); // e.g. "imgf_abc1234"

  const apiKey = await prisma.apiKey.create({
    data: { userId, name, prefix, hash },
  });

  // Return raw key only once — it is never stored
  return { key: raw, id: apiKey.id, name: apiKey.name, prefix: apiKey.prefix, createdAt: apiKey.createdAt };
}

export async function listApiKeys(userId: string) {
  return prisma.apiKey.findMany({
    where: { userId, revokedAt: null },
    select: { id: true, name: true, prefix: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeApiKey(userId: string, keyId: string) {
  const key = await prisma.apiKey.findFirst({
    where: { id: keyId, userId },
  });

  if (!key) return null;
  if (key.revokedAt) return key;

  return prisma.apiKey.update({
    where: { id: keyId },
    data: { revokedAt: new Date() },
  });
}
