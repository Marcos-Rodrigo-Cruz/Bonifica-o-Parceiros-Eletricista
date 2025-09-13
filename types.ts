
export interface PaymentRecord {
  amount: number;
  date: string;
  note: string;
}

export interface Vendor {
  cod: number;
  nome: string;
  cpfCnpj: string;
  telefone: string;
  pix: string;
  mesesElegibilidade: string; // e.g., "FEV-25" or "Todos"
}

export interface Sale {
  id: number;
  pesquisaId: number; // Foreign key to Vendor.cod
  vendedorResponsavel: string;
  loja: number;
  numeroVenda: string;
  cadastroVenda: string;
  valorBruto: number;
  valorLiquido: number;
  pecDesc: number;
  comissaoPercentual: number;
  valorAReceber: number;
  mesAno: string; // e.g., "JAN-25"
  editadoManualmente?: boolean;
}

export interface PaymentStatus {
  mes: string;
  cod: number;
  valorTotal: number;
  valorPago: number;
  saldo: number;
  history: PaymentRecord[];
}

export interface PaymentSummary {
  cod: number;
  valorTotal: number;
  observacoes: string;
}
