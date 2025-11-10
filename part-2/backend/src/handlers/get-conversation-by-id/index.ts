/**
 * Get Conversation by ID Handler
 *
 * Retrieves a single conversation by its ID from DynamoDB, including all messages, personas, and summary.
 * Uses middy middleware for request validation and response formatting.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import middy from "@middy/core";
import {
  zodValidator,
  httpResponseFormatter,
} from "../../middleware/middleware";
import { GetConversationByIdEventSchema } from "./schema";
import { getConversationById } from "../../utils/db-helper";

const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<Partial<APIGatewayProxyResult>> => {
  console.log("Event:", JSON.stringify(event, null, 2));

  const conversationId = event.pathParameters!.id!;

  const conversation = await getConversationById(conversationId);

  if (!conversation) {
    const error: any = new Error("Conversation not found");
    error.statusCode = 404;
    throw error;
  }

  return { body: JSON.stringify(conversation) };
};

export const handler = middy(baseHandler)
  .use(zodValidator(GetConversationByIdEventSchema))
  .use(httpResponseFormatter());
