export const calculateVariance = (current: number, target: number) => {
    if (target === 0) return 0;
    const diff = current - target;
    const percentage = (diff / target) * 100;
    return percentage;
};

export const getTrafficLightStatus = (variance: number) => {
    if (variance > 20) return 'red';
    if (variance < -50) return 'yellow'; // Suspicious
    return 'green';
};
