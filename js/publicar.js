let quill;

document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacao();
    inicializarEditor();
    configurarFormularios();
});

async function verificarAutenticacao() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    
    if (!usuarioLogado) {
        mostrarMensagem('Você precisa estar logado para publicar conteúdo.', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return false;
    }
    
    // VERIFICAR BANIMENTO
    const podePublicar = await verificarBanimento();
    if (!podePublicar) {
        return false;
    }
    
    return true;
}

function inicializarEditor() {
    // Configuração simplificada do Quill Editor para evitar problemas
    const toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        ['link', 'image'],
        ['clean']
    ];

    quill = new Quill('#editor-container', {
        modules: {
            toolbar: toolbarOptions
        },
        theme: 'snow',
        placeholder: 'Digite seu artigo aqui...'
    });

    // Ajusta a altura do editor
    setTimeout(() => {
        ajustarAlturaEditor();
    }, 100);
}

function ajustarAlturaEditor() {
    const editor = document.querySelector('#editor-container .ql-editor');
    if (editor) {
        editor.style.minHeight = '300px';
    }
}

function configurarFormularios() {
    const artigoForm = document.getElementById('artigoForm');
    const livroForm = document.getElementById('livroForm');

    // Verificar banimento ao carregar a página
    setTimeout(async () => {
        await verificarBanimento();
    }, 500);

    if (artigoForm) {
        artigoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            publicarArtigo();
        });
    }

    if (livroForm) {
        livroForm.addEventListener('submit', function(e) {
            e.preventDefault();
            publicarLivro();
        });
    }
}

async function publicarArtigo() {
    // Verificar autenticação primeiro
    if (!verificarAutenticacao()) return;

    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    const titulo = document.getElementById('artigoTitulo').value.trim();
    const categoria = document.getElementById('artigoCategoria').value;
    const conteudoHTML = quill.root.innerHTML;

    console.log('Dados do artigo:', { titulo, categoria, conteudoHTML });

    // VERIFICAR BANIMENTO NOVAMENTE (double check)
    const podePublicar = await verificarBanimento();
    if (!podePublicar) return;

    // Validação mais robusta
    if (!titulo) {
        mostrarMensagem('Por favor, digite um título para o artigo.', 'error');
        return;
    }

    if (!categoria) {
        mostrarMensagem('Por favor, selecione uma categoria.', 'error');
        return;
    }

    if (!conteudoHTML || conteudoHTML === '<p><br></p>' || conteudoHTML === '<p></p>') {
        mostrarMensagem('Por favor, digite o conteúdo do artigo.', 'error');
        return;
    }

    // Mostrar loading
    const submitBtn = document.querySelector('#artigoForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Publicando...';
    submitBtn.disabled = true;

    try {
        // Preparar dados para inserção - SEM autor_nome
        const artigoData = {
            titulo: titulo,
            categoria: categoria,
            conteudo: conteudoHTML,
            autor_id: usuarioLogado.id,
            created_at: new Date().toISOString()
        };

        console.log('Enviando dados para o Supabase:', artigoData);

        // Chamada SIMPLIFICADA - sem .select()
        const { data, error } = await window.supabase
            .from('artigos')
            .insert([artigoData]);

        if (error) {
            console.error('Erro do Supabase:', error);
            throw error;
        }

        console.log('Artigo publicado com sucesso:', data);
        mostrarMensagem('Artigo publicado com sucesso!', 'success');
        
        // Limpar formulário
        document.getElementById('artigoForm').reset();
        quill.root.innerHTML = '<p><br></p>';
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
            window.location.href = 'minha-conta.html';
        }, 2000);

    } catch (error) {
        console.error('Erro completo ao publicar artigo:', error);
        
        let mensagemErro = 'Erro ao publicar artigo. ';
        
        if (error.message) {
            if (error.message.includes('row-level security')) {
                mensagemErro += 'Problema de permissões no banco de dados.';
            } else if (error.message.includes('JWT')) {
                mensagemErro += 'Problema de autenticação. Faça login novamente.';
            } else if (error.message.includes('foreign key')) {
                mensagemErro += 'Problema com o usuário. Faça login novamente.';
            } else {
                mensagemErro += error.message;
            }
        } else {
            mensagemErro += 'Tente novamente.';
        }
        
        mostrarMensagem(mensagemErro, 'error');
    } finally {
        // Restaurar botão
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function publicarLivro() {
    // Verificar autenticação primeiro
    if (!verificarAutenticacao()) return;

    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    const titulo = document.getElementById('livroTitulo').value.trim();
    const genero = document.getElementById('livroGenero').value;
    const categoria = document.getElementById('livroCategoria').value;
    const descricao = document.getElementById('livroDescricao').value.trim();
    const link = document.getElementById('livroLink').value.trim();

    console.log('Dados do livro:', { titulo, genero, categoria, descricao, link });

    // VERIFICAR BANIMENTO NOVAMENTE (double check)
    const podePublicar = await verificarBanimento();
    if (!podePublicar) return;

    // Validação
    if (!titulo) {
        mostrarMensagem('Por favor, digite um título para o livro.', 'error');
        return;
    }

    if (!genero) {
        mostrarMensagem('Por favor, selecione um gênero.', 'error');
        return;
    }

    if (!categoria) {
        mostrarMensagem('Por favor, selecione uma categoria.', 'error');
        return;
    }

    if (!link) {
        mostrarMensagem('Por favor, informe o link do PDF.', 'error');
        return;
    }

    // Validar URL
    try {
        new URL(link);
    } catch (e) {
        mostrarMensagem('Por favor, informe uma URL válida para o PDF.', 'error');
        return;
    }

    // Mostrar loading
    const submitBtn = document.querySelector('#livroForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Publicando...';
    submitBtn.disabled = true;

    try {
        // Preparar dados para inserção - SEM autor_nome
        const livroData = {
            titulo: titulo,
            genero: genero,
            categoria: categoria,
            descricao: descricao || null,
            link_pdf: link,
            autor_id: usuarioLogado.id,
            created_at: new Date().toISOString()
        };

        console.log('Enviando dados do livro para o Supabase:', livroData);

        // Chamada SIMPLIFICADA - sem .select()
        const { data, error } = await window.supabase
            .from('livros')
            .insert([livroData]);

        if (error) {
            console.error('Erro do Supabase:', error);
            throw error;
        }

        console.log('Livro publicado com sucesso:', data);
        mostrarMensagem('Livro publicado com sucesso!', 'success');
        
        // Limpar formulário
        document.getElementById('livroForm').reset();
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
            window.location.href = 'minha-conta.html';
        }, 2000);

    } catch (error) {
        console.error('Erro completo ao publicar livro:', error);
        
        let mensagemErro = 'Erro ao publicar livro. ';
        
        if (error.message) {
            if (error.message.includes('row-level security')) {
                mensagemErro += 'Problema de permissões no banco de dados.';
            } else if (error.message.includes('JWT')) {
                mensagemErro += 'Problema de autenticação. Faça login novamente.';
            } else if (error.message.includes('foreign key')) {
                mensagemErro += 'Problema com o usuário. Faça login novamente.';
            } else {
                mensagemErro += error.message;
            }
        } else {
            mensagemErro += 'Tente novamente.';
        }
        
        mostrarMensagem(mensagemErro, 'error');
    } finally {
        // Restaurar botão
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
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
    document.getElementById(`form-${tabName}`).classList.add('active');
    event.currentTarget.classList.add('active');

    // Se for a tab de artigo, ajustar o editor
    if (tabName === 'artigo' && quill) {
        setTimeout(() => {
            ajustarAlturaEditor();
        }, 100);
    }
}

function mostrarMensagem(mensagem, tipo) {
    const messageDiv = document.getElementById('publishMessage');
    if (!messageDiv) {
        console.error('Elemento publishMessage não encontrado');
        return;
    }
    
    messageDiv.textContent = mensagem;
    messageDiv.className = `message ${tipo}`;
    
    // Auto-esconder após 5 segundos para sucesso, manter erro visível
    if (tipo === 'success') {
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'message';
        }, 5000);
    }
}


