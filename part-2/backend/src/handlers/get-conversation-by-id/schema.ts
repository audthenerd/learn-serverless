import { z } from "zod";

export const GetConversationByIdEventSchema = z.object({
  pathParameters: z.object({
    id: z.string().min(1, "Conversation ID is required")
  })
});

export type GetConversationByIdEvent = z.infer<typeof GetConversationByIdEventSchema>;
