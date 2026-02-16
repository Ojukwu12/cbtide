import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { academicService } from '../../../lib/services/academic.service';
import { Plus, Loader, AlertCircle, Edit2, Search, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import type { University, Department, Course, Topic } from '../../../types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

export function TopicManagement() {
  const navigate = useNavigate();
  const [universities, setUniversities] = useState<University[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUni, setIsLoadingUni] = useState(true);
  const [isLoadingDept, setIsLoadingDept] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const [isLoadingTopic, setIsLoadingTopic] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 1,
  });

  useEffect(() => {
    loadUniversities();
  }, []);

  useEffect(() => {
    if (selectedUniversity) {
      loadDepartments();
    }
  }, [selectedUniversity]);

  useEffect(() => {
    if (selectedDepartment) {
      loadCourses();
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedCourse) {
      loadTopics();
    }
  }, [selectedCourse]);

  const loadUniversities = async () => {
    try {
      setIsLoadingUni(true);
      const data = await academicService.getUniversities();
      setUniversities(data || []);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load universities');
      setUniversities([]);
    } finally {
      setIsLoadingUni(false);
    }
  };

  const loadDepartments = async () => {
    try {
      setIsLoadingDept(true);
      if (selectedUniversity) {
        const data = await academicService.getDepartments(selectedUniversity.id);
        setDepartments(data || []);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load departments');
      setDepartments([]);
    } finally {
      setIsLoadingDept(false);
    }
  };

  const loadCourses = async () => {
    try {
      setIsLoadingCourse(true);
      if (selectedDepartment) {
        const data = await academicService.getCourses(selectedDepartment.id);
        setCourses(data || []);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load courses');
      setCourses([]);
    } finally {
      setIsLoadingCourse(false);
    }
  };

  const loadTopics = async () => {
    try {
      setIsLoadingTopic(true);
      if (selectedCourse) {
        const data = await academicService.getTopics(selectedCourse.id);
        setTopics(data || []);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load topics');
      setTopics([]);
    } finally {
      setIsLoadingTopic(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !formData.name) {
      toast.error('Please select a course and enter topic name');
      return;
    }

    try {
      if (editingId) {
        // Note: API doesn't have update topic endpoint, so we only support create
        toast.error('Topic editing not yet implemented. Please delete and recreate.');
        return;
      }

      const created = await academicService.createTopic(selectedCourse.id, {
        name: formData.name,
        description: formData.description,
        order: formData.order,
      });

      setTopics([...topics, created]);
      toast.success('Topic created successfully');
      setShowForm(false);
      setFormData({ name: '', description: '', order: 1 });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create topic');
    }
  };

  const handleEdit = (topic: Topic) => {
    setEditingId(topic.id);
    setFormData({
      name: topic.name,
      description: topic.description || '',
      order: topic.order || 1,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', order: 1 });
  };

  const filteredTopics = topics.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  if (isLoadingUni) {
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
            <h1 className="text-3xl font-bold text-gray-900">Topic Management</h1>
            <p className="text-gray-600 mt-2">Create and manage course topics (chapters, sections)</p>
          </div>
        </div>

        {/* Cascading Selectors */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* University Selector */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              University *
            </label>
            {universities.length === 0 ? (
              <p className="text-gray-500">No universities found</p>
            ) : (
              <select
                value={selectedUniversity?.id || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const uni = universities.find((u) => String(u.id) === String(e.target.value));
                    setSelectedUniversity(uni || null);
                    setSelectedDepartment(null);
                    setSelectedCourse(null);
                    setTopics([]);
                  } else {
                    setSelectedUniversity(null);
                    setSelectedDepartment(null);
                    setSelectedCourse(null);
                    setTopics([]);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select university</option>
                {universities && universities.length > 0 ? universities.map((uni) => (
                  <option key={uni.id} value={String(uni.id)}>
                    {uni.name}
                  </option>
                )) : null}
              </select>
            )}
          </div>

          {/* Department Selector */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Department *
            </label>
            {isLoadingDept ? (
              <div className="flex items-center gap-2">
                <Loader className="w-4 h-4 text-green-600 animate-spin" />
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            ) : departments.length === 0 ? (
              <p className="text-gray-500">Select university first</p>
            ) : (
              <select
                value={selectedDepartment?.id || ''}
                onChange={(e) => {
                  const dept = departments.find((d) => d.id === e.target.value);
                  setSelectedDepartment(dept || null);
                  setSelectedCourse(null);
                  setTopics([]);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Course Selector */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Course *
            </label>
            {isLoadingCourse ? (
              <div className="flex items-center gap-2">
                <Loader className="w-4 h-4 text-green-600 animate-spin" />
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            ) : courses.length === 0 ? (
              <p className="text-gray-500">Select department first</p>
            ) : (
              <select
                value={selectedCourse?.id || ''}
                onChange={(e) => {
                  const course = courses.find((c) => c.id === e.target.value);
                  setSelectedCourse(course || null);
                  setTopics([]);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.courseCode} - {course.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Create Form */}
        {selectedCourse && (
          <>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Plus className="w-5 h-5" />
                Create Topic
              </button>
            )}

            {showForm && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingId ? 'Edit Topic' : 'Create New Topic'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Topic Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Chapter 1: Introduction"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                      placeholder="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      min="1"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      {editingId ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 bg-gray-300 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Topics List */}
            {isLoadingTopic ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 text-green-600 animate-spin" />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200">
                {/* Search */}
                <div className="p-6 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search topics..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Topics List */}
                {filteredTopics.length === 0 ? (
                  <div className="p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No topics found</p>
                    <p className="text-gray-500 text-sm mt-2">
                      Create your first topic to organize course content
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredTopics.map((topic) => (
                      <div
                        key={topic.id}
                        className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {topic.order && <span className="text-gray-500">#{topic.order} </span>}
                            {topic.name}
                          </h4>
                          {topic.description && (
                            <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleEdit(topic)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Edit topic"
                        >
                          <Edit2 className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
