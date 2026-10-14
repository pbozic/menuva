import type { I18nText, Lang } from "./languages";

export type Restaurant = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  accent_color: string;
  source_lang: Lang;
  languages: Lang[];
  currency: string;
  created_at: string;
  phone: string | null;
  address: string | null;
  malica_hours: string | null;
  trial_ends_at: string;
  stripe_customer_id: string | null;
  subscription_status: string;
};

export type Category = {
  id: string;
  restaurant_id: string;
  position: number;
  name: I18nText;
};

export type Item = {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  position: number;
  name: I18nText;
  description: I18nText;
  price: number | null;
  allergens: number[];
  allergens_confirmed: boolean;
  available: boolean;
};

export type MenuData = {
  restaurant: Restaurant;
  categories: (Category & { items: Item[] })[];
};

export type DailyItem = {
  name: I18nText;
  description: I18nText;
  price: number | null;
  allergens: number[];
};

export type DailyMenu = {
  id: string;
  restaurant_id: string;
  menu_date: string; // YYYY-MM-DD
  items: DailyItem[];
  set_price: number | null;
  note: I18nText;
  published: boolean;
  updated_at: string;
};
