import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Target,
  Clock,
  BookOpen,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studyPlanService } from '../../lib/services/studyPlan.service';
import { ComingSoonModal } from '../components/ComingSoonModal';
import { canAccessFeature } from '../../lib/planRestrictions';
import toast from 'react-hot-toast';
import type { StudyPlan } from '../../types';

const studyPlanSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  topicIds: z.array(z.string()).min(1, 'Select at least one topic'),
  dailyGoal: z.number().min(1, 'Daily goal must be at least 1'),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});

type StudyPlanForm = z.infer<typeof studyPlanSchema>;

export function StudyPlans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StudyPlan | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const queryClient = useQueryClient();

  // Check plan access
  const canAccessStudyPlans = canAccessFeature(user?.plan, 'canAccessStudyPlans');

  useEffect(() => {
    if (!canAccessStudyPlans) {
      // Show Coming Soon modal for free tier users
      setShowComingSoon(true);
    }
  }, [canAccessStudyPlans]);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['study-plans'],
    queryFn: () => studyPlanService.getStudyPlans(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudyPlanForm>({
    resolver: zodResolver(studyPlanSchema),
    defaultValues: editingPlan ? {
      title: editingPlan.title,
      description: editingPlan.description,
      startDate: editingPlan.startDate.split('T')[0],
      endDate: editingPlan.endDate.split('T')[0],
      topicIds: editingPlan.topicIds || [],
      dailyGoal: editingPlan.dailyGoal,
    } : {},
  });

  const createMutation = useMutation({
    mutationFn: (data: StudyPlanForm) => studyPlanService.createStudyPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plans'] });
      toast.success('Study plan created successfully!');
      setIsCreating(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create study plan');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StudyPlanForm> }) =>
      studyPlanService.updateStudyPlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plans'] });
      toast.success('Study plan updated successfully!');
      setEditingPlan(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update study plan');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studyPlanService.deleteStudyPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plans'] });
      toast.success('Study plan deleted successfully!');
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete study plan');
      setDeletingId(null);
    },
  });

  const onSubmit = (data: StudyPlanForm) => {
    if (editingPlan) {
      updateMutation.mutate({ id: (editingPlan as any).id || (editingPlan as any)._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (plan: StudyPlan) => {
    setEditingPlan(plan);
    setIsCreating(true);
    reset({
      title: plan.title,
      description: plan.description,
      startDate: plan.startDate.split('T')[0],
      endDate: plan.endDate.split('T')[0],
      topicIds: plan.topicIds || [],
      dailyGoal: plan.dailyGoal,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this study plan?')) {
      setDeletingId(id);
      deleteMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingPlan(null);
    reset();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Plans</h1>
            <p className="text-gray-600">Create and manage your personalized study schedules</p>
          </div>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Study Plan
            </button>
          )}
        </div>

        {/* Create/Edit Form */}
        {isCreating && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPlan ? 'Edit Study Plan' : 'Create New Study Plan'}
              </h2>
              <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Title *
                </label>
                <input
                  {...register('title')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Final Exam Preparation"
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Describe your study goals and approach..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    {...register('startDate')}
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {errors.startDate && (
                    <p className="text-red-600 text-sm mt-1">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    {...register('endDate')}
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {errors.endDate && (
                    <p className="text-red-600 text-sm mt-1">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Questions Goal *
                </label>
                <input
                  {...register('dailyGoal', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 20"
                />
                {errors.dailyGoal && (
                  <p className="text-red-600 text-sm mt-1">{errors.dailyGoal.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topics * (Add topic IDs)
                </label>
                <input
                  {...register('topicIds.0')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter topic ID"
                />
                {errors.topicIds && (
                  <p className="text-red-600 text-sm mt-1">{errors.topicIds.message}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  )}
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Study Plans List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        ) : !plans?.data || plans.data.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Study Plans Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first study plan to start organizing your exam preparation
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Study Plan
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {(plans.data || []).map((plan: any) => {
              const startDate = new Date(plan.startDate);
              const endDate = new Date(plan.endDate);
              const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              const daysPassed = Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              const progress = Math.min((daysPassed / totalDays) * 100, 100);
              const isDeleting = deletingId === (plan._id || plan.id);
              
              return (
                <div
                  key={plan._id || plan.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:border-green-500 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.title}</h3>
                      {plan.description && (
                        <p className="text-gray-600 text-sm">{plan.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(plan._id || plan.id)}
                        disabled={isDeleting}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        {plan.dailyGoal} questions/day
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-gray-900">
                          {Math.max(0, daysPassed)}/{totalDays} days
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-600 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {plan.topicIds && plan.topicIds.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          Topics ({plan.topicIds.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {plan.topicIds.slice(0, 3).map((topicId: string, idx: number) => (
                            <span
                              key={topicId}
                              className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium"
                            >
                              Topic {idx + 1}
                            </span>
                          ))}
                          {plan.topicIds.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                              +{plan.topicIds.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ComingSoonModal
        isOpen={showComingSoon && !canAccessStudyPlans}
        onClose={() => {
          setShowComingSoon(false);
          if (!canAccessStudyPlans) {
            navigate('/plans');
          }
        }}
        feature="Study Plans"
        description="Study Plans are available for Basic and Premium members. Spend some time planning and organizing your studies for better results. Upgrade your plan to get started!"
      />
    </div>
  );
}
