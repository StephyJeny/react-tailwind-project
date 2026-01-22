import React, { useEffect, useState } from 'react';
import { 
  UsersIcon, 
  ShieldCheckIcon, 
  ChartBarIcon,
  CogIcon 
} from '@heroicons/react/24/outline';

import { useApp } from '../state/AppContext';
import { db } from '../services/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export default function Admin() {
  const { user, t } = useApp();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ role: 'user', status: 'active' });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, 'users'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsers(list);
      } catch (error) {
        console.error('Failed to load users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
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
    const confirmed = window.confirm('Delete this user?');
    if (!confirmed) return;
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
            <div className="overflow-x-auto">
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
                  {!loading && users.map((u) => (
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
                              onClick={() => deleteUser(u.id)}
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
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                  {t('configure')}
                </button>
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
                <select className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800">
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>2 hours</option>
                </select>
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
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">1,234</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 dark:text-green-100">{t('active_sessions')}</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">89</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-yellow-900 dark:text-yellow-100">{t('failed_logins')}</h3>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">12</p>
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
