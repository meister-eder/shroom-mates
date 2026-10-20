// Live-Vorschau für Sveltia CMS: schickt den Entwurf an /vorschau/render/
// (rendert die echte Seitenkomponente, siehe src/pages/vorschau/render.ts) und
// zeigt das HTML in einem Iframe ohne Skripte. Lädt nach sveltia-cms.js
// (CSP: script-src 'self'), nutzt die globalen `CMS`, `h` und `createClass`.

const FILES = [
  "landing-page",
  "about-us-page",
  "growkits-page",
  "faq-page",
  "gastronomie-page",
  "tinkturen-page",
  "mushrooms-page",
];
const WIDTHS = { mobil: 390, desktop: 1280 };
const DEBOUNCE_MS = 400;

const toPlain = (value) =>
  value && typeof value.toJS === "function" ? value.toJS() : value;

function createPreview(file) {
  return createClass({
    getInitialState() {
      return {
        mode: "desktop",
        status: "Vorschau wird aktualisiert …",
        error: false,
        scale: 1,
      };
    },
    componentDidMount() {
      this.observer = new ResizeObserver(() => this.fit());
      if (this.box) this.observer.observe(this.box);
      this.schedule();
    },
    componentDidUpdate(prev) {
      if (prev.entry !== this.props.entry) this.schedule();
    },
    componentWillUnmount() {
      clearTimeout(this.timer);
      this.controller?.abort();
      this.observer?.disconnect();
    },
    fit() {
      if (!this.box) return;
      const scale = Math.min(1, this.box.clientWidth / WIDTHS[this.state.mode]);
      if (scale !== this.state.scale) this.setState({ scale });
    },
    schedule() {
      clearTimeout(this.timer);
      this.setState({ status: "Vorschau wird aktualisiert …", error: false });
      this.timer = setTimeout(() => this.load(), DEBOUNCE_MS);
    },
    async load() {
      this.controller?.abort();
      this.controller = new AbortController();
      const { entry } = this.props;
      const data = toPlain(entry.getIn ? entry.getIn(["data"]) : entry.data);
      try {
        const res = await fetch("/vorschau/render/", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Preview": "1" },
          body: JSON.stringify({ file, data }),
          signal: this.controller.signal,
        });
        if (!res.ok) {
          let message = "Vorschau nicht möglich.";
          try {
            message = (await res.json()).error || message;
          } catch {}
          this.setState({ status: message, error: true });
          return;
        }
        if (this.frame) this.frame.srcdoc = await res.text();
        this.setState({ status: "Vorschau aktuell.", error: false });
      } catch (err) {
        if (err.name === "AbortError") return;
        this.setState({
          status: "Vorschau konnte nicht geladen werden.",
          error: true,
        });
      }
    },
    setMode(mode) {
      this.setState({ mode }, () => this.fit());
    },
    render() {
      const { mode, status, error, scale } = this.state;
      const width = WIDTHS[mode];
      const height = Math.round(window.innerHeight * 0.8);
      const button = (key, label) =>
        h(
          "button",
          {
            type: "button",
            "aria-pressed": mode === key ? "true" : "false",
            onClick: () => this.setMode(key),
            style: {
              padding: "4px 12px",
              border: "1px solid #888",
              borderRadius: "999px",
              background: mode === key ? "#222" : "#fff",
              color: mode === key ? "#fff" : "#222",
              cursor: "pointer",
            },
          },
          label,
        );
      return h(
        "div",
        { style: { fontFamily: "sans-serif", padding: "8px" } },
        h(
          "div",
          {
            style: {
              display: "flex",
              gap: "8px",
              alignItems: "center",
              marginBottom: "8px",
            },
          },
          button("mobil", "Mobil (390 px)"),
          button("desktop", "Desktop (1280 px)"),
          h(
            "span",
            {
              role: "status",
              style: { color: error ? "#b00020" : "#555", fontSize: "13px" },
            },
            status,
          ),
        ),
        h(
          "div",
          {
            ref: (el) => {
              this.box = el;
            },
            style: {
              width: "100%",
              height: `${height * scale}px`,
              overflow: "hidden",
            },
          },
          h("iframe", {
            ref: (el) => {
              this.frame = el;
            },
            title: "Vorschau der Seite",
            sandbox: "allow-same-origin",
            style: {
              width: `${width}px`,
              height: `${height}px`,
              border: "1px solid #ccc",
              background: "#fff",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            },
          }),
        ),
      );
    },
  });
}

for (const file of FILES)
  CMS.registerPreviewTemplate(file, createPreview(file));
