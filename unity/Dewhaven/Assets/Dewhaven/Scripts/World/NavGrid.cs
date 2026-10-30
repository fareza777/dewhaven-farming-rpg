using System.Collections.Generic;
using UnityEngine;
namespace Dewhaven
{
    public static class NavGrid
    {
        private static readonly Vector2Int[] Directions={Vector2Int.up,Vector2Int.right,Vector2Int.down,Vector2Int.left};
        private struct Candidate {public Vector2Int cell;public int cost,score,distance;}
        private static bool Before(Candidate a,Candidate b)=>a.score<b.score||(a.score==b.score&&a.distance<b.distance);
        private static void Push(List<Candidate> heap,Candidate item)
        {
            heap.Add(item);int i=heap.Count-1;
            while(i>0){int parent=(i-1)/2;if(!Before(item,heap[parent]))break;heap[i]=heap[parent];i=parent;}heap[i]=item;
        }
        private static Candidate Pop(List<Candidate> heap)
        {
            var first=heap[0];var last=heap[heap.Count-1];heap.RemoveAt(heap.Count-1);if(heap.Count==0)return first;
            int i=0;while(i*2+1<heap.Count){int child=i*2+1;if(child+1<heap.Count&&Before(heap[child+1],heap[child]))child++;if(!Before(heap[child],last))break;heap[i]=heap[child];i=child;}heap[i]=last;return first;
        }
        public static List<Vector2> Route(AreaDefinition area,Vector2 start,Vector2 end,int limit=4096)
        {
            var s=new Vector2Int(Mathf.FloorToInt(start.x),Mathf.FloorToInt(start.y));
            var goal=new Vector2Int(Mathf.FloorToInt(end.x),Mathf.FloorToInt(end.y));
            s=Nearest(area,s);goal=Nearest(area,goal);
            var frontier=new List<Candidate>();var came=new Dictionary<Vector2Int,Vector2Int>();var cost=new Dictionary<Vector2Int,int>{{s,0}};
            int initial=Mathf.Abs(s.x-goal.x)+Mathf.Abs(s.y-goal.y);Push(frontier,new Candidate{cell=s,cost=0,score=initial,distance=initial});
            int searches=0;
            while(frontier.Count>0 && searches++<limit)
            {
                var candidate=Pop(frontier);var current=candidate.cell;if(cost[current]!=candidate.cost)continue;
                if(current==goal)
                {
                    var path=new List<Vector2>{new Vector2(goal.x+.5f,goal.y+.5f)};
                    while(came.TryGetValue(current,out var previous)){current=previous;path.Add(new Vector2(current.x+.5f,current.y+.5f));}
                    path.Reverse();return path;
                }
                foreach(var d in Directions)
                {
                    var n=current+d;if(!area.Walkable(n.x,n.y))continue;
                    byte tile=area.ground[n.x,n.y];int next=cost[current]+(tile==1||tile==6||tile==7?1:2);
                    if(cost.TryGetValue(n,out var old)&&old<=next)continue;
                    cost[n]=next;came[n]=current;int distance=Mathf.Abs(n.x-goal.x)+Mathf.Abs(n.y-goal.y);
                    Push(frontier,new Candidate{cell=n,cost=next,score=next+distance,distance=distance});
                }
            }
            return new List<Vector2>();
        }
        public static Vector2Int Nearest(AreaDefinition area,Vector2Int p)
        {
            if(area.Walkable(p.x,p.y))return p;
            for(int radius=1;radius<=8;radius++)for(int y=-radius;y<=radius;y++)for(int x=-radius;x<=radius;x++)if(area.Walkable(p.x+x,p.y+y))return p+new Vector2Int(x,y);
            return new Vector2Int(Mathf.RoundToInt(area.entry.x),Mathf.RoundToInt(area.entry.y));
        }
    }
}
