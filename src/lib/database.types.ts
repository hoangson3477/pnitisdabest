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
          id: string;
          name: string;
          device_id: string;
          started_at: string;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          device_id: string;
          started_at?: string;
          finished_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          device_id?: string;
          started_at?: string;
          finished_at?: string | null;
        };
        Relationships: [];
      };
      attempt_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          variant: string;
          answer: Json;
          correct: boolean;
          points: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          variant: string;
          answer: Json;
          correct?: boolean;
          points?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          question_id?: string;
          variant?: string;
          answer?: Json;
          correct?: boolean;
          points?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      content_drafts: {
        Row: {
          id: number;
          data: Json;
          revision: number;
          updated_at: string;
        };
        Insert: {
          id?: number;
          data: Json;
          revision?: number;
          updated_at?: string;
        };
        Update: {
          id?: number;
          data?: Json;
          revision?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      content_versions: {
        Row: {
          id: string;
          data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          data: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          data?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      attempt_scores: {
        Row: {
          id: string;
          name: string;
          device_id: string;
          started_at: string;
          finished_at: string | null;
          score: number;
        };
        Relationships: [];
      };
      leaderboard: {
        Row: {
          id: string;
          name: string;
          score: number;
          started_at: string;
          finished_at: string;
          rank_no: number;
        };
        Relationships: [];
      };
    };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
