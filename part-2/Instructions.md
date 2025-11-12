# Part 2: AI Conversation App - Hands-On Session

## 1. Introduction

This is an AI-powered conversation application that simulates dialogues between two personas. The app works as follows:

- A user provides an **initial message** from a persona (known as the **initiator**)
- Another persona automatically **responds** to the previous message in a turn-by-turn conversation
- The conversation continues until a **pre-configured maximum number of turns** is reached

### Objectives

In this part of the hands-on session, you will learn to:

**a. Create a serverless endpoint** to summarize the conversation

- Define API endpoints in AWS SAM template
- Implement a Lambda handler from scratch
- Test and deploy serverless functions
- Integrate with frontend application

**b. Use a serverless middleware** to ensure consistent request/response processing across Lambda handlers

- Implement reusable middleware patterns for common tasks
- Standardize validation and error handling

---

## 2. Tech Stack

### Frontend

- **Next.js** - React framework for the user interface

### Backend

- **AWS SAM (Serverless Application Model)** - Infrastructure as Code for serverless resources
- **Amazon API Gateway** - Host API endpoints
- **AWS Lambda** - Serverless function handlers
- **Amazon DynamoDB** - NoSQL database for storing conversations

---

## 3. Prerequisites and Setup

### Prerequisites

- **Node.js** (v18 or higher)
- **AWS CLI** configured with credentials
- **AWS SAM CLI** installed
- **Docker** (optional) - Required for local testing with SAM

### Setup Instructions

1. **Navigate to the backend directory:**

   ```bash
   cd part-2/backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Clean previous builds:**

   ```bash
   npm run clean
   ```

4. **Build the project:**

   ```bash
   npm run build
   ```

5. **Deploy to AWS:**

   ```bash
   npm run deploy --profile=<aws-profile>
   ```

   Replace `<aws-profile>` with your AWS CLI profile name.

### Verification

After successful deployment, SAM will output the API Gateway endpoint URL. Copy this URL and configure the frontend:

1. Navigate to the frontend directory
2. Create a `.env` file (if it doesn't exist)
3. Set the `VITE_API_URL` environment variable:
   ```
   VITE_API_URL=<your-api-gateway-url>
   ```
4. Open a new terminal window and start the frontend development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to the local URL displayed in the terminal

### Try It Out

1. **Select personas** for the conversation (e.g., Software Engineer vs Tech Lead)
2. **Enter an initial topic** such as "When should I use serverless architecture?"
3. **Click Start** to begin the AI conversation
4. **Watch the conversation unfold** as the personas exchange messages

🎉 **Congratulations!** You've successfully deployed an AI-powered serverless application using AWS serverless technologies for LLM-based chat generation.

### (Optional) Local Development Setup

> **Note:** This step is optional and useful for local development and testing with Docker. Skip this if you only want to test with the deployed AWS resources.

If you want to test locally with SAM Local, you can set up a local DynamoDB instance with seed data:

```bash
# Run the database setup script
./setup-db.sh
```

This will:

- Start a local DynamoDB instance in Docker
- Create the conversations table
- Seed it with sample conversation data

---

## 4. Exercise 1: Create a Summarize Endpoint from Scratch

### Overview

In this exercise, you will create a new serverless endpoint `/summarize` **completely from scratch**. This hands-on experience will teach you the end-to-end process of building serverless APIs, including:

- Defining API endpoints in AWS SAM template
- Creating Lambda handler functions
- Testing locally with SAM
- Deploying to AWS
- Integrating with frontend

By the end of this exercise, your application will have a **"Generate Summary"** button that creates AI-powered summaries of conversations!

---

### Step 4.1: Define the API Endpoint in template.yaml ✏️ (Action Required)

First, we need to define our new Lambda function and API endpoint in the AWS SAM template.

**Task:** Add the `SummarizeFunction` definition to `backend/template.yaml`

1. **Open** `backend/template.yaml`

2. **Find the location** where other Lambda functions are defined (after `GenerateResponseFunction`)

3. **Add the following** before the `ConversationTable` section:

```yaml
# Summarize conversation
SummarizeFunction:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: .build/handlers/summarize/
    Handler: index.handler
    Runtime: nodejs22.x
    Architectures:
      - x86_64
    MemorySize: 256
    Timeout: 300
    Description: Summarize a conversation
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref ConversationTable
    Environment:
      Variables:
        TABLE_NAME: !Ref ConversationTable
    Events:
      Api:
        Type: Api
        Properties:
          RestApiId: !Ref ConversationApi
          Path: /summarize
          Method: POST
