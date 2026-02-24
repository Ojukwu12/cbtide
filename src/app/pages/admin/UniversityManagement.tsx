import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { adminService, AdminUniversity, CreateUniversityRequest } from '../../../lib/services/admin.service';
import { Plus, Edit2, Trash2, Search, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export function UniversityManagement() {
  const [universities, setUniversities] = useState<AdminUniversity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteUniversity, setConfirmDeleteUniversity] = useState<AdminUniversity | null>(null);
  const [isDeletingUniversity, setIsDeletingUniversity] = useState(false);
  const [formData, setFormData] = useState<CreateUniversityRequest>({
    code: '',
    name: '',
    abbreviation: '',
    state: ''
  });

  useEffect(() => {
    loadUniversities();
  }, []);

  const loadUniversities = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getUniversities();
      setUniversities(data || []);
    } catch (err) {
      toast.error('Failed to load universities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.abbreviation || !formData.state) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      if (editingId) {
        const updated = await adminService.updateUniversity(editingId, formData);
        setUniversities(universities.map(u => u._id === editingId ? updated : u));
        toast.success('University updated successfully');
      } else {
        const created = await adminService.createUniversity(formData);
        setUniversities([...universities, created]);
        toast.success('University created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ code: '', name: '', abbreviation: '', state: '' });
    } catch (err) {
      toast.error(editingId ? 'Failed to update university' : 'Failed to create university');
    }
  };

  const handleEdit = (university: AdminUniversity) => {
    setEditingId(university._id);
    setFormData({
      code: university.code,
      name: university.name,
      abbreviation: university.abbreviation,
      state: university.state
    });
    setShowForm(true);
  };

  const handleDelete = (university: AdminUniversity) => {
    setConfirmDeleteUniversity(university);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteUniversity) return;

    try {
      setIsDeletingUniversity(true);
      await adminService.deleteUniversity(confirmDeleteUniversity._id);
      setUniversities(universities.filter(u => u._id !== confirmDeleteUniversity._id));
      toast.success('University deleted successfully');
    } catch (err) {
      toast.error('Failed to delete university');
    } finally {
      setIsDeletingUniversity(false);
      setConfirmDeleteUniversity(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ code: '', name: '', abbreviation: '', state: '' });
  };

  const filteredUniversities = universities.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900">University Management</h1>
          <p className="text-gray-600 mt-2">Manage universities and their details</p>
        </div>

        {!showForm && (
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search universities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
              }}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add University
            </button>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingId ? 'Edit University' : 'Create University'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., unizik"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Abbreviation</label>
                  <input
                    type="text"
                    value={formData.abbreviation}
                    onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                    placeholder="e.g., UNIZIK"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Nnamdi Azikiwe University"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g., Anambra"
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
            {filteredUniversities.length === 0 ? (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-600">No universities found. Create one to get started.</p>
              </div>
            ) : (
              filteredUniversities.map(uni => (
                <div key={uni._id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{uni.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">Code: {uni.code} | Abbreviation: {uni.abbreviation}</p>
                      <p className="text-sm text-gray-600">State: {uni.state}</p>
                      {uni.departmentCount && <p className="text-sm text-gray-600 mt-1">Departments: {uni.departmentCount}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(uni)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(uni)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        title="Delete university"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDeleteUniversity}
        onClose={() => setConfirmDeleteUniversity(null)}
        onConfirm={confirmDelete}
        title="Delete University"
        message={
          confirmDeleteUniversity
            ? `Delete ${confirmDeleteUniversity.name}? This cannot be undone.`
            : 'Delete this university?'
        }
        confirmText="Delete"
        variant="danger"
        isLoading={isDeletingUniversity}
      />
    </Layout>
  );
}
