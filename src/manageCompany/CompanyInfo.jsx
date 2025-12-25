import React, { useState, useEffect, useCallback } from 'react';
import { Building, Edit, PlusCircle, Loader, Save } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const constructImageUrl = (relativeUrl) => {
    if (!relativeUrl) return '';
    if (relativeUrl.startsWith('data:') || relativeUrl.startsWith('http')) return relativeUrl;

    // Backend returns paths relative to the uploads root (e.g., "tenantId/folder/file.ext")
    const cleanPath = relativeUrl.startsWith('/') ? relativeUrl.slice(1) : relativeUrl;

    if (cleanPath.startsWith('uploads/')) {
        return `${API_URL}/pos/uploads/view/${cleanPath.replace('uploads/', '')}`;
    }
    return `${API_URL}/pos/uploads/view/${cleanPath}`;
};

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("No authentication token found.");
    return { "Authorization": `Bearer ${token}` };
};

const api = {
    getCompanyInfo: async () => {
        const response = await axios.get(`${API_URL}/company-info`, { headers: getAuthHeaders() });
        return response.data;
    },
    saveCompanyInfo: async (data) => {
        // The backend uses POST for both create and update.
        const response = await axios.post(`${API_URL}/company-info`, data, { headers: getAuthHeaders() });
        return response.data;
    },
    uploadLogo: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post(`${API_URL}/company-info/logo`, formData, {
            headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    getLogo: async () => {
        const response = await axios.get(`${API_URL}/company-info/logo`, {
            headers: getAuthHeaders(),
            responseType: 'blob'
        });
        return URL.createObjectURL(response.data);
    }
};

// --- Reusable Components ---
const InputField = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-foreground-muted mb-1">{label}</label>
        <input id={id} {...props} className="input bg-background-muted border-border text-foreground" />
    </div>
);

const InfoDisplay = ({ label, value }) => (
    <div>
        <p className="text-sm text-foreground-muted">{label}</p>
        <p className="font-medium text-foreground">
            {value !== null && value !== undefined && value !== '' ? value : <span className="text-foreground-muted/50">N/A</span>}
        </p>
    </div>
);

const CompanyInfo = () => {
    const [companyInfo, setCompanyInfo] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [logoFile, setLogoFile] = useState(null);

    const [logoPreview, setLogoPreview] = useState(null);
    const [fetchedLogoUrl, setFetchedLogoUrl] = useState(null);

    const initialFormData = {
        companyName: '', address: '', city: '', emirate: '', poBox: '', country: '',
        phone: '', email: '', website: '', pan: '', tan: '', gstIn: '',
        pfRegistrationNumber: '', esiRegistrationNumber: '',
        tradeLicenseNumber: '', tradeLicenseExpiry: '', trn: '', mohreEstablishmentId: '', employerBankRoutingCode: '', visaQuotaTotal: ''
    };
    const [formData, setFormData] = useState(initialFormData);

    const fetchCompanyInfo = useCallback(() => {
        setLoading(true);
        setError('');
        api.getCompanyInfo()
            .then(data => {
                if (data && data.companyName) {
                    setCompanyInfo(data);
                    setFormData(data);
                    if (data.logoUrl) {
                        api.getLogo()
                            .then(url => {
                                setFetchedLogoUrl(url);
                                setLogoPreview(url); // Also set preview for edit mode if needed
                            })
                            .catch(e => console.error("Failed to fetch logo image", e));
                    }
                } else {
                    setCompanyInfo(null);
                    setFormData(initialFormData);
                }
            })
            .catch(err => {
                console.error("Error fetching company info:", err);
                setError('Failed to load company information.');
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchCompanyInfo();
    }, [fetchCompanyInfo]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            let savedData = await api.saveCompanyInfo(formData);

            if (logoFile) {
                // Re-assign savedData with the response from logo upload which contains the updated logoUrl
                savedData = await api.uploadLogo(logoFile);
            }

            setCompanyInfo(savedData);
            setFormData(savedData);
            setLogoFile(null); // Clear the file input after successful upload
            setIsEditing(false);
            alert('Company information saved successfully!');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to save company information.';
            setError(errorMessage);
            alert(`Error: ${errorMessage}`);
        } finally {
            setSaving(false);
            // No need to call fetchCompanyInfo() as we are setting state from the response.
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData(companyInfo || initialFormData);
        setFormData(companyInfo || initialFormData);
        setLogoPreview(fetchedLogoUrl);
    };

    if (loading) {
        return <div className="flex justify-center items-center p-10"><Loader className="animate-spin text-blue-600" /></div>;
    }

    if (isEditing) {
        return (
            <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-sm space-y-8">
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</div>}
                <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Company Logo</h3>
                    <div className="flex items-center gap-6">
                        {logoPreview ? (
                            <img src={logoPreview} alt="Logo" className="h-20 w-20 object-contain rounded-md border p-1 bg-card" />
                        ) : (
                            <div className="h-20 w-20 flex items-center justify-center bg-background-muted rounded-md text-foreground-muted text-sm">No Logo</div>
                        )}
                        <div className="flex-1">
                            <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-foreground-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField label="Company Name" id="companyName" name="companyName" value={formData.companyName || ''} onChange={handleChange} required className="md:col-span-3" />
                    <InputField label="Email" id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} />
                    <InputField label="Phone" id="phone" name="phone" value={formData.phone || ''} onChange={handleChange} />
                    <InputField label="Website" id="website" name="website" value={formData.website || ''} onChange={handleChange} />
                    <InputField label="Address" id="address" name="address" value={formData.address || ''} onChange={handleChange} className="md:col-span-3" />
                    <InputField label="City" id="city" name="city" value={formData.city || ''} onChange={handleChange} />
                    <InputField label="Emirate" id="emirate" name="emirate" value={formData.emirate || ''} onChange={handleChange} />
                    <InputField label="P.O. Box" id="poBox" name="poBox" value={formData.poBox || ''} onChange={handleChange} />
                    <InputField label="Country" id="country" name="country" value={formData.country || ''} onChange={handleChange} />
                    <InputField label="PAN / TRN" id="pan" name="pan" value={formData.pan || ''} onChange={handleChange} />
                    <InputField label="GSTIN / TAN" id="tan" name="tan" value={formData.tan || ''} onChange={handleChange} />
                    <InputField label="PF Registration No." id="pfRegistrationNumber" name="pfRegistrationNumber" value={formData.pfRegistrationNumber || ''} onChange={handleChange} />
                    <InputField label="ESI Registration No." id="esiRegistrationNumber" name="esiRegistrationNumber" value={formData.esiRegistrationNumber || ''} onChange={handleChange} />

                    <div className="md:col-span-3 border-t border-border mt-4 mb-2 pt-4">
                        <h4 className="font-semibold text-foreground-muted mb-4">UAE WPS & Statutory Details</h4>
                    </div>
                    <InputField label="MOHRE Establishment ID" id="mohreEstablishmentId" name="mohreEstablishmentId" value={formData.mohreEstablishmentId || ''} onChange={handleChange} />
                    <InputField label="Employer Bank Routing Code (Agent ID)" id="employerBankRoutingCode" name="employerBankRoutingCode" value={formData.employerBankRoutingCode || ''} onChange={handleChange} />
                    <InputField label="Total Visa Quota" id="visaQuotaTotal" name="visaQuotaTotal" type="number" value={formData.visaQuotaTotal ?? ''} onChange={handleChange} />
                    <InputField label="Trade License Number" id="tradeLicenseNumber" name="tradeLicenseNumber" value={formData.tradeLicenseNumber || ''} onChange={handleChange} />
                    <InputField label="Trade License Expiry" id="tradeLicenseExpiry" name="tradeLicenseExpiry" type="date" value={formData.tradeLicenseExpiry || ''} onChange={handleChange} />
                    <InputField label="TRN (Tax Registration No.)" id="trn" name="trn" value={formData.trn || ''} onChange={handleChange} />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                    <button type="button" onClick={handleCancel} className="btn-secondary" disabled={saving}>Cancel</button>
                    <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
                        {saving ? <Loader className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                        Save Changes
                    </button>
                </div>
            </form>
        );
    }

    if (!companyInfo) {
        return (
            <div className="text-center py-16 bg-card rounded-lg shadow-sm border-2 border-dashed border-border">
                <Building className="mx-auto h-12 w-12 text-foreground-muted/50" />
                <h3 className="mt-2 text-lg font-medium text-foreground">No Company Information</h3>
                <p className="mt-1 text-sm text-foreground-muted">Get started by adding your company's details.</p>
                <div className="mt-6">
                    <button onClick={() => setIsEditing(true)} className="btn-primary flex items-center mx-auto gap-2">
                        <PlusCircle size={16} /> Add Company Details
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-card rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-foreground">Company Profile</h3>
                <button onClick={() => setIsEditing(true)} className="btn-secondary flex items-center gap-2">
                    <Edit size={16} /> Edit
                </button>
            </div>
            <div className="space-y-6">
                {companyInfo.logoUrl && (
                    <Section title="Company Logo">
                        <img src={fetchedLogoUrl || constructImageUrl(companyInfo.logoUrl)} alt="Company Logo" className="h-24 w-auto object-contain rounded-md border p-2 bg-white" />
                    </Section>
                )}
                <Section title="General Information">
                    <InfoDisplay label="Company Name" value={companyInfo.companyName} />
                    <InfoDisplay label="Email" value={companyInfo.email} />
                    <InfoDisplay label="Phone" value={companyInfo.phone} />
                    <InfoDisplay label="Website" value={companyInfo.website} />
                </Section>
                <Section title="Address">
                    <InfoDisplay label="Address" value={companyInfo.address} />
                    <InfoDisplay label="City" value={companyInfo.city} />
                    <InfoDisplay label="Emirate" value={companyInfo.emirate} />
                    <InfoDisplay label="P.O. Box" value={companyInfo.poBox} />
                    <InfoDisplay label="Country" value={companyInfo.country} />
                </Section>
                <Section title="Statutory Details">
                    <InfoDisplay label="PAN / TRN" value={companyInfo.pan} />
                    <InfoDisplay label="GSTIN / TAN" value={companyInfo.tan} />
                    <InfoDisplay label="PF Registration No." value={companyInfo.pfRegistrationNumber} />
                    <InfoDisplay label="ESI Registration No." value={companyInfo.esiRegistrationNumber} />
                </Section>
                <Section title="UAE WPS & Compliance">
                    <InfoDisplay label="MOHRE Establishment ID" value={companyInfo.mohreEstablishmentId} />
                    <InfoDisplay label="Total Visa Quota" value={companyInfo.visaQuotaTotal} />
                    <InfoDisplay label="Employer Bank Routing Code" value={companyInfo.employerBankRoutingCode} />
                    <InfoDisplay label="Trade License Number" value={companyInfo.tradeLicenseNumber} />
                    <InfoDisplay label="Trade License Expiry" value={companyInfo.tradeLicenseExpiry} />
                    <InfoDisplay label="TRN" value={companyInfo.trn} />
                </Section>
            </div>
        </div>
    );
};

const Section = ({ title, children }) => (
    <div className="p-4 border border-border rounded-lg bg-background-muted">
        <h4 className="font-semibold mb-4 text-foreground-muted">{title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children}
        </div>
    </div>
);

export default CompanyInfo;
