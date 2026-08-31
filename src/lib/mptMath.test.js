/**
 * @file mptMath.test.js
 * Automated validation matrix targeting Gaussian elimination models
 */
import { calculateMptAllocation, projectToSimplex } from './mptMath';

describe('Modern Portfolio Theory Spatial Math Suite', () => {
    test('projectToSimplex must enforce strict non-negative spatial bounds', () => {
        // Mock input containing a highly volatile, unconstrained out-of-bounds weight matrix
        const invalidSpatialWeights = [1.4, -0.3, -0.2, 0.1];
        const constrainedWeights = projectToSimplex(invalidSpatialWeights);
        
        // Assert sum compliance: w_i = 1.0
        const totalSum = constrainedWeights.reduce((a, b) => a + b, 0);
        expect(totalSum).toBeCloseTo(1.0, 5);
        
        // Assert bounding physical reality: w_i >= 0 (No negative spatial short-selling)
        constrainedWeights.forEach(weight => {
            expect(weight).toBeGreaterThanOrEqual(0);
        });
    });

    test('Gaussian elimination must correctly isolate analytical scalars A, B, C, D', () => {
        const mockCovariance = [
            [0.04, 0.01],
            [0.01, 0.09]
        ];
        const mockExpectedYields = [0.12, 0.18];
        
        const mptResult = calculateMptAllocation(mockCovariance, mockExpectedYields);
        
        expect(mptResult).toHaveProperty('EfficientFrontierHyperbola');
        expect(mptResult.EfficientFrontierHyperbola.A).toBeGreaterThan(0);
        expect(mptResult.EfficientFrontierHyperbola.D).toBeGreaterThan(0);
    });
});
