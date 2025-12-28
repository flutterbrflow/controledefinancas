// URL base da API (caminho relativo para deploy em NAS)
const API_URL = 'api';

// Função auxiliar para fazer requisições à API com tratamento de erros
async function fetchAPI(url: string, options?: RequestInit) {
    const res = await fetch(url, options);
    const data = await res.json();
    if (!res.ok || data.error) {
        throw new Error(data.error || `Erro na requisição: ${res.status}`);
    }
    return data;
}

// Serviço de API com todos os métodos para comunicação com o backend
export const apiService = {
    // AUTENTICAÇÃO

    // Faz login do usuário
    async login(credentials: any) {
        return fetchAPI(`${API_URL}/auth.php?action=login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
    },

    // Registra novo usuário
    async register(data: any) {
        return fetchAPI(`${API_URL}/auth.php?action=register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    // TRANSAÇÕES

    // Busca todas as transações do usuário
    async getTransactions(userId: string) {
        return fetchAPI(`${API_URL}/transactions.php?userId=${userId}`);
    },

    // Adiciona nova(s) transação(ões)
    async addTransaction(userId: string, transaction: any) {
        return fetchAPI(`${API_URL}/transactions.php?userId=${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction)
        });
    },

    // Deleta uma transação específica
    async deleteTransaction(userId: string, id: string) {
        return fetchAPI(`${API_URL}/transactions.php?userId=${userId}&id=${id}`, {
            method: 'DELETE'
        });
    },

    // Deleta todas as transações do usuário
    async deleteAllTransactions(userId: string) {
        return fetchAPI(`${API_URL}/transactions.php?userId=${userId}`, {
            method: 'DELETE'
        });
    },

    // METAS FINANCEIRAS

    // Busca todas as metas do usuário
    async getGoals(userId: string) {
        return fetchAPI(`${API_URL}/goals.php?userId=${userId}`);
    },

    // Adiciona nova meta
    async addGoal(userId: string, goal: any) {
        return fetchAPI(`${API_URL}/goals.php?userId=${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(goal)
        });
    },

    // Atualiza progresso de uma meta
    async updateGoal(userId: string, id: string, amount: number) {
        return fetchAPI(`${API_URL}/goals.php?userId=${userId}&id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
    },

    // Deleta uma meta
    async deleteGoal(userId: string, id: string) {
        return fetchAPI(`${API_URL}/goals.php?userId=${userId}&id=${id}`, {
            method: 'DELETE'
        });
    },

    // TRANSAÇÕES RECORRENTES

    // Busca todas as transações recorrentes do usuário
    async getRecurring(userId: string) {
        return fetchAPI(`${API_URL}/recurring.php?userId=${userId}`);
    },

    // Adiciona nova transação recorrente
    async addRecurring(userId: string, recurring: any) {
        return fetchAPI(`${API_URL}/recurring.php?userId=${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recurring)
        });
    },

    // Ativa/desativa transação recorrente
    async toggleRecurring(userId: string, id: string) {
        return fetchAPI(`${API_URL}/recurring.php?userId=${userId}&id=${id}`, {
            method: 'PATCH'
        });
    },

    // Deleta transação recorrente
    async deleteRecurring(userId: string, id: string) {
        return fetchAPI(`${API_URL}/recurring.php?userId=${userId}&id=${id}`, {
            method: 'DELETE'
        });
    },

    // PERFIL DO USUÁRIO

    // Busca dados do usuário
    async getUser(userId: string) {
        return fetchAPI(`${API_URL}/user.php?userId=${userId}`);
    },

    // Atualiza dados do usuário (nome e email)
    async updateUser(userId: string, data: { name: string; email: string }) {
        return fetchAPI(`${API_URL}/user.php?userId=${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    // Faz upload de avatar do usuário
    async uploadAvatar(userId: string, file: File) {
        const formData = new FormData();
        formData.append('avatar', file);

        const res = await fetch(`${API_URL}/user.php?userId=${userId}`, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (!res.ok || data.error) {
            throw new Error(data.error || 'Erro ao fazer upload do avatar');
        }
        return data;
    },

    // SUGESTÕES DE RECORRENTES

    // Busca sugestões de transações recorrentes baseado em padrões
    async getSuggestedRecurring(userId: string) {
        return fetchAPI(`${API_URL}/suggestions.php?userId=${userId}`);
    }
};
