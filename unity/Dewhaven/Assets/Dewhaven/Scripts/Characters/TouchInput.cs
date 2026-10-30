using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.EnhancedTouch;
using Touch=UnityEngine.InputSystem.EnhancedTouch.Touch;
namespace Dewhaven
{
    [System.Serializable] public sealed class UserPreferences
    {
        public bool floating=true,leftHanded,autoRun=true,reducedMotion,instantText;
        public float deadZone=.12f,sensitivity=1,joystickSize=1,controlHeight=1,cameraResponse=1,fontScale=1,natureVolume=.65f,foleyVolume=.8f;
        public int frameRate=30;
        public bool voiceOver=true;
        public float voiceVolume=.85f;
        public float musicVolume=.22f;
        public static UserPreferences FromJson(string json)
        {
            var p=new UserPreferences();if(!string.IsNullOrWhiteSpace(json))try{JsonUtility.FromJsonOverwrite(json,p);}catch(System.ArgumentException){return new UserPreferences();}
            p.voiceVolume=Volume(p.voiceVolume,.85f);p.musicVolume=Volume(p.musicVolume,.22f);
            p.natureVolume=Volume(p.natureVolume,.65f);p.foleyVolume=Volume(p.foleyVolume,.8f);return p;
        }
        private static float Volume(float value,float fallback)=>float.IsNaN(value)||float.IsInfinity(value)?fallback:Mathf.Clamp01(value);
        public static UserPreferences Load()=>FromJson(PlayerPrefs.GetString("dewhaven.preferences",""));
        public void Save(){PlayerPrefs.SetString("dewhaven.preferences",JsonUtility.ToJson(this));PlayerPrefs.Save();}
    }
    public sealed class TouchInput : MonoBehaviour
    {
        public Vector2 Movement { get; private set; }
        public bool Running { get; private set; }
        public bool Enabled { get; set; }
        public bool PreserveDuringTravel { get; set; }
        public UserPreferences Preferences;
        public RectTransform JoystickBase,JoystickKnob;
        private int captured=-1;
        private Vector2 origin;
        private bool suppress;
        private readonly List<RaycastResult> hits=new List<RaycastResult>();
        private void OnEnable(){EnhancedTouchSupport.Enable();}
        private void OnDisable(){Clear();EnhancedTouchSupport.Disable();}
        public void Clear(){captured=-1;Movement=Vector2.zero;Running=false;suppress=Touch.activeTouches.Count>0;if(JoystickBase)JoystickBase.gameObject.SetActive(false);}
        private bool OverUI(Vector2 p)
        {
            if(!EventSystem.current)return false;
            var data=new PointerEventData(EventSystem.current){position=p};hits.Clear();EventSystem.current.RaycastAll(data,hits);return hits.Count>0;
        }
        private void Update()
        {
            if(!Enabled&&!PreserveDuringTravel){Clear();return;}
            if(suppress){if(Touch.activeTouches.Count==0)suppress=false;else return;}
            bool found=false;
            foreach(var t in Touch.activeTouches)
            {
                var p=t.screenPosition;
                if(captured<0&&t.phase==UnityEngine.InputSystem.TouchPhase.Began&&p.y<Screen.height*.49f&&((p.x<Screen.width*.52f)!=Preferences.leftHanded)&&!OverUI(p))
                {
                    captured=t.touchId;
                    origin=Preferences.floating?p:new Vector2(Screen.width*(Preferences.leftHanded?.77f:.23f),Screen.height*.21f);
                    if(JoystickBase){JoystickBase.gameObject.SetActive(true);JoystickBase.position=origin;}
                }
                if(t.touchId!=captured)continue;
                found=true;
                if(t.phase==UnityEngine.InputSystem.TouchPhase.Ended||t.phase==UnityEngine.InputSystem.TouchPhase.Canceled){Clear();continue;}
                float radius=48*Preferences.joystickSize*Screen.width/390f;
                var delta=(p-origin)/radius;
                if(Preferences.floating&&delta.magnitude>1.4f){origin=p-delta.normalized*radius*1.4f;if(JoystickBase)JoystickBase.position=origin;delta=(p-origin)/radius;}
                float magnitude=Mathf.Clamp01(delta.magnitude);Movement=magnitude<Preferences.deadZone?Vector2.zero:delta.normalized*((magnitude-Preferences.deadZone)/(1-Preferences.deadZone))*Preferences.sensitivity;
                Movement=Vector2.ClampMagnitude(Movement,1);Running=Preferences.autoRun&&magnitude>.84f;
                if(JoystickKnob)JoystickKnob.anchoredPosition=Vector2.ClampMagnitude(delta,1)*34*Preferences.joystickSize;
            }
            if(captured>=0&&!found)Clear();
            // Editor fallback helps authoring; the Android layout always uses the same touch surface.
            if(Keyboard.current!=null&&captured<0)
            {
                var k=Keyboard.current;
                Movement=new Vector2((k.dKey.isPressed||k.rightArrowKey.isPressed?1:0)-(k.aKey.isPressed||k.leftArrowKey.isPressed?1:0),(k.wKey.isPressed||k.upArrowKey.isPressed?1:0)-(k.sKey.isPressed||k.downArrowKey.isPressed?1:0)).normalized;
                Running=k.leftShiftKey.isPressed;
            }
        }
    }
}
