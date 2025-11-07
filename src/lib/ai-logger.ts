import { supabase } from "@/integrations/supabase/client";

interface AIRequestLog {
  requestType: "chat" | "food_analysis" | "recommendation";
  modelUsed?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  responseTimeMs?: number;
  status?: "success" | "error";
  errorMessage?: string;
}

export const logAIRequest = async (log: AIRequestLog) => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) return;

    const { error } = await supabase.from("ai_request_logs").insert({
      user_id: session.session.user.id,
      request_type: log.requestType,
      model_used: log.modelUsed || "gemini-2.5-flash",
      input_tokens: log.inputTokens || 0,
      output_tokens: log.outputTokens || 0,
      total_tokens: log.totalTokens || 0,
      response_time_ms: log.responseTimeMs || 0,
      status: log.status || "success",
      error_message: log.errorMessage || null,
    });

    if (error) {
      console.warn("Failed to log AI request:", error);
    }
  } catch (err) {
    console.warn("Error logging AI request:", err);
  }
};
