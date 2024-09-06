using UnityEditor;
using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

public class PrefabPreviewSaver : EditorWindow
{
    private string sourceFolder = "Assets/YourSourceFolder"; // 프리팹이 있는 폴더 경로
    private string destinationFolder = "Assets/DestinationFolder"; // 이미지를 저장할 폴더 경로

    private int minIndex = 0;

    [MenuItem("Tools/Prefab Preview Saver")]
    public static void ShowWindow()
    {
        GetWindow<PrefabPreviewSaver>("Prefab Preview Saver");
    }

    private void OnGUI()
    {
        GUILayout.Label("Settings", EditorStyles.boldLabel);
        sourceFolder = EditorGUILayout.TextField("Source Folder", sourceFolder);
        destinationFolder = EditorGUILayout.TextField("Destination Folder", destinationFolder);
        minIndex = EditorGUILayout.IntField("Start Index", minIndex);

        // if (GUILayout.Button("Build Thumbnail"))
        // {
        //     BuildThumbnails();
        // }

        if (GUILayout.Button("Save Prefab Preview"))
        {
            SavePrefabPreviews();
        }
    }

    private void BuildThumbnails()
    {
        if (!Directory.Exists(destinationFolder))
        {
            Directory.CreateDirectory(destinationFolder);
        }

        string[] prefabGuids = AssetDatabase.FindAssets("t:Prefab", new[] { sourceFolder });

        EditorApplication.update += CoroutineUpdate;
        Task.Run(() => BuildThumbnailsAsync(prefabGuids));
    }

    private async void SavePrefabPreviews()
    {
        if (!Directory.Exists(destinationFolder))
        {
            Directory.CreateDirectory(destinationFolder);
        }

        string[] prefabGuids = AssetDatabase.FindAssets("t:Prefab", new[] { sourceFolder });

        await SavePreviewsAsync(prefabGuids, minIndex);
        AssetDatabase.Refresh();
    }


    private void CoroutineUpdate()
    {
        // Update method for coroutine
    }

    private async Task BuildThumbnailsAsync(string[] prefabGuids)
    {
        Camera camera = Camera.main;
        if (camera == null)
        {
            Debug.LogError("No Main Camera found in the scene.");
            return;
        }

        Color originalBackgroundColor = camera.backgroundColor;
        CameraClearFlags originalClearFlags = camera.clearFlags;
        bool originalOrthographic = camera.orthographic;
        float originalOrthographicSize = camera.orthographicSize;

        camera.clearFlags = CameraClearFlags.SolidColor;
        camera.backgroundColor = new Color(0, 0, 0, 0);
        camera.orthographic = true;

        foreach (string guid in prefabGuids)
        {
            string assetPath = AssetDatabase.GUIDToAssetPath(guid);
            GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
            GameObject instance = Instantiate(prefab);
            instance.layer = LayerMask.NameToLayer("UI");

            Bounds bounds = GetBounds(instance);
            float maxSize = Mathf.Max(bounds.size.x, bounds.size.y, bounds.size.z);
            camera.orthographicSize = maxSize / 2;

            RenderTexture rt = new RenderTexture(256, 256, 24, RenderTextureFormat.ARGB32);
            camera.targetTexture = rt;
            camera.Render();

            RenderTexture.active = rt;
            Texture2D previewTexture = new Texture2D(rt.width, rt.height, TextureFormat.RGBA32, false);
            previewTexture.ReadPixels(new Rect(0, 0, rt.width, rt.height), 0, 0);
            previewTexture.Apply();

            byte[] pngData = previewTexture.EncodeToPNG();
            string fileName = Path.Combine(destinationFolder, prefab.name + ".png");
            File.WriteAllBytes(fileName, pngData);
            Debug.Log($"Saved thumbnail for {prefab.name} at {fileName}");

            RenderTexture.active = null;
            camera.targetTexture = null;
            DestroyImmediate(rt);
            DestroyImmediate(instance);
            DestroyImmediate(previewTexture);

            // 약간의 대기 시간을 주어 비동기적 동작을 보장
            await Task.Delay(100);
        }

        camera.backgroundColor = originalBackgroundColor;
        camera.clearFlags = originalClearFlags;
        camera.orthographic = originalOrthographic;
        camera.orthographicSize = originalOrthographicSize;
    }

    private async Task SavePreviewsAsync(string[] prefabGuids, int minIndex)
    {
        for (int i = minIndex; i < prefabGuids.Length; i++)
        {
            string assetPath = AssetDatabase.GUIDToAssetPath(prefabGuids[i]);
            GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);

            Texture2D previewTexture = AssetPreview.GetAssetPreview(prefab);
            while (AssetPreview.IsLoadingAssetPreview(prefab.GetInstanceID()))
            {
                await Task.Yield(); // 비동기로 로딩을 기다립니다.
            }

            if (previewTexture != null)
            {
                byte[] pngData = previewTexture.EncodeToPNG();
                string fileName = Path.Combine(destinationFolder, prefab.name + ".png");
                await Task.Run(() => File.WriteAllBytes(fileName, pngData)); // 비동기로 파일 저장
                Debug.Log($"Saved preview for {prefab.name} at {fileName}");
            }

            // 약간의 대기 시간을 주어 비동기적 동작을 보장
            await Task.Delay(500);
        }
    }


    private Bounds GetBounds(GameObject go)
    {
        Renderer[] meshRenderers = go.GetComponentsInChildren<MeshRenderer>();
        Renderer[] skinnedMeshRenderers = go.GetComponentsInChildren<SkinnedMeshRenderer>();

        if (meshRenderers.Length == 0 && skinnedMeshRenderers.Length == 0)
        {
            return new Bounds(go.transform.position, Vector3.zero);
        }

        Bounds bounds = new Bounds(go.transform.position, Vector3.zero);
        bool hasBounds = false;

        foreach (var renderer in meshRenderers)
        {
            if (!hasBounds)
            {
                bounds = renderer.bounds;
                hasBounds = true;
            }
            else
            {
                bounds.Encapsulate(renderer.bounds);
            }
        }

        foreach (var renderer in skinnedMeshRenderers)
        {
            if (!hasBounds)
            {
                bounds = renderer.bounds;
                hasBounds = true;
            }
            else
            {
                bounds.Encapsulate(renderer.bounds);
            }
        }

        return bounds;
    }
}
