using System;
using System.IO;
using UnityEditor;
using UnityEngine;

namespace Dewhaven.Editor
{
    [InitializeOnLoad]
    public static class EditorBridge
    {
        private static double next;
        private static readonly string Signal = Path.GetFullPath(Path.Combine(Application.dataPath,"../refresh.request"));
        static EditorBridge() { EditorApplication.update += Watch; }
        public static void EnsureProject()
        {
            var actual=Path.GetFullPath(Path.Combine(Application.dataPath,".."));
            var expected=Path.GetFullPath("E:/Harvest Moon GPT 61/unity/Dewhaven");
            if(!string.Equals(actual,expected,StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Dewhaven project guard refused a different editor.");
        }
        public static void Start()
        {
            EnsureProject();
            Debug.Log("Dewhaven dedicated editor: "+Application.dataPath);
            AssetDatabase.Refresh(ImportAssetOptions.ForceUpdate);
        }
        private static void Watch()
        {
            if(EditorApplication.timeSinceStartup<next || EditorApplication.isCompiling || EditorApplication.isUpdating) return;
            next=EditorApplication.timeSinceStartup+2;
            if(!File.Exists(Signal)) return;
            EnsureProject(); File.Delete(Signal); AssetDatabase.Refresh(ImportAssetOptions.ForceUpdate);
        }
    }
}
