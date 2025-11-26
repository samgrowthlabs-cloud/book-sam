document.addEventListener('DOMContentLoaded', function() {
    carregarArtigoCompleto();
    verificarLogin();
});

async function carregarArtigoCompleto() {
    const artigoData = localStorage.getItem('artigoCompleto');
    
    if (!artigoData) {
        document.body.innerHTML = `
            <div class="navbar">
                <div class="nav-brand">
                    <h1>📚 Enciclopédia Financeira</h1>
                </div>
            </div>
            <div class="container">
                <div class="error-message">
                    <h2>Artigo não encontrado</h2>
                    <p>O artigo solicitado não está disponível.</p>
                    <button onclick="voltarParaArtigos()" class="btn">Voltar para Artigos</button>
                </div>
            </div>
        `;
        return;
    }
    
    const artigo = JSON.parse(artigoData);
    exibirArtigoCompleto(artigo);
}

async function exibirArtigoCompleto(artigo) {
    // Buscar informações do autor
    let autor = 'Anônimo';
    try {
        const { data: usuario, error } = await window.supabase
            .from('usuarios')
            .select('usuario')
            .eq('id', artigo.autor_id)
            .single();
            
        if (!error && usuario) {
            autor = usuario.usuario;
        }
    } catch (error) {
        console.error('Erro ao buscar autor:', error);
    }
    
    // Atualizar elementos da página
    document.getElementById('articleTitle').textContent = artigo.titulo;
    document.getElementById('articleCategoria').textContent = formatarCategoria(artigo.categoria);
    document.getElementById('articleData').textContent = new Date(artigo.created_at).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('articleAuthor').textContent = `Por: ${autor}`;
    
    // Formatar e exibir conteúdo
    const conteudoFormatado = formatarConteudo(artigo.conteudo);
    document.getElementById('articleContent').innerHTML = conteudoFormatado;
    
    // Atualizar título da página
    document.title = `${artigo.titulo} - Enciclopédia Financeira`;
    // Inicializar sistema de comentários para artigos
    console.log('Inicializando comentários para artigo:', artigo.id);
    comentariosManager = new ComentariosManager('artigo', artigo.id);
    comentariosManager.init();
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

function formatarConteudo(conteudo) {
    // Processar blocos de código primeiro
    let formatado = conteudo.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
    
    // Processar fórmulas matemáticas entre $$
    formatado = formatado.replace(/\$\$(.+?)\$\$/g, '<div class="formula">$1</div>');
    
    // Processar fórmulas matemáticas inline entre $
    formatado = formatado.replace(/\$(.+?)\$/g, '<span class="math">$1</span>');
    
    // Processar blocos de teorema
    formatado = formatado.replace(/:::theorem\s+([^:]+):::/g, '<div class="theorem"><div class="theorem-title">$1</div>');
    formatado = formatado.replace(/:::end-theorem:::/g, '</div>');
    
    // Processar blocos de nota
    formatado = formatado.replace(/:::note\s+([^:]+):::/g, '<div class="note"><strong>Nota:</strong> $1');
    formatado = formatado.replace(/:::end-note:::/g, '</div>');
    
    // Processar títulos
    formatado = formatado.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    formatado = formatado.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    formatado = formatado.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    formatado = formatado.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    formatado = formatado.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
    formatado = formatado.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
    
    // Processar citações
    formatado = formatado.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    
    // Processar listas não ordenadas
    formatado = formatado.replace(/^- (.+)$/gm, '<ul><li>$1</li></ul>');
    formatado = formatado.replace(/<\/ul>\s*<ul>/g, '');
    
    // Processar listas ordenadas
    formatado = formatado.replace(/^\d+\. (.+)$/gm, '<ol><li>$1</li></ol>');
    formatado = formatado.replace(/<\/ol>\s*<ol>/g, '');
    
    // Processar negrito
    formatado = formatado.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    formatado = formatado.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // Processar itálico
    formatado = formatado.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    formatado = formatado.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // Processar código inline
    formatado = formatado.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Processar links
    formatado = formatado.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    
    // Processar imagens
    formatado = formatado.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    
    // Processar quebras de linha em parágrafos
    formatado = formatado.replace(/\n\n/g, '</p><p>');
    formatado = formatado.replace(/\n/g, '<br>');
    
    // Adicionar parágrafos principais
    formatado = '<p>' + formatado + '</p>';
    
    // Limpar parágrafos vazios
    formatado = formatado.replace(/<p><\/p>/g, '');
    formatado = formatado.replace(/<p><\/(ul|ol|h1|h2|h3|h4|h5|h6|blockquote|pre|div)>/g, '</$1>');
    formatado = formatado.replace(/<(ul|ol|h1|h2|h3|h4|h5|h6|blockquote|pre|div)><\/p>/g, '<$1>');
    
    return formatado;
}

function compartilharArtigo() {
    const titulo = document.getElementById('articleTitle').textContent;
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: titulo,
            text: 'Confira este artigo da Enciclopédia Financeira:',
            url: url
        });
    } else {
        // Fallback para copiar link
        navigator.clipboard.writeText(url).then(() => {
            alert('Link copiado para a área de transferência!');
        });
    }
}

function voltarParaArtigos() {
    window.location.href = 'artigos.html';
}

function verificarLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    const loginLink = document.getElementById('loginLink');
    
    if (usuarioLogado && loginLink) {
        loginLink.textContent = 'Minha Conta';
        loginLink.href = '#';
    }
}