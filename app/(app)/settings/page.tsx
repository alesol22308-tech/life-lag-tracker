'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDarkMode } from '@/lib/hooks/useDarkMode';
import AppShell from '@/components/AppShell';
import GlassCard from '@/components/GlassCard';
import PrimaryButton from '@/components/PrimaryButton';
import GhostButton from '@/components/GhostButton';
import {
  isPushAvailable,
  getPlatform,
  registerForPushNotifications,
  unregisterFromPushNotifications,
  setupPushNotificationListeners,
  saveDeviceToken,
  removeDeviceToken,
} from '@/lib/push-registration';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [email, setEmail] = useState('');
  const [preferredDay, setPreferredDay] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [emailReminderEnabled, setEmailReminderEnabled] = useState(true);
  const [smsReminderEnabled, setSmsReminderEnabled] = useState(false);
  const [smsPhoneNumber, setSmsPhoneNumber] = useState('');
  const [pushNotificationEnabled, setPushNotificationEnabled] = useState(false);
  const [midWeekCheckEnabled, setMidWeekCheckEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailChangeMessage, setEmailChangeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isRegisteringPush, setIsRegisteringPush] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email || '');

      // Check if push notifications are supported
      setIsPushSupported(isPushAvailable());

      // Load user preferences
      const { data, error } = await supabase
        .from('users')
        .select('preferred_checkin_day, preferred_checkin_time, email_reminder_enabled, sms_reminder_enabled, sms_phone_number, push_notification_enabled, dark_mode_enabled, reminder_enabled, mid_week_check_enabled')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setPreferredDay(data.preferred_checkin_day || '');
        setPreferredTime(data.preferred_checkin_time || '');
        setEmailReminderEnabled(data.email_reminder_enabled ?? (data.reminder_enabled ?? true));
        setSmsReminderEnabled(data.sms_reminder_enabled ?? false);
        setSmsPhoneNumber(data.sms_phone_number || '');
        setPushNotificationEnabled(data.push_notification_enabled ?? false);
        setMidWeekCheckEnabled(data.mid_week_check_enabled ?? false);
        setDarkModeEnabled(data.dark_mode_enabled ?? false);
      }

      setLoading(false);
    }

    loadSettings();

    // Setup push notification listeners if on mobile
    if (isPushAvailable()) {
      setupPushNotificationListeners(
        async (token) => {
          // Save token to backend when received
          const platform = getPlatform();
          await saveDeviceToken(token, platform);
        },
        (notification) => {
          // Handle incoming notification while app is in foreground
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
          emailReminderEnabled,
          smsReminderEnabled,
          smsPhoneNumber: smsReminderEnabled ? smsPhoneNumber : null,
          pushNotificationEnabled,
          midWeekCheckEnabled,
          darkModeEnabled,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.details ? `${errorData.error}: ${errorData.details}` : (errorData.error || 'Failed to save preferences');
        throw new Error(errorMsg);
      }

      // Sync dark mode state
      if (darkModeEnabled !== isDarkMode) {
        toggleDarkMode(darkModeEnabled);
      }
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

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkModeEnabled(enabled);
    toggleDarkMode(enabled);
  };

  const handlePushNotificationToggle = async (enabled: boolean) => {
    if (!isPushSupported) {
      alert('Push notifications are only available on mobile devices');
      return;
    }

    setIsRegisteringPush(true);

    try {
      if (enabled) {
        // Register for push notifications
        const result = await registerForPushNotifications();
        
        if (!result.success) {
          alert(result.error || 'Failed to enable push notifications');
          setIsRegisteringPush(false);
          return;
        }

        setPushNotificationEnabled(true);
      } else {
        // Unregister from push notifications
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-text1">Loading...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-semibold text-text0 mb-4">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Email (read-only) */}
          <GlassCard>
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
          <GlassCard className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-text0">
                Change Email Address
              </h2>
              <p className="text-sm text-text1">
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

          {/* Weekly Check-in Time */}
          <GlassCard className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text0">
                Weekly Check-in Time (Optional)
              </label>
              <p className="text-sm text-text2">
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
                  className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-white/5 text-text0 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
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

          {/* Reminder Preferences */}
          <GlassCard className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-text0">
                Reminder Preferences
              </h2>
              <p className="text-sm text-text1">
                Reminders will be sent on your preferred check-in day at your preferred time
              </p>
            </div>

            <div className="space-y-4">
              {/* Email Reminders */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-text0">
                    Email reminders
                  </label>
                  <p className="text-xs text-text2">
                    Receive email reminders for weekly check-ins
                  </p>
                </div>
                <button
                  onClick={() => setEmailReminderEnabled(!emailReminderEnabled)}
                  role="switch"
                  aria-checked={emailReminderEnabled}
                  aria-label="Enable email reminders"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    emailReminderEnabled ? 'bg-white/20' : 'bg-white/5'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-text0 transition-transform ${
                      emailReminderEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* SMS Reminders */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-text0">
                      SMS reminders
                    </label>
                    <p className="text-xs text-text2">
                      Receive SMS reminders for weekly check-ins
                    </p>
                  </div>
                  <button
                    onClick={() => setSmsReminderEnabled(!smsReminderEnabled)}
                    role="switch"
                    aria-checked={smsReminderEnabled}
                    aria-label="Enable SMS reminders"
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      smsReminderEnabled ? 'bg-white/20' : 'bg-white/5'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-text0 transition-transform ${
                        smsReminderEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Phone Number Input */}
                {smsReminderEnabled && (
                  <div>
                    <label htmlFor="sms-phone" className="block text-sm font-medium text-text1 mb-2">
                      Phone Number
                    </label>
                    <input
                      id="sms-phone"
                      type="tel"
                      value={smsPhoneNumber}
                      onChange={(e) => setSmsPhoneNumber(e.target.value)}
                      placeholder="+1234567890"
                      className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-white/5 text-text0 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent placeholder:text-text2"
                    />
                    <p className="text-xs text-text2 mt-1">
                      Include country code (e.g., +1 for US)
                    </p>
                  </div>
                )}
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-text0">
                    Push notifications
                  </label>
                  <p className="text-xs text-text2">
                    {isPushSupported 
                      ? 'Receive push notifications for weekly check-ins'
                      : 'Push notifications are only available on mobile devices'}
                  </p>
                </div>
                <button
                  onClick={() => handlePushNotificationToggle(!pushNotificationEnabled)}
                  disabled={!isPushSupported || isRegisteringPush}
                  role="switch"
                  aria-checked={pushNotificationEnabled}
                  aria-label="Enable push notifications"
                  className={`relative inline-flex h-6 w-11 items-centers rounded-full transition-colors ${
                    pushNotificationEnabled ? 'bg-white/20' : 'bg-white/5'
                  } ${(!isPushSupported || isRegisteringPush) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-text0 transition-transform ${
                      pushNotificationEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Mid-Week Check Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-text0">
                    Mid-week check notifications
                  </label>
                  <p className="text-xs text-text2">
                    Receive notifications for optional mid-week checks
                  </p>
                </div>
                <button
                  onClick={() => setMidWeekCheckEnabled(!midWeekCheckEnabled)}
                  role="switch"
                  aria-checked={midWeekCheckEnabled}
                  aria-label="Enable mid-week check notifications"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    midWeekCheckEnabled ? 'bg-white/20' : 'bg-white/5'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-text0 transition-transform ${
                      midWeekCheckEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {(emailReminderEnabled || smsReminderEnabled || pushNotificationEnabled) && (!preferredDay || !preferredTime) && (
                <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-lg">
                  <p className="text-sm text-amber-300">
                    Please set your preferred check-in day and time above for reminders to work.
                  </p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Dark Mode */}
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-text0">
                  Dark Mode
                </h2>
                <p className="text-sm text-text1">
                  Switch between light and dark themes
                </p>
              </div>
              <button
                onClick={() => handleDarkModeToggle(!darkModeEnabled)}
                role="switch"
                aria-checked={darkModeEnabled}
                aria-label="Enable dark mode"
                className={`relative inline-flex h-6 w-11 items-centers rounded-full transition-colors ${
                  darkModeEnabled ? 'bg-white/20' : 'bg-white/5'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-text0 transition-transform ${
                    darkModeEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </GlassCard>

          {/* Save Button */}
          <PrimaryButton
            onClick={handleSavePreferences}
            disabled={saving}
            aria-label={saving ? 'Saving preferences' : 'Save preferences'}
            className="w-full"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </PrimaryButton>
        </div>

        {/* Actions */}
        <div className="pt-8 border-t border-cardBorder space-y-4">
          <Link href="/home" className="block">
            <PrimaryButton className="w-full">
              Return to Dashboard
            </PrimaryButton>
          </Link>
          
          <Link href="/checkin" className="block">
            <GhostButton className="w-full">
              Start Check-in
            </GhostButton>
          </Link>
          
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="block w-full px-6 py-3 text-text2 hover:text-text1 transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    </AppShell>
  );
}
