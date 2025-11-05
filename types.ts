
export type View = 'dashboard' | 'reservations' | 'menu' | 'creative';

export interface Reservation {
  id: number;
  name: string;
  partySize: number;
  time: string;
  status: 'upcoming' | 'seated' | 'cancelled';
  notes?: string;
}

export interface MenuItem {
  id: number;
  name:string;
  description: string;
  price: number;
  category: 'Appetizer' | 'Main' | 'Dessert' | 'Drink';
  imageUrl: string;
  ingredients: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}
