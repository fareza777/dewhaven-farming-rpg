using System;
using UnityEngine;
namespace Dewhaven
{
    public static class MineAuthoring
    {
        public static AreaDefinition Create(string id,GameState state)
        {
            int floor=ExplorationService.Floor(id);string[] names={"The Cart Track","The Split Vein","The Iron Crossing","The Crystal Pockets","The Deep Seam"};
            int w=floor==3?60:floor==5?56:48,h=floor==4?52:44,cx=w/2;
            var a=new AreaDefinition{id=id,name="Copperleaf · "+names[floor-1],width=w,height=h,interior=true,style="cave",ground=new byte[w,h],blocked=new bool[w,h],entry=new Vector2(cx,h-6)};
            a.Rect(0,0,w,h,4);a.Rect(cx-3,7,7,h-10,3);a.Rect(7,h-14,w-14,10,3);
            if(floor==1){a.Rect(7,12,14,18,3);a.Rect(w-20,9,13,18,3);a.Rect(6,24,w-12,5,6);}
            if(floor==2){a.Rect(6,8,15,24,3);a.Rect(w-21,14,15,22,3);a.Rect(14,18,w-28,5,3);a.Rect(12,27,w-24,4,6);}
            if(floor==3){a.Rect(5,10,w-10,22,3);a.Rect(5,20,w-10,5,2);a.Rect(cx-3,17,7,12,6);a.Rect(10,17,4,12,6);a.Rect(w-14,17,4,12,6);}
            if(floor==4){for(int i=0;i<4;i++){int y=9+i*9;a.Rect(i%2==0?6:cx-1,y,cx-5,8,3);a.Rect(7,y+3,w-14,3,6);}}
            if(floor==5){a.Rect(6,9,w-12,14,3);a.Rect(9,23,w-18,5,6);a.Rect(8,28,12,8,3);a.Rect(w-20,28,12,8,3);}
            a.Put("room/ladder",cx,h-6);a.Put("room/ladder",cx,8);
            a.Anchor("door",floor==1?"return":"previous",a.entry,floor==1?"copperleaf-pass":"mine-floor-"+(floor-1),floor==1?LandscapeAuthoring.DungeonLanding("copperleaf-pass"):new Vector2((floor-1)==3?30:(floor-1)==5?28:24,11),"Climb up");
            a.Put("room/ladder",cx-5,h-7);a.Anchor("door","surface-lift",new Vector2(cx-5,h-6),"copperleaf-pass",LandscapeAuthoring.DungeonLanding("copperleaf-pass"),"Return to daylight");
            if(floor<5)a.Anchor("door","deeper",new Vector2(cx,9.5f),"mine-floor-"+(floor+1),new Vector2((floor+1)==3?30:(floor+1)==5?28:24,(floor+1)==4?46:38),"Descend");
            int count=0;
            for(int y=10;y<h-12;y+=4)for(int x=8;x<w-6;x+=5)
            {
                if(Math.Abs(x-cx)<5||!a.Walkable(x,y)||!a.Walkable(x,y+1)||a.anchors.Exists(n=>Vector2.Distance(n.position,new Vector2(x,y))<3))continue;
                string resource=floor>=4?(count%3==0?"crystal":"iron"):floor>=2?(count%3==0?"iron":"copper"):count%3==0?"stone":"copper";
                a.Put(resource=="crystal"?"rock_36":"rock_21",x,y,id+"-ore-"+count,true,1.2f,resource);count++;
            }
            a.Put("room/bin",cx+5,h-8,"cart-bay",true,1.5f);a.Put("room/lamp",cx+6,h-6);
            a.props.RemoveAll(p=>state.removed.Contains(p.id));a.RebuildBlockers();
            return a;
        }
    }
}
