import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.TABLE_NAME;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Parse the request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { conversationId } = body;

    if (!conversationId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Missing required field: conversationId'
        })
      };
    }

    // Get the conversation from DynamoDB
    const getParams = {
      TableName: tableName,
      Key: {
        'conversation-id': conversationId
      }
    };

    const data = await ddbDocClient.send(new GetCommand(getParams));

    if (!data.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Conversation not found'
        })
      };
    }

    // TODO: Implement AI summarization
    // For now, return a placeholder summary
    const summary = `This is a placeholder summary for conversation: ${conversationId}`;

    // Update the conversation with the summary
    const updateParams = {
      TableName: tableName,
      Key: {
        'conversation-id': conversationId
      },
      UpdateExpression: 'SET summary = :summary, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':summary': summary,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW' as const
    };

    const updateResult = await ddbDocClient.send(new UpdateCommand(updateParams));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        conversationId,
        summary,
        conversation: updateResult.Attributes
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Failed to summarize conversation',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
