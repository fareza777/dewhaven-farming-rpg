using System.Linq;
using Newtonsoft.Json.Linq;
using UnityEngine;
namespace Dewhaven
{
    public static class DungeonForecourts
    {
        public static void Apply(AreaDefinition a)
        {
            var gate=a.anchors.FirstOrDefault(n=>n.kind=="dungeon");if(gate==null)return;
            float x=gate.position.x,y=gate.position.y-2.2f;
            a.props.RemoveAll(p=>p.id!="vault-gate"&&Vector2.Distance(p.position,new Vector2(x,y+6))<7);
            LandscapeAuthoring.Disc(a,x,y+7,8,6,6);
            foreach(int side in new[]{-1,1})
            {
                for(int i=0;i<3;i++)a.Put(a.id=="ember-trail"?"rock_36":"rock_21",x+side*(7+i%2),y-1+i*4,null,true,1.25f);
                a.Put("room/lamp",x+side*4.5f,y+5,null,false,.85f);
                a.Put("room/wildflowers-a",x+side*6,y+11,null,false,1.1f);
            }
            a.Put("room/table",x+6,y+14,"trail-rest",true,.85f);a.Put("room/stool",x+6,y+15.5f);
            string name=a.id=="saltwind-cliffs"?"The tide watch":a.id=="ember-trail"?"Glassworkers' court":a.id=="observatory-rise"?"The upper shelter":"Copperleaf minehead";
            string copy=a.id=="saltwind-cliffs"?"The high-water marks end below these steps. The Tide Vault waits beyond the watchkeepers' gate.":a.id=="ember-trail"?"The old delivery trail ends at the glassworkers' gate. Bring a pick and a meal for the galleries.":a.id=="observatory-rise"?"The last sheltered landing overlooks the valley. The observatory lies beyond the upper gate.":"The cart trail ends at the copper seam. Keep enough energy for the return to daylight.";
            a.Anchor("landmark","approach-story",new Vector2(x+6,y+16),null,default,name,new JObject{{"description",copy}});
        }
    }
}
