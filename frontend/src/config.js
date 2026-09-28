const env = import.meta.env;

export const SERVICES = {
  auth: env.VITE_AUTH_URL || "http://localhost:5001",
  user: env.VITE_USER_URL || "http://localhost:5002",
  market: env.VITE_MARKETPLACE_URL || "http://localhost:5003",
  deal: env.VITE_DEAL_URL || "http://localhost:5004",
  chat: env.VITE_CHAT_URL || "http://localhost:5010",
  contract: env.VITE_CONTRACT_URL || "http://localhost:5005",
  notification: env.VITE_NOTIFICATION_URL || "http://localhost:5006",
  translation: env.VITE_TRANSLATION_URL || "http://localhost:5011",
  ml: env.VITE_ML_URL || "http://localhost:5008",
  socket: env.VITE_SOCKET_URL || "http://localhost:5009",
  chain: env.VITE_BLOCKCHAIN_URL || "http://localhost:5007",
};

export const SOCKET_URL = env.VITE_SOCKET_URL || "http://localhost:5009";

// Languages the Profile model accepts, with their own-script names
export const LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "as", name: "Assamese", native: "অসমীয়া" },
  { code: "ur", name: "Urdu", native: "اردو" },
];

export const UNITS = ["KG", "QUINTAL", "TON", "PIECE", "PACKET"];
export const UNIT_LABEL = { KG: "kg", QUINTAL: "quintal", TON: "tonne", PIECE: "piece", PACKET: "packet" };

export const CATEGORIES = ["Grains", "Pulses", "Vegetables", "Fruits", "Spices", "Oilseeds", "Dairy", "Other"];

export const BUSINESS_TYPES = [
  "Wholesaler", "Retailer", "Exporter", "Food Processing", "Restaurant", "Individual", "Other",
];

export const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh",
];
