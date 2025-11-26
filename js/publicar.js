document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacao();
    
    const artigoForm = document.getElementById('artigoForm');
    const livroForm = document.getElementById('livroForm');
    
    if (artigoForm) {
        artigoForm.addEventListener('submit', publicarArtigo);
    }
    
    if (livroForm) {
        livroForm.addEventListener('submit', publicarLivro);
    }
});

function verificarAutenticacao() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    const loginLink = document.getElementById('loginLink');
    
    if (!usuarioLogado) {
        window.location.href = 'login.html';
        return;
    }
    
    if (loginLink) {
        loginLink.textContent = 'Minha Conta';
        loginLink.href = 'minha-conta.html';
    }
}

function abrirTab(tabName) {
    // Esconder todas as tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar tab selecionada
    const tabElement = document.getElementById(`form-${tabName}`);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

async function publicarArtigo(event) {
    event.preventDefault();
    
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    const messageDiv = document.getElementById('publishMessage');
    
    // Verificar se os elementos existem antes de acessá-los
    const tituloInput = document.getElementById('artigoTitulo');
    const categoriaInput = document.getElementById('artigoCategoria');
    const conteudoInput = document.getElementById('artigoConteudo');
    
    if (!tituloInput || !categoriaInput || !conteudoInput) {
        console.error('Elementos do formulário de artigo não encontrados');
        if (messageDiv) {
            messageDiv.textContent = 'Erro: Formulário incompleto';
            messageDiv.className = 'message error';
        }
        return;
    }
    
    const artigo = {
        titulo: tituloInput.value,
        categoria: categoriaInput.value,
        conteudo: conteudoInput.value,
        autor_id: usuarioLogado.id
    };
    
    try {
        const { data, error } = await window.supabase
            .from('artigos')
            .insert([artigo]);

        if (error) throw error;

        if (messageDiv) {
            messageDiv.textContent = 'Artigo publicado com sucesso!';
            messageDiv.className = 'message success';
        }
        
        // Limpar formulário
        document.getElementById('artigoForm').reset();
        
        // Redirecionar para artigos após 2 segundos
        setTimeout(() => {
            window.location.href = 'artigos.html';
        }, 2000);
        
    } catch (error) {
        console.error('Erro ao publicar artigo:', error);
        if (messageDiv) {
            messageDiv.textContent = 'Erro ao publicar artigo: ' + error.message;
            messageDiv.className = 'message error';
        }
    }
}

async function publicarLivro(event) {
    event.preventDefault();
    
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    const messageDiv = document.getElementById('publishMessage');
    
    // Verificar se os elementos existem antes de acessá-los
    const tituloInput = document.getElementById('livroTitulo');
    const generoInput = document.getElementById('livroGenero');
    const categoriaInput = document.getElementById('livroCategoria');
    const descricaoInput = document.getElementById('livroDescricao');
    const linkInput = document.getElementById('livroLink');
    
    if (!tituloInput || !generoInput || !categoriaInput || !linkInput) {
        console.error('Elementos do formulário de livro não encontrados');
        if (messageDiv) {
            messageDiv.textContent = 'Erro: Formulário incompleto';
            messageDiv.className = 'message error';
        }
        return;
    }
    
    const livro = {
        titulo: tituloInput.value,
        genero: generoInput.value,
        categoria: categoriaInput.value,
        descricao: descricaoInput ? descricaoInput.value : '',
        link_pdf: linkInput.value,
        autor_id: usuarioLogado.id
    };
    
    try {
        const { data, error } = await window.supabase
            .from('livros')
            .insert([livro]);

        if (error) throw error;

        if (messageDiv) {
            messageDiv.textContent = 'Livro publicado com sucesso!';
            messageDiv.className = 'message success';
        }
        
        // Limpar formulário
        document.getElementById('livroForm').reset();
        
        // Redirecionar para livros após 2 segundos
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('Erro ao publicar livro:', error);
        if (messageDiv) {
            messageDiv.textContent = 'Erro ao publicar livro: ' + error.message;
            messageDiv.className = 'message error';
        }
    }
}