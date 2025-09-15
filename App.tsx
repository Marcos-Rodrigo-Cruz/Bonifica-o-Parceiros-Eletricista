
import React, { useState, useMemo } from 'react';
import type { Vendor, Sale, PaymentStatus, PaymentSummary, PaymentRecord } from './types';
import { mockVendors, mockSales, mockPaymentStatus, mockPaymentSummaries } from './data/mockData';
import { VendorDetail } from './components/VendorDetail';
import { Dashboard } from './components/Dashboard';
import { Payments } from './components/Payments';
import { Reports } from './components/Reports';
import { AuthModal } from './components/AuthModal';
import { Settings } from './components/Settings';
import { VendorModal } from './components/VendorModal';

// Custom hook to persist state in localStorage
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item);
      }

      // If item doesn't exist, check if all data was ever deleted.
      // This handles the edge case where a user clears local storage *after*
      // using a "delete all" function.
      const hasBeenWiped = window.localStorage.getItem('app_data_wiped');
      if (hasBeenWiped === 'true' && Array.isArray(initialValue)) {
        // If data was wiped, return empty array to prevent mock data reload.
        return [] as T;
      }

      return initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}

const App: React.FC = () => {
  const [vendors, setVendors] = useLocalStorage<Vendor[]>('app_vendors', mockVendors);
  const [sales, setSales] = useLocalStorage<Sale[]>('app_sales', mockSales);
  const [paymentStatuses, setPaymentStatuses] = useLocalStorage<PaymentStatus[]>('app_paymentStatuses', mockPaymentStatus);
  const [paymentSummaries, setPaymentSummaries] = useLocalStorage<PaymentSummary[]>('app_paymentSummaries', mockPaymentSummaries);
  
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [view, setView] = useState<'dashboard' | 'payments' | 'reports' | 'settings'>('dashboard');

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // State for the unified Vendor Modal
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<Vendor | null>(null);


  const salesByVendor = useMemo(() => {
    return sales.reduce((acc, sale) => {
      if (!acc[sale.pesquisaId]) {
        acc[sale.pesquisaId] = [];
      }
      acc[sale.pesquisaId].push(sale);
      return acc;
    }, {} as Record<string, Sale[]>);
  }, [sales]);

  // Create a complete and authoritative payment status list by combining sales data with payment records.
  // This ensures that any new or updated sale is immediately reflected in the balances.
  const fullPaymentStatuses = useMemo(() => {
    // 1. Calculate total commission for each vendor for each month from the 'sales' state.
    const monthlyCommissions = sales.reduce((acc, sale) => {
      const key = `${sale.pesquisaId}|${sale.mesAno}`;
      if (!acc[key]) {
        acc[key] = 0;
      }
      acc[key] += sale.valorAReceber;
      return acc;
    }, {} as Record<string, number>);

    // 2. Create a map of existing payment records (paid amounts and history).
    const paymentData = paymentStatuses.reduce((acc, status) => {
      const key = `${status.cod}|${status.mes}`;
      acc[key] = {
        valorPago: status.valorPago,
        history: status.history || [],
      };
      return acc;
    }, {} as Record<string, { valorPago: number; history: PaymentRecord[] }>);

    // 3. Combine sales commissions and payment records into a unified list.
    const allKeys = new Set([...Object.keys(monthlyCommissions), ...Object.keys(paymentData)]);

    const statuses: PaymentStatus[] = Array.from(allKeys).map(key => {
      const [cod, mes] = key.split('|');
      
      const valorTotal = monthlyCommissions[key] || 0;
      const { valorPago, history } = paymentData[key] || { valorPago: 0, history: [] };
      const saldo = valorTotal - valorPago;

      return {
        cod,
        mes,
        valorTotal,
        valorPago,
        saldo,
        history,
      };
    });

    return statuses;
  }, [sales, paymentStatuses]);

  const paymentStatusByVendor = useMemo(() => {
    return fullPaymentStatuses.reduce((acc, status) => {
      if (!acc[status.cod]) {
        acc[status.cod] = {};
      }
      acc[status.cod][status.mes] = status;
      return acc;
    }, {} as Record<string, Record<string, PaymentStatus>>);
  }, [fullPaymentStatuses]);


  const paymentSummaryByVendor = useMemo(() => {
    return paymentSummaries.reduce((acc, summary) => {
      acc[summary.cod] = summary;
      return acc;
    }, {} as Record<string, PaymentSummary>);
  }, [paymentSummaries]);

  const handleSelectVendor = (vendor: Vendor | null) => {
    setSelectedVendor(vendor);
    if(vendor) {
        setView('dashboard');
    }
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

  // --- Vendor CRUD Handlers ---
  const handleOpenAddVendorModal = () => {
    setVendorToEdit(null);
    setIsVendorModalOpen(true);
  };

  const handleOpenEditVendorModal = (vendor: Vendor) => {
    setVendorToEdit(vendor);
    setIsVendorModalOpen(true);
  };
  
  const handleSaveVendor = (vendorData: Vendor) => {
    if (vendorToEdit) { // Update existing vendor
        setVendors(prev => prev.map(v => (v.cod === vendorToEdit.cod ? vendorData : v)));
         if(vendorToEdit.cod !== vendorData.cod) {
            setSales(prev => prev.map(s => s.pesquisaId === vendorToEdit.cod ? {...s, pesquisaId: vendorData.cod} : s));
            setPaymentStatuses(prev => prev.map(ps => ps.cod === vendorToEdit.cod ? {...ps, cod: vendorData.cod} : ps));
            setPaymentSummaries(prev => prev.map(psm => psm.cod === vendorToEdit.cod ? {...psm, cod: vendorData.cod} : psm));
        }
        if (selectedVendor && selectedVendor.cod === vendorToEdit.cod) {
            setSelectedVendor(vendorData);
        }
    } else { // Add new vendor
        setVendors(prev => [...prev, vendorData]);
    }
    setIsVendorModalOpen(false);
  };

  const handleDeleteVendor = (vendorCod: string) => {
    const hasSales = sales.some(s => s.pesquisaId === vendorCod);
    if (hasSales) {
        alert('Não é possível excluir um parceiro com vendas registradas. Por favor, remova as vendas primeiro.');
        return;
    }
    
    setVendors(prev => prev.filter(v => v.cod !== vendorCod));
    setSales(prev => prev.filter(s => s.pesquisaId !== vendorCod));
    setPaymentStatuses(prev => prev.filter(ps => ps.cod !== vendorCod));
    setPaymentSummaries(prev => prev.filter(ps => ps.cod !== vendorCod));
    
    alert('Parceiro excluído com sucesso.');
    setSelectedVendor(null); // Go back to dashboard view
  };

  
  const handleRecordPayment = (vendorCod: string, month: string, amount: number, note: string) => {
    setPaymentStatuses(prevStatuses => {
      const existingStatusIndex = prevStatuses.findIndex(s => s.cod === vendorCod && s.mes === month);

      const newPaymentRecord: PaymentRecord = {
        amount,
        note,
        date: new Date().toISOString(),
      };
      
      if (existingStatusIndex !== -1) {
        // Update existing status
        const updatedStatuses = [...prevStatuses];
        const oldStatus = updatedStatuses[existingStatusIndex];
        updatedStatuses[existingStatusIndex] = {
          ...oldStatus,
          valorPago: oldStatus.valorPago + amount,
          history: [...(oldStatus.history || []), newPaymentRecord]
        };
        return updatedStatuses;
      } else {
        // Add new status if it doesn't exist in the persistent state
        const newStatus: PaymentStatus = {
          cod: vendorCod,
          mes: month,
          valorTotal: 0, // This is a placeholder; derived state is the source of truth
          valorPago: amount,
          saldo: 0,      // This is a placeholder; derived state is the source of truth
          history: [newPaymentRecord]
        };
        return [...prevStatuses, newStatus];
      }
    });
  };
  
  const handleSettleAll = (vendorCod: string, note: string) => {
     // Use the derived fullPaymentStatuses to find all pending balances for the vendor
     const statusesToSettle = fullPaymentStatuses.filter(s => s.cod === vendorCod && s.saldo > 0);
     if (statusesToSettle.length === 0) return;

     setPaymentStatuses(prevStatuses => {
        let nextStatuses = [...prevStatuses];
      
        statusesToSettle.forEach(settleInfo => {
            const newPaymentRecord: PaymentRecord = {
                amount: settleInfo.saldo,
                note: note || `Quitação do saldo de ${settleInfo.mes}.`,
                date: new Date().toISOString(),
            };

            const existingIndex = nextStatuses.findIndex(s => s.cod === vendorCod && s.mes === settleInfo.mes);

            if (existingIndex !== -1) {
                const oldStatus = nextStatuses[existingIndex];
                nextStatuses[existingIndex] = {
                    ...oldStatus,
                    valorPago: oldStatus.valorPago + settleInfo.saldo,
                    history: [...(oldStatus.history || []), newPaymentRecord]
                };
            } else {
                // If a month had sales but no payment record, create one now
                nextStatuses.push({
                    cod: vendorCod,
                    mes: settleInfo.mes,
                    valorTotal: 0, 
                    valorPago: settleInfo.saldo, // The amount paid is the entire pending balance
                    saldo: 0,
                    history: [newPaymentRecord]
                });
            }
        });

        return nextStatuses;
    });
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

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setView('settings');
    setSelectedVendor(null);
  };
  
  const handleNavClick = (newView: 'dashboard' | 'payments' | 'reports') => {
      setView(newView);
      setSelectedVendor(null);
  };

  const handleClearVendors = () => {
    setVendors([]);
    setSales([]);
    setPaymentStatuses([]);
    setPaymentSummaries([]);
    window.localStorage.setItem('app_data_wiped', 'true'); // Set the wipe flag
    alert('Cadastro de parceiros e dados associados foram limpos com sucesso.');
    setView('dashboard');
  };

  const handleResetCommissions = () => {
    setSales([]);
    setPaymentStatuses([]);
    const summariesWithObservations = paymentSummaries.map(({ cod, observacoes }) => ({ cod, observacoes, valorTotal: 0 }));
    setPaymentSummaries(summariesWithObservations);
    alert('Comissões e histórico de pagamentos foram reiniciados com sucesso.');
    setView('dashboard');
  };

  const handleDeleteAllData = () => {
    setVendors([]);
    setSales([]);
    setPaymentStatuses([]);
    setPaymentSummaries([]);
    window.localStorage.setItem('app_data_wiped', 'true'); // Set the wipe flag
    alert('Todos os dados do sistema foram excluídos com sucesso.');
    setView('dashboard');
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
            onEdit={handleOpenEditVendorModal}
            onDelete={handleDeleteVendor}
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
                        paymentStatuses={fullPaymentStatuses}
                    />;
        case 'settings':
            return isAuthenticated ? <Settings 
                onClearVendors={handleClearVendors}
                onResetCommissions={handleResetCommissions}
                onDeleteAllData={handleDeleteAllData}
            /> : (
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-red-600">Acesso Negado</h2>
                    <p className="text-gray-600 mt-2">Você precisa de autenticação para acessar esta página.</p>
                </div>
            );
        case 'dashboard':
        default:
            return <Dashboard
                        vendors={vendors}
                        sales={sales}
                        salesByVendor={salesByVendor}
                        paymentStatusByVendor={paymentStatusByVendor}
                        onSelectVendor={handleSelectVendor}
                        onAddVendor={handleOpenAddVendorModal}
                    />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <VendorModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        onSave={handleSaveVendor}
        vendors={vendors}
        vendorToEdit={vendorToEdit}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
      <header className="bg-weg-dark shadow-lg text-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
             <svg className="w-12 h-12 text-weg-yellow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 2h16c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm0 4v2h16V6H4zm0 4v2h16v-2H4zm0 4v2h12v-2H4z" />
            </svg>
            <h1 className="text-3xl font-bold tracking-tight">
              Sistema de Bonificação
            </h1>
          </div>
          <nav className="flex items-center space-x-2">
            <button 
              onClick={() => handleNavClick('dashboard')}
              className={`px-3 py-2 text-sm font-bold rounded-md transition-colors ${view === 'dashboard' && !selectedVendor ? 'bg-weg-blue text-white' : 'hover:bg-weg-blue/20'}`}>
                Dashboard
            </button>
            <button 
              onClick={() => handleNavClick('payments')}
              className={`px-3 py-2 text-sm font-bold rounded-md transition-colors ${view === 'payments' ? 'bg-weg-blue text-white' : 'hover:bg-weg-blue/20'}`}>
                Pagamentos
            </button>
             <button 
              onClick={() => handleNavClick('reports')}
              className={`px-3 py-2 text-sm font-bold rounded-md transition-colors ${view === 'reports' ? 'bg-weg-blue text-white' : 'hover:bg-weg-blue/20'}`}>
                Relatórios
            </button>
            <button
              onClick={() => {
                  if (isAuthenticated) {
                      setView('settings');
                      setSelectedVendor(null);
                  } else {
                      setIsAuthModalOpen(true);
                  }
              }}
              title="Configurações"
              aria-label="Configurações"
              className={`p-2 rounded-full transition-colors ${view === 'settings' ? 'bg-weg-blue text-white' : 'hover:bg-weg-blue/20'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
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
