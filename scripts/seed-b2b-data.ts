import fs from 'node:fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envLocalPath = path.resolve(__dirname, '../.env.local');
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const url =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!url) {
  throw new Error('DATABASE_URL missing. Define it in .env.local or .env before seeding.');
}

const pool = new pg.Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const b2bData = [
  // --- B2B HÄNDLER (Bereits vorhanden) ---
  { title: 'Valio Food GmbH', category: 'B2B_DIRECTORY', type: 'Gefriergetrocknete Früchte', description: 'Spezialist für gefriergetrocknete Obst-Zutaten', url: 'https://valio.de', location: 'Hamburg', contactInfo: { phone: '+49 40 3330 5920', email: 'sales@valio.de', address: 'Ernst-Merck-Straße 12-14, 20099 Hamburg' } },
  { title: 'Horst Walberg Trockenfrucht (Howa)', category: 'B2B_DIRECTORY', type: 'Trockenfrüchte', description: 'Lieferant für Trockenfrüchte aus Deutschland', url: 'https://howa.de', location: 'Kisdorf', contactInfo: { phone: '+49 4193 9819-0', email: 'info@howa.de', address: 'Henstedter Straße 21, 24629 Kisdorf' } },
  { title: 'Comazo GmbH + Co. KG', category: 'B2B_DIRECTORY', type: 'Unterwäsche', description: 'Hersteller von Unterwäsche für Damen und Herren aus Albstadt', url: 'https://comazo.de', location: 'Albstadt-Tailfingen', contactInfo: { phone: '+49 7432 7019-0', email: 'info@comazo.de', address: 'Martin-Luther-Str. 1, 72461 Albstadt' } },
  { title: 'TRIGEMA W. Grupp KG', category: 'B2B_DIRECTORY', type: 'Made in Germany', description: 'Deutschlands größter Hersteller von T-Shirts, Polos und Sweatshirts', url: 'https://trigema.de', location: 'Burladingen', contactInfo: { phone: '+49 7475 88-0', email: 'bestellservice@trigema.de', address: 'Josef-Mayer-Str. 31-35, 72393 Burladingen' } },
  { title: 'L-SHOP-TEAM GmbH', category: 'B2B_DIRECTORY', type: 'Textilien', description: 'Einer der größten Textilgroßhändler für T-Shirts und Hoodies', url: 'https://l-shop-team.de', location: 'Unna', contactInfo: { phone: '+49 2303 9019-0', email: 'info@l-shop-team.de', address: 'Otto-Hahn-Str. 27, 59423 Unna' } },

  // --- LOGISTIK & LAGER (Bereits vorhanden) ---
  { title: 'FIEGE Logistik (Zentrale)', category: 'LOGISTICS', type: 'Kontraktlogistik', description: 'Führender Anbieter für Intralogistik und E-Commerce', url: 'https://fiege.com', location: 'Greven', contactInfo: { phone: '+49 2571 999-0', address: 'Joan-Joseph-Fiege-Straße 1, 48268 Greven' } },
  { title: 'Lufapak GmbH', category: 'LOGISTICS', type: 'B2B Fulfillment', description: 'Fulfillment, Lagerung, Versand und Retourenmanagement', url: 'https://lufapak.de', location: 'Neuwied', contactInfo: { phone: '+49 2631 384-0', email: 'sales@lufapak.de', address: 'Carl-Borgward-Straße 20, 56566 Neuwied' } },

  // --- NEU: VERSANDDIENSTLEISTER & PAKETDIENSTE (2026 Tarife) ---
  { 
    title: 'DHL Paket (Deutsche Post)', 
    category: 'LOGISTICS', 
    type: 'Shipping Service', 
    description: 'Größter deutscher Paketdienstleister; B2B- und B2C-Versand national und international, Abholservice, Packstationen.', 
    url: 'https://dhl.de', 
    location: 'Bonn', 
    contactInfo: { 
      phone: '0228 4333112', 
      address: 'Heinrich-von-Stephan-Straße 1, 53175 Bonn',
      prices_2026: {
        'Päckchen S (bis 2kg)': '4,19 €',
        'Paket bis 5kg': '7,69 €',
        'Paket bis 10kg': '10,49 €',
        'Abholservice (je Auftrag)': '+3,00 €'
      }
    } 
  },
  { 
    title: 'Hermes Germany', 
    category: 'LOGISTICS', 
    type: 'Shipping Service', 
    description: 'Zweitgrößter Paketdienst in Deutschland; Fokus auf PaketShops und flexible Haustür-Zustellung.', 
    url: 'https://myhermes.de', 
    location: 'Hamburg', 
    contactInfo: { 
      email: 'impressum@hermesworld.com',
      address: 'Essener Straße 89, 22419 Hamburg',
      prices_2026: {
        'Päckchen (Shop)': '3,99 €',
        'S-Paket (Haus)': '5,79 €',
        'M-Paket (Haus)': '6,99 €'
      }
    } 
  },
  { 
    title: 'DPD Deutschland', 
    category: 'LOGISTICS', 
    type: 'Shipping Service', 
    description: 'Internationales Paketnetzwerk mit starkem Fokus auf Shop2Shop-Versand und Classic-Zustellung.', 
    url: 'https://dpd.de', 
    location: 'Aschaffenburg', 
    contactInfo: { 
      phone: '06021 8430',
      email: 'info@dpd.de',
      address: 'Wailandtstraße 1, 63741 Aschaffenburg',
      prices_2026: {
        'Shop2Shop XS': '3,49 €',
        'Classic XS (Haus)': '4,59 €',
        'Classic mit Abholung': 'ab 7,79 €'
      }
    } 
  },
  { 
    title: 'GLS Germany', 
    category: 'LOGISTICS', 
    type: 'Shipping Service', 
    description: 'Nationaler und europaweiter Paketdienst mit Fokus auf Schnelligkeit und Transparenz.', 
    url: 'https://gls-germany.com', 
    location: 'Neuenstein', 
    contactInfo: { 
      phone: '06677 646907000',
      email: 'impressum@gls-germany.com',
      address: 'GLS Germany-Straße 1–7, 36286 Neuenstein',
      prices_2026: {
        'XS (Online)': '3,29 €',
        'S (Online)': '3,89 €',
        'International (Euro Zone I)': 'ab 9,70 €'
      }
    } 
  },
  { 
    title: 'UPS Deutschland', 
    category: 'LOGISTICS', 
    type: 'Express Logistik', 
    description: 'Weltweiter Express-Dienstleister; spezialisiert auf B2B-Fracht und zeitkritische Lieferungen.', 
    url: 'https://ups.com', 
    location: 'Neuss', 
    contactInfo: { 
      phone: '+49 69 66405060',
      email: 'CustomerServiceDEDE@ups.com',
      address: 'Görlitzer Straße 1, 41460 Neuss',
      prices_2026: {
        'UPS Standard (bis 2kg)': '6,74 €',
        'UPS Express Saver': 'ab 16,87 €'
      }
    } 
  },
  { 
    title: 'GO! Express & Logistics', 
    category: 'LOGISTICS', 
    type: 'Kurierservice', 
    description: 'Same-Day-Kurier und Overnight-Express Spezialist für extrem zeitkritische Sendungen.', 
    url: 'https://general-overnight.com', 
    location: 'Bonn', 
    contactInfo: { 
      phone: '0800 859 9999',
      email: 'info@general-overnight.com',
      address: 'Brühler Straße 9, 53119 Bonn'
    } 
  },
  { 
    title: 'trans-o-flex Express', 
    category: 'LOGISTICS', 
    type: 'Pharma Logistik', 
    description: 'B2B-Spezialist für temperaturgeführte Transporte (Pharma/Kosmetik) und sensible Waren.', 
    url: 'https://tof.de', 
    location: 'Weinheim', 
    contactInfo: { 
      phone: '+49 6201 988 0',
      email: 'innovation@tof.de',
      address: 'Hertzstraße 10, 69469 Weinheim'
    } 
  },
  { 
    title: 'PostModern (Regional)', 
    category: 'LOGISTICS', 
    type: 'Versandservice', 
    description: 'Regionaler Postdienst aus Dresden; bietet Briefpost, Pakete und Fulfillment für B2B.', 
    url: 'https://post-modern.de', 
    location: 'Dresden', 
    contactInfo: { 
      phone: '0800 996 6331',
      email: 'info@post-modern.de',
      address: 'Meinholdstraße 2, 01129 Dresden',
      prices_2026: {
        'Paketschein (bis 2kg)': '5,39 €',
        'Abholgebühr': '3,00 €'
      }
    } 
  },
  { 
    title: 'PIN AG (Berlin)', 
    category: 'LOGISTICS', 
    type: 'Versandservice', 
    description: 'Berliner Brief- und Paketdienst; Fokus auf CO2-freie Stadtlogistik und CO2-neutralen Versand.', 
    url: 'https://pin-ag.de', 
    location: 'Berlin', 
    contactInfo: { 
      phone: '030 577978-0',
      email: 'info@pin-ag.de',
      address: 'Alt-Moabit 91, 10559 Berlin'
    } 
  },
  { 
    title: 'CITIPOST', 
    category: 'LOGISTICS', 
    type: 'Versandservice', 
    description: 'Regionaler Brief- und Paketdienst in Niedersachsen/Bremen; kostengünstige Alternativen.', 
    url: 'https://citipost.de', 
    location: 'Hannover', 
    contactInfo: { 
      phone: '0800 05110511',
      email: 'service@citipost.de',
      address: 'Lilienthalstraße 19, 30179 Hannover',
      prices_2026: {
        'Paket bis 3kg': '6,19 €',
        'Briefporto Standard': '0,90 €'
      }
    } 
  }
];

async function main() {
  console.log(`Seeding ${b2bData.length} Professional Resources...`);
  for (const item of b2bData) {
    const id = `res_${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    await prisma.resource.upsert({
      where: { id },
      update: {
        title: item.title,
        category: item.category,
        type: item.type,
        description: item.description,
        url: item.url,
        location: item.location,
        contactInfo: item.contactInfo as any,
      },
      create: {
        id,
        title: item.title,
        category: item.category,
        type: item.type,
        description: item.description,
        url: item.url,
        location: item.location,
        contactInfo: item.contactInfo as any,
      },
    });
  }
  console.log('Enterprise-grade resource seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });