import { Router, Request, Response } from "express";
import { requireJwt } from "../middleware/auth.js";
import { createApiKey, listApiKeys, revokeApiKey } from "../services/apikeys.js";

const keysRouter = Router();

// All key routes require JWT auth (dashboard user)
keysRouter.use("/keys", requireJwt);

keysRouter.post("/keys", async (req: Request, res: Response) => {
  try {
    const name = req.body.name || "Default";
    const result = await createApiKey(req.userId!, name);
    res.status(201).json(result);
  } catch (err) {
    console.error("Create key error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

keysRouter.get("/keys", async (req: Request, res: Response) => {
  try {
    const keys = await listApiKeys(req.userId!);
    res.json({ keys });
  } catch (err) {
    console.error("List keys error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

keysRouter.delete("/keys/:id", async (req: Request, res: Response) => {
  try {
    const keyId = req.params.id as string;
    const key = await revokeApiKey(req.userId!, keyId);
    if (!key) {
      res.status(404).json({ error: "API key not found" });
      return;
    }
    res.json({ message: "API key revoked" });
  } catch (err) {
    console.error("Revoke key error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { keysRouter };
