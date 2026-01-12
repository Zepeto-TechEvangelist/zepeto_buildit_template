import { DialogueOption } from './NpcBase';

export interface DialogueData {
    npcName: string;
    dialogueText: string;
    dialogueOptions: DialogueOption[];
}

// Central dialogue data dictionary
// Key: NPC ID (string), Value: DialogueData
export const DialogueDataMap: Map<string, DialogueData> = new Map<string, DialogueData>();

// Initialize default dialogue data
DialogueDataMap.set('npc_1', {
    npcName: 'NPC',
    dialogueText: 'Hello!',
    dialogueOptions: [
        { question: 'What brings you here?', answer: 'Enjoy exploring!' },
        { question: 'How can I help you?', answer: 'Feel free to ask anything!' },
        { question: 'Do you have any questions?', answer: 'Have a great time!' }
    ]
});

    DialogueDataMap.set('npc_1_1', {
        npcName: 'NPC1',
        dialogueText: 'Hello!',
        dialogueOptions: [
            { question: 'What brings you here?', answer: 'Enjoy exploring!' },
            { question: 'How can I help you?', answer: 'Feel free to ask anything!' },
            { question: 'Do you have any questions?', answer: 'Have a great time!' },
        ]
    });

        DialogueDataMap.set('sprite_npc_1', {
        npcName: "SpriteNPC",
        dialogueText: "Hello! I'm Sprite NPC!",
        dialogueOptions: [
            { question: "What brings you here?", answer: "Enjoy exploring!" },
            { question: "How can I help you?", answer: "Feel free to ask anything!" },
        ]
    });

    DialogueDataMap.set('zepeto_npc_1', {
        npcName: 'ZepetoNPC',
        dialogueText: 'Hello! I am Zepeto NPC!',
        dialogueOptions: [
            { question: 'What brings you here?', answer: 'Enjoy exploring!' },
            { question: 'How can I help you?', answer: 'Feel free to ask anything!' },
            { question: 'Do you have any questions?', answer: 'Have a great time!' },
        ]
    });

// Helper function to get dialogue data by ID
export function GetDialogueData(id: string): DialogueData | null {
    return DialogueDataMap.get(id) || null;
}

