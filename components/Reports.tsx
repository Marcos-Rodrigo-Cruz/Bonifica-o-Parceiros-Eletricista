import React, { useMemo, useState } from 'react';
import type { Vendor, PaymentStatus } from '../types';

interface ReportsProps {
    vendors: Vendor[];
    paymentStatuses: PaymentStatus[];
}

type PaymentHistoryRecord = {
    vendorCod: number;
    vendorName: string;
    month: string;
    amount: number;
    date: string;
    note: string;
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
                cell = cell.replace(/"/g, '""'); // Escape double quotes
                if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                    cell = `"${cell}"`;
                }
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

export const Reports: React.FC<ReportsProps> = ({ vendors, paymentStatuses }) => {
    const [searchQuery, setSearchQuery] = useState('');
    
    const vendorMap = useMemo(() => {
        return vendors.reduce((acc, vendor) => {
            acc[vendor.cod] = vendor.nome;
            return acc;
        }, {} as Record<number, string>);
    }, [vendors]);

    const allPayments: PaymentHistoryRecord[] = useMemo(() => {
        return paymentStatuses
            .flatMap(status => 
                status.history.map(record => ({
                    vendorCod: status.cod,
                    vendorName: vendorMap[status.cod] || 'Desconhecido',
                    month: status.mes,
                    amount: record.amount,
                    date: record.date,
                    note: record.note,
                }))
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [paymentStatuses, vendorMap]);

    const filteredPayments = useMemo(() => {
        if (!searchQuery) {
            return allPayments;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return allPayments.filter(p => 
            p.vendorName.toLowerCase().includes(lowercasedQuery) ||
            p.vendorCod.toString().includes(lowercasedQuery) ||
            p.month.toLowerCase().includes(lowercasedQuery) ||
            p.note.toLowerCase().includes(lowercasedQuery)
        );
    }, [allPayments, searchQuery]);

    const handleExport = () => {
        const dataToExport = filteredPayments.map(p => ({
            'COD': p.vendorCod,
            'Parceiro': p.vendorName,
            'Mês Referência': p.month,
            'Valor Pago': p.amount.toFixed(2),
            'Data Pagamento': new Date(p.date).toLocaleString('pt-BR'),
            'Observação': p.note
        }));
        downloadCSV(dataToExport, `historico_pagamentos_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    };

    return (
        <div>
            <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-200">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex-grow">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Relatórios e Histórico</h2>
                        <p className="text-gray-600">Consulte e exporte o histórico de todos os pagamentos realizados.</p>
                    </div>
                     <button 
                        onClick={handleExport}
                        className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300 flex items-center space-x-2"
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 9.707a1 1 0 011.414 0L10 12.001l2.293-2.294a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v8.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 12.586V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                       <span>Exportar Histórico (CSV)</span>
                     </button>
                </div>
                 <div className="mt-4 pt-4 border-t">
                    <label htmlFor="search-history" className="block text-sm font-medium text-gray-700 mb-1">Pesquisar no Histórico</label>
                    <input
                        id="search-history"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Pesquisar por parceiro, mês, observação..."
                        className="block w-full py-2 px-3 text-base bg-white text-black placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-weg-blue focus:border-weg-blue sm:text-sm rounded-md shadow-sm transition"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parceiro</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mês Ref.</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Pago</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredPayments.length > 0 ? filteredPayments.map((p, index) => (
                                <tr key={`${p.date}-${p.vendorCod}-${index}`}>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{p.vendorName}</div>
                                        <div className="text-sm text-gray-500">COD: {p.vendorCod}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{p.month}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">{p.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(p.date).toLocaleString('pt-BR')}</td>
                                    <td className="px-4 py-4 whitespace-normal text-sm text-gray-500 max-w-xs break-words">{p.note}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-16 text-gray-500">
                                        <h3 className="text-xl font-semibold text-gray-700">Nenhum registro encontrado</h3>
                                        <p className="mt-1">{searchQuery ? 'Tente uma busca diferente.' : 'Nenhum pagamento foi registrado ainda.'}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
