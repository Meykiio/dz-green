import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { careSchema, fireSchema, plantingSchema } from "@/lib/submissions.functions";

/**
 * Mobile submissions endpoint (issue #8 contract): one route for plant/care/
 * fire from the mobile app. Auth is the caller's Supabase access token —
 * verified live server-side; the same abuse gate and service-role inserts run
 * inside the impls. The service-role key never ships in the app.
 */

const bodySchema = z.object({
  kind: z.enum(["plant", "care", "fire"]),
  data: z.unknown(),
});

async function requireUserId(): Promise<string> {
  const { getRequest } = await import("@tanstack/react-start/server");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const auth = getRequest().headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) throw new Error("Missing access token.");
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw new Error("Invalid access token.");
  return data.user.id;
}

export const Route = createFileRoute("/api/mobile/submissions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsedBody: z.infer<typeof bodySchema>;
        try {
          parsedBody = bodySchema.parse(await request.json());
        } catch {
          return Response.json({ error: "Invalid JSON body." }, { status: 400 });
        }

        try {
          await requireUserId();
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : "Unauthorized." },
            { status: 401 },
          );
        }

        const { submitPlantingImpl, submitCareImpl, submitFireImpl } = await import(
          "@/lib/submissions-impl.server"
        );

        try {
          if (parsedBody.kind === "plant") {
            const result = await submitPlantingImpl(plantingSchema.parse(parsedBody.data));
            return Response.json(result, { status: 201 });
          }
          if (parsedBody.kind === "care") {
            const result = await submitCareImpl(careSchema.parse(parsedBody.data));
            return Response.json(result, { status: 201 });
          }
          const result = await submitFireImpl(fireSchema.parse(parsedBody.data));
          return Response.json(result, { status: 201 });
        } catch (e) {
          // GateError messages are user-safe; anything else is logged generic.
          const message = e instanceof Error ? e.message : "Could not submit. Try again.";
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
