export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      farmers: {
        Row: {
          id: string
          first_name: string
          last_name: string
          phone: string
          address: string
          barangay: string
          municipality: string
          province: string
          total_hectares: number
          date_planted: string | null
          date_harvested: string | null
          date_registered: string
          is_active: boolean
          profile_picture: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          phone: string
          address: string
          barangay: string
          municipality: string
          province: string
          total_hectares?: number
          date_planted?: string | null
          date_harvested?: string | null
          date_registered?: string
          is_active?: boolean
          profile_picture?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          phone?: string
          address?: string
          barangay?: string
          municipality?: string
          province?: string
          total_hectares?: number
          date_planted?: string | null
          date_harvested?: string | null
          date_registered?: string
          is_active?: boolean
          profile_picture?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      // Add other tables here as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
