using System;
using System.Collections;
using UnityEditor;
using UnityEngine;
using UnityEngine.UI;
using ZEPETO.Script;
// using ZEPETO.World.Gui;

namespace ZEPETO.Script
{
    public class PopupController : ZepetoScriptBehaviourComponent
    {
        
#if UNITY_EDITOR
        public void SerializeProperties()
        {
            var isDirty = EditorUtility.IsDirty(this);
            if (!isDirty) return;
            
            // Text
            script.TryGetValue("message", out var message);
            script.TryGetValue("messageColor", out var messageColor);
            script.TryGetValue("messageShadow", out var messageShadow);

            script.TryGetValue("_text", out var _text);
            // ((ZepetoText)_text).text = (string)message;
            // ((ZepetoText)_text).color = (Color)messageColor;
            // ((ZepetoText)_text).GetComponent<Shadow>().enabled = (bool)messageShadow;
            //
            // // Button
            // script.TryGetValue("buttonTitle", out var buttonTitle);
            // script.TryGetValue("_button", out var _button);
            // ((Button)_button).GetComponentInChildren<ZepetoText>().text = (string)buttonTitle;
                
            // Background
            script.TryGetValue("backgroundImage", out var backgroundImage);
            script.TryGetValue("_background", out var _background);
            ((Image)_background).sprite = (Sprite)backgroundImage;
        }
#endif
    }
}