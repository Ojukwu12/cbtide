import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { User as UserType } from '../../types';
import { Loader, Mail, GraduationCap, Award, Calendar } from 'lucide-react';
import { userService } from '../../lib/services/user.service';

export function UserProfile() {
  const { id } = useParams<{ id: string }>();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUser(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </Layout>
    );
  }

  if (isError || !user) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          User not found
        </div>
      </Layout>
    );
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Profile</h1>
          <p className="text-gray-600">View user information and details</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-8 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-green-100">{user.email}</p>
              </div>
              <div className="text-right">
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getPlanColor(user.plan)} mb-2`}>
                  {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getRoleColor(user.role)} ml-2`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Email Address</p>
                    <p className="text-gray-900 font-medium">{user.email}</p>
                  </div>
                </div>

                {/* Plan */}
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Current Plan</p>
                    <p className="text-gray-900 font-medium capitalize">{user.plan}</p>
                  </div>
                </div>

                {/* Plan Expiry */}
                {user.planExpiresAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Plan Expires</p>
                      <p className="text-gray-900 font-medium">
                        {new Date(user.planExpiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Email Verification Status */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Email Verification Status</p>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.emailVerified ? '✓ Verified' : 'Pending Verification'}
                  </div>
                </div>

                {/* Account Created */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Account Created</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Last Updated */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Last Updated</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            {(user.lastSelectedUniversityId || user.lastSelectedDepartmentId || user.lastSelectedCourseId) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Last Selected</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {user.lastSelectedUniversityId && (
                    <div>
                      <p className="text-sm text-gray-600">University</p>
                      <p className="text-gray-900 font-medium">{user.lastSelectedUniversityId}</p>
                    </div>
                  )}
                  {user.lastSelectedDepartmentId && (
                    <div>
                      <p className="text-sm text-gray-600">Department</p>
                      <p className="text-gray-900 font-medium">{user.lastSelectedDepartmentId}</p>
                    </div>
                  )}
                  {user.lastSelectedCourseId && (
                    <div>
                      <p className="text-sm text-gray-600">Course</p>
                      <p className="text-gray-900 font-medium">{user.lastSelectedCourseId}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
