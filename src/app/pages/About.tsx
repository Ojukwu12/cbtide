import { BookOpen, Target, Award, TrendingUp, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';

export function About() {
  const navigate = useNavigate();

  return (
    <Layout>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-600 to-green-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">About CBT Platform</h1>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            Empowering students to excel through comprehensive computer-based testing 
            and adaptive learning solutions for Nigerian universities.
          </p>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              To revolutionize university education by providing an accessible, reliable,
              and intelligent computer-based testing platform that helps students prepare 
              effectively and perform confidently in their examinations.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
              <Award className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
            <p className="text-gray-600 leading-relaxed">
              To become the leading CBT platform across Nigerian universities, fostering 
              a culture of continuous learning, fair assessment, and academic excellence 
              through innovative technology and data-driven insights.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Choose Our Platform
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-green-500 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Comprehensive Coverage</h3>
              <p className="text-gray-600">
                Access thousands of practice questions across all courses, topics, and difficulty levels.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-500 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Performance Analytics</h3>
              <p className="text-gray-600">
                Track your progress with detailed analytics and identify areas for improvement.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-500 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Secure & Reliable</h3>
              <p className="text-gray-600">
                Enterprise-grade security with automatic saving and seamless exam experience.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-12 text-white">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">50+</div>
              <div className="text-green-100">Universities</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">10K+</div>
              <div className="text-green-100">Active Students</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">100K+</div>
              <div className="text-green-100">Practice Questions</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">95%</div>
              <div className="text-green-100">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Built by Educators
          </h2>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
            Our platform is developed in collaboration with university lecturers, 
            educational technologists, and successful students to ensure we deliver 
            the most effective learning experience.
          </p>
        </div>
      </div>
    </div>
    </Layout>
  );
}
