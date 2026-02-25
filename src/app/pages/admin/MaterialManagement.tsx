import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileText, Loader2, Sparkles } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { sourceMaterialService } from '../../../lib/services/sourceMaterial.service';
import { academicService } from '../../../lib/services/academic.service';
import { Department, Course, University } from '../../../types';
import { toast } from 'sonner';

export function MaterialManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [deleteOutcomeToConfirm, setDeleteOutcomeToConfirm] = useState<'successful' | 'unsuccessful' | 'all' | null>(null);

  const getEntityId = (entity: any): string => entity?.id || entity?._id || '';
  const getMaterialId = (material: any): string => material?.id || material?._id || '';

  const { data: universities = [], isLoading: universitiesLoading } = useQuery({
    queryKey: ['universities'],
    queryFn: () => academicService.getUniversities(),
  });

  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments', selectedUniversity],
    queryFn: () => academicService.getDepartments(selectedUniversity),
    enabled: !!selectedUniversity,
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['courses', selectedDepartment],
    queryFn: () => academicService.getCourses(selectedDepartment),
    enabled: !!selectedDepartment,
  });

  const {
    data: materials = [],
    isLoading: materialsLoading,
  } = useQuery({
    queryKey: ['source-materials', selectedCourse],
    queryFn: () => sourceMaterialService.getMaterials(selectedCourse),
    enabled: !!selectedCourse,
  });

  const generateAndImportMutation = useMutation({
    mutationFn: async ({ courseId, materialId }: { courseId: string; materialId: string }) => {
      setActiveMaterialId(materialId);

      const generation = await sourceMaterialService.generateQuestions(courseId, materialId, {
        difficulty: 'mixed',
      });

      const extractedQuestions =
        (Array.isArray((generation as any)?.extractedQuestions) && (generation as any).extractedQuestions) ||
        (Array.isArray((generation as any)?.questions) && (generation as any).questions) ||
        [];

      const generatedCount = Number((generation as any)?.questionsCount ?? (generation as any)?.questionsGenerated);
      const normalizedGeneratedCount = Number.isFinite(generatedCount)
        ? generatedCount
        : extractedQuestions.length;

      const missingAnswersRaw = (generation as any)?.missingAnswers;
      const missingAnswers = Number.isFinite(Number(missingAnswersRaw))
        ? Number(missingAnswersRaw)
        : 0;

      if (extractedQuestions.length === 0 && normalizedGeneratedCount > 0) {
        return {
          generated: normalizedGeneratedCount,
          imported: normalizedGeneratedCount,
          missingAnswers,
        };
      }

      const importResult = await sourceMaterialService.importQuestions(
        courseId,
        materialId,
        extractedQuestions.length > 0 ? extractedQuestions : undefined
      );

      return {
        generated: normalizedGeneratedCount,
        imported: importResult?.imported ?? 0,
        missingAnswers,
      };
    },
    onSuccess: ({ generated, imported, missingAnswers }) => {
      toast.success(`Generated ${generated} and imported ${imported} question(s) to pending review`);
      if (missingAnswers > 0) {
        toast(`Imported as pending; ${missingAnswers} question${missingAnswers === 1 ? '' : 's'} still need answers.`);
      }
      queryClient.invalidateQueries({ queryKey: ['source-materials'] });
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-questions'] });
      setActiveMaterialId(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to generate and import questions');
      setActiveMaterialId(null);
    },
  });

  const deleteByOutcomeMutation = useMutation({
    mutationFn: async (uploadOutcome: 'successful' | 'unsuccessful' | 'all') => {
      if (!selectedCourse) {
        throw new Error('Please select a course');
      }
      return sourceMaterialService.deleteMaterialsByUploadOutcome(selectedCourse, uploadOutcome);
    },
    onSuccess: (_, uploadOutcome) => {
      const label =
        uploadOutcome === 'successful'
          ? 'successful uploads'
          : uploadOutcome === 'unsuccessful'
          ? 'unsuccessful uploads'
          : 'all uploads';
      toast.success(`Deleted source materials for ${label}`);
      queryClient.invalidateQueries({ queryKey: ['source-materials', selectedCourse] });
      setDeleteOutcomeToConfirm(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to delete source materials');
      setDeleteOutcomeToConfirm(null);
    },
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Generate & Import Questions</h1>
            <p className="text-gray-600 mt-2">Source materials only: upload happens in Question Bank, generation/import happens here</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Course</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <select
              value={selectedUniversity}
              onChange={(e) => {
                setSelectedUniversity(e.target.value);
                setSelectedDepartment('');
                setSelectedCourse('');
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={universitiesLoading}
            >
              <option value="">{universitiesLoading ? 'Loading universities...' : 'Select university'}</option>
              {universities.map((university: University) => (
                <option key={getEntityId(university)} value={getEntityId(university)}>
                  {university.name}
                </option>
              ))}
            </select>

            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedCourse('');
              }}
              disabled={!selectedUniversity || departmentsLoading}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
            >
              <option value="">
                {!selectedUniversity
                  ? 'Select university first'
                  : departmentsLoading
                  ? 'Loading departments...'
                  : 'Select department'}
              </option>
              {departments.map((department: Department) => (
                <option key={getEntityId(department)} value={getEntityId(department)}>
                  {department.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              disabled={!selectedDepartment || coursesLoading}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
            >
              <option value="">
                {!selectedDepartment
                  ? 'Select department first'
                  : coursesLoading
                  ? 'Loading courses...'
                  : 'Select course'}
              </option>
              {courses.map((course: Course) => {
                const courseId = getEntityId(course);
                const code = (course as any).code || (course as any).courseCode || '';
                const title = (course as any).title || (course as any).name || '';
                return (
                  <option key={courseId} value={courseId}>
                    {code ? `${code} - ${title}` : title}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {!selectedCourse && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            Select a course to load all already uploaded source materials from the database.
          </div>
        )}

        {selectedCourse && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Existing Source Materials</h2>
              <span className="ml-auto text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                {materials.length} found
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setDeleteOutcomeToConfirm('successful')}
                disabled={deleteByOutcomeMutation.isPending}
                className="px-3 py-2 text-sm rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Delete Successful
              </button>
              <button
                onClick={() => setDeleteOutcomeToConfirm('unsuccessful')}
                disabled={deleteByOutcomeMutation.isPending}
                className="px-3 py-2 text-sm rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
              >
                Delete Unsuccessful
              </button>
              <button
                onClick={() => setDeleteOutcomeToConfirm('all')}
                disabled={deleteByOutcomeMutation.isPending}
                className="px-3 py-2 text-sm rounded-lg border border-red-300 text-red-800 hover:bg-red-100 disabled:opacity-50"
              >
                Delete All
              </button>
            </div>

            {materialsLoading ? (
              <div className="py-10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
              </div>
            ) : materials.length === 0 ? (
              <div className="py-10 text-center text-gray-600">
                No uploaded source materials found for this course.
              </div>
            ) : (
              <div className="space-y-3">
                {materials.map((material: any) => {
                  const materialId = getMaterialId(material);
                  const isRunning = generateAndImportMutation.isPending && activeMaterialId === materialId;

                  return (
                    <div
                      key={materialId || material.title}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{material.title}</p>
                        <p className="text-xs text-gray-500">
                          {material.fileType || 'material'} • {new Date(material.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (!materialId) {
                            toast.error('Material ID not found');
                            return;
                          }
                          generateAndImportMutation.mutate({ courseId: selectedCourse, materialId });
                        }}
                        disabled={generateAndImportMutation.isPending}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        {isRunning ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Generate & Import
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteOutcomeToConfirm}
        onClose={() => setDeleteOutcomeToConfirm(null)}
        onConfirm={() => {
          if (!deleteOutcomeToConfirm) return;
          deleteByOutcomeMutation.mutate(deleteOutcomeToConfirm);
        }}
        title="Delete source materials"
        message={
          deleteOutcomeToConfirm === 'successful'
            ? 'Delete all successfully uploaded source materials for this course?'
            : deleteOutcomeToConfirm === 'unsuccessful'
            ? 'Delete all unsuccessfully uploaded source materials for this course?'
            : 'Delete all source materials for this course?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteByOutcomeMutation.isPending}
      />
    </Layout>
  );
}
