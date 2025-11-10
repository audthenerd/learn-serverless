#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up local DynamoDB...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Stop and remove existing container if it exists
if docker ps -a --format '{{.Names}}' | grep -q "^dynamodb-local$"; then
    echo -e "${YELLOW}Removing existing dynamodb-local container...${NC}"
    docker rm -f dynamodb-local
fi

# Start DynamoDB Local
echo -e "${YELLOW}Starting DynamoDB Local container...${NC}"
docker run -d -p 8000:8000 --name dynamodb-local amazon/dynamodb-local

# Wait for DynamoDB to be ready
echo -e "${YELLOW}Waiting for DynamoDB to be ready...${NC}"
sleep 10

# Create the table
echo -e "${YELLOW}Creating ConversationTable...${NC}"
aws dynamodb create-table \
    --table-name ConversationTable \
    --attribute-definitions AttributeName=conversation-id,AttributeType=S \
    --key-schema AttributeName=conversation-id,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=2,WriteCapacityUnits=2 \
    --endpoint-url http://localhost:8000 \
    --region ap-southeast-1 \
    > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ DynamoDB Local is running on port 8000${NC}"
    echo -e "${GREEN}✓ ConversationTable created successfully${NC}"
    echo ""
else
    echo -e "${RED}Error: Failed to create table${NC}"
    exit 1
fi

# Seed the database with test conversations
echo -e "${YELLOW}Seeding database with test conversations...${NC}"

ENDPOINT="http://localhost:8000"
REGION="ap-southeast-1"
TABLE_NAME="ConversationTable"

# Conversation 1: Software Engineer vs Tech Lead - Serverless Architecture
aws dynamodb put-item \
    --table-name $TABLE_NAME \
    --endpoint-url $ENDPOINT \
    --region $REGION \
    --item '{
        "conversation-id": {"S": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"},
        "personas": {
            "M": {
                "initiator": {
                    "M": {
                        "job_title": {"S": "Software Engineer"},
                        "traits": {"L": [{"S": "pragmatic"}, {"S": "cost-conscious"}, {"S": "performance-focused"}]},
                        "values": {"L": [{"S": "simplicity"}, {"S": "efficiency"}, {"S": "scalability"}]},
                        "communication_style": {"S": "direct and technical"}
                    }
                },
                "responder": {
                    "M": {
                        "job_title": {"S": "Tech Lead"},
                        "traits": {"L": [{"S": "strategic"}, {"S": "risk-aware"}, {"S": "team-oriented"}]},
                        "values": {"L": [{"S": "maintainability"}, {"S": "reliability"}, {"S": "developer experience"}]},
                        "communication_style": {"S": "balanced and mentoring"}
                    }
                }
            }
        },
        "messages": {
            "L": [
                {
                    "M": {
                        "from": {"S": "initiator"},
                        "message": {"S": "I think we should use serverless architecture for our new microservice. It will automatically scale and we only pay for what we use."}
                    }
                },
                {
                    "M": {
                        "from": {"S": "responder"},
                        "message": {"S": "That is a valid point about cost efficiency. However, we need to consider cold start latency and vendor lock-in. What is your take on these concerns?"}
                    }
                },
                {
                    "M": {
                        "from": {"S": "initiator"},
                        "message": {"S": "Cold starts can be mitigated with provisioned concurrency, and vendor lock-in is less of an issue if we use standard patterns and abstractions. The benefits outweigh the risks."}
                    }
                },
                {
                    "M": {
                        "from": {"S": "responder"},
                        "message": {"S": "I agree that abstraction layers help, but they add complexity. Let us also consider the team expertise - do we have enough serverless experience to maintain this effectively?"}
                    }
                }
            ]
        },
        "summary": {"S": "Discussion about adopting serverless architecture, covering benefits like auto-scaling and cost efficiency versus concerns about cold starts, vendor lock-in, and team expertise. Both parties acknowledged valid points on either side."}
    }' > /dev/null 2>&1

