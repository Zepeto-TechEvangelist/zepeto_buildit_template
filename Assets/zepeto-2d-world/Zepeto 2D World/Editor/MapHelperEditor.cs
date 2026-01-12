using UnityEditor;
using UnityEngine;
using System.Reflection;

[CustomEditor(typeof(MapHelper))]
[CanEditMultipleObjects]
public class MapHelperEditor : Editor
{
    private MethodInfo _miCreatePortal;
    private MethodInfo _miCreateSpriteNPC;
    private MethodInfo _miCreateZepetoNPC;

    private void OnEnable()
    {
        // Find context menu methods (private/public both fine)
        _miCreatePortal = typeof(MapHelper)
            .GetMethod("CreatePortal2DChild", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public);
        _miCreateSpriteNPC = typeof(MapHelper)
            .GetMethod("CreateSpriteNPCChild", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public);
        _miCreateZepetoNPC = typeof(MapHelper)
            .GetMethod("CreateZepetoNPCChild", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public);
    }

    public override void OnInspectorGUI()
    {
        DrawDefaultInspector();

        EditorGUILayout.Space();

        using (new EditorGUILayout.HorizontalScope())
        {
            if (GUILayout.Button("Rebuild Borders2D", GUILayout.Height(24)))
                RebuildSelected();

            if (GUILayout.Button("Select Border Children", GUILayout.Height(24)))
                SelectChildren();
        }

        using (new EditorGUILayout.HorizontalScope())
        {
            EditorGUI.BeginDisabledGroup(_miCreatePortal == null);
            if (GUILayout.Button("Create Portal2D (Child)", GUILayout.Height(24)))
                CreatePortalForSelected();
            EditorGUI.EndDisabledGroup();
        }

        using (new EditorGUILayout.HorizontalScope())
        {
            EditorGUI.BeginDisabledGroup(_miCreateSpriteNPC == null);
            if (GUILayout.Button("Create SpriteNPC (Child)", GUILayout.Height(24)))
                CreateSpriteNPCForSelected();
            EditorGUI.EndDisabledGroup();
        }

        using (new EditorGUILayout.HorizontalScope())
        {
            EditorGUI.BeginDisabledGroup(_miCreateZepetoNPC == null);
            if (GUILayout.Button("Create ZepetoNPC (Child)", GUILayout.Height(24)))
                CreateZepetoNPCForSelected();
            EditorGUI.EndDisabledGroup();
        }

        EditorGUILayout.HelpBox(
            "• Rebuild Borders2D: Recreate 4 thin BoxCollider2D walls from the sprite bounds.\n" +
            "• Create Portal2D (Child): Instantiates 'Portal2D.prefab' as a child and places it at the bottom-center of the bounds.\n" +
            "• Create SpriteNPC (Child): Instantiates 'SpriteNPC.prefab' as a child and places it at the center of the bounds.\n" +
            "• Create ZepetoNPC (Child): Instantiates 'ZepetoNPC.prefab' as a child and places it at the center of the bounds.\n" +
            "Tip: Avoid heavy work in OnValidate/Awake to keep editor snappy.",
            MessageType.Info
        );
    }

    private void RebuildSelected()
    {
        foreach (var t in targets)
        {
            var frame = t as MapHelper;
            if (!frame) continue;

            Undo.RegisterFullObjectHierarchyUndo(frame.gameObject, "Rebuild Borders2D");
            frame.RebuildNow();
            EditorUtility.SetDirty(frame);
        }
    }

    private void SelectChildren()
    {
        if (targets.Length != 1) return;
        var frame = targets[0] as MapHelper;
        if (!frame) return;

        var cols = frame.GetComponentsInChildren<BoxCollider2D>(true);
        var list = new System.Collections.Generic.List<Object>();
        foreach (var c in cols) list.Add(c.gameObject);
        if (list.Count > 0)
            Selection.objects = list.ToArray();
    }

    private void CreatePortalForSelected()
    {
        if (_miCreatePortal == null)
        {
            Debug.LogError("CreatePortal2DChild() not found on MapHelper. Ensure the method exists (#if UNITY_EDITOR).");
            return;
        }

        foreach (var t in targets)
        {
            var frame = t as MapHelper;
            if (!frame) continue;

            Undo.RegisterFullObjectHierarchyUndo(frame.gameObject, "Create Portal2D (Child)");
            _miCreatePortal.Invoke(frame, null);
            EditorUtility.SetDirty(frame);
        }
    }

    private void CreateSpriteNPCForSelected()
    {
        if (_miCreateSpriteNPC == null)
        {
            Debug.LogError("CreateSpriteNPCChild() not found on MapHelper. Ensure the method exists (#if UNITY_EDITOR).");
            return;
        }

        foreach (var t in targets)
        {
            var frame = t as MapHelper;
            if (!frame) continue;

            Undo.RegisterFullObjectHierarchyUndo(frame.gameObject, "Create SpriteNPC (Child)");
            _miCreateSpriteNPC.Invoke(frame, null);
            EditorUtility.SetDirty(frame);
        }
    }

    private void CreateZepetoNPCForSelected()
    {
        if (_miCreateZepetoNPC == null)
        {
            Debug.LogError("CreateZepetoNPCChild() not found on MapHelper. Ensure the method exists (#if UNITY_EDITOR).");
            return;
        }

        foreach (var t in targets)
        {
            var frame = t as MapHelper;
            if (!frame) continue;

            Undo.RegisterFullObjectHierarchyUndo(frame.gameObject, "Create ZepetoNPC (Child)");
            _miCreateZepetoNPC.Invoke(frame, null);
            EditorUtility.SetDirty(frame);
        }
    }
}