```

**What this does:**

- **CodeUri**: Points to where the compiled handler code will be
- **Handler**: Specifies `index.handler` as the entry point
- **Runtime**: Uses Node.js 22
- **MemorySize**: Allocates 256 MB of memory
- **Timeout**: Allows up to 5 minutes (300 seconds) for AI processing
- **Policies**: Grants DynamoDB read/write access
- **Environment**: Passes table name and AI API key
- **Events**: Creates a POST endpoint at `/summarize`

---

### Step 4.2: Create the Handler Directory and Files ✏️ (Action Required)

Now let's create the Lambda handler that will process summarization requests. You'll create everything from scratch!

**Task:** Create the handler directory and file at `backend/src/handlers/summarize/index.ts`

1. **Create the directory structure:**

   ```bash
   mkdir -p backend/src/handlers/summarize
   ```

2. **Create the handler file** `backend/src/handlers/summarize/index.ts` with the following code:

```typescript
/**
 * Summarize Conversation Handler
 *
 * Generates an AI-powered summary of a conversation's entire message history.
 * Considers both personas' perspectives and saves the summary to DynamoDB.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { callAI } from "../../utils/ai-helper";
import {
  getConversationById,
  addSummaryToConversation,
} from "../../utils/db-helper";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Get request ID for correlation
    const requestId = event.requestContext.requestId;

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
    const conversation = await getConversationById(conversationId);

    if (!conversation) {
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
      requestId
    );

    // Save the updated conversation with summary
    await addSummaryToConversation(conversationId, summary);

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
```

**What this handler does:**

1. **Validates input** - Ensures `conversationId` is provided
2. **Fetches conversation** - Retrieves from DynamoDB using helper function
3. **Builds transcript** - Formats messages into readable text
4. **Calls AI** - Generates summary using the AI helper
5. **Saves summary** - Updates conversation in database
6. **Returns response** - Sends summary back to client

**Key dependencies used:**

- `callAI()` - Helper function to interact with AI service
- `getConversationById()` - Fetches conversation from DynamoDB
- `addSummaryToConversation()` - Saves summary to database

---

### Step 4.3: Build the Backend ✏️ (Action Required)

Now let's compile your new endpoint.

**Task:** Build the backend

1. **Navigate to the backend directory:**

   ```bash
   cd backend
   ```

2. **Clean previous builds:**

   ```bash
   npm run clean
   ```

3. **Build the project:**

   ```bash
   npm run build
   ```

   This compiles your TypeScript code to JavaScript in the `.build` and `.aws-sam` directory.

---

### Step 4.4: Test the Endpoint Locally (⚡ Optional - Local Testing)

> **Note:** This step requires Docker and is optional. You can skip to Step 4.5 if you want to deploy directly to AWS.

Before deploying to AWS, you can test locally using SAM Local:

1. **Start the local API:**

   ```bash
   npm run start:local
   ```

2. **In a new terminal, first list existing conversations:**

   ```bash
   curl http://localhost:4000/conversations
   ```

   This will return a list of conversations. Copy a `conversation-id` from the response.

3. **Test the summarize endpoint:**

   ```bash
   curl -X POST http://localhost:4000/summarize \
     -H "Content-Type: application/json" \
     -d '{"conversationId":"<conversation-id-from-step-2>"}'
   ```

   Replace `<conversation-id-from-step-2>` with an actual conversation ID from the previous step.

4. **Expected response:**

   ```json
   {
     "conversationId": "abc-123",
     "summary": "This conversation discusses..."
   }
   ```

---

### Step 4.5: Deploy to AWS and Test ✏️ (Action Required)

Now let's deploy your new endpoint to AWS and test it!

**Task:** Deploy the backend

1. **Deploy to AWS:**

   ```bash
   npm run deploy --profile=<aws-profile>
   ```

   Replace `<aws-profile>` with your AWS CLI profile name.

2. **Wait for deployment** - SAM will:

   - Package your Lambda function
   - Upload to S3
   - Create/update the CloudFormation stack
   - Create the API Gateway endpoint
   - Set up permissions and environment variables

3. **Note the API endpoint** - After deployment, you'll see output like:

   ```
   CloudFormation outputs from deployed stack
   ---------------------------------------------------------
   Outputs
   ---------------------------------------------------------
   Key                 WebEndpoint
   Description         API Gateway endpoint URL for api stage
   Value               https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/api/
   ---------------------------------------------------------
   ```

4. **Test with curl (optional):**

   ```bash
   # First, list conversations to get an ID
   curl https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/api/conversations

   # Then test the summarize endpoint
   curl -X POST https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/api/summarize \
     -H "Content-Type: application/json" \
     -d '{"conversationId":"<conversation-id>"}'
   ```

---

### Step 4.6: Enable Summary Button in Frontend ✏️ (Action Required)

Now let's enable the "Summarize Debate" button in the frontend application.

**Background:** The frontend code already includes the summarization feature, but it's currently hidden. We just need to enable it!

**Task:** Update the frontend to show the summary button

1. **Open** `frontend/src/App.jsx`

2. **Search for "Summarize Debate"** - You'll find a line that looks like:

   ```jsx
   {false && useBackend && conversationId && messages.length > 2 && (
   ```

3. **Remove `false &&` from the condition** - Change it to:

   ```jsx
   {useBackend && conversationId && messages.length > 2 && (
   ```

4. **The complete button section should now look like:**

   ```jsx
   {
     useBackend && conversationId && messages.length > 2 && (
       <button
         onClick={summarizeDebate}
         className="control-btn summarize-btn"
         disabled={loading}
       >
         📝 Summarize Debate
       </button>
     );
   }
   ```

5. **Save the file**

**Ensure API is configured:** Verify the API client has your backend URL in `.env`:

```
VITE_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/api/
```

---

### Step 4.7: Test End-to-End ✏️ (Action Required)

Let's test the complete flow from frontend to backend!

**Task:** Test the summarization feature

1. **Start the frontend** (if not already running):

   ```bash
   cd frontend
   npm run dev
   ```

2. **Open your browser** to the local URL (usually `http://localhost:5174`)

3. **Create a conversation:**

   - Select two personas
   - Enter an initial message
   - Click "Start Conversation"
   - Wait for the conversation to complete

4. **Generate a summary:**

   - Click the **"Generate Summary"** button (should now be visible!)
   - Wait a few seconds for AI processing
   - The summary should appear below the conversation

5. **Verify the summary:**
   - Check that it captures the main points
   - Ensure it reflects both personas' perspectives
   - Confirm it's saved (refresh the page and check if summary persists)

**Troubleshooting:**

- **Button not visible?** Check Step 4.6 again
- **API error?** Verify your `.env` has the correct API URL
- **404 error?** Ensure you deployed the backend (Step 4.5)
- **Timeout?** Summary generation can take 30-60 seconds for long conversations

---

### Step 4.8: Understanding What You Built 📖 (Read Only)

Congratulations! You've just created a complete serverless endpoint from scratch. Let's review what you accomplished:

**1. Infrastructure as Code (template.yaml)**

```
You defined:
- Lambda function configuration
- API Gateway endpoint (POST /summarize)
- Permissions (DynamoDB access)
- Environment variables
- Resource allocation (memory, timeout)
```

**2. Handler Implementation (index.ts)**

```
You created:
- Request validation
- Database operations
- AI integration
- Error handling
- Response formatting
```

**3. Deployment Pipeline**

```
You executed:
- TypeScript compilation
- Lambda packaging
- CloudFormation deployment
- API Gateway provisioning
```

**4. Frontend Integration**

```
You connected:
- User interface
- API client
- Backend endpoint
- Data display
```

**The Complete Request Flow:**

```
User clicks "Generate Summary"
    ↓
Frontend sends POST to /summarize with conversationId
    ↓
API Gateway receives request
    ↓
Lambda function executes
    ↓
Handler validates conversationId
    ↓
Fetches conversation from DynamoDB
    ↓
Calls AI service for summary
    ↓
Saves summary to DynamoDB
    ↓
Returns summary to frontend
    ↓
User sees summary displayed
```

**Key Concepts Learned:**

✅ **SAM Template Syntax** - How to define serverless resources
✅ **Lambda Handlers** - Request/response structure and error handling  
✅ **API Gateway Integration** - Creating HTTP endpoints
✅ **Infrastructure as Code** - Declarative resource management
✅ **Serverless Deployment** - Build, package, and deploy workflow
✅ **End-to-End Integration** - Connecting frontend to backend

---

### Checkpoint

At this point, you should have:

- ✅ Defined a new Lambda function in the SAM template
- ✅ Created a handler file from scratch
- ✅ Built and deployed the backend to AWS
- ✅ Enabled the summary button in the frontend
- ✅ Successfully tested end-to-end summarization
- ✅ Understood the complete serverless development workflow

**What's next?** In the next exercise, you'll learn how to refactor this handler to use middleware for cleaner, more maintainable code!

---

## 5. Exercise 2: Implement Middleware for Input Validation and Response Formatting

### The Problem

Currently, the handler you created in Exercise 1 contains repetitive `if-else` statements to validate input, leading to:

- **Verbose code** with duplicated validation logic
- **Inconsistent error responses** across handlers
- **Poor maintainability** when validation rules change

**Example from the `summarize` handler you just created:**

```typescript
// Current approach - verbose and repetitive
export const handler = async (event: APIGatewayProxyEvent) => {
  try {
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

    const conversation = await getConversationById(conversationId);

    if (!conversation) {
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

    // Business logic...
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ conversationId, summary }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Failed to summarize conversation" }),
    };
  }
};
```

**Problems with this approach:**

- Request validation repeated in every handler
- Headers repeated in every return statement
- Try-catch block wrapping everything
- Business logic buried in boilerplate

### The Solution

We'll use **Middy** (middleware engine) and **Zod** (schema validation) to:

1. Define input schemas declaratively
2. Create a reusable validation middleware
3. Apply middleware consistently across all handlers

---

### Step 5.1: Understanding the Existing Middleware 📖 (Read Only)

The project already includes two middleware functions at `src/middleware/middleware.ts`:

**1. Zod Validator Middleware:**

```typescript
export const zodValidator = (schema: z.ZodSchema) => ({
  before: (request: any) => {
    const result = schema.safeParse(request.event);
    if (!result.success) {
      const error: any = new Error("Validation error");
      error.statusCode = 400;
      error.details = result.error.issues;
      throw error;
    }
  },
});
```

**2. HTTP Response Formatter Middleware:**

```typescript
export const httpResponseFormatter = () => ({
  after: (request: any) => {
    const response = request.response;

    // Add default statusCode if not provided
    if (!response.statusCode) {
      response.statusCode = 200;
    }

    // Add common headers if they don't already exist
    if (!response.headers) {
      response.headers = {};
    }

    response.headers["Content-Type"] =
      response.headers["Content-Type"] || "application/json";
    response.headers["Access-Control-Allow-Origin"] =
      response.headers["Access-Control-Allow-Origin"] || "*";

    return response;
  },
  onError: (request: any) => {
    const error = request.error;
    const statusCode = error.statusCode || 500;

    request.response = {
      statusCode,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: error.message || "Internal server error",
        ...(error.details && { details: error.details }),
      }),
    };
  },
});
```

**What these middleware do:**

- **zodValidator**: Validates incoming events before the handler executes, throws 400 errors with details if validation fails
- **httpResponseFormatter**:
  - Automatically adds default status code (200) if not provided
  - Adds common CORS and content-type headers to all responses
  - Catches and formats all errors consistently

---

### Step 5.2: Create a Schema for `summarize` ✏️ (Action Required)

Let's create a schema that validates the request body for the summarize handler you built in Exercise 1.

**Task:** Create a new file `src/handlers/summarize/schema.ts` (in the same directory as your handler)

```typescript
import { z } from "zod";

export const SummarizeEventSchema = z.object({
  body: z
    .string()
    .transform((str) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        throw new Error("Invalid JSON in request body");
      }
    })
    .pipe(
      z.object({
        conversationId: z.string().min(1, "conversationId is required"),
      })
    ),
});

export type SummarizeEvent = z.infer<typeof SummarizeEventSchema>;
```

**What's happening here:**

- `body` is a string (as received from API Gateway), so we parse it to JSON
- We validate that `conversationId` is a non-empty string
- Zod will automatically throw validation errors if the schema doesn't match

---

### Step 5.3: Refactor the Summarize Handler to Use Middleware ✏️ (Action Required)

Now let's refactor `src/handlers/summarize/index.ts` to use Middy and our Zod validator.

**Before (current code from Exercise 1 with manual validation):**

```typescript
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const requestId = event.requestContext.requestId;
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

    const conversation = await getConversationById(conversationId);

    if (!conversation) {
      return {
        statusCode: 404,
        headers: {
          /* ... */
        },
        body: JSON.stringify({ message: "Conversation not found" }),
      };
    }

    // More validation and business logic...

    return {
      statusCode: 200,
      headers: {
        /* ... */
      },
      body: JSON.stringify({ conversationId, summary }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        /* ... */
      },
      body: JSON.stringify({ message: "Failed to summarize" }),
    };
  }
};
```

**After (with Middy and Middleware):**

Replace the entire content of `src/handlers/summarize/index.ts` with:

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import middy from "@middy/core";
import {
  zodValidator,
  httpResponseFormatter,
} from "../../middleware/middleware";
import { SummarizeEventSchema } from "./schema";
import { callAI } from "../../utils/ai-helper";
import {
  getConversationById,
  addSummaryToConversation,
} from "../../utils/db-helper";

const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<Partial<APIGatewayProxyResult>> => {
  // ============================================================
  // ✨ NOTICE: No validation code here! Middleware handles it.
  // ============================================================

  const requestId = event.requestContext.requestId;
  const body = JSON.parse(event.body!);
  const { conversationId } = body;

  // Get the conversation from DynamoDB
  const conversation = await getConversationById(conversationId);

  if (!conversation) {
    const error: any = new Error("Conversation not found");
    error.statusCode = 404;
    throw error;
  }

  const messages = conversation.messages || [];
  const personas = conversation.personas;

  if (!messages || messages.length === 0) {
    const error: any = new Error("Conversation has no messages to summarize");
    error.statusCode = 400;
    throw error;
  }

  // Build conversation transcript
  const transcript = messages
    .map((msg: any) => `${msg.from}: ${msg.message}`)
    .join("\n");

  // Generate summary using AI
  const systemPrompt = personas
    ? `Summarize this debate between a ${personas.initiator.job_title} and a ${personas.responder.job_title}. Highlight the key arguments from both perspectives and any points of agreement or disagreement.`
    : "Summarize this conversation, highlighting the key points discussed.";

  const summary = await callAI(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Please summarize the following conversation:\n\n${transcript}`,
      },
    ],
    requestId
  );

  await addSummaryToConversation(conversationId, summary);

  // ============================================================
  // ✨ NOTICE: No headers! Middleware adds them automatically.
  // ============================================================

  return {
    body: JSON.stringify({
      conversationId,
      summary,
    }),
  };
};

