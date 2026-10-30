using System.Linq;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace Dewhaven
{
    /// <summary>One catalogue owns road edges and the matching safe landings.</summary>
    public static class WorldPassages
    {
        private static JToken Link(string area,string other)=>ContentRegistry.Read("world")["passages"]?.FirstOrDefault(p=>((string)p["a"]==area&&(string)p["b"]==other)||((string)p["b"]==area&&(string)p["a"]==other));
        private static Vector2 Size(string id)
        {var d=ContentRegistry.Read("world")["exteriors"].First(x=>(string)x["id"]==id);return new Vector2((float)d["size"][0],(float)d["size"][1]);}
        private static Vector2 Direction(string side)=>side=="north"?Vector2.down:side=="south"?Vector2.up:side=="west"?Vector2.left:Vector2.right;
        private static Vector2 Position(string id,string side,float offset,float inset)
        {var size=Size(id);return side=="north"?new Vector2(offset,inset):side=="south"?new Vector2(offset,size.y-inset):side=="west"?new Vector2(inset,offset):new Vector2(size.x-inset,offset);}
        public static bool Connected(string area,string other)=>!string.IsNullOrEmpty(other)&&Link(area,other)!=null;
        public static Vector2 Edge(string area,string other)
        {var p=Link(area,other);string key=(string)p["a"]==area?"a":"b";return Position(area,(string)p[key+"Side"],(float)p[key+"Offset"],2.8f);}
        public static Vector2 Arrival(string target,string from)
        {var p=Link(target,from);if(p==null)return Vector2.zero;string key=(string)p["a"]==target?"a":"b";return Position(target,(string)p[key+"Side"],(float)p[key+"Offset"],8.3f);}
        public static void Attach(AreaDefinition area)
        {
            if(area.interior)return;
            foreach(var gate in area.anchors.Where(g=>g.kind=="travel"))
            {
                var p=Link(area.id,gate.target);if(p==null)continue;string key=(string)p["a"]==area.id?"a":"b";string side=(string)p[key+"Side"];float offset=(float)p[key+"Offset"];
                var edge=Position(area.id,side,offset,2.8f);var inner=Position(area.id,side,offset,9.3f);var direction=Direction(side);
                // Authored trails already reach the edge. Only clear the arrival/trigger corridor.
                Lane(area,inner,edge+direction*3);
                gate.position=edge;gate.arrival=Arrival(gate.target,area.id);gate.automatic=true;gate.outward=direction;
                gate.trigger=Mathf.Abs(direction.x)>0?new Rect(edge.x-1.4f,edge.y-2.25f,2.8f,4.5f):new Rect(edge.x-2.25f,edge.y-1.4f,4.5f,2.8f);
            }
        }
        private static void Lane(AreaDefinition a,Vector2 from,Vector2 to)
        {
            int steps=Mathf.Max(1,Mathf.CeilToInt(Vector2.Distance(from,to)*2));
            for(int i=0;i<=steps;i++)
            {
                Vector2 p=Vector2.Lerp(from,to,i/(float)steps);int cx=Mathf.RoundToInt(p.x),cy=Mathf.RoundToInt(p.y);
                for(int x=cx-1;x<=cx+1;x++)for(int y=cy-1;y<=cy+1;y++)if(x>=0&&y>=0&&x<a.width&&y<a.height)a.ground[x,y]=(byte)(a.ground[x,y]==2||a.ground[x,y]==7?7:1);
                a.props.RemoveAll(prop=>!prop.frame.StartsWith("house_")&&prop.solid&&Vector2.Distance(prop.position,p)<2.3f);
            }
        }
    }
    public sealed class RoadTravelPolicy
    {
        public bool Busy { get; private set; }
        private float readyAt;
        public bool TryStart(WorldAnchor gate,Vector2 position,Vector2 mapMovement,float now,bool paused,bool busy)
        {
            if(Busy||paused||busy||now<readyAt||gate==null||!gate.automatic||!gate.trigger.Contains(position)||mapMovement.sqrMagnitude<.04f||Vector2.Dot(mapMovement.normalized,gate.outward)<.45f)return false;
            Busy=true;return true;
        }
        public void Finish(float now){Busy=false;readyAt=now+.7f;}
        public void Reject(float now){Busy=false;readyAt=now+1.8f;}
    }
}
