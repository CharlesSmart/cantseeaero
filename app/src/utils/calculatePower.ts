export const calculatePower = (cda: number | null) => {
    if (!cda) return null;
    const speed = 45 / 3.6; 
    const weight = 75; 
    const rollingResistanceCoefficient = 0.005; 
    const airDensity = 1.225; 
    const gravity = 9.81; 

    // Calculate rolling resistance
    const rollingResistance = rollingResistanceCoefficient * weight * gravity * speed;

    const drivetrainLoss = 5;
    // Calculate aerodynamic drag
    const aerodynamicDrag = 0.5 * airDensity * cda * speed * speed * speed;
    // Total power required
    const power = rollingResistance + aerodynamicDrag + drivetrainLoss;

    return power;
}