
// Interface que define a estrutura de um usuário
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string; // URL do avatar do usuário (opcional)
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
  parcelaAtual?: number;
  totalParcelas?: number;
  isCreditCard?: boolean;
  isSavings?: boolean;
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
  totalParcelasRestantes?: number;
  totalGeralCartao?: number;
  saldoPoupanca?: number;
  aplicacoesMes?: number;
  resgatesMes?: number;
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
