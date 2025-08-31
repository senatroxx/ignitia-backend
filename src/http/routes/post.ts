import BlogController from "@controllers/post.controller";
import { Router } from "express";

export default class BlogRouter {
  public routerGroup: Router;
  private blogController: BlogController;

  constructor() {
    this.routerGroup = Router();
    this.blogController = new BlogController();

    this.initialize();
  }

  private initialize(): void {
    this.blog();
  }

  private blog(): void {
    this.routerGroup.get("/", this.blogController.list);
    this.routerGroup.get("/:id", this.blogController.detail);
  }
}
