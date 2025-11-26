// js/livro.js

// Carregar livros ao iniciar
document.addEventListener('DOMContentLoaded', function() {
  // Só adiciona listeners se os elementos existirem
  carregarLivros();

  const generoFilter = document.getElementById('generoFilter');
  const categoriaFilter = document.getElementById('categoriaFilter');
  const searchInput = document.getElementById('searchInput');

  if (generoFilter) generoFilter.addEventListener('change', filtrarLivros);
  if (categoriaFilter) categoriaFilter.addEventListener('change', filtrarLivros);
  if (searchInput) searchInput.addEventListener('input', filtrarLivros);

  // Modal close listeners (já existiam, só garantindo que os elementos existam)
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

    // defensive: pode ser null/undefined
    exibirLivros(livros || []);
  } catch (error) {
    console.error('Erro ao carregar livros:', error);
    const grid = document.getElementById('booksGrid');
    if (grid) grid.innerHTML = '<p>Erro ao carregar livros.</p>';
  }
}

function exibirLivros(livros) {
  const grid = document.getElementById('booksGrid');
  if (!grid) return;

  if (!Array.isArray(livros) || livros.length === 0) {
    grid.innerHTML = '<p>Nenhum livro encontrado.</p>';
    return;
  }

  // cria cards com data-attributes e botões que abrem modal — não inicializa comentários globalmente aqui
  grid.innerHTML = livros.map(livro => `
    <div class="book-card" data-livro-id="${livro.id}">
      <h3>${escapeHtml(livro.titulo)}</h3>
      <div class="book-meta">
        <span class="genero">${escapeHtml(livro.genero)}</span>
        <span class="categoria">${escapeHtml(livro.categoria)}</span>
      </div>
      <p>${escapeHtml(livro.descricao || 'Sem descrição disponível.')}</p>
      <div class="book-actions">
        <button class="read-btn" data-pdf="${livro.link_pdf || ''}">Ler Livro</button>
      </div>
    </div>
  `).join('');

  // depois do HTML criado, adiciona listeners nos botões
  const buttons = grid.querySelectorAll('.read-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const url = this.getAttribute('data-pdf');
      abrirPDF(url);

      // opcional: se quiser carregar comentários desse livro na modal — pega o id do card pai
      const card = this.closest('.book-card');
      const livroId = card ? card.getAttribute('data-livro-id') : null;
      if (livroId) {
        // inicializa ou atualiza a área de comentários aqui
        // exemplo: initComentariosParaLivro(livroId);
        // *** NÃO chame ComentariosManager globalmente sem contexto ***
        // se você tiver um manager, inicialize-o com o livroId aqui.
      }
    });
  });
}

// simples escape para evitar injeção de HTML ao inserir strings do DB
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
