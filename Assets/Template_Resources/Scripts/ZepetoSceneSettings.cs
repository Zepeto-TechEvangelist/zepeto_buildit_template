using UnityEngine;
using UnityEditor;

public class ZepetoSceneSettings : EditorWindow
{
    private Material skyboxMaterial;
    private Texture2D previewTexture;

    private Color topColor;
    private Color centerColor;
    private Color bottomColor;
    private Vector3 upVector;
    private float exp;

    private GameObject defaultLight;
    private Vector3 defaultRotation;

    private float lightIntensity = 0.85f;

    private Color ambientColor; // Ambient Color

    [MenuItem("ZEPETO/Zepeto Scene Settings")]
    public static void ShowWindow()
    {
        GetWindow<ZepetoSceneSettings>("Zepeto Scene Settings");
    }

    private void OnEnable()
    {
        skyboxMaterial = RenderSettings.skybox;
        if (skyboxMaterial != null)
        {
            if (skyboxMaterial.HasProperty("_TopColor"))
                topColor = skyboxMaterial.GetColor("_TopColor");

            if (skyboxMaterial.HasProperty("_CenterColor"))
                centerColor = skyboxMaterial.GetColor("_CenterColor");

            if (skyboxMaterial.HasProperty("_BottomColor"))
                bottomColor = skyboxMaterial.GetColor("_BottomColor");

            if (skyboxMaterial.HasProperty("_Up"))
                upVector = skyboxMaterial.GetVector("_Up");

            if (skyboxMaterial.HasProperty("_Exp"))
                exp = skyboxMaterial.GetFloat("_Exp");

            previewTexture = AssetPreview.GetAssetPreview(skyboxMaterial);
        }

        GameObject lightObject = GameObject.FindWithTag("DefaultLight");
        if (lightObject != null)
        {
            defaultLight = lightObject;
            defaultRotation = defaultLight.transform.rotation.eulerAngles;

            Light lightComponent = defaultLight.GetComponent<Light>();
            if (lightComponent != null)
            {
                lightIntensity = lightComponent.intensity;
            }
        }

        // 현재 Ambient Color를 가져옴
        ambientColor = RenderSettings.ambientLight;
    }

    private void OnGUI()
    {
        if (skyboxMaterial == null)
        {
            EditorGUILayout.HelpBox("No Skybox Material found in RenderSettings.", MessageType.Warning);
            return;
        }

        EditorGUI.BeginChangeCheck();

        topColor = EditorGUILayout.ColorField("Top Color", topColor);
        centerColor = EditorGUILayout.ColorField("Center Color", centerColor);
        bottomColor = EditorGUILayout.ColorField("Bottom Color", bottomColor);
        upVector = EditorGUILayout.Vector3Field("Up Vector", upVector);
        exp = EditorGUILayout.Slider("Exp", exp, 0f, 1f);

        ambientColor = EditorGUILayout.ColorField("Ambient Color", ambientColor); // Ambient Color 추가

        if (EditorGUI.EndChangeCheck())
        {
            skyboxMaterial.SetColor("_TopColor", topColor);
            skyboxMaterial.SetColor("_CenterColor", centerColor);
            skyboxMaterial.SetColor("_BottomColor", bottomColor);
            skyboxMaterial.SetVector("_Up", upVector);
            skyboxMaterial.SetFloat("_Exp", exp);

            // Ambient Color 설정
            RenderSettings.ambientLight = ambientColor;

            previewTexture = AssetPreview.GetAssetPreview(skyboxMaterial);
            SceneView.RepaintAll();
        }

        GUILayout.Label("Skybox Preview", EditorStyles.boldLabel);

        if (previewTexture != null)
        {
            GUILayout.Label(previewTexture, GUILayout.Width(300), GUILayout.Height(100));
        }

        if (defaultLight != null)
        {
            EditorGUI.BeginChangeCheck();
            defaultRotation = EditorGUILayout.Vector3Field("Default Light Rotation", defaultRotation);
            lightIntensity = EditorGUILayout.Slider("Light Intensity", lightIntensity, 0f, 1.5f);

            if (EditorGUI.EndChangeCheck())
            {
                Undo.RecordObject(defaultLight.transform, "Change Light Settings");

                defaultLight.transform.rotation = Quaternion.Euler(defaultRotation);

                Light lightComponent = defaultLight.GetComponent<Light>();
                if (lightComponent != null)
                {
                    lightComponent.intensity = lightIntensity;
                    EditorUtility.SetDirty(lightComponent);
                }

                EditorUtility.SetDirty(defaultLight);
            }
        }
        else
        {
            EditorGUILayout.HelpBox("No object with tag 'DefaultLight' found in the scene.", MessageType.Warning);
        }
    }
}
