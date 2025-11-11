/**
 * Get All Conversations Handler
 *
 * Retrieves a list of all conversation IDs from DynamoDB with a count of total conversations.
 * Uses middy middleware for automatic response formatting and error handling.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import middy from "@middy/core";
import { httpResponseFormatter } from "../../middleware/middleware";
import { getAllConversationIds } from "../../utils/db-helper";

const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<Partial<APIGatewayProxyResult>> => {
  console.log("Event:", JSON.stringify(event, null, 2));

  const conversationIds = await getAllConversationIds();

  return {
    body: JSON.stringify({
      conversations: conversationIds,
      count: conversationIds.length,
    }),
  };
};

export const handler = middy(baseHandler).use(httpResponseFormatter());
