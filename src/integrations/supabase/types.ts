export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alvos_pe: {
        Row: {
          created_at: string
          descricao: string
          id: string
          indicador: string | null
          kpi_id: string | null
          meta: string | null
          objetivo_id: string
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          indicador?: string | null
          kpi_id?: string | null
          meta?: string | null
          objetivo_id: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          indicador?: string | null
          kpi_id?: string | null
          meta?: string | null
          objetivo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alvos_pe_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alvos_pe_objetivo_id_fkey"
            columns: ["objetivo_id"]
            isOneToOne: false
            referencedRelation: "objetivos_estrategicos"
            referencedColumns: ["id"]
          },
        ]
      }
      anexos_projeto: {
        Row: {
          created_at: string
          enviado_por: string
          id: string
          nome_arquivo: string
          projeto_id: string
          storage_path: string
          tamanho: number | null
          tipo_mime: string | null
        }
        Insert: {
          created_at?: string
          enviado_por: string
          id?: string
          nome_arquivo: string
          projeto_id: string
          storage_path: string
          tamanho?: number | null
          tipo_mime?: string | null
        }
        Update: {
          created_at?: string
          enviado_por?: string
          id?: string
          nome_arquivo?: string
          projeto_id?: string
          storage_path?: string
          tamanho?: number | null
          tipo_mime?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anexos_projeto_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      areas_estrategicas: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      comentarios: {
        Row: {
          autor_id: string
          conteudo: string
          created_at: string
          etapa_id: string | null
          id: string
          projeto_id: string | null
        }
        Insert: {
          autor_id: string
          conteudo: string
          created_at?: string
          etapa_id?: string | null
          id?: string
          projeto_id?: string | null
        }
        Update: {
          autor_id?: string
          conteudo?: string
          created_at?: string
          etapa_id?: string | null
          id?: string
          projeto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas_projeto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      dados_financeiros: {
        Row: {
          created_at: string
          data_referencia: string | null
          descricao: string | null
          fonte: string | null
          id: string
          projeto_id: string
          tipo: string
          valor: number
        }
        Insert: {
          created_at?: string
          data_referencia?: string | null
          descricao?: string | null
          fonte?: string | null
          id?: string
          projeto_id: string
          tipo: string
          valor: number
        }
        Update: {
          created_at?: string
          data_referencia?: string | null
          descricao?: string | null
          fonte?: string | null
          id?: string
          projeto_id?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "dados_financeiros_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostico_situacional: {
        Row: {
          categoria: string
          created_at: string
          id: string
          indicador: string
          observacao: string | null
          valor: string | null
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: string
          indicador: string
          observacao?: string | null
          valor?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          indicador?: string
          observacao?: string | null
          valor?: string | null
        }
        Relationships: []
      }
      etapas_projeto: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          nome: string
          ordem: number | null
          projeto_id: string
          responsavel_id: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
          valor_gasto: number | null
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number | null
          projeto_id: string
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          valor_gasto?: number | null
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          projeto_id?: string
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          valor_gasto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "etapas_projeto_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_medicoes: {
        Row: {
          created_at: string
          data_referencia: string
          id: string
          kpi_id: string
          observacao: string | null
          registrado_por: string | null
          valor: number
        }
        Insert: {
          created_at?: string
          data_referencia: string
          id?: string
          kpi_id: string
          observacao?: string | null
          registrado_por?: string | null
          valor: number
        }
        Update: {
          created_at?: string
          data_referencia?: string
          id?: string
          kpi_id?: string
          observacao?: string | null
          registrado_por?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_medicoes_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_medicoes_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          area_id: string | null
          created_at: string
          criado_por: string | null
          descricao: string | null
          id: string
          meta: number
          nome: string
          objetivo_id: string | null
          periodicidade: string
          unidade: string
          updated_at: string
        }
        Insert: {
          area_id?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          meta?: number
          nome: string
          objetivo_id?: string | null
          periodicidade?: string
          unidade?: string
          updated_at?: string
        }
        Update: {
          area_id?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          meta?: number
          nome?: string
          objetivo_id?: string | null
          periodicidade?: string
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpis_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas_estrategicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_objetivo_id_fkey"
            columns: ["objetivo_id"]
            isOneToOne: false
            referencedRelation: "objetivos_estrategicos"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          link: string | null
          mensagem: string | null
          tipo: string
          titulo: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string | null
          tipo: string
          titulo: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string | null
          tipo?: string
          titulo?: string
          usuario_id?: string
        }
        Relationships: []
      }
      objetivos_estrategicos: {
        Row: {
          ano: number
          area_id: string | null
          created_at: string
          descricao: string | null
          id: string
          tema_anual: string | null
          titulo: string
        }
        Insert: {
          ano: number
          area_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          tema_anual?: string | null
          titulo: string
        }
        Update: {
          ano?: number
          area_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          tema_anual?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "objetivos_estrategicos_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas_estrategicas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          area_id: string | null
          avatar_url: string | null
          cargo: string | null
          created_at: string
          data_nascimento: string | null
          email: string
          email_contato: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          area_id?: string | null
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          data_nascimento?: string | null
          email: string
          email_contato?: string | null
          id: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          area_id?: string | null
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string
          email_contato?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas_estrategicas"
            referencedColumns: ["id"]
          },
        ]
      }
      projetos: {
        Row: {
          area_id: string | null
          centro_custo: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          nome: string
          objetivo_id: string | null
          orcamento_previsto: number | null
          responsavel_id: string | null
          saude: Database["public"]["Enums"]["project_health"] | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
          valor_gasto: number | null
        }
        Insert: {
          area_id?: string | null
          centro_custo?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          nome: string
          objetivo_id?: string | null
          orcamento_previsto?: number | null
          responsavel_id?: string | null
          saude?: Database["public"]["Enums"]["project_health"] | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          valor_gasto?: number | null
        }
        Update: {
          area_id?: string | null
          centro_custo?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          objetivo_id?: string | null
          orcamento_previsto?: number | null
          responsavel_id?: string | null
          saude?: Database["public"]["Enums"]["project_health"] | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          valor_gasto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projetos_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas_estrategicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_objetivo_id_fkey"
            columns: ["objetivo_id"]
            isOneToOne: false
            referencedRelation: "objetivos_estrategicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      propostas_projeto: {
        Row: {
          aprovado_por: string | null
          area_id: string | null
          comentario_aprovacao: string | null
          created_at: string
          entregas_esperadas: string | null
          estimativa_orcamento: number | null
          estimativa_prazo: string | null
          id: string
          justificativa: string
          objetivo_id: string | null
          projeto_gerado_id: string | null
          proponente_id: string
          status: Database["public"]["Enums"]["proposal_status"]
          titulo: string
          updated_at: string
        }
        Insert: {
          aprovado_por?: string | null
          area_id?: string | null
          comentario_aprovacao?: string | null
          created_at?: string
          entregas_esperadas?: string | null
          estimativa_orcamento?: number | null
          estimativa_prazo?: string | null
          id?: string
          justificativa: string
          objetivo_id?: string | null
          projeto_gerado_id?: string | null
          proponente_id: string
          status?: Database["public"]["Enums"]["proposal_status"]
          titulo: string
          updated_at?: string
        }
        Update: {
          aprovado_por?: string | null
          area_id?: string | null
          comentario_aprovacao?: string | null
          created_at?: string
          entregas_esperadas?: string | null
          estimativa_orcamento?: number | null
          estimativa_prazo?: string | null
          id?: string
          justificativa?: string
          objetivo_id?: string | null
          projeto_gerado_id?: string | null
          proponente_id?: string
          status?: Database["public"]["Enums"]["proposal_status"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "propostas_projeto_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_projeto_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas_estrategicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_projeto_objetivo_id_fkey"
            columns: ["objetivo_id"]
            isOneToOne: false
            referencedRelation: "objetivos_estrategicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_projeto_projeto_gerado_id_fkey"
            columns: ["projeto_gerado_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_projeto_proponente_id_fkey"
            columns: ["proponente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      swot_items: {
        Row: {
          created_at: string
          criado_por: string | null
          descricao: string
          id: string
          projeto_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          descricao: string
          id?: string
          projeto_id: string
          tipo: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          descricao?: string
          id?: string
          projeto_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "swot_items_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swot_items_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_area_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_in_project_area: {
        Args: { _projeto_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "coordenacao" | "lider_area"
      project_health: "no_prazo" | "atencao" | "atrasado"
      project_status:
        | "nao_iniciado"
        | "em_andamento"
        | "concluido"
        | "atrasado"
        | "cancelado"
      proposal_status: "pendente" | "aprovado" | "rejeitado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["coordenacao", "lider_area"],
      project_health: ["no_prazo", "atencao", "atrasado"],
      project_status: [
        "nao_iniciado",
        "em_andamento",
        "concluido",
        "atrasado",
        "cancelado",
      ],
      proposal_status: ["pendente", "aprovado", "rejeitado"],
    },
  },
} as const
