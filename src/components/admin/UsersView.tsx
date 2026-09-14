import React, { useState, useMemo, useRef } from 'react';
import {
  Users,
  User,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Upload,
  Trash2,
  Copy,
  Check,
  Search,
  Plus,
  ArrowLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { Navbar, Button } from 'konsta/react';
import { uploadUserAvatar } from '../../services/storage.ts';
import { AdminSelectField } from './AdminSelectBottomSheet.tsx';

export interface AdminUser {
  phone: string;
  password?: string;
  name: string;
  email?: string | null;
  avatar_url?: string | null;
  address?: any;
  created_at?: string;
  role?: string;
}

const str = (v: unknown) => (v == null ? '' : String(v));
const jsonObject = (v: unknown): Record<string, any> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, any>) : {};

export function formatUserAddress(addr: any): string {
  if (!addr) return '';
  if (typeof addr === 'string') return addr.trim();
  if (typeof addr === 'object') {
    if (addr.address && typeof addr.address === 'string') return addr.address.trim();
    if (addr.street || addr.city || addr.state || addr.postcode) {
      const parts = [
        addr.street || addr.fullName,
        addr.city,
        addr.postcode,
        addr.state,
        addr.country,
      ].filter(Boolean);
      return parts.join(', ');
    }
    try {
      return JSON.stringify(addr);
    } catch {
      return '';
    }
  }
  return String(addr);
}

export function getUserInitials(name?: string, phone?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (phone && phone.trim()) {
    const digits = phone.replace(/\D/g, '');
    return digits.slice(-2) || 'US';
  }
  return 'U';
}

interface UserDetailViewProps {
  user: AdminUser;
  onBack: () => void;
  onSave: (phone: string, updates: Partial<AdminUser>) => Promise<void>;
  onRoleChange: (phone: string, role: string) => Promise<void>;
}

