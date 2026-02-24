import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  FileText,
  Download,
  Search,
  Calendar,
  Eye,
  Loader2,
  Video,
  FileImage,
  Star,
  AlertCircle,
} from 'lucide-react';
import { materialService } from '@/lib/services/material.service';
import { academicService } from '@/lib/services/academic.service';
import { Layout } from '../components/Layout';
import toast from 'react-hot-toast';
import type { Material, University, Department, Course } from '@/types';

interface CourseWithMaterials extends Course {
  studyMaterialCount: number;
}

export function StudyMaterials() {
  // Selection state
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithMaterials | null>(null);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);
  const [page, setPage] = useState(1);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const queryClient = useQueryClient();

  // 1. Load universities
  const { data: universities, isLoading: universitiesLoading } = useQuery({
    queryKey: ['universities'],
    queryFn: async () => {
      try {
        const unis = await academicService.getUniversities();
        console.log('[StudyMaterials] Universities loaded:', unis.length);
        return unis;
      } catch (err: any) {
        console.error('[StudyMaterials] Failed to load universities:', err?.message);
        toast.error('Failed to load universities');
        return [];
      }
    },
  });

  // 2. Load departments when university selected
  const { data: departments, isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments', selectedUniversity?._id || selectedUniversity?.id],
    queryFn: async () => {
      if (!selectedUniversity) return [];
      try {
        const depts = await academicService.getDepartments(
          selectedUniversity._id || selectedUniversity.id
        );
        console.log('[StudyMaterials] Departments loaded:', depts.length);
        return depts;
      } catch (err: any) {
        console.error('[StudyMaterials] Failed to load departments:', err?.message);
        toast.error('Failed to load departments');
        return [];
      }
    },
    enabled: !!selectedUniversity,
  });

  // 3. Load courses with material counts when department selected
  const { data: coursesWithMaterials, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses-with-materials', selectedDepartment?._id || selectedDepartment?.id],
    queryFn: async () => {
      if (!selectedDepartment) return [];
      try {
        const courses = await academicService.getCoursesWithMaterials(
          selectedDepartment._id || selectedDepartment.id
        );
        console.log('[StudyMaterials] Courses with materials loaded:', courses.length);
        return courses as CourseWithMaterials[];
      } catch (err: any) {
        console.error('[StudyMaterials] Failed to load courses:', err?.message);
        toast.error('Failed to load courses');
        return [];
      }
    },
    enabled: !!selectedDepartment,
  });

  // 4. Load study materials when course selected
  const { data: materialsResponse, isLoading: materialsLoading } = useQuery({
    queryKey: [
      'study-materials',
      selectedCourse?._id || selectedCourse?.id,
      page,
    ],
    queryFn: async () => {
      if (!selectedCourse) return null;
      try {
        const materials = await materialService.browseByHierarchy(
          selectedCourse._id || selectedCourse.id,
          {
            universityId: selectedUniversity?._id || selectedUniversity?.id,
            departmentId: selectedDepartment?._id || selectedDepartment?.id,
            page,
            limit: 20,
            sortBy: 'createdAt',
          }
        );
        console.log('[StudyMaterials] Materials loaded:', materials.data.length);
        return materials;
      } catch (err: any) {
        console.error('[StudyMaterials] Failed to load materials:', err?.message);
        toast.error(err?.response?.data?.message || 'Failed to load materials');
        return null;
      }
    },
    enabled: !!selectedCourse,
  });

  // Filter materials by search term
  const filteredMaterials = useMemo(() => {
    if (!materialsResponse?.data) return [];
    return materialsResponse.data.filter((material: Material) =>
      material.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [materialsResponse, searchTerm]);

  const getFileIcon = (fileType: string) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-600" />;
      case 'video':
        return <Video className="w-6 h-6 text-blue-600" />;
      case 'image':
        return <FileImage className="w-6 h-6 text-purple-600" />;
      default:
        return <FileText className="w-6 h-6 text-gray-600" />;
    }
  };

  const handleDownload = async (material: Material) => {
    if (!selectedCourse) {
      toast.error('Course not selected');
      return;
    }

    setIsDownloading(true);
    try {
      const response = await materialService.downloadStudyMaterial(
        selectedCourse._id || selectedCourse.id,
        material._id
      );
      
      if (response.downloadUrl) {
        window.open(response.downloadUrl, '_blank');
        toast.success('Download started!');
      } else if (material.fileUrl) {
        window.open(material.fileUrl, '_blank');
        toast.success('Opening material...');
      } else {
        toast.error('Material file not available');
      }
    } catch (error: any) {
      console.error('Download error:', error);
      // Fallback to direct URL if API fails
      if (material.fileUrl) {
        window.open(material.fileUrl, '_blank');
        toast.success('Opening material...');
      } else {
        toast.error(error?.response?.data?.message || 'Failed to download material');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUniversityChange = (uni: University | null) => {
    setSelectedUniversity(uni);
    setSelectedDepartment(null);
    setSelectedCourse(null);
    setPage(1);
  };

  const handleDepartmentChange = (dept: Department | null) => {
    setSelectedDepartment(dept);
    setSelectedCourse(null);
    setPage(1);
  };

  const handleCourseChange = (course: CourseWithMaterials | null) => {
    setSelectedCourse(course);
    setPage(1);
    setSearchTerm('');
  };

  const rateMutation = useMutation({
    mutationFn: async (data: { courseId: string; materialId: string; rating: number; comment?: string }) => {
      return materialService.rateStudyMaterial(data.courseId, data.materialId, {
        rating: data.rating,
        comment: data.comment,
      });
    },
    onSuccess: () => {
      toast.success('Rating submitted successfully!');
      setShowRatingModal(false);
      setRating(0);
      setComment('');
      // Refetch materials to get updated rating
      queryClient.invalidateQueries({ queryKey: ['study-materials'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to submit rating');
    },
  });

  const handleRateClick = () => {
    if (!viewingMaterial) return;
    setShowRatingModal(true);
  };

  const handleSubmitRating = () => {
    if (!selectedCourse || !viewingMaterial) {
      toast.error('Course or material not selected');
      return;
    }
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    rateMutation.mutate({
      courseId: selectedCourse._id || selectedCourse.id,
      materialId: viewingMaterial._id,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  const pagination = materialsResponse?.pagination;
  const hasNextPage = pagination && page < pagination.pages;
  const hasPrevPage = page > 1;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Materials</h1>
          <p className="text-gray-600">
            Browse and download study materials by course
          </p>
        </div>

        {/* Cascading Dropdowns */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          {/* Step 1: Select University */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Step 1: Select University
            </label>
            {universitiesLoading ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading universities...
              </div>
            ) : (
              <select
                value={selectedUniversity?._id || selectedUniversity?.id || ''}
                onChange={(e) => {
                  const uni = universities?.find(
                    (u) => (u._id || u.id) === e.target.value
                  ) || null;
                  handleUniversityChange(uni);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Choose University...</option>
                {universities?.map((uni) => (
                  <option key={uni._id || uni.id} value={uni._id || uni.id}>
                    {uni.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Step 2: Select Department */}
          {selectedUniversity && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Step 2: Select Department
              </label>
              {departmentsLoading ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading departments...
                </div>
              ) : (
                <select
                  value={selectedDepartment?._id || selectedDepartment?.id || ''}
                  onChange={(e) => {
                    const dept = departments?.find(
                      (d) => (d._id || d.id) === e.target.value
                    ) || null;
                    handleDepartmentChange(dept);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Choose Department...</option>
                  {departments?.map((dept) => (
                    <option key={dept._id || dept.id} value={dept._id || dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Step 3: Select Course */}
          {selectedDepartment && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Step 3: Select Course
              </label>
              {coursesLoading ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading courses...
                </div>
              ) : (
                <select
                  value={selectedCourse?._id || selectedCourse?.id || ''}
                  onChange={(e) => {
                    const course = coursesWithMaterials?.find(
                      (c) => (c._id || c.id) === e.target.value
                    ) || null;
                    handleCourseChange(course as CourseWithMaterials | null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Choose Course...</option>
                  {coursesWithMaterials?.map((course) => (
                    <option key={course._id || course.id} value={course._id || course.id}>
                      {course.code} - {course.title} [{course.studyMaterialCount} materials]
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Materials Section */}
        {selectedCourse && (
          <div className="space-y-6">
            {/* Course Header */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Selected Course</p>
                  <h2 className="text-2xl font-bold mb-1">{selectedCourse.code}</h2>
                  <p className="text-green-100">{selectedCourse.title}</p>
                </div>
                <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
                  <p className="text-lg font-bold">{selectedCourse.studyMaterialCount}</p>
                  <p className="text-xs text-green-100">Materials Available</p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search materials in this course..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Materials Display */}
            {materialsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-green-600 animate-spin mr-3" />
                <span className="text-gray-600">Loading materials...</span>
              </div>
            ) : !filteredMaterials || filteredMaterials.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No materials found
                </h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? 'No materials match your search. Try different keywords.'
                    : 'No materials available for this course yet.'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {filteredMaterials.map((material: Material) => (
                    <div
                      key={material._id}
                      className="bg-white rounded-xl border border-gray-200 p-6 hover:border-green-500 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {getFileIcon(material.fileType)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                                {material.title}
                              </h3>
                              {(material as any).topicId && (
                                <p className="text-sm text-gray-600">
                                  {(material as any).topic?.name || 'General Topic'}
                                </p>
                              )}
                            </div>
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium uppercase ml-2 flex-shrink-0">
                              {material.fileType}
                            </span>
                          </div>

                          {material.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {material.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(material.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {(material as any).rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span>
                                  {((material as any).rating as any).average?.toFixed(1) || 'No'}{' '}
                                  ratings
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => setViewingMaterial(material)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            <button
                              onClick={() => handleDownload(material)}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={!hasPrevPage}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-gray-600 font-medium">
                      Page {page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={!hasNextPage}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* No Course Selected Info */}
        {!selectedCourse && selectedDepartment && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Select a Course</h3>
              <p className="text-blue-800 text-sm">
                Choose a course from Step 3 to view available study materials
              </p>
            </div>
          </div>
        )}

        {/* Rating Modal */}
        {showRatingModal && viewingMaterial && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Rate Material</h3>
              <p className="text-gray-600 mb-4 text-sm">{viewingMaterial.title}</p>
              
              {/* Star Rating */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Your Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= rating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Comment (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this material..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRatingModal(false);
                    setRating(0);
                    setComment('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRating}
                  disabled={rating === 0 || rateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Rating'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Material Viewer Modal */}
        {viewingMaterial && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-xl font-bold text-gray-900 pr-4">
                  {viewingMaterial.title}
                </h3>
                <button
                  onClick={() => setViewingMaterial(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                {viewingMaterial.fileType === 'pdf' && viewingMaterial.fileUrl ? (
                  <iframe
                    src={viewingMaterial.fileUrl}
                    className="w-full h-[600px] border-none"
                    title={viewingMaterial.title}
                  />
                ) : viewingMaterial.fileType === 'video' && viewingMaterial.fileUrl ? (
                  <video controls className="w-full">
                    <source src={viewingMaterial.fileUrl} />
                    Your browser does not support video playback.
                  </video>
                ) : viewingMaterial.description ? (
                  <div className="p-6 prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {viewingMaterial.description}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Content not available for inline viewing</p>
                    <button
                      onClick={() => {
                        handleDownload(viewingMaterial);
                        setViewingMaterial(null);
                      }}
                      className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium inline-flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download to View
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-3 p-6 border-t border-gray-200 flex-shrink-0">
                <button
                  onClick={() => setViewingMaterial(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={handleRateClick}
                  className="px-4 py-2 border border-yellow-500 text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors font-medium flex items-center gap-2"
                >
                  <Star className="w-4 h-4" />
                  Rate Material
                </button>
                <button
                  onClick={() => {
                    handleDownload(viewingMaterial);
                  }}
                  disabled={isDownloading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isDownloading ? 'Downloading...' : 'Download'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
