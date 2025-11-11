import { z } from "zod";

export const zodValidator = (schema: z.ZodSchema) => ({
  before: (request: any) => {
    const result = schema.safeParse(request.event);
    if (!result.success) {
      const error: any = new Error("Validation error");
      error.statusCode = 400;
      error.details = result.error.issues;
      throw error;
    }
  },
});

export const httpResponseFormatter = () => ({
  after: (request: any) => {
    const response = request.response;

    // Add default statusCode if not provided
    if (!response.statusCode) {
      response.statusCode = 200;
    }

    // Add common headers if they don't already exist
    if (!response.headers) {
      response.headers = {};
    }

    response.headers["Content-Type"] =
      response.headers["Content-Type"] || "application/json";
    response.headers["Access-Control-Allow-Origin"] =
      response.headers["Access-Control-Allow-Origin"] || "*";

    return response;
  },
  onError: (request: any) => {
    const error = request.error;
    const statusCode = error.statusCode || 500;

    request.response = {
      statusCode,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: error.message || "Internal server error",
        ...(error.details && { details: error.details }),
      }),
    };
  },
});
