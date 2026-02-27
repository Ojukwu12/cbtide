import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import {
  FileText,
  Calendar,
  Clock,
  Award,
  TrendingUp,
  Filter,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { examService } from '../../lib/services/exam.service';
import { ExamSession } from '../../types';

const HISTORY_PAGE_SIZE = 50;
const MAX_HISTORY_PAGES = 20;

const fetchAllExamHistory = async (): Promise<{
  data: ExamSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const firstPage = await examService.getHistory(1, HISTORY_PAGE_SIZE);
  const merged = [...firstPage.data];
  const seenIds = new Set(merged.map((exam) => exam._id));

  const appendUnique = (items: ExamSession[]) => {
    items.forEach((exam) => {
      if (!seenIds.has(exam._id)) {
        seenIds.add(exam._id);
        merged.push(exam);
      }
    });
  };

  const hasExplicitPagination = firstPage.totalPages > 1;

  if (hasExplicitPagination) {
    for (let page = 2; page <= firstPage.totalPages; page += 1) {
      const pageResult = await examService.getHistory(page, HISTORY_PAGE_SIZE);
      appendUnique(pageResult.data);
    }
  } else if (firstPage.data.length === HISTORY_PAGE_SIZE) {
    for (let page = 2; page <= MAX_HISTORY_PAGES; page += 1) {
      const pageResult = await examService.getHistory(page, HISTORY_PAGE_SIZE);
      if (!pageResult.data.length) {
        break;
      }

      appendUnique(pageResult.data);

      if (pageResult.data.length < HISTORY_PAGE_SIZE) {
        break;
      }
    }
  }

  return {
    data: merged,
    total: Math.max(firstPage.total || 0, merged.length),
    page: 1,
    limit: merged.length,
    totalPages: 1,
  };
};

const formatDuration = (seconds?: number) => {
  if (!seconds && seconds !== 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getCourseName = (exam: ExamSession) => {
  if (typeof exam.course === 'string') {
    return exam.courseName || exam.courseCode || exam.course;
  }
  return exam.course?.title || exam.course?.code || 'Course';
};

const getExamStatus = (exam: ExamSession) => {
  if (typeof exam.isPassed === 'boolean') {
    return exam.isPassed ? 'Passed' : 'Failed';
  }
  const score = Number(
    exam.percentage ??
      (exam as any).scorePercentage ??
      (exam as any).percentageScore ??
      (exam as any).percent ??
      (exam as any).score ??
      0
  );
  return score >= 50 ? 'Passed' : 'Failed';
};

export function ExamHistory() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['exam-history', 'all'],
    queryFn: fetchAllExamHistory,
  });

  const exams = data?.data || [];

  const courses = useMemo(() => {
    const uniqueCourses = new Set(exams.map((exam) => getCourseName(exam)));
    return ['all', ...Array.from(uniqueCourses)];
  }, [exams]);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const status = getExamStatus(exam).toLowerCase();
      const courseName = getCourseName(exam);
      const matchesStatus = filterStatus === 'all' || status === filterStatus;
      const matchesCourse = filterCourse === 'all' || courseName === filterCourse;
      return matchesStatus && matchesCourse;
    });
  }, [exams, filterCourse, filterStatus]);

  const stats = useMemo(() => {
    const total = exams.length;
    const passed = exams.filter((exam) => getExamStatus(exam) === 'Passed').length;
    const failed = total - passed;
    const avgScore =
      total > 0
        ? Math.round(
            exams.reduce(
              (sum, exam) =>
                sum +
                Number(
                  exam.percentage ??
                    (exam as any).scorePercentage ??
                    (exam as any).percentageScore ??
                    (exam as any).percent ??
                    (exam as any).score ??
                    0
                ),
              0
            ) / total
          )
        : 0;
    return { total, passed, failed, avgScore };
  }, [exams]);

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
                  {courses.map((course) => (
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
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
            </div>
          )}

          {!isLoading && filteredExams.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No exams found for the selected filters.
            </div>
          )}

          {filteredExams.map((exam) => {
            const status = getExamStatus(exam);
            const courseName = getCourseName(exam);
            const score = Math.round(
              Number(
                exam.percentage ??
                  (exam as any).scorePercentage ??
                  (exam as any).percentageScore ??
                  (exam as any).percent ??
                  (exam as any).score ??
                  0
              )
            );
            const duration = formatDuration(exam.timeTaken);
            const correctAnswers = exam.correctAnswers || 0;
            const totalQuestions = exam.totalQuestions || 0;
            const examId = exam._id || (exam as any).id;

            return (
              <div
                key={examId}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      status === 'Passed' ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    {status === 'Passed' ? (
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
                          {courseName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(exam.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{duration}</span>
                          </div>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            {exam.status === 'completed' ? 'Completed' : 'In Progress'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-3xl font-bold mb-1 ${
                            status === 'Passed' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {score}%
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            status === 'Passed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          Correct Answers:{' '}
                          <span className="font-semibold text-gray-900">
                            {correctAnswers}/{totalQuestions}
                          </span>
                        </p>
                      </div>

                      <Link
                        to={`/exams/${examId}/results`}
                        className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
                      >
                        Review Answers
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
