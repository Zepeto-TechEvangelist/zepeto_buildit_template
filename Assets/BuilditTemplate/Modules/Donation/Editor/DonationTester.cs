using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Unity.EditorCoroutines.Editor;
using UnityEditor;
using UnityEngine;
using ZEPETO.Script;


namespace BuilditTemplate.Editor
{
    public class DonationTester : EditorWindow
    {
        private static EditorWindow _window;
        private static ZepetoScriptBehaviourComponent _manager;

        [MenuItem("ZEPETO/Donation/Tester")]
        public static void ShowWindow()
        {
            _window = GetWindow<DonationTester>("Donation");
        }

        private void OnGUI()
        {
            if (!_window)
            {
                ShowWindow();
            }

            if (!_manager)
            {
                _manager = GameObject.Find("DonationManager")?.GetComponent<ZepetoScriptBehaviourComponent>();
            }
            

            GUILayout.BeginVertical();

            if (!_manager)
            {
                GUILayout.Label("To support donation in the World add a LiveDonation object");
            }
            else if (Application.isPlaying)
            {

                foreach (var i in new[] { 10, 50, 100, 500, 1000 })
                {
                    if (GUILayout.Button("Donate " + i + " ZEM", GUILayout.Height(45)))
                    {
                        // TODO: Fire event to a global trigger (runtime)
                        _manager.Invoke("TestDonation" + $"{i}");
                    }

                    GUILayout.Space(5);
                }

            }
            else
            {
                GUILayout.Label("Testing is available only in play mode");
            }

            GUILayout.EndVertical();
        }

    }
}