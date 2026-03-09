import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../../lib/services';

export function GlobalGuestPushPrompt() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isEnabling, setIsEnabling] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (isLoading || isAuthenticated) {
      setShowPrompt(false);
      return;
    }

    const permission = notificationService.getBrowserNotificationPermission();
    const pushChoice = notificationService.getPushChoice();

    if (permission === 'denied' && pushChoice !== 'opted-out') {
      notificationService.setPushChoice('opted-out');
    }

    if (permission === 'default' && !pushChoice) {
      setShowPrompt(true);
      return;
    }

    setShowPrompt(false);
  }, [isAuthenticated, isLoading]);

  const handleEnable = async () => {
    try {
      setIsEnabling(true);
      const permission = await notificationService.requestBrowserNotificationPermission();

      if (permission === 'granted') {
        notificationService.setPushChoice('opted-in');
        const result = await notificationService.syncGuestWebPushTokenRegistration();
        if (result.status === 'registered') {
          toast.success('Push notifications enabled');
        } else if (result.status === 'missing-config') {
          toast.error('Push notifications are not fully configured on this app yet.');
        } else {
          toast.error('Permission granted, but token registration is pending.');
        }
        setShowPrompt(false);
        return;
      }

      if (permission === 'denied') {
        notificationService.setPushChoice('opted-out');
        setShowPrompt(false);
        toast.error('Push notifications blocked in browser settings');
      }
    } catch {
      toast.error('Unable to enable push notifications right now');
    } finally {
      setIsEnabling(false);
    }
  };

  const handleOptOut = async () => {
    const token = notificationService.getStoredPushToken();
    const guestTokenId = notificationService.getStoredGuestPushTokenId();

    try {
      if (token || guestTokenId) {
        await notificationService.unregisterGuestPushToken({ token, guestTokenId });
      }
    } catch {
      // Non-blocking
    } finally {
      notificationService.setPushChoice('opted-out');
      notificationService.clearStoredGuestPushTokenId();
      setShowPrompt(false);
    }
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white border border-gray-200 shadow-xl">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Enable Push Notifications</h2>
          <button
            onClick={handleOptOut}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-gray-700">
            Get exam reminders and important announcements instantly.
          </p>
          <p className="text-xs text-gray-500">
            Your choice is saved for this browser.
          </p>
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={handleOptOut}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            No thanks
          </button>
          <button
            onClick={handleEnable}
            disabled={isEnabling}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isEnabling ? 'Enabling...' : 'Enable'}
          </button>
        </div>
      </div>
    </div>
  );
}
