import { useEffect, useState } from 'react';
import { Building2, Loader, ChevronLeft } from 'lucide-react';
import { Department, Faculty } from '../../../types';
import { academicService } from '../../../lib/services/academic.service';
import { Button } from '../ui/button';

interface DepartmentSelectorProps {
  universityId: string;
  value: string;
  onSelect: (departmentId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function DepartmentSelector({
  universityId,
  value,
  onSelect,
  onNext,
  onBack,
}: DepartmentSelectorProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoading(true);
        setError('');
        // Get all faculties for the university
        const faculties = await academicService.getFaculties(universityId);

        // Get all departments from all faculties
        const allDepartments: Department[] = [];
        for (const faculty of faculties) {
          const facultyDepartments = await academicService.getDepartments(
            faculty.id
          );
          allDepartments.push(...facultyDepartments);
        }

        setDepartments(
          allDepartments.sort((a, b) => a.name.localeCompare(b.name))
        );
      } catch (err) {
        setError('Failed to load departments');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (universityId) {
      loadDepartments();
    }
  }, [universityId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Department</h2>
        <p className="text-gray-600">Choose your department to continue</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {departments.length === 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
          No departments found for this university
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((department) => (
          <button
            key={department.id}
            onClick={() => onSelect(department.id)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              value === department.id
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <Building2
                className={`w-5 h-5 mt-1 flex-shrink-0 ${
                  value === department.id ? 'text-green-600' : 'text-gray-400'
                }`}
              />
              <div>
                <p
                  className={`font-semibold ${
                    value === department.id ? 'text-green-700' : 'text-gray-900'
                  }`}
                >
                  {department.name}
                </p>
                {department.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {department.description}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!value}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
