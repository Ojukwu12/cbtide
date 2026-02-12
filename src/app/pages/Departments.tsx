import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { GraduationCap, ChevronRight, Loader, ArrowLeft } from 'lucide-react';
import { academicService } from '../../lib/services';

export function Departments() {
  const { facultyId } = useParams<{ facultyId: string }>();

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments', facultyId],
    queryFn: () => academicService.getDepartments(facultyId!),
    enabled: !!facultyId,
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Departments</h1>
          <p className="text-gray-600">Select a department to view courses</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments?.map((department) => (
            <Link
              key={department.id}
              to={`/departments/${department.id}`}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-green-500 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                  <GraduationCap className="w-6 h-6 text-purple-600 group-hover:text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">{department.name}</h3>
              {department.description && (
                <p className="text-sm text-gray-500 line-clamp-2">{department.description}</p>
              )}
            </Link>
          ))}
        </div>

        {departments?.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No departments yet</h3>
            <p className="text-gray-600">Departments will appear here once added</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
