# Content-first navigation

UI-only change based on d00ec52. Six sections: Inicio, Estudio de contenido, Marcas, Calendario, Oficina y equipo, Conexiones y ajustes. Legacy menu and its views remain in source, hidden/inert and not routable from this boot. No backend integration or external actions were enabled.

Brand selection is page-local and synchronizes with the optional internal video panel. Changing brand requires confirmation before discarding an unsaved draft, refuses while a mutation is pending, clears old job cards and import consent. It does not connect or alter social accounts. Existing workflow remains opt-in.

Verification:
- 22/22 focused tests passed: test.mjs, navigation.test.mjs, video-http.test.mjs, material-import.test.mjs, packaging.test.mjs.
- Additional jsdom26.1 DOM exercise passed all six routes, aria-current, unique visible view, legacy fallback, two-way brand selection, draft cancellation/acceptance, closing chat on route change, zero mutation calls from navigation.
- Independent review:15/15 navigation, server and packaging tests plus DOM cross-check.
- Chromium visual QA could not run in the environment (process_singleton/crashpad startup failure). Responsive CSS reviewed but not screenshot-verified. This is not a production/video generation acceptance test.

Before enabling a real runner, connect the global status display to live capabilities; current disconnected labels match this shell deployment. Office animation remains ambient, not evidence of agents running.
