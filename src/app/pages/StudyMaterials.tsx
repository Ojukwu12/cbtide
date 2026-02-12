import { useState } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, FileText, Download, Search, Filter, Calendar, Eye, Loader2, Video, FileImage } from 'lucide-react';
import { materialService } from '@/lib/services/material.service';
import toast from 'react-hot-toast';
import type { Material } from '@/types';

export function StudyMaterials() {
  const { courseId } = useParams<{ courseId?: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);

  // Fetch materials for a course (fallback to demo courseId if none provided)
  const { data: materials, isLoading } = useQuery({
    queryKey: ['materials', courseId || 'demo'],
    queryFn: () => courseId ? materialService.getMaterials(courseId) : Promise.resolve({ data: [] }),
    enabled: !!courseId,
  });

  const filteredMaterials = materials?.data?.filter((material: Material) => {
    return material.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
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

  const handleDownload = (material: Material) => {
    if (material.fileUrl) {
      window.open(material.fileUrl, '_blank');
      toast.success('Opening material...');
    } else {
      toast.error('Material file not available');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Materials</h1>
          <p className="text-gray-600">Access course materials and resources</p>
        </div>

        {!courseId && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <p className="text-amber-900 font-medium">
              Please browse to a specific course to view its materials.
            </p>
            <p className="text-amber-700 text-sm mt-1">
              Navigate through Universities → Faculties → Departments → Courses
            </p>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search materials..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Materials List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        ) : !filteredMaterials || filteredMaterials.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No materials found</h3>
            <p className="text-gray-600">
              {courseId ? 'No materials available for this course yet' : 'Select a course to view materials'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMaterials.map((material: Material) => (
              <div
                key={material._id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:border-green-500 transition-all"
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
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {material.title}
                        </h3>
                        {material.topic && (
                          <p className="text-sm text-gray-600">{material.topic.name}</p>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium uppercase">
                        {material.fileType}
                      </span>
                    </div>

                    {material.content && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {material.content}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(material.uploadDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>Uploaded by {material.uploadedBy?.name || 'Instructor'}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setViewingMaterial(material)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Material
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
        )}

        {/* Material Viewer Modal */}
        {viewingMaterial && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">{viewingMaterial.title}</h3>
                <button
                  onClick={() => setViewingMaterial(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
                {viewingMaterial.fileType === 'pdf' && viewingMaterial.fileUrl ? (
                  <iframe
                    src={viewingMaterial.fileUrl}
                    className="w-full h-[600px] border border-gray-200 rounded-lg"
                    title={viewingMaterial.title}
                  />
                ) : viewingMaterial.fileType === 'video' && viewingMaterial.fileUrl ? (
                  <video controls className="w-full rounded-lg">
                    <source src={viewingMaterial.fileUrl} />
                    Your browser does not support video playback.
                  </video>
                ) : viewingMaterial.content ? (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {viewingMaterial.content}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Content not available for inline viewing</p>
                    <button
                      onClick={() => handleDownload(viewingMaterial)}
                      className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium inline-flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download to View
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
