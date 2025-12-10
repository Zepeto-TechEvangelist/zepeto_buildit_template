
# **Donation Module Documentation (기부 모듈 문서)**

이 가이드는 **ZepetoLive 기부(후원)** 기능을 월드에 추가하는 방법을 설명합니다.

---

## **목차**

* [개요(Overview)](#overview)
* [기부 액션(Actions)](#donation-actions)

  * [Teleport](#teleport)
  * [Gesture](#gesture)
  * [No Makeup](#no-makeup)
  * [No Hair](#no-hair)
  * [Buff](#buff)
  * [Show](#show)
  * [Hide](#hide)
  * [Create](#create)
  * [Throw](#throw)
  * [Object Spawn](#object-spawn)
  * [Profile](#profile)
* [테스트](#testing)

---

## **Overview (개요)**

월드에 기부 기능을 활성화하려면, 장면(Scene)에 `LiveDonation` 오브젝트를 추가하기만 하면 됩니다.
추가하면 기본 설정 값으로 자동 구성됩니다.

모듈의 **기본 경로(Base Path)** 는 다음과 같습니다:
`BuilditTemplate/Modules/Donation/`

> 모든 경로는 기본 모듈 경로를 기준으로 합니다.

`LiveDonation` 오브젝트 구조는 다음과 같습니다:

```
LiveDonation
  - Donation Actions
  - 3D Interaction
  + UI
    - Actions Display
    - Currency Display
  - Donation Manager
```

---

### **Actions (기부 액션)**

**Donation Action**은 특정 ZEM 금액이 기부되었을 때 실행되는 이벤트입니다.

사용 가능한 액션들은 `DN_` 접두사를 가진 오브젝트로 계층(Hierarchy)에 표시됩니다.
(예: `DN_TELEPORT`)

---

### **Donation UI**

모든 액션은 화면 상단 중앙에 위치한 **Actions Display**에 표시됩니다.

각 기부 금액은 **Currency Display**에 표시됩니다.

> 두 UI는 기본 제공 오브젝트이며, 배경색 등 스타일 변경 외의 수정은 권장되지 않습니다.

---

### **Configuration (설정)**

기본 폴더에는 전체 시스템 동작을 제어하는 글로벌 설정 파일 `DonationConfig` 가 있습니다.

* **Enable Donation**: 비활성화하면 전체 기부 시스템이 꺼집니다.
* **Enable Editing**: 활성화하면 스트리머가 기부 금액 및 표시 텍스트를 직접 수정할 수 있습니다.

> 이 설정은 앞으로 업데이트를 통해 더 추가될 예정입니다.

---

### **3D Interaction**

이 오브젝트는 기부 UI 디스플레이를 제어합니다.
기본 모델(보드)이 포함되어 있으며 커스터마이징 가능합니다.

```
3D Interaction
  Trigger
  + Model
    [default model]
```

가이드라인:

* 오브젝트 위치를 조정할 때는 **Model**이 아닌 **3D Interaction 루트 오브젝트**를 이동하세요.
* 모델 교체 시, 모델의 Transform 위치는 **0**(리셋 상태)을 유지하세요.

> 이 오브젝트는 비활성화해도 됩니다.
> 동일 기능이 기본 툴바의 기부 버튼을 통해 제공됩니다.

---

## **Donation Actions (기부 액션 설정)**

액션을 설정하려면, 장면의 액션 목록에서 해당 오브젝트를 선택합니다.
모든 액션은 다음 **공통 파라미터 3개**를 공유합니다:

---

### **공통 파라미터**

* **Id** — 액션의 고유 식별자
  기본 액션의 ID 변경은 권장하지 않습니다.

* **Amount** — 해당 액션을 실행하는 데 필요한 ZEM 금액
  활성 상태의 모든 액션은 **[0 ~ 100,000] 사이의 고유 금액**을 가져야 합니다.

* **Title** — 액션 보드 및 팝업에 표시되는 텍스트
  이는 로컬라이제이션 파일에 정의된 항목이며 key 형식은 다음과 같습니다:
  `bp_action_${id}` (소문자)

  > 예: `DN_TELEPORT` 액션의 경우 key = `bp_action_dn_teleport`

* **Duration** (시간 기반 액션만 해당) — 액션이 유지되는 시간(초)
  0 또는 음수 입력 시 무제한 지속

---

## **새 액션 추가하기**

기본적으로 모든 액션 타입은 하나씩 포함되어 있습니다.
일부 경우에는 동일 액션을 여러 개 사용해야 할 수 있습니다.
(예: 여러 위치로 이동시키는 여러 개의 **DN_TELEPORT**)

새 액션을 추가하는 방법:

1. 기존 액션을 복제하거나
   prefab 컬렉션(`BASE_PATH/Prefabs/DN_Actions`)에서 추가합니다.
2. 새 액션 오브젝트에 고유한 ID를 부여합니다.
   예: `DN_TELEPORT_1`
3. 로컬라이제이션 파일에 해당 액션의 텍스트를 추가합니다.

> 완전한 커스텀 액션 타입 생성은 아직 지원되지 않습니다.
> 각 액션 타입별 파라미터 라인 아래의 스크립트 레벨 수정은 권장되지 않습니다.

---

# **Actions (액션 상세 설명)**

---

### **Teleport — 텔레포트**

플레이어를 지정된 위치로 이동시킵니다.

* **Target** (`Transform`): 이동 위치
  액션 오브젝트에는 기본 목적지 표시 오브젝트가 포함됩니다.

---

### **Gesture — 제스처**

제스처 애니메이션을 일정 시간 또는 중단될 때까지 재생합니다.

* **Gesture** (`AnimationClip`): 실행할 애니메이션
* **Duration** (`Float`): 재생 시간(초)

---

### **No Makeup — 메이크업 제거**

플레이어의 메이크업을 제거합니다.

* **Duration** (`Float`): 메이크업이 제거된 상태 유지 시간

---

### **No Hair — 헤어 제거**

플레이어의 헤어를 제거합니다.

* **Duration** (`Float`): 헤어 제거 유지 시간

---

### **Buff — 버프**

플레이어에게 이동 관련 버프를 부여합니다.

* **Move Speed Multiplier** (`Float`): 이동 속도 증가 배율
* **Jump Power Multiplier** (`Float`): 점프 높이 증가 배율
* **Duration** (`Float`): 버프 지속 시간

---

### **Show — 오브젝트 표시**

특정 오브젝트를 일정 시간 동안 표시합니다.
플레이 모드에서는 해당 오브젝트가 자동으로 숨겨진 상태로 시작됩니다.

* **Target Object** (`GameObject`): 표시할 오브젝트
* **Duration** (`Float`): 자동으로 다시 숨겨지기까지의 시간
* **Show Option** (`Boolean`): 항상 **true** 로 고정

---

### **Hide — 오브젝트 숨기기**

특정 오브젝트를 일정 시간 동안 숨깁니다.
플레이 모드에서는 자동으로 표시된 상태로 시작됩니다.

* **Target Object** (`GameObject`): 숨길 오브젝트
* **Show Option** (`Boolean`): 항상 **false** 로 고정
* **Duration** (`Float`): 표시 상태로 복귀하기까지의 시간

---

### **Create — 오브젝트 생성 및 부착**

플레이어에게 오브젝트를 생성하여 부착합니다.
지정된 시간이 지나면 제거됩니다.

* **Target Object** (`GameObject`, 필수): 생성할 프리팹
* **Body Bone** (`BodyPart`): 부착 위치
* **Position Offset** (`Vector3`): 로컬 위치 오프셋
* **Duration** (`Float`): 오브젝트 유지 시간

---

### **Throw — 오브젝트 던지기**

플레이어를 향해 오브젝트를 생성하여 던집니다.
지정 시간 후 자동 제거됩니다.

* **Source Object** (`GameObject`, 필수): 생성할 프리팹
* **Throw Target** (`BodyPart`): 목표 신체 부위
* **Position Offset** (`Vector3`): 목표 기준 오프셋
* **Duration** (`Float`): 오브젝트 유지 시간
* **Spawn Parent** (`Transform`): 생성된 오브젝트의 부모

---

### **Object Spawn — 오브젝트 소환**

지정된 위치에 오브젝트를 생성합니다.
지속 시간 종료 후 자동 제거됩니다.

* **Target Object** (`GameObject`, 필수): 생성할 프리팹
* **Spawn Location** (`Transform`): 위치 또는 부모
* **Duration** (`Float`): 유지 시간

---

### **Profile — 프로필 메시지 표시**

기부자의 닉네임을 간단한 메시지 형태로 플레이어 머리 위에 표시합니다.

* **Position Offset** (`Vector3`): 캐릭터 머리 기준 오프셋
* **Duration** (`Float`): 표시 시간
* **Target Object** (`GameObject`): 메시지 프리팹
* **Spawn Location** (`Transform`): 생성 위치 또는 부모

---

## **Testing (테스트)**

개발 중 테스트는 전용 테스트 인터페이스를 통해 가능합니다.
상단 메뉴에서 **`Zepeto / Donation / Tester`** 를 선택하면 됩니다.

플레이 모드에서 원하는 기부 금액 버튼을 누르면
실제 라이브 기부와 동일하게 액션이 실행됩니다.

---