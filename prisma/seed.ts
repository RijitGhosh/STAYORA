import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/* ------------------------------------------------------------------ */
/* India locations                                                     */
/* ------------------------------------------------------------------ */

const STATES: { name: string; code: string; cities: string[] }[] = [
  { name: 'Delhi', code: 'DL', cities: ['New Delhi'] },
  { name: 'Maharashtra', code: 'MH', cities: ['Mumbai', 'Pune', 'Lonavala'] },
  { name: 'Goa', code: 'GA', cities: ['Panaji', 'Calangute'] },
  { name: 'Rajasthan', code: 'RJ', cities: ['Jaipur', 'Udaipur', 'Jodhpur'] },
  { name: 'Karnataka', code: 'KA', cities: ['Bangalore', 'Mysore', 'Coorg'] },
  { name: 'Tamil Nadu', code: 'TN', cities: ['Chennai', 'Ooty'] },
  { name: 'Kerala', code: 'KL', cities: ['Kochi', 'Munnar', 'Alleppey'] },
  { name: 'Himachal Pradesh', code: 'HP', cities: ['Shimla', 'Manali'] },
  { name: 'Uttarakhand', code: 'UK', cities: ['Dehradun', 'Nainital'] },
  { name: 'West Bengal', code: 'WB', cities: ['Kolkata', 'Darjeeling'] },
  { name: 'Telangana', code: 'TS', cities: ['Hyderabad'] },
  { name: 'Gujarat', code: 'GJ', cities: ['Ahmedabad'] },
  { name: 'Uttar Pradesh', code: 'UP', cities: ['Agra', 'Varanasi', 'Lucknow'] },
  { name: 'Punjab', code: 'PB', cities: ['Amritsar'] },
  { name: 'Madhya Pradesh', code: 'MP', cities: ['Indore', 'Khajuraho'] },
  { name: 'Andhra Pradesh', code: 'AP', cities: ['Visakhapatnam'] },
]

const PINCODES: Record<string, string> = {
  'New Delhi': '110001', Mumbai: '400001', Pune: '411001', Lonavala: '410401',
  Panaji: '403001', Calangute: '403516', Jaipur: '302001', Udaipur: '313001',
  Jodhpur: '342001', Bangalore: '560001', Mysore: '570001', Coorg: '571201',
  Chennai: '600001', Ooty: '643001', Kochi: '682001', Munnar: '685612',
  Alleppey: '688001', Shimla: '171001', Manali: '175131', Dehradun: '248001',
  Nainital: '263001', Kolkata: '700001', Darjeeling: '734101',
  Hyderabad: '500001', Ahmedabad: '380001', Agra: '282001', Varanasi: '221001',
  Lucknow: '226001', Amritsar: '143001', Indore: '452001', Khajuraho: '471606',
  Visakhapatnam: '530001',
}

/* ------------------------------------------------------------------ */
/* Hotel catalogue — fictional properties, clearly sample data         */
/* ------------------------------------------------------------------ */

type HotelSeed = {
  name: string
  city: string
  type: 'LUXURY' | 'BUSINESS' | 'RESORT' | 'HERITAGE' | 'BUDGET'
  stars: number
  base: number
  tagline: string
}

