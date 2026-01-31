import { NextResponse } from "next/server";

// Note: For Hugging Face image generation, we'll use a text-to-image model
// Qwen/Qwen-Image-2512 may not be available, so we'll use a compatible alternative

// In-memory storage for demo purposes (stateless backend constraint)
// In production, this would be replaced with proper state management
const processQueue: Map<string, any> = new Map();

export async function POST(request: Request) {
  try {
    const formData = await request.json();

    // Generate a unique ID for this processing job
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store the form data temporarily
    processQueue.set(jobId, {
      formData,
      status: "processing",
      createdAt: Date.now(),
    });

    // Process immediately
    // In production, this would be async with proper queue system
    await processJob(jobId, formData);

    const result = processQueue.get(jobId);
    // Ensure id is always included in response
    return NextResponse.json({ 
      id: jobId,
      ...result 
    });
  } catch (error) {
    console.error("Error processing questionnaire:", error);
    return NextResponse.json(
      { 
        error: "Failed to process questionnaire",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

async function processJob(jobId: string, formData: any) {
  try {
    // Step 1: Extract place ID from Google Maps URL
    const placeId = extractPlaceId(formData.googleMapsLink);
    if (!placeId) {
      throw new Error("Invalid Google Maps URL. Please provide a valid Google Maps business link.");
    }

    // Step 2: Fetch reviews using Google Places API
    const reviews = await fetchReviews(placeId);

    // Step 3: Pre-process reviews
    const cleanReviews = preprocessReviews(reviews);

    if (cleanReviews.length < 3) {
      throw new Error("At least 3 reviews are required");
    }

    // Step 4: AI Call #1 - Insight Extraction using Groq
    const insights = await extractInsights(cleanReviews);

    // Step 5: AI Call #2 - Content Generation using Groq
    const outputs = await generateContent(formData, insights);

    // Step 6: Generate advertisement image using Hugging Face
    if (outputs.imageAd) {
      const imageUrl = await generateAdImage(formData, insights, outputs.imageAd);
      outputs.imageAd.imageUrl = imageUrl;
    }

    // Store results
    processQueue.set(jobId, {
      formData,
      status: "completed",
      insights,
      outputs,
      createdAt: processQueue.get(jobId)?.createdAt || Date.now(),
    });
  } catch (error) {
    console.error("Error in processJob:", error);
    processQueue.set(jobId, {
      ...processQueue.get(jobId),
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

function extractPlaceId(url: string): string | null {
  // Extract place ID from various Google Maps URL formats
  // Format 1: https://www.google.com/maps/place/?q=place_id:ChIJ...
  const placeIdMatch = url.match(/place_id=([^&]+)/);
  if (placeIdMatch) return placeIdMatch[1];
  
  // Format 2: https://maps.google.com/?cid=123456789
  const cidMatch = url.match(/[?&]cid=([^&]+)/);
  if (cidMatch) {
    // CID needs to be converted to place_id via API
    return cidMatch[1];
  }
  
  // Format 3: Extract from place name URL (requires text search)
  // https://www.google.com/maps/place/PlaceName/@lat,lng
  const placeMatch = url.match(/\/place\/([^\/@]+)/);
  if (placeMatch) {
    // This requires text search to get place_id
    return placeMatch[1];
  }
  
  // Format 4: Direct place_id in URL
  const directMatch = url.match(/\/place_id\/([^\/\?]+)/);
  if (directMatch) return directMatch[1];
  
  return null;
}

async function fetchReviews(placeIdOrQuery: string): Promise<string[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY environment variable is not set");
  }

  let placeId = placeIdOrQuery;

  // Check if it's a valid place_id format (starts with ChIJ or is a valid place_id)
  const isValidPlaceId = placeIdOrQuery.startsWith("ChIJ") || 
                         placeIdOrQuery.match(/^[A-Za-z0-9_-]{27,}$/);

  if (!isValidPlaceId) {
    // If it's a CID or place name, use text search to find place_id
    const searchQuery = placeIdOrQuery;
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
    
    try {
      const searchResponse = await fetch(textSearchUrl);
      const searchData = await searchResponse.json();
      
      if (searchData.status === "OK" && searchData.results && searchData.results.length > 0) {
        placeId = searchData.results[0].place_id;
      } else {
        throw new Error(`Could not find place: ${searchData.error_message || searchData.status}`);
      }
    } catch (error) {
      throw new Error(`Failed to search for place: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Fetch place details with reviews
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=reviews,rating,user_ratings_total,name&key=${apiKey}`;
  
  let response;
  let data;
  
  try {
    response = await fetch(detailsUrl);
    data = await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch place details: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  if (data.status !== "OK") {
    throw new Error(`Google Places API error: ${data.error_message || data.status}`);
  }

  if (!data.result) {
    throw new Error("Place not found");
  }

  if (!data.result.reviews || data.result.reviews.length === 0) {
    throw new Error("No reviews found for this place");
  }

  // Extract review text, limit to 30-50 reviews as specified
  const reviews = data.result.reviews
    .slice(0, 50)
    .map((review: any) => review.text)
    .filter((text: string) => text && text.trim().length > 0);

  if (reviews.length === 0) {
    throw new Error("No valid reviews found");
  }

  return reviews;
}

function preprocessReviews(reviews: string[]): string[] {
  return reviews
    .map((review) => review.trim())
    .filter((review) => review.length > 0)
    .filter((review, index, self) => self.indexOf(review) === index); // Remove duplicates
}

async function extractInsights(reviews: string[]): Promise<any> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set");
  }

  const reviewText = reviews.join("\n\n");
  const prompt = `Analyze the following customer reviews and extract structured insights. Return ONLY valid JSON with no markdown formatting or code blocks.

Reviews:
${reviewText}

Extract and return a JSON object with this exact structure:
{
  "repeatedPhrases": ["array of phrases that appear multiple times"],
  "keyBenefits": ["array of main benefits mentioned by customers"],
  "trustSignals": ["array of trust-building phrases and statements"],
  "customerEmotions": ["array of emotions expressed"],
  "importantKeywords": ["array of important keywords"],
  "reviewCount": ${reviews.length}
}

Focus on:
- Phrases that appear in multiple reviews
- Specific benefits customers mention
- Trust signals like "will return", "highly recommend", "exceeded expectations"
- Emotions customers express
- Keywords that are most relevant

Return ONLY the JSON object, no other text.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are a marketing insights analyst. Extract structured insights from customer reviews and return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content returned from Groq");
  }

  try {
    // Parse JSON, handling potential markdown code blocks
    const cleanedContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const insights = JSON.parse(cleanedContent);
    
    // Ensure reviewCount is set
    insights.reviewCount = reviews.length;
    
    return insights;
  } catch (parseError) {
    console.error("Failed to parse insights JSON:", content);
    throw new Error("Failed to parse AI response as JSON");
  }
}

async function generateContent(formData: any, insights: any): Promise<any> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set");
  }

  const businessName = formData.businessName;
  const tone = formData.brandTone.join(", ") || "Professional";
  const cta = formData.preferredCTA[0] || "Learn more";
  const platforms = formData.advertisingPlatform.join(", ");
  const goals = formData.marketingGoal.join(", ");

  const prompt = `Generate advertising content for a business based on real customer review insights.

Business Context:
- Name: ${businessName}
- Business Type: ${formData.businessType.join(", ")}
- Marketing Goals: ${goals}
- Target Audience: ${formData.targetAudience.join(", ")}
- Advertising Platforms: ${platforms}
- Brand Tone: ${tone}
- Preferred CTA: ${cta}

Review Insights:
- Key Benefits: ${insights.keyBenefits?.join(", ") || "N/A"}
- Trust Signals: ${insights.trustSignals?.join(", ") || "N/A"}
- Important Keywords: ${insights.importantKeywords?.join(", ") || "N/A"}
- Customer Emotions: ${insights.customerEmotions?.join(", ") || "N/A"}
- Review Count: ${insights.reviewCount}

CRITICAL RULES:
1. Use ONLY language and claims that are supported by the review insights
2. Do NOT invent benefits, claims, numbers, awards, or guarantees not mentioned in reviews
3. Use customer language from trust signals and benefits
4. Match the brand tone: ${tone}
5. Make it suitable for: ${platforms}
6. Avoid generic marketing clichés
7. Output must feel suitable for large hotels, agencies, or enterprise clients

Generate THREE outputs as a JSON object with this exact structure:
{
  "json": {
    "headlines": ["array of 3-5 ad headlines using customer language"],
    "bodyCopy": ["array of 2-3 body copy variations"],
    "cta": "${cta}",
    "proofPhrases": ["array of trust signals from reviews"],
    "reviewSupport": {
      "benefit1": ${insights.reviewCount},
      "benefit2": ${Math.floor(insights.reviewCount * 0.8)}
    }
  },
  "marketingCopy": {
    "campaign_summary": {
      "campaign_objective": "Clear objective based on marketing goals",
      "target_audience": "${formData.targetAudience.join(", ")}",
      "key_emotion": "Primary emotion from customer reviews",
      "proof_source": "customer reviews"
    },
    "headlines": ["3-5 short headline variations that are trust-driven and premium in tone"],
    "subheadline": "One concise line explaining the promise, not salesy or exaggerated",
    "core_copy": "Professional, calm, confident hero paragraph suitable for website, landing pages, and long-form ads. No hype, no emojis, no exaggeration. Premium brand copy tone.",
    "value_points": ["4-6 experience-focused bullet points derived ONLY from customer insights, not feature-heavy"],
    "social_proof": "Paraphrase customer sentiments naturally using phrases like 'Guests consistently mention...' or 'Customers often highlight...'. Do NOT fabricate statistics. Base only on review insights.",
    "ctas": ["3-5 short, professional CTAs suitable for booking or conversion"]
  },
  "imageAd": {
    "headline": "Short headline for image ad (max 8 words)",
    "subheadline": "Supporting subheadline (max 12 words)",
    "cta": "${cta}",
    "designStyle": "clean, minimal, professional"
  }
}

Return ONLY valid JSON, no markdown formatting or code blocks.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are a marketing copywriter who creates authentic ad content based on real customer reviews. Never invent claims not supported by reviews.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content returned from Groq");
  }

  try {
    // Parse JSON, handling potential markdown code blocks
    const cleanedContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const outputs = JSON.parse(cleanedContent);
    
    // Ensure CTA is set correctly
    if (outputs.json) {
      outputs.json.cta = cta;
    }
    if (outputs.imageAd) {
      outputs.imageAd.cta = cta;
    }
    
    return outputs;
  } catch (parseError) {
    console.error("Failed to parse content JSON:", content);
    throw new Error("Failed to parse AI response as JSON");
  }
}

// Brand tone to mood mapping
function getMoodFromBrandTone(tone: string): string {
  const toneLower = tone.toLowerCase();
  if (toneLower.includes("professional")) return "calm, confident";
  if (toneLower.includes("friendly")) return "warm, welcoming";
  if (toneLower.includes("bold")) return "energetic, modern";
  if (toneLower.includes("premium")) return "elegant, refined";
  return "calm, confident"; // default
}

async function generateAdImage(formData: any, insights: any, imageAdData: any): Promise<string> {
  const hfApiKey = process.env.HUGGINGFACE_API_KEY;
  if (!hfApiKey) {
    throw new Error("HUGGINGFACE_API_KEY environment variable is not set");
  }

  // Extract variables for prompt
  const businessType = formData.businessType[0] || "business";
  const industry = formData.businessType.join(", ") || "general";
  const brandTone = formData.brandTone.join(", ") || "Professional";
  const targetPlatform = formData.advertisingPlatform[0] || "general";
  const targetAudience = formData.targetAudience.join(", ") || "general";
  const keyCustomerPhrase = insights.trustSignals?.[0] || insights.keyBenefits?.[0] || "quality service";
  const mood = getMoodFromBrandTone(brandTone);

  // System prompt (static) - embedded in user prompt for Hugging Face
  const systemPrompt = "You are a professional commercial advertising art director. Your task is to generate realistic, high-quality advertisement visuals suitable for real-world marketing campaigns. Avoid artistic, abstract, fantasy, or surreal styles. Prioritize realism, clarity, premium composition, and brand safety.";

  // User prompt (dynamic) - formatted for image generation
  const imagePrompt = `Create a premium advertisement image for a ${businessType} in the ${industry} industry.

Ad Context:
- Brand tone: ${brandTone}
- Target platform: ${targetPlatform}
- Target audience: ${targetAudience}

Core customer message (must inspire the visual):
"${keyCustomerPhrase}"

Visual Direction:
- Style: clean, modern, realistic commercial photography
- Mood: ${mood}
- Lighting: natural, professional, soft
- Composition: minimal, uncluttered, experience-focused
- Environment: relevant to the business context
- Color palette: premium, neutral, brand-safe

Text Handling:
- Do NOT include large blocks of text
- If text appears, limit to a short headline-style phrase
- Text must feel naturally integrated into the scene

Constraints:
- No logos unless generic
- No watermarks
- No exaggerated expressions
- No unrealistic props or scenery

Output Requirements:
- Square aspect ratio (1:1)
- High-resolution
- Advertisement-ready visual`;

  try {
    // Use Hugging Face Router API (new endpoint)
    // Try Stable Diffusion XL as primary model (widely available)
    const models = [
      "stabilityai/stable-diffusion-xl-base-1.0",
      "runwayml/stable-diffusion-v1-5",
      "stabilityai/stable-diffusion-2-1"
    ];

    let lastError: any = null;

    for (const modelName of models) {
      try {
        // Use router API endpoint (new format)
        const routerUrl = `https://router.huggingface.co/models/${modelName}`;
        
        const response = await fetch(routerUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${hfApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: imagePrompt,
          }),
        });

        // Handle model loading (202 status means model is loading)
        if (response.status === 202) {
          const loadingData = await response.json().catch(() => ({}));
          console.warn(`Model ${modelName} is loading, trying next model...`);
          lastError = "Model is loading";
          continue;
        }

        if (response.ok) {
          const contentType = response.headers.get("content-type");
          
          // Check if response is an image
          if (contentType && contentType.startsWith("image/")) {
            const imageBlob = await response.blob();
            // Convert blob to base64 data URL for display
            const arrayBuffer = await imageBlob.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");
            return `data:${contentType};base64,${base64}`;
          } else {
            // If not an image, might be JSON error
            const errorText = await response.text();
            try {
              const errorData = JSON.parse(errorText);
              lastError = errorData.error || errorText;
              // Check if it's a loading message
              if (errorData.estimated_time) {
                console.warn(`Model ${modelName} is loading, estimated time: ${errorData.estimated_time}s`);
                continue;
              }
            } catch {
              lastError = errorText;
            }
            continue; // Try next model
          }
        } else {
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            lastError = errorData.error || errorData.message || response.statusText;
          } catch {
            lastError = errorText || response.statusText;
          }
          console.warn(`Model ${modelName} failed (${response.status}):`, lastError);
          continue; // Try next model
        }
      } catch (modelError) {
        lastError = modelError instanceof Error ? modelError.message : "Unknown error";
        console.warn(`Error with model ${modelName}:`, lastError);
        continue; // Try next model
      }
    }

    // If all models failed, provide helpful error message
    throw new Error(`Hugging Face API error: All models failed. Last error: ${lastError || "Unknown error"}. Please check your API key and model availability.`);
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// API route to get results
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const job = processQueue.get(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}
