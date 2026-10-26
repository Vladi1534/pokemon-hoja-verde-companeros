import {createRequire} from 'node:module';
import {mkdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('vite/package.json'))('esbuild');
const out=path.resolve(process.argv[2]||'public/personal-engine.js');
await mkdir(path.dirname(out),{recursive:true});
await build({entryPoints:['browser/local-engine.mjs'],outfile:out,bundle:true,platform:'browser',format:'iife',globalName:'PersonalEngine',target:['es2022'],minify:true,keepNames:true,legalComments:'external'});
console.log('Personal engine built: '+out);
