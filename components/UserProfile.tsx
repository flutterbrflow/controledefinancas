
// Componente de Perfil do Usuário - permite editar dados e fazer upload de avatar
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';

interface UserProfileProps {
    user: User;
    onUpdateUser: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateUser }) => {
    // Estados para os dados do formulário
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [avatar, setAvatar] = useState(user.avatar || '');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar || null);

    // Estados de controle
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Referência para o input de arquivo
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Função para lidar com seleção de arquivo de avatar
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validação de tipo
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
            setMessage({ type: 'error', text: 'Tipo de arquivo não suportado. Use JPG, PNG ou WEBP.' });
            return;
        }

        // Validação de tamanho (2MB)
        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Arquivo muito grande. Tamanho máximo: 2MB.' });
            return;
        }

        // Gera preview local
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Faz upload imediatamente
        handleAvatarUpload(file);
    };

    // Função para fazer upload do avatar
    const handleAvatarUpload = async (file: File) => {
        setLoading(true);
        setMessage(null);

        try {
            const response = await apiService.uploadAvatar(user.id, file);
            setAvatar(response.avatar);

            // Atualiza o usuário globalmente
            const updatedUser = { ...user, avatar: response.avatar };
            onUpdateUser(updatedUser);

            setMessage({ type: 'success', text: 'Avatar atualizado com sucesso!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Erro ao fazer upload do avatar.' });
            setAvatarPreview(user.avatar || null);
        } finally {
            setLoading(false);
        }
    };

    // Função para atualizar dados do usuário
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !email.trim()) {
            setMessage({ type: 'error', text: 'Nome e email são obrigatórios.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            await apiService.updateUser(user.id, { name, email });

            // Atualiza o usuário globalmente
            const updatedUser = { ...user, name, email };
            onUpdateUser(updatedUser);

            setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Erro ao atualizar dados.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Meu Perfil</h2>
                <p className="text-gray-500">Gerencie suas informações pessoais e avatar.</p>
            </div>

            {/* Mensagem de feedback */}
            {message && (
                <div className={`p-4 rounded-xl border animate-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Avatar Section */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg text-gray-900 mb-6">Foto de Perfil</h3>

                    <div className="flex flex-col items-center gap-6">
                        <div
                            className="relative group cursor-pointer"
                            onClick={() => !loading && fileInputRef.current?.click()}
                        >
                            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-blue-100 shadow-lg group-hover:border-blue-300 transition-all">
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-5xl font-bold">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Overlay de hover */}
                            {!loading && (
                                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            )}

                            {/* Overlay de loading durante upload */}
                            {loading && (
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            className="hidden"
                            onChange={handleFileSelect}
                        />

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Enviando...' : 'Alterar Foto'}
                        </button>

                        <p className="text-xs text-gray-400 text-center">
                            JPG, PNG ou WEBP. Máximo 2MB.
                        </p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg text-gray-900 mb-6">Informações Pessoais</h3>

                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Nome Completo
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                placeholder="Seu nome"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                E-mail
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>

                    {/* Informações Adicionais */}
                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <h4 className="font-semibold text-gray-900 mb-4">Informações da Conta</h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">ID:</span>
                                <span className="font-mono text-xs text-gray-600">{user.id.substring(0, 8)}...</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Status:</span>
                                <span className="text-green-600 font-medium">✓ Ativo</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
