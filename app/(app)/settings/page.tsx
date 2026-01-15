'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [preferredDay, setPreferredDay] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [emailReminderEnabled, setEmailReminderEnabled] = useState(true);
  const [smsReminderEnabled, setSmsReminderEnabled] = useState(false);
  const [smsPhoneNumber, setSmsPhoneNumber] = useState('');
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
  const [showSetupPrompt, setShowSetupPrompt] = useState(false);

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

      // Check if user came from password setup flow
      const setupParam = searchParams.get('setup');
      if (setupParam === 'password') {
        setShowSetupPrompt(true);
      }

      // Load user preferences - try with has_password first, fallback without it
      let data: any = null;
      let error: any = null;
      
      const { data: dataWithPassword, error: errorWithPassword } = await supabase
        .from('users')
        .select('preferred_checkin_day, preferred_checkin_time, email_reminder_enabled, sms_reminder_enabled, sms_phone_number, push_notification_enabled, reminder_enabled, auto_advance_enabled, has_password')
        .eq('id', user.id)
        .single();

      // If has_password column doesn't exist (migration not run), try without it
      if (errorWithPassword && errorWithPassword.message?.includes('column')) {
        console.log('has_password column not found, loading without it');
        const { data: dataWithoutPassword, error: errorWithoutPassword } = await supabase
          .from('users')
          .select('preferred_checkin_day, preferred_checkin_time, email_reminder_enabled, sms_reminder_enabled, sms_phone_number, push_notification_enabled, reminder_enabled, auto_advance_enabled')
          .eq('id', user.id)
          .single();
        data = dataWithoutPassword;
        error = errorWithoutPassword;
      } else {
        data = dataWithPassword;
        error = errorWithPassword;
      }

      if (!error && data) {
        setPreferredDay(data.preferred_checkin_day || '');
        setPreferredTime(data.preferred_checkin_time || '');
        setEmailReminderEnabled(data.email_reminder_enabled ?? (data.reminder_enabled ?? true));
        setSmsReminderEnabled(data.sms_reminder_enabled ?? false);
        setSmsPhoneNumber(data.sms_phone_number || '');
        setPushNotificationEnabled(data.push_notification_enabled ?? false);
        setAutoAdvanceEnabled(data.auto_advance_enabled ?? true);
        setHasPassword(data.has_password ?? false);
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
          autoAdvanceEnabled,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.details ? `${errorData.error}: ${errorData.details}` : (errorData.error || 'Failed to save preferences');
        throw new Error(errorMsg);
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

      // Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      // Mark that user has password in our database (if column exists)
      const { error: dbError } = await supabase
        .from('users')
        .update({ has_password: true })
        .eq('id', user.id);

      // Ignore error if column doesn't exist (migration not run)
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
      setShowSetupPrompt(false);
      
      // Remove setup parameter from URL
      if (searchParams.get('setup')) {
        router.replace('/settings');
      }
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

          {/* Password Management Section */}
          <GlassCard className="space-y-4">
            {showSetupPrompt && !hasPassword && (
              <div className="p-4 bg-emerald-400/10 border border-emerald-400/30 rounded-lg mb-4">
                <p className="text-sm text-emerald-300 font-medium">
                  🎉 Welcome! Set up a password below for faster sign-ins next time.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-text0">
                {hasPassword ? 'Change Password' : 'Set Up Password'}
              </h2>
              <p className="text-sm text-text1">
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
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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

              {(emailReminderEnabled || smsReminderEnabled || pushNotificationEnabled) && (!preferredDay || !preferredTime) && (
                <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-lg">
                  <p className="text-sm text-amber-300">
                    Please set your preferred check-in day and time above for reminders to work.
                  </p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Auto-advance during check-in */}
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-text0">
                  Auto-advance Questions
                </h2>
                <p className="text-sm text-text1">
                  Automatically move to next question after answering
                </p>
              </div>
              <button
                onClick={() => setAutoAdvanceEnabled(!autoAdvanceEnabled)}
                role="switch"
                aria-checked={autoAdvanceEnabled}
                aria-label="Enable auto-advance"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoAdvanceEnabled ? 'bg-white/20' : 'bg-white/5'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-text0 transition-transform ${
                    autoAdvanceEnabled ? 'translate-x-6' : 'translate-x-1'
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
