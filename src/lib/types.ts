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
