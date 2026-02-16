import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, FileText, Loader2, Plus, X, Check, Sparkles, AlertCircle, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { materialService } from '../../../lib/services/material.service';
import { academicService } from '../../../lib/services/academic.service';
import { adminService } from '../../../lib/services/admin.service';
import { toast } from 'sonner';
import { Layout } from '../../components/Layout';
import { Course } from '../../../types';

const uploadSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  fileType: z.enum(['pdf', 'video', 'document', 'image']),
  topicId: z.string().min(1, 'Topic is required'),
  content: z.string().optional(),
  fileUrl: z.string().url().optional().or(z.literal('')),
});

type UploadForm = z.infer<typeof uploadSchema>;

// Helper function to fetch all courses from the system
const fetchAllCourses = async (): Promise<Course[]> => {
  const allCourses: Course[] = [];
  
  try {
    const universities = await academicService.getUniversities();
    
    for (const university of universities) {
      const departments = await academicService.getDepartments(university._id || university.id!);
      
      for (const department of departments) {
        const courses = await academicService.getCourses(department._id || department.id!);
        allCourses.push(...courses);
      }
    }
  } catch (error) {
    // Error handled silently as it's during initialization
  }
  
  return allCourses;
};

export function MaterialManagement() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [generationMode, setGenerationMode] = useState<'ai' | 'ocr'>('ocr');
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['all-courses'],
    queryFn: fetchAllCourses,
  });

  const { data: topicsData } = useQuery({
    queryKey: ['topics', selectedCourse],
    queryFn: () => academicService.getTopics(selectedCourse),
    enabled: !!selectedCourse,
  });

  // Fetch materials for selected course
  const { data: materials = [] } = useQuery({
    queryKey: ['materials', selectedCourse],
    queryFn: () => materialService.getMaterials(selectedCourse),
    enabled: !!selectedCourse,
  });

  const topics = topicsData as any;

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadForm & { file?: File }) => {
      const uploadData: any = {
        title: data.title,
        description: data.content,
        fileType: data.fileType,
        extractionMethod: generationMode,
        topicId: data.topicId,
      };
      if (data.content) uploadData.content = data.content;
      if (data.fileUrl) uploadData.fileUrl = data.fileUrl;
      if (data.file) uploadData.file = data.file;

      return materialService.uploadMaterial(selectedCourse, uploadData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material uploaded successfully!');
      reset();
      setSelectedFile(null);
      setUploadProgress(0);
      setIsUploading(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload material');
      setIsUploading(false);
    },
  });

  const generateQuestionsMutation = useMutation({
    mutationFn: ({ courseId, materialId }: { courseId: string; materialId: string }) =>
      materialService.generateQuestions(courseId, materialId),
    onSuccess: () => {
      toast.success('Questions generated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate questions');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const onSubmit = (data: UploadForm) => {
    if (!selectedFile && !data.fileUrl) {
      toast.error('Please select a file or provide a file URL');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    uploadMutation.mutate({ ...data, file: selectedFile || undefined });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Material Management</h1>
            <p className="text-gray-600 mt-2">Upload and manage study materials for courses</p>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Upload New Material</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course *
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={coursesLoading}
                  required
                >
                  <option value="">
                    {coursesLoading ? 'Loading courses...' : 'Select a course'}
                  </option>
                  {courses.map((course: Course) => (
                    <option key={course.id} value={course.id}>
                      {course.courseCode} - {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic *
                </label>
                <select
                  {...register('topicId')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={!selectedCourse}
                >
                  <option value="">Select a topic</option>
                  {topics?.map((topic: any) => (
                    <option key={topic._id || topic.id} value={topic._id || topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
                {errors.topicId && (
                  <p className="text-red-600 text-sm mt-1">{errors.topicId.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material Title *
              </label>
              <input
                {...register('title')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Introduction to Data Structures"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Type *
              </label>
              <select
                {...register('fileType')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="pdf">PDF Document</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
                <option value="image">Image</option>
                <option value="text">Text</option>
              </select>
              {errors.fileType && (
                <p className="text-red-600 text-sm mt-1">{errors.fileType.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extraction Method *
              </label>
              <select
                value={generationMode}
                onChange={(e) => setGenerationMode(e.target.value as 'ai' | 'ocr')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="ocr">OCR (scan PDFs/images)</option>
                <option value="ai">AI (generate from text)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.mp4,.jpg,.png"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedFile(null);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-1">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500">PDF, DOC, MP4, JPG, PNG up to 50MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="text-center text-gray-600">OR</div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File URL (Optional)
              </label>
              <input
                {...register('fileUrl')}
                type="url"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://example.com/material.pdf"
              />
              {errors.fileUrl && (
                <p className="text-red-600 text-sm mt-1">{errors.fileUrl.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content/Description (Optional)
              </label>
              <textarea
                {...register('content')}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                placeholder="Add any additional content or description..."
              />
            </div>

            {isUploading && (
              <div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  reset();
                  setSelectedFile(null);
                }}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isUploading || uploadMutation.isPending}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload Material
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Materials */}
        {materials.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Recent Materials</h2>
              <span className="ml-auto bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-medium">
                {materials.length} uploaded
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {materials.map((material: any) => (
                <div key={material.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-900">{material.title}</p>
                      <p className="text-xs text-gray-500">{material.fileType} • {new Date(material.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => generateQuestionsMutation.mutate({ courseId: selectedCourse, materialId: material.id })}
                      disabled={generateQuestionsMutation.isPending}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {generateQuestionsMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-8 text-white mt-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">AI Question Generation</h3>
              <p className="text-green-100 mb-4">
                Upload study materials and use AI to automatically generate practice questions. Questions require approval from admins before students can see them in exams.
              </p>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Automatic extraction</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Multiple choice generation</span>

                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Manual review & approval</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
