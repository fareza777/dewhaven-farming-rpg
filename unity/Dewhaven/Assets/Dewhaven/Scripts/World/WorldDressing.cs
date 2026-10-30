using System;
using System.Linq;
using Newtonsoft.Json.Linq;
using UnityEngine;
namespace Dewhaven
{
    public static class WorldDressing
    {
        public static AreaDefinition Finish(AreaDefinition a,GameState s)
        {
            if(a.source?["plaza"]!=null)SettlementDressing.Apply(a);
            if(!a.interior)DungeonForecourts.Apply(a);
            if(a.interior)Interior(a,s);
            foreach(var site in ContentRegistry.Read("worksites").Where(x=>(string)x["area"]==a.id))
            {
                if(a.id=="farm"&&((string)site["id"]).StartsWith("convoy-"))continue;
                var p=Point(site["position"]);ClearFloor(a,p,1);
                a.props.RemoveAll(prop=>prop.solid&&Vector2.Distance(prop.position,p)<3);
                a.blocked=new bool[a.width,a.height];
                foreach(var prop in a.props.Where(prop=>prop.solid))
                    for(int xx=Mathf.FloorToInt(prop.position.x-prop.size.x*.5f);xx<=Mathf.CeilToInt(prop.position.x+prop.size.x*.5f)-1;xx++)
                        for(int yy=Mathf.FloorToInt(prop.position.y-prop.size.y);yy<Mathf.CeilToInt(prop.position.y+.25f);yy++)if(xx>=0&&yy>=0&&xx<a.width&&yy<a.height)a.blocked[xx,yy]=true;
                if(!s.receipts.Contains("site:"+(string)site["id"]))a.Put((string)site["frame"],p.x,p.y-1,(string)site["id"],true,1);
                a.Anchor("worksite",(string)site["id"],p,null,default,(string)site["label"],site);
            }
            // Landings and service approach cells stay clear after decoration, before colliders are made.
            foreach(var anchor in a.anchors)
            {
                int x=Mathf.FloorToInt(anchor.position.x),y=Mathf.FloorToInt(anchor.position.y);
                if(x>1&&x<a.width-2&&y>1&&y<a.height-2){if(a.ground[x,y]==2||a.ground[x,y]==4)a.ground[x,y]=(byte)(a.interior?3:1);}
            }
            a.props.RemoveAll(p=>s.removed.Contains(p.id));WorldPassages.Attach(a);a.RebuildBlockers();return a;
        }
        private static Vector2 Point(JToken p)=>new Vector2((float)p[0],(float)p[1]);
        private static void ClearFloor(AreaDefinition a,Vector2 p,int radius)
        {a.Rect((int)p.x-radius,(int)p.y-radius,radius*2+1,radius*2+1,(byte)(a.interior?3:1));}
        private static void SafeProp(AreaDefinition a,string frame,float x,float y,bool solid=false,float scale=1)
        {
            int ix=(int)x,iy=(int)y;if(!a.Walkable(ix,iy)||a.ground[ix,iy]==1||a.anchors.Any(n=>Vector2.Distance(n.position,new Vector2(x,y))<2.5f)||a.props.Any(p=>Vector2.Distance(p.position,new Vector2(x,y))<2))return;
            a.Put(frame,x,y,null,solid,scale);
        }
        private static void Interior(AreaDefinition a,GameState s)
        {
            // Each venue gets a useful activity rather than another remote menu action.
            if(a.id=="ranch")a.Anchor("adopt","animal-register",new Vector2(a.width/2,11.2f),null,default,"Ranch register");
            if(a.id=="clinic"){a.Put("room/bed",6,17,null,true);a.Anchor("rest","clinic-rest",new Vector2(7,18),null,default,"Rest & recover");}
            if(a.id=="farmhouse"&&!string.IsNullOrEmpty(s.partner))a.Anchor("household","home-table",new Vector2(6,15.5f),s.partner,default,"Time together");
            if(a.id=="quay-inn"||a.id=="mountain-lodge")a.Anchor("rest","guest-rest",new Vector2(a.width-6,11),null,default,"Guest rest");
            if(a.id=="presshouse"||a.id=="drying-house")a.Anchor("cook","preserving-bench",new Vector2(10,19),null,default,"Prepare food");
            string[] shared={"community-kitchen","quay-inn","presshouse","library"};int index=Array.IndexOf(shared,a.id);
            string[] keys={"village","quay","orchard","archive"};
            if(index>=0&&s.upgrades.ContainsKey("shared-room-"+keys[index]))
            {
                a.Put("room/rug",a.width/2,a.height-7,null,false,2);a.Put("room/flowers",a.width-5,a.height-6);a.Put("room/lamp",a.width-6,a.height-9);
                a.Anchor("rest","traveller-bench",new Vector2(a.width/2,a.height-6),null,default,"Shared-room rest");
            }
        }
    }
}
