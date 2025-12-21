import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Users, Edit, Loader, Building, Briefcase, Globe, MapPin, Tag, User, Calendar, StickyNote, Activity, CheckSquare, LayoutGrid, ListFilter, ArrowRight, ArrowLeftCircle, XCircle, CheckCircle, Phone, Mail } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LeadFullDetailsModal from '../components/LeadFullDetailsModal'; // New modal for full details
import { AnimatePresence, motion } from 'framer-motion';
import CrmTaskForm from '../components/CrmTaskForm';
import CrmEventForm from '../components/CrmEventForm';
import CrmCallLogForm from '../components/CrmCallLogForm'; // Import the new form
import CrmEmailForm from '../components/CrmEmailForm'; // Import the new email form
import EventsTab from '../components/EventsTab';
import TasksTab from '../components/TasksTab';
import CallLogsTab from '../components/CallLogsTab'; // Import the new tab
import EmailsTab from '../components/EmailsTab'; // Import the new email tab
const API_URL = import.meta.env.VITE_API_BASE_URL;
const InfoDisplay = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-2">
        {Icon && <Icon className="h-4 w-4 text-foreground-muted mt-0.5 flex-shrink-0" />}
        <div>
            <p className="text-sm text-foreground-muted">{label}</p>
            <p className="font-medium text-foreground break-words">{value || <span className="text-foreground-muted/50">N/A</span>}</p>
        </div>
    </div>
);

const Section = ({ title, children }) => (
    <div className="p-4 border border-border rounded-lg bg-background-muted">
        <h4 className="font-semibold mb-4 text-foreground-muted">{title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children}
        </div>
    </div>
);

