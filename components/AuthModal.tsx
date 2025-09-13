
import React, { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, title = "Autenticação de Administrador" }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    // Hardcoded password as per requirement
    if (password === '0000') {
      setError('');
      setPassword('');
      onSuccess();
    } else {
      setError('Senha incorreta. Acesso negado.');
    }
  };
  
  const handleClose = () => {
      setError('');
      setPassword('');
      onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
            <div className="p-6 border-b">
                <h2 id="auth-modal-title" className="text-xl font-bold text-gray-800">{title}</h2>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }}>
              <div className="p-6 space-y-4">
                  <div>
                      <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700">Senha</label>
                      <input
                          type="password"
                          id="admin-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`mt-1 block w-full bg-white text-black placeholder-gray-500 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-weg-blue focus:border-weg-blue transition`}
                          autoFocus
                      />
                      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                  </div>
              </div>
              <div className="p-6 bg-gray-50 flex justify-end space-x-3">
                  <button type="button" onClick={handleClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">Cancelar</button>
                  <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-weg-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-weg-blue">Confirmar</button>
              </div>
            </form>
        </div>
    </div>
  );
};
