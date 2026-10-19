import { atom } from "nanostores";

export interface AddedToast {
  /** Changes with every toast so the same product can trigger it twice */
  id: number;
  kind: "added" | "error";
  title: string;
}

export const $toast = atom<AddedToast | null>(null);

let counter = 0;

export function showAddedToast(title: string): void {
  $toast.set({ id: ++counter, kind: "added", title });
}

export function showErrorToast(title: string): void {
  $toast.set({ id: ++counter, kind: "error", title });
}

export function hideToast(): void {
  $toast.set(null);
}
