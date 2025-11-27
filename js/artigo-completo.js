// artigo-completo.js - VERSÃO CORRIGIDA
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado - inicializando artigo completo');
    // Aguarda um pouco mais para o header carregar
    setTimeout(() => {
        carregarArtigoCompleto();
    }, 500);
});
async function carregarArtigoCompleto() {
    console.log('Iniciando carregamento do artigo...');
    
    const artigoData = localStorage.getItem('artigoCompleto');
    
    if (!artigoData) {
        console.error('Nenhum artigo encontrado no localStorage');
        mostrarErroArtigo();
        return;
    }
    
    try {
        const artigo = JSON.parse(artigoData);
        console.log('Artigo parseado:', artigo);
        await exibirArtigoCompleto(artigo);
    } catch (error) {
        console.error('Erro ao parsear artigo:', error);
        mostrarErroArtigo();
    }
}

function mostrarErroArtigo() {
    const mainContainer = document.getElementById('mainArticleContainer');
    if (mainContainer) {
        mainContainer.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 4rem;">
                <h2>Artigo não encontrado</h2>
                <p>O artigo solicitado não está disponível ou ocorreu um erro ao carregar.</p>
                <button onclick="voltarParaArtigos()" class="btn" style="margin-top: 1rem;">
                    ← Voltar para Artigos
                </button>
            </div>
        `;
    }
}

async function exibirArtigoCompleto(artigo) {
    console.log('Exibindo artigo completo:', artigo);
    
    // Aguardar um pouco para garantir que o DOM esteja pronto
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Buscar elementos com IDs específicos
    const elements = {
        title: document.getElementById('articleTitleFull'),
        category: document.getElementById('articleCategoriaFull'),
        date: document.getElementById('articleDataFull'),
        author: document.getElementById('articleAuthorFull'),
        content: document.getElementById('articleContentFull')
    };
    
    console.log('Elementos encontrados:', elements);
    
    // Verificar se todos os elementos existem
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Elemento não encontrado: ${key}`);
            console.log('Tentando buscar elementos alternativos...');
            
            // Tentar buscar elementos com IDs antigos como fallback
            const fallbackId = key === 'title' ? 'articleTitle' : 
                              key === 'category' ? 'articleCategoria' :
                              key === 'date' ? 'articleData' :
                              key === 'author' ? 'articleAuthor' :
                              key === 'content' ? 'articleContent' : key;
            
            elements[key] = document.getElementById(fallbackId);
            if (!elements[key]) {
                console.error(`Elemento fallback também não encontrado: ${fallbackId}`);
                return;
            }
        }
    }
    
    // Buscar informações do autor
    let autorNome = 'Anônimo';
    try {
        const { data: usuario, error } = await window.supabase
            .from('usuarios')
            .select('usuario')
            .eq('id', artigo.autor_id)
            .single();
            
        if (!error && usuario) {
            autorNome = usuario.usuario;
        }
    } catch (error) {
        console.error('Erro ao buscar autor:', error);
    }
    
    // Atualizar elementos da página
    elements.title.textContent = artigo.titulo || 'Artigo sem título';
    elements.category.textContent = formatarCategoria(artigo.categoria) || 'Sem categoria';
    elements.date.textContent = new Date(artigo.created_at).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) || 'Data desconhecida';
    elements.author.textContent = `Por: ${autorNome}`;
    
    // Exibir conteúdo HTML diretamente
    if (artigo.conteudo) {
        elements.content.innerHTML = artigo.conteudo;
        console.log('Conteúdo inserido no elemento com sucesso!');
    } else {
        elements.content.innerHTML = '<p>Conteúdo não disponível.</p>';
    }
    
    // Atualizar título da página
    document.title = `${artigo.titulo} - Enciclopédia Financeira`;
    
    // Inicializar controles de zoom
    setTimeout(() => {
        try {
            inicializarControlesZoom();
            atualizarZoom();
            console.log('Controles de zoom inicializados');
        } catch (error) {
            console.error('Erro ao inicializar controles de zoom:', error);
        }
    }, 1000);
    
    // INICIALIZAR COMENTÁRIOS - ADICIONE ESTA PARTE
    setTimeout(() => {
        inicializarComentarios(artigo.id);
    }, 1500);
}

// ADICIONE esta função para inicializar comentários
function inicializarComentarios(artigoId) {
    console.log('Inicializando comentários para artigo:', artigoId);
    
    // Verificar se o sistema de comentários está disponível
    if (typeof ComentariosManager !== 'undefined') {
        try {
            window.comentariosManager = new ComentariosManager('artigo', artigoId);
            window.comentariosManager.init();
            console.log('Sistema de comentários inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar comentários:', error);
        }
    } else {
        console.warn('Sistema de comentários não disponível - ComentariosManager não encontrado');
        
        // Fallback básico para comentários
        inicializarComentariosFallback();
    }
}

