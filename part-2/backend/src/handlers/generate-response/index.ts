import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { callAI } from "../../utils/ai-helper";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.TABLE_NAME;
const aiApiKey = process.env.AI_API_KEY || "";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Parse the request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { conversationId, turn } = body;

    // Validate mandatory inputs
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

    if (!turn) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Missing required field: turn",
        }),
      };
    }

    // Validate turn is either 'initiator' or 'responder'
    if (turn !== "initiator" && turn !== "responder") {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "turn must be either 'initiator' or 'responder'",
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

    // Read conversation with conversationId
    const getParams = {
      TableName: tableName,
      Key: {
        "conversation-id": conversationId,
      },
    };

    const convoData = await ddbDocClient.send(new GetCommand(getParams));

    // Return error if conversationId not found
    if (!convoData.Item) {
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

    const convo = convoData.Item;
    const messages = convo.messages || [];
    const personas = convo.personas;

    // Validate personas exist
    if (!personas || !personas.initiator || !personas.responder) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Conversation is missing personas data",
        }),
      };
    }

    // Validate messages exist (should have at least initialMessage from initiator)
    if (!messages || messages.length === 0) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Conversation has no messages",
        }),
      };
    }

    // Get the current persona based on turn
    const currentPersona = personas[turn];

    // Build system prompt with persona context
    const systemPrompt = `You are a ${currentPersona.job_title}.
Traits: ${currentPersona.traits.join(", ")}.
Values: ${currentPersona.values.join(", ")}.
Communication style: ${currentPersona.communication_style}.
Your goal is to argue your perspective in this debate clearly and rationally.`;

    // Convert entire conversation history to AI message format
    const conversationHistory = messages.map((msg: any) => ({
      role: msg.from === turn ? "assistant" : "user",
      content: msg.message,
    }));

    // Build the full context with system prompt and conversation history
    const aiMessages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...conversationHistory,
      {
        role: "user",
        content: `Continue the debate as the ${turn}. Keep response to max 200 characters.`,
      },
    ];

    const response = await callAI(aiMessages, aiApiKey);

    // Format response to save to db
    const formattedResponse = {
      from: turn,
      message: response,
    };

    // Update messages array with new response
    const updatedMessages = [...messages, formattedResponse];

    // Save updated conversation with new message
    const updateParams = {
      TableName: tableName,
      Item: {
        ...convo,
        messages: updatedMessages,
      },
    };

    await ddbDocClient.send(new PutCommand(updateParams));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(formattedResponse),
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
