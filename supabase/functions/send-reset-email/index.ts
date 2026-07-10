import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const { email } = await req.json()

    const supabase = createClient(
      "https://qmrhxsrnvgvggwahufvp.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcmh4c3Judmd2Z2d3YWh1ZnZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzY3NTk4NCwiZXhwIjoyMDk5MjUxOTg0fQ.KDK7pQ3jKDkOtK8U5hjd7M5GbODgQEFk4Qg1IOOsIDw"
    )

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://click2pay.my.id/reset-password.html"
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 })
    }

    return new Response(JSON.stringify({ success: true }))
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
