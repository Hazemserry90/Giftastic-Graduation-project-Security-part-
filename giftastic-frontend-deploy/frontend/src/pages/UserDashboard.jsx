import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuthStore } from '../store/useAuthStore';
import { reminderService } from '../services/reminderService';
import { getFriendlyErrorMessage } from '../services/api';
import {
  buildReminderAccess,
  buildReminderActions,
  isActiveReminder,
  ReminderSummary,
} from '../ui/entities/reminder';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { createReminderDraft, mapReminderPayload } from '../ui/commands/reminder';

const MAX_REMINDERS = 8;

export default function UserDashboard() {
  const user = useAuthStore((state) => state.user);
  const viewer = useAuthStore((state) => state.viewer);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reminderDraft, setReminderDraft] = useState(() => createReminderDraft());
  const [editingReminderId, setEditingReminderId] = useState(null);
  const [reminderSaving, setReminderSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const remindersData = await reminderService.getMyReminders();
      setReminders((remindersData || [])
        .map((reminder) => adaptEntityFromNamedSource('adaptReminderDomain', reminder))
        .filter((reminder) =>
          buildReminderAccess({ reminder, viewer }).canRead
          && isActiveReminder(reminder)));
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not load your reminders. Please refresh and try again.'), { id: 'reminders-load' });
    } finally {
      setLoading(false);
    }
  };

  const createReminder = async (event) => {
    event.preventDefault();
    if (!editingReminderId && reminders.length >= MAX_REMINDERS) {
      toast.error(`You can have up to ${MAX_REMINDERS} active reminders.`);
      return;
    }
    const mapped = mapReminderPayload(reminderDraft);
    if (!mapped.ok) {
      toast.error(Object.values(mapped.errors)[0]);
      return;
    }
    setReminderSaving(true);
    try {
      const saved = editingReminderId
        ? await reminderService.updateReminder(editingReminderId, mapped.payload)
        : await reminderService.createReminder(mapped.payload);
      const model = adaptEntityFromNamedSource('adaptReminderDomain', saved);
      setReminders((current) => editingReminderId
        ? current.map((item) => item.id === editingReminderId ? model : item)
        : [model, ...current]);
      setEditingReminderId(null);
      setReminderDraft(createReminderDraft());
      toast.success(editingReminderId ? 'Reminder updated' : 'Reminder created');
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not save this reminder. Please check the details and try again.'));
    } finally {
      setReminderSaving(false);
    }
  };

  const editReminder = (reminder) => {
    setEditingReminderId(reminder.id);
    setReminderDraft(createReminderDraft({
      description: reminder.description || '',
      scheduledAt: reminder.scheduledAt ? String(reminder.scheduledAt).slice(0, 16) : '',
    }));
  };

  const cancelEdit = () => {
    setEditingReminderId(null);
    setReminderDraft(createReminderDraft());
  };

  const deleteReminder = async (reminder) => {
    setReminderSaving(true);
    try {
      await reminderService.deleteReminder(reminder.id);
      setReminders((current) => current.filter((item) => item.id !== reminder.id));
      if (editingReminderId === reminder.id) cancelEdit();
      toast.success('Reminder deleted');
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not delete this reminder. Please try again.'));
    } finally {
      setReminderSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 flex-grow w-full">
        <section className="mb-16">
          <h1 className="font-display-xl text-display-xl text-primary mb-2">
            Welcome back, {user?.fullName}
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Manage personal reminders that notify you at the scheduled server time.
          </p>
        </section>

        <div className="mx-auto max-w-5xl">
          {/* Reminders Section */}
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-lg text-headline-lg text-primary flex items-center gap-2">
                Active Reminders 
                <span className="material-symbols-outlined text-tertiary-container fill">notifications_active</span>
              </h2>
              <span className="font-label-md text-label-md text-on-secondary-container bg-secondary-container px-4 py-1 rounded-full">
                {reminders.length} / {MAX_REMINDERS}
              </span>
            </div>

            <form onSubmit={createReminder} className="grid gap-3 rounded-xl border border-outline-variant bg-white p-4 md:grid-cols-[1fr_220px_auto]">
              <input
                aria-label="Reminder description"
                value={reminderDraft.description}
                onChange={(event) => setReminderDraft((current) => ({ ...current, description: event.target.value }))}
                placeholder="What should we remind you about?"
                required
                className="rounded-lg border border-outline-variant px-3 py-2"
              />
              <input
                aria-label="Reminder date and time"
                type="datetime-local"
                value={reminderDraft.scheduledAt}
                onChange={(event) => setReminderDraft((current) => ({ ...current, scheduledAt: event.target.value }))}
                required
                className="rounded-lg border border-outline-variant px-3 py-2"
              />
              <button type="submit" disabled={reminderSaving || (!editingReminderId && reminders.length >= MAX_REMINDERS)} className="rounded-lg bg-primary px-4 py-2 font-bold text-white disabled:opacity-50">
                {editingReminderId ? 'Save' : 'Add'}
              </button>
              {editingReminderId && (
                <button type="button" onClick={cancelEdit} className="rounded-lg border border-outline-variant px-4 py-2 font-bold text-primary md:col-start-3">
                  Cancel
                </button>
              )}
            </form>
            {reminders.length >= MAX_REMINDERS && !editingReminderId && (
              <p className="text-sm font-semibold text-secondary">You have reached the maximum of {MAX_REMINDERS} active reminders.</p>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reminders.map((reminder) => (
                  <ReminderSummary
                    key={reminder.id}
                    reminder={reminder}
                      access={buildReminderAccess({ reminder, viewer })}
                      actions={buildReminderActions({
                        reminder,
                        access: buildReminderAccess({ reminder, viewer }),
                        handlers: {
                          edit: () => editReminder(reminder),
                          delete: () => deleteReminder(reminder),
                        },
                      })}
                    actionLoading={reminderSaving}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
