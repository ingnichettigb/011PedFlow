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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          performed_by: string | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          performed_by?: string | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          performed_by?: string | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      clp_substances_db: {
        Row: {
          cas_no: string | null
          chemical_name: string
          created_at: string
          created_by: string | null
          ec_no: string | null
          gruppo_ped: string
          hazard_codes: string | null
          id: string
          index_no: string | null
          labelling_h_codes: string | null
          pictograms: string | null
          updated_at: string
        }
        Insert: {
          cas_no?: string | null
          chemical_name: string
          created_at?: string
          created_by?: string | null
          ec_no?: string | null
          gruppo_ped: string
          hazard_codes?: string | null
          id?: string
          index_no?: string | null
          labelling_h_codes?: string | null
          pictograms?: string | null
          updated_at?: string
        }
        Update: {
          cas_no?: string | null
          chemical_name?: string
          created_at?: string
          created_by?: string | null
          ec_no?: string | null
          gruppo_ped?: string
          hazard_codes?: string | null
          id?: string
          index_no?: string | null
          labelling_h_codes?: string | null
          pictograms?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      h_codes_db: {
        Row: {
          avvertenza: string | null
          categoria: string
          categoria_clp: string | null
          classe_pericolo: string | null
          codice: string
          created_at: string
          created_by: string | null
          descrizione: string
          gruppo_ped: string
          id: string
          updated_at: string
          voce_ped: string | null
        }
        Insert: {
          avvertenza?: string | null
          categoria: string
          categoria_clp?: string | null
          classe_pericolo?: string | null
          codice: string
          created_at?: string
          created_by?: string | null
          descrizione: string
          gruppo_ped: string
          id?: string
          updated_at?: string
          voce_ped?: string | null
        }
        Update: {
          avvertenza?: string | null
          categoria?: string
          categoria_clp?: string | null
          classe_pericolo?: string | null
          codice?: string
          created_at?: string
          created_by?: string | null
          descrizione?: string
          gruppo_ped?: string
          id?: string
          updated_at?: string
          voce_ped?: string | null
        }
        Relationships: []
      }
      lead_emails: {
        Row: {
          code_sent_at: string | null
          created_at: string
          email: string
          id: string
          is_verified: boolean
          otp_attempts: number
          otp_window_start: string | null
          source: string | null
          verification_code: string | null
          verified_at: string | null
        }
        Insert: {
          code_sent_at?: string | null
          created_at?: string
          email: string
          id?: string
          is_verified?: boolean
          otp_attempts?: number
          otp_window_start?: string | null
          source?: string | null
          verification_code?: string | null
          verified_at?: string | null
        }
        Update: {
          code_sent_at?: string | null
          created_at?: string
          email?: string
          id?: string
          is_verified?: boolean
          otp_attempts?: number
          otp_window_start?: string | null
          source?: string | null
          verification_code?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string | null
          brand_font: string | null
          brand_primary_color: string | null
          brand_secondary_color: string | null
          created_at: string
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          brand_font?: string | null
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          brand_font?: string | null
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      ped_classifications: {
        Row: {
          art13_applied: boolean
          base_group: number
          cas_no: string | null
          cliente: string | null
          commessa: string | null
          created_at: string
          determining_h_codes: string[]
          ec_no: string | null
          final_group: number
          flash_point: number | null
          fluid_name: string
          h_codes: string[]
          id: string
          input_snapshot: Json
          method: string
          numero_disegno: string | null
          org_id: string
          progetto: string | null
          rationale: string
          t_max: number | null
          t_min: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          art13_applied?: boolean
          base_group: number
          cas_no?: string | null
          cliente?: string | null
          commessa?: string | null
          created_at?: string
          determining_h_codes?: string[]
          ec_no?: string | null
          final_group: number
          flash_point?: number | null
          fluid_name: string
          h_codes?: string[]
          id?: string
          input_snapshot?: Json
          method?: string
          numero_disegno?: string | null
          org_id?: string
          progetto?: string | null
          rationale: string
          t_max?: number | null
          t_min?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          art13_applied?: boolean
          base_group?: number
          cas_no?: string | null
          cliente?: string | null
          commessa?: string | null
          created_at?: string
          determining_h_codes?: string[]
          ec_no?: string | null
          final_group?: number
          flash_point?: number | null
          fluid_name?: string
          h_codes?: string[]
          id?: string
          input_snapshot?: Json
          method?: string
          numero_disegno?: string | null
          org_id?: string
          progetto?: string | null
          rationale?: string
          t_max?: number | null
          t_min?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department_id: string | null
          full_name: string | null
          id: string
          org_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          full_name?: string | null
          id?: string
          org_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          full_name?: string | null
          id?: string
          org_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "agent"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "manager", "agent"],
    },
  },
} as const
