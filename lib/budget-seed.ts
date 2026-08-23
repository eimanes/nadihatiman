/**
 * Default budget items seeded from the couple's Excel spreadsheets.
 * Amounts are in RM. Events: "sanding" and "tandang".
 * Collection: "budget" (docs: { item, event, category, vendor,
 * estimated, paid, balance, date, paidBy, notes, createdAt }).
 */
export type BudgetItem = {
	item: string
	event: string
	category: string
	vendor: string
	estimated: number
	paid: number
	balance: number
	date: string
	paidBy: string
	notes: string
}

/** Sanding ceremony — Nadia & Eiman's side. */
const SANDING_SEED: BudgetItem[] = [
	{ item: "Wedding Hall", event: "sanding", category: "Hall & Event", vendor: "Le Rozza Wedding Hall", estimated: 34500, paid: 24500, balance: 10000, date: "15/06/2026", paidBy: "Eiman, Nadia", notes: "22000 + 2500 (Depo) - Eiman (done) 10000 - Nadia" },
	{ item: "Baju Nikah L&P", event: "sanding", category: "Attire", vendor: "Teruntum Putih", estimated: 1500, paid: 1500, balance: 0, date: "18/05/2026", paidBy: "Nadia", notes: "" },
	{ item: "Wedding Dress", event: "sanding", category: "Attire", vendor: "Farrarahim Atelier", estimated: 2250, paid: 1000, balance: 1250, date: "23/05/2026", paidBy: "Nadia", notes: "" },
	{ item: "Wedding Heels", event: "sanding", category: "Attire", vendor: "My Ballerine", estimated: 319.8, paid: 319.8, balance: 0, date: "", paidBy: "Nadia", notes: "" },
	{ item: "Wedding Suit", event: "sanding", category: "Attire", vendor: "ThePresidentKL", estimated: 1500, paid: 1500, balance: 0, date: "06/06/2026", paidBy: "Eiman", notes: "" },
	{ item: "Wedding Shoes (M)", event: "sanding", category: "Attire", vendor: "zeve", estimated: 400, paid: 400, balance: 0, date: "", paidBy: "Eiman", notes: "" },
	{ item: "Keepsake", event: "sanding", category: "Prep", vendor: "Suhada Mohd", estimated: 60, paid: 60, balance: 0, date: "", paidBy: "Nadia", notes: "" },
	{ item: "Digital Wedding Card", event: "sanding", category: "Prep", vendor: "Tempah Art", estimated: 90, paid: 90, balance: 0, date: "17/05/2026", paidBy: "Nadia", notes: "75 - website 15 - pdf kad" },
	{ item: "Physical Wedding Card", event: "sanding", category: "Prep", vendor: "", estimated: 50, paid: 50, balance: 0, date: "", paidBy: "Nadia", notes: "" },
	{ item: "Dulang Hantaran P (7 pcs)", event: "sanding", category: "Hall & Event", vendor: "Dulang Mimpi", estimated: 0, paid: 0, balance: 0, date: "", paidBy: "Nadia", notes: "" },
	{ item: "Dulang Hantaran L (5 pcs)", event: "sanding", category: "Hall & Event", vendor: "Dulang Mimpi", estimated: 0, paid: 0, balance: 0, date: "", paidBy: "Eiman", notes: "" },
	{ item: "Frame Mas Kawin", event: "sanding", category: "Hall & Event", vendor: "Nikah", estimated: 248, paid: 248, balance: 0, date: "", paidBy: "Eiman", notes: "bayar to nanad" },
	{ item: "Emcee", event: "sanding", category: "Hall & Event", vendor: "Emcee Redha", estimated: 950, paid: 950, balance: 0, date: "10/08/2026", paidBy: "Eiman", notes: "" },
	{ item: "Goodies", event: "sanding", category: "Hall & Event", vendor: "", estimated: 880, paid: 880, balance: 0, date: "", paidBy: "Nadia", notes: "" },
	{ item: "Candy Wall", event: "sanding", category: "Hall & Event", vendor: "", estimated: 160, paid: 160, balance: 0, date: "", paidBy: "Family Nad", notes: "" },
	{ item: "Photo + Video", event: "sanding", category: "Photo & Vid", vendor: "Heyypaan", estimated: 3200, paid: 3200, balance: 0, date: "", paidBy: "Eiman", notes: "Photo & Video" },
	{ item: "Photo & Video WCC (cancel)", event: "sanding", category: "Photo & Vid", vendor: "", estimated: 0, paid: 0, balance: 0, date: "", paidBy: "Nadia", notes: "cancel" },
	{ item: "Kain Rentang", event: "sanding", category: "Hall & Event", vendor: "Cahaya Cermin (IG)", estimated: 690, paid: 690, balance: 0, date: "", paidBy: "Nadia, Eiman", notes: "" },
	{ item: "Bride Assistant", event: "sanding", category: "Prep", vendor: "", estimated: 0, paid: 0, balance: 0, date: "", paidBy: "Nadia", notes: "" },
	{ item: "MUA + Hijabstylist + Groomstylist (Sanding)", event: "sanding", category: "Prep", vendor: "Nabilah", estimated: 1350, paid: 200, balance: 1150, date: "", paidBy: "Nadia", notes: "" },
	{ item: "Hairstylist", event: "sanding", category: "Prep", vendor: "", estimated: 950, paid: 100, balance: 850, date: "", paidBy: "Nadia", notes: "" },
	{ item: "Groom stylist - Nikah", event: "sanding", category: "Prep", vendor: "", estimated: 300, paid: 300, balance: 0, date: "", paidBy: "Eiman", notes: "" },
	{ item: "Henna Artist", event: "sanding", category: "Prep", vendor: "", estimated: 320, paid: 50, balance: 270, date: "", paidBy: "Nadia", notes: "" },
	{ item: "Hand bouquet", event: "sanding", category: "Attire", vendor: "Rimbun", estimated: 198, paid: 198, balance: 0, date: "", paidBy: "Nadia", notes: "" },
	{ item: "Manicure + Spa (mandi bunga)", event: "sanding", category: "Prep", vendor: "", estimated: 0, paid: 0, balance: 0, date: "", paidBy: "Nadia", notes: "" },
	{ item: "Tok Kadi + Saksi", event: "sanding", category: "Hall & Event", vendor: "", estimated: 250, paid: 0, balance: 250, date: "", paidBy: "Eiman", notes: "120 - tok kadi 80 - 2 x saksi" },
	{ item: "Ice Cream", event: "sanding", category: "Hall & Event", vendor: "", estimated: 0, paid: 0, balance: 0, date: "", paidBy: "Family Nad", notes: "" },
	{ item: "Cendol", event: "sanding", category: "Hall & Event", vendor: "Songkok Tinggi", estimated: 750, paid: 0, balance: 750, date: "", paidBy: "Family Nad, Nadia", notes: "" },
	{ item: "Apam Balik", event: "sanding", category: "Hall & Event", vendor: "", estimated: 500, paid: 500, balance: 0, date: "", paidBy: "Family Nad", notes: "" },
	{ item: "Mee", event: "sanding", category: "Hall & Event", vendor: "", estimated: 0, paid: 0, balance: 0, date: "", paidBy: "Family Nad", notes: "" },
	{ item: "2 Dinar Emas", event: "sanding", category: "For Nanad", vendor: "HABIB", estimated: 4000, paid: 4000, balance: 0, date: "", paidBy: "Eiman", notes: "" },
	{ item: "Wedding Bracelet", event: "sanding", category: "For Nanad", vendor: "JIN WEI JEWELLERY", estimated: 4472, paid: 4472, balance: 0, date: "", paidBy: "Eiman", notes: "" },
	{ item: "Wedding Ring (P)", event: "sanding", category: "For Nanad", vendor: "HABIB", estimated: 1400, paid: 1400, balance: 0, date: "", paidBy: "Eiman", notes: "" },
	{ item: "Wedding Ring (L)", event: "sanding", category: "For Eiman", vendor: "HABIB", estimated: 700, paid: 700, balance: 0, date: "", paidBy: "Nadia", notes: "" },
	{ item: "YSL - Women", event: "sanding", category: "For Eiman", vendor: "YSL", estimated: 800, paid: 800, balance: 0, date: "04/06/2026", paidBy: "Nadia", notes: "" },
	{ item: "YSL - Men", event: "sanding", category: "For Nanad", vendor: "YSL", estimated: 500, paid: 500, balance: 0, date: "04/06/2026", paidBy: "Eiman", notes: "" },
	{ item: "Hotel - Lelaki (before nikah)", event: "sanding", category: "For Eiman", vendor: "", estimated: 100, paid: 100, balance: 0, date: "", paidBy: "Eiman", notes: "" },
	{ item: "Hotel - Pengantin (before & after sanding)", event: "sanding", category: "For Nanad", vendor: "", estimated: 880, paid: 880, balance: 0, date: "", paidBy: "Eiman", notes: "" },
]

