import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { 
  UsersIcon, 
  ShieldCheckIcon, 
  ChartBarIcon,
  CogIcon 
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { collection, getDocs, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

import { useApp } from '../state/AppContext';
import { db } from '../services/firebase';


export default function Admin() {
  const { user, t } = useApp();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ role: 'user', status: 'active' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const rowHeight = 64;
  const listRef = useRef(null);
  const [startIndex, setStartIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(12);
  const [pageSize, setPageSize] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'users'),
        (snap) => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setUsers(list);
          setLoading(false);
        },
        () => {
          toast.error('Failed to load users');
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch {
      setLoading(false);
      toast.error('Failed to load users');
    }
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.clientHeight || 600;
      const count = Math.max(5, Math.ceil(h / rowHeight) + 2);
      setVisibleCount(count);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [rowHeight]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = term
      ? users.filter(u => 
          (u.name || '').toLowerCase().includes(term) ||
          (u.email || '').toLowerCase().includes(term) ||
          (u.role || '').toLowerCase().includes(term) ||
          (u.status || '').toLowerCase().includes(term)
        )
      : users.slice();
    if (filterRole !== 'all') list = list.filter(u => (u.role || 'user') === filterRole);
    if (filterStatus !== 'all') list = list.filter(u => (u.status || 'active') === filterStatus);
    list.sort((a, b) => {
      const va = (a[sortBy] || '').toString().toLowerCase();
      const vb = (b[sortBy] || '').toString().toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [users, search, filterRole, filterStatus, sortBy, sortDir]);

  const displayList = useMemo(() => {
    if (pageSize === 'all') return filtered;
    const size = Number(pageSize);
    const start = (page - 1) * size;
    return filtered.slice(start, start + size);
  }, [filtered, page, pageSize]);

  const totalPages = useMemo(() => {
    if (pageSize === 'all') return 1;
    const size = Number(pageSize);
    return Math.max(1, Math.ceil(filtered.length / size));
  }, [filtered, pageSize]);

  const onScroll = useCallback((e) => {
    const top = e.currentTarget.scrollTop;
    const idx = Math.floor(top / rowHeight);
    setStartIndex(idx);
  }, []);

  const startEdit = (u) => {
    setEditingId(u.id);
    setEditForm({ role: u.role || 'user', status: u.status || 'active' });
  };

  const saveEdit = async () => {
    try {
      const ref = doc(db, 'users', editingId);
      await updateDoc(ref, { role: editForm.role, status: editForm.status });
      setUsers(prev => prev.map(u => u.id === editingId ? { ...u, role: editForm.role, status: editForm.status } : u));
      toast.success('User updated');
      setEditingId(null);
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Update failed');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const deleteUser = async (id) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('User deleted');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Delete failed');
    }
  };

  const tabs = [
    { id: 'users', name: t('admin_tab_users'), icon: UsersIcon },
    { id: 'security', name: t('admin_tab_security'), icon: ShieldCheckIcon },
    { id: 'analytics', name: t('admin_tab_analytics'), icon: ChartBarIcon },
    { id: 'settings', name: t('admin_tab_settings'), icon: CogIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin_panel')}
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <ShieldCheckIcon className="h-4 w-4" />
            {t('admin_access')}
          </div>
        </div>
        
        <nav className="mt-4 flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {activeTab === 'users' && (
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t('user_management')}
            </h2>
            <div className="flex items-center justify-between mb-4 gap-3">
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); }}
                placeholder="Search users..."
                className="w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
              />
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">Page size: All (virtualized)</option>
                <option value="10">Page size: 10</option>
                <option value="25">Page size: 25</option>
                <option value="50">Page size: 50</option>
              </select>
              <select
                value={filterRole}
                onChange={(e) => { setFilterRole(e.target.value); }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">All roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
              >
                <option value="name">Sort: Name</option>
                <option value="email">Sort: Email</option>
                <option value="role">Sort: Role</option>
                <option value="status">Sort: Status</option>
              </select>
              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
              {pageSize !== 'all' && (
                <div className="flex items-center gap-2 text-sm">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span>Page {page} / {totalPages}</span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-auto" ref={listRef} onScroll={onScroll} style={{ maxHeight: 600 }}>
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('table_user')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('table_role')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('table_status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('table_actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading && (
                    <tr><td className="px-6 py-4" colSpan={4}>Loading...</td></tr>
                  )}
                  {!loading && users.length === 0 && (
                    <tr><td className="px-6 py-4" colSpan={4}>No users found.</td></tr>
                  )}
                  {!loading && pageSize === 'all' && filtered.length > 0 && (
                    <tr style={{ height: startIndex * rowHeight }}>
                      <td colSpan={4} />
                    </tr>
                  )}
                  {!loading && pageSize === 'all' && filtered.slice(startIndex, Math.min(filtered.length, startIndex + visibleCount)).map((u) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {u.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {u.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === u.id ? (
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm(f => ({ ...f, role: e.target.value }))}
                            className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-sm"
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            u.role === 'admin'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === u.id ? (
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
                            className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-sm"
                          >
                            <option value="active">active</option>
                            <option value="inactive">inactive</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            (u.status || 'active') === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {u.status || 'active'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingId === u.id ? (
                          <>
                            <button
                              onClick={saveEdit}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(u)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                            >
                              {t('edit')}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(u.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              {t('delete')}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!loading && pageSize === 'all' && filtered.length > 0 && (
                    <tr style={{ height: Math.max(0, (filtered.length - (startIndex + visibleCount)) * rowHeight) }}>
                      <td colSpan={4} />
                    </tr>
                  )}
                  {!loading && pageSize !== 'all' && displayList.map((u) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {u.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {u.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === u.id ? (
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm(f => ({ ...f, role: e.target.value }))}
                            className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-sm"
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            u.role === 'admin'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === u.id ? (
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
                            className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-sm"
                          >
                            <option value="active">active</option>
                            <option value="inactive">inactive</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            (u.status || 'active') === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {u.status || 'active'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingId === u.id ? (
                          <>
                            <button
                              onClick={saveEdit}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(u)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                            >
                              {t('edit')}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(u.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              {t('delete')}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {confirmDeleteId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-96">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Confirm Deletion</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Are you sure you want to delete this user?</p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-4 py-2 rounded border border-gray-300 dark:border-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => { await deleteUser(confirmDeleteId); setConfirmDeleteId(null); }}
                      className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t('security_settings')}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {t('two_factor_authentication')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('require_2fa')}
                  </p>
                </div>
                <TwoFAToggle />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {t('session_timeout')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('auto_logout_inactive')}
                  </p>
                </div>
                <SessionTimeoutSelector />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t('system_analytics')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">{t('total_users')}</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{users.length}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 dark:text-green-100">{t('active_sessions')}</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{users.filter(u => (u.status || 'active') === 'active').length}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-yellow-900 dark:text-yellow-100">{t('failed_logins')}</h3>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">0</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t('system_settings')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('application_name')}
                </label>
                <input
                  type="text"
                  defaultValue="Personal Finance & Store"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('maintenance_mode')}
                </label>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('enable_maintenance_mode')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TwoFAToggle() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    getDocs(collection(db, 'settings')).then((snap) => {
      const docData = snap.docs.find(d => d.id === 'security')?.data();
      if (docData && typeof docData.require2fa === 'boolean') setEnabled(docData.require2fa);
    }).catch(() => {});
  }, []);
  const toggle = async () => {
    try {
      await updateDoc(doc(db, 'settings', 'security'), { require2fa: !enabled });
      setEnabled(!enabled);
      toast.success('2FA setting updated');
    } catch {
      await deleteDoc(doc(db, 'settings', 'security')).catch(()=>{});
      await updateDoc(doc(db, 'settings', 'security'), { require2fa: !enabled }).catch(()=>{});
      setEnabled(!enabled);
    }
  };
  return (
    <button onClick={toggle} className={`px-4 py-2 rounded-md ${enabled ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white'} hover:opacity-90`}>
      {enabled ? '2FA Enabled' : 'Enable 2FA'}
    </button>
  );
}

function SessionTimeoutSelector() {
  const [minutes, setMinutes] = useState(30);
  useEffect(() => {
    getDocs(collection(db, 'settings')).then((snap) => {
      const docData = snap.docs.find(d => d.id === 'security')?.data();
      if (docData && typeof docData.sessionTimeoutMinutes === 'number') setMinutes(docData.sessionTimeoutMinutes);
    }).catch(() => {});
  }, []);
  const update = async (m) => {
    setMinutes(m);
    try {
      await updateDoc(doc(db, 'settings', 'security'), { sessionTimeoutMinutes: m });
      toast.success('Session timeout updated');
    } catch {}
  };
  return (
    <select value={minutes} onChange={(e) => update(Number(e.target.value))} className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800">
      <option value={15}>15 minutes</option>
      <option value={30}>30 minutes</option>
      <option value={60}>1 hour</option>
      <option value={120}>2 hours</option>
    </select>
  );
}
