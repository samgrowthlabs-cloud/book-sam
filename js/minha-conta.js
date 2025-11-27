let usuarioLogado = null;
let conteudoParaExcluir = null;

document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacao();
    carregarMeusConteudos();
    
    // Event listeners para modais
    const modal = document.getElementById('editModal');
    const confirmModal = document.getElementById('confirmModal');
    const span = document.getElementsByClassName('close')[0];
    
    span.onclick = function() {
        modal.style.display = 'none';
    }
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
        if (event.target == confirmModal) {
            confirmModal.style.display = 'none';
        }
    }
    
    document.getElementById('editForm').addEventListener('submit', salvarEdicao);
});

function verificarAutenticacao() {
    const usuario = localStorage.getItem('usuarioLogado');
    
    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }
    
    usuarioLogado = JSON.parse(usuario);
    document.getElementById('userName').textContent = `Olá, ${usuarioLogado.usuario}`;
}

async function carregarMeusConteudos() {
    if (!usuarioLogado) return;
    
    try {
        // Carregar artigos
        const { data: artigos, error: errorArtigos } = await window.supabase
            .from('artigos')
            .select('*')
            .eq('autor_id', usuarioLogado.id)
            .order('created_at', { ascending: false });

        if (errorArtigos) throw errorArtigos;

        // Carregar livros
        const { data: livros, error: errorLivros } = await window.supabase
            .from('livros')
            .select('*')
            .eq('autor_id', usuarioLogado.id)
            .order('created_at', { ascending: false });

        if (errorLivros) throw errorLivros;

        exibirMeusArtigos(artigos || []);
        exibirMeusLivros(livros || []);
        atualizarEstatisticas(artigos || [], livros || []);

    } catch (error) {
        console.error('Erro ao carregar conteúdos:', error);
    }
}

