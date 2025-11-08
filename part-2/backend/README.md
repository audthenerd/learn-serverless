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
npm run deploy --profile=<profile-name>

# Clean build artifacts
npm run clean
```

## 📁 Project Structure

```
backend/
├── src/                           # Source TypeScript code
│   ├── handlers/                   # Lambda function handlers
│   │   ├── get-conversations/      # GET /conversations
│   │   │   └── index.ts           # Handler TypeScript source
│   │   ├── create-conversation/   # POST /conversations
│   │   ├── get-conversation-by-id/ # GET /conversations/:id
│   │   ├── generate-response/     # POST /generateResponse
│   │   └── summarize/             # POST /summarize
│   └── utils/                     # Shared utility modules
│       └── ai-helper.ts           # AI integration helper
│
├── .build/                        # Compiled output (generated)
│   ├── handlers/                   # Compiled handlers
│   │   ├── generate-response/
│   │   │   ├── index.mjs          # ES module (renamed from .js)
│   │   │   ├── utils/             # Copied utils (imports fixed)
│   │   │   │   └── ai-helper.mjs
│   │   │   └── node_modules/      # Symlink to production deps
│   │   └── ...                    # Other handlers
│   ├── utils/                      # Compiled shared utils
│   ├── node_modules/               # Production-only dependencies
│   └── package.json                # With "type": "module"
│
├── template.yaml                  # SAM CloudFormation template
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── build.sh                       # Build automation script
├── deploy.sh                      # Deployment script
└── samconfig.toml                 # SAM CLI configuration
```

## 🏗️ Build Process

The build process is automated in `build.sh`:

1. **Compile TypeScript** → `.build/` directory (preserves structure)
2. **Install production dependencies** → `.build/node_modules/` (no devDependencies)
3. **For each handler:**
   - Copy `utils/` folder into handler directory
   - Fix import paths (remove `../../`, add `.mjs` extensions)
   - Rename `.js` → `.mjs` (ES modules without package.json)
   - Symlink to shared production `node_modules`

**Result:** Each Lambda package contains only its code + utils, sharing node_modules via symlink.

## 🔌 API Endpoints

**Base URL:** `https://<api-gw-id>.execute-api.ap-southeast-1.amazonaws.com/api`

| Method | Endpoint             | Description                          |
| ------ | -------------------- | ------------------------------------ |
| GET    | `/conversations`     | List all conversation IDs            |
| POST   | `/conversations`     | Create a new conversation            |
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
npm run deploy --profile=<profile-name>

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

# Create a new conversation
curl -X POST https://<api-gateway-url>/api/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "initialMessage": "I think we should prioritize short-term gains",
    "personas": {
      "initiator": {
        "job_title": "Sales Director",
        "traits": ["aggressive", "results-oriented"],
        "values": ["revenue", "market share"],
        "communication_style": "direct and persuasive"
      },
      "responder": {
        "job_title": "Chief Technology Officer",
        "traits": ["analytical", "risk-averse"],
        "values": ["innovation", "long-term sustainability"],
        "communication_style": "data-driven and cautious"
      }
    }
  }'

# Get specific conversation
curl https://<api-gateway-url>/api/conversations/<conversation-id>

# Generate AI response
curl -X POST https://<api-gateway-url>/api/generateResponse \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "<uuid>",
    "turn": "responder"
  }'

# Summarize conversation
curl -X POST https://<api-gateway-url>/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"conversationId": "<uuid>"}'
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
  "personas": {
    "initiator": {
      "job_title": "Sales Director",
      "traits": ["aggressive", "results-oriented"],
      "values": ["revenue", "market share"],
      "communication_style": "direct and persuasive"
    },
    "responder": {
      "job_title": "Chief Technology Officer",
      "traits": ["analytical", "risk-averse"],
      "values": ["innovation", "long-term sustainability"],
      "communication_style": "data-driven and cautious"
    }
  },
  "messages": [
    {
      "from": "initiator",
      "message": "I think we should prioritize short-term gains"
    },
    {
      "from": "responder",
      "message": "We need to consider long-term sustainability..."
    }
  ]
}
```

**Field Descriptions:**

- `conversation-id`: Auto-generated UUID for new conversations
- `topic`: String describing the conversation topic
- `turn`: String indicating the turn/round number
- `prompt`: Object containing prompt configuration (e.g., systemMessage, context, etc.)
- `chat`: Array of objects with `persona` (user/assistant) and `message` (string)
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

1. Parse incoming `topic`, `turn`, `prompt`, and `chat` from request body
2. Validate that `chat` is an array with proper structure
3. Validate that `topic`, `turn`, and `prompt` are provided
4. Generate UUID if `conversationId` not provided (new conversation)
5. Fetch existing conversation from DynamoDB (if exists)
6. Append new chat messages to chat history array
7. Save to DynamoDB (for new conversations only)
8. If chat history is empty, return early without calling AI
9. Convert chat history to AI message format
10. Call OpenAI Lambda URL with conversation history
11. Extract AI response from API
12. Append AI response as assistant message to chat history
13. Update conversation in DynamoDB with topic, turn, prompt, and updated chat history

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
