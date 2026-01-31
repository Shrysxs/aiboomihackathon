"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Questionnaire() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: [] as string[],
    marketingGoal: [] as string[],
    targetAudience: [] as string[],
    advertisingPlatform: [] as string[],
    brandTone: [] as string[],
    reviews: "",
    preferredCTA: [] as string[],
  });

  const handleCheckboxChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => {
      const current = prev[field] as string[];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.businessName || !formData.reviews.trim()) {
      alert("Please fill in Business Name and Customer Reviews");
      return;
    }

    if (formData.reviews.trim().split("\n").filter(r => r.trim().length > 0).length < 3) {
      alert("Please provide at least 3 customer reviews");
      return;
    }

    if (
      formData.businessType.length === 0 ||
      formData.marketingGoal.length === 0 ||
      formData.targetAudience.length === 0 ||
      formData.advertisingPlatform.length === 0 ||
      formData.brandTone.length === 0 ||
      formData.preferredCTA.length === 0
    ) {
      alert("Please select at least one option for each field");
      return;
    }

    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to process questionnaire");
      }

      const result = await response.json();
      router.push(`/results?id=${result.id}`);
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">Get Started</h1>
        <p className="text-gray-600 mb-8">Tell us about your business</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">
              1. Business Name
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter business name"
              required
            />
          </div>

          {/* Business Type */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-900">
              2. Business Type
            </label>
            <div className="space-y-2">
              {["Local Business", "Service Provider", "Restaurant / Cafe", "E-commerce / D2C", "Personal Brand"].map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.businessType.includes(option)}
                    onChange={() => handleCheckboxChange("businessType", option)}
                    className="mr-2 w-4 h-4"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Primary Marketing Goal */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-900">
              3. Primary Marketing Goal
            </label>
            <div className="space-y-2">
              {["More leads", "More sales", "Brand awareness", "Social media growth"].map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.marketingGoal.includes(option)}
                    onChange={() => handleCheckboxChange("marketingGoal", option)}
                    className="mr-2 w-4 h-4"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-900">
              4. Target Audience
            </label>
            <div className="space-y-2">
              {["Students", "Working professionals", "Business owners", "Families", "Everyone"].map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.targetAudience.includes(option)}
                    onChange={() => handleCheckboxChange("targetAudience", option)}
                    className="mr-2 w-4 h-4"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Advertising Platform */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-900">
              5. Advertising Platform
            </label>
            <div className="space-y-2">
              {["Instagram / Facebook", "Google Ads", "Website / Landing Page", "Marketplace Listing"].map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.advertisingPlatform.includes(option)}
                    onChange={() => handleCheckboxChange("advertisingPlatform", option)}
                    className="mr-2 w-4 h-4"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Brand Tone */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-900">
              6. Brand Tone
            </label>
            <div className="space-y-2">
              {["Professional", "Friendly", "Bold", "Premium"].map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.brandTone.includes(option)}
                    onChange={() => handleCheckboxChange("brandTone", option)}
                    className="mr-2 w-4 h-4"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Customer Reviews */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">
              7. Customer Reviews
            </label>
            <textarea
              value={formData.reviews}
              onChange={(e) => setFormData({ ...formData, reviews: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[200px]"
              placeholder="Paste your customer reviews here, one per line:&#10;&#10;Amazing service! The team was professional...&#10;Best experience I've had. Highly recommend...&#10;Fast, reliable, and affordable..."
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Paste customer reviews (one per line). Minimum 3 reviews required.
            </p>
          </div>

          {/* Preferred Call-to-Action */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-900">
              8. Preferred Call-to-Action
            </label>
            <div className="space-y-2">
              {["Call now", "Book now", "Order now", "Learn more"].map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.preferredCTA.includes(option)}
                    onChange={() => handleCheckboxChange("preferredCTA", option)}
                    className="mr-2 w-4 h-4"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Generate Ads
          </button>
        </form>
      </div>
    </div>
  );
}
