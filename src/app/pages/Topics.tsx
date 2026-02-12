import { useParams, Link, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { FileText, Play, Loader, ArrowLeft, BarChart2 } from 'lucide-react';
import { academicService, questionService } from '../../lib/services';

export function Topics() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const { data: topics, isLoading } = useQuery({
    queryKey: ['topics', courseId],
    queryFn: () => academicService.getTopics(courseId!),
    enabled: !!courseId,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <Link
            to="/universities"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Topics</h1>
          <p className="text-gray-600">Select a topic to start practicing</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topics?.map((topic) => (
            <div
              key={topic.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-green-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">{topic.name}</h3>
              {topic.description && (
                <p className="text-sm text-gray-600 mb-4">{topic.description}</p>
              )}
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => navigate(`/exams/start?topicId=${topic.id}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  <Play className="w-4 h-4" />
                  Start Exam
                </button>
                <Link
                  to={`/topics/${topic.id}/analytics`}
                  className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  <BarChart2 className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {topics?.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No topics yet</h3>
            <p className="text-gray-600">Topics will appear here once added</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
