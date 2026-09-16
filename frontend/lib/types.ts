export type ListingType = "buy" | "rent";
export type PropertyType =
  | "apartment" | "flat" | "house" | "villa" | "plot"
  | "shop" | "office" | "commercial" | "other";
export type PropertyStatus = "available" | "sold" | "rented" | "on_hold";
export type FurnishingStatus = "unfurnished" | "semi_furnished" | "fully_furnished";

export interface PropertyCard {
  id: number;
  title: string;
  slug: string;
  listing_type: ListingType;
  property_type: PropertyType;
  status: PropertyStatus;
  price: string;
  price_display: string | null;
  locality: string;
  city: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: string | null;
  featured: boolean;
  primary_image: string | null;
}

export interface PropertyImage {
  id: number;
  image_url: string;
  display_order: number;
  is_primary: boolean;
}

export interface PropertyDetail extends Omit<PropertyCard, "primary_image"> {
  description: string | null;
  carpet_area_sqft: string | null;
  balconies: number | null;
  floor: string | null;
  total_floors: number | null;
  furnishing_status: FurnishingStatus | null;
  parking: string | null;
  address: string | null;
  district: string;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  location_privacy: "exact" | "approximate" | "locality_only";
  possession_status: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  images: PropertyImage[];
  amenities: string[];
}

export interface PaginatedProperties {
  items: PropertyCard[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PropertySearchParams {
  listing_type?: ListingType;
  property_type?: PropertyType;
  locality?: string;
  q?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  furnishing_status?: FurnishingStatus;
  parking?: string;
  sort?: "newest" | "oldest" | "price_asc" | "price_desc" | "area_asc" | "area_desc";
  page?: number;
  page_size?: number;
  featured?: boolean;
}

export interface Area {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
  display_order: number;
}

export interface SiteSettings {
  business_name: string;
  tagline: string | null;
  consultant_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  about_text: string | null;
  logo_url: string | null;
  social_links: Record<string, string> | null;
  business_hours: Record<string, string> | null;
}

export interface EnquiryPayload {
  property_id?: number;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  enquiry_type: "property" | "general" | "site_visit";
}