// Fallback básico para comentários
function inicializarComentariosFallback() {
    const commentForm = document.getElementById('commentFormFull') || document.getElementById('commentForm');
    
    if (commentForm) {
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const commentText = document.getElementById('commentTextFull') || document.getElementById('commentText');
            
            if (commentText && commentText.value.trim()) {
                alert('Comentário enviado! (Sistema de comentários em desenvolvimento)');
                commentText.value = '';
            }
        });
        console.log('Fallback de comentários inicializado');
    }
}

function formatarCategoria(categoria) {
    if (!categoria) return 'Sem categoria';
    
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

// Controles de Zoom
let currentZoom = 100;

function inicializarControlesZoom() {
    // Verificar se já existe controles de zoom
    if (document.querySelector('.zoom-controls')) {
        return;
    }

    try {
        // Criar controles de zoom
        const zoomControls = document.createElement('div');
        zoomControls.className = 'zoom-controls';
        zoomControls.innerHTML = `
            <button class="zoom-btn" onclick="aplicarZoom(-10)">🔍−</button>
            <span class="zoom-level">${currentZoom}%</span>
            <button class="zoom-btn" onclick="aplicarZoom(10)">🔍＋</button>
            <button class="zoom-btn" onclick="resetarZoom()">↺</button>
            <button class="zoom-btn" onclick="toggleModoLeitura()">📖</button>
        `;
        
        document.body.appendChild(zoomControls);
        console.log('Controles de zoom criados com sucesso');
    } catch (error) {
        console.error('Erro ao criar controles de zoom:', error);
    }
}

function aplicarZoom(incremento) {
    const novoZoom = currentZoom + incremento;
    
    // Limites do zoom
    if (novoZoom >= 80 && novoZoom <= 200) {
        currentZoom = novoZoom;
        atualizarZoom();
    }
}

function resetarZoom() {
    currentZoom = 100;
    atualizarZoom();
}

// CORRIJA a função atualizarZoom - use o ID correto
function atualizarZoom() {
    // Tente primeiro com o ID novo, depois com o fallback
    let content = document.getElementById('articleContentFull');
    if (!content) {
        content = document.getElementById('articleContent'); // Fallback para ID antigo
    }
    
    const zoomLevel = document.querySelector('.zoom-level');
    
    if (content && zoomLevel) {
        // Aplica zoom diretamente no estilo
        content.style.fontSize = `${currentZoom}%`;
        content.style.lineHeight = `${1.6 + (currentZoom - 100) * 0.005}`;
        
        zoomLevel.textContent = `${currentZoom}%`;
        console.log('Zoom atualizado para:', currentZoom + '%');
        console.log('Elemento de conteúdo:', content);
    } else {
        console.error('Elemento de conteúdo ou zoom level não encontrado');
        console.log('Content element:', content);
        console.log('Zoom level element:', zoomLevel);
    }
}

function toggleModoLeitura() {
    try {
        const container = document.querySelector('.article-container');
        const zoomControls = document.querySelector('.zoom-controls');
        
        if (container.classList.contains('reading-mode')) {
            // Sair do modo leitura
            container.classList.remove('reading-mode');
            document.body.style.overflow = 'auto';
            if (zoomControls) zoomControls.style.display = 'flex';
            console.log('Modo leitura desativado');
        } else {
            // Entrar no modo leitura
            container.classList.add('reading-mode');
            document.body.style.overflow = 'hidden';
            
            // Criar controles no modo leitura
            const readingControls = document.createElement('div');
            readingControls.className = 'zoom-controls';
            readingControls.innerHTML = `
                <button class="zoom-btn" onclick="aplicarZoom(-10)">🔍−</button>
                <span class="zoom-level">${currentZoom}%</span>
                <button class="zoom-btn" onclick="aplicarZoom(10)">🔍＋</button>
                <button class="zoom-btn" onclick="resetarZoom()">↺</button>
                <button class="zoom-btn" onclick="toggleModoLeitura()">✕</button>
            `;
            
            container.appendChild(readingControls);
            console.log('Modo leitura ativado');
        }
    } catch (error) {
        console.error('Erro ao alternar modo leitura:', error);
    }
}

function compartilharArtigo() {
    try {
        // Tente primeiro com o ID novo, depois com o fallback
        let titleElement = document.getElementById('articleTitleFull');
        if (!titleElement) {
            titleElement = document.getElementById('articleTitle'); // Fallback
        }
        
        const titulo = titleElement ? titleElement.textContent : 'Artigo da Enciclopédia Financeira';
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
    } catch (error) {
        console.error('Erro ao compartilhar artigo:', error);
    }
}

function voltarParaArtigos() {
    window.location.href = 'artigos.html';
}

// Adicione suporte a teclas de atalho
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case '=':
            case '+':
                e.preventDefault();
                aplicarZoom(10);
                break;
            case '-':
                e.preventDefault();
                aplicarZoom(-10);
                break;
            case '0':
                e.preventDefault();
                resetarZoom();
                break;
            case 'l':
            case 'L':
                e.preventDefault();
                toggleModoLeitura();
                break;
        }
    }
});

// Debug final
console.log('Script artigo-completo.js carregado completamente');