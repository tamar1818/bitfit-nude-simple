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
      activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          calories_burned: number
          created_at: string
          date: string
          duration_min: number
          id: string
          label: string | null
          user_id: string
        }
        Insert: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          calories_burned?: number
          created_at?: string
          date?: string
          duration_min?: number
          id?: string
          label?: string | null
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          calories_burned?: number
          created_at?: string
          date?: string
          duration_min?: number
          id?: string
          label?: string | null
          user_id?: string
        }
        Relationships: []
      }
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
      group_check_ins: {
        Row: {
          created_at: string
          date: string
          group_id: string
          id: string
          note: string | null
          success: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          group_id: string
          id?: string
          note?: string | null
          success?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          group_id?: string
          id?: string
          note?: string | null
          success?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_check_ins_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          challenge_days: number | null
          challenge_title: string | null
          created_at: string
          id: string
          invite_slug: string
          name: string
          owner_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          challenge_days?: number | null
          challenge_title?: string | null
          created_at?: string
          id?: string
          invite_slug?: string
          name: string
          owner_id: string
          start_date?: string
          updated_at?: string
        }
        Update: {
          challenge_days?: number | null
          challenge_title?: string | null
          created_at?: string
          id?: string
          invite_slug?: string
          name?: string
          owner_id?: string
          start_date?: string
          updated_at?: string
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
          activity_level: Database["public"]["Enums"]["activity_level"] | null
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
          theme: string
          updated_at: string
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
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
          theme?: string
          updated_at?: string
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
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
          theme?: string
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
      weight_points: {
        Row: {
          awarded_at: string
          id: string
          points: number
          reason: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          id?: string
          points?: number
          reason: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          id?: string
          points?: number
          reason?: string
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
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      join_group_by_slug: { Args: { _slug: string }; Returns: string }
      redeem_coach_invite: { Args: { _code: string }; Returns: string }
      user_in_any_group: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      activity_level: "sedentary" | "light" | "moderate" | "active" | "extra"
      activity_type:
        | "walk"
        | "run"
        | "gym"
        | "swim"
        | "cycle"
        | "yoga"
        | "hiit"
        | "sport"
        | "other"
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
      activity_level: ["sedentary", "light", "moderate", "active", "extra"],
      activity_type: [
        "walk",
        "run",
        "gym",
        "swim",
        "cycle",
        "yoga",
        "hiit",
        "sport",
        "other",
      ],
      app_role: ["user", "coach", "admin"],
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
      user_gender: ["male", "female", "other"],
      user_goal: ["lose", "gain", "maintain"],
      user_lang: ["ka", "en"],
    },
  },
} as const
