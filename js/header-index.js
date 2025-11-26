// header-index.js - Header específico para a página principal
class DynamicHeaderIndex {
    constructor() {
        this.init();
    }

    init() {
        this.injectHeader();
        this.setupMobileMenu();
        this.setActiveLink();
        this.adjustBodyPadding();
        this.setupEventListeners();
    }

    injectHeader() {
        if (!document.querySelector('.navbar')) {
            const headerHTML = `
                <header>
                    <nav class="navbar">
                        <div class="nav-brand">
                            <h1>📚 Enciclopédia Financeira</h1>
                        </div>
                        <div class="nav-links">
                            <a href="index.html" class="nav-link active" data-page="index">Livros</a>
                            <a href="pages/artigos.html" class="nav-link" data-page="artigos">Artigos</a>
                            <a href="pages/publicar.html" class="nav-link" data-page="publicar">Publicar</a>
                            <a href="pages/login.html" class="nav-link" data-page="login">Login</a>
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
        }
    }

    // ... (os outros métodos são iguais ao header.js anterior)
    setupMobileMenu() {
        const menuToggle = document.querySelector('.menu-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (menuToggle && navLinks) {
            menuToggle.addEventListener('click', () => {
                menuToggle.classList.toggle('active');
                navLinks.classList.toggle('active');
                document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
            });

            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    menuToggle.classList.remove('active');
                    navLinks.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });
        }
    }

    setActiveLink() {
        // Na página principal, "Livros" já está ativo por padrão
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('data-page') === 'index') {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    adjustBodyPadding() {
        const updatePadding = () => {
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                const headerHeight = navbar.offsetHeight;
                document.body.style.paddingTop = headerHeight + 'px';
            }
        };

        updatePadding();
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

document.addEventListener('DOMContentLoaded', () => {
    new DynamicHeaderIndex();
});