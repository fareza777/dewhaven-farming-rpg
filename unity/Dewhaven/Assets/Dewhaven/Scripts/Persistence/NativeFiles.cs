using System;
using System.IO;
using UnityEngine;
namespace Dewhaven
{
    public sealed class NativeFiles : MonoBehaviour
    {
        private Action<string> pending;
        public void Pick(Action<string> complete)
        {
            pending=complete;
#if UNITY_ANDROID && !UNITY_EDITOR
            Launch("open","");
#elif UNITY_EDITOR
            string path=UnityEditor.EditorUtility.OpenFilePanel("Import a Dewhaven homestead","","json");
            if(!string.IsNullOrEmpty(path)){if(new FileInfo(path).Length>250000)OnFile("error:Choose a save smaller than 250 KB.");else OnFile(File.ReadAllText(path));}
#else
            OnFile("error:File selection is available in the Android app.");
#endif
        }
        public void Export(GameState state,Action<string> complete)
        {
            pending=complete;string json=SaveService.Export(state);
#if UNITY_ANDROID && !UNITY_EDITOR
            Launch("create",json);
#elif UNITY_EDITOR
            string path=UnityEditor.EditorUtility.SaveFilePanel("Export your homestead","","Dewhaven-"+state.farmName+".json","json");
            if(!string.IsNullOrEmpty(path)){File.WriteAllText(path,json);OnFile("saved");}
#else
            string path=Path.Combine(Application.persistentDataPath,"Dewhaven-export.json");File.WriteAllText(path,json);OnFile("saved");
#endif
        }
        public void OnFile(string value){var callback=pending;pending=null;callback?.Invoke(value);}
#if UNITY_ANDROID && !UNITY_EDITOR
        private void Launch(string mode,string json)
        {
            try
            {
                using(var player=new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
                using(var activity=player.GetStatic<AndroidJavaObject>("currentActivity"))
                using(var picker=new AndroidJavaClass("com.fajar.dewhaven.SavePicker"))picker.CallStatic("begin",activity,gameObject.name,mode,json);
            }
            catch(Exception){OnFile("error:The file picker could not open. Your save is kept.");}
        }
#endif
    }
}
