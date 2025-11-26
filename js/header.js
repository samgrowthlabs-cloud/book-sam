// header.js - Header fixo para TODAS as páginas
class GlobalHeader {
    constructor() {
        this.init();
    }

    init() {
        this.injectHeader();
        this.setupMobileMenu();
        this.setActiveLink();
        this.adjustBodyPadding();
        this.setupModalFunctionality();
        this.setupEventListeners();
    }

    injectHeader() {
        // Remove qualquer header existente para evitar duplicação
        const existingHeader = document.querySelector('header');
        if (existingHeader) {
            existingHeader.remove();
        }

        const currentPath = window.location.pathname;
        const isIndexPage = currentPath.includes('index.html') || currentPath.endsWith('/') || currentPath === '';
        const isInPagesFolder = currentPath.includes('/pages/');
        
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
        
        document.body.insertAdjacentHTML('afterbegin', headerHTML);
        console.log('Header injetado com sucesso!');
    }

    getCurrentPage() {
        const path = window.location.pathname;
        console.log('Path atual:', path);
        
        if (path.includes('artigos.html')) return 'artigos';
        if (path.includes('publicar.html')) return 'publicar';
        if (path.includes('minha-conta.html')) return 'minha-conta';
        if (path.includes('login.html')) return 'login';
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

            console.log('Menu toggle:', menuToggle);
            console.log('Nav links:', navLinks);

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
                console.log('Padding ajustado para:', headerHeight + 'px');
            }
        };

        setTimeout(updatePadding, 50);
        setTimeout(updatePadding, 200);
        setTimeout(updatePadding, 500);
        
        window.addEventListener('load', updatePadding);
        window.addEventListener('resize', updatePadding);
    }

    setupModalFunctionality() {
        // Esta função será chamada quando o modal for necessário
        setTimeout(() => {
            const modal = document.getElementById('pdfModal');
            const closeBtn = document.querySelector('.close');

            if (modal && closeBtn) {
                console.log('Modal encontrado, configurando...');

                window.openPdf = function(pdfUrl) {
                    const pdfViewer = document.getElementById('pdfViewer');
                    if (pdfViewer) {
                        pdfViewer.src = pdfUrl;
                        modal.style.display = 'block';
                        document.body.style.overflow = 'hidden';
                    }
                };

                window.closeModal = function() {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                    const pdfViewer = document.getElementById('pdfViewer');
                    if (pdfViewer) {
                        pdfViewer.src = '';
                    }
                };

                closeBtn.addEventListener('click', window.closeModal);

                window.addEventListener('click', function(event) {
                    if (event.target === modal) {
                        window.closeModal();
                    }
                });

                document.addEventListener('keydown', function(event) {
                    if (event.key === 'Escape') {
                        window.closeModal();
                    }
                });
            }
        }, 200);
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

// INICIALIZAÇÃO IMEDIATA
console.log('Inicializando header global...');
new GlobalHeader();

// Também inicializa quando o DOM estiver pronto como backup
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, verificando header...');
    if (!document.querySelector('.navbar')) {
        console.log('Header não encontrado, reinjetando...');
        new GlobalHeader();
    }
});

// Força uma nova inicialização após o load completo
window.addEventListener('load', () => {
    console.log('Página totalmente carregada, verificando header final...');
    setTimeout(() => {
        const navbar = document.querySelector('.navbar');
        if (!navbar) {
            console.log('Header ainda não encontrado, tentando novamente...');
            new GlobalHeader();
        }
    }, 1000);
});