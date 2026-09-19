// Authored to match supabase/migrations/.
// Regenerate with `supabase gen types` once a project is linked.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      attempts: {
        Row: {
          created_at: string;
          feedback: string | null;
          id: string;
          question_id: string;
          score: number;
          user_answer: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          feedback?: string | null;
          id?: string;
          question_id: string;
          score: number;
          user_answer: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          feedback?: string | null;
          id?: string;
          question_id?: string;
          score?: number;
          user_answer?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attempts_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      chunks: {
        Row: {
          content: string;
          document_id: string;
          embedding: string;
          id: string;
          page_number: number;
          token_count: number;
        };
        Insert: {
          content: string;
          document_id: string;
          embedding: string | number[];
          id?: string;
          page_number: number;
          token_count: number;
        };
        Update: {
          content?: string;
          document_id?: string;
          embedding?: string | number[];
          id?: string;
          page_number?: number;
          token_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "chunks_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          created_at: string;
          error_message: string | null;
          filename: string;
          id: string;
          page_count: number | null;
          status: Database["public"]["Enums"]["document_status"];
          storage_path: string;
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          filename: string;
          id?: string;
          page_count?: number | null;
          status?: Database["public"]["Enums"]["document_status"];
          storage_path: string;
          title: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          filename?: string;
          id?: string;
          page_count?: number | null;
          status?: Database["public"]["Enums"]["document_status"];
          storage_path?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          created_at: string;
          difficulty: number;
          document_id: string;
          id: string;
          kind: Database["public"]["Enums"]["question_kind"];
          options: Json | null;
          prompt: string;
          reference_answer: string;
          source_chunk_ids: string[];
          topic_id: string;
        };
        Insert: {
          created_at?: string;
          difficulty: number;
          document_id: string;
          id?: string;
          kind: Database["public"]["Enums"]["question_kind"];
          options?: Json | null;
          prompt: string;
          reference_answer: string;
          source_chunk_ids?: string[];
          topic_id: string;
        };
        Update: {
          created_at?: string;
          difficulty?: number;
          document_id?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["question_kind"];
          options?: Json | null;
          prompt?: string;
          reference_answer?: string;
          source_chunk_ids?: string[];
          topic_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      review_state: {
        Row: {
          due_at: string | null;
          ease: number;
          id: string;
          interval_days: number;
          question_id: string;
          repetitions: number;
          user_id: string;
        };
        Insert: {
          due_at?: string | null;
          ease?: number;
          id?: string;
          interval_days?: number;
          question_id: string;
          repetitions?: number;
          user_id: string;
        };
        Update: {
          due_at?: string | null;
          ease?: number;
          id?: string;
          interval_days?: number;
          question_id?: string;
          repetitions?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_state_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      topics: {
        Row: {
          document_id: string;
          id: string;
          name: string;
          summary: string;
        };
        Insert: {
          document_id: string;
          id?: string;
          name: string;
          summary: string;
        };
        Update: {
          document_id?: string;
          id?: string;
          name?: string;
          summary?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topics_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_chunks: {
        Args: {
          document_id: string;
          match_count: number;
          query_embedding: string | number[];
        };
        Returns: {
          content: string;
          document_id: string;
          id: string;
          page_number: number;
          similarity: number;
          token_count: number;
        }[];
      };
      progress_dashboard: {
        Args: {
          p_now?: string;
          p_time_zone?: string;
          p_user_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      document_status:
        | "uploaded"
        | "parsing"
        | "embedding"
        | "generating"
        | "ready"
        | "failed";
      question_kind: "short_answer" | "multiple_choice";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Row"];

export type TablesInsert<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Update"];

export type Enums<EnumName extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][EnumName];

export type MatchChunk = PublicSchema["Functions"]["match_chunks"]["Returns"][number];
