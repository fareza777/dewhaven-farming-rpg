using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace Dewhaven
{
    public sealed class WorldAnchor
    {
        public string id,kind,target,item,label;
        public Vector2 position,arrival;
        public bool automatic;
        public Vector2 outward;
        public Rect trigger;
        public float range=1.5f;
        public JToken data;
    }
    public sealed class WorldProp
    {
        public string id,frame,resource;
        public Vector2 position,size;
        public float scale=1;
        public bool solid;
        public Color tint=Color.white;
    }
    public sealed class AreaHazard { public Rect bounds;public string kind; }
    public sealed class AreaDefinition
    {
        public string id,name,style;
        public int width,height;
        public bool interior;
        public byte[,] ground;
        public bool[,] blocked;
        public Vector2 entry;
        public List<WorldAnchor> anchors=new List<WorldAnchor>();
        public List<WorldProp> props=new List<WorldProp>();
        public List<AreaHazard> hazards=new List<AreaHazard>();
        public JToken source;
        public bool Walkable(int x,int y) => x>1&&y>1&&x<width-2&&y<height-2&&!blocked[x,y]&&ground[x,y]!=2&&ground[x,y]!=4;
        public void RebuildBlockers()
        {
            blocked=new bool[width,height];
            foreach(var p in props.Where(p=>p.solid))
                for(int x=Mathf.FloorToInt(p.position.x-p.size.x*.5f);x<=Mathf.CeilToInt(p.position.x+p.size.x*.5f)-1;x++)
                    for(int y=Mathf.FloorToInt(p.position.y-p.size.y);y<Mathf.CeilToInt(p.position.y+.25f);y++)if(x>=0&&y>=0&&x<width&&y<height)blocked[x,y]=true;
        }
        public void Rect(int x,int y,int w,int h,byte tile)
        {
            for(int xx=Math.Max(0,x);xx<Math.Min(width,x+w);xx++)for(int yy=Math.Max(0,y);yy<Math.Min(height,y+h);yy++)ground[xx,yy]=tile;
        }
        public void Road(Vector2 from,Vector2 to,int half=1)
        {
            int steps=Mathf.CeilToInt(Vector2.Distance(from,to)*2);
            for(int i=0;i<=steps;i++) { var p=Vector2.Lerp(from,to,steps==0?0:i/(float)steps);Rect(Mathf.RoundToInt(p.x)-half,Mathf.RoundToInt(p.y)-half,half*2+1,half*2+1,1); }
        }
        public WorldProp Put(string frame,float x,float y,string id=null,bool solid=false,float scale=1,string resource=null)
        {
            var p=new WorldProp{frame=frame,position=new Vector2(x,y),id=id??this.id+":"+frame+"-"+props.Count,solid=solid,scale=scale,resource=resource,size=new Vector2(.7f,.45f)};
            if(frame.StartsWith("house_"))p.size=new Vector2(3.5f*scale,1.25f);
            if(frame.StartsWith("tree_")||frame.StartsWith("p/tree"))p.size=new Vector2(.6f,.45f);
            if(frame.StartsWith("room/table")||frame.StartsWith("room/bookshelf")||frame.StartsWith("room/bin"))p.size=new Vector2(1.65f*scale,.8f);
            if(frame=="room/bed")p.size=new Vector2(.8f,1.25f);
            props.Add(p);
            if(solid)
            {
                for(int xx=Mathf.FloorToInt(x-p.size.x*.5f);xx<=Mathf.CeilToInt(x+p.size.x*.5f)-1;xx++)
                    for(int yy=Mathf.FloorToInt(y-p.size.y);yy<Mathf.CeilToInt(y+.25f);yy++) if(xx>=0&&yy>=0&&xx<width&&yy<height)blocked[xx,yy]=true;
            }
            return p;
        }
        public void Anchor(string kind,string id,Vector2 position,string target=null,Vector2 arrival=default,string label=null,JToken data=null)
        {anchors.Add(new WorldAnchor{kind=kind,id=id,position=position,target=target,arrival=arrival,label=label,data=data});}
    }
    public static class RegionAuthoring
    {
        public static AreaDefinition Create(string id,GameState state)
        {
            var town=ContentRegistry.Find(ContentRegistry.Towns,id);
            var room=ContentRegistry.Find(ContentRegistry.Interiors,id);
            if(town!=null)return WorldDressing.Finish(Town(town,state),state);
            if(room!=null)return WorldDressing.Finish(Interior(room,state),state);
            if(ExplorationService.Complex(id)!=null)return VaultAuthoring.Create(id,state);
            if(id.StartsWith("mine-floor-"))return MineAuthoring.Create(id,state);
            if(id.Contains("-vault-")||id.Contains("-gallery-")||id.Contains("-observatory-")||id.StartsWith("mine-floor-"))return Cave(id,state);
            return WorldDressing.Finish(Outdoors(id,state),state);
        }
        private static AreaDefinition New(string id,string name,int w,int h,bool interior=false,string style=null)
        {return new AreaDefinition{id=id,name=name,width=w,height=h,interior=interior,style=style,ground=new byte[w,h],blocked=new bool[w,h]};}
        private static Vector2 Point(JToken p)=>new Vector2((float)p[0],(float)p[1]);
        internal static void House(AreaDefinition a,string id,string frame,Vector2 p,string room,int houseLevel=0)
        {
            a.Put(frame,p.x,p.y,id,true,1.35f);
            var definition=ContentRegistry.Find(ContentRegistry.Interiors,room);
            var dims=InteriorSize(definition==null?"home":(string)definition["style"],houseLevel);
            var inside=new Vector2(dims.x/2,dims.y-4);
            a.Anchor("door",id,p+new Vector2(0,1.1f),room,inside,"Enter");
        }
        private static AreaDefinition Town(JToken data,GameState state)
        {
            var a=New((string)data["id"],(string)data["name"],(int)data["size"][0],(int)data["size"][1]);a.source=data;a.entry=Point(data["entry"]);
            foreach(var water in data["water"])
            {
                if(water["rect"]!=null){var r=water["rect"];a.Rect((int)r[0],(int)r[1],(int)r[2],(int)r[3],2);}
                if(water["ellipse"]!=null){var e=water["ellipse"];Ellipse(a,(float)e[0],(float)e[1],(float)e[2],(float)e[3],2);}
                if(water["points"]!=null)
                {
                    var points=water["points"].ToArray();int radius=(int)water["width"]/2;
                    for(int i=1;i<points.Length;i++)PaintLine(a,Point(points[i-1]),Point(points[i]),radius,2);
                }
            }
            foreach(var road in data["roads"])LandscapeAuthoring.PaintTrail(a,road);
            foreach(var bridge in data["bridges"]??new JArray())a.Rect((int)bridge[0],(int)bridge[1],(int)bridge[2],(int)bridge[3],7);
            var plaza=Point(data["plaza"]);a.Rect((int)plaza.x-4,(int)plaza.y-3,9,7,6);
            foreach(var b in data["buildings"])
            {
                var p=Point(b["position"]);House(a,(string)b["id"],(string)b["frame"],p,(string)b["id"]);
                a.Road(p+new Vector2(0,1),p+new Vector2(0,4),1);
                if(b["shop"]!=null&&b["shop"].Type!=JTokenType.Null)a.Put("room/plant",p.x+2.6f,p.y+1.3f,null,false);
                a.Put("room/wildflowers-a",p.x-3.1f,p.y+.6f,null,false);
            }
            foreach(var exit in data["exits"])
            {
                string target=(string)exit[0];var p=new Vector2((float)exit[1],(float)exit[2]);
                a.Anchor("travel","to-"+target,p,target,EntryFor(target,a.id),"Travel");
            }
            a.Put("room/well",plaza.x,plaza.y-1,"town-well",true,1.15f);
            foreach(int dx in new[]{-4,4}) {a.Put("room/table",plaza.x+dx,plaza.y+3,null,true);a.Put("room/stool",plaza.x+dx-1,plaza.y+4.3f);}
            foreach(var garden in data["gardens"])
            {
                int x=(int)garden[0],y=(int)garden[1],w=(int)garden[2],h=(int)garden[3];
                for(int gx=x;gx<x+w;gx+=3)for(int gy=y;gy<y+h;gy+=3)if(Open(a,gx,gy,2))a.Put(a.id=="sunridge"?"tree_31":"room/flowers",gx,gy,null,a.id=="sunridge",1);
            }
            Scatter(a,70,state);
            return a;
        }
        public static Vector2 EntryFor(string target,string from=null)
        {
            if(WorldPassages.Connected(target,from))return WorldPassages.Arrival(target,from);
            var town=ContentRegistry.Find(ContentRegistry.Towns,target);
            if(town!=null)
            {
                var exit=town["exits"].FirstOrDefault(x=>(string)x[0]==from);
                if(exit!=null) return new Vector2((float)exit[1]+((float)exit[1]<20?3:(float)exit[1]>(int)town["size"][0]-20?-3:0),(float)exit[2]+((float)exit[2]<20?3:(float)exit[2]>(int)town["size"][1]-20?-3:0));
                return Point(town["entry"])+new Vector2(0,3);
            }
            var landscape=LandscapeAuthoring.Definition(target);
            return landscape!=null?Point(landscape["entry"]):new Vector2(16,24);
        }
        private static AreaDefinition Outdoors(string id,GameState state)=>LandscapeAuthoring.Create(id,state);
        private static AreaDefinition Interior(JToken data,GameState state)
        {
            bool studio=(string)data["id"]=="farmhouse"&&state.upgrades.TryGetValue("house",out int houseLevel)&&houseLevel>0;
            var size=InteriorSize((string)data["style"],studio?1:0);
            var a=New((string)data["id"],(string)data["name"],size.x,size.y,true,(string)data["style"]);a.source=data;a.entry=new Vector2(a.width/2,a.height-4);
            a.Rect(0,0,a.width,a.height,4);a.Rect(2,2,a.width-4,a.height-4,3);
            string town=(string)data["town"];var exterior=ContentRegistry.Find(ContentRegistry.Towns,town);
            var building=exterior?["buildings"]?.FirstOrDefault(x=>(string)x["id"]==a.id);
            Vector2 landing=building!=null?Point(building["position"])+new Vector2(0,2.5f):LandscapeAuthoring.CottageLanding(a.id);
            a.Anchor("door","outside",a.entry,town,landing,"Leave");
            a.Put("room/mat",a.entry.x,a.entry.y+.6f);
            int right=a.width-5;
            for(int x=4;x<a.width-3;x+=8)a.Put("window",x,3);
            a.Put("room/painting",a.width/2-2,3);a.Put("room/clock",a.width/2+2,5);
            for(int x=4;x<a.width-3;x+=7){a.Put("room/plant",x,a.height-5);a.Put("room/lamp",x,4);}
            if((a.style=="barn"||a.style=="inn"||a.style=="home")&&data["shop"]!=null&&data["shop"].Type!=JTokenType.Null)
            {
                float cx=a.width/2;
                for(int dx=-2;dx<=2;dx+=2)a.Put("room/table",cx+dx,10,"counter-"+dx,true);
                a.Anchor("shop","service-counter",new Vector2(cx,11.2f),(string)data["shop"],default,"Shop",data);
            }
            if(a.style=="home"||a.style=="inn")
            {
                a.Put("room/bed",right,8,"bed",true);a.Put("room/nightstand",right+1.5f,8,null,true);a.Put("room/dresser",right,4,null,true);
                a.Put("room/rug",right-.5f,10.5f,null,false,1.4f);if(a.id=="farmhouse")a.Anchor("sleep","bed",new Vector2(right-1,8.8f),null,default,"Sleep");
                else if(a.style=="inn")a.Anchor("rest","guest-rest",new Vector2(right-1,8.8f),null,default,"Guest rest");
                Partition(a,right-3,3,12,10);
                a.Put("room/stove",3,6,"kitchen",true);a.Put("room/sink",5,6,null,true);a.Put("room/fridge",2.7f,8,null,true);
                a.Anchor("cook","kitchen",new Vector2(4,7),null,default,"Cook");
                a.Put("room/rug",6,15.3f,null,false,1.8f);a.Put("room/table",6,14,null,true,1.3f);a.Put("room/chair",4.5f,15.5f);a.Put("room/chair",7.5f,15.5f);
                a.Put("room/table",right-1,18,"writing-desk",true);a.Put("room/chair",right-1,19.5f);a.Put("room/bookshelf",right,15,null,true);
                if(a.id=="farmhouse")a.Anchor("letter","grandmother-ledger",new Vector2(right-1,19.3f),null,default,"Read ledger");
                a.Put("room/bookshelf",4,3,null,true);a.Put("room/bin",3,a.height-6,"storage",true);if(a.id=="farmhouse")a.Anchor("storage","storage",new Vector2(3,a.height-5),null,default,"Storage");
            }
            else if(a.style=="barn")
            {
                for(int x=4;x<a.width-3;x+=6)
                {
                    a.Put("room/bin",x,7,null,true);a.Put("room/logpile",x+2,8,null,true);
                    for(int y=12;y<a.height-6;y+=4)a.Put("fence",x,y,null,true,1.4f);
                }
                a.Put("room/well",a.width-7,20,null,true);if(a.id=="barn")a.Anchor("animals","feed",new Vector2(a.width/2,16),null,default,"Care");
            }
            else
            {
                float cx=a.width/2,cy=10;
                if(data["shop"]!=null&&data["shop"].Type!=JTokenType.Null)
                {
                    for(int dx=-2;dx<=2;dx+=2)a.Put("room/table",cx+dx,cy,"counter-"+dx,true);
                    a.Anchor("shop","service-counter",new Vector2(cx,cy+1.2f),(string)data["shop"],default,"Browse stock",data);
                }
                for(int x=4;x<a.width-3;x+=5)a.Put(a.style=="forge"?"room/logpile":"room/bookshelf",x,4,null,true);
                if(a.style=="kitchen")
                {
                    for(int x=4;x<a.width-3;x+=5)a.Put(x%2==0?"room/stove":"room/sink",x,6,null,true);
                    for(int x=5;x<a.width-3;x+=8)for(int y=16;y<a.height-4;y+=6){a.Put("room/table",x,y,null,true);a.Put("room/stool",x-1,y+1.5f);a.Put("room/stool",x+1,y+1.5f);}
                    a.Anchor("cook","public-kitchen",new Vector2(4,7),null,default,"Cook");
                }
                else if(a.style=="forge")
                {
                    a.Put("room/stove",4,16,"furnace",true,1.5f);a.Put("room/table",10,18,"bench",true);a.Anchor("craft","bench",new Vector2(10,19),null,default,"Craft");
                    for(int x=15;x<a.width-3;x+=3)a.Put("room/bin",x,20,null,true);
                }
                else if(a.style=="study"||a.style=="hall"||a.style=="harbour")
                {
                    for(int x=4;x<a.width-3;x+=7){a.Put("room/table",x,14,null,true);a.Put("room/chair",x,15.5f);a.Put("room/bookshelf",x,a.height-6,null,true);}
                }
                else
                {
                    for(int x=4;x<a.width-3;x+=6){a.Put(a.style=="glasshouse"||a.style=="botanical"?"room/plant":"room/bin",x,16,null,true,1.2f);a.Put("room/rug",x,18);}
                    Partition(a,right-3,14,a.height-5,a.height-8);
                    a.Put("room/bed",right,21,null,true);a.Put("room/dresser",right,18,null,true);
                }
            }
            if(studio)
            {
                for(int x=2;x<a.width-2;x++)if(Math.Abs(x-a.width/2)>1)a.Rect(x,25,1,1,4);
                a.Put("room/rug",6,30,null,false,1.7f);a.Put("room/table",4.5f,29,"studio-workbench",true);
                a.Put("room/chair",4.5f,30.5f);a.Put("room/bookshelf",4,26,null,true);a.Put("room/plant",13,27);
                a.Put("room/table",13,30,"studio-desk",true);a.Put("room/chair",13,31.5f);a.Put("room/lamp",15,29);
                a.Anchor("craft","studio-workbench",new Vector2(4.5f,30),null,default,"Craft");
            }
            return a;
        }
        private static Vector2Int InteriorSize(string style,int houseLevel=0)
        {
            return style=="home"?new Vector2Int(18,houseLevel>0?36:28):style=="inn"?new Vector2Int(22,32):style=="hall"||style=="kitchen"||style=="harbour"?new Vector2Int(22,30):style=="barn"||style=="forge"?new Vector2Int(22,28):new Vector2Int(20,28);
        }
        private static void Partition(AreaDefinition a,int x,int from,int to,int door)
        {for(int y=from;y<=to;y++)if(Math.Abs(y-door)>1)a.Rect(x,y,1,1,4);}
        private static AreaDefinition Cave(string id,GameState state)
        {
            int floor=1;int.TryParse(id.Substring(id.LastIndexOf('-')+1),out floor);
            var a=New(id,id.StartsWith("mine")?"Copperleaf · Level "+floor:id.StartsWith("tide")?"Tide Vault":id.StartsWith("ember")?"Ember Gallery":"Sky Observatory",48,40,true,"cave");
            a.Rect(0,0,a.width,a.height,4);a.Rect(5,7,38,28,3);a.entry=new Vector2(22,32);
            string outside=id.StartsWith("mine")?"copperleaf-pass":id.StartsWith("tide")?"saltwind-cliffs":id.StartsWith("ember")?"ember-trail":"observatory-rise";
            string prefix=id.Substring(0,id.LastIndexOf('-')+1);
            if(floor==1)a.Anchor("door","return",a.entry,outside,new Vector2(outside=="observatory-rise"?56:64,20),"Return");
            else a.Anchor("door","previous",a.entry,prefix+(floor-1),new Vector2(22,12),"Previous chamber");
            if(floor<5)a.Anchor("door","deeper",new Vector2(22,10),prefix+(floor+1),new Vector2(22,31),"Descend");
            a.Put("room/ladder",22,32);a.Put("room/ladder",22,10);
            for(int i=0;i<24;i++)
            {
                int x=8+(i*11)%31,y=14+(i*7)%15;
                if(Math.Abs(x-22)<2)continue;
                a.Put(i%3==0?"rock_36":"rock_21",x,y,id+"-ore-"+i,true,1,id.StartsWith("mine")?(floor>3?"crystal":floor>1?"iron":"copper"):"stone");
            }
            if(!id.StartsWith("mine"))
            {
                for(int i=0;i<3;i++){var p=new Vector2(11+i*12,20);a.Put("room/stove",p.x,p.y,"mechanism-"+i,true);a.Anchor("mechanism","mechanism-"+i,p+Vector2.up,id,default,"Operate");}
                if(floor==5){a.Put("room/bin",22,13,"relic",true);a.Anchor("treasure","relic",new Vector2(22,14),id,default,"Open chest");}
            }
            return a;
        }
        private static void Ellipse(AreaDefinition a,float cx,float cy,float rx,float ry,byte tile)
        {for(int y=Math.Max(0,(int)(cy-ry));y<Math.Min(a.height,cy+ry);y++)for(int x=Math.Max(0,(int)(cx-rx));x<Math.Min(a.width,cx+rx);x++)if(Math.Pow((x-cx)/rx,2)+Math.Pow((y-cy)/ry,2)<1)a.ground[x,y]=tile;}
        private static void PaintLine(AreaDefinition a,Vector2 start,Vector2 end,int radius,byte tile)
        {int n=Mathf.CeilToInt(Vector2.Distance(start,end)*2);for(int i=0;i<=n;i++){var p=Vector2.Lerp(start,end,n==0?0:i/(float)n);a.Rect((int)p.x-radius,(int)p.y-radius,2*radius+1,2*radius+1,tile);}}
        private static bool Open(AreaDefinition a,int x,int y,int radius)
        {
            for(int xx=x-radius;xx<=x+radius;xx++)for(int yy=y-radius;yy<=y+radius;yy++)if(xx<3||yy<3||xx>=a.width-3||yy>=a.height-3||a.ground[xx,yy]!=0||a.blocked[xx,yy])return false;
            return a.props.All(p=>Vector2.Distance(p.position,new Vector2(x,y))>3.3f)&&a.anchors.All(p=>Vector2.Distance(p.position,new Vector2(x,y))>4);
        }
        private static void Scatter(AreaDefinition a,int amount,GameState state)
        {
            var random=new System.Random(StableHash(a.id));
            for(int i=0;i<amount*2;i++)
            {
                int x=random.Next(4,a.width-4),y=random.Next(5,a.height-4);
                if(!Open(a,x,y,1))continue;
                bool tree=i<amount;
                string frame=tree?(a.id=="briar-hollow"||a.id.Contains("pass")?"tree_13":i%3==0?"tree_31":i%2==0?"tree_04":"tree_03"):i%5==0?"room/flowers":i%2==0?"room/meadow-light-b":"room/wildflowers-a";
                a.Put(frame,x,y,null,tree,tree?1.05f:1,tree&&a.id=="forest"?"wood":null);
            }
            a.props.RemoveAll(p=>state.removed.Contains(p.id));
        }
        private static int StableHash(string s){unchecked{int h=17;foreach(char c in s)h=h*31+c;return h;}}
    }
}
