export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      jetbuyingcasava_farmers: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          phone: string;
          address: string;
          barangay: string;
          municipality: string;
          province: string;
          total_hectares: number;
          date_planted: string | null;
          date_harvested: string | null;
          date_registered: string;
          is_active: boolean;
          profile_picture: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          phone: string;
          address: string;
          barangay: string;
          municipality: string;
          province: string;
          total_hectares?: number;
          date_planted?: string | null;
          date_harvested?: string | null;
          date_registered?: string;
          is_active?: boolean;
          profile_picture?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          phone?: string;
          address?: string;
          barangay?: string;
          municipality?: string;
          province?: string;
          total_hectares?: number;
          date_planted?: string | null;
          date_harvested?: string | null;
          date_registered?: string;
          is_active?: boolean;
          profile_picture?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      jetbuyingcasava_lands: {
        Row: {
          id: string;
          farmer_id: string;
          name: string;
          area: number;
          location: string;
          barangay: string;
          municipality: string;
          province: string;
          soil_type: string;
          coordinates: Json | null;
          date_acquired: string;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          farmer_id: string;
          name: string;
          area: number;
          location: string;
          barangay: string;
          municipality: string;
          province: string;
          soil_type: string;
          coordinates?: Json | null;
          date_acquired: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          farmer_id?: string;
          name?: string;
          area?: number;
          location?: string;
          barangay?: string;
          municipality?: string;
          province?: string;
          soil_type?: string;
          coordinates?: Json | null;
          date_acquired?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      jetbuyingcasava_crops: {
        Row: {
          id: string;
          land_id: string;
          farmer_id: string;
          crop_type: string;
          variety: string;
          planting_date: string;
          expected_harvest_date: string;
          actual_harvest_date: string | null;
          area_planted: number;
          expected_yield: number;
          actual_yield: number | null;
          status: 'planted' | 'growing' | 'ready' | 'harvested';
          notes: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          land_id: string;
          farmer_id: string;
          crop_type: string;
          variety: string;
          planting_date: string;
          expected_harvest_date: string;
          actual_harvest_date?: string | null;
          area_planted: number;
          expected_yield: number;
          actual_yield?: number | null;
          status?: 'planted' | 'growing' | 'ready' | 'harvested';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          land_id?: string;
          farmer_id?: string;
          crop_type?: string;
          variety?: string;
          planting_date?: string;
          expected_harvest_date?: string;
          actual_harvest_date?: string | null;
          area_planted?: number;
          expected_yield?: number;
          actual_yield?: number | null;
          status?: 'planted' | 'growing' | 'ready' | 'harvested';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      jetbuyingcasava_transactions: {
        Row: {
          id: string;
          farmer_id: string;
          crop_id: string | null;
          type: 'purchase' | 'sale';
          buyer_seller: string;
          produce: string;
          quantity: number;
          price_per_kg: number;
          total_amount: number;
          transaction_date: string;
          payment_status: 'pending' | 'partial' | 'paid';
          delivery_status: 'pending' | 'delivered';
          notes: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          farmer_id: string;
          crop_id?: string | null;
          type: 'purchase' | 'sale';
          buyer_seller: string;
          produce: string;
          quantity: number;
          price_per_kg: number;
          total_amount: number;
          transaction_date: string;
          payment_status?: 'pending' | 'partial' | 'paid';
          delivery_status?: 'pending' | 'delivered';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          farmer_id?: string;
          crop_id?: string | null;
          type?: 'purchase' | 'sale';
          buyer_seller?: string;
          produce?: string;
          quantity?: number;
          price_per_kg?: number;
          total_amount?: number;
          transaction_date?: string;
          payment_status?: 'pending' | 'partial' | 'paid';
          delivery_status?: 'pending' | 'delivered';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      jetbuyingcasava_sync_log: {
        Row: {
          id: string;
          table_name: string;
          record_id: string;
          operation: 'INSERT' | 'UPDATE' | 'DELETE';
          data: Json | null;
          synced: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          table_name: string;
          record_id: string;
          operation: 'INSERT' | 'UPDATE' | 'DELETE';
          data?: Json | null;
          synced?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          table_name?: string;
          record_id?: string;
          operation?: 'INSERT' | 'UPDATE' | 'DELETE';
          data?: Json | null;
          synced?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