const CATALOGUE: HotelSeed[] = [
  // Delhi
  { name: 'The Imperial Meridian', city: 'New Delhi', type: 'LUXURY', stars: 5, base: 9200, tagline: 'Colonial-era grandeur in the heart of Lutyens Delhi' },
  { name: 'Connaught Business Suites', city: 'New Delhi', type: 'BUSINESS', stars: 4, base: 5100, tagline: 'Aerodrome-close suites built for the working week' },
  { name: 'Aerocity Transit Inn', city: 'New Delhi', type: 'BUDGET', stars: 3, base: 2900, tagline: 'Nine minutes from Terminal 3, twenty-four hour check-in' },
  { name: 'Haveli Chandni Chowk', city: 'New Delhi', type: 'HERITAGE', stars: 4, base: 6400, tagline: 'A restored merchant haveli behind the old market' },
  { name: 'Rajouri Garden Residency', city: 'New Delhi', type: 'BUSINESS', stars: 3, base: 3600, tagline: 'Straightforward rooms beside the blue line' },
  // Mumbai
  { name: 'Marine Drive Grand', city: 'Mumbai', type: 'LUXURY', stars: 5, base: 11400, tagline: "Queen's Necklace views from every sea-facing room" },
  { name: 'Bandra Loft Hotel', city: 'Mumbai', type: 'BUSINESS', stars: 4, base: 6900, tagline: 'Design-led lofts ten minutes from Bandra Kurla Complex' },
  { name: 'Colaba Heritage House', city: 'Mumbai', type: 'HERITAGE', stars: 4, base: 7200, tagline: 'Wood-panelled rooms minutes from the Gateway of India' },
  { name: 'Andheri Value Stay', city: 'Mumbai', type: 'BUDGET', stars: 3, base: 3400, tagline: 'Clean, quiet rooms beside the metro line' },
  { name: 'Powai Lake Resort', city: 'Mumbai', type: 'RESORT', stars: 4, base: 8100, tagline: 'Lake-facing rooms with a long, quiet garden' },
  // Pune
  { name: 'Koregaon Park Retreat', city: 'Pune', type: 'LUXURY', stars: 5, base: 8300, tagline: 'Garden wings and a lagoon pool off North Main Road' },
  { name: 'Hinjewadi Tech Suites', city: 'Pune', type: 'BUSINESS', stars: 4, base: 4800, tagline: 'Built for IT-park commutes, with meeting rooms on every floor' },
  { name: 'MG Road Boutique', city: 'Pune', type: 'HERITAGE', stars: 3, base: 3900, tagline: 'A small Art Deco building with a very good bakery' },
  // Lonavala
  { name: 'Sahyadri Valley Resort', city: 'Lonavala', type: 'RESORT', stars: 4, base: 6600, tagline: 'Monsoon-facing cottages over the valley' },
  { name: 'Tiger Point Cottages', city: 'Lonavala', type: 'RESORT', stars: 3, base: 4200, tagline: 'Simple hillside cottages with breakfast on the lawn' },
  // Goa
  { name: 'Candolim Beach Sanctuary', city: 'Calangute', type: 'RESORT', stars: 5, base: 10800, tagline: 'Beachfront villas with private plunge pools' },
  { name: 'Baga Palm Resort', city: 'Calangute', type: 'RESORT', stars: 4, base: 7400, tagline: 'Two pools, a beach shack and sunset yoga' },
  { name: 'Anjuna Cliff Rooms', city: 'Calangute', type: 'BUDGET', stars: 3, base: 3100, tagline: 'Ten minutes on foot from the flea market' },
  { name: 'Panjim Latin Quarter', city: 'Panaji', type: 'HERITAGE', stars: 4, base: 6100, tagline: 'Portuguese townhouse on a quiet Fontainhas lane' },
  { name: 'Miramar Sea Hotel', city: 'Panaji', type: 'BUSINESS', stars: 3, base: 4400, tagline: 'River-mouth views and a dependable breakfast' },
  // Jaipur
  { name: 'Amber Fort Palace', city: 'Jaipur', type: 'HERITAGE', stars: 5, base: 9700, tagline: 'A sandstone palace with mirrored durbar halls' },
  { name: 'Pink City Boutique', city: 'Jaipur', type: 'HERITAGE', stars: 4, base: 5400, tagline: 'Courtyard rooms inside the walled city' },
  { name: 'Jaipur Business Tower', city: 'Jaipur', type: 'BUSINESS', stars: 4, base: 4600, tagline: 'Opposite the World Trade Park, with airport transfers' },
  { name: 'Hawa Mahal Guest House', city: 'Jaipur', type: 'BUDGET', stars: 2, base: 1900, tagline: 'Rooftop views of the palace of winds' },
  // Udaipur
  { name: 'Lake Pichola Palace', city: 'Udaipur', type: 'LUXURY', stars: 5, base: 12600, tagline: 'A lake-facing palace with a boat at the steps' },
  { name: 'Aravalli Haveli', city: 'Udaipur', type: 'HERITAGE', stars: 4, base: 6300, tagline: 'Frescoed rooms above the old ghats' },
  { name: 'Fateh Sagar Residency', city: 'Udaipur', type: 'BUSINESS', stars: 3, base: 3800, tagline: 'Quiet, central and good value' },
  // Jodhpur
  { name: 'Mehrangarh View Hotel', city: 'Jodhpur', type: 'HERITAGE', stars: 4, base: 5600, tagline: 'Every terrace looks up at the fort' },
  { name: 'Blue City Inn', city: 'Jodhpur', type: 'BUDGET', stars: 3, base: 2600, tagline: 'Indigo lanes and a very good rooftop kitchen' },
  // Bangalore
  { name: 'Cubbon Park Grand', city: 'Bangalore', type: 'LUXURY', stars: 5, base: 9900, tagline: 'Garden-facing rooms beside the old High Court' },
  { name: 'Whitefield Tech Hotel', city: 'Bangalore', type: 'BUSINESS', stars: 4, base: 5900, tagline: 'Purpose-built for the IT corridor' },
  { name: 'Indiranagar Boutique', city: 'Bangalore', type: 'BUSINESS', stars: 4, base: 5200, tagline: 'Above the best coffee street in the city' },
  { name: 'Yeshwanthpur Value Inn', city: 'Bangalore', type: 'BUDGET', stars: 3, base: 3100, tagline: 'Next to the metro, ten stops from Majestic' },
  // Mysore
  { name: 'Palace Gate Heritage', city: 'Mysore', type: 'HERITAGE', stars: 4, base: 5800, tagline: 'Two hundred metres from the Amba Vilas gate' },
  { name: 'Chamundi Hill Resort', city: 'Mysore', type: 'RESORT', stars: 4, base: 6400, tagline: 'Hilltop cottages in forty acres of forest' },
  // Coorg
  { name: 'Coffee Estate Bungalow', city: 'Coorg', type: 'RESORT', stars: 4, base: 7800, tagline: "A planter's bungalow inside a working estate" },
  { name: 'Kaveri Riverside Camp', city: 'Coorg', type: 'RESORT', stars: 3, base: 4600, tagline: 'Tented cottages on the river bank' },
  // Chennai
  { name: 'Marina Bay Chennai', city: 'Chennai', type: 'LUXURY', stars: 5, base: 8900, tagline: 'Sea-facing tower on the Marina promenade' },
  { name: 'T Nagar Business Hotel', city: 'Chennai', type: 'BUSINESS', stars: 4, base: 4700, tagline: 'Beside the shopping district, with valet parking' },
  { name: 'Mylapore Heritage Inn', city: 'Chennai', type: 'HERITAGE', stars: 3, base: 3600, tagline: 'Beside the temple tank, quiet after dark' },
  // Ooty
  { name: 'Nilgiri Tea Resort', city: 'Ooty', type: 'RESORT', stars: 4, base: 6200, tagline: 'Tea-garden views and log fires in winter' },
  { name: 'Botanical Garden Stay', city: 'Ooty', type: 'BUDGET', stars: 3, base: 2800, tagline: 'A short walk from the rose garden' },
  // Kochi
  { name: 'Fort Kochi Harbour', city: 'Kochi', type: 'HERITAGE', stars: 4, base: 6400, tagline: 'Chinese fishing nets in view from the veranda' },
  { name: 'Marine Drive Suites', city: 'Kochi', type: 'BUSINESS', stars: 4, base: 4900, tagline: 'Backwater-facing suites in the city centre' },
  { name: 'Backwater Palm Resort', city: 'Kochi', type: 'RESORT', stars: 4, base: 7000, tagline: 'A private jetty and a very slow boat' },
  // Munnar
  { name: 'Munnar Mist Resort', city: 'Munnar', type: 'RESORT', stars: 5, base: 10200, tagline: 'Cliff-edge villas above the tea valley' },
  { name: 'Tea County Cottages', city: 'Munnar', type: 'RESORT', stars: 4, base: 6800, tagline: 'Cottages in a working tea estate' },
  { name: 'Munnar Town Inn', city: 'Munnar', type: 'BUDGET', stars: 3, base: 2900, tagline: 'Simple rooms, excellent parotta nearby' },
  // Alleppey
  { name: 'Kerala Houseboat Stay', city: 'Alleppey', type: 'RESORT', stars: 4, base: 8200, tagline: 'An overnight houseboat on the Vembanad backwaters' },
  { name: 'Punnamada Lakeside', city: 'Alleppey', type: 'RESORT', stars: 4, base: 7100, tagline: 'Lake-facing rooms next to the boat race course' },
  // Shimla
  { name: 'The Ridge Imperial', city: 'Shimla', type: 'HERITAGE', stars: 5, base: 9300, tagline: 'A Victorian hotel on the Mall Road' },
  { name: 'Kufri Pine Resort', city: 'Shimla', type: 'RESORT', stars: 4, base: 5900, tagline: 'Pine forest cottages above the snow line' },
  { name: 'Shimla Budget Lodge', city: 'Shimla', type: 'BUDGET', stars: 2, base: 2100, tagline: 'Warm rooms a minute from the lift' },
  // Manali
  { name: 'Solang Valley Resort', city: 'Manali', type: 'RESORT', stars: 4, base: 6500, tagline: 'Balcony views of the Solang glacier' },
  { name: 'Old Manali Riverside', city: 'Manali', type: 'RESORT', stars: 3, base: 3800, tagline: 'Cafes, orchards and the sound of the Beas' },
  // Dehradun
  { name: 'Doon Valley Grand', city: 'Dehradun', type: 'BUSINESS', stars: 4, base: 5000, tagline: "The city's steadiest business address" },
  { name: 'Mussoorie Road Resort', city: 'Dehradun', type: 'RESORT', stars: 4, base: 6100, tagline: 'Halfway up the hill road, with valley views' },
  // Nainital
  { name: 'Naini Lake View', city: 'Nainital', type: 'HERITAGE', stars: 4, base: 6200, tagline: 'Bay windows over the lake and the boathouse' },
  { name: 'Snow View Cottages', city: 'Nainital', type: 'RESORT', stars: 3, base: 4400, tagline: 'Timber cottages below Snow View point' },
  // Kolkata
  { name: 'Park Street Grand', city: 'Kolkata', type: 'HERITAGE', stars: 5, base: 8200, tagline: 'A colonial-era institution on Park Street' },
  { name: 'Salt Lake Business Inn', city: 'Kolkata', type: 'BUSINESS', stars: 4, base: 4700, tagline: 'Beside Sector V, with a reliable airport shuttle' },
  { name: 'Ballygunge Boutique', city: 'Kolkata', type: 'BUDGET', stars: 3, base: 3300, tagline: 'Quiet lanes, good bakeries, easy metro access' },
  // Darjeeling
  { name: 'Happy Valley Tea Resort', city: 'Darjeeling', type: 'RESORT', stars: 4, base: 6600, tagline: 'Kanchenjunga views on clear mornings' },
  { name: 'Mall Road Heritage', city: 'Darjeeling', type: 'HERITAGE', stars: 3, base: 4300, tagline: 'Colonial rooms a minute from the Chowrasta' },
  // Hyderabad
  { name: 'Charminar Palace Hotel', city: 'Hyderabad', type: 'HERITAGE', stars: 4, base: 6300, tagline: 'Old-city balconies and a very good biryani kitchen' },
  { name: 'HITEC City Grand', city: 'Hyderabad', type: 'BUSINESS', stars: 5, base: 8600, tagline: 'Glass tower beside the HITEC convention centre' },
  { name: 'Banjara Hills Suites', city: 'Hyderabad', type: 'LUXURY', stars: 5, base: 9400, tagline: 'Long-stay suites with a full-service spa' },
  // Ahmedabad
  { name: 'Sabarmati Riverfront Hotel', city: 'Ahmedabad', type: 'BUSINESS', stars: 4, base: 4900, tagline: 'River-front rooms near the old mill district' },
  { name: 'Pol Heritage House', city: 'Ahmedabad', type: 'HERITAGE', stars: 4, base: 5600, tagline: 'A restored pol house with carved balconies' },
  // Agra
  { name: 'Taj View Grand', city: 'Agra', type: 'LUXURY', stars: 5, base: 10400, tagline: 'The Taj Mahal from your bed, on clear days' },
  { name: 'Mughal Heritage Agra', city: 'Agra', type: 'HERITAGE', stars: 4, base: 5700, tagline: 'Sandstone courtyards ten minutes from the east gate' },
  { name: 'Fatehabad Road Inn', city: 'Agra', type: 'BUDGET', stars: 3, base: 2700, tagline: 'Clean, simple and close to the ticket office' },
  // Varanasi
  { name: 'Ganga Ghat Palace', city: 'Varanasi', type: 'HERITAGE', stars: 4, base: 6100, tagline: 'A ghat-side haveli with sunrise boat trips' },
  { name: 'Sarnath Peace Resort', city: 'Varanasi', type: 'RESORT', stars: 4, base: 5400, tagline: 'Quiet gardens near the deer park' },
  // Lucknow
  { name: 'Nawabi Awadh Hotel', city: 'Lucknow', type: 'HERITAGE', stars: 4, base: 5500, tagline: 'Awadhi architecture and a legendary kebab kitchen' },
  { name: 'Gomti Nagar Business', city: 'Lucknow', type: 'BUSINESS', stars: 4, base: 4500, tagline: 'Riverside rooms in the new city' },
  // Amritsar
  { name: 'Golden Temple View', city: 'Amritsar', type: 'HERITAGE', stars: 4, base: 5200, tagline: 'Two minutes from the Harmandir Sahib plaza' },
  { name: 'Ranjit Avenue Suites', city: 'Amritsar', type: 'BUSINESS', stars: 3, base: 3700, tagline: "Wide rooms on the city's main avenue" },
  // Indore
  { name: 'Sarafa Grand Indore', city: 'Indore', type: 'BUSINESS', stars: 4, base: 4400, tagline: 'Steps from the night market, with secure parking' },
  { name: 'Malwa Heritage Stay', city: 'Indore', type: 'HERITAGE', stars: 3, base: 3500, tagline: 'A quiet old bungalow with a large garden' },
  // Khajuraho
  { name: 'Khajuraho Temple Resort', city: 'Khajuraho', type: 'RESORT', stars: 4, base: 5900, tagline: 'Gardens facing the western temple group' },
  // Visakhapatnam
  { name: 'Beach Road Vizag', city: 'Visakhapatnam', type: 'LUXURY', stars: 5, base: 7600, tagline: 'Sea-facing rooms on the Beach Road curve' },
  { name: 'Vizag Harbour Business', city: 'Visakhapatnam', type: 'BUSINESS', stars: 4, base: 4600, tagline: 'Close to the port and the tech park' },
]

