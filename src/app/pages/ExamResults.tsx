import { Layout } from '../components/Layout';
import { Link } from 'react-router';
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Download,
  Share2
} from 'lucide-react';

export function ExamResults() {
  // Mock results data
  const results = {
    score: 85,
    totalQuestions: 20,
    correctAnswers: 17,
    incorrectAnswers: 3,
    accuracy: 85,
    timeTaken: '24:15',
    passingScore: 70,
    status: 'Passed'
  };

  const questionBreakdown = [
    { id: 1, question: 'What is the time complexity of binary search?', userAnswer: 'B', correctAnswer: 'B', isCorrect: true },
    { id: 2, question: 'Which data structure uses LIFO principle?', userAnswer: 'B', correctAnswer: 'B', isCorrect: true },
    { id: 3, question: 'What does OOP stand for?', userAnswer: 'C', correctAnswer: 'A', isCorrect: false },
    // ... more questions
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Results Header */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
            results.status === 'Passed' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <Trophy className={`w-10 h-10 ${
              results.status === 'Passed' ? 'text-green-600' : 'text-red-600'
            }`} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {results.status === 'Passed' ? 'Congratulations!' : 'Keep Practicing!'}
          </h1>
          <p className="text-xl text-gray-600">
            Computer Science 301 - Practice Exam
          </p>
        </div>

        {/* Score Card */}
        <div className={`bg-gradient-to-br rounded-2xl p-8 text-white ${
          results.status === 'Passed' 
            ? 'from-green-600 to-green-700' 
            : 'from-red-600 to-red-700'
        }`}>
          <div className="text-center mb-6">
            <div className="text-7xl font-bold mb-2">{results.score}%</div>
            <div className="text-xl opacity-90">Your Score</div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold mb-1">{results.correctAnswers}</div>
              <div className="text-sm opacity-90">Correct</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold mb-1">{results.incorrectAnswers}</div>
              <div className="text-sm opacity-90">Incorrect</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold mb-1">{results.accuracy}%</div>
              <div className="text-sm opacity-90">Accuracy</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold mb-1">{results.timeTaken}</div>
              <div className="text-sm opacity-90">Time Taken</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            to="/exams/start"
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors text-center group"
          >
            <TrendingUp className="w-8 h-8 text-green-600 mb-2 mx-auto" />
            <h3 className="font-semibold text-gray-900 mb-1">Practice Again</h3>
            <p className="text-sm text-gray-600">Improve your score</p>
          </Link>

          <Link
            to="/analytics"
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors text-center group"
          >
            <Target className="w-8 h-8 text-blue-600 mb-2 mx-auto" />
            <h3 className="font-semibold text-gray-900 mb-1">View Analytics</h3>
            <p className="text-sm text-gray-600">Track your progress</p>
          </Link>

          <button className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors text-center group">
            <Share2 className="w-8 h-8 text-purple-600 mb-2 mx-auto" />
            <h3 className="font-semibold text-gray-900 mb-1">Share Results</h3>
            <p className="text-sm text-gray-600">Show your achievement</p>
          </button>
        </div>

        {/* Question Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Question Breakdown</h2>
            <button className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium">
              <Download className="w-4 h-4" />
              Download Report
            </button>
          </div>

          <div className="space-y-3">
            {questionBreakdown.map((q, index) => (
              <div 
                key={q.id}
                className={`p-4 rounded-lg border-2 ${
                  q.isCorrect 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    q.isCorrect ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {q.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">
                        Question {index + 1}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        q.isCorrect 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {q.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{q.question}</p>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Your answer: </span>
                        <span className={`font-medium ${
                          q.isCorrect ? 'text-green-700' : 'text-red-700'
                        }`}>
                          Option {q.userAnswer}
                        </span>
                      </div>
                      {!q.isCorrect && (
                        <div>
                          <span className="text-gray-600">Correct answer: </span>
                          <span className="font-medium text-green-700">
                            Option {q.correctAnswer}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended Next Steps</h2>
          <div className="space-y-3">
            <Link to="/materials" className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md transition-shadow group">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Review Study Materials</h3>
                <p className="text-sm text-gray-600">Strengthen your understanding of weak areas</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
            </Link>
            
            <Link to="/analytics/weak-areas" className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md transition-shadow group">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Focus on Weak Topics</h3>
                <p className="text-sm text-gray-600">Get personalized practice recommendations</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
