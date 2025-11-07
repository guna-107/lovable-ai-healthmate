import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating recommendations for user:', user.id);

    // Fetch user profile and recent data
    const [profileRes, dailyLogRes, mealsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('daily_logs').select('*').eq('user_id', user.id).order('log_date', { ascending: false }).limit(7),
      supabase.from('meals').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(10),
    ]);

    const profile = profileRes.data || {};
    const dailyLogs = dailyLogRes.data || [];
    const recentMeals = mealsRes.data || [];

    // Build context for AI
    const context = {
      profile: {
        age: profile.age,
        gender: profile.gender,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
        target_weight_kg: profile.target_weight_kg,
        daily_calorie_goal: profile.daily_calorie_goal,
        daily_protein_goal: profile.daily_protein_goal,
        dietary_preferences: profile.dietary_preferences,
      },
      recentActivity: dailyLogs.slice(0, 7).map((log: any) => ({
        date: log.log_date,
        calories: log.total_calories,
        protein: log.total_protein_g,
        steps: log.steps,
        water: log.water_glasses,
      })),
      recentMeals: recentMeals.slice(0, 5).map((meal: any) => ({
        name: meal.meal_name,
        type: meal.meal_type,
        calories: meal.calories,
      })),
    };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert health coach. Provide personalized, actionable diet and fitness recommendations based on user data. Be encouraging and specific. Return 3-5 recommendations as a JSON array of strings.'
          },
          {
            role: 'user',
            content: `Based on this health data, provide personalized recommendations:\n${JSON.stringify(context, null, 2)}`
          }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429 || response.status === 402) {
        return new Response(
          JSON.stringify({ 
            recommendations: [
              'Keep tracking your meals consistently',
              'Aim for balanced macros in each meal',
              'Stay hydrated with 8 glasses of water daily',
            ]
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0].message.content;

    let recommendations;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        recommendations = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('JSON parse error, using fallback');
      recommendations = [
        'Continue tracking your meals for better insights',
        'Focus on whole foods and lean proteins',
        'Stay consistent with your water intake',
      ];
    }

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-recommendations function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate recommendations';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
