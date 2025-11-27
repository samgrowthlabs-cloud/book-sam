// js/livros.js - VERSÃO COM SELO DE CONFIABILIDADE

// Carregar livros ao iniciar
document.addEventListener('DOMContentLoaded', function() {
    carregarLivros();

    const generoFilter = document.getElementById('generoFilter');
    const categoriaFilter = document.getElementById('categoriaFilter');
    const searchInput = document.getElementById('searchInput');

    if (generoFilter) generoFilter.addEventListener('change', filtrarLivros);
    if (categoriaFilter) categoriaFilter.addEventListener('change', filtrarLivros);
    if (searchInput) searchInput.addEventListener('input', filtrarLivros);

    // Modal close listeners
    const modal = document.getElementById('pdfModal');
    const span = document.getElementsByClassName('close')[0];

    if (span) {
        span.onclick = function() {
            if (modal) modal.style.display = 'none';
            const iframe = document.getElementById('pdfViewer');
            if (iframe) iframe.src = '';
        };
    }

    window.onclick = function(event) {
        if (event.target === modal) {
            if (modal) modal.style.display = 'none';
            const iframe = document.getElementById('pdfViewer');
            if (iframe) iframe.src = '';
        }
    };
});

async function carregarLivros() {
    try {
        const { data: livros, error } = await window.supabase
            .from('livros')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Buscar informações dos autores para verificação
        const livrosComAutores = await Promise.all(
            (livros || []).map(async (livro) => {
                const autorInfo = await buscarAutorInfo(livro.autor_id);
                return {
                    ...livro,
                    autor_verificado: autorInfo?.verified || false,
                    autor_nome: autorInfo?.usuario || 'Anônimo'
                };
            })
        );

        exibirLivros(livrosComAutores);
    } catch (error) {
        console.error('Erro ao carregar livros:', error);
        const grid = document.getElementById('booksGrid');
        if (grid) grid.innerHTML = '<p>Erro ao carregar livros.</p>';
    }
}

async function buscarAutorInfo(autorId) {
    try {
        const { data: autor, error } = await window.supabase
            .from('usuarios')
            .select('usuario, verified')
            .eq('id', autorId)
            .single();

        if (error) throw error;
        return autor;
    } catch (error) {
        console.error('Erro ao buscar autor:', error);
        return null;
    }
}

function exibirLivros(livros) {
    const grid = document.getElementById('booksGrid');
    if (!grid) return;

    if (!Array.isArray(livros) || livros.length === 0) {
        grid.innerHTML = '<p>Nenhum livro encontrado.</p>';
        return;
    }

    grid.innerHTML = livros.map(livro => `
        <div class="book-card" data-livro-id="${livro.id}">
            <div class="book-header">
                <h3>${escapeHtml(livro.titulo)}</h3>
                <div class="trust-badge ${livro.autor_verificado ? 'trusted' : 'not-trusted'}">
                    <img src="${livro.autor_verificado ? 'images/verified.png' : 'images/noverified.png'}" 
                         alt="${livro.autor_verificado ? 'Verificado' : 'Não Verificado'}" 
                         class="badge-icon">
                    <span class="badge-text">
                        ${livro.autor_verificado ? 'Arquivo Confiável' : 'Arquivo Não Confiável'}
                    </span>
                </div>
            </div>
            <div class="book-meta">
                <span class="genero">${escapeHtml(livro.genero)}</span>
                <span class="categoria">${escapeHtml(livro.categoria)}</span>
                <span class="autor">Por: ${escapeHtml(livro.autor_nome)}</span>
            </div>
            <p class="book-description">${escapeHtml(livro.descricao || 'Sem descrição disponível.')}</p>
            <div class="book-actions">
                <button class="read-btn" data-pdf="${livro.link_pdf || ''}">Ler Livro</button>
            </div>
        </div>
    `).join('');

    // Adiciona listeners nos botões
    const buttons = grid.querySelectorAll('.read-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const url = this.getAttribute('data-pdf');
            abrirPDF(url);
        });
    });
}

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function filtrarLivros() {
    const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const genero = document.getElementById('generoFilter')?.value;
    const categoria = document.getElementById('categoriaFilter')?.value;

    const cards = document.querySelectorAll('.book-card');

    cards.forEach(card => {
        const titulo = card.querySelector('h3')?.textContent?.toLowerCase() || '';
        const cardGenero = card.querySelector('.genero')?.textContent || '';
        const cardCategoria = card.querySelector('.categoria')?.textContent || '';

        const matchSearch = titulo.includes(searchTerm);
        const matchGenero = !genero || cardGenero === genero;
        const matchCategoria = !categoria || cardCategoria === categoria;

        card.style.display = (matchSearch && matchGenero && matchCategoria) ? 'block' : 'none';
    });
}

function buscarLivros() {
    filtrarLivros();
}

function abrirPDF(url) {
    if (!url) {
        alert('Link do PDF não disponível');
        return;
    }

    const modal = document.getElementById('pdfModal');
    const iframe = document.getElementById('pdfViewer');

    if (iframe) iframe.src = url;
    if (modal) modal.style.display = 'block';
}