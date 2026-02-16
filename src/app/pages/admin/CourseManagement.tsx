import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../../components/Layout';
import { adminService, AdminCourse, CreateCourseRequest } from '../../../lib/services/admin.service';
import { academicService } from '../../../lib/services/academic.service';
import { Plus, Edit2, Search, Loader, ArrowLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import type { University, Department } from '../../../types';

export function CourseManagement() {
  const navigate = useNavigate();
  const [universities, setUniversities] = useState<University[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(true);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CreateCourseRequest>({
    code: '',
    title: '',
    level: 100,
    creditUnits: 0,
    description: ''
  });

  useEffect(() => {
    loadUniversities();
  }, []);

  useEffect(() => {
    if (selectedUniversity) {
      loadDepartments();
    } else {
      setDepartments([]);
      setSelectedDepartment(null);
    }
  }, [selectedUniversity]);

  useEffect(() => {
    if (selectedDepartment) {
      loadCourses();
    }
  }, [selectedDepartment]);

  const loadUniversities = async () => {
    try {
      setIsLoadingUniversities(true);
      const data = await academicService.getUniversities();
      setUniversities(data || []);
    } catch (err: any) {
      const message = err?.message || 'Failed to load universities. Please check your connection.';
      toast.error(message);
      setUniversities([]);
    } finally {
      setIsLoadingUniversities(false);
    }
  };

  const loadDepartments = async () => {
    try {
      setIsLoadingDepartments(true);
      if (selectedUniversity?.id) {
        const data = await academicService.getDepartments(selectedUniversity.id);
        setDepartments((data || []) as any);
      }
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      if (selectedDepartment?.id) {
        // Fetch courses for the selected department
        const data = await academicService.getCourses(selectedDepartment.id);
        setCourses((data || []) as any);
      } else {
        setCourses([]);
      }
    } catch (err) {
      toast.error('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment || !formData.code || !formData.title || formData.creditUnits <= 0 || formData.creditUnits > 10) {
      toast.error('Please fill all required fields. Credit units must be 1-10.');
      return;
    }

    try {
      if (editingId) {
        const updated = await adminService.updateCourse(selectedDepartment.id, editingId, formData);
        setCourses(courses.map(c => c._id === editingId ? updated : c));
        toast.success('Course updated successfully');
      } else {
        const created = await adminService.createCourse(selectedDepartment.id, formData);
        setCourses([...courses, created]);
        toast.success('Course created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ code: '', title: '', level: 100, creditUnits: 0, description: '' });
    } catch (err) {
      toast.error(editingId ? 'Failed to update course' : 'Failed to create course');
    }
  };

  const handleEdit = (course: AdminCourse) => {
    setEditingId(course._id);
    setFormData({
      code: course.code,
      title: course.title,
      level: course.level,
      creditUnits: course.creditUnits,
      description: course.description
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ code: '', title: '', level: 100, creditUnits: 0, description: '' });
  };

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoadingUniversities) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader className="w-8 h-8 text-green-600 animate-spin mr-3" />
          <p className="text-gray-600">Loading universities...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
            <p className="text-gray-600 mt-2">Create and manage courses across departments</p>
          </div>
        </div>

        {/* University Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Step 1: Select University</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {universities.map((uni) => (
              <button
                key={uni.id}
                onClick={() => {
                  setSelectedUniversity(uni);
                  setSelectedDepartment(null);
                }}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedUniversity?.id === uni.id
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <p className="font-semibold text-gray-900">{uni.name}</p>
                <p className="text-xs text-gray-600">{uni.shortName}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Department Selector */}
        {selectedUniversity && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Step 2: Select Department</label>
            {isLoadingDepartments ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 text-green-600 animate-spin mr-3" />
                <p className="text-gray-600">Loading departments...</p>
              </div>
            ) : departments.length === 0 ? (
              <p className="text-gray-500">No departments available for this university.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDepartment(dept)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedDepartment?.id === dept.id
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{dept.name}</p>
                    <p className="text-xs text-gray-600">Department</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Courses List and Form */}
        {selectedDepartment && (
          <>
            <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="font-medium text-blue-900">Step 3: Manage Courses</p>
              <p className="text-xs mt-1">{selectedUniversity?.name} → {selectedDepartment?.name}</p>
            </div>

            {!showForm && (
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <button
                  onClick={() => {
                    setShowForm(true);
                    setEditingId(null);
                    setFormData({ code: '', title: '', level: 100, creditUnits: 0, description: '' });
                  }}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Course
                </button>
              </div>
            )}

            {showForm && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {editingId ? 'Edit Course' : 'Create Course'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="e.g., CSC101"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                      <select
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData,level: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                        <option value={300}>300</option>
                        <option value={400}>400</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Introduction to Programming"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Credit Units *</label>
                      <input
                        type="number"
                        value={formData.creditUnits}
                        onChange={(e) => setFormData({ ...formData, creditUnits: parseInt(e.target.value) })}
                        placeholder="e.g., 3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Course description"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                    >
                      {editingId ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!showForm && (
              <div className="grid gap-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 text-green-600 animate-spin" />
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
                    <p className="text-gray-600">No courses found. Create one to get started.</p>
                  </div>
                ) : (
                  filteredCourses.map(course => (
                <div key={course._id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">Code: {course.code} | Level: {course.level} | Credits: {course.creditUnits}</p>
                      {course.description && <p className="text-sm text-gray-600 mt-1">{course.description}</p>}
                      {course.questionCount && <p className="text-sm text-gray-600 mt-1">Questions: {course.questionCount}</p>}
                      <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${course.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {course.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleEdit(course)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                    >
                      <Edit2 className="w-5 h-5" />
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
