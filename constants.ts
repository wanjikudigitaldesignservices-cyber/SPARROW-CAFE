
import { Reservation, MenuItem } from './types';

export const MOCK_RESERVATIONS: Reservation[] = [
  { id: 1, name: 'Ana Silva', partySize: 2, time: '19:00', status: 'upcoming' },
  { id: 2, name: 'John Doe', partySize: 4, time: '19:30', status: 'upcoming', notes: 'Birthday celebration' },
  { id: 3, name: 'Maria Souza', partySize: 3, time: '20:00', status: 'upcoming' },
  { id: 4, name: 'Chris Martin', partySize: 2, time: '20:15', status: 'seated' },
  { id: 5, name: 'Laura Jones', partySize: 5, time: '21:00', status: 'cancelled' },
];

export const MOCK_MENU: MenuItem[] = [
  {
    id: 1,
    name: 'Bacalhau à Brás',
    description: 'A classic Lisbon dish with shredded cod, onions, straw potatoes, and eggs.',
    price: 18.50,
    category: 'Main',
    imageUrl: 'https://picsum.photos/id/102/400/300',
    ingredients: ['Codfish', 'Potatoes', 'Onions', 'Eggs', 'Olives', 'Parsley']
  },
  {
    id: 2,
    name: 'Grilled Sardines',
    description: 'Fresh Atlantic sardines, grilled to perfection and served with roasted peppers.',
    price: 14.00,
    category: 'Main',
    imageUrl: 'https://picsum.photos/id/1060/400/300',
    ingredients: ['Sardines', 'Bell Peppers', 'Olive Oil', 'Garlic', 'Sea Salt']
  },
  {
    id: 3,
    name: 'Pastel de Nata',
    description: 'Iconic Portuguese egg tart with a creamy custard filling and a flaky crust.',
    price: 2.50,
    category: 'Dessert',
    imageUrl: 'https://picsum.photos/id/225/400/300',
    ingredients: ['Puff Pastry', 'Egg Yolks', 'Milk', 'Sugar', 'Cinnamon', 'Lemon Zest']
  },
  {
    id: 4,
    name: 'Caldo Verde',
    description: 'A traditional Portuguese soup made with potato, collard greens, and chouriço.',
    price: 7.00,
    category: 'Appetizer',
    imageUrl: 'https://picsum.photos/id/292/400/300',
    ingredients: ['Potatoes', 'Collard Greens', 'Chouriço Sausage', 'Onion', 'Garlic']
  },
];
