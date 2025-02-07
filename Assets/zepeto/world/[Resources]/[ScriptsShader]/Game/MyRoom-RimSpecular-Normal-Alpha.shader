Shader "MyRoom/RimSpecular/NormalAlpha" {
	Properties {
		_Color ("Color" , Color ) = (1.0, 1.0, 1.0, 1.0)

        _MainTex ("Main Texture", 2D) = "white" {}
		_BumpMap("Normal map", 2D) = "bump" {}
		_AlphaTex("Alpha (Greyscale)", 2D) = "white" {}
		_AmbientLightColor ("Ambient Light Color", Color) = (1,1,1,1)

		_LightDirection ("Light Direction", Vector) = (1,-1,1,1)
		_lightSpread ("Light Spread", Range(0.01, 20)) = 8.0
		_LightColor ("Light Color", Color) = (1,0,1,1)

		_RimColor("Rim Color", Color) = (1.0, 1.0, 1.0, 1.0)
		_RimPower("Rim Power", Range(0.1, 10.0)) = 1.5
        [Toggle(LIGHT_DIRECTION_AFFECTS_RIM)] _LightDirectionAffectsRim("Light Direction Affects Rim", Float) = 1
	}
 
	SubShader {
		Tags { "Queue"="Transparent" "RenderType"="Transparent" "LightMode"="ForwardBase" }
		Pass {
			Blend SrcAlpha OneMinusSrcAlpha
			ZWrite Off
 
			CGPROGRAM 
			#pragma vertex vert
			#pragma fragment frag

            #pragma shader_feature LIGHT_DIRECTION_AFFECTS_RIM

            #include "UnityCG.cginc"
 
			uniform float4 _Color;

            sampler2D _MainTex;
            float4 _MainTex_ST;
            sampler2D _BumpMap;
            float4 _BumpMap_ST;
			sampler2D _AlphaTex;
            float4 _AlphaTex_ST;
            fixed4 _AmbientLightColor;

            half _lightSpread;
            fixed4 _LightDirection;
            fixed4 _LightColor;

			uniform float4 _RimColor;
			uniform float _RimPower;
 
			struct vertexInput{
				float4 vertex : POSITION;
				float3 normal : NORMAL;
				float4 tangent : TANGENT;
                float2 uv : TEXCOORD0;
			};
 
			struct vertexOutput{
				float4 pos : SV_POSITION;
                float2 uv : TEXCOORD0;
				float4 posWorld: TEXCOORD1;
				float3 normalDir: TEXCOORD2;
				half3 tspace0 : TEXCOORD3; // tangent.x, bitangent.x, normal.x
                half3 tspace1 : TEXCOORD4; // tangent.y, bitangent.y, normal.y
                half3 tspace2 : TEXCOORD5; // tangent.z, bitangent.z, normal.z
			};
 
			vertexOutput vert( vertexInput v) {
				vertexOutput o;
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
				o.posWorld = mul(unity_ObjectToWorld, v.vertex);
				o.normalDir = normalize( mul( float4(v.normal, 0.0), unity_WorldToObject).xyz);
				o.pos = UnityObjectToClipPos(v.vertex);

				half3 wNormal = UnityObjectToWorldNormal(v.normal);
                half3 wTangent = UnityObjectToWorldDir(v.tangent.xyz);
                // compute bitangent from cross product of normal and tangent
                half tangentSign = v.tangent.w * unity_WorldTransformParams.w;
                half3 wBitangent = cross(wNormal, wTangent) * tangentSign;
                // output the tangent space matrix
                o.tspace0 = half3(wTangent.x, wBitangent.x, wNormal.x);
                o.tspace1 = half3(wTangent.y, wBitangent.y, wNormal.y);
                o.tspace2 = half3(wTangent.z, wBitangent.z, wNormal.z);
 
				return o;
			}
 
			float4 frag( vertexOutput i) : COLOR {
                fixed4 col = tex2D(_MainTex, i.uv) * _Color;
                fixed4 alpha = tex2D(_AlphaTex, i.uv);

				// sample the normal map, and decode from the Unity encoding
                half3 tnormal = UnpackNormal(tex2D(_BumpMap, i.uv));
                // transform normal from tangent to world space
                half3 worldNormal;
                worldNormal.x = dot(i.tspace0, tnormal);
                worldNormal.y = dot(i.tspace1, tnormal);
                worldNormal.z = dot(i.tspace2, tnormal);

                // float3 normalDirection = i.normalDir;
                float3 normalDirection = worldNormal;
                float3 viewDirection = normalize(_WorldSpaceCameraPos.xyz - i.posWorld.xyz);
                float3 lightDirection = normalize(-_LightDirection.xyz);
                float spec = saturate(dot(normalDirection, lightDirection)) * pow(saturate(dot(reflect(-lightDirection, normalDirection), viewDirection)), _lightSpread);

                float atten = 1.0;
                float rim  = 1 - saturate( dot(viewDirection, normalDirection) );
                #ifdef LIGHT_DIRECTION_AFFECTS_RIM
				float3 rimLighting = atten * _RimColor * saturate( dot( normalDirection, lightDirection ) ) * pow(rim, _RimPower); 
				#else
                float3 rimLighting = atten * _RimColor * pow(rim, _RimPower); 
				#endif
                float3 final = rimLighting + spec * _LightColor + col.rgb;
				final *= _AmbientLightColor;
				return float4(final.rgb, alpha.a);
			}
 
			ENDCG
		}
	} 
	
	FallBack "Diffuse"
}