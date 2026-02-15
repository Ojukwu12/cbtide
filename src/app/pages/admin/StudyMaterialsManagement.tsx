import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { adminService, AdminStudyMaterial } from '../../../lib/services/admin.service';
import { Plus, Download, Eye, Trash2, Upload, Search, Loader, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export function StudyMaterialsManagement() {
  const [materials, setMaterials] = useState<AdminStudyMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseId, setCourseId] = useState('');
  const [showCourseInput, setShowCourseInput] = useState(true);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTopicId, setUploadTopicId] = useState('');
  const [uploadAccessLevel, setUploadAccessLevel] = useState<'free' | 'premium'>('free');

  useEffect(() => {
    if (courseId) {
      loadMaterials();
    }
  }, [courseId]);

  const loadMaterials = async () => {
    try {
      setIsLoading(true);
      // In a real app, would fetch materials from the API
      // const result = await adminService.getMaterials(courseId);
      // setMaterials(result.data);
      setMaterials([]);
    } catch (err) {
      toast.error('Failed to load materials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !uploadFile || !uploadTitle) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle);
      formData.append('description', uploadDescription);
      if (uploadTopicId) formData.append('topicId', uploadTopicId);
      formData.append('accessLevel', uploadAccessLevel);

      const material = await adminService.uploadStudyMaterial(courseId, formData);
      setMaterials([...materials, material]);
      toast.success('Study material uploaded successfully');
      resetForm();
      setShowUpload(false);
    } catch (err) {
      toast.error('Failed to upload study material');
    }
  };

  const resetForm = () => {
    setUploadFile(null);
    setUploadTitle('');
    setUploadDescription('');
    setUploadTopicId('');
    setUploadAccessLevel('free');
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;
    // In a real app, would call delete endpoint
    setMaterials(materials.filter(m => m._id !== materialId));
    toast.success('Material deleted');
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Materials Management</h1>
          <p className="text-gray-600 mt-2">Upload educational content (PDFs, notes, videos) for students</p>
        </div>

        {!courseId && showCourseInput && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Course</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                placeholder="Enter course ID"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={() => courseId && setShowCourseInput(false)}
                disabled={!courseId}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300"
              >
                Select
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Note: Connect to course selector once available</p>
          </div>
        )}

        {courseId && !showCourseInput && (
          <>
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-4">
              <div>
                <p className="text-sm text-gray-600">Selected Course:</p>
                <p className="font-semibold text-gray-900">{courseId}</p>
              </div>
              <button
                onClick={() => {
                  setCourseId('');
                  setShowCourseInput(true);
                }}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Change Course
              </button>
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
                      accept=".pdf,.ppt,.pptx,.jpg,.png,.jpeg,.mp4,.mov"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Accepts: PDF, PPT, Images, Videos</p>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Topic ID</label>
                      <input
                        type="text"
                        value={uploadTopicId}
                        onChange={(e) => setUploadTopicId(e.target.value)}
                        placeholder="Topic ID (optional)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
                      <select
                        value={uploadAccessLevel}
                        onChange={(e) => setUploadAccessLevel(e.target.value as any)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
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
                    <p className="text-gray-600">No study materials uploaded yet. Create one to get started.</p>
                  </div>
                ) : (
                  filteredMaterials.map(material => (
                    <div key={material._id} className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{material.title}</h3>
                          {material.description && (
                            <p className="text-sm text-gray-600 mt-1">{material.description}</p>
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
                                  {material.rating.toFixed(1)}
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
                        <button className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200" title="View">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200" title="Download">
                          <Download className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(material._id)}
                          className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
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
    </Layout>
  );
}
