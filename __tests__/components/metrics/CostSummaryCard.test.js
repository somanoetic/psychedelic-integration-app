/**
 * Component Tests for CostSummaryCard
 *
 * Tests the Cost Summary Card component including:
 * - Rendering with cost data
 * - Cost calculations (total, per 1K calls)
 * - Service breakdown display
 * - Edge cases and boundary conditions
 *
 * NOTE: These tests require a React Native test environment (jest-expo).
 * They are skipped in node environment. Run with: npm run test:components
 */

let React, render, CostSummaryCard;
let canRunComponentTests = false;

// Component tests need a proper React Native renderer (jsdom or jest-expo).
// In node testEnvironment, modules load but rendering fails silently.
if (typeof document !== 'undefined') {
  try {
    React = require('react');
    render = require('@testing-library/react-native').render;
    CostSummaryCard = require('../../../components/metrics/CostSummaryCard').default;
    canRunComponentTests = true;
  } catch (e) {
    // React Native testing environment not available
  }
}

const describeComponent = canRunComponentTests ? describe : describe.skip;

describeComponent('CostSummaryCard', () => {
  describe('Rendering with Valid Data', () => {
    test('should render with complete cost data', () => {
      const costData = {
        totalCost: 12.50,
        totalCalls: 5000,
        services: [
          { service: 'enhancedClaude', cost: 8.50 },
          { service: 'ifsAI', cost: 2.75 },
          { service: 'routingService', cost: 1.25 },
        ],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      expect(getByText('Cost Summary (30d)')).toBeTruthy();
      expect(getByText('$12.50')).toBeTruthy();
      expect(getByText('Total Spend')).toBeTruthy();
      expect(getByText('5,000')).toBeTruthy();
    });

    test('should calculate cost per 1K calls correctly', () => {
      const costData = {
        totalCost: 10.00,
        totalCalls: 5000, // $10 / 5000 * 1000 = $2.000
        services: [],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      expect(getByText('$2.000')).toBeTruthy();
    });

    test('should display top 3 services only', () => {
      const costData = {
        totalCost: 20.00,
        totalCalls: 1000,
        services: [
          { service: 'service1', cost: 10.00 },
          { service: 'service2', cost: 5.00 },
          { service: 'service3', cost: 3.00 },
          { service: 'service4', cost: 2.00 }, // Should not display
        ],
      };

      const { getByText, queryByText } = render(<CostSummaryCard costData={costData} />);

      expect(getByText('service1')).toBeTruthy();
      expect(getByText('service2')).toBeTruthy();
      expect(getByText('service3')).toBeTruthy();
      expect(queryByText('service4')).toBeNull();
    });

    test('should format service costs to 2 decimals', () => {
      const costData = {
        totalCost: 10.00,
        totalCalls: 1000,
        services: [
          { service: 'test', cost: 5.456 },
        ],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      expect(getByText('$5.46')).toBeTruthy(); // Rounded to 2 decimals
    });
  });

  describe('Edge Cases', () => {
    test('should handle null costData', () => {
      const { getByText } = render(<CostSummaryCard costData={null} />);

      expect(getByText('$0.00')).toBeTruthy();
      expect(getByText('0')).toBeTruthy();
      expect(getByText('$0.000')).toBeTruthy(); // Cost per 1K
    });

    test('should handle undefined costData', () => {
      const { getByText } = render(<CostSummaryCard costData={undefined} />);

      expect(getByText('$0.00')).toBeTruthy();
      expect(getByText('0')).toBeTruthy();
    });

    test('should handle empty costData object', () => {
      const { getByText } = render(<CostSummaryCard costData={{}} />);

      expect(getByText('$0.00')).toBeTruthy();
      expect(getByText('0')).toBeTruthy();
    });

    test('should handle zero totalCalls (avoid division by zero)', () => {
      const costData = {
        totalCost: 10.00,
        totalCalls: 0,
        services: [],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      expect(getByText('$0.000')).toBeTruthy(); // Should be 0, not Infinity
    });

    test('should handle empty services array', () => {
      const costData = {
        totalCost: 5.00,
        totalCalls: 100,
        services: [],
      };

      const { queryByText } = render(<CostSummaryCard costData={costData} />);

      expect(queryByText('Top Services')).toBeNull();
    });

    test('should handle missing services field', () => {
      const costData = {
        totalCost: 5.00,
        totalCalls: 100,
      };

      const { queryByText } = render(<CostSummaryCard costData={costData} />);

      expect(queryByText('Top Services')).toBeNull();
    });

    test('should handle single service', () => {
      const costData = {
        totalCost: 5.00,
        totalCalls: 100,
        services: [
          { service: 'onlyOne', cost: 5.00 },
        ],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      expect(getByText('Top Services')).toBeTruthy();
      expect(getByText('onlyOne')).toBeTruthy();
    });

    test('should handle two services', () => {
      const costData = {
        totalCost: 10.00,
        totalCalls: 100,
        services: [
          { service: 'service1', cost: 6.00 },
          { service: 'service2', cost: 4.00 },
        ],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      expect(getByText('service1')).toBeTruthy();
      expect(getByText('service2')).toBeTruthy();
    });
  });

  describe('Boundary Conditions', () => {
    test('should handle very large costs', () => {
      const costData = {
        totalCost: 999999.99,
        totalCalls: 1000000,
        services: [],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      expect(getByText('$999999.99')).toBeTruthy();
      expect(getByText('1,000,000')).toBeTruthy();
    });

    test('should handle very small costs', () => {
      const costData = {
        totalCost: 0.01,
        totalCalls: 100,
        services: [],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      expect(getByText('$0.01')).toBeTruthy();
    });

    test('should handle fractional cents', () => {
      const costData = {
        totalCost: 0.005,
        totalCalls: 10,
        services: [],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      expect(getByText('$0.01')).toBeTruthy(); // Rounded to 2 decimals
    });

    test('should handle very high cost per 1K', () => {
      const costData = {
        totalCost: 1000.00,
        totalCalls: 100, // $1000 / 100 * 1000 = $10,000 per 1K
        services: [],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      expect(getByText('$10000.000')).toBeTruthy();
    });

    test('should handle very low cost per 1K', () => {
      const costData = {
        totalCost: 0.01,
        totalCalls: 100000, // $0.01 / 100000 * 1000 = $0.0001 per 1K
        services: [],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      expect(getByText(/\$0\.000/)).toBeTruthy(); // Should show 3 decimals
    });

    test('should handle negative costs (should not happen, but test resilience)', () => {
      const costData = {
        totalCost: -5.00,
        totalCalls: 100,
        services: [],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      expect(getByText('$-5.00')).toBeTruthy();
    });
  });

  describe('Cost Calculations', () => {
    test('should calculate cost per 1K for small call volumes', () => {
      const costData = {
        totalCost: 0.50,
        totalCalls: 100,
        services: [],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      // $0.50 / 100 * 1000 = $5.000 per 1K
      expect(getByText('$5.000')).toBeTruthy();
    });

    test('should calculate cost per 1K for large call volumes', () => {
      const costData = {
        totalCost: 100.00,
        totalCalls: 1000000,
        services: [],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      // $100 / 1000000 * 1000 = $0.100 per 1K
      expect(getByText('$0.100')).toBeTruthy();
    });

    test('should handle exact 1K calls', () => {
      const costData = {
        totalCost: 5.00,
        totalCalls: 1000,
        services: [],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      // $5 / 1000 * 1000 = $5.000 per 1K
      expect(getByText('$5.000')).toBeTruthy();
    });
  });

  describe('Service List Rendering', () => {
    test('should render services with correct costs', () => {
      const costData = {
        totalCost: 15.00,
        totalCalls: 1000,
        services: [
          { service: 'serviceA', cost: 10.00 },
          { service: 'serviceB', cost: 3.50 },
          { service: 'serviceC', cost: 1.50 },
        ],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      expect(getByText('serviceA')).toBeTruthy();
      expect(getByText('$10.00')).toBeTruthy();
      expect(getByText('serviceB')).toBeTruthy();
      expect(getByText('$3.50')).toBeTruthy();
      expect(getByText('serviceC')).toBeTruthy();
      expect(getByText('$1.50')).toBeTruthy();
    });

    test('should handle service names with special characters', () => {
      const costData = {
        totalCost: 5.00,
        totalCalls: 100,
        services: [
          { service: 'service-name_123', cost: 5.00 },
        ],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      expect(getByText('service-name_123')).toBeTruthy();
    });

    test('should handle zero-cost services', () => {
      const costData = {
        totalCost: 5.00,
        totalCalls: 100,
        services: [
          { service: 'freeService', cost: 0.00 },
        ],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      expect(getByText('$0.00')).toBeTruthy();
    });
  });

  describe('Data Type Handling', () => {
    test('should handle string numbers gracefully', () => {
      const costData = {
        totalCost: '12.50',
        totalCalls: '5000',
        services: [],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      // JavaScript coercion should handle this
      expect(getByText(/12\.50/)).toBeTruthy();
    });

    test('should handle NaN values', () => {
      const costData = {
        totalCost: NaN,
        totalCalls: NaN,
        services: [],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      // Should not crash
      expect(getByText('Cost Summary (30d)')).toBeTruthy();
    });

    test('should handle Infinity values', () => {
      const costData = {
        totalCost: Infinity,
        totalCalls: 100,
        services: [],
      };

      const { getByText } = render(<CostSummaryCard costData={costData} />);

      // Should not crash
      expect(getByText('Cost Summary (30d)')).toBeTruthy();
    });
  });

  describe('Snapshot Testing', () => {
    test('should match snapshot with typical data', () => {
      const costData = {
        totalCost: 12.50,
        totalCalls: 5000,
        services: [
          { service: 'enhancedClaude', cost: 8.50 },
          { service: 'ifsAI', cost: 2.75 },
        ],
      };

      const tree = render(<CostSummaryCard costData={costData} />).toJSON();

      expect(tree).toMatchSnapshot();
    });

    test('should match snapshot with no data', () => {
      const tree = render(<CostSummaryCard costData={null} />).toJSON();

      expect(tree).toMatchSnapshot();
    });
  });
});
