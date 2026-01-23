using System.Linq;
using UnityEditor;
using UnityEngine;

/// <summary>
/// Editor menu to create a BG from a template prefab. If the template is missing,
/// it auto-generates a default prefab (SpriteRenderer + MapHelper).
/// You can open the prefab and add your TS MapBoundsProvider there once.
/// Afterwards, the menu will always instantiate that fully-configured prefab.
/// </summary>
public static class Zepeto2D_CreateBG
{
    private static string GetDefaultPrefabPath()
    {
        // Find this script's location and construct relative path to Resources/Prefabs
        var scriptPath = AssetDatabase.FindAssets("t:Script Zepeto2D_CreateBG")
            .Select(AssetDatabase.GUIDToAssetPath)
            .FirstOrDefault();

        if (!string.IsNullOrEmpty(scriptPath))
        {
            // Script is in: .../Editor/Zepeto2D_CreateBG.cs
            // We want: .../Resources/Prefabs/ZEPETO2D_BG.prefab
            var dir = System.IO.Path.GetDirectoryName(scriptPath).Replace('\\', '/');
            var parentDir = System.IO.Path.GetDirectoryName(dir).Replace('\\', '/');
            return parentDir + "/Resources/Prefabs/ZEPETO2D_BG.prefab";
        }

        // Fallback to default path
        return "Assets/zepeto-2d-world/Zepeto 2D World/Resources/Prefabs/ZEPETO2D_BG.prefab";
    }

    [MenuItem("ZEPETO 2D/Create BG", priority = 10)]
    public static void CreateBG()
    {
        var defaultPrefabPath = GetDefaultPrefabPath();
        var prefab = FindTemplatePrefab(defaultPrefabPath);
        
        if (prefab == null)
        {
            var temp = BuildDefaultBGRoot2D();

            // z = 100 as requested
            var p = temp.transform.position;
            temp.transform.position = new Vector3(p.x, p.y, 100f);

            EnsureFolder(defaultPrefabPath);
            prefab = PrefabUtility.SaveAsPrefabAsset(temp, defaultPrefabPath);
            Object.DestroyImmediate(temp);

            Debug.LogWarning(
                "[ZEPETO 2D] Template prefab not found. A default template was created at:\n" +
                defaultPrefabPath + "\n" +
                "Open the prefab and add your TS 'MapBoundsProvider' component once.\n" +
                "Next creations will use that configured template."
            );
        }

        var instance = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
        Undo.RegisterCreatedObjectUndo(instance, "Create BG");
        Selection.activeGameObject = instance;

        PrefabUtility.UnpackPrefabInstance(instance, PrefabUnpackMode.OutermostRoot, InteractionMode.AutomatedAction);

        
        // Delay border rebuild to the next editor frame (safer timing),
        // then assign Wall layer to all 2D colliders created by the frame.
        EditorApplication.delayCall += () =>
        {
            var frame = instance.GetComponent<MapHelper>();
            if (frame != null)
            {
                Undo.RegisterFullObjectHierarchyUndo(instance, "Rebuild Borders2D");
                frame.RebuildNow();
                EditorUtility.SetDirty(instance);
            }
        };

        Debug.Log("[ZEPETO 2D] BG created from template prefab (2D colliders).");
    }

    private static GameObject FindTemplatePrefab(string defaultPath)
    {
        // Try the calculated path first
        var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(defaultPath);
        if (prefab != null) return prefab;

        // Fallback: search by name across the entire project
        var guids = AssetDatabase.FindAssets("t:Prefab ZEPETO2D_BG");
        foreach (var guid in guids)
        {
            var path = AssetDatabase.GUIDToAssetPath(guid);
            var go = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            if (go != null) return go;
        }
        return null;
    }

    private static void EnsureFolder(string assetPath)
    {
        var parts = assetPath.Replace('\\', '/').Split('/');
        var curr = "";
        for (int i = 0; i < parts.Length - 1; i++)
        {
            var next = (i == 0) ? parts[i] : curr + "/" + parts[i];
            if (!AssetDatabase.IsValidFolder(next))
            {
                if (i == 0) { curr = parts[i]; continue; }
                var parent = curr;
                var folder = parts[i];
                AssetDatabase.CreateFolder(parent, folder);
            }
            curr = next;
        }
    }

    private static GameObject BuildDefaultBGRoot2D()
    {
        var root = new GameObject("ZEPETO2D_BG");
        var sr = root.AddComponent<SpriteRenderer>();
        var frame = root.AddComponent<MapHelper>();
        frame.thickness = 0.1f;
        frame.padding = 0f;
        frame.useTriggers = false;
        return root;
    }
}