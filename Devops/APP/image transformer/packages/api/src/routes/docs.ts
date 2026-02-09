import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parse } from "yaml";

const docsRouter = Router();

// Resolve openapi.yaml relative to this file (works in both src/ and dist/)
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const specPath = path.resolve(currentDir, "..", "openapi.yaml");
const specFile = fs.readFileSync(specPath, "utf-8");
const spec = parse(specFile);

docsRouter.use("/", swaggerUi.serve, swaggerUi.setup(spec));

export { docsRouter };
