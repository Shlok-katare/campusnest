import './index.css';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Building2,
    MapPin,
    CheckCircle2,
    Clock,
    IndianRupee,
    PlusCircle,
    Utensils,
    Shirt,
    Bike,
    X,
    UserCheck,
    Search,
    Heart,
    SlidersHorizontal,
    BedDouble,
    Phone,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    SearchX,
    Loader2,
    KeyRound,
    AlertTriangle,
    RefreshCw,
    Wallet,
    ImagePlus
} from 'lucide-react';
import { api, ApiError } from './api';
import { MAX_PHOTOS, optimizedImage, prepareImage, uploadConfigured, uploadImage } from './upload';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const HUBS = [
    'IIT Hyderabad (Kandi)',
    'DU North Campus (Delhi)',
    'Christ University (Bangalore)',
    'IIT Bombay (Powai)'
];
const TYPES = ['PG / Hostel', 'Flat Sharing'];
const GENDERS = ['Boys', 'Girls', 'Any'];
const SHARING = ['Single', 'Double Sharing', 'Triple Sharing', 'Private Room in Flat'];
const AMENITY_OPTIONS = [
    'Meals Included',
    'Wi-Fi',
    'RO Water',
    'Power Backup',
    'Washing Machine',
    'AC',
    'Attached Washroom',
    '24/7 Security',
    'Bike Parking',
    'Refrigerator'
];
const SORTS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'rent_asc', label: 'Rent: low to high' },
    { value: 'rent_desc', label: 'Rent: high to low' },
    { value: 'distance', label: 'Nearest to campus' }
];
const MAX_RENT = 20000;

const DEFAULT_FILTERS = {
    q: '',
    hub: 'ALL',
    type: 'ALL',
    gender: 'ALL',
    source: 'ALL',
    maxRent: MAX_RENT,
    amenities: [],
    verifiedOnly: false,
    savedOnly: false,
    sort: 'newest'
};

const EMPTY_FORM = {
    title: '',
    type: 'PG / Hostel',
    hub: HUBS[0],
    distanceKm: '',
    rent: '',
    deposit: '',
    gender: 'Boys',
    sharing: 'Double Sharing',
    availableBeds: 1,
    amenities: ['Wi-Fi', 'RO Water', 'Power Backup'],
    rules: '',
    imageUrl: '',
    phone: '',
    submitterName: '',
    role: 'Senior Student (Outgoing)',
    landlordName: ''
};

const CAMPUS_SERVICES = [
    {
        id: 1,
        name: 'Annapurna Daily Tiffin Express',
        category: 'Meal Service',
        icon: Utensils,
        price: '₹2,800/month',
        description: 'Fresh homemade lunch & dinner delivered directly to hostel gate or flat.',
        tag: 'Most Popular'
    },
    {
        id: 2,
        name: 'DhobiGhat Campus Laundry',
        category: 'Laundry',
        icon: Shirt,
        price: '₹899/month (40 pcs)',
        description: 'Twice-weekly door pickup, wash, iron, and same-bag return within 48 hours.',
        tag: 'Fast Turnaround'
    },
    {
        id: 3,
        name: 'CampusRide EV Scooty Rental',
        category: 'Mobility',
        icon: Bike,
        price: '₹1,499/month',
        description: 'Keyless electric scooter subscription with campus charging station access.',
        tag: 'Zero Petrol'
    }
];

const GLOBAL_CSS = `
.cn-root { font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; letter-spacing: normal; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
.cn-root * { letter-spacing: inherit; }
@keyframes cn-fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.cn-fade-up { animation: cn-fade-up .4s ease both; }
@keyframes cn-pop { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: none; } }
.cn-pop { animation: cn-pop .2s ease both; }
@media (prefers-reduced-motion: reduce) { .cn-fade-up, .cn-pop { animation: none; } }
`;

