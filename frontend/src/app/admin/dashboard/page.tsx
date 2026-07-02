"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  Users, 
  Settings, 
  Clock, 
  LogOut, 
  Download, 
  Check, 
  X, 
  Search, 
  AlertCircle, 
  RefreshCw, 
  Building2, 
  Sliders, 
  BookOpen, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  FileText,
  Sun,
  Moon,
  MessageCircle,
  Camera,
  Send,
  Plus
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

import jsPDF from "jspdf";
import SmaLogo from "@/components/SmaLogo";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "SuperAdmin" | "Scanner";
  school_id: string;
  school_name: string;
  logo_url: string | null;
}

interface Appointment {
  id: string;
  appointment_number: string;
  student_name: string;
  parent_name: string;
  phone_number: string;
  email: string;
  gender: string;
  grade_applying_for: string;
  appointment_date: string;
  appointment_time: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled" | "WaitingList" | "Attended";
  created_at: string;
  admin_note?: string | null;
  student_age?: number | null;
  student_photo?: string | null;
  custom_data?: any;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface ScanMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

interface WaitingListEntry {
  id: string;
  parent_name: string;
  phone_number: string;
  student_name: string;
  grade: string;
  created_at: string;
}

interface SchoolConfig {
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
  working_days?: string[];
  time_slots?: string[];
  custom_fields?: any[];
  blockout_dates?: string[];
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "Info" | "Warning" | "Update";
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

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "appointments" | "calendar" | "waitingList" | "scanVerify" | "settings" | "support">("overview");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [school, setSchool] = useState<SchoolConfig | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Upgraded Feature States
  const [systemMaintenance, setSystemMaintenance] = useState(false);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketLoading, setTicketLoading] = useState(false);

  // Staff list states
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [staffSuccess, setStaffSuccess] = useState("");

  // Chat message states
  const [messages, setMessages] = useState<ScanMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Appointment note state
  const [noteSavingId, setNoteSavingId] = useState<string | null>(null);

  // Live Camera/Scan modes
  const [scannerActive, setScannerActive] = useState(false);
  const [scanTabMode, setScanTabMode] = useState<"camera" | "search">("search");
  const [scanSearchQuery, setScanSearchQuery] = useState("");

  // States
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState<"en" | "so">("so");

  // Custom Fields Builder States
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<"text" | "textarea" | "select">("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState("");

  // Block-out Dates Manager States
  const [newBlockoutDate, setNewBlockoutDate] = useState("");

  const addCustomField = () => {
    if (!newFieldLabel.trim() || !school) return;
    const currentFields = school.custom_fields || [];
    const optionsArray = newFieldType === "select"
      ? newFieldOptions.split(",").map(o => o.trim()).filter(Boolean)
      : [];

    const newField = {
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
      options: optionsArray
    };

    setSchool({
      ...school,
      custom_fields: [...currentFields, newField]
    });

    setNewFieldLabel("");
    setNewFieldType("text");
    setNewFieldRequired(false);
    setNewFieldOptions("");
  };

  const removeCustomField = (index: number) => {
    if (!school) return;
    const currentFields = school.custom_fields || [];
    setSchool({
      ...school,
      custom_fields: currentFields.filter((_, idx) => idx !== index)
    });
  };

  const addBlockoutDate = () => {
    if (!newBlockoutDate || !school) return;
    const currentBlockout = school.blockout_dates || [];
    if (!currentBlockout.includes(newBlockoutDate)) {
      setSchool({
        ...school,
        blockout_dates: [...currentBlockout, newBlockoutDate].sort()
      });
    }
    setNewBlockoutDate("");
  };

  const removeBlockoutDate = (date: string) => {
    if (!school) return;
    const currentBlockout = school.blockout_dates || [];
    setSchool({
      ...school,
      blockout_dates: currentBlockout.filter(d => d !== date)
    });
  };

  // Scan & Verify States
  const [scanQuery, setScanQuery] = useState("");
  const [scannedAppt, setScannedAppt] = useState<Appointment | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanSuccessMsg, setScanSuccessMsg] = useState("");

