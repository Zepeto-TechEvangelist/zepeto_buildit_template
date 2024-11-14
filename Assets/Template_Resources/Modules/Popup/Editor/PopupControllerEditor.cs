using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using UnityEditor;
using UnityEditor.Experimental.GraphView;
using UnityEditorInternal;
using UnityEngine;

namespace ZEPETO.Script
{
    [CustomEditor(typeof(PopupController))]
    [CanEditMultipleObjects]
    public class PopupControllerEditor : ZepetoScriptBehaviourComponentEditor
    {
        public override void OnInspectorGUI()
        {
            base.OnInspectorGUI();
            
            var targetComponent = this.target as PopupController;
            if (targetComponent == null) return;
            targetComponent.SerializeProperties();
        }
    }
}