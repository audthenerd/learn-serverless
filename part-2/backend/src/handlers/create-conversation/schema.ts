import { z } from "zod";

export const CreateConversationEventSchema = z.object({
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
        initialMessage: z.string().min(1, "initialMessage cannot be empty"),
        personas: z.object({
          initiator: z.object({
            id: z.string(),
            job_title: z.string(),
            traits: z.array(z.string()).optional(),
            communication_style: z.string().optional(),
            motivations: z.array(z.string()).optional(),
            frustrations: z.array(z.string()).optional(),
            values: z.array(z.string()).optional(),
          }),
          responder: z.object({
            id: z.string(),
            job_title: z.string(),
            traits: z.array(z.string()).optional(),
            communication_style: z.string().optional(),
            motivations: z.array(z.string()).optional(),
            frustrations: z.array(z.string()).optional(),
            values: z.array(z.string()).optional(),
          }),
        }),
      })
    ),
});

export type CreateConversationEvent = z.infer<
  typeof CreateConversationEventSchema
>;
