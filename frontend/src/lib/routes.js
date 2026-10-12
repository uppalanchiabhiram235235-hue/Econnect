import {
  Award, CalendarCheck, Compass, LayoutDashboard, ListChecks, PlusCircle, Trophy, User,
} from 'lucide-react';

export const homePathFor = (user) => {
  if (!user) return '/';
  return user.role === 'ORGANIZER' ? '/organizer' : '/dashboard';
};

/** Role-based navigation items (also used by the mobile bottom bar). */
export function navFor(user) {
  if (!user) {
    return [
      { to: '/', label: 'Home', icon: Compass, end: true },
      { to: '/events', label: 'Explore Events', icon: CalendarCheck },
      { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    ];
  }
  if (user.role === 'ORGANIZER') {
    return [
      { to: '/organizer', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/organizer/events/new', label: 'Create', icon: PlusCircle },
      { to: '/organizer/events', label: 'Manage', icon: ListChecks, end: true },
      { to: '/events', label: 'Discover', icon: Compass },
      { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
      { to: '/profile', label: 'Profile', icon: User },
    ];
  }
  return [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/events', label: 'Discover', icon: Compass },
    { to: '/my-events', label: 'My Events', icon: CalendarCheck },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/badges', label: 'Badges', icon: Award },
    { to: '/profile', label: 'Profile', icon: User },
  ];
}
