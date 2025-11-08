import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.TABLE_NAME;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Parse the request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { initialMessage, personas } = body;

    if (!initialMessage || initialMessage.trim() === "") {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Missing required field: initialMessage (cannot be empty)",
        }),
      };
    }

    if (!personas) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Missing required field: personas",
        }),
      };
    }

    // Validate personas structure
    if (!personas.initiator || !personas.responder) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "personas must contain both 'initiator' and 'responder'",
        }),
      };
    }

    // Generate UUID for new conversation
    const conversationId = randomUUID();

    // Create first message from initiator with initialMessage
    const firstMessage = {
      from: "initiator",
      message: initialMessage,
    };

    // Create conversation with first message from initiator and personas
    const params = {
      TableName: tableName,
      Item: {
        "conversation-id": conversationId,
        personas,
        messages: [firstMessage],
      },
    };

    await ddbDocClient.send(new PutCommand(params));

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        conversationId: conversationId,
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Failed to create conversation",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
