import { HeartHandshake, Megaphone, Recycle, Sparkles, Trash2, TreePine, Waves } from 'lucide-react';

export const EVENT_TYPES = {
  COMMUNITY_CLEANUP: { label: 'Community Cleanup', icon: Trash2, hue: 'var(--type-cleanup)' },
  BEACH_CLEANUP: { label: 'Beach Cleanup', icon: Waves, hue: 'var(--type-beach)' },
  TREE_PLANTING: { label: 'Tree Planting', icon: TreePine, hue: 'var(--type-tree)' },
  WASTE_COLLECTION: { label: 'Waste Collection', icon: Recycle, hue: 'var(--type-waste)' },
  ENVIRONMENTAL_CAMPAIGN: { label: 'Environmental Campaign', icon: Megaphone, hue: 'var(--type-campaign)' },
  SOCIAL_CAUSE: { label: 'Social Cause', icon: HeartHandshake, hue: 'var(--type-social)' },
  OTHER: { label: 'Other', icon: Sparkles, hue: 'var(--type-other)' },
};

export const EVENT_STATUS_TONE = {
  UPCOMING: 'info',
  ONGOING: 'success',
  COMPLETED: 'eco',
  CANCELLED: 'danger',
};

export const VERIFICATION_TONE = { PENDING: 'warning', VERIFIED: 'success', REJECTED: 'danger' };

export const eventTypeOptions = Object.entries(EVENT_TYPES).map(([value, m]) => ({ value, label: m.label }));
export const titleCase = (s = '') => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');
