import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import data from "@data/blog.json";

import { ValidationMiddleware } from "@middleware/validation.middleware";
import {
  pagination,
  paginationSchema,
  TPaginationQuery,
} from "@utilities/pagination";
import { ErrorHandler, HttpResponse } from "@config/http";
import { truncate } from "@utilities/string";

type TGetAllQuery = {
  search?: string;
} & TPaginationQuery;

type TDetailQuery = {
  id: number;
};

type TBlogPost = {
  id: number;
  title: string;
  content: string;
};

type TBlogPosts = TBlogPost[];

export default class BlogController {
  private blogPosts: TBlogPosts = data;

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = ValidationMiddleware.validateQuery<TGetAllQuery>(
        req.query,
        Joi.object({
          ...paginationSchema,
          search: Joi.string().allow(null, "").optional(),
        })
      );

      let blogData = this.blogPosts;
      if (query.search) {
        blogData = this.blogPosts.filter(
          (item) =>
            item.title.toLowerCase().includes(query.search!.toLowerCase()) ||
            item.content.toLowerCase().includes(query.search!.toLowerCase())
        );
      }

      // Limit posts to query PerPage
      const count = blogData.length;
      blogData = blogData.slice(
        (query.page! - 1) * query.perPage!,
        query.page! * query.perPage!
      );

      const result = pagination<TBlogPost>(
        {
          count,
          rows: blogData.map((post) => ({
            ...post,
            content: truncate(post.content, 200),
          })),
        },
        query.page!,
        query.perPage!
      );

      HttpResponse.success(res, "Posts retrieved successfully", result);
    } catch (err) {
      next(new ErrorHandler(err.message, err.data, err.status));
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = ValidationMiddleware.validateQuery<TDetailQuery>(
        req.params,
        Joi.object({
          id: Joi.number().required(),
        })
      );

      const post = this.blogPosts.find((item) => item.id === query.id);
      if (!post) throw new ErrorHandler("Post not found", null, 404);

      HttpResponse.success(res, "Post retrieved successfully", post);
    } catch (err) {
      next(new ErrorHandler(err.message, err.data, err.status));
    }
  };
}
