Shader "Custom/rim"
{
    Properties
    {
        _RimColor ("RimColor", Color) = (1,1,1,1)
        _RimPower ("RimPower", Range(0,5)) = 0.5
    
    }
    SubShader
    {
        Tags { "RenderType" = "Transparent"  "Queue" = "Transparent+0" }
        LOD 200
        Blend SrcAlpha OneMinusSrcAlpha

        CGPROGRAM
        // Physically based Standard lighting model, and enable shadows on all light types
        #pragma surface surf Standard keepalpha

        // Use shader model 3.0 target, to get nicer looking lighting
        #pragma target 3.0

        //sampler2D _MainTex;

        struct Input
        {
            float3 viewDir;
		    float3 worldNormal; INTERNAL_DATA

        };

        half _RimPower;
        fixed4 _RimColor;

        // Add instancing support for this shader. You need to check 'Enable Instancing' on materials that use the shader.
        // See https://docs.unity3d.com/Manual/GPUInstancing.html for more information about instancing.
        // #pragma instancing_options assumeuniformscaling
        UNITY_INSTANCING_BUFFER_START(Props)
            // put more per-instance properties here
        UNITY_INSTANCING_BUFFER_END(Props)

        void surf (Input IN, inout SurfaceOutputStandard o)
        {
            // Albedo comes from a texture tinted by color
            //fixed4 c = tex2D (_MainTex, IN.uv_MainTex) * _Color;
            o.Albedo = 0;
            // Metallic and smoothness come from slider variables
            //o.Metallic = _Metallic;
            //o.Smoothness = _Glossiness;
            float rim = dot(IN.worldNormal, IN.viewDir);
            o.Emission = pow(1 - rim, _RimPower) * _RimColor.rgb;
            o.Emission = max(0, o.Emission);
            o.Alpha = pow(1 - rim, _RimPower);// * _RimColor.rgb;
        }
        ENDCG
    }
    FallBack "Diffuse"
}
