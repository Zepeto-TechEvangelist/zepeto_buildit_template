// Upgrade NOTE: replaced 'mul(UNITY_MATRIX_MVP,*)' with 'UnityObjectToClipPos(*)'

// Upgrade NOTE: replaced '_Object2World' with 'unity_ObjectToWorld'

// Upgrade NOTE: replaced 'mul(UNITY_MATRIX_MVP,*)' with 'UnityObjectToClipPos(*)'

// Upgrade NOTE: replaced '_World2Object' with 'unity_WorldToObject'


Shader "Wit/TransparentTest" {
 Properties {
    _Color ("Main Color", Color) = (1, 1, 1, 1)
    _MainTex ("Base (RGB) Alpha (A)", 2D) = "white" {}
	_RimPower("Rim Power", Range(0.1, 10.0)) = 3.0
    _RimColor("Rim Color", Color) = (1.0, 1.0, 1.0, 1.0)
    _Cutoff ("Base Alpha cutoff", Range (0,1.0)) = 1.0
 }
 

SubShader {
    Tags { "Queue"="Transparent" "RenderType"="Transparent" }
    Lighting off
    Cull Off

    Pass {
        CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_fog

            #include "UnityCG.cginc"



            struct appdata_t {
                float4 vertex : POSITION;
                float2 texcoord : TEXCOORD0;
                float3 normal : NORMAL;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct v2f {
                float4 pos : SV_POSITION;
                float2 texcoord : TEXCOORD0;
                float4 posWorld: TEXCOORD2;
                float3 normalDir: TEXCOORD1;
                //float4 posWorld: TEXCOORD2;
                UNITY_FOG_COORDS(1)
                UNITY_VERTEX_OUTPUT_STEREO
            };

            sampler2D _MainTex;
            float4 _MainTex_ST, _RimColor;
            float _RimPower;
            fixed _Cutoff;

            v2f vert (appdata_t v)
            {
                v2f o;
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
                o.pos = UnityObjectToClipPos(v.vertex);
                o.posWorld = mul(unity_ObjectToWorld, v.vertex);
                o.normalDir = normalize( mul( float4(v.normal, 0.0), unity_WorldToObject).xyz);
                o.texcoord = TRANSFORM_TEX(v.texcoord, _MainTex);
               // UNITY_TRANSFER_FOG(o,o.vertex);
                return o;
            }

            fixed4 _Color;
            fixed4 frag (v2f i) : SV_Target
            {
                float3 normalDirection = i.normalDir;
				float3 viewDirection = normalize( _WorldSpaceCameraPos.xyz - i.posWorld.xyz);
                float rim  = dot(normalDirection, viewDirection);
				float3 rimLighting = smoothstep(0, 0.5, pow(1 - rim, _RimPower)) * _RimColor; 

                half4 col = _Color * tex2D(_MainTex, i.texcoord) + half4(rimLighting.x, rimLighting.y, rimLighting.z, 0);
                clip(col.a - _Cutoff);
                UNITY_APPLY_FOG(i.fogCoord, col);
                return col;
            }
        ENDCG
    }

}

}
