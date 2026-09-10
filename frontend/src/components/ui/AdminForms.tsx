"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "@phosphor-icons/react";

interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function AdminInput({ label, className = "", ...props }: AdminInputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50 pl-2">
        {label}
      </label>
      <input
        className={`w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all duration-300 ease-fluid shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ${className}`}
        {...props}
      />
    </div>
  );
}

interface AdminTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export function AdminTextarea({ label, className = "", ...props }: AdminTextareaProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full h-full">
      <label className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50 pl-2">
        {label}
      </label>
      <textarea
        className={`w-full flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all duration-300 ease-fluid shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] resize-none min-h-[120px] ${className}`}
        {...props}
      />
    </div>
  );
}

interface TagInputProps {
  label: string;
  tags: string[];
  setTags: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ label, tags, setTags, placeholder }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        setTags([...tags, inputValue.trim()]);
      }
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50 pl-2">
        {label}
      </label>
      <div className="w-full min-h-[46px] bg-black/40 border border-white/10 rounded-xl p-1.5 flex flex-wrap gap-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] focus-within:border-white/30 focus-within:bg-white/5 transition-all duration-300 ease-fluid">
        <AnimatePresence>
          {tags.map((tag) => (
            <motion.div
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1.5 bg-white/10 text-white px-3 py-1 rounded-lg text-sm border border-white/5"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X size={12} weight="bold" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-white placeholder-white/20 px-2 py-1"
        />
      </div>
    </div>
  );
}
