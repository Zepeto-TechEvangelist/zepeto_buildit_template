using UnityEngine;

/// <summary>
/// Builds 4 thin BoxCollider2D walls around a SpriteRenderer's world bounds.
/// Use the inspector context menu to rebuild explicitly.
/// Also provides context menu options to create Portal2D, SpriteNPC, and ZepetoNPC as children.
/// </summary>
[DisallowMultipleComponent]
public class MapHelper : MonoBehaviour
{
    [Header("Source")]
    [Tooltip("If null, the SpriteRenderer on this GameObject will be used.")]
    public SpriteRenderer sourceRenderer;

    [Header("Frame Settings")]
    [Tooltip("Extra padding applied to sprite bounds on X/Y (world units).")]
    public float padding = 0f;

    [Tooltip("Border thickness (world units).")]
    public float thickness = 0.1f;

    [Tooltip("When enabled, borders are triggers; otherwise, solid colliders.")]
    public bool useTriggers = false;

    [Header("Child Names")]
    public string topName = "Border2D_Top";
    public string bottomName = "Border2D_Bottom";
    public string leftName = "Border2D_Left";
    public string rightName = "Border2D_Right";

    private BoxCollider2D _top, _bottom, _left, _right;

    private void Reset()
    {
        sourceRenderer = GetComponent<SpriteRenderer>();
    }

    private void Awake()
    {
        // Avoid heavy work here (editor import timing).
        if (sourceRenderer == null)
            sourceRenderer = GetComponent<SpriteRenderer>();
    }

    /// <summary>Public entry to (re)build the 4 walls.</summary>
    public void RebuildNow()
    {
        if (sourceRenderer == null)
            sourceRenderer = GetComponent<SpriteRenderer>();

        EnsureColliders();

        Bounds b = (sourceRenderer != null && sourceRenderer.sprite != null)
            ? sourceRenderer.bounds
            : new Bounds(transform.position, new Vector3(10f, 6f, 0.1f));

        float halfX = b.extents.x + padding;
        float halfY = b.extents.y + padding;
        float cx = b.center.x;
        float cy = b.center.y;

        float t = Mathf.Max(0.001f, thickness);

        // Top/Bottom
        SetBox2D(ref _top, new Vector2(cx, cy + halfY + t * 0.5f), new Vector2(halfX * 2f + t * 2f, t));
        SetBox2D(ref _bottom, new Vector2(cx, cy - halfY - t * 0.5f), new Vector2(halfX * 2f + t * 2f, t));

        // Left/Right
        SetBox2D(ref _left, new Vector2(cx - halfX - t * 0.5f, cy), new Vector2(t, halfY * 2f));
        SetBox2D(ref _right, new Vector2(cx + halfX + t * 0.5f, cy), new Vector2(t, halfY * 2f));

        // Trigger flag
        if (_top) _top.isTrigger = useTriggers;
        if (_bottom) _bottom.isTrigger = useTriggers;
        if (_left) _left.isTrigger = useTriggers;
        if (_right) _right.isTrigger = useTriggers;
    }

    private void EnsureColliders()
    {
        _top = GetOrCreateChildBox2D(topName, _top);
        _bottom = GetOrCreateChildBox2D(bottomName, _bottom);
        _left = GetOrCreateChildBox2D(leftName, _left);
        _right = GetOrCreateChildBox2D(rightName, _right);
    }

    private BoxCollider2D GetOrCreateChildBox2D(string childName, BoxCollider2D cache)
    {
        if (cache) return cache;

        Transform child = transform.Find(childName);
        if (child == null)
        {
            var go = new GameObject(childName);
            go.transform.SetParent(transform, worldPositionStays: true);
            child = go.transform;
        }

        var col = child.GetComponent<BoxCollider2D>();
        if (col == null) col = child.gameObject.AddComponent<BoxCollider2D>();
        col.isTrigger = useTriggers;

        return col;
    }

