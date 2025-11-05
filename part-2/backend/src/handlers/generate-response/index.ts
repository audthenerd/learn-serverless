import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.TABLE_NAME;
const aiApiKey = process.env.AI_API_KEY || "";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Event:", JSON.stringify(event, null, 2));

  try {
    // Parse the request body
    const body = event.body ? JSON.parse(event.body) : {};
    let { conversationId, message } = body;

    if (!message) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Missing required field: message",
        }),
      };
    }

    // Generate UUID if conversationId is not provided
    const isNewConversation = !conversationId;
    if (isNewConversation) {
      conversationId = randomUUID();
    }

    const timestamp = new Date().toISOString();

    // Get existing conversation or initialize new messages array
    let messages: string[] = [];
    let originalTimestamp = timestamp;

    if (!isNewConversation) {
      // Fetch existing conversation to get current messages
      const getParams = {
        TableName: tableName,
        Key: {
          "conversation-id": conversationId,
        },
      };

      const existingData = await ddbDocClient.send(new GetCommand(getParams));
      if (existingData.Item && existingData.Item.messages) {
        messages = existingData.Item.messages as string[];
      }
      if (existingData.Item && existingData.Item.timestamp) {
        originalTimestamp = existingData.Item.timestamp as string;
      }
    }

    // Append new user message
    messages.push(message);

    // Save new conversation before calling AI (so user message is persisted)
    if (isNewConversation) {
      const initialSaveParams = {
        TableName: tableName,
        Item: {
          "conversation-id": conversationId,
          messages,
          timestamp: originalTimestamp,
          updatedAt: timestamp,
        },
      };
      await ddbDocClient.send(new PutCommand(initialSaveParams));
    }

    // Generate AI response by calling the Lambda URL
    const aiRequest = {
      messages: messages.map((msg, index) => ({
        role: index % 2 === 0 ? "user" : "assistant",
        content: msg,
      })),
      max_tokens: 500,
      temperature: 0.7,
    };

    const aiResponse = await fetch(
      "https://4ebp5kndnp43j6uqz7y53u4dly0jwule.lambda-url.ap-southeast-1.on.aws/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aiApiKey}`,
        },
        body: JSON.stringify(aiRequest),
      }
    );

    if (!aiResponse.ok) {
      throw new Error(
        `AI service returned ${aiResponse.status}: ${aiResponse.statusText}`
      );
    }

    const aiData = (await aiResponse.json()) as {
      choices: Array<{
        message: {
          content: string;
        };
      }>;
    };

    // Extract the generated message from the response
    const generatedResponse = aiData.choices[0].message.content;

    // Append AI response to messages
    messages.push(generatedResponse);

    // Update the conversation with the generated response
    const updateParams = {
      TableName: tableName,
      Item: {
        "conversation-id": conversationId,
        messages,
        timestamp: originalTimestamp,
        updatedAt: new Date().toISOString(),
      },
    };

    await ddbDocClient.send(new PutCommand(updateParams));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        conversationId,
        response: generatedResponse,
        timestamp,
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
        message: "Failed to generate response",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
