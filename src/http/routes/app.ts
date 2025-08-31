import { Router } from "express";
import BlogRouter from "./post";

export default class AppRouter {
  public router: Router;
  private BlogRouter: BlogRouter;

  constructor() {
    this.router = Router();
    this.BlogRouter = new BlogRouter();

    this.initialize();
  }

  private initialize(): void {
    this.router.use("/posts", this.BlogRouter.routerGroup);
  }
}
