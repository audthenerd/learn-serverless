/**
 * Create Conversation Handler
 *
 * Creates a new conversation with personas and an initial message, generating a unique UUID.
 * Uses middy middleware for request validation and response formatting.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import middy from "@middy/core";
import { randomUUID } from "crypto";
import {
  zodValidator,
  httpResponseFormatter,
} from "../../middleware/middleware";
import { CreateConversationEventSchema } from "./schema";
import { createConversation } from "../../utils/db-helper";

const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<Partial<APIGatewayProxyResult>> => {
  const body = JSON.parse(event.body!);
  const { initialMessage, personas } = body;

  // Generate UUID for new conversation
  const conversationId = randomUUID();

  // Create first message from initiator with initialMessage
  const firstMessage = {
    from: "initiator",
    message: initialMessage,
  };

  // Create conversation with first message from initiator and personas
  await createConversation(conversationId, personas, firstMessage);

  return {
    statusCode: 201,
    body: JSON.stringify({
      conversationId: conversationId,
    }),
  };
};

export const handler = middy(baseHandler)
  .use(zodValidator(CreateConversationEventSchema))
  .use(httpResponseFormatter());
