import {heal,nickname} from './creatures.mjs';
export function donorKey(npc,side,slot,species){return `cloned_${npc}_${side}_${slot}_${species}`;}
export function createClone(original,{npc,trainer,side,slot,owner}){
 const clone=structuredClone(original);
 Object.assign(clone,{uid:crypto.randomUUID(),ot:owner,pending:[],clone:{version:1,donorId:npc,donorName:trainer,side,slot,species:original.species,serial:crypto.randomUUID()}});
 delete clone.eggSteps;delete clone.depositLevel;delete clone.item;
 heal(clone);return clone;
}
export function validateClone(value){
 if(!value||value.version!==1||typeof value.donorId!=='string'||!/^[a-z0-9_]{1,64}$/i.test(value.donorId)||!['p2','p4'].includes(value.side)||!Number.isInteger(value.slot)||value.slot<0||value.slot>5||!Number.isInteger(value.species)||value.species<1||value.species>251||typeof value.serial!=='string'||!/^[a-f0-9-]{36}$/.test(value.serial)||typeof value.donorName!=='string'||value.donorName.length>120)throw Error('Procedencia del clon inválida.');
 return {version:1,donorId:value.donorId,donorName:value.donorName,side:value.side,slot:value.slot,species:value.species,serial:value.serial};
}
export function nameClone(m,value){if(value!==undefined)m.nickname=nickname(value);}
