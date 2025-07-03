import { getKODataAndContext, getKOObservables, KnockoutViewModelResult, KOTrackedProperty } from '../src/core';

describe('getKODataAndContext', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('should return empty objects when ko or $0 is not available', () => {
    // Mock window.ko as undefined
    Object.defineProperty(window, 'ko', { value: undefined });
    
    const result = getKODataAndContext();
    
    expect(result).toEqual({ viewModel: {}, context: {} });
  });

  test('should return data and context from ko.dataFor and ko.contextFor', () => {
    // Mock ko.dataFor and ko.contextFor to return test data
    const mockData = { name: 'Test', value: 123 };
    const mockContext = { $parent: { name: 'Parent' } };
    
    Object.defineProperty(window, 'ko', {
      value: {
        dataFor: jest.fn().mockReturnValue(mockData),
        contextFor: jest.fn().mockReturnValue(mockContext),
      },
      writable: true,
    });
    
    const result = getKODataAndContext();
    
    expect(window.ko.dataFor).toHaveBeenCalledWith(window.$0);
    expect(window.ko.contextFor).toHaveBeenCalledWith(window.$0);
    expect(result.viewModel).toEqual(mockData);
    expect(result.context).toEqual(mockContext);
  });

  test('should handle null or undefined data and context', () => {
    // Mock ko.dataFor and ko.contextFor to return null
    Object.defineProperty(window, 'ko', {
      value: {
        dataFor: jest.fn().mockReturnValue(null),
        contextFor: jest.fn().mockReturnValue(undefined),
      },
      writable: true,
    });
    
    const result = getKODataAndContext();
    
    expect(result).toEqual({ viewModel: {}, context: {} });
  });
});

describe('getKOObservables', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('should return empty array when ko or $0 is not available', () => {
    // Mock window.ko as undefined
    Object.defineProperty(window, 'ko', { value: undefined });
    
    const result = getKOObservables();
    
    expect(result).toEqual([]);
  });

  test('should return empty array when data is not available', () => {
    // Mock ko.dataFor to return null
    Object.defineProperty(window, 'ko', {
      value: {
        dataFor: jest.fn().mockReturnValue(null),
      },
      writable: true,
    });
    
    const result = getKOObservables();
    
    expect(result).toEqual([]);
  });

  test('should return observable properties from data', () => {
    // Create mock observable functions
    const mockObservable = jest.fn().mockReturnValue('Observable Value');
    const mockObservableArray = jest.fn().mockReturnValue(['Array', 'Value']);
    const mockComputed = jest.fn().mockReturnValue('Computed Value');
    
    // Add isObservable property to the functions
    Object.defineProperty(mockObservable, 'valueHasMutated', { value: jest.fn() });
    Object.defineProperty(mockObservableArray, 'valueHasMutated', { value: jest.fn() });
    Object.defineProperty(mockComputed, 'valueHasMutated', { value: jest.fn() });
    
    // Create mock data with observable properties
    const mockData = {
      regularProp: 'Regular Value',
      observableProp: mockObservable,
      arrayProp: mockObservableArray,
      computedProp: mockComputed,
    };
    
    // Mock ko methods
    Object.defineProperty(window, 'ko', {
      value: {
        dataFor: jest.fn().mockReturnValue(mockData),
        isObservable: jest.fn().mockImplementation(prop => 
          prop === mockObservable || prop === mockObservableArray || prop === mockComputed
        ),
        isComputed: jest.fn().mockImplementation(prop => prop === mockComputed),
      },
      writable: true,
    });
    
    // Mock Array.isArray for observableArray detection
    const originalIsArray = Array.isArray;
    Array.isArray = jest.fn().mockImplementation(value => 
      value === mockObservableArray() || originalIsArray(value)
    );
    
    const result = getKOObservables();
    
    // Restore original Array.isArray
    Array.isArray = originalIsArray;
    
    expect(window.ko.dataFor).toHaveBeenCalledWith(window.$0);
    expect(window.ko.isObservable).toHaveBeenCalledTimes(3);
    
    // Check that the result contains the observable properties
    expect(result).toContainEqual({
      name: 'observableProp',
      type: 'observable',
      value: 'Observable Value',
    });
    
    expect(result).toContainEqual({
      name: 'arrayProp',
      type: 'observableArray',
      value: ['Array', 'Value'],
    });
    
    expect(result).toContainEqual({
      name: 'computedProp',
      type: 'computed',
      value: 'Computed Value',
    });
    
    // Check that the regular property is not included
    expect(result.find(prop => prop.name === 'regularProp')).toBeUndefined();
  });
});