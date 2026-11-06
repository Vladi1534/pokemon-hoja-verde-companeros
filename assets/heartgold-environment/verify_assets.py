#!/usr/bin/env python3
"""Verify extraction invariants, embedded dependencies and lossless pixels."""
import json, sys
from pathlib import Path
from build_environment import Image, np, read_glb, accessor, sha, bounds

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent / 'deliverable'
manifest = json.loads((root / 'manifest.json').read_text())
atlas_meta = json.loads((root / manifest['atlas']).read_text())
atlas = Image.open(root / atlas_meta['image']).convert('RGBA')
for entry in atlas_meta['textures']:
    image = Image.open(root / entry['file']).convert('RGBA')
    x, y, w, h = entry['atlasRect']
    assert image.size == (w, h)
    assert atlas.crop((x, y, x+w, y+h)).tobytes() == image.tobytes(), entry['key']
    assert sha((root / entry['file']).read_bytes()) == entry['sha256']
for entry in manifest['models']:
    doc, data = read_glb(root / entry['file'])
    assert not any('uri' in image for image in doc.get('images', []))
    assert sha((root / entry['file']).read_bytes()) == entry['sha256']
    for mesh in doc['meshes']:
        for primitive in mesh['primitives']:
            pos = accessor(doc, data, primitive['attributes']['POSITION'])
            indices = accessor(doc, data, primitive['indices']).reshape(-1)
            assert len(indices) % 3 == 0 and len(indices) > 0
            assert indices.max() < len(pos) and np.isfinite(pos).all()
            assert doc['materials'][primitive['material']].get('extensions', {}).get('KHR_materials_unlit') is not None
    box = bounds(doc, data)
    assert box == entry['bounds']
    extent = np.array(box['max']) - np.array(box['min'])
    if entry['key'].startswith('cave-wall-'): assert np.allclose(extent, [16, 16, 16]), entry['key']
    if entry['key'].endswith('-tree'): assert extent[1] > 40 and extent[2] > 35, entry['key']
catalog_path = root / 'environment-catalog.json'
if catalog_path.exists():
    valid = {t['key'] for t in atlas_meta['textures']} | {m['key'] for m in manifest['models']}
    def check(value):
        if isinstance(value, dict):
            for child in value.values(): check(child)
        else: assert value in valid, value
    check(json.loads(catalog_path.read_text())['regions'])
print(json.dumps({'textures': len(atlas_meta['textures']), 'models': len(manifest['models']),
                  'nativeWallSegments': 4, 'status': 'verified'}))
