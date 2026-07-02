"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  Download, 
  MapPin, 
  Building2, 
  Sparkles,
  RefreshCw,
  PhoneCall,
  Sun,
  Moon
} from "lucide-react";
import jsPDF from "jspdf";
import SmaLogo from "@/components/SmaLogo";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const loadImg = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

interface School {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  address: string;
  phone: string;
  email: string;
  admission_status: "Open" | "Closed";
}

interface AppointmentDetails {
  student_name: string;
  parent_name: string;
  phone_number: string;
  email: string;
  gender: string;
  grade_applying_for: string;
  appointment_date: string;
  appointment_time: string;
  student_age: string;
  student_photo: string;
}

const translations = {
  en: {
    selectSchool: "Select Your Desired School",
    searchPlaceholder: "Search by school name or location...",
    step: "Step",
    of: "of",
    studentDetails: "Student Details",
    studentName: "Student Full Name",
    studentGender: "Student Gender",
    parentDetails: "Parent Details",
    studentNamePlaceholder: "John Doe",
    studentAge: "Student Age",
    studentPhoto: "Student Photo (Optional)",
    uploadPhoto: "Upload Photo",
    photoUploaded: "Photo Uploaded successfully!",
    parentName: "Parent/Guardian Name",
    parentNamePlaceholder: "Jane Doe",
    phone: "WhatsApp/Phone Number",
    phonePlaceholder: "+252 61XXXXXXX",
    email: "Email Address",
    emailPlaceholder: "parent@example.com",
    grade: "Grade Applying For",
    date: "1. Choose Date",
    time: "2. Choose Time",
    next: "Next Step",
    chooseDateTime: "Choose Date & Time",
    back: "Back",
    submit: "Complete Booking",
    successTitle: "Appointment Booked Successfully!",
    waitingTitle: "Added to Waiting List",
    downloadTicket: "Download Admission Ticket",
    contactWhatsApp: "Contact School on WhatsApp",
    male: "Male",
    female: "Female",
    reviewTitle: "Review Appointment Details",
    confirmInfo: "Please confirm all details before submitting.",
    school: "School",
    student: "Student",
    parent: "Parent",
    dateTime: "Date & Time",
    schoolInfo: "Student & Parent Information",
    schoolInfoSub: "Registering for",
    scheduleTitle: "Schedule Admission Appointment",
    scheduleSub: "Select your preferred date and time slot.",
    reviewSub: "Verify your details before completing the booking.",
    waitlistMsg: "Admissions for this slot/day are currently full. You have been added to the waiting list.",
    ticketSub: "Official School Management Appointment System",
  },
  so: {
    selectSchool: "Dooro Iskuulka Aad Rabto",
    searchPlaceholder: "Ku raadi magaca iskuulka ama meesha uu ku yaalo...",
    step: "Tallaabada",
    of: "ee",
    studentDetails: "Xogta Ardayga",
    studentName: "Magaca Oo Buuxa ee Ardayga",
    studentGender: "Jinsiga Ardayga",
    parentDetails: "Xogta Waalidka",
    studentNamePlaceholder: "Tusaale: Maxamed Cali",
    studentAge: "Da'da Ardayga",
    studentPhoto: "Sawirka Ardayga (Optional)",
    uploadPhoto: "Soo geli sawirka",
    photoUploaded: "Sawirka waa la soo geliyay!",
    parentName: "Magaca Oo Buuxa ee Waalidka/Gargaaraha",
    parentNamePlaceholder: "Tusaale: Xaliimo Axmed",
    phone: "Taleefanka WhatsApp-ka",
    phonePlaceholder: "Tusaale: +252 61XXXXXXX",
    email: "Email-ka Waalidka",
    emailPlaceholder: "waalid@example.com",
    grade: "Fasalka Uu Codsanayo",
    date: "1. Dooro Taariikhda",
    time: "2. Dooro Saacadda",
    next: "Tallaabada Xigta",
    chooseDateTime: "Dooro Taariikhda & Saacadda",
    back: "Dib u laabo",
    submit: "Dhammaystir Ballanta",
    successTitle: "Ballanta Waa Lagu Guuleystay!",
    waitingTitle: "Waxaa Lagu Daray Liiska Sugitaanka (Waitlist)",
    downloadTicket: "Soo Degso Tigidhka Ballanta",
    contactWhatsApp: "Kala xiriir Iskuulka WhatsApp-ka",
    male: "Wiil",
    female: "Gabar",
    reviewTitle: "Hubi Xogta Ballanta",
    confirmInfo: "Fadlan xaqiiji dhamaan xogta ka hor inta aadan dirin.",
    school: "Iskuulka",
    student: "Ardayga",
    parent: "Waalidka",
    dateTime: "Taariikhda & Saacadda",
    schoolInfo: "Macluumaadka Ardayga iyo Waalidka",
    schoolInfoSub: "Codsiga iskuulka",
    scheduleTitle: "Jadwalee Ballanta Diiwangelinta",
    scheduleSub: "Dooro taariikhda iyo saacadda aad doorbidayso.",
    reviewSub: "Xaqiiji macluumaadkaaga ka hor inta aadan dhammaystirin ballanta.",
    waitlistMsg: "Booska maanta/saacadan waa buuxaa. Waxaa lagu daray liiska sugitaanka.",
    ticketSub: "Nidaamka Rasmiga ah ee Maamulka iyo Ballamaha Dugsiyada",
  }
};

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

