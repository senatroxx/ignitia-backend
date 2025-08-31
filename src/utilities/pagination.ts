import Joi from "joi";

export type TPaginationQuery = {
  page?: number;
  perPage?: number;
  all?: string;
};

export interface PaginationResult<T> {
  current_page: number;
  total_page: number;
  total_records: number;
  records: T[];
}

export interface PaginationData<T> {
  count: number;
  rows: T[];
}

export const paginationSchema = {
  page: Joi.number().min(1).default(1),
  perPage: Joi.number().min(1).default(10),
};

export const offsetPagination = (page: number, limit: number) =>
  page < 1 ? 0 : Number(page - 1) * Number(limit);

export function pagination<T>(
  data: PaginationData<T>,
  current_page: number = 1,
  limit: number = 10
): PaginationResult<T> {
  const total_page = Math.ceil(data.count / limit);
  const total_records = data.count;
  const records = data.rows;

  return {
    current_page,
    total_page,
    total_records,
    records,
  };
}