async function verificarBanimento() {
    try {
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (!usuarioLogado) return true; // Se não está logado, não precisa verificar banimento

        const { data: usuario, error } = await window.supabase
            .from('usuarios')
            .select('is_banned, ban_reason, banned_until')
            .eq('id', usuarioLogado.id)
            .single();

        if (error) {
            console.error('Erro ao verificar banimento:', error);
            return true; // Em caso de erro, permitir continuar
        }

        if (usuario.is_banned) {
            let mensagem = `🚫 SUA CONTA ESTÁ BANIDA\n\nMotivo: ${usuario.ban_reason || 'Não especificado'}`;
            
            if (usuario.banned_until) {
                const dataBan = new Date(usuario.banned_until);
                if (dataBan > new Date()) {
                    mensagem += `\nBanimento expira em: ${dataBan.toLocaleDateString('pt-BR')}`;
                } else {
                    // Banimento expirado - desbanir automaticamente
                    await window.supabase
                        .from('usuarios')
                        .update({ 
                            is_banned: false,
                            ban_reason: null,
                            banned_until: null 
                        })
                        .eq('id', usuarioLogado.id);
                    return true; // Pode publicar
                }
            } else {
                mensagem += '\nBanimento permanente';
            }
            
            // Bloquear a publicação
            bloquearFormularios();
            
            // Mostrar alerta
            mostrarMensagem(mensagem, 'error');
            return false; // Não pode publicar
        }
        
        return true; // Pode publicar
    } catch (error) {
        console.error('Erro ao verificar banimento:', error);
        return true; // Em caso de erro, permitir continuar
    }
}

function bloquearFormularios() {
    // Bloquear todos os botões de submit
    document.querySelectorAll('button[type="submit"], .btn-primary').forEach(btn => {
        btn.disabled = true;
        btn.innerHTML = '🚫 CONTA BANIDA';
        btn.style.background = '#e74c3c';
        btn.style.cursor = 'not-allowed';
    });
    
    // Bloquear inputs
    document.querySelectorAll('input, select, textarea, .ql-editor').forEach(input => {
        input.disabled = true;
        input.style.cursor = 'not-allowed';
        input.style.opacity = '0.6';
    });
    
    // Adicionar aviso visual
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const aviso = document.createElement('div');
        aviso.style.cssText = `
            background: #e74c3c;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            text-align: center;
            font-weight: bold;
            border: 2px solid #c0392b;
        `;
        aviso.innerHTML = '🚫 CONTA BANIDA - Você não pode publicar conteúdo';
        form.prepend(aviso);
    });
}

// Debug: Verificar se o Supabase está configurado
console.log('Supabase configurado:', !!window.supabase);