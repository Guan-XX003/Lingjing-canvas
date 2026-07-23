# Canvas Bottom Dock Design QA

- Target: selected centered floating dock preview, graphite theme.
- Viewport checked: 1144 x 768 Electron window.
- Default state: passed. Dock is centered, compact, and clear of zoom/minimap controls.
- Tool state: passed. Tool categories expand upward with persistent active state.
- Resource state: passed. Resource picker renders above canvas nodes and dock chrome without clipping.
- Empty canvas: passed. The four quick-create actions remain, with the prompt renamed to "创建节点，展开你的想象".
- Interaction: passed. Direct node creation works; blank-canvas right click no longer opens creation UI.
- Responsive constraint: dock uses horizontal overflow below 920px and preserves side-control clearance.

Final result: passed
