import {NORTH_CONTROL} from './north-datum.js';
import {mastFanAngle,towerPositions} from './stadium-form.js';
// 1 local unit = 1 metre. Dimensions below distinguish documented original structure from 2026 fits.
export const BUILDING_SPEC={
 units:'metres',project:'Etihad Stadium 2026 architectural master model',northDrawingControl:NORTH_CONTROL,
 verified:{pitchWidth:68,pitchLength:105,pitchBelowOriginalGround:6,originalMasts:12,originalTowerSupportedMasts:8,originalGroundSupportedMasts:4,originalTensionRingStrands:4,originalForestays:76,originalRampTowers:8,originalMaxMastHeight:65,originalRadialGrid:7.6,originalRafterWidth:.30,originalRafterMaxDepth:.90,originalPurlinCentres:4,originalRoofLinerDepth:.15,originalTranslucentEdgeDepth:10,northUpperRows:59},
 provisional:{northHeadframes:'two photographed headframes with circular leg brace; coordinates, sections and roof railing are photographic fits',mastProfile:'photographic cigar fit; diameters and tower cap elevation not surveyed',retainedMasts2026:10,retainedForestays2026:66,retainedMastEvidence:'B - the south pair of 2003 grounded masts is retained (8 tower + 2 ground); the north pair is superseded by the 2026 north-stand headframes and its fans are therefore not modelled',tensionRingPath:'four-strand original topology; path fitted just outside the opening edge, 2026 retained route not surveyed',roofOuterHalfWidth:139,roofOuterHalfLength:144,concourseLevels:[.82,9,20.1],lightPositions:'photographic fit, not a verified 2026 fixture schedule',seatCoordinates:'procedural fit with shared aisle clearance and outward seat backs, not a certified seat survey',allConcourseLevels:'must be calibrated to current sections before interior construction'},
 sources:{originalStructure:'https://www.arup.com/globalassets/downloads/arup-journal/the-arup-journal-2003-issue-1.pdf',northStand:'https://beta.mancity.com/news/club/stadium-relabelling-announcement-63886266',ledUpgrade:'https://www.mancity.com/meta/g1cd0fui/supporter-charter-22-23.pdf'}
};
// Arup 2003 p33: fans of five or seven spiral-strand forestays per mast, each
// cable landing on an individual radial rafter just outside the 10 m
// translucent band. The photographed fans read as narrow, almost coplanar
// sheets of cable, so the angular half-width is capped instead of filling the
// whole gap to the neighbouring mast. The cap also keeps every landing south
// of the 2026 north-stand junction (the legacy roof there has been replaced).
export const MAST_FAN={towerStays:7,groundStays:5,halfWidthRad:.24,landingU:.34};
export function roofFans(masts){
 const tau=Math.PI*2;
 const towers=new Set(towerPositions().map(([x,z])=>`${x.toFixed(2)}|${z.toFixed(2)}`));
 const key=([x,z])=>`${x.toFixed(2)}|${z.toFixed(2)}`;
 const items=masts.map(([x,z],index)=>({index,t:mastFanAngle([x,z]),n:towers.has(key([x,z]))?MAST_FAN.towerStays:MAST_FAN.groundStays})).sort((a,b)=>a.t-b.t);
 return items.map((a,i)=>{const prev=items[(i+items.length-1)%items.length],next=items[(i+1)%items.length],back=(a.t-prev.t+tau)%tau,front=(next.t-a.t+tau)%tau,start=a.t-Math.min(back*.44,MAST_FAN.halfWidthRad),end=a.t+Math.min(front*.44,MAST_FAN.halfWidthRad);return {...a,angles:Array.from({length:a.n},(_,j)=>start+(end-start)*j/(a.n-1))};});
}
