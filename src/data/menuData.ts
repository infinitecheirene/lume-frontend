import { MenuItem } from '@/types';

export type Category = "coffee" | "food" | "bar";

export const menuData: Record<Category, { name: string; desc: string; price: string }[]> = {
  coffee: [
    { name: "Single Origin Pour Over", desc: "Ethiopian Yirgacheffe, floral & citrus notes", price: "150" },
    { name: "Espresso Doppio", desc: "Rich double shot, dark chocolate finish", price: "150" },
    { name: "Golden Crescent Latte", desc: "House special with turmeric, honey & oat milk", price: "150" },
    { name: "Cold Brew Tonic", desc: "Nitro cold brew with elderflower tonic", price: "150" },
    { name: "Affogato", desc: "Vanilla bean gelato drowned in espresso", price: "150" },
    { name: "Turkish Coffee", desc: "Traditional preparation with cardamom", price: "150" },
  ],
  food: [
    { name: "Avocado Toast", desc: "Sourdough, poached egg, chili flakes, microgreens", price: "150" },
    { name: "Shakshuka", desc: "Spiced tomato, bell peppers, feta, warm pita", price: "50" },
    { name: "Croque Monsieur", desc: "Gruyère, smoked ham, béchamel, brioche", price: "150" },
    { name: "Açaí Bowl", desc: "Granola, fresh berries, coconut, honey drizzle", price: "150" },
    { name: "Wagyu Burger", desc: "Aged cheddar, caramelized onions, truffle aioli", price: "150" },
    { name: "Mezze Plate", desc: "Hummus, baba ganoush, falafel, warm flatbread", price: "150" },
  ],
  bar: [
    { name: "Espresso Martini", desc: "Vodka, coffee liqueur, fresh espresso, vanilla", price: "150" },
    { name: "Crescent Old Fashioned", desc: "Bourbon, coffee bitters, orange, brown sugar", price: "150" },
    { name: "Mocha Negroni", desc: "Gin, Campari, sweet vermouth, cacao nib infusion", price: "150" },
    { name: "Irish Coffee", desc: "Jameson, brown sugar, fresh cream, espresso", price: "150" },
    { name: "Craft Beer Flight", desc: "Four rotating local & imported selections", price: "150" },
    { name: "Natural Wine", desc: "Rotating selection by the glass", price: "150" },
  ],
};

export const categories: { key: Category; label: string }[] = [
  { key: "coffee", label: "Coffee" },
  { key: "food", label: "Kitchen" },
  { key: "bar", label: "Bar" },
];

// Convert to MenuItem format for compatibility
export const menuItems: MenuItem[] = Object.entries(menuData).flatMap(([category, items]) =>
  items.map((item, index) => ({
    id: `${category}-${index + 1}`,
    name: item.name,
    description: item.desc,
    price: parseFloat(item.price.replace('$', '')),
    category: category,
    image: '/images/placeholder.jpg', // Placeholder image
    isVegetarian: false, // Default values, can be updated as needed
    isSpicy: false,
    isFeatured: false,
  }))
);