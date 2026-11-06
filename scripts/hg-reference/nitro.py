import struct
U16=lambda b,p:struct.unpack_from("<H",b,p)[0]
U32=lambda b,p:struct.unpack_from("<I",b,p)[0]

def sections(blob):
    p = U16(blob, 12)
    while p + 8 <= len(blob):
        size = U32(blob, p + 4)
        if size < 8 or p + size > len(blob):
            raise ValueError('Invalid Nitro section length')
        yield blob[p:p+4], blob[p:p+size]
        p += size

def section(blob, magic):
    return next(data for name, data in sections(blob) if name == magic)

def nitro_files(rom):
    fntoff, fntsize, fatoff, fatsize = struct.unpack_from('<4I', rom, 0x40)
    fnt = rom[fntoff:fntoff+fntsize]
    entries = {}
    def walk(did, path):
        p, fid, _ = struct.unpack_from('<IHH', fnt, (did & 0xfff)*8)
        while fnt[p]:
            flag = fnt[p]
            p += 1
            name = fnt[p:p+(flag & 127)].decode('ascii')
            p += flag & 127
            if flag & 128:
                sub = U16(fnt, p)
                p += 2
                walk(sub, path + name + '/')
            else:
                start, end = struct.unpack_from('<II', rom, fatoff+fid*8)
                if start > end or end > len(rom):
                    raise ValueError('Invalid NitroFS extent')
                entries[path+name] = (start, end)
                fid += 1
    walk(0xf000, '')
    return entries

def narc(blob):
    fat, data = section(blob, b'BTAF'), section(blob, b'GMIF')
    return [data[8+U32(fat,12+i*8):8+U32(fat,16+i*8)] for i in range(U16(fat,8))]
