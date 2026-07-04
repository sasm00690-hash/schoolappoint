"use client";

// Force Netlify redeploy with new API env variable
import Link from "next/link";
import { useState, useEffect } from "react";
import SmaLogo from "@/components/SmaLogo";
import { 
  Calendar, 
  CheckCircle, 
  ShieldCheck, 
  Clock, 
  Users, 
  ChevronRight, 
  Search, 
  Menu, 
  X, 
  Sparkles,
  ArrowRight,
  HelpCircle,
  Sun,
  Moon,
  Check,
  Briefcase
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [systemMaintenance, setSystemMaintenance] = useState(false);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch(`${API_BASE}/public/system/maintenance`);
        if (res.ok) {
          const data = await res.json();
          if (data.maintenance_mode) {
            setSystemMaintenance(true);
          }
        }
      } catch (err) {
        console.error("Maintenance check failed:", err);
      }
    };
    checkMaintenance();
  }, []);

  // Onboarding Modal States
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [schoolPhone, setSchoolPhone] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [schoolDesc, setSchoolDesc] = useState("");
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingSuccess, setOnboardingSuccess] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("Starter");
  const [onboardingStep, setOnboardingStep] = useState(1);

  // Staff Job Application States
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applyFormData, setApplyFormData] = useState({
    name: "",
    email: "",
    sub_role: "Support",
    resume_url: "",
    bio: ""
  });

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName || !schoolEmail || !schoolPhone || !schoolAddress) {
      setOnboardingError("Fadlan buuxi dhammaan meelaha muhiimka ah (Magaca, Email-ka, Taleefanka, iyo Cinwaanka).");
      return;
    }

    setOnboardingLoading(true);
    setOnboardingError("");
    setOnboardingSuccess(false);

    try {
      const res = await fetch(`${API_BASE}/public/onboarding-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: schoolName,
          email: schoolEmail.toLowerCase(),
          phone: schoolPhone,
          address: schoolAddress,
          description: schoolDesc,
          selected_plan: selectedPlan
        })
      });

      const data = await res.json();
      if (res.ok) {
        setOnboardingSuccess(true);
        // Clear fields
        setSchoolName("");
        setSchoolEmail("");
        setSchoolPhone("");
        setSchoolAddress("");
        setSchoolDesc("");
        setOnboardingStep(1);
      } else {
        setOnboardingError(data.error || "Cillad ayaa dhacday inta lagu guda jiray dirista codsiga.");
      }
    } catch (err) {
      console.error(err);
      setOnboardingError("Cillad dhinaca server-ka ah ayaa dhacday. Fadlan mar kale isku day.");
    } finally {
      setOnboardingLoading(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyFormData.name || !applyFormData.email || !applyFormData.sub_role) {
      setApplyError("Fadlan buuxi dhammaan meelaha muhiimka ah.");
      return;
    }
    setApplyLoading(true);
    setApplyError("");
    setApplySuccess(false);

    try {
      const res = await fetch(`${API_BASE}/public/staff-apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applyFormData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Waa ku guuldareystay dirista codsiga.");
      setApplySuccess(true);
      setApplyFormData({
        name: "",
        email: "",
        sub_role: "Support",
        resume_url: "",
        bio: ""
      });
    } catch (err: any) {
      setApplyError(err.message || "Cillad dhinaca server-ka ah ayaa dhacday.");
    } finally {
      setApplyLoading(false);
    }
  };

  // Load theme on page load
  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark";
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newDark = !darkMode;
    setDarkMode(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const faqs = [
    {
      q: "Sidee waalidku u qabsan karaa ballan?",
      a: "Waalidiintu uma baahna akoon. Waxay kaliya gujinayaan 'Qabso Ballan', dooranayaan iskuulka ay rabaan, dooranayaan taariikhda & saacadda, buuxinayaan xogta ardayga, ka dibna soo degsanayaan tigidhkooda xaqiijinta."
    },
    {
      q: "Maxaa dhacaya haddii boosaska iskuulku buuxsamaan?",
      a: "Nidaamku wuxuu si automatic ah u xirayaa ballan-qabsiga iskuulkaas, wuxuuna waalidka u qorayaa liiska sugitaanka (waiting list), isagoo ogeysiinya maamulka iskuulka isla markiiba."
    },
    {
      q: "Ma maamuli karaan maamulayaasha iskuulku kalandarkooda?",
      a: "Haa. Maamulayaasha iskuuladu waxay awoodaan inay dejiyaan taariikhaha furan, saacadaha, muddada ballanta, fasaxyada, iyo xadka maalinlaha ah ama saacadlaha ah ee dashboard-kooda."
    },
    {
      q: "Nidaamku ma taageeraa doorar kala duwan?",
      a: "Haa. SMA wuxuu leeyahay saddex door oo kala duwan: Waalidiinta (ballan-qabsi), Maamulayaasha Iskuulka (dashboard-ka), iyo Super Admin-ka (maamulista guud ee iskuulada iyo rukunada)."
    }
  ];

  if (systemMaintenance) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl animate-fadeIn">
          <svg className="w-16 h-16 text-amber-500 animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <h2 className="text-2xl font-extrabold tracking-tight">Dayactir Ayaa Socda</h2>
          <p className="text-sm text-slate-450 leading-relaxed">
            Nidaamka waxaa ku socda dayactir kooban, dib ayaan u soo laaban doonaa dhowr daqiiqo ka dib.
          </p>
          <div className="pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              Dib u Furi / Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary selection:bg-primary selection:text-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <SmaLogo className="h-9" />
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-textSecondary">
              <a href="#how-it-works" className="hover:text-primary transition-colors">Sida Uu U Shaqeeyo</a>
              <a href="#features" className="hover:text-primary transition-colors">Sifooyinka</a>
              <a href="#pricing" className="hover:text-primary transition-colors">Qorshayaasha</a>
              <a href="#faq" className="hover:text-primary transition-colors">Su'aalaha Badanaa La Waydiiyo</a>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button 
              type="button"
              onClick={toggleDarkMode} 
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-textSecondary dark:text-slate-400 hover:text-primary transition-colors animate-pulse-slow"
              title="Beddel habka habeenkii/maalintii"
            >
              {darkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link href="/login" className="text-sm font-medium text-textSecondary hover:text-primary transition-colors">
              Gali System-ka
            </Link>
            <button 
              onClick={() => setApplyModalOpen(true)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-textPrimary dark:text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              💼 Ku Biir Kooxda
            </button>
            <button 
              onClick={() => setOnboardingModalOpen(true)}
              className="px-4 py-2.5 bg-accent hover:bg-emerald-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" /> Diiwangeli Iskuulka
            </button>
            <Link href="/book" className="px-5 py-2.5 bg-primary text-white font-medium text-sm rounded-lg shadow-sm hover:bg-primary-hover transition-all duration-200">
              Qabso Ballan
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-textSecondary hover:text-primary">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-panel border-b border-border px-4 pt-2 pb-6 space-y-3">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-textSecondary hover:text-primary">Sida Uu U Shaqeeyo</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-textSecondary hover:text-primary">Sifooyinka</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-textSecondary hover:text-primary">Qorshayaasha</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-textSecondary hover:text-primary">Su'aalaha Badanaa La Waydiiyo</a>
            <div className="border-t border-border pt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between py-1 text-sm text-textSecondary">
                <span>Habka Habeenkii</span>
                <button 
                  type="button"
                  onClick={toggleDarkMode} 
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-textSecondary dark:text-slate-400 hover:text-primary transition-colors"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
              <Link href="/login" className="w-full text-center py-2 text-sm font-medium text-textSecondary hover:text-primary">Gali System-ka</Link>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setOnboardingModalOpen(true);
                }}
                className="w-full py-2.5 bg-accent text-white font-semibold text-sm rounded-lg shadow-sm flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" /> Diiwangeli Iskuulka
              </button>
              <Link href="/book" className="w-full text-center py-2.5 bg-primary text-white font-medium text-sm rounded-lg shadow-sm">Qabso Ballan</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 lg:pt-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,rgba(15,76,129,0.1),theme(colors.background))] opacity-40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-xs font-semibold text-primary uppercase tracking-wide">
              <Sparkles className="w-4 h-4" /> Diiwangelinta Iskuulka ee Jiilka Cusub
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-textPrimary leading-tight tracking-tight">
              Ku Qabso Ballamaha Diiwangelinta <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Iskuulka Daqiiqado Gudahood
              </span>
            </h1>
            <p className="text-lg text-textSecondary max-w-xl mx-auto lg:mx-0">
              Ka baaqo safafka dhaadheer ee sugitaanka adoo ballan-qabsiga ilmahaaga online ku samaynaya. Waa fududahay, waa degdeg, waana 100% automatic.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/book" className="px-8 py-4 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover transition-all duration-200 flex items-center justify-center gap-2">
                Qabso Ballan <ArrowRight className="w-5 h-5" />
              </Link>
              <button 
                onClick={() => setOnboardingModalOpen(true)}
                className="px-8 py-4 bg-accent hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-md transition-all duration-200 flex items-center justify-center gap-2"
              >
                Diiwangeli Iskuulkaaga <Sparkles className="w-5 h-5" />
              </button>
              <Link href="/login" className="px-8 py-4 bg-white text-textPrimary font-semibold border border-border rounded-lg shadow-sm hover:bg-slate-50 transition-all duration-200 flex items-center justify-center">
                Qaybta Shaqaalaha
              </Link>
            </div>
          </div>

          {/* Premium UI Mockup Widget */}
          <div className="lg:col-span-5 relative">
            <div className="premium-card p-6 glass-panel max-w-md mx-auto relative z-10">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-textSecondary font-medium">sma.com/book</span>
              </div>
              <div className="space-y-4">
                <div className="h-6 w-1/3 bg-slate-200 rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="h-10 bg-slate-100 rounded border border-border flex items-center px-3 justify-between">
                    <span className="text-sm font-medium text-textPrimary">Dooro Iskuulka</span>
                    <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">Al-Nuur Academy</span>
                  </div>
                  <div className="h-10 bg-slate-100 rounded border border-border flex items-center px-3 justify-between">
                    <span className="text-sm font-medium text-textPrimary">Fasalka Ardayga</span>
                    <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">Grade 5</span>
                  </div>
                </div>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-primary">Keliya Waqtiyada Furan</h4>
                    <p className="text-xs text-textSecondary">Arbaco, June 15 saacadu markay tahay 10:00 Subaxnimo</p>
                  </div>
                </div>
                <div className="h-12 w-full bg-primary rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                  Dhammaystir Ballanta
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-secondary/10 rounded-full blur-2xl -z-10" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/15 rounded-full blur-3xl -z-10" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white border-t border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
            <h2 className="text-3xl font-extrabold text-textPrimary tracking-tight sm:text-4xl">
              Loo Sameeyay Gaar Ahaan Diiwangelinta Iskuulada ee Casriga Ah
            </h2>
            <p className="text-lg text-textSecondary">
              Wax kasta oo iskuuladu u baahan yihiin si loo fududeeyo is-diiwangelinta loona baabi'iyo safafka dhaadheer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="premium-card p-8">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-textPrimary mb-3">Ballan-Qabsiga Online-ka</h3>
              <p className="text-textSecondary leading-relaxed">
                Waalidiintu waxay dooranayaan taariikhda iyo saacadda saxda ah ee ku habboon jadwalka iskuulka. Ma jiraan safaf iyo khaladaad.
              </p>
            </div>
            <div className="premium-card p-8">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-textPrimary mb-3">Xakamaynta Awoodda ee Tooska ah</h3>
              <p className="text-textSecondary leading-relaxed">
                Maamulayaasha iskuuladu waxay dejiyaan xadka ugu badan saacaddii ama maalintii. Nidaamka ayaana xiraya ballamaha marka ay buuxsamaan.
              </p>
            </div>
            <div className="premium-card p-8">
              <div className="w-12 h-12 bg-warning/10 text-warning rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-textPrimary mb-3">Liiska Sugitaanka ee SaaS</h3>
              <p className="text-textSecondary leading-relaxed">
                Marka boosasku buuxsamaan, waalidiintu waxay si toos ah ugu biirayaan liiska sugitaanka. Maamulka ayaana oggolaan kara hal gujis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Subscriptions */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
            <h2 className="text-3xl font-extrabold text-textPrimary tracking-tight sm:text-4xl">
              Qorshayaasha Diiwangelinta ee Iskuulada Ku Biiro Platform-ka
            </h2>
            <p className="text-lg text-textSecondary">
              Iskuulada waxaa loo qoondeeyea qorshayaasha Starter, Standard, ama Premium oo uu maamulo Super Admin-ku.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="premium-card p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-textSecondary uppercase tracking-wider">Starter</h3>
                <p className="mt-4 text-sm text-textSecondary font-semibold text-primary">Heerka Koowaad</p>
                <p className="mt-2 text-sm text-textSecondary">Ku habboon iskuulada yaryar ee raba inay tijaabiyaan diiwangelinta digital-ka ah.</p>
                <ul className="mt-6 space-y-4 border-t border-border pt-6">
                  <li className="flex items-center gap-3 text-sm text-textSecondary">
                    <CheckCircle className="w-4 h-4 text-accent" /> Ilaa 50 ballamood bishii
                  </li>
                  <li className="flex items-center gap-3 text-sm text-textSecondary">
                    <CheckCircle className="w-4 h-4 text-accent" /> 1 Akoon ee Maamulaha Iskuulka
                  </li>
                  <li className="flex items-center gap-3 text-sm text-textSecondary">
                    <CheckCircle className="w-4 h-4 text-accent" /> Dashboard fudud
                  </li>
                </ul>
              </div>
              <Link href="/login" className="mt-8 block w-full text-center py-3 bg-slate-100 hover:bg-slate-200 text-textPrimary font-semibold rounded-lg transition-colors">
                Qaybta Shaqaalaha
              </Link>
            </div>

            {/* Standard Plan (Featured) */}
            <div className="premium-card p-8 border-2 border-primary relative flex flex-col justify-between">
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-wider">
                Ugu Caansan
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary uppercase tracking-wider">Standard</h3>
                <p className="mt-4 text-sm text-textSecondary font-semibold text-primary">Heerka Dhexe</p>
                <p className="mt-2 text-sm text-textSecondary">Aad ugu wanaagsan iskuulada gaarka loo leeyahay ee raba liisaska automatic-ga ah.</p>
                <ul className="mt-6 space-y-4 border-t border-border pt-6">
                  <li className="flex items-center gap-3 text-sm text-textSecondary">
                    <CheckCircle className="w-4 h-4 text-accent" /> Ilaa 500 ballamood bishii
                  </li>
                  <li className="flex items-center gap-3 text-sm text-textSecondary">
                    <CheckCircle className="w-4 h-4 text-accent" /> 5 Akoon oo ah Maamulayaal
                  </li>
                  <li className="flex items-center gap-3 text-sm text-textSecondary">
                    <CheckCircle className="w-4 h-4 text-accent" /> Liiska Sugitaanka & xaqiijinno
                  </li>
                </ul>
              </div>
              <Link href="/login" className="mt-8 block w-full text-center py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors">
                Qaybta Shaqaalaha
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="premium-card p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-textSecondary uppercase tracking-wider">Premium</h3>
                <p className="mt-4 text-sm text-textSecondary font-semibold text-primary">Heerka Sare</p>
                <p className="mt-2 text-sm text-textSecondary">Falanqayn dhameystiran, adeegyo dheeri ah, iyo taageero degdeg ah.</p>
                <ul className="mt-6 space-y-4 border-t border-border pt-6">
                  <li className="flex items-center gap-3 text-sm text-textSecondary">
                    <CheckCircle className="w-4 h-4 text-accent" /> Ballamo aan xad lahayn
                  </li>
                  <li className="flex items-center gap-3 text-sm text-textSecondary">
                    <CheckCircle className="w-4 h-4 text-accent" /> Akoonno maamule oo aan xad lahayn
                  </li>
                  <li className="flex items-center gap-3 text-sm text-textSecondary">
                    <CheckCircle className="w-4 h-4 text-accent" /> Habayn gaar ah & soo dejinta CSV
                  </li>
                </ul>
              </div>
              <Link href="/login" className="mt-8 block w-full text-center py-3 bg-slate-100 hover:bg-slate-200 text-textPrimary font-semibold rounded-lg transition-colors">
                Qaybta Shaqaalaha
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-white border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-extrabold text-textPrimary tracking-tight sm:text-4xl">
              Su'aalaha Badanaa La Waydiiyo
            </h2>
            <p className="text-lg text-textSecondary">
              Wax kasta oo aad u baahan tahay inaad ka ogaato platform-ka.
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="p-6 bg-background rounded-xl border border-border flex items-start gap-4">
                <HelpCircle className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-bold text-textPrimary mb-2">{faq.q}</h4>
                  <p className="text-sm text-textSecondary leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-slate-50 py-12 dark:bg-slate-950 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="flex items-center gap-4 justify-center opacity-70 hover:opacity-100 transition-opacity">
            <SmaLogo className="h-8" />
            <div className="h-5 w-px bg-slate-350 dark:bg-slate-700" />
            <img src="/logo1.png" alt="SMA Logo" className="h-8 object-contain rounded" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-textSecondary dark:text-slate-400">
              © 2026 SMA SaaS. Xuquuqda oo dhan waa dhowran tahay.
            </p>
            <p className="text-[10px] text-textSecondary/50 font-bold uppercase tracking-wider">
              Nidaamka Maamulka iyo Diwaangelinta Iskuulada (SMA)
            </p>
          </div>
        </div>
      </footer>
      {/* Onboarding Request Modal */}
      {onboardingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className={`bg-white dark:bg-slate-900 border border-border dark:border-slate-800 w-full rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 ${onboardingStep === 1 && !onboardingSuccess ? 'max-w-4xl' : 'max-w-lg'}`}>
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-accent" />
            
            {/* Header */}
            <div className="p-6 border-b border-border dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-lg text-textPrimary dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                  {onboardingSuccess 
                    ? "Codsiga Waa La Diray" 
                    : onboardingStep === 1 
                      ? "Tallaabada 1/2: Dooro Qorshahaaga Diiwangelinta" 
                      : "Tallaabada 2/2: Macluumaadka Iskuulka"}
                </h3>
                <p className="text-xs text-textSecondary dark:text-slate-400 mt-1">
                  {onboardingSuccess 
                    ? "U soo dir codsi Super Admin-ka si iskuulkaaga loogu daro platform-ka."
                    : onboardingStep === 1 
                      ? "Qorshayaasha Diiwangelinta ee Iskuulada Ku Biiro Platform-ka. Dooro midka aad rabto."
                      : "Fadlan buuxi macluumaadka iskuulkaaga si aad u gudbiso codsiga."}
                </p>
              </div>
              <button 
                onClick={() => {
                  setOnboardingModalOpen(false);
                  setOnboardingSuccess(false);
                  setOnboardingError("");
                  setOnboardingStep(1);
                }} 
                className="p-1.5 bg-slate-100 dark:bg-slate-800 text-textSecondary dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              {onboardingSuccess ? (
                <div className="text-center py-8 space-y-4 animate-scaleUp">
                  <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto border border-accent/20">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-base text-textPrimary dark:text-slate-100">Codsigaaga Waa La Gudbiyay!</h4>
                    <p className="text-xs text-textSecondary dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Waa lagu guuleystay gudbinta codsiga. Super Admin-ka ayaa dib u eegi doona macluumaadka iskuulkaaga, ka dibna wuxuu kuugu soo diri doonaa aqoonsiga email-kaaga.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setOnboardingModalOpen(false);
                      setOnboardingSuccess(false);
                      setOnboardingStep(1);
                    }}
                    className="px-6 py-2.5 bg-accent text-white font-bold text-xs rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
                  >
                    Xir Boggan
                  </button>
                </div>
              ) : onboardingStep === 1 ? (
                <div className="space-y-6 animate-scaleUp">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Starter Card */}
                    <div 
                      onClick={() => setSelectedPlan("Starter")}
                      className={`relative cursor-pointer p-5 rounded-2xl border transition-all duration-200 flex flex-col h-full ${selectedPlan === "Starter" ? 'border-accent bg-accent/5 dark:bg-accent/10 shadow-lg shadow-accent/5' : 'border-border dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'}`}
                    >
                      {selectedPlan === "Starter" && (
                        <div className="absolute top-3 right-3 bg-accent text-white p-1 rounded-full">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="mb-4">
                        <span className="text-[10px] font-bold tracking-widest text-slate-450 dark:text-slate-500 uppercase">Heerka Koowaad</span>
                        <h4 className="text-xl font-black text-textPrimary dark:text-slate-100 mt-1">Starter</h4>
                        <p className="text-xs text-textSecondary dark:text-slate-450 mt-2 leading-relaxed h-12">
                          Ku habboon iskuulada yaryar ee raba inay tijaabiyaan diiwangelinta digital-ka ah.
                        </p>
                      </div>
                      <div className="border-t border-border/50 dark:border-slate-800/50 my-3" />
                      <ul className="space-y-2.5 flex-1">
                        <li className="flex items-start gap-2 text-xs text-textSecondary dark:text-slate-300">
                          <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <span>Ilaa 50 ballamood bishii</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-textSecondary dark:text-slate-300">
                          <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <span>1 Akoon ee Maamulaha Iskuulka</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-textSecondary dark:text-slate-300">
                          <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <span>Dashboard fudud</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-textSecondary dark:text-slate-300">
                          <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <span>Qaybta Shaqaalaha</span>
                        </li>
                      </ul>
                    </div>

                    {/* Standard Card */}
                    <div 
                      onClick={() => setSelectedPlan("Standard")}
                      className={`relative cursor-pointer p-5 rounded-2xl border transition-all duration-200 flex flex-col h-full ${selectedPlan === "Standard" ? 'border-accent bg-accent/5 dark:bg-accent/10 shadow-lg shadow-accent/5' : 'border-border dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'}`}
                    >
                      <div className="absolute -top-2.5 right-4 bg-accent text-white px-2 py-0.5 text-[9px] rounded-full uppercase font-black tracking-wider shadow-sm">
                        Ugu Caansan
                      </div>
                      {selectedPlan === "Standard" && (
                        <div className="absolute top-3 right-3 bg-accent text-white p-1 rounded-full">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="mb-4">
                        <span className="text-[10px] font-bold tracking-widest text-slate-450 dark:text-slate-500 uppercase">Heerka Dhexe</span>
                        <h4 className="text-xl font-black text-textPrimary dark:text-slate-100 mt-1">Standard</h4>
                        <p className="text-xs text-textSecondary dark:text-slate-450 mt-2 leading-relaxed h-12">
                          Aad ugu wanaagsan iskuulada gaarka loo leeyahay ee raba liisaska automatic-ga ah.
                        </p>
                      </div>
                      <div className="border-t border-border/50 dark:border-slate-800/50 my-3" />
                      <ul className="space-y-2.5 flex-1">
                        <li className="flex items-start gap-2 text-xs text-textSecondary dark:text-slate-300">
                          <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <span>Ilaa 500 ballamood bishii</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-textSecondary dark:text-slate-300">
                          <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <span>5 Akoon oo ah Maamulayaal</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-textSecondary dark:text-slate-300">
                          <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <span>Liiska Sugitaanka & xaqiijinno</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-textSecondary dark:text-slate-300">
                          <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <span>Qaybta Shaqaalaha</span>
                        </li>
                      </ul>
                    </div>

                    {/* Premium Card */}
                    <div 
                      onClick={() => setSelectedPlan("Premium")}
                      className={`relative cursor-pointer p-5 rounded-2xl border transition-all duration-200 flex flex-col h-full ${selectedPlan === "Premium" ? 'border-accent bg-accent/5 dark:bg-accent/10 shadow-lg shadow-accent/5' : 'border-border dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'}`}
                    >
                      {selectedPlan === "Premium" && (
                        <div className="absolute top-3 right-3 bg-accent text-white p-1 rounded-full">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="mb-4">
                        <span className="text-[10px] font-bold tracking-widest text-slate-450 dark:text-slate-500 uppercase">Heerka Sare</span>
                        <h4 className="text-xl font-black text-textPrimary dark:text-slate-100 mt-1">Premium</h4>
                        <p className="text-xs text-textSecondary dark:text-slate-450 mt-2 leading-relaxed h-12">
                          Falanqayn dhameystiran, adeegyo dheeri ah, iyo taageero degdeg ah.
                        </p>
                      </div>
                      <div className="border-t border-border/50 dark:border-slate-800/50 my-3" />
                      <ul className="space-y-2.5 flex-1">
                        <li className="flex items-start gap-2 text-xs text-textSecondary dark:text-slate-300">
                          <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <span>Ballamo aan xad lahayn</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-textSecondary dark:text-slate-300">
                          <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <span>Akoonno maamule oo aan xad lahayn</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-textSecondary dark:text-slate-300">
                          <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <span>Habayn gaar ah & soo dejinta CSV</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={() => setOnboardingStep(2)}
                      className="px-8 py-3 bg-accent text-white font-black text-sm rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg hover:shadow-accent/10"
                    >
                      <span>Sii wad (Macluumaadka Iskuulka)</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleOnboardingSubmit} className="space-y-4 animate-scaleUp">
                  {onboardingError && (
                    <div className="p-3.5 bg-danger/10 text-danger border border-danger/20 rounded-xl text-xs flex items-start gap-2.5 animate-shake">
                      <X className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                      <span>{onboardingError}</span>
                    </div>
                  )}

                  {/* School Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-textPrimary dark:text-slate-300">Magaca Iskuulka <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      placeholder="Tusaale: Al-Hudda Model School"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-textPrimary dark:text-slate-100"
                      required
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-textPrimary dark:text-slate-300">Email-ka Iskuulka <span className="text-danger">*</span></label>
                      <input 
                        type="email" 
                        placeholder="admin@school.com"
                        value={schoolEmail}
                        onChange={(e) => setSchoolEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-textPrimary dark:text-slate-100"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-textPrimary dark:text-slate-300">Taleefanka WhatsApp-ka <span className="text-danger">*</span></label>
                      <input 
                        type="tel" 
                        placeholder="+252 61..."
                        value={schoolPhone}
                        onChange={(e) => setSchoolPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-textPrimary dark:text-slate-100"
                        required
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-textPrimary dark:text-slate-300">Cinwaanka / Address <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      placeholder="Mogadishu, Somalia"
                      value={schoolAddress}
                      onChange={(e) => setSchoolAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-textPrimary dark:text-slate-100"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-textPrimary dark:text-slate-300">Faahfaahin Dheeri ah (Optional)</label>
                    <textarea 
                      placeholder="Qor waxyaabaha aad rabo in laga ogaado iskuulkaaga..."
                      value={schoolDesc}
                      onChange={(e) => setSchoolDesc(e.target.value)}
                      rows={3}
                      className="w-full px-3.5 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-textPrimary dark:text-slate-100 resize-none"
                    />
                  </div>

                  {/* Submit and Back Buttons */}
                  <div className="pt-2 grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(1)}
                      className="py-3 bg-slate-100 dark:bg-slate-800 text-textSecondary dark:text-slate-300 font-bold text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
                    >
                      Kuma noqo
                    </button>
                    <button
                      type="submit"
                      disabled={onboardingLoading}
                      className="col-span-2 py-3 bg-accent text-white font-bold text-sm rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                    >
                      {onboardingLoading ? (
                        <>
                          <Clock className="w-4.5 h-4.5 animate-spin" />
                          <span>Lagu guda jiraa gudbinta...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4.5 h-4.5" />
                          <span>Gudbi Codsiga</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Staff Application Modal Overlay */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-border dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Briefcase className="w-5 h-5" />
                </span>
                <div className="text-left">
                  <h3 className="font-extrabold text-sm text-textPrimary">Ku Biir Kooxda Nidaamka SMA</h3>
                  <p className="text-[10px] text-textSecondary uppercase tracking-wider font-bold">Apply to Join Our Team</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setApplyModalOpen(false);
                  setApplySuccess(false);
                  setApplyError("");
                }}
                className="text-textSecondary hover:text-textPrimary p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-border dark:border-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              {applySuccess ? (
                <div className="py-6 text-center space-y-4 animate-scaleUp">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h4 className="font-extrabold text-sm text-textPrimary">Waa la gudbiyey Codsigaaga!</h4>
                  <p className="text-xs text-textSecondary leading-relaxed">
                    Si guul leh ayaa loo keydiyay codsigaaga shaqo. Owner-ka platform-ka ayaa dib u eegi doona oo email kuugu soo diri doona haddii lagu shaqaaleeyo!
                  </p>
                  <button
                    onClick={() => {
                      setApplyModalOpen(false);
                      setApplySuccess(false);
                    }}
                    className="w-full py-3 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-hover transition-colors shadow-sm"
                  >
                    Xir Daaqada (Close)
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-4 text-left">
                  {applyError && (
                    <div className="p-3.5 bg-danger/10 border border-danger/25 text-danger text-xs rounded-xl font-medium flex items-center gap-2">
                      <span>{applyError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-textPrimary dark:text-slate-300">Magacaaga Dhammaystiran <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        placeholder="Ahmed Mohamed"
                        value={applyFormData.name}
                        onChange={(e) => setApplyFormData({...applyFormData, name: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-textPrimary dark:text-slate-100"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-textPrimary dark:text-slate-300">Email-kaaga <span className="text-danger">*</span></label>
                      <input 
                        type="email" 
                        placeholder="ahmed@example.com"
                        value={applyFormData.email}
                        onChange={(e) => setApplyFormData({...applyFormData, email: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-textPrimary dark:text-slate-100"
                        required
                      />
                    </div>
                  </div>

                  {/* Preferred Role */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-textPrimary dark:text-slate-300">Doorka Aad Codsanayso (Preferred Role) <span className="text-danger">*</span></label>
                    <select 
                      value={applyFormData.sub_role}
                      onChange={(e) => setApplyFormData({...applyFormData, sub_role: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-textPrimary dark:text-slate-100"
                      required
                    >
                      <option value="Support">Adeegga Macaamiisha (Support)</option>
                      <option value="Billing">Maaliyadda & Rukunada (Billing)</option>
                      <option value="IT">Farsamada & IT (Tech Support)</option>
                    </select>
                  </div>

                  {/* Resume URL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-textPrimary dark:text-slate-300">Link-ga Resume / CV-gaaga (Google Drive/Dropbox PDF)</label>
                    <input 
                      type="url" 
                      placeholder="https://drive.google.com/..."
                      value={applyFormData.resume_url}
                      onChange={(e) => setApplyFormData({...applyFormData, resume_url: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-textPrimary dark:text-slate-100"
                    />
                  </div>

                  {/* Bio / Cover note */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-textPrimary dark:text-slate-300">Faahfaahin kooban / Bio (Cover Letter)</label>
                    <textarea 
                      placeholder="U sharax owner-ka sababta aad u rabto inaad ula shaqeyso..."
                      value={applyFormData.bio}
                      onChange={(e) => setApplyFormData({...applyFormData, bio: e.target.value})}
                      rows={4}
                      className="w-full px-3.5 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-textPrimary dark:text-slate-100 resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={applyLoading}
                      className="w-full py-3 bg-primary text-white font-bold text-sm rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                    >
                      {applyLoading ? (
                        <>
                          <Clock className="w-4.5 h-4.5 animate-spin" />
                          <span>Lagu guda jiraa gudbinta...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4.5 h-4.5" />
                          <span>Gudbi Codsiga Shaqo</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
