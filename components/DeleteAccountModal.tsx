'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import GlassCard from '@/components/GlassCard';
import PrimaryButton from '@/components/PrimaryButton';
import GhostButton from '@/components/GhostButton';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (gracePeriod: boolean) => Promise<void>;
}

export default function DeleteAccountModal({ isOpen, onClose, onConfirm }: DeleteAccountModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const [step, setStep] = useState<1 | 2>(1);
  const [gracePeriod, setGracePeriod] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    if (!isDeleting) {
      setStep(1);
      setGracePeriod(true);
      onClose();
    }
  };

  const handleContinue = () => {
    setStep(2);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(gracePeriod);
      handleClose();
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          className="relative w-full max-w-md"
        >
          <GlassCard padding="lg">
            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-text0">
                  {step === 1 ? 'Delete Account' : 'Final Confirmation'}
                </h2>
                <p className="text-sm text-text2">
                  {step === 1 
                    ? 'Choose how you want to delete your account'
                    : 'This action cannot be undone'}
                </p>
              </div>

              {step === 1 ? (
                <>
                  {/* Step 1: Choose deletion type */}
                  <div className="space-y-4">
                    {/* Grace Period Option */}
                    <button
                      onClick={() => setGracePeriod(true)}
                      className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                        gracePeriod
                          ? 'border-black/30 dark:border-white/30 bg-black/10 dark:bg-white/10'
                          : 'border-cardBorder bg-black/5 dark:bg-white/5 hover:border-black/20 dark:hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          gracePeriod ? 'border-text0' : 'border-cardBorder'
                        }`}>
                          {gracePeriod && (
                            <div className="w-2 h-2 rounded-full bg-text0" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-text0">
                            Delete in 30 days (Recommended)
                          </p>
                          <p className="text-xs text-text2">
                            Your account will be scheduled for deletion. You can cancel anytime within 30 days.
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Immediate Deletion Option */}
                    <button
                      onClick={() => setGracePeriod(false)}
                      className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                        !gracePeriod
                          ? 'border-red-400/30 bg-red-400/10'
                          : 'border-cardBorder bg-black/5 dark:bg-white/5 hover:border-black/20 dark:hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          !gracePeriod ? 'border-red-400' : 'border-cardBorder'
                        }`}>
                          {!gracePeriod && (
                            <div className="w-2 h-2 rounded-full bg-red-400" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-text0">
                            Delete immediately
                          </p>
                          <p className="text-xs text-text2">
                            Your account and all data will be permanently deleted right away.
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Warning */}
                  <div className="p-4 bg-amber-400/10 border border-amber-400/30 rounded-lg">
                    <p className="text-sm text-amber-300">
                      ⚠️ {gracePeriod 
                        ? 'You will receive a confirmation email with cancellation instructions.'
                        : 'This will permanently delete all your check-ins, scores, and reflection notes.'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <GhostButton
                      onClick={handleClose}
                      className="flex-1"
                    >
                      Cancel
                    </GhostButton>
                    <PrimaryButton
                      onClick={handleContinue}
                      className="flex-1 bg-red-500/20 hover:bg-red-500/30 border-red-400/30"
                    >
                      Continue
                    </PrimaryButton>
                  </div>
                </>
              ) : (
                <>
                  {/* Step 2: Final confirmation */}
                  <div className="space-y-4">
                    <div className="p-4 bg-red-400/10 border border-red-400/30 rounded-lg">
                      <p className="text-sm text-red-300 font-medium mb-2">
                        Are you absolutely sure?
                      </p>
                      <p className="text-xs text-text2">
                        {gracePeriod 
                          ? 'Your account will be scheduled for deletion in 30 days. You will receive a confirmation email.'
                          : 'This will immediately and permanently delete your account and all associated data. This action cannot be undone.'}
                      </p>
                    </div>

                    {!gracePeriod && (
                      <div className="p-4 bg-black/5 dark:bg-white/5 border border-cardBorder rounded-lg">
                        <p className="text-xs text-text2">
                          The following will be permanently deleted:
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-text2">
                          <li>• All check-ins and scores</li>
                          <li>• All reflection notes</li>
                          <li>• Account preferences</li>
                          <li>• Streak data and milestones</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <GhostButton
                      onClick={() => setStep(1)}
                      disabled={isDeleting}
                      className="flex-1"
                    >
                      Back
                    </GhostButton>
                    <button
                      onClick={handleConfirmDelete}
                      disabled={isDeleting}
                      className="flex-1 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-300 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
