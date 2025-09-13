import React, { useState, useMemo, useEffect } from 'react';
import type { Vendor, Sale, PaymentStatus, PaymentSummary } from '../types';
import { AddSaleModal } from './AddSaleModal';
import { EditSaleModal } from './EditSaleModal';


interface VendorDetailProps {
  vendor: Vendor;
  sales: Sale[];
  paymentStatus: Record<string, PaymentStatus>;
  paymentSummary: PaymentSummary | null;
  onBack: () => void;
  onAddSale: (newSale: Omit<Sale, 'id'>) => void;
  onUpdateSale: (saleId: number, updatedData: Partial<Omit<Sale, 'id' | 'pesquisaId'>>) => void;
  onUpdateObservation: (vendorCod: number, observation: string) => void;
}

export const VendorDetail: React.FC<VendorDetailProps> = ({ vendor, sales, paymentStatus, paymentSummary, onBack, onAddSale, onUpdateSale, onUpdateObservation }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  const [observation, setObservation] = useState(paymentSummary?.observacoes || '');

  useEffect(() => {
    setObservation(paymentSummary?.observacoes || '');
  }, [paymentSummary]);

  const [authModal, setAuthModal] = useState<{ isOpen: boolean; onConfirm: () => void }>({ isOpen: false, onConfirm: () => {} });
  const [password, setPassword] = useState('');

  const salesByMonth = useMemo(() => {
    return sales.reduce((acc, sale) => {
      (acc[sale.mesAno] = acc[sale.mesAno] || []).push(sale);
      return acc;
    }, {} as Record<string, Sale[]>);
  }, [sales]);

  const months = useMemo(() => Object.keys(salesByMonth).sort(), [salesByMonth]);
  const [activeTab, setActiveTab] = useState(months.length > 0 ? months[0] : '');
  
  const activeSales = salesByMonth[activeTab] || [];
  const monthlyTotal = activeSales.reduce((sum, sale) => sum + sale.valorAReceber, 0);
  const monthlyStatus = paymentStatus[activeTab];

  const handleAddSaleSubmit = (newSaleData: Omit<Sale, 'id' | 'pesquisaId'>) => {
    onAddSale({
        ...newSaleData,
        pesquisaId: vendor.cod,
    });
    setIsAddModalOpen(false);
  }

  const handleEditClick = (sale: Sale) => {
    setSaleToEdit(sale);
    setAuthModal({
      isOpen: true,
      onConfirm: () => setIsEditModalOpen(true),
    });
  };
  
  const handleSaveSaleUpdate = (updatedSaleData: Omit<Sale, 'id' | 'pesquisaId'>) => {
    if (saleToEdit) {
      onUpdateSale(saleToEdit.id, updatedSaleData);
    }
    setIsEditModalOpen(false);
    setSaleToEdit(null);
  };


  const handleAuthConfirm = () => {
    if (password === '0000') {
        authModal.onConfirm();
    } else {
      alert('Senha incorreta. Acesso negado.');
    }
    setAuthModal({ isOpen: false, onConfirm: () => {} });
    setPassword('');
  };
  
  const handleSaveObservation = () => {
    onUpdateObservation(vendor.cod, observation);
    alert('Observações salvas com sucesso!');
  };

  const SalesTable: React.FC<{ sales: Sale[] }> = ({ sales }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Venda</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">V. Líquido</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Comissão %</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">A Receber</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sales.length > 0 ? sales.map(sale => (
            <tr key={sale.id} className="group">
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sale.numeroVenda}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{sale.cadastroVenda}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-500">{sale.valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                  <div className="flex items-center justify-end">
                    <span>{`${sale.comissaoPercentual.toFixed(2)}%`}</span>
                     {sale.editadoManualmente && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-weg-blue" viewBox="0 0 20 20" fill="currentColor">
                          <title>Comissão ou Venda editada manualmente</title>
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    )}
                  </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                {sale.valorAReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                  <button onClick={() => handleEditClick(sale)} className="text-weg-blue hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-colors" aria-label="Editar venda">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                      </svg>
                    </button>
              </td>
            </tr>
          )) : (
              <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">Nenhuma venda registrada para este mês.</td>
              </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const AuthModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
            <div className="p-6 border-b">
                <h2 id="auth-modal-title" className="text-xl font-bold text-gray-800">Autenticação de Administrador</h2>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleAuthConfirm(); }}>
              <div className="p-6 space-y-4">
                  <div>
                      <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700">Senha</label>
                      <input
                          type="password"
                          id="admin-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="mt-1 block w-full bg-white text-black placeholder-gray-500 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-weg-blue focus:border-weg-blue transition"
                          autoFocus
                      />
                  </div>
              </div>
              <div className="p-6 bg-gray-50 flex justify-end space-x-3">
                  <button type="button" onClick={() => { setAuthModal({ isOpen: false, onConfirm: () => {} }); setPassword(''); }} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                  <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-weg-blue hover:bg-blue-800">Confirmar</button>
              </div>
            </form>
        </div>
    </div>
  );


  return (
    <div>
       <AddSaleModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddSaleSubmit}
       />
       <EditSaleModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSaleToEdit(null); }}
        onSave={handleSaveSaleUpdate}
        sale={saleToEdit}
       />
       {authModal.isOpen && <AuthModal />}

      <button onClick={onBack} className="mb-6 flex items-center text-sm font-semibold text-weg-blue hover:underline">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Voltar para o Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <h2 className="text-2xl font-bold text-weg-blue">{vendor.nome}</h2>
                <p className="text-weg-gray">COD: {vendor.cod}</p>
            </div>
            <div className="md:col-span-1">
                <p className="text-sm font-medium text-gray-500">CPF/CNPJ</p>
                <p className="text-gray-800">{vendor.cpfCnpj}</p>
            </div>
             <div className="md:col-span-1">
                <p className="text-sm font-medium text-gray-500">Telefone / PIX</p>
                <p className="text-gray-800">{vendor.telefone} / {vendor.pix}</p>
            </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Observações</h3>
        <textarea
            className="w-full p-3 text-gray-700 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-weg-blue focus:border-weg-blue transition"
            rows={4}
            placeholder="Adicionar observações para este parceiro..."
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
        />
        <div className="mt-4 text-right">
            <button 
                onClick={handleSaveObservation} 
                className="bg-weg-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 transition duration-300"
            >
                Salvar Observações
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center flex-wrap gap-4">
            <div>
                <h3 className="text-xl font-bold text-gray-800">Histórico de Vendas</h3>
                <p className="text-sm text-gray-500">Vendas agrupadas por mês.</p>
            </div>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-weg-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 transition duration-300 flex items-center space-x-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>Adicionar Venda</span>
            </button>
        </div>

        <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
          {months.length > 0 ? months.map(month => (
            <button
              key={month}
              onClick={() => setActiveTab(month)}
              className={`py-3 px-5 text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                activeTab === month
                  ? 'border-b-2 border-weg-blue text-weg-blue bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {month}
            </button>
          )) : <p className="py-3 px-5 text-sm text-gray-500">Nenhum mês com vendas.</p>}
        </div>
        
        {months.length > 0 && activeTab && (
            <>
                <SalesTable sales={activeSales} />
                 <div className="px-6 py-4 bg-gray-50 border-t">
                    <div className="flex flex-wrap justify-end items-center gap-6 text-right">
                        <div>
                            <span className="text-sm text-gray-500 block">Comissão do Mês</span>
                            <span className="text-xl font-bold text-weg-blue">
                                {monthlyTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                        {monthlyStatus ? (
                            <>
                                <div>
                                    <span className="text-sm text-gray-500 block">Total Pago</span>
                                    <span className="text-lg font-semibold text-gray-700">{monthlyStatus.valorPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500 block">Saldo</span>
                                    <span className={`text-lg font-semibold ${monthlyStatus.saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {monthlyStatus.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                            </>
                        ) : (
                             <div>
                                <span className="text-sm text-gray-500 block">Status Pagamento</span>
                                <span className="text-lg font-semibold text-gray-500">N/D</span>
                            </div>
                        )}
                    </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
};