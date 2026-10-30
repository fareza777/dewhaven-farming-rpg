using UnityEngine;
namespace Dewhaven
{
    public sealed class PlayerMotor : MonoBehaviour
    {
        public GameState State;
        public GameClock Clock;
        public TouchInput Input;
        public ToolSequence Tool=new ToolSequence();
        public string ActiveTool="hand";
        public string Facing { get; private set; }="down";
        public Vector2 MapPosition=>new Vector2(transform.position.x,-transform.position.y);
        public Vector2 FacingMap=>Facing=="up"?Vector2.down:Facing=="left"?Vector2.left:Facing=="right"?Vector2.right:Vector2.up;
        private SpriteRenderer body,shadow,attachment;
        private Vector2 velocity;
        private float phase,steps;
        public System.Action Step;
        public void Setup(GameState state,GameClock clock,TouchInput input)
        {
            State=state;Clock=clock;Input=input;
            foreach(Transform child in transform){child.gameObject.SetActive(false);Destroy(child.gameObject);}
            body=new GameObject("Appearance").AddComponent<SpriteRenderer>();body.transform.SetParent(transform,false);body.sharedMaterial=ArtBank.WorldMaterial;
            shadow=new GameObject("Foot shadow").AddComponent<SpriteRenderer>();shadow.transform.SetParent(transform,false);shadow.sprite=ArtBank.Shape("shadow");shadow.sharedMaterial=ArtBank.WorldMaterial;shadow.color=new Color(.1f,.15f,.13f,.45f);shadow.transform.localScale=new Vector3(.75f,.22f,1);shadow.transform.localPosition=new Vector3(0,-.03f,0);
            attachment=new GameObject("Held tool").AddComponent<SpriteRenderer>();attachment.transform.SetParent(transform,false);attachment.sharedMaterial=ArtBank.WorldMaterial;
            Warp(new Vector2(state.x,state.y));Draw(0);
        }
        public void Warp(Vector2 p){transform.position=new Vector3(p.x,-p.y,0);State.x=p.x;State.y=p.y;velocity=Vector2.zero;Tool.Cancel();if(body)Draw(0);}
        public void Release(){Input?.Clear();velocity=Vector2.zero;Tool.Cancel();}
        private void Update()
        {
            if(State==null)return;
            float dt=Mathf.Min(Time.unscaledDeltaTime,.1f);
            if(Clock.IsPaused){velocity=Vector2.zero;Draw(0);return;}
            Tool.Advance(dt);
            var desired=Tool.Busy?Vector2.zero:Input.Movement*(Input.Running?5.8f:3.7f);
            float tau=desired.sqrMagnitude>.01f?.10f:.06f;
            velocity=Vector2.Lerp(velocity,desired,1-Mathf.Exp(-dt/tau));
            if(velocity.sqrMagnitude>.01f)
            {
                if(Mathf.Abs(velocity.x)>Mathf.Abs(velocity.y))Facing=velocity.x>0?"right":"left";else Facing=velocity.y>0?"up":"down";
                Move(new Vector2(velocity.x*dt,0));Move(new Vector2(0,velocity.y*dt));
                phase+=dt*8.5f*(Input.Running?1.35f:1);steps+=dt;
                if(steps>.36f){steps=0;Step?.Invoke();}
            }
            State.x=MapPosition.x;State.y=MapPosition.y;
            Draw(dt);
        }
        private void Move(Vector2 delta)
        {
            float length=delta.magnitude;if(length<.0001f)return;
            var foot=(Vector2)transform.position+new Vector2(0,.18f);
            var hit=Physics2D.CircleCast(foot,.22f,delta/length,length+.015f,1<<8);
            if(hit.collider)delta=delta.normalized*Mathf.Max(0,hit.distance-.015f);
            transform.position+=(Vector3)delta;
        }
        private void Draw(float dt)
        {
            string family=State.appearance=="look-sunfarer"?"chara_5":State.appearance=="look-wayfarer"?"chara_17":State.appearance=="look-trailkeeper"?"chara_26":"farmer";
            bool baked=family=="farmer"&&Tool.Busy&&(ActiveTool=="water"||ActiveTool=="hoe");
            string action=baked?ActiveTool:"walk";
            int frame=Tool.Busy?Mathf.Min(2,Mathf.FloorToInt(Tool.Progress*3)):velocity.sqrMagnitude>.02f?(int)phase%3:1;
            string key=family=="farmer"?"farmer/"+action+"/"+Facing+"/"+frame:family+"/"+Facing+"/"+frame;
            body.sprite=ArtBank.Get(key);body.sortingOrder=Mathf.RoundToInt(MapPosition.y*20)+2;shadow.sortingOrder=body.sortingOrder-1;
            body.transform.localScale=new Vector3(1,Tool.Busy?1-Mathf.Sin(Tool.Progress*Mathf.PI)*.045f:1,1);
            attachment.enabled=Tool.Busy&&!baked;
            if(attachment.enabled)
            {
                attachment.sprite=IconArt.Glyph(ActiveTool);attachment.color=new Color(.80f,.65f,.44f);attachment.transform.localScale=Vector3.one*.9f;
                Vector2 facing=new Vector2(FacingMap.x,-FacingMap.y);
                attachment.transform.localPosition=new Vector3(facing.x*.4f,.5f+facing.y*.2f,0);
                attachment.transform.localRotation=Quaternion.Euler(0,0,(Facing=="left"?-1:1)*(-70+140*Tool.Progress));attachment.sortingOrder=body.sortingOrder+(Facing=="up"?-1:1);
            }
        }
    }
}
