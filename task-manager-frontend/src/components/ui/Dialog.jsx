import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export default function Dialog({ isOpen, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div className={`w-full ${sizes[size]} bg-white rounded-t-2xl sm:rounded-2xl shadow-xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200`}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 id="dialog-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
