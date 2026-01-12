using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using UnityEditor;
using UnityEngine;
using ZEPETO.Script;

public class NpcDialogueEditorWindow : EditorWindow
{
    [Serializable]
    public class DialogueOption
    {
        public string question = "";
        public string answer = "";
    }

    private GameObject selectedNPC;
    private string dialogueId = "npc_1";
    private string npcName = "NPC";
    private string dialogueText = "Hello!";
    private List<DialogueOption> dialogueOptions = new List<DialogueOption>();
    private Vector2 scrollPosition;
    private bool dataLoaded = false;
    private string dialogueDataFilePath = "";

    [MenuItem("ZEPETO 2D/Edit NPC Dialogue", priority = 100)]
    public static void ShowWindow()
    {
        NpcDialogueEditorWindow window = GetWindow<NpcDialogueEditorWindow>("NPC Dialogue Editor");
        window.Initialize();
    }

    private void Initialize()
    {
        // Auto-detect NPC from selection
        DetectNPCFromSelection();
        
        // Find NpcDialogueData.ts file (fixed path)
        dialogueDataFilePath = "Assets/zepeto-2d-world/Zepeto 2D World/ZepetoScript/NPC/NpcDialogueData.ts";
        if (!File.Exists(dialogueDataFilePath))
        {
            // Try to find it
            string[] guids = AssetDatabase.FindAssets("NpcDialogueData t:DefaultAsset");
            foreach (string guid in guids)
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                if (path.EndsWith(".ts"))
                {
                    dialogueDataFilePath = path;
                    break;
                }
            }
        }

        // Load dialogue ID from selected NPC if available
        if (selectedNPC != null)
        {
            // Auto-generate ID from NPC name if not set
            if (string.IsNullOrEmpty(dialogueId))
            {
                dialogueId = GenerateAutoId(selectedNPC.name);
            }
            LoadDialogueIdFromNPC();
        }