export const handler = middy(baseHandler)
  .use(zodValidator(SummarizeEventSchema))
  .use(httpResponseFormatter());
```

**Key Changes:**

1. **Added middleware imports** - `zodValidator` and `httpResponseFormatter`
2. **Removed all validation code** - Schema validates `conversationId`
3. **Removed all headers** - Middleware adds them automatically
4. **Removed try-catch** - Middleware handles all errors
5. **Throw errors instead of returning** - Middleware formats error responses
6. **Return type is `Partial<APIGatewayProxyResult>`** - Only return what you need
7. **Cleaner code** - Reduced from ~125 lines to ~85 lines!

---

### Step 5.4: Deploy and Test Your Refactored Handler ✏️ (Action Required)

Let's deploy the changes and test that the validation works correctly.

1. **Build and deploy the updated code:**

   ```bash
   npm run clean && npm run build && npm run deploy --profile=<aws-profile>
   ```

2. **Test using the frontend application:**

   - Navigate to your running frontend application
   - Create a conversation and let it complete
   - Click the **"Generate Summary"** button
   - The summary should be generated successfully

3. **Test validation by sending invalid requests:**

   You can test validation errors by using a tool like Postman or curl:

   ```bash
   # Test with missing conversationId
   curl -X POST <your-api-gateway-url>/summarize \
     -H "Content-Type: application/json" \
     -d '{}'

   # Test with empty conversationId
   curl -X POST <your-api-gateway-url>/summarize \
     -H "Content-Type: application/json" \
     -d '{"conversationId":""}'
   ```

   You should see a 400 error response with validation details from the Zod schema.

---

### Step 5.5: Understanding the Benefits 📖 (Read Only)

Compare the before and after:

**Before:**

- 40+ lines of manual validation code
- Multiple nested if-else statements
- Repeated error response formatting with headers in every return
- Try-catch wrapping everything
- **Total: ~109 lines**

**After:**

- ✨ **Zero validation code in the handler**
- ✨ **Zero repeated headers** - middleware adds them automatically
- ✨ **No try-catch blocks** - middleware handles errors
- Clean, focused business logic
- Declarative schema definition in separate file
- Automatic validation with detailed error messages
- Consistent error and response handling via middleware
- **Total: ~60 lines (49 lines removed! 🎉)**

**How the middleware chain works:**

```
Request → zodValidator → baseHandler → httpResponseFormatter → Response
              ↓ (validates)    ↓ (business logic)    ↓ (adds headers)
              └─────────── onError catches all ──────────┘
