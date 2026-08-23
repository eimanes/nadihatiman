/**
 * Home Meridin — furniture & appliance budget, seeded from the couple's
 * Excel spreadsheet. Collection: "home_items".
 * Fields: { itemId, name, category, price, qty, totalPrice, paid,
 * balance, paidBy, txnStatus, productStatus, notes, dimension, createdAt }.
 */
export type HomeItem = {
	itemId: string
	name: string
	category: string
	price: number
	qty: number
	totalPrice: number
	paid: number
	balance: number
	paidBy: string
	txnStatus: string
	productStatus: string
	notes: string
	dimension: string
}

export const HOME_MERIDIN_SEED: HomeItem[] = [
	{ itemId: "C-1", name: "Cabinet - Kitchen", category: "Cabinet", price: 13000, qty: 1, totalPrice: 13000, paid: 0, balance: 13000, paidBy: "", txnStatus: "NA", productStatus: "Completed", notes: "Top & Bottom, Quartstone counter top, Right (sink/hood/stove/fridge), Left (microwave & oven), Bar table", dimension: "" },
	{ itemId: "C-2", name: "Cabinet - Room", category: "Cabinet", price: 5700, qty: 1, totalPrice: 5700, paid: 0, balance: 5700, paidBy: "", txnStatus: "NA", productStatus: "Completed", notes: "5ft tall + 2ft short + 3ft dressing, 4ft tall behind door", dimension: "" },
	{ itemId: "C-3", name: "Staircase & Door", category: "Cabinet", price: 3400, qty: 1, totalPrice: 3400, paid: 0, balance: 3400, paidBy: "", txnStatus: "NA", productStatus: "Completed", notes: "With hidden door", dimension: "" },
	{ itemId: "C-4", name: "Cabinet - TV", category: "Cabinet", price: 1200, qty: 1, totalPrice: 1200, paid: 0, balance: 1200, paidBy: "", txnStatus: "NA", productStatus: "Completed", notes: "8ft cabinet", dimension: "" },
	{ itemId: "C-5", name: "Kitchen Wall & Base Cabinet Extra 2ft", category: "Cabinet", price: 1600, qty: 1, totalPrice: 1600, paid: 0, balance: 1600, paidBy: "", txnStatus: "NA", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "C-6", name: "Disrack / Pullout Basket", category: "Cabinet", price: 640, qty: 1, totalPrice: 640, paid: 0, balance: 640, paidBy: "", txnStatus: "NA", productStatus: "Completed", notes: "900mm", dimension: "" },
	{ itemId: "C-7", name: "Hood Hos", category: "Cabinet", price: 80, qty: 1, totalPrice: 25700, paid: 25700, balance: 0, paidBy: "Eiman", txnStatus: "NA", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "W-1", name: "Ceiling", category: "C&W", price: 4550, qty: 1, totalPrice: 4550, paid: 0, balance: 4550, paidBy: "", txnStatus: "NA", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "W-2", name: "Wiring", category: "C&W", price: 4640, qty: 1, totalPrice: 4640, paid: 0, balance: 4640, paidBy: "", txnStatus: "NA", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "W-3", name: "A/C Copper", category: "C&W", price: 2450, qty: 1, totalPrice: 2450, paid: 0, balance: 2450, paidBy: "", txnStatus: "NA", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "W-4", name: "A/C Installation", category: "C&W", price: 600, qty: 1, totalPrice: 600, paid: 0, balance: 600, paidBy: "", txnStatus: "NA", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "W-5", name: "Exhaust Fan Kitchen", category: "C&W", price: 450, qty: 1, totalPrice: 450, paid: 0, balance: 450, paidBy: "", txnStatus: "NA", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "W-6", name: "Besi Grill Pintu & Tingkap", category: "C&W", price: 1400, qty: 1, totalPrice: 1400, paid: 0, balance: 1400, paidBy: "", txnStatus: "NA", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "W-7", name: "Upah pasang", category: "C&W", price: 1000, qty: 1, totalPrice: 17622, paid: 17622, balance: 0, paidBy: "Eiman", txnStatus: "NA", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "K-1", name: "Oven & Microwave", category: "Kitchen", price: 2150, qty: 1, totalPrice: 2150, paid: 0, balance: 2150, paidBy: "Eiman", txnStatus: "Not Paid", productStatus: "In Cart", notes: "ELBA Microwave & Oven, Built-in cabinet", dimension: "Oven: 594(W) x 594(H) x 500(D)mm, Built-in: 565(W) x 596(H) x 580(D)mm; Microwave: 595(W) x 390(H) x 378(D)mm, Built-in: 560(W) x 365(H) x 410(D)mm" },
	{ itemId: "K-2", name: "Fridge", category: "Kitchen", price: 1876.02, qty: 1, totalPrice: 1876.02, paid: 1876.02, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "Hisense 660L Side by Side Glass Doors, Black glass door, Side by Side Inverter 660L RS728N4ABU; HISENSE 4 DOOR INVERTER FRIDGE RQ768N4AW-KU", dimension: "Net: W911 x D615 x H1786mm; 4-door: W912 x D725 x H1785mm" },
	{ itemId: "K-3", name: "Washing machine", category: "Kitchen", price: 972.83, qty: 1, totalPrice: 972.83, paid: 972.83, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "TCL Washing Machine Front Load, Washer dryer 10kg/7kg", dimension: "Gross: 680×720×890mm, Net: 595×660×850mm, Weight: 70-74kg" },
	{ itemId: "K-4", name: "Stove & Hood", category: "Kitchen", price: 1618.36, qty: 1, totalPrice: 1618.36, paid: 1618.36, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "Rubine Stove & Hood, 45 degree hood, 2 point api, RGH-FASCO2B-SK, Paid: RM 150", dimension: "Product: 780W x 460D mm, Cut out: 765-750W x 350-430D mm" },
	{ itemId: "F-1", name: "Aircond - Bedroom 1.5hp VRA", category: "Room", price: 1199, qty: 1, totalPrice: 1199, paid: 1199, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "Haier VRA 1.5hp", dimension: "" },
	{ itemId: "F-2", name: "Aircond - Dining 1.5hp VPB", category: "Hall", price: 902.25, qty: 1, totalPrice: 902.25, paid: 902.25, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "Haier VPB 1.5hp", dimension: "" },
	{ itemId: "F-21", name: "Aircond - Hall 1.0 AUX", category: "Hall", price: 850, qty: 1, totalPrice: 850, paid: 850, balance: 0, paidBy: "Boss / Kakak", txnStatus: "NA", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "F-3", name: "Fan KDK 56\" - Hall", category: "Hall", price: 498.90, qty: 1, totalPrice: 498.90, paid: 498.90, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "KDK K14ZW", dimension: "" },
	{ itemId: "F-4", name: "Fan - Master Bedroom 56\" Black", category: "Room", price: 125, qty: 1, totalPrice: 125, paid: 0, balance: 125, paidBy: "", txnStatus: "Paid", productStatus: "Completed", notes: "Rezo Ventus MY", dimension: "" },
	{ itemId: "F-5", name: "Fan - Bedroom 46\" Black", category: "Room", price: 125, qty: 3, totalPrice: 375, paid: 0, balance: 375, paidBy: "", txnStatus: "Paid", productStatus: "Completed", notes: "Rezo Ventus MY", dimension: "" },
	{ itemId: "F-6", name: "Fan - Dining Wall 16\"", category: "Hall", price: 478, qty: 1, totalPrice: 826.50, paid: 826.50, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "Alpha Alkova Kona", dimension: "" },
	{ itemId: "F-7", name: "Fan - Kitchen 23\"", category: "Kitchen", price: 259.46, qty: 1, totalPrice: 259.46, paid: 259.46, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "Rezo Lorca 23\"", dimension: "" },
	{ itemId: "T-1", name: "Water heater", category: "Toilets", price: 471.74, qty: 1, totalPrice: 471.74, paid: 471.74, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "Toshiba Water Heater", dimension: "" },
	{ itemId: "L-1", name: "LED Tracklight Base 3+1m GU10 (no bulb)", category: "Lights", price: 39.90, qty: 10, totalPrice: 305.21, paid: 305.21, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "LED Tracklight GU10", dimension: "" },
	{ itemId: "L-2", name: "LED GU10 Mentol 4.5W (3000K)", category: "Lights", price: 8.63, qty: 10, totalPrice: 86.30, paid: 0, balance: 86.30, paidBy: "", txnStatus: "Paid", productStatus: "Completed", notes: "Osram GU10", dimension: "" },
	{ itemId: "L-3", name: "LED GU10 Mentol 4.5W (6000K)", category: "Lights", price: 8.63, qty: 4, totalPrice: 34.52, paid: 0, balance: 34.52, paidBy: "", txnStatus: "Paid", productStatus: "Completed", notes: "Osram GU10", dimension: "" },
	{ itemId: "L-4", name: "LED GU10 Mentol 7W (6000K)", category: "Lights", price: 9.90, qty: 10, totalPrice: 155.85, paid: 155.85, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "Osram GU10", dimension: "" },
	{ itemId: "L-5", name: "Surface Mounted LED Spotlight", category: "Lights", price: 22.90, qty: 2, totalPrice: 46.78, paid: 46.78, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "L-6", name: "Floodlight 10W", category: "Lights", price: 14.80, qty: 1, totalPrice: 14.80, paid: 0, balance: 14.80, paidBy: "", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "L-7", name: "LED Eyeball 3W (4000K)", category: "Lights", price: 3.98, qty: 10, totalPrice: 58.96, paid: 58.96, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "Eyeball 3W 4000K satu mata", dimension: "" },
	{ itemId: "L-8", name: "LED Eyeball 3W (3000K)", category: "Lights", price: 8.90, qty: 9, totalPrice: 80.10, paid: 0, balance: 80.10, paidBy: "", txnStatus: "Paid", productStatus: "Completed", notes: "Eyeball 3W 3000K 3 mata", dimension: "" },
	{ itemId: "L-9", name: "LED Eyeball 3W (6000K)", category: "Lights", price: 8.90, qty: 9, totalPrice: 149.01, paid: 149.01, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "Eyeball 3W 6000K 3 mata", dimension: "" },
	{ itemId: "L-10", name: "Chandelier", category: "Lights", price: 500, qty: 1, totalPrice: 500, paid: 500, balance: 0, paidBy: "Nadia", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "E-1", name: "Microwave Kecik", category: "Kitchen", price: 250, qty: 1, totalPrice: 250, paid: 250, balance: 0, paidBy: "Nadia", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "E-2", name: "Vacuum", category: "Hall", price: 250, qty: 1, totalPrice: 250, paid: 250, balance: 0, paidBy: "Nadia", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Ikea-1", name: "Side Bed Cabinet", category: "Cabinet", price: 150, qty: 1, totalPrice: 150, paid: 150, balance: 0, paidBy: "Nadia", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Ikea-2", name: "Big mirror - Dining", category: "Hall", price: 200, qty: 1, totalPrice: 200, paid: 200, balance: 0, paidBy: "Nadia", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Ikea-3", name: "Small mirror", category: "Room", price: 100, qty: 1, totalPrice: 100, paid: 100, balance: 0, paidBy: "Nadia", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Ikea-4", name: "Bathroom mirror", category: "Toilets", price: 65, qty: 3, totalPrice: 195, paid: 195, balance: 0, paidBy: "Nadia", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Ikea-5", name: "Mattress - Queen size", category: "Room", price: 1199, qty: 1, totalPrice: 1199, paid: 1199, balance: 0, paidBy: "Nadia", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Ikea-6", name: "Bar stool", category: "Kitchen", price: 69, qty: 2, totalPrice: 138, paid: 138, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Ikea-7", name: "Alas kaki", category: "Hall", price: 69, qty: 1, totalPrice: 69, paid: 69, balance: 0, paidBy: "Nadia", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Ikea-8", name: "Make up stool", category: "Room", price: 43, qty: 1, totalPrice: 43, paid: 43, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Ikea-9", name: "Alas kaki dapur", category: "Kitchen", price: 40, qty: 3, totalPrice: 120, paid: 120, balance: 0, paidBy: "Nadia", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Ikea-10", name: "Lampu donut", category: "Room", price: 200, qty: 1, totalPrice: 200, paid: 200, balance: 0, paidBy: "Nadia", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Other-1", name: "Water Jet", category: "Toilets", price: 150, qty: 1, totalPrice: 150, paid: 150, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Other-2", name: "Tint Window Trial", category: "Hall", price: 130, qty: 1, totalPrice: 130, paid: 130, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Other-3", name: "Sofa 3 seater", category: "Hall", price: 950, qty: 1, totalPrice: 950, paid: 950, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "Expected delivery: 18-04-2026", dimension: "" },
	{ itemId: "Other-4", name: "Dining Table + 6 chairs", category: "Hall", price: 3390, qty: 1, totalPrice: 3390, paid: 2200, balance: 1190, paidBy: "Eiman", txnStatus: "Pay Later", productStatus: "Completed", notes: "Expected delivery: 18-04-2026", dimension: "" },
	{ itemId: "Other-5", name: "Carpet Large Hall", category: "Hall", price: 800, qty: 1, totalPrice: 800, paid: 800, balance: 0, paidBy: "Nadia", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Other-6", name: "Carpet Medium - Dining", category: "Hall", price: 380, qty: 1, totalPrice: 380, paid: 380, balance: 0, paidBy: "Nadia", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Other-7", name: "Tinted Window final + upah", category: "Hall", price: 650, qty: 1, totalPrice: 650, paid: 650, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Other-8", name: "Tangga Portable", category: "Hall", price: 159, qty: 1, totalPrice: 159, paid: 159, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Other-9", name: "Tong sampah dapur", category: "Kitchen", price: 149, qty: 1, totalPrice: 149, paid: 149, balance: 0, paidBy: "Nadia", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Other-10", name: "Tong sampah luar", category: "Hall", price: 70, qty: 1, totalPrice: 70, paid: 70, balance: 0, paidBy: "Nadia", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Other-11", name: "Kepala pipe + bidet", category: "Toilets", price: 300, qty: 1, totalPrice: 300, paid: 300, balance: 0, paidBy: "Eiman", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Other-12", name: "Langsir + Blind + Rail", category: "Hall", price: 2500, qty: 1, totalPrice: 2500, paid: 2500, balance: 0, paidBy: "Nadia", txnStatus: "Paid", productStatus: "Completed", notes: "", dimension: "" },
	{ itemId: "Other-13", name: "Air fryer", category: "Kitchen", price: 150, qty: 1, totalPrice: 150, paid: 100, balance: 50, paidBy: "Eiman", txnStatus: "Pay Later", productStatus: "Completed", notes: "", dimension: "" },
]
