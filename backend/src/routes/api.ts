import { Router } from 'express';
import { login, registerAdmin, getMe, getAuditLogs, heartbeat, getSessions, getSystemUsers } from '../controllers/authController';
import { getSchools, getSchoolById, createSchool, updateSchool, deleteSchool } from '../controllers/schoolController';
import { createAppointment, getAppointments, updateAppointmentStatus, exportAppointmentsCSV, getWaitingList, getAppointmentByNumber } from '../controllers/appointmentController';
import { getSubscriptionPlans, getSchoolSubscription, upgradeSubscription, updateSubscriptionPlan } from '../controllers/subscriptionController';
import { createRequest, getRequests, approveRequest, rejectRequest } from '../controllers/onboardingController';
import { createAnnouncement, getAnnouncements, deleteAnnouncement } from '../controllers/announcementController';
import { createStaff, getStaff, deleteStaff, getMessages, postMessage, updateAppointmentNote } from '../controllers/staffController';
import { getMaintenanceMode, setMaintenanceMode, getBillingHistory, getUsageAlerts, sendUpgradeAlert, getSupportTickets, createSupportTicket, replySupportTicket } from '../controllers/systemController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// ==========================================
// 1. PUBLIC ENDPOINTS (No Auth Required)
// ==========================================
router.post('/auth/login', login);
router.get('/public/schools', getSchools);
router.get('/public/schools/:id', getSchoolById);
router.post('/public/appointments', createAppointment);
router.post('/public/onboarding-requests', createRequest); // Public registration request
router.get('/public/system/maintenance', getMaintenanceMode);

// ==========================================
// 2. AUTHENTICATED ENDPOINTS (Admins & SuperAdmins)
// ==========================================
router.use(authenticateToken); // Protect all routes below

router.get('/auth/me', getMe);
router.post('/auth/heartbeat', heartbeat);
router.get('/appointments', getAppointments);
router.get('/appointments/number/:apptNum', getAppointmentByNumber);
router.put('/appointments/:id/status', updateAppointmentStatus);
router.get('/appointments/export/csv', exportAppointmentsCSV);
router.get('/waiting-list', getWaitingList);
router.get('/announcements', getAnnouncements); // Shared news feed
router.get('/scan-messages', requireRole(['Admin', 'SuperAdmin', 'Scanner']), getMessages);
router.post('/scan-messages', requireRole(['Admin', 'SuperAdmin', 'Scanner']), postMessage);
router.get('/support/tickets', getSupportTickets);

// Manage School Profile (School Admin can edit their own, SuperAdmin can edit any)
router.put('/schools/:id', updateSchool);

// Subscription view
router.get('/subscriptions/plans', getSubscriptionPlans);
router.get('/subscriptions/school/:school_id', getSchoolSubscription);

// ==========================================
// 2.5. SCHOOL ADMIN ONLY ENDPOINTS (Staff & Directives)
// ==========================================
router.get('/schools/staff', requireRole(['Admin', 'SuperAdmin']), getStaff);
router.post('/schools/staff', requireRole(['Admin', 'SuperAdmin']), createStaff);
router.delete('/schools/staff/:id', requireRole(['Admin', 'SuperAdmin']), deleteStaff);
router.put('/appointments/:id/admin-note', requireRole(['Admin', 'SuperAdmin']), updateAppointmentNote);
router.post('/support/tickets', requireRole(['Admin']), createSupportTicket);

// ==========================================
// 3. SUPER ADMIN ONLY ENDPOINTS
// ==========================================
router.post('/auth/register-admin', requireRole(['SuperAdmin']), registerAdmin);
router.post('/schools', requireRole(['SuperAdmin']), createSchool);
router.delete('/schools/:id', requireRole(['SuperAdmin']), deleteSchool);
router.post('/subscriptions/upgrade', requireRole(['SuperAdmin']), upgradeSubscription);
router.put('/subscriptions/plans/:id', requireRole(['SuperAdmin']), updateSubscriptionPlan); // Config plan rules

// System settings & Maintenance
router.post('/system/maintenance', requireRole(['SuperAdmin']), setMaintenanceMode);
router.get('/billing/history', requireRole(['SuperAdmin']), getBillingHistory);
router.get('/system/usage-alerts', requireRole(['SuperAdmin']), getUsageAlerts);
router.post('/system/send-upgrade-alert', requireRole(['SuperAdmin']), sendUpgradeAlert);
router.post('/support/tickets/:id/reply', requireRole(['SuperAdmin']), replySupportTicket);

// Onboarding requests management
router.get('/onboarding-requests', requireRole(['SuperAdmin']), getRequests);
router.post('/onboarding-requests/:id/approve', requireRole(['SuperAdmin']), approveRequest);
router.post('/onboarding-requests/:id/reject', requireRole(['SuperAdmin']), rejectRequest);

// Announcements broadcast management
router.post('/announcements', requireRole(['SuperAdmin']), createAnnouncement);
router.delete('/announcements/:id', requireRole(['SuperAdmin']), deleteAnnouncement);

// Audit logs
router.get('/audit-logs', requireRole(['SuperAdmin']), getAuditLogs);

// System user tracking & sessions (SuperAdmin only)
router.get('/system/sessions', requireRole(['SuperAdmin']), getSessions);
router.get('/system/users', requireRole(['SuperAdmin']), getSystemUsers);

export default router;
