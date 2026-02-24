import { useState } from 'react';
import { ChevronDown, HelpCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I create an account?',
        a: 'Click on the "Register" button, fill in your details including your university email, and verify your email address to activate your account.',
      },
      {
        q: 'Is the platform free to use?',
        a: 'We offer both free and premium plans. The free plan includes limited access to practice questions, while premium plans unlock unlimited questions, detailed analytics, and personalized study plans.',
      },
      {
        q: 'How do I start taking practice exams?',
        a: 'After logging in, navigate to your university, department, course, and topic. Then click "Start Exam" to configure and begin your practice session.',
      },
    ],
  },
  {
    category: 'Exams & Questions',
    questions: [
      {
        q: 'What happens if my internet connection drops during an exam?',
        a: 'Your answers are automatically saved as you select them. If you disconnect, simply log back in and you can resume from where you left off.',
      },
      {
        q: 'Can I review my answers after submitting?',
        a: 'Yes! After completing an exam, you can view detailed results including correct answers, explanations, and performance analytics.',
      },
      {
        q: 'How are questions selected for my exam?',
        a: 'Questions are randomly selected from the chosen topic based on your configured difficulty level and question count.',
      },
      {
        q: 'Can I pause an exam and continue later?',
        a: 'Once you start an exam, the timer runs continuously. You can abandon the exam if needed, but this will be recorded in your history.',
      },
    ],
  },
  {
    category: 'Performance & Analytics',
    questions: [
      {
        q: 'How is my score calculated?',
        a: 'Your score is based on the percentage of questions answered correctly. Detailed breakdowns are available in your analytics dashboard.',
      },
      {
        q: 'What do the weak/strong areas show?',
        a: 'These are automatically identified based on your performance across different topics. Topics where you consistently score below 60% are marked as weak areas.',
      },
      {
        q: 'How does the leaderboard work?',
        a: 'The leaderboard ranks students based on total points earned across all exams. You can filter by university or course.',
      },
    ],
  },
  {
    category: 'Study Plans & Materials',
    questions: [
      {
        q: 'What are study plans?',
        a: 'Study plans are personalized schedules that help you prepare for exams systematically. You can create custom plans or use AI-recommended ones based on your weak areas.',
      },
      {
        q: 'Where can I find study materials?',
        a: 'Study materials are available under each course. These include PDFs, videos, and documents uploaded by instructors.',
      },
    ],
  },
  {
    category: 'Account & Billing',
    questions: [
      {
        q: 'How do I upgrade to a premium plan?',
        a: 'Go to Plans page, select your preferred plan, and complete payment via Paystack. Your account will be upgraded immediately.',
      },
      {
        q: 'Can I cancel my subscription?',
        a: 'Yes, you can cancel anytime from your account settings. You\'ll retain premium access until the end of your billing period.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major payment cards (Visa, Mastercard, Verve) and bank transfers through our secure Paystack integration.',
      },
    ],
  },
  {
    category: 'Technical Issues',
    questions: [
      {
        q: 'The platform is slow or not loading',
        a: 'Clear your browser cache and cookies. Ensure you have a stable internet connection. If the issue persists, contact support.',
      },
      {
        q: 'I\'m not receiving verification emails',
        a: 'Check your spam folder. If still not there, request a new verification email from the login page or contact support.',
      },
      {
        q: 'I forgot my password',
        a: 'Click "Forgot Password" on the login page, enter your email, and follow the reset instructions sent to your inbox.',
      },
    ],
  },
];

export function FAQ() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleQuestion = (key: string) => {
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <Layout>
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600">
            Find answers to common questions about our CBT platform
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">{category.category}</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {category.questions.map((faq, questionIndex) => {
                  const key = `${categoryIndex}-${questionIndex}`;
                  const isOpen = openIndex === key;
                  return (
                    <div key={key}>
                      <button
                        onClick={() => toggleQuestion(key)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                      >
                        <span className="font-semibold text-gray-900 pr-8">
                          {faq.q}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Still have questions?</h3>
          <p className="text-green-100 mb-6">
            Our support team is here to help you succeed
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-3 bg-white text-green-700 rounded-lg font-semibold hover:bg-green-50 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
    </Layout>
  );
}
