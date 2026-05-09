'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as const,
      when: 'beforeChildren',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

const staggerContainer = {
  initial: {},
  enter: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeInUp = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="enter"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInUp({ children, className = '', delay = 0 }: PageTransitionProps & { delay?: number }) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="enter"
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated counter for statistics
export function AnimatedNumber({ 
  value, 
  duration = 1,
  className = '' 
}: { 
  value: number; 
  duration?: number;
  className?: string;
}) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key={value}
    >
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {value.toLocaleString()}
      </motion.span>
    </motion.span>
  );
}

// Hover scale effect wrapper
export function HoverScale({ 
  children, 
  scale = 1.02,
  className = '' 
}: { 
  children: ReactNode; 
  scale?: number;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Card with entrance animation
export function AnimatedCard({ 
  children, 
  index = 0,
  className = '' 
}: { 
  children: ReactNode; 
  index?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.1,
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1] as const
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Skeleton loading animation
export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`bg-muted rounded animate-pulse ${className}`}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        repeatType: 'reverse',
      }}
    />
  );
}

// Pulse effect for notifications/badges
export function PulseEffect({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Success checkmark animation
export function SuccessAnimation({ 
  show,
  size = 24,
  className = ''
}: { 
  show: boolean; 
  size?: number;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <motion.circle
            cx="12"
            cy="12"
            r="10"
            className="fill-green-500"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          />
          <motion.path
            d="M8 12l3 3 5-6"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          />
        </motion.svg>
      )}
    </AnimatePresence>
  );
}

// Ripple effect for buttons
export function RippleEffect({ 
  children,
  className = ''
}: { 
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileTap={{
        scale: 0.95,
        transition: { duration: 0.1 },
      }}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}
