//Canonical order-status vocabulary shared by the admin panel and the
//delivery dashboard. Kept in one place so the badges, filters and timeline
//never drift apart.
export const ORDER_STATUSES = [
    'Pending',
    'Confirmed',
    'Packed',
    'Shipped',
    'Out for Delivery',
    'Delivered',
    'Cancelled'
];

export const ACTIVE_STATUSES = ORDER_STATUSES.filter(s => s !== 'Delivered' && s !== 'Cancelled');

export const STATUS_META = {
    'Pending': { color: '#e8a010', badge: 'ad-badge--warning' },
    'Confirmed': { color: '#6366f1', badge: 'ad-badge--info' },
    'Packed': { color: '#3b82f6', badge: 'ad-badge--info' },
    'Shipped': { color: '#8b5cf6', badge: 'ad-badge--primary' },
    'Out for Delivery': { color: '#fb641b', badge: 'ad-badge--primary' },
    'Delivered': { color: '#1f9d55', badge: 'ad-badge--success' },
    'Cancelled': { color: '#e0483e', badge: 'ad-badge--danger' }
};

export const statusBadge = status => (STATUS_META[status] || {}).badge || 'ad-badge--muted';

export const statusColor = status => (STATUS_META[status] || {}).color || '#9098a8';
