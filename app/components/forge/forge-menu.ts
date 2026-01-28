import {
  LayoutDashboard,
  Palette,
  Megaphone,
  Factory,
  Wallet,
  Settings,
  Zap,
  Box,
  TrendingUp,
  Scale,
  Gavel,
  User,
} from 'lucide-react';

export const FORGE_MENU = [
  {
    section: 'OVERVIEW',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/forge/[id]', tourId: 'menu-dashboard' },
    ],
  },
  {
    section: 'BUILD',
    items: [
      { icon: Palette, label: 'Brand DNA', href: '/forge/[id]/brand', tourId: 'menu-brand' },
    ],
  },
  {
    section: 'LEGAL',
    items: [
      { icon: Scale, label: 'Documents', href: '/forge/[id]/legal', tourId: 'menu-legal' },
    ],
  },
  {
    section: 'MARKETING',
    items: [
      { icon: Megaphone, label: 'Campaigns', href: '/forge/[id]/marketing', tourId: 'menu-marketing' },
      { icon: User, label: 'AI Avatar', href: '/forge/[id]/marketing/faceswap', tourId: 'menu-faceswap' },
    ],
  },
  {
    section: 'SOURCING',
    items: [
      { icon: Factory, label: 'Suppliers', href: '/forge/[id]/sourcing', tourId: 'menu-suppliers' },
      { icon: Box, label: 'Samples', href: '/forge/[id]/sourcing?tab=samples', tourId: 'menu-samples' },
      { icon: TrendingUp, label: 'Orders', href: '/forge/[id]/sourcing?tab=orders', tourId: 'menu-orders' },
    ],
  },
  {
    section: 'ADMIN',
    items: [
      { icon: Gavel, label: 'Abstimmungen', href: '/forge/[id]/decisions', tourId: 'menu-decisions' },
      { icon: Wallet, label: 'Budget', href: '/forge/[id]/admin', tourId: 'menu-budget' },
      { icon: Settings, label: 'Settings', href: '/forge/[id]/settings', tourId: 'menu-settings' },
    ],
  },
] as const;
