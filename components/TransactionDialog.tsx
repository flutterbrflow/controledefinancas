
import React, { useState, useRef } from 'react';
import { Transaction } from '../types';
import { GoogleGenAI } from "@google/genai";

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
    let d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        d = new Date(year, month, day);
      }
    }
    return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
  };

  const processOCR = async () => {
    if (!ocrImage) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const base64Data = ocrImage.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
            { text: "Extract receipt info: date (YYYY-MM-DD), total value (number, negative if expense), store name, short description. Return ONLY a JSON with keys: date, value, merchant, description." }
          ]
        }
      });

      const text = response.text || "{}";
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

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualData.historico || !manualData.valor || !manualData.data) {
      setToast({ message: "❌ Preencha todos os campos obrigatórios.", type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const valor = parseFloat(manualData.valor);
    if (isNaN(valor)) {
      setToast({ message: "❌ Valor inválido.", type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
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
      const text = await file.text();
      const lines = text.split('\n');
      const newTransactions: Transaction[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(',');
        if (values.length < 6) continue;
        const [data, depOrigem, historico, dataBalancete, numDoc, valorStr] = values;
        const valor = parseFloat(valorStr.replace(/"/g, '').replace(/[R$\s]/g, ''));
        if (isNaN(valor)) continue;
        newTransactions.push({
          id: crypto.randomUUID(),
          userId: userId,
          data: normalizeDate(data.trim()),
          dependenciaOrigem: depOrigem.trim(),
          historico: historico.trim(),
          dataBalancete: dataBalancete.trim() ? normalizeDate(dataBalancete.trim()) : null,
          numeroDocumento: numDoc.trim() || null,
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
                  <input type="date" value={manualData.data} onChange={(e) => setManualData({...manualData, data: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Valor</label>
                  <input type="number" step="0.01" placeholder="R$ 0,00" value={manualData.valor} onChange={(e) => setManualData({...manualData, valor: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Descrição</label>
                <input type="text" placeholder="Ex: Mercado" value={manualData.historico} onChange={(e) => setManualData({...manualData, historico: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Origem / Loja</label>
                <input type="text" placeholder="Ex: Carrefour" value={manualData.origem} onChange={(e) => setManualData({...manualData, origem: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
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
