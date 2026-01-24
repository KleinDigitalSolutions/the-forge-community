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
  // --- B2B HÄNDLER (Kategorie: B2B_DIRECTORY) ---
  { title: 'Valio Food GmbH', category: 'B2B_DIRECTORY', type: 'Gefriergetrocknete Früchte', description: 'Spezialist für gefriergetrocknete Obst-Zutaten', url: 'https://valio.de', location: 'Hamburg', contactInfo: { phone: '+49 40 3330 5920', email: 'sales@valio.de', address: 'Ernst-Merck-Straße 12-14, 20099 Hamburg' } },
  { title: 'Horst Walberg Trockenfrucht (Howa)', category: 'B2B_DIRECTORY', type: 'Trockenfrüchte', description: 'Lieferant für Trockenfrüchte aus Deutschland', url: 'https://howa.de', location: 'Kisdorf', contactInfo: { phone: '+49 4193 9819-0', email: 'info@howa.de', address: 'Henstedter Straße 21, 24629 Kisdorf' } },
  { title: 'NutriBoost B.V.', category: 'B2B_DIRECTORY', type: 'Superfoods', description: 'B2B-Lieferant für Superfoods und Trockenfrüchte (NL)', url: 'https://nutriboost.nl', location: 'Niederlande', contactInfo: { phone: '+31 10 3400077', email: 'info@nutriboost.nl', address: 'Scheepmakerstraat 6, 2984 BE Ridderkerk, NL' } },
  { title: 'Diana Company spol. s r.o.', category: 'B2B_DIRECTORY', type: 'Trockenfrüchte', description: 'Vertreiber von Trockenfrüchten aus Tschechien', url: 'https://diana-company.de', location: 'Prag, CZ', contactInfo: { email: 'wirsindfursieda@diana-company.de', address: 'Na hůrce 1091/8, Halle 3, 161 00 Prag 6' } },
  { title: 'Foodcom S.A.', category: 'B2B_DIRECTORY', type: 'Feinkost', description: 'Polnischer B2B-Anbieter für gefriergetrocknete Früchte', url: 'https://foodcom.pl', location: 'Warschau, PL', contactInfo: { phone: '+48 22 652 36 59', email: 'formularz@foodcom.pl' } },
  { title: 'Ehrenmanns', category: 'B2B_DIRECTORY', type: 'Snacks', description: 'Anbieter von gesunden Snacks und Feinkost', url: 'https://ehrenmanns.com', location: 'Stuttgart', contactInfo: { phone: '+49 711 577 677 88', email: 'info@ehrenmanns.com', address: 'Kapuzinerweg 10, 70374 Stuttgart' } },
  { title: 'Freeze-Dry Foods / Thrive', category: 'B2B_DIRECTORY', type: 'Gefriergetrocknete Lebensmittel', description: 'Globaler Spezialist für Gefriertrocknung', url: 'https://freeze-dry-foods.com', location: 'Deutschland/USA', contactInfo: { phone: '+49 171 748 40 55', email: 'info@freeze-dry-foods.com' } },
  { title: 'Apimex Obst- und Gemüsehandel', category: 'B2B_DIRECTORY', type: 'Trockenfrüchte', description: 'Großhandel für Obst, Gemüse und Trockenfrüchte', url: 'https://apimex.at', location: 'Wels, Österreich', contactInfo: { phone: '+43 7242 54433', email: 'office@apimex.at', address: 'Edisonstraße 2, 4600 Wels' } },
  { title: 'Trustex Food', category: 'B2B_DIRECTORY', type: 'Trockenfrüchte', description: 'Importeur iranischer Trockenfrüchte (Düsseldorf)', url: 'https://trustex-food.de', location: 'Düsseldorf', contactInfo: { phone: '+49 176 346 21 096', email: 'info@trustex-food.de' } },
  { title: 'Develey Senf & Feinkost GmbH', category: 'B2B_DIRECTORY', type: 'Saucen & Feinkost', description: 'Feinkosthersteller mit B2B-Angebot für Saucen/Senf', url: 'https://develey.de', location: 'Unterhaching', contactInfo: { phone: '+49 89 611020', email: 'develey-kontakt@develey.de', address: 'Ottobrunner Straße 45, 82008 Unterhaching' } },
  
  { title: 'SportnahrungDirekt', category: 'B2B_DIRECTORY', type: 'Supplements', description: 'Großhandel für Sportnahrung und Supplements', url: 'https://sportnahrungdirekt.com', location: 'Kassel', contactInfo: { phone: '+49 561 95383965', email: 'shop@sportnahrungdirekt.com', address: 'Falderbaumstraße 13, 34123 Kassel' } },
  { title: 'bioKontor GmbH', category: 'B2B_DIRECTORY', type: 'Bio-Produkte', description: 'B2B-Lieferant für Bio-Superfoods & Supplements', url: 'https://biokontor.de', location: 'Hameln', contactInfo: { phone: '+49 5151 996 97 00', email: 'info@biokontor.de', address: 'Freibusch 9, 31789 Hameln' } },
  { title: 'Fitness Authority®', category: 'B2B_DIRECTORY', type: 'Supplements', description: 'Polnischer Hersteller von Nahrungsergänzungsmitteln', url: 'https://fitnessauthority.pl', location: 'Otomin, PL', contactInfo: { phone: '+48 58 522 07 56', email: 'biuro@fitnessauthority.pl', address: 'Konna 40, 80-174 Otomin' } },
  { title: 'iQ Pharma', category: 'B2B_DIRECTORY', type: 'Supplements', description: 'Hersteller für personalisierte private label Supplements', url: 'https://iqpharma.de', location: 'Grödig, Österreich', contactInfo: { phone: '+43 6246 211 660', email: 'info@iqpharma.de', address: 'Via Sanitas 1, A-5082 Grödig' } },
  { title: 'Maniac-Sports', category: 'B2B_DIRECTORY', type: 'Sportnahrung', description: 'Großhändler für Sportnahrung und Zubehör', url: 'https://maniac-sports.de', location: 'Ennigerloh', contactInfo: { phone: '+49 176 4763 8973', email: 'info@maniac-sports.de', address: 'Nienkamp 18, 59320 Ennigerloh' } },
  { title: 'Best Nutrition GmbH', category: 'B2B_DIRECTORY', type: 'Supplements', description: 'Wholesale-Versand von Nahrungsergänzungsmitteln', url: 'https://best-nutrition.de', location: 'Bielefeld', contactInfo: { phone: '+49 521 337 978 07', email: 'info@best-nutrition.de', address: 'Krackser Str. 12, 33659 Bielefeld' } },
  { title: 'Johannas Garten', category: 'B2B_DIRECTORY', type: 'Kräuter', description: 'B2B-Shop für Kräuter & Naturprodukte', url: 'https://johannasgarten.at', location: 'Wien, Österreich', contactInfo: { phone: '+43 650 551 37 87', address: 'Alser Str. 41, 1080 Wien' } },
  { title: 'Vegavero (Vanatari)', category: 'B2B_DIRECTORY', type: 'Vegane Supplements', description: 'Hersteller veganer Nahrungsergänzung aus Berlin', url: 'https://vegavero.com', location: 'Berlin', contactInfo: { phone: '+49 30 232567530', email: 'hello@vegavero.com', address: 'Pankstraße 8, 13127 Berlin' } },
  { title: 'Keimling Naturkost GmbH', category: 'B2B_DIRECTORY', type: 'Naturkost', description: 'Versand für Rohkost und Geräte mit B2B-Bereich', url: 'https://keimling.de', location: 'Buxtehude', contactInfo: { phone: '+49 4161 5116 444', email: 'info@keimling.de', address: 'Zum Fruchthof 7a, 21614 Buxtehude' } },
  { title: 'Ceresal GmbH', category: 'B2B_DIRECTORY', type: 'Rohstoffe', description: 'Rohstofflieferant für Lebensmittelzutaten', url: 'https://ceresal.de', location: 'Mannheim', contactInfo: { phone: '+49 621 30978910', email: 'info@ceresal.de', address: 'Joseph-Meyer-Straße 13-15, 68167 Mannheim' } },

  { title: 'Packhelp SA', category: 'B2B_DIRECTORY', type: 'Verpackung', description: 'B2B-Portal für individuelle Verpackungslösungen', url: 'https://packhelp.com', location: 'Warschau, PL', contactInfo: { phone: '+44 20 3868 5092', email: 'hello@packhelp.com', address: 'Kolejowa 5/7, 01-217 Warschau' } },
  { title: 'RAJAPACK', category: 'B2B_DIRECTORY', type: 'Versandmaterial', description: 'Großhandel für Verpackung & Versandmaterial', url: 'https://rajapack.de', location: 'Deutschland', contactInfo: { phone: '0800 20 77 000', email: 'info@rajapack.de' } },
  { title: 'DS Smith Packaging', category: 'B2B_DIRECTORY', type: 'Verpackung', description: 'Lieferant für Wellpapp- und Displaylösungen', url: 'https://dssmith.com', location: 'D/CH', contactInfo: { phone: '+49 661 88 400' } },
  { title: 'Packaging Roper GmbH', category: 'B2B_DIRECTORY', type: 'Verpackung', description: 'Spezialist für hochwertige Verpackungsmaterialien', url: 'https://roper.de', location: 'Flossenbürg', contactInfo: { phone: '+49 9603 800690', email: 'info@roper.de', address: 'Säubergweg 1a, 92696 Flossenbürg' } },
  { title: 'ISK Verpackungen GmbH', category: 'B2B_DIRECTORY', type: 'Verpackung', description: 'Hersteller für Verpackungen & Displays aus Remscheid', url: 'https://isk-verpackungen.com', location: 'Remscheid', contactInfo: { phone: '+49 2191 93365-0', email: 'post@isk-verpackungen.com', address: 'Kronprinzenstraße 42, 42857 Remscheid' } },
  { title: 'Spar-Pack GmbH', category: 'B2B_DIRECTORY', type: 'Verpackung', description: 'Großhändler für innovative Verpackungslösungen', url: 'https://spar-pack.de', location: 'Hagen a.T.W.', contactInfo: { phone: '+49 5405 8089186', email: 'info@spar-pack.de', address: 'Anne-Frank-Str. 18c, 49170 Hagen' } },
  { title: 'AR-TU Pack Großhandel', category: 'B2B_DIRECTORY', type: 'Verpackung & Getränke', description: 'B2B-Großhandel für Verpackung und Lebensmittel', url: 'https://artu-grosshandel.de', location: 'Berlin', contactInfo: { phone: '0177 7533366', email: 'info@artu-grosshandel.de', address: 'Thaterstraße 1, 13407 Berlin' } },
  { title: 'Euronet Packaging', category: 'B2B_DIRECTORY', type: 'Kartonagen', description: 'Produzent von Kartonagen & Wellpappe (Slowenien)', url: 'https://euronet-packaging.de', location: 'Artiče, Slowenien', contactInfo: { phone: '+386 41 339 224', email: 'info@euronet-packaging.de' } },
  { title: 'Ultralen Film GmbH', category: 'B2B_DIRECTORY', type: 'Folien', description: 'Spezialist für Kunststofffolien und Verpackungen', url: 'https://ultralen.com', location: 'Weil am Rhein', contactInfo: { phone: '+49 7621 422 388 0', email: 'info@ultralen.com', address: 'Lustgartenstraße 6, 79576 Weil am Rhein' } },
  { title: 'TK Gruppe GmbH', category: 'B2B_DIRECTORY', type: 'Haushalt & Verpackung', description: 'Großhändler für Haushalts- und Verpackungsprodukte', url: 'https://grosshandel-b2b.com', location: 'Sandhausen', contactInfo: { phone: '06224 9233590', email: 'info@tk-gruppe.com', address: 'Hauptstraße 129, 69207 Sandhausen' } },
  { title: 'aboutwater GmbH', category: 'B2B_DIRECTORY', type: 'Werbeartikel', description: 'Spezialist für individuell bedruckte Trinkflaschen', url: 'https://aboutwater.de', location: 'Planegg', contactInfo: { phone: '+49 89 95 45 93-0', email: 'info@aboutwater.de', address: 'Robert-Koch-Straße 2, 82152 Planegg' } },
  { title: 'Gröner-Schulze GmbH', category: 'B2B_DIRECTORY', type: 'Drucktechnik', description: 'Werbetechnik, Digital- und Textildruck Großhandel', url: 'https://groener-schulze.com', location: 'Schönefeld', contactInfo: { phone: '+49 30 68 29 54-0', email: 'info@groener-schulze.com', address: 'Sarirstraße 5, 12529 Schönefeld' } },
  { title: 'Flashbay / Flasky', category: 'B2B_DIRECTORY', type: 'Werbeartikel', description: 'B2B-Spezialist für bedruckte Trinkflaschen (UK)', url: 'https://flashbay.com', location: 'London, UK', contactInfo: { phone: '+44 20 7371 7333', email: 'contact@flashbay.com' } },
  { title: 'Hackenberg Group', category: 'B2B_DIRECTORY', type: 'Textiletiketten', description: 'Produzent von Textilbändern und Etiketten', url: 'https://hackenberg-group.de', location: 'Wuppertal', contactInfo: { phone: '+49 202 24734-0', email: 'band@hackenberg-group.de', address: 'Heidestraße 21, 42349 Wuppertal' } },

  { title: 'Kurt Kölln GmbH', category: 'B2B_DIRECTORY', type: 'Mode-Großhandel', description: 'Großhandel für Damenmode und Accessoires', url: 'https://kurtkoelln.de', location: 'Hamburg/München', contactInfo: { phone: '040 5500012', email: 'info@kurtkoelln.de', address: 'Modering 3, 22457 Hamburg' } },
  { title: 'Textil-Großhandel (Hastedt)', category: 'B2B_DIRECTORY', type: 'Workwear', description: 'Plattform für Textilien, Workwear & Merchandise', url: 'https://textil-grosshandel.eu', location: 'Dortmund', contactInfo: { phone: '+49 231 586891-20', email: 'info@textil-grosshandel.eu', address: 'Bookenburgweg 1, 44319 Dortmund' } },
  { title: 'Poppistrong Großhandel', category: 'B2B_DIRECTORY', type: 'Streetwear', description: 'Bekleidungs-Großhandel für Street- & Sportswear', url: 'https://grosshandel-poppistrong.de', location: 'Gelsenkirchen', contactInfo: { phone: '+49 209 36047501', email: 'info@grosshandel-poppistrong.de', address: 'Am Luftschacht 3A, 45886 Gelsenkirchen' } },
  { title: 'ATA-Mode Großhandel', category: 'B2B_DIRECTORY', type: 'Damenmode', description: 'B2B-Lieferant für trendige Damenmode & Accessoires', url: 'https://ata-mode.de', location: 'Wolmirsleben', contactInfo: { phone: '+49 5403 7884910', email: 'info@ata-mode.de', address: 'Chaussee 32, 39435 Wolmirsleben' } },
  { title: 'Tranquillo GmbH', category: 'B2B_DIRECTORY', type: 'Nachhaltige Mode', description: 'Großhandel für nachhaltige Bekleidung und Lifestyle', url: 'https://tranquillo-shop.de', location: 'Dresden', contactInfo: { phone: '+49 351 810 633 200', email: 'b2b@tranquillo-shop.de', address: 'Marta-Fraenkel-Str. 1, 01097 Dresden' } },
  { title: 'HRM Textil GmbH', category: 'B2B_DIRECTORY', type: 'Corporate Fashion', description: 'Hersteller für hochwertige Arbeits- und Imagekleidung', url: 'https://hrm-textil.de', location: 'Fellbach', contactInfo: { phone: '+49 711 64515575', email: 'info@hrm-textil.de', address: 'Welfenstraße 12, 70736 Fellbach' } },
  { title: 'Nostalgic-Art Merchandising', category: 'B2B_DIRECTORY', type: 'Merchandise', description: 'Produktion von Retro-Blechschildern und Merchandise', url: 'https://nostalgic-art.de', location: 'Berlin', contactInfo: { phone: '+49 30 306 47 000', email: 'info@nostalgic-art.de', address: 'Am Borsigturm 156, 13507 Berlin' } },
  { title: 'Tuzzi Collection GmbH', category: 'B2B_DIRECTORY', type: 'Mode', description: 'B2B-Portal für exklusive Damenmode', url: 'https://tuzzi.de', location: 'Münchberg', contactInfo: { phone: '+49 9251 4470', email: 'info@tuzzi.de', address: 'Hans-Hofmann-Straße 11, 95213 Münchberg' } },
  { title: 'Fynch-Hatton Textilhandel', category: 'B2B_DIRECTORY', type: 'Herrenmode', description: 'Renommierter Herrenausstatter mit B2B-Vertrieb', url: 'https://fynch-hatton.de', location: 'Mönchengladbach', contactInfo: { phone: '+49 2161 56745 1085', email: 'info@fynch-hatton.de', address: 'Alsstraße 166, 41063 Mönchengladbach' } },

  { title: 'Mercateo / Unite', category: 'B2B_DIRECTORY', type: 'Plattform', description: 'Führender B2B-Marktplatz für Geschäftskunden', url: 'https://unite.eu', location: 'Köthen/Leipzig', contactInfo: { phone: '+49 89 12 140 777', email: 'service.de@unite.eu' } },
  { title: 'Restposten.de', category: 'B2B_DIRECTORY', type: 'Marktplatz', description: 'B2B-Marktplatz für Restposten und Sonderposten', url: 'https://restposten.de', location: 'Solingen', contactInfo: { phone: '+49 212 380 890', email: 'service@gksgmbh.de' } },
  { title: 'BigBuy', category: 'B2B_DIRECTORY', type: 'Dropshipping', description: 'B2B-Großhandelsplattform mit Fokus auf Dropshipping (Spanien)', url: 'https://bigbuy.eu', location: 'Valencia, Spanien', contactInfo: { phone: '+34 96 115 04 22', email: 'hello@bigbuy.eu' } },
  { title: 'Alibaba Group', category: 'B2B_DIRECTORY', type: 'Plattform', description: 'Globaler B2B-Marktplatz für Import aus Asien', url: 'https://alibaba.com', location: 'Hangzhou, China', contactInfo: { phone: '+86 571 8502 2088' } },
  { title: 'Maxy / ISO Trade', category: 'B2B_DIRECTORY', type: 'Importeur', description: 'B2B-Importeur für Trendprodukte aus China (Polen)', url: 'https://maxy.eu', location: 'Legnickie Pole, PL', contactInfo: { phone: '+48 664 995 011', email: 'b2b@maxy.eu' } },
  { title: 'NANDOO Hundefutter', category: 'B2B_DIRECTORY', type: 'Heimtierbedarf', description: 'Großhandel für Kauartikel und Hundefutter', url: 'https://nandoo.de', location: 'Xanten', contactInfo: { phone: '02801 988 3033', email: 'kundenservice@kauartikel-b2b.de' } },
  { title: 'Biova GmbH', category: 'B2B_DIRECTORY', type: 'Gewürze', description: 'Importeur von Gourmet-Salzen und Gewürzen', url: 'https://biova.de', location: 'Wildberg', contactInfo: { phone: '+49 7054 93123-0', email: 'info@biova.de' } },
  { title: 'Karl Zieres GmbH', category: 'B2B_DIRECTORY', type: 'Backzutaten', description: 'B2B-Anbieter von Tartelettes und Backwaren', url: 'https://karl-zieres.de', location: 'Hanau', contactInfo: { phone: '06181 180 460', email: 'info@karl-zieres.de' } },

  // --- LOGISTIK & LAGER (Kategorie: LOGISTICS) ---
  { title: 'Denkinger GmbH', category: 'LOGISTICS', type: 'Spedition & Kontraktlogistik', description: 'Lagerung, Verpackung und Transportlösungen', url: 'https://denkinger-logistik.de', location: 'Ehingen', contactInfo: { phone: '07391 70880', email: 'info@denkinger-logistik.de', address: 'Röntgenstraße 6, 89584 Ehingen' } },
  { title: 'Lufapak GmbH', category: 'LOGISTICS', type: 'B2B Fulfillment', description: 'Fulfillment, Lagerung, Versand und Retourenmanagement', url: 'https://lufapak.de', location: 'Neuwied', contactInfo: { phone: '+49 2631 384-0', email: 'sales@lufapak.de', address: 'Carl-Borgward-Straße 20, 56566 Neuwied' } },
  { title: 'LLS Service GmbH', category: 'LOGISTICS', type: 'Lagerdienste', description: 'Kontraktlogistik und Lagerdienste im Ruhrgebiet', url: 'https://lls.services', location: 'Gladbeck', contactInfo: { phone: '+49 2043 9210730', email: 'info@lls.services', address: 'Lambertistraße 21, 45964 Gladbeck' } },
  { title: 'Elandia Fulfillment', category: 'LOGISTICS', type: 'E-Commerce Fulfillment', description: 'Lagerung und weltweiter Versand für Online-Shops', url: 'https://elandia.de', location: 'Wassenberg', contactInfo: { phone: '+49 2433 9642260', email: 'fulfillment@elandia.de', address: 'Lehmkaul 3, 41849 Wassenberg' } },
  { title: 'Metro Logistics GmbH', category: 'LOGISTICS', type: 'Multi-User-Lager', description: 'Kontraktlogistik und Value-Added-Services', url: 'https://metro-logistics.de', location: 'Düsseldorf', contactInfo: { phone: '+49 211 6886-0', email: 'info@metro-logistics.de', address: 'Schlüterstraße 1, 40235 Düsseldorf' } },
  { title: 'Fulfy Logistics', category: 'LOGISTICS', type: 'E-Commerce Fulfillment', description: 'Kommissionierung, Verpackung und Etikettierung', url: 'https://fulfy.de', location: 'Neumünster/Kiel', contactInfo: { phone: '+49 431 55699596', email: 'kontakt@fulfy.de', address: 'Friedrich-Wöhler-Str. 18, 24536 Neumünster' } },
  { title: 'VONEXIO Logistik', category: 'LOGISTICS', type: 'E-Commerce Logistik', description: 'Lagerung und Fulfillment Spezialist für Brands', url: 'https://vonexio.com', location: 'Köln', contactInfo: { phone: '+49 2203 2971172', email: 'office@vonexio.com', address: 'Welserstr. 6a, 51149 Köln' } },
  { title: 'Mail Boxes Etc. (MBE)', category: 'LOGISTICS', type: 'Versandservices', description: 'Versand-, Verpackungs- und Lagerlösungen für KMU', url: 'https://mbe.de', location: 'Berlin (Zentrale)', contactInfo: { phone: '+49 30 7262090', email: 'mbe@mbe.de', address: 'Bundesallee 39-40a, 10717 Berlin' } },
  { title: 'FIEGE Logistik (Zentrale)', category: 'LOGISTICS', type: 'Kontraktlogistik', description: 'Führender Anbieter für Intralogistik und E-Commerce', url: 'https://fiege.com', location: 'Greven', contactInfo: { phone: '+49 2571 999-0', address: 'Joan-Joseph-Fiege-Straße 1, 48268 Greven' } },
  { title: 'FIEGE Logistik Bremen', category: 'LOGISTICS', type: 'Palettenlager', description: 'Spezialisiert auf Multi-User-Lager und Kleinteile', url: 'https://fiege.com', location: 'Bremen', contactInfo: { phone: '0421 54904-0', email: 'LogistikCenterHB@fiege.de', address: 'Am Tabakquartier 62, 28197 Bremen' } },
  
  // B+S Standorte
  { title: 'B+S Logistik Alzenau', category: 'LOGISTICS', type: 'Fulfillment Center', description: 'Multi-User-Lager und Konfektionierung', url: 'https://b-slogistik.de', location: 'Alzenau', contactInfo: { phone: '+49 6188 91923-500', email: 'alzenau@b-slogistik.de' } },
  { title: 'B+S Logistik Bielefeld', category: 'LOGISTICS', type: 'Fulfillment Center', description: 'Kommissionierung und Versandabwicklung', url: 'https://b-slogistik.de', location: 'Bielefeld', contactInfo: { phone: '+49 5205 989988-150', email: 'bielefeld@b-slogistik.de' } },
  { title: 'B+S Logistik Hamburg', category: 'LOGISTICS', type: 'Fulfillment Center', description: 'Hafen-Logistik und E-Commerce Versand', url: 'https://b-slogistik.de', location: 'Hamburg', contactInfo: { phone: '+49 40 35718990', email: 'hamburg@b-slogistik.de' } },
  
  { title: 'Rhenus SE & Co. KG', category: 'LOGISTICS', type: 'Global Logistik', description: 'Transport, Kontraktlogistik und Hafenlogistik weltweit', url: 'https://rhenus.com', location: 'Holzwickede', contactInfo: { phone: '+49 2301 29-0', email: 'info@rhenus.com' } },
  { title: 'Dachser SE', category: 'LOGISTICS', type: 'Stückgutnetzwerk', description: 'Luft-, Seefracht- und weltweite Kontraktlogistik', url: 'https://dachser.com', location: 'Kempten', contactInfo: { phone: '+49 831 5916 0', email: 'info@dachser.com' } },
  { title: 'Schenker Deutschland', category: 'LOGISTICS', type: 'Warehousing', description: 'Transporte, Lagerung und Zollabwicklung weltweit', url: 'https://dbschenker.com', location: 'Bremen', contactInfo: { phone: '+49 69 24744-0', email: 'service.line@dbschenker.com' } },
  { title: 'LOXXESS AG', category: 'LOGISTICS', type: 'Fulfillment Spezialist', description: 'Logistik für Pharma, Food und Online-Handel', url: 'https://loxxess.com', location: 'Unterföhring', contactInfo: { phone: '+49 89 255476-10', email: 'anfrage@loxxess.com' } },
  { title: 'Hellmann Logistics', category: 'LOGISTICS', type: 'Full-Service Logistik', description: 'Stückgut, Expressversand und Kontraktlogistik', url: 'https://hellmann.com', location: 'Osnabrück', contactInfo: { phone: '+49 541 605-0', email: 'info@hellmann.com' } },
  { title: 'Hermes Fulfilment', category: 'LOGISTICS', type: 'Retourenmanagement', description: 'Spezialist für Versandhandel und Reparaturen (Otto Group)', url: 'https://hermes-ws.com', location: 'Hamburg', contactInfo: { phone: '+49 40 537 55-0', email: 'kontakt@hermes-ws.com' } },
  
  // Immobilien / Hallen
  { title: 'Prologis Germany', category: 'LOGISTICS', type: 'Lagerimmobilien', description: 'Entwickler und Vermieter von Logistik-Parks', url: 'https://prologis.com', location: 'Düsseldorf', contactInfo: { phone: '+49 211 542310', email: 'info-de@prologis.com' } },
  { title: 'SEGRO Germany', category: 'LOGISTICS', type: 'Gewerbeparks', description: 'Vermieter von modernen Logistik- und Hallenflächen', url: 'https://segro.com', location: 'DE-weit', contactInfo: { phone: '+49 211 497650', email: 'germany@segro.com' } },
  { title: 'GARBE Industrial Real Estate', category: 'LOGISTICS', type: 'Asset Manager', description: 'Logistik-Immobilien und Multi-Tenant-Parks', url: 'https://garbe.de', location: 'Hamburg', contactInfo: { phone: '+49 40 35613-0', email: 'info@garbe.de' } },
  { title: 'VGP Industriebau', category: 'LOGISTICS', type: 'Projektentwickler', description: 'Bau und Vermietung von Gewerbeparks in Europa', url: 'https://vgpparks.eu', location: 'Düsseldorf', contactInfo: { phone: '+49 211 875 445-00', email: 'germany@vgpparks.eu' } },
];

async function main() {
  console.log(`Seeding ${b2bData.length} Resources...`);
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