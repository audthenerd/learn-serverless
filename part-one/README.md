# Lesson 1: Building Your First Serverless Backend

**Duration:** 45 minutes  
**Level:** Beginner to Intermediate

## Learning Objectives

By the end of this lesson, you will be able to:

1. Initialize a serverless application using AWS SAM
2. Develop and test Lambda functions locally
3. Deploy a serverless backend to AWS
4. Test API endpoints using HTTP requests
5. Integrate Lambda functions with DynamoDB
6. Clean up AWS resources properly

## What You'll Build

A complete serverless backend featuring:
- **AWS Lambda** functions for business logic
- **API Gateway** for RESTful endpoints
- **DynamoDB** for data persistence
- A working CRUD (Create, Read, Update, Delete) API

## Lesson Format

This 45-minute lesson includes:
- **Core exercises** - Essential activities to complete during class time
- **Optional exercises** - Marked as "(Optional)" - Skip during lesson, explore later
- **Reference sections** - Background information for post-lesson study

**Recommended Time Allocation:**
- Step 1 (Init): 5-10 minutes
- Step 2 (Local Testing): 10-15 minutes  
- Step 3 (Deploy & Test): 15-20 minutes
- Step 4 (Cleanup): 5 minutes

## Prerequisites Checklist

Before starting this lesson, ensure you have:

- [ ] [AWS CLI](https://aws.amazon.com/cli/) installed and configured with credentials
- [ ] [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) installed
- [ ] [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running
- [ ] An AWS account with administrator or appropriate permissions
- [ ] Basic understanding of HTTP requests and RESTful APIs
- [ ] Familiarity with command line interface

### Verify Your Setup

Run these commands to confirm everything is installed:

```bash
aws --version
sam --version
docker --version
```

---

## Step 1: Initialize Your SAM Project

**Objective:** Create a new serverless application using AWS SAM CLI  
**Time:** 5-10 minutes

### 📚 Theory: What is AWS SAM?

AWS Serverless Application Model (SAM) is an open-source framework that:
- Simplifies building serverless applications
- Provides shorthand syntax to define Lambda functions, APIs, and databases
- Enables local testing before deployment
- Uses CloudFormation under the hood for infrastructure as code

### 🎯 Exercise 1.1: Initialize Your First SAM Application

**Task:** Create a new serverless application using the SAM CLI interactive wizard.

1. Open your terminal and run:

```bash
sam init
```

2. Answer the prompts as follows:
   - **Which template source would you like to use?** → Select `AWS Quick Start Templates`
   - **Choose an AWS Quick Start application template** → Select `Serverless API`
   - **Which runtime would you like to use?** → Choose `Python 3.11` (or your preferred language)
   - **Project name** → Enter `my-first-serverless-app`
   - **Would you like to enable X-Ray tracing?** → `N` (for now)
   - **Would you like to enable monitoring using CloudWatch Application Insights?** → `N` (for now)

3. Navigate into your new project:

```bash
cd my-first-serverless-app
```

### 🎓 Alternative: Fast Initialization

For subsequent projects, you can skip the interactive prompts:

```bash
# Python example
sam init --runtime python3.11 --name my-serverless-app --app-template hello-world --no-tracing

# Node.js example
sam init --runtime nodejs18.x --name my-serverless-app --app-template hello-world --no-tracing
```

### 📂 Understanding the Project Structure

Let's explore what SAM generated:

```
my-first-serverless-app/
├── template.yaml          # Infrastructure as Code - defines all AWS resources
├── README.md             # Auto-generated documentation
├── events/               # Sample event payloads for local testing
│   └── event.json
├── src/                  # Your Lambda function code lives here
│   ├── __init__.py
│   └── app.py           # Main Lambda handler
├── requirements.txt      # Python dependencies
└── tests/               # Unit tests for your functions
    └── unit/
        └── test_handler.py
```

### 🔍 Exercise 1.2: Examine Key Files

**Task:** Open and review these critical files to understand your application.

1. **Open `template.yaml`** - This is your infrastructure definition. Look for:
   - `AWS::Serverless::Function` - Lambda function definitions
   - `AWS::Serverless::Api` - API Gateway configuration
   - `AWS::DynamoDB::Table` - Database table (if using Serverless API template)

2. **Open `src/app.py` (or `index.js`)** - Your Lambda handler. Notice:
   - The `lambda_handler` function (or `handler` in Node.js)
   - The `event` parameter (contains request data)
   - The `context` parameter (contains runtime information)
   - Return format for API Gateway responses

3. **Open `events/event.json`** - Sample request payload for testing

### ✅ Checkpoint 1

Before moving on, verify:
- [ ] You have a new directory called `my-first-serverless-app`
- [ ] The directory contains `template.yaml`, `src/`, and `events/` folders
- [ ] You can view and understand the basic structure of `template.yaml`
- [ ] You've located the Lambda handler function in your source code

### 💡 Key Takeaways

- SAM CLI generates a complete project structure with boilerplate code
- `template.yaml` is the single source of truth for your infrastructure
- Lambda handlers receive `event` and `context` parameters
- The project includes sample events for testing

---

## Step 2: Develop and Test Locally

**Objective:** Run and test your Lambda functions locally before deploying to AWS  
**Time:** 10-15 minutes

### 📚 Theory: Why Test Locally?

Local testing with SAM provides:
- **Fast iteration** - No deployment wait times
- **Cost savings** - No AWS charges during development
- **Easy debugging** - Use familiar local debugging tools
- **Offline development** - Work without internet connectivity

SAM uses Docker to emulate the Lambda runtime environment on your machine.

### 🎯 Exercise 2.1: Build and Start Local API

**Task:** Build your application and start a local API Gateway.

1. First, ensure Docker Desktop is running (check your system tray/menu bar)

2. Build your SAM application:

```bash
sam build
```

**What happens:** SAM processes `template.yaml`, installs dependencies, and prepares your functions for execution.

3. Start a local API Gateway:

```bash
sam local start-api
```

**Expected output:**
```
Mounting HelloWorldFunction at http://127.0.0.1:3000/hello [GET]
You can now browse to the above endpoints to invoke your functions.
```

4. Keep this terminal running! Open a **new terminal window** for the next steps.

### 🧪 Exercise 2.2: Test Your Local API

**Task:** Make HTTP requests to your local API endpoints.

1. In your new terminal, test the endpoint with `curl`:

```bash
curl http://127.0.0.1:3000/hello
```

2. You should see a JSON response like:

```json
{
  "message": "hello world"
}
```

3. **Observe** the first terminal - you'll see Lambda execution logs in real-time!

4. Try accessing the endpoint in your browser: `http://127.0.0.1:3000/hello`

### 🎯 Exercise 2.3: Invoke Lambda Functions Directly (Optional)

**Task:** Test individual Lambda functions with custom event payloads.

Sometimes you want to test a function directly without going through API Gateway:

1. Stop the local API (press `Ctrl+C` in the first terminal)

2. Invoke a specific function with an event file:

```bash
sam local invoke HelloWorldFunction -e events/event.json
```

3. **Challenge:** Create a custom test event

Create `events/custom-event.json`:

```json
{
  "httpMethod": "GET",
  "path": "/hello",
  "queryStringParameters": {
    "name": "Student"
  },
  "headers": {
    "Content-Type": "application/json"
  }
}
```

4. Invoke with your custom event:

```bash
sam local invoke HelloWorldFunction -e events/custom-event.json
```

### 🛠️ Exercise 2.4: Generate Sample Events (Optional - If Time Permits)

**Task:** Learn to generate event payloads for different AWS services.

SAM can generate realistic event structures:

```bash
# API Gateway proxy event
sam local generate-event apigateway aws-proxy > events/api-gateway-event.json

# DynamoDB stream event
sam local generate-event dynamodb update > events/dynamodb-event.json

# S3 put object event
sam local generate-event s3 put > events/s3-event.json

# SNS notification
sam local generate-event sns notification > events/sns-event.json
```

Open any generated file to see the event structure for that service.

### 🔄 Exercise 2.5: Development with Live Reload (Optional - Advanced)

**Task:** Set up automatic rebuilding when code changes.

For active development, use SAM Sync for automatic updates:

```bash
sam build --use-container
sam sync --stack-name dev-stack --watch
```

**Note:** This requires an actual AWS deployment. Skip this during the lesson - explore it later!

### 🗄️ Working with Local DynamoDB (Optional - Advanced)

If your template includes DynamoDB tables, you can test with a local database:

1. Start DynamoDB Local in a separate terminal:

```bash
docker run -d -p 8000:8000 amazon/dynamodb-local
```

2. Configure your Lambda to use local DynamoDB by setting environment variables:

```bash
export AWS_SAM_LOCAL=true
sam local start-api
```

### ✅ Checkpoint 2

Before moving on, verify you've completed the core exercises:
- [ ] You successfully ran `sam build` without errors
- [ ] Your local API started and showed mounted endpoints
- [ ] You made a successful curl request to `http://127.0.0.1:3000/hello`

**Optional exercises can be explored after the lesson!**

### 💡 Key Takeaways

- `sam build` must be run before local testing
- `sam local start-api` creates a local HTTP server mimicking API Gateway
- `sam local invoke` tests individual functions without HTTP
- Docker is required for local Lambda execution
- Event files let you simulate different request scenarios
- Local testing is fast and free compared to deploying to AWS

---

## Step 3: Deploy to AWS and Test Production

**Objective:** Deploy your serverless application to AWS and test live endpoints  
**Time:** 15-20 minutes

### 📚 Theory: Understanding Deployment

When you deploy with SAM:
1. Your code is packaged and uploaded to Amazon S3
2. CloudFormation creates/updates AWS resources (Lambda, API Gateway, DynamoDB)
3. AWS configures permissions and connections between services
4. You receive a production API endpoint URL

**Cost Note:** AWS Free Tier covers most of this lesson's activities, but be sure to complete Step 4 to avoid charges.

### 🎯 Exercise 3.1: First Deployment (Guided)

**Task:** Deploy your application to AWS using the guided deployment process.

1. Ensure your code is built:

```bash
sam build
```

2. Start the guided deployment:

```bash
sam deploy --guided
```

3. Answer the prompts carefully:

```
Stack Name [sam-app]: my-first-serverless-app
AWS Region [us-east-1]: us-east-1
#Shows you resources changes to be deployed and require a 'Y' to initiate deploy
Confirm changes before deploy [y/N]: y
#SAM needs permission to be able to create roles to connect to the resources in your template
Allow SAM CLI IAM role creation [Y/n]: Y
#Preserves the state of previously provisioned resources when an operation fails
Disable rollback [y/N]: N
HelloWorldFunction may not have authorization defined, Is this okay? [y/N]: y
Save arguments to configuration file [Y/n]: Y
SAM configuration file [samconfig.toml]: [Press Enter]
SAM configuration environment [default]: [Press Enter]
```

4. **Wait for deployment** (this takes 2-3 minutes). Watch the progress in your terminal.

5. **Success!** Look for the output section showing your API URL:

```
CloudFormation outputs from deployed stack
------------------------------------------------------------------------
Outputs                                                                
------------------------------------------------------------------------
Key                 HelloWorldApi
Description         API Gateway endpoint URL
Value               https://abc123xyz.execute-api.us-east-1.amazonaws.com/Prod/hello/
------------------------------------------------------------------------
```

6. **Copy this URL** - you'll need it for testing!

### 📝 Exercise 3.2: Understanding What Was Created (Optional - If Time Permits)

**Task:** Explore the AWS resources that were created.

1. View your stack in CloudFormation:

```bash
aws cloudformation describe-stacks --stack-name my-first-serverless-app
```

2. List all resources in your stack:

```bash
aws cloudformation list-stack-resources --stack-name my-first-serverless-app
```

3. **Observe** the different resource types:
   - `AWS::Lambda::Function`
   - `AWS::ApiGateway::RestApi`
   - `AWS::IAM::Role`
   - `AWS::DynamoDB::Table` (if applicable)

4. Open the AWS Console in your browser and navigate to:
   - **Lambda** - See your deployed function
   - **API Gateway** - View your REST API
   - **CloudWatch** - Check logs
   - **DynamoDB** - View your table (if using Serverless API template)

### 🧪 Exercise 3.3: Test Your Production API

**Task:** Test your live API endpoints using curl.

1. **Basic GET request** (replace with your actual API URL):

```bash
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/Prod/hello
```

**Expected Response:**
```json
{
  "message": "hello world"
}
```

2. **View response with headers:**

```bash
curl -i https://your-api-id.execute-api.us-east-1.amazonaws.com/Prod/hello
```

Notice the `x-amzn-requestid` header - this is your request's unique identifier.

### 🎯 Exercise 3.4: Test CRUD Operations (Optional - If using Serverless API template)

**Task:** Test Create, Read, Update, and Delete operations on your API.

**Create a new item (POST):**

```bash
curl -X POST \
  https://your-api-id.execute-api.us-east-1.amazonaws.com/Prod/items \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "item-001",
    "name": "My First Item",
    "description": "Created via API"
  }'
```

**Retrieve all items (GET):**

```bash
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/Prod/items
```

**Get a specific item (GET with path parameter):**

```bash
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/Prod/items/item-001
```

**Update an item (PUT):**

```bash
curl -X PUT \
  https://your-api-id.execute-api.us-east-1.amazonaws.com/Prod/items/item-001 \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Updated Item Name",
    "description": "Modified description"
  }'
```

**Delete an item (DELETE):**

```bash
curl -X DELETE \
  https://your-api-id.execute-api.us-east-1.amazonaws.com/Prod/items/item-001
```

**Test with query parameters:**

```bash
curl "https://your-api-id.execute-api.us-east-1.amazonaws.com/Prod/items?limit=10&offset=0"
```

### 🗄️ Exercise 3.5: Verify DynamoDB Data (Optional)

**Task:** Use AWS CLI to inspect your DynamoDB table directly.

1. List your DynamoDB tables:

```bash
aws dynamodb list-tables
```

2. Scan your table to see all items:

```bash
aws dynamodb scan --table-name YourTableName
```

3. Get a specific item (replace with your table name and key):

```bash
aws dynamodb get-item \
  --table-name YourTableName \
  --key '{"id": {"S": "item-001"}}'
```

### 📊 Exercise 3.6: Monitor Lambda Execution (Optional)

**Task:** View real-time logs from your Lambda functions.

1. Tail logs using SAM CLI:

```bash
sam logs -n HelloWorldFunction --stack-name my-first-serverless-app --tail
```

2. Make a few API requests in another terminal, and watch the logs appear!

3. Alternative: Use AWS CLI for logs:

```bash
# Find your function name
aws lambda list-functions --query 'Functions[*].FunctionName'

# Tail logs
aws logs tail /aws/lambda/your-function-name --follow
```

### 🔧 Exercise 3.7: Make Changes and Redeploy (Optional)

**Task:** Experience the deployment workflow by making a code change.

1. Edit your Lambda handler (e.g., `src/app.py` or `src/index.js`)

2. Change the response message:

```python
# Python example
return {
    "statusCode": 200,
    "body": json.dumps({
        "message": "Hello from my updated Lambda function!",
    }),
}
```

3. Rebuild and redeploy:

```bash
sam build
sam deploy
```

**Notice:** This time deployment is faster - SAM only updates what changed!

4. Test your updated endpoint:

```bash
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/Prod/hello
```

### ✅ Checkpoint 3

Before moving on, verify you've completed the core exercises:
- [ ] You successfully deployed your application with `sam deploy --guided`
- [ ] You received an API Gateway endpoint URL
- [ ] You made at least one successful curl request to your production API
- [ ] You understand how to test API endpoints with curl

**Optional exercises (monitoring, redeployment, etc.) can be explored after the lesson!**

### 💡 Key Takeaways

- `sam deploy --guided` walks you through first-time deployment setup
- Subsequent deployments only need `sam deploy`
- CloudFormation manages all infrastructure as code
- API Gateway provides a production-ready HTTP endpoint
- Lambda functions are fully managed - no servers to maintain
- CloudWatch automatically captures all function logs
- Redeployments are fast and update only changed resources

---

## Step 4: Clean Up AWS Resources

**Objective:** Properly delete all AWS resources to avoid ongoing charges  
**Time:** 5 minutes

### 📚 Theory: Why Clean Up Matters

Even with the Free Tier:
- **S3 storage costs** accumulate over time
- **DynamoDB tables** may incur charges if you exceed free tier limits
- **CloudWatch logs** consume storage
- **Good practice** - Always clean up test/learning resources

The good news: SAM makes cleanup simple by deleting everything with one command!

### ⚠️ Important: Before You Delete

**Warning:** This action is irreversible. Make sure you:
- [ ] Have saved any code you want to keep (your local files are safe)
- [ ] Have documented any important configurations
- [ ] Have exported any data you need from DynamoDB
- [ ] Are deleting the correct stack (check the stack name!)

### 🎯 Exercise 4.1: Delete Your Stack

**Task:** Use SAM CLI to delete all AWS resources.

1. Run the delete command:

```bash
sam delete
```

2. Confirm the prompts:

```
Are you sure you want to delete the stack my-first-serverless-app in the region us-east-1 ? [y/N]: y
Are you sure you want to delete the folder my-first-serverless-app in S3 which contains the artifacts? [y/N]: y
```

3. **Wait for deletion** (takes 1-2 minutes). You'll see output like:

```
Deleted successfully
```

### 🔍 Exercise 4.2: Verify Complete Deletion (Optional - Quick Check)

**Task:** Confirm all resources were removed.

Try to describe the stack (should fail):

```bash
aws cloudformation describe-stacks --stack-name my-first-serverless-app
```

**Expected output:**
```
An error occurred (ValidationError) when calling the DescribeStacks operation: 
Stack with id my-first-serverless-app does not exist
```

If you see this error, your cleanup was successful!

### 🚀 Alternative Deletion Methods (Reference Only)

#### Method 2: Delete Without Prompts

For automated scripts or CI/CD:

```bash
sam delete --no-prompts --stack-name my-first-serverless-app
```

#### Method 3: Use CloudFormation Directly

```bash
aws cloudformation delete-stack --stack-name my-first-serverless-app
```

Then monitor deletion status:

```bash
aws cloudformation describe-stacks --stack-name my-first-serverless-app \
  --query 'Stacks[0].StackStatus'
```

### 🧹 Exercise 4.3: Manual Cleanup (Reference - Skip During Lesson)

**Task:** Learn to manually remove resources if automatic deletion fails.

Sometimes resources fail to delete automatically. Here's how to clean them up:

**1. Find and delete S3 buckets:**

```bash
# List SAM-managed buckets
aws s3 ls | grep aws-sam-cli-managed

# Delete bucket (must be empty first)
aws s3 rb s3://your-bucket-name --force
```

**2. Delete DynamoDB tables:**

```bash
# List your tables
aws dynamodb list-tables

# Delete specific table
aws dynamodb delete-table --table-name YourTableName
```

**3. Delete CloudWatch Log Groups:**

```bash
# List log groups for your function
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/

# Delete log group
aws logs delete-log-group --log-group-name /aws/lambda/YourFunctionName
```

**4. Check for remaining API Gateways:**

```bash
# List APIs
aws apigateway get-rest-apis

# Delete specific API
aws apigateway delete-rest-api --rest-api-id your-api-id
```

### 🎓 Exercise 4.4: Review AWS Console (Optional - Post-Lesson)

**Task:** Visually confirm deletion in the AWS Console.

1. Log into the [AWS Console](https://console.aws.amazon.com)

2. Navigate to **CloudFormation** → Verify your stack shows as "DELETED" or doesn't appear

3. Check **Lambda** → Functions list should not show your functions

4. Check **API Gateway** → APIs list should not show your API

5. Check **DynamoDB** → Tables list should not show your table

6. Check **S3** → Verify deployment buckets are removed (may take a few minutes)

### 💰 Exercise 4.5: Cost Verification (Optional - Post-Lesson)

**Task:** Verify you won't incur unexpected charges.

1. Check the AWS Billing Dashboard:
   - Navigate to **Billing → Bills**
   - Look for any charges from Lambda, API Gateway, or DynamoDB
   - Most should be $0.00 or covered by Free Tier

2. Set up a billing alert (best practice):

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name billing-alarm \
  --alarm-description "Alert when charges exceed $10" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 10.0 \
  --comparison-operator GreaterThanThreshold
```

### ✅ Final Checkpoint

Confirm you've completed the core cleanup:
- [ ] Ran `sam delete` successfully
- [ ] Saw "Deleted successfully" message

**That's it!** Your AWS resources have been cleaned up. The optional verification steps above can be explored after the lesson if you want to learn more about what happens behind the scenes.

### 💡 Key Takeaways

- `sam delete` removes all resources defined in your template
- Always verify deletion to avoid unexpected charges
- CloudFormation tracks all resources, making cleanup reliable
- Some resources (like S3 buckets with objects) may need manual deletion
- Setting up billing alerts is a best practice for all AWS accounts
- Your local code remains intact - only AWS resources are deleted

---

## 🎓 Lesson Complete!

Congratulations! You've successfully completed your first serverless backend lesson. You now understand:

✅ How to initialize serverless applications with AWS SAM  
✅ Local development and testing workflows  
✅ Deploying to AWS and managing cloud resources  
✅ Testing APIs with real HTTP requests  
✅ Proper resource cleanup and cost management

---

## 📚 Reference Guide

### Quick Command Reference

**Local Development:**
```bash
sam build                          # Build your application
sam local start-api                # Start local API Gateway
sam local invoke Function -e file  # Test function directly
sam local generate-event service   # Generate sample events
```

**Deployment:**
```bash
sam deploy --guided                # First deployment (interactive)
sam deploy                         # Subsequent deployments
sam delete                         # Remove all resources
```

**Monitoring:**
```bash
sam logs -n FunctionName --tail    # View function logs
sam list endpoints                 # Show API endpoints
sam list resources                 # Show all stack resources
sam validate                       # Validate template syntax
```

**AWS CLI Commands:**
```bash
aws dynamodb list-tables           # List DynamoDB tables
aws lambda list-functions          # List Lambda functions
aws cloudformation describe-stacks # View stack details
```

---

## 🚀 Next Steps & Advanced Topics

### Lesson 2 Preview: Enhance Your Serverless Backend

Ready to level up? Here are suggested next topics:

1. **Add Authentication**
   - Implement API Gateway authorizers
   - Integrate AWS Cognito for user management
   - Secure your endpoints with JWT tokens

2. **Database Optimization**
   - Design efficient DynamoDB schemas
   - Implement Global Secondary Indexes (GSI)
   - Add DynamoDB Streams for real-time processing

3. **Error Handling & Logging**
   - Implement structured logging
   - Add error handling middleware
   - Set up CloudWatch alarms and notifications

4. **CI/CD Pipeline**
   - Automate deployments with GitHub Actions
   - Use AWS CodePipeline for continuous delivery
   - Implement staging and production environments

5. **Performance & Cost Optimization**
   - Enable Lambda provisioned concurrency
   - Optimize cold start times
   - Implement caching strategies with API Gateway

### Recommended Learning Path

- 📘 [AWS SAM Examples](https://github.com/aws/serverless-application-model/tree/master/examples) - Real-world templates
- 📘 [SAM Policy Templates](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-policy-templates.html) - Pre-built IAM policies
- 📘 [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html) - AWS official guidance
- 📘 [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html) - Data modeling patterns

---

## ⚠️ Troubleshooting Guide

### Common Issues & Solutions

**Problem: Docker Not Running**
```
Error: Running AWS SAM projects locally requires Docker
```
**Solution:** Start Docker Desktop and verify with `docker --version`

**Problem: AWS Credentials Not Found**
```
Error: Unable to locate credentials
```
**Solution:** Run `aws configure` and enter your AWS Access Key ID and Secret

**Problem: Permission Denied**
```
Error: User is not authorized to perform: cloudformation:CreateStack
```
**Solution:** Ensure your IAM user has `AdministratorAccess` or appropriate SAM permissions

**Problem: Build Failures**
```
Error: PythonPipBuilder:ResolveDependencies
```
**Solution:** Check your Python version matches the Lambda runtime in `template.yaml`

**Problem: Lambda Timeout**
```
Error: Task timed out after 3.00 seconds
```
**Solution:** Increase timeout in `template.yaml` under function properties:
```yaml
Timeout: 30  # seconds
```

**Problem: DynamoDB Table Already Exists**
```
Error: Table already exists
```
**Solution:** Either delete the old stack or change the table name in your template

---

## 💡 Serverless Best Practices

As you continue your serverless journey, keep these principles in mind:

### Development Practices
1. ✅ **Test locally first** - Use `sam local` before deploying to AWS
2. ✅ **Use environment variables** - Never hardcode configuration
3. ✅ **Implement proper error handling** - Return meaningful error messages
4. ✅ **Enable structured logging** - Use JSON logs for better CloudWatch analysis
5. ✅ **Version your APIs** - Use API Gateway stages (dev, staging, prod)

### Security Practices
1. 🔒 **Principle of least privilege** - Grant minimal required permissions
2. 🔒 **Enable CORS carefully** - Don't use `*` in production
3. 🔒 **Validate input data** - Never trust client-side validation alone
4. 🔒 **Use Secrets Manager** - Store sensitive data securely
5. 🔒 **Enable AWS WAF** - Protect against common web exploits

### Cost Optimization
1. 💰 **Set up billing alerts** - Know when spending increases
2. 💰 **Use appropriate memory sizes** - More memory = faster but costlier
3. 💰 **Implement caching** - Reduce Lambda invocations with API Gateway cache
4. 💰 **Clean up unused resources** - Delete old stacks and test environments
5. 💰 **Monitor with Cost Explorer** - Track spending by service

### Performance Tips
1. ⚡ **Minimize cold starts** - Keep deployment packages small
2. ⚡ **Reuse connections** - Initialize SDK clients outside the handler
3. ⚡ **Use Lambda Layers** - Share dependencies across functions
4. ⚡ **Optimize DynamoDB queries** - Use efficient key patterns
5. ⚡ **Enable X-Ray tracing** - Identify performance bottlenecks

---

## 📖 Additional Learning Resources

### Official Documentation
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/) - Complete SAM reference
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/) - Lambda deep dive
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/) - API Gateway features
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/) - NoSQL database guide

### Community & Support
- [AWS SAM GitHub](https://github.com/aws/serverless-application-model) - Report issues, contribute
- [AWS SAM CLI GitHub](https://github.com/aws/aws-sam-cli) - CLI tool development
- [AWS Forums](https://forums.aws.amazon.com/) - Community support
- [AWS re:Post](https://repost.aws/) - Technical Q&A community

### Hands-on Learning
- [AWS Workshops](https://workshops.aws/) - Free guided workshops
- [AWS Samples](https://github.com/aws-samples) - Sample applications
- [Serverless Land](https://serverlessland.com/) - Patterns and tutorials
- [AWS Skill Builder](https://skillbuilder.aws/) - Official training courses

---

## 🎯 Self-Assessment Quiz

Test your understanding:

1. What command initializes a new SAM project?
2. What does `sam build` do?
3. How do you start a local API Gateway?
4. What's the difference between `sam local start-api` and `sam local invoke`?
5. What command deploys your application to AWS for the first time?
6. Where are your Lambda function logs stored?
7. How do you delete all AWS resources created by SAM?
8. What file stores your infrastructure as code?
9. What AWS service manages the deployment of SAM applications?
10. Why is it important to run `sam delete` after learning exercises?

<details>
<summary>Click to see answers</summary>

1. `sam init`
2. Processes the template, installs dependencies, and prepares deployment artifacts
3. `sam local start-api`
4. `start-api` runs a local HTTP server; `invoke` tests a single function with an event
5. `sam deploy --guided`
6. Amazon CloudWatch Logs (under `/aws/lambda/FunctionName`)
7. `sam delete`
8. `template.yaml`
9. AWS CloudFormation
10. To avoid ongoing AWS charges and practice good resource management

</details>

---

## 🎉 Congratulations!

You've completed Lesson 1 and built your first serverless backend! You're now equipped with the foundational skills to build scalable, cost-effective cloud applications.

**Keep building, keep learning, and welcome to the serverless world!** 🚀

