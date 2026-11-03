import {NORTH_BOUNDARY} from './north-junction.js';
// Current fitted profiles, shared by concrete, seats, tread plates and handrails.
// These values are C evidence. Calibrate the whole section from approved drawings;
// the independently verified North FFL controls do not certify this geometry yet.
export function createBowlSections(pitchLevel){
 const common={seatOffset:.40,stairWidth:1.05,stairDepth:.34};
 return {
  evidence:'C current fitted section; coherent calibration pending',
  replacedNorth:{...NORTH_BOUNDARY},
  tiers:[
   {...common,id:'lower',rows:27,start:3,y:pitchLevel+.25,step:.78,rise:.43},
   {...common,id:'middle',rows:17,start:28,y:9,step:.86,rise:.49},
   {...common,id:'upper',rows:26,start:47,y:22,step:.91,rise:.55}
  ],
  north:{id:'north',rows:59,start:25,y:7.0,step:.65,rise:.445,seatOffset:.44,stairWidth:1.10,stairDepth:.30,terraceDepth:.65,...NORTH_BOUNDARY}
 };
}