/** Tandang (Walimatulurus) — reception at Eiman's side. */
const TANDANG_SEED: BudgetItem[] = [
	{ item: "Baju songket", event: "tandang", category: "Attire", vendor: "Farrarahim Atelier", estimated: 1200, paid: 400, balance: 800, date: "", paidBy: "Eiman", notes: "400 - Deposit, 800 - Sewa" },
	{ item: "Wedding Hall", event: "tandang", category: "Hall & Event", vendor: "Gangsa Kemboja", estimated: 22000, paid: 500, balance: 21500, date: "", paidBy: "Eiman, Abah", notes: "" },
	{ item: "Digital Wedding Card", event: "tandang", category: "Prep", vendor: "", estimated: 0, paid: 0, balance: 0, date: "", paidBy: "Eiman", notes: "75 - website, 15 - pdf kad" },
	{ item: "Physical Wedding Card", event: "tandang", category: "Prep", vendor: "", estimated: 0, paid: 0, balance: 0, date: "", paidBy: "Eiman", notes: "" },
	{ item: "Goodies", event: "tandang", category: "Hall & Event", vendor: "", estimated: 3000, paid: 3000, balance: 0, date: "", paidBy: "Eiman, Family Eiman", notes: "" },
	{ item: "Photo", event: "tandang", category: "Photo & Vid", vendor: "Heyypaan", estimated: 1200, paid: 1200, balance: 0, date: "", paidBy: "Eiman", notes: "Photo only + transport" },
	{ item: "Bride Assistant", event: "tandang", category: "Prep", vendor: "", estimated: 0, paid: 0, balance: 0, date: "", paidBy: "Eiman", notes: "" },
	{ item: "MUA + Hijabstylist + Groom", event: "tandang", category: "Prep", vendor: "", estimated: 0, paid: 0, balance: 0, date: "", paidBy: "Eiman", notes: "" },
	{ item: "Hairstylist", event: "tandang", category: "Prep", vendor: "", estimated: 550, paid: 100, balance: 450, date: "", paidBy: "Nadia", notes: "" },
	{ item: "Henna Artist", event: "tandang", category: "Prep", vendor: "", estimated: 0, paid: 0, balance: 0, date: "", paidBy: "Nadia, Eiman", notes: "" },
	{ item: "Photobooth", event: "tandang", category: "Hall & Event", vendor: "", estimated: 500, paid: 0, balance: 500, date: "", paidBy: "Family Eiman", notes: "" },
	{ item: "Apam Balik", event: "tandang", category: "Hall & Event", vendor: "", estimated: 0, paid: 0, balance: 0, date: "", paidBy: "Eiman, Family Eiman", notes: "" },
	{ item: "Pisang Goreng", event: "tandang", category: "Hall & Event", vendor: "", estimated: 0, paid: 0, balance: 0, date: "", paidBy: "Eiman, Family Eiman", notes: "" },
	{ item: "Mee/Bihun", event: "tandang", category: "Hall & Event", vendor: "", estimated: 0, paid: 0, balance: 0, date: "", paidBy: "Eiman, Family Eiman", notes: "" },
	{ item: "Cendol", event: "tandang", category: "Hall & Event", vendor: "", estimated: 0, paid: 0, balance: 0, date: "", paidBy: "Eiman, Family Eiman", notes: "" },
]

export const BUDGET_SEED: BudgetItem[] = [...SANDING_SEED, ...TANDANG_SEED]

/** Per-event totals from the Excels (shown as a summary, not real items). */
export const BUDGET_TOTALS = {
	sanding: { estimated: 64267.8, paid: 49747.8, balance: 14520 },
	tandang: { estimated: 28450, paid: 5200, balance: 23250 },
}