/* Curated, stable Unsplash photo IDs — generic hotel photography,
   not photographs of any specific real property. */
const PHOTOS = [
  '1566073771259-6a8506099945', '1560448204-e02f11c3d0e2', '1582719508461-905c673771fd',
  '1571003123894-1f0594d2b5d9', '1520250497591-112f2f40a3f4', '1551882547-ff40c63fe5fa',
  '1611892440504-42a792e24d32', '1590490360182-c33d57733427', '1445019980597-93fa8acb246c',
  '1552859493-94429d4c2b09', '1602002418082-a4443e081dd1', '1584132967334-10e028bd69f7',
  '1596394516093-501ba68a0ba6', '1578683010236-d716f9a3f461', '1568084680786-a84f91d1153c',
  '1542314831-068cd1dbfeeb', '1522798514-97ceb8c4f1c8', '1631049307264-da0ec9d70304',
]

function photo(i: number) {
  return `https://images.unsplash.com/photo-${PHOTOS[i % PHOTOS.length]}?auto=format&fit=crop&w=1400&q=80`
}

const AMENITIES = [
  { name: 'Free WiFi', icon: 'Wifi' },
  { name: 'Free Parking', icon: 'Car' },
  { name: 'Breakfast Included', icon: 'Coffee' },
  { name: 'Swimming Pool', icon: 'Waves' },
  { name: 'Fitness Centre', icon: 'Dumbbell' },
  { name: 'Air Conditioning', icon: 'Wind' },
  { name: 'Restaurant', icon: 'Utensils' },
  { name: 'Room Service', icon: 'BellRing' },
  { name: 'Spa', icon: 'Flower2' },
  { name: 'Airport Transfer', icon: 'Plane' },
  { name: 'Business Centre', icon: 'Briefcase' },
  { name: 'Pet Friendly', icon: 'PawPrint' },
  { name: 'Wheelchair Access', icon: 'Accessibility' },
  { name: 'Laundry Service', icon: 'Shirt' },
]

