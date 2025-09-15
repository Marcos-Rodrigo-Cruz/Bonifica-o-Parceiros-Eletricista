
import React, { useMemo, useState } from 'react';
import type { Vendor, Sale, PaymentStatus } from '../types';

interface DashboardProps {
  vendors: Vendor[];
  sales: Sale[];
  salesByVendor: Record<string, Sale[]>;
  paymentStatusByVendor: Record<string, Record<string, PaymentStatus>>;
  onSelectVendor: (vendor: Vendor) => void;
  onAddVendor: () => void;
}

const VendorCard: React.FC<{ vendor: Vendor; totalComissao: number; totalSaldo: number; onSelect: () => void; selectedMonth: string }> = ({ vendor, totalComissao, totalSaldo, onSelect, selectedMonth }) => {
  return (
    <div 
      onClick={onSelect}
      className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer overflow-hidden border-l-4 border-weg-blue"
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <h3 className="text-xl font-bold text-weg-blue truncate">{vendor.nome}</h3>
                <p className="text-sm text-weg-gray">COD: {vendor.cod}</p>
            </div>
        </div>
        <div className="mt-4 border-t pt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 truncate">
                {selectedMonth === 'Todos' ? 'Comissão Total' : `Comissão (${selectedMonth})`}
              </p>
              <p className="text-2xl font-semibold text-gray-800">
                  {totalComissao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div>
               <p className="text-sm text-gray-600">Saldo Pendente</p>
               <p className={`text-2xl font-semibold ${totalSaldo > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {totalSaldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
               </p>
            </div>
        </div>
      </div>
       <div className="bg-gray-50 px-5 py-3 text-right">
            <span className="text-sm font-medium text-weg-blue hover:text-weg-yellow">Ver Detalhes &rarr;</span>
       </div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ vendors, sales, salesByVendor, paymentStatusByVendor, onSelectVendor, onAddVendor }) => {
  const [selectedMonth, setSelectedMonth] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const availableMonths = useMemo(() => {
    const months = new Set(sales.map(sale => sale.mesAno));
    const monthOrder = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
    return Array.from(months).sort((a, b) => {
        const [monthA, yearA] = a.split('-');
        const [monthB, yearB] = b.split('-');
        if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
        return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
    });
  }, [sales]);

  const vendorData = useMemo(() => {
    return vendors.map(vendor => {
      const vendorSales = salesByVendor[vendor.cod] || [];
      const filteredSales = selectedMonth === 'Todos'
        ? vendorSales
        : vendorSales.filter(sale => sale.mesAno === selectedMonth);

      const totalComissao = filteredSales.reduce((sum, sale) => sum + sale.valorAReceber, 0);

      const statuses = paymentStatusByVendor[vendor.cod] || {};
      const filteredStatuses = selectedMonth === 'Todos'
        ? Object.values(statuses)
        : (statuses[selectedMonth] ? [statuses[selectedMonth]] : []);

      const totalSaldo = filteredStatuses.reduce((sum, status) => sum + status.saldo, 0);

      return { ...vendor, totalComissao, totalSaldo };
    });
  }, [vendors, salesByVendor, selectedMonth, paymentStatusByVendor]);

  const filteredVendors = useMemo(() => {
    let vendorsToFilter = vendorData;
    
    if (selectedMonth !== 'Todos') {
      vendorsToFilter = vendorData.filter(vendor => vendor.totalComissao > 0 || vendor.totalSaldo !== 0);
    }
    
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        vendorsToFilter = vendorsToFilter.filter(vendor =>
            vendor.nome.toLowerCase().includes(lowercasedQuery) ||
            vendor.cod.toString().includes(lowercasedQuery)
        );
    }
    
    return vendorsToFilter;
  }, [vendorData, selectedMonth, searchQuery]);

  return (
    <div>
      <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-200">
        <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Visão Geral dos Parceiros</h2>
                <p className="text-gray-600">Pesquise, filtre ou selecione um parceiro para ver os detalhes.</p>
            </div>
            <button onClick={onAddVendor} className="bg-weg-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 transition duration-300 flex items-center space-x-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>Adicionar Parceiro</span>
            </button>
        </div>
        <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-1">Pesquisar por Nome ou Cód.</label>
                <input
                    id="search-filter"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar parceiro..."
                    className="block w-full py-2 px-3 text-base bg-white text-black placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-weg-blue focus:border-weg-blue sm:text-sm rounded-md shadow-sm transition"
                />
            </div>
            <div>
                <label htmlFor="month-filter" className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Mês</label>
                <select
                    id="month-filter"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="block w-full py-2 px-3 text-base bg-white text-black border border-gray-300 focus:outline-none focus:ring-1 focus:ring-weg-blue focus:border-weg-blue sm:text-sm rounded-md shadow-sm transition"
                >
                    <option value="Todos">Todos os Meses</option>
                    {availableMonths.map(month => (
                        <option key={month} value={month}>{month}</option>
                    ))}
                </select>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.length > 0 ? filteredVendors.map(vendor => (
          <VendorCard 
            key={vendor.cod}
            vendor={vendor}
            totalComissao={vendor.totalComissao}
            totalSaldo={vendor.totalSaldo}
            onSelect={() => onSelectVendor(vendor)}
            selectedMonth={selectedMonth}
          />
        )) : (
            <div className="col-span-full text-center py-10 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-700">Nenhum parceiro encontrado</h3>
                <p className="text-gray-500 mt-2">Tente ajustar seus filtros de busca ou cadastre um novo parceiro.</p>
            </div>
        )}
      </div>
    </div>
  );
};
