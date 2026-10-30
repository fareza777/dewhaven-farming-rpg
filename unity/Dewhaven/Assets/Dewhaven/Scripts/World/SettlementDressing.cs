using System.Linq;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace Dewhaven
{
    public static class SettlementDressing
    {
        private static Vector2 Point(JToken p)=>new Vector2((float)p[0],(float)p[1]);
        public static void Apply(AreaDefinition a)
        {
            var centre=Point(a.source["plaza"]);
            foreach(var building in a.source["buildings"])
            {
                var p=Point(building["position"]);
                a.Rect((int)p.x-3,(int)p.y+2,7,2,6);
                Place(a,a.id=="aster-quay"?"room/bin":"room/plant",p.x+3.5f,p.y+.9f,true,.85f);
                Place(a,"room/wildflowers-b",p.x-4,p.y+2,false,.9f);
                if(building["shop"]!=null&&building["shop"].Type!=JTokenType.Null)Place(a,"room/lamp",p.x+4,p.y+3.5f,false,.8f);
            }
            // A useful gathering spot sits beside the fountain, outside the walking line.
            a.Put("room/table",centre.x-4,centre.y+5,"shared-table",true,1.15f);
            a.Put("room/stool",centre.x-5.3f,centre.y+6.3f);a.Put("room/stool",centre.x-2.7f,centre.y+6.3f);
            a.Anchor("gathering","shared-table",centre+new Vector2(-4,6.5f),null,default,"Shared table");
            Place(a,"room/lamp",centre.x+5,centre.y-3,false,.9f);
            if(a.id=="village")
            {
                Garden(a,41,22,3,"tree_03");Garden(a,37,57,3,"tree_31");
                Bench(a,43,40);Bench(a,13,58);
                a.Put("room/wildflowers-a",50,24,null,false,1.2f);
            }
            if(a.id=="aster-quay")
            {
                // Stone quayside promenade; timber belongs only to the two piers.
                for(int x=6;x<70;x++)a.Rect(x,52,1,2,6);
                foreach(int x in new[]{48,61})
                {
                    a.Rect(x-2,52,5,12,7);a.Put("room/bin",x-1,54,null,true,.85f);a.Put("room/lamp",x+1.5f,62,null,false,.8f);
                    a.Anchor("fish","harbour-pier-"+x,new Vector2(x,61),null,default,"Cast line");
                }
                Bench(a,45,39);Garden(a,5,38,2,"room/plant");
            }
            if(a.id=="sunridge")
            {
                Garden(a,24,23,3,"tree_31");Garden(a,46,54,3,"tree_31");Garden(a,5,40,2,"tree_31");
                Bench(a,38,40);a.Put("room/flowers",51,22,null,false,1.1f);
                a.Put("room/wildflowers-b",29,56,null,false,1.3f);
            }
            if(a.id=="briar-hollow")
            {
                a.Rect(23,22,7,6,6);Bench(a,26,24);a.Put("room/flowers",24,27);
                Garden(a,39,58,3,"tree_03");Garden(a,58,40,2,"tree_03");
                Bench(a,40,40);a.Put("room/lamp",50,22,null,false,.9f);
            }
            // Sparse, authored roadside details keep sightlines open and the cities distinct.
            foreach(var road in a.source["roads"])
                for(int i=1;i<road.Count();i++)
                {
                    Vector2 p=Point(road[i-1]),q=Point(road[i]);int count=Mathf.FloorToInt(Vector2.Distance(p,q)/14);
                    var normal=new Vector2(-(q-p).y,(q-p).x).normalized;
                    for(int j=1;j<count;j++){var v=Vector2.Lerp(p,q,j/(float)count)+normal*3.2f;Place(a,j%2==0?"room/lamp":"room/wildflowers-a",v.x,v.y,false,.8f);}
                }
            // Woodland edges frame the streets without another empty perimeter road.
            for(float x=5;x<a.width-4;x+=5.3f)
            {
                Place(a,"tree_31",x,5+Mathf.Sin(x)*1.2f,true,1.05f);
                Place(a,"tree_03",x,a.height-5+Mathf.Cos(x)*.8f,true,1.1f);
            }
            for(float y=10;y<a.height-9;y+=6.2f)
            {
                Place(a,"tree_03",4+Mathf.Sin(y),y,true,1.05f);
                Place(a,"tree_31",a.width-5,y+Mathf.Cos(y),true,1.05f);
            }
        }
        private static void Bench(AreaDefinition a,float x,float y)
        {Place(a,"room/table",x,y,true,.8f);Place(a,"room/stool",x-1,y+1.3f);Place(a,"room/stool",x+1,y+1.3f);}
        private static void Garden(AreaDefinition a,float x,float y,int count,string frame)
        {for(int i=0;i<count;i++)Place(a,frame,x+i*3.2f,y+(i%2)*1.4f,frame.StartsWith("tree_"),.95f);}
        private static void Place(AreaDefinition a,string frame,float x,float y,bool solid=false,float scale=1)
        {
            int ix=(int)x,iy=(int)y;var p=new Vector2(x,y);
            if(!a.Walkable(ix,iy)||a.ground[ix,iy]==1||a.ground[ix,iy]==7||a.ground[ix,iy]==6||a.anchors.Any(n=>Vector2.Distance(n.position,p)<2.3f)||a.props.Any(n=>Vector2.Distance(n.position,p)<(n.frame.StartsWith("house_")?4:1.6f)))return;
            if(solid)for(int xx=Mathf.Max(0,ix-2);xx<=Mathf.Min(a.width-1,ix+2);xx++)for(int yy=Mathf.Max(0,iy-2);yy<=Mathf.Min(a.height-1,iy+2);yy++)if(a.ground[xx,yy]==1||a.ground[xx,yy]==7)return;
            a.Put(frame,x,y,null,solid,scale);
        }
    }
}
