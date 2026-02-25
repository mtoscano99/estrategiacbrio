

## Diagnóstico: Login com Google volta para tela de login (URL publicada)

### Causa Raiz

Os logs de autenticação confirmam que o login com Google **funciona no backend** (status 200, sessão criada). O problema é uma condição de corrida no frontend:

1. Após o redirecionamento do Google, a página recarrega
2. `onAuthStateChange` dispara com `INITIAL_SESSION` e a sessão válida
3. `setLoading(false)` é chamado **imediatamente**
4. Mas `fetchRole` roda em `setTimeout(..., 0)` -- ou seja, **depois** do render
5. O componente renderiza com `session = válida`, `loading = false`, mas `roleChecked = false`
6. `PublicRoute` redireciona para `/dashboard`
7. `ProtectedRoute` renderiza corretamente (porque `needsRole = false` quando `roleChecked = false`)
8. Porém, quando `fetchRole` completa e seta `roleChecked = true`, se por algum motivo o role não foi encontrado ainda, `needsRole` vira `true` e o usuário é redirecionado para `/selecionar-perfil`, que por sua vez redireciona para `/login` se o role já existe

O problema real é que `loading` fica `false` antes de `fetchRole` completar. Na URL publicada, a latência de rede é maior que no preview, agravando a corrida.

### Correção

**Arquivo: `src/contexts/AuthContext.tsx`**

1. Remover o `setTimeout` do `fetchRole` e `fetchProfile`
2. Aguardar `fetchRole` completar **antes** de setar `loading = false` quando há sessão
3. Garantir que `roleChecked` seja `true` antes do app sair do estado de loading

Lógica corrigida:
```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    setSession(session);
    setUser(session?.user ?? null);
    
    if (session?.user) {
      // Buscar role e profile ANTES de liberar o loading
      await fetchProfile(session.user.id);
      await fetchRole(session.user.id);
    } else {
      setProfile(null);
      setRole(null);
      setRoleChecked(true);
    }
    
    if (event === 'INITIAL_SESSION' || !initialSessionHandled) {
      initialSessionHandled = true;
      setLoading(false);
    }
  }
);
```

Isso garante que quando `loading` vira `false`, o `roleChecked` já é `true` e o `role` já está definido, eliminando o redirecionamento incorreto.

### Por que funciona no preview mas não no publicado

No preview, a latência de rede é menor e o `fetchRole` completa antes do próximo render cycle. Na URL publicada, a latência é maior e o render acontece antes do `fetchRole` completar, causando o redirecionamento para login.

