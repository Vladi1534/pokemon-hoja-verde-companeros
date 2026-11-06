#!/usr/bin/env python3
"""Exact visible/hidden pickups plus separately-labelled conditional script gifts."""
import argparse,json,re
from pathlib import Path
from extract_leafgreen_maps import Rom,dump,BASE
from extract_native_trainers import constants,script_blocks

KEY_HINT={
 'ITEM_POTION':'potion','ITEM_SUPER_POTION':'superpotion','ITEM_HYPER_POTION':'hyperpotion',
 'ITEM_POKE_BALL':'ball','ITEM_GREAT_BALL':'superball','ITEM_ULTRA_BALL':'ultraball','ITEM_MASTER_BALL':'masterball',
 'ITEM_REPEL':'repel','ITEM_ANTIDOTE':'antidote','ITEM_FULL_HEAL':'fullheal','ITEM_REVIVE':'revive',
 'ITEM_FIRE_STONE':'firestone','ITEM_WATER_STONE':'waterstone','ITEM_THUNDER_STONE':'thunderstone',
 'ITEM_LEAF_STONE':'leafstone','ITEM_MOON_STONE':'moonstone',
 'ITEM_OAKS_PARCEL':'parcel','ITEM_SS_TICKET':'bill','ITEM_SILPH_SCOPE':'scope','ITEM_POKE_FLUTE':'flute',
 'ITEM_TEA':'tea','ITEM_LIFT_KEY':'lift_key','ITEM_CARD_KEY':'card_key','ITEM_SECRET_KEY':'secret_key',
 'ITEM_GOLD_TEETH':'teeth','ITEM_HELIX_FOSSIL':'helix','ITEM_DOME_FOSSIL':'dome','ITEM_RUBY':'ruby',
 'ITEM_RAINBOW_PASS':'rainbow','ITEM_HM01':'cut','ITEM_HM02':'fly','ITEM_HM03':'surf_lesson',
 'ITEM_HM04':'strength','ITEM_EXP_SHARE':'expShare'}

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--rom',type=Path,required=True);ap.add_argument('--decomp',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);a=ap.parse_args()
 rom=Rom(a.rom);items=constants(a.decomp/'include/constants/items.h','ITEM_');reverse={v:k for k,v in items.items()};scripts=script_blocks(a.decomp)
 def gift_refs(label,seen=None,depth=0):
  seen=set() if seen is None else seen
  if label in seen or label not in scripts or depth>8:return []
  seen.add(label);s=scripts[label];out=[]
  for line in s['body'].splitlines():
   match=re.match(r'^\s*(giveitem|finditem|giveitem_msg|additem)\s+(.+)',line)
   if match:
    cmd,arg=match.groups();params=[x.strip() for x in arg.split(',')];ii=1 if cmd=='giveitem_msg' else 0
    if ii<len(params) and params[ii] in items:
     qty=params[ii+1] if ii+1<len(params) else '1'
     try:qty=int(qty,0)
     except ValueError:qty=None
     out.append({'itemId':items[params[ii]],'itemSymbol':params[ii],'quantity':qty,'script':label,'command':cmd,'sourceFile':s['file']})
   if re.match(r'^\s*(?:call|goto)(?:_\w+)?\s',line):
    for nxt in re.findall(r'\b[A-Za-z_]\w+\b',line):
     if nxt in scripts:out.extend(gift_refs(nxt,seen,depth+1))
  return out
 idx=json.loads((a.out/'index.json').read_text());pickups=[];gifts=[];unresolved=[];checks=0
 for brief in idx['maps']:
  m=json.loads((a.out/f'maps/{brief["id"]}.json').read_text())
  def record(e,kind):return {'id':f'{m["id"]}:{kind}:{e["index"]}','nativeMapId':m['id'],'mapName':m['name'],
        'x':e['x'],'y':e['y'],'elevation':e['elevation'],'eventIndex':e['index'],'kind':kind}
  for e in m['events']['background']:
   if e['kind']!=7:continue
   h=e['hiddenItem'];symbol=reverse.get(h['itemId']);s=e.get('symbols',{})
   r=record(e,'hidden');r.update(itemId=h['itemId'],itemSymbol=symbol,quantity=h['quantity'],
      oneTimeFlagId=1000+h['flagOffset'],flagSymbol=s.get('flag'),underfoot=bool(h['underfoot']),
      engineKeyHint=KEY_HINT.get(symbol),resolution='direct-ROM-hidden-item-bitfield')
   if s.get('item') in items:
    assert items[s['item']]==r['itemId'] and s['quantity']==r['quantity'];checks+=1
   pickups.append(r)
  for e in m['events']['objects']:
   s=e.get('symbols',{});label=s.get('script');addr=e.get('scriptAddress',0);p=addr-BASE if addr>=BASE else None
   # Native finditem macro: setorcopyvar8000,item; setorcopyvar8001,qty; callstd1.
   direct=(p is not None and rom.data[p:p+3]==b'\x1a\x00\x80' and rom.data[p+5:p+8]==b'\x1a\x01\x80' and rom.data[p+10:p+12]==b'\x09\x01')
   if direct:
    item,qty=rom.u16(p+3),rom.u16(p+8);symbol=reverse.get(item)
    r=record(e,'visible');r.update(localId=e['localId'],itemId=item,itemSymbol=symbol,quantity=qty,
      oneTimeFlagId=e['flagId'],flagSymbol=s.get('flag'),script=label,engineKeyHint=KEY_HINT.get(symbol),
      resolution='direct-ROM-finditem-opcodes')
    ref=gift_refs(label)
    if ref:
     assert (ref[0]['itemId'],ref[0]['quantity'])==(item,qty);checks+=1
    pickups.append(r);continue
   refs=gift_refs(label)
   if refs:
    unique=[];seen=set()
    for ref in refs:
     key=(ref['itemId'],ref['quantity'],ref['script'])
     if key not in seen:seen.add(key);unique.append({**ref,'engineKeyHint':KEY_HINT.get(ref['itemSymbol'])})
    r=record(e,'conditional-script-gift');r.update(localId=e['localId'],script=label,flagSymbol=s.get('flag'),
        visibilityFlagId=e['flagId'],possibilities=unique,
        instruction='Bind to native story/puzzle handler. Do not spawn these as free pickups: script conditions, choices, battle victories and inventory space apply.')
    gifts.append(r)
   elif s.get('graphics_id')=='OBJ_EVENT_GFX_ITEM_BALL':
    unresolved.append({**record(e,'not-a-simple-pickup'),'script':label,'reason':'May be disguised Pokémon or special script; no finditem payload at start.'})
 dump(a.out/'native-map-items.json',{'schema':'leafgreen-native-map-items/v1',
   'source':'Supplied BPGS ROM; pickup amounts/IDs/flags/positions read directly; gifts source-labelled separately.',
   'itemIdSpace':'FRLG GBA item IDs. Map by itemSymbol/engineKeyHint; do not confuse with HGSS numeric item IDs.',
   'pickupCount':len(pickups),'sourceChecks':checks,'pickups':pickups,'conditionalGifts':gifts,'unresolvedItemBallEvents':unresolved},True)
 print(json.dumps({'pickups':len(pickups),'visible':sum(x['kind']=='visible' for x in pickups),
    'hidden':sum(x['kind']=='hidden' for x in pickups),'supportedKeyHints':sum(x['engineKeyHint'] is not None for x in pickups),
    'sourceChecks':checks,'conditionalGifts':len(gifts),'specialItemBalls':len(unresolved)},indent=2))

if __name__=='__main__':main()
