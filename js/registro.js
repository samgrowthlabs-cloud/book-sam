document.addEventListener('DOMContentLoaded', function() {
  const registroForm = document.getElementById('registroForm');
  registroForm.addEventListener('submit', criarConta);
});

// Função utilitária para detectar a lib bcrypt disponível
function getBcryptLib() {
  if (window.bcrypt) return window.bcrypt;
  if (window.bcryptjs) return window.bcryptjs;
  if (window.dcodeIO && window.dcodeIO.bcrypt) return window.dcodeIO.bcrypt;
  return null;
}

// Wrapper que retorna Promise com o hash
async function gerarHashSenha(senha, saltRounds = 12) {
  const lib = getBcryptLib();
  if (!lib) throw new Error('Biblioteca bcrypt não carregada. Verifique o <script> no HTML.');

  return new Promise((resolve, reject) => {
    try {
      // tenta API assíncrona (callback)
      if (typeof lib.hash === 'function') {
        lib.hash(senha, saltRounds, (err, hashed) => {
          if (err) {
            // se der erro na versão async, tenta sync
            try {
              const syncHash = lib.hashSync ? lib.hashSync(senha, saltRounds) : null;
              if (syncHash) resolve(syncHash);
              else reject(err);
            } catch (e) {
              reject(err);
            }
          } else {
            resolve(hashed);
          }
        });
      } else if (typeof lib.hashSync === 'function') {
        // fallback sync
        const hashed = lib.hashSync(senha, saltRounds);
        resolve(hashed);
      } else {
        reject(new Error('API de hashing não disponível na lib bcrypt carregada.'));
      }
    } catch (e) {
      // fallback final: tenta hashSync se existir
      try {
        if (lib.hashSync) {
          const hashed = lib.hashSync(senha, saltRounds);
          resolve(hashed);
        } else {
          reject(e);
        }
      } catch (e2) {
        reject(e2);
      }
    }
  });
}

async function criarConta(event) {
  event.preventDefault();

  const usuario = document.getElementById('novoUsuario').value.trim();
  const senha = document.getElementById('novaSenha').value;
  const confirmarSenha = document.getElementById('confirmarSenha').value;
  const messageDiv = document.getElementById('registroMessage');

  // Validações simples
  if (!usuario || !senha) {
    messageDiv.textContent = 'Preencha todos os campos';
    messageDiv.className = 'message error';
    return;
  }

  if (senha !== confirmarSenha) {
    messageDiv.textContent = 'As senhas não coincidem';
    messageDiv.className = 'message error';
    return;
  }

  if (senha.length < 6) {
    messageDiv.textContent = 'A senha deve ter pelo menos 6 caracteres';
    messageDiv.className = 'message error';
    return;
  }

  try {
    // Gera hash com bcrypt (12 rounds)
    const saltRounds = 12;
    const hash = await gerarHashSenha(senha, saltRounds);

    // Insere no Supabase (coluna senha_hash)
    const { data, error } = await window.supabase
      .from('usuarios')
      .insert([{
        usuario: usuario,
        senha_hash: hash
      }]);

    if (error) {
      // Erro de unique (23505) -> usuário já existe (Postgres)
      if (error.code === '23505' || (error.details && error.details.includes('already exists'))) {
        messageDiv.textContent = 'Usuário já existe';
        messageDiv.className = 'message error';
      } else {
        throw error;
      }
      return;
    }

    messageDiv.textContent = 'Conta criada com sucesso!';
    messageDiv.className = 'message success';

    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1200);

  } catch (err) {
    console.error('Erro ao criar conta:', err);
    messageDiv.textContent = 'Erro ao criar conta';
    messageDiv.className = 'message error';
  }
}
