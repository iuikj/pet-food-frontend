import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { petsApi } from '../api';
import { getApiErrorMessage } from '../api/client';
import PetContext from './PetContextValue';
import { useUser } from '../hooks/useUser';
import { readJSON, STORAGE_KEYS, writeJSON } from '../utils/storage';

export const PetProvider = ({ children }) => {
    const { isAuthenticated } = useUser();
    const [pets, setPets] = useState([]);
    const [currentPetId, setCurrentPetId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activePlanMap, setActivePlanMap] = useState(
        () => readJSON(STORAGE_KEYS.activePlanMap, {})
    );
    const [activePlanDataMap, setActivePlanDataMap] = useState(
        () => readJSON(STORAGE_KEYS.activePlanDataMap, {})
    );

    useEffect(() => {
        writeJSON(STORAGE_KEYS.activePlanMap, activePlanMap);
    }, [activePlanMap]);

    useEffect(() => {
        writeJSON(STORAGE_KEYS.activePlanDataMap, activePlanDataMap);
    }, [activePlanDataMap]);

    const fetchPets = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await petsApi.getPets();
            if (res.code === 0) {
                const petList = res.data.items || [];
                setPets(petList);
                setCurrentPetId((prev) => {
                    if (petList.length === 0) {
                        return null;
                    }

                    const hasExistingPet = prev && petList.some((pet) => pet.id === prev);
                    return hasExistingPet ? prev : petList[0].id;
                });
                return { success: true, pets: petList };
            }

            setError(res.message);
            return { success: false, message: res.message };
        } catch (err) {
            const message = getApiErrorMessage(err, '获取宠物列表失败');
            console.error('Failed to fetch pets:', err);
            setError(message);
            return { success: false, message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchPets();
            return;
        }

        setPets([]);
        setCurrentPetId(null);
    }, [fetchPets, isAuthenticated]);

    const currentPet = useMemo(
        () => pets.find((pet) => pet.id === currentPetId) || pets[0] || null,
        [pets, currentPetId]
    );

    const getPetById = useCallback((id) => {
        return pets.find((pet) => pet.id === id) || null;
    }, [pets]);

    const addPet = useCallback(async (petData) => {
        setIsLoading(true);
        try {
            const res = await petsApi.createPet(petData);
            if (res.code === 0) {
                const newPet = res.data;
                setPets((prev) => [...prev, newPet]);
                setCurrentPetId(newPet.id);
                return { success: true, pet: newPet };
            }
            return { success: false, message: res.message };
        } catch (err) {
            console.error('Failed to create pet:', err);
            return { success: false, message: getApiErrorMessage(err, '创建宠物失败') };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updatePet = useCallback(async (id, updates) => {
        setIsLoading(true);
        try {
            const res = await petsApi.updatePet(id, updates);
            if (res.code === 0) {
                const updatedPet = res.data;
                setPets((prev) => prev.map((pet) => (
                    pet.id === id ? updatedPet : pet
                )));
                return { success: true, pet: updatedPet };
            }
            return { success: false, message: res.message };
        } catch (err) {
            console.error('Failed to update pet:', err);
            return { success: false, message: getApiErrorMessage(err, '更新宠物失败') };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const deletePet = useCallback(async (id) => {
        setIsLoading(true);
        try {
            const res = await petsApi.deletePet(id);
            if (res.code === 0) {
                setPets((prev) => {
                    const filtered = prev.filter((pet) => pet.id !== id);
                    if (filtered.length === 0) {
                        setCurrentPetId(null);
                        return filtered;
                    }

                    setCurrentPetId((currentId) => (
                        currentId === id ? filtered[0].id : currentId
                    ));
                    return filtered;
                });
                return { success: true };
            }
            return { success: false, message: res.message };
        } catch (err) {
            console.error('Failed to delete pet:', err);
            return { success: false, message: getApiErrorMessage(err, '删除宠物失败') };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const uploadPetAvatar = useCallback(async (petId, file) => {
        try {
            const res = await petsApi.uploadPetAvatar(petId, file);
            if (res.code === 0) {
                setPets((prev) => prev.map((pet) => (
                    pet.id === petId ? { ...pet, avatar_url: res.data.avatar_url } : pet
                )));
                return { success: true, avatar_url: res.data.avatar_url };
            }
            return { success: false, message: res.message };
        } catch (err) {
            console.error('Failed to upload pet avatar:', err);
            return { success: false, message: getApiErrorMessage(err, '上传宠物头像失败') };
        }
    }, []);

    const setCurrentPet = useCallback((id) => {
        if (pets.some((pet) => pet.id === id)) {
            setCurrentPetId(id);
        }
    }, [pets]);

    const setPetHasPlan = useCallback((id, hasPlan) => {
        setPets((prev) => prev.map((pet) => (
            pet.id === id ? { ...pet, has_plan: hasPlan } : pet
        )));
    }, []);

    const setActivePlan = useCallback((petId, planId) => {
        setActivePlanMap((prev) => ({ ...prev, [petId]: planId }));
        setPets((prev) => prev.map((pet) => (
            pet.id === petId ? { ...pet, has_plan: true } : pet
        )));
    }, []);

    const clearActivePlan = useCallback((petId) => {
        setActivePlanMap((prev) => {
            const next = { ...prev };
            delete next[petId];
            return next;
        });
        setActivePlanDataMap((prev) => {
            const next = { ...prev };
            delete next[petId];
            return next;
        });
        setPets((prev) => prev.map((pet) => (
            pet.id === petId ? { ...pet, has_plan: false } : pet
        )));
    }, []);

    const setActivePlanData = useCallback((petId, planResult) => {
        setActivePlanDataMap((prev) => ({ ...prev, [petId]: planResult }));
    }, []);

    const activePlanId = currentPet?.id ? activePlanMap[currentPet.id] || null : null;
    const activePlanData = currentPet?.id ? activePlanDataMap[currentPet.id] || null : null;

    const contextValue = useMemo(() => ({
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
        activePlanData,
        setActivePlan,
        setActivePlanData,
        clearActivePlan,
    }), [
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
        activePlanData,
        setActivePlan,
        setActivePlanData,
        clearActivePlan,
    ]);

    return (
        <PetContext.Provider value={contextValue}>
            {children}
        </PetContext.Provider>
    );
};

export default PetContext;
