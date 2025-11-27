// artigo-completo.js - VERSÃO PREMIUM COMPLETA
console.log('🎯 artigo-completo.js carregado - VERSÃO PREMIUM');

class ArtigoCompleto {
    constructor() {
        this.artigoAtual = null;
        this.autorInfo = null;
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando Artigo Completo...');
        await this.carregarArtigo();
        this.configurarEventos();
    }

    async carregarArtigo() {
        console.log('📖 Carregando artigo...');
        
        const artigoData = localStorage.getItem('artigoCompleto');
        
        if (!artigoData) {
            this.mostrarErro('Nenhum artigo encontrado');
            return;
        }
        
        try {
            this.artigoAtual = JSON.parse(artigoData);
            console.log('✅ Artigo carregado:', this.artigoAtual);
            
            await this.exibirArtigo();
            this.atualizarMetaTags();
            
        } catch (error) {
            console.error('❌ Erro ao carregar artigo:', error);
            this.mostrarErro('Erro ao carregar o artigo');
        }
    }

    async exibirArtigo() {
        console.log('🎨 Exibindo artigo completo...');
        
        // Aguardar DOM estar pronto
        await this.aguardarDOM();
        
        const elements = this.buscarElementos();
        if (!this.validarElementos(elements)) return;
        
        // Buscar informações do autor
        await this.buscarAutor();
        
        // Atualizar interface
        this.atualizarInterface(elements);
        this.aplicarEstilosConteudo();
        
        console.log('✅ Artigo exibido com sucesso!');
    }

    buscarElementos() {
        return {
            title: document.getElementById('articleTitleFull'),
            category: document.getElementById('articleCategoriaFull'),
            date: document.getElementById('articleDataFull'),
            author: document.getElementById('articleAuthorFull'),
            content: document.getElementById('articleContentFull'),
            container: document.getElementById('mainArticleContainer')
        };
    }

    validarElementos(elements) {
        for (const [key, element] of Object.entries(elements)) {
            if (!element) {
                console.error(`❌ Elemento não encontrado: ${key}`);
                this.tentarFallback(elements, key);
                if (!elements[key]) return false;
            }
        }
        return true;
    }

    tentarFallback(elements, key) {
        const fallbacks = {
            title: 'articleTitle',
            category: 'articleCategoria', 
            date: 'articleData',
            author: 'articleAuthor',
            content: 'articleContent'
        };
        
        const fallbackId = fallbacks[key];
        if (fallbackId) {
            elements[key] = document.getElementById(fallbackId);
            console.log(`🔄 Usando fallback: ${fallbackId}`);
        }
    }

    async buscarAutor() {
        try {
            const { data: usuario, error } = await window.supabase
                .from('usuarios')
                .select('usuario, verified, created_at')
                .eq('id', this.artigoAtual.autor_id)
                .single();
                
            if (!error && usuario) {
                this.autorInfo = {
                    nome: usuario.usuario,
                    verificado: usuario.verified || false,
                    experiencia: this.calcularExperiencia(usuario.created_at)
                };
                console.log('👤 Autor encontrado:', this.autorInfo);
            } else {
                this.autorInfo = { nome: 'Anônimo', verificado: false, experiencia: 'Recente' };
                console.warn('⚠️ Autor não encontrado');
            }
        } catch (error) {
            console.error('❌ Erro ao buscar autor:', error);
            this.autorInfo = { nome: 'Anônimo', verificado: false, experiencia: 'Recente' };
        }
    }

    calcularExperiencia(dataCriacao) {
        if (!dataCriacao) return 'Recente';
        
        const meses = (new Date() - new Date(dataCriacao)) / (1000 * 60 * 60 * 24 * 30);
        if (meses < 1) return 'Novato';
        if (meses < 6) return 'Experiente';
        if (meses < 12) return 'Veterano';
        return 'Especialista';
    }

    atualizarInterface(elements) {
        // Título e metadados
        elements.title.textContent = this.artigoAtual.titulo || 'Artigo sem título';
        elements.category.textContent = this.formatarCategoria(this.artigoAtual.categoria);
        elements.date.textContent = this.formatarData(this.artigoAtual.created_at);
        
        // Autor com selo
        elements.author.innerHTML = this.criarHTMLAutor();
        
        // Conteúdo
        elements.content.innerHTML = this.artigoAtual.conteudo || '<p class="no-content">Conteúdo não disponível.</p>';
        
        // Título da página
        document.title = `${this.artigoAtual.titulo} - Enciclopédia Financeira`;
    }

