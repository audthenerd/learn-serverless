import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.TABLE_NAME;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Event:", JSON.stringify(event, null, 2));

  try {
    // Scan the table to get all conversation IDs
    const params = {
      TableName: tableName,
      ProjectionExpression: "#id",
      ExpressionAttributeNames: {
        "#id": "conversation-id",
      },
    };

    const data = await ddbDocClient.send(new ScanCommand(params));

    // Extract conversation IDs from the results
    const conversationIds =
      data.Items?.map((item) => item["conversation-id"]) || [];

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        conversations: conversationIds,
        count: conversationIds.length,
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
        message: "Failed to fetch conversations",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
