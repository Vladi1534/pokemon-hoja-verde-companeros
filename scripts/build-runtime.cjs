const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {build} = require('esbuild');

const root = path.resolve(__dirname, '..');
const assetDir = path.join(root, 'assets/characters');
const metadata = JSON.parse(fs.readFileSync(path.join(assetDir, 'renderer-metadata.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(assetDir, 'manifest.json'), 'utf8'));
const sources = Object.fromEntries([...manifest.leaders, ...manifest.animeOptional].map(asset => [asset.key, asset.path]));
const people = {};
const frames = {};
for (const [id, data] of Object.entries(metadata)) {
  people[id] = 'data:image/png;base64,' + fs.readFileSync(path.join(assetDir, sources[id])).toString('base64');
  if (data.layout === 'vertical') frames[id] = data.framePivots.map(pivot => pivot.y);
}
fs.writeFileSync(path.join(root, 'character-data.js'),
  'Object.assign(ASSETS.people,' + JSON.stringify(people) + ');\n\n' +
  'const CHARACTER_FRAMES=' + JSON.stringify(frames) + ';\n');

// Both runtimes must use exactly the same generated campaign geometry.
const world = vm.runInNewContext(fs.readFileSync(path.join(root, 'coop-world.js'), 'utf8') + '\nCOOP_WORLD');
fs.writeFileSync(path.join(root, 'online-server/server/world.json'), JSON.stringify(world));

build({
  absWorkingDir: root,
  entryPoints: ['online-server/browser/local-engine.mjs'],
  outfile: 'personal-engine.js',
  bundle: true,
  platform: 'browser',
  format: 'iife',
  globalName: 'PersonalEngine',
  target: ['es2022'],
  minify: true,
  keepNames: true,
  legalComments: 'external',
}).then(() => console.log('Shared local engine and ' + Object.keys(people).length + ' character sprites built.'))
  .catch(error => { console.error(error); process.exitCode = 1; });
