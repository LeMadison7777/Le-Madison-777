export type Condition = "Neuf avec étiquette" | "Neuf sans étiquette" | "Très bon état" | "Bon état" | "État correct";

export type Product = {
  id: string;
  name: string;
  description?: string;
  brand: string | null;
  size: string | null;
  price: number;
  location: string;
  city: string;
  category: string;
  condition: Condition;
  img: string;
  images?: { id: string; key: string; alt: string | null; url: string }[];
  seller?: string;
  sellerId?: string;
};

export const CATEGORIES = [
  "Robes & Tenues", "Chemises & Hauts", "Pantalons & Jeans", "Chaussures",
  "Sacs & Maroquinerie", "Montres & Bijoux", "Casquettes & Chapeaux", "Lunettes & Accessoires",
];

export const SIZES = ["XS", "S", "M", "L", "XL", "Unique", "38", "39", "40", "41", "42", "43"];
export const CITIES = ["Pointe-Noire", "Brazzaville", "Dolisie", "Nkayi", "Ouesso"];
export const CONDITIONS: Condition[] = ["Neuf avec étiquette", "Neuf sans étiquette", "Très bon état", "Bon état", "État correct"];

export const conditionStyles: Record<Condition, string> = {
  "Neuf avec étiquette": "bg-primary/20 text-primary border-primary/40",
  "Neuf sans étiquette": "bg-primary/20 text-primary border-primary/40",
  "Très bon état": "bg-accent/20 text-accent-foreground border-accent/40",
  "Bon état": "bg-white/10 text-foreground/80 border-white/15",
  "État correct": "bg-white/10 text-foreground/80 border-white/15",
};
