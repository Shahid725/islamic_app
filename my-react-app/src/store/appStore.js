import { create } from 'zustand';

const useAppStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'light',
  sidebarOpen: false,

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
}));

export default useAppStore;
