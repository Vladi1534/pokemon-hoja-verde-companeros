#!/usr/bin/env python3
"""Decode native HG environmental art into a topology-independent asset kit.

Usage: python build_environment.py --rom supplied.nds --apicula /path/apicula
The ROM is read as data only. No game code is executed. Outputs remain local.
Requires Pillow and numpy; Apicula commit 3d4e91e14045392a49c89e86dab8cb936225588c.
"""
import argparse, copy, hashlib, json, math, os, shutil, struct, subprocess, sys, zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = next((p for p in [HERE, *HERE.parents] if (p / 'work-v29/visual').is_dir()), Path.cwd())
sys.path.insert(0, os.environ.get('HG_RENDER_DEPS', str(ROOT / 'work-v29/visual/python-deps')))
import numpy as np
from PIL import Image, ImageDraw

SOURCE_SHA = '9e0f7a1a4a18d9015936678722ce081d08b6a5d882fd648e89b624307f8f9e19'
AREAS = {
    'kanto': {'area': 18, 'lands': [199, 200, 202, 203, 204], 'maps': ['MAP_ROUTE_1', 'MAP_ROUTE_21'], 'matrix': 0},
    'forest': {'area': 103, 'lands': [622, 623, 624, 625, 626, 627], 'maps': ['MAP_VIRIDIAN_FOREST'], 'matrix': 86},
    'cave': {'area': 70, 'lands': [389], 'maps': ['MAP_MOUNT_MOON'], 'matrix': 3},
    'rock-tunnel': {'area': 83, 'lands': [407, 408, 409, 410], 'maps': ['MAP_ROCK_TUNNEL_1F'], 'matrix': 6},
    'ilex': {'area': 74, 'lands': [504, 505, 506, 507, 508, 509], 'maps': ['MAP_ILEX_FOREST'], 'matrix': 56},
    'union': {'area': 87, 'lands': [479, 480, 481], 'maps': ['MAP_UNION_CAVE_1F'], 'matrix': 42},
}
PROPS = {32: 'route-sign', 36: 'forest-gate', 69: 'cave-ladder-up', 70: 'cave-ladder-down', 71: 'ilex-shrine', 72: 'forest-branch'}
FORMATS = {5126: '<f4', 5123: '<u2', 5125: '<u4', 5121: 'u1', 5122: '<i2', 5120: 'i1'}
WIDTHS = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def json_write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def nitro_files(rom):
    fntoff, fntsize, fatoff, fatsize = struct.unpack_from('<4I', rom, 0x40)
    fnt = rom[fntoff:fntoff + fntsize]
    files = {}
    def walk(did, path):
        pos, fid, _ = struct.unpack_from('<IHH', fnt, (did & 0xfff) * 8)
        while fnt[pos]:
            flag = fnt[pos]; pos += 1
            name = fnt[pos:pos + (flag & 127)].decode('ascii'); pos += flag & 127
            if flag & 128:
                sub = struct.unpack_from('<H', fnt, pos)[0]; pos += 2
                walk(sub, path + name + '/')
            else:
                a, b = struct.unpack_from('<II', rom, fatoff + fid * 8)
                assert 0 <= a <= b <= len(rom)
                files[path + name] = (a, b); fid += 1
    walk(0xf000, '')
    return files


def narc(blob):
    chunks = {}; pos = struct.unpack_from('<H', blob, 12)[0]
    while pos + 8 <= len(blob):
        size = struct.unpack_from('<I', blob, pos + 4)[0]
        assert 8 <= size <= len(blob) - pos
        chunks[blob[pos:pos + 4]] = blob[pos:pos + size]; pos += size
    fat, data = chunks[b'BTAF'], chunks[b'GMIF']
    return [data[8 + a:8 + b] for a, b in [struct.unpack_from('<II', fat, 12 + i * 8)
            for i in range(struct.unpack_from('<H', fat, 8)[0])]]


def read_glb(path):
    blob = path.read_bytes(); assert blob[:4] == b'glTF'
    pos = 12; doc = None; data = b''
    while pos < len(blob):
        size, kind = struct.unpack_from('<II', blob, pos)
        part = blob[pos + 8:pos + 8 + size]; pos += 8 + size
        if kind == 0x4e4f534a: doc = json.loads(part)
        elif kind == 0x004e4942: data = part
    return doc, data


