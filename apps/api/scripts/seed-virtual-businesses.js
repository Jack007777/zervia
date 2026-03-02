/* eslint-disable no-console */
const mongoose = require('mongoose');

function pickWeighted(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) {
      return item;
    }
  }
  return items[items.length - 1];
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, digits = 4) {
  const n = Math.random() * (max - min) + min;
  return Number(n.toFixed(digits));
}

const CITIES = [
  { city: 'Berlin', weight: 24, lat: 52.5200, lng: 13.4050, areas: ['Mitte', 'Prenzlauer Berg', 'Charlottenburg', 'Kreuzberg'] },
  { city: 'Hamburg', weight: 14, lat: 53.5511, lng: 9.9937, areas: ['Altona', 'Eimsbuettel', 'Winterhude', 'St. Pauli'] },
  { city: 'Muenchen', weight: 14, lat: 48.1351, lng: 11.5820, areas: ['Schwabing', 'Maxvorstadt', 'Haidhausen', 'Sendling'] },
  { city: 'Koeln', weight: 10, lat: 50.9375, lng: 6.9603, areas: ['Innenstadt', 'Ehrenfeld', 'Lindenthal', 'Deutz'] },
  { city: 'Frankfurt am Main', weight: 9, lat: 50.1109, lng: 8.6821, areas: ['Innenstadt', 'Sachsenhausen', 'Bockenheim', 'Bornheim'] },
  { city: 'Stuttgart', weight: 8, lat: 48.7758, lng: 9.1829, areas: ['Mitte', 'West', 'Bad Cannstatt', 'Vaihingen'] },
  { city: 'Duesseldorf', weight: 8, lat: 51.2277, lng: 6.7735, areas: ['Altstadt', 'Pempelfort', 'Bilk', 'Flingern'] },
  { city: 'Leipzig', weight: 5, lat: 51.3397, lng: 12.3731, areas: ['Zentrum', 'Plagwitz', 'Connewitz', 'Suedvorstadt'] },
  { city: 'Dresden', weight: 4, lat: 51.0504, lng: 13.7373, areas: ['Altstadt', 'Neustadt', 'Striesen', 'Pieschen'] },
  { city: 'Bremen', weight: 4, lat: 53.0793, lng: 8.8017, areas: ['Mitte', 'Schwachhausen', 'Findorff', 'Vahr'] }
];

const CATEGORIES = [
  {
    key: 'friseur',
    names: ['Hair Studio', 'Salon', 'Cut Lounge', 'Color Atelier'],
    services: [
      { name: 'Damenhaarschnitt', duration: 45, minPrice: 35, maxPrice: 65 },
      { name: 'Balayage', duration: 120, minPrice: 110, maxPrice: 190 },
      { name: 'Styling & Foehnen', duration: 35, minPrice: 25, maxPrice: 45 }
    ]
  },
  {
    key: 'naegel',
    names: ['Nail Lab', 'Nail Boutique', 'Nail Studio', 'Nail House'],
    services: [
      { name: 'Manikuere', duration: 35, minPrice: 25, maxPrice: 45 },
      { name: 'Gel Manikuere', duration: 55, minPrice: 35, maxPrice: 60 },
      { name: 'Pedikuere', duration: 45, minPrice: 30, maxPrice: 55 }
    ]
  },
  {
    key: 'kosmetik',
    names: ['Beauty Atelier', 'Glow Studio', 'Skin Lounge', 'Face Bar'],
    services: [
      { name: 'Gesichtsbehandlung', duration: 60, minPrice: 55, maxPrice: 95 },
      { name: 'Augenbrauen zupfen', duration: 20, minPrice: 15, maxPrice: 25 },
      { name: 'Wimpernverlaengerung', duration: 90, minPrice: 70, maxPrice: 130 }
    ]
  },
  {
    key: 'massage',
    names: ['Massage Studio', 'Thai Massage', 'Bodywork Center', 'Wellness Massage'],
    services: [
      { name: 'Entspannungsmassage', duration: 60, minPrice: 50, maxPrice: 85 },
      { name: 'Sportmassage', duration: 45, minPrice: 45, maxPrice: 75 },
      { name: 'Thai Massage', duration: 60, minPrice: 55, maxPrice: 95 }
    ]
  },
  {
    key: 'haarentfernung',
    names: ['Waxing Studio', 'Smooth Skin', 'Hair Removal Lab', 'Sugaring Place'],
    services: [
      { name: 'Waxing Damen', duration: 40, minPrice: 35, maxPrice: 65 },
      { name: 'Brazilian Waxing', duration: 45, minPrice: 40, maxPrice: 75 },
      { name: 'Sugaring', duration: 45, minPrice: 40, maxPrice: 70 }
    ]
  }
];