    private void SetBox2D(ref BoxCollider2D bc2d, Vector2 worldCenter, Vector2 worldSize)
    {
        if (!bc2d) return;

        // 1) 자식 트랜스폼을 "월드 위치로" 놓고, 회전은 부모와 동일, 스케일은 1로 고정
        var t = bc2d.transform;
        t.position = new Vector3(worldCenter.x, worldCenter.y, transform.position.z);
        t.rotation = transform.rotation;
        t.localScale = Vector3.one;

        // 2) BoxCollider2D.size는 로컬 공간 기준이므로, 부모의 스케일을 제거해서 넣어야 함
        //    (부호 뒤집힘은 크기에 영향 없으니 절댓값)
        Vector3 ls = transform.lossyScale;
        float sx = Mathf.Abs(ls.x); if (sx < 1e-6f) sx = 1f;
        float sy = Mathf.Abs(ls.y); if (sy < 1e-6f) sy = 1f;

        // 월드 크기 -> 로컬 크기
        Vector2 localSize = new Vector2(worldSize.x / sx, worldSize.y / sy);

        bc2d.offset = Vector2.zero;
        bc2d.size = localSize;
    }

    [ContextMenu("Rebuild Borders2D (Context)")]
    private void RebuildContextMenu() => RebuildNow();

    // ─────────────────────────────────────────────────────────────────────────────
    // Editor-only: Create Portal2D, SpriteNPC, ZepetoNPC prefabs as children
    // ─────────────────────────────────────────────────────────────────────────────
#if UNITY_EDITOR
    [ContextMenu("Create Portal2D (Child)")]
    private void CreatePortal2DChild()
    {
        CreatePrefabChild("Portal2D", "Portal2D");
    }

    [ContextMenu("Create SpriteNPC (Child)")]
    private void CreateSpriteNPCChild()
    {
        CreatePrefabChild("SpriteNPC", "SpriteNPC");
    }

    [ContextMenu("Create ZepetoNPC (Child)")]
    private void CreateZepetoNPCChild()
    {
        CreatePrefabChild("ZepetoNPC", "ZepetoNPC");
    }

    private void CreatePrefabChild(string prefabName, string logName)
    {
        // Find prefab by name (searches entire project)
        var guids = UnityEditor.AssetDatabase.FindAssets($"t:Prefab {prefabName}");
        GameObject prefab = null;
        
        foreach (var guid in guids)
        {
            var path = UnityEditor.AssetDatabase.GUIDToAssetPath(guid);
            var go = UnityEditor.AssetDatabase.LoadAssetAtPath<GameObject>(path);
            if (go != null && go.name == prefabName)
            {
                prefab = go;
                break;
            }
        }

        if (prefab == null)
        {
            Debug.LogError($"[MapHelper] {prefabName}.prefab not found in project. Please ensure it exists in Resources/Prefabs.");
            return;
        }

        // Instantiate prefab into the same scene and parent it under this object.
        var instance = (GameObject)UnityEditor.PrefabUtility.InstantiatePrefab(prefab, gameObject.scene);
        if (instance == null)
        {
            Debug.LogError($"[MapHelper] Failed to instantiate {prefabName} prefab.");
            return;
        }

        instance.name = UnityEditor.GameObjectUtility.GetUniqueNameForSibling(transform, prefab.name);
        var t = instance.transform;
        t.SetParent(transform, worldPositionStays: true);

        // Place at center of the source bounds.
        Bounds b = (sourceRenderer != null && sourceRenderer.sprite != null)
            ? sourceRenderer.bounds
            : new Bounds(transform.position, new Vector3(10f, 6f, 0.1f));

        // For NPCs, place at center; for Portal, place at bottom-center
        if (prefabName == "Portal2D")
        {
            float bottomY = b.min.y + 0.1f; // 0.1f to avoid being exactly on the border
            t.position = new Vector3(b.center.x, bottomY, transform.position.z);
        }
        else
        {
            t.position = new Vector3(b.center.x, b.center.y, transform.position.z);
        }

        // Optionally ping/select created object in Hierarchy.
        UnityEditor.Selection.activeObject = instance;
        UnityEditor.EditorGUIUtility.PingObject(instance);

        Debug.Log($"[MapHelper] Created {logName} under '{name}' at {t.position}.");
    }
#endif
}