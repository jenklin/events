/**
 * cloudpeers Events Platform - Event Type Definitions
 */

export interface EventConfig {
  event: EventDetails;
  venue: VenueDetails;
  schedule: ScheduleItem[];
  speakers?: Speaker[];
  registration: RegistrationSettings;
  branding?: BrandingSettings;
  integrations: IntegrationSettings;
}

export interface EventDetails {
  id: string;
  title: string;
  slug: string;
  category: string;
  date: string;
  time: string;
  timezone: string;
  location: string;
  description: string;
  whatToExpect: {
    intro: string;
    content: string;
  };
  capacity?: number;
  tags?: string[];
}

export interface VenueDetails {
  name: string;
  description: string;
  address: {
    street?: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  mapUrl?: string;
  parking?: string;
  accessibility?: string;
}

export interface ScheduleItem {
  time: string;
  title: string;
  description?: string;
  speaker?: string;
  duration?: number; // minutes
  type: 'session' | 'break' | 'networking' | 'meal';
}

export interface Speaker {
  name: string;
  title: string;
  bio: string;
  photo?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
}

export interface RegistrationSettings {
  enabled: boolean;
  collectPhone: boolean;
  collectCompany: boolean;
  customFields?: CustomField[];
  requireApproval: boolean;
  sendConfirmation: boolean;
  confirmationTemplate?: string;
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio';
  options?: string[];
  required: boolean;
  placeholder?: string;
}

export interface BrandingSettings {
  primaryColor?: string; // defaults to cloudpeers maroon
  secondaryColor?: string; // defaults to cloudpeers tan
  logo?: string;
  favicon?: string;
  customCSS?: string;
}

export interface IntegrationSettings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  analytics?: {
    googleAnalytics?: string;
    plausible?: string;
  };
  calendar?: {
    googleCalendar?: boolean;
    ics?: boolean;
  };
  social?: {
    shareButtons?: boolean;
    ogImage?: string;
  };
}

export interface EventRegistration {
  id: string;
  event_id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  custom_fields?: Record<string, any>;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface EventAnalytics {
  event_id: string;
  total_views: number;
  total_registrations: number;
  total_attendees: number;
  conversion_rate: number;
  sources: Record<string, number>;
  devices: Record<string, number>;
  timestamps: {
    created_at: string;
    updated_at: string;
  };
}
