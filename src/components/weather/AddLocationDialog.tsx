import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, X, Loader } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import type { GeocodingResult } from "@/types/location";

interface AddLocationDialogProps {
  onAdd: (result: GeocodingResult) => void;
  onClose: () => void;
}

export function AddLocationDialog({ onAdd, onClose }: AddLocationDialogProps) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (query.trim().length < 2) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.searchLocations(query.trim(), i18n.language);
        setResults(res);
      } catch (e) {
        setError(t("dialog.searchFailed"));
      } finally {
        setLoading(false);
      }
    }, 320);
  }, [query]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >

      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />


      <motion.div
        className="relative glass-popover rounded-2xl w-full max-w-md mx-4 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >

        <div className="flex items-center gap-3 p-4 border-b border-white/[0.06]">
          <Search size={16} className="text-white/40 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("dialog.searchPlaceholder")}
            className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/30 outline-none"
          />
          {loading
            ? <Loader size={14} className="text-white/30 animate-spin shrink-0" />
            : query
            ? <button onClick={() => { setQuery(""); setResults([]); }} className="text-white/30 hover:text-white/60 transition-colors">
                <X size={14} />
              </button>
            : null
          }
        </div>


        <div className="max-h-72 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {error && (
              <motion.p
                key="error"
                className="px-4 py-3 text-[13px] text-red-400"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                {error}
              </motion.p>
            )}
            {!loading && query.trim().length >= 2 && results.length === 0 && !error && (
              <motion.p
                key="empty"
                className="px-4 py-6 text-[13px] text-white/30 text-center"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                {t("dialog.noResults", { query })}
              </motion.p>
            )}
            {results.map((r, i) => (
              <motion.button
                key={`${r.latitude}-${r.longitude}`}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.06] transition-colors"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => { onAdd(r); onClose(); }}
              >
                <MapPin size={14} className="text-white/30 shrink-0" />
                <div>
                  <p className="text-[14px] text-white/90">{r.name}</p>
                  <p className="text-[12px] text-white/40">
                    {r.admin1 ? `${r.admin1}, ` : ""}{r.country}
                  </p>
                </div>
                <div className="ml-auto text-[11px] text-white/20 font-mono">
                  {r.latitude.toFixed(2)}, {r.longitude.toFixed(2)}
                </div>
              </motion.button>
            ))}
          </AnimatePresence>

          {!query.trim() && (
            <p className="px-4 py-6 text-[13px] text-white/25 text-center">
              {t("dialog.typeToSearch")}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
