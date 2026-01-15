using System.Linq;
using UnityEditor;
using UnityEngine;
using ZEPETO.Script;

/// <summary>
/// Editor menu to create NPCs (ZepetoNPC or SpriteNPC) from template prefabs.
/// If the template is missing, it auto-generates a default prefab.
/// </summary>
public static class Zepeto2D_CreateNPC
{
    private static string GetPrefabPath(string npcType)
    {
        // Find this script's location and construct relative path to Resources/Prefabs
        var scriptPath = AssetDatabase.FindAssets("t:Script Zepeto2D_CreateNPC")
            .Select(AssetDatabase.GUIDToAssetPath)
            .FirstOrDefault();

        if (!string.IsNullOrEmpty(scriptPath))
        {
            // Script is in: .../Editor/Zepeto2D_CreateNPC.cs
            // We want: .../Resources/Prefabs/{npcType}.prefab
            var dir = System.IO.Path.GetDirectoryName(scriptPath).Replace('\\', '/');
            var parentDir = System.IO.Path.GetDirectoryName(dir).Replace('\\', '/');
            return parentDir + "/Resources/Prefabs/" + npcType + ".prefab";
        }

        // Fallback to default path
        return "Assets/zepeto-2d-world/Zepeto 2D World/Resources/Prefabs/" + npcType + ".prefab";
    }

    [MenuItem("ZEPETO 2D/Create ZepetoNPC", priority = 20)]
    public static void CreateZepetoNPC()
    {
        CreateNPC("ZepetoNPC", "ZepetoNPC");
    }

    [MenuItem("ZEPETO 2D/Create SpriteNPC", priority = 21)]
    public static void CreateSpriteNPC()
    {
        CreateNPC("SpriteNPC", "SpriteNPC");
    }

    private static void CreateNPC(string prefabName, string defaultName)
    {
        var prefabPath = GetPrefabPath(prefabName);
        var prefab = FindTemplatePrefab(prefabPath, prefabName);
        
        if (prefab == null)
        {
            var temp = BuildDefaultNPC(defaultName, prefabName);

            EnsureFolder(prefabPath);
            prefab = PrefabUtility.SaveAsPrefabAsset(temp, prefabPath);
            Object.DestroyImmediate(temp);

            Debug.LogWarning(
                $"[ZEPETO 2D] Template prefab not found. A default template was created at:\n" +
                prefabPath + "\n" +
                "Open the prefab and configure it as needed.\n" +
                "Next creations will use that configured template."
            );
        }

        var instance = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
        Undo.RegisterCreatedObjectUndo(instance, $"Create {defaultName}");
        
        // Create dialogue panel as child and link it
        // SetupDialoguePanel(instance);
        
        Selection.activeGameObject = instance;

        Debug.Log($"[ZEPETO 2D] {defaultName} created from template prefab with dialogue panel.");
    }
    
    private static void SetupDialoguePanel(GameObject npcInstance)
    {
        // Find NPCTallk prefab
        var dialoguePrefabPath = GetPrefabPath("NPCTallk");
        GameObject dialoguePrefab = null;
        
        // Try to load from calculated path
        if (!string.IsNullOrEmpty(dialoguePrefabPath))
        {
            dialoguePrefab = AssetDatabase.LoadAssetAtPath<GameObject>(dialoguePrefabPath);
        }
        
        // Fallback: search by name
        if (dialoguePrefab == null)
        {
            var guids = AssetDatabase.FindAssets("t:Prefab NPCTallk");
            foreach (var guid in guids)
            {
                var path = AssetDatabase.GUIDToAssetPath(guid);
                var go = AssetDatabase.LoadAssetAtPath<GameObject>(path);
                if (go != null && (go.name == "NPCTallk" || go.name.Contains("NPCTalk")))
                {
                    dialoguePrefab = go;
                    break;
                }
            }
        }
        
        if (dialoguePrefab == null)
        {
            Debug.LogWarning(
                $"[ZEPETO 2D] NPCTallk prefab not found. Please manually assign dialoguePanel in the inspector.\n" +
                "Expected path: " + dialoguePrefabPath
            );
            return;
        }
        
        // Instantiate dialogue panel as child of NPC
        var dialoguePanel = (GameObject)PrefabUtility.InstantiatePrefab(dialoguePrefab, npcInstance.transform);
        dialoguePanel.name = "DialoguePanel";
        
        // Deactivate dialogue panel by default (it will be activated when dialogue starts)
        dialoguePanel.SetActive(false);
        
        Undo.RegisterCreatedObjectUndo(dialoguePanel, "Create Dialogue Panel");
        
        // Note: dialoguePanel will be auto-found by NpcBase.AutoFindComponents() at runtime
        // No need to manually link it via SerializedObject
        Debug.Log($"[ZEPETO 2D] Dialogue panel created as child of {npcInstance.name} (will be auto-linked at runtime)");
    }

    private static GameObject FindTemplatePrefab(string defaultPath, string prefabName)
    {
        // Try the calculated path first
        var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(defaultPath);
        if (prefab != null) return prefab;

        // Fallback: search by name across the entire project
        var guids = AssetDatabase.FindAssets($"t:Prefab {prefabName}");
        foreach (var guid in guids)
        {
            var path = AssetDatabase.GUIDToAssetPath(guid);
            var go = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            if (go != null && go.name == prefabName) return go;
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

    private static GameObject BuildDefaultNPC(string defaultName, string npcType)
    {
        // Create a basic GameObject - user will need to configure it in the prefab
        // The ZepetoScript component will need to be added and configured manually in the prefab
        var root = new GameObject(defaultName);
        
        // Add ZepetoScriptBehaviourComponent (script will need to be assigned manually in prefab)
        root.AddComponent<ZepetoScriptBehaviourComponent>();

        return root;
    }
}

