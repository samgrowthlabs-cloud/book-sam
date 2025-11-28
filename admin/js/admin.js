// admin.js - SISTEMA COMPLETO COM PROTEÇÃO DE HIERARQUIA
class AdminSystem {
    constructor() {
        this.currentUser = null;
        this.allUsers = [];
        this.userLevel = '';
    }

    async init() {
        console.log('🚀 Iniciando sistema admin...');
        await this.verifyAdminAccess();
        await this.loadUsers();
        this.setupEventListeners();
        console.log('✅ Sistema admin inicializado');
    }

    async verifyAdminAccess() {
        const userData = localStorage.getItem('usuarioLogado');
        if (!userData) {
            alert('❌ Você precisa estar logado para acessar o painel admin');
            window.location.href = '../login.html';
            return;
        }

        this.currentUser = JSON.parse(userData);
        
        const { data: user, error } = await window.supabase
            .from('usuarios')
            .select('access_level')
            .eq('id', this.currentUser.id)
            .single();

        if (error || !user || (user.access_level !== 'admin' && user.access_level !== 'moderator')) {
            alert('❌ Acesso negado. Apenas administradores e moderadores.');
            window.location.href = '../index.html';
            return;
        }

        this.userLevel = user.access_level;
    }

    // VERIFICA SE É UMA AÇÃO EM SI MESMO
    isSelfAction(targetUserId) {
        return this.currentUser && targetUserId.toString() === this.currentUser.id.toString();
    }

    // VERIFICA SE PODE AGIR NO USUÁRIO (MODERADOR NÃO PODE MEXER EM ADMINS)
    canPerformActionOnUser(targetUser) {
        if (!targetUser) return false;
        
        // 1. Não pode agir em si mesmo
        if (this.isSelfAction(targetUser.id)) {
            return false;
        }
        
        // 2. Moderador NUNCA pode agir em administradores
        if (this.userLevel === 'moderator' && targetUser.access_level === 'admin') {
            return false;
        }
        
        return true;
    }

    // VERIFICA SE PODE AGIR NO CONTEÚDO (MODERADOR NÃO PODE MEXER EM CONTEÚDOS DE ADMINS)
    canPerformActionOnContent(contentOwnerId) {
        if (!contentOwnerId) return false;
        
        const contentOwner = this.allUsers.find(u => u.id.toString() === contentOwnerId.toString());
        if (!contentOwner) return false;
        
        // Moderador NUNCA pode mexer em conteúdos de administradores
        if (this.userLevel === 'moderator' && contentOwner.access_level === 'admin') {
            return false;
        }
        
        return true;
    }

    async loadUsers() {
        try {
            const { data: users, error } = await window.supabase
                .from('usuarios')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.allUsers = users || [];
            this.displayUsers(this.allUsers);
            this.updateStats(this.allUsers);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            alert('Erro ao carregar usuários');
        }
    }

    updateStats(users) {
        const totalUsers = users.length;
        const bannedUsers = users.filter(u => u.is_banned).length;
        const adminUsers = users.filter(u => u.access_level === 'admin').length;
        const moderatorUsers = users.filter(u => u.access_level === 'moderator').length;
        const staffUsers = adminUsers + moderatorUsers;

        const totalElement = document.getElementById('totalUsers');
        const bannedElement = document.getElementById('bannedUsers');
        const adminElement = document.getElementById('adminUsers');

        if (totalElement) totalElement.textContent = totalUsers;
        if (bannedElement) bannedElement.textContent = bannedUsers;
        if (adminElement) adminElement.textContent = staffUsers;
    }

