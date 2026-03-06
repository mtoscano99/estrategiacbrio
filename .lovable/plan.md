

## Plano: Extrair dados da ATA para alimentar projetos existentes

Analisei o conteúdo da ATA da reunião de 02/03/2026 e cruzei com os projetos cadastrados no sistema. Segue o mapeamento de informações extraíveis:

### Dados extraídos da ATA e projetos correspondentes

| Projeto no sistema | Informação da ATA a ser adicionada |
|---|---|
| **Acabamentos do Hall e templo novo em construção** | Instalar carpetes nas paredes de entrada e portas; materiais e mão de obra já pagos; pendências de ajustes em drywall. Entrega chave da sala até fim de março. |
| **Início obras infraestrutura** | Estimativa R$ 50-60 mil para infraestrutura (drywall, realinhamento); "kit" pode chegar a R$ 70 mil. Início efetivo em maio. Conclusão CBRI e Barra até junho/julho. |
| **Campanha de Generosidade** | Campanha educativa de 90 dias iniciando em abril. Foco em cultura de generosidade, transparência (painéis meta x arrecadação), prestação de contas mensal. Meta: superávit 20-30%. Sem "pedido de púlpito". |
| **Aprovação projeto campus** | Campus Recreio: R$ 6,5-8 milhões. Modelos: BTS, superávit ou campanha específica. Dois cenários de inauguração: dezembro ou aniversário da igreja. |
| **Modelo financeiro** | Projeções otimista/pessimista/básico até fim do ano. Com ~30% superávit, projeto de 8M levaria 2-4 anos. Sem BTS, inauguração 1º sem 2027. |
| **Decisão GO/NO GO campus** | Aguardar validação e break-even antes de escalar. Critérios: ocupação, retenção, receita, NPS. |
| **Estratégia de campanha (Eixo 2026)** | Campanha de visão do campus; apresentações pós-culto; conversas com grandes doadores; jantares sem pedidos explícitos. |
| **Redução de déficit operacional (Eixo 2026)** | Equalizar contas e fornecedores da obra anterior a partir de abril; priorizar equilíbrio de caixa. |

### O que será feito

1. **Criar uma funcionalidade na interface** para processar a ATA via IA e sugerir atualizações nos projetos
2. A IA lerá o conteúdo da ATA e os projetos existentes, e sugerirá:
   - Atualização de descrições com novas informações
   - Novos valores de orçamento (ex: R$ 50-60 mil para infraestrutura)
   - Novas etapas extraídas dos "Próximos Passos"
   - Atualização de datas (ex: início maio, conclusão junho/julho)
3. O usuário revisará e aprovará cada sugestão antes de salvar

### Alternativa mais simples

Se preferir, posso **aplicar as atualizações diretamente no banco** com base no mapeamento acima, sem criar nova funcionalidade na interface. Neste caso, atualizaria descrições, orçamentos e criaria etapas nos projetos correspondentes.

**Qual abordagem prefere?**
- **"Aplique diretamente as atualizações nos projetos conforme o mapeamento"** -- atualizo direto no banco
- **"Crie a funcionalidade de importar ATAs com revisão via IA"** -- crio feature reutilizável

