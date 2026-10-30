using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace Dewhaven
{
    public sealed class WorldView : MonoBehaviour
    {
        public AreaDefinition Area { get; private set; }
        public Transform Actors { get; private set; }
        private Transform scenery;
        private readonly Dictionary<string,SpriteRenderer> plotViews=new Dictionary<string,SpriteRenderer>();
        private readonly Dictionary<string,GameObject> propViews=new Dictionary<string,GameObject>();
        private readonly List<GameObject> chunks=new List<GameObject>();
        private readonly List<Material> materials=new List<Material>();
        private readonly List<Mesh> meshes=new List<Mesh>();
        private Material groundMaterial,roomMaterial,pavingMaterial,stoneMaterial;
        private readonly List<SpriteRenderer> animalViews=new List<SpriteRenderer>();
        private LineRenderer route;
        private readonly List<SpriteRenderer> hazardViews=new List<SpriteRenderer>();
        private float hazardCooldown;
        public void Build(string id,GameState state)
        {
            foreach(Transform child in transform){child.gameObject.SetActive(false);Destroy(child.gameObject);}
            foreach(var mesh in meshes)Destroy(mesh);foreach(var mat in materials)Destroy(mat);
            meshes.Clear();materials.Clear();chunks.Clear();plotViews.Clear();propViews.Clear();animalViews.Clear();hazardViews.Clear();
            Area=RegionAuthoring.Create(id,state);ArtBank.Load();
            scenery=new GameObject("Scenery").transform;scenery.SetParent(transform,false);
            Actors=new GameObject("Actors").transform;Actors.SetParent(transform,false);
            var palette=Shader.Find("Dewhaven/Terrain Palette");
            groundMaterial=new Material(palette);groundMaterial.mainTexture=ArtBank.Terrain;materials.Add(groundMaterial);
            roomMaterial=new Material(palette);roomMaterial.SetFloat("_Saturation",.87f);roomMaterial.mainTexture=ArtBank.Get("room/floor").texture;materials.Add(roomMaterial);
            pavingMaterial=new Material(palette);pavingMaterial.mainTexture=Resources.Load<Texture2D>("Dewhaven/Art/Surfaces/paving");pavingMaterial.mainTexture.filterMode=FilterMode.Point;materials.Add(pavingMaterial);
            stoneMaterial=new Material(palette);stoneMaterial.mainTexture=Resources.Load<Texture2D>("Dewhaven/Art/Surfaces/stone");stoneMaterial.mainTexture.filterMode=FilterMode.Point;materials.Add(stoneMaterial);
            BuildGround();
            foreach(var prop in Area.props)
            {
                if(state.removed.Contains(prop.id))continue;
                var r=ArtBank.Actor(scenery,prop.frame.StartsWith("mechanism/")?"room/stool":prop.frame,prop.position,prop.scale);
                if(prop.frame=="fence"||prop.frame=="window"||prop.frame.StartsWith("mechanism/"))r.sprite=IconArt.World(prop.frame);
                r.color=prop.tint;r.gameObject.name=prop.id;propViews[prop.id]=r.gameObject;
                if(prop.solid)Solid(r.gameObject,prop.position-new Vector2(0,prop.size.y*.5f),prop.size);
                if(prop.frame.StartsWith("tree_")||prop.frame.StartsWith("house_"))Shadow(prop.position,prop.frame.StartsWith("house_")?3.5f:1.7f);
            }
            BuildWaterCollision();
            Solid(new GameObject("West boundary"),new Vector2(0,Area.height/2),new Vector2(3,Area.height));
            Solid(new GameObject("East boundary"),new Vector2(Area.width,Area.height/2),new Vector2(3,Area.height));
            Solid(new GameObject("North boundary"),new Vector2(Area.width/2,0),new Vector2(Area.width,3));
            Solid(new GameObject("South boundary"),new Vector2(Area.width/2,Area.height),new Vector2(Area.width,3));
            if(Area.id=="farm")foreach(var plot in state.plots)
            {
                var p=PlotPosition(plot,state);var soil=ArtBank.Actor(scenery,"room/floor",p+new Vector2(.5f,.9f));
                soil.sprite=IconArt.World("soil");soil.color=plot.watered?new Color(.55f,.5f,.42f):Color.white;soil.sortingOrder=-19900;
                soil.gameObject.name="Soil "+plot.id;plotViews["soil:"+plot.id]=soil;
                var crop=ArtBank.Actor(scenery,"crop_06/0",p+new Vector2(.5f,.85f));crop.gameObject.name="Crop "+plot.id;plotViews[plot.id]=crop;
            }
            if(Area.id=="farm"&&state.equipment!=null)foreach(var placed in state.equipment)
            {
                var plot=state.plots.FirstOrDefault(p=>p.id==placed.Value);if(plot==null)continue;
                var r=ArtBank.Actor(scenery,"room/stool",PlotPosition(plot,state)+new Vector2(.1f,.25f),.9f);r.sprite=IconArt.World(placed.Key.StartsWith("sprinkler:")?"equipment/sprinkler":"equipment/scarecrow");
            }
            if(Area.interior)BuildWallCollision();
            if(Area.id=="barn")for(int i=0;i<state.animals.Count;i++)
            {
                var animal=state.animals[i];string frame=animal.kind=="pig"?"pig/down/1":animal.kind=="rabbit"?"rabbit/down/1":"bird/down/1";
                var view=ArtBank.Actor(Actors,frame,new Vector2(6+i%3*6,14+i/3*5));view.gameObject.name="Animal · "+animal.name;animalViews.Add(view);
            }
            UpdatePlots(state);Physics2D.SyncTransforms();
            BuildHazards();
        }
        private void Update()
        {
            var game=DewhavenGame.Instance;if(game==null||game.State==null||game.Clock.IsPaused)return;
            UpdateHazards(game);
            for(int i=0;i<animalViews.Count;i++)
            {
                var view=animalViews[i];if(!view)continue;
                float t=Time.time*.6f+i*3;view.transform.position=new Vector3(6+i%3*6+Mathf.Sin(t)*.7f,-14-i/3*5+Mathf.Cos(t)*.35f,0);
                view.sortingOrder=Mathf.RoundToInt(-view.transform.position.y*20)+1;
                string family=game.State.animals[i].kind=="pig"?"pig":game.State.animals[i].kind=="rabbit"?"rabbit":"bird";
                view.sprite=ArtBank.Get(family+"/"+(Mathf.Cos(t)>0?"right":"left")+"/"+((int)(Time.time*4)%3));
            }
        }
        private void BuildHazards()
        {
            foreach(var hazard in Area.hazards)
            {
                var go=new GameObject("Announced "+hazard.kind+" crossing");go.transform.SetParent(scenery,false);
                go.transform.position=new Vector3(hazard.bounds.center.x,-hazard.bounds.center.y,0);go.transform.localScale=new Vector3(hazard.bounds.width,hazard.bounds.height,1);
                var r=go.AddComponent<SpriteRenderer>();r.sprite=ArtBank.Shape("ring");r.sharedMaterial=ArtBank.WorldMaterial;r.sortingOrder=-19850;hazardViews.Add(r);
            }
        }
        private void UpdateHazards(DewhavenGame game)
        {
            hazardCooldown=Mathf.Max(0,hazardCooldown-Time.unscaledDeltaTime);
            for(int i=0;i<Area.hazards.Count;i++)
            {
                var hazard=Area.hazards[i];float phase=(Time.time+i*1.7f)%8;bool warning=phase>=3&&phase<5,active=phase>=5&&phase<6.6f;
                if(i<hazardViews.Count)hazardViews[i].color=hazard.kind=="heat"?new Color(.95f,.56f,.18f,active?.65f:warning?.35f:.12f):new Color(.48f,.78f,.86f,active?.6f:warning?.35f:.12f);
                if(active&&hazardCooldown<=0&&hazard.bounds.Contains(game.Player.MapPosition))
                {hazardCooldown=10;game.State.energy=Mathf.Max(0,game.State.energy-8);game.Player.Warp(Area.entry);game.Controls.Clear();game.Player.Tool.Cancel();game.Sound.Play("water");game.Save();game.UI.Toast("Back at the dry landing  ·  −8 energy. Your bag and solved rooms are kept.",5);break;}
            }
        }
        public static Vector2 PlotPosition(PlotState plot,GameState state)
        {
            int index=state.plots.IndexOf(plot);
            if(plot.id.StartsWith("extra-")&&int.TryParse(plot.id.Substring(6),out int extra))return new Vector2(64+extra%6,52+extra/6);
            return new Vector2(64+index%8,44+index/8);
        }
        private void Solid(GameObject go,Vector2 center,Vector2 size)
        {
            if(go.transform.parent==null)go.transform.SetParent(scenery,false);
            go.layer=8;
            var box=go.AddComponent<BoxCollider2D>();box.size=size;
            Vector2 native=new Vector2(center.x,-center.y);
            box.offset=go.transform.InverseTransformPoint(native);
            // InverseTransformPoint accounts for scaled art; size must remain in world units.
            box.size=new Vector2(size.x/go.transform.lossyScale.x,size.y/go.transform.lossyScale.y);
        }
        private void Shadow(Vector2 p,float width)
        {
            var go=new GameObject("Ground shade");go.transform.SetParent(scenery,false);go.transform.position=new Vector3(p.x+.3f,-p.y-.05f,0);go.transform.localScale=new Vector3(width,.42f,1);
            var r=go.AddComponent<SpriteRenderer>();r.sprite=ArtBank.Shape("shadow");r.sharedMaterial=ArtBank.WorldMaterial;r.color=new Color(.15f,.21f,.19f,.2f);r.sortingOrder=-19950;
        }
        private void BuildWaterCollision()
        {
            for(int y=2;y<Area.height-2;y++)for(int x=2;x<Area.width-2;x++)
            {
                if(Area.ground[x,y]!=2)continue;
                int start=x;while(x+1<Area.width-2&&Area.ground[x+1,y]==2)x++;
                Solid(new GameObject("Riverbank"),new Vector2((start+x+1)*.5f,y+.5f),new Vector2(x-start+1,1));
            }
        }
        private void BuildWallCollision()
        {
            for(int y=0;y<Area.height;y++)for(int x=0;x<Area.width;x++)
            {
                if(Area.ground[x,y]!=4)continue;
                int start=x;while(x+1<Area.width&&Area.ground[x+1,y]==4)x++;
                Solid(new GameObject("Wall"),new Vector2((start+x+1)*.5f,y+.5f),new Vector2(x-start+1,1));
            }
        }
        private sealed class MeshBatch
        {
            public readonly List<Vector3> vertices=new List<Vector3>();
            public readonly List<Vector2> uv=new List<Vector2>();
            public readonly List<int> triangles=new List<int>();
            public readonly List<Color> colors=new List<Color>();
            public void Quad(float x,float y,float w,float h,Rect tex,Color color)
            {
                int n=vertices.Count;vertices.Add(new Vector3(x,-y));vertices.Add(new Vector3(x+w,-y));vertices.Add(new Vector3(x+w,-y-h));vertices.Add(new Vector3(x,-y-h));
                uv.Add(new Vector2(tex.xMin,tex.yMax));uv.Add(new Vector2(tex.xMax,tex.yMax));uv.Add(new Vector2(tex.xMax,tex.yMin));uv.Add(new Vector2(tex.xMin,tex.yMin));
                triangles.AddRange(new[]{n,n+1,n+2,n+2,n+3,n});for(int i=0;i<4;i++)colors.Add(color);
            }
        }
        private void BuildGround()
        {
            for(int cy=0;cy<Area.height;cy+=32)for(int cx=0;cx<Area.width;cx+=32)
            {
                var outdoor=new MeshBatch();var indoor=new MeshBatch();var pavement=new MeshBatch();var stone=new MeshBatch();
                for(int y=cy;y<Mathf.Min(cy+32,Area.height);y++)for(int x=cx;x<Mathf.Min(cx+32,Area.width);x++)
                {
                    byte tile=Area.ground[x,y];
                    if(!Area.interior)
                    {
                        float light=.96f+Mathf.PerlinNoise(x*.11f,y*.11f)*.05f;
                        outdoor.Quad(x,y,1,1,TerrainUV(0,255),new Color(light,light*.98f,light*.91f));
                        if(tile==1||tile==2)outdoor.Quad(x,y,1,1,TerrainUV(tile==1?1:4,Mask(x,y,tile)),Color.white);
                        if(tile==6)pavement.Quad(x,y,1,1,new Rect(0,0,1,.2f),new Color(1,.91f,.72f));
                        if(tile==7)indoor.Quad(x,y,1,1,SpriteUV(ArtBank.Get("room/floor")),new Color(.84f,.73f,.54f));
                        if(tile==0)
                        {
                            float random=Hash(x,y);
                            string name=random<.018f?"room/wildflowers-a":random<.035f?"room/wildflowers-b":random>.95f?"room/meadow-light-b":random>.91f?"room/meadow-dark-b":null;
                            if(name!=null)
                            {
                                var sprite=ArtBank.Get(name);int w=Mathf.RoundToInt(sprite.rect.width/16),h=Mathf.RoundToInt(sprite.rect.height/16);bool clear=true;
                                for(int yy=y;yy<y+h;yy++)for(int xx=x;xx<x+w;xx++)if(xx>=Area.width||yy>=Area.height||Area.ground[xx,yy]!=0)clear=false;
                                if(clear)indoor.Quad(x,y,w,h,SpriteUV(sprite),new Color(.97f,.98f,.90f,.8f));
                            }
                        }
                    }
                    else
                    {
                        if(tile==2)outdoor.Quad(x,y,1,1,TerrainUV(4,Mask(x,y,tile)),Color.white);
                        if(tile==6)pavement.Quad(x,y,1,1,new Rect(0,0,1,.2f),new Color(.94f,.90f,.79f));
                        if(tile==3&&Area.style=="cave")stone.Quad(x,y,1,1,new Rect(0,0,1,.2f),new Color(.97f,.97f,.94f));
                        else if(tile==3)indoor.Quad(x,y,1,1,SpriteUV(ArtBank.Get("room/floor")),(x+y)%2==0?Color.white:new Color(.96f,.96f,.94f));
                        if(tile==4 && y+1<Area.height && Area.ground[x,y+1]==3)indoor.Quad(x,y,1,1,SpriteUV(ArtBank.Get(Area.style=="cave"?"room/cave-wall":"room/wall-1")),Color.white);
                        if(tile==4 && x+1<Area.width && Area.ground[x+1,y]==3)indoor.Quad(x,y,1,1,SpriteUV(ArtBank.Get("room/wall-3")),Color.white);
                        if(tile==4 && x>0 && Area.ground[x-1,y]==3)indoor.Quad(x,y,1,1,SpriteUV(ArtBank.Get("room/wall-5")),Color.white);
                    }
                }
                var group=new GameObject("Ground chunk "+cx+","+cy);group.transform.SetParent(scenery,false);chunks.Add(group);
                BuildMesh(group.transform,outdoor,groundMaterial);BuildMesh(group.transform,indoor,roomMaterial);
                BuildMesh(group.transform,pavement,pavingMaterial);BuildMesh(group.transform,stone,stoneMaterial);
            }
        }
        private void BuildMesh(Transform parent,MeshBatch batch,Material material)
        {
            if(batch.vertices.Count==0)return;
            var go=new GameObject("Batched tiles");go.transform.SetParent(parent,false);
            var mesh=new Mesh();mesh.SetVertices(batch.vertices);mesh.SetUVs(0,batch.uv);mesh.SetColors(batch.colors);mesh.SetTriangles(batch.triangles,0);mesh.RecalculateBounds();meshes.Add(mesh);
            go.AddComponent<MeshFilter>().sharedMesh=mesh;var r=go.AddComponent<MeshRenderer>();r.sharedMaterial=material;r.sortingOrder=material==groundMaterial?-30000:-29999;
        }
        private static Rect SpriteUV(Sprite sprite)
        {var r=sprite.rect;return new Rect((r.x+.25f)/sprite.texture.width,(r.y+.25f)/sprite.texture.height,(r.width-.5f)/sprite.texture.width,(r.height-.5f)/sprite.texture.height);}
        private static Rect TerrainUV(int block,int mask)
        {
            int index=block*256+mask,cols=ArtBank.Terrain.width/16;return new Rect((index%cols*16f+.5f)/ArtBank.Terrain.width,1-((index/cols+1)*16f-.5f)/ArtBank.Terrain.height,15f/ArtBank.Terrain.width,15f/ArtBank.Terrain.height);
        }
        private int Mask(int x,int y,byte tile)
        {
            int mask=0;int[] dx={0,1,1,1,0,-1,-1,-1},dy={-1,-1,0,1,1,1,0,-1};
            for(int i=0;i<8;i++){int xx=x+dx[i],yy=y+dy[i];if(xx<0||yy<0||xx>=Area.width||yy>=Area.height||Area.ground[xx,yy]==tile)mask|=1<<i;}return mask;
        }
        public void UpdatePlots(GameState state)
        {
            if(Area.id!="farm")return;
            foreach(var p in state.plots)
            {
                if(!plotViews.TryGetValue(p.id,out var view))continue;
                plotViews["soil:"+p.id].enabled=p.tilled;
                plotViews["soil:"+p.id].color=p.watered?new Color(.62f,.62f,.64f):Color.white;
                view.enabled=!string.IsNullOrEmpty(p.crop);
                if(!view.enabled)continue;
                var crop=ContentRegistry.Crops[p.crop];int stages=(int)crop["stages"];
                int stage=Mathf.Clamp(Mathf.FloorToInt(p.growth/(float)(int)crop["days"]*(stages-1)),0,stages-1);
                view.sprite=ArtBank.Get((string)crop["sheet"]+"/"+stage);
            }
        }
        public void RemoveProp(string id)
        {
            if(propViews.TryGetValue(id,out var go)){Destroy(go);propViews.Remove(id);}
            var prop=Area.props.FirstOrDefault(p=>p.id==id);
            if(prop!=null)for(int x=Mathf.FloorToInt(prop.position.x-prop.size.x*.5f);x<=Mathf.CeilToInt(prop.position.x+prop.size.x*.5f)-1;x++)for(int y=Mathf.FloorToInt(prop.position.y-prop.size.y);y<Mathf.CeilToInt(prop.position.y+.25f);y++)if(x>=0&&y>=0&&x<Area.width&&y<Area.height)Area.blocked[x,y]=false;
            Area.props.RemoveAll(p=>p.id==id);
        }
        private static float Hash(int x,int y){unchecked{uint n=(uint)(x*374761393+y*668265263);n=(n^(n>>13))*1274126177;return (n%10000)/10000f;}}
        public void ShowRoute(List<Vector2> path)
        {
            if(route)Destroy(route.gameObject);
            if(path.Count<2)return;
            var go=new GameObject("Selected walking route");go.transform.SetParent(scenery,false);route=go.AddComponent<LineRenderer>();
            route.sharedMaterial=ArtBank.WorldMaterial;route.startColor=route.endColor=new Color(.85f,.65f,.3f,.7f);route.startWidth=route.endWidth=.10f;route.sortingOrder=-19800;
            route.positionCount=path.Count;route.SetPositions(path.Select(p=>new Vector3(p.x,-p.y,0)).ToArray());route.numCapVertices=2;route.numCornerVertices=2;
        }
    }
}
