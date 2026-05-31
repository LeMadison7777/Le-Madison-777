export type Condition = "Neuf sans étiquette" | "Très bon état" | "Bon état";

export type Product = {
  id: string;
  name: string;
  brand: string;
  size: string;
  price: number;
  location: string;
  city: string;
  category: string;
  condition: Condition;
  img: string;
};

export const CATEGORIES = [
  "Robes & Tenues",
  "Chemises & Hauts",
  "Pantalons & Jeans",
  "Chaussures",
  "Sacs & Maroquinerie",
  "Montres & Bijoux",
  "Casquettes & Chapeaux",
  "Lunettes & Accessoires",
];

export const SIZES = ["XS", "S", "M", "L", "XL", "Unique", "38", "39", "40", "41", "42", "43"];

export const CITIES = [
  "Pointe-Noire",
  "Brazzaville",
  "Abidjan",
  "Dakar",
  "Yaoundé",
  "Lomé",
  "Cotonou",
];

export const PRODUCTS: Product[] = [
  { id: "p1", name: "Veste en cuir vintage", brand: "Zara", size: "M", price: 8500, location: "Pointe-Noire, Congo", city: "Pointe-Noire", category: "Chemises & Hauts", condition: "Très bon état", img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700&q=70&auto=format&fit=crop" },
  { id: "p2", name: "Robe fleurie d'été", brand: "Mango", size: "S", price: 6200, location: "Abidjan, Côte d'Ivoire", city: "Abidjan", category: "Robes & Tenues", condition: "Neuf sans étiquette", img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=700&q=70&auto=format&fit=crop" },
  { id: "p3", name: "Sneakers blanches", brand: "Nike Air", size: "42", price: 12000, location: "Dakar, Sénégal", city: "Dakar", category: "Chaussures", condition: "Bon état", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&q=70&auto=format&fit=crop" },
  { id: "p4", name: "Sac à main cuir", brand: "Michael Kors", size: "Unique", price: 18500, location: "Brazzaville, Congo", city: "Brazzaville", category: "Sacs & Maroquinerie", condition: "Très bon état", img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=700&q=70&auto=format&fit=crop" },
  { id: "p5", name: "Jean droit délavé", brand: "Levi's 501", size: "L", price: 5500, location: "Yaoundé, Cameroun", city: "Yaoundé", category: "Pantalons & Jeans", condition: "Bon état", img: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=700&q=70&auto=format&fit=crop" },
  { id: "p6", name: "Montre automatique", brand: "Seiko", size: "Unique", price: 24000, location: "Lomé, Togo", city: "Lomé", category: "Montres & Bijoux", condition: "Très bon état", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&q=70&auto=format&fit=crop" },
  { id: "p7", name: "Lunettes de soleil", brand: "Ray-Ban", size: "Unique", price: 9800, location: "Cotonou, Bénin", city: "Cotonou", category: "Lunettes & Accessoires", condition: "Neuf sans étiquette", img: "https://images.unsplash.com/photo-1577803645773-f96470509666?w=700&q=70&auto=format&fit=crop" },
  { id: "p8", name: "Chemise en lin", brand: "H&M", size: "L", price: 4200, location: "Pointe-Noire, Congo", city: "Pointe-Noire", category: "Chemises & Hauts", condition: "Bon état", img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=700&q=70&auto=format&fit=crop" },
  { id: "p9", name: "Pull en laine mérinos", brand: "Uniqlo", size: "M", price: 7200, location: "Pointe-Noire, Congo", city: "Pointe-Noire", category: "Chemises & Hauts", condition: "Très bon état", img: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=700&q=70&auto=format&fit=crop" },
  { id: "p10", name: "Bottines en daim", brand: "Clarks", size: "39", price: 14500, location: "Abidjan, Côte d'Ivoire", city: "Abidjan", category: "Chaussures", condition: "Bon état", img: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=700&q=70&auto=format&fit=crop" },
  { id: "p11", name: "Sac bandoulière", brand: "Coach", size: "Unique", price: 22000, location: "Dakar, Sénégal", city: "Dakar", category: "Sacs & Maroquinerie", condition: "Neuf sans étiquette", img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&q=70&auto=format&fit=crop" },
  { id: "p12", name: "Manteau long", brand: "COS", size: "L", price: 16800, location: "Brazzaville, Congo", city: "Brazzaville", category: "Chemises & Hauts", condition: "Très bon état", img: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=700&q=70&auto=format&fit=crop" },
];

export const conditionStyles: Record<Condition, string> = {
  "Neuf sans étiquette": "bg-primary/20 text-primary border-primary/40",
  "Très bon état": "bg-accent/20 text-accent-foreground border-accent/40",
  "Bon état": "bg-white/10 text-foreground/80 border-white/15",
};