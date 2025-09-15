
import React, { useState, useEffect, useCallback } from 'react';
import type { Vendor } from '../types';

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendor: Vendor) => void;
  vendors: Vendor[];
  vendorToEdit?: Vendor | null;
}

// --- Validation and Masking Utilities ---

const validateCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  return true;
};

const validateCNPJ = (cnpj: string): boolean => {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  return true;
};

const maskCpfCnpj = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 11) {
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14);
  }
  return cleaned
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
    .slice(0, 18);
};

const maskPhone = (value: string): string => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
};


export const VendorModal: React.FC<VendorModalProps> = ({ isOpen, onClose, onSave, vendors, vendorToEdit }) => {
  const initialFormState: Vendor = {
    cod: '',
    nome: '',
    cpfCnpj: '',
    telefone: '',
    pix: '',
  };
  const [formData, setFormData] = useState<Vendor>(initialFormState);
  const [cpfCnpjError, setCpfCnpjError] = useState<string | null>(null);
  const [codCheck, setCodCheck] = useState<{status: 'idle' | 'checking' | 'available' | 'exists', message: string}>({status: 'idle', message: ''});
  const debouncedCod = useDebounce(formData.cod, 500);

  const isEditing = !!vendorToEdit;

  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
            setFormData(vendorToEdit);
        } else {
            setFormData(initialFormState);
        }
        setCpfCnpjError(null);
        setCodCheck({status: 'idle', message: ''});
    }
  }, [isOpen, vendorToEdit]);


  // Simple debounce hook implementation inside the component
  function useDebounce(value: string, delay: number): string {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
  }

  useEffect(() => {
    const trimmedCode = debouncedCod.trim();
    if (!trimmedCode) {
      setCodCheck({ status: 'idle', message: '' });
      return;
    }

    setCodCheck({ status: 'checking', message: 'Verificando...' });

    // Simulate async check for better UX
    const timerId = setTimeout(() => {
      const codeExists = vendors.some(vendor => vendor.cod.trim() === trimmedCode && vendor.cod.trim() !== vendorToEdit?.cod.trim());
      if (codeExists) {
        setCodCheck({ status: 'exists', message: '⚠️ Código já cadastrado' });
      } else {
        setCodCheck({ status: 'available', message: '✅ Código disponível' });
      }
    }, 300);

    return () => clearTimeout(timerId);
  }, [debouncedCod, vendors, vendorToEdit]);


  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = maskCpfCnpj(e.target.value);
    setFormData(prev => ({ ...prev, cpfCnpj: maskedValue }));
    
    const cleaned = maskedValue.replace(/\D/g, '');
    if (cleaned.length === 11) {
        setCpfCnpjError(validateCPF(cleaned) ? null : 'CPF inválido');
    } else if (cleaned.length === 14) {
        setCpfCnpjError(validateCNPJ(cleaned) ? null : 'CNPJ inválido');
    } else if (cleaned.length > 0) {
        setCpfCnpjError('CPF/CNPJ incompleto');
    } else {
        setCpfCnpjError(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'telefone') {
        setFormData(prev => ({ ...prev, telefone: maskPhone(value) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormInvalid) return;
    onSave(formData);
    onClose();
  };
  
  const isFormInvalid = !formData.cod || codCheck.status === 'exists' || !formData.nome || !formData.cpfCnpj || !!cpfCnpjError || !formData.pix;

  if (!isOpen) return null;
  
  const modalTitle = isEditing ? 'Editar Cadastro' : 'Cadastrar Novo Parceiro';
  const saveButtonText = isEditing ? 'Salvar Alterações' : 'Salvar Parceiro';
  const inputStyle = "mt-1 block w-full bg-white text-black placeholder-gray-500 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-weg-blue focus:border-weg-blue transition";
  const errorInputStyle = "border-red-500 ring-red-500";
  const successInputStyle = "border-green-500 ring-green-500";


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
            <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">{modalTitle}</h2>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <label htmlFor="cod" className="block text-sm font-medium text-gray-700">Código</label>
                    <input type="text" name="cod" id="cod" value={formData.cod} onChange={handleChange} required 
                        className={`${inputStyle} ${codCheck.status === 'exists' ? errorInputStyle : ''} ${codCheck.status === 'available' ? successInputStyle : ''}`}
                        placeholder="Digite o código usado no sistema externo"
                    />
                     <p className={`mt-1 text-sm h-4 ${codCheck.status === 'exists' ? 'text-red-600' : 'text-green-600'}`}>{codCheck.message}</p>
                </div>
                <div>
                    <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                    <input type="text" name="nome" id="nome" value={formData.nome} onChange={handleChange} required maxLength={100} className={inputStyle}/>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="cpfCnpj" className="block text-sm font-medium text-gray-700">CPF / CNPJ</label>
                        <input type="text" name="cpfCnpj" id="cpfCnpj" value={formData.cpfCnpj} onChange={handleCpfCnpjChange} required className={`${inputStyle} ${cpfCnpjError ? errorInputStyle : ''}`}/>
                        {cpfCnpjError && <p className="mt-1 text-sm text-red-600">{cpfCnpjError}</p>}
                    </div>
                    <div>
                        <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">Telefone</label>
                        <input type="text" name="telefone" id="telefone" value={formData.telefone} onChange={handleChange} className={inputStyle}/>
                    </div>
                </div>
                <div>
                    <label htmlFor="pix" className="block text-sm font-medium text-gray-700">Chave PIX</label>
                    <input type="text" name="pix" id="pix" value={formData.pix} onChange={handleChange} required className={inputStyle}/>
                </div>
            </div>
            <div className="p-6 bg-gray-50 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                    Cancelar
                </button>
                <button type="submit" disabled={isFormInvalid} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-weg-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-weg-blue disabled:bg-weg-blue disabled:opacity-75 disabled:cursor-not-allowed">
                    {saveButtonText}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
