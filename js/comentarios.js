// comentarios.js - VERSÃO SIMPLIFICADA
console.log('comentarios.js carregado');

// Verificar se a classe já foi definida para evitar duplicação
if (typeof ComentariosManager === 'undefined') {
    class ComentariosManager {
        constructor(tipoConteudo, conteudoId) {
            this.tipoConteudo = tipoConteudo;
            this.conteudoId = conteudoId;
            this.comentarios = [];
            this.usuarioLogado = null;
            
            console.log('Novo ComentariosManager criado:', { tipoConteudo, conteudoId });
        }

        async init() {
            console.log('Inicializando ComentariosManager...');
            this.usuarioLogado = this.getUsuarioLogado();
            await this.carregarComentarios();
            this.renderizarComentarios();
            this.configurarEventos();
        }

        getUsuarioLogado() {
            const usuario = localStorage.getItem('usuarioLogado');
            return usuario ? JSON.parse(usuario) : null;
        }

        async carregarComentarios() {
            try {
                console.log('Carregando comentários...');
                
                const { data: comentarios, error } = await window.supabase
                    .from('comentarios')
                    .select('*')
                    .eq('tipo_conteudo', this.tipoConteudo)
                    .eq('conteudo_id', this.conteudoId)
                    .order('created_at', { ascending: true });

                if (error) throw error;

                this.comentarios = comentarios || [];
                console.log('Comentários carregados:', this.comentarios);
                
            } catch (error) {
                console.error('Erro ao carregar comentários:', error);
            }
        }

        renderizarComentarios() {
            const container = document.getElementById('commentsContainerFull') || document.getElementById('commentsContainer');
            if (!container) {
                console.error('Container de comentários não encontrado!');
                return;
            }

            if (this.comentarios.length === 0) {
                container.innerHTML = `
                    <div class="no-comments">
                        <p>📝 Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = this.comentarios.map(comentario => `
                <div class="comment-item">
                    <div class="comment-header">
                        <strong class="comment-author">${comentario.autor_nome}</strong>
                        <span class="comment-date">
                            ${new Date(comentario.created_at).toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                    <div class="comment-content">
                        ${comentario.texto}
                    </div>
                </div>
            `).join('');
        }

        configurarEventos() {
            const form = document.getElementById('commentFormFull') || document.getElementById('commentForm');
            if (form) {
                form.addEventListener('submit', (e) => this.enviarComentario(e));
                console.log('Event listener configurado');
            }
        }

        async enviarComentario(event) {
            event.preventDefault();
            
            const textarea = document.getElementById('commentTextFull') || document.getElementById('commentText');
            const texto = textarea.value.trim();

            if (!texto) {
                alert('Por favor, digite um comentário.');
                return;
            }

            if (!this.usuarioLogado) {
                alert('Você precisa estar logado para comentar.');
                return;
            }

            try {
                let autorId = this.usuarioLogado.id;
                if (typeof autorId === 'number') {
                    autorId = `00000000-0000-0000-0000-${String(autorId).padStart(12, '0')}`;
                }

                const comentarioData = {
                    tipo_conteudo: this.tipoConteudo,
                    conteudo_id: this.conteudoId,
                    texto: texto,
                    autor_id: autorId,
                    autor_nome: this.usuarioLogado.usuario || 'Usuário'
                };

                const { data, error } = await window.supabase
                    .from('comentarios')
                    .insert([comentarioData])
                    .select()
                    .single();

                if (error) throw error;

                textarea.value = '';
                this.comentarios.push(data);
                this.renderizarComentarios();
                alert('Comentário enviado com sucesso!');

            } catch (error) {
                console.error('Erro ao enviar comentário:', error);
                alert('Erro ao enviar comentário.');
            }
        }
    }

    // Definir globalmente
    window.ComentariosManager = ComentariosManager;
    console.log('✅ ComentariosManager definido globalmente');
} else {
    console.log('ℹ️ ComentariosManager já foi definido');
}