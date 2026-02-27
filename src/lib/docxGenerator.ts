import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType,
  TableOfContents, HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak, ImageRun,
} from "docx";
import { saveAs } from "file-saver";
import { format, parseISO, differenceInCalendarMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── Colors ──
const ACCENT = "156082";
const ACCENT_DARK = "0F4761";
const LIGHT_BG = "F2F8FB";
const WHITE = "FFFFFF";
const BLACK = "000000";
const GRAY = "666666";
const BORDER_COLOR = "B0C4D4";

const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBordersLeft = {
  top: { style: BorderStyle.NONE, size: 0, color: WHITE },
  bottom: { style: BorderStyle.NONE, size: 0, color: WHITE },
  left: { style: BorderStyle.SINGLE, size: 12, color: ACCENT },
  right: { style: BorderStyle.NONE, size: 0, color: WHITE },
};
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

// ── Helpers ──
function hCell(text: string, width: number) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: ACCENT, type: ShadingType.CLEAR, color: "auto" },
    margins: cellMargins,
    verticalAlign: "center" as any,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, color: WHITE, font: "Aptos", size: 20 })],
    })],
  });
}

function tCell(text: string, width: number, opts: any = {}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: cellMargins,
    verticalAlign: "center" as any,
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      children: [new TextRun({
        text,
        bold: opts.bold || false,
        color: opts.color || BLACK,
        font: "Aptos",
        size: opts.size || 20,
      })],
    })],
  });
}

function bCell(text: string, width: number, shading?: string) {
  return tCell(text, width, { bold: true, shading });
}

function h1(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, bold: true, font: "Aptos", size: 32, color: ACCENT })],
  });
}

function h2(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, font: "Aptos", size: 28, color: ACCENT_DARK })],
  });
}

function h3(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, font: "Aptos", size: 24, color: ACCENT_DARK })],
  });
}

function para(text: string, opts: any = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 360 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, font: "Aptos", size: 24, color: opts.color || BLACK, bold: opts.bold || false })],
  });
}

function emptyP() {
  return new Paragraph({ children: [] });
}

function pb() {
  return new Paragraph({ children: [new PageBreak()] });
}

const fmtD = (d: string | null) => {
  if (!d) return "–";
  try { return format(parseISO(d), "dd/MM/yyyy", { locale: ptBR }); } catch { return d; }
};

const fmtMoney = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_LABELS: Record<string, string> = {
  nao_iniciado: "Não Iniciado", em_andamento: "Em Andamento",
  concluido: "Concluído", atrasado: "Atrasado", cancelado: "Cancelado",
};

// ── Types ──
export interface DocxProjectData {
  nome: string;
  descricao?: string | null;
  status: string;
  saude?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  orcamento_previsto?: number | null;
  valor_gasto?: number | null;
  centro_custo?: string | null;
  area_nome?: string;
  responsavel_nome?: string;
  objetivo_titulo?: string;
}

export interface DocxEtapa {
  nome: string;
  descricao?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  status: string;
  valor_gasto?: number | null;
  responsavel_nome?: string;
}

export interface DocxSwotItems {
  forca: string[];
  fraqueza: string[];
  oportunidade: string[];
  ameaca: string[];
}

export interface DocxKPI {
  nome: string;
  unidade: string;
  meta: number;
  periodicidade: string;
  ultimo_valor?: number | null;
}

export interface DocxAIContent {
  resumo_executivo: string;
  direcionadores: string;
  diagnostico: string;
  consideracoes_finais: string;
}

