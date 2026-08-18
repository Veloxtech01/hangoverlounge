import { connectDb, disconnectDb } from '../config/db.js';
import { Event } from '../models/Event.js';
import { Drink } from '../models/Drink.js';

const DRINKS = [
  { category: 'Whisky', name: 'Glenfiddich 18 Years', price: 300000 },
  { category: 'Whisky', name: 'Glenfiddich 21 Years', price: 800000 },
  { category: 'Tequila', name: 'Casamigos Tequila', price: 300000 },
  { category: 'Tequila', name: 'Don Julio', price: 800000 },
  { category: 'Tequila', name: 'Azul', price: 800000 },
  { category: 'Champagne & Sparkling', name: 'Moët Brut', price: 300000 },
  { category: 'Champagne & Sparkling', name: 'Moët Rosé', price: 300000 },
];

async function main() {
  await connectDb();
  await Event.updateMany({}, { isActive: false });
  const event = await Event.create({
    name: 'One Year Anniversary',
    tagline: 'Music · Hype · Baddies',
    eventDate: new Date('2026-09-11T18:00:00+01:00'),
    venue: 'Hangover Lounge, beside Chaise World Hotel, Umuahia, Abia State',
    isActive: true,
  });
  await Drink.insertMany(DRINKS.map((d, i) => ({ ...d, event: event._id, order: i })));
  console.log(`Seeded event ${event._id} with ${DRINKS.length} drinks.`);
  await disconnectDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
