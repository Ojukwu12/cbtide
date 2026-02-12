import { useState } from 'react';
import { Link } from 'react-router';
import { Layout } from '../components/Layout';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Award, 
  TrendingUp,
  Filter,
  ChevronRight
} from 'lucide-react';

export function ExamHistory() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');

  const exams = [
    { 
      id: 1, 
      course: 'Computer Science 301', 
      type: 'Practice',
      score: 85, 
      total: 20,
      correct: 17,
      date: '2026-02-07',
      duration: '24:15',
      status: 'Passed',
      topics: ['Data Structures', 'Algorithms']
    },
    { 
      id: 2, 
      course: 'Mathematics 201', 
      type: 'Mock',
      score: 72, 
      total: 25,
      correct: 18,
      date: '2026-02-05',
      duration: '38:42',
      status: 'Passed',
      topics: ['Calculus', 'Linear Algebra']
    },
    { 
      id: 3, 
      course: 'Physics 101', 
      type: 'Practice',
      score: 65, 
      total: 15,
      correct: 10,
      date: '2026-02-03',
      duration: '22:30',
      status: 'Passed',
      topics: ['Mechanics']
    },
    { 
      id: 4, 
      course: 'Chemistry 202', 
      type: 'Final',
      score: 58, 
      total: 30,
      correct: 17,
      date: '2026-02-01',
      duration: '45:18',
      status: 'Failed',
      topics: ['Organic Chemistry', 'Physical Chemistry']
    },
    { 
      id: 5, 
      course: 'Computer Science 301', 
      type: 'Practice',
      score: 92, 
      total: 20,
      correct: 18,
      date: '2026-01-30',
      duration: '26:45',
      status: 'Passed',
      topics: ['OOP', 'Databases']
    },
  ];

  const courses = ['all', ...Array.from(new Set(exams.map(e => e.course)))];

  const filteredExams = exams.filter(exam => {
    const matchesStatus = filterStatus === 'all' || exam.status.toLowerCase() === filterStatus;
    const matchesCourse = filterCourse === 'all' || exam.course === filterCourse;
    return matchesStatus && matchesCourse;
  });

  const stats = {
    total: exams.length,
    passed: exams.filter(e => e.status === 'Passed').length,
    failed: exams.filter(e => e.status === 'Failed').length,
    avgScore: Math.round(exams.reduce((sum, e) => sum + e.score, 0) / exams.length)
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam History</h1>
            <p className="text-gray-600">Review your past exam performance</p>
          </div>
          <Link
            to="/exams/start"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            New Exam
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Total Exams</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Passed</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.passed}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Failed</h3>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Average Score</h3>
            </div>
            <p className="text-3xl font-bold text-purple-600">{stats.avgScore}%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Course</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {courses.map(course => (
                    <option key={course} value={course}>
                      {course === 'all' ? 'All Courses' : course}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Exam List */}
        <div className="space-y-4">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  exam.status === 'Passed' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {exam.status === 'Passed' ? (
                    <Award className="w-6 h-6 text-green-600" />
                  ) : (
                    <FileText className="w-6 h-6 text-red-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">
                        {exam.course}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{exam.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{exam.duration}</span>
                        </div>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {exam.type}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-3xl font-bold mb-1 ${
                        exam.status === 'Passed' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {exam.score}%
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        exam.status === 'Passed' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {exam.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Correct Answers: <span className="font-semibold text-gray-900">{exam.correct}/{exam.total}</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {exam.topics.map(topic => (
                          <span key={topic} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Link
                      to={`/exams/${exam.id}/results`}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredExams.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No exams found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters or take a new exam</p>
            <Link
              to="/exams/start"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <FileText className="w-5 h-5" />
              Start New Exam
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
