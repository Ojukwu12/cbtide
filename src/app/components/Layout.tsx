import { ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  GraduationCap, 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  BarChart3, 
  Trophy, 
  CreditCard,
  Users,
  Bell,
  LogOut,
  Menu,
  X,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { notificationService } from '../../lib/services';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [isPushPromptHidden, setIsPushPromptHidden] = useState(notificationService.isPushPromptDismissed());
  const [isUnreadReminderDismissed, setIsUnreadReminderDismissed] = useState(false);

  const isAdmin = user?.role === 'admin';
  const notificationsPath = '/notifications';

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: Boolean(user),
    refetchInterval: 45000,
    refetchOnWindowFocus: true,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('All notifications marked as read');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to mark notifications as read');
    },
  });

  useEffect(() => {
    setIsUnreadReminderDismissed(false);
  }, [user?.id, unreadCount]);

  const studentLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/profile', icon: Users, label: 'Profile' },
    { to: '/universities', icon: BookOpen, label: 'Browse' },
    { to: '/exams', icon: FileText, label: 'Exams' },
    { to: '/materials', icon: BookOpen, label: 'Materials' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/plans', icon: CreditCard, label: 'Plans' },
    { to: '/about', icon: Settings, label: 'About' },
    { to: '/faq', icon: Settings, label: 'FAQ' },
    { to: '/contact', icon: Settings, label: 'Contact' },
  ];

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Admin Dashboard' },
    { to: '/admin/users', icon: Users, label: 'User Management' },
    { to: '/admin/questions', icon: FileText, label: 'Question Bank' },
    { to: '/admin/source-materials', icon: BookOpen, label: 'Generate & Import' },
    { to: '/admin/study-materials', icon: BookOpen, label: 'Study Materials' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Show expiry warning if plan expires within 7 days
  const showExpiryWarning = user?.planExpiry && user.plan !== 'free';
  const daysUntilExpiry = showExpiryWarning 
    ? Math.ceil((new Date(user.planExpiry!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const notificationPermission = notificationService.getBrowserNotificationPermission();
  const shouldShowPushPrompt =
    Boolean(user) &&
    !isAdmin &&
    notificationPermission === 'default' &&
    !isPushPromptHidden;

  const shouldShowUnreadReminder =
    Boolean(user) &&
    unreadCount > 0 &&
    !isUnreadReminderDismissed;

  const handleEnablePush = async () => {
    try {
      setIsEnablingPush(true);
      const permission = await notificationService.requestBrowserNotificationPermission();

      if (permission === 'granted') {
        notificationService.resetPushPromptDismissed();
        setIsPushPromptHidden(true);

        const syncResult = await notificationService.syncWebPushTokenRegistration();
        if (syncResult.status === 'registered') {
          toast.success('Push notifications enabled');
        } else if (syncResult.status === 'missing-config') {
          toast.error('Push notifications are not fully configured on this app yet.');
        } else {
          toast.success('Push permission enabled. Token registration will complete automatically when available.');
        }
        return;
      }

      if (permission === 'denied') {
        notificationService.dismissPushPrompt();
        setIsPushPromptHidden(true);
        toast.error('Push notifications blocked in browser settings');
      }
    } catch {
      toast.error('Unable to enable push notifications right now');
    } finally {
      setIsEnablingPush(false);
    }
  };

  const handleDismissPushPrompt = () => {
    notificationService.dismissPushPrompt();
    setIsPushPromptHidden(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-xl text-gray-900">NAPSS CBT</h1>
                <p className="text-xs text-gray-500">Smart Examination Platform</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to || location.pathname.startsWith(link.to + '/');
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <Link
                to={notificationsPath}
                className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 rounded-full text-[10px] text-white font-semibold flex items-center justify-center leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              
              <div className="hidden md:flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="text-right">
                  <Link to="/profile" className="text-sm font-medium text-gray-900 hover:text-green-700 transition-colors">
                    {user?.firstName} {user?.lastName}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500 capitalize">{user?.plan || 'Free'} Plan</p>
                    {user?.plan && user.plan.toLowerCase() !== 'free' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.plan.toLowerCase() === 'premium'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-1">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Plan Expiry Warning */}
      {showExpiryWarning && daysUntilExpiry <= 7 && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-800">
                ⚠️ Your {user.plan} plan expires in {daysUntilExpiry} days. 
                <Link to="/plans" className="font-medium underline ml-1">Renew now</Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {shouldShowPushPrompt && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-green-900">Enable push notifications</p>
                <p className="text-sm text-green-800">Get instant exam and account alerts. You can change this later in browser settings.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDismissPushPrompt}
                  className="px-3 py-2 rounded-lg border border-green-300 text-green-800 hover:bg-green-100"
                >
                  Not now
                </button>
                <button
                  onClick={handleEnablePush}
                  disabled={isEnablingPush}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isEnablingPush ? 'Enabling...' : 'Enable'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {shouldShowUnreadReminder && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-900">You have {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}</p>
                <p className="text-sm text-blue-800">Open your inbox to review updates. This reminder disappears when all are marked as read.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsUnreadReminderDismissed(true)}
                  className="px-3 py-2 rounded-lg border border-blue-300 text-blue-800 hover:bg-blue-100"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => navigate('/notifications')}
                  className="px-3 py-2 rounded-lg border border-blue-300 text-blue-800 hover:bg-blue-100"
                >
                  View
                </button>
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {markAllReadMutation.isPending ? 'Marking...' : 'Mark all as read'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
