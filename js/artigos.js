let todosArtigos = [];

document.addEventListener('DOMContentLoaded', function() {
    carregarArtigos();
    verificarLogin();
    
    document.getElementById('searchArtigos').addEventListener('input', filtrarArtigos);
    document.getElementById('categoriaFilter').addEventListener('change', filtrarArtigos);
});

async function carregarArtigos() {
    try {
        const { data: artigos, error } = await window.supabase
            .from('artigos')
            .select(`
                *,
                usuarios:autor_id (usuario)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        todosArtigos = artigos || [];
        exibirArtigos(todosArtigos);
    } catch (error) {
        console.error('Erro ao carregar artigos:', error);
    }
}

function exibirArtigos(artigos) {
    const container = document.getElementById('articlesList');
    
    if (artigos.length === 0) {
        container.innerHTML = `
            <div class="no-articles">
                <h3>Nenhum artigo encontrado</h3>
                <p>Seja o primeiro a publicar um artigo!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = artigos.map(artigo => `
        <div class="article-card">
            <div class="article-header">
                <h3>${artigo.titulo}</h3>
                <span class="article-categoria">${artigo.categoria}</span>
            </div>
            <div class="article-meta">
                <span class="article-autor">Por: ${artigo.usuarios?.usuario || 'Anônimo'}</span>
                <span class="article-data">${new Date(artigo.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            <div class="article-content article-content-preview">
                ${artigo.conteudo}
            </div>
            <button class="read-more" onclick="lerArtigoCompleto(${artigo.id})">Ler Artigo Completo</button>
        </div>
    `).join('');
}

function filtrarArtigos() {
    const searchTerm = document.getElementById('searchArtigos').value.toLowerCase();
    const categoria = document.getElementById('categoriaFilter').value;
    
    const artigosFiltrados = todosArtigos.filter(artigo => {
        const matchSearch = artigo.titulo.toLowerCase().includes(searchTerm) || 
                           artigo.conteudo.toLowerCase().includes(searchTerm);
        const matchCategoria = !categoria || artigo.categoria === categoria;
        
        return matchSearch && matchCategoria;
    });
    
    exibirArtigos(artigosFiltrados);
}

function buscarArtigos() {
    filtrarArtigos();
}

function lerArtigoCompleto(artigoId) {
    const artigo = todosArtigos.find(a => a.id === artigoId);
    if (artigo) {
        localStorage.setItem('artigoCompleto', JSON.stringify(artigo));
        window.location.href = 'artigo-completo.html';
    }
}

function verificarLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    const loginLink = document.getElementById('loginLink');
    
    if (usuarioLogado && loginLink) {
        loginLink.textContent = 'Minha Conta';
        loginLink.href = 'minha-conta.html';
    }
}