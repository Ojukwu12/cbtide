import { useEffect, useState } from 'react';
import { BookOpen, Loader, ChevronLeft } from 'lucide-react';
import { Course } from '../../../types';
import { academicService } from '../../../lib/services/academic.service';
import { Button } from '../ui/button';

interface CourseSelectorProps {
  departmentId: string;
  value: string;
  onSelect: (courseId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function CourseSelector({
  departmentId,
  value,
  onSelect,
  onNext,
  onBack,
}: CourseSelectorProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await academicService.getCourses(departmentId);
        setCourses(data.sort((a, b) => a.code.localeCompare(b.code)));
      } catch (err) {
        setError('Failed to load courses');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (departmentId) {
      loadCourses();
    }
  }, [departmentId]);

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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Course</h2>
        <p className="text-gray-600">Choose the course you want to take an exam for</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {courses.length === 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
          No courses found for this department
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {courses.map((course) => (
          <button
            key={course.id}
            onClick={() => onSelect(course.id)}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              value === course.id
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <BookOpen
                className={`w-5 h-5 mt-1 flex-shrink-0 ${
                  value === course.id ? 'text-green-600' : 'text-gray-400'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <p
                    className={`font-semibold ${
                      value === course.id ? 'text-green-700' : 'text-gray-900'
                    }`}
                  >
                    {course.code}
                  </p>
                  {course.credits && (
                    <span className="text-xs text-gray-500">
                      {course.credits} credits
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-1">{course.title}</p>
                {course.description && (
                  <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                    {course.description}
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
