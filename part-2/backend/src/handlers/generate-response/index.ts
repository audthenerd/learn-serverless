/**
 * Generate Response Handler
 *
 * Generates an AI-powered response for a conversation based on persona traits and conversation history.
 * Supports both initiator and responder turns with context-aware prompts and automatic message saving.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { callAI } from "../../utils/ai-helper";
import {
  getConversationById,
  addMessageToConversation,
} from "../../utils/db-helper";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Get request ID for correlation
    const requestId = event.requestContext.requestId;

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

    // Read conversation with conversationId
    const convo = await getConversationById(conversationId);

    // Return error if conversationId not found
    if (!convo) {
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
    const currentPersona = personas[turn as keyof typeof personas];

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

    const response = await callAI(aiMessages, requestId);

    // Format response to save to db
    const formattedResponse = {
      from: turn,
      message: response,
    };

    // Update messages array with new response
    const updatedMessages = [...messages, formattedResponse];

    // Save updated conversation with new message
    await addMessageToConversation(conversationId, updatedMessages);

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
