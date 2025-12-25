import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { Loader, Filter, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ProductionSchedule = () => {
    const calendarRef = useRef(null);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter Data
    const [employees, setEmployees] = useState([]);
    const [workGroups, setWorkGroups] = useState([]);
    const [manufacturingOrders, setManufacturingOrders] = useState([]);

    // Active Filters
    const [filterType, setFilterType] = useState('all'); // all, employee, workstation, mo
    const [selectedItemId, setSelectedItemId] = useState('all');

    useEffect(() => {
        fetchFilterData();
    }, []);

    const fetchFilterData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { "Authorization": `Bearer ${token}` };

            const [empRes, wgRes, moRes] = await Promise.allSettled([
                axios.get(`${API_URL}/employees/all`, { headers }),
                axios.get(`${API_URL}/production/work-groups`, { headers }),
                axios.get(`${API_URL}/production/manufacturing-orders`, { headers })
            ]);

            if (empRes.status === 'fulfilled') setEmployees(empRes.value.data);
            if (wgRes.status === 'fulfilled') setWorkGroups(wgRes.value.data);
            if (moRes.status === 'fulfilled') setManufacturingOrders(moRes.value.data);

        } catch (error) {
            console.error("Failed to fetch filter options", error);
        }
    };

    const fetchSchedules = async (start, end) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = {
                start: start.toISOString(),
                end: end.toISOString(),
            };

            // Backend logic: workGroupId takes precedence over employeeId.
            // Client-side MO filtering happens after fetch.
            if (filterType === 'employee' && selectedItemId !== 'all') {
                params.employeeId = selectedItemId;
            } else if (filterType === 'workstation' && selectedItemId !== 'all') {
                params.workGroupId = selectedItemId;
            }

            const response = await axios.get(`${API_URL}/production-schedules`, {
                headers: { "Authorization": `Bearer ${token}` },
                params
            });

            let data = response.data;

            // Client-side filtering for Manufacturing Order
            if (filterType === 'mo' && selectedItemId !== 'all') {
                data = data.filter(s => s.manufacturingOrder?.id === parseInt(selectedItemId));
            }

            // Map to calendar events
            const events = data.map(sch => ({
                id: sch.id,
                title: `${sch.manufacturingOrder?.orderNumber || 'MO'} - ${sch.workGroup?.name || 'No WorkGroup'}`,
                start: sch.startTime,
                end: sch.endTime,
                backgroundColor: getStatusColor(sch.status),
                borderColor: getStatusColor(sch.status),
                extendedProps: {
                    status: sch.status,
                    employeeName: sch.employee ? `${sch.employee.firstName} ${sch.employee.lastName}` : 'Unassigned',
                    moNumber: sch.manufacturingOrder?.orderNumber,
                    itemName: sch.manufacturingOrder?.productName || 'Unknown Item', // Assuming properties based on typical structure
                    notes: sch.notes
                }
            }));

            setSchedules(events);

        } catch (error) {
            console.error("Error fetching schedules", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'COMPLETED': return '#10b981'; // Green
            case 'IN_PROGRESS': return '#3b82f6'; // Blue
            case 'SCHEDULED': return '#6366f1'; // Indigo
            case 'CANCELLED': return '#ef4444'; // Red
            default: return '#6b7280'; // Gray
        }
    };

    // Calendar Handlers
    const handleDatesSet = (dateInfo) => {
        fetchSchedules(dateInfo.start, dateInfo.end);
    };

    const handleFilterTypeChange = (e) => {
        setFilterType(e.target.value);
        setSelectedItemId('all');
    };

    const handleFilterItemChange = (e) => {
        setSelectedItemId(e.target.value);
        // We need to re-fetch if we change filters as it might change backend params
        // However, standard React state update won't be immediate in the fetch call if called directly.
        // Effect hook on dependencies is safer, but handleDatesSet triggers fetch too. 
        // Let's rely on a forceful refetch or useEffect.
    };

    // Re-fetch when filters change, keeping current view range
    useEffect(() => {
        if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            fetchSchedules(calendarApi.view.activeStart, calendarApi.view.activeEnd);
        }
    }, [filterType, selectedItemId]);


    const renderEventContent = (eventInfo) => {
        return (
            <div className="p-1 text-xs overflow-hidden leading-tight">
                <div className="font-bold">{eventInfo.event.extendedProps.moNumber}</div>
                <div className="truncate">{eventInfo.event.extendedProps.itemName}</div>
                <div className="italic text-[10px] opacity-90">{eventInfo.event.title}</div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col space-y-4 p-2 md:p-4">
            {/* Header & Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <CalendarIcon className="h-6 w-6 text-blue-600" />
                        Production Schedule
                    </h1>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    {/* Filter Type Dropdown */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-4 w-4 text-gray-500" />
                        </div>
                        <select
                            value={filterType}
                            onChange={handleFilterTypeChange}
                            className="pl-10 pr-8 py-2 w-full sm:w-40 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white appearance-none"
                        >
                            <option value="all">All Schedules</option>
                            <option value="employee">By Employee</option>
                            <option value="workstation">By Workstation</option>
                            <option value="mo">By MO</option>
                        </select>
                    </div>

                    {/* Filter Item Dropdown */}
                    {filterType !== 'all' && (
                        <select
                            value={selectedItemId}
                            onChange={handleFilterItemChange}
                            className="px-3 py-2 w-full sm:w-48 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                        >
                            <option value="all">
                                {filterType === 'employee' ? 'All Employees' :
                                    filterType === 'workstation' ? 'All Workstations' : 'All Orders'}
                            </option>

                            {filterType === 'employee' && employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                            ))}
                            {filterType === 'workstation' && workGroups.map(wg => (
                                <option key={wg.id} value={wg.id}>{wg.name}</option>
                            ))}
                            {filterType === 'mo' && manufacturingOrders.map(mo => (
                                <option key={mo.id} value={mo.id}>{mo.orderNumber}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Calendar Container */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2 md:p-4 overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-800/50 flex items-center justify-center backdrop-blur-sm">
                        <Loader className="h-8 w-8 text-blue-600 animate-spin" />
                    </div>
                )}

                <style>{`
                    .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 600; }
                    .fc-button-primary { background-color: #3b82f6 !important; border-color: #3b82f6 !important; }
                    .fc-button-primary:hover { background-color: #2563eb !important; border-color: #2563eb !important; }
                    .fc-button-active { background-color: #1d4ed8 !important; border-color: #1d4ed8 !important; }
                    .fc-event { cursor: pointer; border: none; }
                    .fc-daygrid-event { border-radius: 4px; }
                `}</style>

                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={schedules}
                    datesSet={handleDatesSet}
                    eventContent={renderEventContent}
                    height="100%"
                    slotMinTime="06:00:00"
                    slotMaxTime="22:00:00"
                    allDaySlot={false}
                    className="h-full"
                />
            </div>
        </div>
    );
};

export default ProductionSchedule;
