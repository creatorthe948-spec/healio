/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Activity, 
  ShieldAlert, 
  Send, 
  Globe, 
  Home, 
  Menu, 
  X, 
  Info, 
  Thermometer, 
  Droplets, 
  Wind, 
  AlertTriangle,
  Moon,
  Sun,
  ChevronRight,
  Calculator,
  Heart,
  Stethoscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  Language, 
  LANGUAGES, 
  Message, 
  Disease, 
  getTranslation 
} from './types';

// Initialize Gemini
// We use a fallback to empty string to prevent ReferenceErrors in the browser
const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenAI({ apiKey: API_KEY });

export default function App() {
  useEffect(() => {
    console.log("Healio app initializing...");
  }, []);
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'tools'>('home');
  const [language, setLanguage] = useState<Language>('English');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: getTranslation('English', 'welcome') + "! " + getTranslation('English', 'tagline'),
      sender: 'bot',
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [localDiseases, setLocalDiseases] = useState<Disease[]>([]);
  const [healthTip, setHealthTip] = useState('');
  const [bmi, setBmi] = useState<{ weight: string, height: string, result: number | null }>({ weight: '', height: '', result: null });
  const [isLowBatteryMode, setIsLowBatteryMode] = useState(false);
  const [isDataSavingMode, setIsDataSavingMode] = useState(false);
  
  const [waterIntake, setWaterIntake] = useState(0);
  const [seasonalAlert, setSeasonalAlert] = useState<{ title: string, desc: string } | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    
    fetch('/api/diseases')
      .then(res => res.json())
      .then(setLocalDiseases)
      .catch(err => console.error("Failed to fetch diseases:", err));
      
    fetch('/api/health-tips')
      .then(res => res.json())
      .then(data => setHealthTip(data.tip))
      .catch(err => console.error("Failed to fetch health tips:", err));

    // India-specific seasonal alerts (Mock logic based on current month)
    const month = new Date().getMonth();
    if (month >= 5 && month <= 8) { // Monsoon
      setSeasonalAlert({ title: "Monsoon Alert", desc: "Rise in Dengue and Malaria cases. Use mosquito nets and clear stagnant water." });
    } else if (month >= 10 || month <= 1) { // Winter
      setSeasonalAlert({ title: "Winter Health", desc: "Flu and Cold cases are rising. Keep warm and maintain hygiene." });
    }

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleSendMessage = async (text: string = inputText) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Emergency Detection
    const emergencyKeywords = ['chest pain', 'breathing difficulty', 'stroke', 'unconscious', 'seizure', 'heavy bleeding'];
    const isEmergency = emergencyKeywords.some(k => text.toLowerCase().includes(k));

    if (isEmergency) {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getTranslation(language, 'emergency_action'),
        sender: 'bot',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMessage]);
      return;
    }

    // Process Response
    try {
      let responseText = '';
      
      // Check local DB first (Offline Mode)
      const localMatch = localDiseases.find(d => 
        text.toLowerCase().includes(d.name.toLowerCase())
      );

      if (localMatch) {
        responseText = `**${localMatch.name}**\n\n${localMatch.description}\n\n**Symptoms:** ${localMatch.symptoms}\n\n**WHO Precautions:** ${localMatch.precautions}\n\n**Home Care:** ${localMatch.home_care}\n\n**When to consult:** ${localMatch.when_to_consult}\n\n*${getTranslation(language, 'who_label')}*`;
      } else if (isOnline) {
        // AI Response
        const result = await genAI.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{
            parts: [{
              text: `You are Healio, a health awareness assistant. 
              
              USER INPUT: "${text}"
              
              TASK:
              1. Detect the language and script of the user input.
              2. If the user uses an Indian language (like Hindi, Telugu, etc.) written in English letters (Romanized/Transliterated), you MUST respond in that SAME language using English letters.
              3. If the user uses a native script (like Devanagari or Telugu script), respond in that script.
              4. If the user uses English, respond in English.
              
              MEDICAL RULES:
              1. Follow WHO guidelines strictly.
              2. DO NOT diagnose or prescribe medicines.
              3. Provide precautions, symptoms, and home care.
              4. Always include a disclaimer in the response language: "Healio provides general educational information based on WHO guidelines and is not a substitute for professional medical advice."
              5. If symptoms sound serious, include a warning: "This condition may be serious. Please consult a qualified doctor immediately."
              
              RESPONSE STYLE:
              - Friendly, calm, and responsible.
              - Match the user's language style EXACTLY (e.g., if they write "naku jwaram ga undi", respond in Romanized Telugu).`
            }]
          }]
        });
        responseText = result.text || "I couldn't generate a response.";
      } else {
        responseText = "I'm currently offline and don't have information about this specific condition in my local database. Please check your internet connection or ask about common diseases like Fever, Dengue, or COVID-19.";
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again later.",
        sender: 'bot',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMessage]);
    }
  };

  const calculateBMI = () => {
    const h = parseFloat(bmi.height) / 100;
    const w = parseFloat(bmi.weight);
    if (h > 0 && w > 0) {
      setBmi({ ...bmi, result: parseFloat((w / (h * h)).toFixed(1)) });
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="glass sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 bg-medical-primary rounded-xl flex items-center justify-center text-white shadow-lg ${!isLowBatteryMode ? 'animate-float' : ''}`}>
            <Heart size={24} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-medical-primary leading-none">Healio</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Health Companion</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${isOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </div>
          
          <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer border-none"
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Welcome Card */}
              <div className="bg-gradient-to-br from-medical-primary to-medical-secondary p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold mb-1">{getTranslation(language, 'welcome')}</h2>
                  <p className="text-white/80 text-sm mb-4">{getTranslation(language, 'tagline')}</p>
                  <button 
                    onClick={() => setActiveTab('chat')}
                    className="bg-white text-medical-primary px-6 py-2 rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-transform"
                  >
                    Start Chatting
                  </button>
                </div>
                <Activity className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
              </div>

              {/* Seasonal Alert */}
              {seasonalAlert && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400">{seasonalAlert.title}</h3>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">{seasonalAlert.desc}</p>
                  </div>
                </div>
              )}

              {/* Water Intake Reminder */}
              <div className="glass p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <Droplets size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Water Intake</h3>
                    <p className="text-[10px] text-slate-500 font-medium">{waterIntake} / 8 glasses</p>
                  </div>
                </div>
                <button 
                  onClick={() => setWaterIntake(prev => Math.min(prev + 1, 8))}
                  className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                >
                  +
                </button>
              </div>

              {/* Health Tip */}
              <div className="glass p-4 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                  <Info size={20} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Daily Health Tip</h3>
                  <p className="text-sm font-medium leading-relaxed">{healthTip || "Stay hydrated and wash your hands frequently."}</p>
                </div>
              </div>

              {/* Quick Disease Buttons */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Fever', icon: <Thermometer />, color: 'bg-orange-100 text-orange-600' },
                  { name: 'Dengue', icon: <Droplets />, color: 'bg-red-100 text-red-600' },
                  { name: 'COVID-19', icon: <ShieldAlert />, color: 'bg-blue-100 text-blue-600' },
                  { name: 'Flu', icon: <Wind />, color: 'bg-emerald-100 text-emerald-600' }
                ].map(d => (
                  <button 
                    key={d.name}
                    onClick={() => {
                      setActiveTab('chat');
                      handleSendMessage(d.name);
                    }}
                    className="glass p-4 rounded-2xl flex flex-col items-center gap-2 hover:scale-105 transition-transform"
                  >
                    <div className={`w-12 h-12 ${d.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                      {d.icon}
                    </div>
                    <span className="text-sm font-bold">{d.name}</span>
                  </button>
                ))}
              </div>

              {/* Emergency Button */}
              <button 
                onClick={() => handleSendMessage("EMERGENCY")}
                className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white animate-pulse">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-red-600">{getTranslation(language, 'emergency_btn')}</h3>
                    <p className="text-[10px] text-red-500 font-medium">Click if you have severe symptoms</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-red-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              <div className="flex-1 space-y-4 pb-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={m.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {m.text}
                      </div>
                      <div className={`text-[8px] mt-1 opacity-50 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </motion.div>
          )}

          {activeTab === 'tools' && (
            <motion.div 
              key="tools"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="glass p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-medical-primary rounded-xl flex items-center justify-center text-white">
                    <Calculator size={24} />
                  </div>
                  <h2 className="text-xl font-bold">{getTranslation(language, 'bmi_calc')}</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Weight (kg)</label>
                    <input 
                      type="number" 
                      value={bmi.weight}
                      onChange={(e) => setBmi({...bmi, weight: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-medical-primary outline-none"
                      placeholder="e.g. 70"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Height (cm)</label>
                    <input 
                      type="number" 
                      value={bmi.height}
                      onChange={(e) => setBmi({...bmi, height: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-medical-primary outline-none"
                      placeholder="e.g. 175"
                    />
                  </div>
                  <button 
                    onClick={calculateBMI}
                    className="w-full bg-medical-primary text-white py-3 rounded-xl font-bold shadow-lg hover:bg-medical-primary/90 transition-colors"
                  >
                    Calculate BMI
                  </button>

                  {bmi.result && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mt-6 p-4 bg-medical-bg dark:bg-slate-800 rounded-2xl text-center"
                    >
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Your BMI Result</p>
                      <p className="text-4xl font-black text-medical-primary">{bmi.result}</p>
                      <p className="text-sm font-bold mt-2">
                        {bmi.result < 18.5 ? 'Underweight' : bmi.result < 25 ? 'Normal Weight' : bmi.result < 30 ? 'Overweight' : 'Obese'}
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="glass p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-medical-secondary rounded-xl flex items-center justify-center text-white">
                    <Stethoscope size={24} />
                  </div>
                  <h2 className="text-xl font-bold">Vaccination Reminders</h2>
                </div>
                <p className="text-sm text-slate-500">Stay updated with your immunization schedule. Feature coming soon in the next update.</p>
              </div>

              <div className="glass p-6 rounded-3xl space-y-4">
                <h2 className="text-xl font-bold mb-4">App Settings</h2>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                      <Activity size={18} />
                    </div>
                    <span className="text-sm font-bold">Low Battery Mode</span>
                  </div>
                  <button 
                    onClick={() => setIsLowBatteryMode(!isLowBatteryMode)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${isLowBatteryMode ? 'bg-medical-primary' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isLowBatteryMode ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      <Globe size={18} />
                    </div>
                    <span className="text-sm font-bold">Data Saving Mode</span>
                  </div>
                  <button 
                    onClick={() => setIsDataSavingMode(!isDataSavingMode)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${isDataSavingMode ? 'bg-medical-primary' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isDataSavingMode ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Chat Input Bar (Only in Chat Tab) */}
      {activeTab === 'chat' && (
        <div className="fixed bottom-20 left-0 right-0 p-4 z-40">
          <div className="max-w-4xl mx-auto glass rounded-2xl p-2 flex items-center gap-2 shadow-2xl">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={getTranslation(language, 'ask_placeholder')}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-1 outline-none ml-2"
            />
            <button 
              onClick={() => handleSendMessage()}
              className="p-3 bg-medical-primary text-white rounded-xl shadow-lg hover:bg-medical-primary/90 transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 px-6 py-3 flex items-center justify-between z-50">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-medical-primary' : 'text-slate-400'}`}
        >
          <Home size={20} />
          <span className="text-[10px] font-bold uppercase">{getTranslation(language, 'home')}</span>
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'chat' ? 'text-medical-primary' : 'text-slate-400'}`}
        >
          <MessageSquare size={20} />
          <span className="text-[10px] font-bold uppercase">{getTranslation(language, 'chat')}</span>
        </button>
        <button 
          onClick={() => setActiveTab('tools')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'tools' ? 'text-medical-primary' : 'text-slate-400'}`}
        >
          <Activity size={20} />
          <span className="text-[10px] font-bold uppercase">{getTranslation(language, 'tools')}</span>
        </button>
      </nav>

      {/* Floating Emergency Button (Mobile) */}
      {activeTab !== 'chat' && (
        <motion.button 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => {
            setActiveTab('chat');
            handleSendMessage("EMERGENCY");
          }}
          className="fixed bottom-24 right-6 w-14 h-14 bg-red-500 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-110 active:scale-95 transition-transform"
        >
          <AlertTriangle size={28} />
        </motion.button>
      )}
    </div>
  );
}