def write_glb(doc, data, path):
    data = bytearray(data); data.extend(b'\0' * ((-len(data)) % 4))
    doc['buffers'] = [{'byteLength': len(data)}]
    txt = json.dumps(doc, separators=(',', ':')).encode(); txt += b' ' * ((-len(txt)) % 4)
    blob = struct.pack('<4sII', b'glTF', 2, 28 + len(txt) + len(data))
    blob += struct.pack('<II', len(txt), 0x4e4f534a) + txt + struct.pack('<II', len(data), 0x004e4942) + data
    path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(blob)


def embed(source, target):
    doc, blob = read_glb(source); blob = bytearray(blob)
    for im in doc.get('images', []):
        if 'uri' not in im: continue
        blob.extend(b'\0' * ((-len(blob)) % 4)); payload = (source.parent / im.pop('uri')).read_bytes()
        im['bufferView'] = len(doc['bufferViews']); im['mimeType'] = 'image/png'
        doc['bufferViews'].append({'buffer': 0, 'byteOffset': len(blob), 'byteLength': len(payload)})
        blob.extend(payload)
    for sampler in doc.get('samplers', []): sampler.update(magFilter=9728, minFilter=9728)
    doc.setdefault('extras', {}).update(unitsPerTile=16, collision='External original FRLG collision; not model bounds')
    write_glb(doc, blob, target)
    return doc


def accessor(doc, data, index):
    a = doc['accessors'][index]; v = doc['bufferViews'][a['bufferView']]
    dtype = np.dtype(FORMATS[a['componentType']]); width = WIDTHS[a['type']]
    off = v.get('byteOffset', 0) + a.get('byteOffset', 0)
    return np.ndarray((a['count'], width), dtype=dtype, buffer=data, offset=off,
                      strides=(v.get('byteStride', width * dtype.itemsize), dtype.itemsize)).copy()


def bounds(doc, data):
    values = []
    for mesh in doc['meshes']:
        for pr in mesh['primitives']:
            p = accessor(doc, data, pr['attributes']['POSITION'])
            ix = accessor(doc, data, pr['indices']).reshape(-1)
            values.append(p[ix])
    a = np.concatenate(values)
    return {'min': a.min(0).tolist(), 'max': a.max(0).tolist()}


