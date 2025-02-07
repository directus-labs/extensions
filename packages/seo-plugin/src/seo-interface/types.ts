export interface SeoValue {
  title: string;
  meta_description: string;
  og_image?: string;
  no_index?: boolean;
  no_follow?: boolean;
  sitemap?: {
    change_frequency?: string;
    priority?: string;
  };
  json_ld?: string;
  meta_keywords?: string[];
  additional_fields?: Record<string, any>;
}

export interface SeoProps {
  value: SeoValue | null;
  showJsonLd?: boolean;
  showNoIndex?: boolean;
  showSitemap?: boolean;
  showOgImage?: boolean;
  additionalFields?: any[];
  collection?: string;
  titleTemplate?: string;
  descriptionTemplate?: string;
  disabled?: boolean;
}

export interface SeoEmits {
  (e: 'input', value: SeoValue): void;
}
