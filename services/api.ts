const API_URL = 'api'; // Relative path for NAS deployment

async function fetchAPI(url: string, options?: RequestInit) {
    const res = await fetch(url, options);
    const data = await res.json();
    if (!res.ok || data.error) {
        throw new Error(data.error || `Erro na requisição: ${res.status}`);
    }
    return data;
}

export const apiService = {
    async login(credentials: any) {
        return fetchAPI(`${API_URL}/auth.php?action=login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
    },

    async register(data: any) {
        return fetchAPI(`${API_URL}/auth.php?action=register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    async getTransactions(userId: string) {
        return fetchAPI(`${API_URL}/transactions.php?userId=${userId}`);
    },

    async addTransaction(userId: string, transaction: any) {
        return fetchAPI(`${API_URL}/transactions.php?userId=${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction)
        });
    },

    async deleteTransaction(userId: string, id: string) {
        return fetchAPI(`${API_URL}/transactions.php?userId=${userId}&id=${id}`, {
            method: 'DELETE'
        });
    },

    async deleteAllTransactions(userId: string) {
        return fetchAPI(`${API_URL}/transactions.php?userId=${userId}`, {
            method: 'DELETE'
        });
    },

    // Goals
    async getGoals(userId: string) {
        return fetchAPI(`${API_URL}/goals.php?userId=${userId}`);
    },

    async addGoal(userId: string, goal: any) {
        return fetchAPI(`${API_URL}/goals.php?userId=${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(goal)
        });
    },

    async updateGoal(userId: string, id: string, amount: number) {
        return fetchAPI(`${API_URL}/goals.php?userId=${userId}&id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
    },

    async deleteGoal(userId: string, id: string) {
        return fetchAPI(`${API_URL}/goals.php?userId=${userId}&id=${id}`, {
            method: 'DELETE'
        });
    },

    // Recurring
    async getRecurring(userId: string) {
        return fetchAPI(`${API_URL}/recurring.php?userId=${userId}`);
    },

    async addRecurring(userId: string, recurring: any) {
        return fetchAPI(`${API_URL}/recurring.php?userId=${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recurring)
        });
    },

    async toggleRecurring(userId: string, id: string) {
        return fetchAPI(`${API_URL}/recurring.php?userId=${userId}&id=${id}`, {
            method: 'PATCH'
        });
    },

    async deleteRecurring(userId: string, id: string) {
        return fetchAPI(`${API_URL}/recurring.php?userId=${userId}&id=${id}`, {
            method: 'DELETE'
        });
    }
};
