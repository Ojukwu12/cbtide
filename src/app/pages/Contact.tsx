import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { Layout } from '../components/Layout';

export function Contact() {

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Have a question or need help? Here's how you can reach our support team.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Email */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 text-sm mb-3">
                Send us an email and we'll respond within 24 hours
              </p>
              <a 
                href="mailto:support@cbtide.com" 
                className="text-green-600 font-semibold hover:text-green-700"
              >
                support@cbtide.com
              </a>
            </div>

            {/* Support Hours */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Support Hours</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Mon - Fri</span>
                  <span className="font-medium">8AM - 6PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span className="font-medium">10AM - 4PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="font-medium">Closed</span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Headquarters</h3>
              <p className="text-gray-600 text-sm">
                Nigeria
              </p>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-8 text-white mb-12">
            <h2 className="text-2xl font-bold mb-4">How We Can Help</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Technical Support</h3>
                <p className="text-green-100">Issues with exams, registration, or platform features</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Account & Billing</h3>
                <p className="text-green-100">Questions about your subscription or payment</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Feedback & Suggestions</h3>
                <p className="text-green-100">Help us improve with your valuable input</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Partnerships</h3>
                <p className="text-green-100">Interested in collaborating with us?</p>
              </div>
            </div>
          </div>

          {/* FAQ Link */}
          <div className="text-center">
            <p className="text-gray-600 mb-4 text-lg">
              Most questions answered in our FAQ section
            </p>
            <a
              href="/faq"
              className="inline-block px-6 py-3 border-2 border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors"
            >
              View FAQ
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