  // Calendar View States
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const toggleBlockoutDateInstant = async (dateStr: string) => {
    if (!school || !token) return;
    const currentBlockout = school.blockout_dates || [];
    const updated = currentBlockout.includes(dateStr)
      ? currentBlockout.filter(d => d !== dateStr)
      : [...currentBlockout, dateStr].sort();
    
    try {
      const res = await fetch(`${API_BASE}/schools/${school.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...school,
          blockout_dates: updated
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSchool(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const downloadCheckinPDF = (dateStr: string) => {
    if (!school) return;
    const dayAppts = appointments.filter(
      a => a.appointment_date.split("T")[0] === dateStr && 
      a.status !== "Cancelled" && 
      a.status !== "Rejected"
    );

    const doc = new jsPDF();
    
    // Header Branding
    doc.setFillColor(30, 41, 59); // Slate-805
    doc.rect(0, 0, 210, 40, "F");

    // SmaLogo Cap Brand Label
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.text("SMA", 15, 20);
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text("Admission Management System", 15, 26);

    doc.setFontSize(14);
    doc.setFont("Helvetica", "bold");
    doc.text(school.name, 195, 20, { align: "right" });
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text(school.address || "", 195, 26, { align: "right" });

    // Report Title
    doc.setTextColor(30, 41, 59);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text(lang === "so" ? "LIISKA DIIVANGELINTA / CHECK-IN LIST" : "ADMISSION CHECK-IN REPORT", 15, 52);

    // Meta Info
    doc.setFontSize(10);
    doc.setFont("Helvetica", "bold");
    doc.text(lang === "so" ? `Taariikhda:` : `Date:`, 15, 62);
    doc.setFont("Helvetica", "normal");
    doc.text(dateStr, 40, 62);

    doc.setFont("Helvetica", "bold");
    doc.text(lang === "so" ? `Total Arday:` : `Total Students:`, 120, 62);
    doc.setFont("Helvetica", "normal");
    doc.text(dayAppts.length.toString(), 155, 62);

    // Table Header
    let y = 72;
    doc.setFillColor(51, 65, 85); // Slate-700
    doc.rect(15, y, 180, 8, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.text("#", 18, y + 5.5);
    doc.text(lang === "so" ? "Ardayga" : "Student Name", 28, y + 5.5);
    doc.text(lang === "so" ? "Fasalka" : "Grade", 80, y + 5.5);
    doc.text(lang === "so" ? "Saacadda" : "Time Slot", 105, y + 5.5);
    doc.text(lang === "so" ? "Waalidka" : "Parent Name", 130, y + 5.5);
    doc.text(lang === "so" ? "Xaaladda" : "Status", 175, y + 5.5);

    y += 8;

    // Table Body
    doc.setTextColor(0, 0, 0);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);

    if (dayAppts.length === 0) {
      doc.setFont("Helvetica", "italic");
      doc.text(lang === "so" ? "Ma jiraan ballamo loo qorsheeyay maalintan." : "No appointments scheduled for this date.", 20, y + 8);
    } else {
      dayAppts.forEach((appt, idx) => {
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252); // Slate-50
          doc.rect(15, y, 180, 9, "F");
        } else {
          doc.setFillColor(255, 255, 255);
          doc.rect(15, y, 180, 9, "F");
        }
        
        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.line(15, y + 9, 195, y + 9);

        doc.text((idx + 1).toString(), 18, y + 6);
        
        let sName = appt.student_name;
        if (sName.length > 22) sName = sName.slice(0, 20) + "..";
        doc.text(sName, 28, y + 6);
        
        doc.text(appt.grade_applying_for || "", 80, y + 6);
        doc.text(appt.appointment_time.slice(0, 5) || "", 105, y + 6);
        
        let pName = appt.parent_name;
        if (pName.length > 20) pName = pName.slice(0, 18) + "..";
        doc.text(pName, 130, y + 6);
        
        doc.text(appt.status || "", 175, y + 6);

        y += 9;

        if (y > 270) {
          doc.addPage();
          y = 20;
          doc.setFillColor(51, 65, 85);
          doc.rect(15, y, 180, 8, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("Helvetica", "bold");
          doc.text("#", 18, y + 5.5);
          doc.text(lang === "so" ? "Ardayga" : "Student Name", 28, y + 5.5);
          doc.text(lang === "so" ? "Fasalka" : "Grade", 80, y + 5.5);
          doc.text(lang === "so" ? "Saacadda" : "Time Slot", 105, y + 5.5);
          doc.text(lang === "so" ? "Waalidka" : "Parent Name", 130, y + 5.5);
          doc.text(lang === "so" ? "Xaaladda" : "Status", 175, y + 5.5);
          y += 8;
          doc.setTextColor(0, 0, 0);
          doc.setFont("Helvetica", "normal");
        }
      });
    }

    doc.setTextColor(148, 163, 184); // Slate-400
    doc.setFontSize(8);
    doc.text(`Generated on ${new Date().toLocaleString()} by SMA SaaS Platform. All rights reserved.`, 105, 285, { align: "center" });

    doc.save(`SMA_Checkin_${dateStr}.pdf`);
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

  // Session Activity Heartbeat
  useEffect(() => {
    const sessionId = localStorage.getItem("sessionId");
    const token = localStorage.getItem("token");
    if (!sessionId || !token) return;

    const sendHeartbeat = async () => {
      try {
        await fetch(`${API_BASE}/auth/heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
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

  // Check maintenance mode on load
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch(`${API_BASE}/public/system/maintenance`);
        if (res.ok) {
          const data = await res.json();
          if (data.maintenance_mode) {
            setSystemMaintenance(true);
          } else {
            setSystemMaintenance(false);
          }
        }
      } catch (err) {
        console.error("Maintenance check failed:", err);
      }
    };
    checkMaintenance();
    const interval = setInterval(checkMaintenance, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check Authentication
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserStr = localStorage.getItem("user");

    if (!storedToken || !storedUserStr) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUserStr);
    if (parsedUser.role !== "Admin" && parsedUser.role !== "Scanner") {
      router.push("/login");
      return;
    }

    setToken(storedToken);
    setUser(parsedUser);

    // Force scanner users to Scan & Verify tab
    if (parsedUser.role === "Scanner") {
      setActiveTab("scanVerify");
    }
  }, [router]);

  // Load Dashboard Data once authenticated
  useEffect(() => {
    if (!token || !user) return;
    loadAllData();
  }, [token, user]);

  const fetchAnnouncements = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/announcements`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSchoolConfig(),
        fetchAppointments(),
        fetchWaitingList(),
        fetchAnnouncements(),
        fetchSchoolSubscription(),
        fetchSupportTickets()
      ]);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolConfig = async () => {
    if (!user || !token) return;
    try {
      const res = await fetch(`${API_BASE}/public/schools/${user.school_id}`);
      if (res.ok) {
        const data = await res.json();
        setSchool(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSchoolSubscription = async () => {
    if (!user || !token) return;
    try {
      const res = await fetch(`${API_BASE}/subscriptions/school/${user.school_id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setSubscription(await res.json());
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
    }
  };

  const fetchSupportTickets = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/support/tickets`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setTickets(await res.json());
      }
    } catch (err) {
      console.error("Error fetching support tickets:", err);
    }
  };

  const handleCreateSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !ticketSubject.trim() || !ticketMessage.trim()) return;

    setTicketLoading(true);
    setSaveMessage("");
    setSaveError("");

    try {
      const res = await fetch(`${API_BASE}/support/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: ticketSubject,
          message: ticketMessage
        })
      });

      if (res.ok) {
        setSaveMessage(lang === "so" ? "Cabashadaada si guul leh ayaa loo gudbiyey!" : "Support ticket submitted successfully!");
        setTicketSubject("");
        setTicketMessage("");
        await fetchSupportTickets();
      } else {
        const data = await res.json();
        setSaveError(data.error || "Failed to submit ticket");
      }
    } catch (err) {
      console.error(err);
      setSaveError("Error submitting support ticket");
    } finally {
      setTicketLoading(false);
    }
  };

  const getMonthlyBookingsCount = () => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return appointments.filter(
      a => a.status !== "Cancelled" && a.status !== "Rejected" && new Date(a.created_at) >= startOfMonth
    ).length;
  };

  const fetchAppointments = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWaitingList = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/waiting-list`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWaitingList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Polling for scan messages
  useEffect(() => {
    if (!token) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [token]);

  // Load staff on active Tab change
  useEffect(() => {
    if (activeTab === "settings" && user?.role === "Admin") {
      fetchStaffMembers();
    }
  }, [activeTab, user]);

  const fetchStaffMembers = async () => {
    if (!token || user?.role !== "Admin") return;
    try {
      const res = await fetch(`${API_BASE}/schools/staff`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setStaffLoading(true);
    setStaffError("");
    setStaffSuccess("");
    try {
      const res = await fetch(`${API_BASE}/schools/staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: staffName,
          email: staffEmail,
          password: staffPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStaffSuccess(lang === "so" ? "Akoonka shaqaalaha waa la sameeyay!" : "Staff member created successfully!");
        setStaffName("");
        setStaffEmail("");
        setStaffPassword("");
        fetchStaffMembers();
      } else {
        setStaffError(data.error || "Failed to create staff member");
      }
    } catch (err) {
      console.error(err);
      setStaffError("Error creating staff member");
    } finally {
      setStaffLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!token || !confirm(lang === "so" ? "Ma hubtaa inaad tirtirto?" : "Are you sure you want to delete?")) return;
    try {
      const res = await fetch(`${API_BASE}/schools/staff/${staffId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchStaffMembers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/scan-messages`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newMessage.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/scan-messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleSaveAppointmentNote = async (apptId: string, note: string) => {
    if (!token) return;
    setNoteSavingId(apptId);
    try {
      const res = await fetch(`${API_BASE}/appointments/${apptId}/admin-note`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ admin_note: note })
      });
      if (res.ok) {
        await fetchAppointments();
      }
    } catch (err) {
      console.error("Error saving admin note:", err);
    } finally {
      setNoteSavingId(null);
    }
  };

  // Play scanning audio beep natively
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(700, audioCtx.currentTime); // 700Hz
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.12);
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.error(e);
    }
  };

  const startCamera = async () => {
    setScannerActive(true);
    setScanError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const video = document.getElementById("scanner-video") as HTMLVideoElement;
      if (video) {
        video.srcObject = stream;
        video.play();
        
        // Scan loop using native BarcodeDetector if available
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const scanLoop = async () => {
            if (!video.srcObject) return;
            try {
              const barcodes = await barcodeDetector.detect(video);
              if (barcodes.length > 0) {
                const rawValue = barcodes[0].rawValue;
                setScanQuery(rawValue);
                playBeep();
                stopCamera();
                fetchApptByNumber(rawValue);
                return;
              }
            } catch (e) {
              console.error(e);
            }
            requestAnimationFrame(scanLoop);
          };
          requestAnimationFrame(scanLoop);
        }
      }
    } catch (err: any) {
      console.error(err);
      setScanError(lang === "so" ? "Kamarada waa la furi waayey. Hubi amarada browser-ka." : "Cannot open camera. Check browser permissions.");
      setScannerActive(false);
    }
  };

  const stopCamera = () => {
    setScannerActive(false);
    const video = document.getElementById("scanner-video") as HTMLVideoElement;
    if (video && video.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
  };

  const fetchApptByNumber = async (num: string) => {
    setScanLoading(true);
    setScanError("");
    setScanSuccessMsg("");
    setScannedAppt(null);
    try {
      const res = await fetch(`${API_BASE}/appointments/number/${num.trim()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setScannedAppt(data);
      } else {
        setScanError(lang === "so" ? "Tigidhka lama helin." : "Ticket not found.");
      }
    } catch (err) {
      console.error(err);
      setScanError("Error fetching ticket.");
    } finally {
      setScanLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!token) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        // Refresh local appointments
        await fetchAppointments();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !school) return;

    setSavingSettings(true);
    setSaveMessage("");
    setSaveError("");

    try {
      const res = await fetch(`${API_BASE}/schools/${school.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: school.name,
          logo_url: school.logo_url,
          description: school.description,
          address: school.address,
          phone: school.phone,
          email: school.email,
          admission_status: school.admission_status,
          max_appointments_per_day: school.max_appointments_per_day,
          max_appointments_per_hour: school.max_appointments_per_hour,
          working_days: school.working_days || [],
          time_slots: school.time_slots || [],
          custom_fields: school.custom_fields || [],
          blockout_dates: school.blockout_dates || [],
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSaveMessage("School settings updated successfully!");
        setSchool(data);
      } else {
        throw new Error(data.error || "Failed to update settings");
      }
    } catch (err: any) {
      setSaveError(err.message || "Something went wrong.");
    } finally {
      setSavingSettings(false);
    }
  };

  const exportCSV = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/appointments/export/csv`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Appointments_${school?.name || "School"}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Export CSV failed:", err);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleScanSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scanQuery.trim() || !token) return;

    setScanLoading(true);
    setScanError("");
    setScanSuccessMsg("");
    setScannedAppt(null);

    try {
      const res = await fetch(`${API_BASE}/appointments/number/${scanQuery.trim()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setScannedAppt(data);
      } else {
        setScanError(lang === "so" ? (data.error || "Ballanta lama helin") : (data.error || "Appointment not found"));
      }
    } catch (err) {
      console.error(err);
      setScanError(lang === "so" ? "Cillad ayaa dhacday inta lagu guda jiray raadinta" : "Error searching for appointment");
    } finally {
      setScanLoading(false);
    }
  };

  const handleMarkAttended = async (apptId: string) => {
    if (!token) return;
    setScanLoading(true);
    setScanError("");
    setScanSuccessMsg("");
    try {
      const res = await fetch(`${API_BASE}/appointments/${apptId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "Attended" })
      });
      const data = await res.json();
      if (res.ok) {
        setScanSuccessMsg(lang === "so" ? "Joogitaanka ardayga waa la xaqiijiyay!" : "Student attendance marked successfully!");
        setScannedAppt(data);
        // Refresh local list too
        await fetchAppointments();
      } else {
        setScanError(data.error || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      setScanError("Failed to update status");
    } finally {
      setScanLoading(false);
    }
  };

  const getWhatsAppTemplateLink = (app: Appointment) => {
    const cleanPhone = app.phone_number.replace(/[^0-9]/g, "");
    const dateStr = app.appointment_date ? app.appointment_date.split("T")[0] : "";
    const timeStr = app.appointment_time ? app.appointment_time.slice(0, 5) : "";
    
    let msg = "";
    if (app.status === "Pending") {
      msg = `Ku: ${app.parent_name}\n\nKu soo dhowow ${school?.name || "Iskuulka"}. Codsigaaga ballan ee diiwangelinta ee ardayga ${app.student_name} oo nambarkiisu yahay ${app.appointment_number} waa uu na soo gaaray, wuxuuna hadda ku jiraa baaritaan (Pending). Waxaan kugu soo wargelin doonaa marka la oggolaado. Waad ku mahadsan tahay!`;
    } else if (app.status === "Approved") {
      msg = `Ku: ${app.parent_name}\n\nWaxaan kuugu bishaaraynaynaa in ballantii diiwangelinta ee ardayga ${app.student_name} oo nambarkiisu yahay ${app.appointment_number} la oggolaaday (Approved)! Fadlan u kaalay iskuulka ${school?.name || "Iskuulka"} taariikhda ${dateStr} saacadu marka ay tahay ${timeStr} si aad u dhammaystirto diiwangelinta. Waad ku mahadsan tahay!`;
    } else if (app.status === "Rejected") {
      msg = `Ku: ${app.parent_name}\n\nWaxaan kaa codsanaynaa inaad naga raali noqoto, ballantii diiwangelinta ee ardayga ${app.student_name} oo nambarkiisu yahay ${app.appointment_number} waa la diiday (Rejected) sababo la xiriira boos la'aan. Wixii faahfaahin ah fadlan nagala soo xiriir taleefankan. Waad ku mahadsan tahay!`;
    } else if (app.status === "WaitingList") {
      msg = `Ku: ${app.parent_name}\n\nWaxaan kugu wargelinaynaa in ardayga ${app.student_name} lagu daray liiska sugitaanka (Waiting List) ee iskuulka ${school?.name || "Iskuulka"} sababo la xiriira boosaska oo buuxsamay. Waxaan kula soo xiriiri doonaa haddii uu boos noo furmo. Waad ku mahadsan tahay dulqaadkaaga!`;
    } else {
      msg = `Ku: ${app.parent_name}\n\nWaad ku mahadsan tahay booqashadaada iyo dhammaystirka ballanta diiwangelinta ee ardayga ${app.student_name} ee iskuulka ${school?.name || "Iskuulka"}. Aad ayaan ugu faraxsanahay inaad nagu soo biirto!`;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const filteredAppointments = appointments.filter(a => {
    const matchesSearch = 
      a.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.parent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.appointment_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter ? a.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  const scanSearchResults = scanSearchQuery.trim() === "" ? [] : appointments.filter(a => 
    a.student_name.toLowerCase().includes(scanSearchQuery.toLowerCase()) ||
    a.parent_name.toLowerCase().includes(scanSearchQuery.toLowerCase()) ||
    a.appointment_number.toLowerCase().includes(scanSearchQuery.toLowerCase()) ||
    a.phone_number.includes(scanSearchQuery)
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Approved": return "bg-accent/15 text-accent";
      case "Rejected": return "bg-danger/15 text-danger";
      case "Pending": return "bg-warning/15 text-warning";
      case "Cancelled": return "bg-slate-300/40 text-textSecondary";
      case "WaitingList": return "bg-amber-100 text-amber-800";
      case "Attended": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400";
      default: return "bg-slate-100 text-textSecondary";
    }
  };

  // Metrics
  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === "Pending").length,
    approved: appointments.filter(a => a.status === "Approved").length,
    rejected: appointments.filter(a => a.status === "Rejected").length,
    waiting: waitingList.length
  };

  // Grade Distribution Data
  const gradeCounts: Record<string, number> = {};
  appointments.forEach(a => {
    const g = a.grade_applying_for || "Grade 1";
    gradeCounts[g] = (gradeCounts[g] || 0) + 1;
  });
  const gradeData = Object.keys(gradeCounts).map(g => ({
    name: g,
    Codsiyo: gradeCounts[g]
  })).sort((a, b) => b.Codsiyo - a.Codsiyo);

  // Load over Days Data
  const dayCounts: Record<string, number> = {};
  appointments.forEach(a => {
    const dateStr = a.appointment_date ? a.appointment_date.split("T")[0] : "";
    if (dateStr) {
      dayCounts[dateStr] = (dayCounts[dateStr] || 0) + 1;
    }
  });
  const dayData = Object.keys(dayCounts).map(d => ({
    date: d,
    Ballamaha: dayCounts[d]
  })).sort((a, b) => a.date.localeCompare(b.date)).slice(-7);

  // Peak Hours Data
  const hourCounts: Record<string, number> = {};
  appointments.forEach(a => {
    const timeStr = a.appointment_time ? a.appointment_time.slice(0, 5) : "";
    if (timeStr) {
      hourCounts[timeStr] = (hourCounts[timeStr] || 0) + 1;
    }
  });
  const hourData = Object.keys(hourCounts).map(h => ({
    time: h,
    Tirada: hourCounts[h]
  })).sort((a, b) => a.time.localeCompare(b.time));

  if (systemMaintenance && user?.role !== "SuperAdmin") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <Settings className="w-16 h-16 text-amber-500 animate-spin mx-auto" />
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

  if (loading || !user || !school) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-sm font-medium text-textSecondary">Lagu guda jiraa soo dejinta macluumaadka...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col justify-between">
      {/* Top Bar */}
      <header className="glass-panel sticky top-0 z-40 border-b border-border h-16 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 border border-border">
              {school.logo_url ? (
                <img src={school.logo_url} alt={school.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-extrabold uppercase tracking-wider" style={{
                  background: `linear-gradient(135deg, ${getRandomColor(school.name)})`
                }}>
                  {getInitials(school.name)}
                </div>
              )}
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-textPrimary leading-none">{school.name}</h1>
              <span className="text-[10px] text-textSecondary font-bold uppercase tracking-wider">Qaybta Maamulka</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => setLang(prev => prev === "en" ? "so" : "en")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-textPrimary dark:text-slate-200 hover:text-primary transition-colors border border-border dark:border-slate-700"
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
              {lang === "so" ? "Ku soo dhawaada," : "Welcome,"} <span className="text-textPrimary">{user.name}</span>
            </span>
            <button 
              onClick={handleSignOut}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-textSecondary hover:text-danger rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">{lang === "so" ? "Ka Bax" : "Sign Out"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content Layout */}
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 shrink-0 space-y-2">
          {user.role !== "Scanner" && (
            <>
              <button 
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "overview" 
                    ? "bg-primary text-white shadow-sm" 
                    : "bg-white border border-border dark:bg-slate-900 dark:border-slate-800 text-textSecondary hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Sliders className="w-4 h-4" /> {lang === "so" ? "Guudmarka Dashboard" : "Overview Dashboard"}
              </button>
              <button 
                onClick={() => setActiveTab("appointments")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "appointments" 
                    ? "bg-primary text-white shadow-sm" 
                    : "bg-white border border-border dark:bg-slate-900 dark:border-slate-800 text-textSecondary hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Calendar className="w-4 h-4" /> {lang === "so" ? `Ballamaha (${stats.total})` : `Appointments (${stats.total})`}
              </button>
              <button 
                onClick={() => setActiveTab("calendar")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "calendar" 
                    ? "bg-primary text-white shadow-sm" 
                    : "bg-white border border-border dark:bg-slate-900 dark:border-slate-800 text-textSecondary hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Calendar className="w-4 h-4" /> {lang === "so" ? "Kalandarka Ballamaha" : "Calendar View"}
              </button>
              <button 
                onClick={() => setActiveTab("waitingList")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "waitingList" 
                    ? "bg-primary text-white shadow-sm" 
                    : "bg-white border border-border dark:bg-slate-900 dark:border-slate-800 text-textSecondary hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Users className="w-4 h-4" /> {lang === "so" ? `Liiska Sugitaanka (${stats.waiting})` : `Waiting List (${stats.waiting})`}
              </button>
            </>
          )}
          <button 
            onClick={() => setActiveTab("scanVerify")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "scanVerify" 
                ? "bg-primary text-white shadow-sm" 
                : "bg-white border border-border dark:bg-slate-900 dark:border-slate-800 text-textSecondary hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Check className="w-4 h-4" /> {lang === "so" ? "Baar & Xaqiiji (Scan)" : "Scan & Verify"}
          </button>
          {user.role !== "Scanner" && (
            <>
              <button 
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "settings" 
                    ? "bg-primary text-white shadow-sm" 
                    : "bg-white border border-border dark:bg-slate-900 dark:border-slate-800 text-textSecondary hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Settings className="w-4 h-4" /> {lang === "so" ? "Habaynta Diiwangelinta" : "Admission Settings"}
              </button>
              <button 
                onClick={() => setActiveTab("support")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "support" 
                    ? "bg-primary text-white shadow-sm" 
                    : "bg-white border border-border dark:bg-slate-900 dark:border-slate-800 text-textSecondary hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <HelpCircle className="w-4 h-4" /> {lang === "so" ? "Caawinaada & Cabashada" : "Support Tickets"}
              </button>
            </>
          )}

          {/* Quick Stats Panel */}
          {user.role !== "Scanner" && (
            <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl p-4 space-y-3 hidden md:block">
              <span className="text-[10px] font-bold text-textSecondary dark:text-slate-400 uppercase tracking-wider block">
                {lang === "so" ? "Qaabeynta Diiwangelinta" : "Admission Config"}
              </span>
              <div className="flex justify-between items-center text-xs">
                <span className="text-textSecondary dark:text-slate-400">{lang === "so" ? "Xaaladda:" : "Status:"}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  school.admission_status === "Open" ? "bg-accent/10 text-accent" : "bg-danger/10 text-danger"
                }`}>
                  {school.admission_status === "Open" ? (lang === "so" ? "Furan" : "Open") : (lang === "so" ? "Xiran" : "Closed")}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-textSecondary dark:text-slate-400">{lang === "so" ? "Xadka Maalintii:" : "Daily Limit:"}</span>
                <span className="font-bold text-textPrimary dark:text-slate-200">{school.max_appointments_per_day}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-textSecondary dark:text-slate-400">{lang === "so" ? "Xadka Saacaddii:" : "Hourly Limit:"}</span>
                <span className="font-bold text-textPrimary dark:text-slate-200">{school.max_appointments_per_hour}</span>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Pane */}
        <main className="flex-grow space-y-6">
          {/* Tab 1: Overview Dashboard */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Congratulations Message Card */}
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-850 border border-blue-100 dark:border-slate-800 rounded-card shadow-soft space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-extrabold text-base text-blue-900 dark:text-blue-300">
                      {lang === "so" ? "🎉 Hambalyo! Iskuulkiinnu wuxuu isticmaalaa SMA" : "🎉 Congratulations! Your School uses SMA"}
                    </h3>
                    <p className="text-xs text-blue-700 dark:text-slate-400 mt-1">
                      {lang === "so" 
                        ? "Nidaamka SMA wuxuu iskuulkiinna u sahlay maamulista ballamaha, xaqiijinta check-in-ka, iyo amniga diiwangelinta."
                        : "The SMA system enables your school to manage appointments, check-in validation, and secure admissions."}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shrink-0">
                    {lang === "so" ? "Nidaamka waa Active" : "System is Active"}
                  </span>
                </div>

                {/* Capacity Limit Indicator */}
                {subscription && (
                  <div className="border-t border-blue-200/50 dark:border-slate-800 pt-4 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-blue-900 dark:text-blue-300">
                      <span>{lang === "so" ? "Xadka Ballamaha Bishaan:" : "Monthly Booking Usage Limit:"}</span>
                      <span>{getMonthlyBookingsCount()} / {subscription.max_appointments_per_month} ({Math.round((getMonthlyBookingsCount() / subscription.max_appointments_per_month) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-blue-200/40 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          (getMonthlyBookingsCount() / subscription.max_appointments_per_month) >= 0.85 ? "bg-danger" : "bg-primary"
                        }`}
                        style={{ width: `${Math.min((getMonthlyBookingsCount() / subscription.max_appointments_per_month) * 100, 100)}%` }}
                      />
                    </div>
                    {(getMonthlyBookingsCount() / subscription.max_appointments_per_month) >= 0.85 && (
                      <p className="text-[10px] text-danger font-bold">
                        ⚠️ Digniin: Waxaad mareysaa in ka badan 85% xadkii qorshahaaga bishaan! Fadlan la xiriir Super Admin si aad u cusboonaysiiso.
                      </p>
                    )}
                  </div>
                )}

                <div className="border-t border-blue-200/50 dark:border-slate-800 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-[10px] font-bold text-blue-800/60 dark:text-slate-500 uppercase tracking-widest">
                    {lang === "so" ? "Nuujinta Branding-ka rasmiga ah" : "Official System Branding"}
                  </div>
                   <div className="flex items-center gap-4 bg-white dark:bg-slate-950 p-2 rounded-xl border border-blue-100/50 dark:border-slate-850">
                    <SmaLogo className="h-6" />
                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
                    <img src="/logo1.png" alt="SMA Logo" className="h-6 object-contain rounded" />
                  </div>
                </div>
              </div>

              {/* Broadcast Announcements from Super Admin */}
              {announcements.length > 0 && (
                <div className="space-y-3">
                  {announcements.map((ann) => (
                    <div 
                      key={ann.id} 
                      className={`p-4 border rounded-xl flex items-start gap-3 shadow-sm transition-all ${
                        ann.type === "Warning" 
                          ? "bg-danger/10 text-danger border-danger/25 dark:bg-red-950/20 dark:text-red-405 dark:border-red-900/40" 
                          : ann.type === "Update"
                          ? "bg-primary/10 text-primary border-primary/25 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40"
                          : "bg-accent/10 text-accent border-accent/25 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40"
                      }`}
                    >
                      {ann.type === "Warning" ? (
                        <ShieldAlert className="w-5 h-5 text-danger dark:text-red-450 shrink-0 mt-0.5" />
                      ) : ann.type === "Update" ? (
                        <RefreshCw className="w-4 h-4 text-primary dark:text-blue-400 shrink-0 mt-1" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-accent dark:text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm">{ann.title}</h4>
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                            {ann.type}
                          </span>
                        </div>
                        <p className="text-xs font-medium opacity-90 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                        <span className="text-[9px] font-bold opacity-60 block">
                          {new Date(ann.created_at).toLocaleDateString(lang === "so" ? "so-SO" : "en-US", {
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Top Banner Alert if admissions closed */}
               {school.admission_status === "Closed" && (
                <div className="p-4 bg-danger/10 text-danger border border-danger/20 rounded-xl flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-semibold">Diiwangelintu hadda waa xiran tahay. Waalidiintu ma qabsan karaan ballamo cusub.</span>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl p-5 shadow-soft">
                  <div className="flex items-center justify-between text-textSecondary dark:text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">{lang === "so" ? "Dhammaan" : "Total"}</span>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-3xl font-extrabold text-textPrimary dark:text-slate-100">{stats.total}</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl p-5 shadow-soft">
                  <div className="flex items-center justify-between text-warning mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">{lang === "so" ? "Sugaya" : "Pending"}</span>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-3xl font-extrabold text-warning">{stats.pending}</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl p-5 shadow-soft">
                  <div className="flex items-center justify-between text-accent mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">{lang === "so" ? "La Oggolaaday" : "Approved"}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-3xl font-extrabold text-accent">{stats.approved}</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl p-5 shadow-soft">
                  <div className="flex items-center justify-between text-amber-700 dark:text-amber-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">{lang === "so" ? "Liiska Sugitaanka" : "Waiting List"}</span>
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-3xl font-extrabold text-amber-700 dark:text-amber-500">{stats.waiting}</div>
                </div>
              </div>

              {/* Recharts Analytics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Appointments Over Days */}
                <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-card shadow-soft p-5 space-y-3">
                  <h3 className="text-xs font-bold text-textPrimary dark:text-slate-200 uppercase tracking-wider border-b border-border dark:border-slate-800 pb-2">
                    {lang === "so" ? "Mashquulka Maalmaha (Appointments per Day)" : "Daily Registration Load"}
                  </h3>
                  <div className="h-64">
                    {dayData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-textSecondary dark:text-slate-400 italic">
                        {lang === "so" ? "Ma jiraan xog ku filan." : "Not enough daily data."}
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dayData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                          <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }} />
                          <Line type="monotone" dataKey="Ballamaha" name={lang === "so" ? "Ballamaha" : "Appointments"} stroke="#0f4c81" strokeWidth={3} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Chart 2: Grade Distribution */}
                <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-card shadow-soft p-5 space-y-3">
                  <h3 className="text-xs font-bold text-textPrimary dark:text-slate-200 uppercase tracking-wider border-b border-border dark:border-slate-800 pb-2">
                    {lang === "so" ? "Falanqaynta Fasallada (Grade Distribution)" : "Grade Distribution"}
                  </h3>
                  <div className="h-64">
                    {gradeData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-textSecondary dark:text-slate-400 italic">
                        {lang === "so" ? "Ma jiraan xog ku filan." : "Not enough grade data."}
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={gradeData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} interval={0} angle={-30} textAnchor="end" height={45} />
                          <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }} />
                          <Bar dataKey="Codsiyo" name={lang === "so" ? "Codsiyada" : "Applications"} fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Chart 3: Peak Hours Load */}
                <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-card shadow-soft p-5 space-y-3 lg:col-span-2">
                  <h3 className="text-xs font-bold text-textPrimary dark:text-slate-200 uppercase tracking-wider border-b border-border dark:border-slate-800 pb-2">
                    {lang === "so" ? "Saacadaha Mashquulka Badan (Peak Hours Load)" : "Peak Hours Load"}
                  </h3>
                  <div className="h-64">
                    {hourData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-textSecondary dark:text-slate-400 italic">
                        {lang === "so" ? "Ma jiraan xog ku filan." : "Not enough peak hours data."}
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={hourData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                          <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }} />
                          <Bar dataKey="Tirada" name={lang === "so" ? "Tirada" : "Total"} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Actions / Quick list */}
              <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-card shadow-soft p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-border dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-base text-textPrimary">{lang === "so" ? "Ballamihii Sugayay ee Ugu Dambeeyay" : "Recent Pending Appointments"}</h3>
                  <button 
                    onClick={() => setActiveTab("appointments")}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Eeg Dhammaan
                  </button>
                </div>

                {appointments.filter(a => a.status === "Pending").length === 0 ? (
                  <div className="text-center py-8 text-textSecondary text-sm font-medium">
                    Ma jiraan ballamo sugaya oggolaansho oo hadda muuqda.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {appointments.filter(a => a.status === "Pending").slice(0, 5).map(app => (
                      <div key={app.id} className="py-3.5 flex items-center justify-between text-sm">
                        <div className="space-y-1">
                          <div className="font-bold text-textPrimary">{app.student_name} <span className="text-xs font-normal text-textSecondary">({app.grade_applying_for})</span></div>
                          <div className="text-xs text-textSecondary">Waalidka: {app.parent_name} | Taariikhda: {app.appointment_date.split("T")[0]} saacadu marka ay tahay {app.appointment_time.slice(0, 5)}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleUpdateStatus(app.id, "Approved")}
                            disabled={actionLoadingId === app.id}
                            className="p-1.5 bg-accent/10 text-accent hover:bg-accent hover:text-white rounded-lg transition-all"
                            title="Oggolow"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(app.id, "Rejected")}
                            disabled={actionLoadingId === app.id}
                            className="p-1.5 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-lg transition-all"
                            title="Diid"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Appointments Management */}
          {activeTab === "appointments" && (
            <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-card shadow-soft p-6 space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-xl font-extrabold text-textPrimary">{lang === "so" ? "Maamul Ballamaha" : "Manage Appointments"}</h2>
                <button 
                  onClick={exportCSV}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" /> {lang === "so" ? "Soo Degso CSV" : "Export CSV"}
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-textSecondary" />
                  <input 
                    type="text" 
                    placeholder={lang === "so" ? "Ku raadi magaca ardayga ama waalidka..." : "Search by student or parent..."} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-background border border-border dark:border-slate-850 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-textPrimary dark:text-slate-100"
                  />
                </div>

                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-background border border-border dark:border-slate-850 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-textPrimary dark:text-slate-100"
                >
                  <option value="">{lang === "so" ? "Dhammaan Xaaladaha" : "All Statuses"}</option>
                  <option value="Pending">{lang === "so" ? "Sugaya" : "Pending"}</option>
                  <option value="Approved">{lang === "so" ? "La Oggolaaday" : "Approved"}</option>
                  <option value="Rejected">{lang === "so" ? "La Diiday" : "Rejected"}</option>
                  <option value="Cancelled">{lang === "so" ? "La Joojiyay" : "Cancelled"}</option>
                  <option value="Attended">{lang === "so" ? "Yimid (Attended)" : "Attended"}</option>
                </select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-border dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850 border-b border-border dark:border-slate-800 text-xs font-bold text-textSecondary dark:text-slate-400 uppercase tracking-wider">
                      <th className="p-4">{lang === "so" ? "Lambar" : "Number"}</th>
                      <th className="p-4">{lang === "so" ? "Ardayga" : "Student"}</th>
                      <th className="p-4">{lang === "so" ? "Faahfaahinta Waalidka" : "Parent Details"}</th>
                      <th className="p-4">{lang === "so" ? "Taariikhda & Saacadda" : "Date & Time"}</th>
                      <th className="p-4">{lang === "so" ? "Xaaladda" : "Status"}</th>
                      <th className="p-4 text-right">{lang === "so" ? "Tallaabooyinka" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-slate-800">
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-textSecondary dark:text-slate-400 font-medium">
                          {lang === "so" ? "Wax ballamo ah lama helin." : "No appointments found."}
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-textPrimary dark:text-slate-100">
                          <td className="p-4 font-bold text-primary dark:text-blue-400 text-xs">{app.appointment_number}</td>
                          <td className="p-4">
                            <div className="font-semibold">{app.student_name}</div>
                            <div className="text-xs text-textSecondary dark:text-slate-400">
                              {app.gender === "Male" ? (lang === "so" ? "Wiil" : "Male") : (lang === "so" ? "Gabar" : "Female")} | {app.grade_applying_for}
                            </div>
                          </td>
                          <td className="p-4 text-xs">
                            <div className="font-semibold">{app.parent_name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-textSecondary dark:text-slate-400">{app.phone_number}</span>
                              <a 
                                href={getWhatsAppTemplateLink(app)}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1 bg-emerald-105 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 rounded transition-colors flex items-center justify-center border border-emerald-200/40"
                                title={lang === "so" ? "Ku dir WhatsApp Somali Template" : "Send WhatsApp Somali Notification"}
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            </div>
                            <div className="text-textSecondary dark:text-slate-400 break-all">{app.email}</div>
                            
                            {/* Inline Admin Directive Note */}
                            {user.role === "Admin" && (
                              <div className="mt-2.5 space-y-1 max-w-[180px]">
                                <div className="text-[9px] font-bold text-primary dark:text-blue-400 uppercase tracking-wider">Amarka Check-in (Directive):</div>
                                <div className="flex gap-1.5">
                                  <input 
                                    type="text"
                                    defaultValue={app.admin_note || ""}
                                    placeholder={lang === "so" ? "Tusaale: Reject sii / Xafiiska u dir" : "e.g., Reject / Send to office"}
                                    onBlur={(e) => handleSaveAppointmentNote(app.id, e.target.value)}
                                    className="px-2 py-1 bg-background border border-border dark:border-slate-800 rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-primary w-full text-textPrimary dark:text-slate-200"
                                  />
                                  {noteSavingId === app.id && <RefreshCw className="w-3 h-3 animate-spin self-center text-primary" />}
                                </div>
                              </div>
                            )}
                            {user.role === "Scanner" && app.admin_note && (
                              <div className="mt-2 text-[10px] bg-danger/10 border border-danger/25 text-danger px-2 py-1 rounded font-bold">
                                Amarka: {app.admin_note}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-xs font-medium">
                            <div>{app.appointment_date.split("T")[0]}</div>
                            <div className="text-textSecondary dark:text-slate-400">{app.appointment_time.slice(0, 5)}</div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${getStatusBadgeClass(app.status)}`}>
                              {app.status === "Pending" ? (lang === "so" ? "Sugaya" : "Pending") :
                               app.status === "Approved" ? (lang === "so" ? "La Oggolaaday" : "Approved") :
                               app.status === "Rejected" ? (lang === "so" ? "La Diiday" : "Rejected") :
                               app.status === "Cancelled" ? (lang === "so" ? "La Joojiyay" : "Cancelled") :
                               app.status === "Attended" ? (lang === "so" ? "Yimid" : "Attended") :
                               app.status === "WaitingList" ? (lang === "so" ? "Liiska Sugitaanka" : "Waiting List") : app.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {app.status === "Pending" && (
                              <div className="flex justify-end gap-1.5">
                                <button 
                                  onClick={() => handleUpdateStatus(app.id, "Approved")}
                                  disabled={actionLoadingId === app.id}
                                  className="p-1.5 bg-accent/15 hover:bg-accent text-accent hover:text-white rounded-lg transition-all"
                                  title="Oggolow"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleUpdateStatus(app.id, "Rejected")}
                                  disabled={actionLoadingId === app.id}
                                  className="p-1.5 bg-danger/15 hover:bg-danger text-danger hover:text-white rounded-lg transition-all"
                                  title="Diid"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                            {app.status !== "Pending" && (
                              <span className="text-xs text-textSecondary dark:text-slate-400 italic">{lang === "so" ? "La Dhammaystiray" : "Completed"}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Calendar Tab View */}
          {activeTab === "calendar" && (
            <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-card shadow-soft p-6 space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-textPrimary">
                    {lang === "so" ? "Kalandarka Ballamaha" : "Appointments Calendar"}
                  </h2>
                  <p className="text-xs text-textSecondary dark:text-slate-400">
                    {lang === "so"
                      ? "Guudmarka ballamaha maalinlaha ah, maalmaha la xiray/fasaxyada, iyo maamulka boosaska."
                      : "Overview of daily appointments, blocked holidays, and student slot management."}
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-border dark:border-slate-700">
                  <button
                    onClick={() => {
                      if (calendarMonth === 0) {
                        setCalendarMonth(11);
                        setCalendarYear(prev => prev - 1);
                      } else {
                        setCalendarMonth(prev => prev - 1);
                      }
                    }}
                    className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-textPrimary transition-all font-bold text-xs"
                  >
                    &larr;
                  </button>
                  <span className="px-3 text-xs font-extrabold text-textPrimary uppercase tracking-wider min-w-[120px] text-center select-none">
                    {lang === "so"
                      ? `${["Jannaayo", "Febraayo", "Maarso", "Abriil", "Mayo", "Juun", "Luulyo", "Agoosto", "Sebteembar", "Oktoobar", "Nofeembar", "Diseembar"][calendarMonth]} ${calendarYear}`
                      : `${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][calendarMonth]} ${calendarYear}`}
                  </span>
                  <button
                    onClick={() => {
                      if (calendarMonth === 11) {
                        setCalendarMonth(0);
                        setCalendarYear(prev => prev + 1);
                      } else {
                        setCalendarMonth(prev => prev + 1);
                      }
                    }}
                    className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-textPrimary transition-all font-bold text-xs"
                  >
                    &rarr;
                  </button>
                </div>
              </div>

              {/* Grid Calendar */}
              <div>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-2 text-center mb-2">
                  {(lang === "so" ? ["Axd", "Isn", "Tal", "Arb", "Kha", "Jim", "Sab"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]).map(day => (
                    <div key={day} className="text-[10px] font-extrabold text-textSecondary dark:text-slate-400 uppercase tracking-widest py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-2.5">
                  {/* Empty cell offsets */}
                  {Array.from({ length: new Date(calendarYear, calendarMonth, 1).getDay() }).map((_, idx) => (
                    <div key={`offset-${idx}`} className="aspect-square bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-dashed border-border/40 dark:border-slate-800/40"></div>
                  ))}

                  {/* Days */}
                  {Array.from({ length: new Date(calendarYear, calendarMonth + 1, 0).getDate() }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dateStr = `${calendarYear}-${(calendarMonth + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
                    const dayAppts = appointments.filter(a => a.appointment_date.split("T")[0] === dateStr && a.status !== "Cancelled");
                    const isBlocked = (school?.blockout_dates || []).includes(dateStr);

                    return (
                      <button
                        key={`day-${dayNum}`}
                        type="button"
                        onClick={() => setSelectedCalendarDate(dateStr)}
                        className={`aspect-square p-2 border rounded-xl flex flex-col justify-between items-start transition-all hover:scale-[1.02] active:scale-[0.98] ${
                          isBlocked
                            ? "bg-danger/5 border-danger/20 hover:bg-danger/10"
                            : "bg-white border-border hover:border-primary/40 hover:bg-slate-50/50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <span className={`text-xs font-bold ${isBlocked ? "text-danger" : "text-textPrimary"}`}>
                          {dayNum}
                        </span>

                        <div className="w-full space-y-1">
                          {isBlocked && (
                            <span className="block text-[8px] bg-danger/10 text-danger font-extrabold px-1 py-0.5 rounded text-center truncate uppercase tracking-wide">
                              {lang === "so" ? "Fasax" : "Blocked"}
                            </span>
                          )}
                          {dayAppts.length > 0 && (
                            <span className="block text-[9px] bg-primary/10 text-primary dark:bg-slate-800 dark:text-slate-200 font-extrabold px-1.5 py-0.5 rounded text-center truncate">
                              {dayAppts.length} {lang === "so" ? "Appt" : "Appts"}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Info Legend */}
              <div className="flex items-center gap-4 text-[10px] text-textSecondary dark:text-slate-400 font-semibold border-t border-border dark:border-slate-800 pt-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-white dark:bg-slate-900 border border-border dark:border-slate-800"></span>
                  <span>{lang === "so" ? "Maalmaha Furan" : "Available Days"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-danger/10 border border-danger/25"></span>
                  <span>{lang === "so" ? "Maalmaha Fasaxa (Blocked)" : "Holiday / Closures"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-primary/15 border border-primary/20"></span>
                  <span>{lang === "so" ? "Maalmaha Ballamaha Leh" : "Days with Appointments"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Appointment detail Modal/Sidebar when click date on calendar */}
          {selectedCalendarDate && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-card shadow-soft max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="p-5 border-b border-border dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-850">
                  <div>
                    <h3 className="text-base font-extrabold text-textPrimary">
                      {lang === "so" ? `Diiwangelinta: ${selectedCalendarDate}` : `Check-ins: ${selectedCalendarDate}`}
                    </h3>
                    <p className="text-xs text-textSecondary">
                      {lang === "so" ? "Ballamaha loo qorsheeyay taariikhdan maamuladooda." : "Appointments scheduled and slot status for this date."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCalendarDate(null)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-textSecondary hover:text-textPrimary transition-all text-sm font-bold"
                  >
                    &times; Close
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 flex-grow overflow-y-auto space-y-6">
                  {/* Action Header: Block/Unblock & PDF Download */}
                  <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-border dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-textSecondary">{lang === "so" ? "Xaaladda Maalinta:" : "Day Status:"}</span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        (school?.blockout_dates || []).includes(selectedCalendarDate)
                          ? "bg-danger/10 text-danger"
                          : "bg-accent/10 text-accent"
                      }`}>
                        {(school?.blockout_dates || []).includes(selectedCalendarDate)
                          ? (lang === "so" ? "Waa Fasax / Blocked" : "Blocked Holiday")
                          : (lang === "so" ? "Waa Furan tahay" : "Open for Bookings")}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Block/Unblock Button */}
                      <button
                        type="button"
                        onClick={() => toggleBlockoutDateInstant(selectedCalendarDate)}
                        className={`px-4 py-2 font-bold text-xs rounded-lg transition-all ${
                          (school?.blockout_dates || []).includes(selectedCalendarDate)
                            ? "bg-accent text-white hover:opacity-90"
                            : "bg-danger text-white hover:opacity-90"
                        }`}
                      >
                        {(school?.blockout_dates || []).includes(selectedCalendarDate)
                          ? (lang === "so" ? "Fura Maalintan" : "Unblock Date")
                          : (lang === "so" ? "Xir Maalintan" : "Block Date")}
                      </button>

                      {/* Download PDF Button */}
                      <button
                        type="button"
                        onClick={() => downloadCheckinPDF(selectedCalendarDate)}
                        className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-150 dark:text-slate-900 font-bold text-xs rounded-lg hover:opacity-90 transition-all flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {lang === "so" ? "Download PDF Report" : "Download PDF Report"}
                      </button>
                    </div>
                  </div>

                  {/* Appointments Table list */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-textSecondary uppercase tracking-wider block">
                      {lang === "so" ? "Liiska Ardayda Ballanta Leh" : "Scheduled Students List"}
                    </h4>

                    {appointments.filter(a => a.appointment_date.split("T")[0] === selectedCalendarDate && a.status !== "Cancelled").length === 0 ? (
                      <div className="text-center py-8 text-xs text-textSecondary italic bg-slate-50 dark:bg-slate-900/40 border border-border dark:border-slate-800 rounded-xl">
                        {lang === "so" ? "Ma jiraan ballamo loo qorsheeyay maalintan." : "No appointments scheduled for this date."}
                      </div>
                    ) : (
                      <div className="border border-border dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/45 text-textSecondary border-b border-border dark:border-slate-800 font-bold uppercase tracking-wider">
                              <th className="px-4 py-3">{lang === "so" ? "Ardayga" : "Student"}</th>
                              <th className="px-4 py-3">{lang === "so" ? "Fasalka" : "Grade"}</th>
                              <th className="px-4 py-3">{lang === "so" ? "Saacadda" : "Time Slot"}</th>
                              <th className="px-4 py-3">{lang === "so" ? "Waalidka & Phone" : "Parent & Phone"}</th>
                              <th className="px-4 py-3">{lang === "so" ? "Xaaladda" : "Status"}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appointments.filter(a => a.appointment_date.split("T")[0] === selectedCalendarDate && a.status !== "Cancelled").map((appt) => (
                              <tr key={appt.id} className="border-b border-border dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 font-semibold text-textPrimary dark:text-slate-105">
                                <td className="px-4 py-3.5">
                                  <div className="space-y-1">
                                    <div className="font-bold text-sm text-textPrimary">{appt.student_name}</div>
                                    <div className="text-[10px] text-textSecondary font-normal">ID: {appt.appointment_number}</div>
                                    {/* Render Custom Data answers if exist */}
                                    {appt.custom_data && Object.keys(appt.custom_data).length > 0 && (
                                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-border dark:border-slate-800 mt-1.5 space-y-1 text-[10px] text-textSecondary font-normal max-w-xs">
                                        <div className="font-bold text-[9px] uppercase tracking-wider text-primary dark:text-blue-400">Custom Answers:</div>
                                        {Object.entries(appt.custom_data).map(([lbl, val]) => (
                                          <div key={lbl} className="flex justify-between gap-2 border-b border-slate-100 dark:border-slate-850 pb-0.5 last:border-b-0">
                                            <span className="font-semibold">{lbl}:</span>
                                            <span>{String(val)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3.5">{appt.grade_applying_for}</td>
                                <td className="px-4 py-3.5">
                                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md font-bold text-[10px]">
                                    {appt.appointment_time.slice(0, 5)}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="space-y-0.5">
                                    <div>{appt.parent_name}</div>
                                    <div className="text-[10px] text-textSecondary font-normal">{appt.phone_number}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                    appt.status === "Approved" ? "bg-accent/10 text-accent" :
                                    appt.status === "Pending" ? "bg-warning/10 text-warning" :
                                    appt.status === "Attended" ? "bg-green-600/10 text-green-650" :
                                    "bg-danger/10 text-danger"
                                  }`}>
                                    {appt.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Waiting List Panel */}
          {activeTab === "waitingList" && (
            <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-card shadow-soft p-6 space-y-6 animate-fadeIn">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-textPrimary">{lang === "so" ? "Liiska Sugitaanka" : "Waiting List"}</h2>
                <p className="text-xs text-textSecondary dark:text-slate-400">
                  {lang === "so" 
                    ? "Ardaydan waxaa si automatic ah loogu daray liiska sugitaanka ka dib markii la gaaray xadkii maalinlaha ama saacadlaha ahaa ee iskuulka."
                    : "These students were automatically added to the waiting list when daily or hourly capacity was reached."}
                </p>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-border dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-sm border-collapse text-textPrimary dark:text-slate-200">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850 border-b border-border dark:border-slate-800 text-xs font-bold text-textSecondary dark:text-slate-400 uppercase tracking-wider">
                      <th className="p-4">{lang === "so" ? "Magaca Ardayga" : "Student Name"}</th>
                      <th className="p-4">{lang === "so" ? "Fasalka" : "Grade"}</th>
                      <th className="p-4">{lang === "so" ? "Faahfaahinta Waalidka" : "Parent Details"}</th>
                      <th className="p-4">{lang === "so" ? "La Gudbiyay" : "Submitted"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-slate-800">
                    {waitingList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-textSecondary dark:text-slate-400 font-medium">
                          {lang === "so" ? "Ma jiraan waalidiin hadda ku jira liiska sugitaanka." : "No entries on the waiting list."}
                        </td>
                      </tr>
                    ) : (
                      waitingList.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-semibold">{entry.student_name}</td>
                          <td className="p-4 font-medium">{entry.grade}</td>
                          <td className="p-4 text-xs">
                            <div className="font-semibold">{entry.parent_name}</div>
                            <div className="text-textSecondary dark:text-slate-400">{entry.phone_number}</div>
                          </td>
                          <td className="p-4 text-xs text-textSecondary dark:text-slate-400">
                            {new Date(entry.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 5: Scan & Verify (Attendance Check) */}
          {activeTab === "scanVerify" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              
              {/* Left Column: Scanner & Search Console */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-card shadow-soft p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border dark:border-slate-800 pb-4">
                    <div>
                      <h2 className="text-lg font-extrabold text-textPrimary">{lang === "so" ? "Qalabka Xaqiijinta Check-in" : "Check-in Validation Console"}</h2>
                      <p className="text-xs text-textSecondary dark:text-slate-400 mt-1">
                        {lang === "so" 
                          ? "Ku baar tigidhkada kamarada live-ka ah ama gacanta ku baaray si aad u calaamadiso joogitaanka ardayga."
                          : "Scan tickets with the live camera or search manually to check in students."}
                      </p>
                    </div>
                    
                    {/* Mode Selectors */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-border">
                      <button 
                        type="button"
                        onClick={() => {
                          setScanTabMode("search");
                          stopCamera();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          scanTabMode === "search" 
                            ? "bg-white dark:bg-slate-900 text-primary dark:text-blue-400 shadow-sm" 
                            : "text-textSecondary hover:text-textPrimary"
                        }`}
                      >
                        {lang === "so" ? "Gacanta (Search)" : "Manual Search"}
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setScanTabMode("camera");
                          startCamera();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          scanTabMode === "camera" 
                            ? "bg-white dark:bg-slate-900 text-primary dark:text-blue-400 shadow-sm" 
                            : "text-textSecondary hover:text-textPrimary"
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {lang === "so" ? "Sawiro QR Code" : "Scan QR Code"}
                      </button>
                    </div>
                  </div>

                  {/* Mode 1: Live QR Scanner Camera */}
                  {scanTabMode === "camera" && (
                    <div className="space-y-4">
                      {scannerActive ? (
                        <div className="relative w-full max-w-md mx-auto aspect-video bg-black rounded-xl overflow-hidden border border-border dark:border-slate-800 shadow-inner">
                           {/* Live Video element */}
                          <video id="scanner-video" className="w-full h-full object-cover" playsInline />
                          
                          {/* SMA System Scanner Watermark */}
                          <div className="absolute top-3 left-3 bg-slate-900/80 text-white backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 pointer-events-none">
                            <img src="/logo1.png" alt="SMA Logo" className="h-4 object-contain rounded" />
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-350">Scanner</span>
                          </div>

                          {/* Laser Scanner animation overlay */}
                          <div className="absolute inset-0 border-[3px] border-emerald-500/30 m-6 rounded-lg pointer-events-none flex items-center justify-center">
                            <div className="w-full h-0.5 bg-emerald-500 shadow-[0_0_10px_#10b981] animate-scannerLine absolute" />
                            <div className="w-12 h-12 border-t-2 border-l-2 border-emerald-400 absolute top-0 left-0" />
                            <div className="w-12 h-12 border-t-2 border-r-2 border-emerald-400 absolute top-0 right-0" />
                            <div className="w-12 h-12 border-b-2 border-l-2 border-emerald-400 absolute bottom-0 left-0" />
                            <div className="w-12 h-12 border-b-2 border-r-2 border-emerald-400 absolute bottom-0 right-0" />
                          </div>
                          
                          <button 
                            type="button"
                            onClick={stopCamera}
                            className="absolute bottom-3 right-3 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-md"
                          >
                            Xidh Kamarada
                          </button>
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/20 border border-dashed border-border rounded-xl space-y-3">
                          <Camera className="w-8 h-8 mx-auto text-textSecondary" />
                          <p className="text-xs text-textSecondary">{lang === "so" ? "Kamaradu hadda waa xiran tahay." : "Camera is currently inactive."}</p>
                          <button
                            type="button"
                            onClick={startCamera}
                            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover transition-all shadow-sm"
                          >
                            Daar Kamarada
                          </button>
                        </div>
                      )}

                      {/* QR Scan Simulation Panel (105% Robust local fallback for testing) */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-850 border border-border rounded-xl space-y-2.5">
                        <div className="text-[10px] font-bold text-primary dark:text-blue-400 uppercase tracking-wider">
                          Tijaabi Scanka (Simulate QR scan)
                        </div>
                        <div className="flex gap-2">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                playBeep();
                                stopCamera();
                                fetchApptByNumber(e.target.value);
                                e.target.value = "";
                              }
                            }}
                            className="flex-grow px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none text-textPrimary dark:bg-slate-800"
                          >
                            <option value="">-- Dooro Arday (Select Student) --</option>
                            {appointments.filter(a => a.status !== "Cancelled" && a.status !== "Rejected").map(a => (
                              <option key={a.id} value={a.appointment_number}>
                                {a.student_name} ({a.appointment_number})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mode 2: Manual Search & Fuzzy HUD */}
                  {scanTabMode === "search" && (
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-textSecondary" />
                        <input 
                          type="text"
                          placeholder={lang === "so" ? "Ku raadi Lambarka tigidhka, Ardayga, ama Taleefanka..." : "Search by Ticket ID, Student, or Phone..."}
                          value={scanSearchQuery}
                          onChange={(e) => setScanSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary text-textPrimary"
                        />
                      </div>

                      {/* Fuzzy search results */}
                      {scanSearchQuery.trim() !== "" && (
                        <div className="border border-border rounded-xl bg-slate-50 dark:bg-slate-850 divide-y divide-border max-h-60 overflow-y-auto">
                          {scanSearchResults.length === 0 ? (
                            <div className="p-4 text-xs text-textSecondary text-center italic">Arday ku habboon lama helin.</div>
                          ) : (
                            scanSearchResults.map(res => (
                              <div 
                                key={res.id}
                                onClick={() => {
                                  setScanSearchQuery("");
                                  fetchApptByNumber(res.appointment_number);
                                }}
                                className="p-3 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all text-xs"
                              >
                                <div className="space-y-1">
                                  <div className="font-bold text-textPrimary">{res.student_name} <span className="text-[10px] font-normal text-textSecondary">({res.grade_applying_for})</span></div>
                                  <div className="text-[10px] text-textSecondary">Waalidka: {res.parent_name} | Tel: {res.phone_number}</div>
                                </div>
                                <span className="text-[10px] font-bold text-primary dark:text-blue-400 bg-primary/10 px-2 py-0.5 rounded">
                                  {res.appointment_number}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {scanError && (
                    <div className="p-4 bg-danger/10 text-danger border border-danger/20 rounded-xl flex items-center gap-3 text-xs animate-shake">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>{scanError}</span>
                    </div>
                  )}

                  {scanSuccessMsg && (
                    <div className="p-4 bg-accent/10 text-accent border border-accent/20 rounded-xl flex items-center gap-3 text-xs">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span>{scanSuccessMsg}</span>
                    </div>
                  )}
                </div>

                {/* Scanned Appointment Details Card */}
                {scannedAppt && (
                  <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-card shadow-soft p-6 space-y-6 relative overflow-hidden animate-scaleUp">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-primary" />
                    
                    {/* Admin Directive Blinking Alert banner if note exists */}
                    {scannedAppt.admin_note && (
                      <div className="p-4 bg-red-600/10 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-2 border-red-500 rounded-xl flex items-start gap-3 animate-pulse">
                        <ShieldAlert className="w-6 h-6 shrink-0 text-red-500 mt-0.5" />
                        <div>
                          <div className="font-extrabold text-xs uppercase tracking-wider">{lang === "so" ? "AMARKA MAAMULKA (ADMIN DIRECTIVE)" : "HIGH PRIORITY ADMIN DIRECTIVE"}</div>
                          <p className="text-sm font-black mt-0.5 leading-relaxed">{scannedAppt.admin_note}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      {/* Details Column */}
                      <div className="space-y-4 flex-grow text-xs text-textPrimary dark:text-slate-200">
                        <div className="flex items-center justify-between border-b border-border dark:border-slate-800 pb-3">
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-lg text-textPrimary dark:text-slate-100">{scannedAppt.student_name}</h3>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg">
                              <img src="/logo1.png" alt="SMA Logo" className="h-4 object-contain rounded" />
                              <span className="text-[9px] font-bold text-textSecondary dark:text-slate-400 uppercase tracking-wider">Verified by SMA</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider bg-primary/10 text-primary dark:text-blue-450">{scannedAppt.appointment_number}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="text-[10px] text-textSecondary dark:text-slate-400 font-bold uppercase tracking-wider">{lang === "so" ? "Fasalka Uu Codsaday" : "Grade"}</div>
                            <div className="font-bold text-sm">{scannedAppt.grade_applying_for}</div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-[10px] text-textSecondary dark:text-slate-400 font-bold uppercase tracking-wider">{lang === "so" ? "Jinsiga" : "Gender"}</div>
                            <div className="font-bold text-sm">
                              {scannedAppt.gender === "Male" ? (lang === "so" ? "Wiil" : "Male") : (lang === "so" ? "Gabar" : "Female")}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-[10px] text-textSecondary dark:text-slate-400 font-bold uppercase tracking-wider">{lang === "so" ? "Magaca Waalidka" : "Parent"}</div>
                            <div className="font-bold text-sm">{scannedAppt.parent_name}</div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-[10px] text-textSecondary dark:text-slate-400 font-bold uppercase tracking-wider">{lang === "so" ? "Taleefanka & Email-ka" : "Contact"}</div>
                            <div className="font-bold text-sm">{scannedAppt.phone_number}</div>
                            <div className="text-[10px] text-textSecondary">{scannedAppt.email}</div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-[10px] text-textSecondary dark:text-slate-400 font-bold uppercase tracking-wider">{lang === "so" ? "Taariikhda Ballanta" : "Appointment Time"}</div>
                            <div className="font-bold text-sm text-accent">
                              {scannedAppt.appointment_date.split("T")[0]} | {scannedAppt.appointment_time.slice(0, 5)}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-[10px] text-textSecondary dark:text-slate-400 font-bold uppercase tracking-wider">{lang === "so" ? "Xaaladda Hadda" : "Status"}</div>
                            <div>
                              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${getStatusBadgeClass(scannedAppt.status)}`}>
                                {scannedAppt.status === "Pending" ? (lang === "so" ? "Sugaya" : "Pending") :
                                 scannedAppt.status === "Approved" ? (lang === "so" ? "La Oggolaaday" : "Approved") :
                                 scannedAppt.status === "Rejected" ? (lang === "so" ? "La Diiday" : "Rejected") :
                                 scannedAppt.status === "Cancelled" ? (lang === "so" ? "La Joojiyay" : "Cancelled") :
                                 scannedAppt.status === "WaitingList" ? (lang === "so" ? "Liiska Sugitaanka" : "Waiting List") :
                                 scannedAppt.status === "Attended" ? (lang === "so" ? "Ayuu Yimid" : "Attended") : scannedAppt.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Photo Column */}
                      { (scannedAppt as any).student_photo && (
                        <div className="w-28 h-28 bg-slate-100 border border-border dark:border-slate-800 rounded-xl overflow-hidden shrink-0 flex flex-col items-center justify-center relative self-center shadow-soft">
                          <img 
                            src={(scannedAppt as any).student_photo} 
                            alt="Student Profile" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {scannedAppt.status !== "Attended" ? (
                      <div className="pt-4 border-t border-border dark:border-slate-800 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleMarkAttended(scannedAppt.id)}
                          disabled={scanLoading}
                          className="px-5 py-2.5 bg-accent text-white font-bold text-xs rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                        >
                          <Check className="w-4 h-4" />
                          <span>{lang === "so" ? "U calaamadee inuu yimid (Verify Check-in)" : "Verify Check-in"}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="pt-4 border-t border-border dark:border-slate-800 flex justify-center text-accent text-xs font-bold gap-1.5 items-center">
                        <CheckCircle2 className="w-5 h-5 animate-pulse" />
                        <span>{lang === "so" ? "Ardaygu wuu yimid, waana la xaqiijiyay joogitaankiisa!" : "Student attendance has been verified!"}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Chat Box & Live Check-in Feed */}
              <div className="space-y-6">
                
                {/* 1. Live Chat Console (Admin <-> Scanner operator) */}
                <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-card shadow-soft p-5 flex flex-col h-[380px] justify-between">
                  <div className="border-b border-border dark:border-slate-800 pb-2.5">
                    <h3 className="font-extrabold text-xs text-textPrimary uppercase tracking-wider flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-primary" />
                      {lang === "so" ? "Isgaarsiinta Qolka Scanka" : "Console Chat Messages"}
                    </h3>
                  </div>

                  {/* Messages list */}
                  <div className="flex-grow overflow-y-auto my-3 space-y-3 pr-1 text-xs">
                    {messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[10px] text-textSecondary italic text-center">
                        {lang === "so" ? "Ma jiraan fariimo dhexmaray maamulka iyo scanner-ka." : "No messages. Type below to chat."}
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.sender_id === user.id;
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col max-w-[85%] ${
                              isMe ? "ml-auto items-end" : "mr-auto items-start"
                            }`}
                          >
                            <span className="text-[9px] text-textSecondary font-bold px-1 mb-0.5">{msg.sender_name}</span>
                            <div 
                              className={`p-2.5 rounded-2xl ${
                                isMe 
                                  ? "bg-primary text-white rounded-tr-none" 
                                  : "bg-slate-100 dark:bg-slate-800 text-textPrimary rounded-tl-none border border-border"
                              }`}
                            >
                              <p className="leading-relaxed font-semibold break-words whitespace-pre-wrap">{msg.message}</p>
                            </div>
                            <span className="text-[8px] text-textSecondary/70 px-1 mt-0.5">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Message Send Form */}
                  <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-border dark:border-slate-800 pt-2.5">
                    <input 
                      type="text" 
                      placeholder={lang === "so" ? "Qor fariin..." : "Type a message..."}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-grow px-3 py-2 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary text-textPrimary"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-all shadow-sm shrink-0 flex items-center justify-center"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                {/* 2. Today's checked-in feed */}
                <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-card shadow-soft p-5 space-y-4">
                  <div className="border-b border-border dark:border-slate-800 pb-2.5 flex justify-between items-center">
                    <h3 className="font-extrabold text-xs text-textPrimary uppercase tracking-wider">
                      {lang === "so" ? "Ardayda Timid Maanta" : "Checked-in Today"}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => downloadCheckinPDF(new Date().toISOString().split("T")[0])}
                        title={lang === "so" ? "Daabac PDF-ka Maanta" : "Download Today's PDF Check-in List"}
                        className="p-1 text-textSecondary hover:text-primary transition-colors hover:bg-slate-100 dark:hover:bg-slate-850 rounded"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 py-0.5 bg-accent/15 text-accent text-[10px] font-bold rounded">
                        {appointments.filter(a => a.status === "Attended" && a.appointment_date.split("T")[0] === new Date().toISOString().split("T")[0]).length}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-48 overflow-y-auto text-xs pr-1">
                    {appointments.filter(a => a.status === "Attended" && a.appointment_date.split("T")[0] === new Date().toISOString().split("T")[0]).length === 0 ? (
                      <div className="text-[10px] text-textSecondary italic py-2 text-center">{lang === "so" ? "Ma jiraan arday maanta la check-in garaysay." : "No check-ins today yet."}</div>
                    ) : (
                      appointments.filter(a => a.status === "Attended" && a.appointment_date.split("T")[0] === new Date().toISOString().split("T")[0]).map(app => (
                        <div key={app.id} className="p-2.5 rounded-lg border border-border bg-slate-50 dark:bg-slate-800/35 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-textPrimary">{app.student_name}</div>
                            <div className="text-[9px] text-textSecondary">{app.grade_applying_for} | {app.appointment_time.slice(0, 5)}</div>
                          </div>
                          <span className="text-[9px] font-bold text-accent uppercase">{lang === "so" ? "Ayuu Yimid" : "Checked-in"}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Admission Settings */}
          {activeTab === "settings" && (
            <div className="bg-white border border-border rounded-card shadow-soft p-6 space-y-6 animate-fadeIn">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-textPrimary">Habaynta Ballamaha Diiwangelinta</h2>
                <p className="text-xs text-textSecondary">
                  Cusboonaysii xadka iskuulkaaga, faahfaahinta, iyo xaaladda.
                </p>
              </div>

              {saveMessage && (
                <div className="p-4 bg-accent/10 text-accent border border-accent/20 rounded-xl text-sm flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Habaynta iskuulka waa lagu guuleystay!</span>
                </div>
              )}

              {saveError && (
                <div className="p-4 bg-danger/10 text-danger border border-danger/20 rounded-xl text-sm flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* School Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-textPrimary">Magaca Iskuulka</label>
                    <input 
                      type="text" 
                      value={school.name}
                      onChange={(e) => setSchool({ ...school, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  {/* Logo Upload & Preview */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-textPrimary">Logo-ga Iskuulka (School Logo)</label>
                    <div className="flex items-center gap-4 p-4 bg-background border border-border rounded-xl">
                      <div className="w-16 h-16 rounded-xl border border-border flex items-center justify-center overflow-hidden shrink-0 bg-slate-50 dark:bg-slate-900">
                        {school.logo_url ? (
                          <img src={school.logo_url} alt="School Logo" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-base font-extrabold uppercase" style={{
                            background: `linear-gradient(135deg, ${getRandomColor(school.name)})`
                          }}>
                            {getInitials(school.name)}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5 flex-grow">
                        <div className="flex gap-2">
                          <label className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm">
                            {lang === "so" ? "Soo Geli Sawir" : "Upload Image"}
                            <input 
                              type="file" 
                              accept="image/*"
                              className="hidden" 
                              onChange={(e) => handleLogoUpload(e, (base64) => setSchool({ ...school, logo_url: base64 }))} 
                            />
                          </label>
                          {school.logo_url && (
                            <button
                              type="button"
                              onClick={() => setSchool({ ...school, logo_url: null })}
                              className="px-3 py-1.5 bg-danger/10 hover:bg-danger text-danger hover:text-white text-xs font-bold rounded-lg transition-colors border border-danger/20"
                            >
                              {lang === "so" ? "Tirtir" : "Remove"}
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-textSecondary dark:text-slate-400">
                          {lang === "so" ? "Kaliya sawirro (PNG, JPG) ilaa 5MB. Si toos ah ayaa loo hagaajinayaa." : "Only images (PNG, JPG) up to 5MB. Will be resized automatically."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-textPrimary">Cinwaanka</label>
                    <input 
                      type="text" 
                      value={school.address}
                      onChange={(e) => setSchool({ ...school, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  {/* WhatsApp/Phone contact */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-textPrimary">Taleefanka WhatsApp-ka</label>
                    <input 
                      type="text" 
                      value={school.phone}
                      onChange={(e) => setSchool({ ...school, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  {/* School Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-textPrimary">Email-ka Iskuulka</label>
                    <input 
                      type="email" 
                      value={school.email}
                      onChange={(e) => setSchool({ ...school, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-textPrimary">Faahfaahinta Iskuulka</label>
                  <textarea 
                    value={school.description || ""}
                    onChange={(e) => setSchool({ ...school, description: e.target.value })}
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-y"
                  />
                </div>

                {/* Capacity Configurations */}
                <div className="border-t border-border pt-6 space-y-4">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Habaynta Awoodda & Diiwangelinta</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Admission Status */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-textPrimary">Xaaladda Diiwangelinta</label>
                      <select 
                        value={school.admission_status}
                        onChange={(e) => setSchool({ ...school, admission_status: e.target.value as "Open" | "Closed" })}
                        className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      >
                        <option value="Open">Furan</option>
                        <option value="Closed">Xiran</option>
                      </select>
                    </div>

                    {/* Max per day */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-textPrimary">Ballamaha ugu badan Maalintii</label>
                      <input 
                        type="number" 
                        value={school.max_appointments_per_day}
                        onChange={(e) => setSchool({ ...school, max_appointments_per_day: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                    </div>

                    {/* Max per hour */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-textPrimary">Ballamaha ugu badan Saacaddii</label>
                      <input 
                        type="number" 
                        value={school.max_appointments_per_hour}
                        onChange={(e) => setSchool({ ...school, max_appointments_per_hour: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Working Days and Time Slots */}
                <div className="border-t border-border pt-6 space-y-4">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Maalmaha Shaqada & Saacadaha Furan</h3>
                  
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-textPrimary">Maalmaha Shaqada</label>
                    <div className="flex flex-wrap gap-3">
                      {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => {
                        const dayMapSo: Record<string, string> = {
                          "Sunday": "Axad", "Monday": "Isniin", "Tuesday": "Talaado", "Wednesday": "Arbaco", "Thursday": "Khamiis", "Friday": "Jimco", "Saturday": "Sabti"
                        };
                        return (
                          <label key={day} className="flex items-center gap-2 text-sm bg-slate-50 px-3 py-2 rounded-lg border border-border cursor-pointer hover:bg-slate-100">
                            <input 
                              type="checkbox" 
                              checked={(school.working_days || []).includes(day)}
                              onChange={(e) => {
                                const currentDays = school.working_days || [];
                                setSchool({
                                  ...school,
                                  working_days: e.target.checked 
                                    ? [...currentDays, day]
                                    : currentDays.filter(d => d !== day)
                                });
                              }}
                              className="rounded text-primary focus:ring-primary"
                            />
                            <span className="text-textPrimary">{dayMapSo[day]}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interactive Time Slot Builder */}
                  <div className="space-y-4 pt-4 border-t border-border dark:border-slate-800">
                    <div>
                      <label className="text-xs font-bold text-textPrimary block">
                        {lang === "so" ? "Saacadaha Shaqada ee Furan" : "Available Time Slots"}
                      </label>
                      <p className="text-[11px] text-textSecondary dark:text-slate-400">
                        {lang === "so"
                          ? "Ku dar saacadaha aad aqbashaan ballamaha, adigoo u kala saaraya subaxdii (AM) iyo galabta (PM)."
                          : "Configure time slots parents can select during booking, split by AM and PM."}
                      </p>
                    </div>

                    {/* Pre-defined Standard Hours Grid */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block">
                        {lang === "so" ? "Saacadaha Caadiga ah (Guji si aad u doorato)" : "Standard Hours (Click to toggle)"}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {[
                          { val: "08:00 AM", so: "08:00 Subaxnimo" },
                          { val: "09:00 AM", so: "09:00 Subaxnimo" },
                          { val: "10:00 AM", so: "10:00 Subaxnimo" },
                          { val: "11:00 AM", so: "11:00 Barqonimo" },
                          { val: "12:00 PM", so: "12:00 Duhurnimo" },
                          { val: "01:00 PM", so: "01:00 Galabnimo" },
                          { val: "02:00 PM", so: "02:00 Galabnimo" },
                          { val: "03:00 PM", so: "03:00 Galabnimo" },
                          { val: "04:00 PM", so: "04:00 Galabnimo" },
                          { val: "05:00 PM", so: "05:00 Galabnimo" }
                        ].map(slot => {
                          const currentSlots = school.time_slots || [];
                          const isSelected = currentSlots.includes(slot.val);
                          return (
                            <button
                              key={slot.val}
                              type="button"
                              onClick={() => {
                                setSchool({
                                  ...school,
                                  time_slots: isSelected 
                                    ? currentSlots.filter(s => s !== slot.val)
                                    : [...currentSlots, slot.val].sort()
                                });
                              }}
                              className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all flex flex-col items-center justify-center text-center ${
                                isSelected 
                                  ? "bg-primary border-primary text-white shadow-sm"
                                  : "bg-background border-border dark:border-slate-800 text-textSecondary hover:border-primary/45"
                              }`}
                            >
                              <span className="text-[10px] opacity-75">{slot.val}</span>
                              <span className="text-[11px] font-sans font-semibold">{slot.so}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Time slot creator */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-border dark:border-slate-800 space-y-3">
                      <label className="text-[10px] font-bold text-textPrimary uppercase tracking-wider block">
                        {lang === "so" ? "Ku dar Saacad Kale oo Gaar ah" : "Add Custom Time Slot"}
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          {/* Hour */}
                          <select 
                            id="custom-slot-hour"
                            className="px-2 py-1.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-900 rounded-lg text-xs font-bold text-textPrimary"
                            defaultValue="08"
                          >
                            {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                          <span className="text-textSecondary">:</span>
                          {/* Minute */}
                          <select 
                            id="custom-slot-minute"
                            className="px-2 py-1.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-900 rounded-lg text-xs font-bold text-textPrimary"
                            defaultValue="00"
                          >
                            {["00", "15", "30", "45"].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                          {/* AM/PM */}
                          <select 
                            id="custom-slot-ampm"
                            className="px-2 py-1.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-900 rounded-lg text-xs font-bold text-textPrimary"
                            defaultValue="AM"
                          >
                            <option value="AM">AM (Subax/Barqo)</option>
                            <option value="PM">PM (Duhur/Galab)</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const hr = (document.getElementById("custom-slot-hour") as HTMLSelectElement).value;
                            const min = (document.getElementById("custom-slot-minute") as HTMLSelectElement).value;
                            const ampm = (document.getElementById("custom-slot-ampm") as HTMLSelectElement).value;
                            const customVal = `${hr}:${min} ${ampm}`;
                            const currentSlots = school.time_slots || [];
                            if (!currentSlots.includes(customVal)) {
                              setSchool({
                                ...school,
                                time_slots: [...currentSlots, customVal].sort()
                              });
                            }
                          }}
                          className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 font-bold text-xs rounded-lg transition-all"
                        >
                          {lang === "so" ? "Ku Dar" : "Add Slot"}
                        </button>
                      </div>
                    </div>

                    {/* Display Currently selected slots */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block">
                        {lang === "so" ? "Saacadaha hadda kuu keydsan" : "Currently Selected Slots"}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(school.time_slots || []).length === 0 ? (
                          <span className="text-xs text-textSecondary italic">Maba jiraan saacado furan oo la doortay.</span>
                        ) : (
                          (school.time_slots || []).map(slot => (
                            <span 
                              key={slot}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg text-xs font-bold text-textPrimary"
                            >
                              <span>{slot}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSchool({
                                    ...school,
                                    time_slots: (school.time_slots || []).filter(s => s !== slot)
                                  });
                                }}
                                className="text-textSecondary hover:text-danger font-bold text-xs"
                                title="Delete Slot"
                              >
                                &times;
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1. Custom Fields Builder Section */}
                <div className="border-t border-border dark:border-slate-800 pt-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-textPrimary uppercase tracking-wider">
                      {lang === "so" ? "Habaynta Su'aalaha Foomka (Custom Fields)" : "Custom Booking Fields"}
                    </h4>
                    <p className="text-xs text-textSecondary">
                      {lang === "so" 
                        ? "U sameey su'aalo dheeri ah oo waalidku buuxin doono marka uu ballan qabsanayo (tusaale: Previous School, Father's Occupation)."
                        : "Configure additional questions parents must answer when booking an appointment."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-border dark:border-slate-800">
                    {/* Label Input */}
                    <div className="space-y-1.5 md:col-span-4">
                      <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block">
                        {lang === "so" ? "Magaca Godka (Label)" : "Field Label"}
                      </label>
                      <input
                        type="text"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        placeholder={lang === "so" ? "Tusaale: Previous School" : "e.g. Previous School"}
                        className="w-full px-3 py-2 bg-background border border-border dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary text-textPrimary dark:text-slate-100"
                      />
                    </div>

                    {/* Type Input */}
                    <div className="space-y-1.5 md:col-span-3">
                      <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block">
                        {lang === "so" ? "Nooca (Type)" : "Field Type"}
                      </label>
                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-background border border-border dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary text-textPrimary dark:text-slate-100"
                      >
                        <option value="text">{lang === "so" ? "Qoraal Gaaban (Text)" : "Text Input"}</option>
                        <option value="textarea">{lang === "so" ? "Qoraal Dheer (Textarea)" : "Text Area"}</option>
                        <option value="select">{lang === "so" ? "Ikhtiyaar Dooro (Select)" : "Select Dropdown"}</option>
                      </select>
                    </div>

                    {/* Options Input (visible only if type is select) */}
                    <div className="space-y-1.5 md:col-span-3">
                      <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block">
                        {lang === "so" ? "Ikhtiyaarada (Koma ku kala saar)" : "Options (Comma separated)"}
                      </label>
                      <input
                        type="text"
                        value={newFieldOptions}
                        onChange={(e) => setNewFieldOptions(e.target.value)}
                        disabled={newFieldType !== "select"}
                        placeholder="Yes, No, Other"
                        className="w-full px-3 py-2 bg-background border border-border dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary text-textPrimary dark:text-slate-100 disabled:opacity-50"
                      />
                    </div>

                    {/* Required Checkbox */}
                    <div className="flex items-center gap-2 pb-2 md:col-span-1">
                      <input
                        type="checkbox"
                        id="field_required"
                        checked={newFieldRequired}
                        onChange={(e) => setNewFieldRequired(e.target.checked)}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                      />
                      <label htmlFor="field_required" className="text-xs font-bold text-textPrimary cursor-pointer select-none">
                        {lang === "so" ? "Lama-huraan" : "Required"}
                      </label>
                    </div>

                    {/* Add Button */}
                    <div className="md:col-span-1">
                      <button
                        type="button"
                        onClick={addCustomField}
                        className="w-full py-2 bg-slate-900 text-white dark:bg-slate-150 dark:text-slate-900 font-bold text-xs rounded-lg hover:opacity-90 transition-all flex justify-center items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Display Currently Built Custom Fields */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block">
                      {lang === "so" ? "Godadka hadda kuu diyaarsan" : "Current Configured Fields"}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(school.custom_fields || []).length === 0 ? (
                        <span className="text-xs text-textSecondary italic">{lang === "so" ? "Maba jiraan godad foomka lagu daray." : "No custom fields added yet."}</span>
                      ) : (
                        (school.custom_fields || []).map((field, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl text-xs font-bold text-textPrimary"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span>{field.label}</span>
                                {field.required && (
                                  <span className="px-1.5 py-0.5 bg-danger/10 text-danger text-[9px] font-extrabold rounded uppercase">
                                    {lang === "so" ? "L/H" : "Req"}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-textSecondary font-normal capitalize">
                                Type: {field.type} {field.type === 'select' && `(${field.options?.join(', ')})`}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCustomField(idx)}
                              className="text-textSecondary hover:text-danger font-bold text-base"
                              title="Remove Field"
                            >
                              &times;
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Block-out Dates Manager Section */}
                <div className="border-t border-border dark:border-slate-800 pt-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-textPrimary uppercase tracking-wider">
                      {lang === "so" ? "Xir Taariikho Fasax ah (Block-out Dates)" : "Holiday Block-out Dates"}
                    </h4>
                    <p className="text-xs text-textSecondary">
                      {lang === "so" 
                        ? "Dooro taariikhaha fasaxa ah ee aadan rabin in ballan laga qabsado (tusaale: Ciidaha, Ciidul Fitr, Fasax Maalin gaar ah)."
                        : "Select specific calendar dates to block parents from booking appointments (e.g. public holidays or closures)."}
                    </p>
                  </div>

                  <div className="flex gap-3 items-end max-w-md bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-border dark:border-slate-800">
                    <div className="flex-grow space-y-1.5">
                      <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block">
                        {lang === "so" ? "Dooro Taariikhda" : "Select Date"}
                      </label>
                      <input
                        type="date"
                        value={newBlockoutDate}
                        onChange={(e) => setNewBlockoutDate(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary text-textPrimary dark:text-slate-100"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addBlockoutDate}
                      className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-150 dark:text-slate-900 font-bold text-xs rounded-lg hover:opacity-90 transition-all flex items-center gap-1.5 h-[34px]"
                    >
                      <Plus className="w-3.5 h-3.5" /> {lang === "so" ? "Xir Maalintan" : "Block Date"}
                    </button>
                  </div>

                  {/* Display Blocked-out Dates */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block">
                      {lang === "so" ? "Taariikhaha hadda xiran" : "Currently Blocked Dates"}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(school.blockout_dates || []).length === 0 ? (
                        <span className="text-xs text-textSecondary italic">{lang === "so" ? "Maba jiraan maalmo la xiray." : "No dates are blocked."}</span>
                      ) : (
                        (school.blockout_dates || []).map(date => (
                          <span
                            key={date}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-danger/10 border border-danger/25 dark:border-danger/30 rounded-lg text-xs font-bold text-danger"
                          >
                            <span>{date}</span>
                            <button
                              type="button"
                              onClick={() => removeBlockoutDate(date)}
                              className="text-danger hover:text-red-700 font-bold text-xs"
                              title="Remove Blockout"
                            >
                              &times;
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <button 
                    type="submit"
                    disabled={savingSettings}
                    className="px-6 py-3 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60"
                  >
                    {savingSettings ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Lagu guda jiraa kaydinta...
                      </>
                    ) : (
                      "Kaydi Habaynta"
                    )}
                  </button>
                </div>
              </form>

              {/* Staff Manager Section (Admin only) */}
              {user.role === "Admin" && (
                <div className="border-t border-border pt-8 mt-8 space-y-6">
                  <div>
                    <h3 className="text-base font-extrabold text-primary uppercase tracking-wider">{lang === "so" ? "Maamulayaasha Scanka (Staff Manager)" : "Staff Scanner Managers"}</h3>
                    <p className="text-xs text-textSecondary dark:text-slate-400">
                      {lang === "so" ? "U sameey ama ka tirtir akoonada shaqaalaha u xilsaaran scanka tigidhada." : "Create and manage accounts for staff members responsible for ticket scanning."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Register Form */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-border dark:border-slate-800 space-y-4 lg:col-span-1">
                      <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider">{lang === "so" ? "Ku dar Shaqaale Cusub" : "Add New Staff"}</h4>
                      
                      {staffError && <div className="text-xs text-danger font-bold animate-shake">{staffError}</div>}
                      {staffSuccess && <div className="text-xs text-accent font-bold animate-pulse">{staffSuccess}</div>}

                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-textPrimary block mb-1">{lang === "so" ? "Magaca Shaqaalaha" : "Staff Name"}</label>
                          <input 
                            type="text" 
                            placeholder={lang === "so" ? "Magaca Maamulaha Scanka" : "Enter staff name"}
                            value={staffName}
                            onChange={(e) => setStaffName(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary text-textPrimary dark:text-slate-100 dark:bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-textPrimary block mb-1">Email-ka</label>
                          <input 
                            type="email" 
                            placeholder="email@example.com"
                            value={staffEmail}
                            onChange={(e) => setStaffEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary text-textPrimary dark:text-slate-100 dark:bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-textPrimary block mb-1">Password-ka</label>
                          <input 
                            type="password" 
                            placeholder={lang === "so" ? "Ugu yaraan 6 xaraf" : "At least 6 characters"}
                            value={staffPassword}
                            onChange={(e) => setStaffPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary text-textPrimary dark:text-slate-100 dark:bg-slate-900"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleCreateStaff}
                          disabled={staffLoading}
                          className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{staffLoading ? (lang === "so" ? "Lagu jiraa abuurista..." : "Creating...") : (lang === "so" ? "Abuur Akoon Staff" : "Create Staff Account")}</span>
                        </button>
                      </div>
                    </div>

                    {/* Staff List */}
                    <div className="lg:col-span-2 space-y-4">
                      <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider">{lang === "so" ? `Akoonada Jira (${staffList.length})` : `Existing Staff accounts (${staffList.length})`}</h4>
                      
                      {staffList.length === 0 ? (
                        <div className="text-xs text-textSecondary italic py-4">{lang === "so" ? "Ma jiraan akoonno shaqaale oo la abuuray." : "No staff accounts created yet."}</div>
                      ) : (
                        <div className="divide-y divide-border dark:divide-slate-800 border border-border dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850/40 overflow-hidden">
                          {staffList.map(st => (
                            <div key={st.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                              <div className="space-y-0.5">
                                <div className="font-bold text-textPrimary">{st.name}</div>
                                <div className="text-textSecondary text-[10px]">{st.email} | Doorarka: {st.role}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteStaff(st.id)}
                                className="text-danger hover:underline font-bold text-[10px] uppercase tracking-wider"
                              >
                                {lang === "so" ? "Tirtir" : "Delete"}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Support Tickets (Help & Cabasho) */}
          {activeTab === "support" && (
            <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-card shadow-soft p-6 space-y-6 animate-fadeIn">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-textPrimary">{lang === "so" ? "Caawinaada & Cabashada" : "Support Help & Tickets"}</h2>
                <p className="text-xs text-textSecondary dark:text-slate-400">
                  {lang === "so"
                    ? "U soo dir su'aalo ama cabashooyin Super Admin-ka nidaamka."
                    : "Submit support inquiries or issues directly to the platform administrators."}
                </p>
              </div>

              {/* Message Banner for Success/Error */}
              {saveMessage && (
                <div className="p-4 bg-accent/10 text-accent border border-accent/20 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{saveMessage}</span>
                </div>
              )}
              {saveError && (
                <div className="p-4 bg-danger/10 text-danger border border-danger/20 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Submit Form */}
                <form onSubmit={handleCreateSupportTicket} className="lg:col-span-1 bg-slate-50 dark:bg-slate-850/40 p-5 rounded-xl border border-border dark:border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider">{lang === "so" ? "Gudbi Cabasho Cusub" : "Create Support Ticket"}</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-textPrimary block mb-1">{lang === "so" ? "Mowduuca" : "Subject"}</label>
                      <input 
                        type="text" 
                        required
                        placeholder={lang === "so" ? "Tusaale: Cillad dhinaca SMS-ka" : "Subject details"}
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary text-textPrimary dark:text-slate-100 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-textPrimary block mb-1">{lang === "so" ? "Farriinta Cabashada" : "Message details"}</label>
                      <textarea 
                        required
                        placeholder={lang === "so" ? "Sharaxaad ka bixi dhibaatada kugu dhacday..." : "Describe your request in detail..."}
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary text-textPrimary dark:text-slate-100 dark:bg-slate-900 resize-none"
                        rows={5}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={ticketLoading}
                      className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {ticketLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>{ticketLoading ? (lang === "so" ? "Lagu jiraa dirista..." : "Submitting...") : (lang === "so" ? "Gudbi Tikidhka" : "Submit Ticket")}</span>
                    </button>
                  </div>
                </form>

                {/* History List */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider">{lang === "so" ? `Diiwaanka Su'aalahaagii (${tickets.length})` : `Your Tickets History (${tickets.length})`}</h3>
                  
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {tickets.length === 0 ? (
                      <div className="text-xs text-textSecondary italic py-4">{lang === "so" ? "Ma jiraan wax cabashooyin ah oo aad gudbisay weli." : "You have not submitted any tickets yet."}</div>
                    ) : (
                      tickets.map(tk => {
                        const isPending = tk.status === "Pending";
                        return (
                          <div 
                            key={tk.id} 
                            className="p-4 border border-border dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 space-y-3 shadow-soft"
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    isPending ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  }`}>
                                    {isPending ? (lang === "so" ? "Sugaya" : "Pending") : (lang === "so" ? "La Xaliyay" : "Resolved")}
                                  </span>
                                  <h4 className="font-extrabold text-sm text-textPrimary">{tk.subject}</h4>
                                </div>
                                <span className="text-[9px] text-textSecondary">{new Date(tk.created_at).toLocaleString()}</span>
                              </div>
                            </div>
                            <p className="text-xs text-textSecondary bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-border dark:border-slate-800">{tk.message}</p>
                            
                            {tk.reply && (
                              <div className="pl-3 border-l-2 border-emerald-500 space-y-1">
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">{lang === "so" ? "Jawaabta" : "Reply"} (Super Admin):</span>
                                <p className="text-xs text-textSecondary bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/10 italic">"{tk.reply}"</p>
                                <span className="text-[9px] text-textSecondary">{tk.replied_at ? new Date(tk.replied_at).toLocaleString() : ""}</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
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
    </div>
  );
}
