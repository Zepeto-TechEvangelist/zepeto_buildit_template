using UnityEngine;
using UnityEditor;
using System.Collections.Generic;
using System.IO;

public class PrefabThumbnailSaver : EditorWindow
{
    private string sourceFolder = "";
    private string destinationFolder = "";
    private Vector3 cameraPosition = Vector3.zero;
    private float cameraSize = 5f;

    [MenuItem("Window/Prefab Thumbnail Saver")]
    public static void ShowWindow()
    {
        GetWindow<PrefabThumbnailSaver>("Prefab Thumbnail Saver");
    }

    private void OnGUI()
    {
        GUILayout.Label("Settings", EditorStyles.boldLabel);
        sourceFolder = EditorGUILayout.TextField("Source Folder", sourceFolder);
        destinationFolder = EditorGUILayout.TextField("Destination Folder", destinationFolder);
        
        Vector3 newCameraPosition = EditorGUILayout.Vector3Field("Camera Position", cameraPosition);
        float newCameraSize = EditorGUILayout.FloatField("Camera Size", cameraSize);

        if (newCameraPosition != cameraPosition)
        {
            cameraPosition = newCameraPosition;
            ApplyCameraSettings();
        }

        if (newCameraSize != cameraSize)
        {
            cameraSize = newCameraSize;
            ApplyCameraSettings();
        }

        // if (GUILayout.Button("Build Thumbnail"))
        // {
        //     BuildThumbnail();
        // }

        if (GUILayout.Button("Capture current Scene prefab"))
        {
            CaptureCurrentScene();
        }
    }

    private void BuildThumbnail()
    {
        if (string.IsNullOrEmpty(sourceFolder) || string.IsNullOrEmpty(destinationFolder))
        {
            Debug.LogError("Source Folder or Destination Folder is empty.");
            return;
        }

        string[] guids = AssetDatabase.FindAssets("t:Prefab", new[] { sourceFolder });
        Dictionary<string, GameObject> folderPrefabs = new Dictionary<string, GameObject>();

        foreach (string guid in guids)
        {
            string path = AssetDatabase.GUIDToAssetPath(guid);
            GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            if (prefab != null)
            {
                folderPrefabs[prefab.name] = prefab;
            }
        }

        Camera mainCamera = Camera.main;
        if (mainCamera == null)
        {
            Debug.LogError("No Main Camera found in the scene.");
            return;
        }

        foreach (var kvp in folderPrefabs)
        {
            GameObject instance = Instantiate(kvp.Value);
            Bounds bounds = GetBounds(instance);
            mainCamera.orthographicSize = bounds.extents.y;

            RenderTexture rt = new RenderTexture(256, 256, 24);
            mainCamera.targetTexture = rt;
            Texture2D screenShot = new Texture2D(256, 256, TextureFormat.RGBA32, false);
            mainCamera.clearFlags = CameraClearFlags.SolidColor;
            mainCamera.backgroundColor = Color.clear;
            mainCamera.Render();

            RenderTexture.active = rt;
            screenShot.ReadPixels(new Rect(0, 0, 256, 256), 0, 0);
            screenShot.Apply();
            mainCamera.targetTexture = null;
            RenderTexture.active = null;
            DestroyImmediate(rt);

            byte[] bytes = screenShot.EncodeToPNG();
            string filePath = Path.Combine(destinationFolder, kvp.Key + ".png");
            File.WriteAllBytes(filePath, bytes);

            DestroyImmediate(instance);
        }

        AssetDatabase.Refresh();
    }

    private void CaptureCurrentScene()
    {
        if (string.IsNullOrEmpty(destinationFolder))
        {
            Debug.LogError("Destination Folder is empty.");
            return;
        }

        GameObject prefabParent = GameObject.Find("prefab");
        if (prefabParent == null)
        {
            Debug.LogError("No GameObject named 'prefab' found in the scene.");
            return;
        }

        GameObject prefabObject = null;
        foreach (Transform child in prefabParent.transform)
        {
            if (child.gameObject.activeInHierarchy)
            {
                prefabObject = child.gameObject;
                break;
            }
        }

        if (prefabObject == null)
        {
            Debug.LogError("No active child GameObject found under 'prefab'.");
            return;
        }

        Camera mainCamera = Camera.main;
        if (mainCamera == null)
        {
            Debug.LogError("No Main Camera found in the scene.");
            return;
        }

        ApplyCameraSettings();

        // Bounds bounds = GetBounds(prefabObject);
        // mainCamera.orthographicSize = bounds.extents.y;

        RenderTexture rt = new RenderTexture(256, 256, 24);
        mainCamera.targetTexture = rt;
        Texture2D screenShot = new Texture2D(256, 256, TextureFormat.RGBA32, false);
        mainCamera.clearFlags = CameraClearFlags.SolidColor;
        mainCamera.backgroundColor = Color.clear;
        mainCamera.Render();

        RenderTexture.active = rt;
        screenShot.ReadPixels(new Rect(0, 0, 256, 256), 0, 0);
        screenShot.Apply();
        mainCamera.targetTexture = null;
        RenderTexture.active = null;
        DestroyImmediate(rt);

        byte[] bytes = screenShot.EncodeToPNG();
        string filePath = Path.Combine(destinationFolder, prefabObject.name + ".png");
        File.WriteAllBytes(filePath, bytes);

        AssetDatabase.Refresh();
    }

    private void ApplyCameraSettings()
    {
        Camera mainCamera = Camera.main;
        if (mainCamera != null)
        {
            mainCamera.transform.position = cameraPosition;
            mainCamera.orthographicSize = cameraSize;
        }
    }

    private Bounds GetBounds(GameObject obj)
    {
        var renderers = obj.GetComponentsInChildren<Renderer>();
        Bounds bounds = new Bounds(obj.transform.position, Vector3.zero);

        foreach (Renderer renderer in renderers)
        {
            bounds.Encapsulate(renderer.bounds);
        }

        return bounds;
    }
}
