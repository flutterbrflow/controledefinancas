import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🏗️  Iniciando build de produção...');

try {
    // 1. Executar vite build
    execSync('vite build', { stdio: 'inherit' });

    // 2. Copiar pasta API para dist/api
    const sourceApi = path.join(__dirname, 'api');
    const destApi = path.join(__dirname, 'dist', 'api');

    console.log('📂 Copiando arquivos da API para dist/api...');

    if (fs.existsSync(destApi)) {
        fs.rmSync(destApi, { recursive: true, force: true });
    }
    fs.mkdirSync(destApi, { recursive: true });

    // Função de cópia recursiva que ignora 'uploads' para produção limpa ou copia tudo?
    // Vamos copiar tudo exceto uploads locais de dev se quiser, mas por segurança vamos copiar tudo.
    fs.cpSync(sourceApi, destApi, { recursive: true });

    console.log('✅ Build concluído com sucesso! A pasta dist/ agora contém o frontend e a API.');
    console.log('🚀 Para testar em produção, certifique-se de servir a pasta dist/ via servidor web (Apache/Nginx/PHP).');

} catch (error) {
    console.error('❌ Erro durante o build:', error);
    process.exit(1);
}
