import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../../components/Layout';
import { adminService, AdminStudyMaterial } from '../../../lib/services/admin.service';
import { materialService } from '../../../lib/services/material.service';
import { academicService } from '../../../lib/services/academic.service';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Plus, Download, Eye, Trash2, Upload, Search, Loader, Star, ArrowLeft, Pencil, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { University, Department, Course, Topic } from '../../../types';

type TopicOption = Topic & { courseId: string; courseName?: string };

// Safe formatters
const safeFormatScore = (score: any): string => {
  if (score === null || score === undefined) return '0.0';
  const num = Number(score);
  if (isNaN(num)) return '0.0';
  return num.toFixed(1);
};

export function StudyMaterialsManagement() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<AdminStudyMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseId, setCourseId] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCourseName, setSelectedCourseName] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [showCourseInput, setShowCourseInput] = useState(false);
  const [topicOptions, setTopicOptions] = useState<TopicOption[]>([]);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileType, setUploadFileType] = useState<'' | 'pdf' | 'document' | 'video' | 'image' | 'text' | 'docx'>('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTopicId, setUploadTopicId] = useState('');
  const [uploadAccessLevel, setUploadAccessLevel] = useState<'free' | 'premium'>('free');
  const [manageTopicId, setManageTopicId] = useState('');
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [actionMaterialId, setActionMaterialId] = useState<string | null>(null);
  const [confirmDeleteMaterialId, setConfirmDeleteMaterialId] = useState<string | null>(null);

  const getEntityId = (entity: any): string => entity?.id || entity?._id || '';

  useEffect(() => {
    loadUniversities();
    loadTopicOptions();
  }, []);

  useEffect(() => {
    if (!selectedUniversity) {
      setDepartments([]);
      setSelectedDepartment('');
      setCourses([]);
      setCourseId('');
      setSelectedCourseName('');
      return;
    }
    loadDepartments(selectedUniversity);
  }, [selectedUniversity]);

  useEffect(() => {
    if (!selectedDepartment) {
      setCourses([]);
      setCourseId('');
      setSelectedCourseName('');
      return;
    }
    loadCourses(selectedDepartment);
  }, [selectedDepartment]);

  useEffect(() => {
    if (!manageTopicId) {
      setMaterials([]);
      return;
    }
    loadMaterialsByTopic(manageTopicId);
  }, [manageTopicId, topicOptions]);

  const loadUniversities = async () => {
    try {
      const data = await academicService.getUniversities();
      setUniversities(data || []);
    } catch {
      toast.error('Failed to load universities');
    }
  };

  const loadDepartments = async (universityId: string) => {
    try {
      const data = await academicService.getDepartments(universityId);
      setDepartments(data || []);
    } catch {
      toast.error('Failed to load departments');
    }
  };

  const loadCourses = async (departmentId: string) => {
    try {
      const data = await academicService.getCourses(departmentId);
      setCourses(data || []);
    } catch {
      toast.error('Failed to load courses');
    }
  };

  const loadMaterialsByTopic = async (topicId: string) => {
    try {
      const selectedTopic = topicOptions.find((topic) => getEntityId(topic) === topicId);
      const resolvedCourseId = selectedTopic?.courseId;
      if (!resolvedCourseId) {
        setMaterials([]);
        return;
      }

      setIsLoading(true);
      const result = await materialService.getStudyMaterials(resolvedCourseId, {
        topicId,
        page: 1,
        limit: 100,
      });
      setMaterials(result?.data || []);
    } catch {
      setMaterials([]);
      toast.error('Failed to load study materials');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTopicOptions = async () => {
    try {
      const allUniversities = await academicService.getUniversities();
      const allTopics: TopicOption[] = [];

      for (const university of allUniversities || []) {
        const universityId = getEntityId(university);
        if (!universityId) continue;

        const universityDepartments = await academicService.getDepartments(universityId);
        for (const department of universityDepartments || []) {
          const departmentId = getEntityId(department);
          if (!departmentId) continue;

          const departmentCourses = await academicService.getCourses(departmentId);
          for (const course of departmentCourses || []) {
            const currentCourseId = getEntityId(course);
            if (!currentCourseId) continue;

            const courseCode = (course as any).code || (course as any).courseCode || '';
            const courseTitle = (course as any).title || (course as any).name || '';
            const courseName = courseCode && String(courseCode).trim() ? `${courseCode} - ${courseTitle}` : courseTitle || `Course ${currentCourseId}`;

            const courseTopics = await academicService.getTopics(currentCourseId);
            for (const topic of courseTopics || []) {
              allTopics.push({
                ...topic,
                courseId: (topic as any).courseId || currentCourseId,
                courseName,
              });
            }
          }
        }
      }

      setTopicOptions(allTopics);
    } catch {
      setTopicOptions([]);
      toast.error('Failed to load topics');
    }
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle || !uploadTopicId) {
      toast.error('Please fill required fields, including topic');
      return;
    }

    const selectedTopic = topicOptions.find((topic) => getEntityId(topic) === uploadTopicId);
    const selectedTopicCourseId = selectedTopic?.courseId;
    if (!selectedTopicCourseId) {
      toast.error('Invalid topic selected. Please reselect a topic.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle);
      formData.append('description', uploadDescription);
      formData.append('topicId', uploadTopicId);
      if (uploadFileType) {
        formData.append('fileType', uploadFileType);
      }

      const material = await adminService.uploadStudyMaterial(selectedTopicCourseId, formData);
      setMaterials([...materials, material]);
      toast.success('Study material uploaded successfully');
      setManageTopicId(uploadTopicId);
      await loadMaterialsByTopic(uploadTopicId);
      resetForm();
      setShowUpload(false);
    } catch (err) {
      toast.error('Failed to upload study material');
    }
  };

  const resetForm = () => {
    setUploadFile(null);
    setUploadFileType('');
    setUploadTitle('');
    setUploadDescription('');
  };

  const resolveCourseIdForMaterial = (material: AdminStudyMaterial): string => {
    if (material.courseId) return material.courseId;
    if (!material.topicId) return '';
    const topic = topicOptions.find((option) => getEntityId(option) === String(material.topicId));
    return topic?.courseId || '';
  };

  const beginEditMaterial = (material: AdminStudyMaterial) => {
    setEditingMaterialId(material._id);
    setEditTitle(material.title || '');
    setEditDescription(material.description || '');
  };

  const cancelEditMaterial = () => {
    setEditingMaterialId(null);
    setEditTitle('');
    setEditDescription('');
  };

  const handleSaveMaterial = async (material: AdminStudyMaterial) => {
    const resolvedCourseId = resolveCourseIdForMaterial(material);
    if (!resolvedCourseId) {
      toast.error('Unable to resolve course for this material');
      return;
    }

    try {
      setActionMaterialId(material._id);
      await materialService.updateStudyMaterial(resolvedCourseId, material._id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      });
      toast.success('Material updated successfully');
      await loadMaterialsByTopic(manageTopicId);
      cancelEditMaterial();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update material');
    } finally {
      setActionMaterialId(null);
    }
  };

  const handleDeleteMaterial = (materialId: string) => {
    setConfirmDeleteMaterialId(materialId);
  };

  const confirmDeleteMaterial = async () => {
    if (!confirmDeleteMaterialId) return;

    const material = materials.find((entry) => entry._id === confirmDeleteMaterialId);
    if (!material) {
      toast.error('Material not found');
      setConfirmDeleteMaterialId(null);
      return;
    }

    const resolvedCourseId = resolveCourseIdForMaterial(material);
    if (!resolvedCourseId) {
      toast.error('Unable to resolve course for this material');
      setConfirmDeleteMaterialId(null);
      return;
    }

    try {
      setActionMaterialId(confirmDeleteMaterialId);
      await materialService.deleteStudyMaterial(resolvedCourseId, confirmDeleteMaterialId);
      setMaterials(materials.filter(m => m._id !== confirmDeleteMaterialId));
      toast.success('Material deleted');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete material');
    } finally {
      setActionMaterialId(null);
      setConfirmDeleteMaterialId(null);
    }
  };

  const handleViewMaterial = async (material: AdminStudyMaterial) => {
    if (material.fileUrl) {
      window.open(material.fileUrl, '_blank');
      return;
    }

    const resolvedCourseId = resolveCourseIdForMaterial(material);
    if (!resolvedCourseId) {
      toast.error('Unable to resolve course for this material');
      return;
    }

    try {
      setActionMaterialId(material._id);
      const response = await materialService.downloadStudyMaterial(resolvedCourseId, material._id);

      if (response.downloadUrl) {
        window.open(response.downloadUrl, '_blank');
        return;
      }

      toast.error('Material file not available');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to open material');
    } finally {
      setActionMaterialId(null);
    }
  };

  const handleDownloadMaterial = async (material: AdminStudyMaterial) => {
    const resolvedCourseId = resolveCourseIdForMaterial(material);
    if (!resolvedCourseId) {
      toast.error('Unable to resolve course for this material');
      return;
    }

    try {
      setActionMaterialId(material._id);
      const response = await materialService.downloadStudyMaterial(resolvedCourseId, material._id);

      if (response.downloadUrl) {
        const link = document.createElement('a');
        link.href = response.downloadUrl;
        link.download = response.fileName || material.title || 'study-material';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Download started');
        return;
      }

      if (material.fileUrl) {
        window.open(material.fileUrl, '_blank');
        toast.success('Opening material');
        return;
      }

      toast.error('Material file not available');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to download material');
    } finally {
      setActionMaterialId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && !showCourseInput) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      </Layout>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900">Study Materials Management</h1>
            <p className="text-gray-600 mt-2">Upload educational content (PDFs, notes, videos) for students</p>
          </div>
        </div>

        {!courseId && showCourseInput && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Course</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select university</option>
                {universities.map((university) => (
                  <option key={getEntityId(university)} value={getEntityId(university)}>
                    {university.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                disabled={!selectedUniversity}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={getEntityId(department)} value={getEntityId(department)}>
                    {department.name}
                  </option>
                ))}
              </select>

              <select
                value={courseId}
                onChange={(e) => {
                  const id = e.target.value;
                  setCourseId(id);
                    setUploadTopicId('');
                  const selected = courses.find((course) => getEntityId(course) === id);
                  setSelectedCourseName(selected ? `${selected.code} - ${selected.title}` : '');
                }}
                disabled={!selectedDepartment}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
              >
                <option value="">Select course</option>
                {courses.map((course) => (
                  <option key={getEntityId(course)} value={getEntityId(course)}>
                    {course.code} - {course.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4 mt-4">
              <button
                onClick={() => courseId && setShowCourseInput(false)}
                disabled={!courseId}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300"
              >
                Select
              </button>
            </div>
          </div>
        )}

        {!showCourseInput && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">Upload by selecting a topic only. Course is resolved automatically from the selected topic.</p>
            </div>

            {!showUpload && (
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search materials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <select
                  value={manageTopicId}
                  onChange={(e) => setManageTopicId(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg min-w-[260px]"
                >
                  <option value="">Select topic to manage materials</option>
                  {topicOptions.map((topic) => (
                    <option key={getEntityId(topic)} value={getEntityId(topic)}>
                      {topic.name}{topic.courseName ? ` (${topic.courseName})` : ''}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowUpload(true)}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Upload Material
                </button>
              </div>
            )}

            {showUpload && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Study Material</h2>
                <form onSubmit={handleUploadMaterial} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material File *</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png,.jpeg,.mp4,.mov,.txt"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Accepts: PDF, DOCX, PPT, Images, Videos, Text</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="e.g., Lecture Notes Chapter 5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="Material description or summary"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
                      <select
                        value={uploadTopicId}
                        onChange={(e) => setUploadTopicId(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select topic</option>
                        {topicOptions.map((topic) => (
                          <option key={getEntityId(topic)} value={getEntityId(topic)}>
                            {topic.name}{topic.courseName ? ` (${topic.courseName})` : ''}
                          </option>
                        ))}
                      </select>
                      {topicOptions.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">No topics found.</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">File Type (Optional)</label>
                      <select
                        value={uploadFileType}
                        onChange={(e) => setUploadFileType(e.target.value as '' | 'pdf' | 'document' | 'video' | 'image' | 'text' | 'docx')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Auto-detect</option>
                        <option value="pdf">PDF</option>
                        <option value="document">Document</option>
                        <option value="docx">DOCX</option>
                        <option value="video">Video</option>
                        <option value="image">Image</option>
                        <option value="text">Text</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUpload(false);
                        resetForm();
                      }}
                      className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!showUpload && (
              <div className="grid gap-4">
                {filteredMaterials.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
                    <p className="text-gray-600">
                      {manageTopicId
                        ? 'No study materials found for this topic.'
                        : 'Select a topic to load uploaded study materials for management.'}
                    </p>
                  </div>
                ) : (
                  filteredMaterials.map(material => (
                    <div key={material._id} className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          {editingMaterialId === material._id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                              <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                          ) : (
                            <>
                              <h3 className="text-lg font-semibold text-gray-900">{material.title}</h3>
                              {material.description && (
                                <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                              )}
                            </>
                          )}
                          <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600">
                            <span>Size: {formatFileSize(material.fileSize)}</span>
                            <span>•</span>
                            <span>Views: {material.views}</span>
                            <span>•</span>
                            <span>Downloads: {material.downloads}</span>
                            {material.rating > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  {safeFormatScore(material.rating)}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              material.accessLevel === 'free' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {material.accessLevel}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              material.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {material.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleViewMaterial(material)}
                          disabled={actionMaterialId === material._id}
                          className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:opacity-50"
                          title="View"
                        >
                          {actionMaterialId === material._id ? <Loader className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => handleDownloadMaterial(material)}
                          disabled={actionMaterialId === material._id}
                          className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 disabled:opacity-50"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        {editingMaterialId === material._id ? (
                          <>
                            <button
                              onClick={() => handleSaveMaterial(material)}
                              disabled={actionMaterialId === material._id}
                              className="p-2 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 disabled:opacity-50"
                              title="Save"
                            >
                              {actionMaterialId === material._id ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                            </button>
                            <button
                              onClick={cancelEditMaterial}
                              disabled={actionMaterialId === material._id}
                              className="p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                              title="Cancel"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => beginEditMaterial(material)}
                            className="p-2 bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
                            title="Edit"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMaterial(material._id)}
                          disabled={actionMaterialId === material._id}
                          className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50"
                          title="Delete"
                        >
                          {actionMaterialId === material._id ? <Loader className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDeleteMaterialId}
        onClose={() => setConfirmDeleteMaterialId(null)}
        onConfirm={confirmDeleteMaterial}
        title="Delete Study Material"
        message="Are you sure you want to delete this material?"
        confirmText="Delete"
        variant="danger"
        isLoading={!!actionMaterialId}
      />
    </Layout>
  );
}
