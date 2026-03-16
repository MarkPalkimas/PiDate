'use client';

import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center mb-12"
    >
      <h1 className="text-6xl md:text-7xl font-bold mb-4 tracking-tight">
        Pidate
      </h1>
      <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
        Because π is infinite, every date appears somewhere inside it.
      </p>
    </motion.div>
  );
}
