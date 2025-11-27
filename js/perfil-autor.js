// perfil-autor.js - VERSÃO COM DADOS REAIS
console.log('perfil-autor.js carregado');

let autorAtual = null;
let artigosAutor = [];

async function carregarPerfilAutor() {
    console.log('Carregando perfil do autor...');
    
    const autorData = localStorage.getItem('autorPerfil');
    
    if (!autorData) {
        mostrarErroPerfil('Nenhum autor selecionado.');
        return;
    }
    
    try {
        autorAtual = JSON.parse(autorData);
        console.log('Autor atual:', autorAtual);
        
        await carregarDadosAutor();
        await carregarArtigosAutor();
        
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        mostrarErroPerfil('Erro ao carregar perfil do autor.');
    }
}

async function carregarDadosAutor() {
    try {
        // Buscar dados completos do autor
        const { data: autor, error } = await window.supabase
            .from('usuarios')
            .select('*')
            .eq('id', autorAtual.id)
            .single();
            
        if (error) throw error;
        
        console.log('Dados do autor:', autor);
        
        // Buscar estatísticas reais
        const estatisticas = await buscarEstatisticasAutor(autorAtual.id);
        
        exibirPerfilAutor(autor, estatisticas);
        
    } catch (error) {
        console.error('Erro ao buscar dados do autor:', error);
        // Usar dados básicos se não conseguir buscar
        const estatisticas = await buscarEstatisticasAutor(autorAtual.id);
        exibirPerfilAutor({ usuario: autorAtual.nome, verified: false }, estatisticas);
    }
}

async function buscarEstatisticasAutor(autorId) {
    try {
        console.log('Buscando estatísticas do autor:', autorId);
        
        // Buscar total de artigos publicados
        const { data: artigos, error: errorArtigos } = await window.supabase
            .from('artigos')
            .select('id, created_at')
            .eq('autor_id', autorId);
            
        if (errorArtigos) throw errorArtigos;
        
        const totalArtigos = artigos ? artigos.length : 0;
        
        // Buscar data do primeiro artigo para calcular tempo de atividade
        let dataPrimeiroArtigo = null;
        if (artigos && artigos.length > 0) {
            const datasCriacao = artigos.map(a => new Date(a.created_at));
            dataPrimeiroArtigo = new Date(Math.min(...datasCriacao));
        }
        
        // Buscar dados do usuário para pegar data de criação da conta
        const { data: usuario, error: errorUsuario } = await window.supabase
            .from('usuarios')
            .select('created_at')
            .eq('id', autorId)
            .single();
            
        if (errorUsuario) {
            console.warn('Não foi possível buscar data de criação do usuário:', errorUsuario);
        }
        
        const tempoAtividade = calcularTempoAtividadeReal(usuario?.created_at, dataPrimeiroArtigo);
        
        return {
            totalArtigos: totalArtigos,
            tempoAtividade: tempoAtividade,
            dataPrimeiroArtigo: dataPrimeiroArtigo,
            dataCriacaoConta: usuario?.created_at
        };
        
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return {
            totalArtigos: 0,
            tempoAtividade: 'Recente',
            dataPrimeiroArtigo: null,
            dataCriacaoConta: null
        };
    }
}

function calcularTempoAtividadeReal(dataCriacaoConta, dataPrimeiroArtigo) {
    // Usar a data mais antiga entre criação da conta e primeiro artigo
    let dataReferencia = dataCriacaoConta;
    
    if (dataPrimeiroArtigo && (!dataCriacaoConta || dataPrimeiroArtigo < new Date(dataCriacaoConta))) {
        dataReferencia = dataPrimeiroArtigo;
    }
    
    if (!dataReferencia) return 'Recente';
    
    const dataInicio = new Date(dataReferencia);
    const agora = new Date();
    const diferencaMs = agora - dataInicio;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
    
    if (diferencaDias < 1) return 'Hoje';
    if (diferencaDias === 1) return '1 dia';
    if (diferencaDias < 30) return `${diferencaDias} dias`;
    
    const diferencaMeses = Math.floor(diferencaDias / 30);
    if (diferencaMeses === 1) return '1 mês';
    if (diferencaMeses < 12) return `${diferencaMeses} meses`;
    
    const anos = Math.floor(diferencaMeses / 12);
    const mesesRestantes = diferencaMeses % 12;
    
    if (mesesRestantes === 0) {
        return `${anos} ano${anos > 1 ? 's' : ''}`;
    } else {
        return `${anos} ano${anos > 1 ? 's' : ''} e ${mesesRestantes} mes${mesesRestantes > 1 ? 'es' : ''}`;
    }
}

