import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const bundle = read("../src/renderer/bundle/index.js");
const backup = read("../src/renderer/lib/backup.ts");
const stripPortable = read("../src/renderer/hooks/use_stripLargeProjectMediaPortablePayload.ts");
const forceRehome = read("../src/renderer/hooks/use_forceRehomeProjectDataFileReferences.ts");
const saveCanvas = read("../src/renderer/hooks/useSaveCanvasState.ts");
const source = [bundle, backup, stripPortable, forceRehome, saveCanvas].join("\n");

// File-backed media classification and portable payload stripping.
assert.match(backup, /isProjectMediaFileBackedBinding/);
assert.match(backup, /kind === `image`/);
assert.match(backup, /bindingKind === `imageUrl`/);
assert.match(stripPortable, /portableDataRef/);
assert.match(stripPortable, /valueFormat: `file-url`/);
assert.match(stripPortable, /buildProjectMediaFileUrl\(binding\.localPath\)/);

// Existing file:// references must be archived during a forced migration.
assert.match(forceRehome, /forceArchiveExistingFile: true/);
assert.match(forceRehome, /key === `projectAssetBindings`/);
assert.match(bundle, /options\.forceRehomeExistingFiles/);
assert.match(bundle, /forceRehomeProjectDataFileReferences/);

// Missing-media prompts remain restricted to external/user media bindings.
assert.match(bundle, /shouldPromptProjectMediaRelink/);
assert.match(bundle, /isProjectMediaFileBackedBinding/);
assert.match(bundle, /isExternalUploadedProjectAssetBinding/);

// Canvas persistence must respect migration locks and synchronize references.
assert.match(saveCanvas, /main-process migration lock/);
assert.match(saveCanvas, /migration started during persistence/);
assert.match(saveCanvas, /syncProjectReferences/);
assert.match(saveCanvas, /collectProjectFileReferences/);

// Transactional migration guards that have not yet moved out of the bundle.
assert.match(bundle, /saveProjectMigrationSnapshot/);
assert.match(bundle, /recoverInterruptedProjectMigrations/);
assert.match(bundle, /requireGlobalBlobs: true/);
assert.match(bundle, /cancelForcedArchiveMigration/);
assert.match(bundle, /getForcedArchiveMigrationStatus/);
assert.match(bundle, /storageOptimizationEnabled/);
assert.match(bundle, /rebuildStorageReferenceIndex/);

// Removed legacy migration/global bridges must not return.
assert.doesNotMatch(source, /migration-snapshot-v1-/);
assert.doesNotMatch(source, /globalThis\.readProjectCanvasStorageState/);
assert.doesNotMatch(source, /globalThis\.writeProjectCanvasStorageState/);

console.log("storage state policy guards passed");
