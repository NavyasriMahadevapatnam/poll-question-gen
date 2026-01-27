import { CheckCircle, X, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'correct' | 'incorrect' | 'unanswered';
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  switch (status) {
    case 'correct':
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Correct</span>
        </div>
      );
    case 'incorrect':
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded-full">
          <X className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium text-red-700 dark:text-red-300">Incorrect</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
          <AlertCircle className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Not Answered</span>
        </div>
      );
  }
};
