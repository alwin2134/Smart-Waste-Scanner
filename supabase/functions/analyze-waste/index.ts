import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WasteAnalysisResult {
  itemName: string;
  category: 'wet_organic' | 'dry_recyclable' | 'hazardous' | 'e_waste' | 'reject_sanitary' | 'unknown';
  binColor: string;
  binType: string;
  disposalTip: string;
  confidence: number;
  pointsEarned?: number;
  newBadges?: string[];
}

const wasteCategories = {
  wet_organic: {
    binColor: 'green',
    binType: 'Biodegradable Bin',
    defaultTip: 'Dispose in the green bin. Avoid plastic bags.',
    basePoints: 10
  },
  dry_recyclable: {
    binColor: 'blue',
    binType: 'Recyclable Bin',
    defaultTip: 'Rinse and clean before disposal.',
    basePoints: 15
  },
  hazardous: {
    binColor: 'red',
    binType: 'Hazardous Waste Bin',
    defaultTip: 'Handle with care. Do not mix with regular waste.',
    basePoints: 20
  },
  e_waste: {
    binColor: 'black',
    binType: 'E-Waste Collection Bin',
    defaultTip: 'Remove batteries if possible. Take to certified collection centers.',
    basePoints: 25
  },
  reject_sanitary: {
    binColor: 'yellow',
    binType: 'Incineration / Sanitary Bin',
    defaultTip: 'Wrap securely before disposal.',
    basePoints: 10
  },
  unknown: {
    binColor: 'gray',
    binType: 'Unknown',
    defaultTip: 'Please try again with a clearer image.',
    basePoints: 0
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, userId } = await req.json();
    
    if (!imageBase64) {
      console.error('No image provided');
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing waste image...', userId ? `for user ${userId}` : 'anonymous');

    const systemPrompt = `You are an expert waste classification AI. Analyze the image and identify the waste item, then classify it into exactly ONE of these categories:

1. "wet_organic" - Food waste, vegetable/fruit peels, garden waste, flowers, leaves, coffee grounds, tea bags
2. "dry_recyclable" - Paper, cardboard, plastic bottles, metal cans, glass bottles, newspapers, magazines, clean packaging
3. "hazardous" - Batteries, paint, chemicals, pesticides, fluorescent bulbs, medical waste, oils, solvents
4. "e_waste" - Phones, computers, TVs, cables, keyboards, mice, chargers, electronic devices, circuit boards
5. "reject_sanitary" - Diapers, sanitary pads, tissues, cotton swabs, bandages, masks, gloves, contaminated items

Respond ONLY with valid JSON in this exact format:
{
  "itemName": "identified item name",
  "category": "one of: wet_organic, dry_recyclable, hazardous, e_waste, reject_sanitary, unknown",
  "confidence": 0.0 to 1.0,
  "disposalTip": "specific disposal instruction for this item"
}

If the image is blurry, unclear, or doesn't show waste, use "unknown" category with appropriate confidence score.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              },
              {
                type: 'text',
                text: 'Analyze this waste item and classify it. Respond with JSON only.'
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI Response:', content);

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let parsed;
    try {
      // Extract JSON from possible markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsed = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      parsed = {
        itemName: 'Unidentified Item',
        category: 'unknown',
        confidence: 0.3,
        disposalTip: 'Could not analyze the image clearly. Please try again with a clearer photo.'
      };
    }

    const category = parsed.category in wasteCategories ? parsed.category : 'unknown';
    const categoryInfo = wasteCategories[category as keyof typeof wasteCategories];
    const confidence = Math.min(1, Math.max(0, parsed.confidence || 0.5));
    
    // Calculate points based on confidence
    const pointsEarned = category !== 'unknown' 
      ? Math.round(categoryInfo.basePoints * confidence)
      : 0;

    const result: WasteAnalysisResult = {
      itemName: parsed.itemName || 'Unknown Item',
      category: category as WasteAnalysisResult['category'],
      binColor: categoryInfo.binColor,
      binType: categoryInfo.binType,
      disposalTip: parsed.disposalTip || categoryInfo.defaultTip,
      confidence,
      pointsEarned,
    };

    // If user is logged in, save the scan and update points
    if (userId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Save scan to history
        await supabase.from('scan_history').insert({
          user_id: userId,
          item_name: result.itemName,
          category: result.category,
          bin_color: result.binColor,
          bin_type: result.binType,
          disposal_tip: result.disposalTip,
          confidence: result.confidence,
          points_earned: pointsEarned,
        });

        // Update user points and check for badges
        if (pointsEarned > 0) {
          const { data: pointsResult } = await supabase.rpc('add_scan_points', {
            p_user_id: userId,
            p_points: pointsEarned,
            p_category: result.category,
          });

          if (pointsResult?.new_badges?.length > 0) {
            result.newBadges = pointsResult.new_badges;
          }
        }

        console.log('Scan saved for user:', userId, 'Points earned:', pointsEarned);
      } catch (dbError) {
        console.error('Error saving scan to database:', dbError);
        // Don't fail the request, just log the error
      }
    }

    console.log('Analysis result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-waste function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to analyze image' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