function exibirMeusArtigos(artigos) {
    const grid = document.getElementById('meusArtigosGrid');
    const count = document.getElementById('artigosCount');
    
    count.textContent = `${artigos.length} artigo${artigos.length !== 1 ? 's' : ''}`;
    
    if (artigos.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h4>Nenhum artigo publicado</h4>
                <p>Você ainda não publicou nenhum artigo.</p>
                <a href="publicar.html" class="btn">Publicar Primeiro Artigo</a>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = artigos.map(artigo => `
        <div class="content-card artigo-card">
            <div class="content-header">
                <h4>${artigo.titulo}</h4>
                <div class="content-actions">
                    <button class="btn-edit" onclick="editarArtigo(${artigo.id})">
                        <span>✏️</span> Editar
                    </button>
                    <button class="btn-delete" onclick="prepararExclusao('artigo', ${artigo.id})">
                        <span>🗑️</span> Excluir
                    </button>
                </div>
            </div>
            <div class="content-meta">
                <span class="content-categoria artigo-categoria">${formatarCategoria(artigo.categoria)}</span>
                <span class="content-data">📅 ${new Date(artigo.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            <div class="content-preview artigo-preview">
                ${artigo.conteudo ? artigo.conteudo.substring(0, 200) + (artigo.conteudo.length > 200 ? '...' : '') : 'Sem conteúdo'}
            </div>
            <div class="content-footer">
                <span class="content-id">ID: ${artigo.id}</span>
                <span class="content-visualizacoes">👁️ ${artigo.visualizacoes || 0} visualizações</span>
            </div>
        </div>
    `).join('');
}

function exibirMeusLivros(livros) {
    const grid = document.getElementById('meusLivrosGrid');
    const count = document.getElementById('livrosCount');
    
    count.textContent = `${livros.length} livro${livros.length !== 1 ? 's' : ''}`;
    
    if (livros.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h4>Nenhum livro publicado</h4>
                <p>Você ainda não publicou nenhum livro.</p>
                <a href="publicar.html" class="btn">Publicar Primeiro Livro</a>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = livros.map(livro => `
        <div class="content-card livro-card">
            <div class="content-header">
                <h4>${livro.titulo}</h4>
                <div class="content-actions">
                    <button class="btn-edit" onclick="editarLivro(${livro.id})">
                        <span>✏️</span> Editar
                    </button>
                    <button class="btn-delete" onclick="prepararExclusao('livro', ${livro.id})">
                        <span>🗑️</span> Excluir
                    </button>
                </div>
            </div>
            <div class="content-meta">
                <span class="content-categoria livro-categoria">${livro.genero}</span>
                <span class="content-data">📅 ${new Date(livro.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            <div class="content-preview livro-preview">
                ${livro.descricao || 'Sem descrição disponível.'}
            </div>
            <div class="content-footer">
                <span class="content-id">ID: ${livro.id}</span>
                <span class="content-visualizacoes">📖 PDF disponível</span>
            </div>
        </div>
    `).join('');
}

function atualizarEstatisticas(artigos, livros) {
    document.getElementById('totalArtigos').textContent = artigos.length;
    document.getElementById('totalLivros').textContent = livros.length;
    document.getElementById('totalConteudos').textContent = artigos.length + livros.length;
    
    const todasPublicacoes = [...artigos, ...livros];
    if (todasPublicacoes.length > 0) {
        const primeiraData = new Date(Math.min(...todasPublicacoes.map(p => new Date(p.created_at))));
        document.getElementById('primeiraPublicacao').textContent = primeiraData.toLocaleDateString('pt-BR');
    }
}

function formatarCategoria(categoria) {
    const categorias = {
        'investimentos': 'Investimentos',
        'economia': 'Economia',
        'financas_pessoais': 'Finanças Pessoais',
        'mercado_financeiro': 'Mercado Financeiro',
        'criptomoedas': 'Criptomoedas',
        'planejamento': 'Planejamento'
    };
    
    return categorias[categoria] || categoria;
}

function abrirTab(tabName) {
    // Esconder todas as tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar tab selecionada
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

async function editarArtigo(artigoId) {
    try {
        const { data: artigo, error } = await window.supabase
            .from('artigos')
            .select('*')
            .eq('id', artigoId)
            .single();

        if (error) throw error;

        document.getElementById('modalTitle').textContent = 'Editar Artigo';
        document.getElementById('editId').value = artigo.id;
        document.getElementById('editTipo').value = 'artigo';
        document.getElementById('editTitulo').value = artigo.titulo;
        document.getElementById('editCategoria').value = artigo.categoria;
        document.getElementById('editConteudo').value = artigo.conteudo;
        
        // Mostrar campos de artigo e esconder de livro
        document.getElementById('editArtigoFields').style.display = 'block';
        document.getElementById('editLivroFields').style.display = 'none';
        
        document.getElementById('editModal').style.display = 'block';
        
    } catch (error) {
        console.error('Erro ao carregar artigo:', error);
        alert('Erro ao carregar artigo para edição');
    }
}

async function editarLivro(livroId) {
    try {
        const { data: livro, error } = await window.supabase
            .from('livros')
            .select('*')
            .eq('id', livroId)
            .single();

        if (error) throw error;

        document.getElementById('modalTitle').textContent = 'Editar Livro';
        document.getElementById('editId').value = livro.id;
        document.getElementById('editTipo').value = 'livro';
        document.getElementById('editTitulo').value = livro.titulo;
        document.getElementById('editGenero').value = livro.genero;
        document.getElementById('editLivroCategoria').value = livro.categoria;
        document.getElementById('editDescricao').value = livro.descricao || '';
        document.getElementById('editLink').value = livro.link_pdf;
        
        // Mostrar campos de livro e esconder de artigo
        document.getElementById('editArtigoFields').style.display = 'none';
        document.getElementById('editLivroFields').style.display = 'block';
        
        document.getElementById('editModal').style.display = 'block';
        
    } catch (error) {
        console.error('Erro ao carregar livro:', error);
        alert('Erro ao carregar livro para edição');
    }
}

async function salvarEdicao(event) {
    console.log('=== INICIANDO SALVAMENTO ===');
    event.preventDefault();
    
    const id = document.getElementById('editId').value;
    const tipo = document.getElementById('editTipo').value;
    const titulo = document.getElementById('editTitulo').value.trim();
    
    console.log('Dados básicos:', { id, tipo, titulo });
    
    if (!titulo) {
        alert('Por favor, preencha o título.');
        return;
    }

    try {
        let dadosAtualizados = {};
        let tabela = '';
        
        if (tipo === 'artigo') {
            const categoria = document.getElementById('editCategoria').value;
            const conteudo = document.getElementById('editConteudo').value.trim();
            
            if (!categoria || !conteudo) {
                alert('Por favor, preencha todos os campos do artigo.');
                return;
            }
            
            dadosAtualizados = {
                titulo: titulo,
                categoria: categoria,
                conteudo: conteudo
            };
            tabela = 'artigos';
            
        } else if (tipo === 'livro') {
            const genero = document.getElementById('editGenero').value;
            const livroCategoria = document.getElementById('editLivroCategoria').value;
            const descricao = document.getElementById('editDescricao').value.trim();
            const link = document.getElementById('editLink').value.trim();
            
            // Validação manual para livros (já que removemos o required do HTML)
            if (!genero || !livroCategoria) {
                alert('Por favor, preencha o gênero e a categoria do livro.');
                return;
            }
            
            if (!link) {
                alert('Por favor, informe o link do PDF.');
                return;
            }
            
            // Validação básica de URL
            if (!link.startsWith('http://') && !link.startsWith('https://')) {
                alert('Por favor, informe uma URL válida (deve começar com http:// ou https://)');
                return;
            }
            
            dadosAtualizados = {
                titulo: titulo,
                genero: genero,
                categoria: livroCategoria,
                descricao: descricao,
                link_pdf: link
            };
            tabela = 'livros';
        }

        console.log('Tentando atualizar:', { tabela, id, dadosAtualizados });

        const { data, error } = await window.supabase
            .from(tabela)
            .update(dadosAtualizados)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Erro do Supabase:', error);
            alert('Erro ao salvar alterações: ' + error.message);
            return;
        }

        console.log('Sucesso! Dados atualizados:', data);
        alert('Alterações salvas com sucesso!');
        
        // Fechar modal
        document.getElementById('editModal').style.display = 'none';
        
        // Recarregar conteúdos
        await carregarMeusConteudos();
        
    } catch (error) {
        console.error('Erro inesperado:', error);
        alert('Erro inesperado ao salvar alterações: ' + error.message);
    }
}

// Adicione esta função para feedback visual
function mostrarMensagemSucesso(mensagem) {
    // Criar elemento de mensagem
    const mensagemEl = document.createElement('div');
    mensagemEl.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #000000;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 600;
        animation: slideInRight 0.3s ease-out;
    `;
    mensagemEl.textContent = mensagem;
    
    document.body.appendChild(mensagemEl);
    
    // Remover após 3 segundos
    setTimeout(() => {
        mensagemEl.remove();
    }, 3000);
}

function prepararExclusao(tipo, id) {
    conteudoParaExcluir = { tipo, id };
    document.getElementById('confirmModal').style.display = 'block';
}

function fecharConfirmacao() {
    document.getElementById('confirmModal').style.display = 'none';
    conteudoParaExcluir = null;
}

async function excluirConteudo() {
    if (!conteudoParaExcluir) return;
    
    try {
        const { tipo, id } = conteudoParaExcluir;
        const tabela = tipo === 'artigo' ? 'artigos' : 'livros';
        
        const { error } = await window.supabase
            .from(tabela)
            .delete()
            .eq('id', id);

        if (error) throw error;
        
        alert('Conteúdo excluído com sucesso!');
        document.getElementById('confirmModal').style.display = 'none';
        carregarMeusConteudos();
        conteudoParaExcluir = null;
        
    } catch (error) {
        console.error('Erro ao excluir conteúdo:', error);
        alert('Erro ao excluir conteúdo');
    }
}

function sair() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'index.html';
}