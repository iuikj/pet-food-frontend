import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { petsApi } from '../api';
import { useUser } from './UserContext';

const PetContext = createContext();

// 宠物数据 hook
export const usePets = () => {
    const context = useContext(PetContext);
    if (!context) {
        throw new Error('usePets must be used within a PetProvider');
    }
    return context;
};

export const PetProvider = ({ children }) => {
    const { isAuthenticated } = useUser();
    const [pets, setPets] = useState([]);
    const [currentPetId, setCurrentPetId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // 活跃计划映射: { petId: planId } — localStorage 持久化
    const [activePlanMap, setActivePlanMap] = useState(
        () => JSON.parse(localStorage.getItem('activePlanMap') || '{}')
    );

    // 持久化 activePlanMap
    useEffect(() => {
        localStorage.setItem('activePlanMap', JSON.stringify(activePlanMap));
    }, [activePlanMap]);

    // 获取当前选中的宠物
    const currentPet = pets.find(p => p.id === currentPetId) || pets[0] || null;

    // 登录后加载宠物列表
    useEffect(() => {
        if (isAuthenticated) {
            fetchPets();
        } else {
            setPets([]);
            setCurrentPetId(null);
        }
    }, [isAuthenticated]);

    // 从后端获取宠物列表
    const fetchPets = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await petsApi.getPets();
            if (res.code === 0) {
                const petList = res.data.items || [];
                setPets(petList);
                // 如果有宠物且没有选中，选中第一个
                if (petList.length > 0 && !currentPetId) {
                    setCurrentPetId(petList[0].id);
                }
                return { success: true, pets: petList };
            }
            setError(res.message);
            return { success: false, message: res.message };
        } catch (err) {
            console.error('Failed to fetch pets:', err);
            setError('获取宠物列表失败');
            return { success: false, message: '获取宠物列表失败' };
        } finally {
            setIsLoading(false);
        }
    }, [currentPetId]);

    // 根据 ID 获取宠物
    const getPetById = useCallback((id) => {
        return pets.find(p => p.id === id) || null;
    }, [pets]);

    // 添加宠物
    const addPet = useCallback(async (petData) => {
        setIsLoading(true);
        try {
            const res = await petsApi.createPet(petData);
            if (res.code === 0) {
                const newPet = res.data;
                setPets(prev => [...prev, newPet]);
                setCurrentPetId(newPet.id);
                return { success: true, pet: newPet };
            }
            return { success: false, message: res.message };
        } catch (err) {
            console.error('Failed to create pet:', err);
            return { success: false, message: '创建宠物失败' };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 更新宠物
    const updatePet = useCallback(async (id, updates) => {
        setIsLoading(true);
        try {
            const res = await petsApi.updatePet(id, updates);
            if (res.code === 0) {
                const updatedPet = res.data;
                setPets(prev => prev.map(pet =>
                    pet.id === id ? updatedPet : pet
                ));
                return { success: true, pet: updatedPet };
            }
            return { success: false, message: res.message };
        } catch (err) {
            console.error('Failed to update pet:', err);
            return { success: false, message: '更新宠物失败' };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 删除宠物
    const deletePet = useCallback(async (id) => {
        setIsLoading(true);
        try {
            const res = await petsApi.deletePet(id);
            if (res.code === 0) {
                setPets(prev => {
                    const filtered = prev.filter(pet => pet.id !== id);
                    // 如果删除的是当前宠物，切换到第一个
                    if (currentPetId === id && filtered.length > 0) {
                        setCurrentPetId(filtered[0].id);
                    } else if (filtered.length === 0) {
                        setCurrentPetId(null);
                    }
                    return filtered;
                });
                return { success: true };
            }
            return { success: false, message: res.message };
        } catch (err) {
            console.error('Failed to delete pet:', err);
            return { success: false, message: '删除宠物失败' };
        } finally {
            setIsLoading(false);
        }
    }, [currentPetId]);

    // 上传宠物头像
    const uploadPetAvatar = useCallback(async (petId, file) => {
        try {
            const res = await petsApi.uploadPetAvatar(petId, file);
            if (res.code === 0) {
                // 更新本地宠物头像
                setPets(prev => prev.map(pet =>
                    pet.id === petId ? { ...pet, avatar_url: res.data.avatar_url } : pet
                ));
                return { success: true, avatar_url: res.data.avatar_url };
            }
            return { success: false, message: res.message };
        } catch (err) {
            console.error('Failed to upload pet avatar:', err);
            return { success: false, message: '上传头像失败' };
        }
    }, []);

    // 设置当前宠物
    const setCurrentPet = useCallback((id) => {
        if (pets.some(p => p.id === id)) {
            setCurrentPetId(id);
        }
    }, [pets]);

    // 设置宠物食谱状态（本地更新，用于 UI 显示）
    const setPetHasPlan = useCallback((id, hasPlan) => {
        setPets(prev => prev.map(pet =>
            pet.id === id ? { ...pet, has_plan: hasPlan } : pet
        ));
    }, []);

    // 设置活跃计划 — 绑定宠物与计划，同时更新 has_plan
    const setActivePlan = useCallback((petId, planId) => {
        setActivePlanMap(prev => ({ ...prev, [petId]: planId }));
        setPets(prev => prev.map(pet =>
            pet.id === petId ? { ...pet, has_plan: true } : pet
        ));
    }, []);

    // 清除活跃计划
    const clearActivePlan = useCallback((petId) => {
        setActivePlanMap(prev => {
            const next = { ...prev };
            delete next[petId];
            return next;
        });
        setPets(prev => prev.map(pet =>
            pet.id === petId ? { ...pet, has_plan: false } : pet
        ));
    }, []);

    // 当前宠物的活跃计划 ID
    const activePlanId = currentPet?.id ? activePlanMap[currentPet.id] || null : null;

    return (
        <PetContext.Provider value={{
            pets,
            currentPet,
            currentPetId,
            isLoading,
            error,
            fetchPets,
            getPetById,
            addPet,
            updatePet,
            deletePet,
            uploadPetAvatar,
            setCurrentPet,
            setPetHasPlan,
            activePlanMap,
            activePlanId,
            setActivePlan,
            clearActivePlan,
        }}>
            {children}
        </PetContext.Provider>
    );
};

export default PetContext;