const ContentTab = ({ icon: Icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-foreground-muted hover:text-foreground'
        }`}
    >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
    </button>
);
const ActivityFeed = ({ lead }) => (
    <div className="p-4">
        <h3 className="font-semibold text-foreground mb-4">Activity Feed</h3>
        <p className="text-sm text-foreground-muted">Activity feed for this lead will be displayed here. This can include notes, tasks, events, and emails.</p>
        {/* Placeholder for activity items */}
        <div className="mt-4 space-y-4">
            <div className="p-3 bg-background-muted rounded-lg">
                <p className="text-sm font-medium">Note Added</p>
                <p className="text-xs text-foreground-muted">by Admin on {new Date().toLocaleDateString()}</p>
                <p className="text-sm mt-1">Called the lead, they are interested in a demo next week.</p>
            </div>
        </div>
    </div>
);

const LeadStages = ({ allStages, currentStageName, onStatusChange, onStageChange, lead }) => {
    const [notResponding, setNotResponding] = useState(false);
    const navigate = useNavigate();

    const sortedStages = [...allStages].sort((a, b) => a.sortOrder - b.sortOrder);
    const currentStageIndex = sortedStages.findIndex(stage => stage.name === currentStageName);
    const currentStage = sortedStages[currentStageIndex];

    const handleBack = () => {
        if (currentStageIndex > 0) {
            const previousStage = sortedStages[currentStageIndex - 1];
            onStageChange(previousStage);
        }
    };

    const handleNext = () => {
        if (notResponding) {
            onStatusChange('NOT_RESPONDING');
        } else if (currentStageIndex < sortedStages.length - 1) {
            const nextStage = sortedStages[currentStageIndex + 1];
            onStageChange(nextStage);
        }
    };

    const handleLost = () => onStatusChange('LOST');
    const handleCompleted = () => onStatusChange('ACTIVE');

    const handleCreateQuotation = () => {
        navigate('/sales/quotations/new', { state: { lead } });
    };

    const handleCreateSaleOrder = () => {
        navigate('/sales/orders/new', { state: { lead } });
    };

    return (
        <div className="p-6 bg-card rounded-lg shadow-sm space-y-8">
            <div>
                <h3 className="font-semibold text-foreground mb-6">Lead Stage</h3>
                <div className="flex items-center justify-between w-full">
                    {sortedStages.map((stage, index) => {
                        const isStageCompleted = stage.isCompleted;
                        const isActive = index === currentStageIndex;
                        return (
                            <React.Fragment key={stage.id}>
                                <div className="flex flex-col items-center text-center w-20">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${isActive ? 'bg-primary border-primary text-primary-foreground' : isStageCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-background border-border'}`}>
                                        {isStageCompleted ? '✓' : index + 1}
                                    </div>
                                    <p className={`mt-2 text-xs font-medium ${isActive ? 'text-primary' : 'text-foreground-muted'}`}>{stage.name}</p>
                                </div>
                                {index < sortedStages.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${isStageCompleted ? 'bg-green-500' : 'bg-border'}`} />}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            <div className="pt-6 border-t border-border">
                <h3 className="font-semibold text-foreground mb-4">Lead Progression Actions</h3>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input type="checkbox" checked={notResponding} onChange={(e) => setNotResponding(e.target.checked)} className="h-4 w-4 rounded" />
                        Mark as "Not Responding"
                    </label>
                    <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
                        {currentStage?.moveTo === 'Quotation' && (
                            <button onClick={handleCreateQuotation} className="btn-primary flex items-center gap-1 bg-purple-600 hover:bg-purple-700">
                                Create Quotation <ArrowRight size={16} />
                            </button>
                        )}
                        {currentStage?.moveTo === 'Sale Order' && (
                            <button onClick={handleCreateSaleOrder} className="btn-primary flex items-center gap-1 bg-orange-600 hover:bg-orange-700">
                                Create Sale Order <ArrowRight size={16} />
                            </button>
                        )}
                        <button onClick={handleBack} disabled={currentStageIndex <= 0} className="btn-secondary flex items-center gap-1 disabled:opacity-50">
                            <ArrowLeftCircle size={16} /> Back
                        </button>
                        <button onClick={handleNext} className="btn-primary flex items-center gap-1">
                            Next <ArrowRight size={16} />
                        </button>
                        <button onClick={handleLost} className="btn-danger flex items-center gap-1"><XCircle size={16} /> Lost</button>
                        <button onClick={handleCompleted} className="btn-success flex items-center gap-1"><CheckCircle size={16} /> Completed</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ActionGrid = ({ onNewTaskClick, onNewEventClick, onLogCallClick, onEmailClick }) => {
    const actions = [
        { label: 'New Task', icon: CheckSquare, onClick: onNewTaskClick },
        { label: 'New Event', icon: Calendar, onClick: onNewEventClick },
        { label: 'Log a Call', icon: Phone, onClick: onLogCallClick },
        { label: 'Email', icon: Mail, onClick: onEmailClick },
    ];

    // Handle case where onNewTaskClick might be undefined
    const handleActionClick = (action) => {
        if (action.onClick) action.onClick();
        else alert(`${action.label} functionality not implemented yet.`);
    };

    return (
        <div className="p-6 border-t border-border">
            <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {actions.map(action => (
                    <button key={action.label} onClick={action.onClick} className="flex flex-col items-center justify-center p-4 bg-background-muted rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-foreground-muted">
                        <action.icon className="h-6 w-6 mb-2" /> 
                        <span className="text-sm font-medium">{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const LeadDetailsGrid = ({ lead }) => (
    <div className="p-4">
        <h3 className="font-semibold text-foreground mb-4">Lead Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoDisplay icon={User} label="Full Name" value={`${lead.firstName} ${lead.lastName}`} />
            <InfoDisplay icon={Building} label="Company" value={lead.companyName} />
            <InfoDisplay icon={Tag} label="Status" value={lead.status} />
            <InfoDisplay icon={Briefcase} label="Industry" value={lead.industryName} />
            <InfoDisplay icon={MapPin} label="Location" value={lead.locationName} />
            <InfoDisplay icon={Globe} label="Website" value={lead.website} />
            <InfoDisplay icon={User} label="Owner" value={lead.ownerName} />
            <InfoDisplay icon={Calendar} label="Created At" value={lead.createdAt ? new Date(lead.createdAt).toLocaleString() : 'N/A'} />
            <InfoDisplay icon={Calendar} label="Last Updated At" value={lead.updatedAt ? new Date(lead.updatedAt).toLocaleString() : 'N/A'} />
        </div>
    </div>
);

const LeadInfo = () => {
    const { leadId } = useParams();
    const navigate = useNavigate();
    const [lead, setLead] = useState(null);
    const [leadStages, setLeadStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
    const [isFullDetailsModalOpen, setIsFullDetailsModalOpen] = useState(false);
    const [activeSidebarTab, setActiveSidebarTab] = useState('Activity');
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [isEventFormOpen, setIsEventFormOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [isCallLogFormOpen, setIsCallLogFormOpen] = useState(false);
    const [editingCallLog, setEditingCallLog] = useState(null);
    const [isEmailFormOpen, setIsEmailFormOpen] = useState(false);


    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const headers = { "Authorization": `Bearer ${token}` };

            // Fetch both lead details and the list of all lead stages
            const [leadRes, stagesRes] = await Promise.all([
                axios.get(`${API_URL}/crm/leads/${leadId}`, { headers }),
                axios.get(`${API_URL}/crm/lead-stages`, { headers })
            ]);

            setLead(leadRes.data);
            
            if (Array.isArray(stagesRes.data)) {
                setLeadStages(stagesRes.data);
            } else {
                console.warn("Lead stages data is not an array:", stagesRes.data);
                setLeadStages([]);
            }
        } catch (err) {
            setError('Failed to fetch lead details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [leadId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStageUpdate = async (newStage) => {
        if (!lead || !newStage) return;
        try {
            const token = localStorage.getItem('token');
            const headers = { "Authorization": `Bearer ${token}` };

            // Update the lead's currentStage to the new stage ID
            await axios.put(`${API_URL}/crm/leads/${leadId}/stage`, { stageId: newStage.id }, { headers });

            // Refresh all data to reflect the change
            await fetchData();
        } catch (err) {
            console.error("Failed to update lead stage:", err);
            alert(`Error: ${err.response?.data?.message || 'Failed to update lead stage.'}`);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!lead) return;
        try {
            const token = localStorage.getItem('token');
            const headers = { "Authorization": `Bearer ${token}` };
            await axios.put(`${API_URL}/crm/leads/${leadId}/status`, { status: newStatus }, { headers });
            await fetchData();
        } catch (err) {
            console.error("Failed to update lead status:", err);
            alert(`Error: ${err.response?.data?.message || 'Failed to update lead status.'}`);
        }
    };

    const handleOpenNewTask = () => {
        setEditingTask(null);
        setIsTaskFormOpen(true);
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setIsTaskFormOpen(true);
    };

    const handleSaveTask = async (taskData) => {
        setFormSubmitting(true);
        const isUpdating = Boolean(editingTask?.id);
        const url = isUpdating ? `${API_URL}/crm/tasks/${editingTask.id}` : `${API_URL}/crm/tasks`;
        const method = isUpdating ? 'put' : 'post';

        try {
            const token = localStorage.getItem('token');
            await axios[method](url, taskData, { headers: { "Authorization": `Bearer ${token}` } });
            setIsTaskFormOpen(false);
            // Optionally, force a refresh of the tasks tab if it's active
            // For now, TasksTab refetches on its own when leadId changes, which is sufficient
        } catch (err) {
            alert(`Error: ${err.response?.data?.message || 'Failed to save task.'}`);
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleOpenNewEvent = () => {
        setEditingEvent(null);
        setIsEventFormOpen(true);
    };

    const handleEditEvent = (event) => {
        setEditingEvent(event);
        setIsEventFormOpen(true);
    };

    const handleSaveEvent = async (eventData) => {
        setFormSubmitting(true);
        const isUpdating = Boolean(editingEvent?.id);
        const url = isUpdating ? `${API_URL}/crm/events/${editingEvent.id}` : `${API_URL}/crm/events`;
        const method = isUpdating ? 'put' : 'post';

        try {
            const token = localStorage.getItem('token');
            await axios[method](url, eventData, { headers: { "Authorization": `Bearer ${token}` } });
            setIsEventFormOpen(false);
        } catch (err) {
            alert(`Error: ${err.response?.data?.message || 'Failed to save event.'}`);
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleOpenLogCall = () => {
        setEditingCallLog(null);
        setIsCallLogFormOpen(true);
    };

    const handleEditCallLog = (log) => {
        setEditingCallLog(log);
        setIsCallLogFormOpen(true);
    };

    const handleSaveCallLog = async (logData) => {
        setFormSubmitting(true);
        const isUpdating = Boolean(editingCallLog?.id);
        const url = isUpdating ? `${API_URL}/crm/call-logs/${editingCallLog.id}` : `${API_URL}/crm/call-logs`;
        const method = isUpdating ? 'put' : 'post';

        try {
            const token = localStorage.getItem('token');
            await axios[method](url, logData, { headers: { "Authorization": `Bearer ${token}` } });
            setIsCallLogFormOpen(false);
            // The CallLogsTab will refetch data automatically when it's rendered again.
        } catch (err) {
            alert(`Error: ${err.response?.data?.message || 'Failed to save call log.'}`);
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleOpenEmailForm = () => {
        setIsEmailFormOpen(true);
    };

    const handleSendEmail = async (emailData) => {
        setFormSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/crm/emails/send`, emailData, { headers: { "Authorization": `Bearer ${token}` } });
            setIsEmailFormOpen(false);
            // The EmailsTab will refetch its data automatically when it becomes active again.
            alert("Email sent successfully!");
        } catch (err) {
            alert(`Error: ${err.response?.data?.message || 'Failed to send email. Check SMTP settings.'}`);
        } finally {
            setFormSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    if (error) {
        return <div className="text-center text-red-500 p-4">{error}</div>;
    }

    if (!lead) {
        return <div className="text-center p-4">Lead not found.</div>;
    }

    const initials = `${lead.firstName ? lead.firstName.charAt(0) : ''}${lead.lastName ? lead.lastName.charAt(0) : ''}`;

    return (
        <div className="bg-background text-foreground flex flex-col h-full">
            {/* Header */}
            <header className={`bg-card text-card-foreground border-b border-border flex-shrink-0 transition-all duration-300 ${isHeaderExpanded ? 'h-auto' : 'h-24'}`}>
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">                        <button onClick={() => navigate('/crm-dashboard/leads')} className="p-1.5 rounded-full hover:bg-background-muted">
                            <ArrowLeft className="h-5 w-5 text-foreground" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-lg">
                                {initials}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">{lead.firstName} {lead.lastName}</h2>
                                <p className="text-sm text-foreground-muted">Lead No: {lead.leadNo || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex flex-col text-sm text-right">
                            <p className="text-foreground-muted">Phone: {lead.phone || 'N/A'}</p>
                            <p className="text-foreground-muted">Email: {lead.email || 'N/A'}</p>
                        </div>
                        <button onClick={() => setIsFullDetailsModalOpen(true)} className="btn-secondary p-2" title="View All Details">
                            <Users className="h-5 w-5" />
                        </button>
                        <button onClick={() => alert('Edit functionality to be implemented here.')} className="btn-secondary p-2" title="Edit Lead">
                            <Edit className="h-5 w-5" />
                        </button>
                        <button onClick={() => setIsHeaderExpanded(!isHeaderExpanded)} className="btn-secondary p-2" title={isHeaderExpanded ? 'Collapse Details' : 'Expand Details'}>
                            {isHeaderExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {isHeaderExpanded && (
                    <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <InfoDisplay icon={Building} label="Company" value={lead.companyName} />
                        <InfoDisplay icon={Briefcase} label="Industry" value={lead.industryName} />
                        <InfoDisplay icon={Globe} label="Website" value={lead.website} />
                        <InfoDisplay icon={MapPin} label="Location" value={lead.locationName} />
                        <InfoDisplay icon={Tag} label="Status" value={lead.status} />
                        <InfoDisplay icon={User} label="Owner" value={lead.ownerName} />
                        <InfoDisplay icon={Calendar} label="Created At" value={lead.createdAt ? new Date(lead.createdAt).toLocaleString() : 'N/A'} />
                        <InfoDisplay icon={Calendar} label="Last Updated At" value={lead.updatedAt ? new Date(lead.updatedAt).toLocaleString() : 'N/A'} />
                        {lead.notes && <InfoDisplay icon={StickyNote} label="Notes" value={lead.notes} />}
                    </div>
                )}
            </header>

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tab Navigation */}
                <div className="border-b border-border flex-shrink-0">
                    <nav className="flex items-center space-x-2 px-4">
                        <ContentTab icon={Activity} label="Activity" isActive={activeSidebarTab === 'Activity'} onClick={() => setActiveSidebarTab('Activity')} />
                        <ContentTab icon={ListFilter} label="Lead Stages" isActive={activeSidebarTab === 'Lead Stages'} onClick={() => setActiveSidebarTab('Lead Stages')} />
                        <ContentTab icon={LayoutGrid} label="Details Grid" isActive={activeSidebarTab === 'Details Grid'} onClick={() => setActiveSidebarTab('Details Grid')} />
                        <ContentTab icon={CheckSquare} label="Tasks" isActive={activeSidebarTab === 'Tasks'} onClick={() => setActiveSidebarTab('Tasks')} />
                        <ContentTab icon={Calendar} label="Events" isActive={activeSidebarTab === 'Events'} onClick={() => setActiveSidebarTab('Events')} />
                        <ContentTab icon={Phone} label="Call Logs" isActive={activeSidebarTab === 'Call Logs'} onClick={() => setActiveSidebarTab('Call Logs')} />
                        <ContentTab icon={Mail} label="Emails" isActive={activeSidebarTab === 'Emails'} onClick={() => setActiveSidebarTab('Emails')} />
                        <ContentTab icon={StickyNote} label="Notes" isActive={activeSidebarTab === 'Notes'} onClick={() => setActiveSidebarTab('Notes')} />
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto">
                    {activeSidebarTab === 'Activity' && <ActivityFeed lead={lead} />}
                    {activeSidebarTab === 'Lead Stages' && (
                        <div>
                            <LeadStages allStages={leadStages} currentStageName={lead.currentStageName} onStatusChange={handleStatusUpdate} onStageChange={handleStageUpdate} lead={lead} />
                            <ActionGrid onNewTaskClick={handleOpenNewTask} onNewEventClick={handleOpenNewEvent} onLogCallClick={handleOpenLogCall} onEmailClick={handleOpenEmailForm} />
                        </div>
                    )}
                    {activeSidebarTab === 'Details Grid' && <LeadDetailsGrid lead={lead} />}
                    {activeSidebarTab === 'Tasks' && <TasksTab leadId={leadId} onAddTask={handleOpenNewTask} onEditTask={handleEditTask} />}
                    {activeSidebarTab === 'Events' && <EventsTab leadId={leadId} onAddEvent={handleOpenNewEvent} onEditEvent={handleEditEvent} />}
                    {activeSidebarTab === 'Call Logs' && <CallLogsTab leadId={leadId} onAddCallLog={handleOpenLogCall} onEditCallLog={handleEditCallLog} />}
                    {activeSidebarTab === 'Emails' && <EmailsTab leadId={leadId} onComposeEmail={handleOpenEmailForm} />}
                    {activeSidebarTab === 'Notes' && (
                        <div className="p-4">
                            <h3 className="font-semibold text-foreground mb-2">Notes</h3>
                            <div className="p-3 bg-background-muted rounded-lg text-sm whitespace-pre-wrap">
                                {lead.notes || 'No notes for this lead.'}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Full Details Modal */}
            <LeadFullDetailsModal
                isOpen={isFullDetailsModalOpen}
                onClose={() => setIsFullDetailsModalOpen(false)}
                lead={lead}
            />

            {/* Task Form Sidebar */}
            <AnimatePresence>
                {isTaskFormOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsTaskFormOpen(false)} />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed top-0 right-0 h-full w-full max-w-lg bg-card text-card-foreground shadow-lg z-50"
                        >
                            <CrmTaskForm item={editingTask} onSave={handleSaveTask} onCancel={() => setIsTaskFormOpen(false)} loading={formSubmitting} leadId={leadId} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Event Form Sidebar */}
            <AnimatePresence>
                {isEventFormOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsEventFormOpen(false)} />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed top-0 right-0 h-full w-full max-w-lg bg-card text-card-foreground shadow-lg z-50"
                        >
                            <CrmEventForm item={editingEvent} onSave={handleSaveEvent} onCancel={() => setIsEventFormOpen(false)} loading={formSubmitting} leadId={leadId} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Call Log Form Sidebar */}
            <AnimatePresence>
                {isCallLogFormOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsCallLogFormOpen(false)} />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed top-0 right-0 h-full w-full max-w-lg bg-card text-card-foreground shadow-lg z-50"
                        >
                            <CrmCallLogForm item={editingCallLog} onSave={handleSaveCallLog} onCancel={() => setIsCallLogFormOpen(false)} loading={formSubmitting} leadId={leadId} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Email Form Sidebar */}
            <AnimatePresence>
                {isEmailFormOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsEmailFormOpen(false)} />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed top-0 right-0 h-full w-full max-w-lg bg-card text-card-foreground shadow-lg z-50"
                        >
                            <CrmEmailForm lead={lead} onSave={handleSendEmail} onCancel={() => setIsEmailFormOpen(false)} loading={formSubmitting} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default LeadInfo;
