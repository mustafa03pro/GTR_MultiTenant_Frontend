const API_URL = import.meta.env.VITE_API_BASE_URL;

export const formatPrice = (cents) => `AED ${(cents / 100).toFixed(2)}`;

export const constructImageUrl = (relativeUrl) => {
    if (!relativeUrl) return '';
    if (relativeUrl.startsWith('data:') || relativeUrl.startsWith('http')) {
        return relativeUrl;
    }

    // Backend returns paths relative to the uploads root (e.g., "tenantId/folder/file.ext")
    // The view endpoint is /api/pos/uploads/view/**

    const cleanPath = relativeUrl.startsWith('/') ? relativeUrl.slice(1) : relativeUrl;

    // Handle potential legacy paths starting with 'uploads/'
    if (cleanPath.startsWith('uploads/')) {
        return `${API_URL}/pos/uploads/view/${cleanPath.replace('uploads/', '')}`;
    }

    return `${API_URL}/pos/uploads/view/${cleanPath}`;
};

export const formatVariantAttributes = (attributes) => {
    if (!attributes || Object.keys(attributes).length === 0) return null;
    return Object.entries(attributes).map(([key, value]) => value).join(', ');
};