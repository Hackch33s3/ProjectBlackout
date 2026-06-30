export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ClientStatus =
  | 'PENDING_ONBOARDING'
  | 'PENDING_AUDIT'
  | 'SCANNING'
  | 'ACTIVE_MONITORING'
  | 'SUSPENDED'
  | 'CHURNED'
  | 'GHOSTED';

export type TargetStatus =
  | 'PENDING_OPT_OUT'
  | 'OPT_OUT_SUBMITTED'
  | 'VERIFIED_REMOVED'
  | 'FAILED'
  | 'EXPOSED';

export interface Client {
  id: string;
  email?: string;
  full_name?: string;
  past_city?: string;
  status: ClientStatus;
  stripe_customer_id?: string;
  email_hash?: string;
  pii_hash?: string;
  created_at?: string;
}

export interface Target {
  id: string;
  client_id: string;
  broker_name: string;
  profile_url: string;
  status: TargetStatus;
  opt_out_method?: string;
  last_checked?: string;
}

export interface ScanQueue {
  id: string;
  client_id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  created_at?: string;
}

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'created_at'>
        Update: Partial<Omit<Client, 'id'>>
        Relationships: []
      }
      targets: {
        Row: Target
        Insert: Omit<Target, 'id' | 'last_checked'>
        Update: Partial<Omit<Target, 'id'>>
        Relationships: [{ foreignKeyName: "targets_client_id_fkey", columns: ["client_id"], referencedRelation: "clients", referencedColumns: ["id"] }]
      }
      scan_queue: {
        Row: ScanQueue
        Insert: Omit<ScanQueue, 'id' | 'created_at'>
        Update: Partial<Omit<ScanQueue, 'id'>>
        Relationships: [{ foreignKeyName: "scan_queue_client_id_fkey", columns: ["client_id"], referencedRelation: "clients", referencedColumns: ["id"] }]
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
