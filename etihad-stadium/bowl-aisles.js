// Shared schematic aisle axes for seat reservation and rendered tread placement.
// Number, width and block boundaries require a current seat/egress plan for calibration.
export const AISLE_LAYOUT={count:36,treadWidth:1.10,seatWidth:.45,seatClearance:.07,evidence:'C'};
export function isAisleSeat(u,perimeter){
 const phase=((u*AISLE_LAYOUT.count+.5)%1)-.5;
 const along=Math.abs(phase)*perimeter/AISLE_LAYOUT.count;
 return along<AISLE_LAYOUT.treadWidth/2+AISLE_LAYOUT.seatWidth/2+AISLE_LAYOUT.seatClearance;
}
export function aisleFrame(curve,index){
 const u=index/AISLE_LAYOUT.count,q=curve.getPoint(u);
 const a=curve.getPoint((u-1e-5+1)%1),b=curve.getPoint((u+1e-5)%1);
 return {point:q,yaw:Math.atan2(-(b.y-a.y),b.x-a.x)};
}
