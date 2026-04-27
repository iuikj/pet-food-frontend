import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ErrorAlert({ error, onClose, className = '' }) {
    if (!error) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2 ${className}`}
            >
                <span className="material-icons-round text-lg flex-shrink-0">error</span>
                <span className="flex-1">{error}</span>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="material-icons-round text-lg flex-shrink-0 hover:opacity-70 transition-opacity"
                    >
                        close
                    </button>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
