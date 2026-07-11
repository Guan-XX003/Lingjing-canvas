# WanJuan Development Guide

The canonical development source is this repository. Before changing code, read the
architecture mirror and the development workflow:

1. Run `npm run arch:status` and inspect the relevant perspective with
   `omm tree <perspective>` or `omm show <path>`.
2. Read [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md).
3. Make and test source changes with isolated development data.
4. Update `.omm/` after architecture, module ownership, request flow, storage, or
   integration boundaries change.
5. Run `npm run arch:validate` before formal App synchronization or cloud push.

Do not modify formal user data during source testing. Follow this release order:
source change, isolated tests, formal App backup and smoke test, cloud push, release.

