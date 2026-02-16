import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../../components/Layout';
import { adminService, AdminDepartment, CreateDepartmentRequest } from '../../../lib/services/admin.service';
import { academicService } from '../../../lib/services/academic.service';
import { Plus, Edit2, Search, Loader, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import type { University } from '../../../types';

export function DepartmentManagement() {
  const navigate = useNavigate();
  const [universities, setUniversities] = useState<University[]>([]);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CreateDepartmentRequest>({
    code: '',
    name: '',
    description: ''
  });

  useEffect(() => {
    loadUniversities();
  }, []);

  useEffect(() => {
    if (selectedUniversity) {
      loadDepartments();
    }
  }, [selectedUniversity]);

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
      setIsLoading(true);
      if (selectedUniversity?.id) {
        const data = await academicService.getDepartments(selectedUniversity.id);
        setDepartments((data || []) as any);
      } else {
        setDepartments([]);
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to load departments';
      toast.error(message);
      setDepartments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUniversity || !formData.code || !formData.name) {
      toast.error('Please fill required fields and select a university');
      return;
    }

    try {
      if (editingId) {
        const updated = await adminService.updateDepartment(selectedUniversity.id, editingId, formData);
        setDepartments(departments.map(d => d._id === editingId ? updated : d));
        toast.success('Department updated successfully');
      } else {
        const created = await adminService.createDepartment(selectedUniversity.id, formData);
        setDepartments([...departments, created]);
        toast.success('Department created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ code: '', name: '', description: '' });
    } catch (err) {
      toast.error(editingId ? 'Failed to update department' : 'Failed to create department');
    }
  };

  const handleEdit = (dept: AdminDepartment) => {
    setEditingId(dept._id);
    setFormData({
      code: dept.code,
      name: dept.name,
      description: dept.description
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ code: '', name: '', description: '' });
  };

  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoadingUniversities) {
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
            <h1 className="text-3xl font-bold text-gray-900">Department Management</h1>
            <p className="text-gray-600 mt-2">Create and manage university departments</p>
          </div>
        </div>

        {/* University Selector */}
        {isLoadingUniversities ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 text-green-600 animate-spin mr-3" />
            <p className="text-gray-600">Loading universities...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Select University *</label>
            {universities.length === 0 ? (
              <p className="text-gray-500">No universities available. Create universities first.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {universities.map((uni) => (
                  <button
                    key={uni.id}
                    onClick={() => setSelectedUniversity(uni)}
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
            )}
          </div>
        )}

        {/* Department Form and List */}
        {selectedUniversity ? (
          <>
            {!showForm && (
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search departments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <button
                  onClick={() => {
                    setShowForm(true);
                    setEditingId(null);
                    setFormData({ code: '', name: '', description: '' });
                  }}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Department
                </button>
              </div>
            )}

            {showForm && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {editingId ? 'Edit Department' : 'Create Department'} - {selectedUniversity.name}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="e.g., csc"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Computer Science"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Department description"
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
                ) : filteredDepartments.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
                    <p className="text-gray-600">No departments found. Create one to get started.</p>
                  </div>
                ) : (
                  filteredDepartments.map((dept) => (
                    <div key={dept._id} className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">Code: {dept.code}</p>
                          {dept.description && <p className="text-sm text-gray-600 mt-1">{dept.description}</p>}
                          {dept.courseCount && <p className="text-sm text-gray-600 mt-1">Courses: {dept.courseCount}</p>}
                          <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${dept.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {dept.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleEdit(dept)}
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
        ) : (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Please select a university first to manage departments</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