export default function BookAppointmentPage() {
  // Steps: 1 = School Selection, 2 = Student & Parent Details, 3 = Date & Time, 4 = Review & Submit, 5 = Confirmation
  const [step, setStep] = useState(1);
  const [schools, setSchools] = useState<School[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState<"en" | "so">("so");
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

  interface Student {
    student_name: string;
    gender: string;
    grade_applying_for: string;
    student_age: string;
    student_photo: string;
  }

  // Form Details
  const [formData, setFormData] = useState<Partial<AppointmentDetails>>({
    parent_name: "",
    phone_number: "",
    email: "",
    appointment_date: "",
    appointment_time: "",
  });

  const [customData, setCustomData] = useState<Record<string, string>>({});

  const [students, setStudents] = useState<Student[]>([
    { student_name: "", gender: "Male", grade_applying_for: "Grade 1", student_age: "", student_photo: "" }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [bookingResult, setBookingResult] = useState<{
    status: "Success" | "WaitingList";
    appointment_number?: string;
    appointments?: any[];
    message?: string;
    whatsapp_number?: string;
    waiting_list?: any[];
  } | null>(null);

  const handleStudentChange = (index: number, field: keyof Student, value: string) => {
    setStudents(prev => prev.map((s, idx) => idx === index ? { ...s, [field]: value } : s));
  };

  const handleStudentPhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleStudentChange(index, "student_photo", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addStudentRow = () => {
    setStudents(prev => [...prev, { student_name: "", gender: "Male", grade_applying_for: "Grade 1", student_age: "", student_photo: "" }]);
  };

  const removeStudentRow = (index: number) => {
    if (students.length === 1) return;
    setStudents(prev => prev.filter((_, idx) => idx !== index));
  };

  const getQRDataUrl = (apptNum: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve("");
        }
      };
      img.onerror = () => resolve("");
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${apptNum}`;
    });
  };

  // Fetch schools
  useEffect(() => {
    async function loadSchools() {
      setLoadingSchools(true);
      try {
        const res = await fetch(`${API_BASE}/public/schools`);
        if (res.ok) {
          const data = await res.json();
          setSchools(data);
        } else {
          console.error("Failed to fetch schools");
        }
      } catch (err) {
        console.error("Error loading schools:", err);
      } finally {
        setLoadingSchools(false);
      }
    }
    loadSchools();
  }, []);

  const handleSchoolSelect = (school: School) => {
    if (school.admission_status === "Closed") return;
    setSelectedSchool(school);
    
    // Default to first time slot if available
    const slots = (school as any).time_slots || ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
    setFormData(prev => ({
      ...prev,
      appointment_time: slots[0] || ""
    }));

    setStep(2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, student_photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep2 = () => {
    if (!formData.parent_name?.trim()) {
      return lang === "so" ? "Magaca waalidka waa lama huraan" : "Parent name is required";
    }
    if (!formData.phone_number?.trim()) {
      return lang === "so" ? "Taleefanka WhatsApp-ka waa lama huraan" : "Phone number is required";
    }
    if (!formData.email?.trim()) {
      return lang === "so" ? "Email address waa lama huraan" : "Email address is required";
    }
    if (!formData.email.includes("@")) {
      return lang === "so" ? "Fadlan geli email sax ah" : "Please enter a valid email address";
    }

    // Validate custom fields
    if (selectedSchool && (selectedSchool as any).custom_fields) {
      for (const field of (selectedSchool as any).custom_fields) {
        if (field.required && !customData[field.label]?.trim()) {
          return lang === "so" 
            ? `Fadlan buuxi godka "${field.label}"` 
            : `Please fill out the field "${field.label}"`;
        }
      }
    }

    // Validate all students in sibling list
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const prefix = lang === "so" ? `Ardayga ${i + 1}: ` : `Student ${i + 1}: `;
      if (!s.student_name.trim()) {
        return prefix + (lang === "so" ? "Magaca ardayga waa lama huraan" : "Student name is required");
      }
      if (!s.student_age) {
        return prefix + (lang === "so" ? "Da'da ardayga waa lama huraan" : "Student age is required");
      }
      const ageNum = parseInt(s.student_age, 10);
      if (isNaN(ageNum) || ageNum <= 0) {
        return prefix + (lang === "so" ? "Fadlan geli da' sax ah" : "Please enter a valid age");
      }
    }
    return "";
  };

  const validateStep3 = () => {
    if (!formData.appointment_date) {
      return lang === "so" ? "Fadlan dooro taariikhda ballanta" : "Please choose an appointment date";
    }
    if (!formData.appointment_time) {
      return lang === "so" ? "Fadlan dooro saacadda ballanta" : "Please choose a preferred time slot";
    }
    const selectedDate = new Date(formData.appointment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return lang === "so" ? "Taariikhda ballanta ma noqon karto mid tagtay" : "Appointment date cannot be in the past";
    }

    // Check school blockout dates
    if (selectedSchool) {
      const blockoutDates = (selectedSchool as any).blockout_dates || [];
      const formattedDate = formData.appointment_date; // "YYYY-MM-DD"
      if (blockoutDates.includes(formattedDate)) {
        return lang === "so"
          ? "Fadlan naga raali noqo, taariikhdan waa maalin fasax ah oo ballantu xiran tahay. Fadlan dooro taariikh kale."
          : "Please excuse us, this date is blocked for holidays/closures. Please choose another date.";
      }
    }

    // Check school working days
    if (selectedSchool) {
      const days = (selectedSchool as any).working_days;
      if (days && Array.isArray(days) && days.length > 0) {
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayNamesSo = ["Axad", "Isniin", "Talaado", "Arbaco", "Khamiis", "Jimco", "Sabti"];
        const selectedDayName = dayNames[selectedDate.getDay()];
        const selectedDayNameSo = dayNamesSo[selectedDate.getDay()];
        if (!days.includes(selectedDayName)) {
          if (lang === "so") {
            const dayMapSo: Record<string, string> = {
              "Sunday": "Axad", "Monday": "Isniin", "Tuesday": "Talaado", "Wednesday": "Arbaco", "Thursday": "Khamiis", "Friday": "Jimco", "Saturday": "Sabti"
            };
            const daysSo = days.map(d => dayMapSo[d] || d);
            return `Fadlan naga raali noqo, maalintan (${selectedDayNameSo}) ma laha ballan furan. Maalmaha aan ballamaha diiwangelinta diyaar u nahay inaan kugu qaabilno waa: ${daysSo.join(", ")}. Fadlan dooro mid ka mid ah maalmahaas si aan kuugu adeegno. Waad ku mahadsan tahay dulqaadkaaga!`;
          }
          return `Please excuse us, this day (${selectedDayName}) does not have open slots. The days we accept registration appointments are: ${days.join(", ")}. Please choose one of these days so we can serve you. Thank you for your patience!`;
        }
      }
    }
    return "";
  };

  const handleNextStep = () => {
    if (step === 2) {
      const err = validateStep2();
      if (err) {
        setSubmitError(err);
        return;
      }
      setSubmitError("");
      setStep(3);
    } else if (step === 3) {
      const err = validateStep3();
      if (err) {
        setSubmitError(err);
        return;
      }
      setSubmitError("");
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    setSubmitError("");
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`${API_BASE}/public/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_id: selectedSchool.id,
          parent_name: formData.parent_name,
          phone_number: formData.phone_number,
          email: formData.email,
          appointment_date: formData.appointment_date,
          appointment_time: formData.appointment_time,
          students: students,
          custom_data: customData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to book appointment");
      }

      setBookingResult({
        status: data.status,
        appointment_number: data.appointment?.appointment_number,
        appointments: data.appointments || [data.appointment],
        message: data.message,
        whatsapp_number: data.whatsapp_number,
        waiting_list: data.waiting_list,
      });

      setStep(5);
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const generateGCalLink = (appt: any) => {
    if (!selectedSchool) return "";
    const start = new Date(`${appt.appointment_date.split('T')[0]}T${appt.appointment_time}`);
    const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 mins

    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatGCalDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = pad(date.getMonth() + 1);
      const dd = pad(date.getDate());
      const hh = pad(date.getHours());
      const min = pad(date.getMinutes());
      const ss = pad(date.getSeconds());
      return `${yyyy}${mm}${dd}T${hh}${min}${ss}`;
    };

    const dates = `${formatGCalDate(start)}/${formatGCalDate(end)}`;
    const text = encodeURIComponent(
      lang === "so" 
        ? `Ballan Diiwangelin: ${selectedSchool.name}` 
        : `Admission Appointment: ${selectedSchool.name}`
    );
    const details = encodeURIComponent(
      lang === "so"
        ? `Ku soo dhowow ${selectedSchool.name} si aad u dhammaystirto diiwangelinta ardayga ${appt.student_name}. Nambarka ballantaada waa ${appt.appointment_number}.`
        : `Welcome to ${selectedSchool.name} to complete admission registration for student ${appt.student_name}. Your appointment number is ${appt.appointment_number}.`
    );
    const location = encodeURIComponent(selectedSchool.address);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
  };

  // Generate Receipt PDF
  const downloadReceipt = async (appt: {
    appointment_number: string;
    student_name: string;
    gender: string;
    student_age?: string | number;
    grade_applying_for: string;
    student_photo?: string | null;
  }) => {
    if (!selectedSchool) return;

    // Fetch QR Code
    const qrDataUrl = await getQRDataUrl(appt.appointment_number);

    const doc = new jsPDF();
    
    // Brand Header
    doc.setFillColor(15, 76, 129); // Primary Color
    doc.rect(0, 0, 210, 40, "F");
    
    // Draw vector SMA Graduate Cap logo
    doc.setFillColor(255, 255, 255);
    doc.triangle(15, 22, 23, 17, 31, 22, "F"); // Diamond top-half
    doc.triangle(15, 22, 23, 27, 31, 22, "F"); // Diamond bottom-half
    doc.rect(19, 25, 8, 3.5, "F"); // Cap neck
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(15, 22, 12, 26); // Tassel line
    doc.rect(11, 26, 2, 2.5, "F"); // Tassel cap
    
    // SMA text
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(26);
    doc.text("SMA", 37, 26);
    
    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    doc.text("School Management Appointment", 37, 33);
    
    // Developed by note replaced by logo
    try {
      const devLogo = await loadImg("/logo1.png");
      doc.addImage(devLogo, "PNG", 155, 6, 42, 28);
    } catch (e) {
      console.error("Failed to load developer logo", e);
    }

    // Body
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFontSize(16);
    doc.setFont("Helvetica", "bold");
    doc.text(lang === "so" ? "Tigidhka Ballanta Diiwangelinta" : "Admission Appointment Receipt", 15, 55);

    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(15, 60, 195, 60);

    doc.setFontSize(12);
    doc.setFont("Helvetica", "normal");

    // Details Grid
    const leftCol = 15;
    const rightCol = 110;
    
    doc.setFont("Helvetica", "bold");
    doc.text(lang === "so" ? "NAMBARKA BALLANTA:" : "APPOINTMENT NUMBER:", leftCol, 75);
    doc.setFont("Helvetica", "normal");
    doc.text(appt.appointment_number, leftCol + 65, 75);

    doc.setFont("Helvetica", "bold");
    doc.text(lang === "so" ? "MAGACA ISKUULKA:" : "SCHOOL NAME:", leftCol, 85);
    doc.setFont("Helvetica", "normal");
    doc.text(selectedSchool.name, leftCol + 65, 85);

    doc.setFont("Helvetica", "bold");
    doc.text(lang === "so" ? "TAARIIKHDA:" : "APPOINTMENT DATE:", leftCol, 95);
    doc.setFont("Helvetica", "normal");
    const apptDateStr = formData.appointment_date ? new Date(formData.appointment_date).toISOString().split('T')[0] : "";
    doc.text(apptDateStr, leftCol + 65, 95);

    doc.setFont("Helvetica", "bold");
    doc.text(lang === "so" ? "SAACADDA:" : "APPOINTMENT TIME:", leftCol, 105);
    doc.setFont("Helvetica", "normal");
    doc.text(formData.appointment_time || "", leftCol + 65, 105);

    doc.line(15, 115, 195, 115);

    doc.setFont("Helvetica", "bold");
    doc.text(lang === "so" ? "XOGTA ARDAYGA" : "STUDENT DETAILS", leftCol, 125);
    doc.setFont("Helvetica", "normal");
    doc.text(`${lang === "so" ? "Magaca Ardayga" : "Student Name"}: ${appt.student_name}`, leftCol, 135);
    doc.text(`${lang === "so" ? "Jinsiga" : "Gender"}: ${appt.gender === "Male" ? (lang === "so" ? "Wiil" : "Male") : (lang === "so" ? "Gabar" : "Female")}`, leftCol, 145);
    doc.text(`${lang === "so" ? "Da'da" : "Age"}: ${appt.student_age || "N/A"}`, leftCol, 155);
    doc.text(`${lang === "so" ? "Fasalka" : "Grade Applying"}: ${appt.grade_applying_for}`, leftCol, 165);

    if (appt.student_photo) {
      try {
        doc.addImage(appt.student_photo, 'JPEG', rightCol + 15, 75, 30, 30);
        doc.setFontSize(8);
        doc.text(lang === "so" ? "Sawirka Ardayga" : "Student Photo", rightCol + 15, 110);
        doc.setFontSize(12);
      } catch (e) {
        console.error("Failed to add image to PDF", e);
      }
    }

    if (qrDataUrl) {
      try {
        doc.addImage(qrDataUrl, 'PNG', rightCol + 50, 75, 30, 30);
        doc.setFontSize(8);
        doc.text(lang === "so" ? "Baar & Xaqiiji" : "Scan & Verify", rightCol + 50, 110);
        doc.setFontSize(12);
      } catch (e) {
        console.error("Failed to add QR code to PDF", e);
      }
    }

    doc.setFont("Helvetica", "bold");
    doc.text(lang === "so" ? "XOGTA WAALIDKA" : "PARENT DETAILS", rightCol, 125);
    doc.setFont("Helvetica", "normal");
    doc.text(`${lang === "so" ? "Magaca Waalidka" : "Parent Name"}: ${formData.parent_name}`, rightCol, 135);
    doc.text(`${lang === "so" ? "Taleefanka" : "Phone"}: ${formData.phone_number}`, rightCol, 145);
    doc.text(`${lang === "so" ? "Email-ka" : "Email"}: ${formData.email}`, rightCol, 155);

    doc.line(15, 175, 195, 175);

    // Footer Info
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(
      lang === "so" 
        ? "Fadlan la yimi koobi daabacan ee tigidhkan iyo shahaadada dhalashada ee ardayga / warqadihii hore." 
        : "Please bring a printed copy of this ticket and the student's birth certificate/previous transcripts.", 
      15, 180
    );
    doc.text(
      lang === "so"
        ? `Wixii weydiimo ah, waxaad kala xiriiri kartaa iskuulka: ${selectedSchool.phone} ama email-ka: ${selectedSchool.email}.`
        : `For inquiries, you can contact the school at ${selectedSchool.phone} or email ${selectedSchool.email}.`,
      15, 188
    );

    doc.save(`SMA_Ticket_${appt.appointment_number}.pdf`);
  };

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const timeSlots = selectedSchool && (selectedSchool as any).time_slots 
    ? (selectedSchool as any).time_slots 
    : [
        "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"
      ];

  const gradeOptions = [
    "Nursery", "Kindergarten", "Grade 1", "Grade 2", "Grade 3", 
    "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", 
    "Grade 9", "Grade 10", "Grade 11", "Grade 12"
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
    <div className="min-h-screen bg-background text-textPrimary flex flex-col justify-between transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-border dark:bg-slate-900/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <SmaLogo className="h-9" />
          </Link>
          <div className="flex items-center gap-3">
            {/* Language Selector */}
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
            <div className="text-xs font-semibold text-textSecondary dark:text-slate-400 uppercase tracking-widest hidden sm:inline-block">
              {translations[lang].step} {step} {translations[lang].of} 5: {
                step === 1 ? translations[lang].selectSchool :
                step === 2 ? translations[lang].schoolInfo :
                step === 3 ? translations[lang].scheduleTitle :
                step === 4 ? translations[lang].reviewTitle : translations[lang].downloadTicket
              }
            </div>
          </div>
        </div>
      </header>

      {/* Main Wizard */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-12">
        {/* Step Progress Bar */}
        <div className="mb-10 max-w-lg mx-auto">
          <div className="flex items-center justify-between text-xs font-semibold text-textSecondary mb-2">
            <span>{lang === "so" ? "Iskuul" : "School"}</span>
            <span>{lang === "so" ? "Faahfaahin" : "Details"}</span>
            <span>{lang === "so" ? "Jadwal" : "Schedule"}</span>
            <span>{lang === "so" ? "Hubi" : "Review"}</span>
            <span>{lang === "so" ? "Dhammaystiran" : "Finished"}</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
            <div 
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${(step - 1) * 25}%` }}
            />
          </div>
        </div>

        {/* Step 1: Select School */}
        {step === 1 && (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-xs font-semibold text-primary uppercase">
                <Sparkles className="w-4 h-4" /> {lang === "so" ? "Diiwangelin Fudud" : "Seamless Booking"}
              </div>
              <h2 className="text-3xl font-extrabold text-textPrimary">{translations[lang].selectSchool}</h2>
              <p className="text-textSecondary text-sm max-w-md mx-auto">
                {lang === "so" ? "Raadi oo dooro iskuulka aad rabto si aad u bilawdo ballan-qabsigaaga." : "Search and choose a school to begin the admission appointment registration."}
              </p>
            </div>

            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-textSecondary" />
              <input 
                type="text" 
                placeholder={translations[lang].searchPlaceholder} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              />
            </div>

            {loadingSchools ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : filteredSchools.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-card border border-border shadow-soft">
                <Building2 className="w-12 h-12 text-textSecondary mx-auto mb-4" />
                <p className="text-textSecondary font-medium">{lang === "so" ? "Wax iskuul ah oo u dhigma raadintaada lama helin." : "No schools found matching your search."}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredSchools.map((school) => {
                  const isClosed = school.admission_status === "Closed";
                  return (
                    <div 
                      key={school.id}
                      onClick={() => handleSchoolSelect(school)}
                      className={`premium-card p-6 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                        isClosed ? "opacity-60 cursor-not-allowed border-dashed" : "hover:border-primary"
                      }`}
                    >
                      {isClosed && (
                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-danger/10 text-danger text-[10px] font-bold rounded uppercase">
                          {lang === "so" ? "Xiran" : "Admissions Closed"}
                        </div>
                      )}
                      {!isClosed && (
                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-bold rounded uppercase">
                          {lang === "so" ? "Furan" : "Admissions Open"}
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-border shrink-0 font-bold overflow-hidden relative">
                            {school.logo_url && (
                              <img 
                                src={school.logo_url} 
                                alt={school.name} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback') as HTMLElement;
                                  if (fallback) fallback.style.setProperty('display', 'flex', 'important');
                                }}
                              />
                            )}
                            <div 
                              className={`logo-fallback w-full h-full flex items-center justify-center text-white text-xs font-extrabold uppercase tracking-wider ${school.logo_url ? 'hidden' : ''}`}
                              style={{
                                background: `linear-gradient(135deg, ${getRandomColor(school.name)})`
                              }}
                            >
                              {getInitials(school.name)}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-extrabold text-lg text-textPrimary leading-snug">{school.name}</h3>
                            <div className="flex items-center gap-1.5 text-xs text-textSecondary mt-0.5">
                              <MapPin className="w-3.5 h-3.5" /> {school.address}
                            </div>
                          </div>
                        </div>
                        <p className="text-textSecondary text-sm line-clamp-2 leading-relaxed">
                          {school.description || (lang === "so" ? "Faahfaahin laguma darin." : "No description provided.")}
                        </p>
                      </div>

                      <div className="border-t border-border pt-4 mt-4 flex items-center justify-between text-xs font-semibold text-textSecondary">
                        <span>{lang === "so" ? "Taleefan" : "Phone"}: {school.phone}</span>
                        {!isClosed && (
                          <span className="text-primary flex items-center gap-1 group">
                            {lang === "so" ? "Qabso Boos" : "Book Slots"} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Student & Parent Details */}
        {step === 2 && selectedSchool && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(1)} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-textSecondary hover:text-textPrimary transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-extrabold text-textPrimary">{translations[lang].schoolInfo}</h2>
                <p className="text-textSecondary text-xs">{translations[lang].schoolInfoSub} {selectedSchool.name}</p>
              </div>
            </div>

            {submitError && (
              <div className="p-4 bg-danger/10 text-danger border border-danger/20 rounded-xl flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-card shadow-soft space-y-8">
              {/* Parent Information Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-primary dark:text-blue-400 uppercase tracking-wider border-b border-border dark:border-slate-800 pb-2">
                  {translations[lang].parentDetails}
                </h3>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-textPrimary">{translations[lang].parentName}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-4 h-4 text-textSecondary" />
                    <input 
                      type="text" 
                      name="parent_name"
                      value={formData.parent_name || ""}
                      onChange={handleInputChange}
                      placeholder={translations[lang].parentNamePlaceholder} 
                      className="w-full pl-10 pr-4 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-textPrimary dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-textPrimary">{translations[lang].phone}</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 w-4 h-4 text-textSecondary" />
                      <input 
                        type="text" 
                        name="phone_number"
                        value={formData.phone_number || ""}
                        onChange={handleInputChange}
                        placeholder={translations[lang].phonePlaceholder} 
                        className="w-full pl-10 pr-4 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-textPrimary dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-textPrimary">{translations[lang].email}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-textSecondary" />
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email || ""}
                        onChange={handleInputChange}
                        placeholder={translations[lang].emailPlaceholder} 
                        className="w-full pl-10 pr-4 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-textPrimary dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Fields (Additional Info) */}
              {selectedSchool && (selectedSchool as any).custom_fields && (selectedSchool as any).custom_fields.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border dark:border-slate-800">
                  <h3 className="text-sm font-bold text-primary dark:text-blue-400 uppercase tracking-wider">
                    {lang === "so" ? "Macluumaad Dheeri ah" : "Additional Information"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(selectedSchool as any).custom_fields.map((field: any) => {
                      return (
                        <div key={field.label} className="space-y-1.5">
                          <label className="text-xs font-bold text-textPrimary">
                            {field.label} {field.required && <span className="text-danger">*</span>}
                          </label>
                          {field.type === "text" && (
                            <input 
                              type="text"
                              value={customData[field.label] || ""}
                              onChange={(e) => setCustomData(prev => ({ ...prev, [field.label]: e.target.value }))}
                              placeholder={lang === "so" ? "Geli halkaan..." : "Enter here..."}
                              className="w-full px-3.5 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-textPrimary dark:text-slate-100"
                            />
                          )}
                          {field.type === "textarea" && (
                            <textarea 
                              value={customData[field.label] || ""}
                              onChange={(e) => setCustomData(prev => ({ ...prev, [field.label]: e.target.value }))}
                              placeholder={lang === "so" ? "Geli halkaan..." : "Describe here..."}
                              className="w-full px-3.5 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-textPrimary dark:text-slate-100 h-20"
                            />
                          )}
                          {field.type === "select" && (
                            <select 
                              value={customData[field.label] || ""}
                              onChange={(e) => setCustomData(prev => ({ ...prev, [field.label]: e.target.value }))}
                              className="w-full px-3 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-textPrimary dark:text-slate-100"
                            >
                              <option value="">{lang === "so" ? "-- Dooro --" : "-- Select Option --"}</option>
                              {(field.options || []).map((opt: string) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Student Information Section (Loop) */}
              <div className="space-y-6 pt-4 border-t border-border dark:border-slate-800">
                <div className="flex justify-between items-center pb-2">
                  <h3 className="text-sm font-bold text-primary dark:text-blue-400 uppercase tracking-wider">
                    {translations[lang].studentDetails}
                  </h3>
                  <button
                    type="button"
                    onClick={addStudentRow}
                    className="px-3 py-1.5 bg-primary/10 text-primary dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1"
                  >
                    + {lang === "so" ? "Ku Dar Walaal Kale" : "Add Sibling"}
                  </button>
                </div>

                {students.map((student, index) => (
                  <div key={index} className="p-4 md:p-6 bg-slate-50 dark:bg-slate-800/40 border border-border dark:border-slate-800 rounded-xl relative space-y-4">
                    {students.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStudentRow(index)}
                        className="absolute top-3 right-3 text-xs font-bold text-danger hover:underline"
                      >
                        {lang === "so" ? "Ka Saar" : "Remove"}
                      </button>
                    )}

                    <div className="text-xs font-bold text-textSecondary dark:text-slate-400 uppercase tracking-widest">
                      {lang === "so" ? `Ardayga ${index + 1}` : `Student #${index + 1}`}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-textPrimary">{translations[lang].studentName}</label>
                        <div className="relative">
                          <User className="absolute left-3 top-3.5 w-4 h-4 text-textSecondary" />
                          <input 
                            type="text" 
                            value={student.student_name}
                            onChange={(e) => handleStudentChange(index, "student_name", e.target.value)}
                            placeholder={translations[lang].studentNamePlaceholder} 
                            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-textPrimary dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-textPrimary">{translations[lang].studentGender}</label>
                        <select 
                          value={student.gender}
                          onChange={(e) => handleStudentChange(index, "gender", e.target.value)}
                          className="w-full px-3 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-textPrimary dark:text-slate-100"
                        >
                          <option value="Male">{translations[lang].male}</option>
                          <option value="Female">{translations[lang].female}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-textPrimary">{translations[lang].studentAge}</label>
                        <input 
                          type="number" 
                          value={student.student_age}
                          onChange={(e) => handleStudentChange(index, "student_age", e.target.value)}
                          placeholder="e.g. 10" 
                          className="w-full px-3 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-textPrimary dark:text-slate-100"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-textPrimary">{translations[lang].studentPhoto}</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleStudentPhotoUpload(index, e)}
                          className="w-full px-3 py-2 bg-background border border-border dark:border-slate-800 dark:bg-slate-850 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 text-textSecondary dark:text-slate-300"
                        />
                        {student.student_photo && <span className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1 block">{translations[lang].photoUploaded}</span>}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-textPrimary">{translations[lang].grade}</label>
                      <select 
                        value={student.grade_applying_for}
                        onChange={(e) => handleStudentChange(index, "grade_applying_for", e.target.value)}
                        className="w-full px-3 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-textPrimary dark:text-slate-100"
                      >
                        {gradeOptions.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleNextStep}
                  className="px-6 py-3 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2 shadow-sm"
                >
                  {translations[lang].chooseDateTime} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Date & Time */}
        {step === 3 && selectedSchool && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3">
              <button onClick={handlePrevStep} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-textSecondary hover:text-textPrimary transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-extrabold text-textPrimary">{translations[lang].scheduleTitle}</h2>
                <p className="text-textSecondary text-xs">{translations[lang].scheduleSub}</p>
              </div>
            </div>

            {submitError && (
              <div className="p-4 bg-danger/10 text-danger border border-danger/20 rounded-xl flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-card shadow-soft space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-textPrimary uppercase tracking-wider block border-b border-border dark:border-slate-800 pb-2">{translations[lang].date}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-textSecondary" />
                    <input 
                      type="date" 
                      name="appointment_date"
                      value={formData.appointment_date}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-background border border-border dark:border-slate-800 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-textPrimary dark:text-slate-100"
                    />
                  </div>
                  <span className="text-[11px] text-textSecondary dark:text-slate-450 block">
                    {lang === "so" ? "Ballamaha waxaa inta badan la qabtaa maalmaha shaqada." : "Appointments are typically scheduled for weekdays."}
                  </span>
                </div>

                {/* Time Slots */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-textPrimary uppercase tracking-wider block border-b border-border dark:border-slate-800 pb-2">{translations[lang].time}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((time: string) => {
                      const isSelected = formData.appointment_time === time;
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, appointment_time: time }))}
                          className={`py-2 text-sm font-semibold rounded-lg border transition-all ${
                            isSelected 
                              ? "bg-primary border-primary text-white shadow-sm" 
                              : "bg-background border-border dark:border-slate-800 text-textSecondary dark:text-slate-300 hover:border-primary/50"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between border-t border-border dark:border-slate-800 pt-6 mt-6">
                <button 
                  onClick={handlePrevStep}
                  className="px-5 py-2.5 bg-white dark:bg-slate-850 text-textPrimary dark:text-slate-200 border border-border dark:border-slate-800 font-semibold text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> {translations[lang].back}
                </button>
                <button 
                  onClick={handleNextStep}
                  className="px-6 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2 shadow-sm"
                >
                  {lang === "so" ? "Hubi Ballanta" : "Review Details"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && selectedSchool && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3">
              <button onClick={handlePrevStep} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-textSecondary hover:text-textPrimary transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-extrabold text-textPrimary">{translations[lang].reviewTitle}</h2>
                <p className="text-textSecondary text-xs">{translations[lang].reviewSub}</p>
              </div>
            </div>

            {submitError && (
              <div className="p-4 bg-danger/10 text-danger border border-danger/20 rounded-xl flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-card shadow-soft space-y-6">
              {/* Summary Lists */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Parent Info Summary */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-primary dark:text-blue-400 uppercase tracking-wider border-b border-border dark:border-slate-800 pb-1.5">
                      {translations[lang].parentDetails}
                    </h3>
                    <div className="space-y-1.5 text-sm text-textPrimary dark:text-slate-200">
                      <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">{lang === "so" ? "Magaca Waalidka" : "Parent Name"}:</span> <span className="font-semibold">{formData.parent_name}</span></div>
                      <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">{lang === "so" ? "Taleefanka" : "Phone"}:</span> <span className="font-semibold">{formData.phone_number}</span></div>
                      <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">{lang === "so" ? "Email-ka" : "Email"}:</span> <span className="font-semibold break-all">{formData.email}</span></div>
                    </div>
                  </div>

                  {/* Schedule Details Summary */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-primary dark:text-blue-400 uppercase tracking-wider border-b border-border dark:border-slate-800 pb-1.5">
                      {lang === "so" ? "Iskuulka & Jadwalka" : "School & Schedule"}
                    </h3>
                    <div className="space-y-1.5 text-sm text-textPrimary dark:text-slate-200">
                      <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">{translations[lang].school}:</span> <span className="font-semibold text-right">{selectedSchool.name}</span></div>
                      <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">{lang === "so" ? "Goobta" : "Location"}:</span> <span className="font-semibold text-right">{selectedSchool.address}</span></div>
                      <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">{lang === "so" ? "Taariikhda" : "Date"}:</span> <span className="font-semibold text-accent">{formData.appointment_date}</span></div>
                      <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">{lang === "so" ? "Saacadda" : "Time Slot"}:</span> <span className="font-semibold text-accent">{formData.appointment_time}</span></div>
                    </div>
                  </div>
                </div>

                {/* Sibling Students List */}
                <div className="space-y-3 pt-4 border-t border-border dark:border-slate-800">
                  <h3 className="text-xs font-bold text-primary dark:text-blue-400 uppercase tracking-wider">
                    {lang === "so" ? "Ardayda Diiwangelinta loo samaynayo" : "Students being registered"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {students.map((student, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-border dark:border-slate-800 rounded-xl space-y-1 text-sm text-textPrimary dark:text-slate-100">
                        <div className="text-xs font-bold text-textSecondary dark:text-slate-400 uppercase">
                          {lang === "so" ? `Ardayga ${idx + 1}` : `Student #${idx + 1}`}
                        </div>
                        <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">{lang === "so" ? "Magaca" : "Name"}:</span> <span className="font-semibold">{student.student_name}</span></div>
                        <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">{lang === "so" ? "Jinsiga" : "Gender"}:</span> <span className="font-semibold">{student.gender === "Male" ? translations[lang].male : translations[lang].female}</span></div>
                        <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">{lang === "so" ? "Da'da" : "Age"}:</span> <span className="font-semibold">{student.student_age}</span></div>
                        <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">{lang === "so" ? "Fasalka" : "Grade"}:</span> <span className="font-semibold">{student.grade_applying_for}</span></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Fields Summary */}
                {selectedSchool && (selectedSchool as any).custom_fields && (selectedSchool as any).custom_fields.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-border dark:border-slate-800">
                    <h3 className="text-xs font-bold text-primary dark:text-blue-400 uppercase tracking-wider">
                      {lang === "so" ? "Macluumaad Dheeri ah" : "Additional Information"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(selectedSchool as any).custom_fields.map((field: any) => {
                        const val = customData[field.label];
                        if (!val) return null;
                        return (
                          <div key={field.label} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-border dark:border-slate-800 rounded-xl flex justify-between items-center text-sm text-textPrimary dark:text-slate-100">
                            <span className="text-textSecondary dark:text-slate-400">{field.label}:</span>
                            <span className="font-semibold text-right">{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-border dark:border-slate-800 rounded-xl text-xs text-textSecondary dark:text-slate-400">
                  {lang === "so" 
                    ? "Markaad gudbiso foomkan, waxaad ogolaanaysaa inaad codsanayso saacada rasmiga ah ee ballanta. Haddii boosasku buuxsamaan, waxaa si toos ah lagugu dari doonaa liiska sugitaanka." 
                    : "By submitting this form, you acknowledge that you are requesting an official admission appointment slot. If capacity limits are reached, you will be enrolled directly into the waiting list."}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between border-t border-border dark:border-slate-800 pt-6">
                <button 
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-2.5 bg-white dark:bg-slate-850 text-textPrimary dark:text-slate-200 border border-border dark:border-slate-800 font-semibold text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> {translations[lang].back}
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> {lang === "so" ? "Waa la dirayaa..." : "Submitting..."}
                    </>
                  ) : (
                    <>
                      {translations[lang].submit} <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 5: Confirmation */}
        {step === 5 && selectedSchool && bookingResult && (
          <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn text-center">
            {bookingResult.status === "Success" ? (
              <div className="space-y-6">
                <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2 animate-fadeIn">
                  <h2 className="text-3xl font-extrabold text-textPrimary">
                    {lang === "so" ? "Ballamaha waa la Xaqiijiyay!" : "Appointments Confirmed!"}
                  </h2>
                  <p className="text-textSecondary text-sm">
                    {lang === "so" 
                      ? "Diiwangelinta ballamahaaga si guul leh ayaa loo kaydiyay. Waxaad hoos kala soo degi kartaa tigidhkooda rasmiga ah oo leh QR Code rasiid kasta."
                      : "Your admission bookings have been successfully registered. You can download individual PDF tickets with QR codes below."}
                  </p>
                </div>

                {/* Sibling Tickets List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
                  {bookingResult.appointments?.map((appt, idx) => (
                    <div key={appt.id || idx} className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-card shadow-soft p-5 space-y-4 relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute top-0 right-0 left-0 h-1.5 bg-accent" />
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-border dark:border-slate-800 pb-2">
                          <span className="text-xs font-bold text-textSecondary dark:text-slate-400 uppercase truncate max-w-[150px]">
                            {appt.student_name}
                          </span>
                          <span className="text-xs font-extrabold text-primary dark:text-blue-400 bg-primary/5 px-2 py-0.5 rounded">{appt.appointment_number}</span>
                        </div>

                        <div className="space-y-1.5 text-xs text-textPrimary dark:text-slate-200">
                          <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">{lang === "so" ? "Iskuulka" : "School"}:</span> <span className="font-semibold text-right">{selectedSchool.name}</span></div>
                          <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">{lang === "so" ? "Fasalka" : "Grade"}:</span> <span className="font-semibold">{appt.grade_applying_for}</span></div>
                          <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">{lang === "so" ? "Taariikhda" : "Date"}:</span> <span className="font-semibold">{appt.appointment_date ? appt.appointment_date.split('T')[0] : ""}</span></div>
                          <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">{lang === "so" ? "Saacadda" : "Time Slot"}:</span> <span className="font-semibold">{appt.appointment_time}</span></div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border dark:border-slate-800 flex flex-col gap-2">
                        <button 
                          onClick={() => downloadReceipt(appt)}
                          className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary dark:text-blue-400 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> {translations[lang].downloadTicket}
                        </button>
                        
                        <a
                          href={generateGCalLink(appt)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-textPrimary dark:text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-border dark:border-slate-750"
                        >
                          <Calendar className="w-3.5 h-3.5" /> {lang === "so" ? "Ku dar Calendar-ka" : "Add to Calendar"}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center pt-2">
                  <Link 
                    href="/"
                    className="px-6 py-3 bg-white dark:bg-slate-850 text-textPrimary dark:text-slate-200 border border-border dark:border-slate-800 font-semibold text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {lang === "so" ? "Ku laabo Hoyga" : "Go Back Home"}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                <div className="w-16 h-16 bg-warning/10 text-warning rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-extrabold text-textPrimary">{translations[lang].waitingTitle}</h2>
                  <p className="text-textSecondary text-sm max-w-md mx-auto">
                    {lang === "so" 
                      ? "Boosaska maanta/saacadan waa buuxaan. Waxaa dhammaan ardayda lagu daray liiska sugitaanka (waiting list) ee iskuulka." 
                      : "Admissions for this date/slot are currently at maximum capacity. You have been placed on the school's waiting list."}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-card shadow-soft p-6 space-y-4 max-w-md mx-auto text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 left-0 h-2 bg-warning" />
                  <div className="border-b border-border dark:border-slate-800 pb-3">
                    <span className="text-xs font-bold text-textSecondary dark:text-slate-400 uppercase">
                      {lang === "so" ? "Xaaladda Liiska Sugitaanka" : "Waiting List Status"}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-textPrimary dark:text-slate-200">
                    <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">{lang === "so" ? "Iskuulka" : "School"}:</span> <span className="font-semibold text-right">{selectedSchool.name}</span></div>
                    <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">{lang === "so" ? "Ardayda" : "Students"}:</span> <span className="font-semibold text-right">{students.map(s => s.student_name).join(", ")}</span></div>
                    <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">{lang === "so" ? "Position-ka" : "Position"}:</span> <span className="font-bold text-warning">{lang === "so" ? "Wuxuu Sugayaa Hubin" : "Pending Review"}</span></div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {bookingResult.whatsapp_number && (
                    <a 
                      href={`https://wa.me/${bookingResult.whatsapp_number.replace(/[^0-9]/g, "")}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-accent text-white font-semibold text-sm rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <PhoneCall className="w-4 h-4" /> {translations[lang].contactWhatsApp}
                    </a>
                  )}
                  <Link 
                    href="/"
                    className="px-6 py-3 bg-white dark:bg-slate-850 text-textPrimary dark:text-slate-200 border border-border dark:border-slate-800 font-semibold text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                  >
                    {lang === "so" ? "Ku laabo Hoyga" : "Go Back Home"}
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

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
