using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace Dewhaven
{
    /// <summary>Small, authored landscapes with useful trails and clustered edges.</summary>
    public static class LandscapeAuthoring
    {
        public static JToken Definition(string area)=>ContentRegistry.Read("landscapes")[area];
        private static Vector2 Point(JToken p)=>new Vector2((float)p[0],(float)p[1]);
        public static Vector2 CottageLanding(string room)
        {
            foreach(var area in ((JObject)ContentRegistry.Read("landscapes")).Properties())
                foreach(var home in area.Value["homes"])
                    if((string)home[0]==room)return new Vector2((float)home[2],(float)home[3]+2.5f);
            throw new InvalidOperationException("No exterior cottage for "+room);
        }
        public static Vector2 DungeonLanding(string area)
        {var gate=Definition(area)["dungeon"];return new Vector2((float)gate[1],(float)gate[2]+4.2f);}
        public static AreaDefinition Create(string id,GameState state)
        {
            var data=Definition(id);if(data==null)throw new InvalidOperationException("Unknown landscape "+id);
            var exterior=ContentRegistry.Read("world")["exteriors"].First(d=>(string)d["id"]==id);
            var a=new AreaDefinition{id=id,name=(string)exterior["name"],width=(int)data["size"][0],height=(int)data["size"][1],entry=Point(data["entry"]),source=data};
            a.ground=new byte[a.width,a.height];a.blocked=new bool[a.width,a.height];
            foreach(var water in data["water"])
            {
                if(water["ellipse"]!=null){var e=water["ellipse"];Disc(a,(float)e[0],(float)e[1],(float)e[2],(float)e[3],2);}
                if(water["rect"]!=null){var r=water["rect"];a.Rect((int)r[0],(int)r[1],(int)r[2],(int)r[3],2);}
                if(water["stream"]!=null)foreach(var p in Curve(water["stream"]))Disc(a,p.x,p.y,(float)water["width"]*.5f,(float)water["width"]*.5f,2);
            }
            foreach(var c in data["clearings"])Disc(a,(float)c[0],(float)c[1],(float)c[2],(float)c[3],(byte)c[4]);
            foreach(var road in data["roads"])PaintTrail(a,road);
            if(id=="forest"&&state.upgrades.TryGetValue("bridge",out int ownedBridge)&&ownedBridge>0)
                foreach(var road in data["upgradeRoads"])PaintTrail(a,road);
            foreach(var home in data["homes"])
                RegionAuthoring.House(a,(string)home[0],(string)home[1],new Vector2((float)home[2],(float)home[3]),(string)home[0],(string)home[0]=="farmhouse"&&state.upgrades.TryGetValue("house",out int level)?level:0);
            foreach(var prop in data["props"])
                a.Put((string)prop["frame"],(float)prop["position"][0],(float)prop["position"][1],(string)prop["id"],(bool)prop["solid"],(float)prop["scale"],(string)prop["resource"]);
            foreach(var spot in data["fishing"])a.Anchor("fish",(string)spot[0],new Vector2((float)spot[1],(float)spot[2]),null,default,"Cast line");
            if(id=="lake")a.Anchor("gathering","shared-table",new Vector2(23,44.5f),null,default,"Lake gathering");
            if(data["dungeon"]!=null)
            {
                var d=data["dungeon"];float x=(float)d[1],y=(float)d[2];
                a.Put("room/ruin-entry",x,y,"vault-gate",true,1.4f);
                a.Anchor("dungeon","vault-gate",new Vector2(x,y+2.2f),(string)d[0],new Vector2(22,32),id=="copperleaf-pass"?"Mine entrance":"Explore");
            }
            foreach(var pair in ContentRegistry.Read("world")["passages"].Where(p=>(string)p["a"]==id||(string)p["b"]==id))
            {
                string other=(string)pair["a"]==id?(string)pair["b"]:(string)pair["a"];
                a.Anchor("travel","to-"+other,WorldPassages.Edge(id,other),other,WorldPassages.Arrival(other,id),"Travel");
            }
            if(id=="farm")Homestead(a);
            foreach(var grove in data["groves"])Grove(a,grove);
            DressTrails(a,data);
            if(id=="forest"&&state.upgrades.TryGetValue("bridge",out int bridge)&&bridge>0)
            {a.Put("fence",59,17);a.Put("fence",61,21);a.Put("room/flowers",67,18);}
            a.RebuildBlockers();return a;
        }
        private static void Homestead(AreaDefinition a)
        {
            a.Rect(62,42,12,8,5);
            for(int x=62;x<=74;x++)if(x<65||x>67){a.Put("fence",x,42,null,true);a.Put("fence",x,50,null,true);}
            a.Anchor("shipping","shipping",new Vector2(54.7f,40),null,default,"Ship");
            a.Anchor("craft","workbench",new Vector2(49,40),null,default,"Craft");
            for(int i=0;i<22;i++)
            {
                var p=new Vector2(8+(i*19)%34,40+(i*13)%32);
                if(CanPlace(a,p,2))a.Put(i%2==0?"tree_03":"rock_21",p.x,p.y,"farm-resource-"+i,true,1,i%2==0?"wood":"stone");
            }
        }
        public static void Disc(AreaDefinition a,float cx,float cy,float rx,float ry,byte tile)
        {
            for(int y=Mathf.Max(0,Mathf.FloorToInt(cy-ry));y<=Mathf.Min(a.height-1,Mathf.CeilToInt(cy+ry));y++)
                for(int x=Mathf.Max(0,Mathf.FloorToInt(cx-rx));x<=Mathf.Min(a.width-1,Mathf.CeilToInt(cx+rx));x++)
                    if(Mathf.Pow((x-cx)/rx,2)+Mathf.Pow((y-cy)/ry,2)<=1)a.ground[x,y]=tile;
        }
        public static void PaintTrail(AreaDefinition a,JToken road)
        {foreach(var p in Curve(road))Trail(a,p,a.source?["plaza"]!=null?1.3f:a.id=="farm"?1.2f:1.05f);}
        private static void Trail(AreaDefinition a,Vector2 p,float radius)
        {
            for(int y=Mathf.FloorToInt(p.y-1.4f);y<=Mathf.CeilToInt(p.y+1.4f);y++)
                for(int x=Mathf.FloorToInt(p.x-1.4f);x<=Mathf.CeilToInt(p.x+1.4f);x++)
                    if(x>=0&&y>=0&&x<a.width&&y<a.height&&Vector2.Distance(new Vector2(x+.5f,y+.5f),p)<radius)
                        a.ground[x,y]=(byte)(a.ground[x,y]==2||a.ground[x,y]==7?7:1);
        }
        private static List<Vector2> Curve(JToken road)
        {
            var nodes=road.Select(Point).ToArray();var result=new List<Vector2>();
            for(int i=0;i<nodes.Length-1;i++)
            {
                var p0=nodes[Mathf.Max(0,i-1)];var p1=nodes[i];var p2=nodes[i+1];var p3=nodes[Mathf.Min(nodes.Length-1,i+2)];
                int steps=Mathf.Max(2,Mathf.CeilToInt(Vector2.Distance(p1,p2)*3));
                for(int j=0;j<=steps;j++){float t=j/(float)steps;result.Add(.5f*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t));}
            }
            return result;
        }
        private static bool CanPlace(AreaDefinition a,Vector2 p,float space,bool protectRoad=true)
        {
            int x=Mathf.RoundToInt(p.x),y=Mathf.RoundToInt(p.y);
            if(x<3||y<4||x>=a.width-3||y>=a.height-3||a.ground[x,y]!=0)return false;
            if(protectRoad)for(int xx=x-2;xx<=x+2;xx++)for(int yy=y-2;yy<=y+2;yy++)if(xx>=0&&yy>=0&&xx<a.width&&yy<a.height&&(a.ground[xx,yy]==1||a.ground[xx,yy]==7||a.ground[xx,yy]==5))return false;
            return !a.anchors.Any(n=>Vector2.Distance(n.position,p)<3)&&!a.props.Any(n=>Vector2.Distance(n.position,p)<space+(n.frame.StartsWith("house_")?3:0));
        }
        private static void Grove(AreaDefinition a,JToken g)
        {
            float cx=(float)g[0],cy=(float)g[1],rx=(float)g[2],ry=(float)g[3],spacing=(float)g[5];string frame=(string)g[4];int index=0;
            for(float y=cy-ry;y<=cy+ry;y+=spacing)for(float x=cx-rx;x<=cx+rx;x+=spacing)
            {
                index++;float jitter=Mathf.Sin(index*31.71f+cx)*.65f;var p=new Vector2(x+jitter,y+Mathf.Cos(index*17.3f)*.7f);
                if(Mathf.Pow((p.x-cx)/rx,2)+Mathf.Pow((p.y-cy)/ry,2)>1||!CanPlace(a,p,2.3f))continue;
                string id=a.id+":grove-"+Mathf.RoundToInt(cx*10)+"-"+Mathf.RoundToInt(cy*10)+"-"+index;
                a.Put(frame,p.x,p.y,id,true,1.05f+(index%4)*.1f,frame.StartsWith("tree_")?"wood":"stone");
                if(index%3==0)a.Put("room/wildflowers-a",p.x+1,p.y+1.1f,null,false,.75f);
            }
        }
        private static void DressTrails(AreaDefinition a,JToken data)
        {
            int index=0;
            foreach(var road in data["roads"])
            {
                var points=Curve(road);float travelled=0;
                for(int i=1;i<points.Count;i++)
                {
                    travelled+=Vector2.Distance(points[i-1],points[i]);if(travelled<6)continue;travelled=0;
                    var d=(points[i]-points[i-1]).normalized;var p=points[i]+new Vector2(-d.y,d.x)*(index%2==0?2.5f:-2.5f);index++;
                    if(!CanPlace(a,p,1.7f,false))continue;
                    bool forage=index%3==0;string resource=index%2==0?"berry":index%5==0?"mushroom":"flower";
                    a.Put(forage?(resource=="flower"?"room/flowers":"room/plant"):index%2==0?"room/wildflowers-b":"rock_21",p.x,p.y,a.id+(forage?":forage-trail-":":trail-detail-")+index,false,!forage&&index%2!=0?.45f:.85f,forage?resource:null);
                }
            }
        }
    }
}
