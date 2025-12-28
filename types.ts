
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Transaction {
  id: string;
  userId: string;
  data: string;
  dependenciaOrigem: string;
  historico: string;
  dataBalancete: string | null;
  numeroDocumento: string | null;
  valor: number;
  createdAt: string;
}

export interface RecurringTransaction {
  id: string;
  userId: string;
  titulo: string;
  valor: number;
  diaVencimento: number;
  categoria: string;
  ativa: boolean;
}

export interface FinanceSummary {
  saldoTotal: number;
  receitasMes: number;
  despesasMes: number;
}

export interface Goal {
  id: string;
  userId: string;
  titulo: string;
  valorMeta: number;
  valorAtual: number;
  cor: string;
  createdAt: string;
}
