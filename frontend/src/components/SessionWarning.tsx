import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface SessionWarningProps {
  isVisible: boolean;
  timeUntilExpiry: number | null;
  onRefresh: () => void;
  onDismiss: () => void;
}

const SessionWarning: React.FC<SessionWarningProps> = ({
  isVisible,
  timeUntilExpiry,
  onRefresh,
  onDismiss
}) => {
  if (!isVisible) return null;

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Session Expiring Soon
            </h3>
            <div className="mt-1 text-sm text-yellow-700">
              <p>
                Your session will expire in{' '}
                <span className="font-mono font-bold">
                  {timeUntilExpiry ? formatTime(timeUntilExpiry) : '00:00'}
                </span>
              </p>
              <p className="mt-1">Click "Extend Session" to continue working.</p>
            </div>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={onRefresh}
                className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Extend Session
              </button>
              <button
                onClick={onDismiss}
                className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Dismiss
              </button>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onDismiss}
              className="bg-yellow-50 rounded-md inline-flex text-yellow-400 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionWarning;