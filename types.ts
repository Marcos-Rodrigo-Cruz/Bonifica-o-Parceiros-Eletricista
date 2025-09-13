
export interface PaymentRecord {
  amount: number;
  date: string;
  note: string;
}

export interface Vendor {
  cod: string;
  nome: string;
  cpfCnpj: string;
  telefone: string;
  pix: string;
}

export interface Sale {
  id: number;
  pesquisaId: string; // Foreign key to Vendor.cod
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
  cod: string;
  valorTotal: number;
  valorPago: number;
  saldo: number;
  history: PaymentRecord[];
}

export interface PaymentSummary {
  cod: string;
  valorTotal: number;
  observacoes: string;
}