function UserDetailView({ user: u, onBack, onSave, onRoleChange }: UserDetailViewProps) {
  const [name, setName] = useState(u.name || '');
  const [email, setEmail] = useState(str(u.email));
  const [avatarUrl, setAvatarUrl] = useState(str(u.avatar_url));
  const [role, setRole] = useState(u.role || 'customer');
  const [password, setPassword] = useState(u.password || '');
  const [showPassword, setShowPassword] = useState(false);

  // Address fields
  const parsedAddr = useMemo(() => {
    if (!u.address) return { street: '', city: '', state: '', postcode: '', country: 'Malaysia' };
    if (typeof u.address === 'object') {
      return {
        street: str(u.address.street || u.address.address || ''),
        city: str(u.address.city || ''),
        state: str(u.address.state || ''),
        postcode: str(u.address.postcode || ''),
        country: str(u.address.country || 'Malaysia'),
      };
    }
    return { street: String(u.address), city: '', state: '', postcode: '', country: 'Malaysia' };
  }, [u.address]);

  const [street, setStreet] = useState(parsedAddr.street);
  const [city, setCity] = useState(parsedAddr.city);
  const [state, setState] = useState(parsedAddr.state);
  const [postcode, setPostcode] = useState(parsedAddr.postcode);
  const [country, setCountry] = useState(parsedAddr.country);

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setAvatarError(null);
    try {
      const publicUrl = await uploadUserAvatar(file, u.phone);
      setAvatarUrl(publicUrl);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Gagal upload avatar.');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      // Build address object or string
      let formattedAddress: any = null;
      if (street.trim() || city.trim() || state.trim() || postcode.trim()) {
        formattedAddress = {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          postcode: postcode.trim(),
          country: country.trim() || 'Malaysia',
        };
      }

      const updates: Partial<AdminUser> = {
        name: name.trim() || u.name,
        email: email.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        address: formattedAddress,
        role,
      };

      if (password.trim()) {
        updates.password = password.trim();
      }

      // Update role if changed
      if (role !== u.role) {
        await onRoleChange(u.phone, role);
      }

      await onSave(u.phone, updates);
      setSuccessMessage('Data user berhasil diperbarui.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal menyimpan perubahan user.');
    } finally {
      setSaving(false);
    }
  };

  // Canonical Schema JSON output
  const userJsonOutput = useMemo(() => {
    const currentAddress =
      street.trim() || city.trim() || state.trim() || postcode.trim()
        ? {
            street: street.trim(),
            city: city.trim(),
            state: state.trim(),
            postcode: postcode.trim(),
            country: country.trim() || 'Malaysia',
          }
        : u.address || '';

    return {
      phone: u.phone || '',
      password: password ? password : u.password || '••••••••',
      name: name || '',
      email: email || '',
      avatar_url: avatarUrl || '',
      address: typeof currentAddress === 'object' ? formatUserAddress(currentAddress) : currentAddress || '',
      created_at: u.created_at || '',
      role: role || 'customer',
    };
  }, [u, name, email, avatarUrl, role, password, street, city, state, postcode, country]);

  return (
    <div className="w-full flex flex-col pb-12">
      <Navbar
        title={u.name || u.phone}
        subtitle={`Role: ${role.toUpperCase()}`}
        left={
          <Button clear className="text-[#0071e3] font-medium flex items-center gap-1" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Users</span>
          </Button>
        }
        right={
          <Button
            clear
            className="text-[#0071e3] font-bold"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        }
      />

      <div className="p-4 space-y-4 max-w-xl mx-auto w-full">
        {/* Alerts */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Profile Card & Avatar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Profile & Avatar
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                role === 'admin'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {role === 'admin' ? <ShieldCheck size={12} /> : <User size={12} />}
              {role.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-gray-100 to-gray-200 border border-gray-200 overflow-hidden flex items-center justify-center shadow-xs shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name || u.phone}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-gray-600 tracking-wider">
                    {getUserInitials(name, u.phone)}
                  </span>
                )}
              </div>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  title="Hapus avatar"
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 transition-colors cursor-pointer"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={uploadingAvatar || saving}
                  onClick={() => avatarInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0071e3] text-white hover:bg-[#0077ed] disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
                >
                  {uploadingAvatar ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={13} />
                      <span>Upload Avatar</span>
                    </>
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => void handleAvatarUpload(e)}
                />

                {avatarUrl && (
                  <a
                    href={avatarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink size={12} />
                    <span>View</span>
                  </a>
                )}
              </div>
              <p className="text-[10px] text-gray-400">
                Disimpan di Supabase Storage (Bucket: apple/avatars).
              </p>
            </div>
          </div>

          {avatarError && (
            <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
              <AlertCircle size={12} className="shrink-0" />
              <span>{avatarError}</span>
            </div>
          )}

          {/* Name & Avatar URL Inputs */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-[#86868b] block mb-1">
                Full Name (`name`)
              </label>
              <input
                type="text"
                value={name}
                placeholder="Nama Pengguna"
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs font-medium bg-[#f5f5f7] border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#0071e3] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#86868b] block mb-1">
                Avatar URL (`avatar_url`)
              </label>
              <input
                type="url"
                value={avatarUrl}
                placeholder="https://..."
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full text-xs font-mono bg-[#f5f5f7] border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#0071e3] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            {/* Role selection */}
            <div>
              <AdminSelectField
                label="User Role (`role`)"
                title="Pilih Role Pengguna"
                subtitle={`Mengubah hak akses untuk ${name || u.phone}`}
                value={role}
                options={[
                  {
                    value: 'customer',
                    label: 'CUSTOMER',
                    description: 'Pelanggan biasa dengan hak akses pembeli standar',
                    badge: 'CUSTOMER',
                    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
                    icon: <User size={16} className="text-blue-600" />,
                  },
                  {
                    value: 'admin',
                    label: 'ADMIN',
                    description: 'Akses penuh ke seluruh sistem manajemen toko & admin',
                    badge: 'ADMIN',
                    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
                    icon: <ShieldCheck size={16} className="text-purple-600" />,
                  },
                ]}
                onChange={(val) => setRole(val)}
              />
            </div>
          </div>
        </div>

        {/* Contact Info Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Contact Information
          </span>

          <div className="space-y-3">
            {/* Phone */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-[#86868b]">
                  Phone Number (`phone`) - Primary Key
                </label>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${u.phone}`}
                    className="text-[10px] text-[#0071e3] hover:underline flex items-center gap-0.5 font-semibold"
                  >
                    <Phone size={10} /> Call
                  </a>
                  <a
                    href={`https://wa.me/${u.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5 font-semibold"
                  >
                    <MessageCircle size={10} /> WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(u.phone, 'phone')}
                    className="text-[10px] text-gray-500 hover:text-gray-800 flex items-center gap-0.5 font-semibold cursor-pointer"
                  >
                    {copiedField === 'phone' ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                    <span>{copiedField === 'phone' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <input
                type="text"
                readOnly
                value={u.phone}
                className="w-full text-xs font-mono bg-gray-100/70 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 cursor-not-allowed"
              />
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-[#86868b]">
                  Email Address (`email`)
                </label>
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="text-[10px] text-[#0071e3] hover:underline flex items-center gap-0.5 font-semibold"
                  >
                    <Mail size={10} /> Send Email
                  </a>
                )}
              </div>
              <input
                type="email"
                value={email}
                placeholder="user@example.com"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs font-medium bg-[#f5f5f7] border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#0071e3] focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Security / Password Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Security & Credentials
            </span>
            <Lock size={14} className="text-gray-400" />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#86868b] block mb-1">
              User Password (`password`)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                placeholder="Leave blank to keep unchanged"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs font-mono bg-[#f5f5f7] border border-gray-200 rounded-xl pl-3 pr-10 py-2.5 focus:border-[#0071e3] focus:bg-white focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Kosongkan jika tidak ingin mengubah password akun user.
            </p>
          </div>
        </div>

        {/* Shipping Address Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MapPin size={15} className="text-[#0071e3]" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Shipping Address (`address`)
              </span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[10px] font-semibold text-gray-500 block mb-1">Street Address</label>
              <input
                type="text"
                placeholder="Alamat jalan / gedung / unit"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full text-xs bg-[#f5f5f7] border border-gray-200 rounded-xl px-3 py-2 focus:border-[#0071e3] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 block mb-1">City</label>
                <input
                  type="text"
                  placeholder="Kuala Lumpur"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs bg-[#f5f5f7] border border-gray-200 rounded-xl px-3 py-2 focus:border-[#0071e3] focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 block mb-1">Postcode</label>
                <input
                  type="text"
                  placeholder="50450"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="w-full text-xs bg-[#f5f5f7] border border-gray-200 rounded-xl px-3 py-2 focus:border-[#0071e3] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 block mb-1">State</label>
                <input
                  type="text"
                  placeholder="Wilayah Persekutuan"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full text-xs bg-[#f5f5f7] border border-gray-200 rounded-xl px-3 py-2 focus:border-[#0071e3] focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 block mb-1">Country</label>
                <input
                  type="text"
                  placeholder="Malaysia"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full text-xs bg-[#f5f5f7] border border-gray-200 rounded-xl px-3 py-2 focus:border-[#0071e3] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Metadata & JSON Schema Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Record Schema & Metadata
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(JSON.stringify(userJsonOutput, null, 2), 'schema')}
              className="inline-flex items-center gap-1 text-[11px] text-[#0071e3] font-semibold hover:underline cursor-pointer"
            >
              {copiedField === 'schema' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copiedField === 'schema' ? 'Copied JSON!' : 'Copy Schema'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <Calendar size={14} className="text-gray-400 shrink-0" />
            <div>
              <span className="text-gray-400">Created At: </span>
              <span className="font-semibold text-[#1d1d1f]">
                {u.created_at ? new Date(u.created_at).toLocaleString('en-MY') : '—'}
              </span>
            </div>
          </div>

          {/* Pretty JSON output */}
          <div className="relative bg-[#1d1d1f] rounded-xl p-3 text-white overflow-x-auto text-[11px] font-mono leading-relaxed border border-gray-800">
            <pre className="text-emerald-400">
              {JSON.stringify(userJsonOutput, null, 2)}
            </pre>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="w-full py-3.5 bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold rounded-2xl shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Menyimpan Perubahan...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Simpan Perubahan User</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface UsersViewProps {
  users: AdminUser[];
  selectedUser?: AdminUser | null;
  onSelectUser?: (user: AdminUser | null) => void;
  onReload: () => Promise<void>;
  onRoleChange: (phone: string, role: string) => Promise<void>;
  onSaveUser: (phone: string, updates: Partial<AdminUser>) => Promise<void>;
  onCreateUser: (data: { name: string; phone: string; password: string; role?: string; email?: string; avatar_url?: string; address?: any }) => Promise<void>;
}

export function UsersView({
  users,
  selectedUser: propSelectedUser,
  onSelectUser,
  onReload,
  onRoleChange,
  onSaveUser,
  onCreateUser,
}: UsersViewProps) {
  const [internalSelectedUser, setInternalSelectedUser] = useState<AdminUser | null>(null);
  const selectedUser = propSelectedUser !== undefined ? propSelectedUser : internalSelectedUser;
  const setSelectedUser = onSelectUser || setInternalSelectedUser;
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'customer'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [updatingPhone, setUpdatingPhone] = useState<string | null>(null);

  // Add User Form State
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('customer');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'all') {
        const r = u.role || 'customer';
        if (r !== roleFilter) return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchPhone = (u.phone || '').toLowerCase().includes(q);
      const matchName = (u.name || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      const matchAddress = formatUserAddress(u.address).toLowerCase().includes(q);
      return matchPhone || matchName || matchEmail || matchAddress;
    });
  }, [users, roleFilter, searchQuery]);

  const roleCounts = useMemo(() => {
    const adminCount = users.filter((u) => u.role === 'admin').length;
    const customerCount = users.filter((u) => u.role !== 'admin').length;
    return {
      all: users.length,
      admin: adminCount,
      customer: customerCount,
    };
  }, [users]);

  const handleQuickRoleChange = async (u: AdminUser, newRoleVal: string) => {
    setUpdatingPhone(u.phone);
    try {
      await onRoleChange(u.phone, newRoleVal);
    } finally {
      setUpdatingPhone(null);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) {
      setCreateError('Nomor telepon wajib diisi.');
      return;
    }
    if (!newName.trim()) {
      setCreateError('Nama lengkap wajib diisi.');
      return;
    }
    if (!newPassword.trim()) {
      setCreateError('Password wajib diisi.');
      return;
    }

    setCreatingUser(true);
    setCreateError(null);
    try {
      const addressPayload = newStreet.trim() || newCity.trim() ? { street: newStreet.trim(), city: newCity.trim(), country: 'Malaysia' } : null;
      await onCreateUser({
        phone: newPhone.trim(),
        name: newName.trim(),
        password: newPassword.trim(),
        role: newRole,
        email: newEmail.trim() || undefined,
        address: addressPayload,
      });
      // Reset form
      setNewPhone('');
      setNewName('');
      setNewPassword('');
      setNewEmail('');
      setNewRole('customer');
      setNewStreet('');
      setNewCity('');
      setShowAddModal(false);
      await onReload();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Gagal membuat user baru.');
    } finally {
      setCreatingUser(false);
    }
  };

  // If a user is selected, show detail view
  if (selectedUser) {
    const current = users.find((u) => u.phone === selectedUser.phone) || selectedUser;
    return (
      <UserDetailView
        user={current}
        onBack={() => setSelectedUser(null)}
        onSave={async (phone, updates) => {
          await onSaveUser(phone, updates);
          await onReload();
        }}
        onRoleChange={async (phone, r) => {
          await onRoleChange(phone, r);
          await onReload();
        }}
      />
    );
  }

  return (
    <div className="w-full flex flex-col pb-16">
      {/* Top Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-[#1d1d1f]">User Management</h1>
            <p className="text-xs text-gray-500">
              {users.length} registered user{users.length === 1 ? '' : 's'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#0071e3] text-white hover:bg-[#0077ed] transition-colors shadow-2xs cursor-pointer"
          >
            <Plus size={14} />
            <span>New User</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <input
            type="text"
            placeholder="Cari user (nama, nomor telepon, email, alamat)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-[#f5f5f7] border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 focus:border-[#0071e3] focus:bg-white focus:outline-none transition-all"
          />
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              roleFilter === 'all'
                ? 'bg-[#1d1d1f] text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>Semua</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {roleCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              roleFilter === 'admin'
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <ShieldCheck size={13} />
            <span>Admin</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15">
              {roleCounts.admin}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('customer')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              roleFilter === 'customer'
                ? 'bg-[#0071e3] text-white shadow-2xs'
                : 'bg-blue-50 text-[#0071e3] hover:bg-blue-100'
            }`}
          >
            <User size={13} />
            <span>Customer</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15">
              {roleCounts.customer}
            </span>
          </button>
        </div>
      </div>

      {/* User Cards List */}
      <div className="px-4 space-y-3 pt-2">
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-2xs">
            <Users size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs font-bold text-gray-700">Tidak ada user ditemukan</p>
            <p className="text-[11px] text-gray-400 mt-1">
              Coba gunakan kata kunci pencarian lain atau ubah filter role.
            </p>
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isAdm = u.role === 'admin';
            const formattedAddr = formatUserAddress(u.address);
            const isUpdating = updatingPhone === u.phone;

            return (
              <div
                key={u.phone}
                className="bg-white rounded-2xl border border-gray-200 p-3.5 shadow-2xs hover:shadow-xs transition-shadow space-y-3"
              >
                {/* Header row: Avatar + Name + Role Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    onClick={() => setSelectedUser(u)}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] border border-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt={u.name || u.phone}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-gray-600">
                          {getUserInitials(u.name, u.phone)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1d1d1f] truncate">
                          {u.name || 'Unnamed User'}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono mt-0.5 flex items-center gap-1">
                        <Phone size={11} className="text-gray-400 shrink-0" />
                        <span>{u.phone}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                      isAdm
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isAdm ? <ShieldCheck size={11} /> : <User size={11} />}
                    {isAdm ? 'ADMIN' : 'CUSTOMER'}
                  </span>
                </div>

                {/* Info row: email & address */}
                <div className="text-[11px] text-gray-500 space-y-1 bg-[#f9f9fb] p-2.5 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">
                      {u.email ? u.email : <span className="text-gray-400 italic">No email set</span>}
                    </span>
                  </div>

                  {formattedAddr && (
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin size={12} className="text-gray-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1 leading-snug">{formattedAddr}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-gray-400 text-[10px] pt-0.5">
                    <Calendar size={11} className="shrink-0" />
                    <span>
                      {u.created_at
                        ? `Joined: ${new Date(u.created_at).toLocaleDateString('en-MY', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}`
                        : 'Registration date not available'}
                    </span>
                  </div>
                </div>

                {/* Footer Controls: Quick Role Switcher + Edit Button */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Role:
                    </span>
                    <AdminSelectField
                      variant="compact"
                      title="Ubah Role Pengguna"
                      subtitle={`${u.name || 'User'} (${u.phone})`}
                      value={u.role || 'customer'}
                      disabled={isUpdating}
                      options={[
                        {
                          value: 'customer',
                          label: 'CUSTOMER',
                          description: 'Pelanggan biasa (default)',
                          badge: 'CUSTOMER',
                          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
                          icon: <User size={14} className="text-blue-600" />,
                        },
                        {
                          value: 'admin',
                          label: 'ADMIN',
                          description: 'Akses penuh dashboard & manajemen admin',
                          badge: 'ADMIN',
                          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
                          icon: <ShieldCheck size={14} className="text-purple-600" />,
                        },
                      ]}
                      onChange={(newVal) => void handleQuickRoleChange(u, newVal)}
                    />
                    {isUpdating && <Loader2 size={12} className="animate-spin text-[#0071e3]" />}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedUser(u)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0071e3] hover:text-[#0077ed] px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <span>Detail & Edit</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add New User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0071e3] flex items-center justify-center">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1d1d1f]">Tambah User Baru</h3>
                  <p className="text-[10px] text-gray-400">Pendaftaran akun Apple Store</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold p-1 cursor-pointer"
              >
                Tutup
              </button>
            </div>

            {createError && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  Nomor Telepon (`phone`) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+60123456789"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-[#f5f5f7] border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-[#0071e3] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  Nama Lengkap (`name`) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#f5f5f7] border border-gray-200 rounded-xl px-3 py-2 text-xs focus:border-[#0071e3] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  Password (`password`) *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#f5f5f7] border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-[#0071e3] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  Email (`email`)
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-[#f5f5f7] border border-gray-200 rounded-xl px-3 py-2 text-xs focus:border-[#0071e3] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <AdminSelectField
                  label="Role (`role`)"
                  title="Pilih Role Pengguna Baru"
                  subtitle="Tentukan hak akses akun pada sistem"
                  value={newRole}
                  options={[
                    {
                      value: 'customer',
                      label: 'CUSTOMER',
                      description: 'Pelanggan biasa (default)',
                      badge: 'CUSTOMER',
                      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
                      icon: <User size={14} className="text-blue-600" />,
                    },
                    {
                      value: 'admin',
                      label: 'ADMIN',
                      description: 'Akses penuh dashboard & manajemen admin',
                      badge: 'ADMIN',
                      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
                      icon: <ShieldCheck size={14} className="text-purple-600" />,
                    },
                  ]}
                  onChange={(val) => setNewRole(val)}
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-gray-100">
                <label className="text-[11px] font-semibold text-gray-600 block">
                  Alamat Pengiriman (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Street / Alamat Jalan"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  className="w-full bg-[#f5f5f7] border border-gray-200 rounded-xl px-3 py-2 text-xs focus:border-[#0071e3] focus:bg-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="City / Kota"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full bg-[#f5f5f7] border border-gray-200 rounded-xl px-3 py-2 text-xs focus:border-[#0071e3] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="flex-1 py-2.5 bg-[#0071e3] text-white rounded-xl font-semibold hover:bg-[#0077ed] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {creatingUser ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Buat User</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
