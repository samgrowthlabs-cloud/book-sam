// admin.js - Versão RPC-compliant (usa rpc_* no Supabase)
class AdminSystem {
    constructor() {
        this.currentUser = null;
        this.allUsers = [];
        this.userLevel = ''; // 'admin' ou 'moderator'
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
        console.log('👤 Usuário logado:', this.currentUser);
        
        const { data: user, error } = await window.supabase
            .from('usuarios')
            .select('access_level')
            .eq('id', this.currentUser.id)
            .single();

        if (error || !user || (user.access_level !== 'admin' && user.access_level !== 'moderator')) {
            alert('❌ Acesso negado. Apenas administradores e moderadores podem acessar esta página.');
            window.location.href = '../index.html';
            return;
        }

        this.userLevel = user.access_level;
        console.log('✅ Acesso permitido. Nível:', this.userLevel);
    }

    async loadUsers() {
        try {
            console.log('📥 Carregando usuários...');
            const { data: users, error } = await window.supabase
                .from('usuarios')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.allUsers = users || [];
            console.log(`✅ ${this.allUsers.length} usuários carregados`);
            this.displayUsers(this.allUsers);
            this.updateStats(this.allUsers); // ATUALIZAR ESTATÍSTICAS
        } catch (error) {
            console.error('❌ Erro ao carregar usuários:', error);
            alert('Erro ao carregar usuários');
        }
    }

