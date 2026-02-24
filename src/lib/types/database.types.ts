/**
 * Manually created database types mirroring the Supabase PostgreSQL schema.
 *
 * These types are derived from the migration files in supabase/migrations/
 * and follow the same structure that `supabase gen types typescript` would
 * produce. Because there is no running Supabase instance, this file is
 * maintained by hand rather than auto-generated.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      seasons: {
        Row: {
          id: string;
          name: string;
          start_date: string;
          end_date: string;
          is_active: boolean;
          ranking_scope: Database['public']['Enums']['ranking_scope_enum'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          start_date: string;
          end_date: string;
          is_active?: boolean;
          ranking_scope?: Database['public']['Enums']['ranking_scope_enum'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          start_date?: string;
          end_date?: string;
          is_active?: boolean;
          ranking_scope?: Database['public']['Enums']['ranking_scope_enum'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          code: string;
          region: string;
          age_group: Database['public']['Enums']['age_group_enum'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          region: string;
          age_group: Database['public']['Enums']['age_group_enum'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          region?: string;
          age_group?: Database['public']['Enums']['age_group_enum'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tournaments: {
        Row: {
          id: string;
          name: string;
          date: string;
          season_id: string;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          date: string;
          season_id: string;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          date?: string;
          season_id?: string;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tournaments_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
        ];
      };
      tournament_weights: {
        Row: {
          id: string;
          tournament_id: string;
          season_id: string;
          weight: number;
          tier: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          season_id: string;
          weight: number;
          tier: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          season_id?: string;
          weight?: number;
          tier?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tournament_weights_tournament_id_fkey';
            columns: ['tournament_id'];
            isOneToOne: false;
            referencedRelation: 'tournaments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tournament_weights_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
        ];
      };
      tournament_results: {
        Row: {
          id: string;
          team_id: string;
          tournament_id: string;
          division: string;
          finish_position: number;
          field_size: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          tournament_id: string;
          division: string;
          finish_position: number;
          field_size: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          tournament_id?: string;
          division?: string;
          finish_position?: number;
          field_size?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tournament_results_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tournament_results_tournament_id_fkey';
            columns: ['tournament_id'];
            isOneToOne: false;
            referencedRelation: 'tournaments';
            referencedColumns: ['id'];
          },
        ];
      };
      matches: {
        Row: {
          id: string;
          team_a_id: string;
          team_b_id: string;
          winner_id: string | null;
          tournament_id: string;
          set_scores: Json | null;
          point_differential: number | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_a_id: string;
          team_b_id: string;
          winner_id?: string | null;
          tournament_id: string;
          set_scores?: Json | null;
          point_differential?: number | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_a_id?: string;
          team_b_id?: string;
          winner_id?: string | null;
          tournament_id?: string;
          set_scores?: Json | null;
          point_differential?: number | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'matches_team_a_id_fkey';
            columns: ['team_a_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_team_b_id_fkey';
            columns: ['team_b_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_winner_id_fkey';
            columns: ['winner_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_tournament_id_fkey';
            columns: ['tournament_id'];
            isOneToOne: false;
            referencedRelation: 'tournaments';
            referencedColumns: ['id'];
          },
        ];
      };
      ranking_runs: {
        Row: {
          id: string;
          season_id: string;
          ran_at: string;
          description: string | null;
          parameters: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          ran_at?: string;
          description?: string | null;
          parameters?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          season_id?: string;
          ran_at?: string;
          description?: string | null;
          parameters?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ranking_runs_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
        ];
      };
      ranking_results: {
        Row: {
          id: string;
          ranking_run_id: string;
          team_id: string;
          algo1_rating: number | null;
          algo1_rank: number | null;
          algo2_rating: number | null;
          algo2_rank: number | null;
          algo3_rating: number | null;
          algo3_rank: number | null;
          algo4_rating: number | null;
          algo4_rank: number | null;
          algo5_rating: number | null;
          algo5_rank: number | null;
          agg_rating: number | null;
          agg_rank: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ranking_run_id: string;
          team_id: string;
          algo1_rating?: number | null;
          algo1_rank?: number | null;
          algo2_rating?: number | null;
          algo2_rank?: number | null;
          algo3_rating?: number | null;
          algo3_rank?: number | null;
          algo4_rating?: number | null;
          algo4_rank?: number | null;
          algo5_rating?: number | null;
          algo5_rank?: number | null;
          agg_rating?: number | null;
          agg_rank?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ranking_run_id?: string;
          team_id?: string;
          algo1_rating?: number | null;
          algo1_rank?: number | null;
          algo2_rating?: number | null;
          algo2_rank?: number | null;
          algo3_rating?: number | null;
          algo3_rank?: number | null;
          algo4_rating?: number | null;
          algo4_rank?: number | null;
          algo5_rating?: number | null;
          algo5_rank?: number | null;
          agg_rating?: number | null;
          agg_rank?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ranking_results_ranking_run_id_fkey';
            columns: ['ranking_run_id'];
            isOneToOne: false;
            referencedRelation: 'ranking_runs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ranking_results_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      import_replace_tournament_results: {
        Args: {
          p_season_id: string;
          p_age_group: string;
          p_rows: Json;
        };
        Returns: undefined;
      };
      import_replace_ranking_results: {
        Args: {
          p_ranking_run_id: string;
          p_rows: Json;
        };
        Returns: undefined;
      };
    };
    Enums: {
      age_group_enum: '15U' | '16U' | '17U' | '18U';
      ranking_scope_enum: 'single_season' | 'cross_season';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