const ROOM_TYPES = [
  { name: 'Standard Room', mult: 0.8, occ: 2, beds: '1 Queen Bed', size: '22 m²' },
  { name: 'Deluxe Room', mult: 1.0, occ: 3, beds: '1 King Bed', size: '30 m²' },
  { name: 'Premium Suite', mult: 1.6, occ: 4, beds: '1 King + 1 Sofa Bed', size: '48 m²' },
]

const REVIEWS = [
  { rating: 5, title: 'Exactly as described', comment: 'Spotless room, quick check-in and the staff remembered our names by day two.' },
  { rating: 4, title: 'Very good value', comment: 'Breakfast was generous and the location made everything walkable.' },
  { rating: 5, title: 'Would stay again', comment: 'Quiet at night, strong wifi and a genuinely helpful front desk.' },
  { rating: 4, title: 'Comfortable stay', comment: 'Rooms are a little dated but the service more than makes up for it.' },
  { rating: 3, title: 'Decent, not exceptional', comment: 'Fine for a short trip. The pool was smaller than the photos suggest.' },
  { rating: 5, title: 'Great for families', comment: 'The extra bed was already set up when we arrived and the kids loved the pool.' },
]

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

/* ------------------------------------------------------------------ */

async function main() {
  console.log('🌱 Seeding Stayora demo data...')

  for (const st of STATES) {
    const state = await prisma.state.upsert({
      where: { code: st.code },
      update: { name: st.name },
      create: { name: st.name, code: st.code },
    })
    for (const city of st.cities) {
      await prisma.city.upsert({
        where: { name_stateId: { name: city, stateId: state.id } },
        update: {},
        create: { name: city, stateId: state.id },
      })
    }
  }

  const amenityIds: Record<string, string> = {}
  for (const a of AMENITIES) {
    const row = await prisma.amenity.upsert({ where: { name: a.name }, update: {}, create: a })
    amenityIds[a.name] = row.id
  }

  const pw = {
    admin: await bcrypt.hash('Admin@123456', 12),
    owner: await bcrypt.hash('Owner@123456', 12),
    customer: await bcrypt.hash('Customer@123456', 12),
  }

  await prisma.user.upsert({
    where: { email: 'admin@stayora.com' }, update: {},
    create: { name: 'Platform Admin', email: 'admin@stayora.com', phone: '9000000001', passwordHash: pw.admin, role: 'ADMIN', emailVerified: new Date() },
  })
  const owner = await prisma.user.upsert({
    where: { email: 'owner@stayora.com' }, update: {},
    create: { name: 'Rohan Mehta', email: 'owner@stayora.com', phone: '9000000002', passwordHash: pw.owner, role: 'HOTEL_OWNER', emailVerified: new Date() },
  })
  const customer = await prisma.user.upsert({
    where: { email: 'customer@stayora.com' }, update: {},
    create: { name: 'Ananya Iyer', email: 'customer@stayora.com', phone: '9000000003', passwordHash: pw.customer, role: 'CUSTOMER', emailVerified: new Date() },
  })
  await prisma.user.upsert({
    where: { email: 'reception@stayora.com' }, update: {},
    create: { name: 'Front Desk', email: 'reception@stayora.com', phone: '9000000004', passwordHash: pw.owner, role: 'RECEPTIONIST', emailVerified: new Date() },
  })

  const cities = await prisma.city.findMany()
  const cityByName = new Map(cities.map((c) => [c.name, c]))

  let created = 0
  for (let i = 0; i < CATALOGUE.length; i++) {
    const h = CATALOGUE[i]
    const city = cityByName.get(h.city)
    if (!city) { console.warn('missing city', h.city); continue }

    const slug = slugify(`${h.name}-${h.city}`)
    const existing = await prisma.hotel.findUnique({ where: { slug } })
    if (existing) continue

    const hotel = await prisma.hotel.create({
      data: {
        name: h.name,
        slug,
        description:
          `${h.tagline}. ${h.name} is a ${h.stars}-star ${h.type.toLowerCase()} property in ${h.city}, ` +
          `offering ${h.type === 'RESORT' ? 'spacious grounds and leisure facilities' : h.type === 'BUSINESS' ? 'fast connectivity and work-ready rooms' : h.type === 'HERITAGE' ? 'restored architecture and period interiors' : h.type === 'BUDGET' ? 'clean, dependable rooms at a fair price' : 'full-service luxury with attentive staff'} ` +
          `for travellers visiting ${h.city}.`,
        ownerId: owner.id,
        status: 'APPROVED',
        starRating: h.stars,
        address: `${h.name}, ${h.city}`,
        cityId: city.id,
        pincode: PINCODES[h.city] ?? '400001',
        phone: `+91-${70000 + i}-${100000 + i * 137}`,
        email: `reservations@${slug.slice(0, 20)}.example.com`,
        checkInTime: '14:00',
        checkOutTime: '11:00',
        gstin: `27AABCS${1000 + i}Q1Z${i % 10}`,
        hotelType: h.type,
        commissionRate: 12,
      },
    })

    await prisma.hotelImage.createMany({
      data: [0, 1, 2, 3].map((k) => ({
        hotelId: hotel.id,
        url: photo(i * 4 + k),
        caption: k === 0 ? `${h.name} — exterior` : `${h.name} — interior ${k}`,
        isPrimary: k === 0,
        order: k,
      })),
    })

    const chosen = new Set(['Free WiFi', 'Air Conditioning', 'Breakfast Included'])
    if (h.stars >= 4) chosen.add('Restaurant')
    if (h.stars >= 5) { chosen.add('Fitness Centre'); chosen.add('Room Service'); chosen.add('Spa') }
    if (h.type === 'RESORT') { chosen.add('Swimming Pool'); chosen.add('Free Parking') }
    if (h.type === 'BUSINESS') chosen.add('Business Centre')
    if (h.type === 'BUDGET') chosen.add('Free Parking')

    await prisma.hotelAmenity.createMany({
      data: [...chosen].map((n) => ({ hotelId: hotel.id, amenityId: amenityIds[n] })),
    })

    const typeCount = h.type === 'BUDGET' ? 2 : 3
    for (let t = 0; t < typeCount; t++) {
      const rt = ROOM_TYPES[t]
      const rate = Math.round((h.base * rt.mult) / 100) * 100

      const roomType = await prisma.roomType.create({
        data: {
          hotelId: hotel.id,
          name: rt.name,
          description: `${rt.name} at ${h.name}, ${rt.size}, ${rt.beds}.`,
          maxOccupancy: rt.occ,
          maxAdults: Math.max(2, rt.occ - 1),
          maxChildren: Math.max(0, rt.occ - 2),
          bedConfiguration: rt.beds,
          baseRate: rate,
          size: rt.size,
        },
      })

      const roomCount = 4
      for (let r = 0; r < roomCount; r++) {
        await prisma.room.create({
          data: {
            hotelId: hotel.id,
            roomTypeId: roomType.id,
            roomNumber: `${t + 1}${String(r + 1).padStart(2, '0')}`,
            status: 'AVAILABLE',
            housekeepingStatus: 'READY_FOR_ASSIGNMENT',
          },
        })
      }

      // Inventory dates are stored at UTC midnight so availability lookups,
      // which enumerate UTC days, match exactly regardless of server timezone.
      const now = new Date()
      const rows = []
      for (let d = 0; d < 120; d++) {
        const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + d))
        rows.push({ roomTypeId: roomType.id, date, totalRooms: roomCount, available: roomCount, blocked: 0 })
      }
      await prisma.roomInventory.createMany({ data: rows })
    }

    const reviewCount = 2 + (i % 3)
    for (let r = 0; r < reviewCount; r++) {
      const rv = REVIEWS[(i + r) % REVIEWS.length]
      await prisma.hotelReview.create({
        data: {
          hotelId: hotel.id,
          userId: customer.id,
          rating: rv.rating,
          title: rv.title,
          comment: rv.comment,
          isApproved: true,
        },
      })
    }

    created++
  }

  // Staff memberships — reception can operate the first Delhi property.
  const delhiHotel = await prisma.hotel.findFirst({
    where: { city: { name: "New Delhi" }, status: "APPROVED" },
    orderBy: { createdAt: "asc" },
  })
  const receptionist = await prisma.user.findUnique({ where: { email: "reception@stayora.com" } })
  if (delhiHotel && receptionist) {
    await prisma.hotelStaffMembership.upsert({
      where: { hotelId_userId: { hotelId: delhiHotel.id, userId: receptionist.id } },
      update: {},
      create: { hotelId: delhiHotel.id, userId: receptionist.id, role: "RECEPTION" },
    })
  }

  // Coupons
  const now = new Date()
  const coupons = [
    { code: 'STAYORA10', type: 'PERCENTAGE', value: 10, minBookingAmount: 3000, maxDiscount: 2000, perUserLimit: 3, usageLimit: 1000 },
    { code: 'WEEKEND500', type: 'FIXED', value: 500, minBookingAmount: 5000, maxDiscount: null, perUserLimit: 2, usageLimit: 500 },
    { code: 'FIRSTSTAY', type: 'PERCENTAGE', value: 15, minBookingAmount: 4000, maxDiscount: 3000, perUserLimit: 1, usageLimit: 2000 },
  ]
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        type: c.type,
        value: c.value,
        minBookingAmount: c.minBookingAmount,
        maxDiscount: c.maxDiscount,
        perUserLimit: c.perUserLimit,
        usageLimit: c.usageLimit,
        validFrom: new Date(now.getTime() - 86_400_000),
        validTo: new Date(now.getTime() + 365 * 86_400_000),
        isActive: true,
      },
    })
  }

  console.log(`✅ ${created} hotels created (${CATALOGUE.length} in catalogue)`)
  console.log('   Cities:', cities.length, '| States:', STATES.length)
  console.log('\n📧 Demo logins:')
  console.log('   Admin     admin@stayora.com / Admin@123456')
  console.log('   Owner     owner@stayora.com / Owner@123456')
  console.log('   Customer  customer@stayora.com / Customer@123456')
}

main()
  .catch((e) => { console.error('❌ Seeding failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
