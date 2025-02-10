using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;
using Unity.EditorCoroutines.Editor;
using UnityEditor;
using UnityEngine;

namespace BuilditTemplate.Editor
{
    public class PackageManager : EditorWindow
    {
        private Content selectedData;
        private ContentList contentList;
        private ContentList themeList;
        
        private string lastUpdateTime = "";

        private Language selectedLanguage = Language.English;
        private readonly string[] languages = Enum.GetNames(typeof(Language));
        
        private static EditorWindow _window;

        
        [MenuItem("ZEPETO/BuildIt Plugin Package Manager")]
        public static void ShowWindow()
        {
            _window = GetWindow<PackageManager>("Build It Plugin Package Manager");
        }

        private void OnGUI()
        {
            if (!_window)
            {
                ShowWindow();
            }

            if (contentList == null)
            {
                selectedLanguage =
                    Application.systemLanguage == SystemLanguage.Korean ? Language.Korean : Language.English;
                DoTopBarGUI();
                
                EditorCoroutineUtility.StartCoroutine(LoadDataAsync(), this);

                GUILayout.BeginArea(new Rect(position.width * 0.5f, position.height * 0.5f, 400, 100));
                EditorGUILayout.BeginHorizontal();
                {
                    GUILayout.Label("Wait...");
                }
                EditorGUILayout.EndHorizontal();
                GUILayout.EndArea();
            }
            else
            {
                DrawAll();
            }
        }

        private void DrawAll()
        {
            // TODO: Rename some
            DoTopBarGUI();
            GUILayout.BeginHorizontal();

            DoSideButtonGUI();
            if (selectedData != null)
            {
                GUILayout.BeginVertical();

                DoTopButtonGUI();
                DoVersionInfoGUI();
                DoDescriptionGUI();
                DoDependencyInfoGUI();
                DoPreviewImageGUI();

                GUILayout.EndVertical();
            }

            GUILayout.EndHorizontal();
        }

        private void DoTopBarGUI()
        {
            GUILayout.Box("", GUILayout.ExpandWidth(true), GUILayout.Height(3));

            GUILayout.BeginHorizontal();

            var labelStyle = new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.MiddleLeft,
                fontSize = 24
            };

            GUILayout.Label("Build It Plugin Package Manager", labelStyle);
            GUILayout.Box("", GUILayout.ExpandWidth(true), GUILayout.Height(3));

            GUILayout.FlexibleSpace();
            
            selectedLanguage =
                (Language)EditorGUILayout.Popup((int)selectedLanguage, languages, GUILayout.Width(150),
                    GUILayout.Height(30));
            
            GUILayout.EndHorizontal();
            GUILayout.Label(" Easily add frequently used modules.", EditorStyles.label);

            GUILayout.Box("", GUILayout.Height(3), GUILayout.ExpandWidth(true));
        }

        private void DoSideButtonGUI()
        {
            const int buttonWidth = 200;
            GUILayout.BeginVertical(GUILayout.Width(buttonWidth));
            selectedData ??= contentList.Items[0];

            foreach (var data in contentList.Items)
            {
                if (GUILayout.Button("", GUILayout.Width(buttonWidth), GUILayout.Height(30)))
                {
                    selectedData = data;
                }

                var guiRect = GUILayoutUtility.GetLastRect();
                var statusRect = new Rect(guiRect.x + (guiRect.width * 0.02f), guiRect.y, guiRect.width,
                    guiRect.height);
                var titleRect = new Rect(guiRect.x + (guiRect.width * 0.12f), guiRect.y, guiRect.width,
                    guiRect.height);
                var versionRect = new Rect(guiRect.x + (guiRect.width * 0.82f), guiRect.y, guiRect.width,
                    guiRect.height);

                GUI.Label(titleRect, data.Title);
                var version = PackageUtility.VersionCheck(GetRemoveSpace(data.Title) + "Version");
                if (version != "UNKNOWN")
                {
                    var labelStyle = new GUIStyle(GUI.skin.label);
                    GUI.Label(versionRect, version, EditorStyles.miniLabel);
                    var statusTexture = version == data.LatestVersion
                        ? EditorGUIUtility.FindTexture("d_winbtn_mac_max")
                        : EditorGUIUtility.FindTexture("d_winbtn_mac_min");
                    GUI.Label(statusRect, statusTexture);
                }
            }

            
            
            // Themes
            GUILayout.Space(20);
            GUILayout.Label(" Themes", EditorStyles.label);
            
            foreach (var data in contentList.Themes)
            {
                if (GUILayout.Button("", GUILayout.Width(buttonWidth), GUILayout.Height(30)))
                {
                    selectedData = data;
                }

                var guiRect = GUILayoutUtility.GetLastRect();
                var statusRect = new Rect(guiRect.x + (guiRect.width * 0.02f), guiRect.y, guiRect.width,
                    guiRect.height);
                var titleRect = new Rect(guiRect.x + (guiRect.width * 0.12f), guiRect.y, guiRect.width,
                    guiRect.height);
                var versionRect = new Rect(guiRect.x + (guiRect.width * 0.82f), guiRect.y, guiRect.width,
                    guiRect.height);

                GUI.Label(titleRect, data.Title);
                var version = PackageUtility.VersionCheck(GetRemoveSpace(data.Title) + "Version");
                if (version != "UNKNOWN")
                {
                    var labelStyle = new GUIStyle(GUI.skin.label);
                    GUI.Label(versionRect, version, EditorStyles.miniLabel);
                    var statusTexture = version == data.LatestVersion
                        ? EditorGUIUtility.FindTexture("d_winbtn_mac_max")
                        : EditorGUIUtility.FindTexture("d_winbtn_mac_min");
                    GUI.Label(statusRect, statusTexture);
                }
            }
            
            
            DoContibuteButtonGUI();
            GUILayout.EndVertical();
            GUILayout.Box("", GUILayout.ExpandHeight(true), GUILayout.Width(3));
        }