```

---

### Step 5.6: Practice - Refactor Another Handler (⚡ Optional - Only if Ahead of Schedule)

> **Note:** This step is optional. Only proceed if you have extra time and want additional practice. Feel free to skip to the Checkpoint below if you're running short on time.

Now it's your turn! Apply the same pattern to another handler.

**Task:** Refactor `src/handlers/generate-response/index.ts`

**Hints:**

1. Create `src/handlers/generate-response/schema.ts`
2. The handler needs to validate `pathParameters.id` (conversation ID)
3. Use the `summarize` handler as a reference - it's already refactored!

**Expected schema structure:**

```typescript
import { z } from "zod";

export const GenerateResponseEventSchema = z.object({
  pathParameters: z.object({
    id: z.string().min(1, "Conversation ID is required"),
  }),
});

export type GenerateResponseEvent = z.infer<typeof GenerateResponseEventSchema>;
```

**Handler structure to follow:**

```typescript
import {
  zodValidator,
  httpResponseFormatter,
} from "../../middleware/middleware";
import { GenerateResponseEventSchema } from "./schema";

const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<Partial<APIGatewayProxyResult>> => {
  // Your business logic here
  // No validation, no headers, no try-catch needed!

  return { body: JSON.stringify(yourData) };
};

export const handler = middy(baseHandler)
  .use(zodValidator(GenerateResponseEventSchema))
  .use(httpResponseFormatter());
```

---

### Checkpoint

At this point, you should have:

- ✅ Created a Zod schema for `summarize`
- ✅ Understood how `zodValidator` and `httpResponseFormatter` middleware work
- ✅ Refactored the handler to use both middleware functions
- ✅ Removed all validation, error handling, and header boilerplate
- ✅ Tested the handler with valid and invalid inputs
- ✅ Understood how middleware creates cleaner, more maintainable code

---

## Next Steps

Congratulations! You've completed the middleware exercise and learned how to:

- Use middleware for consistent request/response processing
- Reduce code duplication and improve maintainability

These patterns will make your serverless applications cleaner and easier to work with!