def submesh(source, material_name, key, out, mode='quad'):
    """Copy native triangles; translate only. Never invent or warp geometry."""
    doc, blob = read_glb(source)
    pr = next(p for p in doc['meshes'][0]['primitives'] if doc['materials'][p['material']].get('name') == material_name)
    positions = accessor(doc, blob, pr['attributes']['POSITION'])
    faces = accessor(doc, blob, pr['indices']).reshape(-1, 3)
    first = 0; clip_axis = None; clip_max = None
    if mode == 'wall':
        # HG native cave walls consist of 3 strips / 6 triangles per segment.
        candidates = [i for i in range(0, len(faces) - 5, 6)
                      if np.allclose(np.ptp(positions[faces[i:i + 6]].reshape(-1, 3), axis=0), [16, 16, 16])]
        if candidates:
            first = candidates[0]
        else:
            # Some orientations only exist as longer strips. Crop one native tile,
            # interpolating the original UV/color data; do not squeeze the strip.
            axis = 2 if material_name.endswith(('e', 'w')) else 0
            candidates = [i for i in range(0, len(faces) - 5, 6)
                          if np.ptp(positions[faces[i:i + 6]].reshape(-1, 3), axis=0)[axis] >= 16]
            if not candidates: raise ValueError('No native wall strip: ' + material_name)
            first = candidates[0]; clip_axis = axis
            clip_max = positions[faces[first:first + 6]].reshape(-1, 3).min(0)[axis] + 16
        faces = faces[first:first + 6]
    else:
        faces = faces[:2]
    used, inverse = np.unique(faces, return_inverse=True)
    attributes = {name: accessor(doc, blob, index)[used] for name, index in pr['attributes'].items()
                  if name in ('POSITION', 'NORMAL', 'TEXCOORD_0', 'COLOR_0')}
    if clip_axis is not None:
        new_vertices = []
        for triangle in inverse.reshape(-1, 3):
            poly = [{k: v[index].copy() for k, v in attributes.items()} for index in triangle]
            clipped = []
            for a, b in zip(poly, poly[1:] + poly[:1]):
                av, bv = a['POSITION'][clip_axis], b['POSITION'][clip_axis]
                inside_a, inside_b = av <= clip_max + 1e-7, bv <= clip_max + 1e-7
                if inside_a: clipped.append(a)
                if inside_a != inside_b:
                    t = (clip_max - av) / (bv - av)
                    clipped.append({k: a[k] + (b[k] - a[k]) * t for k in attributes})
            for i in range(1, len(clipped) - 1): new_vertices.extend([clipped[0], clipped[i], clipped[i + 1]])
        attributes = {k: np.array([v[k] for v in new_vertices]) for k in attributes}
        inverse = np.arange(len(new_vertices))
    pos = attributes['POSITION']; mn, mx = pos.min(0), pos.max(0)
    anchor = mn.copy() if mode == 'wall' else np.array([(mn[0] + mx[0]) / 2, mn[1], mx[2]])
    attributes['POSITION'] -= anchor
    new = {'asset': {'version': '2.0', 'generator': 'HG native environment triangle extraction'},
           'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0, 'name': key}],
           'meshes': [{'primitives': [{'attributes': {}, 'material': 0}]}],
           'materials': [copy.deepcopy(doc['materials'][pr['material']])],
           'extensionsUsed': ['KHR_materials_unlit'], 'bufferViews': [], 'accessors': [],
           'extras': {'unitsPerTile': 16, 'sourceModel': source.stem, 'sourceMaterial': material_name,
                      'sourceFirstTriangle': first, 'sourceTriangleCount': len(faces),
                      'sourceOriginRemoved': anchor.tolist(), 'cropAxis': clip_axis,
                      'cropMaximum': float(clip_max) if clip_max is not None else None,
                      'collision': 'Original FRLG collision, independent'}}
    data = bytearray()
    def append(payload):
        data.extend(b'\0' * ((-len(data)) % 4)); i = len(new['bufferViews'])
        new['bufferViews'].append({'buffer': 0, 'byteOffset': len(data), 'byteLength': len(payload)}); data.extend(payload)
        return i
    target_primitive = new['meshes'][0]['primitives'][0]
    for name, values in attributes.items():
        values = values.astype('<f4'); ai = len(new['accessors'])
        entry = {'bufferView': append(values.tobytes()), 'componentType': 5126,
                 'count': len(values), 'type': 'VEC' + str(values.shape[1])}
        if name == 'POSITION': entry.update(min=values.min(0).tolist(), max=values.max(0).tolist())
        new['accessors'].append(entry); target_primitive['attributes'][name] = ai
    ix = inverse.astype('<u2').reshape(-1); target_primitive['indices'] = len(new['accessors'])
    new['accessors'].append({'bufferView': append(ix.tobytes()), 'componentType': 5123, 'count': len(ix), 'type': 'SCALAR'})
    texref = new['materials'][0].get('pbrMetallicRoughness', {}).get('baseColorTexture')
    if texref:
        texture = doc['textures'][texref['index']]; image = doc['images'][texture['source']]
        payload = (source.parent / image['uri']).read_bytes()
        texref['index'] = 0; new['textures'] = [{'source': 0, 'sampler': 0}]
        new['images'] = [{'bufferView': append(payload), 'mimeType': 'image/png'}]
        new['samplers'] = [{'magFilter': 9728, 'minFilter': 9728, 'wrapS': 10497, 'wrapT': 10497}]
    path = out / 'models' / (key + '.glb'); write_glb(new, data, path)
    return {'key': key, 'file': 'models/' + path.name, 'bounds': bounds(new, data),
            'bytes': path.stat().st_size, 'sha256': sha(path.read_bytes()),
            'unitsPerTile': 16, 'axis': 'Y up; +X east; +Z south', 'anchor': [0, 0, 0],
            'nativeSource': new['extras']}


