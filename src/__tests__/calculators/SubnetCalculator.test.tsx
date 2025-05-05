import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubnetVisualizer from '@/components/tools/SubnetVisualizer'; // Adjust path if necessary
import * as calculatorUtils from '@/lib/calculator-utils'; // Import the module

// Mock the calculator utility functions
jest.mock('@/lib/calculator-utils', () => ({
  ...jest.requireActual('@/lib/calculator-utils'), // Keep original implementations
  calculateSubnetDetails: jest.fn(),
  isValidIPv4: jest.fn(() => true), // Assume valid by default
  ipToBinaryString: jest.fn((ip) => ip ? ip.split('.').map(o => parseInt(o).toString(2).padStart(8, '0')).join('.') : undefined), // Mock binary conversion
  formatIpBinaryString: jest.fn((bin) => bin || 'N/A'), // Simple mock for formatting
  cidrToSubnetMask: jest.fn((cidr) => { // Mock cidrToSubnetMask
      if (cidr === 24) return '255.255.255.0';
      if (cidr === 27) return '255.255.255.224';
      return '0.0.0.0'; // Default mock
  }),
}));

// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('SubnetVisualizer Component', () => {
  const mockCalculateSubnetDetails = calculatorUtils.calculateSubnetDetails as jest.Mock;
  const mockIsValidIPv4 = calculatorUtils.isValidIPv4 as jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    mockCalculateSubnetDetails.mockClear();
    mockIsValidIPv4.mockClear().mockReturnValue(true); // Default to valid IP
    mockCalculateSubnetDetails.mockReturnValue(null); // Default to no result
  });

  test('renders correctly with initial state', () => {
    render(<SubnetVisualizer />);
    expect(screen.getByLabelText(/IPv4 Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CIDR/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();
    // No results table initially
    expect(screen.queryByText(/Subnet Details/i)).not.toBeInTheDocument();
  });

  test('updates IP address input', () => {
    render(<SubnetVisualizer />);
    const ipInput = screen.getByLabelText(/IPv4 Address/i);
    fireEvent.change(ipInput, { target: { value: '192.168.1.1' } });
    expect(ipInput).toHaveValue('192.168.1.1');
  });

  test('updates CIDR selection', async () => {
    render(<SubnetVisualizer />);
    const cidrSelectTrigger = screen.getByRole('combobox');
    fireEvent.mouseDown(cidrSelectTrigger);

    // Wait for options to appear (use findByRole if needed)
    const option27 = await screen.findByRole('option', { name: /\/27/ });
    fireEvent.click(option27);

    // Check if the trigger value updated (might need specific query based on implementation)
     // Check if the SelectValue inside the trigger updated
     // The text content might include the subnet mask, so use a flexible query
     expect(cidrSelectTrigger).toHaveTextContent('/27');
     expect(cidrSelectTrigger).toHaveTextContent('255.255.255.224'); // Check mask part too
  });

  test('calls calculateSubnetDetails when IP and CIDR change and are valid', async () => {
    render(<SubnetVisualizer />);
    const ipInput = screen.getByLabelText(/IPv4 Address/i);
    const cidrSelectTrigger = screen.getByRole('combobox');

    // Change IP
    fireEvent.change(ipInput, { target: { value: '10.1.1.5' } });

    // Change CIDR
    fireEvent.mouseDown(cidrSelectTrigger);
    const option27 = await screen.findByRole('option', { name: /\/27/ });
    fireEvent.click(option27);

    // Wait for the calculation to be triggered (due to state updates)
    await waitFor(() => {
      // calculateSubnetDetails should be called *after* state updates settle
      expect(mockCalculateSubnetDetails).toHaveBeenCalledWith('10.1.1.5', 27);
    });
  });

  test('displays calculation results when details are returned', async () => {
    const mockDetails = {
      networkAddress: '10.1.1.0',
      broadcastAddress: '10.1.1.31',
      subnetMask: '255.255.255.224',
      wildcardMask: '0.0.0.31',
      firstUsableHost: '10.1.1.1',
      lastUsableHost: '10.1.1.30',
      totalHosts: 32,
      usableHosts: 30,
      binaryIpAddress: '00001010.00000001.00000001.00000101',
      binarySubnetMask: '11111111.11111111.11111111.11100000',
      binaryNetworkAddress: '00001010.00000001.00000001.00000000',
      binaryBroadcastAddress: '00001010.00000001.00000001.00011111',
    };
    mockCalculateSubnetDetails.mockReturnValue(mockDetails);
    mockIsValidIPv4.mockReturnValue(true); // Ensure IP is considered valid

    render(<SubnetVisualizer />);
    const ipInput = screen.getByLabelText(/IPv4 Address/i);
    fireEvent.change(ipInput, { target: { value: '10.1.1.5' } }); // Trigger calculation

    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByText(/Subnet Details/i)).toBeInTheDocument();
      expect(screen.getByText('10.1.1.0')).toBeInTheDocument(); // Network Address
      expect(screen.getByText('30')).toBeInTheDocument(); // Usable Hosts
      // Check binary table content (using mocked formatter output)
       expect(screen.getByText('00001010.00000001.00000001.00000101')).toBeInTheDocument(); // Binary IP
       expect(screen.getByText('11111111.11111111.11111111.11100000')).toBeInTheDocument(); // Binary Mask
    });
  });

  test('displays IP format error message', async () => {
    mockIsValidIPv4.mockReturnValue(false); // Simulate invalid IP

    render(<SubnetVisualizer />);
    const ipInput = screen.getByLabelText(/IPv4 Address/i);
    fireEvent.change(ipInput, { target: { value: 'invalid-ip' } });

    await waitFor(() => {
      expect(screen.getByText('Invalid IPv4 address format.')).toBeInTheDocument();
    });
    // Results should not be displayed
    expect(screen.queryByText(/Subnet Details/i)).not.toBeInTheDocument();
  });

  test('displays calculation error message', async () => {
      const errorMessage = 'Failed to calculate subnet details.';
      mockCalculateSubnetDetails.mockImplementation(() => { throw new Error(errorMessage); });
      mockIsValidIPv4.mockReturnValue(true); // IP format is valid

      render(<SubnetVisualizer />);
      const ipInput = screen.getByLabelText(/IPv4 Address/i);
      fireEvent.change(ipInput, { target: { value: '192.168.1.1' } }); // Trigger calculation

      await waitFor(() => {
          // The error should be displayed near the CIDR input in this implementation
           expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
      // Results should not be displayed
      expect(screen.queryByText(/Subnet Details/i)).not.toBeInTheDocument();
  });


  test('resets fields when "Reset" button is clicked', async () => {
    mockCalculateSubnetDetails.mockReturnValue({ /* some details */ }); // Simulate initial result
    render(<SubnetVisualizer />);
    const ipInput = screen.getByLabelText(/IPv4 Address/i);
    const resetButton = screen.getByRole('button', { name: /Reset/i });

    // Set some initial values
    fireEvent.change(ipInput, { target: { value: '192.168.1.1' } });
    // Select CIDR /27
    const cidrSelectTrigger = screen.getByRole('combobox');
    fireEvent.mouseDown(cidrSelectTrigger);
    const option27 = await screen.findByRole('option', { name: /\/27/ });
    fireEvent.click(option27);

    await waitFor(() => {
         expect(ipInput).toHaveValue('192.168.1.1');
         expect(cidrSelectTrigger).toHaveTextContent('/27');
    });

    // Click Reset
    fireEvent.click(resetButton);

    // Check if fields are reset to initial state
    expect(ipInput).toHaveValue('');
    expect(cidrSelectTrigger).toHaveTextContent('/24'); // Default CIDR is 24
    expect(screen.queryByText(/Subnet Details/i)).not.toBeInTheDocument(); // Results cleared
    expect(screen.queryByText(/Invalid IPv4/i)).not.toBeInTheDocument(); // Error cleared
  });
});
