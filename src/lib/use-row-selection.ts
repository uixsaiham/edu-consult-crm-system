"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Checkbox selection for a table, with Shift-click range select.
 *
 * `visibleIds` are the row ids in the order currently shown (after filters,
 * sorting and paging). Shift-clicking a row applies that row's new state to
 * every row between it and the last row clicked, so a range can be selected
 * or cleared in one go.
 */
export function useRowSelection(visibleIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const anchor = useRef<string | null>(null);

  const toggle = useCallback(
    (id: string, shiftKey = false) => {
      const turnOn = !selected.has(id);
      const from = anchor.current ? visibleIds.indexOf(anchor.current) : -1;
      const to = visibleIds.indexOf(id);
      const range =
        shiftKey && from !== -1 && to !== -1
          ? visibleIds.slice(Math.min(from, to), Math.max(from, to) + 1)
          : [id];
      setSelected((prev) => {
        const next = new Set(prev);
        range.forEach((r) => (turnOn ? next.add(r) : next.delete(r)));
        return next;
      });
      anchor.current = id;
    },
    [selected, visibleIds]
  );

  const visibleSelected = visibleIds.filter((id) => selected.has(id)).length;
  const allVisible = visibleIds.length > 0 && visibleSelected === visibleIds.length;

  const toggleAllVisible = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => (allVisible ? next.delete(id) : next.add(id)));
      return next;
    });
    anchor.current = null;
  }, [visibleIds, allVisible]);

  const clear = useCallback(() => {
    setSelected(new Set());
    anchor.current = null;
  }, []);

  /** Drop ids that no longer exist, e.g. after deleting rows. */
  const retain = useCallback((ids: Iterable<string>) => {
    const keep = new Set(ids);
    setSelected((prev) => new Set([...prev].filter((id) => keep.has(id))));
  }, []);

  return {
    selected,
    count: selected.size,
    isSelected: (id: string) => selected.has(id),
    toggle,
    toggleAllVisible,
    clear,
    retain,
    /** Header checkbox state for the rows currently shown. */
    headerState: allVisible ? "all" : visibleSelected > 0 ? "some" : "none",
  } as const;
}

export type RowSelection = ReturnType<typeof useRowSelection>;
