
import { Vendor, Sale, PaymentStatus, PaymentSummary } from '../types';

export const mockVendors: Vendor[] = [
  {
    cod: 2472,
    nome: "DAVI DIAS FERNANDES",
    cpfCnpj: "764.071.101-06",
    telefone: "(63)99234-2605",
    pix: "764.071.101-06",
    mesesElegibilidade: "FEV-25",
  },
  {
    cod: 1685,
    nome: "ADRIANO PEREIRA CAVALCANTE",
    cpfCnpj: "123.456.789-10",
    telefone: "(63)98105-4232",
    pix: "63981054232",
    mesesElegibilidade: "Todos",
  },
  {
    cod: 3011,
    nome: "MARIA SILVA OLIVEIRA",
    cpfCnpj: "987.654.321-00",
    telefone: "(63)98877-6655",
    pix: "maria.oliveira@email.com",
    mesesElegibilidade: "Todos",
  },
  {
    cod: 4523,
    nome: "JOÃO COSTA PEREIRA",
    cpfCnpj: "456.123.789-55",
    telefone: "(63)97766-5544",
    pix: "joao.costa.pix",
    mesesElegibilidade: "MAR-25",
  },
];

export const mockSales: Sale[] = [
  {
    id: 1,
    pesquisaId: 2472,
    vendedorResponsavel: "MARCOS",
    loja: 1,
    numeroVenda: "206951",
    cadastroVenda: "NASCIMENTO ELETRICISTA",
    valorBruto: 5158.00,
    valorLiquido: 4850.00,
    pecDesc: 5.97,
    comissaoPercentual: 0.60,
    valorAReceber: 29.10, // Corrected calculation
    mesAno: "JAN-25",
  },
  {
    id: 2,
    pesquisaId: 2472,
    vendedorResponsavel: "MARCOS",
    loja: 1,
    numeroVenda: "206952",
    cadastroVenda: "CONSTRUÇÃO SILVA",
    valorBruto: 7500.00,
    valorLiquido: 7225.00,
    pecDesc: 3.67,
    comissaoPercentual: 0.60,
    valorAReceber: 43.35,
    mesAno: "JAN-25",
  },
  {
    id: 3,
    pesquisaId: 1685,
    vendedorResponsavel: "ANA",
    loja: 2,
    numeroVenda: "206953",
    cadastroVenda: "OBRA FÁCIL",
    valorBruto: 10000.00,
    valorLiquido: 9881.00,
    pecDesc: 1.19,
    comissaoPercentual: 1.00,
    valorAReceber: 98.81,
    mesAno: "JAN-25",
  },
   {
    id: 4,
    pesquisaId: 3011,
    vendedorResponsavel: "LUCAS",
    loja: 1,
    numeroVenda: "206954",
    cadastroVenda: "REFORMA TOTAL",
    valorBruto: 1250.00,
    valorLiquido: 1250.00,
    pecDesc: 0,
    comissaoPercentual: 0.80,
    valorAReceber: 10.00,
    mesAno: "JAN-25",
  },
  {
    id: 5,
    pesquisaId: 1685,
    vendedorResponsavel: "ANA",
    loja: 2,
    numeroVenda: "206955",
    cadastroVenda: "CASA NOVA",
    valorBruto: 850.00,
    valorLiquido: 800.00,
    pecDesc: 5.88,
    comissaoPercentual: 1.20,
    valorAReceber: 9.60,
    mesAno: "FEV-25",
  },
];

export const mockPaymentStatus: PaymentStatus[] = [
    { mes: "JAN-25", cod: 2472, valorTotal: 72.45, valorPago: 72.45, saldo: 0, history: [] },
    { mes: "JAN-25", cod: 1685, valorTotal: 98.81, valorPago: 0, saldo: 98.81, history: [] },
    { mes: "JAN-25", cod: 3011, valorTotal: 10.00, valorPago: 10.00, saldo: 0, history: [] },
    { mes: "FEV-25", cod: 1685, valorTotal: 9.60, valorPago: 0, saldo: 9.60, history: [] },
];

export const mockPaymentSummaries: PaymentSummary[] = [
    { cod: 1685, valorTotal: -111.19, observacoes: "Pegou um alicate de R$210,00" },
];