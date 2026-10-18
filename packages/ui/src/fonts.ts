// Self-hosted fonts for both apps. The CSP only allows `font-src 'self'`,
// so fonts must not be loaded from Google Fonts. All faces use font-display: swap.
//
// Fraunces "full" = variable axes wght + opsz + SOFT + WONK (headlines use
// font-variation-settings: 'SOFT' 100, 'WONK' 1). Latin subset is only fetched
// when the page contains latin glyphs (unicode-range).
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/bricolage-grotesque/index.css";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";
