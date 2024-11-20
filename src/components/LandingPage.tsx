import { ArrowRight, BarChart2, Shield, Zap } from 'lucide-react';

export default function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            LinkedIn Analytics Dashboard
          </h1>
          <p className="mt-6 text-xl text-gray-500 max-w-3xl mx-auto">
            Transform your LinkedIn data into actionable insights. Upload your CSV exports and get detailed analytics about your posts' performance.
          </p>
          <button
            onClick={onLogin}
            className="mt-8 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Get Started <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={<BarChart2 className="h-8 w-8 text-blue-500" />}
            title="Detailed Analytics"
            description="Get comprehensive insights about your posts' performance, including views, likes, comments, and shares."
          />
          <Feature
            icon={<Zap className="h-8 w-8 text-blue-500" />}
            title="Easy Import"
            description="Simply upload your LinkedIn CSV exports and get instant access to beautiful visualizations and insights."
          />
          <Feature
            icon={<Shield className="h-8 w-8 text-blue-500" />}
            title="Secure & Private"
            description="Your data is stored securely and is only accessible to you. We use industry-standard encryption."
          />
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-500">{description}</p>
    </div>
  );
}