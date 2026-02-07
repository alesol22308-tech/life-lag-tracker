'use client';

export const dynamic = 'force-dynamic';

// VERSION MARKER: Settings page v4.0 - Tabbed interface redesign
// This version implements a clean tabbed interface and removes email/SMS notifications
console.log('[Settings] Page loaded - v4.0 with tabbed interface');

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import GlassCard from '@/components/GlassCard';
import PrimaryButton from '@/components/PrimaryButton';
import GhostButton from '@/components/GhostButton';
import DeleteAccountModal from '@/components/DeleteAccountModal';
import SkeletonCard from '@/components/SkeletonCard';
import ThemeToggle from '@/components/ThemeToggle';
import { applyHighContrastMode, applyFontSizePreference } from '@/lib/accessibility';
import {
  isPushAvailable,
  getPlatform,
  registerForPushNotifications,
  unregisterFromPushNotifications,
  setupPushNotificationListeners,
  saveDeviceToken,
  removeDeviceToken,
} from '@/lib/push-registration';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';

type TabId = 'account' | 'preferences' | 'appearance' | 'data';

// Tab icons as inline SVG components
const AccountIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PreferencesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

const AppearanceIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
  </svg>
);

const DataIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'account', label: 'Account', icon: <AccountIcon /> },
  { id: 'preferences', label: 'Preferences', icon: <PreferencesIcon /> },
  { id: 'appearance', label: 'Appearance', icon: <AppearanceIcon /> },
  { id: 'data', label: 'Data & Privacy', icon: <DataIcon /> },
];

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<TabId>('account');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [email, setEmail] = useState('');
  const [preferredDay, setPreferredDay] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [pushNotificationEnabled, setPushNotificationEnabled] = useState(false);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailChangeMessage, setEmailChangeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isRegisteringPush, setIsRegisteringPush] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fontSizePreference, setFontSizePreference] = useState<'default' | 'large' | 'extra-large'>('default');
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Track unsaved changes (only after initial load)
  useEffect(() => {
    if (!loading && !isInitialLoad) {
      setHasUnsavedChanges(true);
    }
  }, [preferredDay, preferredTime, autoAdvanceEnabled, pushNotificationEnabled, fontSizePreference, highContrastMode, loading, isInitialLoad]);

  useEffect(() => {
    async function loadSettings() {
      console.log('[Settings] Loading settings - v4.0 (tabbed interface)');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email || '');

      // Check if push notifications are supported
      setIsPushSupported(isPushAvailable());

      // Load user preferences - query base columns first, then optional ones individually
      console.log('[Settings] Using new column loading approach');
      let data: any = null;
      let error: any = null;
      
      // Step 1: Query base columns (excluding email/SMS reminder fields)
      const { data: dataBase, error: errorBase } = await supabase
        .from('users')
        .select('preferred_checkin_day, preferred_checkin_time, push_notification_enabled, auto_advance_enabled')
        .eq('id', user.id)
        .single();

      if (errorBase) {
        console.error('[Settings] Error loading base preferences:', errorBase);
        data = null;
        error = errorBase;
      } else {
        data = { ...dataBase };
        
        // Try to load optional columns one by one
        const optionalColumns: Array<{ name: string }> = [
          { name: 'has_password' },
          { name: 'font_size_preference' },
          { name: 'high_contrast_mode' },
          { name: 'language_preference' },
        ];
        
        for (const col of optionalColumns) {
          try {
            const { data: colData, error: colError } = await supabase
              .from('users')
              .select(col.name)
              .eq('id', user.id)
              .single();
            
            if (colError) {
              const isColumnError = 
                colError.code === '42703' ||
                colError.code === 'PGRST116' ||
                colError.message?.includes('column') ||
                colError.message?.includes('does not exist') ||
                colError.message?.includes('permission') ||
                colError.message?.includes('row-level security');
              
              if (isColumnError) {
                continue;
              }
              console.warn(`[Settings] Error loading ${col.name}:`, colError.message || colError);
              continue;
            }
            
            if (colData) {
              const value = (colData as any)[col.name];
              if (value !== undefined) {
                (data as any)[col.name] = value;
              }
            }
          } catch (err: any) {
            const isColumnError = 
              err?.code === '42703' ||
              err?.message?.includes('column') ||
              err?.message?.includes('does not exist');
            
            if (!isColumnError) {
              console.warn(`[Settings] Unexpected error loading ${col.name}:`, err);
            }
          }
        }
      }

      if (!error && data) {
        setPreferredDay(data.preferred_checkin_day || '');
        setPreferredTime(data.preferred_checkin_time || '');
        setPushNotificationEnabled(data.push_notification_enabled ?? false);
        setAutoAdvanceEnabled(data.auto_advance_enabled ?? true);
        setHasPassword(data.has_password ?? false);
        setFontSizePreference((data.font_size_preference as 'default' | 'large' | 'extra-large') ?? 'default');
        setHighContrastMode(data.high_contrast_mode ?? false);
      }

      setLoading(false);
      setHasUnsavedChanges(false);
      setIsInitialLoad(false);
    }

    loadSettings();

    // Setup push notification listeners if on mobile
    if (isPushAvailable()) {
      setupPushNotificationListeners(
        async (token) => {
          const platform = getPlatform();
          await saveDeviceToken(token, platform);
        },
        (notification) => {
          console.log('Notification received:', notification);
        }
      );
    }
  }, [supabase, router]);

  const handleSavePreferences = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    try {
      const response = await fetch('/api/settings/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredCheckinDay: preferredDay || null,
          preferredCheckinTime: preferredTime || null,
          pushNotificationEnabled,
          autoAdvanceEnabled,
          fontSizePreference,
          highContrastMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.details ? `${errorData.error}: ${errorData.details}` : (errorData.error || 'Failed to save preferences');
        throw new Error(errorMsg);
      }

      // Apply accessibility preferences immediately
      applyFontSizePreference(fontSizePreference);
      applyHighContrastMode(highContrastMode);
      
      // Reset unsaved changes flag
      setHasUnsavedChanges(false);
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      alert(error.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) {
      setEmailChangeMessage({ type: 'error', text: 'Please enter a new email address' });
      return;
    }

    setIsChangingEmail(true);
    setEmailChangeMessage(null);

    try {
      const response = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update email');
      }

      setEmailChangeMessage({ 
        type: 'success', 
        text: data.message || 'Check your email to confirm the new address' 
      });
      setNewEmail('');
    } catch (error: any) {
      setEmailChangeMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update email' 
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handlePushNotificationToggle = async (enabled: boolean) => {
    if (!isPushSupported) {
      alert('Push notifications are only available on mobile devices');
      return;
    }

    setIsRegisteringPush(true);

    try {
      if (enabled) {
        const result = await registerForPushNotifications();
        
        if (!result.success) {
          alert(result.error || 'Failed to enable push notifications');
          setIsRegisteringPush(false);
          return;
        }

        setPushNotificationEnabled(true);
      } else {
        await unregisterFromPushNotifications();
        await removeDeviceToken();
        setPushNotificationEnabled(false);
      }
    } catch (error: any) {
      console.error('Error toggling push notifications:', error);
      alert(error.message || 'Failed to toggle push notifications');
    } finally {
      setIsRegisteringPush(false);
    }
  };

  const handlePasswordSetup = async () => {
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setIsSettingPassword(true);
    setPasswordMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      const { error: dbError } = await supabase
        .from('users')
        .update({ has_password: true })
        .eq('id', user.id);

      if (dbError && !dbError.message?.includes('column')) {
        throw dbError;
      }

      setPasswordMessage({ 
        type: 'success', 
        text: hasPassword ? 'Password updated successfully!' : 'Password set successfully! You can now use it to sign in.' 
      });
      setHasPassword(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordMessage({ 
        type: 'error', 
        text: error.message || 'Failed to set password' 
      });
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/export?format=${format}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `lifelag-data.${format}`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Error exporting data:', error);
      alert(error.message || 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async (gracePeriod: boolean) => {
    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gracePeriod }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      alert(data.message);

      if (!gracePeriod) {
        await supabase.auth.signOut();
        router.push('/');
      } else {
        setShowDeleteModal(false);
      }
    } catch (error: any) {
      console.error('Error deleting account:', error);
      alert(error.message || 'Failed to delete account');
      throw error;
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <div className="space-y-3 mb-8">
            <div className="h-12 bg-white/10 rounded-lg w-40 animate-pulse" />
            <div className="h-6 bg-white/10 rounded-lg w-80 animate-pulse" />
          </div>
          <div className="space-y-4">
            <SkeletonCard height="200px" lines={4} />
            <SkeletonCard height="300px" lines={5} />
            <SkeletonCard height="250px" lines={4} />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-text0 mb-2">Settings</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage your account, preferences, and privacy</p>
        </div>

        {/* Tab Navigation */}
        <nav className="border-b border-gray-200 dark:border-gray-700 mb-6" aria-label="Settings tabs">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400 border-blue-500'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                aria-selected={activeTab === tab.id}
                role="tab"
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Account Tab */}
          {activeTab === 'account' && (
            <section id="tabpanel-account" role="tabpanel" aria-labelledby="tab-account" className="space-y-6">
              {/* Email (read-only) */}
              <GlassCard className="p-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    aria-label="Email address (read-only)"
                    className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-white/5 text-text2 cursor-not-allowed"
                  />
                </div>
              </GlassCard>

              {/* Email Change Section */}
              <GlassCard className="p-6 space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-text0">
                    Change Email Address
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    To change your login email address:
                  </p>
                </div>
                <div className="space-y-3">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email address"
                    aria-label="New email address"
                    className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-white/5 text-text0 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent placeholder:text-text2"
                  />
                  <PrimaryButton
                    onClick={handleUpdateEmail}
                    disabled={isChangingEmail || !newEmail.trim()}
                    aria-label={isChangingEmail ? 'Updating email address' : 'Update email address'}
                    className="text-sm px-4 py-2"
                  >
                    {isChangingEmail ? 'Updating...' : 'Update Email'}
                  </PrimaryButton>
                  {emailChangeMessage && (
                    <p className={`text-sm ${emailChangeMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {emailChangeMessage.text}
                    </p>
                  )}
                  <p className="text-xs text-text2">
                    You&apos;ll receive a confirmation email at the new address to verify the change.
                  </p>
                </div>
              </GlassCard>

              {/* Password Management Section */}
              <GlassCard className="p-6 space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-text0">
                    {hasPassword ? 'Change Password' : 'Set Up Password'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {hasPassword 
                      ? 'Update your password for signing in' 
                      : 'Set a password for faster sign-ins instead of waiting for magic links'}
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-text1 mb-2">
                      {hasPassword ? 'New Password' : 'Password'}
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter password (min 8 characters)"
                      aria-label="New password"
                      className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-white/5 text-text0 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent placeholder:text-text2"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-text1 mb-2">
                      Confirm Password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      aria-label="Confirm password"
                      className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-white/5 text-text0 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent placeholder:text-text2"
                    />
                  </div>
                  <PrimaryButton
                    onClick={handlePasswordSetup}
                    disabled={isSettingPassword || !newPassword || !confirmPassword}
                    aria-label={isSettingPassword ? 'Setting password' : 'Set password'}
                    className="text-sm px-4 py-2"
                  >
                    {isSettingPassword ? 'Setting...' : (hasPassword ? 'Update Password' : 'Set Password')}
                  </PrimaryButton>
                  {passwordMessage && (
                    <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {passwordMessage.text}
                    </p>
                  )}
                  <p className="text-xs text-text2">
                    {hasPassword 
                      ? 'Your password must be at least 8 characters long'
                      : 'You can still use magic links if you prefer, but a password makes signing in faster'}
                  </p>
                </div>
              </GlassCard>

              {/* Sign Out */}
              <GlassCard className="p-6">
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold text-text0">Sign Out</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sign out of your account
                  </p>
                  <button
                    onClick={handleSignOut}
                    aria-label="Sign out"
                    className="px-6 py-3 text-text2 hover:text-text1 transition-colors duration-200 underline"
                  >
                    Sign Out
                  </button>
                </div>
              </GlassCard>
            </section>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <section id="tabpanel-preferences" role="tabpanel" aria-labelledby="tab-preferences" className="space-y-6">
              {/* Weekly Check-in Time */}
              <GlassCard className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="block text-xl font-semibold text-text0">
                    Weekly Check-in Time (Optional)
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Set your preferred day and time for weekly check-ins
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="checkin-day" className="block text-sm font-medium text-text1 mb-2">
                      Day
                    </label>
                    <select
                      id="checkin-day"
                      value={preferredDay}
                      onChange={(e) => setPreferredDay(e.target.value)}
                      className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-white/5 text-text0 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent [&>option]:bg-bg1 [&>option]:text-text0"
                    >
                      <option value="">Not set</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="checkin-time" className="block text-sm font-medium text-text1 mb-2">
                      Time
                    </label>
                    <input
                      id="checkin-time"
                      type="time"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-white/5 text-text0 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
                    />
                  </div>
                </div>
              </GlassCard>

              {/* Calendar Export */}
              <GlassCard className="p-6 space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-text0">
                    Add to Calendar
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Download a calendar file with recurring weekly check-in reminders
                  </p>
                </div>
                <div className="space-y-3">
                  {(!preferredDay || !preferredTime) ? (
                    <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-lg">
                      <p className="text-sm text-amber-300">
                        Please set your preferred check-in day and time above to generate calendar reminders.
                      </p>
                    </div>
                  ) : (
                    <>
                      <PrimaryButton
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/calendar/export');
                            if (!response.ok) {
                              const error = await response.json();
                              throw new Error(error.error || 'Failed to generate calendar file');
                            }
                            
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'lifelag-checkin-reminders.ics';
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                          } catch (error: any) {
                            console.error('Error exporting calendar:', error);
                            alert(error.message || 'Failed to export calendar');
                          }
                        }}
                        className="w-full text-sm px-4 py-2"
                        aria-label="Download calendar file"
                      >
                        Download Calendar File
                      </PrimaryButton>
                      <div className="space-y-2 text-xs text-text2">
                        <p className="font-medium text-text1">How to use:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li><strong>Google Calendar:</strong> Import the downloaded file or drag it into your calendar</li>
                          <li><strong>Apple Calendar:</strong> Double-click the file to add it to your calendar</li>
                          <li><strong>Outlook:</strong> Import the file through File → Open & Import</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </GlassCard>

              {/* Auto-advance during check-in */}
              <GlassCard className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1 mr-4">
                    <h2 className="text-xl font-semibold text-text0">
                      Auto-advance Questions
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically move to next question after answering
                    </p>
                  </div>
                  <button
                    onClick={() => setAutoAdvanceEnabled(!autoAdvanceEnabled)}
                    role="switch"
                    aria-checked={autoAdvanceEnabled}
                    aria-label="Enable auto-advance"
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-white/30 ${
                      autoAdvanceEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoAdvanceEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </GlassCard>

              {/* Mobile Push Notifications */}
              {isPushSupported && (
                <GlassCard className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1 mr-4">
                      <h2 className="text-xl font-semibold text-text0">
                        Mobile Push Notifications
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Receive push notifications on your mobile device
                      </p>
                    </div>
                    <button
                      onClick={() => handlePushNotificationToggle(!pushNotificationEnabled)}
                      disabled={isRegisteringPush}
                      role="switch"
                      aria-checked={pushNotificationEnabled}
                      aria-label="Enable mobile push notifications"
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-white/30 ${
                        pushNotificationEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      } ${isRegisteringPush ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          pushNotificationEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </GlassCard>
              )}

              {/* Browser Push Notifications */}
              <GlassCard className="p-6">
                <PushNotificationPrompt variant="inline" />
              </GlassCard>

              {/* Reset Onboarding */}
              <GlassCard className="p-6 space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-text0">
                    Onboarding Tour
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Revisit the guided tour to learn about Life-Lag features and how to use them
                  </p>
                </div>
                <PrimaryButton
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/settings/onboarding', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ completed: false }),
                      });

                      if (!response.ok) {
                        throw new Error('Failed to reset onboarding status');
                      }

                      if (typeof window !== 'undefined' && window.localStorage) {
                        localStorage.removeItem('checkinTooltipsCompleted');
                        localStorage.removeItem('onboardingCompleted');
                      }

                      router.push('/home');
                      alert('Onboarding tour reset! When you start your next check-in, you\'ll see the guided tour.');
                    } catch (error: any) {
                      console.error('Error resetting onboarding:', error);
                      alert('Failed to reset onboarding tour. Please try again.');
                    }
                  }}
                  className="w-full text-sm px-4 py-2"
                  aria-label="Show onboarding tour again"
                >
                  Show Onboarding Tour Again
                </PrimaryButton>
                <p className="text-xs text-text2">
                  This will reset your onboarding status. The tour will appear during your next check-in.
                </p>
              </GlassCard>
            </section>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <section id="tabpanel-appearance" role="tabpanel" aria-labelledby="tab-appearance" className="space-y-6">
              {/* Theme */}
              <GlassCard className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="block text-xl font-semibold text-text0">
                    Theme
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose your preferred color scheme
                  </p>
                </div>
                <ThemeToggle />
              </GlassCard>

              {/* Font Size */}
              <GlassCard className="p-6 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="font-size" className="block text-xl font-semibold text-text0">
                    Font Size
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Adjust the base font size for better readability
                  </p>
                </div>
                <select
                  id="font-size"
                  value={fontSizePreference}
                  onChange={(e) => {
                    const newSize = e.target.value as 'default' | 'large' | 'extra-large';
                    setFontSizePreference(newSize);
                    applyFontSizePreference(newSize);
                  }}
                  className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-white/5 text-text0 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent [&>option]:bg-bg1 [&>option]:text-text0"
                >
                  <option value="default">Default (16px)</option>
                  <option value="large">Large (18px)</option>
                  <option value="extra-large">Extra Large (20px)</option>
                </select>
              </GlassCard>

              {/* High Contrast Mode */}
              <GlassCard className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1 mr-4">
                    <label className="text-xl font-semibold text-text0">
                      High Contrast Mode
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Increase contrast for better visibility (meets WCAG AAA standards)
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !highContrastMode;
                      setHighContrastMode(newValue);
                      applyHighContrastMode(newValue);
                    }}
                    role="switch"
                    aria-checked={highContrastMode}
                    aria-label="Enable high contrast mode"
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-white/30 ${
                      highContrastMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        highContrastMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </GlassCard>
            </section>
          )}

          {/* Data & Privacy Tab */}
          {activeTab === 'data' && (
            <section id="tabpanel-data" role="tabpanel" aria-labelledby="tab-data" className="space-y-6">
              {/* Data Export */}
              <GlassCard className="p-6 space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-text0">
                    Download My Data
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Export all your check-in data, scores, and reflection notes
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <PrimaryButton
                    onClick={() => handleExport('json')}
                    disabled={isExporting}
                    aria-label={isExporting ? 'Exporting data' : 'Download as JSON'}
                    className="flex-1 text-sm px-4 py-2"
                  >
                    {isExporting ? 'Exporting...' : 'Download JSON'}
                  </PrimaryButton>
                  <GhostButton
                    onClick={() => handleExport('csv')}
                    disabled={isExporting}
                    aria-label={isExporting ? 'Exporting data' : 'Download as CSV'}
                    className="flex-1 text-sm px-4 py-2"
                  >
                    {isExporting ? 'Exporting...' : 'Download CSV'}
                  </GhostButton>
                </div>
                <p className="text-xs text-text2">
                  JSON includes complete data. CSV is a simplified table format for spreadsheets.
                </p>
              </GlassCard>

              {/* Delete Account */}
              <GlassCard className="p-6 border-red-200 dark:border-red-900 bg-red-400/5 space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-red-700 dark:text-red-400">
                    Delete Account
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Permanently delete your account and all associated data, or schedule deletion for 30 days from now.
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-300 font-medium transition-all duration-200"
                  aria-label="Delete account"
                >
                  Delete My Account
                </button>
                <p className="text-xs text-text2">
                  This action will delete all your check-ins, scores, reflection notes, and account preferences.
                </p>
              </GlassCard>
            </section>
          )}
        </div>

        {/* Floating Save Bar */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-bg0 border-t border-gray-200 dark:border-gray-700 shadow-lg p-4 z-50">
            <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">You have unsaved changes</p>
              <PrimaryButton
                onClick={handleSavePreferences}
                disabled={saving}
                aria-label={saving ? 'Saving preferences' : 'Save preferences'}
                className="text-sm px-4 py-2"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        <DeleteAccountModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
        />
      </div>
    </AppShell>
  );
}
