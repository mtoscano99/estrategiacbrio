

## Relatorio Consolidado do Portfolio com Exportacao CSV

### O que sera feito
Expandir a pagina de Relatorios com uma nova aba "Portfolio" que exibe um relatorio consolidado de todos os projetos, com resumo financeiro por area estrategica e exportacao para CSV.

### Estrutura da pagina

A pagina de Relatorios passara a ter duas abas usando o componente Tabs:
1. **Por Projeto** (aba atual, sem alteracoes)
2. **Portfolio** (nova aba com relatorio consolidado)

### Conteudo da aba Portfolio

**Cards de resumo no topo:**
- Total de projetos
- Orcamento total (soma de orcamento_previsto)
- Total gasto (soma de valor_gasto)
- Saldo total (orcamento - gasto)

**Tabela: Resumo Financeiro por Area Estrategica**
- Colunas: Area | Qtd Projetos | Orcamento | Gasto | Saldo | % Consumo
- Agrupamento dos projetos por area_id, com totalizacao por area
- Linha de total geral no rodape

**Tabela: Todos os Projetos**
- Colunas: Projeto | Area | Responsavel | Status | Orcamento | Gasto | Saldo
- Ordenado por area e nome
- Badges de status com cores

**Botao "Exportar CSV"**
- Gera um arquivo CSV com todos os projetos (mesmas colunas da tabela)
- Inclui linha de totais no final
- Nome do arquivo: `portfolio_YYYY-MM-DD.csv`
- Usa `Blob` + `URL.createObjectURL` para download no navegador (sem backend)

### Detalhes Tecnicos

**Arquivo: `src/pages/Relatorios.tsx`**

1. Adicionar imports: `Tabs, TabsContent, TabsList, TabsTrigger` de `@/components/ui/tabs`, `Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter` de `@/components/ui/table`, `Download` de `lucide-react`

2. Novo state e query para portfolio:
   - `activeTab` state para controlar aba
   - Ao entrar na aba Portfolio, carregar todos os projetos com joins: `projetos.select("*, areas_estrategicas(nome), profiles!projetos_responsavel_id_fkey(nome)")`
   - Carregar tambem `areas_estrategicas` para listagem completa

3. Funcao `exportCSV`:
   - Monta string CSV com headers e dados dos projetos
   - Inclui BOM UTF-8 para acentos no Excel
   - Cria Blob, gera URL temporaria e dispara download via link programatico

4. Computacoes derivadas (useMemo ou inline):
   - `resumoPorArea`: agrupar projetos por area, somando orcamento/gasto
   - `totais`: somar todos orcamentos e gastos

5. Layout: envolver todo o conteudo atual em `<Tabs>`, mover o conteudo existente para `<TabsContent value="projeto">` e adicionar `<TabsContent value="portfolio">` com o novo conteudo

**Nenhuma alteracao de banco de dados necessaria** - todos os dados ja existem nas tabelas `projetos` e `areas_estrategicas`.

