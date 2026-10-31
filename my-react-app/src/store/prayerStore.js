import { create } from 'zustand';
import { prayersApi } from '../api/services';

const usePrayerStore = create((set, get) => ({
  todayLog: null,
  monthlyStats: null,
  yearlyStats: null,
  selectedDate: new Date().toISOString().split('T')[0],

  setSelectedDate: (date) => set({ selectedDate: date }),

  fetchDayLog: async (date) => {
    try {
      const { data } = await prayersApi.getDayLog(date);
      set({ todayLog: data.data });
      return data.data;
    } catch (err) {
      console.error('Fetch day log error:', err);
    }
  },

  updatePrayer: async (date, prayer, status) => {
    try {
      const { data } = await prayersApi.updatePrayer(date, prayer, { status });
      set({ todayLog: data.data });
      return data.data;
    } catch (err) {
      console.error('Update prayer error:', err);
      throw err;
    }
  },

  fetchMonthlyStats: async (month, year) => {
    try {
      const { data } = await prayersApi.getMonthlyStats({ month, year });
      set({ monthlyStats: data.data });
      return data.data;
    } catch (err) {
      console.error('Monthly stats error:', err);
    }
  },

  fetchYearlyStats: async (year) => {
    try {
      const { data } = await prayersApi.getYearlyStats({ year });
      set({ yearlyStats: data.data });
      return data.data;
    } catch (err) {
      console.error('Yearly stats error:', err);
    }
  },
}));

export default usePrayerStore;