    displayUsers(users) {
        const container = document.getElementById('usersContainer');
        if (!container) return;

        if (users.length === 0) {
            container.innerHTML = '<p>Nenhum usuário encontrado.</p>';
            return;
        }

        container.innerHTML = users.map(user => {
            const isCurrentUser = this.isSelfAction(user.id);
            const isAdmin = user.access_level === 'admin';
            const canActOnUser = this.canPerformActionOnUser(user);
            const isProtectedAdmin = isAdmin && this.userLevel === 'moderator';

            return `
                <div class="user-card ${user.is_banned ? 'banned' : ''} ${isProtectedAdmin ? 'admin-protected' : ''} ${isCurrentUser ? 'current-user' : ''}">
                    <div class="user-info">
                        <div class="user-header">
                            <h4>
                                <a href="javascript:void(0)" onclick="adminSystem.viewUserContents('${user.id}')" class="user-name-link">
                                    ${user.usuario || 'Sem nome'}
                                </a>
                                ${isCurrentUser ? '<span class="you-badge">(Você)</span>' : ''}
                            </h4>
                            <div class="user-badges">
                                ${isAdmin ? '<span class="badge admin-badge">👑 Admin</span>' : ''}
                                ${user.access_level === 'moderator' ? '<span class="badge moderator-badge">🛡️ Moderador</span>' : ''}
                                ${user.verified ? '<span class="badge verified-badge">✅ Verificado</span>' : ''}
                                ${user.is_banned ? '<span class="badge banned-badge">🚫 Banido</span>' : ''}
                                ${isProtectedAdmin ? '<span class="badge protected-badge">🛡️ Protegido</span>' : ''}
                                ${isCurrentUser ? '<span class="badge self-badge">👤 Você</span>' : ''}
                            </div>
                        </div>
                        
                        <div class="user-details">
                            <p><strong>ID:</strong> ${user.id}</p>
                            <p><strong>Email:</strong> ${user.email || 'Não informado'}</p>
                            <p><strong>Nível:</strong> ${user.access_level}</p>
                            <p><strong>Registro:</strong> ${new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                            <p><strong>Status:</strong> ${user.is_banned ? '🚫 Banido' : '✅ Ativo'}</p>
                            <p><strong>Verificado:</strong> ${user.verified ? '✅ Sim' : '❌ Não'}</p>
                            
                            ${isProtectedAdmin ? `
                                <div class="protected-warning">
                                    <strong>🛡️ CONTA PROTEGIDA</strong>
                                    <p>Moderadores não podem gerenciar contas de administradores.</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="user-actions">
                        ${canActOnUser ? `
                            <!-- AÇÕES BÁSICAS (VERIFICAR/DESVERIFICAR) -->
                            ${!user.verified ? `
                                <button class="btn btn-verify" onclick="adminSystem.verifyUser('${user.id}')">✅ Verificar</button>
                            ` : `
                                <button class="btn btn-unverify" onclick="adminSystem.unverifyUser('${user.id}')">❌ Desverificar</button>
                            `}
                            
                            <!-- BANIR/DESBANIR -->
                            ${!user.is_banned ? `
                                <button class="btn btn-ban" onclick="adminSystem.banUserPrompt('${user.id}')">🚫 Banir</button>
                            ` : `
                                <button class="btn btn-unban" onclick="adminSystem.unbanUser('${user.id}')">✅ Desbanir</button>
                            `}
                        ` : ''}

                        <!-- AÇÕES APENAS PARA ADMINISTRADORES -->
                        ${this.userLevel === 'admin' && canActOnUser ? `
                            <button class="btn btn-danger" onclick="adminSystem.deleteUser('${user.id}')">🗑️ Excluir</button>
                            
                            <select onchange="adminSystem.changeAccessLevel('${user.id}', this.value)" class="access-select">
                                <option value="user" ${user.access_level === 'user' ? 'selected' : ''}>👤 Usuário</option>
                                <option value="moderator" ${user.access_level === 'moderator' ? 'selected' : ''}>🛡️ Moderador</option>
                                <option value="admin" ${user.access_level === 'admin' ? 'selected' : ''}>👑 Admin</option>
                            </select>
                        ` : ''}

                        ${!canActOnUser && !isCurrentUser ? `
                            <div class="protected-actions">
                                <button class="btn btn-protected" disabled>🛡️ Protegido</button>
                                <small>${isProtectedAdmin ? 'Apenas administradores' : 'Ação não permitida'}</small>
                            </div>
                        ` : ''}

                        ${isCurrentUser ? `
                            <div class="self-actions">
                                <button class="btn btn-self" disabled>👤 Sua Conta</button>
                                <small>Você não pode realizar ações em si mesmo</small>
                            </div>
                        ` : ''}

                        <button class="btn btn-info" onclick="adminSystem.viewUserDetails('${user.id}')">📊 Detalhes</button>
                        <button class="btn btn-contents" onclick="adminSystem.viewUserContents('${user.id}')">📚 Conteúdos</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // AÇÕES DE USUÁRIO COM VERIFICAÇÃO DE PERMISSÃO
    async verifyUser(userId) {
        if (!this.checkUserPermission(userId, 'verificar')) return;
        
        try {
            const { error } = await window.supabase.rpc('rpc_verify_user', {
                p_target: Number(userId),
                p_verified: true,
                p_notes: 'Verified via admin panel'
            });
            if (error) throw error;
            await this.loadUsers();
            alert('✅ Usuário verificado!');
        } catch (err) {
            alert('❌ Erro: ' + err.message);
        }
    }

    async unverifyUser(userId) {
        if (!this.checkUserPermission(userId, 'desverificar')) return;
        
        try {
            const { error } = await window.supabase.rpc('rpc_verify_user', {
                p_target: Number(userId),
                p_verified: false,
                p_notes: 'Unverified via admin panel'
            });
            if (error) throw error;
            await this.loadUsers();
            alert('✅ Verificação removida!');
        } catch (err) {
            alert('❌ Erro: ' + err.message);
        }
    }

    banUserPrompt(userId) {
        if (!this.checkUserPermission(userId, 'banir')) return;
        
        const reason = prompt('Motivo do banimento:');
        if (!reason) return;
        
        const duration = prompt('Duração (dias) ou "permanent":');
        if (!duration) return;

        this.banUser(userId, reason, duration);
    }

    async banUser(userId, reason, duration) {
        if (!this.checkUserPermission(userId, 'banir')) return;
        
        try {
            let bannedUntil = null;
            if (duration !== 'permanent') {
                const days = parseInt(duration);
                const dt = new Date();
                dt.setDate(dt.getDate() + days);
                bannedUntil = dt.toISOString();
            }

            const { error } = await window.supabase.rpc('rpc_ban_user', {
                p_target: Number(userId),
                p_reason: reason,
                p_until: bannedUntil
            });
            if (error) throw error;

            await this.loadUsers();
            alert('✅ Usuário banido!');
        } catch (err) {
            alert('❌ Erro: ' + err.message);
        }
    }

    async unbanUser(userId) {
        if (!this.checkUserPermission(userId, 'desbanir')) return;
        
        try {
            const { error } = await window.supabase.rpc('rpc_unban_user', {
                p_target: Number(userId),
                p_note: 'Unbanned via admin panel'
            });
            if (error) throw error;

            await this.loadUsers();
            alert('✅ Usuário desbanido!');
        } catch (err) {
            alert('❌ Erro: ' + err.message);
        }
    }

    async deleteUser(userId) {
        if (!this.checkUserPermission(userId, 'excluir')) return;
        
        if (!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;

        try {
            const { error } = await window.supabase.rpc('rpc_delete_user', {
                p_target: Number(userId),
                p_reason: 'Deleted by admin'
            });
            if (error) throw error;

            await this.loadUsers();
            alert('✅ Usuário excluído!');
        } catch (err) {
            alert('❌ Erro: ' + err.message);
        }
    }

    async changeAccessLevel(userId, newLevel) {
        if (!this.checkUserPermission(userId, 'alterar nível')) return;
        
        try {
            const { error } = await window.supabase.rpc('rpc_set_access_level', {
                p_target: Number(userId),
                p_new_level: newLevel
            });
            if (error) throw error;
            await this.loadUsers();
            alert('✅ Nível alterado!');
        } catch (err) {
            alert('❌ Erro: ' + err.message);
        }
    }

    // VERIFICAÇÃO CENTRALIZADA DE PERMISSÕES
    checkUserPermission(userId, action) {
        const targetUser = this.allUsers.find(u => u.id.toString() === userId.toString());
        
        if (!targetUser) {
            alert('❌ Usuário não encontrado!');
            return false;
        }

        // 1. Verificar self-action
        if (this.isSelfAction(userId)) {
            alert(`❌ Você não pode ${action} sua própria conta!`);
            return false;
        }

        // 2. Verificar se moderador está tentando agir em admin
        if (this.userLevel === 'moderator' && targetUser.access_level === 'admin') {
            alert(`❌ Moderadores não podem ${action} administradores!`);
            return false;
        }

        // 3. Verificar permissões específicas
        if (action === 'excluir' && this.userLevel !== 'admin') {
            alert('❌ Apenas administradores podem excluir usuários!');
            return false;
        }

        if (action === 'alterar nível' && this.userLevel !== 'admin') {
            alert('❌ Apenas administradores podem alterar níveis de acesso!');
            return false;
        }

        return true;
    }

    viewUserDetails(userId) {
        const user = this.allUsers.find(u => u.id.toString() === userId.toString());
        if (user) {
            const details = `
👤 NOME: ${user.usuario || 'Sem nome'}
📧 EMAIL: ${user.email || 'Não informado'}
🆔 ID: ${user.id}
🎯 NÍVEL: ${user.access_level}
📅 REGISTRO: ${new Date(user.created_at).toLocaleString('pt-BR')}
✅ VERIFICADO: ${user.verified ? 'Sim' : 'Não'}
🚫 BANIDO: ${user.is_banned ? 'Sim' : 'Não'}
${user.is_banned ? `📋 MOTIVO: ${user.ban_reason || 'Não especificado'}` : ''}
            `.trim();
            
            alert('📊 DETALHES DO USUÁRIO\n\n' + details);
        }
    }

    // GESTÃO DE CONTEÚDOS COM PROTEÇÃO
    async viewUserContents(userId) {
        const user = this.allUsers.find(u => u.id.toString() === userId.toString());
        if (!user) return;

        try {
            // Carregar artigos
            const { data: artigos, error: artigosError } = await window.supabase
                .from('artigos')
                .select('*')
                .eq('autor_id', userId)
                .order('created_at', { ascending: false });

            if (artigosError) throw artigosError;

            // Carregar livros
            const { data: livros, error: livrosError } = await window.supabase
                .from('livros')
                .select('*')
                .eq('autor_id', userId)
                .order('created_at', { ascending: false });

            if (livrosError) throw livrosError;

            this.showContentsModal(user, artigos || [], livros || []);
            
        } catch (error) {
            console.error('Erro ao carregar conteúdos:', error);
            alert('Erro ao carregar conteúdos');
        }
    }

    showContentsModal(user, artigos, livros) {
        if (!document.getElementById('contentsModal')) {
            const modalHTML = `
                <div id="contentsModal" class="modal">
                    <div class="modal-content large-modal">
                        <div class="modal-header">
                            <h3>📚 Conteúdos de ${user.usuario}</h3>
                            <span class="close">&times;</span>
                        </div>
                        <div class="modal-body" id="contentsModalBody">
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            document.getElementById('contentsModal').querySelector('.close').onclick = () => {
                document.getElementById('contentsModal').style.display = 'none';
            };
            
            window.onclick = (e) => {
                if (e.target === document.getElementById('contentsModal')) {
                    document.getElementById('contentsModal').style.display = 'none';
                }
            };
        }

        const canManageContent = this.canPerformActionOnContent(user.id);
        const modalBody = document.getElementById('contentsModalBody');
        
        modalBody.innerHTML = `
            <div class="contents-stats">
                <div class="stat-item">
                    <strong>${artigos.length}</strong> Artigos
                </div>
                <div class="stat-item">
                    <strong>${livros.length}</strong> Livros
                </div>
                <div class="stat-item">
                    <strong>${artigos.length + livros.length}</strong> Total
                </div>
            </div>

            ${!canManageContent && user.access_level === 'admin' ? `
                <div class="protected-content-warning">
                    <strong>🛡️ CONTEÚDOS PROTEGIDOS</strong>
                    <p>Moderadores não podem gerenciar conteúdos de administradores.</p>
                </div>
            ` : ''}

            <div class="content-section">
                <h4>📝 Artigos (${artigos.length})</h4>
                ${artigos.length > 0 ? `
                    <div class="content-list">
                        ${artigos.map(artigo => `
                            <div class="content-item">
                                <div class="content-info">
                                    <h5>${artigo.titulo || 'Sem título'}</h5>
                                    <p>${new Date(artigo.created_at).toLocaleDateString('pt-BR')} • ${artigo.publicado ? '✅ Publicado' : '📝 Rascunho'}</p>
                                </div>
                                <div class="content-actions">
                                    <button class="btn btn-sm" onclick="adminSystem.viewContentDetail('artigo', '${artigo.id}')">👁️ Ver</button>
                                    ${canManageContent ? `
                                        <button class="btn btn-sm btn-danger" onclick="adminSystem.deleteContent('artigo', '${artigo.id}', '${user.id}')">🗑️ Excluir</button>
                                    ` : `
                                        <button class="btn btn-sm btn-protected" disabled>🛡️ Protegido</button>
                                    `}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p>Nenhum artigo publicado.</p>'}
            </div>

            <div class="content-section">
                <h4>📚 Livros (${livros.length})</h4>
                ${livros.length > 0 ? `
                    <div class="content-list">
                        ${livros.map(livro => `
                            <div class="content-item">
                                <div class="content-info">
                                    <h5>${livro.titulo || 'Sem título'}</h5>
                                    <p>${livro.autor || 'Autor não informado'} • ${new Date(livro.created_at).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div class="content-actions">
                                    <button class="btn btn-sm" onclick="adminSystem.viewContentDetail('livro', '${livro.id}')">👁️ Ver</button>
                                    ${canManageContent ? `
                                        <button class="btn btn-sm btn-danger" onclick="adminSystem.deleteContent('livro', '${livro.id}', '${user.id}')">🗑️ Excluir</button>
                                    ` : `
                                        <button class="btn btn-sm btn-protected" disabled>🛡️ Protegido</button>
                                    `}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p>Nenhum livro publicado.</p>'}
            </div>
        `;

        document.getElementById('contentsModal').style.display = 'block';
    }

    async viewContentDetail(tipo, contentId) {
        try {
            let content, table;
            
            if (tipo === 'artigo') {
                table = 'artigos';
            } else if (tipo === 'livro') {
                table = 'livros';
            }

            const { data, error } = await window.supabase
                .from(table)
                .select('*')
                .eq('id', contentId)
                .single();

            if (error) throw error;
            content = data;

            if (content) {
                const details = tipo === 'artigo' ? `
📖 TÍTULO: ${content.titulo}
📅 DATA: ${new Date(content.created_at).toLocaleString('pt-BR')}
✅ STATUS: ${content.publicado ? 'Publicado' : 'Rascunho'}
📂 CATEGORIA: ${content.categoria || 'Não definida'}

📝 CONTEÚDO:
${content.conteudo || 'Sem conteúdo'}
                ` : `
📖 TÍTULO: ${content.titulo}
✍️ AUTOR: ${content.autor || 'Não informado'}
📚 GÊNERO: ${content.genero || 'Não informado'}
📅 DATA: ${new Date(content.created_at).toLocaleString('pt-BR')}

📖 DESCRIÇÃO:
${content.descricao || 'Sem descrição'}
                `;

                alert(`DETALHES DO ${tipo.toUpperCase()}\n\n${details}`);
            }
        } catch (error) {
            alert('Erro ao carregar conteúdo');
        }
    }

    async deleteContent(tipo, contentId, ownerId) {
        // VERIFICAR SE PODE EXCLUIR O CONTEÚDO
        if (!this.canPerformActionOnContent(ownerId)) {
            alert('❌ Você não tem permissão para excluir este conteúdo!');
            return;
        }

        if (!confirm(`Excluir este ${tipo}?`)) return;

        try {
            let table = tipo === 'artigo' ? 'artigos' : 'livros';
            
            const { error } = await window.supabase
                .from(table)
                .delete()
                .eq('id', contentId);

            if (error) throw error;

            alert(`✅ ${tipo} excluído!`);
            // Fechar modal
            document.getElementById('contentsModal').style.display = 'none';
            
        } catch (error) {
            alert('❌ Erro ao excluir conteúdo');
        }
    }

    // FILTROS E BUSCA
    filterByType(type) {
        let filtered = [];
        switch (type) {
            case 'all': filtered = this.allUsers; break;
            case 'banned': filtered = this.allUsers.filter(user => user.is_banned); break;
            case 'admins': filtered = this.allUsers.filter(user => user.access_level === 'admin'); break;
            case 'moderators': filtered = this.allUsers.filter(user => user.access_level === 'moderator'); break;
            case 'verified': filtered = this.allUsers.filter(user => user.verified); break;
            case 'unverified': filtered = this.allUsers.filter(user => !user.verified); break;
            default: filtered = this.allUsers;
        }
        this.displayUsers(filtered);
        this.updateStats(filtered);
    }

    filterUsers() {
        const searchInput = document.getElementById('userSearch');
        if (!searchInput) return;
        
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (searchTerm === '') {
            this.displayUsers(this.allUsers);
            this.updateStats(this.allUsers);
        } else {
            const filtered = this.allUsers.filter(user => 
                user.usuario && user.usuario.toLowerCase().includes(searchTerm) ||
                user.email && user.email.toLowerCase().includes(searchTerm)
            );
            this.displayUsers(filtered);
            this.updateStats(filtered);
        }
    }

    clearSearch() {
        const searchInput = document.getElementById('userSearch');
        if (searchInput) searchInput.value = '';
        this.displayUsers(this.allUsers);
        this.updateStats(this.allUsers);
    }

    setupEventListeners() {
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', function() {
                this.closest('.modal').style.display = 'none';
            });
        });

        const searchInput = document.getElementById('userSearch');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterUsers());
        }
    }
}

// INICIALIZAÇÃO
let adminSystem;
document.addEventListener('DOMContentLoaded', function() {
    adminSystem = new AdminSystem();
    adminSystem.init();
});