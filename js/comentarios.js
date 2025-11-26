class ComentariosManager {
    constructor(tipoConteudo, conteudoId) {
        this.tipoConteudo = tipoConteudo; // 'artigo' ou 'livro'
        this.conteudoId = conteudoId;
        this.comentarios = [];
        this.usuarioLogado = null;
        this.isLoading = false;
    }

    async init() {
        console.log('Inicializando sistema de comentários...');
        this.usuarioLogado = this.getUsuarioLogado();
        await this.carregarComentarios();
        this.renderizarComentarios();
        this.configurarEventos();
        this.atualizarUIUsuario();
    }

    getUsuarioLogado() {
        const usuario = localStorage.getItem('usuarioLogado');
        return usuario ? JSON.parse(usuario) : null;
    }

    async carregarComentarios() {
        this.isLoading = true;
        this.mostrarLoading();
        
        try {
            let query = window.supabase
                .from('comentarios')
                .select(`
                    *,
                    usuarios:autor_id (usuario, id)
                `);

            if (this.tipoConteudo === 'artigo') {
                query = query.eq('artigo_id', this.conteudoId);
            } else {
                query = query.eq('livro_id', this.conteudoId);
            }

            const { data: comentarios, error } = await query
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Erro ao carregar comentários:', error);
                this.mostrarErro('Erro ao carregar comentários: ' + error.message);
                return;
            }

            this.comentarios = comentarios || [];
            console.log('Comentários carregados:', this.comentarios);
            
        } catch (error) {
            console.error('Erro ao carregar comentários:', error);
            this.mostrarErro('Erro ao carregar comentários.');
        } finally {
            this.isLoading = false;
        }
    }

    mostrarLoading() {
        const container = document.getElementById('commentsContainer');
        if (container) {
            container.innerHTML = `
                <div class="comment-loading">
                    <p>Carregando comentários...</p>
                </div>
            `;
        }
    }

    mostrarErro(mensagem) {
        const container = document.getElementById('commentsContainer');
        if (container) {
            container.innerHTML = `
                <div class="comment-error">
                    <p>${mensagem}</p>
                </div>
            `;
        }
    }

    renderizarComentarios() {
        const container = document.getElementById('commentsContainer');
        if (!container) {
            console.error('Container de comentários não encontrado!');
            return;
        }

        const commentsCount = document.getElementById('commentsCount');
        if (commentsCount) {
            commentsCount.textContent = `${this.comentarios.length} comentário${this.comentarios.length !== 1 ? 's' : ''}`;
        }

        if (this.comentarios.length === 0) {
            container.innerHTML = `
                <div class="no-comments">
                    <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.comentarios.map(comentario => `
            <div class="comment-card" data-comment-id="${comentario.id}">
                <div class="comment-header">
                    <div class="comment-author">
                        ${comentario.usuarios?.usuario || 'Usuário Anônimo'}
                        ${this.isAutorComentario(comentario) ? ' (você)' : ''}
                    </div>
                    <div class="comment-date">
                        ${new Date(comentario.created_at).toLocaleDateString('pt-BR')} 
                        às ${new Date(comentario.created_at).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}
                        ${comentario.updated_at !== comentario.created_at ? ' (editado)' : ''}
                    </div>
                </div>
                <div class="comment-content">${this.escapeHtml(comentario.conteudo)}</div>
                ${this.isAutorComentario(comentario) ? `
                    <div class="comment-actions">
                        <button class="comment-action-btn edit" onclick="comentariosManager.editarComentario(${comentario.id})">
                            ✏️ Editar
                        </button>
                        <button class="comment-action-btn delete" onclick="comentariosManager.excluirComentario(${comentario.id})">
                            🗑️ Excluir
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    configurarEventos() {
        const form = document.getElementById('commentForm');
        if (form) {
            form.addEventListener('submit', (e) => this.adicionarComentario(e));
        }
        
        // Atualizar UI quando usuário fizer login/logout
        window.addEventListener('storage', (e) => {
            if (e.key === 'usuarioLogado') {
                this.usuarioLogado = this.getUsuarioLogado();
                this.atualizarUIUsuario();
            }
        });
    }

    atualizarUIUsuario() {
        const form = document.getElementById('commentForm');
        const loginPrompt = document.getElementById('loginPrompt');
        
        if (!form) return;
        
        if (this.usuarioLogado) {
            // Usuário logado - mostrar formulário
            form.style.display = 'block';
            if (loginPrompt) loginPrompt.style.display = 'none';
        } else {
            // Usuário não logado - mostrar prompt de login
            form.style.display = 'none';
            if (!loginPrompt) {
                this.criarLoginPrompt();
            } else {
                loginPrompt.style.display = 'block';
            }
        }
    }

    criarLoginPrompt() {
        const form = document.getElementById('commentForm');
        if (!form) return;
        
        const loginPrompt = document.createElement('div');
        loginPrompt.id = 'loginPrompt';
        loginPrompt.className = 'login-prompt';
        loginPrompt.innerHTML = `
            <p>💬 Você precisa estar logado para comentar.</p>
            <a href="login.html" class="btn">Fazer Login</a>
        `;
        
        form.parentNode.insertBefore(loginPrompt, form);
    }

    async adicionarComentario(event) {
        event.preventDefault();
        
        if (!this.usuarioLogado) {
            alert('Você precisa estar logado para comentar.');
            window.location.href = 'login.html';
            return;
        }

        const textarea = document.getElementById('commentText');
        const conteudo = textarea.value.trim();

        if (!conteudo) {
            alert('Por favor, digite um comentário.');
            textarea.focus();
            return;
        }

        const button = event.target.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Publicando...';

        try {
            const comentario = {
                conteudo: conteudo,
                autor_id: this.usuarioLogado.id
            };

            if (this.tipoConteudo === 'artigo') {
                comentario.artigo_id = this.conteudoId;
            } else {
                comentario.livro_id = this.conteudoId;
            }

            console.log('Enviando comentário:', comentario);

            const { data, error } = await window.supabase
                .from('comentarios')
                .insert([comentario])
                .select(`
                    *,
                    usuarios:autor_id (usuario, id)
                `)
                .single();

            if (error) {
                console.error('Erro do Supabase:', error);
                throw error;
            }

            console.log('Comentário adicionado:', data);

            // Adicionar novo comentário à lista
            this.comentarios.push(data);
            
            // Limpar formulário
            textarea.value = '';
            
            // Recarregar e renderizar comentários
            this.renderizarComentarios();

        } catch (error) {
            console.error('Erro ao adicionar comentário:', error);
            alert('Erro ao adicionar comentário: ' + error.message);
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    async editarComentario(comentarioId) {
        const comentario = this.comentarios.find(c => c.id === comentarioId);
        if (!comentario) return;

        const novoConteudo = prompt('Editar seu comentário:', comentario.conteudo);
        if (novoConteudo === null) return;

        const conteudoTrimmed = novoConteudo.trim();
        if (!conteudoTrimmed) {
            alert('O comentário não pode estar vazio.');
            return;
        }

        if (conteudoTrimmed === comentario.conteudo) return;

        try {
            const { error } = await window.supabase
                .from('comentarios')
                .update({ 
                    conteudo: conteudoTrimmed,
                    updated_at: new Date().toISOString()
                })
                .eq('id', comentarioId);

            if (error) throw error;

            // Atualizar comentário localmente
            comentario.conteudo = conteudoTrimmed;
            comentario.updated_at = new Date().toISOString();
            
            this.renderizarComentarios();

        } catch (error) {
            console.error('Erro ao editar comentário:', error);
            alert('Erro ao editar comentário.');
        }
    }

    async excluirComentario(comentarioId) {
        if (!confirm('Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const { error } = await window.supabase
                .from('comentarios')
                .delete()
                .eq('id', comentarioId);

            if (error) throw error;

            // Remover comentário da lista local
            this.comentarios = this.comentarios.filter(c => c.id !== comentarioId);
            this.renderizarComentarios();

        } catch (error) {
            console.error('Erro ao excluir comentário:', error);
            alert('Erro ao excluir comentário.');
        }
    }

    isAutorComentario(comentario) {
        return this.usuarioLogado && comentario.autor_id === this.usuarioLogado.id;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Variável global para gerenciador de comentários
let comentariosManager = null;  