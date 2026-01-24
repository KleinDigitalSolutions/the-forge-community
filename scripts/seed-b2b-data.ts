
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
  // Gefriergetrocknete Früchte, Trockenfrüchte & Feinkost
  { title: 'Valio Food GmbH', category: 'B2B_DIRECTORY', type: 'Feinkost', description: 'Spezialist für gefriergetrocknete Obst-Zutaten', url: 'https://valio.de', location: 'Hamburg', contactInfo: { phone: '+49 40 3330 5920', email: 'sales@valio.de', address: 'Ernst-Merck-Straße 12-14, 20099 Hamburg' } },
  { title: 'Horst Walberg Trockenfrucht Import GmbH (Howa)', category: 'B2B_DIRECTORY', type: 'Trockenfrüchte', description: 'Lieferant für Trockenfrüchte', url: 'https://howa.de', location: 'Kisdorf', contactInfo: { phone: '+49 4193 9819-0', email: 'info@howa.de', address: 'Henstedter Straße 21, 24629 Kisdorf' } },
  { title: 'NutriBoost B.V.', category: 'B2B_DIRECTORY', type: 'Superfoods', description: 'B2B-Lieferant für Superfoods und Trockenfrüchte', url: 'https://nutriboost.nl', location: 'Niederlande', contactInfo: { phone: '+31 10 3400077', email: 'info@nutriboost.nl', address: 'Scheepmakerstraat 6, 2984 BE Ridderkerk, NL' } },
  { title: 'Diana Company spol. s r.o.', category: 'B2B_DIRECTORY', type: 'Trockenfrüchte', description: 'Vertreiber von Trockenfrüchten', url: 'https://diana-company.de', location: 'Tschechien', contactInfo: { email: 'wirsindfursieda@diana-company.de', address: 'Na hůrce 1091/8, Halle 3, 161 00 Prag 6 (CZ)' } },
  { title: 'Foodcom S.A.', category: 'B2B_DIRECTORY', type: 'Gefriergetrocknete Früchte', description: 'Polnischer B2B-Anbieter', url: 'https://foodcom.pl', location: 'Polen', contactInfo: { phone: '+48 22 652 36 59', email: 'formularz@foodcom.pl' } },
  { title: 'Ehrenmanns', category: 'B2B_DIRECTORY', type: 'Snacks', description: 'Anbieter von gesunden Snacks', url: 'https://ehrenmanns.com', location: 'Stuttgart', contactInfo: { phone: '+49 711 577 677 88', email: 'info@ehrenmanns.com', address: 'Kapuzinerweg 10, 70374 Stuttgart' } },
  { title: 'Freeze-Dry Foods / Thrive Freezedry', category: 'B2B_DIRECTORY', type: 'Gefriergetrocknete Lebensmittel', description: 'Kontaktseite listet mehrere Vertriebsleiter', url: 'https://freeze-dry-foods.com', location: 'Deutschland/USA', contactInfo: { phone: '+49 171 748 40 55', email: 'info@freeze-dry-foods.com' } },
  { title: 'Apimex Obst- und Gemüsehandel', category: 'B2B_DIRECTORY', type: 'Trockenfrüchte', description: 'Kontaktseite führt Adressen für AT, DE und HU auf', url: 'https://apimex.at', location: 'Österreich', contactInfo: { phone: '+43 7242 54433', email: 'office@apimex.at', address: 'Edisonstraße 2, 4600 Wels (AT)' } },
  { title: 'Trustex Food', category: 'B2B_DIRECTORY', type: 'Trockenfrüchte', description: 'Importeur iranischer Trockenfrüchte', url: 'https://trustex-food.de', location: 'Düsseldorf', contactInfo: { phone: '+49 176 346 21 096', email: 'info@trustex-food.de' } },
  { title: 'Develey Senf & Feinkost GmbH', category: 'B2B_DIRECTORY', type: 'Feinkost', description: 'Feinkosthersteller mit B2B-Angebot', url: 'https://develey.de', location: 'Unterhaching', contactInfo: { phone: '+49 89 611020', email: 'develey-kontakt@develey.de', address: 'Ottobrunner Straße 45, 82008 Unterhaching' } },

  // Nahrungsergänzungsmittel & Sportnahrung
  { title: 'SportnahrungDirekt', category: 'B2B_DIRECTORY', type: 'Supplements', description: 'Großhandel für Supplements', url: 'https://sportnahrungdirekt.com', location: 'Kassel', contactInfo: { phone: '+49 561 95383965', email: 'shop@sportnahrungdirekt.com', address: 'Falderbaumstraße 13, 34123 Kassel' } },
  { title: 'bioKontor GmbH', category: 'B2B_DIRECTORY', type: 'Supplements', description: 'B2B-Lieferant für Bio-Produkte', url: 'https://biokontor.de', location: 'Hameln', contactInfo: { phone: '+49 5151 996 97 00', email: 'info@biokontor.de', address: 'Freibusch 9, 31789 Hameln' } },
  { title: 'Fitness Authority®', category: 'B2B_DIRECTORY', type: 'Supplements', description: 'Polnischer Hersteller von Nahrungsergänzungsmitteln', url: 'https://fitnessauthority.pl', location: 'Polen', contactInfo: { phone: '+48 58 522 07 56', email: 'biuro@fitnessauthority.pl', address: 'Konna 40, 80-174 Otomin (PL)' } },
  { title: 'iQ Pharma', category: 'B2B_DIRECTORY', type: 'Supplements', description: 'Hersteller für private label Supplements', url: 'https://iqpharma.de', location: 'Österreich', contactInfo: { phone: '+43 6246 211 660', email: 'info@iqpharma.de', address: 'Via Sanitas 1, A-5082 Grödig' } },
  { title: 'Maniac-Sports', category: 'B2B_DIRECTORY', type: 'Supplements', description: 'Großhändler für Sportnahrung', url: 'https://maniac-sports.de', location: 'Ennigerloh', contactInfo: { phone: '+49 176 4763 8973', email: 'info@maniac-sports.de', address: 'Nienkamp 18, 59320 Ennigerloh' } },
  { title: 'Best Nutrition GmbH', category: 'B2B_DIRECTORY', type: 'Supplements', description: 'Wholesale-Versand von Supplements', url: 'https://best-nutrition.de', location: 'Bielefeld', contactInfo: { phone: '+49 521 337 978 07', email: 'info@best-nutrition.de', address: 'Krackser Str. 12, 33659 Bielefeld' } },
  { title: 'Johannas Garten', category: 'B2B_DIRECTORY', type: 'Kräuter', description: 'B2B-Shop für Kräuter', url: 'https://johannasgarten.at', location: 'Wien', contactInfo: { phone: '+43 650 551 37 87', address: 'Alser Str. 41/ Geschäft 2, 1080 Wien' } },
  { title: 'Vegavero / Vanatari International GmbH', category: 'B2B_DIRECTORY', type: 'Supplements', description: 'Hersteller veganer Nahrungsergänzung', url: 'https://vegavero.com', location: 'Berlin', contactInfo: { phone: '+49 30 232567530', email: 'hello@vegavero.com', address: 'Pankstraße 8, Aufgang R, 13127 Berlin' } },
  { title: 'Keimling Naturkost GmbH', category: 'B2B_DIRECTORY', type: 'Naturkost', description: 'Naturkost-Versand; B2B-Kontakt verfügbar', url: 'https://keimling.de', location: 'Buxtehude', contactInfo: { phone: '+49 4161 5116 444', email: 'info@keimling.de', address: 'Zum Fruchthof 7a, 21614 Buxtehude' } },
  { title: 'Ceresal GmbH', category: 'B2B_DIRECTORY', type: 'Rohstoffe', description: 'Rohstoffe und Zutaten; Daten via Branchenquelle', url: 'https://ceresal.de', location: 'Mannheim', contactInfo: { phone: '+49 621 30978910', email: 'info@ceresal.de', address: 'Joseph-Meyer-Straße 13-15, 68167 Mannheim' } },

  // Verpackungsmaterial
  { title: 'Packhelp SA', category: 'B2B_DIRECTORY', type: 'Verpackung', description: 'B2B-Portal für Verpackungen', url: 'https://packhelp.com', location: 'Polen', contactInfo: { phone: '+44 20 3868 5092', email: 'hello@packhelp.com', address: 'Kolejowa 5/7, 01-217 Warschau (PL)' } },
  { title: 'RAJAPACK', category: 'B2B_DIRECTORY', type: 'Verpackung', description: 'Verpackung & Versandmaterial', url: 'https://rajapack.de', location: 'Deutschland', contactInfo: { phone: '0800 20 77 000', email: 'info@rajapack.de' } },
  { title: 'DS Smith Packaging', category: 'B2B_DIRECTORY', type: 'Verpackung', description: 'Lieferant für Wellpapp- und Verpackungslösungen', url: 'https://dssmith.com', location: 'Deutschland', contactInfo: { phone: '+49 661 88 400' } },
  { title: 'Packaging Roper GmbH & Co. KG', category: 'B2B_DIRECTORY', type: 'Verpackung', description: 'Spezialist für Verpackungsmaterialien', url: 'https://roper.de', location: 'Flossenbürg', contactInfo: { phone: '+49 9603 800690', email: 'info@roper.de', address: 'Säubergweg 1a, 92696 Flossenbürg' } },
  { title: 'ISK Verpackungen GmbH', category: 'B2B_DIRECTORY', type: 'Verpackung', description: 'Hersteller für Verpackungen & Displays', url: 'https://isk-verpackungen.com', location: 'Remscheid', contactInfo: { phone: '+49 2191 93365-0', email: 'post@isk-verpackungen.com', address: 'Kronprinzenstraße 42, 42857 Remscheid' } },
  { title: 'Spar-Pack GmbH', category: 'B2B_DIRECTORY', type: 'Verpackung', description: 'Großhändler für Verpackungslösungen', url: 'https://spar-pack.de', location: 'Hagen a.T.W.', contactInfo: { phone: '+49 5405 8089186', email: 'info@spar-pack.de', address: 'Anne-Frank-Str. 18c, 49170 Hagen a.T.W.' } },
  { title: 'AR-TU Pack Großhandel GmbH', category: 'B2B_DIRECTORY', type: 'Verpackung', description: 'B2B-Großhandel für Verpackung & Getränke', url: 'https://artu-grosshandel.de', location: 'Berlin', contactInfo: { phone: '0177 7533366', email: 'info@artu-grosshandel.de', address: 'Thaterstraße 1, 13407 Berlin' } },
  { title: 'Euronet Packaging', category: 'B2B_DIRECTORY', type: 'Verpackung', description: 'Beliefert deutsche B2B-Kunden', url: 'https://euronet-packaging.de', location: 'Slowenien', contactInfo: { phone: '+386 41 339 224', email: 'info@euronet-packaging.de', address: 'Artiče , 8250 Brežice (SI)' } },
  { title: 'Ultralen Film GmbH', category: 'B2B_DIRECTORY', type: 'Verpackung', description: 'Spezialist für Kunststofffolien', url: 'https://ultralen.com', location: 'Weil am Rhein', contactInfo: { phone: '+49 7621 422 388 0', email: 'info@ultralen.com', address: 'Lustgartenstraße 6, 79576 Weil am Rhein' } },
  { title: 'TK Gruppe GmbH', category: 'B2B_DIRECTORY', type: 'Verpackung', description: 'Großhändler für Haushalts- und Verpackungsprodukte', url: 'https://grosshandel-b2b.com', location: 'Sandhausen', contactInfo: { phone: '06224 9233590', email: 'info@tk-gruppe.com', address: 'Hauptstraße 129, 69207 Sandhausen' } },
  { title: 'aboutwater GmbH', category: 'B2B_DIRECTORY', type: 'Werbeartikel', description: 'Anbieter von individuell bedruckten Flaschen', url: 'https://aboutwater.de', location: 'Planegg', contactInfo: { phone: '+49 89 95 45 93-0', email: 'info@aboutwater.de', address: 'Robert-Koch-Straße 2, 82152 Planegg' } },
  { title: 'Gröner-Schulze GmbH', category: 'B2B_DIRECTORY', type: 'Druck', description: 'Bietet Werbetechnik, Digitaldruck und Textildruck', url: 'https://groener-schulze.com', location: 'Schönefeld', contactInfo: { phone: '+49 30 68 29 54-0', email: 'info@groener-schulze.com', address: 'Sarirstraße 5, 12529 Schönefeld' } },

  // Kleidung & Textilien
  { title: 'Kurt Kölln GmbH', category: 'B2B_DIRECTORY', type: 'Mode', description: 'Großhandel für Damenmode', url: 'https://kurtkoelln.de', location: 'Hamburg', contactInfo: { phone: '040 5500012', email: 'info@kurtkoelln.de', address: 'Modering 3, 22457 Hamburg' } },
  { title: 'Textil-Großhandel (Hastedt eCommerce GmbH)', category: 'B2B_DIRECTORY', type: 'Mode', description: 'Großhandelsplattform für Textilien & Merchandise', url: 'https://textil-grosshandel.eu', location: 'Dortmund', contactInfo: { phone: '+49 231 586891-20', email: 'info@textil-grosshandel.eu', address: 'Bookenburgweg 1, 44319 Dortmund' } },
  { title: 'Poppistrong Großhandel', category: 'B2B_DIRECTORY', type: 'Mode', description: 'Bekleidungs-Großhandel', url: 'https://grosshandel-poppistrong.de', location: 'Gelsenkirchen', contactInfo: { phone: '+49 209 36047501', email: 'info@grosshandel-poppistrong.de', address: 'Am Luftschacht 3A, 45886 Gelsenkirchen' } },
  { title: 'ATA-Mode Großhandel', category: 'B2B_DIRECTORY', type: 'Mode', description: 'B2B-Lieferant für Damenmode', url: 'https://ata-mode.de', location: 'Wolmirsleben', contactInfo: { phone: '+49 5403 7884910', email: 'info@ata-mode.de', address: 'Chaussee 32, 39435 Wolmirsleben' } },

  // Lager & Logistik (B2B_Lager)
  { title: 'Denkinger GmbH', category: 'LOGISTICS', type: 'Fulfillment', description: 'Spedition und Kontraktlogistik, inklusive Lagerung und Verpackung', url: 'https://denkinger-logistik.de', location: 'Ehingen', contactInfo: { phone: '07391 70880', email: 'info@denkinger-logistik.de', address: 'Röntgenstraße 6, 89584 Ehingen' } },
  { title: 'Lufapak GmbH', category: 'LOGISTICS', type: 'Fulfillment', description: 'B2B-Fulfillment, Lagerung, Versand und Retourenabwicklung', url: 'https://lufapak.de', location: 'Neuwied', contactInfo: { phone: '+49 2631 384-0', email: 'sales@lufapak.de', address: 'Carl-Borgward-Straße 20, 56566 Neuwied' } },
  { title: 'LLS Service GmbH', category: 'LOGISTICS', type: 'Lagerdienste', description: 'Kontraktlogistik und Lagerdienste im Ruhrgebiet', url: 'https://lls.services', location: 'Gladbeck', contactInfo: { phone: '+49 2043 9210730', email: 'info@lls.services', address: 'Lambertistraße 21, 45964 Gladbeck' } },
  { title: 'Elandia Fulfillment GmbH', category: 'LOGISTICS', type: 'Fulfillment', description: 'Fulfillment, Lagerung und weltweiter Versand für E-Commerce', url: 'https://elandia.de', location: 'Wassenberg', contactInfo: { phone: '+49 2433 9642260', email: 'fulfillment@elandia.de', address: 'Lehmkaul 3, 41849 Wassenberg' } },
  { title: 'Metro Logistics (GmbH)', category: 'LOGISTICS', type: 'Lagerdienste', description: 'Kontraktlogistik, Multi-User-Lager und Value-Added-Services', url: 'https://metro-logistics.de', location: 'Düsseldorf', contactInfo: { phone: '+49 211 6886-0', email: 'info@metro-logistics.de', address: 'Schlüterstraße 1, 40235 Düsseldorf' } },
  { title: 'Fulfy Logistics', category: 'LOGISTICS', type: 'Fulfillment', description: 'E-Commerce-Fulfillment inklusive Lagerung, Kommissionierung, Verpackung und Etikettierung', url: 'https://fulfy.de', location: 'Neumünster/Kiel', contactInfo: { phone: '+49 431 55699596', email: 'kontakt@fulfy.de', address: 'Friedrich-Wöhler-Str. 18, 24536 Neumünster' } },
  { title: 'VONEXIO', category: 'LOGISTICS', type: 'Fulfillment', description: 'E-Commerce-Logistik, Lagerung und Fulfillment', url: 'https://vonexio.com', location: 'Köln', contactInfo: { phone: '+49 2203 2971172', email: 'office@vonexio.com', address: 'Welserstr. 6a, 51149 Köln' } },
  { title: 'FIEGE Logistik', category: 'LOGISTICS', type: 'Fulfillment', description: 'Kontraktlogistik, Intralogistik und E-Commerce-Fulfillment', url: 'https://fiege.com', location: 'Greven', contactInfo: { phone: '+49 2571 999-0', address: 'Joan-Joseph-Fiege-Straße 1, 48268 Greven' } },
  { title: 'Rhenus SE & Co. KG', category: 'LOGISTICS', type: 'Fulfillment', description: 'Weltweit tätiger Logistikdienstleister', url: 'https://rhenus.com', location: 'Holzwickede', contactInfo: { phone: '+49 2301 29-0', email: 'info@rhenus.com', address: 'Rhenus-Platz 1, 59439 Holzwickede' } },
];

async function main() {
  console.log('Seeding B2B Resources...');
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
  console.log('All resources seeded successfully.');
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

