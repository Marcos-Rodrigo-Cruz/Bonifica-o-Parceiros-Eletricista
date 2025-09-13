
import React, { useState, useMemo } from 'react';
import type { Vendor, PaymentStatus } from '../types';

interface PaymentsProps {
  vendors: Vendor[];
  paymentStatusByVendor: Record<string, Record<string, PaymentStatus>>;
  onRecordPayment: (vendorCod: string, month: string, amount: number, note: string) => void;
  onSettleAll: (vendorCod: string, note: string) => void;
}

type ModalInfo = {
    isOpen: boolean;
    vendor?: Vendor;
    mode?: 'single' | 'all';
    month?: string;
    balance?: number;
    totalBalance?: number;
}

const RecordPaymentModal: React.FC<{
    modalInfo: ModalInfo;
    onClose: () => void;
    onSave: (payload: { amount?: number; note: string }) => void;
}> = ({ modalInfo, onClose, onSave }) => {
    const [amount, setAmount] = useState<number | ''>('');
    const [note, setNote] = useState('');

    const { isOpen, vendor, mode, month, balance, totalBalance } = modalInfo;
    
    if (!isOpen || !vendor) return null;

    const title = mode === 'all' ? `Quitar Saldo Total` : `Registrar Pagamento`;
    const subTitle = mode === 'all' ? `Para ${vendor.nome}` : `Para ${vendor.nome} - ${month}`;
    const displayedBalance = mode === 'all' ? totalBalance : balance;
    
    const handleSave = () => {
        if (!note.trim()) {
            alert("O campo de observações é obrigatório.");
            return;
        }

        if (mode === 'single') {
            const paymentAmount = Number(amount);
            if (paymentAmount <= 0 || paymentAmount > (balance ?? 0)) {
                alert("O valor do pagamento deve ser maior que zero e menor ou igual ao saldo.");
                return;
            }
             if (window.confirm(`Confirma o pagamento de ${paymentAmount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} para ${vendor.nome}?`)) {
                onSave({ amount: paymentAmount, note });
            }
        } else { // mode === 'all'
            if (window.confirm(`Confirma a quitação total de ${totalBalance?.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} para ${vendor.nome}?`)) {
                onSave({ note });
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <p className="text-sm text-gray-600">{subTitle}</p>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Saldo Pendente</p>
                        <p className="text-2xl font-bold text-red-500">{displayedBalance?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    {mode === 'single' && (
                         <div>
                            <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700">Valor a Pagar</label>
                            <input
                                type="number"
                                id="paymentAmount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                className="mt-1 block w-full bg-white text-black placeholder-gray-500 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-weg-blue focus:border-weg-blue transition"
                                placeholder="0,00"
                                max={balance}
                                step="0.01"
                                autoFocus
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="paymentNote" className="block text-sm font-medium text-gray-700">Observações (Obrigatório)</label>
                        <textarea
                            id="paymentNote"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="mt-1 block w-full bg-white text-black placeholder-gray-500 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-weg-blue focus:border-weg-blue transition"
                            placeholder="Ex: Pagamento via PIX, adiantamento, etc."
                            rows={3}
                        />
                    </div>
                </div>
                <div className="p-6 bg-gray-50 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                    <button type="button" onClick={handleSave} className="bg-weg-blue text-white py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-blue-800">Confirmar Pagamento</button>
                </div>
            </div>
        </div>
    );
};


type VendorWithPaymentInfo = Vendor & {
    paymentMonths: PaymentStatus[];
    totalBalance: number;
};

// Helper to download CSV
const downloadCSV = (data: any[], filename: string = 'export.csv') => {
    if (data.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
                cell = cell.includes(',') ? `"${cell}"` : cell;
                return cell;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export const Payments: React.FC<PaymentsProps> = ({ vendors, paymentStatusByVendor, onRecordPayment, onSettleAll }) => {
    const [modalInfo, setModalInfo] = useState<ModalInfo>({ isOpen: false });
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const vendorsWithPaymentInfo: VendorWithPaymentInfo[] = useMemo(() => {
        return vendors
            .map(vendor => {
                const statuses = paymentStatusByVendor[vendor.cod] || {};
                const allMonths = Object.values(statuses);
                const totalBalance = allMonths.reduce((sum, s) => sum + s.saldo, 0);
                return { ...vendor, paymentMonths: allMonths, totalBalance };
            })
            .filter(v => v.paymentMonths.length > 0)
            .sort((a, b) => b.totalBalance - a.totalBalance);
    }, [vendors, paymentStatusByVendor]);

    const filteredVendors = useMemo(() => {
        if (!searchQuery) {
            return vendorsWithPaymentInfo;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return vendorsWithPaymentInfo.filter(vendor =>
            vendor.nome.toLowerCase().includes(lowercasedQuery) ||
            vendor.cod.toString().includes(lowercasedQuery)
        );
    }, [vendorsWithPaymentInfo, searchQuery]);
    
    const totalPages = Math.ceil(filteredVendors.length / ITEMS_PER_PAGE);
    
    const paginatedVendors = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredVendors.slice(startIndex, endIndex);
    }, [filteredVendors, currentPage]);

    const indicators = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let totalPaidThisMonth = 0;
        vendorsWithPaymentInfo.forEach(v => {
            v.paymentMonths.forEach(pm => {
                pm.history.forEach(h => {
                    const paymentDate = new Date(h.date);
                    if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
                        totalPaidThisMonth += h.amount;
                    }
                });
            });
        });

        const pendingPartners = vendorsWithPaymentInfo.filter(v => v.totalBalance > 0).length;
        const paidPartners = vendorsWithPaymentInfo.length - pendingPartners;
        const totalPending = vendorsWithPaymentInfo.reduce((sum, v) => sum + v.totalBalance, 0);

        return { totalPending, totalPaidThisMonth, pendingPartners, paidPartners };
    }, [vendorsWithPaymentInfo]);
    
    const handleExportPendencies = () => {
        const dataToExport = filteredVendors
            .filter(v => v.totalBalance > 0)
            .flatMap(v => 
                v.paymentMonths
                 .filter(pm => pm.saldo > 0)
                 .map(pm => ({
                    'COD': v.cod,
                    'Nome': v.nome,
                    'Mês': pm.mes,
                    'Saldo Pendente': pm.saldo.toFixed(2),
                    'Comissão Total': pm.valorTotal.toFixed(2),
                    'Valor Pago': pm.valorPago.toFixed(2)
                 }))
            );
        downloadCSV(dataToExport, `pendencias_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    };

    const handleOpenModal = (vendor: Vendor, month: string, balance: number) => {
        setModalInfo({ isOpen: true, vendor, mode: 'single', month, balance });
    };
    
    const handleOpenSettleAllModal = (vendor: VendorWithPaymentInfo) => {
        setModalInfo({ isOpen: true, vendor, mode: 'all', totalBalance: vendor.totalBalance });
    };

    const handleCloseModal = () => {
        setModalInfo({ isOpen: false });
    };

    const handleSavePayment = (payload: { amount?: number; note: string }) => {
       if (modalInfo.vendor) {
            if (modalInfo.mode === 'single' && modalInfo.month && payload.amount) {
                onRecordPayment(modalInfo.vendor.cod, modalInfo.month, payload.amount, payload.note);
            } else if (modalInfo.mode === 'all') {
                onSettleAll(modalInfo.vendor.cod, payload.note);
            }
       }
       handleCloseModal();
    };

    return (
        <div>
            <RecordPaymentModal
                modalInfo={modalInfo}
                onClose={handleCloseModal}
                onSave={handleSavePayment}
            />
            <div className="bg-weg-dark text-white p-6 rounded-xl shadow-lg mb-8">
                <h2 className="text-2xl font-bold mb-4">Central de Pagamentos</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-sm text-gray-300">Total Pendente</p>
                        <p className="text-2xl font-bold text-weg-yellow">{indicators.totalPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-300">Total Pago no Mês</p>
                        <p className="text-2xl font-bold">{indicators.totalPaidThisMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-300">Parceiros Pendentes</p>
                        <p className="text-2xl font-bold">{indicators.pendingPartners}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-300">Parceiros Pagos</p>
                        <p className="text-2xl font-bold">{indicators.paidPartners}</p>
                    </div>
                </div>
            </div>

             <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-200">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex-grow">
                        <label htmlFor="search-partner" className="block text-sm font-medium text-gray-700 mb-1">Pesquisar Parceiro</label>
                        <input
                            id="search-partner"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1); 
                            }}
                            placeholder="Digite o nome ou código para filtrar..."
                            className="block w-full py-2 px-3 text-base bg-white text-black placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-weg-blue focus:border-weg-blue sm:text-sm rounded-md shadow-sm transition"
                        />
                    </div>
                    <div className="pt-6">
                         <button 
                            onClick={handleExportPendencies}
                            className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300 flex items-center space-x-2"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 9.707a1 1 0 011.414 0L10 12.001l2.293-2.294a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v8.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 12.586V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                           <span>Exportar Pendências (CSV)</span>
                         </button>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {paginatedVendors.length > 0 ? paginatedVendors.map(vendor => (
                    <div key={vendor.cod} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center flex-wrap gap-2">
                            <div>
                                <h3 className="text-lg font-bold text-weg-blue">{vendor.nome}</h3>
                                <p className="text-sm text-weg-gray">COD: {vendor.cod} | Total Pendente: <span className={`font-bold ${vendor.totalBalance > 0 ? 'text-red-500' : 'text-green-600'}`}>{vendor.totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                            </div>
                            {vendor.totalBalance > 0 && (
                                <button
                                    onClick={() => handleOpenSettleAllModal(vendor)}
                                    className="bg-weg-blue text-white font-bold text-sm py-2 px-3 rounded-lg hover:bg-blue-800 transition duration-300"
                                >
                                    Quitar Saldo Total
                                </button>
                            )}
                        </div>
                        <ul className="divide-y divide-gray-200">
                           {vendor.paymentMonths.map(status => (
                             <li key={status.mes} className="p-4 grid grid-cols-1 md:grid-cols-3 items-center gap-4 hover:bg-gray-50">
                                <div className="md:col-span-2">
                                    <p className="font-semibold text-gray-800">Mês: {status.mes}</p>
                                    <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                        <span>Total: <span className="font-medium text-gray-700">{status.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></span>
                                        <span>Pago: <span className="font-medium text-gray-700">{status.valorPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></span>
                                        <span>Saldo: <span className={`font-bold ${status.saldo > 0 ? 'text-red-500' : 'text-green-600'}`}>{status.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {status.saldo > 0 && (
                                        <button
                                            onClick={() => handleOpenModal(vendor, status.mes, status.saldo)}
                                            className="bg-green-600 text-white font-bold text-sm py-2 px-3 rounded-lg hover:bg-green-700 transition duration-300"
                                        >
                                            Registrar Pagamento
                                        </button>
                                    )}
                                </div>
                             </li>  
                           ))}
                        </ul>
                    </div>
                )) : (
                     <div className="col-span-full text-center py-16 bg-white rounded-lg shadow-md">
                        <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>

                        <h3 className="mt-2 text-xl font-semibold text-gray-800">Nenhum Parceiro Encontrado</h3>
                        <p className="mt-1 text-gray-500">{searchQuery ? 'Tente ajustar sua busca.' : 'Nenhum parceiro com pendências no momento.'}</p>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="mt-8 flex justify-between items-center">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-700">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Próxima
                    </button>
                </div>
            )}
        </div>
    );
};