    criarHTMLAutor() {
        const { nome, verificado, experiencia } = this.autorInfo;
        
        return `
            <div class="author-info-premium">
                <div class="author-main">
                    <span class="author-by">Escrito por</span>
                    <div class="author-clickable" onclick="abrirPerfilAutor(${this.artigoAtual.autor_id}, '${nome}')">
                        <span class="author-name">${nome}</span>
                        ${verificado ? 
                            '<div class="verified-badge-premium" title="Autor verificado">' +
                                '<img src="../images/verified.png" alt="Verificado" class="badge-img" />' +
                            '</div>' : 
                            '<div class="unverified-badge-premium" title="Autor não verificado">' +
                                '<img src="../images/noverified.png" alt="Não Verificado" class="badge-img" />' +
                            '</div>'
                        }
                    </div>
                </div>
                <div class="author-meta">
                    <span class="author-experience">${experiencia}</span>
                    <span class="author-divider">•</span>
                    <span class="article-reading-time">${this.calcularTempoLeitura()} min de leitura</span>
                </div>
            </div>
        `;
    }

    calcularTempoLeitura() {
        const palavras = this.artigoAtual.conteudo ? this.artigoAtual.conteudo.split(/\s+/).length : 0;
        return Math.max(1, Math.ceil(palavras / 200)); // 200 palavras por minuto
    }

    aplicarEstilosConteudo() {
        const contentElement = document.getElementById('articleContentFull');
        if (!contentElement) return;

        // Adicionar classes para estilização
        contentElement.classList.add('conteudo-formatado');
        
        // Processar elementos específicos
        this.processarImagens(contentElement);
        this.processarLinks(contentElement);
        this.processarCodigo(contentElement);
        this.processarTabelas(contentElement);
    }

    processarImagens(container) {
        const imagens = container.querySelectorAll('img');
        imagens.forEach(img => {
            img.classList.add('imagem-formatada');
            img.loading = 'lazy';
        });
    }

    processarLinks(container) {
        const links = container.querySelectorAll('a');
        links.forEach(link => {
            if (link.href && !link.href.startsWith('#')) {
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.classList.add('link-externo');
            }
        });
    }

    processarCodigo(container) {
        const codigos = container.querySelectorAll('pre, code');
        codigos.forEach(codigo => {
            codigo.classList.add('codigo-formatado');
        });
    }

    formatarCategoria(categoria) {
        const categorias = {
            'investimentos': '💰 Investimentos',
            'economia': '📈 Economia', 
            'financas_pessoais': '💳 Finanças Pessoais',
            'mercado_financeiro': '📊 Mercado Financeiro',
            'criptomoedas': '₿ Criptomoedas',
            'planejamento': '📅 Planejamento'
        };
        return categorias[categoria] || categoria || '📝 Sem categoria';
    }