        // Auto-load data if dialogueId is set
        if (!string.IsNullOrEmpty(dialogueId) && !string.IsNullOrEmpty(dialogueDataFilePath))
        {
            LoadDialogueData();
        }
    }
    
    private void OnEnable()
    {
        Selection.selectionChanged += OnSelectionChange;
    }
    
    private void OnDisable()
    {
        Selection.selectionChanged -= OnSelectionChange;
    }

    private bool IsValidNPC(GameObject obj)
    {
        if (obj == null) return false;
        
        // For simplicity, accept any GameObject - user knows what they're doing
        // We'll just try to find the TypeScript file and load dialogueId if possible
        return true;
    }

    private void DetectNPCFromSelection()
    {
        GameObject selected = Selection.activeGameObject;
        if (selected != null && IsValidNPC(selected))
        {
            selectedNPC = selected;
        }
        else
        {
            selectedNPC = null;
        }
    }

    private void LoadDialogueIdFromNPC()
    {
        if (selectedNPC == null) return;

        // First, try to read dialogueId directly from ZepetoScript component
        try
        {
            var zepetoComponents = selectedNPC.GetComponents<ZepetoScriptBehaviourComponent>();
            foreach (var comp in zepetoComponents)
            {
                if (comp != null && comp.script != null)
                {
                    // Try to get dialogueId value from script
                    if (comp.script.TryGetValue("dialogueId", out var dialogueIdValue))
                    {
                        if (dialogueIdValue != null)
                        {
                            dialogueId = dialogueIdValue.ToString();
                            Debug.Log($"[NPC Dialogue Editor] Loaded dialogueId from component: {dialogueId}");
                            return;
                        }
                    }
                }
            }
        }
        catch (Exception e)
        {
            Debug.LogWarning($"[NPC Dialogue Editor] Could not read from ZepetoScript component: {e.Message}");
        }

        // Also check children
        try
        {
            var allZepetoComponents = selectedNPC.GetComponentsInChildren<ZepetoScriptBehaviourComponent>(true);
            foreach (var comp in allZepetoComponents)
            {
                if (comp != null && comp.script != null)
                {
                    if (comp.script.TryGetValue("dialogueId", out var dialogueIdValue))
                    {
                        if (dialogueIdValue != null)
                        {
                            dialogueId = dialogueIdValue.ToString();
                            Debug.Log($"[NPC Dialogue Editor] Loaded dialogueId from child component: {dialogueId}");
                            return;
                        }
                    }
                }
            }
        }
        catch (Exception e)
        {
            Debug.LogWarning($"[NPC Dialogue Editor] Could not read from child ZepetoScript component: {e.Message}");
        }

        // Fallback: Try to find TypeScript file and read from it
        GameObject prefabAsset = null;
        string prefabPath = PrefabUtility.GetPrefabAssetPathOfNearestInstanceRoot(selectedNPC);
        if (!string.IsNullOrEmpty(prefabPath))
        {
            prefabAsset = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath);
        }
        
        if (prefabAsset == null)
        {
            prefabAsset = PrefabUtility.GetCorrespondingObjectFromSource(selectedNPC);
        }

        // Try to find TypeScript files from common NPC script names
        string[] possibleScriptNames = { "ZepetoNpc", "SpriteNpc", "NpcBase", "ZepetoNpc2D", "SpriteNpc2D", "NpcBase2D" };
        
        if (prefabAsset != null)
        {
            string prefabName = prefabAsset.name;
            possibleScriptNames = possibleScriptNames.Concat(new[] { prefabName, prefabName.Replace(" ", "") }).ToArray();
        }
        
        string npcName = selectedNPC.name;
        possibleScriptNames = possibleScriptNames.Concat(new[] { npcName, npcName.Replace(" ", "") }).ToArray();

        foreach (string scriptName in possibleScriptNames)
        {
            if (string.IsNullOrEmpty(scriptName)) continue;
            
            string[] scriptGuids = AssetDatabase.FindAssets($"{scriptName} t:DefaultAsset");
            foreach (string guid in scriptGuids)
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                if (path.EndsWith(".ts"))
                {
                    if (path.Contains("NPC") || path.Contains("Npc") || scriptName.Contains("Npc"))
                    {
                        LoadDialogueIdFromScript(path);
                        return;
                    }
                }
            }
        }

        // Last fallback: Search all NPC TypeScript files
        string[] allNpcGuids = AssetDatabase.FindAssets("Npc2D t:DefaultAsset");
        foreach (string guid in allNpcGuids)
        {
            string path = AssetDatabase.GUIDToAssetPath(guid);
            if (path.EndsWith(".ts") && (path.Contains("ZepetoNpc") || path.Contains("SpriteNpc") || path.Contains("NpcBase")))
            {
                LoadDialogueIdFromScript(path);
                return;
            }
        }
    }

    private void LoadDialogueIdFromScript(string scriptPath)
    {
        try
        {
            string content = File.ReadAllText(scriptPath);
            Match match = Regex.Match(content, @"dialogueId:\s*string\s*=\s*['""]([^'""]*)['""]");
            if (match.Success)
            {
                dialogueId = match.Groups[1].Value;
            }
        }
        catch (Exception e)
        {
            Debug.LogWarning($"[NPC Dialogue Editor] Could not load dialogue ID: {e.Message}");
        }
    }

    private void OnGUI()
    {
        EditorGUILayout.LabelField("NPC Dialogue Editor", EditorStyles.boldLabel);
        EditorGUILayout.Space();

        // NPC Selection (Drag & Drop)
        EditorGUILayout.BeginHorizontal();
        EditorGUILayout.LabelField("NPC GameObject:", GUILayout.Width(120));
        GameObject newSelection = (GameObject)EditorGUILayout.ObjectField(
            selectedNPC, 
            typeof(GameObject), 
            true,  // allow scene objects
            GUILayout.ExpandWidth(true)
        );
        
        if (newSelection != selectedNPC)
        {
            selectedNPC = newSelection;
            if (selectedNPC != null)
            {
                // Auto-generate ID from NPC name if not set
                if (string.IsNullOrEmpty(dialogueId))
                {
                    dialogueId = GenerateAutoId(selectedNPC.name);
                }
                
                // Try to load dialogueId from NPC component (but don't fail if not found)
                LoadDialogueIdFromNPC();
                
                // Auto-load data if dialogueId is set
                if (!string.IsNullOrEmpty(dialogueId) && !string.IsNullOrEmpty(dialogueDataFilePath))
                {
                    LoadDialogueData();
                }
            }
        }
        
        if (GUILayout.Button("Auto", GUILayout.Width(50)))
        {
            DetectNPCFromSelection();
            if (selectedNPC != null)
            {
                // Auto-generate ID from NPC name if not set
                if (string.IsNullOrEmpty(dialogueId))
                {
                    dialogueId = GenerateAutoId(selectedNPC.name);
                }
                LoadDialogueIdFromNPC();
                if (!string.IsNullOrEmpty(dialogueId))
                {
                    LoadDialogueData();
                }
            }
        }
        EditorGUILayout.EndHorizontal();
        
        if (selectedNPC == null)
        {
            EditorGUILayout.HelpBox("💡 How to use:\n1. Drag an NPC GameObject from Hierarchy here\n2. Or select an NPC and click 'Auto' button", MessageType.Info);
        }

        EditorGUILayout.Space();

        // Dialogue ID
        EditorGUILayout.BeginHorizontal();
        EditorGUILayout.LabelField("Dialogue ID:", GUILayout.Width(120));
        dialogueId = EditorGUILayout.TextField(dialogueId);
        if (GUILayout.Button("Auto", GUILayout.Width(50)))
        {
            // Auto-generate ID from NPC name
            if (selectedNPC != null)
            {
                dialogueId = GenerateAutoId(selectedNPC.name);
            }
            else if (!string.IsNullOrEmpty(npcName))
            {
                dialogueId = GenerateAutoId(npcName);
            }
            else
            {
                dialogueId = "npc_" + System.DateTime.Now.Ticks.ToString().Substring(10);
            }
        }
        EditorGUILayout.EndHorizontal();

        if (string.IsNullOrEmpty(dialogueId))
        {
            EditorGUILayout.HelpBox("💡 Click 'Auto' button to generate ID automatically", MessageType.Info);
        }
        else
        {
            EditorGUILayout.HelpBox($"✅ ID to save: {dialogueId}", MessageType.None);
        }

        if (string.IsNullOrEmpty(dialogueDataFilePath))
        {
            EditorGUILayout.HelpBox("❌ NpcDialogueData.ts file not found!", MessageType.Error);
            return;
        }

        EditorGUILayout.Space();

        if (!dataLoaded)
        {
            EditorGUILayout.HelpBox("💡 Click the button below to load dialogue data", MessageType.Info);
            if (GUILayout.Button("📂 Load Dialogue Data", GUILayout.Height(30)))
            {
                LoadDialogueData();
            }
            return;
        }

        EditorGUILayout.LabelField("Dialogue Settings", EditorStyles.boldLabel);

        // NPC Name
        EditorGUILayout.BeginHorizontal();
        EditorGUILayout.LabelField("NPC Name:", GUILayout.Width(120));
        npcName = EditorGUILayout.TextField(npcName);
        EditorGUILayout.EndHorizontal();

        // Dialogue Text
        EditorGUILayout.LabelField("What NPC says:");
        dialogueText = EditorGUILayout.TextArea(dialogueText, GUILayout.Height(60));

        EditorGUILayout.Space();
        EditorGUILayout.LabelField("Questions & Answers", EditorStyles.boldLabel);

        // Dialogue Options List
        scrollPosition = EditorGUILayout.BeginScrollView(scrollPosition, GUILayout.Height(300));

        for (int i = 0; i < dialogueOptions.Count; i++)
        {
            EditorGUILayout.BeginVertical("box");
            EditorGUILayout.LabelField($"Option {i + 1}", EditorStyles.boldLabel);

            EditorGUILayout.BeginHorizontal();
            EditorGUILayout.LabelField("Question:", GUILayout.Width(80));
            dialogueOptions[i].question = EditorGUILayout.TextField(dialogueOptions[i].question);
            EditorGUILayout.EndHorizontal();

            EditorGUILayout.BeginHorizontal();
            EditorGUILayout.LabelField("Answer:", GUILayout.Width(80));
            dialogueOptions[i].answer = EditorGUILayout.TextArea(dialogueOptions[i].answer, GUILayout.Height(40));
            EditorGUILayout.EndHorizontal();

            EditorGUILayout.BeginHorizontal();
            bool shouldRemove = GUILayout.Button("Remove", GUILayout.Width(60));
            EditorGUILayout.EndHorizontal();
            
            EditorGUILayout.EndVertical();
            EditorGUILayout.Space(5);
            
            if (shouldRemove)
            {
                dialogueOptions.RemoveAt(i);
                i--;
            }
        }

        EditorGUILayout.EndScrollView();

        // Add button
        if (GUILayout.Button("+ Add Option", GUILayout.Height(25)))
        {
            dialogueOptions.Add(new DialogueOption());
        }

        EditorGUILayout.Space(10);

        // Save and Delete buttons
        EditorGUILayout.BeginHorizontal();
        if (GUILayout.Button("Save Dialogue", GUILayout.Height(35)))
        {
            SaveDialogueData();
        }
        if (GUILayout.Button("Reload", GUILayout.Width(70), GUILayout.Height(35)))
        {
            LoadDialogueData();
        }
        EditorGUI.BeginDisabledGroup(string.IsNullOrEmpty(dialogueId));
        if (GUILayout.Button("Delete", GUILayout.Width(70), GUILayout.Height(35)))
        {
            if (EditorUtility.DisplayDialog("Delete Dialogue", 
                $"Are you sure you want to delete dialogue with ID '{dialogueId}'?", 
                "Delete", "Cancel"))
            {
                DeleteDialogueData();
            }
        }
        EditorGUI.EndDisabledGroup();
        EditorGUILayout.EndHorizontal();

        EditorGUILayout.Space(5);
        EditorGUILayout.HelpBox("After saving, set the 'Dialogue ID' field in the NPC component to match the ID above.", MessageType.Info);
    }

    private void LoadDialogueData()
    {
        if (string.IsNullOrEmpty(dialogueDataFilePath) || !File.Exists(dialogueDataFilePath))
        {
            EditorUtility.DisplayDialog("Error", "Dialogue data file not found: " + dialogueDataFilePath, "OK");
            return;
        }

        if (string.IsNullOrEmpty(dialogueId))
        {
            EditorUtility.DisplayDialog("Error", "Please enter a Dialogue ID first.", "OK");
            return;
        }

        try
        {
            string content = File.ReadAllText(dialogueDataFilePath);

            // Find the entry in the dictionary - match across multiple lines
            string escapedId = Regex.Escape(dialogueId);
            // Match the entire DialogueDataMap.set block including nested braces
            string pattern = @"DialogueDataMap\.set\('" + escapedId + @"',\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\);";
            Match match = Regex.Match(content, pattern, RegexOptions.Singleline | RegexOptions.Multiline);

            if (!match.Success)
            {
                // Try simpler pattern for single-line entries
                pattern = @"DialogueDataMap\.set\('" + escapedId + @"',\s*\{([^}]+)\}\);";
                match = Regex.Match(content, pattern, RegexOptions.Singleline);
            }

            if (match.Success)
            {
                string dataContent = match.Groups[1].Value;

                // Parse npcName - use custom parser to handle escaped quotes
                string nameValue = ExtractQuotedString(dataContent, "npcName");
                if (!string.IsNullOrEmpty(nameValue))
                {
                    npcName = UnescapeTypeScriptString(nameValue);
                }

                // Parse dialogueText - use custom parser to handle escaped quotes
                string dialogueValue = ExtractQuotedString(dataContent, "dialogueText");
                if (!string.IsNullOrEmpty(dialogueValue))
                {
                    dialogueText = UnescapeTypeScriptString(dialogueValue);
                }

                // Parse dialogueOptions array - match across multiple lines
                dialogueOptions.Clear();
                Match optionsMatch = Regex.Match(dataContent, @"dialogueOptions:\s*\[(.*?)\]", RegexOptions.Singleline | RegexOptions.Multiline);
                if (optionsMatch.Success)
                {
                    ParseDialogueOptions(optionsMatch.Groups[1].Value);
                }
            }
            else
            {
                // Entry not found, use defaults
                dialogueOptions.Clear();
                dialogueOptions.Add(new DialogueOption { question = "What brings you here?", answer = "Enjoy exploring!" });
                dialogueOptions.Add(new DialogueOption { question = "How can I help you?", answer = "Feel free to ask anything!" });
                dialogueOptions.Add(new DialogueOption { question = "Do you have any questions?", answer = "Have a great time!" });
            }

            dataLoaded = true;
            Debug.Log("[NPC Dialogue Editor] Data loaded successfully.");
        }
        catch (Exception e)
        {
            EditorUtility.DisplayDialog("Error", "Failed to load data: " + e.Message, "OK");
            Debug.LogError("[NPC Dialogue Editor] Error: " + e);
        }
    }

    private void ParseDialogueOptions(string optionsContent)
    {
        // Parse individual options: { question: '...', answer: '...' }
        // Find all { question: "...", answer: "..." } blocks
        int index = 0;
        while (index < optionsContent.Length)
        {
            int braceStart = optionsContent.IndexOf('{', index);
            if (braceStart < 0) break;

            // Find question field
            int questionIndex = optionsContent.IndexOf("question:", braceStart);
            if (questionIndex < 0) break;

            string question = ExtractQuotedString(optionsContent.Substring(questionIndex), "question");
            if (string.IsNullOrEmpty(question))
            {
                index = braceStart + 1;
                continue;
            }

            // Find answer field
            int answerIndex = optionsContent.IndexOf("answer:", questionIndex);
            if (answerIndex < 0) break;

            string answer = ExtractQuotedString(optionsContent.Substring(answerIndex), "answer");
            if (string.IsNullOrEmpty(answer))
            {
                index = braceStart + 1;
                continue;
            }

            dialogueOptions.Add(new DialogueOption
            {
                question = UnescapeTypeScriptString(question),
                answer = UnescapeTypeScriptString(answer)
            });

            // Move to next option
            int braceEnd = optionsContent.IndexOf('}', answerIndex);
            index = braceEnd > 0 ? braceEnd + 1 : optionsContent.Length;
        }
    }

    private string ExtractQuotedString(string content, string fieldName)
    {
        // Find field: fieldName: "..." or fieldName: '...'
        int fieldIndex = content.IndexOf(fieldName + ":");
        if (fieldIndex < 0) return null;

        int startIndex = fieldIndex + fieldName.Length + 1;
        // Skip whitespace
        while (startIndex < content.Length && char.IsWhiteSpace(content[startIndex]))
            startIndex++;

        if (startIndex >= content.Length) return null;

        char quoteChar = content[startIndex];
        if (quoteChar != '"' && quoteChar != '\'') return null;

        startIndex++; // Skip opening quote
        StringBuilder sb = new StringBuilder();
        int i = startIndex;

        while (i < content.Length)
        {
            if (content[i] == '\\' && i + 1 < content.Length)
            {
                // Escaped character
                sb.Append(content[i]);
                sb.Append(content[i + 1]);
                i += 2;
            }
            else if (content[i] == quoteChar)
            {
                // Closing quote found
                break;
            }
            else
            {
                sb.Append(content[i]);
                i++;
            }
        }

        return sb.ToString();
    }

    private string UnescapeTypeScriptString(string text)
    {
        // Unescape TypeScript string: \\ -> \, \" -> ", \n -> newline, \' -> '
        return text.Replace("\\\\", "\\")
                   .Replace("\\\"", "\"")
                   .Replace("\\'", "'")
                   .Replace("\\n", "\n")
                   .Replace("\\r", "\r");
    }

    private void SaveDialogueData()
    {
        if (string.IsNullOrEmpty(dialogueDataFilePath))
        {
            EditorUtility.DisplayDialog("Error", "No dialogue data file path.", "OK");
            return;
        }

        if (string.IsNullOrEmpty(dialogueId))
        {
            // Auto-generate ID from NPC name or GameObject name
            if (selectedNPC != null)
            {
                dialogueId = GenerateAutoId(selectedNPC.name);
            }
            else
            {
                dialogueId = GenerateAutoId(npcName);
            }
        }

        try
        {
            string content = File.ReadAllText(dialogueDataFilePath);

            // Escape strings properly for TypeScript (use double quotes to avoid escaping single quotes)
            string EscapeForTypeScript(string text)
            {
                // Replace backslashes first, then quotes, then newlines
                return text.Replace("\\", "\\\\")
                           .Replace("\"", "\\\"")
                           .Replace("\n", "\\n")
                           .Replace("\r", "");
            }

            // Build the new entry using double quotes to avoid escaping single quotes
            StringBuilder entryBuilder = new StringBuilder();
            entryBuilder.AppendLine($"    DialogueDataMap.set('{dialogueId}', {{");
            entryBuilder.AppendLine($"        npcName: \"{EscapeForTypeScript(npcName)}\",");
            entryBuilder.AppendLine($"        dialogueText: \"{EscapeForTypeScript(dialogueText)}\",");
            entryBuilder.AppendLine("        dialogueOptions: [");
            
            for (int i = 0; i < dialogueOptions.Count; i++)
            {
                string question = EscapeForTypeScript(dialogueOptions[i].question);
                string answer = EscapeForTypeScript(dialogueOptions[i].answer);
                entryBuilder.AppendLine($"            {{ question: \"{question}\", answer: \"{answer}\" }},");
            }
            
            entryBuilder.AppendLine("        ]");
            entryBuilder.Append("    });");

            string newEntry = entryBuilder.ToString();

            // Check if entry exists and replace it, otherwise add new
            string escapedId = Regex.Escape(dialogueId);
            // Match the entire DialogueDataMap.set block including nested braces
            string pattern = @"DialogueDataMap\.set\('" + escapedId + @"',\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\);";
            if (Regex.IsMatch(content, pattern, RegexOptions.Singleline | RegexOptions.Multiline))
            {
                // Replace existing entry
                content = Regex.Replace(content, pattern, newEntry, RegexOptions.Singleline | RegexOptions.Multiline);
            }
            else
            {
                // Add new entry after the last DialogueDataMap.set
                int lastSetIndex = content.LastIndexOf("DialogueDataMap.set");
                if (lastSetIndex >= 0)
                {
                    int insertIndex = content.IndexOf("});", lastSetIndex);
                    if (insertIndex >= 0)
                    {
                        content = content.Insert(insertIndex + 3, "\n\n" + newEntry);
                    }
                    else
                    {
                        // Fallback: add at the end before the closing
                        content = content.TrimEnd() + "\n\n" + newEntry + "\n";
                    }
                }
                else
                {
                    // No existing entries, add after the helper function comment
                    int helperIndex = content.IndexOf("// Helper function");
                    if (helperIndex >= 0)
                    {
                        content = content.Insert(helperIndex, newEntry + "\n\n");
                    }
                    else
                    {
                        content = content.TrimEnd() + "\n\n" + newEntry + "\n";
                    }
                }
            }

            File.WriteAllText(dialogueDataFilePath, content);
            
            AssetDatabase.Refresh();

            string message = $"Dialogue saved with ID: {dialogueId}\n\nSet 'Dialogue ID' in the NPC component to: {dialogueId}";
            
            EditorUtility.DisplayDialog("Success", message, "OK");
            Debug.Log("[NPC Dialogue Editor] Data saved: " + dialogueId);
        }
        catch (Exception e)
        {
            EditorUtility.DisplayDialog("Error", "Failed to save data: " + e.Message, "OK");
            Debug.LogError("[NPC Dialogue Editor] Error: " + e);
        }
    }

    private void DeleteDialogueData()
    {
        if (string.IsNullOrEmpty(dialogueDataFilePath) || !File.Exists(dialogueDataFilePath))
        {
            EditorUtility.DisplayDialog("Error", "Dialogue data file not found: " + dialogueDataFilePath, "OK");
            return;
        }

        if (string.IsNullOrEmpty(dialogueId))
        {
            EditorUtility.DisplayDialog("Error", "Please enter a Dialogue ID first.", "OK");
            return;
        }

        try
        {
            string content = File.ReadAllText(dialogueDataFilePath);

            // Find and remove the entry
            string escapedId = Regex.Escape(dialogueId);
            // Match the entire DialogueDataMap.set block including nested braces and trailing newlines
            string pattern = @"DialogueDataMap\.set\('" + escapedId + @"',\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\);\s*\n?";
            string newContent = Regex.Replace(content, pattern, "", RegexOptions.Singleline | RegexOptions.Multiline);

            // If pattern didn't match, try simpler pattern
            if (newContent == content)
            {
                pattern = @"DialogueDataMap\.set\('" + escapedId + @"',\s*\{[^}]+\}\);\s*\n?";
                newContent = Regex.Replace(content, pattern, "", RegexOptions.Singleline);
            }

            if (newContent != content)
            {
                File.WriteAllText(dialogueDataFilePath, newContent);
                AssetDatabase.Refresh();

                // Clear the editor fields
                npcName = "NPC";
                dialogueText = "Hello!";
                dialogueOptions.Clear();
                dialogueOptions.Add(new DialogueOption { question = "What brings you here?", answer = "Enjoy exploring!" });
                dialogueOptions.Add(new DialogueOption { question = "How can I help you?", answer = "Feel free to ask anything!" });
                dialogueOptions.Add(new DialogueOption { question = "Do you have any questions?", answer = "Have a great time!" });
                dataLoaded = false;

                EditorUtility.DisplayDialog("Success", $"Dialogue with ID '{dialogueId}' has been deleted.", "OK");
                Debug.Log("[NPC Dialogue Editor] Dialogue deleted: " + dialogueId);
            }
            else
            {
                EditorUtility.DisplayDialog("Error", $"Dialogue with ID '{dialogueId}' not found.", "OK");
            }
        }
        catch (Exception e)
        {
            EditorUtility.DisplayDialog("Error", "Failed to delete data: " + e.Message, "OK");
            Debug.LogError("[NPC Dialogue Editor] Error: " + e);
        }
    }

    private string GenerateAutoId(string name)
    {
        if (string.IsNullOrEmpty(name))
        {
            return "npc_" + System.DateTime.Now.Ticks.ToString().Substring(10);
        }
        
        // Convert to lowercase, remove spaces and special characters
        string cleanName = Regex.Replace(name.ToLower(), @"[^a-z0-9]", "_");
        cleanName = Regex.Replace(cleanName, @"_+", "_"); // Replace multiple underscores with single
        cleanName = cleanName.Trim('_');
        
        if (string.IsNullOrEmpty(cleanName))
        {
            cleanName = "npc";
        }
        
        return cleanName;
    }

    private string ResolveIdConflict(string content, string baseId)
    {
        string escapedBaseId = Regex.Escape(baseId);
        string pattern = "DialogueDataMap\\.set\\('" + escapedBaseId;
        
        // Check if base ID exists
        if (!Regex.IsMatch(content, pattern, RegexOptions.Singleline))
        {
            return baseId;
        }
        
        // Try baseId_1, baseId_2, etc.
        for (int i = 1; i <= 100; i++)
        {
            string candidateId = baseId + "_" + i;
            string candidatePattern = "DialogueDataMap\\.set\\('" + Regex.Escape(candidateId);
            if (!Regex.IsMatch(content, candidatePattern, RegexOptions.Singleline))
            {
                return candidateId;
            }
        }
        
        // If all numbers are taken, use hash
        return baseId + "_" + GetShortHash(selectedNPC != null ? selectedNPC.GetInstanceID().ToString() : System.DateTime.Now.Ticks.ToString());
    }

    private string GetShortHash(string input)
    {
        using (MD5 md5 = MD5.Create())
        {
            byte[] hashBytes = md5.ComputeHash(Encoding.UTF8.GetBytes(input));
            return BitConverter.ToString(hashBytes).Replace("-", "").Substring(0, 8).ToLower();
        }
    }

    private void OnSelectionChange()
    {
        DetectNPCFromSelection();
        if (selectedNPC != null)
        {
            LoadDialogueIdFromNPC();
            if (!string.IsNullOrEmpty(dialogueId) && !string.IsNullOrEmpty(dialogueDataFilePath))
            {
                LoadDialogueData();
            }
        }
        Repaint();
    }
}
