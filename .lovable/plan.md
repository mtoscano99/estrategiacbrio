

## Problema: Dados não aparecem após login

### Causa Raiz

O callback `onAuthStateChange` do Supabase define a sessão internamente de forma **síncrona após o callback retornar**. As chamadas `fetchProfile` e `fetchRole` dentro do `Promise.all` executam **durante** o callback — antes do cliente ter configurado o token JWT nos headers HTTP. Resultado: as queries ao banco rodam como usuário anônimo, o RLS bloqueia tudo, e os dados retornam vazios.

Isso explica por que o login funciona (a sessão existe) mas os dados não aparecem (as queries de profile/role falham silenciosamente).

O Dashboard depois carrega com `role = null` (porque `fetchRole` retornou vazio) e faz suas próprias queries que também podem falhar por timing.

### Correção

**Arquivo: `src/contexts/AuthContext.tsx`**

Usar `setTimeout(..., 0)` para deferir as chamadas de DB para o próximo tick do event loop (quando o cliente já terá configurado o token), mas manter `loading = true` até ambas completarem:

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    setSession(session);
    setUser(session?.user ?? null);

    if (session?.user) {
      const userId = session.user.id;
      // Defer to next tick so Supabase client sets auth headers first
      setTimeout(() => {
        Promise.all([fetchProfile(userId), fetchRole(userId)]).then(() => {
          if (event === 'INITIAL_SESSION' || !initialSessionHandled) {
            initialSessionHandled = true;
            setLoading(false);
          }
        });
      }, 0);
    } else {
      setProfile(null);
      setRole(null);
      setRoleChecked(true);
      if (event === 'INITIAL_SESSION' || !initialSessionHandled) {
        initialSessionHandled = true;
        setLoading(false);
      }
    }
  }
);
```

Também ajustar o fallback timeout para garantir que ele também chama `setLoading(false)` após as queries completarem (não antes).

### Por que isso resolve

- `setTimeout(fn, 0)` retorna o controle ao Supabase para que ele configure o token JWT
- As queries de `fetchProfile`/`fetchRole` rodam no próximo tick, com autenticação válida
- `loading` permanece `true` até ambas completarem, evitando renders prematuros
- O Dashboard carrega depois com `role` correto e faz suas queries já autenticado

