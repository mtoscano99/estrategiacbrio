## Plano: Criar KPIs em massa para os 67 projetos

### Projetos não encontrados no banco (4)

Os seguintes projetos da sua lista **não existem** na base de dados. Precisam ser criados antes de vincular KPIs:

- **Make a Difference** (#04)
- **Carta** (#05)
- **Capelania** (#10)
- **Ceia** (#22)

### KPIs a criar por projeto

Da sua lista, identifico **3 KPIs numéricos** por projeto:


| KPI                       | Unidade | Meta            | Periodicidade               | Observação                            |
| ------------------------- | ------- | --------------- | --------------------------- | ------------------------------------- |
| **Satisfação**            | %       | 80              | Conforme duração do projeto | Presente em todos                     |
| **Controle Orçamentário** | R$      | Valor informado | Conforme duração do projeto | Apenas nos ~25 projetos que têm valor |
| **Engajamento**           | pessoas | ?               | Conforme duração do projeto | Método: Lista de presença             |


### Dúvidas antes de executar

1. **Engajamento** — "Lista de presença" é o método de coleta, mas qual seria a **meta numérica**? (Ex: 50 pessoas, 100 pessoas?) Ou prefere não criar esse KPI e deixar apenas como descrição? **crie o kpi mas a meta deixe para ser editada depois.**
2. **Alcance de Público** — É a descrição do público-alvo (ex: "Pastores e Líderes"). Isso é mais um atributo do projeto do que um KPI. Deseja criar como KPI com meta numérica ou ignorar? **crie um kpi com meta numérica.**
3. **Execução no Prazo** — São datas/prazos, não indicadores numéricos. Deseja criar como KPI binário (meta: 100%, unidade: %) representando "entregou no prazo"? **Sim.**
4. **Os 4 projetos faltantes** — Deseja que eu os crie no banco antes? **Sim.**

### Execução

Após suas respostas, usarei o insert tool para inserir todos os KPIs de uma vez com os `projeto_id` corretos (tenho todos os IDs mapeados). Serão aproximadamente **130-200 inserts** dependendo das suas respostas.