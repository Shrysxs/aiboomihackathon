import { NextResponse } from "next/server";

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
    return NextResponse.json(result || { id: jobId, status: "processing" });
  } catch (error) {
    console.error("Error processing questionnaire:", error);
    return NextResponse.json(
      { error: "Failed to process questionnaire" },
      { status: 500 }
    );
  }
}

async function processJob(jobId: string, formData: any) {
  try {
    // Step 1: Parse reviews from text input
    if (!formData.reviews || !formData.reviews.trim()) {
      throw new Error("No reviews provided");
    }

    // Step 2: Pre-process reviews (split by newlines, clean, deduplicate)
    const reviews = preprocessReviews(formData.reviews);

    if (reviews.length < 3) {
      throw new Error("At least 3 reviews are required");
    }

    // Step 3: AI Call #1 - Insight Extraction using OpenAI
    const insights = await extractInsights(reviews);

    // Step 4: AI Call #2 - Content Generation using OpenAI
    const outputs = await generateContent(formData, insights);

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

function preprocessReviews(reviewsText: string): string[] {
  // Split by newlines and process each review
  return reviewsText
    .split("\n")
    .map((review) => review.trim())
    .filter((review) => review.length > 0)
    .filter((review, index, self) => self.indexOf(review) === index); // Remove duplicates
}

async function extractInsights(reviews: string[]): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
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

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
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
    throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content returned from OpenAI");
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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
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
- Review Count: ${insights.reviewCount}

CRITICAL RULES:
1. Use ONLY language and claims that are supported by the review insights
2. Do NOT invent benefits or claims not mentioned in reviews
3. Use customer language from trust signals and benefits
4. Match the brand tone: ${tone}
5. Make it suitable for: ${platforms}

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
  "marketingCopy": "Complete marketing copy (2-3 paragraphs) with hook, value proposition, social proof, and CTA",
  "imageAd": {
    "headline": "Short headline for image ad (max 8 words)",
    "subheadline": "Supporting subheadline (max 12 words)",
    "cta": "${cta}",
    "designStyle": "clean, minimal, professional"
  }
}

Return ONLY valid JSON, no markdown formatting or code blocks.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
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
    throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content returned from OpenAI");
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