const focusRing =
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const loadStored = (storage, key, fallback) => {
    try {
        const raw = storage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

const saveStored = (storage, key, value) => {
    try {
        if (value === null || value === '' || value === undefined) storage.removeItem(key);
        else storage.setItem(key, JSON.stringify(value));
    } catch {
        /* storage unavailable - ignore */
    }
};

const formatINR = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

const PHONE_RE = /^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/;
const URL_RE = /^https?:\/\/\S+$/i;

const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
const isNewListing = (p) => Date.now() - p.createdAt < THREE_DAYS;

/* ------------------------------------------------------------------ */
/* Small presentational components                                     */
/* ------------------------------------------------------------------ */

function Toast({ message, onClose }) {
    if (!message) return null;
    return (
        <div
            role="status"
            className="cn-pop fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] max-w-[92vw] bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-3"
        >
            <span>{message}</span>
            <button onClick={onClose} aria-label="Dismiss" className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

function StatusBadge({ status }) {
    return status === 'VERIFIED' ? (
        <span className="flex items-center gap-1 bg-emerald-600/90 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
        </span>
    ) : (
        <span className="flex items-center gap-1 bg-amber-500/90 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow">
            <Clock className="w-3.5 h-3.5" /> Pending Verification
        </span>
    );
}

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block font-semibold text-slate-700 mb-1">{label}</label>
            {children}
            {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
        </div>
    );
}

const inputCls =
    'w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none bg-white';

function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse">
            <div className="h-48 bg-slate-200" />
            <div className="p-5 space-y-3">
                <div className="h-5 w-24 bg-slate-200 rounded" />
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
                <div className="h-3 w-1/2 bg-slate-100 rounded" />
                <div className="flex gap-2 pt-2">
                    <div className="h-5 w-16 bg-slate-100 rounded" />
                    <div className="h-5 w-20 bg-slate-100 rounded" />
                    <div className="h-5 w-14 bg-slate-100 rounded" />
                </div>
            </div>
        </div>
    );
}

function PropertyCard({ property, saved, onToggleSave, onOpen, index }) {
    return (
        <div
            className="cn-fade-up bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition duration-200 flex flex-col"
            style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
        >
            <div className="relative h-48 bg-slate-200 overflow-hidden group">
                <img
                    src={optimizedImage(property.images[0], 800)}
                    alt={property.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-3 left-3 flex flex-col items-start gap-1">
                    <StatusBadge status={property.status} />
                    {isNewListing(property) && (
                        <span className="bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md shadow">
                            New
                        </span>
                    )}
                </div>
                <button
                    onClick={() => onToggleSave(property.id)}
                    aria-label={saved ? 'Remove from saved' : 'Save room'}
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow hover:scale-110 transition ${focusRing}`}
                >
                    <Heart className={`w-4 h-4 ${saved ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
                </button>
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded">
                    {property.submitterRole}
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xl font-bold text-slate-900">
                            {formatINR(property.rent)}
                            <span className="text-xs font-normal text-slate-500">/mo</span>
                        </span>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {property.sharing}
                        </span>
                    </div>

                    <h3 className="font-semibold text-slate-900 mt-2 line-clamp-1">{property.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">
                            {property.distance} • {property.hub}
                        </span>
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1">
                        <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">
                            {property.gender === 'Any' ? 'Co-ed' : property.gender}
                        </span>
                        {property.amenities.slice(0, 3).map((a) => (
                            <span key={a} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                {a}
                            </span>
                        ))}
                        {property.amenities.length > 3 && (
                            <span className="text-[11px] text-slate-400 px-1 py-0.5">
                                +{property.amenities.length - 3}
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span
                        className={`text-xs font-medium ${property.availableBeds > 0 ? 'text-slate-500' : 'text-red-600'}`}
                    >
                        {property.availableBeds > 0
                            ? `${property.availableBeds} ${property.availableBeds === 1 ? 'bed' : 'beds'} open`
                            : 'Fully booked'}
                    </span>
                    <button
                        onClick={() => onOpen(property)}
                        className={`px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition ${focusRing}`}
                    >
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
}

function FilterPanel({ filters, setFilters, onReset, activeCount }) {
    const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
    const toggleAmenity = (a) =>
        set({
            amenities: filters.amenities.includes(a)
                ? filters.amenities.filter((x) => x !== a)
                : [...filters.amenities, a]
        });

    const chip = (active) =>
        `px-3 py-1.5 rounded-lg text-xs font-medium transition ${focusRing} ${
            active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5 text-xs">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-600" /> Filters
                    {activeCount > 0 && (
                        <span className="bg-indigo-600 text-white rounded-full px-1.5 py-0.5 text-[10px]">
                            {activeCount}
                        </span>
                    )}
                </h3>
                <button
                    onClick={onReset}
                    disabled={activeCount === 0}
                    className="text-indigo-600 font-semibold disabled:text-slate-300 disabled:cursor-not-allowed"
                >
                    Clear all
                </button>
            </div>

            <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Campus hub</label>
                <select value={filters.hub} onChange={(e) => set({ hub: e.target.value })} className={inputCls}>
                    <option value="ALL">All campuses</option>
                    {HUBS.map((h) => (
                        <option key={h}>{h}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Property type</label>
                <div className="flex flex-wrap gap-1.5">
                    {['ALL', ...TYPES].map((t) => (
                        <button key={t} onClick={() => set({ type: t })} className={chip(filters.type === t)}>
                            {t === 'ALL' ? 'All' : t}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Suitable for</label>
                <div className="flex flex-wrap gap-1.5">
                    {['ALL', ...GENDERS].map((g) => (
                        <button key={g} onClick={() => set({ gender: g })} className={chip(filters.gender === g)}>
                            {g === 'ALL' ? 'Anyone' : g === 'Any' ? 'Co-ed' : g}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Listed by</label>
                <div className="flex flex-wrap gap-1.5">
                    {[
                        { label: 'Everyone', value: 'ALL' },
                        { label: 'Landlords', value: 'DIRECT' },
                        { label: 'Peer scouts', value: 'PEER' }
                    ].map((s) => (
                        <button key={s.value} onClick={() => set({ source: s.value })} className={chip(filters.source === s.value)}>
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-slate-700">Max monthly rent</label>
                    <span className="font-bold text-indigo-700">
                        {filters.maxRent >= MAX_RENT ? 'Any' : formatINR(filters.maxRent)}
                    </span>
                </div>
                <input
                    type="range"
                    min={3000}
                    max={MAX_RENT}
                    step={500}
                    value={filters.maxRent}
                    onChange={(e) => set({ maxRent: Number(e.target.value) })}
                    className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                    <span>₹3,000</span>
                    <span>₹20,000+</span>
                </div>
            </div>

            <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Amenities</label>
                <div className="space-y-1.5">
                    {AMENITY_OPTIONS.map((a) => (
                        <label key={a} className="flex items-center gap-2 text-slate-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.amenities.includes(a)}
                                onChange={() => toggleAmenity(a)}
                                className="accent-indigo-600 w-3.5 h-3.5"
                            />
                            {a}
                        </label>
                    ))}
                </div>
            </div>

            <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer pt-3 border-t border-slate-100">
                <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={(e) => set({ verifiedOnly: e.target.checked })}
                    className="accent-emerald-600 w-3.5 h-3.5"
                />
                <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified listings only
                </span>
            </label>
        </div>
    );
}

function HowItWorks() {
    const steps = [
        {
            icon: Search,
            title: 'Search & filter',
            text: 'Filter by campus, rent, amenities and who listed the room. No brokers in between.'
        },
        {
            icon: ShieldCheck,
            title: 'Look for the Verified badge',
            text: 'Peer-found rooms are checked by our team before they earn the badge.'
        },
        {
            icon: Wallet,
            title: 'Hold it with ₹1,000',
            text: 'Reserve a bed for 48 hours while you visit. The token is refundable.'
        }
    ];
    return (
        <section className="pt-4">
            <h2 className="text-lg font-bold text-slate-900">How CampusNest works</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {steps.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.title} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold text-slate-400">STEP {i + 1}</span>
                            </div>
                            <h3 className="mt-3 font-semibold text-slate-900 text-sm">{s.title}</h3>
                            <p className="mt-1 text-xs text-slate-500 leading-relaxed">{s.text}</p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/* Photo picker (uploads straight to Cloudinary)                       */
/* ------------------------------------------------------------------ */

function PhotoPicker({ photos, onPick, onRemove, error }) {
    const inputRef = React.useRef(null);
    const full = photos.length >= MAX_PHOTOS;

    return (
        <div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {photos.map((ph, i) => (
                    <div key={ph.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                        <img src={ph.preview} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                        {i === 0 && ph.status === 'done' && (
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                                Cover
                            </span>
                        )}
                        {ph.status === 'uploading' && (
                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                            </div>
                        )}
                        {ph.status === 'error' && (
                            <div className="absolute inset-0 bg-red-50/90 flex items-center justify-center p-1 text-center">
                                <span className="text-[10px] text-red-700 leading-tight">{ph.error}</span>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => onRemove(ph.id)}
                            aria-label={`Remove photo ${i + 1}`}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}

                {!full && (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/40 transition flex flex-col items-center justify-center gap-1"
                    >
                        <ImagePlus className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Add photo</span>
                    </button>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                data-testid="photo-input"
                className="hidden"
                onChange={(e) => {
                    onPick(Array.from(e.target.files || []));
                    e.target.value = ''; // allows re-picking the same file
                }}
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
                Up to {MAX_PHOTOS} photos. The first is the cover. JPG, PNG or WebP.
            </p>
            {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Main app                                                            */
/* ------------------------------------------------------------------ */

export default function CampusNestApp() {
    const [activeTab, setActiveTab] = useState('explore');

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [slowLoad, setSlowLoad] = useState(false);

    const [savedIds, setSavedIds] = useState(() => loadStored(localStorage, 'cn_saved', []));
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [showFilters, setShowFilters] = useState(false);

    const [selectedProperty, setSelectedProperty] = useState(null);
    const [galleryIdx, setGalleryIdx] = useState(0);

    const [bookingProperty, setBookingProperty] = useState(null);
    const [bookingForm, setBookingForm] = useState({ name: '', phone: '' });
    const [bookingErrors, setBookingErrors] = useState({});
    const [bookingBusy, setBookingBusy] = useState(false);
    const [bookingResult, setBookingResult] = useState(null);

    const [listType, setListType] = useState('PEER');
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [photos, setPhotos] = useState([]);
    const photosRef = React.useRef([]);
    photosRef.current = photos;

    const [adminKey, setAdminKey] = useState(() => loadStored(sessionStorage, 'cn_admin_key', ''));
    const [adminUnlocked, setAdminUnlocked] = useState(false);
    const [adminInput, setAdminInput] = useState('');
    const [adminBusy, setAdminBusy] = useState(false);
    const [verifyingId, setVerifyingId] = useState(null);

    const [toast, setToast] = useState('');

    /* ----- data loading ----- */
    const loadProperties = useCallback(async () => {
        setLoading(true);
        setLoadError('');
        const slowTimer = setTimeout(() => setSlowLoad(true), 4000);
        try {
            setProperties(await api.listProperties());
        } catch (err) {
            setLoadError(err.message || 'Could not load listings.');
        } finally {
            clearTimeout(slowTimer);
            setSlowLoad(false);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProperties();
    }, [loadProperties]);

    useEffect(() => saveStored(localStorage, 'cn_saved', savedIds), [savedIds]);

    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(''), 3500);
        return () => clearTimeout(t);
    }, [toast]);

    // Re-check a remembered admin key once on load; forget it if the server rejects it.
    useEffect(() => {
        if (!adminKey) return;
        api.checkAdminKey(adminKey)
            .then(() => setAdminUnlocked(true))
            .catch((err) => {
                if (err instanceof ApiError && err.status === 403) {
                    setAdminKey('');
                    saveStored(sessionStorage, 'cn_admin_key', '');
                }
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleSave = (id) => {
        const wasSaved = savedIds.includes(id);
        setSavedIds((prev) => (wasSaved ? prev.filter((x) => x !== id) : [...prev, id]));
        setToast(wasSaved ? 'Removed from saved rooms' : 'Saved to your shortlist');
    };

    /* ----- filtering / sorting (in the browser, instant) ----- */
    const filteredProperties = useMemo(() => {
        const q = filters.q.trim().toLowerCase();
        const list = properties.filter((p) => {
            if (q) {
                const haystack = [p.title, p.hub, p.distance, p.type, p.sharing, p.gender, ...p.amenities]
                    .join(' ')
                    .toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            if (filters.hub !== 'ALL' && p.hub !== filters.hub) return false;
            if (filters.type !== 'ALL' && p.type !== filters.type) return false;
            if (filters.gender !== 'ALL' && p.gender !== filters.gender && p.gender !== 'Any') return false;
            if (filters.source === 'DIRECT' && p.source !== 'DIRECT_LANDLORD') return false;
            if (filters.source === 'PEER' && p.source !== 'PEER_SCOUT') return false;
            if (filters.maxRent < MAX_RENT && p.rent > filters.maxRent) return false;
            if (filters.verifiedOnly && p.status !== 'VERIFIED') return false;
            if (filters.savedOnly && !savedIds.includes(p.id)) return false;
            if (filters.amenities.length && !filters.amenities.every((a) => p.amenities.includes(a)))
                return false;
            return true;
        });

        const sorted = [...list];
        if (filters.sort === 'rent_asc') sorted.sort((a, b) => a.rent - b.rent);
        else if (filters.sort === 'rent_desc') sorted.sort((a, b) => b.rent - a.rent);
        else if (filters.sort === 'distance') sorted.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
        else sorted.sort((a, b) => b.createdAt - a.createdAt);
        return sorted;
    }, [properties, filters, savedIds]);

    const activeFilterCount =
        (filters.hub !== 'ALL') +
        (filters.type !== 'ALL') +
        (filters.gender !== 'ALL') +
        (filters.source !== 'ALL') +
        (filters.maxRent < MAX_RENT) +
        (filters.amenities.length > 0) +
        filters.verifiedOnly +
        filters.savedOnly;

    const resetFilters = () => setFilters((f) => ({ ...DEFAULT_FILTERS, q: f.q, sort: f.sort }));

    const stats = useMemo(() => {
        const verified = properties.filter((p) => p.status === 'VERIFIED').length;
        const avgRent = properties.length
            ? Math.round(properties.reduce((sum, p) => sum + p.rent, 0) / properties.length)
            : 0;
        return { total: properties.length, verified, avgRent };
    }, [properties]);

    const pendingCount = properties.filter((p) => p.status === 'PENDING_VERIFICATION').length;
    const savedCount = savedIds.filter((id) => properties.some((p) => p.id === id)).length;

    /* ----- verification hub ----- */
    const lockAdmin = () => {
        setAdminKey('');
        setAdminUnlocked(false);
        saveStored(sessionStorage, 'cn_admin_key', '');
    };

    const unlockAdmin = async (e) => {
        e.preventDefault();
        const key = adminInput.trim();
        if (!key) return;
        setAdminBusy(true);
        try {
            await api.checkAdminKey(key);
            setAdminKey(key);
            setAdminUnlocked(true);
            setAdminInput('');
            saveStored(sessionStorage, 'cn_admin_key', key);
            setToast('Admin tools unlocked.');
        } catch (err) {
            setToast(err.message || 'Could not verify the admin key.');
        } finally {
            setAdminBusy(false);
        }
    };

    const handleVerify = async (id) => {
        setVerifyingId(id);
        try {
            const updated = await api.verifyProperty(id, adminKey);
            setProperties((prev) => prev.map((p) => (p.id === id ? updated : p)));
            setToast(
                updated.bountyStatus === 'CREDITED'
                    ? 'Listing verified. ₹500 scout bounty released.'
                    : 'Listing verified.'
            );
        } catch (err) {
            if (err instanceof ApiError && err.status === 403) lockAdmin();
            setToast(err.message || 'Could not verify this listing.');
        } finally {
            setVerifyingId(null);
        }
    };

    /* ----- booking ----- */
    const openProperty = (p) => {
        setGalleryIdx(0);
        setSelectedProperty(p);
    };

    const startBooking = (p) => {
        setBookingProperty(p);
        setBookingForm({ name: '', phone: '' });
        setBookingErrors({});
        setBookingResult(null);
        setSelectedProperty(null);
    };

    const closeBooking = () => {
        setBookingProperty(null);
        setBookingResult(null);
        setBookingErrors({});
    };

    const confirmBooking = async () => {
        const errs = {};
        if (bookingForm.name.trim().length < 2) errs.name = 'Enter your name.';
        if (!PHONE_RE.test(bookingForm.phone.trim())) errs.phone = 'Enter a valid 10-digit mobile number.';
        setBookingErrors(errs);
        if (Object.keys(errs).length) return;

        setBookingBusy(true);
        try {
            const res = await api.reserve({
                propertyId: bookingProperty.id,
                studentName: bookingForm.name.trim(),
                studentPhone: bookingForm.phone.trim()
            });
            setProperties((prev) => prev.map((p) => (p.id === res.property.id ? res.property : p)));
            setBookingResult(res);
        } catch (err) {
            setBookingErrors({ form: err.message || 'Could not reserve this bed.' });
        } finally {
            setBookingBusy(false);
        }
    };

    /* ----- listing form ----- */
    const setField = (patch) => {
        setFormData((f) => ({ ...f, ...patch }));
        setErrors((e) => {
            const next = { ...e };
            Object.keys(patch).forEach((k) => delete next[k]);
            return next;
        });
    };

    /* ----- photos ----- */
    const addPhotos = async (files) => {
        const room = MAX_PHOTOS - photosRef.current.length;
        if (room <= 0) return;
        if (files.length > room) setToast(`Only ${MAX_PHOTOS} photos allowed. Extra files were skipped.`);

        for (const file of files.slice(0, room)) {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const preview = URL.createObjectURL(file);
            setPhotos((prev) => [...prev, { id, preview, url: '', status: 'uploading', error: '' }]);
            try {
                const blob = await prepareImage(file);
                const url = await uploadImage(blob);
                setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, url, status: 'done' } : p)));
            } catch (err) {
                const message = err?.message || 'Upload failed.';
                setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'error', error: message } : p)));
            }
        }
    };

    const removePhoto = (id) => {
        setPhotos((prev) => {
            const gone = prev.find((p) => p.id === id);
            if (gone) URL.revokeObjectURL(gone.preview);
            return prev.filter((p) => p.id !== id);
        });
    };

    const validate = () => {
        const e = {};
        if (formData.title.trim().length < 5) e.title = 'Enter a title of at least 5 characters.';
        if (!(Number(formData.rent) > 0)) e.rent = 'Enter a rent greater than 0.';
        if (formData.deposit === '' || Number(formData.deposit) < 0) e.deposit = 'Enter a deposit (0 if none).';
        if (formData.distanceKm === '' || Number(formData.distanceKm) < 0) e.distanceKm = 'Enter distance in km.';
        if (!PHONE_RE.test(formData.phone.trim())) e.phone = 'Enter a valid 10-digit Indian mobile number.';
        if (!formData.submitterName.trim()) e.submitterName = 'Enter your name.';
        if (formData.imageUrl.trim() && !URL_RE.test(formData.imageUrl.trim()))
            e.imageUrl = 'Image link must start with http:// or https://';
        if (Number(formData.availableBeds) < 1) e.availableBeds = 'At least 1 bed must be open.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleCreateListing = async (ev) => {
        ev.preventDefault();
        if (submitting) return;
        if (!validate()) {
            setToast('Please fix the highlighted fields.');
            return;
        }
        if (photos.some((p) => p.status === 'uploading')) {
            setToast('Photos are still uploading. Please wait a moment.');
            return;
        }
        if (photos.some((p) => p.status === 'error')) {
            setToast('Remove the photos that failed, or try uploading them again.');
            return;
        }
        const isLandlord = listType === 'LANDLORD';
        const body = {
            title: formData.title.trim(),
            type: formData.type,
            source: isLandlord ? 'DIRECT_LANDLORD' : 'PEER_SCOUT',
            submitterRole: isLandlord ? 'Direct Landlord' : formData.role,
            submitterName: formData.submitterName.trim(),
            hub: formData.hub,
            distanceKm: Number(formData.distanceKm),
            rent: Number(formData.rent),
            deposit: Number(formData.deposit),
            sharing: formData.sharing,
            gender: formData.gender,
            availableBeds: Number(formData.availableBeds),
            amenities: formData.amenities,
            rules: formData.rules
                .split('\n')
                .map((r) => r.trim())
                .filter(Boolean),
            images: uploadConfigured
                ? photos.filter((p) => p.status === 'done').map((p) => p.url)
                : formData.imageUrl.trim()
                    ? [formData.imageUrl.trim()]
                    : [],
            phone: formData.phone.trim(),
            landlordName: formData.landlordName.trim()
        };

        setSubmitting(true);
        try {
            const created = await api.createProperty(body);
            setProperties((prev) => [created, ...prev]);
            setFormData(EMPTY_FORM);
            photos.forEach((p) => URL.revokeObjectURL(p.preview));
            setPhotos([]);
            setErrors({});
            setFilters(DEFAULT_FILTERS);
            setActiveTab('explore');
            setToast('Listing submitted. It shows as Pending until our team verifies it.');
        } catch (err) {
            if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
                const mapped = {};
                Object.entries(err.fieldErrors).forEach(([key, msg]) => {
                    mapped[key.startsWith('images') ? 'imageUrl' : key] = msg;
                });
                setErrors(mapped);
            }
            setToast(err.message || 'Could not submit the listing.');
        } finally {
            setSubmitting(false);
        }
    };

    const navBtn = (tab) =>
        `px-3 py-2 rounded-lg text-sm font-medium transition ${focusRing} ${
            activeTab === tab ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
        }`;

    const showSkeleton = loading && properties.length === 0;
    const showLoadError = !loading && loadError && properties.length === 0;

    return (
        <div className="cn-root min-h-screen bg-slate-50 text-slate-800 flex flex-col">
            <style>{GLOBAL_CSS}</style>

            {/* ---------------- Header ---------------- */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
                    <button
                        className={`flex items-center gap-2 shrink-0 rounded-lg ${focusRing}`}
                        onClick={() => setActiveTab('explore')}
                        aria-label="CampusNest home"
                    >
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <span className="font-bold text-xl text-slate-900 tracking-tight">
                                Campus<span className="text-indigo-600">Nest</span>
                            </span>
                            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                                India
                            </span>
                        </div>
                    </button>

                    <nav className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto">
                        <button onClick={() => setActiveTab('explore')} className={navBtn('explore')}>
                            <span className="hidden sm:inline">Explore PGs & Flats</span>
                            <span className="sm:hidden">Explore</span>
                        </button>
                        <button
                            onClick={() => {
                                setFilters({ ...DEFAULT_FILTERS, savedOnly: true });
                                setActiveTab('explore');
                            }}
                            className={`px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition flex items-center gap-1 ${focusRing}`}
                        >
                            <Heart className="w-4 h-4 text-rose-500" />
                            <span className="hidden sm:inline">Saved</span>
                            {savedCount > 0 && (
                                <span className="text-[10px] bg-rose-100 text-rose-700 rounded-full px-1.5 py-0.5 font-semibold">
                                    {savedCount}
                                </span>
                            )}
                        </button>
                        <button onClick={() => setActiveTab('services')} className={navBtn('services')}>
                            Services
                        </button>
                        <button onClick={() => setActiveTab('verify')} className={`${navBtn('verify')} relative whitespace-nowrap`}>
                            <span className="hidden sm:inline">Verification Hub</span>
                            <span className="sm:hidden">Verify</span>
                            {pendingCount > 0 && (
                                <span className="ml-1.5 w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse"></span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`ml-1 flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition whitespace-nowrap ${focusRing}`}
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">List a Room</span>
                            <span className="sm:hidden">List</span>
                        </button>
                    </nav>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
                {/* ---------------- Explore ---------------- */}
                {activeTab === 'explore' && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-indigo-800 via-indigo-600 to-blue-600 rounded-2xl p-6 sm:p-10 text-white shadow-lg relative overflow-hidden">
                            <div
                                className="absolute inset-0"
                                style={{
                                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
                                    backgroundSize: '22px 22px'
                                }}
                            />
                            <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10" />
                            <div className="absolute right-28 -bottom-20 w-48 h-48 rounded-full bg-white/10" />
                            <div className="max-w-2xl relative z-10">
                                <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-indigo-100">
                                    Zero Brokerage • Direct & Peer Sourced
                                </span>
                                <h1 className="text-3xl sm:text-5xl font-extrabold mt-4 leading-tight tracking-tight">
                                    Find verified student housing near your campus
                                </h1>
                                <p className="text-indigo-100 mt-3 text-sm sm:text-base max-w-xl">
                                    Rooms submitted directly by landlords, seniors, and peers with transparent pricing and
                                    ₹1,000 refundable token reservations.
                                </p>

                                <div className="mt-6 flex items-center bg-white rounded-xl shadow-xl overflow-hidden focus-within:ring-4 focus-within:ring-white/30">
                                    <Search className="w-4 h-4 text-slate-400 ml-4 shrink-0" />
                                    <input
                                        type="text"
                                        value={filters.q}
                                        onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                                        placeholder="Search by name, campus, amenity… e.g. “Wi-Fi”, “Girls”"
                                        aria-label="Search listings"
                                        className="flex-1 px-3 py-3.5 text-sm text-slate-800 outline-none"
                                    />
                                    {filters.q && (
                                        <button
                                            onClick={() => setFilters((f) => ({ ...f, q: '' }))}
                                            aria-label="Clear search"
                                            className="px-3 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {stats.total > 0 && (
                                    <div className="mt-6 grid grid-cols-3 gap-3 max-w-md">
                                        {[
                                            { label: 'Listings', value: stats.total },
                                            { label: 'Verified', value: stats.verified },
                                            { label: 'Avg rent', value: formatINR(stats.avgRent) }
                                        ].map((s) => (
                                            <div key={s.label} className="rounded-xl bg-white/15 backdrop-blur px-3 py-2.5">
                                                <div className="text-lg sm:text-xl font-extrabold leading-none">{s.value}</div>
                                                <div className="text-[11px] text-indigo-100 mt-1">{s.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
                            <aside className="lg:sticky lg:top-20">
                                <button
                                    onClick={() => setShowFilters((s) => !s)}
                                    className={`lg:hidden w-full mb-3 flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold shadow-sm ${focusRing}`}
                                >
                                    <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                                    {showFilters ? 'Hide filters' : 'Show filters'}
                                    {activeFilterCount > 0 && (
                                        <span className="bg-indigo-600 text-white rounded-full px-1.5 py-0.5 text-[10px]">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>
                                <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
                                    <FilterPanel
                                        filters={filters}
                                        setFilters={setFilters}
                                        onReset={resetFilters}
                                        activeCount={activeFilterCount}
                                    />
                                </div>
                            </aside>

                            <section className="space-y-4 min-w-0">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-sm text-slate-600 flex items-center gap-2">
                                        {loading && properties.length > 0 ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                        ) : null}
                                        <span>
                                            <span className="font-bold text-slate-900">{filteredProperties.length}</span>{' '}
                                            {filteredProperties.length === 1 ? 'room' : 'rooms'} found
                                            {filters.savedOnly && (
                                                <span className="text-rose-600 font-semibold"> • saved only</span>
                                            )}
                                        </span>
                                        <button
                                            onClick={loadProperties}
                                            aria-label="Refresh listings"
                                            title="Refresh listings"
                                            className={`p-1 rounded text-slate-400 hover:text-indigo-600 ${focusRing}`}
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </button>
                                    </p>
                                    <div className="flex items-center gap-2 text-xs">
                                        <label className="font-semibold text-slate-600">Sort by</label>
                                        <select
                                            value={filters.sort}
                                            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
                                            className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs outline-none focus:ring-2 focus:ring-indigo-500/40"
                                        >
                                            {SORTS.map((s) => (
                                                <option key={s.value} value={s.value}>
                                                    {s.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {filters.savedOnly && (
                                    <button
                                        onClick={() => setFilters((f) => ({ ...f, savedOnly: false }))}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full"
                                    >
                                        <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                                        Showing saved rooms
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}

                                {showSkeleton && (
                                    <>
                                        {slowLoad && (
                                            <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs rounded-xl p-3">
                                                <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
                                                <p>
                                                    Waking up the server. Free hosting can take up to a minute on the first
                                                    visit. Your rooms will appear as soon as it is ready.
                                                </p>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                                <SkeletonCard key={i} />
                                            ))}
                                        </div>
                                    </>
                                )}

                                {showLoadError && (
                                    <div className="bg-white border border-red-200 rounded-2xl p-8 text-center">
                                        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
                                        <h3 className="mt-3 font-bold text-slate-900">Could not load listings</h3>
                                        <p className="text-xs text-slate-500 mt-1">{loadError}</p>
                                        <button
                                            onClick={loadProperties}
                                            className={`mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition ${focusRing}`}
                                        >
                                            Try again
                                        </button>
                                    </div>
                                )}

                                {!showSkeleton && !showLoadError && filteredProperties.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {filteredProperties.map((property, index) => (
                                            <PropertyCard
                                                key={property.id}
                                                index={index}
                                                property={property}
                                                saved={savedIds.includes(property.id)}
                                                onToggleSave={toggleSave}
                                                onOpen={openProperty}
                                            />
                                        ))}
                                    </div>
                                )}

                                {!showSkeleton && !showLoadError && filteredProperties.length === 0 && (
                                    <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
                                        <SearchX className="w-10 h-10 text-slate-300 mx-auto" />
                                        <h3 className="mt-3 font-bold text-slate-900">
                                            {properties.length === 0 ? 'No listings yet' : 'No rooms match these filters'}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {properties.length === 0
                                                ? 'Be the first to list a room near your campus.'
                                                : 'Try raising the rent limit, removing amenities, or clearing the search.'}
                                        </p>
                                        <button
                                            onClick={() =>
                                                properties.length === 0 ? setActiveTab('list') : setFilters(DEFAULT_FILTERS)
                                            }
                                            className={`mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition ${focusRing}`}
                                        >
                                            {properties.length === 0 ? 'List a room' : 'Reset everything'}
                                        </button>
                                    </div>
                                )}
                            </section>
                        </div>

                        <HowItWorks />
                    </div>
                )}

                {/* ---------------- Services ---------------- */}
                {activeTab === 'services' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Essential Student Services</h2>
                            <p className="text-sm text-slate-500">
                                On-demand meal subscriptions, laundry, and campus mobility. Partner sign-ups are coming soon.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {CAMPUS_SERVICES.map((srv) => {
                                const IconComponent = srv.icon;
                                return (
                                    <div
                                        key={srv.id}
                                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between">
                                                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                                                    <IconComponent className="w-6 h-6" />
                                                </div>
                                                <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                                                    {srv.tag}
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                                                {srv.category}
                                            </span>
                                            <h3 className="font-bold text-base text-slate-900 mt-1">{srv.name}</h3>
                                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">{srv.description}</p>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <span className="font-bold text-sm text-slate-900">{srv.price}</span>
                                            <button
                                                onClick={() => setToast(`Thanks! We will notify you when ${srv.name} opens sign-ups.`)}
                                                className={`px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition ${focusRing}`}
                                            >
                                                Notify me
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ---------------- Verification hub ---------------- */}
                {activeTab === 'verify' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Verification & Landlord Claims Hub</h2>
                            <p className="text-sm text-slate-500">
                                Review listings, confirm owner details, and release ₹500 scout bounties.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 max-w-lg">
                            {[
                                { label: 'Pending', value: pendingCount, cls: 'text-amber-700 bg-amber-50' },
                                {
                                    label: 'Verified',
                                    value: properties.filter((p) => p.status === 'VERIFIED').length,
                                    cls: 'text-emerald-700 bg-emerald-50'
                                },
                                { label: 'Total', value: properties.length, cls: 'text-indigo-700 bg-indigo-50' }
                            ].map((s) => (
                                <div key={s.label} className={`rounded-xl p-3 ${s.cls}`}>
                                    <div className="text-2xl font-extrabold">{s.value}</div>
                                    <div className="text-[11px] font-semibold uppercase tracking-wide">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {adminUnlocked ? (
                            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-800">
                                <span className="flex items-center gap-2 font-semibold">
                                    <KeyRound className="w-4 h-4" /> Admin tools unlocked for this browser session
                                </span>
                                <button onClick={lockAdmin} className="font-semibold underline underline-offset-2">
                                    Lock
                                </button>
                            </div>
                        ) : (
                            <form
                                onSubmit={unlockAdmin}
                                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-end gap-3 max-w-xl"
                            >
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Admin key
                                    </label>
                                    <input
                                        type="password"
                                        autoComplete="off"
                                        value={adminInput}
                                        onChange={(e) => setAdminInput(e.target.value)}
                                        placeholder="Enter the key to verify listings"
                                        className={inputCls}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={adminBusy || !adminInput.trim()}
                                    className={`px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1.5 ${focusRing}`}
                                >
                                    {adminBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                                    Unlock
                                </button>
                            </form>
                        )}

                        <div className="space-y-4">
                            {properties.length === 0 && (
                                <p className="text-sm text-slate-500">No listings yet.</p>
                            )}
                            {properties
                                .filter((p) => p.status === 'PENDING_VERIFICATION' || p.source === 'PEER_SCOUT')
                                .map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                                                {item.status === 'VERIFIED' ? (
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                                                        Pending Verification
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                Submitted by:{' '}
                                                <span className="font-medium text-slate-700">{item.submitterName}</span> (
                                                {item.submitterRole})
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Owner Contact:{' '}
                                                <span className="font-medium text-slate-700">
                                                    {item.landlordName ? `${item.landlordName} • ` : ''}
                                                    {item.phone}
                                                </span>
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            {item.status === 'PENDING_VERIFICATION' ? (
                                                <button
                                                    onClick={() => handleVerify(item.id)}
                                                    disabled={!adminUnlocked || verifyingId === item.id}
                                                    title={adminUnlocked ? '' : 'Enter the admin key above to enable'}
                                                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed ${focusRing}`}
                                                >
                                                    {verifyingId === item.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <UserCheck className="w-4 h-4" />
                                                    )}
                                                    <span>
                                                        {item.source === 'PEER_SCOUT' ? 'Verify & Release ₹500 Bounty' : 'Verify listing'}
                                                    </span>
                                                </button>
                                            ) : item.bountyStatus === 'CREDITED' ? (
                                                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                                    <CheckCircle2 className="w-4 h-4" /> Bounty Credited
                                                </span>
                                            ) : (
                                                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                                    <CheckCircle2 className="w-4 h-4" /> Verified
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* ---------------- List a room ---------------- */}
                {activeTab === 'list' && (
                    <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 mb-1">List a Room Vacancy</h2>
                        <p className="text-xs text-slate-500 mb-6">
                            Choose whether you are the direct property owner or a peer scout. Every listing is checked by our
                            team before it earns the Verified badge.
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button
                                type="button"
                                onClick={() => setListType('PEER')}
                                className={`p-3 rounded-xl border text-left transition ${listType === 'PEER' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'}`}
                            >
                                <div className="font-semibold text-xs text-indigo-900">Peer / Senior Scout</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">List a flat/PG and earn ₹500 bounty</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setListType('LANDLORD')}
                                className={`p-3 rounded-xl border text-left transition ${listType === 'LANDLORD' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'}`}
                            >
                                <div className="font-semibold text-xs text-slate-900">Direct Landlord</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">Post direct listing at ₹0 brokerage</div>
                            </button>
                        </div>

                        <form onSubmit={handleCreateListing} className="space-y-4 text-xs" noValidate>
                            <Field label="Property Name / Title" error={errors.title}>
                                <input
                                    type="text"
                                    placeholder="e.g. Sai Balaji PG or 3BHK Room Vacancy"
                                    value={formData.title}
                                    onChange={(e) => setField({ title: e.target.value })}
                                    className={inputCls}
                                />
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Property type" error={errors.type}>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setField({ type: e.target.value })}
                                        className={inputCls}
                                    >
                                        {TYPES.map((t) => (
                                            <option key={t}>{t}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Suitable for" error={errors.gender}>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setField({ gender: e.target.value })}
                                        className={inputCls}
                                    >
                                        {GENDERS.map((g) => (
                                            <option key={g} value={g}>
                                                {g === 'Any' ? 'Any (Co-ed)' : g}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Monthly Rent (₹)" error={errors.rent}>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="7000"
                                        value={formData.rent}
                                        onChange={(e) => setField({ rent: e.target.value })}
                                        className={inputCls}
                                    />
                                </Field>
                                <Field label="Security Deposit (₹)" error={errors.deposit}>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="14000"
                                        value={formData.deposit}
                                        onChange={(e) => setField({ deposit: e.target.value })}
                                        className={inputCls}
                                    />
                                </Field>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Campus Hub" error={errors.hub}>
                                    <select
                                        value={formData.hub}
                                        onChange={(e) => setField({ hub: e.target.value })}
                                        className={inputCls}
                                    >
                                        {HUBS.map((h) => (
                                            <option key={h}>{h}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Distance from campus (km)" error={errors.distanceKm}>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        placeholder="e.g. 1.5"
                                        value={formData.distanceKm}
                                        onChange={(e) => setField({ distanceKm: e.target.value })}
                                        className={inputCls}
                                    />
                                </Field>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Sharing" error={errors.sharing}>
                                    <select
                                        value={formData.sharing}
                                        onChange={(e) => setField({ sharing: e.target.value })}
                                        className={inputCls}
                                    >
                                        {SHARING.map((s) => (
                                            <option key={s}>{s}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Beds available" error={errors.availableBeds}>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.availableBeds}
                                        onChange={(e) => setField({ availableBeds: e.target.value })}
                                        className={inputCls}
                                    />
                                </Field>
                            </div>

                            <Field label="Amenities">
                                <div className="flex flex-wrap gap-1.5">
                                    {AMENITY_OPTIONS.map((a) => {
                                        const on = formData.amenities.includes(a);
                                        return (
                                            <button
                                                type="button"
                                                key={a}
                                                onClick={() =>
                                                    setField({
                                                        amenities: on
                                                            ? formData.amenities.filter((x) => x !== a)
                                                            : [...formData.amenities, a]
                                                    })
                                                }
                                                className={`px-2.5 py-1 rounded-full border text-[11px] font-medium transition ${
                                                    on
                                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                {a}
                                            </button>
                                        );
                                    })}
                                </div>
                            </Field>

                            <Field label="House rules (one per line, optional)" error={errors.rules}>
                                <textarea
                                    rows={3}
                                    placeholder={'Entry by 10:30 PM\nNo smoking'}
                                    value={formData.rules}
                                    onChange={(e) => setField({ rules: e.target.value })}
                                    className={inputCls}
                                />
                            </Field>

                            {uploadConfigured ? (
                                <Field label="Photos (optional)">
                                    <PhotoPicker
                                        photos={photos}
                                        onPick={addPhotos}
                                        onRemove={removePhoto}
                                        error={errors.imageUrl}
                                    />
                                </Field>
                            ) : (
                                <Field label="Photo link (optional)" error={errors.imageUrl}>
                                    <input
                                        type="text"
                                        placeholder="https://…"
                                        value={formData.imageUrl}
                                        onChange={(e) => setField({ imageUrl: e.target.value })}
                                        className={inputCls}
                                    />
                                </Field>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Your name" error={errors.submitterName}>
                                    <input
                                        type="text"
                                        placeholder={listType === 'LANDLORD' ? 'Owner name' : 'Your name'}
                                        value={formData.submitterName}
                                        onChange={(e) => setField({ submitterName: e.target.value })}
                                        className={inputCls}
                                    />
                                </Field>
                                <Field label="Contact Phone (WhatsApp)" error={errors.phone}>
                                    <input
                                        type="text"
                                        placeholder="+91 98765 43210"
                                        value={formData.phone}
                                        onChange={(e) => setField({ phone: e.target.value })}
                                        className={inputCls}
                                    />
                                </Field>
                            </div>

                            {listType === 'PEER' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Your role">
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setField({ role: e.target.value })}
                                            className={inputCls}
                                        >
                                            <option>Senior Student (Outgoing)</option>
                                            <option>Current Flatmate Seeking Replacement</option>
                                            <option>Local Resident Scout</option>
                                        </select>
                                    </Field>
                                    <Field label="Landlord's name (for verification call)" error={errors.landlordName}>
                                        <input
                                            type="text"
                                            placeholder="e.g. Venkatesh Rao"
                                            value={formData.landlordName}
                                            onChange={(e) => setField({ landlordName: e.target.value })}
                                            className={inputCls}
                                        />
                                    </Field>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className={`w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition disabled:opacity-60 flex items-center justify-center gap-2 ${focusRing}`}
                            >
                                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {listType === 'LANDLORD' ? 'Submit Direct Listing' : 'Submit Listing & Register for ₹500 Bounty'}
                            </button>
                        </form>
                    </div>
                )}
            </main>

            <footer className="border-t border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span>© 2026 CampusNest • Zero-brokerage student housing</span>
                    <span>Reservations are recorded but no real payment is charged yet.</span>
                </div>
            </footer>

            {/* ---------------- Detail modal ---------------- */}
            {selectedProperty && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSelectedProperty(null)}
                >
                    <div
                        className="cn-pop bg-white rounded-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label={selectedProperty.title}
                    >
                        <button
                            onClick={() => setSelectedProperty(null)}
                            aria-label="Close"
                            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-500 hover:text-slate-800"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="relative mb-4">
                            <img
                                src={optimizedImage(selectedProperty.images[galleryIdx] || selectedProperty.images[0], 1200)}
                                alt={selectedProperty.title}
                                className="w-full h-52 object-cover rounded-xl"
                            />
                            {selectedProperty.images.length > 1 && (
                                <>
                                    <button
                                        onClick={() =>
                                            setGalleryIdx(
                                                (galleryIdx - 1 + selectedProperty.images.length) %
                                                selectedProperty.images.length
                                            )
                                        }
                                        aria-label="Previous photo"
                                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setGalleryIdx((galleryIdx + 1) % selectedProperty.images.length)}
                                        aria-label="Next photo"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                                        {galleryIdx + 1}/{selectedProperty.images.length}
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{selectedProperty.title}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {selectedProperty.hub} • {selectedProperty.distance}
                                </p>
                            </div>
                            <button
                                onClick={() => toggleSave(selectedProperty.id)}
                                aria-label="Save room"
                                className="shrink-0 w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                            >
                                <Heart
                                    className={`w-4 h-4 ${savedIds.includes(selectedProperty.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`}
                                />
                            </button>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                            <StatusBadge status={selectedProperty.status} />
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">
                                {selectedProperty.type}
                            </span>
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">
                                {selectedProperty.sharing}
                            </span>
                            {selectedProperty.verifiedAt && (
                                <span className="text-slate-400">Verified {selectedProperty.verifiedAt}</span>
                            )}
                        </div>

                        <div className="mt-4 p-3 bg-slate-50 rounded-xl grid grid-cols-3 gap-2">
                            <div>
                                <span className="text-xs text-slate-500">Rent</span>
                                <p className="text-base font-bold text-slate-900">{formatINR(selectedProperty.rent)}/mo</p>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500">Deposit</span>
                                <p className="text-base font-bold text-slate-900">{formatINR(selectedProperty.deposit)}</p>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500">For</span>
                                <p className="text-base font-bold text-slate-900">
                                    {selectedProperty.gender === 'Any' ? 'Co-ed' : selectedProperty.gender}
                                </p>
                            </div>
                        </div>

                        <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                            <BedDouble className="w-3.5 h-3.5" />
                            {selectedProperty.availableBeds > 0
                                ? `${selectedProperty.availableBeds} bed(s) available`
                                : 'No beds available right now'}
                            <span className="mx-1">•</span>
                            Listed by {selectedProperty.submitterName}
                        </p>

                        {selectedProperty.amenities.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-xs font-semibold text-slate-700 mb-1.5">Amenities Included</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedProperty.amenities.map((item) => (
                                        <span key={item} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedProperty.rules?.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-xs font-semibold text-slate-700 mb-1.5">House Rules</h4>
                                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                                    {selectedProperty.rules.map((r) => (
                                        <li key={r}>{r}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mt-6 flex gap-3">
                            <a
                                href={`tel:${selectedProperty.phone.replace(/\s/g, '')}`}
                                className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold text-center hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                            >
                                <Phone className="w-3.5 h-3.5" /> Call Owner
                            </a>
                            <button
                                disabled={selectedProperty.availableBeds < 1}
                                onClick={() => startBooking(selectedProperty)}
                                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
                            >
                                Reserve Bed (₹1,000)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ---------------- Booking modal ---------------- */}
            {bookingProperty && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="cn-pop bg-white rounded-2xl max-w-sm w-full p-6 text-center" role="dialog" aria-modal="true">
                        {bookingResult ? (
                            <div className="space-y-3">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                                <h3 className="text-base font-bold text-slate-900">Bed reserved!</h3>
                                <p className="text-xs text-slate-500">
                                    A bed at <span className="font-semibold">{bookingProperty.title}</span> is held for you until{' '}
                                    <span className="font-semibold">
                                        {new Date(bookingResult.expiresAt).toLocaleString('en-IN', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short'
                                        })}
                                    </span>
                                    . Call the owner to arrange your visit.
                                </p>
                                <p className="text-[11px] text-slate-400">
                                    Token reference #{bookingResult.tokenId}. No real payment has been taken yet.
                                </p>
                                <button
                                    onClick={closeBooking}
                                    className="w-full mt-2 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 text-left">
                                <div className="text-center">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                                        <IndianRupee className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 mt-3">Hold a bed for 48 hours</h3>
                                    <p className="text-xs text-slate-600 mt-1 font-medium">{bookingProperty.title}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        ₹1,000 refundable token. The bed is released automatically if the hold expires.
                                    </p>
                                </div>

                                <div className="space-y-3 text-xs">
                                    <Field label="Your name" error={bookingErrors.name}>
                                        <input
                                            type="text"
                                            value={bookingForm.name}
                                            onChange={(e) => setBookingForm((f) => ({ ...f, name: e.target.value }))}
                                            className={inputCls}
                                        />
                                    </Field>
                                    <Field label="Mobile number" error={bookingErrors.phone}>
                                        <input
                                            type="text"
                                            placeholder="+91 98765 43210"
                                            value={bookingForm.phone}
                                            onChange={(e) => setBookingForm((f) => ({ ...f, phone: e.target.value }))}
                                            className={inputCls}
                                        />
                                    </Field>
                                    {bookingErrors.form && (
                                        <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                            {bookingErrors.form}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={closeBooking}
                                        className="flex-1 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmBooking}
                                        disabled={bookingBusy}
                                        className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5"
                                    >
                                        {bookingBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        Reserve bed
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 text-center">
                                    Demo mode: the reservation is saved but no money is charged.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Toast message={toast} onClose={() => setToast('')} />
        </div>
    );
}