    updateStats(users) {
        console.log('📊 Atualizando estatísticas...', users);
        
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
            const isCurrentUser = this.currentUser && user.id === this.currentUser.id;
            const isAdmin = user.access_level === 'admin';
            const canActOnUser = !isAdmin || (this.userLevel === 'admin' && !isCurrentUser);

            return `
                <div class="user-card ${user.is_banned ? 'banned' : ''} ${isAdmin ? 'admin-protected' : ''}">
                    <div class="user-info">
                        <div class="user-header">
                            <h4>${user.usuario || 'Sem nome'} ${isCurrentUser ? '<span class="you-badge">(Você)</span>' : ''}</h4>
                            <div class="user-badges">
                                ${isAdmin ? '<span class="badge admin-badge">👑 Admin</span>' : ''}
                                ${user.access_level === 'moderator' ? '<span class="badge moderator-badge">🛡️ Moderador</span>' : ''}
                                ${user.verified ? '<span class="badge verified-badge">✅ Verificado</span>' : ''}
                                ${user.is_banned ? '<span class="badge banned-badge">🚫 Banido</span>' : ''}
                                ${user.is_deleted ? '<span class="badge deleted-badge">🗑️ Deletado</span>' : ''}
                                ${!canActOnUser ? '<span class="badge protected-badge">🛡️ Protegido</span>' : ''}
                            </div>
                        </div>
                        
                        <div class="user-details">
                            <p><strong>ID:</strong> ${user.id}</p>
                            <p><strong>Nível:</strong> ${isAdmin ? '👑 Administrador' : user.access_level === 'moderator' ? '🛡️ Moderador' : '👤 Usuário'}</p>
                            <p><strong>Registro:</strong> ${new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                            <p><strong>Status:</strong> ${user.is_banned ? '🚫 Banido' : user.is_deleted ? '🗑️ Deletado' : '✅ Ativo'}</p>
                            <p><strong>Verificado:</strong> ${user.verified ? '✅ Sim' : '❌ Não'}</p>
                            
                            ${!canActOnUser ? `
                                <div class="protected-info">
                                    <strong>🛡️ CONTA PROTEGIDA</strong>
                                    <p>Esta conta pertence a um administrador e só pode ser gerenciada por outros administradores.</p>
                                </div>
                            ` : ''}

                            ${user.is_banned ? `
                                <div class="ban-info">
                                    <strong>🚫 DETALHES DO BANIMENTO</strong>
                                    <p><strong>Motivo:</strong> ${user.ban_reason || 'Não especificado'}</p>
                                    ${user.banned_until ? `
                                        <p><strong>Expira em:</strong> ${new Date(user.banned_until).toLocaleDateString('pt-BR')}</p>
                                    ` : '<p><strong>Duração:</strong> Permanente</p>'}
                                </div>
                            ` : ''}

                            ${user.is_deleted ? `
                                <div class="deleted-info">
                                    <strong>🗑️ USUÁRIO DELETADO</strong>
                                    <p>Conteúdo marcado como oculto. Registro mantido para auditoria.</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="user-actions">
                        ${canActOnUser ? `
                            ${!user.verified ? `
                                <button class="btn btn-verify" onclick="adminSystem.verifyUser('${user.id}')">✅ Verificar</button>
                            ` : `
                                <button class="btn btn-unverify" onclick="adminSystem.unverifyUser('${user.id}')">❌ Desverificar</button>
                            `}
                        ` : ''}

                        ${canActOnUser ? `
                            ${!user.is_banned ? `
                                <button class="btn btn-ban" onclick="adminSystem.banUserPrompt('${user.id}')">🚫 Banir</button>
                            ` : `
                                <button class="btn btn-unban" onclick="adminSystem.unbanUser('${user.id}')">✅ Desbanir</button>
                            `}
                        ` : ''}

                        ${this.userLevel === 'admin' && canActOnUser ? `
                            <button class="btn btn-danger" onclick="adminSystem.deleteUser('${user.id}')">🗑️ Excluir</button>

                            <div class="access-level-actions">
                                <select onchange="adminSystem.changeAccessLevel('${user.id}', this.value)" class="access-select">
                                    <option value="user" ${user.access_level === 'user' ? 'selected' : ''}>👤 Usuário</option>
                                    <option value="moderator" ${user.access_level === 'moderator' ? 'selected' : ''}>🛡️ Moderador</option>
                                    <option value="admin" ${user.access_level === 'admin' ? 'selected' : ''} ${isAdmin ? 'disabled' : ''}>👑 Admin</option>
                                </select>
                            </div>
                        ` : ''}

                        ${!canActOnUser ? `
                            <div class="protected-actions">
                                <button class="btn btn-protected" disabled>🛡️ Protegido</button>
                                <small>Apenas administradores podem gerenciar esta conta</small>
                            </div>
                        ` : ''}

                        <button class="btn btn-info" onclick="adminSystem.viewUserDetails('${user.id}')">📊 Detalhes</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Ações via RPCs (usa funções seguras no DB)
    async verifyUser(userId) {
        try {
            const { error } = await window.supabase.rpc('rpc_verify_user', {
                p_target: Number(userId),
                p_verified: true,
                p_notes: 'Verified via admin panel'
            });
            if (error) throw error;
            await this.loadUsers();
            alert('✅ Usuário verificado com sucesso!');
        } catch (err) {
            console.error('Erro ao verificar usuário:', err);
            alert('❌ Erro ao verificar usuário: ' + (err.message || JSON.stringify(err)));
        }
    }

    async unverifyUser(userId) {
        try {
            const { error } = await window.supabase.rpc('rpc_verify_user', {
                p_target: Number(userId),
                p_verified: false,
                p_notes: 'Unverified via admin panel'
            });
            if (error) throw error;
            await this.loadUsers();
            alert('✅ Verificação removida com sucesso!');
        } catch (err) {
            console.error('Erro ao remover verificação:', err);
            alert('❌ Erro ao remover verificação: ' + (err.message || JSON.stringify(err)));
        }
    }

    banUserPrompt(userId) {
        // abre modal style (já existe modal no HTML). Preenche hidden inputs e mostra modal.
        const modal = document.getElementById('banModal');
        if (!modal) {
            // fallback: prompt
            const reason = prompt('Digite o motivo do banimento:');
            if (!reason) return;
            const duration = prompt('Duração do banimento (dias). Digite "permanent" para banimento permanente:');
            if (!duration) return;
            this.banUser(userId, reason, duration);
            return;
        }

        // popula form com target id
        modal.dataset.targetUser = userId;
        modal.style.display = 'block';
    }

    async banUser(userId, reason, duration) {
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
            alert('✅ Usuário banido com sucesso!');
        } catch (err) {
            console.error('Erro ao banir usuário:', err);
            alert('❌ Erro ao banir usuário: ' + (err.message || JSON.stringify(err)));
        }
    }

