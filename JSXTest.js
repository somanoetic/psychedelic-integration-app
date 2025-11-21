// Quick JSX Test File to identify any syntax issues

import React from 'react';
import { View, Text } from 'react-native';

const TestComponent = () => {
  const testValue = 1;
  const testArray = [1, 2, 3];
  
  return (
    <View>
      <Text>Basic JSX test</Text>
      <Text>Conditional rendering: {testValue === 1 ? 'One' : 'Other'}</Text>
      <Text>Array mapping:</Text>
      {testArray.map((item, index) => (
        <Text key={index}>Item: {item}</Text>
      ))}
      <Text>Switch statement test: {(() => {
        switch(testValue) {
          case 1: return 'One';
          case 2: return 'Two';
          default: return 'Other';
        }
      })()}</Text>
    </View>
  );
};

export default TestComponent;