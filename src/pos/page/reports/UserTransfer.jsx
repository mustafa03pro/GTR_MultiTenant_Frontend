import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';

const UserTransfer = () => {
    const [users, setUsers] = useState([]);
    const [stores, setStores] = useState([]);
    const [formData, setFormData] = useState({
        userId: '',
        fromStoreId: '',
        toStoreId: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { "Authorization": `Bearer ${token}` };

                // Fetch Users and Stores in parallel
                const [usersResponse, storesResponse] = await Promise.all([
                    axios.get(`${API_URL}/users`, { headers }),
                    axios.get(`${API_URL}/pos/stores`, { headers }) // Assuming this endpoint exists based on previous context
                ]);

                setUsers(usersResponse.data);
                setStores(storesResponse.data);
            } catch (error) {
                console.error("Error fetching data:", error);
                setMessage({ type: 'error', text: 'Failed to load users or stores.' });
            }
        };

        fetchData();
    }, [API_URL]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear message on change
        if (message) setMessage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.userId || !formData.fromStoreId || !formData.toStoreId) {
            setMessage({ type: 'error', text: 'Please select all fields.' });
            return;
        }

        if (formData.fromStoreId === formData.toStoreId) {
            setMessage({ type: 'error', text: 'Source and Destination stores cannot be the same.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('token');
            const headers = { "Authorization": `Bearer ${token}` };
            
            // Backend expects Long (numbers) for IDs
            const payload = {
                userId: parseInt(formData.userId, 10),
                fromStoreId: parseInt(formData.fromStoreId, 10),
                toStoreId: parseInt(formData.toStoreId, 10)
            };

            await axios.post(`${API_URL}/pos/reports/user-transfer`, payload, { headers });

            setMessage({ type: 'success', text: 'User activity transferred successfully.' });
            setFormData({ userId: '', fromStoreId: '', toStoreId: '' }); // Reset form
        } catch (error) {
            console.error("Transfer error:", error);
            const errorMsg = error.response?.data?.message || error.response?.data || 'Transfer failed. Please check the inputs.';
            setMessage({ type: 'error', text: typeof errorMsg === 'string' ? errorMsg : 'Transfer failed.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">User Transfer</h1>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <div className="mb-6">
                    <p className="text-slate-600">
                        Transfer all sales activity for a user from one store to another. 
                        This action allows you to correct records if a user was assigned to the wrong store.
                    </p>
                </div>

                {message && (
                    <div className={`p-4 mb-6 rounded-lg flex items-center gap-3 ${
                        message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <span>{message.text}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* User Selection */}
                        <div className="col-span-1 md:col-span-2">
                            <label htmlFor="userId" className="block text-sm font-medium text-slate-700 mb-1">Select User</label>
                            <select
                                id="userId"
                                name="userId"
                                value={formData.userId}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                required
                            >
                                <option value="">-- Select User --</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* From Store */}
                        <div>
                            <label htmlFor="fromStoreId" className="block text-sm font-medium text-slate-700 mb-1">From Store (Source)</label>
                            <select
                                id="fromStoreId"
                                name="fromStoreId"
                                value={formData.fromStoreId}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                required
                            >
                                <option value="">-- Select Source Store --</option>
                                {stores.map(store => (
                                    <option key={store.id} value={store.id}>
                                        {store.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* To Store */}
                        <div>
                            <label htmlFor="toStoreId" className="block text-sm font-medium text-slate-700 mb-1">To Store (Destination)</label>
                            <select
                                id="toStoreId"
                                name="toStoreId"
                                value={formData.toStoreId}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                required
                            >
                                <option value="">-- Select Destination Store --</option>
                                {stores.map(store => (
                                    <option key={store.id} value={store.id}>
                                        {store.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium ${
                                loading ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                        >
                            <Save size={18} />
                            {loading ? 'Transferring...' : 'Transfer Activity'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserTransfer;
