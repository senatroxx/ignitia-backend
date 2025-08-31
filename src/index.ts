import express, { type Application } from "express";
import helmet from "helmet";
import cors from "cors";
import http from "http";

import { HTTPMiddleware } from "@middleware/http.middleware";

import LoggerManager from "@utilities/logger";
import { Logger } from "winston";

import env from "@config/env";

import "reflect-metadata";
import "module-alias/register";
import AppRouter from "@routes/app";
import { ErrorHandler } from "@config/http";

class Server {
  private app: Application;
  private server: http.Server;
  private port: string | number;
  private appRouter: AppRouter;
  private httpMiddleware: HTTPMiddleware;
  private appLogger: Logger = LoggerManager.getInstance().get("app");

  constructor() {
    this.app = express();
    this.port = env.SERVER.PORT || 3000;
    this.appRouter = new AppRouter();
    this.httpMiddleware = new HTTPMiddleware();

    this.initLogger();
    this.initMiddleware();
    this.initRoutes();
    // this.initDatabase();
    // this.initServices();
    // this.initQueue();
    this.initGracefulShutdown();
  }

  private initLogger(): void {
    const loggerManager = LoggerManager.getInstance();

    loggerManager.create("app");
    loggerManager.create("queue");
  }

  private initMiddleware(): void {
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: "*",
      })
    );
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private initRoutes(): void {
    this.app.use(this.httpMiddleware.requestHandler);
    this.app.get("/", () => {
      throw new ErrorHandler("Not Found", null, 404);
    });
    this.app.use("/api", this.appRouter.router);
    this.app.use(() => {
      throw new ErrorHandler("Not Found", null, 404);
    });
    this.app.use(this.httpMiddleware.errorHandler);
  }

  private async initGracefulShutdown(): Promise<void> {
    const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGQUIT"];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        this.appLogger.info(`

          🚨 Received ${signal}, starting graceful shutdown...
        `);

        if (this.server) {
          this.server.close((err) => {
            if (err) {
              this.appLogger.error("❌ Failed to close HTTP server:", err);
              process.exit(1);
            }
            this.appLogger.info("✅ HTTP server closed");
          });
        }

        // 🔹 Add this to manually exit if everything is closed
        this.appLogger.info(`
          
          ✅ All services closed. Exiting...
          `);
        process.exit(0);
      });
    });
  }

  public async start() {
    this.server = this.app.listen(this.port, () => {
      console.clear();

      this.appLogger.info(`
        🚀 Server running in ${env.SERVER.MODE} mode
        🔗 http://localhost:${this.port}/ or http://127.0.0.1:${this.port}/
        📅 Started at: ${new Date().toISOString()}
      `);
    });
  }
}

const server = new Server();
server.start().catch((error) => {
  process.exit(1);
});
