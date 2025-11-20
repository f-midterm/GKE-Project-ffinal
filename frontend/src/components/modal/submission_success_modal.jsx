
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function SubmissionSuccessModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleNavigateToProfile = () => {
    navigate(`/user/${user?.id}`);
    onClose();
  };

  const handleNavigateToHome = () => {
    navigate('/');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-lg mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Submission Successful
              </h2>
              <p className="text-sm text-gray-500">
                Your rental request has been submitted.
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 mb-4"></div>
        <div className="mb-6">
          <p className="text-gray-800">
            You can check the status of your request on your profile page.
          </p>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleNavigateToProfile}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go to Dashboard
          </button>
          <button
            onClick={handleNavigateToHome}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubmissionSuccessModal;
