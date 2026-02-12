import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { Briefcase, ChevronRight, Loader, ArrowLeft } from 'lucide-react';
import { academicService } from '../../lib/services';

export function Faculties() {
  const { universityId } = useParams<{ universityId: string }>();

  const { data: faculties, isLoading } = useQuery({
    queryKey: ['faculties', universityId],
    queryFn: () => academicService.getFaculties(universityId!),
    enabled: !!universityId,
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
            Back to Universities
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Faculties</h1>
          <p className="text-gray-600">Select a faculty to view departments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {faculties?.map((faculty) => (
            <Link
              key={faculty.id}
              to={`/faculties/${faculty.id}`}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-green-500 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <Briefcase className="w-6 h-6 text-blue-600 group-hover:text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">{faculty.name}</h3>
              {faculty.description && (
                <p className="text-sm text-gray-500 line-clamp-2">{faculty.description}</p>
              )}
            </Link>
          ))}
        </div>

        {faculties?.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No faculties yet</h3>
            <p className="text-gray-600">Faculties will appear here once added</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
