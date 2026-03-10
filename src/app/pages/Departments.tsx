import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Layout } from '../components/Layout';
import { GraduationCap, ChevronRight, Loader, ArrowLeft } from 'lucide-react';
import { academicService } from '../../lib/services';

export function Departments() {
  const { universityId } = useParams<{ universityId: string }>();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments', universityId],
    queryFn: () => academicService.getDepartments(universityId!),
    enabled: !!universityId,
  });

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredDepartments = (departments || []).filter((department) => {
    if (!normalizedSearchTerm) return true;
    const name = String(department.name || '').toLowerCase();
    const description = String(department.description || '').toLowerCase();
    return name.includes(normalizedSearchTerm) || description.includes(normalizedSearchTerm);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Departments</h1>
          <p className="text-gray-600">Select a department to view courses</p>
        </div>

        <div>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search departments..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((department) => (
            (() => {
              const departmentId = department.id || department._id;
              if (!departmentId) return null;

              return (
                <Link
                  key={departmentId}
                  to={`/departments/${departmentId}`}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:border-green-500 hover:shadow-lg transition-all group"
                >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors">
                  <GraduationCap className="w-6 h-6 text-green-600 group-hover:text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">{department.name}</h3>
              {department.description && (
                <p className="text-sm text-gray-500 line-clamp-2">{department.description}</p>
              )}
                </Link>
              );
            })()
          ))}
        </div>

        {departments?.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No departments yet</h3>
            <p className="text-gray-600">Departments will appear here once added</p>
          </div>
        )}

        {departments && departments.length > 0 && filteredDepartments.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No department found</h3>
            <p className="text-gray-600">Try a different search term</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
