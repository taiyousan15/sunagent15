import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { createServer, type Server as HttpServer } from "node:http";
import twilio from "twilio";
import { WebSocketServer, type WebSocket } from "ws";
import type { OpenAIRealtimeClient } from "../clients/openai-realtime-client.js";
import { MediaStreamBridge } from "../bridge/media-stream-bridge.js";
import { generateStreamTwiml } from "./twiml-generator.js";
import type { EnvConfig } from "../types.js";

export class WebhookServer {
  private readonly app: express.Application;
  private readonly httpServer: HttpServer;
  private readonly wss: WebSocketServer;
  private readonly bridge: MediaStreamBridge;
  private readonly openaiClient: OpenAIRealtimeClient;
  private readonly port: number;
  private readonly host: string;
  private readonly baseUrl: string;
  private readonly twilioAuthToken: string;
  private running = false;

  constructor(openaiClient: OpenAIRealtimeClient, config: EnvConfig) {
    this.openaiClient = openaiClient;
    this.port = config.webhookPort;
    this.host = process.env.VOICE_WEBHOOK_HOST ?? "127.0.0.1";
    this.baseUrl = config.webhookBaseUrl;
    this.twilioAuthToken = config.twilioAuthToken.trim();
    this.bridge = new MediaStreamBridge(openaiClient);

    if (!this.twilioAuthToken) {
      throw new Error("TWILIO_AUTH_TOKEN is required to start the voice webhook server");
    }

    this.app = express();
    this.app.use(express.json({ limit: "64kb" }));
    this.app.use(express.urlencoded({ extended: false, limit: "64kb" }));

    this.httpServer = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.httpServer, path: "/voice/stream" });

    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupRoutes(): void {
    const webhookLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 60,
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.get("/health", (_req, res) => {
      res.json({ status: "ok", connections: this.bridge.getActiveConnections() });
    });

    this.app.post("/voice", webhookLimiter, this.verifyTwilioSignature.bind(this), async (_req, res) => {
      try {
        const session = await this.openaiClient.createSession();
        const wsUrl = `${this.baseUrl.replace(/^http/, "ws")}/voice/stream?sessionId=${session.sessionId}`;
        const twiml = generateStreamTwiml({ websocketUrl: wsUrl });

        res.type("text/xml");
        res.send(twiml);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[WebhookServer] /voice error: ${message}`);
        res.status(500).send("<Response><Say>An error occurred.</Say></Response>");
      }
    });

    this.app.post("/voice/status", webhookLimiter, this.verifyTwilioSignature.bind(this), (req, res) => {
      const body = req.body as Record<string, string>;
      const callSid = body.CallSid ?? "unknown";
      const callStatus = body.CallStatus ?? "unknown";
      console.error(`[WebhookServer] Call status update: ${callSid} -> ${callStatus}`);
      res.sendStatus(200);
    });
  }

  private verifyTwilioSignature(req: Request, res: Response, next: NextFunction): void {
    const signature = req.header("X-Twilio-Signature");

    if (!signature) {
      res.sendStatus(403);
      return;
    }

    const fullUrl = `${this.baseUrl.replace(/\/$/, "")}${req.originalUrl}`;
    const isValid = twilio.validateRequest(
      this.twilioAuthToken,
      signature,
      fullUrl,
      req.body as Record<string, string>
    );

    if (!isValid) {
      res.sendStatus(403);
      return;
    }

    next();
  }

  private setupWebSocket(): void {
    this.wss.on("connection", (ws: WebSocket, req) => {
      const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
      const sessionId = url.searchParams.get("sessionId");

      if (!sessionId) {
        ws.close(1008, "Missing sessionId parameter");
        return;
      }

      const session = this.openaiClient.getSession(sessionId);
      if (!session) {
        ws.close(1008, "Invalid sessionId");
        return;
      }

      this.bridge.handleTwilioConnection(ws, sessionId).catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[WebhookServer] Bridge error: ${message}`);
        ws.close(1011, "Bridge setup failed");
      });
    });
  }

  async start(): Promise<void> {
    if (this.running) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.httpServer.listen(this.port, this.host, () => {
        this.running = true;
        console.error(`[WebhookServer] Listening on ${this.host}:${this.port}`);
        resolve();
      });

      this.httpServer.on("error", (error) => {
        reject(new Error(`WebhookServer start failed: ${error.message}`));
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    return new Promise((resolve) => {
      this.wss.close(() => {
        this.httpServer.close(() => {
          this.running = false;
          resolve();
        });
      });
    });
  }

  isRunning(): boolean {
    return this.running;
  }

  getPort(): number {
    return this.port;
  }

  getBridge(): MediaStreamBridge {
    return this.bridge;
  }
}
