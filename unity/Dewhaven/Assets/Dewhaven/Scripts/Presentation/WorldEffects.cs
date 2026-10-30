using System.Collections.Generic;
using UnityEngine;
namespace Dewhaven
{
    public sealed class WorldEffects : MonoBehaviour
    {
        private sealed class Mote { public SpriteRenderer view;public Vector2 velocity;public float age,life,size;public bool ring;public Color color; }
        private readonly List<Mote> motes=new List<Mote>();
        public void Burst(string kind,Vector2 point,Vector2 direction)
        {
            bool water=kind=="water";int count=water?18:kind=="hand"?10:12;
            for(int i=0;i<count;i++)
            {
                var m=Take();m.life=water?.6f:kind=="hand"?.8f:.55f;m.age=0;m.ring=false;
                m.color=water?new Color(.62f,.85f,.92f,.9f):kind=="hand"?new Color(.95f,.82f,.46f):new Color(.72f,.56f,.36f,.9f);
                m.velocity=Random.insideUnitCircle*(water?1.6f:1.9f)+new Vector2(direction.x,-direction.y)*.6f+Vector2.up*.5f;
                m.size=water?.07f:.09f;m.view.sprite=ArtBank.Shape("circle");m.view.transform.position=new Vector3(point.x,-point.y+.1f,0);m.view.sortingOrder=Mathf.RoundToInt(point.y*20)+15;
                m.view.color=m.color;m.view.transform.localScale=Vector3.one*m.size;
            }
            if(water)
            {
                var m=Take();m.ring=true;m.age=0;m.life=1.65f;m.size=.2f;m.color=new Color(.6f,.86f,.92f,.75f);m.velocity=Vector2.zero;
                m.view.sprite=ArtBank.Shape("ring");m.view.transform.position=new Vector3(point.x,-point.y,0);m.view.sortingOrder=Mathf.RoundToInt(point.y*20)+3;
                m.view.color=m.color;m.view.transform.localScale=new Vector3(.25f,.1125f,1);
            }
        }
        private Mote Take()
        {
            var mote=motes.Find(m=>!m.view.enabled);
            if(mote==null)
            {
                if(motes.Count>=96)mote=motes[0];
                else {var go=new GameObject("Pooled world effect");go.transform.SetParent(transform,false);var view=go.AddComponent<SpriteRenderer>();view.sharedMaterial=ArtBank.WorldMaterial;mote=new Mote{view=view};motes.Add(mote);}
            }
            mote.view.enabled=true;return mote;
        }
        private void Update()
        {
            var game=DewhavenGame.Instance;if(!game||game.Clock==null||game.Clock.IsPaused)return;
            float dt=Mathf.Min(Time.unscaledDeltaTime,.08f);
            foreach(var m in motes)
            {
                if(!m.view.enabled)continue;m.age+=dt;float t=m.age/m.life;
                if(t>=1){m.view.enabled=false;continue;}
                if(m.ring){float s=Mathf.Lerp(.25f,1.3f,t);m.view.transform.localScale=new Vector3(s,s*.45f,1);}
                else{m.view.transform.position+=(Vector3)(m.velocity*dt);m.velocity.y-=dt*3;m.view.transform.localScale=Vector3.one*m.size*(1-t*.3f);}
                var c=m.color;c.a*=1-t;m.view.color=c;
            }
        }
        public void Clear(){foreach(var m in motes)m.view.enabled=false;}
    }
}
