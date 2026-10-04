import api from './api';

export const reminderService = {
  async createReminder(reminderData) {
    const response = await api.post('/reminders', reminderData);
    return response.data;
  },

  async getMyReminders() {
    const response = await api.get('/reminders');
    return response.data;
  },

  async deleteReminder(reminderId) {
    const response = await api.delete(`/reminders/${reminderId}`);
    return response.data;
  },

  async updateReminder(reminderId, reminderData) {
    const response = await api.put(`/reminders/${reminderId}`, reminderData);
    return response.data;
  }
};
