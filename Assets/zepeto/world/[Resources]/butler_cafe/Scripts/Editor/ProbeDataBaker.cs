using System;
using System.IO;
using System.Collections;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;


public class ProbeDataBaker : EditorWindow
{
    [MenuItem("Window/ProbeBaker")]
    static void ProbeBakerMenu() {
        ProbeDataBaker window = GetWindow<ProbeDataBaker>();
        window.Show();
    }
    
    [Serializable]
    public class SphericalHarmonics
    {
        public float[] coefficients = new float[27];
    }

    [Serializable]
    public class LightProbeData
    {
        public SphericalHarmonics[] bakedSH;
    }
    
    [SerializeField]
    [HideInInspector]public LightProbeData _lightProbeData;
    private bool _isBakeLightProbe = false;
    private bool _isBakeReflectionProbe = false;
    private string _outputPath;
    private string _lightProbeFileName;
    
    
    private void OnGUI() {
        EditorGUILayout.LabelField("Probe Settings");

        EditorGUILayout.Space(5);
        EditorGUILayout.LabelField("Light Probe File Name");
        _lightProbeFileName = GUILayout.TextField(_lightProbeFileName);
        EditorGUILayout.Space(3);
        EditorGUILayout.LabelField("Output Path");
        _outputPath = GUILayout.TextField(_outputPath);
        
        EditorGUILayout.Space(5);
        _isBakeLightProbe = GUILayout.Toggle(_isBakeLightProbe, "Bake Light Probe");
        //if (_isBakeLightProbe == true) {
            //Debug.Log("test GUI0");
        //}
        EditorGUILayout.Space(3);
        _isBakeReflectionProbe = GUILayout.Toggle(_isBakeReflectionProbe, "Bake Reflection Probe");
        //if (_isBakeReflectionProbe == true) {
            //Debug.Log("test GUI1");
        //}

        EditorGUILayout.Space(10);
        if (GUILayout.Button("Bake Data")) {
            LightProbeData tempProbeData = new LightProbeData();
            GenerateAndStoreProbeData(_lightProbeFileName, _outputPath, tempProbeData, _isBakeLightProbe, _isBakeReflectionProbe);
        }
    }
    
    ////////// Baker Functions //////////
    public bool CheckResourcesDirectoryExists(string dir)
    {
        return Directory.Exists(dir);
    }
    public void CreateResourcesDirectory(string dir)
    {
        if (!CheckResourcesDirectoryExists(dir))
        {
            Directory.CreateDirectory(dir);
        }
    }
    public void WriteJsonFile(string name, string path, string json)
    {
        string tempAbsoluteName = path + name + ".txt";
        File.WriteAllText(tempAbsoluteName, json); // Write all the data to the file.
    }
    
    public void GenerateAndStoreProbeData(string fileName, string path, LightProbeData probeData, bool isBakeLightProbe, bool isBakeReflProbe)
    {
        /// Empty & Create a Folder ///
        string resourcesDir = path;
        if (Directory.Exists(resourcesDir))
        {
            /*
            Debug.Log("Target Folder is not Empty, Delete & ReCreate: " + resourcesDir);
            string[] tempExistFiles = Directory.GetFiles(resourcesDir);
            for (int i =0; i < tempExistFiles.Length; i++)
            {
                //Debug.Log("Deleted Files: " + tempExistFiles[i]);
                File.Delete(tempExistFiles[i]);
                AssetDatabase.Refresh();
            }
            Directory.Delete(resourcesDir);
            */
        } else {
            CreateResourcesDirectory(resourcesDir);    
        }
        

        if (isBakeLightProbe == false && isBakeReflProbe == false) {
            Debug.Log("ProbeDataBaker => No Data to Bake, return..");
            return;
        }

        if (isBakeLightProbe == true) {
            List<SphericalHarmonics> newSphericalHarmonicsList = new List<SphericalHarmonics>();
            SphericalHarmonicsL2[] scene_LightProbes = new SphericalHarmonicsL2[LightmapSettings.lightProbes.bakedProbes.Length];
            scene_LightProbes = LightmapSettings.lightProbes.bakedProbes;

            for (int i = 0; i < scene_LightProbes.Length; i++)
            {
                var SHCoeff = new SphericalHarmonics();

                // j is coefficient
                for (int j = 0; j < 3; j++)
                {
                    //k is channel ( r g b )
                    for (int k = 0; k < 9; k++)
                    {
                        SHCoeff.coefficients[j * 9 + k] = scene_LightProbes[i][j, k];
                    }
                }
                newSphericalHarmonicsList.Add(SHCoeff);
            }
            probeData.bakedSH = newSphericalHarmonicsList.ToArray();
        }
        /*
        if (isBakeReflProbe == true) {
            // Copy Reflection Probes 
            List<ReflectionProbe> newReflectionProbes = new List<ReflectionProbe>();
            Object[] tempReflProbeData = Transform.FindObjectsOfType(typeof(ReflectionProbe));
            if (tempReflProbeData.Length > 0)
            {
                for (int i = 0; i < tempReflProbeData.Length; i++)
                {
                    newReflectionProbes.Add(tempReflProbeData[i] as ReflectionProbe);
                }
            }

            probeData.reflProbeData = new ReflectionProbe[newReflectionProbes.Count];
            for (int i = 0; i < newReflectionProbes.Count; i++)
            {
                probeData.reflProbeData[i] = newReflectionProbes[i];
                //Debug.Log("Probes: " + lightingScenariosData.reflProbes[i].name);
            }
        }
        */
        string json = JsonUtility.ToJson(probeData);
        WriteJsonFile(fileName ,path, json);
        
        //AssetDatabase.Refresh();
        Debug.Log("LightingDataInfo Storing DONE!: " + path);
    }
}


