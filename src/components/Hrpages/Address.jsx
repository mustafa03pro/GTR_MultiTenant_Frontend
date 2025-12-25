import React, { useState, useEffect } from 'react';
import { Pencil, Check, X, Loader } from 'lucide-react';
import axios from 'axios';

// Reusable component for a field in a profile card
const InfoField = ({ label, value }) => (
    <div>
        <p className="text-sm text-foreground-muted">{label}</p>
        <p className="text-base font-medium text-foreground">{value || 'N/A'}</p>
    </div>
);

// Reusable card component for profile sections
const ProfileCard = ({ title, children }) => (
    <div className="bg-background-muted rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-3 mb-4">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
            {children}
        </div>
    </div>
);

// Reusable component for an editable field
const EditField = ({ label, name, value, onChange, type = 'text', options = [] }) => {
    const commonProps = {
        id: name,
        name: name,
        value: value ?? '',
        onChange: onChange,
        className: "input bg-background-muted border-border text-foreground"
    };

    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-foreground-muted">{label}</label>
            {type === 'textarea' ? (
                <textarea {...commonProps} rows="3" />
            ) : type === 'select' ? (
                <select {...commonProps}>
                    <option value="">Select...</option>
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            ) : (
                <input {...commonProps} type={type} />
            )}
        </div>
    );
};

