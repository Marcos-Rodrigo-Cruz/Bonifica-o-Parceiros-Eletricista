import React, { useState, useEffect, useMemo } from 'react';
import type { Sale } from '../types';

interface EditSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sale: Omit<Sale, 'id' | 'pesquisaId'>) => void;
  sale: Sale | null;
}

const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

/**
 * Generates a list of the last 6 months, the current month, and the next month.
 * This creates a rolling 8-month window for sale registration.
 * @returns An array of objects with display ("MON") and value ("MON-YY") properties.
 */
const generateMonthOptions = () => {
    const options: { display: string; value: string }[] = [];
    const now = new Date();
    
    // Loop from 6 months ago to 1 month from now.
    for (let i = -6; i <= 1; i++) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const month = monthNames[targetDate.getMonth()];
        const year = targetDate.getFullYear().toString().slice(-2);
        options.push({ display: month, value: `${month}-${year}` });
    }
    return options;
};

/**
 * Gets the current month in "MON-YY" format to be used as the default value.
 * @returns The current month and year string, e.g., "ABR-25".
 */
const getCurrentMonthValue = () => {
    const now = new Date();
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear().toString().slice(-2);
    return `${month}-${year}`;
};

export const EditSaleModal: React.FC<EditSaleModalProps> = ({ isOpen, onClose, onSave, sale }) => {
  const initialFormState = {
    vendedorResponsavel: '',
    loja: 1,
    numeroVenda: '',
    cadastroVenda: '',
    valorBruto: 0,
    valorLiquido: 0,
    comissaoPercentual: 0,
    mesAno: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [valorAReceber, setValorAReceber] = useState(0);

  const monthOptions = useMemo(() => generateMonthOptions(), []);

  useEffect(() => {
    if (sale) {
      const validMonths = monthOptions.map(opt => opt.value);
      // As per requirements, if the sale's original month is now out of the valid range,
      // default to the current month. This enforces the new business rule.
      const saleMonthIsValid = validMonths.includes(sale.mesAno);

      setFormData({
        vendedorResponsavel: sale.vendedorResponsavel,
        loja: sale.loja,
        numeroVenda: sale.numeroVenda,
        cadastroVenda: sale.cadastroVenda,
        valorBruto: sale.valorBruto,
        valorLiquido: sale.valorLiquido,
        comissaoPercentual: sale.comissaoPercentual,
        mesAno: saleMonthIsValid ? sale.mesAno : getCurrentMonthValue(),
      });
    } else {
      setFormData(initialFormState);
    }
  }, [sale, monthOptions]);
  

  useEffect(() => {
    const { valorBruto, valorLiquido } = formData;
    let comissaoDecimal = 0;

    if (valorBruto > 0) {
      const discountRatio = 1 - (valorLiquido / valorBruto);
      
      if (discountRatio <= 0) {
          comissaoDecimal = 0.01; // 1%
      } else {
          comissaoDecimal = 0.01 - (discountRatio / 15);
      }
      comissaoDecimal = Math.max(0, Math.min(0.01, comissaoDecimal));
    }

    const newComissaoPercentual = comissaoDecimal * 100;
    const newValorAReceber = valorLiquido * comissaoDecimal;

    setFormData(prev => ({
      ...prev,
      comissaoPercentual: newComissaoPercentual,
    }));
    setValorAReceber(newValorAReceber);

  }, [formData.valorBruto, formData.valorLiquido]);


  if (!isOpen || !sale) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name.includes('valor') || name === 'loja' ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      ...formData,
      valorAReceber,
      // pecDesc is calculated in the parent App component to ensure consistency
      pecDesc: 0,
    });
  };
  
  const inputStyle = "mt-1 block w-full bg-white text-black placeholder-gray-500 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-weg-blue focus:border-weg-blue transition";
  const calculatedInputStyle = "mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-green-50 text-green-900 font-semibold py-2 px-3 focus:outline-none focus:ring-1 focus:ring-weg-blue focus:border-weg-blue cursor-not-allowed transition";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
            <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">Editar Venda</h2>
            </div>
            <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="edit-numeroVenda" className="block text-sm font-medium text-gray-700">Nº da Venda</label>
                        <input type="text" name="numeroVenda" id="edit-numeroVenda" value={formData.numeroVenda} onChange={handleChange} required className={inputStyle}/>
                    </div>
                    <div>
                        <label htmlFor="edit-mesAno" className="block text-sm font-medium text-gray-700">Mês</label>
                        <select name="mesAno" id="edit-mesAno" value={formData.mesAno} onChange={handleChange} required className={inputStyle}>
                           {monthOptions.map(option => (
                               <option key={option.value} value={option.value}>{option.display}</option>
                           ))}
                        </select>
                    </div>
                </div>

                 <div>
                    <label htmlFor="edit-cadastroVenda" className="block text-sm font-medium text-gray-700">Cliente / Cadastro</label>
                    <input type="text" name="cadastroVenda" id="edit-cadastroVenda" value={formData.cadastroVenda} onChange={handleChange} required className={inputStyle}/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="edit-vendedorResponsavel" className="block text-sm font-medium text-gray-700">Vendedor Responsável</label>
                        <input type="text" name="vendedorResponsavel" id="edit-vendedorResponsavel" value={formData.vendedorResponsavel} onChange={handleChange} required className={inputStyle}/>
                    </div>
                     <div>
                        <label htmlFor="edit-loja" className="block text-sm font-medium text-gray-700">Loja</label>
                        <input type="number" name="loja" id="edit-loja" value={formData.loja} onChange={handleChange} required className={inputStyle}/>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="edit-valorBruto" className="block text-sm font-medium text-gray-700">Valor Bruto</label>
                        <input type="number" step="0.01" name="valorBruto" id="edit-valorBruto" value={formData.valorBruto} onChange={handleChange} required className={inputStyle}/>
                    </div>
                     <div>
                        <label htmlFor="edit-valorLiquido" className="block text-sm font-medium text-gray-700">Valor Líquido</label>
                        <input type="number" step="0.01" name="valorLiquido" id="edit-valorLiquido" value={formData.valorLiquido} onChange={handleChange} required className={inputStyle}/>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div className="flex items-center space-x-1 group relative">
                            <label htmlFor="edit-comissaoPercentual" className="block text-sm font-medium text-gray-700">Comissão (%)</label>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                A comissão é de até 1% do Valor Líquido, reduzida proporcionalmente quando há desconto. Fórmula baseada em (0.01 - (1 - Líquido/Bruto)/15), limitada entre 0% e 1%.
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                            </div>
                        </div>
                        <input 
                            type="text" 
                            name="comissaoPercentual" 
                            id="edit-comissaoPercentual" 
                            value={`${formData.comissaoPercentual.toFixed(2)}%`}
                            readOnly 
                            className={calculatedInputStyle}
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-valorAReceber" className="block text-sm font-medium text-gray-700">Valor a Receber</label>
                        <input 
                            type="text"
                            id="edit-valorAReceber"
                            name="valorAReceber"
                            value={valorAReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            readOnly
                            required
                            className={calculatedInputStyle}
                        />
                    </div>
                </div>

            </div>
            <div className="p-6 bg-gray-50 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                    Cancelar
                </button>
                <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-weg-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-weg-blue">
                    Salvar Alterações
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};