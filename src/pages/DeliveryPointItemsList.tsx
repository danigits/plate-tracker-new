import React, { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 20;

export default function DeliveryPointItemsList() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);

  const fetchItems = async (currentPage: number) => {
    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("delivery_point_plan_items")
      .select("*")
      .range(from, to)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching data:", error);
      return;
    }

    setItems((prev) => [...prev, ...data]);
    if (data.length < PAGE_SIZE) setHasMore(false);
  };

  useEffect(() => {
    fetchItems(page);
  }, [page]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore) {
        setPage((prev) => prev + 1);
      }
    },
    [hasMore]
  );

  useEffect(() => {
    const option = { root: null, rootMargin: "20px", threshold: 0 };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="p-4 border rounded shadow">
          <p>Item ID: {item.id}</p>
          <p>Plates: {item.number_of_plates}</p>
          <p>Status: {item.status}</p>
        </div>
      ))}
      {hasMore && (
        <div ref={loaderRef} className="h-12 text-center">
          Loading...
        </div>
      )}
    </div>
  );
}