        private void DoUpdateButtonGUI()
        {
            GUILayout.BeginHorizontal();

            GUILayout.FlexibleSpace();
            GUILayout.Label("Last Update : " + lastUpdateTime, EditorStyles.boldLabel, GUILayout.Height(30));
            if (GUILayout.Button(EditorGUIUtility.FindTexture("d_Refresh"), GUILayout.Width(30), GUILayout.Height(30)))
            {
                contentList = null;
                lastUpdateTime = "";
                EditorCoroutineUtility.StartCoroutine(LoadDataAsync(), this);
            }

            GUILayout.EndHorizontal();
        }

        private void DoContibuteButtonGUI()
        {
            GUILayout.BeginVertical();
            GUILayout.FlexibleSpace();
            if (GUILayout.Button("Report Issue", GUILayout.Width(200), GUILayout.Height(20)))
            {
                OpenLocalizeURL(Constants.ISSUE_REPORT_PATH);
            }

            // if (GUILayout.Button("Contribute", GUILayout.Width(200), GUILayout.Height(20)))
            // {
            //     OpenLocalizeURL(Constants.CONTRIBUTE_PATH);
            // }

            GUILayout.Space(3);
            GUILayout.EndVertical();
        }

        private void DoTopButtonGUI()
        {
            var labelStyle = new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.MiddleLeft,
                fontSize = 20,
                fontStyle = FontStyle.Bold
            };

            GUILayout.BeginHorizontal();
            GUILayout.Label(selectedData.Title, labelStyle);
            GUILayout.FlexibleSpace();

            if (GUILayout.Button("View Import Guide", GUILayout.Height(20), GUILayout.ExpandWidth(false)))
            {
                var url = Path.Combine(Constants.REPO_PATH, GetRemoveSpace(selectedData.Title),
                    Constants.README_PATH);
                OpenLocalizeURL(url);
            }

            if (GUILayout.Button("Import " + selectedData.LatestVersion, GUILayout.Height(20),
                    GUILayout.ExpandWidth(false)))
            {
                string title = GetRemoveSpace(selectedData.Title);
                string version = "v" + selectedData.LatestVersion;
                EditorCoroutineUtility.StartCoroutine(PackageUtility.ImportPackage(title, version), this);
            }

            GUILayout.EndHorizontal();

