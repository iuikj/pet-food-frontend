import { defineStore } from 'pinia';

// 示例宠物数据
const initialPets = [
    {
        id: '1',
        name: 'Cooper',
        type: '金毛寻回犬',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBn9rRCCpDfMxR_3IoYBOVyNDNZADIHVHTErFZ1ecKqEnKJ0vl_NEf61nPEpN-muNBhi2X3_9QzQm9O2BOI0Y1XcNXFmw72fBSTG5SIfIRxxxsBrWfLqP0YcYbeXzX9-qStq9BpTXHo0YiOnjUMUtKIpl9qUKV7iaxqxdvMpKRAPntZHVH9ENBDRsvfy-7C6jtmoW-Bz_KrmfVcUz-PXlzyevQ_NUwkL4V6-3bbHLr_u_PgwcMgcMVavQRtmvGPSH9JDvWb6IV8viw',
        age: 3,
        weight: 32,
        gender: 'male',
        createdAt: new Date('2023-01-15'),
        hasPlan: true
    },
    {
        id: '2',
        name: 'Luna',
        type: '英国短毛猫',
        avatar: null,
        age: 2,
        weight: 4.2,
        gender: 'female',
        createdAt: new Date('2024-03-20'),
        hasPlan: false
    }
];

export const usePetStore = defineStore('pet', {
    state: () => ({
        pets: initialPets,
        currentPetId: initialPets[0]?.id || null
    }),

    getters: {
        currentPet: (state) => state.pets.find(p => p.id === state.currentPetId) || state.pets[0] || null,

        getPetById: (state) => (id) => state.pets.find(p => p.id === id) || null
    },

    actions: {
        addPet(petData) {
            const newPet = {
                id: `pet_${Date.now()}`,
                createdAt: new Date(),
                ...petData
            };
            this.pets.push(newPet);
            return newPet;
        },

        updatePet(id, updates) {
            const index = this.pets.findIndex(p => p.id === id);
            if (index !== -1) {
                this.pets[index] = { ...this.pets[index], ...updates };
            }
        },

        deletePet(id) {
            const index = this.pets.findIndex(p => p.id === id);
            if (index !== -1) {
                this.pets.splice(index, 1);
                if (this.currentPetId === id && this.pets.length > 0) {
                    this.currentPetId = this.pets[0].id;
                }
            }
        },

        setCurrentPet(id) {
            if (this.pets.some(p => p.id === id)) {
                this.currentPetId = id;
            }
        },

        setPetHasPlan(id, hasPlan) {
            const index = this.pets.findIndex(p => p.id === id);
            if (index !== -1) {
                this.pets[index].hasPlan = hasPlan;
            }
        }
    }
});
