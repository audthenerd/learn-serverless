// Helper function to add random delay
export async function randomDelay() {
  const delay = Math.floor(Math.random() * 500); // 0-500ms
  await new Promise((resolve) => setTimeout(resolve, delay));
}

// Helper function to call AI service with retry logic
export async function callAI(
  messages: Array<{ role: string; content: string }>,
  aiApiKey: string
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

      const aiResponse = await fetch(
        "https://4ebp5kndnp43j6uqz7y53u4dly0jwule.lambda-url.ap-southeast-1.on.aws/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${aiApiKey}`,
          },
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
