"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck,
  Search,
  BookOpen,
  Sun,
  Moon,
  Bell,
  Activity,
  Layers,
  Check,
  Info,
  Key,
  MessageSquare,
  Clock,
  ListTodo,
  CheckSquare,
  Briefcase,
  User,
  Crown,
  Shield
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import SmaLogo from "@/components/SmaLogo";
import { jsPDF } from "jspdf";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface School {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  address: string;
  phone: string;
  email: string;
  admission_status: "Open" | "Closed";
  max_appointments_per_day: number;
  max_appointments_per_hour: number;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  max_appointments_per_month: number;
}

interface PendingRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  status: "Pending" | "Approved" | "Rejected";
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "Info" | "Warning" | "Update";
  created_at: string;
}

interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  action: string;
  details: string;
  created_at: string;
}

const getInitials = (name: string): string => {
  if (!name) return "S";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getRandomColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hues = [200, 240, 280, 320, 340, 360, 160, 40];
  const hue1 = hues[Math.abs(hash) % hues.length];
  const hue2 = (hue1 + 40) % 360;
  return `hsl(${hue1}, 75%, 45%), hsl(${hue2}, 75%, 35%)`;
};

const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert("Fadlan soo geli sawir ka yar 5MB / Please upload an image smaller than 5MB");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      const MAX_WIDTH = 256;
      const MAX_HEIGHT = 256;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        callback(compressedBase64);
      }
    };
    img.src = event.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const translations = {
  en: {
    title: "SMA SaaS",
    portalName: "Super Admin Portal",
    signOut: "Sign Out",
    welcome: "Welcome,",
    overview: "Platform Overview",
    schools: "Manage Schools",
    pendingRequests: "Pending Requests",
    admins: "Register Admins",
    subscriptions: "Subscriptions & Plans",
    announcements: "Broadcast Alerts",
    auditLogs: "System Audit Logs",
    sessions: "Users & Sessions",
    
    // Stats
    totalTenants: "Total Tenants",
    totalBookings: "Total Bookings",
    totalWaitlist: "Total Waitlist",
    mrr: "Estimated MRR",
    systemStatus: "System Status",
    active: "Active",
    
    // Overview
    platformControl: "SaaS Control Console",
    welcomeMsg: "Welcome to the SMA platform dashboard. From this console, you can onboard new school clients (tenants), create logins for school headmasters/admins, monitor subscriptions, and view platform metrics.",
    privilegeMsg: "Super Admin system privileges are active. Audit logs are being generated for database security actions.",
    revenueOverview: "Revenue & Subscriptions Analytics",
    mrrGrowth: "MRR Growth (USD)",
    planDistribution: "Plan Distribution",
    newSignups: "New School Signups",

    // General
    addSchool: "Add New School",
    saveTenant: "Save Tenant",
    cancel: "Cancel",
    saveUpgrade: "Save Plan Upgrade",
    availablePlans: "Available Plans",
    limit: "Limit",
    bookingsMonth: "bookings/month",
    editSchool: "Edit School Details",
    createSchool: "Create New Tenant School",
    schoolDetails: "School Details",
    contactInfo: "Contact Information",
    maxDaily: "Max Bookings/Day",
    maxHourly: "Max Bookings/Hour",
    logoUrl: "Logo Image URL",
    address: "Location Address",
    phone: "WhatsApp Contact",
    email: "School Email",
    desc: "School Description",
    assignedSchool: "Assign School",
    role: "User Role",
    adminAccount: "School Admin Account",
    password: "Password",
    fullName: "Full Name",
    action: "Action",
    actions: "Actions",
    noSchools: "No tenant schools onboarded yet.",
    selectSchool: "-- Select Tenant School --",
    chooseSchool: "-- Choose School --",
    choosePlan: "-- Choose Plan --",
    duration: "Duration (Months)",
    assignSaaS: "Assign SaaS Tier",

    // Broadcast
    broadcastTitle: "Send Broadcast Announcement",
    broadcastPlaceholder: "Enter announcement details here...",
    broadcastSubject: "Subject / Title",
    broadcastType: "Announcement Type",
    broadcastBtn: "Broadcast to all Schools",
    broadcastHistory: "Broadcast History",
    announcementSent: "Announcement broadcasted successfully!",
    announcementDeleted: "Announcement deleted successfully!",
    announcementType: {
      Info: "Information",
      Warning: "Alert/Warning",
      Update: "Feature Update"
    },
    
    // Pending
    pendingTitle: "School Onboarding Requests",
    pendingSub: "Verify and onboard new schools that requested access.",
    approveAndSetup: "Approve & Setup",
    reject: "Reject",
    noPending: "No pending registration requests.",
    requestApproved: "Request approved and school registered successfully!",
    requestRejected: "Request rejected successfully.",
    
    // Audit Logs
    auditTitle: "System Audit Logs",
    auditSub: "Live monitoring of events and actions across all tenants.",
    time: "Time",
    details: "Details",
    user: "User",
    searchLogs: "Search audit logs by action or details...",
    
    // Plans Config
    plansConfigTitle: "Manage Subscription Plans",
    plansConfigSub: "Configure pricing and limits for each subscription tier.",
    editPlanRules: "Edit Plan Rules",
    planName: "Plan Name",
    priceMonth: "Price / Month ($)",
    savePlanSuccess: "Plan details updated successfully!",
    savePlan: "Save Plan Rules",
    billing: "Billing History",
    maintenance: "Maintenance Mode",
    usageAlertsTab: "Usage Alerts",
    supportHelp: "Support Tickets",
    invoiceDate: "Billing Date",
    amountPaid: "Amount Paid",
    downloadInvoice: "Download PDF",
    noInvoices: "No billing history records found.",
    maintenanceStatus: "Maintenance Status",
    maintenanceDesc: "Enable maintenance mode to lock all booking and admin portals during system updates.",
    maintenanceWarning: "WARNING: Activating maintenance mode will display a notice to all public users and school admins, blocking normal operations.",
    maintenanceActive: "Maintenance Mode is ACTIVE",
    maintenanceInactive: "Maintenance Mode is INACTIVE",
    turnOn: "Enable Maintenance Mode",
    turnOff: "Disable Maintenance Mode",
    usageAlertsDesc: "Monitor school booking usage against their active plan limit. Send warning dashboard notifications to schools exceeding 85% capacity.",
    usageLimit: "Usage / Limit",
    sendAlert: "Send Warning Notification",
    alertSentSuccess: "Warning notification sent to school successfully!",
    exceedsLimit: "Exceeds 85% Limit",
    supportTicketsDesc: "Respond to support inquiries and feature requests from registered schools.",
    ticketSubject: "Subject",
    ticketMessage: "Message",
    ticketReply: "Reply",
    ticketStatus: "Status",
    ticketPending: "Pending",
    ticketResolved: "Resolved",
    ticketCreatedAt: "Created At",
    writeReply: "Write a reply...",
    submitReply: "Submit Reply & Resolve",
    replySuccess: "Reply sent and ticket resolved!",
    noTickets: "No support tickets found."
  },
  so: {
    title: "SMA SaaS",
    portalName: "Super Admin Platform",
    signOut: "Ka Bax",
    welcome: "Ku soo dhawaada,",
    overview: "Guudmarka Platform-ka",
    schools: "Maamulista Iskuulada",
    pendingRequests: "Codsiyada Sugaya",
    admins: "Abuurista Admin-nada",
    subscriptions: "Rukunada & Xirmooyinka",
    announcements: "Ogeysiisyada Guud",
    auditLogs: "Diiwaanka Dhaqdhaqaaqa",
    sessions: "Dhaqdhaqaaqa Users-ka",
    
    // Stats
    totalTenants: "Iskuulada Diiwangelan",
    totalBookings: "Dhammaan Ballamaha",
    totalWaitlist: "Liiska Sugitaanka",
    mrr: "Dakhliga Bisha (MRR)",
    systemStatus: "Xaaladda Nidaamka",
    active: "Aad u Fiican",
    
    // Overview
    platformControl: "Console-ka Maamulka SaaS",
    welcomeMsg: "Ku soo dhawaada dashboard-ka maamulka guud ee nidaamka SMA. Halkaan waxaad ka maamuli kartaa iskuulada ku soo biiraya (tenants), u abuuri kartaa account-yada maamulayaasha iskuulada, kormeerikartaa rukunada, iyo falanqaynta dakhliga.",
    privilegeMsg: "Xuquuqda Super Admin-ka waa mid shaqaynaysa. Diiwaanka dhaqdhaqaaqa (Audit Logs) waxaa loo kaydinayaa si toos ah amniga database-ka awgiis.",
    revenueOverview: "Falanqaynta Dakhliga & Rukunada",
    mrrGrowth: "Kobaca MRR (USD)",
    planDistribution: "Qaybsiga Xirmooyinka",
    newSignups: "Iskuulada Cusub ee Ku Soo Biiray",

    // General
    addSchool: "Ku Dar Iskuul Cusub",
    saveTenant: "Keydi Iskuulka",
    cancel: "Buri",
    saveUpgrade: "Keydi Cusboonaysiinta",
    availablePlans: "Xirmooyinka Diyaar Ah",
    limit: "Xadka",
    bookingsMonth: "ballamaha/bishiiba",
    editSchool: "Wax ka beddel Xogta Iskuulka",
    createSchool: "Abuur Iskuul Cusub (Tenant)",
    schoolDetails: "Faahfaahinta Iskuulka",
    contactInfo: "Macluumaadka Xiriirka",
    maxDaily: "Xadka Ballamaha/Maalintii",
    maxHourly: "Xadka Ballamaha/Saacaddii",
    logoUrl: "Linkiga Sawirka Logada",
    address: "Goobta / Cinwaanka",
    phone: "WhatsApp-ka Xiriirka",
    email: "Email-ka Iskuulka",
    desc: "Sharaxaad Kooban",
    assignedSchool: "U qoondee Iskuul",
    role: "Doorka Isticmaalaha",
    adminAccount: "Akoonka Admin-ka",
    fullName: "Magaca Oo Buuxa",
    password: "Fungaha (Password)",
    action: "Falka",
    actions: "Fallo",
    noSchools: "Ma jiraan iskuulo weli diiwaangashan.",
    selectSchool: "-- Dooro Iskuulka --",
    chooseSchool: "-- Dooro Iskuulka --",
    choosePlan: "-- Dooro Xirmada --",
    duration: "Muddada (Bilo)",
    assignSaaS: "U qoondee Xirmo SaaS ah",

    // Broadcast
    broadcastTitle: "U Dir Ogeysiis Guud Dhammaan Iskuulada",
    broadcastPlaceholder: "Halkan ku qor faahfaahinta ogeysiiska aad u dirayso iskuulada...",
    broadcastSubject: "Mowduuca / Ciwaanka",
    broadcastType: "Nooca Ogeysiiska",
    broadcastBtn: "U Dir Dhammaan Iskuulada",
    broadcastHistory: "Diiwaanka Ogeysiisyada Sent",
    announcementSent: "Ogeysiisku si guul leh ayaa loo baahiyey!",
    announcementDeleted: "Ogeysiisku waa la tirtiray!",
    announcementType: {
      Info: "Warbixin Guud",
      Warning: "Digniin / Muhiim",
      Update: "Cusboonaysiin Sifo"
    },
    
    // Pending
    pendingTitle: "Codsiyada Diiwangelinta Iskuulada Cusub",
    pendingSub: "Hubi oo aqbal codsiyada iskuulada raba inay ku soo biiraan platform-ka.",
    approveAndSetup: "Oggolow & Deji",
    reject: "Diid",
    noPending: "Ma jiraan codsiyo cusub oo sugaya.",
    requestApproved: "Codsiga waa la oggolaaday, iskuulkana si guul leh ayaa loo abuuray!",
    requestRejected: "Codsiga si guul leh ayaa loo diiday.",
    
    // Audit Logs
    auditTitle: "Diiwaanka Dhaqdhaqaaqa Nidaamka",
    auditSub: "Kormeerka tooska ah ee waxqabadyada ka socda dhammaan iskuulada.",
    time: "Saacadda",
    details: "Faahfaahinta",
    user: "Isticmaalaha",
    searchLogs: "Ku raadi diiwaanka fal ama faahfaahin...",
    
    // Plans Config
    plansConfigTitle: "Maamulista Shuruucda Xirmooyinka",
    plansConfigSub: "Deji qiimayaasha iyo xadka ballamaha ee xirmo kasta.",
    editPlanRules: "Wax ka beddel Xirmada",
    planName: "Magaca Xirmada",
    priceMonth: "Qiimaha Bishiiba ($)",
    savePlanSuccess: "Shuruucda xirmada si guul leh ayaa loo cusboonaysiiyey!",
    savePlan: "Keydi Shuruucda",
    billing: "Qaansheegadka",
    maintenance: "Dayactirka System-ka",
    usageAlertsTab: "Xadka Boosaska",
    supportHelp: "Cabashada & Caawinaada",
    invoiceDate: "Taariikhda",
    amountPaid: "Lacagta la bixiyay",
    downloadInvoice: "Soo Degso PDF",
    noInvoices: "Weli ma jiraan qaansheegado la keydiyay.",
    maintenanceStatus: "Xaalada Dayactirka",
    maintenanceDesc: "Dassoorada dayactirka u daara si aad u xirto bogagga ballamaha iyo kontaroolada iskuulka inta cusboonaysiintu socoto.",
    maintenanceWarning: "DIGNIIN: Haddii aad u daarto habka dayactirka, dadka oo dhan waxaa u muuqan doona fariin ah in nidaamku xiran yahay.",
    maintenanceActive: "Habka Dayactirka wuu DAARAN yahay",
    maintenanceInactive: "Habka Dayactirka wuu DAMASAN yahay",
    turnOn: "Daar Dayactirka",
    turnOff: "Dami Dayactirka",
    usageAlertsDesc: "La soco inta ballamood ee iskuul kasta isticmaalay marka loo eego xadkiisa. U dir digniin haddii ay dhaafaan 85%.",
    usageLimit: "Isticmaalka / Xadka",
    sendAlert: "U dir Ogeysiis Digniin ah",
    alertSentSuccess: "Ogeysiis digniin ah si guul leh ayaa loo diray!",
    exceedsLimit: "Ka badan 85% Xadka",
    supportTicketsDesc: "Ka jawaab cabashooyinka iyo su'aalaha ay soo gudbiyaan maamulayaasha iskuulada.",
    ticketSubject: "Mowduuca",
    ticketMessage: "Farriinta",
    ticketReply: "Jawaabta",
    ticketStatus: "Xaalada",
    ticketPending: "Sugaya",
    ticketResolved: "La Xaliyay",
    ticketCreatedAt: "La Qoray",
    writeReply: "Halkan ku qor jawaabta...",
    submitReply: "Jawaab & Xali Ticket-ka",
    replySuccess: "Jawaabtii si guul leh ayaa loo diray, ticket-kana waa la xaliyay!",
    noTickets: "Ma jiraan wax cabashooyin ah oo la soo gudbiyay."
  }
};

