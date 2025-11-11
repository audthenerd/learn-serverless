# Building Your First Serverless Backend

**Duration:** 45 minutes  
**Level:** Beginner

## Prerequisites

Ensure you have:
- [AWS CLI](https://aws.amazon.com/cli/) installed and configured
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) installed
- [Docker Desktop](https://www.docker.com/products/docker-desktop) running
- An AWS account with appropriate permissions

Verify your setup:

```bash
aws --version
sam --version
docker --version
```

---

## Step 1: Initialize Your SAM Project

### 1.1: Create Your Application

Run the SAM initialization command:

```bash
sam init
```

Select the following options:
- Template source: `AWS Quick Start Templates`
- Application template: `Serverless API`
- Runtime: `nodejs20.x` (or your preference)
- Project name: `my-first-serverless-app`
- X-Ray tracing: `N`
- CloudWatch Application Insights: `N`

Navigate into your project:

```bash
cd my-first-serverless-app
```

### 1.2: Review Project Structure

Key files to understand:
- `template.yaml` - Defines all AWS resources
- `src/app.js` - Lambda function code
- `events/event.json` - Sample test payload

---

## Step 2: Test Locally

### 2.1: Build and Start Local API

Ensure Docker Desktop is running, then build your application:

```bash
sam build
```

Start the local API Gateway:

```bash
sam local start-api
```

You should see output showing your endpoint at `http://127.0.0.1:3000/hello`.

Keep this terminal running and open a new terminal window.

### 2.2: Test Your Local API

Test the endpoint with `curl`:

```bash
curl http://127.0.0.1:3000/hello
```

Expected response:

```json
{
  "message": "hello world"
}
```

You can also access the endpoint in your browser: `http://127.0.0.1:3000/hello`

### 2.3: Test Function Directly (Optional)

Stop the local API (press `Ctrl+C`), then invoke the function with a test event:

```bash
sam local invoke HelloWorldFunction -e events/event.json
```

---

## Step 3: Deploy to AWS

### 3.1: Deploy Your Application

Build your application:

```bash
sam build
```

Deploy with guided setup:

```bash
sam deploy --guided
```

Use these settings:
- Stack Name: `my-first-serverless-app`
- AWS Region: `us-east-1`
- Confirm changes before deploy: `y`
- Allow SAM CLI IAM role creation: `Y`
- Disable rollback: `N`
- HelloWorldFunction may not have authorization defined: `y`
- Save arguments to configuration file: `Y`
- SAM configuration file: `[Press Enter]`
- SAM configuration environment: `[Press Enter]`

Wait 2-3 minutes for deployment. Copy the API URL from the output:

```
Value: https://abc123xyz.execute-api.us-east-1.amazonaws.com/Prod/hello/
```

### 3.2: Test Your Production API

Test with your actual API URL:

```bash
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/Prod/hello
```

Expected response:

```json
{
  "message": "hello world"
}
```

### 3.3: Update and Redeploy (Optional)

Edit `src/app.js` to change the message:

```javascript
return {
    statusCode: 200,
    body: JSON.stringify({
        message: "Hello from my updated Lambda function!",
    }),
};
```

Rebuild and redeploy:

```bash
sam build
sam deploy
```

Test the updated endpoint:

```bash
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/Prod/hello
```

---

## Step 4: Clean Up

### 4.1: Delete Your Stack

Delete all AWS resources:

```bash
sam delete
```

Confirm both prompts with `y`. Wait 1-2 minutes for deletion to complete.

### 4.2: Verify Deletion (Optional)

Confirm all resources were removed:

```bash
aws cloudformation describe-stacks --stack-name my-first-serverless-app
```

You should see an error message indicating the stack doesn't exist - this confirms successful deletion.

---

## Complete!

You've successfully built and deployed your first serverless backend.

---

## Quick Reference

**Local Development:**
```bash
sam build                          # Build application
sam local start-api                # Start local API
sam local invoke Function -e file  # Test function
```

**Deployment:**
```bash
sam deploy --guided                # First deployment
sam deploy                         # Subsequent deployments
sam delete                         # Remove all resources
```

**Monitoring:**
```bash
sam logs -n FunctionName --tail    # View logs
```

---

## Next Steps

Explore these topics to enhance your serverless skills:
- Add authentication with AWS Cognito
- Implement error handling and structured logging
- Set up CI/CD pipelines
- Optimize performance and costs

**Resources:**
- [AWS SAM Examples](https://github.com/aws/serverless-application-model/tree/master/examples)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

---

## Troubleshooting

**Docker Not Running:**
Start Docker Desktop and verify with `docker --version`

**AWS Credentials Not Found:**
Run `aws configure` and enter your credentials

**Permission Denied:**
Ensure your IAM user has appropriate permissions

**Build Failures:**
Check your Node.js version matches the Lambda runtime in `template.yaml`

**Lambda Timeout:**
Increase timeout in `template.yaml`:
```yaml
Timeout: 30  # seconds
```
