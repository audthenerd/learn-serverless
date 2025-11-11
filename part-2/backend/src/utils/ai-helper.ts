// Get AI API key from environment
const aiApiKey = process.env.AI_API_KEY || "";

// Disable TLS verification for local development (SAM local)
if (process.env.AWS_SAM_LOCAL) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// Helper function to add random delay
export async function randomDelay() {
  const delay = Math.floor(Math.random() * 500); // 0-500ms
  await new Promise((resolve) => setTimeout(resolve, delay));
}

// Helper function to call AI service with retry logic
export async function callAI(
  messages: Array<{ role: string; content: string }>,
  correlationId?: string
) {
  const maxRetries = 10;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      // Add random delay before calling API
      await randomDelay();

      const aiRequest = {
        messages,
        max_tokens: 500,
        temperature: 0.7,
      };

      // Build headers - only include Authorization if API key is provided
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (aiApiKey) {
        headers.Authorization = `Bearer ${aiApiKey}`;
      }

      // Add correlation ID for request tracing
      if (correlationId) {
        headers["X-Correlation-ID"] = correlationId;
      }

      const aiResponse = await fetch(
        "https://4ebp5kndnp43j6uqz7y53u4dly0jwule.lambda-url.ap-southeast-1.on.aws/",
        {
          method: "POST",
          headers,
          body: JSON.stringify(aiRequest),
        }
      );

      // If rate limited (429), retry with exponential backoff
      if (aiResponse.status === 429) {
        attempt++;
        if (attempt >= maxRetries) {
          throw new Error(
            `AI service rate limit exceeded after ${maxRetries} retries`
          );
        }
        // Exponential backoff: 1s, 2s, 4s, 8s, etc.
        const backoffDelay = Math.pow(2, attempt) * 1000;
        console.log(
          `Rate limited (429), retrying in ${backoffDelay}ms (attempt ${attempt}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        continue;
      }

      if (!aiResponse.ok) {
        throw new Error(
          `AI service returned ${aiResponse.status}: ${aiResponse.statusText}`
        );
      }

      const aiData = (await aiResponse.json()) as {
        choices: Array<{
          message: {
            content: string;
          };
        }>;
      };

      return aiData.choices[0].message.content;
    } catch (error) {
      // If it's a network error or other non-429 error, throw immediately
      if (
        error instanceof Error &&
        !error.message.includes("rate limit exceeded")
      ) {
        throw error;
      }
      // Otherwise, the retry logic will continue
    }
  }

  throw new Error(`AI service call failed after ${maxRetries} retries`);
}
