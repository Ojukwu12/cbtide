import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Layout } from '../components/Layout';
import { Building2, ChevronRight, Loader } from 'lucide-react';
import { academicService } from '../../lib/services';

export function Universities() {
  const { data: universities, isLoading } = useQuery({
    queryKey: ['universities'],
    queryFn: () => academicService.getUniversities(),
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Universities</h1>
          <p className="text-gray-600">Browse universities and their programs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {universities?.map((university) => (
            <Link
              key={university.id}
              to={`/universities/${university.id}`}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-green-500 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors">
                  <Building2 className="w-6 h-6 text-green-600 group-hover:text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">{university.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{university.shortName}</p>
              {university.description && (
                <p className="text-sm text-gray-500 line-clamp-2">{university.description}</p>
              )}
            </Link>
          ))}
        </div>

        {universities?.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No universities yet</h3>
            <p className="text-gray-600">Universities will appear here once added by admins</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
