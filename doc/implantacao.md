# 🚀 Implantação e Solução de Problemas

## Implantação

### Desenvolvimento Local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
# Edite .env.local:
VITE_GEMINI_API_KEY=sua_chave_aqui

# 3. Rodar em modo dev
npm run dev

# 4. Acessar
http://localhost:3000
```

### Produção no QNAP NAS

```bash
# 1. Build de produção
npm run build

# 2. Copiar dist/ para QNAP
# Ex: \\192.168.x.x\Web\controledefinancas\

# 3. Configurar backend PHP
# Copiar api/ para mesmo diretório

# 4. Configurar banco de dados
# Importar schema.sql no MySQL do QNAP (porta 3307)
```

**Configurações Específicas QNAP**:

- **CORS**: Configurado em `api/cors.php`
- **Porta MySQL**: `127.0.0.1:3307` (TCP, não socket)
- **Proxy reverso**: Opcional via Nginx

---

## 🔧 Solução de Problemas

### Problema: IA retorna erro 404
**Solução**: Verificar se modelo é `gemini-2.5-flash` (não 1.5)

### Problema: CSV não importa
**Solução**: 
- Verificar encoding (UTF-8 ou Windows-1252)
- Verificar delimitador (`;` ou `,`)

### Problema: Saldo não bate com banco
**Solução**: 
1. Apagar tudo
2. Adicionar "Saldo Inicial" manualmente
3. Importar CSV

### Problema: Build falha
**Solução**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```