const COLORS = ["#0f4c81", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=SMA1",
  "https://api.dicebear.com/7.x/bottts/svg?seed=SMA2",
  "https://api.dicebear.com/7.x/bottts/svg?seed=SMA3",
  "https://api.dicebear.com/7.x/bottts/svg?seed=SMA4",
  "https://api.dicebear.com/7.x/bottts/svg?seed=SMA5",
  "https://api.dicebear.com/7.x/bottts/svg?seed=SMA6"
];

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "profile" | "schools" | "pending" | "admins" | "subscriptions" | "announcements" | "audit" | "sessions" | "billing" | "maintenance" | "alerts" | "support" | "team" | "messages">("overview");
  const [overviewSubTab, setOverviewSubTab] = useState<"schools" | "team">("schools");
  const [teamSubTab, setTeamSubTab] = useState<"directory" | "applications">("directory");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Staff & Team Management State
  const [saStaff, setSaStaff] = useState<any[]>([]);
  const [saTasks, setSaTasks] = useState<any[]>([]);
  const [saPerformance, setSaPerformance] = useState<any>(null);
  const [saMessages, setSaMessages] = useState<any[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState<string>("");
  const [saApplications, setSaApplications] = useState<any[]>([]);
  const [selectedStaffDetail, setSelectedStaffDetail] = useState<any | null>(null);
  const [selectedAppDetail, setSelectedAppDetail] = useState<any | null>(null);

  const [staffFormData, setStaffFormData] = useState({
    name: "",
    email: "",
    password: "",
    sub_role: "Support",
    shift_start: "",
    shift_end: "",
    allowed_ip: "",
    avatar_url: "",
    is_department_head: false
  });

  const [taskFormData, setTaskFormData] = useState({
    assigned_to: "",
    title: "",
    description: ""
  });

  // Lists
  const [schools, setSchools] = useState<School[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [allWaitlist, setAllWaitlist] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [userSessions, setUserSessions] = useState<any[]>([]);

  // Upgraded Feature Lists
  const [billingInvoices, setBillingInvoices] = useState<any[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [usageAlerts, setUsageAlerts] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState<string>("");
  const [superAdminSignature, setSuperAdminSignature] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"en" | "so">("so");
  const [auditSearch, setAuditSearch] = useState("");

  // Credentials Modal State
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [approvedCreds, setApprovedCreds] = useState<{ email: string; password: string } | null>(null);

  // School Forms
  const [schoolModalOpen, setSchoolModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [schoolFormData, setSchoolFormData] = useState({
    name: "",
    logo_url: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    max_appointments_per_day: 50,
    max_appointments_per_hour: 5,
  });

  // Admin Form
  const [adminFormData, setAdminFormData] = useState({
    name: "",
    email: "",
    password: "",
    school_id: "",
    role: "Admin",
  });

  // Subscription Form
  const [subFormData, setSubFormData] = useState({
    school_id: "",
    plan_id: "",
    duration_months: 12
  });

  // Plan Config Form
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planFormData, setPlanFormData] = useState({
    name: "",
    price: "",
    max_appointments_per_month: 200
  });

  // Broadcast Announcement Form
  const [announcementFormData, setAnnouncementFormData] = useState({
    title: "",
    content: "",
    type: "Info" as "Info" | "Warning" | "Update"
  });

  // Status Alerts
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Load theme and signature on page load
  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark";
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    const savedSig = localStorage.getItem("superadmin_signature");
    if (savedSig) {
      setSuperAdminSignature(savedSig);
    }
  }, []);

  // Session Activity Heartbeat
  useEffect(() => {
    const sessionId = localStorage.getItem("sessionId");
    const storedToken = localStorage.getItem("token");
    if (!sessionId || !storedToken) return;

    const sendHeartbeat = async () => {
      try {
        await fetch(`${API_BASE}/auth/heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${storedToken}`
          },
          body: JSON.stringify({ sessionId })
        });
      } catch (err) {
        console.error("Heartbeat error:", err);
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
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

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 100;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL("image/png");
          setSuperAdminSignature(base64);
          localStorage.setItem("superadmin_signature", base64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserStr = localStorage.getItem("user");

    if (!storedToken || !storedUserStr) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUserStr);
    if (parsedUser.role !== "SuperAdmin") {
      router.push("/login");
      return;
    }

    setToken(storedToken);
    setUser(parsedUser);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    loadSuperAdminData();
  }, [token]);

  const loadSuperAdminData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSchools(),
        fetchPlans(),
        fetchAppointments(),
        fetchWaitingList(),
        fetchOnboardingRequests(),
        fetchAnnouncements(),
        fetchAuditLogs(),
        fetchSystemUsers(),
        fetchUserSessions(),
        fetchBillingHistory(),
        fetchMaintenanceStatus(),
        fetchUsageAlerts(),
        fetchSupportTickets(),
        fetchSaStaff(),
        fetchSaTasks(),
        fetchSaPerformance(),
        fetchStaffApplications()
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSaStaff = async () => {
    if (!token || user?.sub_role) return;
    try {
      const res = await fetch(`${API_BASE}/sa/staff`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setSaStaff(await res.json());
    } catch (e) {
      console.error("Error fetching staff:", e);
    }
  };

  const fetchSaTasks = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/sa/tasks`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setSaTasks(await res.json());
    } catch (e) {
      console.error("Error fetching tasks:", e);
    }
  };

  const fetchSaPerformance = async () => {
    if (!token || user?.sub_role) return;
    try {
      const res = await fetch(`${API_BASE}/sa/performance`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setSaPerformance(await res.json());
    } catch (e) {
      console.error("Error fetching performance metrics:", e);
    }
  };

  const fetchStaffApplications = async () => {
    if (!token || user?.sub_role) return;
    try {
      const res = await fetch(`${API_BASE}/sa/staff-applications`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setSaApplications(await res.json());
    } catch (e) {
      console.error("Error fetching staff applications:", e);
    }
  };

  // Safely redirect non-permitted active tabs for staff roles
  useEffect(() => {
    if (!user) return;
    const sub_role = user.sub_role;
    if (sub_role) {
      if (sub_role === "Support" && !["overview", "profile", "pending", "announcements", "support", "messages"].includes(activeTab)) {
        setActiveTab("overview");
      }
      if (sub_role === "Billing" && !["overview", "profile", "schools", "subscriptions", "billing", "alerts", "messages"].includes(activeTab)) {
        setActiveTab("overview");
      }
      if (sub_role === "IT" && !["overview", "profile", "announcements", "audit", "sessions", "maintenance", "messages"].includes(activeTab)) {
        setActiveTab("overview");
      }
    }
  }, [activeTab, user]);

  // Chat message polling
  useEffect(() => {
    if (!token || activeTab !== "messages" || !activeChatUser) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_BASE}/sa/messages/${activeChatUser}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          setSaMessages(await res.json());
        }
      } catch (e) {
        console.error("Error polling messages:", e);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeTab, activeChatUser, token]);

  const fetchSchools = async () => {
    const res = await fetch(`${API_BASE}/public/schools`);
    if (res.ok) setSchools(await res.json());
  };

  const fetchPlans = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/subscriptions/plans`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) setPlans(await res.json());
  };

  const fetchAppointments = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/appointments`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) setAllAppointments(await res.json());
  };

  const fetchWaitingList = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/waiting-list`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) setAllWaitlist(await res.json());
  };

  const fetchOnboardingRequests = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/onboarding-requests`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) setPendingRequests(await res.json());
  };

  const fetchAnnouncements = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/announcements`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) setAnnouncements(await res.json());
  };

  const fetchAuditLogs = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/audit-logs`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) setAuditLogs(await res.json());
  };

  const fetchSystemUsers = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/system/users`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) setSystemUsers(await res.json());
  };

  const fetchUserSessions = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/system/sessions`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) setUserSessions(await res.json());
  };

  const fetchBillingHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/billing/history`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setBillingInvoices(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMaintenanceStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/public/system/maintenance`);
      if (res.ok) {
        const data = await res.json();
        setMaintenanceMode(data.maintenance_mode);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsageAlerts = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/system/usage-alerts`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setUsageAlerts(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSupportTickets = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/support/tickets`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setTickets(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const drawGraduationCap = (doc: any, x: number, y: number, scale: number, color: number[]) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.setDrawColor(color[0], color[1], color[2]);
    
    // Top rhombus
    doc.triangle(
      x, y - 6 * scale,
      x - 10 * scale, y,
      x + 10 * scale, y,
      "F"
    );
    doc.triangle(
      x, y + 6 * scale,
      x - 10 * scale, y,
      x + 10 * scale, y,
      "F"
    );
    
    // Neck/stand
    doc.rect(x - 2.5 * scale, y + 2.5 * scale, 5 * scale, 3 * scale, "F");
    
    // Tassel line
    doc.setLineWidth(0.4 * scale);
    doc.line(x - 10 * scale, y, x - 10 * scale, y + 6 * scale);
    // Tassel circle
    doc.circle(x - 10 * scale, y + 6.5 * scale, 1 * scale, "F");
  };

  const getSchoolThemeColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const palettes = [
      [15, 76, 129],   // Navy Blue
      [16, 185, 129],  // Emerald Green
      [79, 70, 229],   // Indigo
      [13, 148, 136],  // Teal
      [124, 58, 237],  // Purple
      [190, 24, 74],   // Rose/Burgundy
      [3, 105, 161],   // Sky Blue
      [220, 38, 38],   // Crimson Red
    ];
    return palettes[Math.abs(hash) % palettes.length];
  };

  const generatePDFInvoice = (invoice: any) => {
    const doc = new jsPDF();
    const primaryColor = getSchoolThemeColor(invoice.school_name); // [r, g, b] unique to school
    const secondaryColor = [15, 23, 42]; // Slate 900 (deep slate)
    const accentColor = [34, 197, 94]; // Green 500
    const textGrey = [100, 116, 139]; // Slate 500
    const borderSlate = [226, 232, 240]; // Slate 200

    // Fetch the real school details from the database state
    const schoolDetails = schools.find(s => s.id === invoice.school_id) || {
      address: "Mogadishu, Somalia",
      phone: "+252 61 5000000",
      email: "info@school.edu.so"
    };

    // Local Helper: Draw Website/Globe icon
    const drawGlobe = (x: number, y: number, color: number[]) => {
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(0.3);
      doc.circle(x, y, 2.2, "D");
      doc.ellipse(x, y, 0.8, 2.2, "D");
      doc.line(x - 2.2, y, x + 2.2, y);
    };

    // Local Helper: Draw Email/Envelope icon
    const drawEnvelope = (x: number, y: number, color: number[]) => {
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(0.3);
      doc.rect(x - 2.2, y - 1.6, 4.4, 3.2, "D");
      doc.line(x - 2.2, y - 1.6, x, y);
      doc.line(x + 2.2, y - 1.6, x, y);
    };

    // Local Helper: Draw Headset support icon
    const drawHeadset = (x: number, y: number, color: number[], bgColor: number[]) => {
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(0.3);
      doc.ellipse(x, y, 2, 2, "D");
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.rect(x - 2.5, y + 0.3, 5, 2, "F"); // cover bottom half of headband
      
      // Ear cups
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(x - 2.3, y - 0.4, 0.6, 1.4, "F");
      doc.rect(x + 1.7, y - 0.4, 0.6, 1.4, "F");
      
      // Microphone line
      doc.line(x - 2, y + 0.7, x - 0.8, y + 1.6);
    };

    // Local Helper: Draw cursive signature fallback
    const drawCursiveSignature = (pdfDoc: any, startX: number, startY: number) => {
      pdfDoc.setDrawColor(37, 99, 235); // Blue ink
      pdfDoc.setLineWidth(0.6);
      pdfDoc.line(startX, startY, startX + 5, startY - 4);
      pdfDoc.line(startX + 5, startY - 4, startX + 10, startY + 2);
      pdfDoc.line(startX + 10, startY + 2, startX + 17, startY - 2);
      pdfDoc.line(startX + 17, startY - 2, startX + 21, startY + 1);
      pdfDoc.line(startX + 21, startY + 1, startX + 26, startY - 1);
      pdfDoc.line(startX + 26, startY - 1, startX + 34, startY - 3);
      pdfDoc.line(startX + 34, startY - 3, startX + 40, startY + 2);
      pdfDoc.line(startX - 2, startY + 2, startX + 44, startY); // underline stroke
    };

    // Local Helper: Draw curved text along a circular arc
    const drawTextAlongArc = (pdfDoc: any, str: string, cX: number, cY: number, r: number, startAngle: number, endAngle: number) => {
      const chars = str.split("");
      const n = chars.length;
      for (let i = 0; i < n; i++) {
        const angleDeg = startAngle + (i * (endAngle - startAngle)) / (n - 1);
        const angleRad = (angleDeg * Math.PI) / 180;
        const x = cX + r * Math.cos(angleRad);
        const y = cY + r * Math.sin(angleRad);
        const rotation = 270 - angleDeg;
        pdfDoc.text(chars[i], x, y, { align: "center", angle: rotation });
      }
    };

    // 1. Header Background (using school's dynamic primaryColor)
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 35, "F");

    // Bright green accent stripe under header
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(0, 35, 210, 1.5, "F");

    // Logo Wordmark: SM (white, bold) + Green stylized Chevron A with two dots
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("SM", 15, 22);

    // Draw the green Chevron letter A
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(1.3);
    doc.line(29.8, 22.0, 33.8, 16.0);
    doc.line(33.8, 16.0, 37.8, 22.0);

    // Draw two green dots for the Chevron logo (top and inside)
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.circle(33.8, 13.0, 1.3, "F"); // top dot
    doc.circle(33.8, 19.1, 1.3, "F"); // inside dot

    // Vertical white divider line in header
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(42.5, 10, 42.5, 26);

    // School management system description next to divider
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text("SMA.", 46, 17);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text("SMA", 46 + doc.getTextWidth("SMA."), 17);
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("SCHOOL MANAGEMENT SYSTEM", 46, 23.5);

    // Right-aligned Invoice details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("INVOICE", 195, 13, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Invoice Number", 140, 18);
    doc.text(":", 165, 18);
    doc.text(`INV-${new Date(invoice.billing_date).getFullYear()}-${invoice.id.substring(0, 8).toUpperCase()}`, 168, 18);

    doc.text("Issue Date", 140, 21.8);
    doc.text(":", 165, 21.8);
    doc.text(new Date(invoice.billing_date).toLocaleDateString("en-US", { day: 'numeric', month: 'long', year: 'numeric' }), 168, 21.8);

    doc.text("Payment Status", 140, 25.6);
    doc.text(":", 165, 25.6);
    // Draw rounded green Paid badge
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(168, 23.2, 14, 3.6, 0.8, 0.8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text("PAID ✓", 175, 25.8, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Currency", 140, 29.4);
    doc.text(":", 165, 29.4);
    doc.text("USD", 168, 29.4);

    // 2. BILLED TO & ISSUED BY Cards
    const cardStartY = 44;
    // Central vertical slate line separating cards
    doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
    doc.setLineWidth(0.4);
    doc.line(105, cardStartY, 105, cardStartY + 34);

    // --- Left Card: BILLED TO ---
    // Avatar circle with user silhouette inside
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.circle(20, 50, 4.5, "F");
    doc.setFillColor(255, 255, 255);
    doc.circle(20, 48.8, 1.3, "F"); // User head
    doc.ellipse(20, 52.8, 2.2, 1.1, "F"); // User shoulders

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("BILLED TO", 27, 48.5);

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(9.5);
    doc.text("Loo Diray", 27, 53.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(invoice.school_name, 27, 58);
    doc.text(`${invoice.plan_name} Subscription`, 27, 62.5);
    doc.text(schoolDetails.address, 27, 67);
    doc.text(`Contact: ${schoolDetails.phone} | ${schoolDetails.email}`, 27, 71.5);

    // --- Right Card: ISSUED BY ---
    // Green circle with building silhouette inside
    doc.setFillColor(34, 197, 94);
    doc.circle(115, 50, 4.5, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(112.8, 47.8, 4.4, 4.4, "F"); // building body
    doc.rect(114.2, 46.8, 1.6, 1, "F"); // building roof
    doc.setFillColor(34, 197, 94); // window color overlay
    doc.rect(113.5, 48.5, 0.8, 0.8, "F");
    doc.rect(115.7, 48.5, 0.8, 0.8, "F");
    doc.rect(113.5, 50.5, 0.8, 0.8, "F");
    doc.rect(115.7, 50.5, 0.8, 0.8, "F");

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("ISSUED BY", 122, 48.5);

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(9.5);
    doc.text("SMA School Management System", 122, 53.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Kasoo Baaxay", 122, 58);

    // Contact info lists with vector icons
    drawEnvelope(115, 62.5, textGrey);
    doc.setFontSize(8);
    doc.text("billing@smasaas.com", 122, 63.5);

    drawGlobe(115, 67, textGrey);
    doc.text("www.smasaas.com", 122, 68);

    drawHeadset(115, 71.5, textGrey, [255, 255, 255]);
    doc.text("Super Admin Portal Support", 122, 72.5);

    // Horizontal line separating cards from table
    doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
    doc.setLineWidth(0.5);
    doc.line(15, 82, 195, 82);

    // 3. TABLE DESCRIPTION
    const tableStartY = 86;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, tableStartY, 180, 8, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("DESCRIPTION", 20, tableStartY + 5.2);
    doc.text("QTY", 120, tableStartY + 5.2, { align: "center" });
    doc.text("UNIT PRICE", 155, tableStartY + 5.2, { align: "right" });
    doc.text("AMOUNT", 190, tableStartY + 5.2, { align: "right" });

    // Table Row
    const rowY = tableStartY + 13;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${invoice.plan_name} Subscription Plan`, 20, rowY);
    doc.text("1", 120, rowY, { align: "center" });
    doc.text(`$${Number(invoice.amount).toFixed(2)}`, 155, rowY, { align: "right" });
    doc.text(`$${Number(invoice.amount).toFixed(2)}`, 190, rowY, { align: "right" });

    // Row divider line
    doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
    doc.setLineWidth(0.4);
    doc.line(15, rowY + 6, 195, rowY + 6);

    // 4. TOTALS BLOCK & NOTE BLOCK
    const totalsStartY = rowY + 12;

    // --- Left Note Block ---
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Thank You!", 15, totalsStartY);

    doc.setTextColor(textGrey[0], textGrey[1], textGrey[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("We appreciate your partnership with", 15, totalsStartY + 6);
    doc.text("SMA SaaS Platform.", 15, totalsStartY + 10);
    doc.text("This document serves as an official payment", 15, totalsStartY + 14);
    doc.text("receipt and subscription confirmation.", 15, totalsStartY + 18);

    // --- Right Totals Block ---
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Subtotal :", 140, totalsStartY);
    doc.text(`$${Number(invoice.amount).toFixed(2)}`, 190, totalsStartY, { align: "right" });

    doc.text("Tax :", 140, totalsStartY + 5);
    doc.text("$0.00", 190, totalsStartY + 5, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.text("Total Paid :", 140, totalsStartY + 12);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFontSize(11);
    doc.text(`$${Number(invoice.amount).toFixed(2)} USD`, 190, totalsStartY + 12, { align: "right" });

    // Payment Received Badge Pill
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.roundedRect(138, totalsStartY + 17, 52, 6.5, 1.2, 1.2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("✓  PAYMENT RECEIVED", 164, totalsStartY + 21.2, { align: "center" });

    // 5. SIGNATURE & STAMP BLOCK
    const signBlockY = totalsStartY + 45;

    // --- Left Signature Line & Image ---
    doc.setDrawColor(textGrey[0], textGrey[1], textGrey[2]);
    doc.setLineWidth(0.4);
    doc.line(15, signBlockY, 65, signBlockY); // line

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Authorized Signature", 15, signBlockY + 5);

    doc.setTextColor(textGrey[0], textGrey[1], textGrey[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("SMA SaaS Administration", 15, signBlockY + 9);

    // Draw uploaded signature or fallback cursive
    if (superAdminSignature) {
      try {
        doc.addImage(superAdminSignature, "PNG", 18, signBlockY - 17, 44, 14);
      } catch (err) {
        console.error("Error drawing signature image:", err);
        drawCursiveSignature(doc, 18, signBlockY - 8);
      }
    } else {
      drawCursiveSignature(doc, 18, signBlockY - 8);
    }

    // --- Right Circular Official Stamp (Matches close-up reference image) ---
    const stampColor = [37, 99, 235]; // Stamp Blue ink
    const centerX = 165;
    const centerY = signBlockY - 2;
    const rOuter = 19;
    const rInner = 15.5;

    doc.setDrawColor(stampColor[0], stampColor[1], stampColor[2]);
    doc.setLineWidth(0.8);
    doc.circle(centerX, centerY, rOuter, "D"); // Outer stamp circle

    doc.setLineWidth(0.4);
    doc.circle(centerX, centerY, rInner, "D"); // Inner stamp circle

    // Top curved text: SMA SCHOOL MANAGEMENT SYSTEM
    doc.setTextColor(stampColor[0], stampColor[1], stampColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(4.6);
    drawTextAlongArc(doc, "SMA SCHOOL MANAGEMENT SYSTEM", centerX, centerY, 17.2, 195, 345);

    // Bottom curved text: SMA SaaS Platform
    drawTextAlongArc(doc, "SMA SaaS Platform", centerX, centerY, 17.2, 165, 15);

    // Draw star separators at 180 and 0 degrees
    doc.setFontSize(5.5);
    const starLeftX = centerX + 17.2 * Math.cos(Math.PI);
    const starLeftY = centerY + 17.2 * Math.sin(Math.PI);
    doc.text("★", starLeftX, starLeftY, { align: "center", angle: 90 });

    const starRightX = centerX + 17.2 * Math.cos(0);
    const starRightY = centerY + 17.2 * Math.sin(0);
    doc.text("★", starRightX, starRightY, { align: "center", angle: 270 });

    // Inner Stamp text at the top
    doc.setFontSize(5);
    doc.text("OFFICIAL STAMP", centerX, centerY - 4.5, { align: "center" });

    // Draw stylized SMA Logo in center: "SM" in Blue text + Green Chevron A with two dots
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(stampColor[0], stampColor[1], stampColor[2]);
    doc.text("SM", centerX - 6.2, centerY + 2.8);

    // Chevron Green letter A
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(0.65);
    doc.line(centerX + 1.6, centerY + 2.8, centerX + 3.8, centerY - 0.4);
    doc.line(centerX + 3.8, centerY - 0.4, centerX + 6.0, centerY + 2.8);

    // Two Green dots for the Chevron logo (top and inside)
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.circle(centerX + 3.8, centerY - 1.8, 0.65, "F"); // top dot
    doc.circle(centerX + 3.8, centerY + 1.3, 0.65, "F"); // inside dot

    // 6. BOTTOM FOOTER BAND
    const footerStartY = 282;

    // Green stripe
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(0, footerStartY - 1, 210, 1, "F");

    // Dark slate background
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(0, footerStartY, 210, 15, "F");

    // Footer contact sections
    const footerTextColor = [255, 255, 255];
    const footerGreyColor = [148, 163, 184];

    // Col 1: Web
    drawGlobe(20, footerStartY + 7, accentColor);
    doc.setTextColor(footerTextColor[0], footerTextColor[1], footerTextColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("www.smasaas.com", 26, footerStartY + 6);
    doc.setTextColor(footerGreyColor[0], footerGreyColor[1], footerGreyColor[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text("Visit our website", 26, footerStartY + 10);

    // Col 2: Email
    drawEnvelope(85, footerStartY + 7, accentColor);
    doc.setTextColor(footerTextColor[0], footerTextColor[1], footerTextColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("billing@smasaas.com", 91, footerStartY + 6);
    doc.setTextColor(footerGreyColor[0], footerGreyColor[1], footerGreyColor[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text("Email for support", 91, footerStartY + 10);

    // Col 3: Support
    drawHeadset(150, footerStartY + 7, accentColor, secondaryColor);
    doc.setTextColor(footerTextColor[0], footerTextColor[1], footerTextColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("Super Admin Support", 156, footerStartY + 6);
    doc.setTextColor(footerGreyColor[0], footerGreyColor[1], footerGreyColor[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text("We're here to help you", 156, footerStartY + 10);

    doc.save(`Invoice_${invoice.school_name.replace(/\s+/g, "_")}_${invoice.id.substring(0, 8)}.pdf`);
  };

  const handleToggleMaintenanceMode = async (status: boolean) => {
    if (!token) return;
    if (!confirm(lang === "so" 
      ? `Ma hubtaa inaad rabto inaad ${status ? "DAARTO" : "DAMISO"} habka dayactirka?`
      : `Are you sure you want to ${status ? "ENABLE" : "DISABLE"} maintenance mode?`)) return;

    setActionLoading(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/system/maintenance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ maintenance_mode: status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update maintenance mode");
      setMaintenanceMode(data.maintenance_mode);
      setMsg(lang === "so"
        ? `Habka dayactirka waa la ${data.maintenance_mode ? "daaray" : "demiyey"}!`
        : `Maintenance mode has been successfully ${data.maintenance_mode ? "enabled" : "disabled"}!`);
      await fetchAuditLogs();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendUpgradeAlert = async (schoolId: string, percentage: number) => {
    if (!token) return;
    setActionLoading(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/system/send-upgrade-alert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ school_id: schoolId, percentage })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send upgrade alert");
      setMsg(translations[lang].alertSentSuccess);
      await fetchAuditLogs();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedTicket || !ticketReplyText.trim()) return;
    setActionLoading(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/support/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ reply: ticketReplyText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reply to ticket");
      setMsg(translations[lang].replySuccess);
      setTicketReplyText("");
      setSelectedTicket(null);
      await fetchSupportTickets();
      await fetchAuditLogs();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Create or Update School
  const handleSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setActionLoading(true);
    setMsg("");
    setErr("");

    try {
      const isEdit = !!editingSchool;
      const url = isEdit ? `${API_BASE}/schools/${editingSchool.id}` : `${API_BASE}/schools`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(schoolFormData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save school");

      const successMsg = isEdit 
        ? (lang === "so" ? "Xogta iskuulka waa la cusboonaysiiyey!" : "School updated successfully!")
        : (lang === "so" ? "Iskuulka cusub waa la diyaarshay!" : "School created successfully!");
      
      setMsg(successMsg);

      setSchoolModalOpen(false);
      setEditingSchool(null);
      setSchoolFormData({
        name: "",
        logo_url: "",
        description: "",
        address: "",
        phone: "",
        email: "",
        max_appointments_per_day: 50,
        max_appointments_per_hour: 5,
      });
      await fetchSchools();
      await fetchAuditLogs();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete School
  const handleDeleteSchool = async (id: string) => {
    const warnMsg = lang === "so" 
      ? "Ma hubtaa inaad rabto inaad tirtirto iskuulkan? Dhammaan akoonnada admin-ka iyo ballamaha waa la tirtiri doonaa weligood."
      : "Are you sure you want to delete this school? All admin accounts and appointments will be permanently removed.";
    
    if (!token || !confirm(warnMsg)) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/schools/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setMsg(lang === "so" ? "Iskuulkii waa la tirtiray!" : "School deleted successfully!");
        await fetchSchools();
        await fetchAuditLogs();
      } else {
        const data = await res.json();
        setErr(data.error || "Failed to delete school");
      }
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Register Admin Account
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setActionLoading(true);
    setMsg("");
    setErr("");

    try {
      const res = await fetch(`${API_BASE}/auth/register-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(adminFormData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register admin");

      setMsg(lang === "so" ? "Akoonka maamulaha waa la abuuray!" : "Admin account registered successfully!");

      setAdminFormData({
        name: "",
        email: "",
        password: "",
        school_id: "",
        role: "Admin",
      });
      await fetchAuditLogs();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Upgrade Subscription
  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setActionLoading(true);
    setMsg("");
    setErr("");

    try {
      const res = await fetch(`${API_BASE}/subscriptions/upgrade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          school_id: subFormData.school_id,
          plan_id: subFormData.plan_id,
          duration_months: Number(subFormData.duration_months)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upgrade subscription");

      setMsg(lang === "so" ? "Rukunka iskuulka si fiican ayaa loo cusboonaysiiyey!" : "School subscription upgraded successfully!");

      setSubFormData({
        school_id: "",
        plan_id: "",
        duration_months: 12
      });
      await fetchAuditLogs();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Editing Plan pricing & rules (saves to database)
  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !token) return;
    setActionLoading(true);
    setMsg("");
    setErr("");

    try {
      const res = await fetch(`${API_BASE}/subscriptions/plans/${editingPlan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          price: Number(planFormData.price),
          max_appointments_per_month: Number(planFormData.max_appointments_per_month)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update plan");

      setMsg(translations[lang].savePlanSuccess);
      setEditingPlan(null);
      await fetchPlans();
      await fetchAuditLogs();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Broadcast announcement (saves to database)
  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !announcementFormData.title.trim() || !announcementFormData.content.trim()) return;
    setActionLoading(true);
    setMsg("");
    setErr("");

    try {
      const res = await fetch(`${API_BASE}/announcements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(announcementFormData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create announcement");

      setMsg(translations[lang].announcementSent);
      setAnnouncementFormData({
        title: "",
        content: "",
        type: "Info"
      });
      await fetchAnnouncements();
      await fetchAuditLogs();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (id: string) => {
    if (!token || !confirm(lang === "so" ? "Ma hubtaa inaad rabto inaad tirtirto ogeysiiskan?" : "Are you sure you want to delete this announcement?")) return;
    
    try {
      const res = await fetch(`${API_BASE}/announcements/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setMsg(translations[lang].announcementDeleted);
        await fetchAnnouncements();
        await fetchAuditLogs();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Approve Onboarding Request
  const handleApproveRequest = async (req: PendingRequest) => {
    if (!token) return;
    setActionLoading(true);
    setMsg("");
    setErr("");

    try {
      const res = await fetch(`${API_BASE}/onboarding-requests/${req.id}/approve`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve onboarding request");

      setMsg(translations[lang].requestApproved);
      
      // Load generated admin account into state to show user
      setApprovedCreds(data.admin);
      setShowCredsModal(true);

      await fetchOnboardingRequests();
      await fetchSchools();
      await fetchAuditLogs();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (id: string) => {
    if (!token || !confirm(lang === "so" ? "Ma hubtaa inaad diido codsigan?" : "Are you sure you want to reject this request?")) return;
    setActionLoading(true);
    setMsg("");
    setErr("");

    try {
      const res = await fetch(`${API_BASE}/onboarding-requests/${id}/reject`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        setMsg(translations[lang].requestRejected);
        await fetchOnboardingRequests();
        await fetchAuditLogs();
      } else {
        const data = await res.json();
        setErr(data.error || "Failed to reject onboarding request");
      }
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErr("");
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/sa/staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(staffFormData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Waa ku guuldareystay abuurista shaqaalaha");
      setMsg(`Si guul leh ayaa loo abuuray shaqaalaha cusub! ID: ${data.staff_id}`);
      setStaffFormData({
        name: "",
        email: "",
        password: "",
        sub_role: "Support",
        shift_start: "",
        shift_end: "",
        allowed_ip: "",
        avatar_url: "",
        is_department_head: false
      });
      fetchSaStaff();
      fetchSaPerformance();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectStaffApplication = async (id: string) => {
    if (!confirm(lang === "so" ? "Ma hubtaa inaad rabto inaad diido codsigan shaqo?" : "Are you sure you want to reject this staff application?")) return;
    setActionLoading(true);
    setErr("");
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/sa/staff-applications/${id}/reject`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject application");
      setMsg(lang === "so" ? "Codsiga shaqo waa la diiday." : "Application rejected successfully.");
      fetchStaffApplications();
      await fetchAuditLogs();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleHireStaffApplication = async (id: string) => {
    setActionLoading(true);
    setErr("");
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/sa/staff-applications/${id}/hire`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to hire application");
      
      setApprovedCreds({
        email: data.staff.email,
        password: data.tempPassword
      });
      setShowCredsModal(true);
      
      setMsg(lang === "so" ? "Si guul leh ayaa loo shaqaaleeyay musharaxa!" : "Candidate hired successfully!");
      fetchStaffApplications();
      fetchSaStaff();
      await fetchAuditLogs();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Ma hubtaa inaad rabto inaad tirtirto shaqaalahan?")) return;
    setActionLoading(true);
    setErr("");
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/sa/staff/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Waa ku guuldareystay tirtirista shaqaalaha");
      setMsg("Shaqaalaha waa la tirtiray si guul leh!");
      fetchSaStaff();
      fetchSaPerformance();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErr("");
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/sa/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(taskFormData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Waa ku guuldareystay abuurista hawsha");
      setMsg("Hawsha si guul leh ayaa loo qoondeeyay!");
      setTaskFormData({ assigned_to: "", title: "", description: "" });
      fetchSaTasks();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Pending" ? "Completed" : "Pending";
    try {
      const res = await fetch(`${API_BASE}/sa/tasks/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchSaTasks();
        fetchSaPerformance();
      }
    } catch (e) {
      console.error("Error updating task:", e);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatUser) return;
    try {
      const res = await fetch(`${API_BASE}/sa/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          receiver_id: activeChatUser,
          message: chatInput.trim()
        })
      });
      if (res.ok) {
        setChatInput("");
        const newMsg = await res.json();
        setSaMessages(prev => [...prev, { ...newMsg, sender_name: user.name }]);
      }
    } catch (e) {
      console.error("Error sending message:", e);
    }
  };

  const handleSignOut = async () => {
    const sessionId = localStorage.getItem("sessionId");
    const storedToken = localStorage.getItem("token");
    if (sessionId && storedToken) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${storedToken}`
          },
          body: JSON.stringify({ sessionId })
        });
      } catch (e) {
        console.error("Error logging out:", e);
      }
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("sessionId");
    router.push("/login");
  };

  const openEditModal = (school: School) => {
    setEditingSchool(school);
    setSchoolFormData({
      name: school.name,
      logo_url: school.logo_url || "",
      description: school.description || "",
      address: school.address,
      phone: school.phone,
      email: school.email,
      max_appointments_per_day: school.max_appointments_per_day,
      max_appointments_per_hour: school.max_appointments_per_hour,
    });
    setSchoolModalOpen(true);
  };

  const openEditPlanModal = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanFormData({
      name: plan.name,
      price: plan.price,
      max_appointments_per_month: plan.max_appointments_per_month
    });
  };

  // SaaS Dynamic Metrics & Charts Data
  const stats = {
    totalSchools: schools.length,
    totalAppointments: allAppointments.length,
    totalWaitlist: allWaitlist.length,
    // Dynamic MRR based on plans price in database
    estimatedMRR: plans.reduce((acc, p) => {
      // plan distribution: count schools modulo plans
      const count = schools.filter((_, idx) => (idx % plans.length) === plans.indexOf(p)).length;
      return acc + (count * parseFloat(p.price || "0"));
    }, 0) || (schools.length * 49) // fallback
  };

  // MRR History Chart (USD)
  const mrrHistoryData = [
    { name: "Jan", MRR: Math.max(0, stats.estimatedMRR * 0.4) },
    { name: "Feb", MRR: Math.max(0, stats.estimatedMRR * 0.55) },
    { name: "Mar", MRR: Math.max(0, stats.estimatedMRR * 0.7) },
    { name: "Apr", MRR: Math.max(0, stats.estimatedMRR * 0.8) },
    { name: "May", MRR: Math.max(0, stats.estimatedMRR * 0.9) },
    { name: "Jun", MRR: stats.estimatedMRR },
  ];

  // Active Plan Pie Chart Data
  const planPieData = plans.map((p, idx) => {
    const count = schools.filter((_, sIdx) => (sIdx % plans.length) === idx).length;
    return {
      name: `${p.name} Plan`,
      value: count || 0
    };
  });

  // Schools signups growth chart data
  const signupData = [
    { name: "Mar", "Schools / Iskuulada": Math.max(0, Math.round(schools.length * 0.5)) },
    { name: "Apr", "Schools / Iskuulada": Math.max(0, Math.round(schools.length * 0.7)) },
    { name: "May", "Schools / Iskuulada": Math.max(0, Math.round(schools.length * 0.85)) },
    { name: "Jun", "Schools / Iskuulada": schools.length },
  ];

  // Filtered Audit Logs
  const filteredLogs = auditLogs.filter(l => 
    l.action.toLowerCase().includes(auditSearch.toLowerCase()) || 
    l.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
    (l.user_name && l.user_name.toLowerCase().includes(auditSearch.toLowerCase())) ||
    (l.user_email && l.user_email.toLowerCase().includes(auditSearch.toLowerCase()))
  );

  const t = translations[lang];

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-sm font-medium text-textSecondary">{lang === "so" ? "Soo dejinta..." : "Loading Platform Controller..."}</p>
        </div>
      </div>
    );
  }

  const isOwner = !user?.sub_role;
  const isSupport = user?.sub_role === "Support";
  const isBilling = user?.sub_role === "Billing";
  const isIT = user?.sub_role === "IT";

  const navGroups = [
    {
      title: lang === "so" ? "Guudmarka" : "Overview",
      items: [
        {
          id: "overview",
          label: t.overview,
          icon: <TrendingUp className="w-4 h-4" />,
          visible: true
        },
        {
          id: "profile",
          label: lang === "so" ? "Profile-kayga" : "My Profile",
          icon: <User className="w-4 h-4" />,
          visible: true
        }
      ]
    },
    {
      title: lang === "so" ? "Maamulka Iskuulada" : "School Management",
      items: [
        {
          id: "schools",
          label: t.schools,
          icon: <Building2 className="w-4 h-4" />,
          badge: schools.length,
          visible: isOwner || isBilling
        },
        {
          id: "pending",
          label: t.pendingRequests,
          icon: <Bell className="w-4 h-4" />,
          badge: pendingRequests.filter(r => r.status === "Pending").length,
          badgeColor: "amber",
          visible: isOwner || isSupport
        },
        {
          id: "admins",
          label: t.admins,
          icon: <UserPlus className="w-4 h-4" />,
          visible: isOwner
        },
        {
          id: "subscriptions",
          label: t.subscriptions,
          icon: <DollarSign className="w-4 h-4" />,
          visible: isOwner || isBilling
        },
        {
          id: "billing",
          label: t.billing,
          icon: <DollarSign className="w-4 h-4" />,
          badge: billingInvoices.length,
          visible: isOwner || isBilling
        }
      ]
    },
    {
      title: lang === "so" ? "Kooxda & Chat-ka" : "Team & Chat",
      items: [
        {
          id: "team",
          label: lang === "so" ? "Maamulista Shaqaalaha" : "Team Management",
          icon: <Briefcase className="w-4 h-4" />,
          visible: isOwner
        },
        {
          id: "support",
          label: t.supportHelp,
          icon: <Users className="w-4 h-4" />,
          badge: tickets.filter(tk => tk.status === "Pending").length,
          badgeColor: "amber",
          visible: isOwner || isSupport
        },
        {
          id: "messages",
          label: lang === "so" ? "Farriimaha Team-ka" : "Team Messages",
          icon: <MessageSquare className="w-4 h-4" />,
          visible: true
        }
      ]
    },
    {
      title: lang === "so" ? "Farsamada & Amniga" : "System & Security",
      items: [
        {
          id: "announcements",
          label: t.announcements,
          icon: <BookOpen className="w-4 h-4" />,
          badge: announcements.length,
          visible: isOwner || isSupport || isIT
        },
        {
          id: "audit",
          label: t.auditLogs,
          icon: <Activity className="w-4 h-4" />,
          visible: isOwner || isIT
        },
        {
          id: "sessions",
          label: lang === "so" ? "Dhaqdhaqaaqa Users-ka" : t.sessions,
          icon: <Users className="w-4 h-4" />,
          visible: isOwner || isIT
        },
        {
          id: "maintenance",
          label: t.maintenance,
          icon: <Settings className="w-4 h-4" />,
          pulse: maintenanceMode,
          visible: isOwner || isIT
        },
        {
          id: "alerts",
          label: t.usageAlertsTab,
          icon: <AlertCircle className="w-4 h-4" />,
          badge: usageAlerts.filter(a => a.percentage >= 85).length,
          badgeColor: "danger",
          visible: isOwner || isBilling
        }
      ]
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col justify-between">
      {/* Top Bar */}
      <header className="glass-panel sticky top-0 z-40 border-b border-border h-16 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SmaLogo className="h-9" />
            <div className="h-6 w-px bg-border hidden sm:block" />
            <span className="text-[11px] text-textSecondary font-bold uppercase tracking-wider hidden sm:inline">SMA - School Appoint</span>
            {user?.sub_role && (
              <span className="px-2.5 py-0.5 text-[9px] bg-primary/10 text-primary border border-primary/20 rounded-full font-bold uppercase tracking-wide">
                {user.sub_role === "Support" ? "Adeegga Macaamiisha" : user.sub_role === "Billing" ? "Maaliyadda & Iibka" : "Farsamada & IT"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setLang(prev => prev === "en" ? "so" : "en")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-textPrimary dark:text-slate-200 hover:text-primary transition-colors border border-border dark:border-slate-700"
            >
              {lang === "en" ? "Somali 🇸🇴" : "English 🇬🇧"}
            </button>
            <button 
              type="button"
              onClick={toggleDarkMode} 
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-textSecondary dark:text-slate-400 hover:text-primary transition-colors"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4" />}
            </button>
            <span className="text-xs text-textSecondary font-semibold hidden md:inline">
              {t.welcome} <span className="text-textPrimary">{user.name}</span>
            </span>
            <button 
              onClick={handleSignOut}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-textSecondary hover:text-danger rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">{t.signOut}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 shrink-0 space-y-1">
          {navGroups.map((group, groupIdx) => {
            const visibleItems = group.items.filter(item => item.visible);
            if (visibleItems.length === 0) return null;
            return (
              <div key={groupIdx} className="space-y-1.5 pb-2">
                <span className="block px-4 pt-3 pb-1 text-[9px] font-extrabold uppercase tracking-wider text-textSecondary/50 dark:text-slate-500/80">
                  {group.title}
                </span>
                {visibleItems.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); setMsg(""); setErr(""); }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === item.id 
                        ? "bg-primary text-white shadow-soft" 
                        : "bg-white border border-border dark:bg-slate-900 dark:border-slate-800 text-textSecondary hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-textPrimary"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon} <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`px-2 py-0.5 text-[9px] rounded-full font-bold ${
                        item.badgeColor === "danger" 
                          ? "bg-danger text-white" 
                          : item.badgeColor === "amber" 
                            ? "bg-amber-500 text-white animate-pulse" 
                            : "bg-slate-100 dark:bg-slate-800 text-textSecondary"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {item.pulse && (
                      <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </aside>

        {/* Workspace Panels */}
        <main className="flex-grow space-y-6">
          {/* Notifications Alerts */}
          {msg && (
            <div className="p-4 bg-accent/10 text-accent border border-accent/20 rounded-xl text-sm flex items-center gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{msg}</span>
            </div>
          )}
          {err && (
            <div className="p-4 bg-danger/10 text-danger border border-danger/20 rounded-xl text-sm flex items-center gap-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{err}</span>
            </div>
          )}

          {/* Tab: profile (Koontada & Diiwaanka Shaqaalaha) */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header */}
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-textPrimary">{lang === "so" ? "Profile-ka Isticmaalaha" : "User Profile & Sessions"}</h2>
                <p className="text-xs text-textSecondary">{lang === "so" ? "Halkan ka eeg xogtaada khaaska ah, saacadaha shift-ga, iyo taariikhda soo-gelitaankaaga." : "View your credentials, shifts, and recent session attendance logs."}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1: Info Card / Digital ID Badge */}
                <div className={`rounded-card p-6 space-y-6 relative overflow-hidden border-2 ${
                  isOwner 
                    ? "bg-slate-900 border-purple-500/50 shadow-[0_0_25px_rgba(139,92,246,0.15)] text-white" 
                    : user.is_department_head 
                      ? "bg-slate-900 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.15)] text-white"
                      : "bg-white border-border dark:bg-slate-900 dark:border-slate-800 text-textPrimary"
                }`}>
                  {/* Rank Header Seal */}
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isOwner 
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                        : user.is_department_head 
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    }`}>
                      {isOwner ? <Crown className="w-5 h-5" /> : user.is_department_head ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[9px] text-textSecondary uppercase tracking-widest">OFFICIAL ID PASS</h4>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isOwner 
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" 
                          : user.is_department_head 
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-slate-100 dark:bg-slate-800 text-textSecondary"
                      }`}>
                        {isOwner ? "Maamulaha Guud" : user.is_department_head ? "Gudoomiye" : "Maamulka / Agent"}
                      </span>
                    </div>
                  </div>

                  {/* Profile Photo / Avatar */}
                  <div className="flex flex-col items-center text-center space-y-3">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.name} 
                        className={`w-20 h-20 rounded-2xl object-contain bg-slate-950 p-1 border ${
                          isOwner ? "border-purple-500/30" : user.is_department_head ? "border-amber-500/30" : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-soft">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-extrabold text-base">{user.name}</h3>
                      <p className="text-[10px] text-textSecondary font-mono">{user.email}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3.5 text-xs pt-2 border-t border-slate-100 dark:border-slate-800/85">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-textSecondary uppercase tracking-wider">ID-ga Nidaamka</span>
                      <span className="font-mono font-bold text-right">{user.staff_id || "OWNER-001"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-textSecondary uppercase tracking-wider">Tixraaca (Serial)</span>
                      <span className="font-mono font-bold text-right">{user.serial_number || (isOwner ? "SMA-OWNER-001" : "N/A")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-textSecondary uppercase tracking-wider">Shift-ga Shaqada</span>
                      <span className="font-semibold text-right">
                        {user.shift_start && user.shift_end ? `${user.shift_start} - ${user.shift_end}` : "24/7 (Open)"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-textSecondary uppercase tracking-wider">Allowed IP</span>
                      <span className="font-mono font-semibold text-right">{user.allowed_ip || "Any IP"}</span>
                    </div>
                  </div>

                  {/* SMA Custom Branded Verification QR Code */}
                  {user.serial_number && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col items-center space-y-2">
                      <span className="text-[9px] font-black text-textSecondary uppercase tracking-widest">SMA Secure Verification</span>
                      
                      {/* Holographic Glowing Frame */}
                      <div className={`p-2 rounded-2xl relative shadow-inner ${
                        isOwner 
                          ? "bg-purple-950/20 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]" 
                          : user.is_department_head 
                            ? "bg-amber-950/20 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                            : "bg-slate-50 dark:bg-slate-950 border border-border dark:border-slate-850"
                      }`}>
                        <div className="relative w-28 h-28 bg-white p-1.5 rounded-xl flex items-center justify-center">
                          <img 
                            src={`https://chart.googleapis.com/chart?chs=120x120&cht=qr&chl=${encodeURIComponent(typeof window !== "undefined" ? `${window.location.origin}/verify/staff/${user.serial_number}` : "")}&choe=UTF-8`}
                            alt="QR Verification"
                            className="w-full h-full object-contain"
                          />
                          {/* Centered SMA Logo overlay */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-slate-950 border-2 border-white rounded-full flex items-center justify-center text-[7px] font-black text-primary select-none">
                            SMA
                          </div>
                        </div>
                      </div>
                      
                      <span className="font-mono text-[9px] text-textSecondary font-bold select-all tracking-wider">
                        {user.serial_number}
                      </span>
                    </div>
                  )}
                </div>

                {/* Column 2 & 3: Sessions & Tasks */}
                <div className="lg:col-span-2 space-y-6">
                  {/* My Tasks */}
                  {!isOwner && (
                    <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-4 dark:bg-slate-900 dark:border-slate-800">
                      <h3 className="font-extrabold text-sm text-textPrimary flex items-center gap-2">
                        <ListTodo className="w-4 h-4 text-primary" />
                        {lang === "so" ? "Hawlaha la ii Qoondeeyay (My Tasks)" : "My Assigned Tasks"}
                      </h3>
                      <div className="space-y-2.5">
                        {saTasks.filter(t => t.assigned_to === user.id).length === 0 ? (
                          <p className="text-xs text-textSecondary italic">{lang === "so" ? "Ma jiraan wax hawlo ah oo laguu xilsaaray hadda." : "No tasks assigned to you currently."}</p>
                        ) : (
                          saTasks.filter(t => t.assigned_to === user.id).map(t => {
                            const isCompleted = t.status === "Completed";
                            return (
                              <div key={t.id} className="p-3 border border-border rounded-xl bg-slate-50 dark:bg-slate-950/40 flex justify-between items-center gap-3">
                                <div className="space-y-0.5">
                                  <h4 className={`font-bold text-xs text-textPrimary ${isCompleted ? "line-through opacity-50" : ""}`}>{t.title}</h4>
                                  <p className="text-[10px] text-textSecondary">{t.description}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateTaskStatus(t.id, t.status)}
                                  className={`p-1 rounded-lg border transition-all ${
                                    isCompleted 
                                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                      : "bg-white border-border text-textSecondary hover:bg-slate-100 dark:bg-slate-900"
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Attendance Log */}
                  <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-4 dark:bg-slate-900 dark:border-slate-800">
                    <h3 className="font-extrabold text-sm text-textPrimary flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      {lang === "so" ? "Diiwaanka Soo-gelitaankaaga (Attendance Logs)" : "Your Attendance History"}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border dark:border-slate-800 text-[9px] text-textSecondary uppercase tracking-wider font-bold">
                            <th className="pb-2">Login Time</th>
                            <th className="pb-2">Logout Time</th>
                            <th className="pb-2">Duration</th>
                            <th className="pb-2">IP Address</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-slate-800 text-xs">
                          {userSessions.filter(s => s.user_id === user.id).length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-4 text-center text-textSecondary font-medium">No login sessions recorded yet.</td>
                            </tr>
                          ) : (
                            userSessions.filter(s => s.user_id === user.id).slice(0, 10).map((sess, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850/40">
                                <td className="py-2.5 font-medium text-textPrimary">{new Date(sess.login_time).toLocaleString()}</td>
                                <td className="py-2.5 text-textSecondary">
                                  {sess.logout_time ? new Date(sess.logout_time).toLocaleString() : <span className="text-emerald-500 font-bold">Active Now</span>}
                                </td>
                                <td className="py-2.5 font-bold text-textPrimary">
                                  {sess.duration_minutes !== null ? `${sess.duration_minutes} min` : "--"}
                                </td>
                                <td className="py-2.5 font-mono text-[10px] text-textSecondary">{sess.ip_address}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 1: Overview Dashboard */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-border rounded-xl p-5 shadow-soft dark:bg-slate-900 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block mb-2">{t.totalTenants}</span>
                  <div className="text-3xl font-extrabold text-primary flex items-center gap-1.5">
                    <Building2 className="w-6 h-6 text-primary/70 shrink-0" />
                    <span>{stats.totalSchools}</span>
                  </div>
                </div>

                <div className="bg-white border border-border rounded-xl p-5 shadow-soft dark:bg-slate-900 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block mb-2">{t.totalBookings}</span>
                  <div className="text-3xl font-extrabold text-accent flex items-center gap-1.5">
                    <Calendar className="w-6 h-6 text-accent/70 shrink-0" />
                    <span>{stats.totalAppointments}</span>
                  </div>
                </div>

                <div className="bg-white border border-border rounded-xl p-5 shadow-soft dark:bg-slate-900 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block mb-2">{t.totalWaitlist}</span>
                  <div className="text-3xl font-extrabold text-warning flex items-center gap-1.5">
                    <Users className="w-6 h-6 text-warning/70 shrink-0" />
                    <span>{stats.totalWaitlist}</span>
                  </div>
                </div>

                <div className="bg-white border border-border rounded-xl p-5 shadow-soft dark:bg-slate-900 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block mb-2">{t.mrr}</span>
                  <div className="text-3xl font-extrabold text-emerald-500 flex items-center gap-1.5">
                    <DollarSign className="w-6 h-6 text-emerald-500/70 shrink-0" />
                    <span>${stats.estimatedMRR}</span>
                  </div>
                </div>
              </div>

              {/* Tab Navigation Segment Toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl max-w-lg border border-border dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setOverviewSubTab("schools")}
                  className={`flex-grow py-2.5 px-5 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                    overviewSubTab === "schools"
                      ? "bg-white dark:bg-slate-900 text-primary shadow-soft border border-border dark:border-slate-800"
                      : "text-textSecondary hover:text-textPrimary"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Iskuulada & Dakhliga (Schools & Billing)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOverviewSubTab("team")}
                  className={`flex-grow py-2.5 px-5 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                    overviewSubTab === "team"
                      ? "bg-white dark:bg-slate-900 text-primary shadow-soft border border-border dark:border-slate-800"
                      : "text-textSecondary hover:text-textPrimary"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Waxqabadka Shaqaalaha (Staff KPI Charts)</span>
                </button>
              </div>

              {/* Charts Section: Schools & Billing */}
              {overviewSubTab === "schools" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                  {/* MRR Growth Chart */}
                  <div className="bg-white border border-border rounded-card p-6 shadow-soft dark:bg-slate-900 dark:border-slate-800">
                    <h3 className="font-extrabold text-sm text-textPrimary mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" /> {t.mrrGrowth}
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mrrHistoryData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="MRR" stroke="#0f4c81" strokeWidth={3} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Plan Distribution Chart */}
                  <div className="bg-white border border-border rounded-card p-6 shadow-soft dark:bg-slate-900 dark:border-slate-800">
                    <h3 className="font-extrabold text-sm text-textPrimary mb-4 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-accent" /> {t.planDistribution}
                    </h3>
                    <div className="h-64 flex flex-col md:flex-row items-center justify-between">
                      <div className="w-full md:w-3/5 h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={planPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {planPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full md:w-2/5 flex flex-col gap-2.5 pl-4">
                        {planPieData.map((entry, index) => (
                          <div key={entry.name} className="flex items-center gap-2 text-xs">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                            <span className="font-bold text-textPrimary">{entry.name}:</span>
                            <span className="text-textSecondary">{entry.value} school(s)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* School Signups Chart */}
                  <div className="bg-white border border-border rounded-card p-6 shadow-soft dark:bg-slate-900 dark:border-slate-800 lg:col-span-2">
                    <h3 className="font-extrabold text-sm text-textPrimary mb-4 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" /> {t.newSignups}
                    </h3>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={signupData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Bar dataKey="Schools / Iskuulada" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Charts Section: Staff & Team Performance */}
              {overviewSubTab === "team" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                  {/* Onboarding Approvals Chart */}
                  <div className="bg-white border border-border rounded-card p-6 shadow-soft dark:bg-slate-900 dark:border-slate-800">
                    <h3 className="font-extrabold text-sm text-textPrimary mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-4.5 h-4.5 text-primary" /> Onboarding Approvals (Saxeexyada Iskuulada)
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={saStaff.map(st => {
                          const perf = saPerformance?.approvals?.find((p: any) => p.user_id === st.id);
                          return {
                            name: st.name.split(" ")[0],
                            "Approvals": perf ? parseInt(perf.count) : 0
                          };
                        })}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Bar dataKey="Approvals" fill="#0f4c81" radius={[4, 4, 0, 0]} barSize={35} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Resolved Support Tickets Chart */}
                  <div className="bg-white border border-border rounded-card p-6 shadow-soft dark:bg-slate-900 dark:border-slate-800">
                    <h3 className="font-extrabold text-sm text-textPrimary mb-4 flex items-center gap-2">
                      <MessageSquare className="w-4.5 h-4.5 text-emerald-500" /> Resolved Support Tickets (Cabashooyinka la Xaliyey)
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={saStaff.map(st => {
                          const perf = saPerformance?.supportReplies?.find((p: any) => p.user_id === st.id);
                          return {
                            name: st.name.split(" ")[0],
                            "Resolved Tickets": perf ? parseInt(perf.count) : 0
                          };
                        })}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Bar dataKey="Resolved Tickets" fill="#10b981" radius={[4, 4, 0, 0]} barSize={35} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Session Work Hours Chart */}
                  <div className="bg-white border border-border rounded-card p-6 shadow-soft dark:bg-slate-900 dark:border-slate-800 lg:col-span-2">
                    <h3 className="font-extrabold text-sm text-textPrimary mb-4 flex items-center gap-2">
                      <Clock className="w-4.5 h-4.5 text-warning" /> Total Session Work Duration (Saacadaha Shaqada ee live-ka ah)
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={saStaff.map(st => {
                          const perf = saPerformance?.sessionTime?.find((p: any) => p.user_id === st.id);
                          const hours = perf ? Math.round((parseInt(perf.total_minutes) / 60) * 10) / 10 : 0;
                          return {
                            name: st.name.split(" ")[0],
                            "Work Hours (Saacadood)": hours
                          };
                        })}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Bar dataKey="Work Hours (Saacadood)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Console Info */}
              <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-4 dark:bg-slate-900 dark:border-slate-800">
                <h3 className="font-extrabold text-base border-b border-border pb-3 dark:border-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" /> {t.platformControl}
                </h3>
                <p className="text-sm text-textSecondary leading-relaxed">
                  {t.welcomeMsg}
                </p>
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-xs text-primary font-medium flex items-center gap-2 dark:bg-primary-950/20 dark:border-primary-900/30">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <span>{t.privilegeMsg}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Manage Schools */}
          {activeTab === "schools" && (
            <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-6 animate-fadeIn dark:bg-slate-900 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-extrabold text-textPrimary">{t.schools}</h2>
                <button 
                  onClick={() => {
                    setEditingSchool(null);
                    setSchoolFormData({
                      name: "",
                      logo_url: "",
                      description: "",
                      address: "",
                      phone: "",
                      email: "",
                      max_appointments_per_day: 50,
                      max_appointments_per_hour: 5,
                    });
                    setSchoolModalOpen(true);
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> {t.addSchool}
                </button>
              </div>

              {/* School Creation/Edit Form */}
              {schoolModalOpen && (
                <form onSubmit={handleSchoolSubmit} className="p-5 bg-slate-50 border border-border rounded-xl space-y-4 dark:bg-slate-950 dark:border-slate-800 animate-fadeIn">
                  <h3 className="font-extrabold text-sm text-primary">{editingSchool ? t.editSchool : t.createSchool}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-textPrimary">{t.fullName}</label>
                      <input 
                        type="text" 
                        required
                        value={schoolFormData.name}
                        onChange={(e) => setSchoolFormData({ ...schoolFormData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-textPrimary">{t.logoUrl}</label>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-850 border border-border dark:border-slate-800 rounded-xl">
                        <div className="w-12 h-12 rounded-xl border border-border dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 bg-white dark:bg-slate-900">
                          {schoolFormData.logo_url ? (
                            <img src={schoolFormData.logo_url} alt="School Logo" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-xs font-extrabold uppercase" style={{
                              background: `linear-gradient(135deg, ${getRandomColor(schoolFormData.name || "S")})`
                            }}>
                              {getInitials(schoolFormData.name || "S")}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex gap-2">
                            <label className="px-2.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors shadow-sm">
                              Soo Geli / Upload
                              <input 
                                type="file" 
                                accept="image/*"
                                className="hidden" 
                                onChange={(e) => handleLogoUpload(e, (base64) => setSchoolFormData({ ...schoolFormData, logo_url: base64 }))} 
                              />
                            </label>
                            {schoolFormData.logo_url && (
                              <button
                                type="button"
                                onClick={() => setSchoolFormData({ ...schoolFormData, logo_url: "" })}
                                className="px-2.5 py-1.5 bg-danger/10 hover:bg-danger text-danger hover:text-white text-[10px] font-bold rounded-lg transition-colors border border-danger/20"
                              >
                                Tirtir / Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-textPrimary">{t.address}</label>
                      <input 
                        type="text" 
                        required
                        value={schoolFormData.address}
                        onChange={(e) => setSchoolFormData({ ...schoolFormData, address: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-textPrimary">{t.phone}</label>
                      <input 
                        type="text" 
                        required
                        value={schoolFormData.phone}
                        onChange={(e) => setSchoolFormData({ ...schoolFormData, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-textPrimary">{t.email}</label>
                      <input 
                        type="email" 
                        required
                        value={schoolFormData.email}
                        onChange={(e) => setSchoolFormData({ ...schoolFormData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-textPrimary">{t.maxDaily}</label>
                      <input 
                        type="number" 
                        value={schoolFormData.max_appointments_per_day}
                        onChange={(e) => setSchoolFormData({ ...schoolFormData, max_appointments_per_day: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-textPrimary">{t.maxHourly}</label>
                      <input 
                        type="number" 
                        value={schoolFormData.max_appointments_per_hour}
                        onChange={(e) => setSchoolFormData({ ...schoolFormData, max_appointments_per_hour: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-textPrimary">{t.desc}</label>
                    <textarea 
                      value={schoolFormData.description}
                      onChange={(e) => setSchoolFormData({ ...schoolFormData, description: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none resize-none"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button 
                      type="button"
                      onClick={() => {
                        setSchoolModalOpen(false);
                        setEditingSchool(null);
                      }}
                      className="px-4 py-2 bg-white text-textPrimary border border-border font-bold text-xs rounded-lg hover:bg-slate-100 transition-colors dark:bg-slate-900"
                    >
                      {t.cancel}
                    </button>
                    <button 
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-lg hover:bg-primary/95 transition-colors flex items-center justify-center min-w-[100px]"
                    >
                      {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : t.saveTenant}
                    </button>
                  </div>
                </form>
              )}

              {/* Schools Table */}
              <div className="overflow-x-auto border border-border rounded-xl dark:border-slate-800">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border text-xs font-bold text-textSecondary uppercase tracking-wider dark:bg-slate-950 dark:border-slate-800">
                      <th className="p-4">Logo</th>
                      <th className="p-4">{t.schoolDetails}</th>
                      <th className="p-4">{t.contactInfo}</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-slate-800">
                    {schools.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-textSecondary font-medium">
                          {t.noSchools}
                        </td>
                      </tr>
                    ) : (
                      schools.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-850/20">
                          <td className="p-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-border flex items-center justify-center font-bold text-primary text-xs overflow-hidden shrink-0 dark:bg-slate-800 dark:border-slate-700">
                              {s.logo_url ? (
                                <img src={s.logo_url} alt={s.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-extrabold uppercase tracking-wider" style={{
                                  background: `linear-gradient(135deg, ${getRandomColor(s.name)})`
                                }}>
                                  {getInitials(s.name)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-textPrimary">{s.name}</div>
                            <div className="text-xs text-textSecondary">{s.address}</div>
                          </td>
                          <td className="p-4 text-xs text-textSecondary">
                            <div>{t.phone}: {s.phone}</div>
                            <div>{t.email}: {s.email}</div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              s.admission_status === "Open" ? "bg-accent/15 text-accent" : "bg-danger/15 text-danger"
                            }`}>
                              {s.admission_status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button 
                                onClick={() => openEditModal(s)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-textSecondary hover:text-textPrimary rounded transition-all dark:bg-slate-800 dark:hover:bg-slate-750"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteSchool(s.id)}
                                className="p-1.5 bg-danger/15 hover:bg-danger text-danger hover:text-white rounded transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Pending Onboarding Requests (REAL) */}
          {activeTab === "pending" && (
            <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-4 animate-fadeIn dark:bg-slate-900 dark:border-slate-800">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-textPrimary">{t.pendingTitle}</h2>
                <p className="text-xs text-textSecondary">
                  {t.pendingSub}
                </p>
              </div>

              <div className="space-y-4">
                {pendingRequests.filter(r => r.status === "Pending").length === 0 ? (
                  <div className="p-8 text-center text-textSecondary border border-dashed border-border rounded-xl font-semibold dark:border-slate-800">
                    <Check className="w-8 h-8 text-accent mx-auto mb-2" />
                    <span>{t.noPending}</span>
                  </div>
                ) : (
                  pendingRequests.filter(r => r.status === "Pending").map(r => (
                    <div key={r.id} className="p-5 border border-border rounded-xl bg-slate-50 dark:bg-slate-950 dark:border-slate-800 space-y-3 flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div className="space-y-1 w-full md:w-3/4">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-textPrimary">{r.name}</h4>
                          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-textSecondary px-2 py-0.5 rounded-full font-bold">{r.created_at ? r.created_at.split("T")[0] : ""}</span>
                        </div>
                        <p className="text-xs text-textSecondary">{r.description}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 pt-2 text-[11px] text-textSecondary">
                          <div><span className="font-bold">{t.email}:</span> {r.email}</div>
                          <div><span className="font-bold">{t.phone}:</span> {r.phone}</div>
                          <div><span className="font-bold">{t.address}:</span> {r.address}</div>
                        </div>
                      </div>

                      <div className="flex gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 shrink-0">
                        <button 
                          onClick={() => handleRejectRequest(r.id)}
                          className="px-3 py-1.5 border border-danger/20 text-danger bg-danger/5 hover:bg-danger hover:text-white rounded-lg text-xs font-bold transition-all"
                        >
                          {t.reject}
                        </button>
                        <button 
                          onClick={() => handleApproveRequest(r)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-primary text-white hover:bg-primary/90 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" /> {t.approveAndSetup}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Register Admin Accounts */}
          {activeTab === "admins" && (
            <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-6 animate-fadeIn dark:bg-slate-900 dark:border-slate-800">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-textPrimary">{t.admins}</h2>
                <p className="text-xs text-textSecondary">
                  Create Login Accounts for Onboarded School Clients.
                </p>
              </div>

              <form onSubmit={handleAdminSubmit} className="max-w-xl space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-textPrimary">{t.fullName}</label>
                  <input 
                    type="text" 
                    required
                    value={adminFormData.name}
                    onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                    placeholder="Headmaster / Admin Name"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-textPrimary">{t.email}</label>
                    <input 
                      type="email" 
                      required
                      value={adminFormData.email}
                      onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                      placeholder="admin@school.com"
                      className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-textPrimary">{t.password}</label>
                    <input 
                      type="password" 
                      required
                      value={adminFormData.password}
                      onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-textPrimary">{t.assignedSchool}</label>
                    <select 
                      required={adminFormData.role === "Admin"}
                      value={adminFormData.school_id}
                      onChange={(e) => setAdminFormData({ ...adminFormData, school_id: e.target.value })}
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none"
                    >
                      <option value="">{t.selectSchool}</option>
                      {schools.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-textPrimary">{t.role}</label>
                    <select 
                      value={adminFormData.role}
                      onChange={(e) => setAdminFormData({ ...adminFormData, role: e.target.value })}
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none"
                    >
                      <option value="Admin">School Admin</option>
                      <option value="SuperAdmin">Super Admin</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-3 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary/95 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center min-w-[150px]"
                  >
                    {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : t.admins}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 5: Manage Subscriptions & Plan configurations (REAL DB UPDATE) */}
          {activeTab === "subscriptions" && (
            <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-6 animate-fadeIn dark:bg-slate-900 dark:border-slate-800">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-textPrimary">{t.subscriptions}</h2>
                <p className="text-xs text-textSecondary">
                  Upgrade plans or configure limits for each SaaS tier.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Upgrade */}
                <form onSubmit={handleSubSubmit} className="space-y-4 border border-border p-5 rounded-xl bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
                  <h3 className="font-bold text-sm text-primary">{t.assignSaaS}</h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-textPrimary">{t.selectSchool}</label>
                    <select 
                      required
                      value={subFormData.school_id}
                      onChange={(e) => setSubFormData({ ...subFormData, school_id: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none"
                    >
                      <option value="">{t.chooseSchool}</option>
                      {schools.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-textPrimary">{t.subscriptions}</label>
                      <select 
                        required
                        value={subFormData.plan_id}
                        onChange={(e) => setSubFormData({ ...subFormData, plan_id: e.target.value })}
                        className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none"
                      >
                        <option value="">{t.choosePlan}</option>
                        {plans.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-textPrimary">{t.duration}</label>
                      <select 
                        value={subFormData.duration_months}
                        onChange={(e) => setSubFormData({ ...subFormData, duration_months: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none"
                      >
                        <option value={1}>1 Month</option>
                        <option value={6}>6 Months</option>
                        <option value={12}>12 Months</option>
                        <option value={24}>24 Months</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button 
                      type="submit"
                      disabled={actionLoading}
                      className="px-6 py-2.5 bg-primary text-white font-semibold text-xs rounded-lg hover:bg-primary/95 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center min-w-[150px]"
                    >
                      {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : t.saveUpgrade}
                    </button>
                  </div>
                </form>

                {/* Plan Rules Configurator Panel */}
                <div className="space-y-4 border border-border p-5 rounded-xl bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
                  <h3 className="font-bold text-sm text-primary flex items-center gap-1.5">
                    <Settings className="w-4 h-4" /> {t.plansConfigTitle}
                  </h3>
                  <p className="text-xs text-textSecondary">{t.plansConfigSub}</p>

                  {/* Plan list with edit action */}
                  <div className="space-y-3">
                    {plans.map(p => (
                      <div key={p.id} className="p-3 border border-border bg-white dark:bg-slate-900 rounded-lg flex justify-between items-center shadow-soft">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-xs text-primary">{p.name} Tier</span>
                          <div className="text-[11px] text-textSecondary">${p.price}/mo • max {p.max_appointments_per_month} {t.bookingsMonth}</div>
                        </div>
                        <button 
                          onClick={() => openEditPlanModal(p)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-textSecondary hover:text-textPrimary rounded text-[10px] font-bold transition-all dark:bg-slate-800"
                        >
                          {t.editPlanRules}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editing Plan Modal Form */}
              {editingPlan && (
                <form onSubmit={handlePlanSubmit} className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-4 animate-fadeIn">
                  <h3 className="font-extrabold text-sm text-amber-500">{t.editPlanRules}: {editingPlan.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-textPrimary">{t.priceMonth}</label>
                      <input 
                        type="text" 
                        required
                        value={planFormData.price}
                        onChange={(e) => setPlanFormData({ ...planFormData, price: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-textPrimary">Max Bookings / Month</label>
                      <input 
                        type="number" 
                        required
                        value={planFormData.max_appointments_per_month}
                        onChange={(e) => setPlanFormData({ ...planFormData, max_appointments_per_month: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button 
                      type="button"
                      onClick={() => setEditingPlan(null)}
                      className="px-4 py-1.5 bg-white text-textPrimary border border-border font-bold text-[11px] rounded-lg dark:bg-slate-900"
                    >
                      {t.cancel}
                    </button>
                    <button 
                      type="submit"
                      disabled={actionLoading}
                      className="px-4 py-1.5 bg-amber-500 text-white font-bold text-[11px] rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center min-w-[80px]"
                    >
                      {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : t.savePlan}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Tab 6: System-wide Announcements (REAL) */}
          {activeTab === "announcements" && (
            <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-6 animate-fadeIn dark:bg-slate-900 dark:border-slate-800">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-textPrimary">{t.announcements}</h2>
                <p className="text-xs text-textSecondary">
                  Publish system updates or alerts visible to all school administrators.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form to Draft */}
                <form onSubmit={handleAnnouncementSubmit} className="lg:col-span-1 border border-border p-5 rounded-xl bg-slate-50 dark:bg-slate-950 dark:border-slate-800 space-y-4">
                  <h3 className="font-extrabold text-sm text-primary">{t.broadcastTitle}</h3>
                  
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-textPrimary">{t.broadcastSubject}</label>
                    <input 
                      type="text" 
                      required
                      value={announcementFormData.title}
                      onChange={(e) => setAnnouncementFormData({ ...announcementFormData, title: e.target.value })}
                      placeholder="e.g. Schedule Updates"
                      className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-textPrimary">{t.broadcastType}</label>
                    <select
                      value={announcementFormData.type}
                      onChange={(e) => setAnnouncementFormData({ ...announcementFormData, type: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none"
                    >
                      <option value="Info">{t.announcementType.Info}</option>
                      <option value="Warning">{t.announcementType.Warning}</option>
                      <option value="Update">{t.announcementType.Update}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-textPrimary">{t.details}</label>
                    <textarea 
                      required
                      value={announcementFormData.content}
                      onChange={(e) => setAnnouncementFormData({ ...announcementFormData, content: e.target.value })}
                      placeholder={t.broadcastPlaceholder}
                      className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none resize-none"
                      rows={4}
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2.5 bg-primary text-white font-bold text-xs rounded-lg hover:bg-primary/95 transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-4 h-4" /> {t.broadcastBtn}</>}
                  </button>
                </form>

                {/* History List */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-textSecondary">{t.broadcastHistory}</h3>
                  
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {announcements.length === 0 ? (
                      <div className="p-8 text-center text-textSecondary border border-dashed border-border rounded-xl font-medium dark:border-slate-800">
                        No announcements broadcasted yet.
                      </div>
                    ) : (
                      announcements.map(ann => (
                        <div 
                          key={ann.id} 
                          className={`p-4 border rounded-xl shadow-soft space-y-2 bg-white dark:bg-slate-900 relative group ${
                            ann.type === "Warning" 
                              ? "border-danger/20 bg-danger/5" 
                              : ann.type === "Update" 
                              ? "border-emerald-500/20 bg-emerald-500/5" 
                              : "border-border"
                          }`}
                        >
                          <button 
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            className="absolute top-4 right-4 text-textSecondary hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-100 dark:bg-slate-800 rounded"
                            title="Delete Announcement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                ann.type === "Warning" 
                                  ? "bg-danger/20 text-danger" 
                                  : ann.type === "Update" 
                                  ? "bg-emerald-500/20 text-emerald-600" 
                                  : "bg-primary/10 text-primary"
                              }`}>
                                {t.announcementType[ann.type]}
                              </span>
                              <h4 className="font-extrabold text-sm text-textPrimary pr-6">{ann.title}</h4>
                            </div>
                            <span className="text-[10px] text-textSecondary font-medium">{ann.created_at ? ann.created_at.split("T")[0] : ""}</span>
                          </div>
                          <p className="text-xs text-textSecondary leading-relaxed">{ann.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 7: System Audit Logs (REAL DATABASE LOGS) */}
          {activeTab === "audit" && (
            <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-4 animate-fadeIn dark:bg-slate-900 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold text-textPrimary">{t.auditTitle}</h2>
                  <p className="text-xs text-textSecondary">{t.auditSub}</p>
                </div>
                {/* Search field */}
                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary">
                    <Search className="w-4 h-4" />
                  </span>
                  <input 
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder={t.searchLogs}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-border rounded-lg text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Logs Feed */}
              <div className="overflow-x-auto border border-border rounded-xl dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border text-[10px] font-bold text-textSecondary uppercase tracking-wider dark:bg-slate-950 dark:border-slate-800">
                      <th className="p-3.5 w-28">{t.time}</th>
                      <th className="p-3.5 w-48">{t.user}</th>
                      <th className="p-3.5 w-48">{t.action}</th>
                      <th className="p-3.5">{t.details}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-slate-800 font-mono">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-textSecondary font-medium font-sans">
                          No audit entries found in DB.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-850/20">
                          <td className="p-3.5 text-textSecondary text-[10px]">
                            {log.created_at ? new Date(log.created_at).toLocaleString() : ""}
                          </td>
                          <td className="p-3.5 text-textPrimary font-bold text-[10px]">
                            {log.user_name ? `${log.user_name} (${log.user_email})` : "Anonymous / System"}
                          </td>
                          <td className="p-3.5 text-primary dark:text-sky-400 font-bold text-[10px]">{log.action}</td>
                          <td className="p-3.5 text-textSecondary font-sans text-[11px]">{log.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 8: Users & Active Sessions Tracking */}
          {activeTab === "sessions" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Part A: Active Login Sessions */}
              <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-4 dark:bg-slate-900 dark:border-slate-800">
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold text-textPrimary">
                    {lang === "so" ? "Dhaqdhaqaaqa iyo Kulammada Isticmaalayaasha" : "Active Sessions & User Activity"}
                  </h2>
                  <p className="text-xs text-textSecondary">
                    {lang === "so"
                      ? "Kormeer waqtiga dhabta ah ee isticmaalayaasha ku jira nidaamka iyo inta ay shaqaynayeen."
                      : "Live tracking of active user sessions, login times, and work duration."}
                  </p>
                </div>

                <div className="overflow-x-auto border border-border rounded-xl dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-border text-[10px] font-bold text-textSecondary uppercase tracking-wider dark:bg-slate-950 dark:border-slate-800">
                        <th className="p-3.5">{lang === "so" ? "Isticmaalaha" : "User"}</th>
                        <th className="p-3.5">{lang === "so" ? "Xilka" : "Role"}</th>
                        <th className="p-3.5">{lang === "so" ? "Iskuulka" : "School"}</th>
                        <th className="p-3.5">{lang === "so" ? "Waqtiga Galka" : "Login Time"}</th>
                        <th className="p-3.5">{lang === "so" ? "Dhaqdhaqaaqii U Dambeeyay" : "Last Active"}</th>
                        <th className="p-3.5">{lang === "so" ? "Muddada Active" : "Duration"}</th>
                        <th className="p-3.5">{lang === "so" ? "Xaalada" : "Status"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border dark:divide-slate-800 font-sans">
                      {userSessions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-textSecondary font-medium">
                            No login sessions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        userSessions.map((session) => {
                          const isOnline = (new Date().getTime() - new Date(session.last_active_time).getTime()) < 120000;
                          return (
                            <tr key={session.id} className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-850/20">
                              <td className="p-3.5">
                                <div className="font-bold text-textPrimary">{session.user_name}</div>
                                <div className="text-[10px] text-textSecondary">{session.user_email}</div>
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  session.user_role === "SuperAdmin" 
                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                                    : session.user_role === "Scanner"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                    : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                                }`}>
                                  {session.user_role}
                                </span>
                              </td>
                              <td className="p-3.5 font-medium text-textPrimary">{session.school_name || "System Admin"}</td>
                              <td className="p-3.5 text-textSecondary text-[10px]">
                                {session.login_time ? new Date(session.login_time).toLocaleString() : ""}
                              </td>
                              <td className="p-3.5 text-textSecondary text-[10px]">
                                {session.last_active_time ? new Date(session.last_active_time).toLocaleString() : ""}
                              </td>
                              <td className="p-3.5 font-bold text-primary dark:text-sky-400">
                                {session.duration_minutes <= 1 ? "1 min" : `${session.duration_minutes} mins`}
                              </td>
                              <td className="p-3.5">
                                {isOnline ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                    Online
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                    Offline
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Part B: All Registered Users */}
              <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-4 dark:bg-slate-900 dark:border-slate-800">
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold text-textPrimary">
                    {lang === "so" ? "Dhammaan Isticmaalayaasha Nidaamka" : "Registered System Accounts"}
                  </h2>
                  <p className="text-xs text-textSecondary">
                    {lang === "so"
                      ? "Liiska dhammaan maamulayaasha iskuulada iyo shaqaalaha loo sameeyay akoonada."
                      : "A complete list of all school administrators and scanner operators."}
                  </p>
                </div>

                <div className="overflow-x-auto border border-border rounded-xl dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-border text-[10px] font-bold text-textSecondary uppercase tracking-wider dark:bg-slate-950 dark:border-slate-800">
                        <th className="p-3.5">{lang === "so" ? "Magaca" : "Name"}</th>
                        <th className="p-3.5">Email</th>
                        <th className="p-3.5">{lang === "so" ? "Xilka" : "Role"}</th>
                        <th className="p-3.5">{lang === "so" ? "Iskuulka ku xiran" : "Assigned Tenant"}</th>
                        <th className="p-3.5">{lang === "so" ? "Taariikhda la abuuray" : "Created At"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border dark:divide-slate-800 font-sans">
                      {systemUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-textSecondary font-medium">
                            No registered users found.
                          </td>
                        </tr>
                      ) : (
                        systemUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-850/20">
                            <td className="p-3.5 font-bold text-textPrimary">{u.name}</td>
                            <td className="p-3.5 font-medium text-textSecondary">{u.email}</td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                u.role === "SuperAdmin" 
                                  ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                                  : u.role === "Scanner"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3.5 font-medium text-textPrimary">{u.school_name || "System Owner (SaaS)"}</td>
                            <td className="p-3.5 text-textSecondary text-[10px]">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString() : ""}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab: billing */}
          {activeTab === "billing" && (
            <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-6 animate-fadeIn dark:bg-slate-900 dark:border-slate-800">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-textPrimary">{t.billing}</h2>
                <p className="text-xs text-textSecondary">
                  {lang === "so" ? "Kormeer taariikhda biilasha iyo qaansheegadka rukunada." : "Monitor billing transactions and download invoices."}
                </p>
              </div>

              <div className="overflow-x-auto border border-border rounded-xl dark:border-slate-800">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border text-xs font-bold text-textSecondary uppercase tracking-wider dark:bg-slate-950 dark:border-slate-800">
                      <th className="p-4">{t.schoolDetails}</th>
                      <th className="p-4">Plan</th>
                      <th className="p-4">{t.amountPaid}</th>
                      <th className="p-4">{t.invoiceDate}</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">{t.action}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-slate-800">
                    {billingInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-textSecondary font-medium">
                          {t.noInvoices}
                        </td>
                      </tr>
                    ) : (
                      billingInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-850/20">
                          <td className="p-4 font-bold text-textPrimary">{inv.school_name}</td>
                          <td className="p-4 text-xs font-semibold text-primary">{inv.plan_name}</td>
                          <td className="p-4 text-sm font-bold text-emerald-500">${inv.amount}</td>
                          <td className="p-4 text-xs text-textSecondary">{new Date(inv.billing_date).toLocaleString()}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                              {inv.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => generatePDFInvoice(inv)}
                              className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded text-[10px] font-bold transition-all flex items-center gap-1.5 ml-auto border border-primary/20"
                            >
                              <DollarSign className="w-3 h-3" /> {t.downloadInvoice}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: maintenance */}
          {activeTab === "maintenance" && (
            <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-6 animate-fadeIn dark:bg-slate-900 dark:border-slate-800">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-textPrimary">{t.maintenance}</h2>
                <p className="text-xs text-textSecondary">{t.maintenanceDesc}</p>
              </div>

              <div className={`p-5 rounded-2xl border ${
                maintenanceMode 
                  ? "bg-danger/10 border-danger/20 text-danger" 
                  : "bg-slate-50 border-border text-textSecondary dark:bg-slate-950 dark:border-slate-800"
              } space-y-4`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider block">{t.maintenanceStatus}</span>
                    <h3 className="text-lg font-extrabold flex items-center gap-2">
                      <Settings className={`w-5 h-5 ${maintenanceMode ? "animate-spin" : ""}`} />
                      {maintenanceMode ? t.maintenanceActive : t.maintenanceInactive}
                    </h3>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleToggleMaintenanceMode(!maintenanceMode)}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                        maintenanceMode 
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                          : "bg-danger hover:bg-danger/90 text-white"
                      }`}
                    >
                      {maintenanceMode ? t.turnOff : t.turnOn}
                    </button>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-textSecondary">
                  {t.maintenanceWarning}
                </p>
              </div>

              {/* Uploader Card */}
              <div className="bg-white border border-border rounded-card shadow-soft p-5 space-y-4 dark:bg-slate-950 dark:border-slate-800">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-textPrimary">Saxiixa Rasmiga ah (Authorized Signature)</h3>
                  <p className="text-xs text-textSecondary">Ku dar saxiixaaga rasmiga ah (sawir ahaan) si loogu dul daabaco qaansheegadyada Super Admin-ka.</p>
                </div>
                
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="border border-border dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-900 w-48 h-20 flex items-center justify-center relative overflow-hidden">
                    {superAdminSignature ? (
                      <img src={superAdminSignature} alt="Saxiixa Super Admin" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-textSecondary italic">Saxiix laguma darin</span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <input 
                      type="file" 
                      id="signature-upload" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleSignatureUpload}
                    />
                    <label 
                      htmlFor="signature-upload"
                      className="px-4 py-2 bg-accent text-white font-bold text-xs rounded-lg cursor-pointer hover:bg-emerald-600 transition-colors inline-block"
                    >
                      Soo Geli Saxiix (Image)
                    </label>
                    {superAdminSignature && (
                      <button
                        onClick={() => {
                          setSuperAdminSignature(null);
                          localStorage.removeItem("superadmin_signature");
                        }}
                        className="px-4 py-2 bg-danger/10 text-danger hover:bg-danger/20 font-bold text-xs rounded-lg transition-colors ml-2"
                      >
                        Tirtir
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Tab: alerts */}
          {activeTab === "alerts" && (
            <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-6 animate-fadeIn dark:bg-slate-900 dark:border-slate-800">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-textPrimary">{t.usageAlertsTab}</h2>
                <p className="text-xs text-textSecondary">{t.usageAlertsDesc}</p>
              </div>

              <div className="space-y-4">
                {usageAlerts.length === 0 ? (
                  <div className="p-8 text-center text-textSecondary border border-dashed border-border rounded-xl font-medium dark:border-slate-800">
                    No active school subscription data found.
                  </div>
                ) : (
                  usageAlerts.map((schoolUsage) => {
                    const isExceeded = schoolUsage.percentage >= 85;
                    return (
                      <div 
                        key={schoolUsage.school_id} 
                        className={`p-5 border rounded-2xl bg-slate-50 dark:bg-slate-950 dark:border-slate-800 space-y-3 flex flex-col md:flex-row justify-between items-start md:items-center ${
                          isExceeded ? "border-danger/30 bg-danger/5" : "border-border"
                        }`}
                      >
                        <div className="space-y-2 w-full md:w-3/4">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-textPrimary">{schoolUsage.school_name}</h4>
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-textSecondary px-2 py-0.5 rounded-full font-bold">
                              {schoolUsage.plan_name} Plan
                            </span>
                            {isExceeded && (
                              <span className="text-[9px] bg-danger/25 text-danger px-2 py-0.5 rounded-full font-bold">
                                {t.exceedsLimit}
                              </span>
                            )}
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-bold text-textSecondary">
                              <span>{t.usageLimit}: {schoolUsage.usage_count} / {schoolUsage.max_appointments_per_month}</span>
                              <span>{schoolUsage.percentage}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isExceeded ? "bg-danger" : "bg-primary"
                                }`} 
                                style={{ width: `${Math.min(schoolUsage.percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 shrink-0">
                          <button 
                            type="button"
                            onClick={() => handleSendUpgradeAlert(schoolUsage.school_id, schoolUsage.percentage)}
                            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <AlertCircle className="w-3.5 h-3.5" /> {t.sendAlert}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Tab: support */}
          {activeTab === "support" && (
            <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-6 animate-fadeIn dark:bg-slate-900 dark:border-slate-800">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-textPrimary">{t.supportHelp}</h2>
                <p className="text-xs text-textSecondary">{t.supportTicketsDesc}</p>
              </div>

              {/* Tickets List */}
              <div className="space-y-4">
                {tickets.length === 0 ? (
                  <div className="p-8 text-center text-textSecondary border border-dashed border-border rounded-xl font-medium dark:border-slate-800">
                    {t.noTickets}
                  </div>
                ) : (
                  tickets.map((tk) => {
                    const isPending = tk.status === "Pending";
                    return (
                      <div 
                        key={tk.id} 
                        className="p-5 border rounded-2xl bg-white dark:bg-slate-900 shadow-soft space-y-3 relative group border-border"
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                isPending ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                              }`}>
                                {isPending ? t.ticketPending : t.ticketResolved}
                              </span>
                              <h4 className="font-extrabold text-sm text-textPrimary">{tk.subject}</h4>
                            </div>
                            <p className="text-[10px] text-textSecondary font-bold">
                              From: <span className="text-primary">{tk.school_name}</span> • {new Date(tk.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-textSecondary leading-relaxed bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-border dark:border-slate-800">{tk.message}</p>
                        
                        {tk.reply ? (
                          <div className="pl-4 border-l-2 border-emerald-500 space-y-1 pt-1">
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">{t.ticketReply} (Super Admin):</span>
                            <p className="text-xs text-textSecondary leading-relaxed bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">{tk.reply}</p>
                            <span className="text-[9px] text-textSecondary font-medium">{tk.replied_at ? new Date(tk.replied_at).toLocaleString() : ""}</span>
                          </div>
                        ) : (
                          <div className="flex justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => setSelectedTicket(tk)}
                              className="px-3 py-1.5 bg-primary text-white font-bold text-xs rounded-lg hover:bg-primary/95 transition-all shadow-sm flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" /> Reply & Resolve
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Modal */}
              {selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
                  <form onSubmit={handleReplyTicket} className="bg-white dark:bg-slate-900 border border-border dark:border-slate-850 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl space-y-4 animate-scaleIn">
                    <h3 className="font-extrabold text-sm text-textPrimary">Reply to Ticket: "{selectedTicket.subject}"</h3>
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-border dark:border-slate-800 rounded-xl space-y-1 text-xs">
                      <span className="font-bold text-textSecondary block">From: {selectedTicket.school_name}</span>
                      <p className="text-textSecondary italic">"{selectedTicket.message}"</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-textPrimary">{t.ticketReply}</label>
                      <textarea
                        required
                        value={ticketReplyText}
                        onChange={(e) => setTicketReplyText(e.target.value)}
                        placeholder={t.writeReply}
                        className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none resize-none"
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => { setSelectedTicket(null); setTicketReplyText(""); }}
                        className="px-4 py-2 bg-white text-textPrimary border border-border font-bold text-xs rounded-lg hover:bg-slate-100 transition-colors dark:bg-slate-900"
                      >
                        {t.cancel}
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-lg hover:bg-primary/95 transition-colors flex items-center justify-center min-w-[100px]"
                      >
                        {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : t.submitReply}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
          {/* Tab: team (Maamulista Shaqaalaha) */}
          {activeTab === "team" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Sub-tab navigation */}
              <div className="flex gap-2 border-b border-border pb-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTeamSubTab("directory")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    teamSubTab === "directory"
                      ? "bg-primary text-white shadow-soft"
                      : "bg-slate-50 text-textSecondary hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-900"
                  }`}
                >
                  👥 {lang === "so" ? "Diiwaanka & Shift-yada Shaqaalaha" : "Staff Directory & Shifts"}
                </button>
                <button
                  type="button"
                  onClick={() => setTeamSubTab("applications")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    teamSubTab === "applications"
                      ? "bg-primary text-white shadow-soft"
                      : "bg-slate-50 text-textSecondary hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-900"
                  }`}
                >
                  📩 {lang === "so" ? "Codsiyada Shaqaalaha Cusub" : "Prospective Staff Applications"}
                  {saApplications.filter(a => a.status === "Pending").length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                  )}
                </button>
              </div>

              {teamSubTab === "directory" ? (
                <>
              {/* Performance Cards */}
              <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-4 dark:bg-slate-900 dark:border-slate-800">
                <h3 className="font-extrabold text-sm text-textPrimary uppercase tracking-wider">KPI-yada Shaqada Team-ka (Performance Logs)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                    <span className="text-[10px] font-bold text-primary uppercase block">Onboarding Approvals</span>
                    <span className="text-2xl font-extrabold text-textPrimary">
                      {schools.length} Schools Active
                    </span>
                  </div>
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase block">Resolved Support Tickets</span>
                    <span className="text-2xl font-extrabold text-textPrimary">
                      {tickets.filter(t => t.status === "Resolved").length} Tickets Done
                    </span>
                  </div>
                  <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
                    <span className="text-[10px] font-bold text-purple-500 uppercase block">Total System Logins</span>
                    <span className="text-2xl font-extrabold text-textPrimary">
                      {userSessions.length} Session Logs
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid: Create Staff and Add Task */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Create Staff Form */}
                <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-4 dark:bg-slate-900 dark:border-slate-800">
                  <h3 className="font-extrabold text-sm text-textPrimary">{lang === "so" ? "Diiwaangeli Shaqaale Cusub" : "Register New Staff"}</h3>
                  <form onSubmit={handleCreateStaff} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-textPrimary">Magaca Dhammaystiran</label>
                        <input 
                          type="text" required value={staffFormData.name}
                          onChange={e => setStaffFormData({...staffFormData, name: e.target.value})}
                          placeholder="Ahmed Ali" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-textPrimary">Email (Maamulka)</label>
                        <input 
                          type="email" required value={staffFormData.email}
                          onChange={e => setStaffFormData({...staffFormData, email: e.target.value})}
                          placeholder="ahmed@sma.com" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-800"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-textPrimary">Fungaha (Password)</label>
                        <input 
                          type="password" required value={staffFormData.password}
                          onChange={e => setStaffFormData({...staffFormData, password: e.target.value})}
                          placeholder="••••••••" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-textPrimary">Doorka (Sub-Role)</label>
                        <select 
                          value={staffFormData.sub_role}
                          onChange={e => setStaffFormData({...staffFormData, sub_role: e.target.value})}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-800"
                        >
                          <option value="Support">Adeegga Macaamiisha (Support)</option>
                          <option value="Billing">Maaliyadda & Rukunada (Billing)</option>
                          <option value="IT">Farsamada & IT (Tech Support)</option>
                        </select>
                        <div className="flex items-center gap-2 pt-1.5">
                          <input 
                            type="checkbox"
                            id="is_department_head"
                            checked={staffFormData.is_department_head || false}
                            onChange={e => setStaffFormData({...staffFormData, is_department_head: e.target.checked})}
                            className="rounded border-border text-primary focus:ring-primary dark:bg-slate-950 dark:border-slate-800 w-3.5 h-3.5"
                          />
                          <label htmlFor="is_department_head" className="text-[10px] font-bold text-textSecondary cursor-pointer">
                            Ka dhig Gudoomiye (Make Department Head)
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-textPrimary">Saacadaha Shift-ga (Start - End)</label>
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="time" value={staffFormData.shift_start}
                            onChange={e => setStaffFormData({...staffFormData, shift_start: e.target.value})}
                            className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-800"
                          />
                          <span className="text-textSecondary">-</span>
                          <input 
                            type="time" value={staffFormData.shift_end}
                            onChange={e => setStaffFormData({...staffFormData, shift_end: e.target.value})}
                            className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-800"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-textPrimary">IP-ga loo oggol yahay (Ikhtiyaari)</label>
                        <input 
                          type="text" value={staffFormData.allowed_ip}
                          onChange={e => setStaffFormData({...staffFormData, allowed_ip: e.target.value})}
                          placeholder="e.g. 192.168.1.100" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-800"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-textPrimary block">Dooro Sawirka Profile-ka (Select Avatar)</label>
                      <div className="flex items-center gap-2.5 pb-1">
                        {PRESET_AVATARS.map((avUrl, index) => {
                          const isSelected = staffFormData.avatar_url === avUrl;
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setStaffFormData({...staffFormData, avatar_url: avUrl})}
                              className={`w-9 h-9 rounded-full border-2 overflow-hidden transition-all p-0.5 bg-slate-50 dark:bg-slate-950 ${
                                isSelected 
                                  ? "border-primary scale-110 shadow-soft ring-2 ring-primary/20" 
                                  : "border-border opacity-70 hover:opacity-100 hover:scale-105"
                              }`}
                            >
                              <img src={avUrl} alt="Avatar" className="w-full h-full object-contain" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button 
                        type="submit" disabled={actionLoading}
                        className="px-5 py-2 bg-primary text-white font-bold text-xs rounded-lg hover:bg-primary/95 transition-colors disabled:opacity-50"
                      >
                        {actionLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Ku dar Shaqaalaha"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Task Assignment Form */}
                <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-4 dark:bg-slate-900 dark:border-slate-800">
                  <h3 className="font-extrabold text-sm text-textPrimary">{lang === "so" ? "U Qoondee Hawl Shaqaalaha" : "Assign Task to Staff"}</h3>
                  <form onSubmit={handleCreateTask} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-textPrimary">U qoondee (Assign To)</label>
                      <select 
                        required value={taskFormData.assigned_to}
                        onChange={e => setTaskFormData({...taskFormData, assigned_to: e.target.value})}
                        className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-800"
                      >
                        <option value="">Dooro shaqaalaha...</option>
                        {saStaff.map(st => (
                          <option key={st.id} value={st.id}>{st.name} ({st.staff_id})</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-textPrimary">Cinwaanka Hawsha (Task Title)</label>
                      <input 
                        type="text" required value={taskFormData.title}
                        onChange={e => setTaskFormData({...taskFormData, title: e.target.value})}
                        placeholder="e.g. Fadlan hubi Invoice #203" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-textPrimary">Faahfaahinta Hawsha (Description)</label>
                      <textarea 
                        value={taskFormData.description}
                        onChange={e => setTaskFormData({...taskFormData, description: e.target.value})}
                        placeholder="Qor faahfaahinta halkan..." rows={2}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-800 resize-none"
                      />
                    </div>
                    <div className="pt-1 flex justify-end">
                      <button 
                        type="submit" disabled={actionLoading}
                        className="px-5 py-2 bg-accent text-white font-bold text-xs rounded-lg hover:bg-accent/95 transition-colors disabled:opacity-50"
                      >
                        {actionLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Gudbi Hawsha"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Staff Table */}
              <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-4 dark:bg-slate-900 dark:border-slate-800">
                <h3 className="font-extrabold text-sm text-textPrimary">Liiska Shaqaalaha Platform-ka (Staff Members)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border dark:border-slate-800 text-[10px] text-textSecondary uppercase tracking-wider font-bold">
                        <th className="pb-3">ID</th>
                        <th className="pb-3">Sawirka</th>
                        <th className="pb-3">Magaca</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3">Role</th>
                        <th className="pb-3">Shift Hours</th>
                        <th className="pb-3">Allowed IP</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border dark:divide-slate-800 text-xs">
                      {saStaff.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-textSecondary font-medium">Ma jiraan shaqaale la diiwaangeliyey.</td>
                        </tr>
                      ) : (
                        saStaff.map(st => (
                          <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/40">
                            <td className="py-3.5 font-mono font-bold text-primary">{st.staff_id}</td>
                            <td className="py-3.5">
                              {st.avatar_url ? (
                                <img src={st.avatar_url} alt={st.name} className="w-8 h-8 rounded-full object-contain bg-slate-50 dark:bg-slate-950 border border-border" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-850 text-textPrimary flex items-center justify-center font-bold text-xs">
                                  {st.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 font-bold text-textPrimary">
                              <div className="flex items-center gap-1.5">
                                <span>{st.name}</span>
                                {st.is_department_head && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[8px] font-black uppercase flex items-center gap-0.5" title="Department Head">
                                    <Shield className="w-2.5 h-2.5" />
                                    Gudoomiye
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 text-textSecondary">{st.email}</td>
                            <td className="py-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                st.sub_role === "Support" 
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                                  : st.sub_role === "Billing"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    : "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
                              }`}>
                                {st.sub_role}
                              </span>
                            </td>
                            <td className="py-3.5 font-bold text-textSecondary">
                              {st.shift_start && st.shift_end ? `${st.shift_start} - ${st.shift_end}` : "24/7 (Open)"}
                            </td>
                            <td className="py-3.5 text-textSecondary font-mono">{st.allowed_ip || "Any IP"}</td>
                            <td className="py-3.5 text-right space-x-1.5">
                              <button 
                                onClick={() => setSelectedStaffDetail(st)}
                                className="p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                                title="Eeg Profile-ka (View Profile)"
                              >
                                <User className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteStaff(st.id)}
                                className="p-1 text-danger hover:bg-danger/10 rounded transition-colors"
                                title="Delete staff member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tasks List */}
              <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-4 dark:bg-slate-900 dark:border-slate-800">
                <h3 className="font-extrabold text-sm text-textPrimary">Diiwaanka Hawlaha la Qaybiyey (Assigned Tasks Ledger)</h3>
                <div className="space-y-3">
                  {saTasks.length === 0 ? (
                    <div className="p-6 text-center text-textSecondary border border-dashed border-border rounded-xl font-medium dark:border-slate-800">
                      Ma jiraan wax hawlo ah oo hadda jira.
                    </div>
                  ) : (
                    saTasks.map(t => {
                      const isCompleted = t.status === "Completed";
                      return (
                        <div key={t.id} className="p-4 border border-border rounded-xl bg-slate-50 dark:bg-slate-950/40 flex justify-between items-center gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                isCompleted ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                              }`}>
                                {t.status}
                              </span>
                              <h4 className={`font-extrabold text-xs text-textPrimary ${isCompleted ? "line-through opacity-50" : ""}`}>{t.title}</h4>
                            </div>
                            <p className="text-[10px] text-textSecondary leading-relaxed">{t.description}</p>
                            <p className="text-[9px] text-textSecondary font-bold">
                              Assigned to: <span className="text-primary">{t.assignee_name || "Staff"} ({t.assignee_staff_id})</span> • {new Date(t.created_at).toLocaleString()}
                            </p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleUpdateTaskStatus(t.id, t.status)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isCompleted 
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20"
                                : "bg-white border-border text-textSecondary hover:bg-slate-100 dark:bg-slate-900"
                            }`}
                            title={isCompleted ? "Mark Pending" : "Mark Completed"}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Staff Attendance Timesheet */}
              <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-4 dark:bg-slate-900 dark:border-slate-800">
                <h3 className="font-extrabold text-sm text-textPrimary">Diiwaanka Imaanshaha & Saacadaha Shaqada (Staff Attendance Timesheet)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border dark:border-slate-800 text-[10px] text-textSecondary uppercase tracking-wider font-bold">
                        <th className="pb-3">Shaqaalaha (Staff ID)</th>
                        <th className="pb-3">Maalinta (Date)</th>
                        <th className="pb-3">Shift Plan</th>
                        <th className="pb-3">Clock In</th>
                        <th className="pb-3">Clock Out</th>
                        <th className="pb-3">Work Duration</th>
                        <th className="pb-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border dark:divide-slate-800 text-xs">
                      {userSessions.filter(s => s.user_role?.startsWith("SuperAdmin (")).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-textSecondary font-medium">Ma jiraan wax saacado shaqo ah oo la diiwaangeliyey.</td>
                        </tr>
                      ) : (
                        userSessions.filter(s => s.user_role?.startsWith("SuperAdmin (")).map((sess, idx) => {
                          const st = saStaff.find(item => item.id === sess.user_id);
                          const shiftStart = st?.shift_start;
                          let statusText = "On Time";
                          let statusColor = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
                          if (shiftStart) {
                            const loginTime = new Date(sess.login_time);
                            const [sHour, sMin] = shiftStart.split(":");
                            const loginMin = loginTime.getHours() * 60 + loginTime.getMinutes();
                            const shiftMin = parseInt(sHour) * 60 + parseInt(sMin);
                            if (loginMin > shiftMin + 15) {
                              statusText = lang === "so" ? "Dahay (Late)" : "Late";
                              statusColor = "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
                            }
                          }
                          if (!sess.logout_time) {
                            statusText = lang === "so" ? "Shaqaynaya (Live)" : "Active";
                            statusColor = "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 animate-pulse";
                          }
                          return (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850/40">
                              <td className="py-3.5 font-bold text-textPrimary">
                                {sess.user_name}
                                <span className="block text-[10px] text-textSecondary font-mono font-normal">ID: {st?.staff_id || "SMA-000"}</span>
                              </td>
                              <td className="py-3.5 text-textSecondary font-medium">
                                {new Date(sess.login_time).toLocaleDateString()}
                              </td>
                              <td className="py-3.5 text-textSecondary font-bold">
                                {st?.shift_start && st?.shift_end ? `${st.shift_start} - ${st.shift_end}` : "24/7 (Open)"}
                              </td>
                              <td className="py-3.5 text-textSecondary font-medium">
                                {new Date(sess.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-3.5 text-textSecondary font-medium">
                                {sess.logout_time ? new Date(sess.logout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"}
                              </td>
                              <td className="py-3.5 font-bold text-textPrimary">
                                {sess.duration_minutes !== null ? `${sess.duration_minutes} min` : "--"}
                              </td>
                              <td className="py-3.5 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusColor}`}>
                                  {statusText}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              </>
              ) : (
                <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-4 dark:bg-slate-900 dark:border-slate-800 animate-fadeIn">
                  <div className="flex justify-between items-center pb-2 border-b border-border dark:border-slate-800">
                    <div>
                      <h3 className="font-extrabold text-sm text-textPrimary">Codsiyada Ku Biirista Platform-ka (Prospective Staff Applications)</h3>
                      <p className="text-[11px] text-textSecondary">Dib u eeg musharaxiinta codsiyada shaqo soo gudbiyey si aad u shaqaaleyso.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {saApplications.length === 0 ? (
                      <div className="p-10 text-center text-textSecondary border border-dashed border-border rounded-xl font-medium dark:border-slate-800">
                        Ma jiraan wax codsiyo ah oo hadda jira.
                      </div>
                    ) : (
                      saApplications.map((app) => (
                        <div key={app.id} className="p-5 border border-border rounded-2xl bg-slate-50 dark:bg-slate-950/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fadeIn">
                          <div className="space-y-2 max-w-2xl text-left">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-sm text-textPrimary">{app.name}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                app.sub_role === "Support" 
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                                  : app.sub_role === "Billing"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    : "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
                              }`}>
                                {app.sub_role}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                app.status === "Pending"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                  : app.status === "Hired"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    : "bg-danger/10 text-danger dark:bg-danger/20"
                              }`}>
                                {app.status}
                              </span>
                            </div>
                            <p className="text-xs text-textSecondary font-semibold">Email: <span className="font-normal font-mono">{app.email}</span></p>
                            {app.bio && (
                              <p className="text-xs text-textSecondary italic bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-border dark:border-slate-800">
                                "{app.bio}"
                              </p>
                            )}
                            {app.resume_url && (
                              <a 
                                href={app.resume_url} target="_blank" rel="noreferrer"
                                className="text-xs text-primary font-bold hover:underline flex items-center gap-1 mt-1"
                              >
                                📎 Eeg Warqada Codsiga / Resume (Open Attachment)
                              </a>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0 w-full md:w-auto flex-wrap md:flex-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedAppDetail(app)}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-textPrimary dark:text-white border border-border dark:border-slate-850 font-bold text-xs rounded-xl transition-all w-full md:w-auto flex items-center justify-center gap-1"
                            >
                              🔍 Eeg Wareysiga & CV
                            </button>
                            {app.status === "Pending" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleRejectStaffApplication(app.id)}
                                  className="px-4 py-2 bg-white text-danger border border-danger/20 font-bold text-xs rounded-xl hover:bg-danger/5 transition-all w-full md:w-auto dark:bg-slate-900"
                                >
                                  Diid (Reject)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleHireStaffApplication(app.id)}
                                  className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/95 transition-all shadow-md w-full md:w-auto flex items-center justify-center gap-1"
                                >
                                  Shaqaalee (Hire)
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: messages (Wada-hadalka Shaqaalaha & Super Admin) */}
          {activeTab === "messages" && (
            <div className="bg-white border border-border rounded-card shadow-soft p-6 flex flex-col md:flex-row gap-6 min-h-[500px] animate-fadeIn dark:bg-slate-900 dark:border-slate-800">
              {/* Left Column: Channels / User List */}
              <div className="w-full md:w-64 shrink-0 border-r border-border dark:border-slate-800 pr-0 md:pr-4 flex flex-col gap-3">
                <h3 className="font-extrabold text-sm text-textPrimary">{lang === "so" ? "Wada-hadalka Team-ka" : "Team Members"}</h3>
                <div className="space-y-1 overflow-y-auto max-h-[400px]">
                  {/* Option to chat with Owner (Only visible to Staff!) */}
                  {!isOwner && (
                    <button 
                      onClick={() => {
                        setActiveChatUser("owner"); // special ID for owner
                        setSaMessages([]);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                        activeChatUser === "owner" 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "hover:bg-slate-50 dark:hover:bg-slate-850/40 text-textSecondary"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold">
                        👑
                      </div>
                      <div>
                        <span className="block text-textPrimary">Platform Owner</span>
                        <span className="text-[9px] text-textSecondary uppercase">Mulkiilaha (Owner)</span>
                      </div>
                    </button>
                  )}

                  {/* List of staff members to chat with (Owner sees everyone, staff can see peers too!) */}
                  {saStaff.map(st => {
                    const isSelected = activeChatUser === st.id;
                    return (
                      <button 
                        key={st.id}
                        onClick={() => {
                          setActiveChatUser(st.id);
                          setSaMessages([]);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                          isSelected 
                            ? "bg-primary/10 text-primary border border-primary/20" 
                            : "hover:bg-slate-50 dark:hover:bg-slate-850/40 text-textSecondary"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 text-textPrimary flex items-center justify-center font-bold">
                          {st.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="block text-textPrimary">{st.name}</span>
                          <span className="text-[9px] text-textSecondary uppercase font-bold">{st.staff_id} • {st.sub_role}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Chat Box */}
              <div className="flex-grow flex flex-col justify-between min-h-[450px]">
                {activeChatUser ? (
                  <>
                    {/* Chat Messages Log */}
                    <div className="flex-grow space-y-4 overflow-y-auto max-h-[380px] p-4 bg-slate-50 dark:bg-slate-950/40 border border-border dark:border-slate-800 rounded-xl mb-4">
                      {saMessages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-textSecondary text-xs">
                          Ma jiraan wax farriimo ah oo hadda jira. Qor fariintaada koowaad hoos!
                        </div>
                      ) : (
                        saMessages.map(m => {
                          const isMe = m.sender_id === user.id;
                          return (
                            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-1 shadow-soft ${
                                isMe 
                                  ? "bg-primary text-white rounded-tr-none" 
                                  : "bg-white dark:bg-slate-900 border border-border text-textPrimary rounded-tl-none"
                              }`}>
                                <span className="text-[9px] font-bold opacity-70 block">{isMe ? "You" : m.sender_name}</span>
                                <p>{m.message}</p>
                                <span className="text-[8px] opacity-50 block text-right">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Chat Input form */}
                    <form onSubmit={handleSendChatMessage} className="flex gap-2">
                      <input 
                        type="text" required value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder="Halkan ku qor farriintaada..."
                        className="flex-grow px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                      />
                      <button 
                        type="submit"
                        className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/95 transition-colors shadow-sm"
                      >
                        Send
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-textSecondary space-y-3">
                    <MessageSquare className="w-12 h-12 text-textSecondary/30" />
                    <span className="text-xs font-bold">Fadlan ka dooro shaqaalaha dhinaca bidix si aad u bilowdo sheekaysiga.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-slate-50 py-8 dark:bg-slate-950 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex items-center gap-4 justify-center opacity-70 hover:opacity-100 transition-opacity">
            <SmaLogo className="h-8" />
            <div className="h-5 w-px bg-slate-350 dark:bg-slate-700" />
            <img src="/logo1.png" alt="SMA Logo" className="h-8 object-contain rounded" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-textSecondary dark:text-slate-400">
              © 2026 SMA SaaS. All rights reserved.
            </p>
            <p className="text-[9px] text-textSecondary/50 font-bold uppercase tracking-wider">
              Official School Management Appointment System
            </p>
          </div>
        </div>
      </footer>

      {/* Onboarding Credentials Modal Overlay */}
      {showCredsModal && approvedCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-850 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl space-y-5 animate-scaleIn">
            <div className="flex items-center gap-3 border-b border-border dark:border-slate-800 pb-3">
              <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <Key className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-extrabold text-sm text-textPrimary">Akoonka Adminka Cusub</h3>
                <p className="text-[10px] text-textSecondary uppercase tracking-wider font-bold">Admin Credentials Generated</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-border dark:border-slate-800 rounded-xl space-y-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-textSecondary uppercase">Email Login</span>
                <div className="font-mono text-sm text-textPrimary font-bold select-all bg-white dark:bg-slate-900 border border-border dark:border-slate-800 p-2 rounded-lg">
                  {approvedCreds.email}
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-textSecondary uppercase">Fungaha (Password)</span>
                <div className="font-mono text-sm text-emerald-500 font-bold select-all bg-white dark:bg-slate-900 border border-border dark:border-slate-800 p-2 rounded-lg">
                  {approvedCreds.password}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-amber-500 font-bold leading-relaxed bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
              ⚠️ Fadlan koobiye xogtan oo la wadaag maamulaha iskuulka hadda. Fungahan (password) ma muuqan doono mar kale amniga awgiis!
            </p>

            <button 
              onClick={() => {
                setShowCredsModal(false);
                setApprovedCreds(null);
              }}
              className="w-full py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/95 transition-all shadow-sm"
            >
              Waan Koobiyey, Xir daaqada
            </button>
          </div>
        </div>
      )}

      {/* Selected Staff Detail Profile Modal Overlay */}
      {selectedStaffDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-850 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto animate-scaleIn">
            {/* Header info / Digital Badge View */}
            <div className="flex justify-between items-start border-b border-border dark:border-slate-800 pb-3 bg-slate-50 dark:bg-slate-950 p-4 -mx-6 -mt-6 rounded-t-2xl">
              <h3 className="font-extrabold text-sm text-textPrimary flex items-center gap-1.5">
                <User className="w-4 h-4 text-primary" />
                {lang === "so" ? "Kaarta Aqoonsiga Shaqaalaha (Digital ID Card)" : "Staff Official ID Badge"}
              </h3>
              <button 
                onClick={() => setSelectedStaffDetail(null)}
                className="text-textSecondary hover:text-textPrimary p-1 bg-white dark:bg-slate-900 rounded-lg border border-border dark:border-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Twin columns layout for Badge & QR */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-left">
              {/* Badge Details Column */}
              <div className={`md:col-span-3 rounded-2xl p-5 border-2 relative overflow-hidden flex flex-col justify-between space-y-4 ${
                selectedStaffDetail.is_department_head 
                  ? "bg-slate-900 border-amber-500/50 text-white shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                  : "bg-slate-50 border-border dark:bg-slate-950 dark:border-slate-850 text-textPrimary dark:text-white"
              }`}>
                {/* Header rank label */}
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800/80">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedStaffDetail.is_department_head 
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                  }`}>
                    {selectedStaffDetail.is_department_head ? <Shield className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                  </div>
                  <div>
                    <h5 className="font-bold text-[9px] text-textSecondary uppercase tracking-wider">OFFICIAL ID PASS</h5>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      selectedStaffDetail.is_department_head 
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-slate-200 dark:bg-slate-800 text-textSecondary"
                    }`}>
                      {selectedStaffDetail.is_department_head ? "Gudoomiyaha Qeybta" : "Maamulka / Agent"}
                    </span>
                  </div>
                </div>

                {/* Avatar and Name */}
                <div className="flex items-center gap-3">
                  {selectedStaffDetail.avatar_url ? (
                    <img 
                      src={selectedStaffDetail.avatar_url} 
                      alt={selectedStaffDetail.name} 
                      className={`w-14 h-14 rounded-xl object-contain bg-slate-950 p-1 border ${
                        selectedStaffDetail.is_department_head ? "border-amber-500/30" : "border-slate-200 dark:border-slate-800"
                      }`}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-lg">
                      {selectedStaffDetail.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <h4 className="font-black text-sm">{selectedStaffDetail.name}</h4>
                    <p className="text-[10px] text-textSecondary font-mono">{selectedStaffDetail.email}</p>
                  </div>
                </div>

                {/* Technical data table */}
                <div className="space-y-2 text-[11px] pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-[9px] font-bold text-textSecondary uppercase">ID-ga Nidaamka</span>
                    <span className="font-mono font-bold">{selectedStaffDetail.staff_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] font-bold text-textSecondary uppercase">Tixraaca (Serial)</span>
                    <span className="font-mono font-bold">{selectedStaffDetail.serial_number || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] font-bold text-textSecondary uppercase">Doorka / Qeybta</span>
                    <span className="font-semibold">{selectedStaffDetail.sub_role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] font-bold text-textSecondary uppercase">Shift-ga</span>
                    <span className="font-semibold">
                      {selectedStaffDetail.shift_start && selectedStaffDetail.shift_end ? `${selectedStaffDetail.shift_start} - ${selectedStaffDetail.shift_end}` : "24/7 (Open)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Verification Column */}
              <div className="md:col-span-2 flex flex-col items-center justify-center space-y-3 p-4 border border-border dark:border-slate-850 rounded-2xl bg-slate-50 dark:bg-slate-950/40 text-center">
                <span className="text-[9px] font-black text-textSecondary uppercase tracking-widest">Secure QR Verification</span>

                {/* Holographic Glowing Frame */}
                {selectedStaffDetail.serial_number ? (
                  <>
                    <div className={`p-2 rounded-2xl relative shadow-inner ${
                      selectedStaffDetail.is_department_head 
                        ? "bg-amber-950/20 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]" 
                        : "bg-white border border-border dark:bg-slate-900 dark:border-slate-800"
                    }`}>
                      <div className="relative w-24 h-24 bg-white p-1 rounded-xl flex items-center justify-center">
                        <img 
                          src={`https://chart.googleapis.com/chart?chs=100x100&cht=qr&chl=${encodeURIComponent(typeof window !== "undefined" ? `${window.location.origin}/verify/staff/${selectedStaffDetail.serial_number}` : "")}&choe=UTF-8`}
                          alt="QR Verification"
                          className="w-full h-full object-contain"
                        />
                        {/* Centered SMA Logo overlay */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5.5 h-5.5 bg-slate-950 border border-white rounded-full flex items-center justify-center text-[6px] font-black text-primary select-none">
                          SMA
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] text-textSecondary font-bold select-all tracking-wider">
                      {selectedStaffDetail.serial_number}
                    </span>
                  </>
                ) : (
                  <p className="text-[10px] text-textSecondary italic">No serial number assigned</p>
                )}
              </div>
            </div>


            {/* Performance KPIs for this staff member */}
            <div className="space-y-2 text-left">
              <h4 className="font-extrabold text-xs text-textPrimary uppercase tracking-wider">KPI-yada Shaqada (Performance)</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl">
                  <span className="text-[8px] font-bold text-primary uppercase block">Approvals</span>
                  <span className="text-lg font-extrabold text-textPrimary">
                    {saPerformance?.approvals?.find((a: any) => a.user_id === selectedStaffDetail.id)?.count || 0} Done
                  </span>
                </div>
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                  <span className="text-[8px] font-bold text-emerald-500 uppercase block">Tickets Resolved</span>
                  <span className="text-lg font-extrabold text-textPrimary">
                    {saPerformance?.supportReplies?.find((r: any) => r.user_id === selectedStaffDetail.id)?.count || 0} Done
                  </span>
                </div>
                <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                  <span className="text-[8px] font-bold text-purple-500 uppercase block">Active Hours</span>
                  <span className="text-lg font-extrabold text-textPrimary">
                    {Math.round((saPerformance?.sessionTime?.find((t: any) => t.user_id === selectedStaffDetail.id)?.total_minutes || 0) / 60 * 10) / 10} hrs
                  </span>
                </div>
              </div>
            </div>

            {/* Security and Network settings */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-border dark:border-slate-850 rounded-xl text-left space-y-1">
              <span className="text-[10px] font-extrabold text-textSecondary uppercase block">Xadka Shabakada & Amniga (Allowed IP Bounds)</span>
              <p className="text-xs text-textPrimary font-bold font-mono">
                {selectedStaffDetail.allowed_ip ? `Oggol yahay kaliya IP: ${selectedStaffDetail.allowed_ip}` : "Xor ah (Wuxuu ka soo geli karaa meel kasta)"}
              </p>
            </div>

            {/* Grid: Tasks and Attendance logs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {/* Tasks List */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-textPrimary uppercase tracking-wider border-b border-border dark:border-slate-800 pb-1">
                  Hawlihii la Xilsaaray (Assigned Tasks)
                </h4>
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {saTasks.filter(t => t.assigned_to === selectedStaffDetail.id).length === 0 ? (
                    <p className="text-xs text-textSecondary italic">Ma jiraan wax hawlo ah oo loo qoondeeyay.</p>
                  ) : (
                    saTasks.filter(t => t.assigned_to === selectedStaffDetail.id).map(t => (
                      <div key={t.id} className="p-3 border border-border rounded-xl bg-white dark:bg-slate-900 space-y-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-xs text-textPrimary">{t.title}</h5>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                            t.status === "Completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {t.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-textSecondary leading-relaxed">{t.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Session Logs / Attendance */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-textPrimary uppercase tracking-wider border-b border-border dark:border-slate-800 pb-1">
                  Diiwaanka Imaanshaha (Clock In Logs)
                </h4>
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {userSessions.filter(s => s.user_id === selectedStaffDetail.id).length === 0 ? (
                    <p className="text-xs text-textSecondary italic">Ma jiraan wax soo-gelitaan ah oo la diiwaangeliyey.</p>
                  ) : (
                    userSessions.filter(s => s.user_id === selectedStaffDetail.id).map((sess, idx) => (
                      <div key={idx} className="p-3 border border-border rounded-xl bg-white dark:bg-slate-900 space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-textPrimary">
                          <span>{new Date(sess.login_time).toLocaleDateString()}</span>
                          <span className="font-mono text-textSecondary">{sess.ip_address || "Unknown IP"}</span>
                        </div>
                        <p className="text-[9px] text-textSecondary">
                          In: {new Date(sess.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • 
                          Out: {sess.logout_time ? new Date(sess.logout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active"} 
                          {sess.duration_minutes !== null && ` (${sess.duration_minutes} min)`}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => setSelectedStaffDetail(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-textPrimary font-bold text-xs rounded-xl transition-all dark:bg-slate-950 dark:hover:bg-slate-900"
              >
                Xir (Close Profile)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Candidate Interview Q&A Modal Overlay */}
      {selectedAppDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-850 rounded-2xl p-6 max-w-xl w-full mx-4 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto animate-scaleIn">
            <div className="flex justify-between items-start border-b border-border dark:border-slate-800 pb-3 bg-slate-50 dark:bg-slate-950 p-4 -mx-6 -mt-6 rounded-t-2xl">
              <div className="flex items-center gap-3 text-left">
                <span className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Briefcase className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-textPrimary">{selectedAppDetail.name}</h3>
                  <p className="text-[10px] text-textSecondary uppercase tracking-wider font-bold">
                    Role Requested: <span className="text-primary">{selectedAppDetail.sub_role}</span> • {selectedAppDetail.email}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAppDetail(null)}
                className="text-textSecondary hover:text-textPrimary p-1 bg-white dark:bg-slate-900 rounded-lg border border-border dark:border-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Q&A List */}
            <div className="space-y-4 text-left">
              <h4 className="font-extrabold text-xs text-textPrimary uppercase tracking-wider border-b border-border dark:border-slate-800 pb-1 flex items-center gap-1.5">
                📝 Jawaabaha Wareysiga (Interview Screening Responses)
              </h4>

              {/* Experience Answer */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-border dark:border-slate-850 rounded-xl">
                <h5 className="font-bold text-xs text-textPrimary">1. Khibradaada shaqo ee la xiriirta doorkan iyo sababta aad noogu soo biirayso:</h5>
                <p className="text-xs text-textSecondary leading-relaxed italic bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-border dark:border-slate-800">
                  "{selectedAppDetail.experience_ans || "N/A"}"
                </p>
              </div>

              {/* Scenario Answer */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-border dark:border-slate-850 rounded-xl">
                <h5 className="font-bold text-xs text-textPrimary">
                  2. Xaalad Adag: {selectedAppDetail.sub_role === "Support" 
                    ? "Macmiil caraysan oo nidaamku ka xumaaday sidee u xalin lahayd?"
                    : selectedAppDetail.sub_role === "Billing"
                      ? "Iskuul labo jeer lacag laga jaray sidee u baaraysaa?"
                      : "Server-ku haddii uu istaago maxay tahay tillaabada koobaad ee aad qaadi lahayd?"
                  }
                </h5>
                <p className="text-xs text-textSecondary leading-relaxed italic bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-border dark:border-slate-800">
                  "{selectedAppDetail.scenario_ans || "N/A"}"
                </p>
              </div>

              {/* Availability Answer */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-border dark:border-slate-850 rounded-xl">
                <h5 className="font-bold text-xs text-textPrimary">3. Helitaankaaga waqtiyada habeenkii ama weekends-ka:</h5>
                <p className="text-xs text-textSecondary leading-relaxed italic bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-border dark:border-slate-800">
                  "{selectedAppDetail.availability_ans || "N/A"}"
                </p>
              </div>

              {/* Cover Bio */}
              {selectedAppDetail.bio && (
                <div className="space-y-1 p-3 border border-border dark:border-slate-855 rounded-xl bg-white dark:bg-slate-900">
                  <h5 className="font-bold text-[10px] text-textSecondary uppercase">Cover Letter / Fariinta Musharaxa:</h5>
                  <p className="text-xs text-textSecondary leading-relaxed">
                    {selectedAppDetail.bio}
                  </p>
                </div>
              )}

              {/* Resume attachment */}
              {selectedAppDetail.resume_url && (
                <div className="pt-1">
                  <a 
                    href={selectedAppDetail.resume_url} target="_blank" rel="noreferrer"
                    className="w-full py-2.5 bg-primary/10 text-primary hover:bg-primary/15 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-primary/20 transition-all"
                  >
                    📎 Eeg Warqada Codsiga / Resume (Open Attachment)
                  </a>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex gap-3">
              <button 
                onClick={() => setSelectedAppDetail(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-textPrimary font-bold text-xs rounded-xl transition-all dark:bg-slate-950 dark:hover:bg-slate-900"
              >
                Xir Daaqada (Close)
              </button>
              {selectedAppDetail.status === "Pending" && (
                <>
                  <button 
                    onClick={() => {
                      handleRejectStaffApplication(selectedAppDetail.id);
                      setSelectedAppDetail(null);
                    }}
                    className="w-full py-2.5 bg-danger text-white hover:bg-danger/95 font-bold text-xs rounded-xl transition-all shadow-sm"
                  >
                    Diid Codsiga (Reject)
                  </button>
                  <button 
                    onClick={() => {
                      handleHireStaffApplication(selectedAppDetail.id);
                      setSelectedAppDetail(null);
                    }}
                    className="w-full py-2.5 bg-accent text-white hover:bg-emerald-600 font-bold text-xs rounded-xl transition-all shadow-sm"
                  >
                    Shaqaalee (Hire)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
