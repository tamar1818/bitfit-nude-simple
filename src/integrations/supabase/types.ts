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
      coach_invites: {
        Row: {
          coach_id: string
          code: string
          created_at: string
          expires_at: string
          id: string
          used_at: string | null
          used_by_user_id: string | null
        }
        Insert: {
          coach_id: string
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          used_at?: string | null
          used_by_user_id?: string | null
        }
        Update: {
          coach_id?: string
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          used_at?: string | null
          used_by_user_id?: string | null
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          calories_goal: number
          created_at: string
          date: string
          id: string
          steps: number
          updated_at: string
          user_id: string
          water_ml: number
        }
        Insert: {
          calories_goal?: number
          created_at?: string
          date?: string
          id?: string
          steps?: number
          updated_at?: string
          user_id: string
          water_ml?: number
        }
        Update: {
          calories_goal?: number
          created_at?: string
          date?: string
          id?: string
          steps?: number
          updated_at?: string
          user_id?: string
          water_ml?: number
        }
        Relationships: []
      }
      foods_ge: {
        Row: {
          brand: string | null
          calories_per_100g: number
          carbs_g: number
          category: string | null
          created_at: string
          fats_g: number
          id: string
          name_en: string
          name_ka: string
          protein_g: number
          serving_size_g: number | null
        }
        Insert: {
          brand?: string | null
          calories_per_100g: number
          carbs_g?: number
          category?: string | null
          created_at?: string
          fats_g?: number
          id?: string
          name_en: string
          name_ka: string
          protein_g?: number
          serving_size_g?: number | null
        }
        Update: {
          brand?: string | null
          calories_per_100g?: number
          carbs_g?: number
          category?: string | null
          created_at?: string
          fats_g?: number
          id?: string
          name_en?: string
          name_ka?: string
          protein_g?: number
          serving_size_g?: number | null
        }
        Relationships: []
      }
      meals: {
        Row: {
          calories: number
          carbs_g: number
          created_at: string
          date: string
          fats_g: number
          food_id: string | null
          food_name: string
          id: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          protein_g: number
          servings: number
          user_id: string
        }
        Insert: {
          calories: number
          carbs_g?: number
          created_at?: string
          date?: string
          fats_g?: number
          food_id?: string | null
          food_name: string
          id?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          protein_g?: number
          servings?: number
          user_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          created_at?: string
          date?: string
          fats_g?: number
          food_id?: string | null
          food_name?: string
          id?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          protein_g?: number
          servings?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods_ge"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          coach_id: string | null
          created_at: string
          full_name: string | null
          gender: Database["public"]["Enums"]["user_gender"] | null
          goal: Database["public"]["Enums"]["user_goal"] | null
          height_cm: number | null
          id: string
          is_coach: boolean
          language: Database["public"]["Enums"]["user_lang"]
          onboarded: boolean
          updated_at: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          coach_id?: string | null
          created_at?: string
          full_name?: string | null
          gender?: Database["public"]["Enums"]["user_gender"] | null
          goal?: Database["public"]["Enums"]["user_goal"] | null
          height_cm?: number | null
          id: string
          is_coach?: boolean
          language?: Database["public"]["Enums"]["user_lang"]
          onboarded?: boolean
          updated_at?: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          coach_id?: string | null
          created_at?: string
          full_name?: string | null
          gender?: Database["public"]["Enums"]["user_gender"] | null
          goal?: Database["public"]["Enums"]["user_goal"] | null
          height_cm?: number | null
          id?: string
          is_coach?: boolean
          language?: Database["public"]["Enums"]["user_lang"]
          onboarded?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weights: {
        Row: {
          created_at: string
          id: string
          recorded_at: string
          target_weight_kg: number | null
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          recorded_at?: string
          target_weight_kg?: number | null
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          recorded_at?: string
          target_weight_kg?: number | null
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      redeem_coach_invite: { Args: { _code: string }; Returns: string }
    }
    Enums: {
      app_role: "user" | "coach" | "admin"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack"
      user_gender: "male" | "female" | "other"
      user_goal: "lose" | "gain" | "maintain"
      user_lang: "ka" | "en"
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
      app_role: ["user", "coach", "admin"],
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
      user_gender: ["male", "female", "other"],
      user_goal: ["lose", "gain", "maintain"],
      user_lang: ["ka", "en"],
    },
  },
} as const
