// header.js - Header fixo para TODAS as páginas (VERSÃO CORRIGIDA)
class GlobalHeader {
    constructor() {
        this.init();
    }

    init() {
        // Verificar se já existe um header para evitar duplicação
        if (document.querySelector('.navbar')) {
            console.log('Header já existe, ignorando injeção');
            this.setupExistingHeader();
            return;
        }

        this.injectHeader();
        this.setupMobileMenu();
        this.setActiveLink();
        this.adjustBodyPadding();
        this.setupEventListeners();
    }

    injectHeader() {
        const currentPath = window.location.pathname;
        const isIndexPage = currentPath.includes('index.html') || currentPath.endsWith('/') || currentPath === '';
        
        const headerHTML = `
            <header>
                <nav class="navbar">
                    <div class="nav-brand">
                        <h1>📚 Enciclopédia Financeira</h1>
                    </div>
                    <div class="nav-links">
                        <a href="${isIndexPage ? 'index.html' : '../index.html'}" class="nav-link" data-page="index">Livros</a>
                        <a href="${isIndexPage ? 'pages/artigos.html' : 'artigos.html'}" class="nav-link" data-page="artigos">Artigos</a>
                        <a href="${isIndexPage ? 'pages/publicar.html' : 'publicar.html'}" class="nav-link" data-page="publicar">Publicar</a>
                        <a href="${isIndexPage ? 'pages/minha-conta.html' : 'minha-conta.html'}" class="nav-link" data-page="minha-conta">Minha Conta</a>
                        <a href="${isIndexPage ? 'pages/login.html' : 'login.html'}" class="nav-link" data-page="login">Login</a>
                    </div>
                    <button class="menu-toggle" aria-label="Menu">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </nav>
            </header>
        `;
        
        // Insere o header no início do body, mas preserva o conteúdo existente
        document.body.insertAdjacentHTML('afterbegin', headerHTML);
        console.log('Header injetado com sucesso!');
    }

    setupExistingHeader() {
        // Configura um header que já existe na página
        this.setupMobileMenu();
        this.setActiveLink();
        this.adjustBodyPadding();
        this.setupEventListeners();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        console.log('Path atual:', path);
        
        if (path.includes('artigos.html')) return 'artigos';
        if (path.includes('publicar.html')) return 'publicar';
        if (path.includes('minha-conta.html')) return 'minha-conta';
        if (path.includes('login.html')) return 'login';
        if (path.includes('artigo-completo.html')) return 'artigos'; // Artigo completo pertence à seção de artigos
        return 'index';
    }

    setActiveLink() {
        setTimeout(() => {
            const currentPage = this.getCurrentPage();
            console.log('Página atual:', currentPage);
            
            const links = document.querySelectorAll('.nav-link');
            console.log('Links encontrados:', links.length);
            
            links.forEach(link => {
                const linkPage = link.getAttribute('data-page');
                if (linkPage === currentPage) {
                    link.classList.add('active');
                    console.log('Link ativo:', link.textContent);
                } else {
                    link.classList.remove('active');
                }
            });
        }, 100);
    }

    setupMobileMenu() {
        setTimeout(() => {
            const menuToggle = document.querySelector('.menu-toggle');
            const navLinks = document.querySelector('.nav-links');

            if (menuToggle && navLinks) {
                menuToggle.addEventListener('click', function() {
                    this.classList.toggle('active');
                    navLinks.classList.toggle('active');
                    document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
                });

                // Fechar menu ao clicar em um link
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.addEventListener('click', () => {
                        menuToggle.classList.remove('active');
                        navLinks.classList.remove('active');
                        document.body.style.overflow = '';
                    });
                });
            }
        }, 150);
    }

    adjustBodyPadding() {
        const updatePadding = () => {
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                const headerHeight = navbar.offsetHeight;
                document.body.style.paddingTop = headerHeight + 'px';
            }
        };

        setTimeout(updatePadding, 50);
        setTimeout(updatePadding, 200);
        window.addEventListener('load', updatePadding);
        window.addEventListener('resize', updatePadding);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            const menuToggle = document.querySelector('.menu-toggle');
            const navLinks = document.querySelector('.nav-links');
            
            if (window.innerWidth > 768 && menuToggle && navLinks) {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// INICIALIZAÇÃO MODIFICADA - Aguarda o conteúdo carregar primeiro
function initializeHeader() {
    // Aguarda um pouco mais para garantir que o conteúdo da página esteja carregado
    setTimeout(() => {
        console.log('Inicializando header global...');
        new GlobalHeader();
    }, 300);
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHeader);
} else {
    initializeHeader();
}

// Backup: também inicializa após o load completo
window.addEventListener('load', () => {
    console.log('Página carregada - verificando header...');
    setTimeout(() => {
        const navbar = document.querySelector('.navbar');
        if (!navbar) {
            console.log('Header não encontrado, tentando novamente...');
            new GlobalHeader();
        }
    }, 1000);
});