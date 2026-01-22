import React, { createContext, useContext, useState, useCallback } from 'react';

const PetContext = createContext();

// 宠物数据 hook
export const usePets = () => {
    const context = useContext(PetContext);
    if (!context) {
        throw new Error('usePets must be used within a PetProvider');
    }
    return context;
};

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
        hasPlan: true  // 已创建食谱
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
        hasPlan: false  // 未创建食谱
    }
];

export const PetProvider = ({ children }) => {
    const [pets, setPets] = useState(initialPets);
    const [currentPetId, setCurrentPetId] = useState(initialPets[0]?.id || null);

    // 获取当前选中的宠物
    const currentPet = pets.find(p => p.id === currentPetId) || pets[0] || null;

    // 根据 ID 获取宠物
    const getPetById = useCallback((id) => {
        return pets.find(p => p.id === id) || null;
    }, [pets]);

    // 添加宠物
    const addPet = useCallback((petData) => {
        const newPet = {
            id: `pet_${Date.now()}`,
            createdAt: new Date(),
            ...petData
        };
        setPets(prev => [...prev, newPet]);
        return newPet;
    }, []);

    // 更新宠物
    const updatePet = useCallback((id, updates) => {
        setPets(prev => prev.map(pet =>
            pet.id === id ? { ...pet, ...updates } : pet
        ));
    }, []);

    // 删除宠物
    const deletePet = useCallback((id) => {
        setPets(prev => {
            const filtered = prev.filter(pet => pet.id !== id);
            // 如果删除的是当前宠物，切换到第一个
            if (currentPetId === id && filtered.length > 0) {
                setCurrentPetId(filtered[0].id);
            }
            return filtered;
        });
    }, [currentPetId]);

    // 设置当前宠物
    const setCurrentPet = useCallback((id) => {
        if (pets.some(p => p.id === id)) {
            setCurrentPetId(id);
        }
    }, [pets]);

    // 设置宠物食谱状态
    const setPetHasPlan = useCallback((id, hasPlan) => {
        setPets(prev => prev.map(pet =>
            pet.id === id ? { ...pet, hasPlan } : pet
        ));
    }, []);

    return (
        <PetContext.Provider value={{
            pets,
            currentPet,
            currentPetId,
            getPetById,
            addPet,
            updatePet,
            deletePet,
            setCurrentPet,
            setPetHasPlan
        }}>
            {children}
        </PetContext.Provider>
    );
};

export default PetContext;
