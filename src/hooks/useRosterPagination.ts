import { useEffect, useMemo, useReducer, useRef } from "react";

type State = {
  query: string;
  page: number;
};

type Action =
  | { type: "set_query"; query: string }
  | { type: "set_page"; page: number | ((prev: number) => number) };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "set_query":
      return { ...state, query: action.query };
    case "set_page": {
      const nextPage =
        typeof action.page === "function" ? action.page(state.page) : action.page;
      return { ...state, page: nextPage };
    }
    default:
      return state;
  }
}

export function useRosterPagination<T extends { student?: { fullName?: string; email?: string }; section?: { id?: number } }>(
  rosterRows: T[],
  enrollSectionId: number | null,
  pageSize = 10,
) {
  const [state, dispatch] = useReducer(reducer, { query: "", page: 1 });
  const filterKeyRef = useRef<string>("");

  useEffect(() => {
    const key = `${enrollSectionId ?? "all"}|${state.query.trim().toLowerCase()}`;
    if (filterKeyRef.current !== key) {
      filterKeyRef.current = key;
      dispatch({ type: "set_page", page: 1 });
    }
  }, [enrollSectionId, state.query]);

  const filteredRows = useMemo(() => {
    return rosterRows.filter((row) => {
      const matchesSection = enrollSectionId ? row.section?.id === enrollSectionId : true;
      if (!matchesSection) return false;
      const q = state.query.trim().toLowerCase();
      if (!q) return true;
      const name = String(row.student?.fullName || "").toLowerCase();
      const email = String(row.student?.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [rosterRows, enrollSectionId, state.query]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(state.page, totalPages);
  const pagedRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return {
    rosterQuery: state.query,
    setRosterQuery: (value: string) => dispatch({ type: "set_query", query: value }),
    rosterPage: state.page,
    setRosterPage: (page: number | ((prev: number) => number)) =>
      dispatch({ type: "set_page", page }),
    filteredRosterRows: filteredRows,
    pagedRosterRows: pagedRows,
    rosterPageSize: pageSize,
    rosterTotalPages: totalPages,
    safeRosterPage: safePage,
  };
}