# Conversation 2: Product Manager vs UX Designer - Feature Prioritization
aws dynamodb put-item \
    --table-name $TABLE_NAME \
    --endpoint-url $ENDPOINT \
    --region $REGION \
    --item '{
        "conversation-id": {"S": "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e"},
        "personas": {
            "M": {
                "initiator": {
                    "M": {
                        "job_title": {"S": "Product Manager"},
                        "traits": {"L": [{"S": "data-driven"}, {"S": "goal-oriented"}, {"S": "decisive"}]},
                        "values": {"L": [{"S": "business value"}, {"S": "user needs"}, {"S": "market timing"}]},
                        "communication_style": {"S": "persuasive and metrics-focused"}
                    }
                },
                "responder": {
                    "M": {
                        "job_title": {"S": "UX Designer"},
                        "traits": {"L": [{"S": "user-centric"}, {"S": "detail-oriented"}, {"S": "creative"}]},
                        "values": {"L": [{"S": "usability"}, {"S": "accessibility"}, {"S": "design consistency"}]},
                        "communication_style": {"S": "empathetic and visual"}
                    }
                }
            }
        },
        "messages": {
            "L": [
                {
                    "M": {
                        "from": {"S": "initiator"},
                        "message": {"S": "We need to prioritize the advanced analytics dashboard for Q4. Our enterprise clients are asking for it and it could unlock significant revenue."}
                    }
                },
                {
                    "M": {
                        "from": {"S": "responder"},
                        "message": {"S": "I understand the business need, but we still have unresolved usability issues in our core user flow. Should we not fix those first to improve the experience for all users?"}
                    }
                },
                {
                    "M": {
                        "from": {"S": "initiator"},
                        "message": {"S": "The usability issues affect a smaller percentage of users compared to the potential enterprise adoption. We can address them in parallel with a smaller team."}
                    }
                }
            ]
        },
        "summary": {"S": "Debate on feature prioritization between enterprise analytics dashboard and core usability improvements. Product Manager emphasized revenue potential while UX Designer advocated for fixing fundamental user experience issues first."}
    }' > /dev/null 2>&1

# Conversation 3: DevOps Engineer vs Security Engineer - CI/CD Pipeline
aws dynamodb put-item \
    --table-name $TABLE_NAME \
    --endpoint-url $ENDPOINT \
    --region $REGION \
    --item '{
        "conversation-id": {"S": "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f"},
        "personas": {
            "M": {
                "initiator": {
                    "M": {
                        "job_title": {"S": "DevOps Engineer"},
                        "traits": {"L": [{"S": "automation-focused"}, {"S": "efficiency-driven"}, {"S": "pragmatic"}]},
                        "values": {"L": [{"S": "speed"}, {"S": "reliability"}, {"S": "developer productivity"}]},
                        "communication_style": {"S": "practical and solution-oriented"}
                    }
                },
                "responder": {
                    "M": {
                        "job_title": {"S": "Security Engineer"},
                        "traits": {"L": [{"S": "risk-aware"}, {"S": "thorough"}, {"S": "compliance-focused"}]},
                        "values": {"L": [{"S": "security"}, {"S": "compliance"}, {"S": "data protection"}]},
                        "communication_style": {"S": "cautious and detailed"}
                    }
                }
            }
        },
        "messages": {
            "L": [
                {
                    "M": {
                        "from": {"S": "initiator"},
                        "message": {"S": "Our CI/CD pipeline is too slow because of all the security scans. We need to deploy faster to stay competitive. Can we run some scans asynchronously?"}
                    }
                },
                {
                    "M": {
                        "from": {"S": "responder"},
                        "message": {"S": "I understand the need for speed, but security scans are critical for catching vulnerabilities before production. What if we optimize the scans instead of skipping them?"}
                    }
                },
                {
                    "M": {
                        "from": {"S": "initiator"},
                        "message": {"S": "That is fair. What about running critical scans in the pipeline and moving less urgent ones to post-deployment monitoring? We could set up alerts for any issues found."}
                    }
                },
                {
                    "M": {
                        "from": {"S": "responder"},
                        "message": {"S": "That could work for certain scan types. Let us categorize them by risk level - critical security checks stay in pipeline, nice-to-have checks can be async. We should also implement automated rollback if post-deploy scans fail."}
                    }
                },
                {
                    "M": {
                        "from": {"S": "initiator"},
                        "message": {"S": "Excellent compromise. I will set up the automated rollback mechanism. This way we get faster deployments while maintaining security standards."}
                    }
                }
            ]
        },
        "summary": {"S": "DevOps and Security engineers discussed optimizing CI/CD pipeline speed while maintaining security. They reached a compromise to categorize security scans by risk level, keeping critical checks in the pipeline while moving others to post-deployment with automated rollback capabilities."}
    }' > /dev/null 2>&1

echo -e "${GREEN}✓ Seeded 3 test conversations${NC}"
echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo -e "${YELLOW}Seeded Conversations:${NC}"
echo -e "  ${GREEN}a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d${NC} - Software Engineer vs Tech Lead on Serverless (4 messages)"
echo -e "  ${GREEN}b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e${NC} - Product Manager vs UX Designer on Features (3 messages)"
echo -e "  ${GREEN}c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f${NC} - DevOps vs Security on CI/CD Pipeline (5 messages)"
echo ""
echo -e "${YELLOW}Commands:${NC}"
echo -e "  Stop DynamoDB:  ${GREEN}docker stop dynamodb-local${NC}"
echo -e "  List tables:    ${GREEN}aws dynamodb list-tables --endpoint-url http://localhost:8000 --region ap-southeast-1${NC}"
echo -e "  Get conversation: ${GREEN}aws dynamodb get-item --table-name ConversationTable --key '{\"conversation-id\":{\"S\":\"a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d\"}}' --endpoint-url http://localhost:8000 --region ap-southeast-1${NC}"
echo ""
