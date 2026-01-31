import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="px-6 py-20 md:py-32 max-w-6xl mx-auto text-center">
        <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          VOICEADS
        </h1>
        <h2 className="text-3xl md:text-5xl font-semibold mb-6 text-gray-900">
          Ads written by your customers, not your brand.
        </h2>
        <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
          Turn real customer reviews into high-trust ads, images, and marketing copy.
        </p>
        <Link
          href="/questionnaire"
          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Generate Ads from Reviews
        </Link>
      </section>

      {/* Problem Section */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-gray-900">The Problem</h2>
          <div className="text-lg text-gray-700 space-y-4 leading-relaxed">
            <p>
              Local businesses, restaurants, service providers, and D2C brands receive
              hundreds of customer reviews across platforms like Google Maps and social media.
              Despite this, most advertising still relies on guessed messaging.
            </p>
            <p>
              Businesses do not fail because of lack of platforms or resources,
              but because they struggle to identify messaging that truly resonates.
              As a result, advertisements often feel generic, disconnected, and untrustworthy.
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-gray-900">The Solution</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            VOICEADS analyzes real customer reviews to identify recurring language,
            emotional signals, and trust-building phrases.
            It then converts these insights into advertising content written in
            the customer's own words — the most credible form of marketing.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-16 text-center text-gray-900">How It Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-blue-600 font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Add your business details</h3>
              <p className="text-gray-600">Quick questionnaire to understand your business context</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-blue-600 font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Connect your Google Maps reviews</h3>
              <p className="text-gray-600">We fetch real customer reviews automatically</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-blue-600 font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Choose your output format</h3>
              <p className="text-gray-600">Select JSON, images, or marketing copy</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-blue-600 font-bold text-xl">4</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Get ads powered by real customer proof</h3>
              <p className="text-gray-600">Receive authentic, high-converting ad content</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
