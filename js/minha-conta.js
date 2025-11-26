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
        <div class="content-card">
            <div class="content-header">
                <h4>${artigo.titulo}</h4>
                <div class="content-actions">
                    <button class="btn-edit" onclick="editarArtigo(${artigo.id})">Editar</button>
                    <button class="btn-delete" onclick="prepararExclusao('artigo', ${artigo.id})">Excluir</button>
                </div>
            </div>
            <div class="content-meta">
                <span class="content-categoria">${formatarCategoria(artigo.categoria)}</span>
                <span class="content-data">Publicado em ${new Date(artigo.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            <div class="content-preview">
                ${artigo.conteudo.substring(0, 150)}${artigo.conteudo.length > 150 ? '...' : ''}
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
        <div class="content-card">
            <div class="content-header">
                <h4>${livro.titulo}</h4>
                <div class="content-actions">
                    <button class="btn-edit" onclick="editarLivro(${livro.id})">Editar</button>
                    <button class="btn-delete" onclick="prepararExclusao('livro', ${livro.id})">Excluir</button>
                </div>
            </div>
            <div class="content-meta">
                <span class="content-categoria">${livro.genero}</span>
                <span class="content-data">Publicado em ${new Date(livro.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            <div class="content-preview">
                ${livro.descricao || 'Sem descrição disponível.'}
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
    event.preventDefault();
    
    const id = document.getElementById('editId').value;
    const tipo = document.getElementById('editTipo').value;
    const titulo = document.getElementById('editTitulo').value;
    
    try {
        if (tipo === 'artigo') {
            const artigo = {
                titulo: titulo,
                categoria: document.getElementById('editCategoria').value,
                conteudo: document.getElementById('editConteudo').value
            };
            
            const { error } = await window.supabase
                .from('artigos')
                .update(artigo)
                .eq('id', id);

            if (error) throw error;
            
        } else if (tipo === 'livro') {
            const livro = {
                titulo: titulo,
                genero: document.getElementById('editGenero').value,
                categoria: document.getElementById('editLivroCategoria').value,
                descricao: document.getElementById('editDescricao').value,
                link_pdf: document.getElementById('editLink').value
            };
            
            const { error } = await window.supabase
                .from('livros')
                .update(livro)
                .eq('id', id);

            if (error) throw error;
        }
        
        alert('Alterações salvas com sucesso!');
        document.getElementById('editModal').style.display = 'none';
        carregarMeusConteudos();
        
    } catch (error) {
        console.error('Erro ao salvar edição:', error);
        alert('Erro ao salvar alterações');
    }
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