    async unbanUser(userId) {
        try {
            const { error } = await window.supabase.rpc('rpc_unban_user', {
                p_target: Number(userId),
                p_note: 'Unbanned via admin panel'
            });
            if (error) throw error;

            await this.loadUsers();
            alert('✅ Usuário desbanido com sucesso!');
        } catch (err) {
            console.error('Erro ao desbanir usuário:', err);
            alert('❌ Erro ao desbanir usuário: ' + (err.message || JSON.stringify(err)));
        }
    }

    async deleteUser(userId) {
        if (this.userLevel !== 'admin') {
            alert('❌ Apenas administradores podem excluir usuários!');
            return;
        }

        if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação ocultará conteúdo e marcará o usuário como deletado.')) {
            return;
        }

        try {
            // chama RPC de soft delete
            const { error } = await window.supabase.rpc('rpc_soft_delete_user', {
                p_target: Number(userId),
                p_reason: 'Deleted by admin via panel'
            });
            if (error) throw error;

            await this.loadUsers();
            alert('✅ Usuário excluído (soft-delete) com sucesso!');
        } catch (err) {
            console.error('Erro ao excluir usuário:', err);
            alert('❌ Erro ao excluir usuário: ' + (err.message || JSON.stringify(err)));
        }
    }

    async changeAccessLevel(userId, newLevel) {
        if (this.userLevel !== 'admin') {
            alert('❌ Apenas administradores podem alterar níveis de acesso!');
            return;
        }
        try {
            const { error } = await window.supabase.rpc('rpc_set_access_level', {
                p_target: Number(userId),
                p_new_level: newLevel
            });
            if (error) throw error;
            await this.loadUsers();
            alert('✅ Nível de acesso alterado!');
        } catch (err) {
            console.error(err);
            alert('❌ Erro ao alterar nível: ' + (err.message || JSON.stringify(err)));
        }
    }

    viewUserDetails(userId) {
        const user = this.allUsers.find(u => u.id === userId);
        if (user) {
            const details = `
👤 NOME: ${user.usuario || 'Sem nome'}
🆔 ID: ${user.id}
🎯 NÍVEL: ${user.access_level === 'admin' ? '👑 Administrador' : user.access_level === 'moderator' ? '🛡️ Moderador' : '👤 Usuário'}
📅 REGISTRO: ${new Date(user.created_at).toLocaleString('pt-BR')}
✅ VERIFICADO: ${user.verified ? 'Sim' : 'Não'}
🚫 BANIDO: ${user.is_banned ? 'Sim' : 'Não'}
${user.is_banned ? `📋 MOTIVO BAN: ${user.ban_reason || 'Não especificado'}` : ''}
${user.banned_until ? `⏰ BAN EXPIRA: ${new Date(user.banned_until).toLocaleString('pt-BR')}` : ''}
🗑️ DELETADO: ${user.is_deleted ? 'Sim' : 'Não'}
            `.trim();
            
            alert('📊 DETALHES DO USUÁRIO\n\n' + details);
        }
    }

    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');
        
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                    modal.dataset.targetUser = '';
                }
            });
        });

        // Ban modal submit
        const banForm = document.getElementById('banForm');
        if (banForm) {
            banForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const modal = document.getElementById('banModal');
                const targetId = modal?.dataset?.targetUser;
                const reasonInput = document.getElementById('banReason');
                const durationSelect = document.getElementById('banDuration');

                if (!targetId) {
                    alert('Usuário alvo inválido.');
                    return;
                }
                const reason = reasonInput.value.trim();
                const duration = durationSelect.value;

                await this.banUser(targetId, reason, duration);
                
                // limpar e fechar modal
                reasonInput.value = '';
                durationSelect.value = '7';
                modal.style.display = 'none';
                modal.dataset.targetUser = '';
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
                e.target.dataset.targetUser = '';
            }
        });

        console.log('✅ Event listeners configurados');
    }

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
                user.usuario && user.usuario.toLowerCase().includes(searchTerm)
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
}

// INICIALIZAÇÃO
let adminSystem;
document.addEventListener('DOMContentLoaded', function() {
    adminSystem = new AdminSystem();
    adminSystem.init();
});
