
# Donation Module Documentation

This guide explains how to add **ZepetoLive** donation support to your world.

---

## Contents

* [Overview](#overview)
* [Actions](#donation-actions)

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
* [Testing](#testing)

---

## Overview

To enable donation support in the world, simply add the `LiveDonation` object to the scene. This will set up the system using the default configuration and settings.

The **base path** of the module is located at:
`BuilditTemplate/Modules/Donation/`

> All locations are relative to the base module path.

The `LiveDonation` object has the following structure:

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

### Actions

A **Donation Action** is an event triggered when a specific amount of ZEM is received through a donation.

Available actions appear in the hierarchy as objects with the `DN_` prefix (e.g., `DN_TELEPORT`).

---

### Donation UI

All actions are listed in the **Actions Display**, located at the top-center of the screen.

Each donation amount is displayed in the **Currency Display**.

> Both are integrated UI objects. Only style changes (e.g., background color) are recommended.

---

### Configuration

In the base folder, there is a global configuration file `DonationConfig` that controls high-level settings:

* **Enable Donation**: disabling this option completely turns off the system.
* **Enable Editing**: enabling this option allows streamers to set custom ZEM amounts and display text for donation actions.

> More settings will be added in future updates.

---

### 3D Interaction

This object controls the donation UI displays. A default model (board) is included and can be customized.

```
3D Interaction
  Trigger
  + Model
    [default model]
```

Guidelines:

* When positioning the object, move the **3D Interaction** object (not the model).
* When changing the model, keep its position at **zero**.

> This object can be disabled. The same functionality is available through the default toolbar donation button.

---

## Donation Actions

To configure an action, select it from the list of actions in the scene.
All actions share **three common parameters**:

* **Id** — unique identifier for each action. It is recommended not to change IDs of default actions.

* **Amount** — amount of ZEM required for the action. Each active action must have a unique value within the range **[0, 100,000]**.

* **Title** — display text used on the action board and in popups.
  This is a localized attribute defined in the localization file.
  The key format is:
  `bp_action_${id}` (lowercase).

  > For example, for `DN_TELEPORT`, the key is `bp_action_dn_teleport`.

* **Duration** (for timed actions) — time in seconds the action remains active.
  Set **0** or a negative value for infinite duration.

---

### Adding New Actions

By default, one instance of each action type is added.
Some cases require multiple actions of the same type (e.g., multiple **DN_TELEPORT** actions).

To add a new action:

1. Duplicate an existing action or add one from the prefab collection (`BASE_PATH/Prefabs/DN_Actions`).
2. Assign a unique ID to the new action object (e.g., `DN_TELEPORT_1`).
3. Add display text for the new action in the localization file.

> Creating fully custom action types is not supported yet.
> All parameters for each action type are listed; editing below the parameter line is not recommended.

---

## Actions

### **Teleport**

Teleports the player to a specified location.

* **Target** (`Transform`): position to teleport to.
  The action object includes a visual destination point by default.

---

### **Gesture**

Plays a gesture for a specified duration or until interrupted.

* **Gesture** (`AnimationClip`): animation to play
* **Duration** (`Float`): play time in seconds

---

### **No Makeup**

Removes the player's makeup.

* **Duration** (`Float`): time makeup remains removed

---

### **No Hair**

Removes the player's hair.

* **Duration** (`Float`): time the hair remains removed

---

### **Buff**

Gives the player a movement buff.

* **Move Speed Multiplier** (`Float`): increase factor for movement speed
* **Jump Power Multiplier** (`Float`): increase factor for jump height
* **Duration** (`Float`): buff duration

---

### **Show**

Reveals a game object for a specific duration.
The object is hidden automatically during play mode.

* **Target Object** (`GameObject`): object to be shown
* **Duration** (`Float`): time before the object hides again
* **Show Option** (`Boolean`): locked to **true**

---

### **Hide**

Hides a game object for a specific duration.
The object is shown automatically during play mode.

* **Target Object** (`GameObject`): object to hide
* **Show Option** (`Boolean`): locked to **false**
* **Duration** (`Float`): time before the object is shown again

---

### **Create**

Creates an object and attaches it to the player.
The object expires after the specified duration.

* **Target Object** (`GameObject`, required): prefab to create
* **Body Bone** (`BodyPart`): attachment point
* **Position Offset** (`Vector3`): local offset
* **Duration** (`Float`): lifetime of the created object

---

### **Throw**

Creates and throws an object at the player.
The object expires after the specified duration.

* **Source Object** (`GameObject`, required): prefab to create
* **Throw Target** (`BodyPart`): body part to aim at
* **Position Offset** (`Vector3`): offset relative to the target
* **Duration** (`Float`): lifetime of the created object
* **Spawn Parent** (`Transform`): parent of the instance

---

### **Object Spawn**

Creates a temporary object at a specified location.
It is automatically destroyed after the duration expires.

* **Target Object** (`GameObject`, required): prefab to create
* **Spawn Location** (`Transform`): location or parent
* **Duration** (`Float`): lifetime of the created object

---

### **Profile**

Displays a simplified message with the donor’s nickname above the player.

* **Position Offset** (`Vector3`): offset from the character’s head
* **Duration** (`Float`): display time
* **Target Object** (`GameObject`): prefab for the message
* **Spawn Location** (`Transform`): parent of the spawned object

---

## Testing

Testing during development is available through the testing interface.
Select **`Zepeto / Donation / Tester`** from the top menu.

While in play mode, selecting any of the donation amounts simulates a live donation.

---