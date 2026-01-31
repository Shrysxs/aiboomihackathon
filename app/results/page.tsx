 "use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Outputs {
  json: any;
  marketingCopy: string | {
    campaign_summary?: any;
    headlines?: string[];
    subheadline?: string;
    core_copy?: string;
    value_points?: string[];
    social_proof?: string;
    ctas?: string[];
  };
  imageAd: any;
}

interface JobData {
  status: string;
  outputs?: Outputs;
  insights?: any;
  error?: string;
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("id");
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"json" | "image" | "copy">("json");

  useEffect(() => {
    if (!jobId) return;

    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/process?id=${jobId}`);
        if (!response.ok) throw new Error("Failed to fetch results");

        const data = await response.json();
        setJobData(data);

        if (data.status === "processing") {
          // Poll for results
          setTimeout(fetchResults, 2000);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching results:", error);
        setLoading(false);
      }
    };

    fetchResults();
  }, [jobId]);

  if (loading || !jobData || jobData.status === "processing") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your reviews and generating ads...</p>
        </div>
      </div>
    );
  }

  if (jobData.status === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {jobData.error}</p>
          <Link href="/questionnaire" className="text-blue-600 hover:underline">
            Try again
          </Link>
        </div>
      </div>
    );
  }

  if (!jobData.outputs) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No outputs available</p>
          <Link href="/questionnaire" className="text-blue-600 hover:underline">
            Start over
          </Link>
        </div>
      </div>
    );
  }

  const { json, marketingCopy, imageAd } = jobData.outputs;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Generated Ads</h1>
          <p className="text-gray-600">Choose an output format below</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("json")}
                className={`px-6 py-4 font-semibold ${
                  activeTab === "json"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Structured JSON
              </button>
              <button
                onClick={() => setActiveTab("image")}
                className={`px-6 py-4 font-semibold ${
                  activeTab === "image"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Image Ad
              </button>
              <button
                onClick={() => setActiveTab("copy")}
                className={`px-6 py-4 font-semibold ${
                  activeTab === "copy"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Marketing Copy
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === "json" && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Structured JSON Output</h2>
                <pre className="bg-gray-50 p-6 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(json, null, 2)}
                </pre>
              </div>
            )}

            {activeTab === "image" && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Image Ad Creative</h2>
                {imageAd.imageUrl ? (
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <img 
                        src={imageAd.imageUrl} 
                        alt="Generated advertisement" 
                        className="w-full max-w-md mx-auto rounded-lg shadow-sm"
                      />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Headline:</strong> {imageAd.headline}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Subheadline:</strong> {imageAd.subheadline}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>CTA:</strong> {imageAd.cta}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Design Style:</strong> {imageAd.designStyle}, suitable for social media ads
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-12 text-white text-center max-w-md mx-auto">
                      <h3 className="text-3xl font-bold mb-4">{imageAd.headline}</h3>
                      <p className="text-xl mb-8 opacity-90">{imageAd.subheadline}</p>
                      <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                        {imageAd.cta}
                      </button>
                    </div>
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <strong>Design Notes:</strong> {imageAd.designStyle}, suitable for social media ads
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "copy" && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Marketing Copy</h2>
                <div className="bg-white border border-gray-200 rounded-lg p-8 space-y-6">
                  {typeof marketingCopy === "string" ? (
                    <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed font-sans">
                      {marketingCopy}
                    </pre>
                  ) : (
                    <>
                      {marketingCopy.campaign_summary && (
                        <div className="border-b border-gray-200 pb-4">
                          <h3 className="text-lg font-semibold mb-3 text-gray-900">Campaign Summary</h3>
                          <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <div><strong>Objective:</strong> {marketingCopy.campaign_summary.campaign_objective}</div>
                            <div><strong>Target Audience:</strong> {marketingCopy.campaign_summary.target_audience}</div>
                            <div><strong>Key Emotion:</strong> {marketingCopy.campaign_summary.key_emotion}</div>
                            <div><strong>Proof Source:</strong> {marketingCopy.campaign_summary.proof_source}</div>
                          </div>
                        </div>
                      )}
                      {marketingCopy.headlines && marketingCopy.headlines.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3 text-gray-900">Primary Headline Options</h3>
                          <ul className="list-disc list-inside space-y-2 text-gray-700">
                            {marketingCopy.headlines.map((headline, i) => (
                              <li key={i}>{headline}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {marketingCopy.subheadline && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2 text-gray-900">Supporting Sub-headline</h3>
                          <p className="text-gray-700">{marketingCopy.subheadline}</p>
                        </div>
                      )}
                      {marketingCopy.core_copy && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2 text-gray-900">Core Marketing Copy</h3>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{marketingCopy.core_copy}</p>
                        </div>
                      )}
                      {marketingCopy.value_points && marketingCopy.value_points.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3 text-gray-900">Value Proposition</h3>
                          <ul className="list-disc list-inside space-y-2 text-gray-700">
                            {marketingCopy.value_points.map((point, i) => (
                              <li key={i}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {marketingCopy.social_proof && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2 text-gray-900">Social Proof Language</h3>
                          <p className="text-gray-700 leading-relaxed">{marketingCopy.social_proof}</p>
                        </div>
                      )}
                      {marketingCopy.ctas && marketingCopy.ctas.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3 text-gray-900">Call-to-Action Variations</h3>
                          <ul className="list-disc list-inside space-y-2 text-gray-700">
                            {marketingCopy.ctas.map((cta, i) => (
                              <li key={i}>{cta}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Insights Summary */}
        {jobData.insights && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Insights from Reviews</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-gray-700 mb-2">Key Benefits:</p>
                <ul className="list-disc list-inside text-gray-600">
                  {jobData.insights.keyBenefits?.map((benefit: string, i: number) => (
                    <li key={i}>{benefit}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-2">Trust Signals:</p>
                <ul className="list-disc list-inside text-gray-600">
                  {jobData.insights.trustSignals?.map((signal: string, i: number) => (
                    <li key={i}>{signal}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              <strong>Reviews Analyzed:</strong> {jobData.insights.reviewCount}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Results() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
