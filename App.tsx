
import React, { useState, useMemo } from 'react';
import type { Vendor, Sale, PaymentStatus, PaymentSummary, PaymentRecord } from './types';
import { mockVendors, mockSales, mockPaymentStatus, mockPaymentSummaries } from './data/mockData';
import { VendorDetail } from './components/VendorDetail';
import { Dashboard } from './components/Dashboard';
import { Payments } from './components/Payments';
import { Reports } from './components/Reports';

const App: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>(mockVendors);
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>(mockPaymentStatus);
  const [paymentSummaries, setPaymentSummaries] = useState<PaymentSummary[]>(mockPaymentSummaries);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [view, setView] = useState<'dashboard' | 'payments' | 'reports'>('dashboard');

  const salesByVendor = useMemo(() => {
    return sales.reduce((acc, sale) => {
      if (!acc[sale.pesquisaId]) {
        acc[sale.pesquisaId] = [];
      }
      acc[sale.pesquisaId].push(sale);
      return acc;
    }, {} as Record<string, Sale[]>);
  }, [sales]);

  const paymentStatusByVendor = useMemo(() => {
    return paymentStatuses.reduce((acc, status) => {
      if (!acc[status.cod]) {
        acc[status.cod] = {};
      }
      acc[status.cod][status.mes] = status;
      return acc;
    }, {} as Record<string, Record<string, PaymentStatus>>);
  }, [paymentStatuses]);

  const paymentSummaryByVendor = useMemo(() => {
    return paymentSummaries.reduce((acc, summary) => {
      acc[summary.cod] = summary;
      return acc;
    }, {} as Record<string, PaymentSummary>);
  }, [paymentSummaries]);

  const handleSelectVendor = (vendor: Vendor | null) => {
    setSelectedVendor(vendor);
    setView('dashboard');
  };

  const handleAddSale = (newSale: Omit<Sale, 'id'>) => {
    setSales(prevSales => [
      ...prevSales,
      { ...newSale, id: Date.now() } // Simple ID generation
    ]);
  };
  
  const handleUpdateSale = (saleId: number, updatedData: Partial<Omit<Sale, 'id' | 'pesquisaId'>>) => {
    setSales(prevSales =>
        prevSales.map(sale => {
            if (sale.id === saleId) {
                const newValorBruto = updatedData.valorBruto ?? sale.valorBruto;
                const newValorLiquido = updatedData.valorLiquido ?? sale.valorLiquido;
                const pecDesc = newValorBruto > 0 ? ((newValorBruto - newValorLiquido) / newValorBruto) * 100 : 0;
                
                return { 
                    ...sale, 
                    ...updatedData, 
                    pecDesc,
                    editadoManualmente: true 
                };
            }
            return sale;
        })
    );
  };

  const handleAddVendor = (newVendor: Vendor) => {
    setVendors(prev => [...prev, newVendor]);
  };
  
  const handleRecordPayment = (vendorCod: string, month: string, amount: number, note: string) => {
     setPaymentStatuses(prevStatuses => {
        return prevStatuses.map(status => {
            if (status.cod === vendorCod && status.mes === month) {
                const newPaidAmount = status.valorPago + amount;
                const newBalance = status.valorTotal - newPaidAmount;

                const newPaymentRecord: PaymentRecord = {
                    amount,
                    note,
                    date: new Date().toISOString(),
                };

                return {
                    ...status,
                    valorPago: newPaidAmount,
                    saldo: newBalance < 0 ? 0 : newBalance,
                    history: [...status.history, newPaymentRecord],
                };
            }
            return status;
        });
    });
  };
  
  const handleSettleAll = (vendorCod: string, note: string) => {
     setPaymentStatuses(prevStatuses => {
        return prevStatuses.map(status => {
            if (status.cod === vendorCod && status.saldo > 0) {
                 const newPaymentRecord: PaymentRecord = {
                    amount: status.saldo,
                    note: note || "Quitação total do saldo.",
                    date: new Date().toISOString(),
                };
                return {
                    ...status,
                    valorPago: status.valorTotal,
                    saldo: 0,
                    history: [...status.history, newPaymentRecord],
                };
            }
            return status;
        })
     })
  };

  const handleUpdateObservation = (vendorCod: string, newObservation: string) => {
    setPaymentSummaries(prevSummaries => {
      const summaryExists = prevSummaries.some(s => s.cod === vendorCod);
      if (summaryExists) {
        return prevSummaries.map(summary => 
          summary.cod === vendorCod 
            ? { ...summary, observacoes: newObservation } 
            : summary
        );
      } else {
        const newSummary: PaymentSummary = {
          cod: vendorCod,
          observacoes: newObservation,
          valorTotal: 0, 
        };
        return [...prevSummaries, newSummary];
      }
    });
  };

  const renderContent = () => {
    if (selectedVendor) {
      return (
         <VendorDetail
            vendor={selectedVendor}
            sales={salesByVendor[selectedVendor.cod] || []}
            paymentStatus={paymentStatusByVendor[selectedVendor.cod] || {}}
            paymentSummary={paymentSummaryByVendor[selectedVendor.cod] || null}
            onBack={() => handleSelectVendor(null)}
            onAddSale={handleAddSale}
            onUpdateSale={handleUpdateSale}
            onUpdateObservation={handleUpdateObservation}
          />
      );
    }
    
    switch(view) {
        case 'payments':
            return <Payments 
                        vendors={vendors}
                        paymentStatusByVendor={paymentStatusByVendor}
                        onRecordPayment={handleRecordPayment}
                        onSettleAll={handleSettleAll}
                    />;
        case 'reports':
            return <Reports
                        vendors={vendors}
                        paymentStatuses={paymentStatuses}
                    />;
        case 'dashboard':
        default:
            return <Dashboard
                        vendors={vendors}
                        sales={sales}
                        salesByVendor={salesByVendor}
                        paymentStatusByVendor={paymentStatusByVendor}
                        onSelectVendor={handleSelectVendor}
                        onAddVendor={handleAddVendor}
                    />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <header className="bg-weg-dark shadow-lg text-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setView('dashboard'); setSelectedVendor(null); }}>
             <svg className="w-12 h-12 text-weg-yellow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 2h16c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm0 4v2h16V6H4zm0 4v2h16v-2H4zm0 4v2h12v-2H4z" />
            </svg>
            <h1 className="text-3xl font-bold tracking-tight">
              Sistema de Bonificação
            </h1>
          </div>
          <nav className="flex items-center space-x-4">
            <button 
              onClick={() => { setView('dashboard'); setSelectedVendor(null); }}
              className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${view === 'dashboard' && !selectedVendor ? 'bg-weg-blue text-white' : 'hover:bg-weg-blue/20'}`}>
                Dashboard
            </button>
            <button 
              onClick={() => { setView('payments'); setSelectedVendor(null); }}
              className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${view === 'payments' ? 'bg-weg-blue text-white' : 'hover:bg-weg-blue/20'}`}>
                Pagamentos
            </button>
             <button 
              onClick={() => { setView('reports'); setSelectedVendor(null); }}
              className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${view === 'reports' ? 'bg-weg-blue text-white' : 'hover:bg-weg-blue/20'}`}>
                Relatórios
            </button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>

      <footer className="bg-white mt-8 py-4 text-center text-sm text-gray-500 border-t">
        <div className="container mx-auto">
          &copy; {new Date().getFullYear()} Sistema de Bonificação de Eletricistas. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default App;