const Address = ({ employee }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const initialFormState = {
        address: '', city: '', state: '', country: '', postalCode: '',
        emergencyContactName: '', emergencyContactRelation: '', emergencyContactPhone: '',
        bankName: '', bankAccountNumber: '', ifscCode: '', iban: '', bloodGroup: '', notes: '',
        laborCardNumber: '', laborCardExpiry: '', routingCode: '', isWpsRegistered: false,
        nationality: '', preferredName: '', jobType: '', office: '', paymentMethod: '', molId: ''
    };

    useEffect(() => {
        const fetchProfile = async () => {
            if (!employee?.employeeCode) return;
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/employee-profiles/${employee.employeeCode}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                setProfile(response.data);
                setFormData(response.data);
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setProfile(null);
                    setFormData(initialFormState);
                } else {
                    console.error("Error fetching employee profile:", err);
                    setError('Failed to load employee profile data.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [employee, API_URL]);

    if (!employee) {
        return <div className="text-center text-slate-500">No employee selected.</div>;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData(profile || initialFormState);
        setError('');
    };

    const handleSave = async () => {
        setSaveLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`${API_URL}/employee-profiles/${employee.employeeCode}`, formData, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            setProfile(response.data);
            setFormData(response.data);
            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (err) {
            console.error("Error updating profile:", err);
            const errorMessage = err.response?.data?.message || 'Failed to update profile. Please try again.';
            setError(errorMessage);
            alert(errorMessage);
        } finally {
            setSaveLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center p-8"><Loader className="animate-spin h-8 w-8 text-blue-600" /></div>;
    }

    const currentData = isEditing ? formData : profile || {};

    return (
        <div>
            <div className="flex justify-end mb-4 gap-2">
                {isEditing ? (
                    <>
                        <button onClick={handleCancel} className="btn-secondary">Cancel</button>
                        <button onClick={handleSave} className="btn-primary flex items-center" disabled={saveLoading}>
                            {saveLoading ? <Loader className="animate-spin h-4 w-4 mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                            Save
                        </button>
                    </>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="btn-primary flex items-center">
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Details
                    </button>
                )}
            </div>
            {error && <div className="text-center text-red-600 p-3 bg-red-500/10 rounded-md mb-4">{error}</div>}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProfileCard title="Personal Details">
                    {isEditing ? <>
                        <EditField label="Preferred Name" name="preferredName" value={formData.preferredName} onChange={handleChange} />
                        <EditField label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
                    </> : <>
                        <InfoField label="Preferred Name" value={currentData.preferredName} />
                        <InfoField label="Nationality" value={currentData.nationality} />
                    </>}
                </ProfileCard>

                <ProfileCard title="Employment Info">
                    {isEditing ? <>
                        <EditField label="Job Type" name="jobType" value={formData.jobType} onChange={handleChange} type="select" options={[{ value: 'FULL_TIME', label: 'Full Time' }, { value: 'PART_TIME', label: 'Part Time' }, { value: 'CONTRACT', label: 'Contract' }, { value: 'INTERN', label: 'Intern' }]} />
                        <EditField label="Office/Branch" name="office" value={formData.office} onChange={handleChange} />
                    </> : <>
                        <InfoField label="Job Type" value={currentData.jobType} />
                        <InfoField label="Office/Branch" value={currentData.office} />
                    </>}
                </ProfileCard>

                <ProfileCard title="Contact & Address">
                    {isEditing ? <>
                        <EditField label="Address" name="address" value={formData.address} onChange={handleChange} />
                        <EditField label="City" name="city" value={formData.city} onChange={handleChange} />
                        <EditField label="State" name="state" value={formData.state} onChange={handleChange} />
                        <EditField label="Country" name="country" value={formData.country} onChange={handleChange} />
                        <EditField label="Postal Code" name="postalCode" value={formData.postalCode} onChange={handleChange} />
                        <EditField label="Blood Group" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} />
                    </> : <>
                        <InfoField label="Address" value={currentData.address} />
                        <InfoField label="City" value={currentData.city} />
                        <InfoField label="State" value={currentData.state} />
                        <InfoField label="Country" value={currentData.country} />
                        <InfoField label="Postal Code" value={currentData.postalCode} />
                        <InfoField label="Blood Group" value={currentData.bloodGroup} />
                    </>}
                </ProfileCard>

                <ProfileCard title="Emergency Contact">
                    {isEditing ? <>
                        <EditField label="Contact Name" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} />
                        <EditField label="Relation" name="emergencyContactRelation" value={formData.emergencyContactRelation} onChange={handleChange} />
                        <EditField label="Phone" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} />
                    </> : <>
                        <InfoField label="Contact Name" value={currentData.emergencyContactName} />
                        <InfoField label="Relation" value={currentData.emergencyContactRelation} />
                        <InfoField label="Phone" value={currentData.emergencyContactPhone} />
                    </>}
                </ProfileCard>

                <ProfileCard title="Financial Information">
                    {isEditing ? <>
                        <EditField label="Bank Name" name="bankName" value={formData.bankName} onChange={handleChange} />
                        <EditField label="Account Number" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} />
                        <EditField label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleChange} />
                        <EditField label="IBAN" name="iban" value={formData.iban} onChange={handleChange} />
                        <EditField label="Payment Method" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} type="select" options={[{ value: 'BANK_TRANSFER', label: 'Bank Transfer' }, { value: 'CHEQUE', label: 'Cheque' }, { value: 'CASH', label: 'Cash' }]} />
                    </> : <>
                        <InfoField label="Bank Name" value={currentData.bankName} />
                        <InfoField label="Account Number" value={currentData.bankAccountNumber} />
                        <InfoField label="IFSC Code" value={currentData.ifscCode} />
                        <InfoField label="IBAN" value={currentData.iban} />
                        <InfoField label="Payment Method" value={currentData.paymentMethod} />
                    </>}
                </ProfileCard>

                <ProfileCard title="WPS & Statutory Details">
                    {isEditing ? <>
                        <EditField label="Labor Card Number (MOHRE ID)" name="laborCardNumber" value={formData.laborCardNumber} onChange={handleChange} />
                        <EditField label="Labor Card Expiry" name="laborCardExpiry" value={formData.laborCardExpiry} onChange={handleChange} type="date" />
                        <EditField label="MOL ID (Person ID)" name="molId" value={formData.molId} onChange={handleChange} />
                        <EditField label="Routing Code (Agent ID)" name="routingCode" value={formData.routingCode} onChange={handleChange} />
                        <div className="flex items-center pt-6">
                            <input
                                id="isWpsRegistered"
                                name="isWpsRegistered"
                                type="checkbox"
                                checked={formData.isWpsRegistered || false}
                                onChange={(e) => setFormData(prev => ({ ...prev, isWpsRegistered: e.target.checked }))}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isWpsRegistered" className="ml-2 block text-sm text-foreground">
                                WPS Registered
                            </label>
                        </div>
                    </> : <>
                        <InfoField label="Labor Card Number (MOHRE ID)" value={currentData.laborCardNumber} />
                        <InfoField label="Labor Card Expiry" value={currentData.laborCardExpiry} />
                        <InfoField label="MOL ID (Person ID)" value={currentData.molId} />
                        <InfoField label="Routing Code (Agent ID)" value={currentData.routingCode} />
                        <InfoField label="WPS Registered" value={currentData.isWpsRegistered ? 'Yes' : 'No'} />
                    </>}
                </ProfileCard>

                <ProfileCard title="Notes">
                    {isEditing ? (
                        <div className="sm:col-span-2">
                            <EditField label="Additional Notes" name="notes" value={formData.notes} onChange={handleChange} type="textarea" />
                        </div>
                    ) : (
                        <div className="sm:col-span-2">
                            <InfoField label="Additional Notes" value={currentData.notes} />
                        </div>
                    )}
                </ProfileCard>
            </div>
        </div>
    );
};

export default Address;