async function carregarArtigosAutor() {
    try {
        console.log('Buscando artigos do autor:', autorAtual.id);
        
        const { data: artigos, error } = await window.supabase
            .from('artigos')
            .select('*')
            .eq('autor_id', autorAtual.id)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        artigosAutor = artigos || [];
        console.log('Artigos encontrados:', artigosAutor);
        exibirArtigosAutor();
        
    } catch (error) {
        console.error('Erro ao buscar artigos:', error);
        mostrarErroArtigos('Erro ao carregar artigos.');
    }
}

function exibirPerfilAutor(autor, estatisticas) {
    const profileHeader = document.getElementById('profileHeader');
    
    if (!profileHeader) return;
    
    profileHeader.innerHTML = `
        <div class="author-avatar">
            ${autor.usuario ? autor.usuario.charAt(0).toUpperCase() : 'A'}
        </div>
        <div class="author-info-profile">
            <h1 class="author-name">${autor.usuario || autorAtual.nome}</h1>
            ${autor.verified ? 
                '<div class="verified-badge-profile" title="Autor verificado">' +
                    '<img src="../images/verified-white.png" alt="Verificado" />' +
                    '<span>Autor Verificado</span>' +
                '</div>' : 
                '<div class="unverified-badge-profile" title="Autor não verificado">' +
                    '<img src="../images/noverified.png" alt="Não Verificado" />' +
                    '<span>Autor Não Verificado</span>' +
                '</div>'
            }
        </div>
        <div class="author-stats">
            <div class="stat-item">
                <span class="stat-number">${estatisticas.totalArtigos}</span>
                <span class="stat-label">Artigos Publicados</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${estatisticas.tempoAtividade}</span>
                <span class="stat-label">Tempo na Plataforma</span>
            </div>
            ${estatisticas.dataPrimeiroArtigo ? `
            <div class="stat-item">
                <span class="stat-date">Desde ${new Date(estatisticas.dataPrimeiroArtigo).toLocaleDateString('pt-BR')}</span>
                <span class="stat-label">Primeiro Artigo</span>
            </div>
            ` : ''}
        </div>
    `;
}

function exibirArtigosAutor() {
    const articlesGrid = document.getElementById('articlesGrid');
    
    if (!articlesGrid) return;
    
    if (artigosAutor.length === 0) {
        articlesGrid.innerHTML = `
            <div class="no-articles">
                <p>📝 Este autor ainda não publicou artigos.</p>
            </div>
        `;
        return;
    }
    
    articlesGrid.innerHTML = artigosAutor.map(artigo => `
        <div class="article-card-profile" onclick="abrirArtigo(${artigo.id})">
            <div class="article-card-content">
                <div class="article-card-header">
                    <span class="article-category">${formatarCategoria(artigo.categoria)}</span>
                    <span class="article-date">
                        ${new Date(artigo.created_at).toLocaleDateString('pt-BR')}
                    </span>
                </div>
                <h3 class="article-title-profile">${artigo.titulo}</h3>
                <p class="article-excerpt-profile">
                    ${artigo.descricao || 'Clique para ler o artigo completo...'}
                </p>
            </div>
            <div class="article-card-footer">
                <button class="read-more-btn" onclick="event.stopPropagation(); abrirArtigo(${artigo.id})">
                    Ler Artigo →
                </button>
            </div>
        </div>
    `).join('');
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

function abrirArtigo(artigoId) {
    console.log('Abrindo artigo:', artigoId);
    const artigo = artigosAutor.find(a => a.id === artigoId);
    if (artigo) {
        localStorage.setItem('artigoCompleto', JSON.stringify(artigo));
        window.location.href = 'artigo-completo.html';
    }
}

function voltarParaArtigo() {
    window.history.back();
}

function mostrarErroPerfil(mensagem) {
    const profileHeader = document.getElementById('profileHeader');
    if (profileHeader) {
        profileHeader.innerHTML = `
            <div class="error-message">
                <h2>Erro</h2>
                <p>${mensagem}</p>
                <button onclick="window.history.back()" class="btn btn-primary">
                    ← Voltar
                </button>
            </div>
        `;
    }
}

function mostrarErroArtigos(mensagem) {
    const articlesGrid = document.getElementById('articlesGrid');
    if (articlesGrid) {
        articlesGrid.innerHTML = `
            <div class="error-message">
                <p>${mensagem}</p>
            </div>
        `;
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado - inicializando perfil do autor');
    setTimeout(() => {
        carregarPerfilAutor();
    }, 300);
});