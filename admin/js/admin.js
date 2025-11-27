// admin.js - VERSÃO FINAL COM PROTEÇÃO COMPLETA
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

    // VERIFICAÇÃO DE SELF-ACTION (PROTEÇÃO PRINCIPAL)
    isSelfAction(targetUserId) {
        return this.currentUser && targetUserId.toString() === this.currentUser.id.toString();
    }

    // VERIFICA SE PODE AGIR NO USUÁRIO
    canPerformActionOnUser(targetUser) {
        if (!targetUser) return false;
        
        // 1. PROTEÇÃO CONTRA SELF-ACTION
        if (this.isSelfAction(targetUser.id)) {
            return false;
        }
        
        // 2. Moderador não pode agir em administradores
        if (this.userLevel === 'moderator' && targetUser.access_level === 'admin') {
            return false;
        }
        
        return true;
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
            this.updateStats(this.allUsers);
        } catch (error) {
            console.error('❌ Erro ao carregar usuários:', error);
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

            return `
                <div class="user-card ${user.is_banned ? 'banned' : ''} ${isAdmin ? 'admin-protected' : ''} ${isCurrentUser ? 'current-user' : ''}">
                    <div class="user-info">
                        <div class="user-header">
                            <h4>${user.usuario || 'Sem nome'} ${isCurrentUser ? '<span class="you-badge">(Você)</span>' : ''}</h4>
                            <div class="user-badges">
                                ${isAdmin ? '<span class="badge admin-badge">👑 Admin</span>' : ''}
                                ${user.access_level === 'moderator' ? '<span class="badge moderator-badge">🛡️ Moderador</span>' : ''}
                                ${user.verified ? '<span class="badge verified-badge">✅ Verificado</span>' : ''}
                                ${user.is_banned ? '<span class="badge banned-badge">🚫 Banido</span>' : ''}
                                ${!canActOnUser && !isCurrentUser ? '<span class="badge protected-badge">🛡️ Protegido</span>' : ''}
                                ${isCurrentUser ? '<span class="badge self-badge">👤 Você</span>' : ''}
                            </div>
                        </div>
                        
                        <div class="user-details">
                            <p><strong>ID:</strong> ${user.id}</p>
                            <p><strong>Nível:</strong> ${isAdmin ? '👑 Administrador' : user.access_level === 'moderator' ? '🛡️ Moderador' : '👤 Usuário'}</p>
                            <p><strong>Registro:</strong> ${new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                            <p><strong>Status:</strong> ${user.is_banned ? '🚫 Banido' : '✅ Ativo'}</p>
                            <p><strong>Verificado:</strong> ${user.verified ? '✅ Sim' : '❌ Não'}</p>
                            
                            ${isCurrentUser ? `
                                <div class="self-info">
                                    <strong>👤 SUA CONTA</strong>
                                    <p>Você não pode realizar ações em sua própria conta por motivos de segurança.</p>
                                </div>
                            ` : ''}
                            
                            ${!canActOnUser && !isCurrentUser ? `
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
                        </div>
                    </div>
                    
                    <div class="user-actions">
                        ${canActOnUser ? `
                            <!-- BOTÕES VERIFICAR/DESVERIFICAR -->
                            ${!user.verified ? `
                                <button class="btn btn-verify" onclick="adminSystem.verifyUser('${user.id}')">
                                    ✅ Verificar
                                </button>
                            ` : `
                                <button class="btn btn-unverify" onclick="adminSystem.unverifyUser('${user.id}')">
                                    ❌ Desverificar
                                </button>
                            `}

                            <!-- BOTÕES BANIR/DESBANIR -->
                            ${!user.is_banned ? `
                                <button class="btn btn-ban" onclick="adminSystem.banUserPrompt('${user.id}')">
                                    🚫 Banir
                                </button>
                            ` : `
                                <button class="btn btn-unban" onclick="adminSystem.unbanUser('${user.id}')">
                                    ✅ Desbanir
                                </button>
                            `}
                        ` : ''}

                        <!-- BOTÕES APENAS PARA ADMIN -->
                        ${this.userLevel === 'admin' && canActOnUser ? `
                            <button class="btn btn-danger" onclick="adminSystem.deleteUser('${user.id}')">
                                🗑️ Excluir
                            </button>

                            <div class="access-level-actions">
                                <select onchange="adminSystem.changeAccessLevel('${user.id}', this.value)" class="access-select">
                                    <option value="user" ${user.access_level === 'user' ? 'selected' : ''}>👤 Usuário</option>
                                    <option value="moderator" ${user.access_level === 'moderator' ? 'selected' : ''}>🛡️ Moderador</option>
                                    <option value="admin" ${user.access_level === 'admin' ? 'selected' : ''}>👑 Admin</option>
                                </select>
                            </div>
                        ` : ''}

                        ${isCurrentUser ? `
                            <div class="self-actions">
                                <button class="btn btn-self" disabled>
                                    👤 Sua Conta
                                </button>
                                <small>Você não pode realizar ações em si mesmo</small>
                            </div>
                        ` : ''}

                        ${!canActOnUser && !isCurrentUser ? `
                            <div class="protected-actions">
                                <button class="btn btn-protected" disabled>
                                    🛡️ Protegido
                                </button>
                                <small>Apenas administradores podem gerenciar esta conta</small>
                            </div>
                        ` : ''}

                        <button class="btn btn-info" onclick="adminSystem.viewUserDetails('${user.id}')">
                            📊 Detalhes
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // MÉTODOS DE AÇÃO COM PROTEÇÃO CONTRA SELF-ACTION
    async verifyUser(userId) {
        // VERIFICAÇÃO CONTRA SELF-ACTION
        if (this.isSelfAction(userId)) {
            alert('❌ Você não pode verificar sua própria conta!');
            return;
        }

        const user = this.allUsers.find(u => u.id.toString() === userId.toString());
        if (!this.canPerformActionOnUser(user)) {
            alert('❌ Ação não permitida neste usuário!');
            return;
        }

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
        // VERIFICAÇÃO CONTRA SELF-ACTION
        if (this.isSelfAction(userId)) {
            alert('❌ Você não pode desverificar sua própria conta!');
            return;
        }

        const user = this.allUsers.find(u => u.id.toString() === userId.toString());
        if (!this.canPerformActionOnUser(user)) {
            alert('❌ Ação não permitida neste usuário!');
            return;
        }

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
        // VERIFICAÇÃO CONTRA SELF-ACTION
        if (this.isSelfAction(userId)) {
            alert('❌ Você não pode banir sua própria conta!');
            return;
        }

        const user = this.allUsers.find(u => u.id.toString() === userId.toString());
        if (!this.canPerformActionOnUser(user)) {
            alert('❌ Você não pode banir este usuário!');
            return;
        }

        const modal = document.getElementById('banModal');
        if (!modal) {
            // Fallback para prompt
            const reason = prompt('Digite o motivo do banimento:');
            if (!reason) return;
            const duration = prompt('Duração do banimento (dias). Digite "permanent" para banimento permanente:');
            if (!duration) return;
            this.banUser(userId, reason, duration);
            return;
        }

        modal.dataset.targetUser = userId;
        modal.style.display = 'block';
    }

    async banUser(userId, reason, duration) {
        // VERIFICAÇÃO DUPLA (CLIENTE + SERVIDOR)
        if (this.isSelfAction(userId)) {
            alert('❌ Você não pode banir sua própria conta!');
            return;
        }

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
        // VERIFICAÇÃO CONTRA SELF-ACTION
        if (this.isSelfAction(userId)) {
            alert('❌ Você não pode desbanir sua própria conta!');
            return;
        }

        const user = this.allUsers.find(u => u.id.toString() === userId.toString());
        if (!this.canPerformActionOnUser(user)) {
            alert('❌ Você não pode desbanir este usuário!');
            return;
        }

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
        // VERIFICAÇÃO CONTRA SELF-ACTION
        if (this.isSelfAction(userId)) {
            alert('❌ Você não pode excluir sua própria conta!');
            return;
        }

        if (this.userLevel !== 'admin') {
            alert('❌ Apenas administradores podem excluir usuários!');
            return;
        }

        const user = this.allUsers.find(u => u.id.toString() === userId.toString());
        if (!this.canPerformActionOnUser(user)) {
            alert('❌ Você não pode excluir este usuário!');
            return;
        }

        if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            // CHAMADA PARA SUA RPC DE DELETE (você precisa criar essa função)
            const { error } = await window.supabase.rpc('rpc_delete_user', {
                p_target: Number(userId),
                p_reason: 'Deleted by admin via panel'
            });
            if (error) throw error;

            await this.loadUsers();
            alert('✅ Usuário excluído com sucesso!');
        } catch (err) {
            console.error('Erro ao excluir usuário:', err);
            alert('❌ Erro ao excluir usuário: ' + (err.message || JSON.stringify(err)));
        }
    }

    async changeAccessLevel(userId, newLevel) {
        // VERIFICAÇÃO CONTRA SELF-ACTION (IMPORTANTE!)
        if (this.isSelfAction(userId)) {
            alert('❌ Você não pode alterar seu próprio nível de acesso!');
            return;
        }

        if (this.userLevel !== 'admin') {
            alert('❌ Apenas administradores podem alterar níveis de acesso!');
            return;
        }

        const user = this.allUsers.find(u => u.id.toString() === userId.toString());
        if (!this.canPerformActionOnUser(user)) {
            alert('❌ Você não pode alterar o nível deste usuário!');
            return;
        }

        try {
            const { error } = await window.supabase.rpc('rpc_set_access_level', {
                p_target: Number(userId),
                p_new_level: newLevel
            });
            if (error) throw error;
            await this.loadUsers();
            alert('✅ Nível de acesso alterado com sucesso!');
        } catch (err) {
            console.error('Erro ao alterar nível de acesso:', err);
            alert('❌ Erro ao alterar nível de acesso: ' + (err.message || JSON.stringify(err)));
        }
    }

    viewUserDetails(userId) {
        const user = this.allUsers.find(u => u.id.toString() === userId.toString());
        if (user) {
            const isCurrentUser = this.isSelfAction(userId);
            const details = `
👤 NOME: ${user.usuario || 'Sem nome'} ${isCurrentUser ? '(VOCÊ)' : ''}
🆔 ID: ${user.id}
🎯 NÍVEL: ${user.access_level === 'admin' ? '👑 Administrador' : user.access_level === 'moderator' ? '🛡️ Moderador' : '👤 Usuário'}
📅 REGISTRO: ${new Date(user.created_at).toLocaleString('pt-BR')}
✅ VERIFICADO: ${user.verified ? 'Sim' : 'Não'}
🚫 BANIDO: ${user.is_banned ? 'Sim' : 'Não'}
${user.is_banned ? `📋 MOTIVO BAN: ${user.ban_reason || 'Não especificado'}` : ''}
${user.banned_until ? `⏰ BAN EXPIRA: ${new Date(user.banned_until).toLocaleString('pt-BR')}` : ''}
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

                // VERIFICAÇÃO FINAL ANTES DE EXECUTAR
                if (this.isSelfAction(targetId)) {
                    alert('❌ Você não pode banir sua própria conta!');
                    modal.style.display = 'none';
                    return;
                }

                const reason = reasonInput.value.trim();
                const duration = durationSelect.value;

                if (!reason) {
                    alert('Por favor, informe o motivo do banimento.');
                    return;
                }

                await this.banUser(targetId, reason, duration);
                
                // Limpar e fechar modal
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