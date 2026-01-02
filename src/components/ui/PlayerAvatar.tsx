"use client";

import { motion } from 'framer-motion';

interface PlayerAvatarProps {
  avatar: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PlayerAvatar({ avatar, name, size = 'md', className = '' }: PlayerAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl'
  };

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.5, ease: 'backOut' }}
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold ${className}`}
      title={name}
    >
      {avatar}
    </motion.div>
  );
}
