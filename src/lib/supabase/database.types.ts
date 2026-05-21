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
      academies: {
        Row: {
          country: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          settings: Json
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          settings?: Json
          slug: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          settings?: Json
          slug?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      academy_calendar: {
        Row: {
          academy_id: string
          applies_to_groups: string[] | null
          applies_to_tracks:
            | Database["public"]["Enums"]["development_track"][]
            | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          event_type: Database["public"]["Enums"]["calendar_event_type"]
          id: string
          start_date: string
          title: string
        }
        Insert: {
          academy_id: string
          applies_to_groups?: string[] | null
          applies_to_tracks?:
            | Database["public"]["Enums"]["development_track"][]
            | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type: Database["public"]["Enums"]["calendar_event_type"]
          id?: string
          start_date: string
          title: string
        }
        Update: {
          academy_id?: string
          applies_to_groups?: string[] | null
          applies_to_tracks?:
            | Database["public"]["Enums"]["development_track"][]
            | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: Database["public"]["Enums"]["calendar_event_type"]
          id?: string
          start_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_calendar_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_calendar_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_calendar_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "academy_calendar_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      academy_curriculum_overrides: {
        Row: {
          academy_id: string
          applied_at: string | null
          applied_by: string | null
          applied_change: Json | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          curriculum_version_id: string
          id: string
          original_snapshot: Json | null
          override_reason: string | null
          override_type: string
          pathway: string | null
          proposed_change: Json
          raw_input: string | null
          rollback_of_override_id: string | null
          scope: string
          source: string
          status: string
          target_id: string | null
          target_type: string
          updated_at: string
        }
        Insert: {
          academy_id: string
          applied_at?: string | null
          applied_by?: string | null
          applied_change?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          curriculum_version_id: string
          id?: string
          original_snapshot?: Json | null
          override_reason?: string | null
          override_type: string
          pathway?: string | null
          proposed_change?: Json
          raw_input?: string | null
          rollback_of_override_id?: string | null
          scope?: string
          source?: string
          status?: string
          target_id?: string | null
          target_type: string
          updated_at?: string
        }
        Update: {
          academy_id?: string
          applied_at?: string | null
          applied_by?: string | null
          applied_change?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          curriculum_version_id?: string
          id?: string
          original_snapshot?: Json | null
          override_reason?: string | null
          override_type?: string
          pathway?: string | null
          proposed_change?: Json
          raw_input?: string | null
          rollback_of_override_id?: string | null
          scope?: string
          source?: string
          status?: string
          target_id?: string | null
          target_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_curriculum_overrides_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_curriculum_overrides_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_curriculum_overrides_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "academy_curriculum_overrides_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "academy_curriculum_overrides_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_curriculum_overrides_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "academy_curriculum_overrides_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "academy_curriculum_overrides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_curriculum_overrides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "academy_curriculum_overrides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "academy_curriculum_overrides_curriculum_version_id_fkey"
            columns: ["curriculum_version_id"]
            isOneToOne: false
            referencedRelation: "academy_curriculum_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_curriculum_overrides_rollback_of_override_id_fkey"
            columns: ["rollback_of_override_id"]
            isOneToOne: false
            referencedRelation: "academy_curriculum_overrides"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_curriculum_versions: {
        Row: {
          academy_id: string
          activated_at: string | null
          base_curriculum_version_id: string | null
          cloned_from_global_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
          version_number: number
        }
        Insert: {
          academy_id: string
          activated_at?: string | null
          base_curriculum_version_id?: string | null
          cloned_from_global_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          version_number?: number
        }
        Update: {
          academy_id?: string
          activated_at?: string | null
          base_curriculum_version_id?: string | null
          cloned_from_global_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "academy_curriculum_versions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_curriculum_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_curriculum_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "academy_curriculum_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      academy_levels: {
        Row: {
          academy_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          label: string
          level_number: number
          max_age: number | null
          min_age: number | null
          sort_order: number
          track: Database["public"]["Enums"]["development_track"] | null
        }
        Insert: {
          academy_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          level_number: number
          max_age?: number | null
          min_age?: number | null
          sort_order?: number
          track?: Database["public"]["Enums"]["development_track"] | null
        }
        Update: {
          academy_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          level_number?: number
          max_age?: number | null
          min_age?: number | null
          sort_order?: number
          track?: Database["public"]["Enums"]["development_track"] | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_levels_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_memberships: {
        Row: {
          academy_id: string
          created_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          profile_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          academy_id: string
          created_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          profile_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          academy_id?: string
          created_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          profile_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_memberships_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_memberships_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_memberships_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "academy_memberships_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "academy_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "academy_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      academy_suggestions: {
        Row: {
          academy_id: string
          confidence: string
          created_at: string
          created_by: string | null
          entity_id: string | null
          entity_type: string | null
          evidence: Json
          id: string
          impact_preview: Json
          priority: string
          proposed_changes: Json
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source: string
          status: string
          suggestion_type: string
          summary: string | null
          title: string
          updated_at: string
          will_not_change: Json
        }
        Insert: {
          academy_id: string
          confidence?: string
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          evidence?: Json
          id?: string
          impact_preview?: Json
          priority?: string
          proposed_changes?: Json
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          status?: string
          suggestion_type: string
          summary?: string | null
          title: string
          updated_at?: string
          will_not_change?: Json
        }
        Update: {
          academy_id?: string
          confidence?: string
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          evidence?: Json
          id?: string
          impact_preview?: Json
          priority?: string
          proposed_changes?: Json
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          status?: string
          suggestion_type?: string
          summary?: string | null
          title?: string
          updated_at?: string
          will_not_change?: Json
        }
        Relationships: [
          {
            foreignKeyName: "academy_suggestions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_suggestions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_suggestions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "academy_suggestions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "academy_suggestions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_suggestions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "academy_suggestions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      academy_threshold_configs: {
        Row: {
          academy_id: string
          config_key: string
          config_value: number
          default_value: number
          description: string | null
          id: string
          is_active: boolean
          max_value: number | null
          min_value: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          academy_id: string
          config_key: string
          config_value: number
          default_value: number
          description?: string | null
          id?: string
          is_active?: boolean
          max_value?: number | null
          min_value?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          academy_id?: string
          config_key?: string
          config_value?: number
          default_value?: number
          description?: string | null
          id?: string
          is_active?: boolean
          max_value?: number | null
          min_value?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_threshold_configs_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_threshold_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_threshold_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "academy_threshold_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      action_execution_logs: {
        Row: {
          academy_id: string
          error_message: string | null
          executed_at: string
          executed_by: string | null
          execution_result: Json | null
          id: string
          objects_created: string[] | null
          objects_modified: string[] | null
          proposed_action_id: string
          status: string
        }
        Insert: {
          academy_id: string
          error_message?: string | null
          executed_at?: string
          executed_by?: string | null
          execution_result?: Json | null
          id?: string
          objects_created?: string[] | null
          objects_modified?: string[] | null
          proposed_action_id: string
          status: string
        }
        Update: {
          academy_id?: string
          error_message?: string | null
          executed_at?: string
          executed_by?: string | null
          execution_result?: Json | null
          id?: string
          objects_created?: string[] | null
          objects_modified?: string[] | null
          proposed_action_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_execution_logs_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_execution_logs_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "action_execution_logs_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "action_execution_logs_proposed_action_id_fkey"
            columns: ["proposed_action_id"]
            isOneToOne: false
            referencedRelation: "proposed_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_execution_logs_proposed_action_id_fkey"
            columns: ["proposed_action_id"]
            isOneToOne: false
            referencedRelation: "v_pending_proposed_actions"
            referencedColumns: ["action_id"]
          },
        ]
      }
      assessment_versions: {
        Row: {
          academy_id: string
          categories: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          scoring_scale: Json
        }
        Insert: {
          academy_id: string
          categories: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          scoring_scale?: Json
        }
        Update: {
          academy_id?: string
          categories?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          scoring_scale?: Json
        }
        Relationships: [
          {
            foreignKeyName: "assessment_versions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "assessment_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      assessments: {
        Row: {
          academy_id: string
          assessed_by: string
          assessed_date: string
          behavioral_score: number | null
          competition_score: number | null
          created_at: string
          id: string
          is_baseline: boolean
          movement_score: number | null
          notes: string | null
          overall_score: number | null
          player_id: string
          priorities: string[] | null
          promotion_notes: string | null
          promotion_ready: boolean
          scores_detail: Json | null
          session_id: string | null
          strengths: string[] | null
          tactical_score: number | null
          technical_score: number | null
          type: Database["public"]["Enums"]["assessment_type"]
          updated_at: string
          version_id: string | null
          voice_command_id: string | null
          weaknesses: string[] | null
        }
        Insert: {
          academy_id: string
          assessed_by: string
          assessed_date?: string
          behavioral_score?: number | null
          competition_score?: number | null
          created_at?: string
          id?: string
          is_baseline?: boolean
          movement_score?: number | null
          notes?: string | null
          overall_score?: number | null
          player_id: string
          priorities?: string[] | null
          promotion_notes?: string | null
          promotion_ready?: boolean
          scores_detail?: Json | null
          session_id?: string | null
          strengths?: string[] | null
          tactical_score?: number | null
          technical_score?: number | null
          type?: Database["public"]["Enums"]["assessment_type"]
          updated_at?: string
          version_id?: string | null
          voice_command_id?: string | null
          weaknesses?: string[] | null
        }
        Update: {
          academy_id?: string
          assessed_by?: string
          assessed_date?: string
          behavioral_score?: number | null
          competition_score?: number | null
          created_at?: string
          id?: string
          is_baseline?: boolean
          movement_score?: number | null
          notes?: string | null
          overall_score?: number | null
          player_id?: string
          priorities?: string[] | null
          promotion_notes?: string | null
          promotion_ready?: boolean
          scores_detail?: Json | null
          session_id?: string | null
          strengths?: string[] | null
          tactical_score?: number | null
          technical_score?: number | null
          type?: Database["public"]["Enums"]["assessment_type"]
          updated_at?: string
          version_id?: string | null
          voice_command_id?: string | null
          weaknesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_assessed_by_fkey"
            columns: ["assessed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_assessed_by_fkey"
            columns: ["assessed_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "assessments_assessed_by_fkey"
            columns: ["assessed_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "assessments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "assessments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "assessments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "assessments_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "assessment_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          academy_id: string
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["user_role"] | null
          created_at: string
          id: string
          payload: Json | null
          source_type: string
          target_id: string | null
          target_label: string | null
          target_type: string
          voice_command_id: string | null
        }
        Insert: {
          academy_id: string
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          created_at?: string
          id?: string
          payload?: Json | null
          source_type?: string
          target_id?: string | null
          target_label?: string | null
          target_type: string
          voice_command_id?: string | null
        }
        Update: {
          academy_id?: string
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          created_at?: string
          id?: string
          payload?: Json | null
          source_type?: string
          target_id?: string | null
          target_label?: string | null
          target_type?: string
          voice_command_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      benchmark_definitions: {
        Row: {
          above_gap_threshold: number
          academy_id: string
          below_gap_threshold: number
          benchmark_type: Database["public"]["Enums"]["benchmark_type"]
          created_at: string
          criteria: Json
          description: string | null
          expected_score_max: number | null
          expected_score_min: number | null
          expected_utr_max: number | null
          expected_utr_min: number | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          above_gap_threshold?: number
          academy_id: string
          below_gap_threshold?: number
          benchmark_type: Database["public"]["Enums"]["benchmark_type"]
          created_at?: string
          criteria?: Json
          description?: string | null
          expected_score_max?: number | null
          expected_score_min?: number | null
          expected_utr_max?: number | null
          expected_utr_min?: number | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          above_gap_threshold?: number
          academy_id?: string
          below_gap_threshold?: number
          benchmark_type?: Database["public"]["Enums"]["benchmark_type"]
          created_at?: string
          criteria?: Json
          description?: string | null
          expected_score_max?: number | null
          expected_score_min?: number | null
          expected_utr_max?: number | null
          expected_utr_min?: number | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "benchmark_definitions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      clarification_requests: {
        Row: {
          academy_id: string
          created_at: string
          id: string
          options: Json | null
          question: string
          question_type: string
          required_fields: string[] | null
          responded_at: string | null
          response: string | null
          voice_command_id: string
        }
        Insert: {
          academy_id: string
          created_at?: string
          id?: string
          options?: Json | null
          question: string
          question_type: string
          required_fields?: string[] | null
          responded_at?: string | null
          response?: string | null
          voice_command_id: string
        }
        Update: {
          academy_id?: string
          created_at?: string
          id?: string
          options?: Json | null
          question?: string
          question_type?: string
          required_fields?: string[] | null
          responded_at?: string | null
          response?: string | null
          voice_command_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clarification_requests_voice_command_id_fkey"
            columns: ["voice_command_id"]
            isOneToOne: false
            referencedRelation: "voice_commands"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_group_assignments: {
        Row: {
          academy_id: string
          assigned_at: string
          coach_id: string
          group_id: string
          id: string
          is_active: boolean
          role: string
        }
        Insert: {
          academy_id: string
          assigned_at?: string
          coach_id: string
          group_id: string
          id?: string
          is_active?: boolean
          role?: string
        }
        Update: {
          academy_id?: string
          assigned_at?: string
          coach_id?: string
          group_id?: string
          id?: string
          is_active?: boolean
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_group_assignments_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_group_assignments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_group_assignments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "coach_group_assignments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "coach_group_assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_group_assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "coach_group_assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["group_id"]
          },
        ]
      }
      coach_observations: {
        Row: {
          academy_id: string
          ai_entities: Json | null
          ai_parsed: boolean
          ai_parsed_at: string | null
          coach_id: string
          content: string
          created_at: string
          id: string
          is_private: boolean
          observation_type: string
          player_id: string
          session_id: string | null
          tags: string[] | null
          updated_at: string
          voice_command_id: string | null
        }
        Insert: {
          academy_id: string
          ai_entities?: Json | null
          ai_parsed?: boolean
          ai_parsed_at?: string | null
          coach_id: string
          content: string
          created_at?: string
          id?: string
          is_private?: boolean
          observation_type?: string
          player_id: string
          session_id?: string | null
          tags?: string[] | null
          updated_at?: string
          voice_command_id?: string | null
        }
        Update: {
          academy_id?: string
          ai_entities?: Json | null
          ai_parsed?: boolean
          ai_parsed_at?: string | null
          coach_id?: string
          content?: string
          created_at?: string
          id?: string
          is_private?: boolean
          observation_type?: string
          player_id?: string
          session_id?: string | null
          tags?: string[] | null
          updated_at?: string
          voice_command_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_observations_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_observations_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_observations_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "coach_observations_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "coach_observations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_observations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "coach_observations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "coach_observations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "coach_observations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_observations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_session_load"
            referencedColumns: ["session_id"]
          },
        ]
      }
      coaching_messages: {
        Row: {
          academy_id: string
          audience: Database["public"]["Enums"]["message_audience"]
          coaching_focus: string | null
          created_at: string
          detailed_message: string
          edited_detailed_message: string | null
          edited_short_message: string | null
          generated_by: string
          id: string
          is_reviewed: boolean
          is_sent: boolean
          player_id: string
          recommendation_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sent_at: string | null
          sent_by: string | null
          session_id: string | null
          short_message: string
          signal_id: string | null
          tone: Database["public"]["Enums"]["message_tone"]
          updated_at: string
        }
        Insert: {
          academy_id: string
          audience?: Database["public"]["Enums"]["message_audience"]
          coaching_focus?: string | null
          created_at?: string
          detailed_message: string
          edited_detailed_message?: string | null
          edited_short_message?: string | null
          generated_by?: string
          id?: string
          is_reviewed?: boolean
          is_sent?: boolean
          player_id: string
          recommendation_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sent_at?: string | null
          sent_by?: string | null
          session_id?: string | null
          short_message: string
          signal_id?: string | null
          tone?: Database["public"]["Enums"]["message_tone"]
          updated_at?: string
        }
        Update: {
          academy_id?: string
          audience?: Database["public"]["Enums"]["message_audience"]
          coaching_focus?: string | null
          created_at?: string
          detailed_message?: string
          edited_detailed_message?: string | null
          edited_short_message?: string | null
          generated_by?: string
          id?: string
          is_reviewed?: boolean
          is_sent?: boolean
          player_id?: string
          recommendation_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sent_at?: string | null
          sent_by?: string | null
          session_id?: string | null
          short_message?: string
          signal_id?: string | null
          tone?: Database["public"]["Enums"]["message_tone"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_messages_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_messages_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_messages_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "coaching_messages_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "coaching_messages_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "coaching_messages_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "player_recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_messages_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "v_player_development_loop"
            referencedColumns: ["recommendation_id"]
          },
          {
            foreignKeyName: "coaching_messages_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "v_recommendation_review_queue"
            referencedColumns: ["recommendation_id"]
          },
          {
            foreignKeyName: "coaching_messages_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_messages_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "coaching_messages_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "coaching_messages_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_messages_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "coaching_messages_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "coaching_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_session_load"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "coaching_messages_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "player_development_signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_messages_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "v_player_signal_dashboard"
            referencedColumns: ["signal_id"]
          },
        ]
      }
      cohort_memberships: {
        Row: {
          academy_id: string
          assigned_at: string
          cohort_id: string
          id: string
          player_id: string
        }
        Insert: {
          academy_id: string
          assigned_at?: string
          cohort_id: string
          id?: string
          player_id: string
        }
        Update: {
          academy_id?: string
          assigned_at?: string
          cohort_id?: string
          id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_memberships_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_memberships_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "player_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_memberships_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_overview"
            referencedColumns: ["cohort_id"]
          },
          {
            foreignKeyName: "cohort_memberships_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_memberships_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "cohort_memberships_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "cohort_memberships_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      cohort_stats: {
        Row: {
          academy_id: string
          active_member_count: number
          avg_competition_score: number | null
          avg_fatigue_risk: number | null
          avg_movement_score: number | null
          avg_overall_score: number | null
          avg_sessions_7d: number | null
          avg_tactical_score: number | null
          avg_technical_score: number | null
          avg_utr_rating: number | null
          cohort_id: string
          common_priority_categories: string[] | null
          common_signal_types: string[] | null
          computed_at: string
          id: string
          member_count: number
          p25_overall_score: number | null
          p25_utr_rating: number | null
          p75_overall_score: number | null
          p75_utr_rating: number | null
          recommendation_success_rate: number | null
        }
        Insert: {
          academy_id: string
          active_member_count?: number
          avg_competition_score?: number | null
          avg_fatigue_risk?: number | null
          avg_movement_score?: number | null
          avg_overall_score?: number | null
          avg_sessions_7d?: number | null
          avg_tactical_score?: number | null
          avg_technical_score?: number | null
          avg_utr_rating?: number | null
          cohort_id: string
          common_priority_categories?: string[] | null
          common_signal_types?: string[] | null
          computed_at?: string
          id?: string
          member_count?: number
          p25_overall_score?: number | null
          p25_utr_rating?: number | null
          p75_overall_score?: number | null
          p75_utr_rating?: number | null
          recommendation_success_rate?: number | null
        }
        Update: {
          academy_id?: string
          active_member_count?: number
          avg_competition_score?: number | null
          avg_fatigue_risk?: number | null
          avg_movement_score?: number | null
          avg_overall_score?: number | null
          avg_sessions_7d?: number | null
          avg_tactical_score?: number | null
          avg_technical_score?: number | null
          avg_utr_rating?: number | null
          cohort_id?: string
          common_priority_categories?: string[] | null
          common_signal_types?: string[] | null
          computed_at?: string
          id?: string
          member_count?: number
          p25_overall_score?: number | null
          p25_utr_rating?: number | null
          p75_overall_score?: number | null
          p75_utr_rating?: number | null
          recommendation_success_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cohort_stats_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_stats_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: true
            referencedRelation: "player_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_stats_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: true
            referencedRelation: "v_cohort_overview"
            referencedColumns: ["cohort_id"]
          },
        ]
      }
      competition_schedule: {
        Row: {
          academy_id: string
          created_at: string
          end_date: string | null
          id: string
          location: string | null
          notes: string | null
          player_id: string
          result: string | null
          start_date: string
          status: string
          surface: string | null
          tournament_name: string
        }
        Insert: {
          academy_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          player_id: string
          result?: string | null
          start_date: string
          status?: string
          surface?: string | null
          tournament_name: string
        }
        Update: {
          academy_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          player_id?: string
          result?: string | null
          start_date?: string
          status?: string
          surface?: string | null
          tournament_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_schedule_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_schedule_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_schedule_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "competition_schedule_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "competition_schedule_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      curriculum_archetypes: {
        Row: {
          created_at: string
          description: string | null
          entry_stage: string | null
          id: string
          name: string
          primary_curriculum_protection: string | null
          tag: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entry_stage?: string | null
          id?: string
          name: string
          primary_curriculum_protection?: string | null
          tag: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entry_stage?: string | null
          id?: string
          name?: string
          primary_curriculum_protection?: string | null
          tag?: string
        }
        Relationships: []
      }
      curriculum_class_template_blocks: {
        Row: {
          assessment_gate_label: string | null
          block_id: string
          coach_watch_for: string | null
          content_item_id: string | null
          created_at: string
          curriculum_level_key: string | null
          drill_id: string | null
          duration_min: number | null
          id: string
          notes: string | null
          order_index: number
          player_mission_label: string | null
          source_snapshot: Json
          template_id: string
          updated_at: string
        }
        Insert: {
          assessment_gate_label?: string | null
          block_id: string
          coach_watch_for?: string | null
          content_item_id?: string | null
          created_at?: string
          curriculum_level_key?: string | null
          drill_id?: string | null
          duration_min?: number | null
          id?: string
          notes?: string | null
          order_index: number
          player_mission_label?: string | null
          source_snapshot?: Json
          template_id: string
          updated_at?: string
        }
        Update: {
          assessment_gate_label?: string | null
          block_id?: string
          coach_watch_for?: string | null
          content_item_id?: string | null
          created_at?: string
          curriculum_level_key?: string | null
          drill_id?: string | null
          duration_min?: number | null
          id?: string
          notes?: string | null
          order_index?: number
          player_mission_label?: string | null
          source_snapshot?: Json
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_class_template_blocks_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "template_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_class_template_blocks_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "curriculum_content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_class_template_blocks_drill_id_fkey"
            columns: ["drill_id"]
            isOneToOne: false
            referencedRelation: "curriculum_drills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_class_template_blocks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_class_template_blocks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "v_session_recommendation_feed"
            referencedColumns: ["suggested_template_id"]
          },
        ]
      }
      curriculum_coach_language: {
        Row: {
          created_at: string
          current_focus: string
          doing_well: string
          domain: string
          id: string
          level_id: string
          next_step: string
          working_on: string
        }
        Insert: {
          created_at?: string
          current_focus: string
          doing_well: string
          domain: string
          id?: string
          level_id: string
          next_step: string
          working_on: string
        }
        Update: {
          created_at?: string
          current_focus?: string
          doing_well?: string
          domain?: string
          id?: string
          level_id?: string
          next_step?: string
          working_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_coach_language_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_coach_language_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
        ]
      }
      curriculum_competition_track: {
        Row: {
          coach_role: string | null
          competition_behaviors: string | null
          created_at: string
          federation_note: string | null
          id: string
          level_id: string
          match_format: string | null
          opponent_pool: string | null
          parent_role: string | null
          point_density: string | null
          scoring_system: string | null
          tournament_cadence: string | null
          transition_signal: string | null
          win_loss_target: string | null
        }
        Insert: {
          coach_role?: string | null
          competition_behaviors?: string | null
          created_at?: string
          federation_note?: string | null
          id?: string
          level_id: string
          match_format?: string | null
          opponent_pool?: string | null
          parent_role?: string | null
          point_density?: string | null
          scoring_system?: string | null
          tournament_cadence?: string | null
          transition_signal?: string | null
          win_loss_target?: string | null
        }
        Update: {
          coach_role?: string | null
          competition_behaviors?: string | null
          created_at?: string
          federation_note?: string | null
          id?: string
          level_id?: string
          match_format?: string | null
          opponent_pool?: string | null
          parent_role?: string | null
          point_density?: string | null
          scoring_system?: string | null
          tournament_cadence?: string | null
          transition_signal?: string | null
          win_loss_target?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_competition_track_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: true
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_competition_track_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: true
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
        ]
      }
      curriculum_content_items: {
        Row: {
          academy_id: string | null
          ball_level: string | null
          coach_cues: string[] | null
          constraints: string[] | null
          content_type: string
          court_setup: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: number | null
          domain: string | null
          duration_max: number | null
          duration_min: number | null
          equipment: string[] | null
          id: string
          intensity: number | null
          is_active: boolean
          is_assessment_moment: boolean
          is_coach_only: boolean
          is_parent_visible: boolean
          is_player_visible: boolean
          level_id: string | null
          parent_safe_description: string | null
          parent_safe_name: string | null
          pathway: string
          player_count_max: number | null
          player_count_min: number | null
          progressions: string[] | null
          regressions: string[] | null
          session_block_hint: string | null
          source_type: string
          success_criteria: string[] | null
          tags: string[] | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          academy_id?: string | null
          ball_level?: string | null
          coach_cues?: string[] | null
          constraints?: string[] | null
          content_type: string
          court_setup?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: number | null
          domain?: string | null
          duration_max?: number | null
          duration_min?: number | null
          equipment?: string[] | null
          id?: string
          intensity?: number | null
          is_active?: boolean
          is_assessment_moment?: boolean
          is_coach_only?: boolean
          is_parent_visible?: boolean
          is_player_visible?: boolean
          level_id?: string | null
          parent_safe_description?: string | null
          parent_safe_name?: string | null
          pathway?: string
          player_count_max?: number | null
          player_count_min?: number | null
          progressions?: string[] | null
          regressions?: string[] | null
          session_block_hint?: string | null
          source_type?: string
          success_criteria?: string[] | null
          tags?: string[] | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          academy_id?: string | null
          ball_level?: string | null
          coach_cues?: string[] | null
          constraints?: string[] | null
          content_type?: string
          court_setup?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: number | null
          domain?: string | null
          duration_max?: number | null
          duration_min?: number | null
          equipment?: string[] | null
          id?: string
          intensity?: number | null
          is_active?: boolean
          is_assessment_moment?: boolean
          is_coach_only?: boolean
          is_parent_visible?: boolean
          is_player_visible?: boolean
          level_id?: string | null
          parent_safe_description?: string | null
          parent_safe_name?: string | null
          pathway?: string
          player_count_max?: number | null
          player_count_min?: number | null
          progressions?: string[] | null
          regressions?: string[] | null
          session_block_hint?: string | null
          source_type?: string
          success_criteria?: string[] | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_content_items_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_content_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_content_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "curriculum_content_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "curriculum_content_items_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_content_items_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
        ]
      }
      curriculum_content_requirement_mappings: {
        Row: {
          content_id: string
          created_at: string
          id: string
          mapping_type: string
          requirement_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          mapping_type?: string
          requirement_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          mapping_type?: string
          requirement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_content_requirement_mappings_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "curriculum_content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_content_requirement_mappings_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "curriculum_track_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_drill_tags: {
        Row: {
          drill_id: string
          id: string
          tag: string
        }
        Insert: {
          drill_id: string
          id?: string
          tag: string
        }
        Update: {
          drill_id?: string
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_drill_tags_drill_id_fkey"
            columns: ["drill_id"]
            isOneToOne: false
            referencedRelation: "curriculum_drills"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_drills: {
        Row: {
          academy_id: string | null
          coaching_cues: Json | null
          created_at: string
          domain: string
          drill_id: string
          duration_minutes: number | null
          id: string
          is_active: boolean
          level_max_id: string | null
          level_min_id: string | null
          name: string
          objective: string
          players_needed: number | null
          procedure: string | null
          progression_easier: string | null
          progression_harder: string | null
          session_block: string
          setup: string | null
          source_type: string
          success_criteria: string | null
          updated_at: string
        }
        Insert: {
          academy_id?: string | null
          coaching_cues?: Json | null
          created_at?: string
          domain: string
          drill_id: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          level_max_id?: string | null
          level_min_id?: string | null
          name: string
          objective: string
          players_needed?: number | null
          procedure?: string | null
          progression_easier?: string | null
          progression_harder?: string | null
          session_block: string
          setup?: string | null
          source_type?: string
          success_criteria?: string | null
          updated_at?: string
        }
        Update: {
          academy_id?: string | null
          coaching_cues?: Json | null
          created_at?: string
          domain?: string
          drill_id?: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          level_max_id?: string | null
          level_min_id?: string | null
          name?: string
          objective?: string
          players_needed?: number | null
          procedure?: string | null
          progression_easier?: string | null
          progression_harder?: string | null
          session_block?: string
          setup?: string | null
          source_type?: string
          success_criteria?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_drills_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_drills_level_max_id_fkey"
            columns: ["level_max_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_drills_level_max_id_fkey"
            columns: ["level_max_id"]
            isOneToOne: false
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "curriculum_drills_level_min_id_fkey"
            columns: ["level_min_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_drills_level_min_id_fkey"
            columns: ["level_min_id"]
            isOneToOne: false
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
        ]
      }
      curriculum_failure_modes: {
        Row: {
          affected_archetype: string | null
          affected_components: string[] | null
          affected_stage: string | null
          created_at: string
          failure_mode_id: string
          id: string
          is_addressed: boolean
          required_response: string
          risk_description: string
          severity: string
        }
        Insert: {
          affected_archetype?: string | null
          affected_components?: string[] | null
          affected_stage?: string | null
          created_at?: string
          failure_mode_id: string
          id?: string
          is_addressed?: boolean
          required_response: string
          risk_description: string
          severity: string
        }
        Update: {
          affected_archetype?: string | null
          affected_components?: string[] | null
          affected_stage?: string | null
          created_at?: string
          failure_mode_id?: string
          id?: string
          is_addressed?: boolean
          required_response?: string
          risk_description?: string
          severity?: string
        }
        Relationships: []
      }
      curriculum_fitness_guidance: {
        Row: {
          coaching_notes: string | null
          created_at: string
          fitness_phase: string
          id: string
          key_fitness_tests: string[] | null
          level_id: string
          off_court_sessions_per_week_max: number | null
          off_court_sessions_per_week_min: number | null
          primary_energy_system: string | null
          strength_band: string | null
        }
        Insert: {
          coaching_notes?: string | null
          created_at?: string
          fitness_phase: string
          id?: string
          key_fitness_tests?: string[] | null
          level_id: string
          off_court_sessions_per_week_max?: number | null
          off_court_sessions_per_week_min?: number | null
          primary_energy_system?: string | null
          strength_band?: string | null
        }
        Update: {
          coaching_notes?: string | null
          created_at?: string
          fitness_phase?: string
          id?: string
          key_fitness_tests?: string[] | null
          level_id?: string
          off_court_sessions_per_week_max?: number | null
          off_court_sessions_per_week_min?: number | null
          primary_energy_system?: string | null
          strength_band?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_fitness_guidance_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: true
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_fitness_guidance_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: true
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
        ]
      }
      curriculum_gates: {
        Row: {
          cadence: string
          created_at: string
          criterion: string
          domain: string
          evaluator: string
          evidence_window: string
          from_level_id: string
          gate_id: string
          gate_type: string
          id: string
          is_active: boolean
          notes: string | null
          recording_method: string
          sort_order: number
          threshold: string
          to_level_id: string | null
        }
        Insert: {
          cadence: string
          created_at?: string
          criterion: string
          domain: string
          evaluator: string
          evidence_window: string
          from_level_id: string
          gate_id: string
          gate_type: string
          id?: string
          is_active?: boolean
          notes?: string | null
          recording_method: string
          sort_order?: number
          threshold: string
          to_level_id?: string | null
        }
        Update: {
          cadence?: string
          created_at?: string
          criterion?: string
          domain?: string
          evaluator?: string
          evidence_window?: string
          from_level_id?: string
          gate_id?: string
          gate_type?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          recording_method?: string
          sort_order?: number
          threshold?: string
          to_level_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_gates_from_level_id_fkey"
            columns: ["from_level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_gates_from_level_id_fkey"
            columns: ["from_level_id"]
            isOneToOne: false
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "curriculum_gates_to_level_id_fkey"
            columns: ["to_level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_gates_to_level_id_fkey"
            columns: ["to_level_id"]
            isOneToOne: false
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
        ]
      }
      curriculum_levels: {
        Row: {
          advance_min_assessment_score: number | null
          advance_min_domains_complete: number
          advance_min_outcomes: number
          created_at: string | null
          display_name: string
          id: string
          is_assessment_required: boolean
          level_number: number
          min_assessment_score: number | null
          min_utr: number | null
          sort_order: number
          stage: Database["public"]["Enums"]["curriculum_stage"]
        }
        Insert: {
          advance_min_assessment_score?: number | null
          advance_min_domains_complete?: number
          advance_min_outcomes?: number
          created_at?: string | null
          display_name: string
          id?: string
          is_assessment_required?: boolean
          level_number: number
          min_assessment_score?: number | null
          min_utr?: number | null
          sort_order: number
          stage: Database["public"]["Enums"]["curriculum_stage"]
        }
        Update: {
          advance_min_assessment_score?: number | null
          advance_min_domains_complete?: number
          advance_min_outcomes?: number
          created_at?: string | null
          display_name?: string
          id?: string
          is_assessment_required?: boolean
          level_number?: number
          min_assessment_score?: number | null
          min_utr?: number | null
          sort_order?: number
          stage?: Database["public"]["Enums"]["curriculum_stage"]
        }
        Relationships: []
      }
      curriculum_requirement_domains: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          key: string
          label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      curriculum_stages: {
        Row: {
          age_range_max: number | null
          age_range_min: number | null
          color_hex: string
          created_at: string | null
          display_name: string
          id: string
          sort_order: number
          stage: Database["public"]["Enums"]["curriculum_stage"]
          stage_goal: string
          utr_range_max: number | null
          utr_range_min: number | null
        }
        Insert: {
          age_range_max?: number | null
          age_range_min?: number | null
          color_hex: string
          created_at?: string | null
          display_name: string
          id?: string
          sort_order: number
          stage: Database["public"]["Enums"]["curriculum_stage"]
          stage_goal: string
          utr_range_max?: number | null
          utr_range_min?: number | null
        }
        Update: {
          age_range_max?: number | null
          age_range_min?: number | null
          color_hex?: string
          created_at?: string | null
          display_name?: string
          id?: string
          sort_order?: number
          stage?: Database["public"]["Enums"]["curriculum_stage"]
          stage_goal?: string
          utr_range_max?: number | null
          utr_range_min?: number | null
        }
        Relationships: []
      }
      curriculum_track_requirements: {
        Row: {
          academy_id: string | null
          created_at: string
          curriculum_level_id: string
          description: string | null
          display_order: number
          evidence_policy: string
          id: string
          is_active: boolean
          is_parent_visible_default: boolean
          is_player_visible_default: boolean
          is_required: boolean
          measurement_method: string | null
          pass_condition: string | null
          requirement_domain_id: string
          requirement_type: string
          source_id: string | null
          source_type: string
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string
          version: number
        }
        Insert: {
          academy_id?: string | null
          created_at?: string
          curriculum_level_id: string
          description?: string | null
          display_order?: number
          evidence_policy?: string
          id?: string
          is_active?: boolean
          is_parent_visible_default?: boolean
          is_player_visible_default?: boolean
          is_required?: boolean
          measurement_method?: string | null
          pass_condition?: string | null
          requirement_domain_id: string
          requirement_type?: string
          source_id?: string | null
          source_type?: string
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          academy_id?: string | null
          created_at?: string
          curriculum_level_id?: string
          description?: string | null
          display_order?: number
          evidence_policy?: string
          id?: string
          is_active?: boolean
          is_parent_visible_default?: boolean
          is_player_visible_default?: boolean
          is_required?: boolean
          measurement_method?: string | null
          pass_condition?: string | null
          requirement_domain_id?: string
          requirement_type?: string
          source_id?: string | null
          source_type?: string
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_track_requirements_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_track_requirements_curriculum_level_id_fkey"
            columns: ["curriculum_level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_track_requirements_curriculum_level_id_fkey"
            columns: ["curriculum_level_id"]
            isOneToOne: false
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "curriculum_track_requirements_requirement_domain_id_fkey"
            columns: ["requirement_domain_id"]
            isOneToOne: false
            referencedRelation: "curriculum_requirement_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_volume_guidance: {
        Row: {
          acr_target_range: string | null
          created_at: string
          deload_cadence: string | null
          id: string
          level_id: string
          overload_flags: string[] | null
          reassessment_cadence_weeks: number | null
          session_duration_max_minutes: number | null
          session_duration_min_minutes: number | null
          sessions_per_week_max: number | null
          sessions_per_week_min: number | null
          typical_stage_months_max: number | null
          typical_stage_months_min: number | null
          weekly_hours_max: number | null
          weekly_hours_min: number | null
        }
        Insert: {
          acr_target_range?: string | null
          created_at?: string
          deload_cadence?: string | null
          id?: string
          level_id: string
          overload_flags?: string[] | null
          reassessment_cadence_weeks?: number | null
          session_duration_max_minutes?: number | null
          session_duration_min_minutes?: number | null
          sessions_per_week_max?: number | null
          sessions_per_week_min?: number | null
          typical_stage_months_max?: number | null
          typical_stage_months_min?: number | null
          weekly_hours_max?: number | null
          weekly_hours_min?: number | null
        }
        Update: {
          acr_target_range?: string | null
          created_at?: string
          deload_cadence?: string | null
          id?: string
          level_id?: string
          overload_flags?: string[] | null
          reassessment_cadence_weeks?: number | null
          session_duration_max_minutes?: number | null
          session_duration_min_minutes?: number | null
          sessions_per_week_max?: number | null
          sessions_per_week_min?: number | null
          typical_stage_months_max?: number | null
          typical_stage_months_min?: number | null
          weekly_hours_max?: number | null
          weekly_hours_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_volume_guidance_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: true
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_volume_guidance_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: true
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
        ]
      }
      database_changelog: {
        Row: {
          applied_at: string
          applied_by: string
          description: string | null
          id: string
          migration: string
        }
        Insert: {
          applied_at?: string
          applied_by?: string
          description?: string | null
          id?: string
          migration: string
        }
        Update: {
          applied_at?: string
          applied_by?: string
          description?: string | null
          id?: string
          migration?: string
        }
        Relationships: []
      }
      decision_learning_logs: {
        Row: {
          academy_id: string
          accepted_count: number | null
          active_signal_count: number | null
          active_signal_ids: string[] | null
          composite_score: number | null
          created_at: string
          cycle_date: string
          decision_score_id: string | null
          evaluate_after_date: string | null
          high_severity_count: number | null
          id: string
          outcome_evaluated: boolean
          outcome_evaluated_at: string | null
          outcome_snapshot_id: string | null
          overridden_count: number | null
          phase_at_cycle: Database["public"]["Enums"]["player_phase"] | null
          player_id: string
          recommendation_count: number | null
          recommendation_ids: string[] | null
          rejected_count: number | null
          score_30d_after: number | null
          score_at_cycle: number | null
          score_delta_30d: number | null
          urgency: string | null
        }
        Insert: {
          academy_id: string
          accepted_count?: number | null
          active_signal_count?: number | null
          active_signal_ids?: string[] | null
          composite_score?: number | null
          created_at?: string
          cycle_date?: string
          decision_score_id?: string | null
          evaluate_after_date?: string | null
          high_severity_count?: number | null
          id?: string
          outcome_evaluated?: boolean
          outcome_evaluated_at?: string | null
          outcome_snapshot_id?: string | null
          overridden_count?: number | null
          phase_at_cycle?: Database["public"]["Enums"]["player_phase"] | null
          player_id: string
          recommendation_count?: number | null
          recommendation_ids?: string[] | null
          rejected_count?: number | null
          score_30d_after?: number | null
          score_at_cycle?: number | null
          score_delta_30d?: number | null
          urgency?: string | null
        }
        Update: {
          academy_id?: string
          accepted_count?: number | null
          active_signal_count?: number | null
          active_signal_ids?: string[] | null
          composite_score?: number | null
          created_at?: string
          cycle_date?: string
          decision_score_id?: string | null
          evaluate_after_date?: string | null
          high_severity_count?: number | null
          id?: string
          outcome_evaluated?: boolean
          outcome_evaluated_at?: string | null
          outcome_snapshot_id?: string | null
          overridden_count?: number | null
          phase_at_cycle?: Database["public"]["Enums"]["player_phase"] | null
          player_id?: string
          recommendation_count?: number | null
          recommendation_ids?: string[] | null
          rejected_count?: number | null
          score_30d_after?: number | null
          score_at_cycle?: number | null
          score_delta_30d?: number | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_learning_logs_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_learning_logs_decision_score_id_fkey"
            columns: ["decision_score_id"]
            isOneToOne: false
            referencedRelation: "decision_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_learning_logs_outcome_snapshot_id_fkey"
            columns: ["outcome_snapshot_id"]
            isOneToOne: false
            referencedRelation: "player_progress_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_learning_logs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_learning_logs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "decision_learning_logs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "decision_learning_logs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      decision_scores: {
        Row: {
          academy_id: string
          behavioral_domain_score: number | null
          competition_domain_score: number | null
          composite_score: number
          constraint_notes: string[] | null
          contributing_signal_ids: string[]
          fitness_domain_score: number | null
          high_severity_count: number
          id: string
          is_constrained: boolean
          phase_at_score: Database["public"]["Enums"]["player_phase"]
          player_id: string
          primary_action: string | null
          scored_at: string
          secondary_action: string | null
          signal_count: number
          signals_hash: string | null
          skill_domain_score: number | null
          urgency: string
        }
        Insert: {
          academy_id: string
          behavioral_domain_score?: number | null
          competition_domain_score?: number | null
          composite_score?: number
          constraint_notes?: string[] | null
          contributing_signal_ids?: string[]
          fitness_domain_score?: number | null
          high_severity_count?: number
          id?: string
          is_constrained?: boolean
          phase_at_score?: Database["public"]["Enums"]["player_phase"]
          player_id: string
          primary_action?: string | null
          scored_at?: string
          secondary_action?: string | null
          signal_count?: number
          signals_hash?: string | null
          skill_domain_score?: number | null
          urgency?: string
        }
        Update: {
          academy_id?: string
          behavioral_domain_score?: number | null
          competition_domain_score?: number | null
          composite_score?: number
          constraint_notes?: string[] | null
          contributing_signal_ids?: string[]
          fitness_domain_score?: number | null
          high_severity_count?: number
          id?: string
          is_constrained?: boolean
          phase_at_score?: Database["public"]["Enums"]["player_phase"]
          player_id?: string
          primary_action?: string | null
          scored_at?: string
          secondary_action?: string | null
          signal_count?: number
          signals_hash?: string | null
          skill_domain_score?: number | null
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_scores_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_scores_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_scores_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "decision_scores_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "decision_scores_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      director_configurations: {
        Row: {
          academy_id: string
          configuration_snapshot: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          last_applied_at: string | null
          last_applied_by: string | null
          name: string
          updated_at: string
        }
        Insert: {
          academy_id: string
          configuration_snapshot?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_applied_at?: string | null
          last_applied_by?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          academy_id?: string
          configuration_snapshot?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_applied_at?: string | null
          last_applied_by?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "director_configurations_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "director_configurations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "director_configurations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "director_configurations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "director_configurations_last_applied_by_fkey"
            columns: ["last_applied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "director_configurations_last_applied_by_fkey"
            columns: ["last_applied_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "director_configurations_last_applied_by_fkey"
            columns: ["last_applied_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      drill_gate_mappings: {
        Row: {
          created_at: string
          drill_id: string
          gate_id: string
          id: string
          mapping_type: string
        }
        Insert: {
          created_at?: string
          drill_id: string
          gate_id: string
          id?: string
          mapping_type?: string
        }
        Update: {
          created_at?: string
          drill_id?: string
          gate_id?: string
          id?: string
          mapping_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "drill_gate_mappings_drill_id_fkey"
            columns: ["drill_id"]
            isOneToOne: false
            referencedRelation: "curriculum_drills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drill_gate_mappings_gate_id_fkey"
            columns: ["gate_id"]
            isOneToOne: false
            referencedRelation: "curriculum_gates"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_effectiveness_scores: {
        Row: {
          academy_id: string
          avg_engagement: number | null
          avg_perf_rating: number | null
          computed_at: string
          effectiveness_score: number
          exercise_id: string
          expected_improvement: number | null
          id: string
          plan_achieved_rate: number | null
          session_count: number
        }
        Insert: {
          academy_id: string
          avg_engagement?: number | null
          avg_perf_rating?: number | null
          computed_at?: string
          effectiveness_score?: number
          exercise_id: string
          expected_improvement?: number | null
          id?: string
          plan_achieved_rate?: number | null
          session_count?: number
        }
        Update: {
          academy_id?: string
          avg_engagement?: number | null
          avg_perf_rating?: number | null
          computed_at?: string
          effectiveness_score?: number
          exercise_id?: string
          expected_improvement?: number | null
          id?: string
          plan_achieved_rate?: number | null
          session_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercise_effectiveness_scores_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_effectiveness_scores_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_outcome_improvements: {
        Row: {
          academy_id: string
          dimension: string
          exercise_id: string
          expected_delta: number | null
          id: string
          min_sessions: number | null
          required_transfer_level: string | null
          sub_skill: string | null
        }
        Insert: {
          academy_id: string
          dimension: string
          exercise_id: string
          expected_delta?: number | null
          id?: string
          min_sessions?: number | null
          required_transfer_level?: string | null
          sub_skill?: string | null
        }
        Update: {
          academy_id?: string
          dimension?: string
          exercise_id?: string
          expected_delta?: number | null
          id?: string
          min_sessions?: number | null
          required_transfer_level?: string | null
          sub_skill?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_outcome_improvements_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_outcome_improvements_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_signal_mappings: {
        Row: {
          academy_id: string
          exercise_id: string
          id: string
          mechanism: string | null
          relevance_score: number
          signal_type: Database["public"]["Enums"]["signal_type"]
        }
        Insert: {
          academy_id: string
          exercise_id: string
          id?: string
          mechanism?: string | null
          relevance_score?: number
          signal_type: Database["public"]["Enums"]["signal_type"]
        }
        Update: {
          academy_id?: string
          exercise_id?: string
          id?: string
          mechanism?: string | null
          relevance_score?: number
          signal_type?: Database["public"]["Enums"]["signal_type"]
        }
        Relationships: [
          {
            foreignKeyName: "exercise_signal_mappings_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_signal_mappings_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          academy_id: string
          category: Database["public"]["Enums"]["exercise_category"]
          coaching_points: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_min: number | null
          equipment: string[] | null
          id: string
          instructions: string | null
          is_active: boolean
          level_range: Json | null
          load_type: string
          max_duration_min: number | null
          min_duration_min: number | null
          movement_pattern: string | null
          name: string
          skill_phase: string | null
          subcategory: string | null
          tags: string[] | null
          track: Database["public"]["Enums"]["development_track"] | null
          transfer_level: string
          typical_rpe: number | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          academy_id: string
          category: Database["public"]["Enums"]["exercise_category"]
          coaching_points?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_min?: number | null
          equipment?: string[] | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          level_range?: Json | null
          load_type?: string
          max_duration_min?: number | null
          min_duration_min?: number | null
          movement_pattern?: string | null
          name: string
          skill_phase?: string | null
          subcategory?: string | null
          tags?: string[] | null
          track?: Database["public"]["Enums"]["development_track"] | null
          transfer_level?: string
          typical_rpe?: number | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          academy_id?: string
          category?: Database["public"]["Enums"]["exercise_category"]
          coaching_points?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_min?: number | null
          equipment?: string[] | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          level_range?: Json | null
          load_type?: string
          max_duration_min?: number | null
          min_duration_min?: number | null
          movement_pattern?: string | null
          name?: string
          skill_phase?: string | null
          subcategory?: string | null
          tags?: string[] | null
          track?: Database["public"]["Enums"]["development_track"] | null
          transfer_level?: string
          typical_rpe?: number | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "exercises_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      flywheel_insights: {
        Row: {
          academy_id: string
          actioned_at: string | null
          body: string
          data: Json
          generated_at: string
          id: string
          insight_type: string
          is_actioned: boolean
          severity: string
          title: string
        }
        Insert: {
          academy_id: string
          actioned_at?: string | null
          body: string
          data?: Json
          generated_at?: string
          id?: string
          insight_type: string
          is_actioned?: boolean
          severity?: string
          title: string
        }
        Update: {
          academy_id?: string
          actioned_at?: string | null
          body?: string
          data?: Json
          generated_at?: string
          id?: string
          insight_type?: string
          is_actioned?: boolean
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "flywheel_insights_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      group_memberships: {
        Row: {
          academy_id: string
          group_id: string
          id: string
          is_current: boolean
          joined_at: string
          left_at: string | null
          moved_by: string | null
          player_id: string
          reason: string | null
        }
        Insert: {
          academy_id: string
          group_id: string
          id?: string
          is_current?: boolean
          joined_at?: string
          left_at?: string | null
          moved_by?: string | null
          player_id: string
          reason?: string | null
        }
        Update: {
          academy_id?: string
          group_id?: string
          id?: string
          is_current?: boolean
          joined_at?: string
          left_at?: string | null
          moved_by?: string | null
          player_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_memberships_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "group_memberships_moved_by_fkey"
            columns: ["moved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_memberships_moved_by_fkey"
            columns: ["moved_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "group_memberships_moved_by_fkey"
            columns: ["moved_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "group_memberships_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_memberships_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "group_memberships_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "group_memberships_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      groups: {
        Row: {
          academy_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          level_id: string | null
          max_age: number | null
          max_players: number | null
          min_age: number | null
          name: string
          track: Database["public"]["Enums"]["development_track"] | null
          updated_at: string
        }
        Insert: {
          academy_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          level_id?: string | null
          max_age?: number | null
          max_players?: number | null
          min_age?: number | null
          name: string
          track?: Database["public"]["Enums"]["development_track"] | null
          updated_at?: string
        }
        Update: {
          academy_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          level_id?: string | null
          max_age?: number | null
          max_players?: number | null
          min_age?: number | null
          name?: string
          track?: Database["public"]["Enums"]["development_track"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "academy_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          academy_id: string
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_primary: boolean
          last_name: string
          phone: string | null
          profile_id: string | null
          relationship: string
          updated_at: string
        }
        Insert: {
          academy_id: string
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          is_primary?: boolean
          last_name: string
          phone?: string | null
          profile_id?: string | null
          relationship?: string
          updated_at?: string
        }
        Update: {
          academy_id?: string
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_primary?: boolean
          last_name?: string
          phone?: string | null
          profile_id?: string | null
          relationship?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardians_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardians_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardians_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "guardians_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      model_evaluation_runs: {
        Row: {
          academy_id: string
          approval_rate: number | null
          approved_count: number
          avg_prediction_error: number | null
          avg_score_delta_30d: number | null
          evaluated_at: string
          evaluation_period_end: string
          evaluation_period_start: string
          expired_count: number
          id: string
          inconclusive_count: number
          model_version_id: string | null
          negative_outcome_count: number
          overridden_count: number
          override_rate: number | null
          performance_grade: string | null
          performance_score: number | null
          positive_outcome_count: number
          positive_outcome_rate: number | null
          total_recommendations: number
        }
        Insert: {
          academy_id: string
          approval_rate?: number | null
          approved_count?: number
          avg_prediction_error?: number | null
          avg_score_delta_30d?: number | null
          evaluated_at?: string
          evaluation_period_end: string
          evaluation_period_start: string
          expired_count?: number
          id?: string
          inconclusive_count?: number
          model_version_id?: string | null
          negative_outcome_count?: number
          overridden_count?: number
          override_rate?: number | null
          performance_grade?: string | null
          performance_score?: number | null
          positive_outcome_count?: number
          positive_outcome_rate?: number | null
          total_recommendations?: number
        }
        Update: {
          academy_id?: string
          approval_rate?: number | null
          approved_count?: number
          avg_prediction_error?: number | null
          avg_score_delta_30d?: number | null
          evaluated_at?: string
          evaluation_period_end?: string
          evaluation_period_start?: string
          expired_count?: number
          id?: string
          inconclusive_count?: number
          model_version_id?: string | null
          negative_outcome_count?: number
          overridden_count?: number
          override_rate?: number | null
          performance_grade?: string | null
          performance_score?: number | null
          positive_outcome_count?: number
          positive_outcome_rate?: number | null
          total_recommendations?: number
        }
        Relationships: [
          {
            foreignKeyName: "model_evaluation_runs_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_evaluation_runs_model_version_id_fkey"
            columns: ["model_version_id"]
            isOneToOne: false
            referencedRelation: "model_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      model_versions: {
        Row: {
          academy_id: string
          activated_at: string | null
          approval_rate: number | null
          created_at: string
          deactivated_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          override_rate: number | null
          parameter_snapshot: Json
          performance_grade: string | null
          performance_score: number | null
          positive_outcome_rate: number | null
          promoted_by: string | null
          version_number: number
        }
        Insert: {
          academy_id: string
          activated_at?: string | null
          approval_rate?: number | null
          created_at?: string
          deactivated_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          override_rate?: number | null
          parameter_snapshot?: Json
          performance_grade?: string | null
          performance_score?: number | null
          positive_outcome_rate?: number | null
          promoted_by?: string | null
          version_number: number
        }
        Update: {
          academy_id?: string
          activated_at?: string | null
          approval_rate?: number | null
          created_at?: string
          deactivated_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          override_rate?: number | null
          parameter_snapshot?: Json
          performance_grade?: string | null
          performance_score?: number | null
          positive_outcome_rate?: number | null
          promoted_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "model_versions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_versions_promoted_by_fkey"
            columns: ["promoted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_versions_promoted_by_fkey"
            columns: ["promoted_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "model_versions_promoted_by_fkey"
            columns: ["promoted_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      object_snapshots: {
        Row: {
          academy_id: string
          created_at: string
          id: string
          object_id: string
          object_label: string | null
          object_type: string
          snapshot: Json
          taken_by: string | null
          taken_reason: string | null
        }
        Insert: {
          academy_id: string
          created_at?: string
          id?: string
          object_id: string
          object_label?: string | null
          object_type: string
          snapshot: Json
          taken_by?: string | null
          taken_reason?: string | null
        }
        Update: {
          academy_id?: string
          created_at?: string
          id?: string
          object_id?: string
          object_label?: string | null
          object_type?: string
          snapshot?: Json
          taken_by?: string | null
          taken_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "object_snapshots_taken_by_fkey"
            columns: ["taken_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_snapshots_taken_by_fkey"
            columns: ["taken_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "object_snapshots_taken_by_fkey"
            columns: ["taken_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      parent_level_descriptions: {
        Row: {
          created_at: string | null
          how_you_can_help: string
          id: string
          level_id: string
          typical_session_structure: string
          what_success_looks_like: string
          what_we_focus_on: string
        }
        Insert: {
          created_at?: string | null
          how_you_can_help: string
          id?: string
          level_id: string
          typical_session_structure: string
          what_success_looks_like: string
          what_we_focus_on: string
        }
        Update: {
          created_at?: string | null
          how_you_can_help?: string
          id?: string
          level_id?: string
          typical_session_structure?: string
          what_success_looks_like?: string
          what_we_focus_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_level_descriptions_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: true
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_level_descriptions_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: true
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
        ]
      }
      parent_updates: {
        Row: {
          academy_id: string
          approved_at: string | null
          approved_by: string | null
          author_id: string
          content: string
          content_draft: string | null
          created_at: string
          id: string
          player_id: string
          send_method: string | null
          sent_at: string | null
          sent_to: string[] | null
          source_observation_ids: string[] | null
          status: Database["public"]["Enums"]["parent_update_status"]
          subject: string | null
          updated_at: string
          voice_command_id: string | null
        }
        Insert: {
          academy_id: string
          approved_at?: string | null
          approved_by?: string | null
          author_id: string
          content: string
          content_draft?: string | null
          created_at?: string
          id?: string
          player_id: string
          send_method?: string | null
          sent_at?: string | null
          sent_to?: string[] | null
          source_observation_ids?: string[] | null
          status?: Database["public"]["Enums"]["parent_update_status"]
          subject?: string | null
          updated_at?: string
          voice_command_id?: string | null
        }
        Update: {
          academy_id?: string
          approved_at?: string | null
          approved_by?: string | null
          author_id?: string
          content?: string
          content_draft?: string | null
          created_at?: string
          id?: string
          player_id?: string
          send_method?: string | null
          sent_at?: string | null
          sent_to?: string[] | null
          source_observation_ids?: string[] | null
          status?: Database["public"]["Enums"]["parent_update_status"]
          subject?: string | null
          updated_at?: string
          voice_command_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_updates_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_updates_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_updates_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "parent_updates_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "parent_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "parent_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "parent_updates_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_updates_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "parent_updates_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "parent_updates_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      phase_load_defaults: {
        Row: {
          competition_ok: boolean
          description: string | null
          high_intensity_pct_max: number | null
          max_intensity: number
          max_sessions_per_week: number
          phase: Database["public"]["Enums"]["player_phase"]
        }
        Insert: {
          competition_ok: boolean
          description?: string | null
          high_intensity_pct_max?: number | null
          max_intensity: number
          max_sessions_per_week: number
          phase: Database["public"]["Enums"]["player_phase"]
        }
        Update: {
          competition_ok?: boolean
          description?: string | null
          high_intensity_pct_max?: number | null
          max_intensity?: number
          max_sessions_per_week?: number
          phase?: Database["public"]["Enums"]["player_phase"]
        }
        Relationships: []
      }
      placement_recommendations: {
        Row: {
          academy_id: string
          activated_at: string | null
          activated_by: string | null
          approved_at: string | null
          approved_by: string | null
          assessment_id: string | null
          confidence_score: number | null
          created_at: string
          created_by: string | null
          id: string
          overridden_at: string | null
          overridden_by: string | null
          override_group_id: string | null
          override_level_id: string | null
          override_reason: string | null
          override_track:
            | Database["public"]["Enums"]["development_track"]
            | null
          player_id: string
          recommendation_rationale: string | null
          recommendation_strengths: string[] | null
          recommendation_weaknesses: string[] | null
          recommended_group_id: string | null
          recommended_level_id: string | null
          recommended_priorities: string[] | null
          recommended_reassessment_weeks: number | null
          recommended_track:
            | Database["public"]["Enums"]["development_track"]
            | null
          status: Database["public"]["Enums"]["placement_status"]
          updated_at: string
          voice_command_id: string | null
        }
        Insert: {
          academy_id: string
          activated_at?: string | null
          activated_by?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assessment_id?: string | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          overridden_at?: string | null
          overridden_by?: string | null
          override_group_id?: string | null
          override_level_id?: string | null
          override_reason?: string | null
          override_track?:
            | Database["public"]["Enums"]["development_track"]
            | null
          player_id: string
          recommendation_rationale?: string | null
          recommendation_strengths?: string[] | null
          recommendation_weaknesses?: string[] | null
          recommended_group_id?: string | null
          recommended_level_id?: string | null
          recommended_priorities?: string[] | null
          recommended_reassessment_weeks?: number | null
          recommended_track?:
            | Database["public"]["Enums"]["development_track"]
            | null
          status?: Database["public"]["Enums"]["placement_status"]
          updated_at?: string
          voice_command_id?: string | null
        }
        Update: {
          academy_id?: string
          activated_at?: string | null
          activated_by?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assessment_id?: string | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          overridden_at?: string | null
          overridden_by?: string | null
          override_group_id?: string | null
          override_level_id?: string | null
          override_reason?: string | null
          override_track?:
            | Database["public"]["Enums"]["development_track"]
            | null
          player_id?: string
          recommendation_rationale?: string | null
          recommendation_strengths?: string[] | null
          recommendation_weaknesses?: string[] | null
          recommended_group_id?: string | null
          recommended_level_id?: string | null
          recommended_priorities?: string[] | null
          recommended_reassessment_weeks?: number | null
          recommended_track?:
            | Database["public"]["Enums"]["development_track"]
            | null
          status?: Database["public"]["Enums"]["placement_status"]
          updated_at?: string
          voice_command_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "placement_recommendations_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_recommendations_activated_by_fkey"
            columns: ["activated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_recommendations_activated_by_fkey"
            columns: ["activated_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "placement_recommendations_activated_by_fkey"
            columns: ["activated_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "placement_recommendations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_recommendations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "placement_recommendations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "placement_recommendations_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_recommendations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_recommendations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "placement_recommendations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "placement_recommendations_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_recommendations_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "placement_recommendations_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "placement_recommendations_override_group_id_fkey"
            columns: ["override_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_recommendations_override_group_id_fkey"
            columns: ["override_group_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "placement_recommendations_override_group_id_fkey"
            columns: ["override_group_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "placement_recommendations_override_level_id_fkey"
            columns: ["override_level_id"]
            isOneToOne: false
            referencedRelation: "academy_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "placement_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "placement_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "placement_recommendations_recommended_group_id_fkey"
            columns: ["recommended_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_recommendations_recommended_group_id_fkey"
            columns: ["recommended_group_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "placement_recommendations_recommended_group_id_fkey"
            columns: ["recommended_group_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "placement_recommendations_recommended_level_id_fkey"
            columns: ["recommended_level_id"]
            isOneToOne: false
            referencedRelation: "academy_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      player_behavior_profiles: {
        Row: {
          academy_id: string
          calibration_count: number
          coach_observations: string | null
          competition_modifier: number
          competition_response: string
          created_at: string
          fatigue_sensitivity: number
          id: string
          last_calibrated_at: string | null
          learning_preference: string
          load_adjustment_factor: number
          player_id: string
          pressure_tolerance: number
          recovery_rate: string
          updated_at: string
          volume_response: string
        }
        Insert: {
          academy_id: string
          calibration_count?: number
          coach_observations?: string | null
          competition_modifier?: number
          competition_response?: string
          created_at?: string
          fatigue_sensitivity?: number
          id?: string
          last_calibrated_at?: string | null
          learning_preference?: string
          load_adjustment_factor?: number
          player_id: string
          pressure_tolerance?: number
          recovery_rate?: string
          updated_at?: string
          volume_response?: string
        }
        Update: {
          academy_id?: string
          calibration_count?: number
          coach_observations?: string | null
          competition_modifier?: number
          competition_response?: string
          created_at?: string
          fatigue_sensitivity?: number
          id?: string
          last_calibrated_at?: string | null
          learning_preference?: string
          load_adjustment_factor?: number
          player_id?: string
          pressure_tolerance?: number
          recovery_rate?: string
          updated_at?: string
          volume_response?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_behavior_profiles_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_behavior_profiles_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_behavior_profiles_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_behavior_profiles_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_behavior_profiles_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      player_benchmark_results: {
        Row: {
          academy_id: string
          benchmark_id: string
          computed_at: string
          expected_score_max: number | null
          expected_score_min: number | null
          expected_utr_max: number | null
          expected_utr_min: number | null
          id: string
          player_id: string
          player_overall_score: number | null
          player_utr_rating: number | null
          score_gap: number | null
          signal_emitted: boolean
          signal_id: string | null
          utr_gap: number | null
          verdict: string
        }
        Insert: {
          academy_id: string
          benchmark_id: string
          computed_at?: string
          expected_score_max?: number | null
          expected_score_min?: number | null
          expected_utr_max?: number | null
          expected_utr_min?: number | null
          id?: string
          player_id: string
          player_overall_score?: number | null
          player_utr_rating?: number | null
          score_gap?: number | null
          signal_emitted?: boolean
          signal_id?: string | null
          utr_gap?: number | null
          verdict?: string
        }
        Update: {
          academy_id?: string
          benchmark_id?: string
          computed_at?: string
          expected_score_max?: number | null
          expected_score_min?: number | null
          expected_utr_max?: number | null
          expected_utr_min?: number | null
          id?: string
          player_id?: string
          player_overall_score?: number | null
          player_utr_rating?: number | null
          score_gap?: number | null
          signal_emitted?: boolean
          signal_id?: string | null
          utr_gap?: number | null
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_benchmark_results_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_benchmark_results_benchmark_id_fkey"
            columns: ["benchmark_id"]
            isOneToOne: false
            referencedRelation: "benchmark_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_benchmark_results_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_benchmark_results_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_benchmark_results_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_benchmark_results_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_benchmark_results_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "player_development_signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_benchmark_results_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "v_player_signal_dashboard"
            referencedColumns: ["signal_id"]
          },
        ]
      }
      player_cohorts: {
        Row: {
          academy_id: string
          cohort_type: Database["public"]["Enums"]["cohort_type"]
          created_at: string
          criteria: Json
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          academy_id: string
          cohort_type: Database["public"]["Enums"]["cohort_type"]
          created_at?: string
          criteria?: Json
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          academy_id?: string
          cohort_type?: Database["public"]["Enums"]["cohort_type"]
          created_at?: string
          criteria?: Json
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_cohorts_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      player_constraints: {
        Row: {
          academy_id: string
          actual_end_date: string | null
          clearance_notes: string | null
          cleared_at: string | null
          cleared_by: string | null
          constraint_type: Database["public"]["Enums"]["constraint_type"]
          created_at: string
          description: string | null
          expected_end_date: string | null
          id: string
          is_active: boolean
          max_intensity: number | null
          max_sessions_per_week: number | null
          player_id: string
          set_by: string | null
          severity: string
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          academy_id: string
          actual_end_date?: string | null
          clearance_notes?: string | null
          cleared_at?: string | null
          cleared_by?: string | null
          constraint_type: Database["public"]["Enums"]["constraint_type"]
          created_at?: string
          description?: string | null
          expected_end_date?: string | null
          id?: string
          is_active?: boolean
          max_intensity?: number | null
          max_sessions_per_week?: number | null
          player_id: string
          set_by?: string | null
          severity?: string
          start_date?: string
          title: string
          updated_at?: string
        }
        Update: {
          academy_id?: string
          actual_end_date?: string | null
          clearance_notes?: string | null
          cleared_at?: string | null
          cleared_by?: string | null
          constraint_type?: Database["public"]["Enums"]["constraint_type"]
          created_at?: string
          description?: string | null
          expected_end_date?: string | null
          id?: string
          is_active?: boolean
          max_intensity?: number | null
          max_sessions_per_week?: number | null
          player_id?: string
          set_by?: string | null
          severity?: string
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_constraints_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_constraints_cleared_by_fkey"
            columns: ["cleared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_constraints_cleared_by_fkey"
            columns: ["cleared_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "player_constraints_cleared_by_fkey"
            columns: ["cleared_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "player_constraints_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_constraints_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_constraints_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_constraints_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_constraints_set_by_fkey"
            columns: ["set_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_constraints_set_by_fkey"
            columns: ["set_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "player_constraints_set_by_fkey"
            columns: ["set_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      player_curriculum_history: {
        Row: {
          academy_id: string
          advanced_at: string
          advanced_by: string
          assessment_score_at_time: number | null
          domains_mastered_at_time: number | null
          from_level_id: string | null
          id: string
          notes: string | null
          outcomes_at_time: number | null
          player_id: string
          to_level_id: string
        }
        Insert: {
          academy_id: string
          advanced_at?: string
          advanced_by: string
          assessment_score_at_time?: number | null
          domains_mastered_at_time?: number | null
          from_level_id?: string | null
          id?: string
          notes?: string | null
          outcomes_at_time?: number | null
          player_id: string
          to_level_id: string
        }
        Update: {
          academy_id?: string
          advanced_at?: string
          advanced_by?: string
          assessment_score_at_time?: number | null
          domains_mastered_at_time?: number | null
          from_level_id?: string | null
          id?: string
          notes?: string | null
          outcomes_at_time?: number | null
          player_id?: string
          to_level_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_curriculum_history_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_curriculum_history_advanced_by_fkey"
            columns: ["advanced_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_curriculum_history_advanced_by_fkey"
            columns: ["advanced_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "player_curriculum_history_advanced_by_fkey"
            columns: ["advanced_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "player_curriculum_history_from_level_id_fkey"
            columns: ["from_level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_curriculum_history_from_level_id_fkey"
            columns: ["from_level_id"]
            isOneToOne: false
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "player_curriculum_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_curriculum_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_curriculum_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_curriculum_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_curriculum_history_to_level_id_fkey"
            columns: ["to_level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_curriculum_history_to_level_id_fkey"
            columns: ["to_level_id"]
            isOneToOne: false
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
        ]
      }
      player_curriculum_states: {
        Row: {
          academy_id: string
          advancement_blocked_by: string[] | null
          advancement_eligible: boolean
          competition_track_level_id: string | null
          created_at: string | null
          current_level_id: string
          enrolled_at: string
          fitness_path_phase: string | null
          id: string
          last_evaluated_at: string | null
          notes: string | null
          player_id: string
          updated_at: string | null
        }
        Insert: {
          academy_id: string
          advancement_blocked_by?: string[] | null
          advancement_eligible?: boolean
          competition_track_level_id?: string | null
          created_at?: string | null
          current_level_id: string
          enrolled_at?: string
          fitness_path_phase?: string | null
          id?: string
          last_evaluated_at?: string | null
          notes?: string | null
          player_id: string
          updated_at?: string | null
        }
        Update: {
          academy_id?: string
          advancement_blocked_by?: string[] | null
          advancement_eligible?: boolean
          competition_track_level_id?: string | null
          created_at?: string | null
          current_level_id?: string
          enrolled_at?: string
          fitness_path_phase?: string | null
          id?: string
          last_evaluated_at?: string | null
          notes?: string | null
          player_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_curriculum_states_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_curriculum_states_competition_track_level_id_fkey"
            columns: ["competition_track_level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_curriculum_states_competition_track_level_id_fkey"
            columns: ["competition_track_level_id"]
            isOneToOne: false
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "player_curriculum_states_current_level_id_fkey"
            columns: ["current_level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_curriculum_states_current_level_id_fkey"
            columns: ["current_level_id"]
            isOneToOne: false
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "player_curriculum_states_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_curriculum_states_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_curriculum_states_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_curriculum_states_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      player_development_signals: {
        Row: {
          academy_id: string
          confidence: number
          data: Json | null
          description: string | null
          domain: Database["public"]["Enums"]["development_track"] | null
          emitted_at: string
          engine_processed_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          player_id: string
          processed_by_engine: boolean
          recommended_action: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          signal_type: Database["public"]["Enums"]["signal_type"]
          source: Database["public"]["Enums"]["signal_source"]
          source_object_id: string | null
          source_object_type: string | null
          title: string
        }
        Insert: {
          academy_id: string
          confidence?: number
          data?: Json | null
          description?: string | null
          domain?: Database["public"]["Enums"]["development_track"] | null
          emitted_at?: string
          engine_processed_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          player_id: string
          processed_by_engine?: boolean
          recommended_action?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          signal_type: Database["public"]["Enums"]["signal_type"]
          source: Database["public"]["Enums"]["signal_source"]
          source_object_id?: string | null
          source_object_type?: string | null
          title: string
        }
        Update: {
          academy_id?: string
          confidence?: number
          data?: Json | null
          description?: string | null
          domain?: Database["public"]["Enums"]["development_track"] | null
          emitted_at?: string
          engine_processed_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          player_id?: string
          processed_by_engine?: boolean
          recommended_action?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          signal_type?: Database["public"]["Enums"]["signal_type"]
          source?: Database["public"]["Enums"]["signal_source"]
          source_object_id?: string | null
          source_object_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_development_signals_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_development_signals_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_development_signals_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_development_signals_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_development_signals_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_development_signals_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_development_signals_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "player_development_signals_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      player_development_summary: {
        Row: {
          academy_id: string
          coach_summary: string | null
          created_at: string
          created_by: string
          current_strengths: string[]
          development_focus: string | null
          id: string
          parent_summary: string | null
          player_id: string
          show_to_parent: boolean
          show_to_student: boolean
          source: string
          student_friendly_summary: string | null
          things_to_work_on: string[]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          academy_id: string
          coach_summary?: string | null
          created_at?: string
          created_by: string
          current_strengths?: string[]
          development_focus?: string | null
          id?: string
          parent_summary?: string | null
          player_id: string
          show_to_parent?: boolean
          show_to_student?: boolean
          source?: string
          student_friendly_summary?: string | null
          things_to_work_on?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          academy_id?: string
          coach_summary?: string | null
          created_at?: string
          created_by?: string
          current_strengths?: string[]
          development_focus?: string | null
          id?: string
          parent_summary?: string | null
          player_id?: string
          show_to_parent?: boolean
          show_to_student?: boolean
          source?: string
          student_friendly_summary?: string | null
          things_to_work_on?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_development_summary_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_development_summary_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_development_summary_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "player_development_summary_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "player_development_summary_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_development_summary_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_development_summary_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_development_summary_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_development_summary_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_development_summary_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "player_development_summary_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      player_domain_progress: {
        Row: {
          academy_id: string
          created_at: string | null
          domain: Database["public"]["Enums"]["skill_domain_type"]
          id: string
          last_outcome_at: string | null
          level_id: string
          mastered_at: string | null
          outcome_count: number
          player_id: string
          positive_outcome_count: number
          regression_detected_at: string | null
          status: Database["public"]["Enums"]["progression_status"]
          updated_at: string | null
        }
        Insert: {
          academy_id: string
          created_at?: string | null
          domain: Database["public"]["Enums"]["skill_domain_type"]
          id?: string
          last_outcome_at?: string | null
          level_id: string
          mastered_at?: string | null
          outcome_count?: number
          player_id: string
          positive_outcome_count?: number
          regression_detected_at?: string | null
          status?: Database["public"]["Enums"]["progression_status"]
          updated_at?: string | null
        }
        Update: {
          academy_id?: string
          created_at?: string | null
          domain?: Database["public"]["Enums"]["skill_domain_type"]
          id?: string
          last_outcome_at?: string | null
          level_id?: string
          mastered_at?: string | null
          outcome_count?: number
          player_id?: string
          positive_outcome_count?: number
          regression_detected_at?: string | null
          status?: Database["public"]["Enums"]["progression_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_domain_progress_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_domain_progress_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_domain_progress_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "player_domain_progress_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_domain_progress_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_domain_progress_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_domain_progress_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      player_gate_status: {
        Row: {
          academy_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          evidence_count: number
          gate_criterion_snapshot: string
          gate_id: string
          id: string
          is_parent_visible: boolean
          is_player_visible: boolean
          last_evidence_at: string | null
          notes: string | null
          player_id: string
          status: string
          updated_at: string
          waived_at: string | null
          waived_by: string | null
          waiver_reason: string | null
        }
        Insert: {
          academy_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          evidence_count?: number
          gate_criterion_snapshot: string
          gate_id: string
          id?: string
          is_parent_visible?: boolean
          is_player_visible?: boolean
          last_evidence_at?: string | null
          notes?: string | null
          player_id: string
          status?: string
          updated_at?: string
          waived_at?: string | null
          waived_by?: string | null
          waiver_reason?: string | null
        }
        Update: {
          academy_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          evidence_count?: number
          gate_criterion_snapshot?: string
          gate_id?: string
          id?: string
          is_parent_visible?: boolean
          is_player_visible?: boolean
          last_evidence_at?: string | null
          notes?: string | null
          player_id?: string
          status?: string
          updated_at?: string
          waived_at?: string | null
          waived_by?: string | null
          waiver_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_gate_status_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_gate_status_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_gate_status_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "player_gate_status_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "player_gate_status_gate_id_fkey"
            columns: ["gate_id"]
            isOneToOne: false
            referencedRelation: "curriculum_gates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_gate_status_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_gate_status_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_gate_status_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_gate_status_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_gate_status_waived_by_fkey"
            columns: ["waived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_gate_status_waived_by_fkey"
            columns: ["waived_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "player_gate_status_waived_by_fkey"
            columns: ["waived_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      player_guardians: {
        Row: {
          guardian_id: string
          player_id: string
        }
        Insert: {
          guardian_id: string
          player_id: string
        }
        Update: {
          guardian_id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_guardians_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_guardians_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_guardians_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_guardians_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_guardians_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      player_load_aggregation: {
        Row: {
          absences_7d: number | null
          academy_id: string
          avg_intensity_28d: number | null
          avg_intensity_7d: number | null
          avg_perceived_load_28d: number | null
          avg_perceived_load_7d: number | null
          calculated_at: string
          competition_sessions_28d: number | null
          duration_28d_min: number
          duration_7d_min: number
          fatigue_risk_label: string | null
          fatigue_risk_score: number | null
          fitness_sessions_28d: number | null
          high_intensity_blocks_7d: number | null
          id: string
          load_trend_7d: string | null
          overload_flag: boolean
          player_id: string
          sessions_28d: number
          sessions_7d: number
          skill_sessions_28d: number | null
          window_28d_start: string
          window_7d_start: string
        }
        Insert: {
          absences_7d?: number | null
          academy_id: string
          avg_intensity_28d?: number | null
          avg_intensity_7d?: number | null
          avg_perceived_load_28d?: number | null
          avg_perceived_load_7d?: number | null
          calculated_at?: string
          competition_sessions_28d?: number | null
          duration_28d_min?: number
          duration_7d_min?: number
          fatigue_risk_label?: string | null
          fatigue_risk_score?: number | null
          fitness_sessions_28d?: number | null
          high_intensity_blocks_7d?: number | null
          id?: string
          load_trend_7d?: string | null
          overload_flag?: boolean
          player_id: string
          sessions_28d?: number
          sessions_7d?: number
          skill_sessions_28d?: number | null
          window_28d_start: string
          window_7d_start: string
        }
        Update: {
          absences_7d?: number | null
          academy_id?: string
          avg_intensity_28d?: number | null
          avg_intensity_7d?: number | null
          avg_perceived_load_28d?: number | null
          avg_perceived_load_7d?: number | null
          calculated_at?: string
          competition_sessions_28d?: number | null
          duration_28d_min?: number
          duration_7d_min?: number
          fatigue_risk_label?: string | null
          fatigue_risk_score?: number | null
          fitness_sessions_28d?: number | null
          high_intensity_blocks_7d?: number | null
          id?: string
          load_trend_7d?: string | null
          overload_flag?: boolean
          player_id?: string
          sessions_28d?: number
          sessions_7d?: number
          skill_sessions_28d?: number | null
          window_28d_start?: string
          window_7d_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_load_aggregation_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_load_aggregation_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_load_aggregation_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_load_aggregation_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_load_aggregation_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      player_outcomes: {
        Row: {
          academy_id: string
          behavioral_obs: string | null
          competition_obs: string | null
          concerns: string[] | null
          created_at: string
          energy_level: number | null
          engagement_level: number | null
          focus_areas_observed: string[] | null
          highlights: string[] | null
          id: string
          movement_obs: string | null
          notes: string | null
          perceived_load: number | null
          performance_rating: number | null
          plan_achieved: boolean | null
          plan_deviation_notes: string | null
          player_id: string
          recommendation_id: string | null
          recorded_by: string
          session_id: string
          signals_emitted: boolean
          signals_emitted_at: string | null
          tactical_obs: string | null
          technical_obs: string | null
        }
        Insert: {
          academy_id: string
          behavioral_obs?: string | null
          competition_obs?: string | null
          concerns?: string[] | null
          created_at?: string
          energy_level?: number | null
          engagement_level?: number | null
          focus_areas_observed?: string[] | null
          highlights?: string[] | null
          id?: string
          movement_obs?: string | null
          notes?: string | null
          perceived_load?: number | null
          performance_rating?: number | null
          plan_achieved?: boolean | null
          plan_deviation_notes?: string | null
          player_id: string
          recommendation_id?: string | null
          recorded_by: string
          session_id: string
          signals_emitted?: boolean
          signals_emitted_at?: string | null
          tactical_obs?: string | null
          technical_obs?: string | null
        }
        Update: {
          academy_id?: string
          behavioral_obs?: string | null
          competition_obs?: string | null
          concerns?: string[] | null
          created_at?: string
          energy_level?: number | null
          engagement_level?: number | null
          focus_areas_observed?: string[] | null
          highlights?: string[] | null
          id?: string
          movement_obs?: string | null
          notes?: string | null
          perceived_load?: number | null
          performance_rating?: number | null
          plan_achieved?: boolean | null
          plan_deviation_notes?: string | null
          player_id?: string
          recommendation_id?: string | null
          recorded_by?: string
          session_id?: string
          signals_emitted?: boolean
          signals_emitted_at?: string | null
          tactical_obs?: string | null
          technical_obs?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_outcomes_recommendation"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "player_recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_outcomes_recommendation"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "v_player_development_loop"
            referencedColumns: ["recommendation_id"]
          },
          {
            foreignKeyName: "fk_outcomes_recommendation"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "v_recommendation_review_queue"
            referencedColumns: ["recommendation_id"]
          },
          {
            foreignKeyName: "player_outcomes_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_outcomes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_outcomes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_outcomes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_outcomes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_outcomes_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_outcomes_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "player_outcomes_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "player_outcomes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_outcomes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_session_load"
            referencedColumns: ["session_id"]
          },
        ]
      }
      player_phase_states: {
        Row: {
          academy_id: string
          competition_ok: boolean
          created_at: string
          end_date: string | null
          high_intensity_ok: boolean
          id: string
          is_current: boolean
          max_intensity: number | null
          max_sessions_per_week: number | null
          phase: Database["public"]["Enums"]["player_phase"]
          player_id: string
          reason: string | null
          set_by: string | null
          start_date: string
        }
        Insert: {
          academy_id: string
          competition_ok?: boolean
          created_at?: string
          end_date?: string | null
          high_intensity_ok?: boolean
          id?: string
          is_current?: boolean
          max_intensity?: number | null
          max_sessions_per_week?: number | null
          phase?: Database["public"]["Enums"]["player_phase"]
          player_id: string
          reason?: string | null
          set_by?: string | null
          start_date?: string
        }
        Update: {
          academy_id?: string
          competition_ok?: boolean
          created_at?: string
          end_date?: string | null
          high_intensity_ok?: boolean
          id?: string
          is_current?: boolean
          max_intensity?: number | null
          max_sessions_per_week?: number | null
          phase?: Database["public"]["Enums"]["player_phase"]
          player_id?: string
          reason?: string | null
          set_by?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_phase_states_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_phase_states_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_phase_states_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_phase_states_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_phase_states_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_phase_states_set_by_fkey"
            columns: ["set_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_phase_states_set_by_fkey"
            columns: ["set_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "player_phase_states_set_by_fkey"
            columns: ["set_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      player_predictions: {
        Row: {
          academy_id: string
          generated_at: string
          id: string
          injury_risk_label: string
          injury_risk_score: number
          model_inputs: Json
          player_id: string
          predicted_performance_score: number | null
          prediction_confidence: number
          prediction_horizon_days: number
          prediction_summary: string | null
          readiness_label: string
          readiness_score: number
          risk_factors: Json
          uplift_factors: Json
        }
        Insert: {
          academy_id: string
          generated_at?: string
          id?: string
          injury_risk_label?: string
          injury_risk_score?: number
          model_inputs?: Json
          player_id: string
          predicted_performance_score?: number | null
          prediction_confidence?: number
          prediction_horizon_days?: number
          prediction_summary?: string | null
          readiness_label?: string
          readiness_score?: number
          risk_factors?: Json
          uplift_factors?: Json
        }
        Update: {
          academy_id?: string
          generated_at?: string
          id?: string
          injury_risk_label?: string
          injury_risk_score?: number
          model_inputs?: Json
          player_id?: string
          predicted_performance_score?: number | null
          prediction_confidence?: number
          prediction_horizon_days?: number
          prediction_summary?: string | null
          readiness_label?: string
          readiness_score?: number
          risk_factors?: Json
          uplift_factors?: Json
        }
        Relationships: [
          {
            foreignKeyName: "player_predictions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_predictions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_predictions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_predictions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_predictions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      player_priorities: {
        Row: {
          academy_id: string
          address_notes: string | null
          addressed_at: string | null
          addressed_by: string | null
          category: Database["public"]["Enums"]["priority_category"]
          confidence_score: number
          current_score: number | null
          description: string | null
          generated_at: string
          id: string
          is_active: boolean
          linked_recommendation_id: string | null
          min_sessions_per_week: number | null
          player_id: string
          primary_signal_id: string | null
          priority_level: string
          priority_rank: number
          relevant_dimension: string | null
          source_signal_ids: string[]
          status: string
          suggested_block_types:
            | Database["public"]["Enums"]["block_type"][]
            | null
          suggested_exercise_tags: string[] | null
          target_score: number | null
          title: string
          updated_at: string
          urgency: string
        }
        Insert: {
          academy_id: string
          address_notes?: string | null
          addressed_at?: string | null
          addressed_by?: string | null
          category: Database["public"]["Enums"]["priority_category"]
          confidence_score?: number
          current_score?: number | null
          description?: string | null
          generated_at?: string
          id?: string
          is_active?: boolean
          linked_recommendation_id?: string | null
          min_sessions_per_week?: number | null
          player_id: string
          primary_signal_id?: string | null
          priority_level?: string
          priority_rank?: number
          relevant_dimension?: string | null
          source_signal_ids?: string[]
          status?: string
          suggested_block_types?:
            | Database["public"]["Enums"]["block_type"][]
            | null
          suggested_exercise_tags?: string[] | null
          target_score?: number | null
          title: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          academy_id?: string
          address_notes?: string | null
          addressed_at?: string | null
          addressed_by?: string | null
          category?: Database["public"]["Enums"]["priority_category"]
          confidence_score?: number
          current_score?: number | null
          description?: string | null
          generated_at?: string
          id?: string
          is_active?: boolean
          linked_recommendation_id?: string | null
          min_sessions_per_week?: number | null
          player_id?: string
          primary_signal_id?: string | null
          priority_level?: string
          priority_rank?: number
          relevant_dimension?: string | null
          source_signal_ids?: string[]
          status?: string
          suggested_block_types?:
            | Database["public"]["Enums"]["block_type"][]
            | null
          suggested_exercise_tags?: string[] | null
          target_score?: number | null
          title?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_priorities_recommendation"
            columns: ["linked_recommendation_id"]
            isOneToOne: false
            referencedRelation: "player_recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_priorities_recommendation"
            columns: ["linked_recommendation_id"]
            isOneToOne: false
            referencedRelation: "v_player_development_loop"
            referencedColumns: ["recommendation_id"]
          },
          {
            foreignKeyName: "fk_priorities_recommendation"
            columns: ["linked_recommendation_id"]
            isOneToOne: false
            referencedRelation: "v_recommendation_review_queue"
            referencedColumns: ["recommendation_id"]
          },
          {
            foreignKeyName: "player_priorities_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_priorities_addressed_by_fkey"
            columns: ["addressed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_priorities_addressed_by_fkey"
            columns: ["addressed_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "player_priorities_addressed_by_fkey"
            columns: ["addressed_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "player_priorities_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_priorities_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_priorities_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_priorities_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_priorities_primary_signal_id_fkey"
            columns: ["primary_signal_id"]
            isOneToOne: false
            referencedRelation: "player_development_signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_priorities_primary_signal_id_fkey"
            columns: ["primary_signal_id"]
            isOneToOne: false
            referencedRelation: "v_player_signal_dashboard"
            referencedColumns: ["signal_id"]
          },
        ]
      }
      player_progress_snapshots: {
        Row: {
          academy_id: string
          active_signals_high: number | null
          active_signals_low: number | null
          active_signals_medium: number | null
          assessment_id: string | null
          avg_intensity: number | null
          behavioral_score: number | null
          competition_score: number | null
          created_at: string
          created_by: string | null
          group_id: string | null
          group_name: string | null
          id: string
          level_id: string | null
          level_number: number | null
          movement_score: number | null
          overall_score: number | null
          player_id: string
          snapshot_date: string
          tactical_score: number | null
          technical_score: number | null
          track: Database["public"]["Enums"]["development_track"] | null
          trigger_type: string
          utr_doubles: number | null
          utr_match_count_90d: number | null
          utr_singles: number | null
          weekly_duration_avg_min: number | null
          weekly_sessions_avg: number | null
        }
        Insert: {
          academy_id: string
          active_signals_high?: number | null
          active_signals_low?: number | null
          active_signals_medium?: number | null
          assessment_id?: string | null
          avg_intensity?: number | null
          behavioral_score?: number | null
          competition_score?: number | null
          created_at?: string
          created_by?: string | null
          group_id?: string | null
          group_name?: string | null
          id?: string
          level_id?: string | null
          level_number?: number | null
          movement_score?: number | null
          overall_score?: number | null
          player_id: string
          snapshot_date?: string
          tactical_score?: number | null
          technical_score?: number | null
          track?: Database["public"]["Enums"]["development_track"] | null
          trigger_type: string
          utr_doubles?: number | null
          utr_match_count_90d?: number | null
          utr_singles?: number | null
          weekly_duration_avg_min?: number | null
          weekly_sessions_avg?: number | null
        }
        Update: {
          academy_id?: string
          active_signals_high?: number | null
          active_signals_low?: number | null
          active_signals_medium?: number | null
          assessment_id?: string | null
          avg_intensity?: number | null
          behavioral_score?: number | null
          competition_score?: number | null
          created_at?: string
          created_by?: string | null
          group_id?: string | null
          group_name?: string | null
          id?: string
          level_id?: string | null
          level_number?: number | null
          movement_score?: number | null
          overall_score?: number | null
          player_id?: string
          snapshot_date?: string
          tactical_score?: number | null
          technical_score?: number | null
          track?: Database["public"]["Enums"]["development_track"] | null
          trigger_type?: string
          utr_doubles?: number | null
          utr_match_count_90d?: number | null
          utr_singles?: number | null
          weekly_duration_avg_min?: number | null
          weekly_sessions_avg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_progress_snapshots_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_progress_snapshots_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_progress_snapshots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_progress_snapshots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "player_progress_snapshots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "player_progress_snapshots_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_progress_snapshots_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "player_progress_snapshots_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "player_progress_snapshots_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "academy_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_progress_snapshots_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_progress_snapshots_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_progress_snapshots_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_progress_snapshots_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      player_progression: {
        Row: {
          academy_id: string
          baseline_behavioral: number | null
          baseline_competition: number | null
          baseline_movement: number | null
          baseline_overall: number | null
          baseline_set_at: string | null
          baseline_tactical: number | null
          baseline_technical: number | null
          behavioral_score: number | null
          competition_score: number | null
          focus_areas: string[] | null
          id: string
          movement_score: number | null
          overall_score: number | null
          player_id: string
          promotion_flagged_at: string | null
          promotion_flagged_by: string | null
          promotion_notes: string | null
          promotion_ready: boolean
          strengths: string[] | null
          tactical_score: number | null
          tags: string[] | null
          technical_score: number | null
          updated_at: string
          weaknesses: string[] | null
        }
        Insert: {
          academy_id: string
          baseline_behavioral?: number | null
          baseline_competition?: number | null
          baseline_movement?: number | null
          baseline_overall?: number | null
          baseline_set_at?: string | null
          baseline_tactical?: number | null
          baseline_technical?: number | null
          behavioral_score?: number | null
          competition_score?: number | null
          focus_areas?: string[] | null
          id?: string
          movement_score?: number | null
          overall_score?: number | null
          player_id: string
          promotion_flagged_at?: string | null
          promotion_flagged_by?: string | null
          promotion_notes?: string | null
          promotion_ready?: boolean
          strengths?: string[] | null
          tactical_score?: number | null
          tags?: string[] | null
          technical_score?: number | null
          updated_at?: string
          weaknesses?: string[] | null
        }
        Update: {
          academy_id?: string
          baseline_behavioral?: number | null
          baseline_competition?: number | null
          baseline_movement?: number | null
          baseline_overall?: number | null
          baseline_set_at?: string | null
          baseline_tactical?: number | null
          baseline_technical?: number | null
          behavioral_score?: number | null
          competition_score?: number | null
          focus_areas?: string[] | null
          id?: string
          movement_score?: number | null
          overall_score?: number | null
          player_id?: string
          promotion_flagged_at?: string | null
          promotion_flagged_by?: string | null
          promotion_notes?: string | null
          promotion_ready?: boolean
          strengths?: string[] | null
          tactical_score?: number | null
          tags?: string[] | null
          technical_score?: number | null
          updated_at?: string
          weaknesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "player_progression_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_progression_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_progression_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_progression_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_progression_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_progression_promotion_flagged_by_fkey"
            columns: ["promotion_flagged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_progression_promotion_flagged_by_fkey"
            columns: ["promotion_flagged_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "player_progression_promotion_flagged_by_fkey"
            columns: ["promotion_flagged_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      player_recommendations: {
        Row: {
          academy_id: string
          completed_at: string | null
          confidence_score: number
          decision_score_id: string | null
          description: string | null
          expires_at: string
          generated_at: string
          id: string
          outcome_ids: string[] | null
          outcome_notes: string | null
          overridden_at: string | null
          overridden_by: string | null
          override_notes: string | null
          override_recommendation_type: string | null
          player_id: string
          priority_id: string | null
          priority_level: string
          recommendation_type: string
          recommended_group_id: string | null
          recommended_track:
            | Database["public"]["Enums"]["development_track"]
            | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["recommendation_status"]
          suggested_reassessment_date: string | null
          target_block_types: Database["public"]["Enums"]["block_type"][] | null
          target_exercise_tags: string[] | null
          target_intensity_range: Json | null
          target_sessions_per_week: number | null
          title: string
          updated_at: string
          urgency: string
        }
        Insert: {
          academy_id: string
          completed_at?: string | null
          confidence_score: number
          decision_score_id?: string | null
          description?: string | null
          expires_at?: string
          generated_at?: string
          id?: string
          outcome_ids?: string[] | null
          outcome_notes?: string | null
          overridden_at?: string | null
          overridden_by?: string | null
          override_notes?: string | null
          override_recommendation_type?: string | null
          player_id: string
          priority_id?: string | null
          priority_level?: string
          recommendation_type: string
          recommended_group_id?: string | null
          recommended_track?:
            | Database["public"]["Enums"]["development_track"]
            | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["recommendation_status"]
          suggested_reassessment_date?: string | null
          target_block_types?:
            | Database["public"]["Enums"]["block_type"][]
            | null
          target_exercise_tags?: string[] | null
          target_intensity_range?: Json | null
          target_sessions_per_week?: number | null
          title: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          academy_id?: string
          completed_at?: string | null
          confidence_score?: number
          decision_score_id?: string | null
          description?: string | null
          expires_at?: string
          generated_at?: string
          id?: string
          outcome_ids?: string[] | null
          outcome_notes?: string | null
          overridden_at?: string | null
          overridden_by?: string | null
          override_notes?: string | null
          override_recommendation_type?: string | null
          player_id?: string
          priority_id?: string | null
          priority_level?: string
          recommendation_type?: string
          recommended_group_id?: string | null
          recommended_track?:
            | Database["public"]["Enums"]["development_track"]
            | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["recommendation_status"]
          suggested_reassessment_date?: string | null
          target_block_types?:
            | Database["public"]["Enums"]["block_type"][]
            | null
          target_exercise_tags?: string[] | null
          target_intensity_range?: Json | null
          target_sessions_per_week?: number | null
          title?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_recommendations_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_recommendations_decision_score_id_fkey"
            columns: ["decision_score_id"]
            isOneToOne: false
            referencedRelation: "decision_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_recommendations_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_recommendations_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "player_recommendations_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "player_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_recommendations_priority_id_fkey"
            columns: ["priority_id"]
            isOneToOne: false
            referencedRelation: "player_priorities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_recommendations_recommended_group_id_fkey"
            columns: ["recommended_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_recommendations_recommended_group_id_fkey"
            columns: ["recommended_group_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "player_recommendations_recommended_group_id_fkey"
            columns: ["recommended_group_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "player_recommendations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_recommendations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "player_recommendations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      player_requirement_progress: {
        Row: {
          academy_id: string
          coach_confirmed_by: string | null
          confirmed_at: string | null
          created_at: string
          curriculum_level_id: string
          director_confirmed_by: string | null
          evidence_count: number
          id: string
          is_parent_visible: boolean
          is_player_visible: boolean
          last_evidence_at: string | null
          notes: string | null
          player_id: string
          progress_value: number | null
          requirement_id: string
          status: string
          updated_at: string
        }
        Insert: {
          academy_id: string
          coach_confirmed_by?: string | null
          confirmed_at?: string | null
          created_at?: string
          curriculum_level_id: string
          director_confirmed_by?: string | null
          evidence_count?: number
          id?: string
          is_parent_visible?: boolean
          is_player_visible?: boolean
          last_evidence_at?: string | null
          notes?: string | null
          player_id: string
          progress_value?: number | null
          requirement_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          academy_id?: string
          coach_confirmed_by?: string | null
          confirmed_at?: string | null
          created_at?: string
          curriculum_level_id?: string
          director_confirmed_by?: string | null
          evidence_count?: number
          id?: string
          is_parent_visible?: boolean
          is_player_visible?: boolean
          last_evidence_at?: string | null
          notes?: string | null
          player_id?: string
          progress_value?: number | null
          requirement_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_requirement_progress_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_requirement_progress_coach_confirmed_by_fkey"
            columns: ["coach_confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_requirement_progress_coach_confirmed_by_fkey"
            columns: ["coach_confirmed_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "player_requirement_progress_coach_confirmed_by_fkey"
            columns: ["coach_confirmed_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "player_requirement_progress_curriculum_level_id_fkey"
            columns: ["curriculum_level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_requirement_progress_curriculum_level_id_fkey"
            columns: ["curriculum_level_id"]
            isOneToOne: false
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "player_requirement_progress_director_confirmed_by_fkey"
            columns: ["director_confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_requirement_progress_director_confirmed_by_fkey"
            columns: ["director_confirmed_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "player_requirement_progress_director_confirmed_by_fkey"
            columns: ["director_confirmed_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "player_requirement_progress_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_requirement_progress_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_requirement_progress_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_requirement_progress_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_requirement_progress_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "curriculum_track_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      player_time_series: {
        Row: {
          academy_id: string
          created_at: string
          id: string
          metric: Database["public"]["Enums"]["time_series_metric"]
          player_id: string
          recorded_date: string
          source_id: string | null
          source_type: string
          value: number
        }
        Insert: {
          academy_id: string
          created_at?: string
          id?: string
          metric: Database["public"]["Enums"]["time_series_metric"]
          player_id: string
          recorded_date?: string
          source_id?: string | null
          source_type?: string
          value: number
        }
        Update: {
          academy_id?: string
          created_at?: string
          id?: string
          metric?: Database["public"]["Enums"]["time_series_metric"]
          player_id?: string
          recorded_date?: string
          source_id?: string | null
          source_type?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_time_series_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_time_series_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_time_series_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_time_series_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_time_series_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      player_utr_history: {
        Row: {
          academy_id: string
          captured_at: string
          delta_from_previous: number | null
          id: string
          player_id: string
          source: string
          utr_status: string | null
          utr_type: string
          utr_value: number
        }
        Insert: {
          academy_id: string
          captured_at?: string
          delta_from_previous?: number | null
          id?: string
          player_id: string
          source?: string
          utr_status?: string | null
          utr_type?: string
          utr_value: number
        }
        Update: {
          academy_id?: string
          captured_at?: string
          delta_from_previous?: number | null
          id?: string
          player_id?: string
          source?: string
          utr_status?: string | null
          utr_type?: string
          utr_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_utr_history_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_utr_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_utr_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_utr_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_utr_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      player_utr_insights: {
        Row: {
          academy_id: string
          calculated_at: string
          data: Json | null
          delta: number | null
          id: string
          insight_text: string
          insight_type: string
          is_active: boolean
          period_days: number | null
          player_id: string
          signal_id: string | null
          utr_at_period_start: number | null
          utr_current: number | null
        }
        Insert: {
          academy_id: string
          calculated_at?: string
          data?: Json | null
          delta?: number | null
          id?: string
          insight_text: string
          insight_type: string
          is_active?: boolean
          period_days?: number | null
          player_id: string
          signal_id?: string | null
          utr_at_period_start?: number | null
          utr_current?: number | null
        }
        Update: {
          academy_id?: string
          calculated_at?: string
          data?: Json | null
          delta?: number | null
          id?: string
          insight_text?: string
          insight_type?: string
          is_active?: boolean
          period_days?: number | null
          player_id?: string
          signal_id?: string | null
          utr_at_period_start?: number | null
          utr_current?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_utr_insights_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_utr_insights_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_utr_insights_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_utr_insights_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_utr_insights_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_utr_insights_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "player_development_signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_utr_insights_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "v_player_signal_dashboard"
            referencedColumns: ["signal_id"]
          },
        ]
      }
      player_utr_matches: {
        Row: {
          academy_id: string
          captured_at: string
          competition_id: string | null
          id: string
          match_date: string
          opponent_name: string | null
          opponent_utr: number | null
          player_id: string
          result: string
          score: string | null
          surface: string | null
          tournament_name: string | null
          utr_impact: number | null
        }
        Insert: {
          academy_id: string
          captured_at?: string
          competition_id?: string | null
          id?: string
          match_date: string
          opponent_name?: string | null
          opponent_utr?: number | null
          player_id: string
          result: string
          score?: string | null
          surface?: string | null
          tournament_name?: string | null
          utr_impact?: number | null
        }
        Update: {
          academy_id?: string
          captured_at?: string
          competition_id?: string | null
          id?: string
          match_date?: string
          opponent_name?: string | null
          opponent_utr?: number | null
          player_id?: string
          result?: string
          score?: string | null
          surface?: string | null
          tournament_name?: string | null
          utr_impact?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_utr_matches_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_utr_matches_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_utr_matches_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_utr_matches_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_utr_matches_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      player_utr_profiles: {
        Row: {
          academy_id: string
          created_at: string
          id: string
          last_match_date: string | null
          last_synced_at: string | null
          losses_90d: number | null
          matches_played_90d: number | null
          matches_played_ytd: number | null
          player_id: string
          sync_source: string | null
          updated_at: string
          utr_doubles: number | null
          utr_player_id: string | null
          utr_singles: number | null
          utr_status: string | null
          win_rate_90d: number | null
          wins_90d: number | null
        }
        Insert: {
          academy_id: string
          created_at?: string
          id?: string
          last_match_date?: string | null
          last_synced_at?: string | null
          losses_90d?: number | null
          matches_played_90d?: number | null
          matches_played_ytd?: number | null
          player_id: string
          sync_source?: string | null
          updated_at?: string
          utr_doubles?: number | null
          utr_player_id?: string | null
          utr_singles?: number | null
          utr_status?: string | null
          win_rate_90d?: number | null
          wins_90d?: number | null
        }
        Update: {
          academy_id?: string
          created_at?: string
          id?: string
          last_match_date?: string | null
          last_synced_at?: string | null
          losses_90d?: number | null
          matches_played_90d?: number | null
          matches_played_ytd?: number | null
          player_id?: string
          sync_source?: string | null
          updated_at?: string
          utr_doubles?: number | null
          utr_player_id?: string | null
          utr_singles?: number | null
          utr_status?: string | null
          win_rate_90d?: number | null
          wins_90d?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_utr_profiles_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_utr_profiles_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_utr_profiles_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_utr_profiles_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_utr_profiles_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      players: {
        Row: {
          academy_id: string
          archetype_secondary_tag: string | null
          archetype_tag: string | null
          assessment_interval_weeks: number
          created_at: string
          created_by: string | null
          current_group_id: string | null
          current_level_id: string | null
          current_track: Database["public"]["Enums"]["development_track"] | null
          date_of_birth: string
          entry_age: number | null
          first_name: string
          full_name: string | null
          gender: string | null
          handedness: string | null
          healthy_plateau_state: boolean
          id: string
          is_active: boolean
          join_date: string
          last_assessed_at: string | null
          last_name: string
          nationality: string | null
          next_assessment_due: string | null
          notes: string | null
          primary_coach_id: string | null
          profile_id: string | null
          recreation_flag: boolean
          return_to_play_state: boolean
          status: Database["public"]["Enums"]["player_status"]
          updated_at: string
        }
        Insert: {
          academy_id: string
          archetype_secondary_tag?: string | null
          archetype_tag?: string | null
          assessment_interval_weeks?: number
          created_at?: string
          created_by?: string | null
          current_group_id?: string | null
          current_level_id?: string | null
          current_track?:
            | Database["public"]["Enums"]["development_track"]
            | null
          date_of_birth: string
          entry_age?: number | null
          first_name: string
          full_name?: string | null
          gender?: string | null
          handedness?: string | null
          healthy_plateau_state?: boolean
          id?: string
          is_active?: boolean
          join_date?: string
          last_assessed_at?: string | null
          last_name: string
          nationality?: string | null
          next_assessment_due?: string | null
          notes?: string | null
          primary_coach_id?: string | null
          profile_id?: string | null
          recreation_flag?: boolean
          return_to_play_state?: boolean
          status?: Database["public"]["Enums"]["player_status"]
          updated_at?: string
        }
        Update: {
          academy_id?: string
          archetype_secondary_tag?: string | null
          archetype_tag?: string | null
          assessment_interval_weeks?: number
          created_at?: string
          created_by?: string | null
          current_group_id?: string | null
          current_level_id?: string | null
          current_track?:
            | Database["public"]["Enums"]["development_track"]
            | null
          date_of_birth?: string
          entry_age?: number | null
          first_name?: string
          full_name?: string | null
          gender?: string | null
          handedness?: string | null
          healthy_plateau_state?: boolean
          id?: string
          is_active?: boolean
          join_date?: string
          last_assessed_at?: string | null
          last_name?: string
          nationality?: string | null
          next_assessment_due?: string | null
          notes?: string | null
          primary_coach_id?: string | null
          profile_id?: string | null
          recreation_flag?: boolean
          return_to_play_state?: boolean
          status?: Database["public"]["Enums"]["player_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "players_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "players_current_group_id_fkey"
            columns: ["current_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_current_group_id_fkey"
            columns: ["current_group_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "players_current_group_id_fkey"
            columns: ["current_group_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "players_current_level_id_fkey"
            columns: ["current_level_id"]
            isOneToOne: false
            referencedRelation: "academy_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_primary_coach_id_fkey"
            columns: ["primary_coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_primary_coach_id_fkey"
            columns: ["primary_coach_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "players_primary_coach_id_fkey"
            columns: ["primary_coach_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "players_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "players_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      private_lesson_requests: {
        Row: {
          academy_id: string
          created_at: string
          director_notes: string | null
          goal: string | null
          id: string
          notes: string | null
          parent_profile_id: string | null
          player_id: string | null
          preferred_days: string | null
          preferred_times: string | null
          requested_by_user_id: string | null
          requested_coach_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          academy_id: string
          created_at?: string
          director_notes?: string | null
          goal?: string | null
          id?: string
          notes?: string | null
          parent_profile_id?: string | null
          player_id?: string | null
          preferred_days?: string | null
          preferred_times?: string | null
          requested_by_user_id?: string | null
          requested_coach_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          academy_id?: string
          created_at?: string
          director_notes?: string | null
          goal?: string | null
          id?: string
          notes?: string | null
          parent_profile_id?: string | null
          player_id?: string | null
          preferred_days?: string | null
          preferred_times?: string | null
          requested_by_user_id?: string | null
          requested_coach_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_lesson_requests_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_lesson_requests_parent_profile_id_fkey"
            columns: ["parent_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_lesson_requests_parent_profile_id_fkey"
            columns: ["parent_profile_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "private_lesson_requests_parent_profile_id_fkey"
            columns: ["parent_profile_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "private_lesson_requests_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_lesson_requests_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "private_lesson_requests_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "private_lesson_requests_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "private_lesson_requests_requested_by_user_id_fkey"
            columns: ["requested_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_lesson_requests_requested_by_user_id_fkey"
            columns: ["requested_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "private_lesson_requests_requested_by_user_id_fkey"
            columns: ["requested_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "private_lesson_requests_requested_coach_id_fkey"
            columns: ["requested_coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_lesson_requests_requested_coach_id_fkey"
            columns: ["requested_coach_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "private_lesson_requests_requested_coach_id_fkey"
            columns: ["requested_coach_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      profiles: {
        Row: {
          academy_id: string
          avatar_initials: string | null
          created_at: string
          display_name: string
          email: string
          first_run_deck_seen_at: string | null
          has_seen_first_run_deck: boolean
          id: string
          is_active: boolean
          last_seen_at: string | null
          locale: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          academy_id: string
          avatar_initials?: string | null
          created_at?: string
          display_name: string
          email: string
          first_run_deck_seen_at?: string | null
          has_seen_first_run_deck?: boolean
          id: string
          is_active?: boolean
          last_seen_at?: string | null
          locale?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          academy_id?: string
          avatar_initials?: string | null
          created_at?: string
          display_name?: string
          email?: string
          first_run_deck_seen_at?: string | null
          has_seen_first_run_deck?: boolean
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          locale?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      progression_rules: {
        Row: {
          blocking_signal_types: string[]
          created_at: string | null
          id: string
          level_id: string
          min_assessment_score: number | null
          min_domains_mastered: number
          min_total_outcomes: number
          min_weeks_at_level: number
          requires_director_approval: boolean
          requires_final_assessment: boolean
        }
        Insert: {
          blocking_signal_types?: string[]
          created_at?: string | null
          id?: string
          level_id: string
          min_assessment_score?: number | null
          min_domains_mastered?: number
          min_total_outcomes?: number
          min_weeks_at_level?: number
          requires_director_approval?: boolean
          requires_final_assessment?: boolean
        }
        Update: {
          blocking_signal_types?: string[]
          created_at?: string | null
          id?: string
          level_id?: string
          min_assessment_score?: number | null
          min_domains_mastered?: number
          min_total_outcomes?: number
          min_weeks_at_level?: number
          requires_director_approval?: boolean
          requires_final_assessment?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "progression_rules_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: true
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progression_rules_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: true
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
        ]
      }
      proposed_actions: {
        Row: {
          academy_id: string
          action_label: string
          action_type: Database["public"]["Enums"]["action_type"]
          affected_count: number | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          expires_at: string
          id: string
          modified_payload: Json | null
          proposed_by_id: string
          proposed_payload: Json
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          reviewer_notes: string | null
          risk_level: string
          risk_notes: string[] | null
          status: Database["public"]["Enums"]["proposed_action_status"]
          target_module: string
          target_object_id: string | null
          target_object_type: string | null
          updated_at: string
          voice_command_id: string
        }
        Insert: {
          academy_id: string
          action_label: string
          action_type: Database["public"]["Enums"]["action_type"]
          affected_count?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          modified_payload?: Json | null
          proposed_by_id: string
          proposed_payload: Json
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          reviewer_notes?: string | null
          risk_level?: string
          risk_notes?: string[] | null
          status?: Database["public"]["Enums"]["proposed_action_status"]
          target_module: string
          target_object_id?: string | null
          target_object_type?: string | null
          updated_at?: string
          voice_command_id: string
        }
        Update: {
          academy_id?: string
          action_label?: string
          action_type?: Database["public"]["Enums"]["action_type"]
          affected_count?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          modified_payload?: Json | null
          proposed_by_id?: string
          proposed_payload?: Json
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          reviewer_notes?: string | null
          risk_level?: string
          risk_notes?: string[] | null
          status?: Database["public"]["Enums"]["proposed_action_status"]
          target_module?: string
          target_object_id?: string | null
          target_object_type?: string | null
          updated_at?: string
          voice_command_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposed_actions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposed_actions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposed_actions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "proposed_actions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "proposed_actions_proposed_by_id_fkey"
            columns: ["proposed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposed_actions_proposed_by_id_fkey"
            columns: ["proposed_by_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "proposed_actions_proposed_by_id_fkey"
            columns: ["proposed_by_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "proposed_actions_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposed_actions_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "proposed_actions_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "proposed_actions_voice_command_id_fkey"
            columns: ["voice_command_id"]
            isOneToOne: false
            referencedRelation: "voice_commands"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_overrides: {
        Row: {
          academy_id: string
          created_at: string
          engine_predicted_delta: number | null
          evaluate_after: string | null
          evaluation_window_days: number
          id: string
          original_confidence: number | null
          original_rec_type: string
          original_title: string
          original_urgency: string | null
          outcome_evaluated: boolean
          outcome_evaluated_at: string | null
          outcome_notes: string | null
          outcome_score_delta: number | null
          outcome_verdict: string | null
          overridden_at: string
          overridden_by: string
          override_action: string | null
          override_reason: string | null
          override_type: string
          player_id: string
          recommendation_id: string
          suggested_weight_adjustment: number | null
          weight_adjustment_applied: boolean
        }
        Insert: {
          academy_id: string
          created_at?: string
          engine_predicted_delta?: number | null
          evaluate_after?: string | null
          evaluation_window_days?: number
          id?: string
          original_confidence?: number | null
          original_rec_type: string
          original_title: string
          original_urgency?: string | null
          outcome_evaluated?: boolean
          outcome_evaluated_at?: string | null
          outcome_notes?: string | null
          outcome_score_delta?: number | null
          outcome_verdict?: string | null
          overridden_at?: string
          overridden_by: string
          override_action?: string | null
          override_reason?: string | null
          override_type: string
          player_id: string
          recommendation_id: string
          suggested_weight_adjustment?: number | null
          weight_adjustment_applied?: boolean
        }
        Update: {
          academy_id?: string
          created_at?: string
          engine_predicted_delta?: number | null
          evaluate_after?: string | null
          evaluation_window_days?: number
          id?: string
          original_confidence?: number | null
          original_rec_type?: string
          original_title?: string
          original_urgency?: string | null
          outcome_evaluated?: boolean
          outcome_evaluated_at?: string | null
          outcome_notes?: string | null
          outcome_score_delta?: number | null
          outcome_verdict?: string | null
          overridden_at?: string
          overridden_by?: string
          override_action?: string | null
          override_reason?: string | null
          override_type?: string
          player_id?: string
          recommendation_id?: string
          suggested_weight_adjustment?: number | null
          weight_adjustment_applied?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_overrides_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_overrides_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_overrides_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "recommendation_overrides_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "recommendation_overrides_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_overrides_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "recommendation_overrides_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "recommendation_overrides_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "recommendation_overrides_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "player_recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_overrides_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "v_player_development_loop"
            referencedColumns: ["recommendation_id"]
          },
          {
            foreignKeyName: "recommendation_overrides_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "v_recommendation_review_queue"
            referencedColumns: ["recommendation_id"]
          },
        ]
      }
      recommendation_reasoning: {
        Row: {
          academy_id: string
          behavioral_adjustments: Json
          composite_score: number | null
          confidence_explanation: string | null
          constraints_applied: Json
          domain_scores: Json
          explanation_bullets: string[]
          explanation_text: string
          generated_at: string
          id: string
          load_context: Json
          phase_context: Json
          player_id: string
          predicted_score_impact: number | null
          recommendation_id: string
          signal_summary: Json
          source_signal_ids: string[]
          weights_applied: Json
        }
        Insert: {
          academy_id: string
          behavioral_adjustments?: Json
          composite_score?: number | null
          confidence_explanation?: string | null
          constraints_applied?: Json
          domain_scores?: Json
          explanation_bullets?: string[]
          explanation_text: string
          generated_at?: string
          id?: string
          load_context?: Json
          phase_context?: Json
          player_id: string
          predicted_score_impact?: number | null
          recommendation_id: string
          signal_summary?: Json
          source_signal_ids?: string[]
          weights_applied?: Json
        }
        Update: {
          academy_id?: string
          behavioral_adjustments?: Json
          composite_score?: number | null
          confidence_explanation?: string | null
          constraints_applied?: Json
          domain_scores?: Json
          explanation_bullets?: string[]
          explanation_text?: string
          generated_at?: string
          id?: string
          load_context?: Json
          phase_context?: Json
          player_id?: string
          predicted_score_impact?: number | null
          recommendation_id?: string
          signal_summary?: Json
          source_signal_ids?: string[]
          weights_applied?: Json
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_reasoning_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_reasoning_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_reasoning_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "recommendation_reasoning_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "recommendation_reasoning_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "recommendation_reasoning_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: true
            referencedRelation: "player_recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_reasoning_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: true
            referencedRelation: "v_player_development_loop"
            referencedColumns: ["recommendation_id"]
          },
          {
            foreignKeyName: "recommendation_reasoning_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: true
            referencedRelation: "v_recommendation_review_queue"
            referencedColumns: ["recommendation_id"]
          },
        ]
      }
      requirement_evidence_links: {
        Row: {
          academy_id: string
          confidence: number | null
          created_at: string
          created_by: string | null
          evidence_id: string
          evidence_summary: string | null
          evidence_type: string
          gate_id: string | null
          id: string
          is_parent_safe: boolean
          player_id: string
          player_requirement_progress_id: string | null
          requirement_id: string
          weight: number | null
        }
        Insert: {
          academy_id: string
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          evidence_id: string
          evidence_summary?: string | null
          evidence_type: string
          gate_id?: string | null
          id?: string
          is_parent_safe?: boolean
          player_id: string
          player_requirement_progress_id?: string | null
          requirement_id: string
          weight?: number | null
        }
        Update: {
          academy_id?: string
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          evidence_id?: string
          evidence_summary?: string | null
          evidence_type?: string
          gate_id?: string | null
          id?: string
          is_parent_safe?: boolean
          player_id?: string
          player_requirement_progress_id?: string | null
          requirement_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "requirement_evidence_links_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_evidence_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_evidence_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "requirement_evidence_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "requirement_evidence_links_gate_id_fkey"
            columns: ["gate_id"]
            isOneToOne: false
            referencedRelation: "curriculum_gates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_evidence_links_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_evidence_links_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "requirement_evidence_links_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "requirement_evidence_links_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "requirement_evidence_links_player_requirement_progress_id_fkey"
            columns: ["player_requirement_progress_id"]
            isOneToOne: false
            referencedRelation: "player_requirement_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_evidence_links_player_requirement_progress_id_fkey"
            columns: ["player_requirement_progress_id"]
            isOneToOne: false
            referencedRelation: "v_player_requirement_progress_detail"
            referencedColumns: ["progress_id"]
          },
          {
            foreignKeyName: "requirement_evidence_links_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "curriculum_track_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      session_adjustment_suggestions: {
        Row: {
          academy_curriculum_version_id: string | null
          academy_id: string
          applied_at: string | null
          applied_by: string | null
          approved_at: string | null
          approved_by: string | null
          confidence: string
          created_at: string
          created_by: string | null
          curriculum_context: Json
          curriculum_level_id: string | null
          group_id: string | null
          id: string
          player_needs_considered: Json
          players_supported: Json
          reason: string
          risk_level: string
          scope: string
          session_id: string
          source_template_id: string | null
          status: string
          suggested_change: string
          suggestion_type: string
          target_session_block_id: string | null
        }
        Insert: {
          academy_curriculum_version_id?: string | null
          academy_id: string
          applied_at?: string | null
          applied_by?: string | null
          approved_at?: string | null
          approved_by?: string | null
          confidence?: string
          created_at?: string
          created_by?: string | null
          curriculum_context?: Json
          curriculum_level_id?: string | null
          group_id?: string | null
          id?: string
          player_needs_considered?: Json
          players_supported?: Json
          reason: string
          risk_level?: string
          scope?: string
          session_id: string
          source_template_id?: string | null
          status?: string
          suggested_change: string
          suggestion_type: string
          target_session_block_id?: string | null
        }
        Update: {
          academy_curriculum_version_id?: string | null
          academy_id?: string
          applied_at?: string | null
          applied_by?: string | null
          approved_at?: string | null
          approved_by?: string | null
          confidence?: string
          created_at?: string
          created_by?: string | null
          curriculum_context?: Json
          curriculum_level_id?: string | null
          group_id?: string | null
          id?: string
          player_needs_considered?: Json
          players_supported?: Json
          reason?: string
          risk_level?: string
          scope?: string
          session_id?: string
          source_template_id?: string | null
          status?: string
          suggested_change?: string
          suggestion_type?: string
          target_session_block_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_adjustment_suggestions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_adjustment_suggestions_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_adjustment_suggestions_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "session_adjustment_suggestions_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "session_adjustment_suggestions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_adjustment_suggestions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "session_adjustment_suggestions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "session_adjustment_suggestions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_adjustment_suggestions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "session_adjustment_suggestions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "session_adjustment_suggestions_curriculum_level_id_fkey"
            columns: ["curriculum_level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_adjustment_suggestions_curriculum_level_id_fkey"
            columns: ["curriculum_level_id"]
            isOneToOne: false
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "session_adjustment_suggestions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_adjustment_suggestions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "session_adjustment_suggestions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "session_adjustment_suggestions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_adjustment_suggestions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_session_load"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "session_adjustment_suggestions_source_template_id_fkey"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_adjustment_suggestions_source_template_id_fkey"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "v_session_recommendation_feed"
            referencedColumns: ["suggested_template_id"]
          },
          {
            foreignKeyName: "session_adjustment_suggestions_target_session_block_id_fkey"
            columns: ["target_session_block_id"]
            isOneToOne: false
            referencedRelation: "session_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      session_attendance: {
        Row: {
          id: string
          marked_at: string
          marked_by: string | null
          notes: string | null
          player_id: string
          session_id: string
          status: string
        }
        Insert: {
          id?: string
          marked_at?: string
          marked_by?: string | null
          notes?: string | null
          player_id: string
          session_id: string
          status?: string
        }
        Update: {
          id?: string
          marked_at?: string
          marked_by?: string | null
          notes?: string | null
          player_id?: string
          session_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "session_attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "session_attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "session_attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "session_attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_session_load"
            referencedColumns: ["session_id"]
          },
        ]
      }
      session_block_exercises: {
        Row: {
          block_id: string
          completed: boolean
          duration_min: number | null
          exercise_id: string
          id: string
          notes: string | null
          order_index: number
        }
        Insert: {
          block_id: string
          completed?: boolean
          duration_min?: number | null
          exercise_id: string
          id?: string
          notes?: string | null
          order_index: number
        }
        Update: {
          block_id?: string
          completed?: boolean
          duration_min?: number | null
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_block_exercises_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "session_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_block_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      session_blocks: {
        Row: {
          actual_status: string
          duration_min: number
          id: string
          intensity: number | null
          is_override: boolean
          name: string
          notes: string | null
          order_index: number
          session_id: string
          template_block_id: string | null
          type: Database["public"]["Enums"]["block_type"]
          updated_at: string
        }
        Insert: {
          actual_status?: string
          duration_min: number
          id?: string
          intensity?: number | null
          is_override?: boolean
          name: string
          notes?: string | null
          order_index: number
          session_id: string
          template_block_id?: string | null
          type: Database["public"]["Enums"]["block_type"]
          updated_at?: string
        }
        Update: {
          actual_status?: string
          duration_min?: number
          id?: string
          intensity?: number | null
          is_override?: boolean
          name?: string
          notes?: string | null
          order_index?: number
          session_id?: string
          template_block_id?: string | null
          type?: Database["public"]["Enums"]["block_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_blocks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_blocks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_session_load"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "session_blocks_template_block_id_fkey"
            columns: ["template_block_id"]
            isOneToOne: false
            referencedRelation: "template_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      session_recommendations: {
        Row: {
          academy_id: string
          coaching_cues: string[] | null
          created_at: string
          executed_session_id: string | null
          focus_block_types: Database["public"]["Enums"]["block_type"][] | null
          focus_exercise_ids: string[] | null
          focus_exercise_tags: string[] | null
          id: string
          outcome_id: string | null
          player_id: string
          priority_id: string | null
          rationale: string | null
          recommendation_id: string
          session_type: string
          signal_ids: string[] | null
          status: string
          suggested_template_id: string | null
          target_date: string | null
          target_duration_min: number | null
          target_intensity: number | null
          title: string
          updated_at: string
        }
        Insert: {
          academy_id: string
          coaching_cues?: string[] | null
          created_at?: string
          executed_session_id?: string | null
          focus_block_types?: Database["public"]["Enums"]["block_type"][] | null
          focus_exercise_ids?: string[] | null
          focus_exercise_tags?: string[] | null
          id?: string
          outcome_id?: string | null
          player_id: string
          priority_id?: string | null
          rationale?: string | null
          recommendation_id: string
          session_type: string
          signal_ids?: string[] | null
          status?: string
          suggested_template_id?: string | null
          target_date?: string | null
          target_duration_min?: number | null
          target_intensity?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          academy_id?: string
          coaching_cues?: string[] | null
          created_at?: string
          executed_session_id?: string | null
          focus_block_types?: Database["public"]["Enums"]["block_type"][] | null
          focus_exercise_ids?: string[] | null
          focus_exercise_tags?: string[] | null
          id?: string
          outcome_id?: string | null
          player_id?: string
          priority_id?: string | null
          rationale?: string | null
          recommendation_id?: string
          session_type?: string
          signal_ids?: string[] | null
          status?: string
          suggested_template_id?: string | null
          target_date?: string | null
          target_duration_min?: number | null
          target_intensity?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_recommendations_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_recommendations_executed_session_id_fkey"
            columns: ["executed_session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_recommendations_executed_session_id_fkey"
            columns: ["executed_session_id"]
            isOneToOne: false
            referencedRelation: "v_session_load"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "session_recommendations_outcome_id_fkey"
            columns: ["outcome_id"]
            isOneToOne: false
            referencedRelation: "player_outcomes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "session_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "session_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "session_recommendations_priority_id_fkey"
            columns: ["priority_id"]
            isOneToOne: false
            referencedRelation: "player_priorities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_recommendations_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "player_recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_recommendations_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "v_player_development_loop"
            referencedColumns: ["recommendation_id"]
          },
          {
            foreignKeyName: "session_recommendations_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "v_recommendation_review_queue"
            referencedColumns: ["recommendation_id"]
          },
          {
            foreignKeyName: "session_recommendations_suggested_template_id_fkey"
            columns: ["suggested_template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_recommendations_suggested_template_id_fkey"
            columns: ["suggested_template_id"]
            isOneToOne: false
            referencedRelation: "v_session_recommendation_feed"
            referencedColumns: ["suggested_template_id"]
          },
        ]
      }
      sessions: {
        Row: {
          academy_id: string
          ai_pre_brief: string | null
          coach_id: string
          created_at: string
          created_by: string | null
          duration_min: number | null
          group_id: string | null
          id: string
          location: string | null
          name: string | null
          scheduled_date: string
          scheduled_time: string | null
          session_notes: string | null
          status: Database["public"]["Enums"]["session_status"]
          template_id: string | null
          updated_at: string
          voice_command_id: string | null
        }
        Insert: {
          academy_id: string
          ai_pre_brief?: string | null
          coach_id: string
          created_at?: string
          created_by?: string | null
          duration_min?: number | null
          group_id?: string | null
          id?: string
          location?: string | null
          name?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          session_notes?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          template_id?: string | null
          updated_at?: string
          voice_command_id?: string | null
        }
        Update: {
          academy_id?: string
          ai_pre_brief?: string | null
          coach_id?: string
          created_at?: string
          created_by?: string | null
          duration_min?: number | null
          group_id?: string | null
          id?: string
          location?: string | null
          name?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          session_notes?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          template_id?: string | null
          updated_at?: string
          voice_command_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "v_session_recommendation_feed"
            referencedColumns: ["suggested_template_id"]
          },
        ]
      }
      signal_effectiveness_scores: {
        Row: {
          academy_id: string
          avg_score_delta: number | null
          computed_at: string
          effectiveness_score: number
          id: string
          negative_rate: number
          override_rate: number
          positive_rate: number
          sample_count: number
          signal_type: Database["public"]["Enums"]["signal_type"]
          suggested_weight: number | null
        }
        Insert: {
          academy_id: string
          avg_score_delta?: number | null
          computed_at?: string
          effectiveness_score?: number
          id?: string
          negative_rate?: number
          override_rate?: number
          positive_rate?: number
          sample_count?: number
          signal_type: Database["public"]["Enums"]["signal_type"]
          suggested_weight?: number | null
        }
        Update: {
          academy_id?: string
          avg_score_delta?: number | null
          computed_at?: string
          effectiveness_score?: number
          id?: string
          negative_rate?: number
          override_rate?: number
          positive_rate?: number
          sample_count?: number
          signal_type?: Database["public"]["Enums"]["signal_type"]
          suggested_weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "signal_effectiveness_scores_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_priority_weights: {
        Row: {
          academy_id: string
          critical_multiplier: number
          high_multiplier: number
          id: string
          is_active: boolean
          low_multiplier: number
          medium_multiplier: number
          min_confidence: number
          signal_type: Database["public"]["Enums"]["signal_type"]
          updated_at: string
          weight: number
        }
        Insert: {
          academy_id: string
          critical_multiplier?: number
          high_multiplier?: number
          id?: string
          is_active?: boolean
          low_multiplier?: number
          medium_multiplier?: number
          min_confidence?: number
          signal_type: Database["public"]["Enums"]["signal_type"]
          updated_at?: string
          weight?: number
        }
        Update: {
          academy_id?: string
          critical_multiplier?: number
          high_multiplier?: number
          id?: string
          is_active?: boolean
          low_multiplier?: number
          medium_multiplier?: number
          min_confidence?: number
          signal_type?: Database["public"]["Enums"]["signal_type"]
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "signal_priority_weights_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_domains: {
        Row: {
          created_at: string | null
          display_name: string
          domain: Database["public"]["Enums"]["skill_domain_type"]
          id: string
          short_desc: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          display_name: string
          domain: Database["public"]["Enums"]["skill_domain_type"]
          id?: string
          short_desc: string
          sort_order: number
        }
        Update: {
          created_at?: string | null
          display_name?: string
          domain?: Database["public"]["Enums"]["skill_domain_type"]
          id?: string
          short_desc?: string
          sort_order?: number
        }
        Relationships: []
      }
      skill_progressions: {
        Row: {
          created_at: string | null
          description: string
          domain: Database["public"]["Enums"]["skill_domain_type"]
          domain_weight: number
          failure_patterns: string[]
          id: string
          level_id: string
          mastery_outcome_threshold: number
          outcome_confirmations: string[]
          signal_indicators: string[]
          success_criteria: string[]
        }
        Insert: {
          created_at?: string | null
          description: string
          domain: Database["public"]["Enums"]["skill_domain_type"]
          domain_weight?: number
          failure_patterns?: string[]
          id?: string
          level_id: string
          mastery_outcome_threshold?: number
          outcome_confirmations?: string[]
          signal_indicators?: string[]
          success_criteria?: string[]
        }
        Update: {
          created_at?: string | null
          description?: string
          domain?: Database["public"]["Enums"]["skill_domain_type"]
          domain_weight?: number
          failure_patterns?: string[]
          id?: string
          level_id?: string
          mastery_outcome_threshold?: number
          outcome_confirmations?: string[]
          signal_indicators?: string[]
          success_criteria?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "skill_progressions_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_progressions_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
        ]
      }
      system_usage_metrics: {
        Row: {
          academy_id: string
          active_model_version_id: string | null
          active_player_count: number
          approval_rate_7d: number | null
          coaching_messages_generated: number
          coaching_messages_sent: number
          engine_runs_total: number
          id: string
          metric_date: string
          override_rate_7d: number | null
          players_scored: number
          players_with_recs: number
          players_with_signals: number
          recommendations_approved: number
          recommendations_expired: number
          recommendations_generated: number
          recommendations_overridden: number
          recorded_at: string
          signals_emitted: number
          signals_resolved: number
        }
        Insert: {
          academy_id: string
          active_model_version_id?: string | null
          active_player_count?: number
          approval_rate_7d?: number | null
          coaching_messages_generated?: number
          coaching_messages_sent?: number
          engine_runs_total?: number
          id?: string
          metric_date: string
          override_rate_7d?: number | null
          players_scored?: number
          players_with_recs?: number
          players_with_signals?: number
          recommendations_approved?: number
          recommendations_expired?: number
          recommendations_generated?: number
          recommendations_overridden?: number
          recorded_at?: string
          signals_emitted?: number
          signals_resolved?: number
        }
        Update: {
          academy_id?: string
          active_model_version_id?: string | null
          active_player_count?: number
          approval_rate_7d?: number | null
          coaching_messages_generated?: number
          coaching_messages_sent?: number
          engine_runs_total?: number
          id?: string
          metric_date?: string
          override_rate_7d?: number | null
          players_scored?: number
          players_with_recs?: number
          players_with_signals?: number
          recommendations_approved?: number
          recommendations_expired?: number
          recommendations_generated?: number
          recommendations_overridden?: number
          recorded_at?: string
          signals_emitted?: number
          signals_resolved?: number
        }
        Relationships: [
          {
            foreignKeyName: "system_usage_metrics_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_usage_metrics_active_model_version_id_fkey"
            columns: ["active_model_version_id"]
            isOneToOne: false
            referencedRelation: "model_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      template_block_exercises: {
        Row: {
          block_id: string
          category: string | null
          coaching_cue: string | null
          duration_min: number | null
          equipment: string | null
          exercise_id: string
          exercise_label: string | null
          id: string
          load_level: string | null
          notes: string | null
          order_index: number
          progression: string | null
          regression: string | null
          sets_reps_duration: string | null
          source_snapshot: Json
          tennis_transfer: string | null
        }
        Insert: {
          block_id: string
          category?: string | null
          coaching_cue?: string | null
          duration_min?: number | null
          equipment?: string | null
          exercise_id: string
          exercise_label?: string | null
          id?: string
          load_level?: string | null
          notes?: string | null
          order_index: number
          progression?: string | null
          regression?: string | null
          sets_reps_duration?: string | null
          source_snapshot?: Json
          tennis_transfer?: string | null
        }
        Update: {
          block_id?: string
          category?: string | null
          coaching_cue?: string | null
          duration_min?: number | null
          equipment?: string | null
          exercise_id?: string
          exercise_label?: string | null
          id?: string
          load_level?: string | null
          notes?: string | null
          order_index?: number
          progression?: string | null
          regression?: string | null
          sets_reps_duration?: string | null
          source_snapshot?: Json
          tennis_transfer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_block_exercises_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "template_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_block_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      template_blocks: {
        Row: {
          coach_watch_for: string | null
          created_at: string
          curriculum_connection: string | null
          duration_min: number
          fitness_block_type: string | null
          id: string
          intensity: number | null
          intensity_level: string | null
          load_level: string | null
          name: string
          notes: string | null
          order_index: number
          source_snapshot: Json
          template_id: string
          type: Database["public"]["Enums"]["block_type"]
        }
        Insert: {
          coach_watch_for?: string | null
          created_at?: string
          curriculum_connection?: string | null
          duration_min: number
          fitness_block_type?: string | null
          id?: string
          intensity?: number | null
          intensity_level?: string | null
          load_level?: string | null
          name: string
          notes?: string | null
          order_index: number
          source_snapshot?: Json
          template_id: string
          type: Database["public"]["Enums"]["block_type"]
        }
        Update: {
          coach_watch_for?: string | null
          created_at?: string
          curriculum_connection?: string | null
          duration_min?: number
          fitness_block_type?: string | null
          id?: string
          intensity?: number | null
          intensity_level?: string | null
          load_level?: string | null
          name?: string
          notes?: string | null
          order_index?: number
          source_snapshot?: Json
          template_id?: string
          type?: Database["public"]["Enums"]["block_type"]
        }
        Relationships: [
          {
            foreignKeyName: "template_blocks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_blocks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "v_session_recommendation_feed"
            referencedColumns: ["suggested_template_id"]
          },
        ]
      }
      template_review_requests: {
        Row: {
          academy_id: string
          created_at: string
          id: string
          proposed_action_id: string | null
          request_type: string
          requested_by: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          template_draft: Json
          template_id: string | null
          updated_at: string
        }
        Insert: {
          academy_id: string
          created_at?: string
          id?: string
          proposed_action_id?: string | null
          request_type: string
          requested_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          template_draft?: Json
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          academy_id?: string
          created_at?: string
          id?: string
          proposed_action_id?: string | null
          request_type?: string
          requested_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          template_draft?: Json
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_review_requests_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_review_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_review_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "template_review_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "template_review_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_review_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "template_review_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "template_review_requests_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_review_requests_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "v_session_recommendation_feed"
            referencedColumns: ["suggested_template_id"]
          },
        ]
      }
      template_version_history: {
        Row: {
          academy_id: string
          change_type: string
          changed_by: string | null
          created_at: string
          id: string
          snapshot: Json
          template_id: string
          version_number: number
        }
        Insert: {
          academy_id: string
          change_type: string
          changed_by?: string | null
          created_at?: string
          id?: string
          snapshot?: Json
          template_id: string
          version_number: number
        }
        Update: {
          academy_id?: string
          change_type?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          snapshot?: Json
          template_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_version_history_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_version_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_version_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "template_version_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "template_version_history_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_version_history_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "v_session_recommendation_feed"
            referencedColumns: ["suggested_template_id"]
          },
        ]
      }
      templates: {
        Row: {
          academy_id: string
          approved_at: string | null
          approved_by: string | null
          archived_at: string | null
          created_at: string
          created_by: string | null
          curriculum_level_id: string | null
          curriculum_level_key: string | null
          curriculum_source_label: string | null
          curriculum_stage_key: string | null
          description: string | null
          group_id: string | null
          id: string
          is_active: boolean
          is_default: boolean
          level_id: string | null
          name: string
          pathway_focus: string | null
          status: string
          tags: string[] | null
          template_goal: string | null
          template_type: string | null
          total_duration_min: number | null
          track: Database["public"]["Enums"]["development_track"] | null
          updated_at: string
          voice_command_id: string | null
        }
        Insert: {
          academy_id: string
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          curriculum_level_id?: string | null
          curriculum_level_key?: string | null
          curriculum_source_label?: string | null
          curriculum_stage_key?: string | null
          description?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          level_id?: string | null
          name: string
          pathway_focus?: string | null
          status?: string
          tags?: string[] | null
          template_goal?: string | null
          template_type?: string | null
          total_duration_min?: number | null
          track?: Database["public"]["Enums"]["development_track"] | null
          updated_at?: string
          voice_command_id?: string | null
        }
        Update: {
          academy_id?: string
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          curriculum_level_id?: string | null
          curriculum_level_key?: string | null
          curriculum_source_label?: string | null
          curriculum_stage_key?: string | null
          description?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          level_id?: string | null
          name?: string
          pathway_focus?: string | null
          status?: string
          tags?: string[] | null
          template_goal?: string | null
          template_type?: string | null
          total_duration_min?: number | null
          track?: Database["public"]["Enums"]["development_track"] | null
          updated_at?: string
          voice_command_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "templates_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "templates_curriculum_level_id_fkey"
            columns: ["curriculum_level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_curriculum_level_id_fkey"
            columns: ["curriculum_level_id"]
            isOneToOne: false
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "templates_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "templates_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "templates_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "academy_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_commands: {
        Row: {
          academy_id: string
          audio_path: string | null
          context_snapshot: Json | null
          created_at: string
          id: string
          input_method: Database["public"]["Enums"]["voice_input_method"]
          intent_confidence: number | null
          issuer_id: string
          issuer_role: Database["public"]["Enums"]["user_role"]
          normalized_intent: Json | null
          processed_at: string | null
          processing_status: string
          raw_input: string
          requires_clarification: boolean
          transcript: string | null
        }
        Insert: {
          academy_id: string
          audio_path?: string | null
          context_snapshot?: Json | null
          created_at?: string
          id?: string
          input_method?: Database["public"]["Enums"]["voice_input_method"]
          intent_confidence?: number | null
          issuer_id: string
          issuer_role: Database["public"]["Enums"]["user_role"]
          normalized_intent?: Json | null
          processed_at?: string | null
          processing_status?: string
          raw_input: string
          requires_clarification?: boolean
          transcript?: string | null
        }
        Update: {
          academy_id?: string
          audio_path?: string | null
          context_snapshot?: Json | null
          created_at?: string
          id?: string
          input_method?: Database["public"]["Enums"]["voice_input_method"]
          intent_confidence?: number | null
          issuer_id?: string
          issuer_role?: Database["public"]["Enums"]["user_role"]
          normalized_intent?: Json | null
          processed_at?: string | null
          processing_status?: string
          raw_input?: string
          requires_clarification?: boolean
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_commands_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_commands_issuer_id_fkey"
            columns: ["issuer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_commands_issuer_id_fkey"
            columns: ["issuer_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "voice_commands_issuer_id_fkey"
            columns: ["issuer_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      voice_notes: {
        Row: {
          academy_id: string
          audio_path: string | null
          author_id: string
          created_at: string
          id: string
          parsed_observation_id: string | null
          player_id: string | null
          processing_status: string
          raw_input: string
          session_id: string | null
          transcript: string | null
        }
        Insert: {
          academy_id: string
          audio_path?: string | null
          author_id: string
          created_at?: string
          id?: string
          parsed_observation_id?: string | null
          player_id?: string | null
          processing_status?: string
          raw_input: string
          session_id?: string | null
          transcript?: string | null
        }
        Update: {
          academy_id?: string
          audio_path?: string | null
          author_id?: string
          created_at?: string
          id?: string
          parsed_observation_id?: string | null
          player_id?: string | null
          processing_status?: string
          raw_input?: string
          session_id?: string | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_notes_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "voice_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "voice_notes_parsed_observation_id_fkey"
            columns: ["parsed_observation_id"]
            isOneToOne: false
            referencedRelation: "coach_observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_notes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_notes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "voice_notes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "voice_notes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "voice_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_session_load"
            referencedColumns: ["session_id"]
          },
        ]
      }
      weight_change_history: {
        Row: {
          academy_id: string
          change_reason: string | null
          changed_at: string
          changed_by: string | null
          id: string
          new_critical_multiplier: number | null
          new_high_multiplier: number | null
          new_low_multiplier: number | null
          new_medium_multiplier: number | null
          new_min_confidence: number | null
          new_weight: number | null
          old_critical_multiplier: number | null
          old_high_multiplier: number | null
          old_low_multiplier: number | null
          old_medium_multiplier: number | null
          old_min_confidence: number | null
          old_weight: number | null
          signal_type: Database["public"]["Enums"]["signal_type"]
          source: string
        }
        Insert: {
          academy_id: string
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_critical_multiplier?: number | null
          new_high_multiplier?: number | null
          new_low_multiplier?: number | null
          new_medium_multiplier?: number | null
          new_min_confidence?: number | null
          new_weight?: number | null
          old_critical_multiplier?: number | null
          old_high_multiplier?: number | null
          old_low_multiplier?: number | null
          old_medium_multiplier?: number | null
          old_min_confidence?: number | null
          old_weight?: number | null
          signal_type: Database["public"]["Enums"]["signal_type"]
          source?: string
        }
        Update: {
          academy_id?: string
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_critical_multiplier?: number | null
          new_high_multiplier?: number | null
          new_low_multiplier?: number | null
          new_medium_multiplier?: number | null
          new_min_confidence?: number | null
          new_weight?: number | null
          old_critical_multiplier?: number | null
          old_high_multiplier?: number | null
          old_low_multiplier?: number | null
          old_medium_multiplier?: number | null
          old_min_confidence?: number | null
          old_weight?: number | null
          signal_type?: Database["public"]["Enums"]["signal_type"]
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "weight_change_history_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_change_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_change_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "weight_change_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
        ]
      }
    }
    Views: {
      v_academy_priority_queue: {
        Row: {
          academy_id: string | null
          composite_score: number | null
          current_phase: Database["public"]["Enums"]["player_phase"] | null
          fatigue_risk_label: string | null
          fatigue_risk_score: number | null
          full_name: string | null
          group_name: string | null
          high_severity_count: number | null
          is_constrained: boolean | null
          open_priority_count: number | null
          overall_score: number | null
          pending_review_count: number | null
          player_id: string | null
          primary_action: string | null
          scored_at: string | null
          signal_count: number | null
          urgency: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_coaching_messages_pending: {
        Row: {
          academy_id: string | null
          audience: Database["public"]["Enums"]["message_audience"] | null
          coaching_focus: string | null
          created_at: string | null
          detailed_message: string | null
          edited_short_message: string | null
          first_name: string | null
          id: string | null
          is_reviewed: boolean | null
          last_name: string | null
          player_id: string | null
          recommendation_id: string | null
          recommendation_type: string | null
          recommendation_urgency: string | null
          short_message: string | null
          tone: Database["public"]["Enums"]["message_tone"] | null
        }
        Relationships: [
          {
            foreignKeyName: "coaching_messages_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_messages_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_messages_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "coaching_messages_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "coaching_messages_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "coaching_messages_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "player_recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_messages_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "v_player_development_loop"
            referencedColumns: ["recommendation_id"]
          },
          {
            foreignKeyName: "coaching_messages_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "v_recommendation_review_queue"
            referencedColumns: ["recommendation_id"]
          },
        ]
      }
      v_cohort_overview: {
        Row: {
          academy_id: string | null
          active_member_count: number | null
          avg_overall_score: number | null
          avg_utr_rating: number | null
          cohort_id: string | null
          cohort_type: Database["public"]["Enums"]["cohort_type"] | null
          common_priority_categories: string[] | null
          common_signal_types: string[] | null
          computed_at: string | null
          criteria: Json | null
          member_count: number | null
          name: string | null
          p25_overall_score: number | null
          p75_overall_score: number | null
          recommendation_success_rate: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_cohorts_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_curriculum_level_requirements: {
        Row: {
          blocking_signal_types: string[] | null
          level_id: string | null
          level_name: string | null
          level_number: number | null
          min_assessment_score: number | null
          min_domains_mastered: number | null
          min_total_outcomes: number | null
          min_weeks_at_level: number | null
          requires_director_approval: boolean | null
          requires_final_assessment: boolean | null
          sort_order: number | null
          stage: Database["public"]["Enums"]["curriculum_stage"] | null
          stage_name: string | null
        }
        Relationships: []
      }
      v_curriculum_overview: {
        Row: {
          academy_id: string | null
          advancement_blocked_by: string[] | null
          advancement_eligible: boolean | null
          created_at: string | null
          current_level_id: string | null
          curriculum_state_id: string | null
          display_name: string | null
          last_evaluated_at: string | null
          level_name: string | null
          level_number: number | null
          level_sort_order: number | null
          player_id: string | null
          stage: Database["public"]["Enums"]["curriculum_stage"] | null
          stage_name: string | null
          stage_sort_order: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_curriculum_states_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_curriculum_states_current_level_id_fkey"
            columns: ["current_level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_curriculum_states_current_level_id_fkey"
            columns: ["current_level_id"]
            isOneToOne: false
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "player_curriculum_states_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_curriculum_states_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_curriculum_states_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_curriculum_states_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      v_flywheel_dashboard: {
        Row: {
          academy_id: string | null
          avg_score_delta: number | null
          computed_at: string | null
          current_weight: number | null
          effectiveness_score: number | null
          override_rate: number | null
          positive_rate: number | null
          sample_count: number | null
          signal_type: Database["public"]["Enums"]["signal_type"] | null
          suggested_weight: number | null
        }
        Relationships: [
          {
            foreignKeyName: "signal_effectiveness_scores_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_group_summary: {
        Row: {
          academy_id: string | null
          avg_overall_score: number | null
          capacity_pct: number | null
          group_id: string | null
          group_name: string | null
          lead_coach_id: string | null
          lead_coach_name: string | null
          level_label: string | null
          max_players: number | null
          overdue_reassessments: number | null
          player_count: number | null
          track: Database["public"]["Enums"]["development_track"] | null
          upcoming_assessments: number | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_learning_system_summary: {
        Row: {
          academy_id: string | null
          avg_score_delta: number | null
          better_outcomes: number | null
          inconclusive: number | null
          last_override_at: string | null
          neutral_outcomes: number | null
          original_rec_type: string | null
          pct_override_better: number | null
          total_overrides: number | null
          worse_outcomes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_overrides_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_pending_proposed_actions: {
        Row: {
          academy_id: string | null
          action_id: string | null
          action_label: string | null
          action_type: Database["public"]["Enums"]["action_type"] | null
          affected_count: number | null
          created_at: string | null
          expires_at: string | null
          hours_remaining: number | null
          issuer_role: Database["public"]["Enums"]["user_role"] | null
          original_voice_input: string | null
          proposed_by_name: string | null
          risk_level: string | null
          status: Database["public"]["Enums"]["proposed_action_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "proposed_actions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_player_benchmark_dashboard: {
        Row: {
          academy_id: string | null
          benchmark_name: string | null
          benchmark_type: Database["public"]["Enums"]["benchmark_type"] | null
          computed_at: string | null
          expected_score_max: number | null
          expected_score_min: number | null
          first_name: string | null
          last_name: string | null
          player_id: string | null
          player_overall_score: number | null
          player_utr_rating: number | null
          score_gap: number | null
          utr_gap: number | null
          verdict: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_benchmark_results_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_benchmark_results_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_benchmark_results_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_benchmark_results_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_benchmark_results_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      v_player_curriculum_detail: {
        Row: {
          academy_id: string | null
          advancement_blocked_by: string[] | null
          advancement_eligible: boolean | null
          current_level_id: string | null
          current_level_name: string | null
          domain: Database["public"]["Enums"]["skill_domain_type"] | null
          domain_weight: number | null
          failure_patterns: string[] | null
          last_evaluated_at: string | null
          mastered_at: string | null
          mastery_outcome_threshold: number | null
          outcome_confirmations: string[] | null
          outcome_count: number | null
          player_id: string | null
          positive_outcome_count: number | null
          progression_description: string | null
          regression_detected_at: string | null
          signal_indicators: string[] | null
          stage: Database["public"]["Enums"]["curriculum_stage"] | null
          stage_name: string | null
          status: Database["public"]["Enums"]["progression_status"] | null
          success_criteria: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "player_curriculum_states_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_curriculum_states_current_level_id_fkey"
            columns: ["current_level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_curriculum_states_current_level_id_fkey"
            columns: ["current_level_id"]
            isOneToOne: false
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "player_curriculum_states_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_curriculum_states_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_curriculum_states_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_curriculum_states_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      v_player_development_loop: {
        Row: {
          academy_id: string | null
          composite_score: number | null
          confidence_score: number | null
          executed_session_id: string | null
          expires_at: string | null
          generated_at: string | null
          group_name: string | null
          outcome_verdict: string | null
          override_type: string | null
          performance_rating: number | null
          plan_achieved: boolean | null
          player_id: string | null
          player_name: string | null
          priority_category:
            | Database["public"]["Enums"]["priority_category"]
            | null
          priority_level: string | null
          priority_rank: number | null
          priority_title: string | null
          recommendation_id: string | null
          recommendation_status:
            | Database["public"]["Enums"]["recommendation_status"]
            | null
          recommendation_title: string | null
          recommendation_type: string | null
          session_rec_status: string | null
          session_rec_title: string | null
          session_type: string | null
          signal_count: number | null
          target_date: string | null
          urgency: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_recommendations_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "session_recommendations_executed_session_id_fkey"
            columns: ["executed_session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_recommendations_executed_session_id_fkey"
            columns: ["executed_session_id"]
            isOneToOne: false
            referencedRelation: "v_session_load"
            referencedColumns: ["session_id"]
          },
        ]
      }
      v_player_predictions_latest: {
        Row: {
          academy_id: string | null
          first_name: string | null
          generated_at: string | null
          id: string | null
          injury_risk_label: string | null
          injury_risk_score: number | null
          last_name: string | null
          model_inputs: Json | null
          player_id: string | null
          predicted_performance_score: number | null
          prediction_confidence: number | null
          prediction_horizon_days: number | null
          prediction_summary: string | null
          readiness_label: string | null
          readiness_score: number | null
          risk_factors: Json | null
          uplift_factors: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "player_predictions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_predictions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_predictions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_predictions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_predictions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      v_player_requirement_progress_detail: {
        Row: {
          academy_id: string | null
          curriculum_level_id: string | null
          domain_display_order: number | null
          evidence_count: number | null
          is_parent_visible: boolean | null
          is_player_visible: boolean | null
          is_required: boolean | null
          last_evidence_at: string | null
          level_display_name: string | null
          level_number: number | null
          player_id: string | null
          progress_id: string | null
          progress_value: number | null
          requirement_description: string | null
          requirement_display_order: number | null
          requirement_domain_key: string | null
          requirement_domain_label: string | null
          requirement_id: string | null
          requirement_title: string | null
          requirement_type: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_requirement_progress_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_requirement_progress_curriculum_level_id_fkey"
            columns: ["curriculum_level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_requirement_progress_curriculum_level_id_fkey"
            columns: ["curriculum_level_id"]
            isOneToOne: false
            referencedRelation: "v_curriculum_level_requirements"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "player_requirement_progress_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_requirement_progress_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_requirement_progress_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_requirement_progress_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_requirement_progress_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "curriculum_track_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      v_player_signal_dashboard: {
        Row: {
          academy_id: string | null
          confidence: number | null
          data: Json | null
          description: string | null
          domain: Database["public"]["Enums"]["development_track"] | null
          emitted_at: string | null
          expires_at: string | null
          group_name: string | null
          player_decision_score: number | null
          player_id: string | null
          player_name: string | null
          player_urgency: string | null
          processed_by_engine: boolean | null
          recommended_action: string | null
          severity: string | null
          signal_id: string | null
          signal_type: Database["public"]["Enums"]["signal_type"] | null
          source: Database["public"]["Enums"]["signal_source"] | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_development_signals_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_development_signals_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_development_signals_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_development_signals_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_development_signals_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      v_player_summary: {
        Row: {
          academy_id: string | null
          age: number | null
          assessment_status: string | null
          behavioral_score: number | null
          coach_id: string | null
          coach_name: string | null
          competition_score: number | null
          current_track: Database["public"]["Enums"]["development_track"] | null
          date_of_birth: string | null
          focus_areas: string[] | null
          full_name: string | null
          gender: string | null
          group_id: string | null
          group_name: string | null
          last_assessed_at: string | null
          level_label: string | null
          level_number: number | null
          movement_score: number | null
          next_assessment_due: string | null
          overall_score: number | null
          player_id: string | null
          player_status: Database["public"]["Enums"]["player_status"] | null
          promotion_ready: boolean | null
          score_delta: number | null
          tactical_score: number | null
          technical_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_player_time_series_recent: {
        Row: {
          academy_id: string | null
          metric: Database["public"]["Enums"]["time_series_metric"] | null
          player_id: string | null
          recency_rank: number | null
          recorded_date: string | null
          source_type: string | null
          value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_time_series_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_time_series_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_time_series_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_time_series_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_time_series_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      v_reassessment_pipeline: {
        Row: {
          academy_id: string | null
          coach_name: string | null
          current_track: Database["public"]["Enums"]["development_track"] | null
          days_overdue: number | null
          full_name: string | null
          group_name: string | null
          last_assessed_at: string | null
          next_assessment_due: string | null
          overall_score: number | null
          player_id: string | null
          urgency: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_recent_audit_log: {
        Row: {
          academy_id: string | null
          action: string | null
          actor_name: string | null
          actor_role: Database["public"]["Enums"]["user_role"] | null
          created_at: string | null
          id: string | null
          payload: Json | null
          source_type: string | null
          target_id: string | null
          target_label: string | null
          target_type: string | null
        }
        Relationships: []
      }
      v_recommendation_review_queue: {
        Row: {
          academy_id: string | null
          composite_score: number | null
          confidence_score: number | null
          current_score: number | null
          expires_at: string | null
          fatigue_risk_label: string | null
          generated_at: string | null
          group_name: string | null
          hours_remaining: number | null
          player_id: string | null
          player_name: string | null
          primary_action: string | null
          priority_category:
            | Database["public"]["Enums"]["priority_category"]
            | null
          priority_level: string | null
          recommendation_id: string | null
          recommendation_type: string | null
          relevant_dimension: string | null
          title: string | null
          urgency: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_recommendations_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      v_session_load: {
        Row: {
          academy_id: string | null
          block_count: number | null
          coach_id: string | null
          coach_name: string | null
          competition_avg_intensity: number | null
          fitness_avg_intensity: number | null
          group_id: string | null
          group_name: string | null
          is_overload: boolean | null
          overall_avg_intensity: number | null
          scheduled_date: string | null
          session_id: string | null
          skill_avg_intensity: number | null
          status: Database["public"]["Enums"]["session_status"] | null
          total_duration_min: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["lead_coach_id"]
          },
          {
            foreignKeyName: "sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "v_group_summary"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["group_id"]
          },
        ]
      }
      v_session_recommendation_feed: {
        Row: {
          academy_id: string | null
          coaching_cues: string[] | null
          focus_block_types: Database["public"]["Enums"]["block_type"][] | null
          focus_exercise_tags: string[] | null
          group_name: string | null
          player_id: string | null
          player_name: string | null
          priority_level: string | null
          rationale: string | null
          recommendation_title: string | null
          recommendation_urgency: string | null
          session_rec_id: string | null
          session_type: string | null
          status: string | null
          suggested_template_id: string | null
          suggested_template_name: string | null
          target_date: string | null
          target_duration_min: number | null
          target_intensity: number | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_recommendations_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_academy_priority_queue"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "session_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_player_summary"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "session_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "v_reassessment_pipeline"
            referencedColumns: ["player_id"]
          },
        ]
      }
      v_weight_change_history: {
        Row: {
          academy_id: string | null
          change_reason: string | null
          changed_at: string | null
          changed_by_name: string | null
          new_high_multiplier: number | null
          new_weight: number | null
          old_high_multiplier: number | null
          old_weight: number | null
          signal_type: Database["public"]["Enums"]["signal_type"] | null
          source: string | null
          weight_delta: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weight_change_history_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      apply_director_configuration: {
        Args: { p_applier_id: string; p_config_id: string }
        Returns: Json
      }
      assign_player_curriculum_state: {
        Args: { p_academy_id: string; p_level_id?: string; p_player_id: string }
        Returns: string
      }
      assign_player_to_cohorts: {
        Args: { p_academy_id: string; p_player_id: string }
        Returns: number
      }
      auth_academy_id: { Args: never; Returns: string }
      auth_has_role: {
        Args: { check_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      auth_is_director_or_head: { Args: never; Returns: boolean }
      auth_is_staff: { Args: never; Returns: boolean }
      auth_profile_id: { Args: never; Returns: string }
      build_recommendation_reasoning: {
        Args: { p_recommendation_id: string }
        Returns: string
      }
      compute_cohort_stats: { Args: { p_cohort_id: string }; Returns: boolean }
      compute_exercise_effectiveness: {
        Args: { p_academy_id: string }
        Returns: number
      }
      compute_load_adjustment_factor: {
        Args: { p_fatigue_sensitivity: number; p_recovery_rate: string }
        Returns: number
      }
      compute_player_benchmarks: {
        Args: { p_academy_id: string; p_player_id: string }
        Returns: Json
      }
      compute_player_load: {
        Args: { p_academy_id: string; p_player_id: string }
        Returns: number
      }
      compute_signal_effectiveness: {
        Args: { p_academy_id: string }
        Returns: number
      }
      create_session_from_template: {
        Args: { p_session_id: string; p_template_id: string }
        Returns: number
      }
      emit_signal: {
        Args: {
          p_academy_id: string
          p_confidence?: number
          p_cooldown_hours?: number
          p_data?: Json
          p_description?: string
          p_domain?: Database["public"]["Enums"]["development_track"]
          p_expires_at?: string
          p_player_id: string
          p_recommended_action?: string
          p_severity?: string
          p_signal_type: Database["public"]["Enums"]["signal_type"]
          p_source: Database["public"]["Enums"]["signal_source"]
          p_source_object_id?: string
          p_source_object_type?: string
          p_title: string
        }
        Returns: string
      }
      evaluate_behavior_profile: {
        Args: { p_academy_id: string; p_player_id: string }
        Returns: boolean
      }
      evaluate_model_performance: {
        Args: {
          p_academy_id: string
          p_period_end: string
          p_period_start: string
          p_version_id?: string
        }
        Returns: string
      }
      evaluate_overrides: { Args: never; Returns: number }
      evaluate_player_curriculum_advancement: {
        Args: { p_academy_id: string; p_player_id: string }
        Returns: boolean
      }
      execute_approved_action: {
        Args: { p_action_id: string; p_executor_id: string }
        Returns: Json
      }
      expire_proposed_actions: { Args: never; Returns: undefined }
      expire_stale_signals: { Args: never; Returns: number }
      finalize_player_placement: {
        Args: { p_activator_id: string; p_recommendation_id: string }
        Returns: Json
      }
      flag_overdue_reassessments: { Args: never; Returns: number }
      generate_coaching_message: {
        Args: { p_recommendation_id: string }
        Returns: string
      }
      generate_player_predictions: {
        Args: {
          p_academy_id: string
          p_horizon_days?: number
          p_player_id: string
        }
        Returns: string
      }
      generate_player_priorities: {
        Args: { p_academy_id: string; p_player_id: string }
        Returns: number
      }
      generate_player_recommendations: {
        Args: {
          p_academy_id: string
          p_player_id: string
          p_reviewer_required?: boolean
        }
        Returns: Json
      }
      get_academy_thresholds: { Args: { p_academy_id: string }; Returns: Json }
      get_cohort_comparison: {
        Args: { p_academy_id: string; p_player_id: string }
        Returns: Json
      }
      get_default_curriculum_level: { Args: never; Returns: string }
      get_exercises_for_signal: {
        Args: {
          p_academy_id: string
          p_limit?: number
          p_player_id: string
          p_signal_type: Database["public"]["Enums"]["signal_type"]
        }
        Returns: {
          category: Database["public"]["Enums"]["exercise_category"]
          duration_min: number
          exercise_id: string
          exercise_name: string
          load_type: string
          mechanism: string
          relevance_score: number
          transfer_level: string
        }[]
      }
      get_player_phase: {
        Args: { p_player_id: string }
        Returns: Database["public"]["Enums"]["player_phase"]
      }
      get_threshold: {
        Args: { p_academy_id: string; p_default?: number; p_key: string }
        Returns: number
      }
      log_decision_cycle: {
        Args: {
          p_academy_id: string
          p_decision_score_id: string
          p_player_id: string
          p_recommendation_ids: string[]
        }
        Returns: string
      }
      populate_session_rec_exercises: {
        Args: { p_session_rec_id: string }
        Returns: number
      }
      process_player_outcomes: { Args: { p_session_id: string }; Returns: Json }
      process_utr_update: { Args: { p_history_id: string }; Returns: Json }
      propose_weight_adjustments: {
        Args: { p_academy_id: string }
        Returns: Json
      }
      record_recommendation_override: {
        Args: {
          p_eval_window_days?: number
          p_overridden_by: string
          p_override_action: string
          p_override_reason: string
          p_override_type: string
          p_recommendation_id: string
        }
        Returns: string
      }
      record_time_series_point: {
        Args: {
          p_academy_id: string
          p_date?: string
          p_metric: Database["public"]["Enums"]["time_series_metric"]
          p_player_id: string
          p_source_id?: string
          p_source_type?: string
          p_value: number
        }
        Returns: undefined
      }
      record_usage_metrics: { Args: { p_academy_id: string }; Returns: string }
      resolve_signal: {
        Args: {
          p_resolution_note?: string
          p_resolved_by: string
          p_signal_id: string
        }
        Returns: undefined
      }
      run_academy_benchmarks: { Args: { p_academy_id: string }; Returns: Json }
      run_cohort_intelligence: { Args: { p_academy_id: string }; Returns: Json }
      run_flywheel: { Args: { p_academy_id: string }; Returns: Json }
      run_full_engine: {
        Args: { p_academy_id: string; p_player_id: string }
        Returns: Json
      }
      save_current_as_configuration: {
        Args: {
          p_academy_id: string
          p_creator_id?: string
          p_desc?: string
          p_name: string
        }
        Returns: string
      }
      score_academy_players: { Args: { p_academy_id: string }; Returns: number }
      score_player: {
        Args: { p_academy_id: string; p_player_id: string }
        Returns: string
      }
      session_belongs_to_auth_academy: {
        Args: { p_session_id: string }
        Returns: boolean
      }
      set_player_phase: {
        Args: {
          p_academy_id: string
          p_end_date?: string
          p_phase: Database["public"]["Enums"]["player_phase"]
          p_player_id: string
          p_reason?: string
          p_set_by?: string
        }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      snapshot_current_model: {
        Args: {
          p_academy_id: string
          p_description?: string
          p_name: string
          p_promoted_by?: string
        }
        Returns: string
      }
      take_progress_snapshot: {
        Args: {
          p_academy_id: string
          p_assessment_id?: string
          p_created_by?: string
          p_player_id: string
          p_trigger_type?: string
        }
        Returns: string
      }
      take_snapshot: {
        Args: {
          p_academy_id: string
          p_object_id: string
          p_object_label?: string
          p_object_type: string
          p_taken_by?: string
          p_taken_reason?: string
        }
        Returns: string
      }
      unaccent: { Args: { "": string }; Returns: string }
      update_signal_weight: {
        Args: {
          p_academy_id: string
          p_changed_by?: string
          p_critical_mult?: number
          p_high_mult?: number
          p_min_conf?: number
          p_reason?: string
          p_signal_type: Database["public"]["Enums"]["signal_type"]
          p_weight?: number
        }
        Returns: boolean
      }
      update_threshold: {
        Args: {
          p_academy_id: string
          p_changed_by?: string
          p_key: string
          p_reason?: string
          p_value: number
        }
        Returns: boolean
      }
      validate_player_academy: {
        Args: { p_academy_id: string; p_player_id: string }
        Returns: undefined
      }
      write_audit_log: {
        Args: {
          p_academy_id: string
          p_action: string
          p_actor_id: string
          p_payload?: Json
          p_source_type?: string
          p_target_id?: string
          p_target_label?: string
          p_target_type: string
          p_voice_command_id?: string
        }
        Returns: string
      }
    }
    Enums: {
      action_type:
        | "create_session"
        | "modify_session"
        | "cancel_session"
        | "create_template"
        | "modify_template"
        | "assign_group"
        | "create_placement_assessment"
        | "move_player_group"
        | "schedule_reassessment"
        | "adjust_session_intensity"
        | "generate_parent_update"
        | "flag_player"
        | "create_player"
        | "create_exercise"
        | "other"
      assessment_type:
        | "intake"
        | "quarterly"
        | "reassessment"
        | "promotion"
        | "ad_hoc"
      benchmark_type:
        | "level_target"
        | "utr_range"
        | "age_group_norm"
        | "external_target"
      block_type:
        | "warm_up"
        | "technical"
        | "tactical"
        | "movement"
        | "fitness"
        | "competition"
        | "mental"
        | "cool_down"
        | "free"
      calendar_event_type:
        | "season_start"
        | "season_end"
        | "competition_window_start"
        | "competition_window_end"
        | "preparation_block_start"
        | "recovery_block_start"
        | "academy_closure"
        | "assessment_window"
        | "team_event"
        | "other"
      cohort_type:
        | "utr_band"
        | "age_group"
        | "level_band"
        | "phase"
        | "track"
        | "custom"
      constraint_type:
        | "injury"
        | "medical_hold"
        | "max_sessions_limit"
        | "intensity_cap"
        | "competition_hold"
        | "travel"
        | "other"
      curriculum_stage:
        | "red_foundation"
        | "orange_development"
        | "green_performance"
        | "yellow_competitive"
        | "high_performance"
      development_track: "skill" | "competition" | "fitness" | "combined"
      exercise_category:
        | "technical"
        | "tactical"
        | "movement"
        | "fitness"
        | "competition"
        | "mental"
        | "warm_up"
        | "cool_down"
      message_audience: "player" | "coach" | "parent" | "all"
      message_tone:
        | "encouragement"
        | "challenge"
        | "correction"
        | "informational"
        | "concern"
      parent_update_status:
        | "draft"
        | "reviewed"
        | "approved"
        | "sent"
        | "cancelled"
      placement_status:
        | "draft"
        | "generated"
        | "approved"
        | "overridden"
        | "rejected"
        | "activated"
      player_phase: "training" | "pre_competition" | "competition" | "recovery"
      player_status:
        | "pending_placement"
        | "placement_in_progress"
        | "pending_approval"
        | "active"
        | "reassessment_due"
        | "on_hold"
        | "inactive"
      priority_category:
        | "technical_skill"
        | "tactical_skill"
        | "physical_fitness"
        | "competition_exposure"
        | "behavioral"
        | "load_management"
        | "reassessment"
        | "promotion_readiness"
      progression_status:
        | "not_started"
        | "in_progress"
        | "complete"
        | "regressed"
      proposed_action_status:
        | "pending_review"
        | "clarification_needed"
        | "approved"
        | "modified"
        | "rejected"
        | "executed"
        | "failed"
        | "expired"
      recommendation_status:
        | "pending_review"
        | "approved"
        | "modified"
        | "overridden"
        | "rejected"
        | "in_progress"
        | "completed"
        | "expired"
      session_status: "planned" | "in_progress" | "completed" | "cancelled"
      signal_source:
        | "assessment"
        | "utr"
        | "session_outcome"
        | "coach_note"
        | "coach_manual"
        | "calendar"
        | "constraint_check"
        | "system_cron"
      signal_type:
        | "assessment_completed"
        | "score_improvement"
        | "score_regression"
        | "score_stagnation"
        | "dimension_gap"
        | "dimension_breakout"
        | "promotion_ready"
        | "promotion_flagged"
        | "utr_improvement"
        | "utr_regression"
        | "utr_stagnation"
        | "utr_underperformance"
        | "utr_overperformance"
        | "low_match_volume"
        | "high_match_volume"
        | "session_outcome_positive"
        | "session_outcome_negative"
        | "attendance_pattern_concern"
        | "load_overload_detected"
        | "coach_priority_flagged"
        | "coach_concern_flagged"
        | "injury_concern"
        | "competition_season_start"
        | "competition_season_end"
        | "peak_competition_period"
        | "preparation_phase_start"
        | "overtraining_risk"
        | "constraint_active"
        | "constraint_resolved"
        | "reassessment_overdue"
        | "reassessment_approaching"
        | "cohort_below_average"
        | "cohort_above_average"
        | "benchmark_below_expectation"
        | "benchmark_above_expectation"
        | "curriculum_skill_gap"
        | "curriculum_ready_to_advance"
        | "curriculum_regression"
      skill_domain_type:
        | "preparation"
        | "downswing"
        | "contact"
        | "finish"
        | "transition"
        | "movement"
        | "decision_making"
        | "competition_behavior"
      time_series_metric:
        | "overall_score"
        | "technical_score"
        | "tactical_score"
        | "movement_score"
        | "competition_score"
        | "behavioral_score"
        | "utr_singles"
        | "utr_doubles"
        | "match_win_rate_90d"
        | "matches_played_90d"
        | "weekly_sessions"
        | "weekly_duration_min"
        | "avg_intensity"
        | "fatigue_risk_score"
        | "active_signal_count"
        | "high_severity_signal_count"
      user_role:
        | "academy_director"
        | "head_coach"
        | "coach"
        | "player"
        | "parent"
      voice_input_method: "typed" | "audio" | "api"
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
      action_type: [
        "create_session",
        "modify_session",
        "cancel_session",
        "create_template",
        "modify_template",
        "assign_group",
        "create_placement_assessment",
        "move_player_group",
        "schedule_reassessment",
        "adjust_session_intensity",
        "generate_parent_update",
        "flag_player",
        "create_player",
        "create_exercise",
        "other",
      ],
      assessment_type: [
        "intake",
        "quarterly",
        "reassessment",
        "promotion",
        "ad_hoc",
      ],
      benchmark_type: [
        "level_target",
        "utr_range",
        "age_group_norm",
        "external_target",
      ],
      block_type: [
        "warm_up",
        "technical",
        "tactical",
        "movement",
        "fitness",
        "competition",
        "mental",
        "cool_down",
        "free",
      ],
      calendar_event_type: [
        "season_start",
        "season_end",
        "competition_window_start",
        "competition_window_end",
        "preparation_block_start",
        "recovery_block_start",
        "academy_closure",
        "assessment_window",
        "team_event",
        "other",
      ],
      cohort_type: [
        "utr_band",
        "age_group",
        "level_band",
        "phase",
        "track",
        "custom",
      ],
      constraint_type: [
        "injury",
        "medical_hold",
        "max_sessions_limit",
        "intensity_cap",
        "competition_hold",
        "travel",
        "other",
      ],
      curriculum_stage: [
        "red_foundation",
        "orange_development",
        "green_performance",
        "yellow_competitive",
        "high_performance",
      ],
      development_track: ["skill", "competition", "fitness", "combined"],
      exercise_category: [
        "technical",
        "tactical",
        "movement",
        "fitness",
        "competition",
        "mental",
        "warm_up",
        "cool_down",
      ],
      message_audience: ["player", "coach", "parent", "all"],
      message_tone: [
        "encouragement",
        "challenge",
        "correction",
        "informational",
        "concern",
      ],
      parent_update_status: [
        "draft",
        "reviewed",
        "approved",
        "sent",
        "cancelled",
      ],
      placement_status: [
        "draft",
        "generated",
        "approved",
        "overridden",
        "rejected",
        "activated",
      ],
      player_phase: ["training", "pre_competition", "competition", "recovery"],
      player_status: [
        "pending_placement",
        "placement_in_progress",
        "pending_approval",
        "active",
        "reassessment_due",
        "on_hold",
        "inactive",
      ],
      priority_category: [
        "technical_skill",
        "tactical_skill",
        "physical_fitness",
        "competition_exposure",
        "behavioral",
        "load_management",
        "reassessment",
        "promotion_readiness",
      ],
      progression_status: [
        "not_started",
        "in_progress",
        "complete",
        "regressed",
      ],
      proposed_action_status: [
        "pending_review",
        "clarification_needed",
        "approved",
        "modified",
        "rejected",
        "executed",
        "failed",
        "expired",
      ],
      recommendation_status: [
        "pending_review",
        "approved",
        "modified",
        "overridden",
        "rejected",
        "in_progress",
        "completed",
        "expired",
      ],
      session_status: ["planned", "in_progress", "completed", "cancelled"],
      signal_source: [
        "assessment",
        "utr",
        "session_outcome",
        "coach_note",
        "coach_manual",
        "calendar",
        "constraint_check",
        "system_cron",
      ],
      signal_type: [
        "assessment_completed",
        "score_improvement",
        "score_regression",
        "score_stagnation",
        "dimension_gap",
        "dimension_breakout",
        "promotion_ready",
        "promotion_flagged",
        "utr_improvement",
        "utr_regression",
        "utr_stagnation",
        "utr_underperformance",
        "utr_overperformance",
        "low_match_volume",
        "high_match_volume",
        "session_outcome_positive",
        "session_outcome_negative",
        "attendance_pattern_concern",
        "load_overload_detected",
        "coach_priority_flagged",
        "coach_concern_flagged",
        "injury_concern",
        "competition_season_start",
        "competition_season_end",
        "peak_competition_period",
        "preparation_phase_start",
        "overtraining_risk",
        "constraint_active",
        "constraint_resolved",
        "reassessment_overdue",
        "reassessment_approaching",
        "cohort_below_average",
        "cohort_above_average",
        "benchmark_below_expectation",
        "benchmark_above_expectation",
        "curriculum_skill_gap",
        "curriculum_ready_to_advance",
        "curriculum_regression",
      ],
      skill_domain_type: [
        "preparation",
        "downswing",
        "contact",
        "finish",
        "transition",
        "movement",
        "decision_making",
        "competition_behavior",
      ],
      time_series_metric: [
        "overall_score",
        "technical_score",
        "tactical_score",
        "movement_score",
        "competition_score",
        "behavioral_score",
        "utr_singles",
        "utr_doubles",
        "match_win_rate_90d",
        "matches_played_90d",
        "weekly_sessions",
        "weekly_duration_min",
        "avg_intensity",
        "fatigue_risk_score",
        "active_signal_count",
        "high_severity_signal_count",
      ],
      user_role: [
        "academy_director",
        "head_coach",
        "coach",
        "player",
        "parent",
      ],
      voice_input_method: ["typed", "audio", "api"],
    },
  },
} as const
