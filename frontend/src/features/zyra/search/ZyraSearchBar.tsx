"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { cx } from "@/lib/classNames";
import { NavIcon } from "@/components/ui/NavIcon";
import { useSearchStore, searchActions } from "@/stores/search/useSearchStore";
import { ZyraSearchResults } from "./ZyraSearchResults";

export interface ZyraSearchBarProps {
  className?: string;
}

export const ZyraSearchBar = ({ className }: ZyraSearchBarProps) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const { query, isOpen, loading, places, experiences, posts } =
    useSearchStore();
  const [localQuery, setLocalQuery] = useState(query);
  const [isFocused, setIsFocused] = useState(false);

  const hasResults =
    places.length > 0 || experiences.length > 0 || posts.length > 0;
  const showDropdown =
    isOpen && (hasResults || loading || localQuery.length >= 2);

  const handleSearch = useCallback((value: string) => {
    setLocalQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchActions.search(value);
    }, 300);
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    searchActions.setOpen(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setTimeout(() => {
      searchActions.setOpen(false);
    }, 200);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      searchActions.setOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleResultClick = (
    type: "place" | "experience" | "post",
    id: string
  ) => {
    searchActions.setOpen(false);
    setLocalQuery("");
    searchActions.clear();

    if (type === "place") {
      router.push(`/places/${id}`);
    } else if (type === "experience") {
      router.push(`/experiences/${id}`);
    } else {
      router.push(`/feed?post=${id}`);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        searchActions.setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cx("relative w-full", className)}>
      <div
        className={cx(
          "relative overflow-hidden rounded-[var(--radius-lg)] transition-all duration-300",
          isFocused
            ? "shadow-[0_0_0_1px_var(--zyra-border),0_0_20px_var(--zyra-glow)]"
            : "shadow-sm"
        )}
      >
        <div
          className={cx(
            "absolute inset-0 opacity-0 transition-opacity duration-300",
            isFocused && "opacity-100"
          )}
          style={{
            background:
              "linear-gradient(135deg, var(--zyra-gradient-start) 0%, var(--zyra-gradient-mid) 50%, var(--zyra-gradient-end) 100%)",
          }}
        />

        <div
          className={cx(
            "relative m-[1px] flex items-center gap-3 rounded-[calc(var(--radius-lg)-1px)] bg-surface px-4 py-3 transition-all duration-300",
            isFocused && "bg-white"
          )}
        >
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
            <div
              className="absolute inset-0 rounded-full opacity-80"
              style={{
                background:
                  "linear-gradient(135deg, var(--zyra-gradient-start), var(--zyra-gradient-end))",
              }}
            />
            <span className="relative text-sm font-bold text-white">Z</span>
          </div>

          <div className="flex flex-1 flex-col gap-0.5">
            <span
              className={cx(
                "text-[10px] font-semibold uppercase tracking-wider transition-colors duration-200",
                isFocused ? "text-zyra-text" : "text-subtle"
              )}
            >
              Chiedi a Zyra
            </span>
            <input
              ref={inputRef}
              type="text"
              value={localQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Cerca persone, luoghi, esperienze..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-subtle focus:outline-none"
              aria-label="Cerca su Syncro"
              aria-expanded={showDropdown}
              aria-haspopup="listbox"
            />
          </div>

          <div
            className={cx(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-200",
              isFocused
                ? "bg-gradient-to-r from-zyra-start to-zyra-end text-white"
                : "bg-surface-muted text-subtle"
            )}
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <NavIcon name="search" className="h-4 w-4" />
            )}
          </div>
        </div>
      </div>

      {showDropdown && (
        <ZyraSearchResults
          places={places}
          experiences={experiences}
          posts={posts}
          loading={loading}
          query={localQuery}
          onResultClick={handleResultClick}
        />
      )}
    </div>
  );
};
