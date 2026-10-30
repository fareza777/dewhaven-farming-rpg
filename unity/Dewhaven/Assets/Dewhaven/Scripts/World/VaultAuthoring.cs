using System;
using System.Linq;
using Newtonsoft.Json.Linq;
using UnityEngine;
namespace Dewhaven
{
    public static class VaultAuthoring
    {
        public static AreaDefinition Create(string id,GameState state)
        {
            var def=ExplorationService.Definition(id);int floor=ExplorationService.Floor(id);var room=def["chambers"][floor-1];
            int w=(int)room["size"][0],h=(int)room["size"][1],cx=w/2;
            string complex=(string)def["id"];bool tide=complex=="tide-vault",ember=complex=="ember-vault";
            var a=new AreaDefinition{id=id,name=(string)room["name"],width=w,height=h,interior=true,style="cave",ground=new byte[w,h],blocked=new bool[w,h],entry=new Vector2(cx,h-6),source=room};
            a.Rect(0,0,w,h,4);a.Rect(4,5,w-8,h-10,3);
            // The central dry spine and the return stair stay walkable in every puzzle state.
            if(floor==1)
            {
                a.Rect(cx-6,5,12,5,4);a.Rect(cx-2,5,5,7,3);
                for(int x=7;x<w-5;x+=6){a.Put(tide?"room/bookshelf":ember?"room/logpile":"room/painting",x,8,null,true,1.3f);a.Put("room/lamp",x,12);}
                a.Put("room/table",cx-8,19,"diagram-desk",true,1.5f);a.Put("room/chair",cx-8,21);
                a.Anchor("inspect","diagram",new Vector2(cx-8,20.4f),id,default,"Read diagram");
                a.Put("room/well",cx+8,18,null,true);a.Put("room/rug",cx+8,23,null,false,1.5f);
            }
            else if(floor==2)
            {
                a.Rect(7,13,w-14,h-25,2);a.Rect(cx-3,9,7,h-18,6);a.Rect(5,h/2-2,w-10,5,6);
                if(ember){a.Put("room/bin",cx-10,h/2-3,"ballast-left",true,1.8f);a.Put("room/bin",cx+10,h/2-3,"ballast-right",true,1.3f);}
                if(tide){a.Put("room/well",cx-11,h/2-3,"intake-pump",true,1.8f);a.Put("room/well",cx+11,h/2-3,"diversion-pump",true,1.3f);}
                if(!tide&&!ember)for(int x=9;x<w-7;x+=9)a.Put("mechanism/shutter",x,12,null,true,2);
            }
            else if(floor==3)
            {
                if(tide)
                {
                    for(int x=7;x<w-6;x+=8)if(Math.Abs(x-cx)>4){a.Put("room/bookshelf",x,10,null,true,1.6f);a.Put("room/bookshelf",x,16,null,true,1.6f);}
                    for(int i=0;i<2;i++){int rail=ExplorationService.Value(state,id+":control-"+i);float x=cx+(i==0?-10:10);a.Rect((int)x-1,19,3,12,6);a.Put("room/bin",x,20+rail*2,"captive-cart-"+i,true,1.6f);}
                }
                else if(ember)
                {
                    a.Rect(8,14,w-16,10,6);
                    for(int x=9;x<w-7;x+=10)a.Put("room/stove",x,11,null,true,2);
                    a.hazards.Add(new AreaHazard{bounds=new Rect(8,16,6,4),kind="heat"});
                    a.hazards.Add(new AreaHazard{bounds=new Rect(w-14,16,6,4),kind="heat"});
                }
                else
                {
                    for(int x=8;x<w-6;x+=10)a.Put("mechanism/gear",x,12,null,true,2.5f);
                    a.Rect(7,17,w-14,4,6);a.Rect(7,26,w-14,4,6);
                    a.Put("room/table",cx-10,22,null,true,1.7f);a.Put("room/table",cx+10,22,null,true,1.7f);
                }
            }
            else if(floor==4)
            {
                if(tide){a.Rect(5,13,w-10,4,2);a.Rect(cx-2,10,5,12,6);for(int x=8;x<w-5;x+=12)a.Put("room/well",x,12,null,true,1.3f);}
                else if(ember){a.Rect(6,14,w-12,3,6);for(int x=8;x<w-6;x+=8)a.Put("mechanism/reflector",x,10,null,true,2);a.Put("room/table",cx+8,22,null,true,1.5f);}
                else {a.Rect(6,10,w-12,4,2);a.Rect(cx-2,8,5,10,6);for(int x=8;x<w-5;x+=9)a.Put("mechanism/plate",x,21,null,false,1.8f);a.hazards.Add(new AreaHazard{bounds=new Rect(7,17,5,4),kind="gust"});}
            }
            else
            {
                a.Rect(4,5,w-8,5,4);a.Rect(cx-5,7,11,10,6);a.Rect(7,15,w-14,5,6);
                a.Put("room/rug",cx,16,null,false,2.5f);a.Put("room/bin",cx,12,"protected-instrument",true,1.7f);
                a.Anchor("treasure","relic",new Vector2(cx,13.5f),id,default,"Open instrument case");
                for(int x=7;x<w-5;x+=6){a.Put(tide?"room/bookshelf":ember?"room/dresser":"room/painting",x,8,null,true,1.2f);a.Put("room/lamp",x,21);}
                if(state.receipts.Contains("relic:"+complex))a.Anchor("door","shortcut",new Vector2(w-7,h-7),(string)def["approach"],ApproachLanding(def),"Return to daylight");
            }
            if(floor>=2&&floor<=4)
            {
                var puzzle=ExplorationService.Puzzle(id);int count=puzzle["controls"].Count();
                for(int i=0;i<count;i++)
                {
                    float x=cx+(i-(count-1)/2f)*6,y=h-12;
                    a.Put(tide?"mechanism/valve":ember?floor==3?"mechanism/vent":"mechanism/lever":"mechanism/gear",x,y,"control-"+i,true,1.7f);
                    a.Anchor("mechanism","control-"+i,new Vector2(x,y+1.2f),id,default,(string)puzzle["controls"][i]["label"]);
                }
                a.Put("room/table",6,h-9,"diagram-table",true);a.Anchor("puzzle","diagram",new Vector2(6,h-8),id,default,"Room diagram");
                a.Put("mechanism/lever",w-7,h-9,"release-handle",true,1.6f);a.Anchor("mechanism","release",new Vector2(w-7,h-7.8f),id,default,"Release gate");
                a.Anchor("mechanism","reset",new Vector2(6,h-5.5f),id,default,"Reset this room");
                if(!ExplorationService.Solved(state,id))a.Rect(cx-3,9,7,1,4);
            }
            a.Rect(cx-2,h-8,5,5,3);a.Put("room/ladder",cx,h-6);
            a.Anchor("door",floor==1?"return":"previous",a.entry,floor==1?(string)def["approach"]:complex+"-"+(floor-1),floor==1?ApproachLanding(def):new Vector2((int)def["chambers"][floor-2]["size"][0]/2,12),"Return stair");
            if(floor<5)
            {
                a.Put("room/ruin-entry",cx,7,"next-room",false,1.2f);
                a.Anchor("door","deeper",new Vector2(cx,10.7f),complex+"-"+(floor+1),Entry(complex+"-"+(floor+1)),"Next chamber");
            }
            if(floor==2&&tide)a.hazards.Add(new AreaHazard{bounds=new Rect(7,h/2-2,5,5),kind="tide"});
            return a;
        }
        public static Vector2 Entry(string area)
        {var d=ExplorationService.Definition(area);var r=d["chambers"][ExplorationService.Floor(area)-1];return new Vector2((int)r["size"][0]/2,(int)r["size"][1]-6);}
        public static Vector2 ApproachLanding(JToken def)
        {return LandscapeAuthoring.DungeonLanding((string)def["approach"]);}
    }
}
