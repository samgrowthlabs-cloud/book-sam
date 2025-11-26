document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  loginForm.addEventListener('submit', fazerLogin);
});

// detecta a lib bcrypt no ambiente (suporte a varios globals)
function getBcryptLib() {
  if (window.bcrypt) return window.bcrypt;
  if (window.bcryptjs) return window.bcryptjs;
  if (window.dcodeIO && window.dcodeIO.bcrypt) return window.dcodeIO.bcrypt;
  return null;
}

// wrapper para comparar senha que retorna Promise<boolean>
function compareSenha(plain, hash) {
  const lib = getBcryptLib();
  if (!lib) {
    return Promise.reject(new Error('Biblioteca bcrypt não encontrada. Verifique o <script> do bcryptjs no HTML.'));
  }

  // bcryptjs tem compare que aceita callback; adaptamos para Promise
  return new Promise((resolve, reject) => {
    try {
      if (typeof lib.compare === 'function') {
        lib.compare(plain, hash, (err, res) => {
          if (err) reject(err);
          else resolve(res);
        });
      } else if (typeof lib.compareSync === 'function') {
        // se só tiver sync, usamos o sync em nextTick para não travar (ainda sincrono, mas menos feio)
        try {
          const res = lib.compareSync(plain, hash);
          resolve(res);
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error('API de comparação do bcrypt não encontrada na lib carregada.'));
      }
    } catch (e) {
      reject(e);
    }
  });
}

async function fazerLogin(event) {
  event.preventDefault();

  const usuario = document.getElementById('usuario').value.trim();
  const senha = document.getElementById('senha').value;
  const messageDiv = document.getElementById('loginMessage');

  if (!usuario || !senha) {
    messageDiv.textContent = 'Preencha usuário e senha';
    messageDiv.className = 'message error';
    return;
  }

  try {
    // Busca apenas os campos que precisa
    const { data: user, error } = await window.supabase
      .from('usuarios')
      .select('id, usuario, senha_hash')
      .eq('usuario', usuario)
      .maybeSingle(); // evita erro caso não exista

    if (error) throw error;

    if (!user) {
      messageDiv.textContent = 'Usuário não encontrado';
      messageDiv.className = 'message error';
      return;
    }

    const senhaHash = user.senha_hash;
    if (!senhaHash) {
      messageDiv.textContent = 'Conta sem senha segura configurada';
      messageDiv.className = 'message error';
      return;
    }

    // compara com bcrypt (via wrapper que detecta a lib)
    const match = await compareSenha(senha, senhaHash);

    if (!match) {
      messageDiv.textContent = 'Senha incorreta';
      messageDiv.className = 'message error';
      return;
    }

    // login ok — salva algo no localStorage (você pode trocar pra JWT/sessão depois)
    localStorage.setItem('usuarioLogado', JSON.stringify({
      id: user.id,
      usuario: user.usuario
    }));

    messageDiv.textContent = 'Login realizado com sucesso!';
    messageDiv.className = 'message success';

    setTimeout(() => {
      window.location.href = 'publicar.html';
    }, 800);

  } catch (err) {
    console.error('Erro no login:', err);
    messageDiv.textContent = 'Erro ao fazer login';
    messageDiv.className = 'message error';
  }
}
