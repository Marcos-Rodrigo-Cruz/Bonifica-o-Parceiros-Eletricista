import React, { useState } from 'react';

// A simple card component for grouping settings
const SettingsCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 pb-4 border-b">{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);


interface ResetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ResetConfirmationModal: React.FC<ResetModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const handleConfirmClick = () => {
        if (password === '0000') {
            onConfirm();
            handleClose();
        } else {
            setError('Senha incorreta. Ação cancelada.');
        }
    };
    
    const handleClose = () => {
        setPassword('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" role="dialog" aria-modal="true" aria-labelledby="reset-modal-title">
                <div className="p-6 border-b border-red-200 bg-red-50 rounded-t-xl">
                    <h2 id="reset-modal-title" className="text-xl font-bold text-red-800">{title}</h2>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-gray-700">{message}</p>
                    <div>
                        <label htmlFor="reset-admin-password" className="block text-sm font-medium text-gray-700">Senha do Administrador</label>
                        <input
                            type="password"
                            id="reset-admin-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`mt-1 block w-full bg-white text-black placeholder-gray-500 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition`}
                            autoFocus
                        />
                        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                    </div>
                </div>
                <div className="p-6 bg-gray-50 flex justify-end space-x-3 rounded-b-xl">
                    <button type="button" onClick={handleClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                    <button 
                        type="button" 
                        onClick={handleConfirmClick}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
                        disabled={!password}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};


interface SettingsProps {
    onClearVendors: () => void;
    onResetCommissions: () => void;
    onDeleteAllData: () => void;
}


export const Settings: React.FC<SettingsProps> = ({ onClearVendors, onResetCommissions, onDeleteAllData }) => {
    // State for password change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    // State for default commission
    const [defaultCommission, setDefaultCommission] = useState(1.0);

    // State for notifications
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [whatsappNotifications, setWhatsappNotifications] = useState(false);

    // State for reset confirmation modal
    const [resetModalInfo, setResetModalInfo] = useState({
        isOpen: false,
        action: null as 'clearVendors' | 'resetCommissions' | 'deleteAllData' | null,
        title: '',
        message: ''
    });

    const handlePasswordUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage({ type: '', text: '' });
        if (currentPassword !== '0000') {
             setPasswordMessage({ type: 'error', text: 'Senha atual incorreta.' });
             return;
        }
        if (!newPassword || newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'As novas senhas não coincidem ou estão em branco.' });
            return;
        }
        // In a real app, this would be an API call.
        // For now, we just show a success message.
        console.log("Password updated to:", newPassword);
        setPasswordMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };
    
     const handleResetAction = (action: 'clearVendors' | 'resetCommissions' | 'deleteAllData') => {
        let title = '';
        let message = '';
        switch (action) {
            case 'clearVendors':
                title = 'Confirmar Limpeza de Parceiros';
                message = 'Esta ação é irreversível. Todos os parceiros, vendas e históricos de pagamento associados serão permanentemente excluídos. Para continuar, digite a senha de administrador.';
                break;
            case 'resetCommissions':
                title = 'Confirmar Reinício de Comissões';
                message = 'Esta ação é irreversível. Todas as vendas e históricos de pagamento de todos os parceiros serão permanentemente excluídos. O cadastro de parceiros será mantido. Para continuar, digite a senha de administrador.';
                break;
            case 'deleteAllData':
                title = 'Confirmar Exclusão Total de Dados';
                message = 'Esta ação é EXTREMAMENTE PERIGOSA e irreversível. Todos os dados do sistema, incluindo parceiros, vendas, pagamentos e configurações serão permanentemente excluídos. Para continuar, digite a senha de administrador.';
                break;
        }
        setResetModalInfo({ isOpen: true, action, title, message });
    };

    const handleConfirmReset = () => {
        if (resetModalInfo.action === 'clearVendors') {
            onClearVendors();
        } else if (resetModalInfo.action === 'resetCommissions') {
            onResetCommissions();
        } else if (resetModalInfo.action === 'deleteAllData') {
            onDeleteAllData();
        }
        handleCloseResetModal();
    };

    const handleCloseResetModal = () => {
        setResetModalInfo({ isOpen: false, action: null, title: '', message: '' });
    };

    const inputStyle = "block w-full bg-white text-black placeholder-gray-500 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-weg-blue focus:border-weg-blue transition";

    return (
        <div className="space-y-8">
            <div className="text-center">
                 <h2 className="text-3xl font-bold text-gray-800">Configurações do Sistema</h2>
                 <p className="text-gray-600 mt-2">Gerencie as configurações globais da aplicação.</p>
            </div>
            
            <SettingsCard title="Alterar Senha do Administrador">
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Senha Atual</label>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputStyle} required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputStyle} required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputStyle} required />
                    </div>
                     <div className="text-right">
                        <button type="submit" disabled={!newPassword || newPassword !== confirmPassword} className="bg-weg-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                            Atualizar Senha
                        </button>
                    </div>
                    {passwordMessage.text && (
                        <p className={`text-sm ${passwordMessage.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                            {passwordMessage.text}
                        </p>
                    )}
                </form>
            </SettingsCard>

            <SettingsCard title="Definir Comissão Padrão">
                <div>
                     <label className="block text-sm font-medium text-gray-700">Comissão Padrão (%)</label>
                     <input type="number" step="0.01" value={defaultCommission} onChange={e => setDefaultCommission(parseFloat(e.target.value))} className={inputStyle} />
                     <p className="text-xs text-gray-500 mt-1">Essa comissão será aplicada automaticamente a novos parceiros.</p>
                </div>
                 <div className="text-right">
                    <button className="bg-weg-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 transition duration-300">
                        Salvar Comissão
                    </button>
                </div>
            </SettingsCard>
            
            <SettingsCard title="Configurações de Notificação">
                <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="checkbox" checked={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} className="h-4 w-4 text-weg-blue border-gray-300 rounded focus:ring-weg-blue" />
                        <span className="text-gray-700">Ativar notificações por e-mail</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="checkbox" checked={whatsappNotifications} onChange={() => setWhatsappNotifications(!whatsappNotifications)} className="h-4 w-4 text-weg-blue border-gray-300 rounded focus:ring-weg-blue" />
                        <span className="text-gray-700">Ativar notificações por WhatsApp</span>
                    </label>
                </div>
                 <div className="text-right pt-4 border-t">
                    <button className="bg-weg-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 transition duration-300">
                        Salvar Preferências
                    </button>
                </div>
            </SettingsCard>

            <SettingsCard title="Redefinição de Dados">
                <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
                    <h4 className="text-lg font-bold text-red-800">Zona de Perigo</h4>
                    <p className="text-sm text-red-700 mt-1">As ações abaixo são irreversíveis. Tenha certeza absoluta antes de prosseguir.</p>
                </div>
                <div className="space-y-4 pt-4">
                    <div className="flex flex-col md:flex-row justify-between items-center p-4 border-t">
                        <p className="flex-1 text-gray-700 mb-2 md:mb-0 md:mr-4">Limpa todo o cadastro de parceiros e seus dados associados.</p>
                        <button onClick={() => handleResetAction('clearVendors')} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300 w-full md:w-auto flex-shrink-0">
                            Limpar Cadastro de Parceiros
                        </button>
                    </div>
                     <div className="flex flex-col md:flex-row justify-between items-center p-4 border-t">
                        <p className="flex-1 text-gray-700 mb-2 md:mb-0 md:mr-4">Remove todas as comissões, mantendo os parceiros.</p>
                        <button onClick={() => handleResetAction('resetCommissions')} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300 w-full md:w-auto flex-shrink-0">
                            Reiniciar Comissões de Todos os Parceiros
                        </button>
                    </div>
                     <div className="flex flex-col md:flex-row justify-between items-center p-4 border-t">
                        <p className="flex-1 text-gray-700 mb-2 md:mb-0 md:mr-4">Apaga permanentemente todos os dados do sistema.</p>
                        <button onClick={() => handleResetAction('deleteAllData')} className="bg-red-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-900 transition duration-300 w-full md:w-auto flex-shrink-0">
                            Excluir todos os dados
                        </button>
                    </div>
                </div>
            </SettingsCard>
            
            <ResetConfirmationModal 
                isOpen={resetModalInfo.isOpen}
                onClose={handleCloseResetModal}
                onConfirm={handleConfirmReset}
                title={resetModalInfo.title}
                message={resetModalInfo.message}
            />
        </div>
    );
};