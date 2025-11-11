import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

// ============================================
// DynamoDB Client Setup
// ============================================

const client = new DynamoDBClient({
  ...(process.env.AWS_SAM_LOCAL && {
    endpoint: "http://host.docker.internal:8000",
  }),
});

const ddbDocClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.TABLE_NAME!;

// ============================================
// Type Definitions
// ============================================

export interface Message {
  from: string;
  message: string;
}

export interface PersonaDetails {
  job_title: string;
  traits: string[];
  values: string[];
  communication_style: string;
}

export interface Personas {
  initiator: PersonaDetails;
  responder: PersonaDetails;
}

export interface Conversation {
  "conversation-id": string;
  personas: Personas;
  messages: Message[];
  summary?: string;
}

// ============================================
// Low-Level DynamoDB Operations (Private)
// ============================================

const getItem = async (
  key: Record<string, any>
): Promise<Record<string, any> | null> => {
  const { Item } = await ddbDocClient.send(
    new GetCommand({
      TableName: tableName,
      Key: key,
    })
  );
  return Item || null;
};

const putItem = async (item: Record<string, any>): Promise<void> => {
  await ddbDocClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  );
};

const updateItem = async (
  key: Record<string, any>,
  updateExpression: string,
  expressionAttributeValues: Record<string, any>
): Promise<void> => {
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );
};

const scanItems = async (
  projectionExpression?: string,
  expressionAttributeNames?: Record<string, string>
): Promise<Record<string, any>[]> => {
  const params: any = { TableName: tableName };

  if (projectionExpression) {
    params.ProjectionExpression = projectionExpression;
  }
  if (expressionAttributeNames) {
    params.ExpressionAttributeNames = expressionAttributeNames;
  }

  const { Items } = await ddbDocClient.send(new ScanCommand(params));
  return Items || [];
};

// ============================================
// Domain-Specific Functions (Public API)
// ============================================

/**
 * Get a conversation by its ID
 */
export const getConversationById = async (
  conversationId: string
): Promise<Conversation | null> => {
  const item = await getItem({ "conversation-id": conversationId });
  return item ? (item as Conversation) : null;
};

/**
 * Create a new conversation
 */
export const createConversation = async (
  conversationId: string,
  personas: Personas,
  initialMessage: Message
): Promise<void> => {
  await putItem({
    "conversation-id": conversationId,
    personas,
    messages: [initialMessage],
  });
};

/**
 * Add messages to a conversation
 */
export const addMessageToConversation = async (
  conversationId: string,
  messages: Message[]
): Promise<void> => {
  await updateItem(
    { "conversation-id": conversationId },
    "SET messages = :messages",
    { ":messages": messages }
  );
};

/**
 * Add summary to a conversation
 */
export const addSummaryToConversation = async (
  conversationId: string,
  summary: string
): Promise<void> => {
  await updateItem(
    { "conversation-id": conversationId },
    "SET summary = :summary",
    { ":summary": summary }
  );
};

/**
 * Get all conversation IDs
 */
export const getAllConversationIds = async (): Promise<string[]> => {
  const items = await scanItems("#id", { "#id": "conversation-id" });
  return items.map((item) => item["conversation-id"]);
};
