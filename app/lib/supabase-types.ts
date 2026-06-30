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
  created_at?: string;
}

export interface Target {
  id: string;
  client_id: string;
  broker_name: string;
  profile_url: string;
  status: TargetStatus;
  last_checked?: string;
}

export interface ScanQueue {
  id: string;
  client_id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  created_at?: string;
}
