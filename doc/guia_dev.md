# 👨‍💻 Guia de Desenvolvimento

## Convenções de Código

- ✅ **Comentários em português**
- ✅ **Mensagens de erro em português**
- ✅ **Tipos TypeScript para tudo**
- ✅ **Componentes funcionais + Hooks**
- ✅ **Estado local com useState**
- ✅ **Efeitos com useEffect**

## Como Adicionar Nova Funcionalidade

1.  **Criar componente** em `components/`
2.  **Definir tipos** em `types.ts`
3.  **Criar endpoint** em `api/`
4.  **Adicionar rota** no `App.tsx`
5.  **Atualizar navegação** em `Layout.tsx`

### Exemplo: Adicionar Nova Categoria

```typescript
// 1. Atualizar types.ts
export interface Transaction {
  // ... campos existentes
  categoria?: string;  // NOVO
}

// 2. Atualizar schema.sql
ALTER TABLE transactions ADD categoria VARCHAR(100);

// 3. Atualizar componente TransactionDialog.tsx
const [categoria, setCategoria] = useState('');

// 4. Atualizar apiService.ts se necessário
```

---

## 🤖 Integração com IA

### Google Gemini AI 2.5 Flash

**Biblioteca**: `@google/generative-ai` v0.24.1

#### Configuração

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
```

#### Casos de Uso

1.  **Insights Financeiros (Reports.tsx)**: Analisa transações e dá conselhos.
2.  **Planejamento de Metas (Goals.tsx)**: Sugere plano de ação para atingir metas.
3.  **OCR de Recibos (TransactionDialog.tsx)**: Extrai dados de imagens/PDFs.

**Modelo**: `gemini-2.5-flash`
- ✅ 1,048,576 tokens entrada
- ✅ 65,536 tokens saída
- ✅ Suporta texto, imagens, vídeo, áudio
- ✅ Limites free tier adequados