    formatarData(dataString) {
        if (!dataString) return 'Data desconhecida';
        
        const data = new Date(dataString);
        const options = {
            year: 'numeric',
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return data.toLocaleDateString('pt-BR', options);
    }

    atualizarMetaTags() {
        // Atualizar meta tags para SEO
        const metaDescricao = document.querySelector('meta[name="description"]');
        if (metaDescricao && this.artigoAtual.conteudo) {
            const descricao = this.artigoAtual.conteudo.substring(0, 160) + '...';
            metaDescricao.setAttribute('content', descricao);
        }
    }

    aguardarDOM() {
        return new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    mostrarErro(mensagem) {
        const container = document.getElementById('mainArticleContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h2>Artigo não encontrado</h2>
                <p>${mensagem}</p>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="voltarParaArtigos()">
                        ← Voltar para Artigos
                    </button>
                    <button class="btn btn-secondary" onclick="window.location.reload()">
                        🔄 Tentar Novamente
                    </button>
                </div>
            </div>
        `;
    }

    // Adicione este método na classe ArtigoCompleto
    processarTabelas(container) {
        const tabelas = container.querySelectorAll('table');
        
        tabelas.forEach((tabela, index) => {
            // Adicionar classe base
            tabela.classList.add('tabela-formatada');
            
            // Adicionar container responsivo
            const container = document.createElement('div');
            container.className = 'table-container';
            tabela.parentNode.insertBefore(container, tabela);
            container.appendChild(tabela);
            
            // Adicionar zebra striping para tabelas com muitas linhas
            if (tabela.rows.length > 5) {
                tabela.classList.add('zebra');
            }
            
            // Adicionar numeração para referência
            const caption = tabela.querySelector('caption');
            if (!caption) {
                const novaCaption = document.createElement('caption');
                novaCaption.className = 'table-caption';
                novaCaption.textContent = `Tabela ${index + 1}`;
                tabela.insertBefore(novaCaption, tabela.firstChild);
            }
            
            // Processar células numéricas
            this.processarCelulasNumericas(tabela);
        });
    }

    processarCelulasNumericas(tabela) {
        const celulas = tabela.querySelectorAll('td');
        
        celulas.forEach(celula => {
            const texto = celula.textContent.trim();
            
            // Detectar números
            if (/^-?\d+([.,]\d+)?$/.test(texto)) {
                celula.classList.add('number');
                
                // Detectar valores monetários
                if (texto.includes(',') || texto.includes('.')) {
                    const numero = parseFloat(texto.replace(',', '.'));
                    if (!isNaN(numero)) {
                        celula.classList.add('currency');
                        celula.textContent = numero.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                    }
                }
            }
            
            // Detectar porcentagens
            if (texto.endsWith('%')) {
                celula.classList.add('percentage', 'number');
            }
            
            // Destacar células baseadas no conteúdo
            if (texto.startsWith('+') || /^\d+([.,]\d+)?$/.test(texto) && parseFloat(texto) > 0) {
                celula.classList.add('positive');
            } else if (texto.startsWith('-') || /^-\d+([.,]\d+)?$/.test(texto)) {
                celula.classList.add('negative');
            }
        });
    }

    configurarEventos() {
        // Evento de impressão melhorado
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                this.imprimirArtigo();
            }
        });

        // Copiar link do artigo
        this.configurarCopiarLink();
    }

    imprimirArtigo() {
        const estiloOriginal = document.querySelector('link[rel="stylesheet"]');
        if (estiloOriginal) estiloOriginal.disabled = true;
        
        window.print();
        
        if (estiloOriginal) estiloOriginal.disabled = false;
    }

    configurarCopiarLink() {
        // Adicionar botão de copiar link se não existir
        if (!document.querySelector('.btn-copiar-link')) {
            const shareBtn = document.querySelector('.action-btn[onclick*="compartilharArtigo"]');
            if (shareBtn) {
                const copyBtn = shareBtn.cloneNode(true);
                copyBtn.innerHTML = '📋 Copiar Link';
                copyBtn.onclick = this.copiarLinkArtigo;
                copyBtn.classList.add('btn-copiar-link');
                shareBtn.parentNode.insertBefore(copyBtn, shareBtn.nextSibling);
            }
        }
    }

    async copiarLinkArtigo() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            
            // Feedback visual
            const btn = event.target;
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅ Copiado!';
            btn.style.background = '#27ae60';
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao copiar link:', error);
            alert('❌ Erro ao copiar link');
        }
    }
}

// === FUNÇÕES GLOBAIS ===
function abrirPerfilAutor(autorId, autorNome) {
    console.log('👤 Abrindo perfil do autor:', autorId, autorNome);
    
    const autorData = {
        id: autorId,
        nome: autorNome
    };
    localStorage.setItem('autorPerfil', JSON.stringify(autorData));
    window.location.href = 'perfil-autor.html';
}

function compartilharArtigo() {
    const titulo = document.getElementById('articleTitleFull')?.textContent || 'Artigo da Enciclopédia Financeira';
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: titulo,
            text: 'Confira este artigo da Enciclopédia Financeira:',
            url: url
        });
    } else {
        navigator.clipboard.writeText(url).then(() => {
            alert('📋 Link copiado para a área de transferência!');
        });
    }
}

function voltarParaArtigos() {
    window.location.href = 'artigos.html';
}

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOM carregado - inicializando sistema de artigo');
    setTimeout(() => {
        window.artigoApp = new ArtigoCompleto();
    }, 100);
});

console.log('✅ artigo-completo.js carregado completamente - SISTEMA PREMIUM');