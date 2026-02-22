export type Language = 
  | 'English' | 'Hindi' | 'Marathi' | 'Telugu' | 'Tamil' 
  | 'Kannada' | 'Malayalam' | 'Bengali' | 'Gujarati' 
  | 'Punjabi' | 'Odia' | 'Assamese' | 'Urdu';

export interface Disease {
  id: number;
  name: string;
  description: string;
  causes: string;
  symptoms: string;
  precautions: string;
  home_care: string;
  when_to_consult: string;
  emergency_signs: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}

export const LANGUAGES: Language[] = [
  'English', 'Hindi', 'Marathi', 'Telugu', 'Tamil', 
  'Kannada', 'Malayalam', 'Bengali', 'Gujarati', 
  'Punjabi', 'Odia', 'Assamese', 'Urdu'
];

export const TRANSLATIONS: Partial<Record<Language, any>> = {
  English: {
    welcome: "Welcome to Healio",
    tagline: "Your Smart Health Awareness Companion",
    disclaimer: "Healio provides general educational information based on WHO guidelines and is not a substitute for professional medical advice.",
    emergency_warning: "This condition may be serious. Please consult a qualified doctor immediately.",
    emergency_action: "This may be a medical emergency. Please contact emergency services or visit the nearest hospital immediately.",
    ask_placeholder: "Ask about a disease or symptom...",
    bmi_calc: "BMI Calculator",
    health_tips: "Daily Health Tips",
    offline_mode: "Offline Mode Active",
    online_mode: "Online Mode Active",
    emergency_btn: "EMERGENCY",
    who_label: "Precautions based on WHO public health recommendations.",
    home: "Home",
    chat: "Chat",
    tools: "Tools",
    settings: "Settings"
  },
  Hindi: {
    welcome: "हीलियो में आपका स्वागत है",
    tagline: "आपका स्मार्ट स्वास्थ्य जागरूकता साथी",
    disclaimer: "हीलियो WHO दिशानिर्देशों के आधार पर सामान्य शैक्षिक जानकारी प्रदान करता है और पेशेवर चिकित्सा सलाह का विकल्प नहीं है।",
    emergency_warning: "यह स्थिति गंभीर हो सकती है। कृपया तुरंत एक योग्य डॉक्टर से परामर्श करें।",
    emergency_action: "यह एक चिकित्सा आपात स्थिति हो सकती है। कृपया तुरंत आपातकालीन सेवाओं से संपर्क करें या निकटतम अस्पताल जाएं।",
    ask_placeholder: "किसी बीमारी या लक्षण के बारे में पूछें...",
    bmi_calc: "बीएमआई कैलकुलेटर",
    health_tips: "दैनिक स्वास्थ्य सुझाव",
    offline_mode: "ऑफलाइन मोड सक्रिय",
    online_mode: "ऑनलाइन मोड सक्रिय",
    emergency_btn: "आपातकालीन",
    who_label: "WHO सार्वजनिक स्वास्थ्य सिफारिशों पर आधारित सावधानियां।",
    home: "होम",
    chat: "चैट",
    tools: "उपकरण",
    settings: "सेटिंग्स"
  },
  // Add other languages as needed, but for now I'll focus on the core logic
  // and provide a fallback mechanism.
};

export const getTranslation = (lang: Language, key: string) => {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['English'][key];
};