            GUILayout.Box("", GUILayout.ExpandWidth(true), GUILayout.Height(3));
        }

        private void DoVersionInfoGUI()
        {
            var className = GetRemoveSpace(selectedData.Title) + "Version";
            var downloadedVersion = PackageUtility.VersionCheck(className);

            GUILayout.Label($"Version : {downloadedVersion}", EditorStyles.boldLabel);

            var linkStyle = new GUIStyle(GUI.skin.label)
            {
                normal =
                {
                    textColor = new Color(0.0f, 0.47f, 1.0f)
                },
                hover =
                {
                    textColor = Color.yellow
                },
                fontStyle = FontStyle.Italic
            };

            GUILayout.BeginHorizontal();

            if (GUILayout.Button("See other version", linkStyle))
            {
                var versionUrl = Path.Combine(Constants.REPO_PATH, GetRemoveSpace(selectedData.Title));
                Application.OpenURL(versionUrl);
            }

            GUILayout.Label("-");
            if (GUILayout.Button("API Docs", linkStyle))
            {
                OpenLocalizeURL(selectedData.DocsUrl);
            }

            GUILayout.FlexibleSpace();

            GUILayout.EndHorizontal();

            GUILayout.Box("", GUILayout.ExpandWidth(true), GUILayout.Height(3));
        }

        private void DoDependencyInfoGUI()
        {
            GUILayout.Box("", GUILayout.ExpandWidth(true), GUILayout.Height(3));
            GUILayout.Label("Dependencies", EditorStyles.boldLabel);
            GUILayout.Box("", GUILayout.ExpandWidth(true), GUILayout.Height(3));
            GUILayout.Label("Is Using", EditorStyles.boldLabel);

            GUILayout.BeginVertical();
            foreach (var dependency in selectedData.Dependencies)
            {
                GUILayout.Label("\t" + dependency, EditorStyles.label);
            }

            GUILayout.EndVertical();


            GUILayout.Box("", GUILayout.ExpandWidth(true), GUILayout.Height(3));
        }

        private void DoDescriptionGUI()
        {
            var style = new GUIStyle
            {
                wordWrap = true,
                normal =
                {
                    textColor = Color.white
                }
            };

            GUILayout.Label(selectedLanguage == 0 ? selectedData.Description : selectedData.Description_ko, style);
        }

        private void DoPreviewImageGUI()
        {
            GUILayout.Label("Preview", EditorStyles.boldLabel);
            GUILayout.BeginHorizontal();
            GUILayout.FlexibleSpace();
            if (selectedData.previewImage)
                GUILayout.Box(selectedData.previewImage, GUILayout.Width(selectedData.previewImage.width),
                    GUILayout.Height(selectedData.previewImage.height));
            GUILayout.FlexibleSpace();
            GUILayout.EndHorizontal();
        }

        private IEnumerator LoadDataAsync()
        {
            if (false)
            {
                var data = File.ReadAllText("Assets/BuilditTemplate/PackageManager/Version/moduleInfo.json");
                contentList = JsonUtility.FromJson<ContentList>(data);
                lastUpdateTime = DateTime.Now.ToString("HH:mm");
                for (var i = 0; i < contentList.Items.Count; i++)
                {
                    EditorCoroutineUtility.StartCoroutine(LoadImageAsync(i), this);
                }
                yield break;
            }
            
            yield return NetworkingUtility.GetDataAsync((data) =>
            {
                if (contentList != null || data == null) return;
                
                // Debug
                
                contentList = JsonUtility.FromJson<ContentList>(data);
                lastUpdateTime = DateTime.Now.ToString("HH:mm");
                for (var i = 0; i < contentList.Items.Count; i++)
                {
                    EditorCoroutineUtility.StartCoroutine(LoadImageAsync(i), this);
                }
            });
        }

        private IEnumerator LoadImageAsync(int i)
        {
            var url = Path.Combine(
                Constants.DOWNLOAD_PATH, 
                GetRemoveSpace(contentList.Items[i].Title),
                "Preview.png");
            
            yield return NetworkingUtility.GetTextureAsync(url, (texture) =>
            {
                if (texture != null)
                    contentList.Items[i].previewImage = texture;
            });
        }

        private void OpenLocalizeURL(string url)
        {
            var localizeUrl = url;

            switch (selectedLanguage)
            {
                case Language.Korean:
                    localizeUrl = Regex.Replace(url, "lang-en", "lang-ko");
                    localizeUrl = Regex.Replace(localizeUrl, ".md", "_KR.md");
                    break;

                case Language.English:
                default:
                    break;
            }

            Application.OpenURL(localizeUrl);
        }

        private static string GetRemoveSpace(string s)
        {
            return s.Replace(" ", "");
        }

        [System.Serializable]
        public class Content
        {
            public string Title;
            public string Description;
            public string Description_ko;
            public string DocsUrl;
            public string LatestVersion;
            public string[] Dependencies;
            public Texture2D previewImage;
        }

        [System.Serializable]
        public class ContentList
        {
            public List<Content> Items;
            public List<Content> Themes;
        }

        public enum Language
        {
            English = 0,
            Korean = 1
        }
    }
}