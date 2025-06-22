// hooks/usePaginatedSupabase.ts
import { useEffect, useState, useRef, useCallback } from "react";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function usePaginatedSupabase<T>(
  table: string,
  pageSize = 20,
  filters: Record<string, any> = {},
  orderBy: string = "updated_at",
  orderDirection: "asc" | "desc" = "desc"
) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const fetchData = async (currentPage: number) => {
    const from = currentPage * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from(table)
      .select("*")
      .order(orderBy, { ascending: orderDirection === "asc" })
      .range(from, to);

    for (const [key, value] of Object.entries(filters)) {
      if (value !== null && value !== undefined) {
        query = query.eq(key, value);
      }
    }

    const { data: newData, error }: PostgrestSingleResponse<T[]> = await query;

    if (error) {
      console.error("Supabase pagination error:", error);
      return;
    }

    setData((prev) => [...prev, ...(newData ?? [])]);
    if ((newData?.length ?? 0) < pageSize) setHasMore(false);
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore]);

  useEffect(() => {
    const option = { root: null, rootMargin: "20px", threshold: 0 };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  return { data, loaderRef, hasMore };
}
