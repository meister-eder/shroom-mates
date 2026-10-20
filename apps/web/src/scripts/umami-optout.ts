/**
 * Opt-out on /datenschutz/: sets Umami's documented flag `umami.disabled` in
 * localStorage (user-initiated, so no consent is involved) and shows the state.
 */
const KEY = "umami.disabled";

const button = document.querySelector<HTMLButtonElement>("[data-umami-optout]");
const state = document.querySelector<HTMLElement>("[data-umami-optout-state]");

function isDisabled(): boolean {
  try {
    return Boolean(localStorage.getItem(KEY));
  } catch {
    return false;
  }
}

function render(): void {
  if (!button || !state) return;
  const off = isDisabled();
  button.textContent = off
    ? "Statistik für diesen Browser wieder aktivieren"
    : "Statistik für diesen Browser deaktivieren";
  state.textContent = off
    ? "Die Statistik ist für diesen Browser deaktiviert."
    : "Die Statistik ist für diesen Browser aktiv.";
}

button?.addEventListener("click", () => {
  try {
    if (isDisabled()) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, "1");
  } catch {
    // Storage blocked: nothing is stored, so nothing to opt out of.
  }
  render();
});
render();
