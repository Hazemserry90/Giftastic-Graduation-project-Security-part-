import { formatEntityDate } from '../shared/date.js';

export const formatReminderDate = (value) => value
  ? formatEntityDate(value, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  : null;

export const isActiveReminder = (reminder) => reminder?.processed === false;
