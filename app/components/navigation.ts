import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  MessageSquare,
  MessageCircle,
  Users,
  CheckSquare,
  PieChart,
  BookOpen,
  Rocket,
  Image as ImageIcon,
} from 'lucide-react';

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  status?: 'WIP';
};

export const navigation: NavItem[] = [
  { name: 'Cockpit', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Ventures', href: '/ventures', icon: Rocket },
  { name: 'Media', href: '/media', icon: ImageIcon },
  { name: 'Forum', href: '/forum', icon: MessageSquare },
  { name: 'Messages', href: '/messages', icon: MessageCircle },
  { name: 'Squad Markt', href: '/squads', icon: Users },
  { name: 'Mission Control', href: '/tasks', icon: CheckSquare },
  { name: 'Finanzen', href: '/transparency', icon: PieChart, status: 'WIP' },
  { name: 'Academy', href: '/resources', icon: BookOpen, status: 'WIP' },
];
