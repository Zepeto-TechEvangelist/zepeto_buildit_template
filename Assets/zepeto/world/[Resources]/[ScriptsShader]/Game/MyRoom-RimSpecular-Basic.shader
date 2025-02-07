Shader "MyRoom/RimSpecular/Basic" {
	Properties {
		_Color ("Color" , Color ) = (1.0, 1.0, 1.0, 1.0)

        _MainTex ("Main Texture", 2D) = "white" {}
		_AmbientLightColor ("Ambient Light Color", Color) = (1,1,1,1)

		_LightDirection ("Light Direction", Vector) = (1,-1,1,1)
		_lightSpread ("Light Spread", Range(0.01, 20)) = 8.0
		_LightColor ("Light Color", Color) = (1,0,1,1)

		_RimColor("Rim Color", Color) = (1.0, 1.0, 1.0, 1.0)
		_RimPower("Rim Power", Range(0.1, 10.0)) = 1.5
        [Toggle(LIGHT_DIRECTION_AFFECTS_RIM)] _LightDirectionAffectsRim("Light Direction Affects Rim", Float) = 1
	}
 
	SubShader {
		Pass {
			Tags { "RenderType"="Opaque" "LightMode"= "ForwardBase" }
 
			CGPROGRAM 
			#pragma vertex vert
			#pragma fragment frag

            #pragma shader_feature LIGHT_DIRECTION_AFFECTS_RIM

            #include "UnityCG.cginc"
 
			uniform float4 _Color;

            sampler2D _MainTex;
            float4 _MainTex_ST;
            fixed4 _AmbientLightColor;

            half _lightSpread;
            fixed4 _LightDirection;
            fixed4 _LightColor;

			uniform float4 _RimColor;
			uniform float _RimPower;
 
			struct vertexInput{
				float4 vertex : POSITION;
				float3 normal : NORMAL;
                float2 uv : TEXCOORD0;
			};
 
			struct vertexOutput{
				float4 pos : SV_POSITION;
                float2 uv : TEXCOORD0;
				float4 posWorld: TEXCOORD1;
				float3 normalDir: TEXCOORD2;
			};
 
			vertexOutput vert( vertexInput v) {
				vertexOutput o;
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
				o.posWorld = mul(unity_ObjectToWorld, v.vertex);
				o.normalDir = normalize( mul( float4(v.normal, 0.0), unity_WorldToObject).xyz);
				o.pos = UnityObjectToClipPos(v.vertex);
 
				return o;
			}
 
			float4 frag( vertexOutput i) : COLOR {
                fixed4 col = tex2D(_MainTex, i.uv) * _Color;
                float3 normalDirection = i.normalDir;
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
				return float4(final.rgb, 1.0);
			}
 
			ENDCG
		}
	} 
	
	FallBack "Diffuse"
}