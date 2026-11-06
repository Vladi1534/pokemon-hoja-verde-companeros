#!/usr/bin/env python3
"""Bind existing story IDs to verifiable FRLG coordinates without moving source NPCs."""
import argparse,json,re
from pathlib import Path
from extract_leafgreen_maps import dump

# Exact pret symbols, not display-name or nearest-position guesses.
EXPLICIT={
 'oak':('PalletTown','LOCALID_PALLET_PROF_OAK'),
 'pallet_lab_oak':('PalletTown_ProfessorOaksLab','PalletTown_ProfessorOaksLab_EventScript_ProfOak'),
 'pallet_lab_rival':('PalletTown_ProfessorOaksLab','PalletTown_ProfessorOaksLab_EventScript_Rival'),
 'pallet_home_mom':('PalletTown_PlayersHouse_1F','PalletTown_PlayersHouse_1F_EventScript_Mom'),
 'bill_home_bill':('Route25_SeaCottage','LOCALID_BILL_HUMAN'),
 'bill_home_bill_pc':('Route25_SeaCottage','Route25_SeaCottage_EventScript_Computer'),
 'ssanne_cabin_captain':('SSAnne_CaptainsOffice','SSAnne_CaptainsOffice_EventScript_Captain'),
 'ssanne_rival':('SSAnne_2F_Corridor','LOCALID_SS_ANNE_RIVAL'),
 'ssanne_sailor':('SSAnne_1F_Corridor','SSAnne_1F_Corridor_EventScript_Sailor'),
 'ssanne_rest_host':('SSAnne_1F_Room6','SSAnne_1F_Room6_EventScript_Woman'),
 'moon_b2_fossil':('MtMoon_B2F','LOCALID_MIGUEL'),
 'rocket_b2_giovanni':('RocketHideout_B4F','RocketHideout_B4F_EventScript_Giovanni'),
 'rocket_b2_scope':('RocketHideout_B4F','RocketHideout_B4F_EventScript_SilphScope'),
 'tower_3_fuji':('PokemonTower_7F','PokemonTower_7F_EventScript_MrFuji'),
 'silph_2_card_key':('SilphCo_5F','SilphCo_5F_EventScript_ItemCardKey'),
 'silph_2_rival':('SilphCo_7F','LOCALID_SILPH_CO_RIVAL'),
 'silph_3_giovanni':('SilphCo_11F','LOCALID_SILPH_CO_GIOVANNI'),
 'silph_3_president':('SilphCo_11F','SilphCo_11F_EventScript_President'),
 'safari_teeth':('SafariZone_West','SafariZone_West_EventScript_ItemGoldTeeth'),
 'safari_hut_surf':('SafariZone_SecretHouse','SafariZone_SecretHouse_EventScript_Attendant'),
 'mansion_2_secret_key':('PokemonMansion_B1F','PokemonMansion_B1F_EventScript_ItemSecretKey'),
 'celadon_house_tea':('CeladonCity_Condominiums_1F','CeladonCity_Condominiums_1F_EventScript_TeaWoman'),
 'fuchsia_house_warden':('FuchsiaCity_WardensHouse','FuchsiaCity_WardensHouse_EventScript_Warden'),
 'route12_snorlax':('Route12','Route12_EventScript_Snorlax'),
 'route16_snorlax16':('Route16','Route16_EventScript_Snorlax'),
 'route16_house_fly':('Route16_House','Route16_House_EventScript_Woman'),
 'cinnabar_lab_restore_fossil':('CinnabarIsland_PokemonLab_ExperimentRoom','CinnabarIsland_PokemonLab_ExperimentRoom_EventScript_FossilScientist'),
 'oneisland_center_celio':('OneIsland_PokemonCenter_1F','OneIsland_PokemonCenter_1F_EventScript_Celio'),
 'ember_ruby':('MtEmber_RubyPath_B5F','MtEmber_RubyPath_B5F_EventScript_Ruby'),
 'route5_daycare_daycare':('Route5_PokemonDayCare','Route5_PokemonDayCare_EventScript_DaycareMan'),
 'fourisland_daycare_daycare':('FourIsland_PokemonDayCare','FourIsland_PokemonDayCare_EventScript_DaycareWoman'),
 'route22_rival':('Route22','LOCALID_ROUTE22_RIVAL'),
 'indigo_arena_league':('PokemonLeague_LoreleisRoom','PokemonLeague_LoreleisRoom_EventScript_Lorelei'),
 'viridian_gym_leader':('ViridianCity_Gym','ViridianCity_Gym_EventScript_Giovanni'),
 'pewter_gym_leader':('PewterCity_Gym','PewterCity_Gym_EventScript_Brock'),
 'cerulean_gym_leader':('CeruleanCity_Gym','CeruleanCity_Gym_EventScript_Misty'),
 'vermilion_gym_leader':('VermilionCity_Gym','VermilionCity_Gym_EventScript_LtSurge'),
 'celadon_gym_leader':('CeladonCity_Gym','CeladonCity_Gym_EventScript_Erika'),
 'fuchsia_gym_leader':('FuchsiaCity_Gym','FuchsiaCity_Gym_EventScript_Koga'),
 'saffron_gym_leader':('SaffronCity_Gym','SaffronCity_Gym_EventScript_Sabrina'),
 'cinnabar_gym_leader':('CinnabarIsland_Gym','CinnabarIsland_Gym_EventScript_Blaine'),
 'casino_poster':('CeladonCity_GameCorner','CeladonCity_GameCorner_EventScript_Poster'),
 'tower_2_ghost':('PokemonTower_6F','PokemonTower_6F_EventScript_MarowakGhost'),
 'vermilion_fisher':('VermilionCity_House1','VermilionCity_House1_EventScript_FishingGuru'),
 'cerulean_mewtwo':('CeruleanCity','CeruleanCity_EventScript_CeruleanCaveGuard'),
 'celadon_shop_clerk':('CeladonCity_DepartmentStore_2F','CeladonCity_DepartmentStore_2F_EventScript_ClerkItems'),
 'pewter_museum_curator':('PewterCity_Museum_1F','PewterCity_Museum_1F_EventScript_Scientist1'),
 'pewter_museum_fossil_case':('PewterCity_Museum_1F','PewterCity_Museum_1F_EventScript_AerodactylFossil'),
 'pewter_museum_moon_case':('PewterCity_Museum_2F','PewterCity_Museum_2F_EventScript_MoonStone'),
 'mansion_1_statue1':('PokemonMansion_1F','PokemonMansion_1F_EventScript_Statue'),
 'mansion_1_statue2':('PokemonMansion_2F','PokemonMansion_2F_EventScript_Statue'),
 'vermilion_gym_switch1':('VermilionCity_Gym','VermilionCity_Gym_EventScript_TrashCan1'),
 'vermilion_gym_switch2':('VermilionCity_Gym','VermilionCity_Gym_EventScript_TrashCan2'),
}

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--native',type=Path,required=True);ap.add_argument('--current',type=Path,required=True);a=ap.parse_args()
 world=json.loads((a.native/'runtime-world.json').read_text())['maps'];byname={m['sourceName']:m for m in world.values()}
 migration={m['legacyId']:m for m in json.loads((a.native/'legacy-map-correspondence.json').read_text())['maps']}
 old=json.loads(a.current.read_text())['maps'];out=[];unresolved=[]
 for mapid,m in old.items():
  for npc in m.get('npcs',[]):
   nid=npc['id'];target=world[migration[mapid]['nativeId']];selector=None;explicit=nid in EXPLICIT
   if explicit:
    name,selector=EXPLICIT[nid];target=byname[name]
   elif npc.get('role')=='heal':selector=target['sourceName']+'_EventScript_Nurse'
   elif npc.get('role')=='coach':selector=target['sourceName']+'_EventScript_GymGuy'
   elif npc.get('role')=='shop':selector=target['sourceName']+'_EventScript_Clerk'
   elif npc.get('role')=='pc':selector='MB_PC'
   else:
    if npc.get('role') in ['story','league','gym','rest','daycare','rod','mewtwo']:unresolved.append({'legacyMap':mapid,'legacyNpcId':nid,'role':npc.get('role'),'reason':'No exact original counterpart selected; retain as custom quest or anchor explicitly.'})
    continue
   matches=[]
   for kind in ['objects','background','coordinates']:
    for e in target['events'][kind]:
     s=e.get('symbols',{})
     if s.get('script')==selector or s.get('local_id')==selector:matches.append((kind,e))
   if selector=='MB_PC':
    for y,row in enumerate(target['behavior']):
     for x,b in enumerate(row):
      if b==0x83:matches.append(('metatile',{'x':x,'y':y,'index':y*target['w']+x,'symbols':{}}))
   if not matches:
    unresolved.append({'legacyMap':mapid,'legacyNpcId':nid,'target':target['sourceName'],'selector':selector,'role':npc.get('role'),'reason':'Exact symbol unavailable; inspect source script.'});continue
   kind,e=matches[0]
   record={'legacyMap':mapid,'legacyNpcId':nid,'legacyRole':npc.get('role'),'nativeId':target['id'],
           'nativeName':target['sourceName'],'x':e['x'],'y':e['y'],'nativeEventKind':kind,'nativeEventIndex':e['index'],
           'localId':e.get('localId'),'symbol':selector,'nativeVisibilityFlag':e.get('symbols',{}).get('flag'),
           'elevation':target['elevation'][e['y']][e['x']],
           'note':'Preserve native object identity and visibility state; bind existing story handler here instead of adding a duplicate NPC.'}
   if len(matches)>1:record['otherPositions']=[{'x':ee['x'],'y':ee['y'],'kind':kk,'index':ee['index']} for kk,ee in matches[1:]]
   if npc.get('role') in ['heal','shop']:
    record['interactionRule']='Allow interaction over one intervening MB_COUNTER tile (behavior0x80), at distance2. Do not move the NPC into the aisle.'
   out.append(record)
 dump(a.native/'legacy-story-anchors.json',{'anchors':out,'unresolved':unresolved},True)
 print(json.dumps({'exactAnchors':len(out),'unresolved':len(unresolved)},indent=2))

if __name__=='__main__':main()