// ── Main Generator ──
export async function generateProjectDocx(
  projeto: DocxProjectData,
  etapas: DocxEtapa[],
  swot: DocxSwotItems,
  kpis: DocxKPI[],
  aiContent: DocxAIContent,
) {
  const children: any[] = [];
  const today = format(new Date(), "dd/MM/yyyy");

  // ══════ CAPA ══════
  for (let i = 0; i < 4; i++) children.push(emptyP());

  children.push(new Table({
    width: { size: 80, type: WidthType.PERCENTAGE },
    columnWidths: [7500],
    rows: [
      new TableRow({ children: [new TableCell({
        borders: noBordersLeft, margins: { top: 200, bottom: 200, left: 200, right: 200 },
        children: [new Paragraph({ children: [new TextRun({ text: "Igreja Comunidade Batista do Rio de Janeiro", font: "Aptos", size: 24, color: ACCENT_DARK })] })],
      })] }),
      new TableRow({ children: [new TableCell({
        borders: noBordersLeft, margins: { top: 200, bottom: 200, left: 200, right: 200 },
        children: [new Paragraph({ children: [new TextRun({ text: projeto.nome, font: "Aptos Display", size: 72, color: ACCENT })] })],
      })] }),
      new TableRow({ children: [new TableCell({
        borders: noBordersLeft, margins: { top: 200, bottom: 200, left: 200, right: 200 },
        children: [new Paragraph({ children: [new TextRun({
          text: `${projeto.area_nome || "Projeto Estratégico"} – ${calcDuration(projeto.data_inicio, projeto.data_fim)}`,
          font: "Aptos", size: 24, color: ACCENT_DARK,
        })] })],
      })] }),
    ],
  }));

  for (let i = 0; i < 8; i++) children.push(emptyP());

  // Bottom info box
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      borders,
      shading: { fill: LIGHT_BG, type: ShadingType.CLEAR, color: "auto" },
      margins: { top: 120, bottom: 120, left: 200, right: 200 },
      children: [
        new Paragraph({ children: [new TextRun({ text: "Diretoria de Gestão e Operações – Coordenação de Gestão Estratégica", bold: true, font: "Aptos", size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: today, bold: true, font: "Aptos", size: 22 })] }),
      ],
    })] })],
  }));

  children.push(pb());

  // ══════ SUMÁRIO ══════
  children.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: "Sumário", bold: true, font: "Aptos", size: 32, color: ACCENT })],
  }));
  children.push(new TableOfContents("Sumário", { hyperlink: true, headingStyleRange: "1-3" }));
  children.push(pb());

  // ══════ 1. RESUMO EXECUTIVO ══════
  children.push(h1("1. Resumo Executivo"));
  aiContent.resumo_executivo.split("\n\n").forEach(p => children.push(para(p)));
  children.push(pb());

  // ══════ 2. DIRECIONADORES ESTRATÉGICOS ══════
  children.push(h1("2. Direcionadores Estratégicos"));
  aiContent.direcionadores.split("\n\n").forEach(p => children.push(para(p)));
  if (projeto.objetivo_titulo) {
    children.push(h2("2.1 Objetivo Estratégico Vinculado"));
    children.push(para(projeto.objetivo_titulo, { bold: true }));
  }
  children.push(pb());

  // ══════ 3. DIAGNÓSTICO E ANÁLISE ══════
  children.push(h1("3. Diagnóstico e Análise do Ambiente"));
  children.push(h2("3.1 Diagnóstico Situacional"));
  aiContent.diagnostico.split("\n\n").forEach(p => children.push(para(p)));
  children.push(emptyP());

  // 3.2 SWOT
  children.push(h2("3.2 Análise SWOT do Projeto"));
  const swotColW = 4680;
  const swotRows: TableRow[] = [];

  swotRows.push(new TableRow({ children: [hCell("FORÇAS (Internas)", swotColW), hCell("FRAQUEZAS (Internas)", swotColW)] }));
  swotRows.push(new TableRow({ children: [
    tCell(swot.forca.length > 0 ? swot.forca.join("; ") : "Não identificadas", swotColW, { shading: LIGHT_BG }),
    tCell(swot.fraqueza.length > 0 ? swot.fraqueza.join("; ") : "Não identificadas", swotColW, { shading: LIGHT_BG }),
  ] }));
  swotRows.push(new TableRow({ children: [hCell("OPORTUNIDADES (Externas)", swotColW), hCell("AMEAÇAS (Externas)", swotColW)] }));
  swotRows.push(new TableRow({ children: [
    tCell(swot.oportunidade.length > 0 ? swot.oportunidade.join("; ") : "Não identificadas", swotColW, { shading: LIGHT_BG }),
    tCell(swot.ameaca.length > 0 ? swot.ameaca.join("; ") : "Não identificadas", swotColW, { shading: LIGHT_BG }),
  ] }));

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [swotColW, swotColW],
    rows: swotRows,
  }));
  children.push(pb());

  // ══════ 4. OBJETIVOS E METAS ══════
  children.push(h1("4. Objetivos e Metas Estratégicas"));
  if (etapas.length > 0) {
    children.push(para("O projeto está organizado nas seguintes etapas, cada uma com seus objetivos específicos e prazos definidos."));
    children.push(emptyP());

    const colsObj = [3120, 3120, 3120];
    const objRows: TableRow[] = [new TableRow({ children: [
      hCell("Etapa / Objetivo", colsObj[0]), hCell("Prazo", colsObj[1]), hCell("Status", colsObj[2]),
    ] })];
    etapas.forEach((e, i) => {
      objRows.push(new TableRow({ children: [
        tCell(e.nome, colsObj[0], { shading: i % 2 === 0 ? LIGHT_BG : undefined }),
        tCell(`${fmtD(e.data_inicio)} a ${fmtD(e.data_fim)}`, colsObj[1], { shading: i % 2 === 0 ? LIGHT_BG : undefined }),
        tCell(STATUS_LABELS[e.status] || e.status, colsObj[2], { shading: i % 2 === 0 ? LIGHT_BG : undefined, bold: true }),
      ] }));
    });
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: colsObj, rows: objRows }));
  } else {
    children.push(para("Nenhuma etapa cadastrada para este projeto."));
  }
  children.push(pb());

  // ══════ 5. PLANOS DE AÇÃO ══════
  children.push(h1("5. Planos de Ação"));
  if (etapas.length > 0) {
    children.push(para("Detalhamento das ações estratégicas com responsáveis, prazos e entregas esperadas."));
    children.push(emptyP());

    const actionCols = [1400, 2600, 1600, 1000, 1000, 1760];
    const actionRows: TableRow[] = [new TableRow({ children: [
      hCell("Área", actionCols[0]), hCell("Ação Estratégica", actionCols[1]),
      hCell("Responsável", actionCols[2]), hCell("Início", actionCols[3]),
      hCell("Término", actionCols[4]), hCell("Status", actionCols[5]),
    ] })];

    etapas.forEach((e, i) => {
      actionRows.push(new TableRow({ children: [
        tCell(projeto.area_nome || "–", actionCols[0], { shading: i % 2 === 0 ? LIGHT_BG : undefined, size: 18 }),
        tCell(e.nome, actionCols[1], { shading: i % 2 === 0 ? LIGHT_BG : undefined, size: 18 }),
        tCell(e.responsavel_nome || "–", actionCols[2], { shading: i % 2 === 0 ? LIGHT_BG : undefined, size: 18 }),
        tCell(fmtD(e.data_inicio), actionCols[3], { shading: i % 2 === 0 ? LIGHT_BG : undefined, size: 18 }),
        tCell(fmtD(e.data_fim), actionCols[4], { shading: i % 2 === 0 ? LIGHT_BG : undefined, size: 18 }),
        tCell(STATUS_LABELS[e.status] || e.status, actionCols[5], { shading: i % 2 === 0 ? LIGHT_BG : undefined, size: 18 }),
      ] }));
    });

    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: actionCols, rows: actionRows }));
  }
  children.push(pb());

  // ══════ 6. ORÇAMENTO ESTIMADO ══════
  children.push(h1("6. Orçamento Estimado"));
  const orc = Number(projeto.orcamento_previsto || 0);
  const gastoTotal = Number(projeto.valor_gasto || 0);

  if (etapas.length > 0 && etapas.some(e => Number(e.valor_gasto || 0) > 0)) {
    children.push(para("Distribuição dos gastos por etapa do projeto."));
    children.push(emptyP());
    const orcCols = [4500, 2400, 2460];
    const orcRows: TableRow[] = [new TableRow({ children: [
      hCell("Etapa", orcCols[0]), hCell("Status", orcCols[1]), hCell("Valor Gasto", orcCols[2]),
    ] })];
    etapas.forEach((e, i) => {
      const vg = Number(e.valor_gasto || 0);
      orcRows.push(new TableRow({ children: [
        tCell(e.nome, orcCols[0], { shading: i % 2 === 0 ? LIGHT_BG : undefined }),
        tCell(STATUS_LABELS[e.status] || e.status, orcCols[1], { shading: i % 2 === 0 ? LIGHT_BG : undefined }),
        tCell(fmtMoney(vg), orcCols[2], { shading: i % 2 === 0 ? LIGHT_BG : undefined, align: AlignmentType.CENTER }),
      ] }));
    });
    // Total row
    orcRows.push(new TableRow({ children: [
      bCell("TOTAL", orcCols[0], ACCENT),
      tCell("", orcCols[1], { shading: ACCENT }),
      tCell(fmtMoney(gastoTotal), orcCols[2], { bold: true, color: WHITE, shading: ACCENT, align: AlignmentType.CENTER }),
    ] }));
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: orcCols, rows: orcRows }));
  }

  if (orc > 0) {
    children.push(emptyP());
    children.push(para(`Orçamento previsto: ${fmtMoney(orc)}`));
    children.push(para(`Valor gasto: ${fmtMoney(gastoTotal)}`));
    children.push(para(`Saldo: ${fmtMoney(orc - gastoTotal)}`, { bold: true }));
  }
  children.push(pb());

  // ══════ 7. MONITORAMENTO E AVALIAÇÃO (KPIs) ══════
  children.push(h1("7. Monitoramento e Avaliação"));
  if (kpis.length > 0) {
    children.push(para("Indicadores de desempenho vinculados ao projeto para acompanhamento contínuo."));
    children.push(h2("7.1 Indicadores de Desempenho (KPIs)"));

    const kpiCols = [3120, 3120, 3120];
    const kpiRows: TableRow[] = [new TableRow({ children: [
      hCell("KPI", kpiCols[0]), hCell("Meta", kpiCols[1]), hCell("Último Valor", kpiCols[2]),
    ] })];
    kpis.forEach((k, i) => {
      kpiRows.push(new TableRow({ children: [
        tCell(k.nome, kpiCols[0], { shading: i % 2 === 0 ? LIGHT_BG : undefined }),
        tCell(`${k.meta} ${k.unidade}`, kpiCols[1], { shading: i % 2 === 0 ? LIGHT_BG : undefined, bold: true }),
        tCell(k.ultimo_valor !== null && k.ultimo_valor !== undefined ? `${k.ultimo_valor} ${k.unidade}` : "Sem dados", kpiCols[2], { shading: i % 2 === 0 ? LIGHT_BG : undefined }),
      ] }));
    });
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: kpiCols, rows: kpiRows }));
  } else {
    children.push(para("Nenhum indicador de desempenho vinculado a este projeto."));
  }
  children.push(pb());

  // ══════ 8. CRONOGRAMA GERAL (GANTT) ══════
  children.push(h1("8. Cronograma Geral"));
  if (etapas.length > 0 && etapas.some(e => e.data_inicio && e.data_fim)) {
    children.push(para("Visão consolidada das principais fases do projeto."));
    children.push(emptyP());

    // Build simple Gantt
    const datedEtapas = etapas.filter(e => e.data_inicio && e.data_fim);
    const allDates = datedEtapas.flatMap(e => [parseISO(e.data_inicio!), parseISO(e.data_fim!)]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
    const numCols = Math.min(6, Math.max(2, Math.ceil(totalDays / 14))); // ~2 weeks per column
    const colDays = totalDays / numCols;

    const ganttLabelW = 3000;
    const ganttColW = Math.floor((9360 - ganttLabelW) / numCols);
    const ganttWidths = [ganttLabelW, ...Array(numCols).fill(ganttColW)];

    // Header: periods
    const headerCells = [hCell("Fase / Atividade", ganttLabelW)];
    for (let i = 0; i < numCols; i++) {
      const startDay = new Date(minDate.getTime() + i * colDays * 86400000);
      const label = format(startDay, "dd/MM", { locale: ptBR });
      headerCells.push(hCell(label, ganttColW));
    }

    const ganttRows: TableRow[] = [new TableRow({ children: headerCells })];

    datedEtapas.forEach((e, idx) => {
      const eStart = parseISO(e.data_inicio!);
      const eEnd = parseISO(e.data_fim!);
      const cells = [bCell(e.nome, ganttLabelW, idx % 2 === 0 ? LIGHT_BG : undefined)];

      for (let i = 0; i < numCols; i++) {
        const colStart = minDate.getTime() + i * colDays * 86400000;
        const colEnd = minDate.getTime() + (i + 1) * colDays * 86400000;
        const overlaps = eStart.getTime() < colEnd && eEnd.getTime() >= colStart;
        cells.push(tCell(overlaps ? "███" : "", ganttColW, {
          shading: overlaps ? ACCENT : (idx % 2 === 0 ? LIGHT_BG : WHITE),
          color: overlaps ? WHITE : BLACK,
          align: AlignmentType.CENTER,
          size: 16,
        }));
      }
      ganttRows.push(new TableRow({ children: cells }));
    });

    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: ganttWidths, rows: ganttRows }));
  } else {
    children.push(para("Sem dados de cronograma disponíveis para gerar o Gantt."));
  }
  children.push(pb());

  // ══════ 9. CONSIDERAÇÕES FINAIS ══════
  children.push(h1("9. Considerações Finais"));
  aiContent.consideracoes_finais.split("\n\n").forEach(p => children.push(para(p)));

  // ══════ BUILD DOCUMENT ══════
  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Aptos", size: 24 } } },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, font: "Aptos", color: ACCENT },
          paragraph: { spacing: { before: 360, after: 200 } },
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: "Aptos", color: ACCENT_DARK },
          paragraph: { spacing: { before: 280, after: 160 } },
        },
        {
          id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: "Aptos", color: ACCENT_DARK },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: `CBRio – ${projeto.nome}`, font: "Aptos", size: 18, color: GRAY, italics: true })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Página ", font: "Aptos", size: 18, color: GRAY }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Aptos", size: 18, color: GRAY }),
            ],
          })],
        }),
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `Planejamento_${projeto.nome.replace(/[^a-zA-Z0-9À-ú ]/g, "").replace(/\s+/g, "_")}.docx`;
  saveAs(blob, filename);
}

function calcDuration(inicio?: string | null, fim?: string | null): string {
  if (!inicio || !fim) return "Prazo a definir";
  try {
    const months = differenceInCalendarMonths(parseISO(fim), parseISO(inicio));
    if (months <= 0) return "Execução curta";
    return `Execução em ${months} ${months === 1 ? "Mês" : "Meses"}`;
  } catch {
    return "Prazo a definir";
  }
}
