import React from 'react';

function UnitSelectedModal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default UnitSelectedModal;
