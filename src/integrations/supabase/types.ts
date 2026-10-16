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
      admin_messages: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          is_sent: boolean | null
          message: string
          message_type: string
          sent_at: string | null
          sent_via: string[] | null
          target_course_id: string | null
          target_type: string
          target_user_ids: string[] | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          is_sent?: boolean | null
          message: string
          message_type?: string
          sent_at?: string | null
          sent_via?: string[] | null
          target_course_id?: string | null
          target_type?: string
          target_user_ids?: string[] | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          is_sent?: boolean | null
          message?: string
          message_type?: string
          sent_at?: string | null
          sent_via?: string[] | null
          target_course_id?: string | null
          target_type?: string
          target_user_ids?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_messages_target_course_id_fkey"
            columns: ["target_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      available_slots: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_booked: boolean | null
          slot_date: string
          start_time: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_booked?: boolean | null
          slot_date: string
          start_time: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_booked?: boolean | null
          slot_date?: string
          start_time?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          slot_id: string
          status: Database["public"]["Enums"]["booking_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          slot_id: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          slot_id?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: true
            referencedRelation: "available_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_messages: {
        Row: {
          admin_response: string | null
          created_at: string
          escalation_reason: string | null
          id: string
          is_escalated: boolean | null
          is_resolved: boolean | null
          message: string
          response: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          escalation_reason?: string | null
          id?: string
          is_escalated?: boolean | null
          is_resolved?: boolean | null
          message: string
          response?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          escalation_reason?: string | null
          id?: string
          is_escalated?: boolean | null
          is_resolved?: boolean | null
          message?: string
          response?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      course_requests: {
        Row: {
          course_id: string
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_requests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          instructor_name: string | null
          is_free: boolean | null
          is_published: boolean | null
          order_index: number | null
          price: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          instructor_name?: string | null
          is_free?: boolean | null
          is_published?: boolean | null
          order_index?: number | null
          price?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          instructor_name?: string | null
          is_free?: boolean | null
          is_published?: boolean | null
          order_index?: number | null
          price?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      deleted_items: {
        Row: {
          deleted_at: string | null
          deleted_by: string | null
          id: string
          item_data: Json
          item_id: string
          item_type: string
        }
        Insert: {
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          item_data: Json
          item_id: string
          item_type: string
        }
        Update: {
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          item_data?: Json
          item_id?: string
          item_type?: string
        }
        Relationships: []
      }
      dictionary: {
        Row: {
          created_at: string
          example_sentence: string | null
          example_sentence_meaning: string | null
          id: string
          meaning: string
          pronunciation_url: string | null
          updated_at: string
          word: string
        }
        Insert: {
          created_at?: string
          example_sentence?: string | null
          example_sentence_meaning?: string | null
          id?: string
          meaning: string
          pronunciation_url?: string | null
          updated_at?: string
          word: string
        }
        Update: {
          created_at?: string
          example_sentence?: string | null
          example_sentence_meaning?: string | null
          id?: string
          meaning?: string
          pronunciation_url?: string | null
          updated_at?: string
          word?: string
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          answers: Json
          created_at: string
          exam_id: string
          id: string
          results: Json
          score: number
          total: number
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          exam_id: string
          id?: string
          results?: Json
          score?: number
          total?: number
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          exam_id?: string
          id?: string
          results?: Json
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          correct_index: number
          created_at: string
          exam_id: string
          id: string
          options: Json
          order_index: number
          question: string
        }
        Insert: {
          correct_index?: number
          created_at?: string
          exam_id: string
          id?: string
          options?: Json
          order_index?: number
          question: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          exam_id?: string
          id?: string
          options?: Json
          order_index?: number
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_published: boolean
          title: string
          week_label: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_published?: boolean
          title: string
          week_label?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_published?: boolean
          title?: string
          week_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          lesson_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lesson_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lesson_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_resources: {
        Row: {
          created_at: string
          description: string | null
          file_type: string | null
          file_url: string
          id: string
          lesson_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          lesson_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          lesson_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          course_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_locked: boolean | null
          is_published: boolean | null
          order_index: number | null
          playlist_id: string
          thumbnail_url: string | null
          title: string
          unlock_date: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_locked?: boolean | null
          is_published?: boolean | null
          order_index?: number | null
          playlist_id: string
          thumbnail_url?: string | null
          title: string
          unlock_date?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_locked?: boolean | null
          is_published?: boolean | null
          order_index?: number | null
          playlist_id?: string
          thumbnail_url?: string | null
          title?: string
          unlock_date?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      playlists: {
        Row: {
          course_id: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean | null
          order_index: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlists_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_approved: boolean | null
          language_level: Database["public"]["Enums"]["language_level"] | null
          learning_duration_months: number | null
          likes_english: boolean | null
          referral_source: string | null
          selected_course_id: string | null
          subscription_end_date: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_approved?: boolean | null
          language_level?: Database["public"]["Enums"]["language_level"] | null
          learning_duration_months?: number | null
          likes_english?: boolean | null
          referral_source?: string | null
          selected_course_id?: string | null
          subscription_end_date?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_approved?: boolean | null
          language_level?: Database["public"]["Enums"]["language_level"] | null
          learning_duration_months?: number | null
          likes_english?: boolean | null
          referral_source?: string | null
          selected_course_id?: string | null
          subscription_end_date?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_selected_course_id_fkey"
            columns: ["selected_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      student_course_access: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_approved: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_course_access_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      student_group_members: {
        Row: {
          created_at: string
          group_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      student_groups: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      student_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_playlist_access: {
        Row: {
          created_at: string
          id: string
          is_approved: boolean | null
          playlist_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_approved?: boolean | null
          playlist_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_approved?: boolean | null
          playlist_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_playlist_access_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean | null
          last_watched_at: string | null
          lesson_id: string
          user_id: string
          video_duration_seconds: number | null
          video_stop_second: number | null
          watched_seconds: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          last_watched_at?: string | null
          lesson_id: string
          user_id: string
          video_duration_seconds?: number | null
          video_stop_second?: number | null
          watched_seconds?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          last_watched_at?: string | null
          lesson_id?: string
          user_id?: string
          video_duration_seconds?: number | null
          video_stop_second?: number | null
          watched_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_exam_questions: {
        Args: { _exam_id: string }
        Returns: {
          id: string
          options: Json
          order_index: number
          question: string
        }[]
      }
      has_course_access: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      has_playlist_access: {
        Args: { _playlist_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
      submit_exam: {
        Args: { _answers: Json; _exam_id: string }
        Returns: {
          answers: Json
          created_at: string
          exam_id: string
          id: string
          results: Json
          score: number
          total: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "exam_attempts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "student"
      booking_status: "pending" | "confirmed" | "completed" | "cancelled"
      language_level:
        | "beginner"
        | "elementary"
        | "intermediate"
        | "upper_intermediate"
        | "advanced"
      subscription_status: "pending" | "active" | "expired" | "cancelled"
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
      app_role: ["admin", "student"],
      booking_status: ["pending", "confirmed", "completed", "cancelled"],
      language_level: [
        "beginner",
        "elementary",
        "intermediate",
        "upper_intermediate",
        "advanced",
      ],
      subscription_status: ["pending", "active", "expired", "cancelled"],
    },
  },
} as const
