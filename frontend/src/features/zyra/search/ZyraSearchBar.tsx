"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { cx } from "@/lib/classNames";
import { NavIcon } from "@/components/ui/NavIcon";
import { useSearchStore, searchActions } from "@/stores/search/useSearchStore";
import { ZyraSearchResults } from "./ZyraSearchResults";
import { ZyraMark } from "@/features/zyra/elements/ZyraMark";

export interface ZyraSearchBarProps {
  className?: string;
}

export const ZyraSearchBar = ({ className }: ZyraSearchBarProps) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const { query, isOpen, loading, places, users, posts } = useSearchStore();
  const [localQuery, setLocalQuery] = useState(query);
  const [isFocused, setIsFocused] = useState(false);

  const hasResults = places.length > 0 || users.length > 0 || posts.length > 0;
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
    type: "place" | "user" | "post",
    id: string
  ) => {
    searchActions.setOpen(false);
    setLocalQuery("");
    searchActions.clear();

    if (type === "place") {
      router.push(`/places/${id}`);
    } else if (type === "user") {
      router.push(`/profile/${id}`);
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
          "relative overflow-hidden rounded-[var(--radius-xl)] border transition-colors duration-200",
          isFocused
            ? "border-zyra-border/90 shadow-[0_0_0_1px_var(--zyra-border)]"
            : "border-border/70"
        )}
      >
        <div
          className={cx(
            "relative m-[1px] flex items-center gap-3 rounded-[calc(var(--radius-xl)-1px)] bg-surface px-4 py-3"
          )}
        >
          <ZyraMark size="sm" />

          <div className="flex flex-1 flex-col gap-0.5">
            <span
              className={cx(
                "text-[10px] font-semibold uppercase tracking-wider transition-colors duration-200",
                isFocused ? "text-zyra-text" : "text-subtle"
              )}
            >
              Zyra AI
            </span>
            <input
              ref={inputRef}
              type="text"
              value={localQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Chiedi a Zyra o cerca luoghi, persone o post..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-subtle focus:outline-none"
              aria-label="Chiedi a Zyra"
              aria-expanded={showDropdown}
              aria-haspopup="listbox"
            />
          </div>

          <div
            className={cx(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-200",
              isFocused
                ? "bg-accent text-white"
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
          users={users}
          posts={posts}
          loading={loading}
          query={localQuery}
          onResultClick={handleResultClick}
        />
      )}
    </div>
  );
};
