import { useQuery } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { Loader, Mail, User } from 'lucide-react';
import { authService } from '../../lib/services/auth.service';

export function UserProfile() {
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['auth-profile'],
    queryFn: () => authService.getProfile(),
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

  if (isError || !profile) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Unable to load profile
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Your account details</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="text-gray-900 font-medium">{profile.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-gray-900 font-medium">{profile.email}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
