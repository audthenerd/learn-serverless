# Conversation API Backend

A serverless AI conversation API built with AWS SAM, Lambda, DynamoDB, and TypeScript.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy .env.example to .env and add your API key
cp .env.example .env
# Edit .env and add your AI_API_KEY

# 3. Build TypeScript handlers
npm run build

# 4. Deploy to AWS
npm run deploy --profile=notifly-dev

# Clean build artifacts
npm run clean
```

## 📁 Project Structure

```
backend/
├── src/handlers/                  # Source TypeScript handlers
│   ├── get-conversations/          # GET /conversations
│   │   ├── index.ts               # Handler TypeScript source
│   │   └── package.json           # Handler package
│   ├── get-conversation-by-id/    # GET /conversations/:id
│   ├── generate-response/         # POST /generateResponse
│   └── summarize/                 # POST /summarize
├── .build/                        # Compiled JavaScript (generated)
│   ├── get-conversations/
│   │   ├── index.js              # Compiled handler
│   │   └── package.json          # Copied package.json
│   └── ...                       # Other handlers
├── .env                           # Environment variables (gitignored)
├── .env.example                   # Environment template (committed)
├── template.yaml                  # SAM template (reads from .build/)
├── package.json                   # Root dependencies
├── tsconfig.json                  # TypeScript configuration
├── build.sh                       # TypeScript build script
└── deploy.sh                      # Deployment script with secrets
```

## 🔌 API Endpoints

**Base URL:** `https://<api-gw-id>.execute-api.ap-southeast-1.amazonaws.com/api`

| Method | Endpoint             | Description                          |
| ------ | -------------------- | ------------------------------------ |
| GET    | `/conversations`     | List all conversation IDs            |
| GET    | `/conversations/:id` | Get specific conversation            |
| POST   | `/generateResponse`  | Generate AI response (with OpenAI)   |
| POST   | `/summarize`         | Summarize conversation (placeholder) |

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Clean build artifacts
npm run clean

# Build TypeScript handlers (compiles to .build/ and runs sam build)
npm run build

# Deploy with profile
npm run deploy --profile=notifly-dev

# Or deploy with default profile
npm run deploy

# Alternative: use deploy.sh directly
./deploy.sh notifly-dev

# Validate SAM template
sam validate

# Start local API server
sam local start-api

# Delete stack
sam delete --profile notifly-dev

# Test individual function locally
sam local invoke GetConversationsFunction --event events/get-conversations.json
```

## 🧪 Testing API

### Production Endpoints

Replace `<api-gateway-url>` with your actual API Gateway endpoint from deployment output.

```bash
# Get all conversations
curl https://<api-gateway-url>/api/conversations

# Get specific conversation
curl https://<api-gateway-url>/api/conversations/<conversation-id>

# Generate AI response (new conversation)
curl -X POST https://<api-gateway-url>/api/generateResponse \
  -H "Content-Type: application/json" \
  -d '{"message":"What is quantum computing?"}'

# Generate AI response (continue conversation)
curl -X POST https://<api-gateway-url>/api/generateResponse \
  -H "Content-Type: application/json" \
  -d '{"conversationId":"<uuid>","message":"Tell me more"}'

# Summarize conversation
curl -X POST https://<api-gateway-url>/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"conversationId":"<uuid>"}'
```

### Local Testing

```bash
# Start local API
sam local start-api

# Test locally (replace localhost:3000 in above commands)
curl http://localhost:3000/api/conversations
```

## � Environment Configuration

### Setup

1. **Copy the example file:**

   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and add your API key:**

   ```bash
   AI_API_KEY=your-actual-api-key-here
   ```

3. **The `.env` file is gitignored** - safe to store secrets locally

### Deployment with Secrets

The API key is passed as a CloudFormation parameter during deployment:

- **From npm:** `npm run deploy --profile=your-profile`
- **From script:** `./deploy.sh your-profile`
- **Manual override:** `sam deploy --profile your-profile --parameter-overrides AiApiKey=your-key`

### For Team Members

1. Clone the repository
2. Copy `.env.example` to `.env`
3. Ask team lead for the actual `AI_API_KEY`
4. Add it to your local `.env` file
5. Deploy with `npm run deploy --profile=your-profile`

## �🗄️ Database Schema

**Table Name:** `ConversationTable`  
**Primary Key:** `conversation-id` (String - UUID)

**Item Structure:**

```json
{
  "conversation-id": "550e8400-e29b-41d4-a716-446655440000",
  "messages": [
    "What is quantum computing?",
    "Quantum computing is...",
    "Tell me more",
    "Here's more details..."
  ],
  "timestamp": "2025-11-06T10:00:00.000Z",
  "updatedAt": "2025-11-06T10:15:00.000Z"
}
```

**Field Descriptions:**

- `conversation-id`: Auto-generated UUID for new conversations
- `messages`: Array of strings (alternating user/AI messages)
- `timestamp`: Original creation timestamp
- `updatedAt`: Last modification timestamp

## 📝 Modifying Handlers

Each handler is in its own directory for individual packaging:

1. Edit the TypeScript file: `src/handlers/[handler-name]/index.ts`
2. Build TypeScript: `npm run build` (outputs to `.build/`)
3. Build SAM: `sam build` (reads from `.build/`)
4. Test locally or deploy

**Build Pipeline:**

```
src/handlers/*/index.ts  →  npm run build  →  .build/*/index.js  →  sam build  →  .aws-sam/build
```

## 🎯 Implementation Details

### Generate Response Flow

1. Parse incoming `message` from request body
2. Generate UUID if `conversationId` not provided (new conversation)
3. Fetch existing conversation from DynamoDB (if exists)
4. Append user message to messages array
5. Save to DynamoDB (for new conversations only)
6. Call OpenAI Lambda URL with conversation history
7. Extract AI response from API
8. Append AI response to messages array
9. Update conversation in DynamoDB

### AI Integration

- **Endpoint:** `https://4ebp5kndnp43j6uqz7y53u4dly0jwule.lambda-url.ap-southeast-1.on.aws/`
- **Authentication:** Bearer token
- **Model:** GPT-4o
- **Parameters:** max_tokens: 500, temperature: 0.7

## 💡 Architecture Benefits

- **Serverless**: Pay only for what you use, auto-scaling
- **Type Safety**: TypeScript catches errors at compile time
- **Modular**: Each Lambda function independently deployable
- **Efficient**: Individual packaging reduces Lambda cold starts
- **Maintainable**: Clear separation of concerns