def run_converter(apicula, inputs, folder):
    folder.parent.mkdir(parents=True, exist_ok=True)
    proc = subprocess.run([str(apicula), 'convert', '-f=glb', *map(str, inputs), '-o', str(folder), '--overwrite'],
                          capture_output=True, text=True)
    if proc.returncode: raise RuntimeError(proc.stdout + proc.stderr)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--rom', type=Path, default=ROOT / 'work-v28/audio/heartgold.nds')
    parser.add_argument('--apicula', type=Path, default=ROOT / 'work-v29/visual/apicula/target/release/apicula')
    parser.add_argument('--out', type=Path, default=HERE / 'deliverable')
    args = parser.parse_args(); out = args.out; out.mkdir(parents=True, exist_ok=True)
    for previous in (out / 'models').glob('*.glb'): previous.unlink()
    supplied_member = None
    if args.rom.suffix.lower() == '.zip':
        with zipfile.ZipFile(args.rom) as z:
            supplied_member = next(x for x in z.namelist() if x.lower().endswith('.nds'))
            rom = z.read(supplied_member)
    else: rom = args.rom.read_bytes()
    assert sha(rom) == SOURCE_SHA, 'ROM differs from audited owner-provided Spanish HeartGold source'
    fs = nitro_files(rom); archives = {}
    archive_meta = {}
    for name in ['a/0/4/0', 'a/0/4/1', 'a/0/4/2', 'a/0/4/4', 'a/0/6/5', 'a/0/7/0']:
        a, b = fs[name]; archives[name] = narc(rom[a:b]); archive_meta[name] = {'bytes': b - a, 'sha256': sha(rom[a:b])}
    resources = []; area_manifest = {}; models = []; converted = HERE / 'converted-kit'
    for group, info in AREAS.items():
        folder = HERE / 'native-kit' / group; folder.mkdir(parents=True, exist_ok=True)
        area = archives['a/0/4/2'][info['area']]
        extra_id, texture_id = struct.unpack_from('<HH', area)
        tx = folder / 'textures.nsbtx'; tx.write_bytes(archives['a/0/4/4'][texture_id]); inputs = [tx]
        extra = archives['a/0/7/0'][extra_id]
        if extra[:4] == b'BTX0':
            tx2 = folder / 'extra-textures.nsbtx'; tx2.write_bytes(extra); inputs.append(tx2)
        land_sources = {}
        for land_id in info['lands']:
            land = archives['a/0/6/5'][land_id]; p = land.index(b'BMD0'); size = struct.unpack_from('<I', land, p + 8)[0]
            model_path = folder / f'land-{land_id}.nsbmd'; model_path.write_bytes(land[p:p + size]); inputs.append(model_path)
            land_sources[str(land_id)] = {'sha256': sha(land), 'modelSha256': sha(land[p:p + size])}
        target = converted / group; run_converter(args.apicula, inputs, target)
        binding_by_image = {}
        for glb in sorted(target.glob('*.glb')):
            d, b = read_glb(glb)
            for mat in d.get('materials', []):
                ref = mat.get('pbrMetallicRoughness', {}).get('baseColorTexture')
                if not ref: continue
                image_path = d['images'][d['textures'][ref['index']]['source']].get('uri')
                if image_path: binding_by_image.setdefault(image_path, []).append({'model': glb.stem, 'material': mat.get('name'), 'alphaMode': mat.get('alphaMode', 'OPAQUE')})
        for p in sorted(target.glob('*.png')):
            # Only include palettes confirmed by actual model material bindings.
            if p.name not in binding_by_image: continue
            dst = out / 'textures' / group / p.name; dst.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(p, dst)
            image = Image.open(p).convert('RGBA'); w, h = image.size
            resources.append({'key': group + '/' + p.stem, 'file': str(dst.relative_to(out)), 'sourceTextureName': p.stem,
                'width': w, 'height': h, 'sha256': sha(p.read_bytes()), 'sourceArea': info['area'],
                'sourceTextureArchives': [{'archive': 'a/0/4/4', 'member': texture_id}, {'archive': 'a/0/7/0', 'member': extra_id}],
                'paletteBinding': 'Confirmed by source model material (no palette-name guessing)',
                'materials': binding_by_image[p.name], 'unitsPerTile': 16,
                'alpha': image.getextrema()[3][0] < 255, 'sampling': 'nearest; preserve native UVs / repeat; never smooth'})
        area_manifest[group] = {**info, 'areaRecordHex': area.hex(), 'textureMember': texture_id, 'animationTextureMember': extra_id,
            'textureSha256': sha(archives['a/0/4/4'][texture_id]), 'animationTextureSha256': sha(extra), 'lands': land_sources}
    # Pack the original pixels into a compact atlas. No scaling or repainting.
    atlas_width = 512; cursor_x = cursor_y = row_h = 0; gutter = 2
    for r in resources:
        w, h = r['width'], r['height']
        if cursor_x + w + gutter * 2 > atlas_width: cursor_x = 0; cursor_y += row_h; row_h = 0
        r['atlasRect'] = [cursor_x + gutter, cursor_y + gutter, w, h]
        cursor_x += w + gutter * 2; row_h = max(row_h, h + gutter * 2)
    atlas_height = 2 ** math.ceil(math.log2(cursor_y + row_h))
    atlas = Image.new('RGBA', (atlas_width, atlas_height))
    for r in resources: atlas.paste(Image.open(out / r['file']).convert('RGBA'), tuple(r['atlasRect'][:2]))
    atlas.save(out / 'environment-atlas.png')
    json_write(out / 'environment-atlas.json', {'image': 'environment-atlas.png', 'width': atlas_width, 'height': atlas_height,
        'pixelTransformation': 'Lossless packing only; source pixels not rescaled, repainted or filtered', 'textures': resources})
    # Small native props. Do not export the whole HG map geometry.
    for index, key in PROPS.items():
        folder = HERE / 'native-kit/props'; folder.mkdir(parents=True, exist_ok=True)
        source = folder / f'{index}.nsbmd'; source.write_bytes(archives['a/0/4/0'][index])
        target = converted / ('prop-' + str(index)); run_converter(args.apicula, [source], target)
        glb = next(target.glob('*.glb')); dst = out / 'models' / (key + '.glb'); embed(glb, dst)
        d, b = read_glb(dst)
        models.append({'key': key, 'file': str(dst.relative_to(out)), 'bounds': bounds(d, b), 'bytes': dst.stat().st_size,
            'sha256': sha(dst.read_bytes()), 'sourceArchive': 'a/0/4/0', 'sourceMember': index,
            'sourceSha256': sha(archives['a/0/4/0'][index]), 'sourceModel': glb.stem,
            'unitsPerTile': 16, 'axis': 'Y up; +X east; +Z south; native origin retained', 'anchor': [0, 0, 0]})
    recipes = [
        ('forest', 'm_dun4601_00_00c', 'dtf_f09', 'forest-tree', 'quad'),
        ('forest', 'm_dun4601_00_00c', 'dtf_f10', 'forest-canopy-strip', 'quad'),
        ('kanto', None, 'tree01', 'kanto-tree', 'quad'),
        ('kanto', None, 'tree01_re', 'kanto-tree-edge', 'quad'),
        ('ilex', None, 'tree01', 'ilex-tree', 'quad'),
        ('cave', 'm_dun0201_00_00c', 'drock01s', 'cave-stalagmite', 'quad'),
        ('kanto', None, 'sea_rock', 'sea-rock', 'quad'),
    ] + [('cave', 'm_dun0201_00_00c', 'dwall01_' + direction, 'cave-wall-' + direction, 'wall') for direction in 'nesw']
    for group, stem, material, key, mode in recipes:
        candidates = [converted / group / (stem + '.glb')] if stem else sorted((converted / group).glob('*.glb'))
        source = next(p for p in candidates if any(m.get('name') == material for m in read_glb(p)[0]['materials']))
        item = submesh(source, material, key, out, mode)
        member_ids = [int(p.stem.split('-')[-1]) for p in (HERE / 'native-kit' / group).glob('land-*.nsbmd')
                      if source.stem.encode() in p.read_bytes()]
        item.update(sourceArea=group, sourceLandArchive='a/0/6/5', sourceLandMembers=member_ids or AREAS[group]['lands'])
        models.append(item)
    manifest = {'sourceRomSha256': sha(rom), 'sourceRomGameCode': rom[12:16].decode(),
        'sourceFile': args.rom.name, 'sourceZipMember': supplied_member,
        'sourceContainerSha256': sha(args.rom.read_bytes()),
        'converter': {'name': 'Apicula', 'commit': '3d4e91e14045392a49c89e86dab8cb936225588c', 'license': '0BSD'},
        'referenceDecomp': {'repository': 'pret/pokeheartgold', 'commit': 'e1d5a4606640e31c44d36714ad0b5cdd9c8763fd',
            'mapHeaders': 'src/data/map_headers.h', 'areaDecode': 'asm/overlay_01_021FB878.s'},
        'archives': archive_meta, 'areas': area_manifest, 'textureCount': len(resources), 'modelCount': len(models),
        'atlas': 'environment-atlas.json', 'models': models,
        'contract': {'nativeUnitsPerTile': 16, 'collision': 'Must come from the original FRLG map, never from this texture/mesh kit.',
            'geometry': 'Source HG map layout is not exported or used. Only reusable art fragments and props.',
            'appearance': 'Art and static geometry are native HG. This is not the original Nintendo DS executable renderer.',
            'water': 'Static native frames included; animation sequencing remains renderer work.'}}
    json_write(out / 'manifest.json', manifest)
    print(json.dumps({'textures': len(resources), 'models': len(models), 'atlas': [atlas_width, atlas_height], 'out': str(out)}))


if __name__ == '__main__': main()
