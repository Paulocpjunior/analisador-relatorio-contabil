
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorDisplayProps {
  message: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
  return (
    <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mt-6 rounded-md" role="alert">
      <div className="flex">
        <div className="py-1">
          <AlertTriangle className="h-6 w-6 text-red-500 mr-4" />
        </div>
        <div>
          <p className="font-bold">Erro</p>
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
};
