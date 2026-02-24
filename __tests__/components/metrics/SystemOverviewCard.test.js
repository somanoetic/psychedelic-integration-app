/**
 * Component Tests for SystemOverviewCard
 *
 * Tests the System Overview Card component including:
 * - Rendering with valid data
 * - Handling edge cases (null, zero, large numbers)
 * - Number formatting and display
 * - Styling and layout
 *
 * NOTE: These tests require a React Native test environment (jest-expo).
 * They are skipped in node environment. Run with: npm run test:components
 */

let React, render, SystemOverviewCard;
let canRunComponentTests = false;

// Component tests need a proper React Native renderer (jsdom or jest-expo).
// In node testEnvironment, modules load but rendering fails silently.
if (typeof document !== 'undefined') {
  try {
    React = require('react');
    render = require('@testing-library/react-native').render;
    SystemOverviewCard = require('../../../components/metrics/SystemOverviewCard').default;
    canRunComponentTests = true;
  } catch (e) {
    // React Native testing environment not available
  }
}

const describeComponent = canRunComponentTests ? describe : describe.skip;

describeComponent('SystemOverviewCard', () => {
  describe('Rendering with Valid Data', () => {
    test('should render with all stats', () => {
      const { getByText } = render(
        <SystemOverviewCard
          totalCalls={1250}
          successRate={98.4}
          avgResponseTime={1450}
        />
      );

      expect(getByText('System Overview (24h)')).toBeTruthy();
      expect(getByText('1,250')).toBeTruthy(); // Formatted with comma
      expect(getByText('98.4%')).toBeTruthy();
      expect(getByText('1450ms')).toBeTruthy();
    });

    test('should render labels correctly', () => {
      const { getByText } = render(
        <SystemOverviewCard
          totalCalls={100}
          successRate={95.0}
          avgResponseTime={500}
        />
      );

      expect(getByText('Total Calls')).toBeTruthy();
      expect(getByText('Success Rate')).toBeTruthy();
      expect(getByText('Avg Response')).toBeTruthy();
    });

    test('should format large numbers with commas', () => {
      const { getByText } = render(
        <SystemOverviewCard
          totalCalls={1234567}
          successRate={99.9}
          avgResponseTime={2500}
        />
      );

      expect(getByText('1,234,567')).toBeTruthy();
    });

    test('should round response time to nearest millisecond', () => {
      const { getByText } = render(
        <SystemOverviewCard
          totalCalls={100}
          successRate={95.0}
          avgResponseTime={1234.56}
        />
      );

      expect(getByText('1235ms')).toBeTruthy(); // Rounded
    });

    test('should format success rate to 1 decimal place', () => {
      const { getByText } = render(
        <SystemOverviewCard
          totalCalls={100}
          successRate={98.456}
          avgResponseTime={500}
        />
      );

      expect(getByText('98.5%')).toBeTruthy(); // Rounded to 1 decimal
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero values', () => {
      const { getByText } = render(
        <SystemOverviewCard
          totalCalls={0}
          successRate={0}
          avgResponseTime={0}
        />
      );

      expect(getByText('0')).toBeTruthy();
      expect(getByText('0%')).toBeTruthy();
      expect(getByText('0ms')).toBeTruthy();
    });

    test('should handle null values with defaults', () => {
      const { getByText } = render(
        <SystemOverviewCard
          totalCalls={null}
          successRate={null}
          avgResponseTime={null}
        />
      );

      expect(getByText('0')).toBeTruthy();
      expect(getByText('0%')).toBeTruthy();
      expect(getByText('0ms')).toBeTruthy();
    });

    test('should handle undefined values', () => {
      const { getByText } = render(
        <SystemOverviewCard
          totalCalls={undefined}
          successRate={undefined}
          avgResponseTime={undefined}
        />
      );

      expect(getByText('0')).toBeTruthy();
      expect(getByText('0%')).toBeTruthy();
      expect(getByText('0ms')).toBeTruthy();
    });

    test('should handle no props passed', () => {
      const { getByText } = render(<SystemOverviewCard />);

      expect(getByText('0')).toBeTruthy();
      expect(getByText('0%')).toBeTruthy();
      expect(getByText('0ms')).toBeTruthy();
    });

    test('should handle very large numbers', () => {
      const { getByText } = render(
        <SystemOverviewCard
          totalCalls={999999999}
          successRate={100}
          avgResponseTime={99999}
        />
      );

      expect(getByText('999,999,999')).toBeTruthy();
      expect(getByText('100.0%')).toBeTruthy();
      expect(getByText('99999ms')).toBeTruthy();
    });

    test('should handle very small success rates', () => {
      const { getByText } = render(
        <SystemOverviewCard
          totalCalls={100}
          successRate={0.1}
          avgResponseTime={500}
        />
      );

      expect(getByText('0.1%')).toBeTruthy();
    });

    test('should handle fractional calls (should not happen, but test resilience)', () => {
      const { getByText } = render(
        <SystemOverviewCard
          totalCalls={100.7}
          successRate={95}
          avgResponseTime={500}
        />
      );

      // toLocaleString handles decimals
      expect(getByText(/100/)).toBeTruthy();
    });
  });

  describe('Boundary Conditions', () => {
    test('should handle 100% success rate', () => {
      const { getByText } = render(
        <SystemOverviewCard
          totalCalls={500}
          successRate={100}
          avgResponseTime={1000}
        />
      );

      expect(getByText('100.0%')).toBeTruthy();
    });

    test('should handle 0% success rate', () => {
      const { getByText } = render(
        <SystemOverviewCard
          totalCalls={100}
          successRate={0}
          avgResponseTime={500}
        />
      );

      expect(getByText('0%')).toBeTruthy();
    });

    test('should handle negative values (should not happen, but test)', () => {
      const { getByText } = render(
        <SystemOverviewCard
          totalCalls={-10}
          successRate={-5}
          avgResponseTime={-100}
        />
      );

      // Component should still render without crashing
      expect(getByText('System Overview (24h)')).toBeTruthy();
    });

    test('should handle extremely high response times', () => {
      const { getByText } = render(
        <SystemOverviewCard
          totalCalls={50}
          successRate={90}
          avgResponseTime={999999999}
        />
      );

      expect(getByText('999999999ms')).toBeTruthy();
    });
  });

  describe('Component Structure', () => {
    test('should render all three stat items', () => {
      const { getAllByText } = render(
        <SystemOverviewCard
          totalCalls={100}
          successRate={95}
          avgResponseTime={500}
        />
      );

      const labels = ['Total Calls', 'Success Rate', 'Avg Response'];
      labels.forEach(label => {
        expect(getAllByText(label).length).toBeGreaterThan(0);
      });
    });

    test('should have correct card title', () => {
      const { getByText } = render(
        <SystemOverviewCard
          totalCalls={100}
          successRate={95}
          avgResponseTime={500}
        />
      );

      expect(getByText('System Overview (24h)')).toBeTruthy();
    });
  });

  describe('Data Type Handling', () => {
    test('should handle string numbers gracefully', () => {
      const { getByText } = render(
        <SystemOverviewCard
          totalCalls={'1000'}
          successRate={'95.5'}
          avgResponseTime={'1500'}
        />
      );

      // JavaScript coercion should handle this
      expect(getByText(/1/)).toBeTruthy();
    });

    test('should handle NaN values', () => {
      const { getByText } = render(
        <SystemOverviewCard
          totalCalls={NaN}
          successRate={NaN}
          avgResponseTime={NaN}
        />
      );

      // Should not crash and show some default
      expect(getByText('System Overview (24h)')).toBeTruthy();
    });

    test('should handle Infinity values', () => {
      const { getByText } = render(
        <SystemOverviewCard
          totalCalls={Infinity}
          successRate={Infinity}
          avgResponseTime={Infinity}
        />
      );

      // Should not crash
      expect(getByText('System Overview (24h)')).toBeTruthy();
    });
  });

  describe('Snapshot Testing', () => {
    test('should match snapshot with typical data', () => {
      const tree = render(
        <SystemOverviewCard
          totalCalls={1250}
          successRate={98.4}
          avgResponseTime={1450}
        />
      ).toJSON();

      expect(tree).toMatchSnapshot();
    });

    test('should match snapshot with zero values', () => {
      const tree = render(
        <SystemOverviewCard
          totalCalls={0}
          successRate={0}
          avgResponseTime={0}
        />
      ).toJSON();

      expect(tree).toMatchSnapshot();
    });
  });
});
