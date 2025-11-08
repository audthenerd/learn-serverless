import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { callAI } from "../../utils/ai-helper";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.TABLE_NAME;
const aiApiKey = process.env.AI_API_KEY;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Parse the request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { conversationId } = body;

    if (!conversationId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Missing required field: conversationId",
        }),
      };
    }

    // Get the conversation from DynamoDB
    const getParams = {
      TableName: tableName,
      Key: {
        "conversation-id": conversationId,
      },
    };

    const data = await ddbDocClient.send(new GetCommand(getParams));

    if (!data.Item) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Conversation not found",
        }),
      };
    }

    // Validate AI API key is configured
    if (!aiApiKey) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "AI API key is not configured",
        }),
      };
    }

    const conversation = data.Item;
    const messages = conversation.messages || [];
    const personas = conversation.personas;

    // Validate messages exist
    if (!messages || messages.length === 0) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Conversation has no messages to summarize",
        }),
      };
    }

    // Build conversation transcript for summarization
    const transcript = messages
      .map((msg: any) => `${msg.from}: ${msg.message}`)
      .join("\n");

    // Generate summary using AI
    const systemPrompt = personas
      ? `Summarize this debate between a ${personas.initiator.job_title} and a ${personas.responder.job_title}. Highlight the key arguments from both perspectives and any points of agreement or disagreement.`
      : "Summarize this conversation, highlighting the key points discussed.";

    const summary = await callAI(
      [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Please summarize the following conversation:\n\n${transcript}`,
        },
      ],
      aiApiKey
    );

    // Save the updated conversation with summary
    const updatedConversation = {
      ...conversation,
      summary,
    };

    const putParams = {
      TableName: tableName,
      Item: updatedConversation,
    };

    await ddbDocClient.send(new PutCommand(putParams));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        conversationId,
        summary,
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
        message: "Failed to summarize conversation",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
