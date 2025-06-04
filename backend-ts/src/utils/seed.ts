import { connectToDatabase, getDatabase } from '../config/database';

const sampleBeers = [
  {
    name: "Pliny the Elder",
    brewery: "Russian River Brewing Company",
    type: "Double IPA",
    abv: 8.0,
    ibu: 100,
    description: "A well-balanced Double IPA with citrusy hop flavors and a clean finish.",
    image_url: "https://example.com/pliny.jpg",
    created_at: new Date()
  },
  {
    name: "Guinness Draught",
    brewery: "Guinness",
    type: "Stout",
    abv: 4.2,
    ibu: 45,
    description: "A classic Irish dry stout with a creamy texture and roasted barley flavor.",
    image_url: "https://example.com/guinness.jpg",
    created_at: new Date()
  },
  {
    name: "Sierra Nevada Pale Ale",
    brewery: "Sierra Nevada Brewing Co.",
    type: "Pale Ale",
    abv: 5.6,
    ibu: 38,
    description: "A pioneering American pale ale with citrusy Cascade hops.",
    image_url: "https://example.com/sierra-nevada.jpg",
    created_at: new Date()
  },
  {
    name: "Allagash White",
    brewery: "Allagash Brewing Company",
    type: "Witbier",
    abv: 5.1,
    ibu: 10,
    description: "A traditional Belgian-style wheat beer brewed with coriander and orange peel.",
    image_url: "https://example.com/allagash.jpg",
    created_at: new Date()
  },
  {
    name: "Heady Topper",
    brewery: "The Alchemist",
    type: "Double IPA",
    abv: 8.0,
    ibu: 120,
    description: "A legendary Vermont Double IPA with tropical hop flavors.",
    image_url: "https://example.com/heady-topper.jpg",
    created_at: new Date()
  }
];

export const seedDatabase = async () => {
  try {
    await connectToDatabase();
    const db = getDatabase();
    
    // Check if beers already exist
    const existingBeers = await db.collection('beers').countDocuments();
    
    if (existingBeers === 0) {
      console.log('Seeding database with sample beers...');
      await db.collection('beers').insertMany(sampleBeers);
      console.log(`Inserted ${sampleBeers.length} sample beers`);
    } else {
      console.log(`Database already has ${existingBeers} beers, skipping seed`);
    }
  } catch (error) {
    console.error('Database seeding error:', error);
    throw error;
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Database seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database seeding failed:', error);
      process.exit(1);
    });
} 