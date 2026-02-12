import { X, Sparkles } from 'lucide-react';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  description?: string;
}

export function ComingSoonModal({ isOpen, onClose, feature, description }: ComingSoonModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon!</h2>
          <p className="text-gray-600 mb-4 font-medium">{feature}</p>

          {description && (
            <p className="text-sm text-gray-500 mb-6">{description}</p>
          )}

          <p className="text-sm text-gray-500 mb-6">
            We're working hard to bring this feature to you. Stay tuned!
          </p>

          <button
            onClick={onClose}
            className="w-full bg-green-600 text-white rounded-lg py-3 font-medium hover:bg-green-700 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
