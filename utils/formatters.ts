// Funções utilitárias centralizadas para formatação
// Evita duplicação de código nos componentes

/**
 * Formata um número como moeda brasileira (R$)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada como "1.234,56"
 * @example
 * formatCurrency(1234.56) // "1.234,56"
 * formatCurrency(100) // "100,00"
 */
export const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

/**
 * Formata uma data para o padrão brasileiro
 * @param dateStr - String de data no formato ISO (YYYY-MM-DD)
 * @returns String formatada como "DD/MM/YYYY"
 * @example
 * formatDate("2025-01-29") // "29/01/2025"
 */
export const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';

    try {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    } catch {
        return dateStr;
    }
};

/**
 * Formata uma data para exibição completa
 * @param dateStr - String de data no formato ISO
 * @returns String formatada como "29 de Janeiro de 2025"
 */
export const formatDateLong = (dateStr: string): string => {
    if (!dateStr) return '';

    try {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
};

/**
 * Normaliza um valor numérico de string para number
 * Suporta formatos BR (1.234,56) e US (1,234.56)
 * @param val - String contendo o valor
 * @returns Número normalizado
 */
export const normalizeNumericValue = (val: string): number => {
    if (!val) return 0;
    let clean = val.replace(/[R$\s]/g, '').trim();
    if (!clean) return 0;

    // Detectar sinal negativo
    let isNegative = false;
    if (clean.startsWith('-') || clean.endsWith('-') || (clean.startsWith('(') && clean.endsWith(')')) || /[Dd]$/.test(clean)) {
        isNegative = true;
    }
    clean = clean.replace(/[()-DdCc]/g, '');

    // Heurística de localidade (Brasil vs EUA)
    const lastComma = clean.lastIndexOf(',');
    const lastDot = clean.lastIndexOf('.');

    if (lastComma > -1 && lastDot > -1) {
        if (lastComma > lastDot) {
            // Estilo Brasil: 1.234,56
            clean = clean.replace(/\./g, '').replace(',', '.');
        } else {
            // Estilo EUA: 1,234.56
            clean = clean.replace(/,/g, '');
        }
    } else if (lastComma > -1) {
        // Só tem vírgula
        const parts = clean.split(',');
        if (parts[parts.length - 1].length === 3 && parts.length > 1) {
            // Provavelmente milhar (ex: 1,000)
            clean = clean.replace(/,/g, '');
        } else {
            // Provavelmente decimal (ex: 123,45)
            clean = clean.replace(',', '.');
        }
    } else if (lastDot > -1) {
        // Só tem ponto
        const parts = clean.split('.');
        if (parts[parts.length - 1].length === 3 && parts.length > 1) {
            // Provavelmente milhar (ex: 1.000)
            clean = clean.replace(/\./g, '');
        }
        // Decimal (ex: 123.45) já está OK
    }

    const num = parseFloat(clean);
    if (isNaN(num)) return 0;
    return isNegative ? -Math.abs(num) : Math.abs(num);
};

/**
 * Normaliza uma string de data para formato ISO (YYYY-MM-DD)
 * @param dateStr - String de data em diversos formatos
 * @returns String no formato ISO
 */
export const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString().split('T')[0];

    // Remove aspas e espaços extras que podem vir do CSV
    const cleanStr = dateStr.replace(/"/g, '').trim();
    if (!cleanStr) return new Date().toISOString().split('T')[0];

    // Se já estiver no formato AAAA-MM-DD, retornamos direto
    const isoMatch = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return isoMatch[0];

    // Tentar detectar DD/MM/YYYY ou similar
    const parts = cleanStr.split(/[/-]/);
    if (parts.length === 3) {
        // Se o primeiro item for o ano (YYYY-MM-DD ou YYYY/MM/DD)
        if (parts[0].length === 4) {
            return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else {
            // Assume DD/MM/YYYY
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    }

    // Fallback de segurança
    try {
        const d = new Date(cleanStr);
        if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];

        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    } catch {
        return new Date().toISOString().split('T')[0];
    }
};
