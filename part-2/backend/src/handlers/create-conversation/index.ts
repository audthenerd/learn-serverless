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
  console.log("Event:", JSON.stringify(event, null, 2));

  try {
    // Parse the request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { topic } = body;

    if (!topic) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Missing required field: topic",
        }),
      };
    }

    // Generate UUID for new conversation
    const conversationId = randomUUID();
    const timestamp = new Date().toISOString();

    // Create conversation with empty message array
    const params = {
      TableName: tableName,
      Item: {
        "conversation-id": conversationId,
        topic,
        messages: [],
        timestamp,
        updatedAt: timestamp,
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
        "conversation-id": conversationId,
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
