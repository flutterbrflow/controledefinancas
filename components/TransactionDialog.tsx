
import React, { useState, useRef } from 'react';
import { Transaction } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface TransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (transactions: Transaction[]) => void;
  userId: string;
}

type Tab = 'manual' | 'csv' | 'ocr';

export const TransactionDialog: React.FC<TransactionDialogProps> = ({
  isOpen,
  onClose,
  onImport,
  userId
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('manual');
  const [file, setFile] = useState<File | null>(null);
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => {
    // Check if crypto and randomUUID exist (only available in HTTPS or localhost)
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback for HTTP/NAS environments
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Manual Form State
  const [manualData, setManualData] = useState({
    data: new Date().toISOString().split('T')[0],
    historico: '',
    origem: '',
    valor: ''
  });

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleOcrImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOcrImage(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString().split('T')[0];

    // Remove aspas e espaços extras que podem vir do CSV
    const cleanStr = dateStr.replace(/"/g, '').trim();
    if (!cleanStr) return new Date().toISOString().split('T')[0];

    // Se já estiver no formato AAAA-MM-DD, retornamos direto para evitar conversão UTC
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

    // Fallback de segurança se nada funcionar (raro)
    let d = new Date(cleanStr);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const processOCR = async () => {
    if (!ocrImage) return;
    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
      const base64Data = ocrImage.split(',')[1];

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg'
          }
        },
        { text: "Extract receipt info: date (YYYY-MM-DD), total value (number, negative if expense), store name, short description. Return ONLY a JSON with keys: date, value, merchant, description." }
      ]);

      const response = result.response;

      const text = response.text() || "{}";
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanJson);

      setManualData({
        data: data.date || new Date().toISOString().split('T')[0],
        historico: data.description || data.merchant || 'Compra Digitalizada',
        origem: data.merchant || 'OCR',
        valor: data.value ? String(data.value) : ''
      });
      setActiveTab('manual');
      setToast({ message: "✅ Dados extraídos com sucesso!", type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      setToast({ message: "❌ Falha ao processar imagem. Tente preencher manualmente.", type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const normalizeNumericValue = (val: string): number => {
    if (!val) return 0;
    let clean = val.replace(/[R$\s]/g, '').trim();
    if (!clean) return 0;

    // Detectar sinal negativo
    let isNegative = false;
    if (clean.startsWith('-') || clean.endsWith('-') || (clean.startsWith('(') && clean.endsWith(')')) || /[Dd]$/.test(clean)) {
      isNegative = true;
    }
    clean = clean.replace(/[()\-DdCc]/g, '');

    // Heurística de Localidade (BR vs US)
    const lastComma = clean.lastIndexOf(',');
    const lastDot = clean.lastIndexOf('.');

    if (lastComma > -1 && lastDot > -1) {
      if (lastComma > lastDot) {
        // Estilo BR: 1.234,56
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        // Estilo US: 1,234.56
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
      } else {
        // Decimal (ex: 123.45)
        // Não faz nada, parseFloat já entende ponto
      }
    }

    const num = parseFloat(clean);
    if (isNaN(num)) return 0;
    return isNegative ? -Math.abs(num) : Math.abs(num);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualData.historico || !manualData.valor || !manualData.data) {
      setToast({ message: "❌ Preencha todos os campos obrigatórios.", type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const valor = normalizeNumericValue(manualData.valor);
    if (isNaN(valor)) {
      setToast({ message: "❌ Valor inválido.", type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const newTransaction: Transaction = {
      id: generateId(),
      userId: userId,
      data: manualData.data,
      dependenciaOrigem: manualData.origem || 'Manual',
      historico: manualData.historico,
      dataBalancete: manualData.data,
      numeroDocumento: null,
      valor: valor,
      createdAt: new Date().toISOString()
    };

    setToast({ message: "✅ Transação adicionada com sucesso!", type: 'success' });
    setTimeout(() => {
      onImport([newTransaction]);
      setManualData({
        data: new Date().toISOString().split('T')[0],
        historico: '',
        origem: '',
        valor: ''
      });
      setOcrImage(null);
      setToast(null);
    }, 1000);
  };

  const processCSV = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const reader = new FileReader();
      const text = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file, 'UTF-8');
      });

      // Heurística de encoding: se tiver muitos caracteres estranhos ou o replacement char do UTF-8
      let finalLines = text.split('\n');
      if (text.includes('\uFFFD') || (text.match(/[\u0080-\u00FF]/g) || []).length === 0 && text.includes(';')) {
        const reader2 = new FileReader();
        const textIso = await new Promise<string>((resolve, reject) => {
          reader2.onload = () => resolve(reader2.result as string);
          reader2.onerror = reject;
          reader2.readAsText(file, 'ISO-8859-1');
        });
        finalLines = textIso.split('\n');
      }

      // Detectar delimitador baseado na primeira linha com conteúdo
      let delimiter = ',';
      for (const l of finalLines) {
        if (l.trim()) {
          const semicolons = (l.match(/;/g) || []).length;
          const commas = (l.match(/,/g) || []).length;
          delimiter = semicolons > commas ? ';' : ',';
          break;
        }
      }

      const newTransactions: Transaction[] = [];

      // Mapeamento de colunas baseado no cabeçalho
      let colIdx = { data: 0, historico: 1, valor: -1, debito: -1, credito: -1, origem: 1 };
      let headerFound = false;

      // Primeiro, tentamos achar o cabeçalho nas primeiras linhas
      let startIndex = 0;
      for (let i = 0; i < Math.min(finalLines.length, 10); i++) {
        const line = finalLines[i].trim();
        if (!line) continue;
        const cols = line.split(delimiter).map(v => v.replace(/^"|"$/g, '').trim().toUpperCase());

        const hasData = cols.some(c => c.includes('DATA') || c.includes('DATE'));
        const hasValor = cols.some(c => (c.includes('VALOR') || c.includes('VAL') || c.includes('MONTANTE') || c.includes('AMOUNT')) && !c.includes('SALDO') && !c.includes('BALANCE'));
        const hasDebCred = cols.some(c => c.includes('DEBIT') || c.includes('CREDIT') || c.includes('ENTRADA') || c.includes('SAÍDA') || c.includes('SAIDA'));

        if (hasData && (hasValor || hasDebCred)) {
          colIdx.data = cols.findIndex(c => c.includes('DATA') || c.includes('DATE'));
          colIdx.historico = cols.findIndex(c => c.includes('HIST') || c.includes('DESC') || c.includes('MEMO') || c.includes('DETAILS'));
          colIdx.valor = cols.findIndex(c => (c.includes('VALOR') || c.includes('VAL') || c.includes('MONTANTE') || c.includes('AMOUNT')) && !c.includes('SALDO') && !c.includes('BALANCE'));
          colIdx.debito = cols.findIndex(c => c.includes('DEBIT') || c.includes('SAIDA') || c.includes('SAÍDA'));
          colIdx.credito = cols.findIndex(c => c.includes('CREDIT') || c.includes('ENTRADA'));

          if (colIdx.historico === -1) colIdx.historico = 1;
          colIdx.origem = colIdx.historico;
          headerFound = true;
          // Se achamos o cabeçalho, as transações começam na linha seguinte
          startIndex = i + 1;
          break;
        }
      }

      // Se não achamos cabeçalho, começamos da linha 1 (pulamos a 0 por padrão)
      if (!headerFound) {
        startIndex = 1;
      }

      for (let i = startIndex; i < finalLines.length; i++) {
        const line = finalLines[i];
        const cleanLine = line.trim();
        if (!cleanLine) continue;

        const regex = new RegExp(`${delimiter}(?=(?:(?:[^"]*"){2})*[^"]*$)`);
        const rowValues = cleanLine.split(regex).map(v => v.replace(/^"|"$/g, '').trim());

        if (rowValues.length < 2) continue;

        let valorStr = '';
        let nature = '';
        let dataStr = '';
        let histStr = '';
        let origStr = '';

        if (headerFound) {
          dataStr = rowValues[colIdx.data] || '';
          histStr = rowValues[colIdx.historico] || '';
          origStr = rowValues[colIdx.origem] || 'Importado';

          if (colIdx.valor !== -1) {
            valorStr = rowValues[colIdx.valor] || '';
          } else if (colIdx.debito !== -1 || colIdx.credito !== -1) {
            // Lógica para colunas de Débito/Crédito separadas
            const dVal = colIdx.debito !== -1 ? normalizeNumericValue(rowValues[colIdx.debito]) : 0;
            const cVal = colIdx.credito !== -1 ? normalizeNumericValue(rowValues[colIdx.credito]) : 0;

            // Em arquivos de débito/crédito, se houver valor em débito, ele costuma ser positivo no CSV, mas deve ser negativo no app
            if (dVal !== 0) {
              valorStr = String(-Math.abs(dVal));
            } else if (cVal !== 0) {
              valorStr = String(Math.abs(cVal));
            }
          }

          // Scan nature: apenas colunas de tamanho 1 para evitar pegar do histórico
          rowValues.forEach(v => {
            const uv = v.toUpperCase();
            if (uv.length === 1 && (uv === 'C' || uv === 'D')) nature = uv;
          });
        } else {
          // Fallback inteligente aprimorado
          dataStr = rowValues[0];

          rowValues.forEach((val, idx) => {
            const upperVal = val.toUpperCase();
            if (upperVal === 'D' || upperVal === 'C') nature = upperVal;

            // Tentamos achar a coluna de valor (número que NÃO seja data e NÃO seja a primeira coluna de saldo provável)
            if (/[0-9]/.test(val) && !val.includes('/') && idx > 0) {
              // Evitamos pegar a última coluna se houver mais de uma (em BR a última costuma ser Saldo)
              const looksLikeValue = !cleanLine.toUpperCase().includes('SALDO') || idx < rowValues.length - 1;
              if (looksLikeValue) {
                const clean = val.replace(/[R$\s.]/g, '').replace(',', '.');
                if (!isNaN(parseFloat(clean))) valorStr = val;
              }
            }
          });

          const valorIdx = rowValues.indexOf(valorStr);
          histStr = rowValues.slice(1, valorIdx > 1 ? valorIdx : 3).join(' ');
          origStr = rowValues[1] || 'Importado';
        }

        if (!valorStr) continue;


        let valor = normalizeNumericValue(valorStr);
        if (nature === 'D' && valor > 0) valor = -valor;
        if (nature === 'C' && valor < 0) valor = Math.abs(valor);

        // CRÍTICO: Ignorar linhas de SALDO do banco (ex: "S A L D O", "SALDO", "Saldo Anterior")
        const histClean = histStr.toUpperCase().replace(/\s/g, '');
        if (histClean === 'SALDO' || histClean === 'SALDOANTERIOR' || histClean === 'SALDODODIA' || histStr.trim() === '') {
          continue;
        }

        const sanitize = (str: string) => str.replace(/[^\x20-\x7E\s\u00C0-\u00FF]/g, '');

        newTransactions.push({
          id: generateId(),
          userId: userId,
          data: normalizeDate(dataStr),
          dependenciaOrigem: sanitize(origStr),
          historico: sanitize(histStr),
          dataBalancete: normalizeDate(dataStr),
          numeroDocumento: null,
          valor: valor,
          createdAt: new Date().toISOString()
        });
      }

      if (newTransactions.length === 0) throw new Error("Arquivo vazio ou inválido.");
      setToast({ message: "✅ Importação concluída!", type: 'success' });
      setTimeout(() => {
        onImport(newTransactions);
        setFile(null);
        setToast(null);
      }, 1500);
    } catch (err: any) {
      setToast({ message: `❌ ${err.message}`, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative overflow-hidden flex flex-col max-h-[90vh]">
        {toast && (
          <div className={`absolute top-0 left-0 right-0 p-4 text-white text-sm font-medium text-center z-[110] transition-all ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {toast.message}
          </div>
        )}

        <div className="p-6 border-b border-gray-100 shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Nova Movimentação</h2>
              <p className="text-sm text-gray-500">Escolha como deseja adicionar.</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg mt-6">
            <button onClick={() => setActiveTab('manual')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Manual</button>
            <button onClick={() => setActiveTab('ocr')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'ocr' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Foto / OCR</button>
            <button onClick={() => setActiveTab('csv')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'csv' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>CSV</button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Data</label>
                  <input type="date" value={manualData.data} onChange={(e) => setManualData({ ...manualData, data: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Valor</label>
                  <input type="number" step="0.01" placeholder="R$ 0,00" value={manualData.valor} onChange={(e) => setManualData({ ...manualData, valor: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Descrição</label>
                <input type="text" placeholder="Ex: Mercado" value={manualData.historico} onChange={(e) => setManualData({ ...manualData, historico: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Origem / Loja</label>
                <input type="text" placeholder="Ex: Carrefour" value={manualData.origem} onChange={(e) => setManualData({ ...manualData, origem: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg active:scale-95 transition-all">Salvar Transação</button>
            </form>
          )}

          {activeTab === 'ocr' && (
            <div className="space-y-6 text-center">
              <div
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer ${ocrImage ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                onClick={() => ocrInputRef.current?.click()}
              >
                {ocrImage ? (
                  <img src={ocrImage} alt="Recibo" className="max-h-48 rounded-lg shadow-md" />
                ) : (
                  <>
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                    <p className="text-sm font-medium text-gray-700">Tire uma foto ou selecione o recibo</p>
                    <p className="text-xs text-gray-400">Nossa IA extrairá os dados para você</p>
                  </>
                )}
                <input type="file" ref={ocrInputRef} className="hidden" accept="image/*" onChange={handleOcrImageChange} />
              </div>
              <button onClick={processOCR} disabled={!ocrImage || loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Digitalizar com Gemini IA"}
              </button>
            </div>
          )}

          {activeTab === 'csv' && (
            <div className="space-y-6">
              <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer border-gray-200 hover:bg-gray-50`} onClick={() => fileInputRef.current?.click()}>
                <p className="text-sm font-medium text-gray-700">{file ? file.name : 'Clique para selecionar seu CSV'}</p>
                <input type="file" className="hidden" accept=".csv" ref={fileInputRef} onChange={handleFileChange} />
              </div>
              <button onClick={processCSV} disabled={!file || loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 shadow-lg active:scale-95 transition-all">Processar Arquivo</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