function parseArgs() {
  const argv = process.argv.slice(2);
  const countIndex = argv.findIndex((v) => v === '--count');
  const count = countIndex >= 0 ? Number(argv[countIndex + 1]) : 200;
  const purge = argv.includes('--purge-virtual');
  return { count: Number.isFinite(count) ? count : 200, purge };
}

async function main() {
  const { count, purge } = parseArgs();
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is required. Example: MONGO_URI="mongodb+srv://..." node scripts/seed-virtual-businesses.js --count 200');
  }

  const batch = `virtual-de-${new Date().toISOString().replace(/[.:]/g, '-')}`;
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  if (purge) {
    const deletedBiz = await db.collection('businesses').deleteMany({ isVirtual: true, country: 'DE' });
    const deletedSvc = await db.collection('services').deleteMany({ isVirtual: true, country: 'DE' });
    console.log(`Purged virtual records: businesses=${deletedBiz.deletedCount}, services=${deletedSvc.deletedCount}`);
  }

  const businesses = [];
  const services = [];

  for (let i = 0; i < count; i += 1) {
    const cityMeta = pickWeighted(CITIES);
    const category = CATEGORIES[rand(0, CATEGORIES.length - 1)];
    const area = cityMeta.areas[rand(0, cityMeta.areas.length - 1)];
    const number = rand(1, 180);
    const zip = String(rand(10000, 99999));

    const businessId = new mongoose.Types.ObjectId();
    const ownerUserId = new mongoose.Types.ObjectId().toString();
    const suffix = rand(10, 999);
    const name = `${area} ${category.names[rand(0, category.names.length - 1)]} ${suffix}`;
    const rating = randFloat(3.8, 5.0, 1);

    const lat = randFloat(cityMeta.lat - 0.12, cityMeta.lat + 0.12, 6);
    const lng = randFloat(cityMeta.lng - 0.12, cityMeta.lng + 0.12, 6);

    const serviceTemplates = category.services;
    const serviceCount = rand(2, 3);
    const picked = serviceTemplates.slice().sort(() => Math.random() - 0.5).slice(0, serviceCount);

    let priceMin = Number.POSITIVE_INFINITY;
    let priceMax = Number.NEGATIVE_INFINITY;

    const createdAt = new Date();

    businesses.push({
      _id: businessId,
      ownerUserId,
      name,
      description: `Virtual demo listing for ${cityMeta.city} - ${area}.`,
      category: category.key,
      city: cityMeta.city,
      addressLine: `Sample Street ${number}, ${zip} ${cityMeta.city}`,
      country: 'DE',
      defaultCurrency: 'EUR',
      timezone: 'Europe/Berlin',
      lat,
      lng,
      rating,
      isActive: true,
      isVirtual: true,
      virtualSeedBatch: batch,
      createdAt,
      updatedAt: createdAt
    });

    for (const tpl of picked) {
      const price = rand(tpl.minPrice, tpl.maxPrice);
      priceMin = Math.min(priceMin, price);
      priceMax = Math.max(priceMax, price);

      services.push({
        _id: new mongoose.Types.ObjectId(),
        businessId: businessId.toString(),
        name: tpl.name,
        description: `${tpl.name} - virtual demo service`,
        durationMinutes: tpl.duration,
        price,
        currency: 'EUR',
        category: category.key,
        country: 'DE',
        staffId: `virtual-staff-${rand(1, 4)}`,
        isVirtual: true,
        virtualSeedBatch: batch,
        createdAt,
        updatedAt: createdAt
      });
    }

    businesses[businesses.length - 1].priceMin = priceMin;
    businesses[businesses.length - 1].priceMax = priceMax;
  }

  await db.collection('businesses').insertMany(businesses, { ordered: false });
  await db.collection('services').insertMany(services, { ordered: false });

  console.log(`Seed done. batch=${batch}`);
  console.log(`Inserted businesses=${businesses.length}, services=${services.length}`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (_) {
    // ignore
  }
  process.exit(1);
});
