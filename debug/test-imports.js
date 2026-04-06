// Test script to verify imports work
try {
  console.log('Testing imports...');
  
  // Test unified huxley service
  const huxleyService = require('../lib/huxleyService');
  console.log('✅ huxleyService imported successfully');
  
  // Test components
  const EmbeddedPracticeWidget = require('../components/EmbeddedPracticeWidget');
  console.log('✅ EmbeddedPracticeWidget imported successfully');
  
  const NervousSystemIndicator = require('../components/NervousSystemIndicator');
  console.log('✅ NervousSystemIndicator imported successfully');
  
  const EnhancedMessageBubble = require('../components/EnhancedMessageBubble');
  console.log('✅ EnhancedMessageBubble imported successfully');
  
  console.log('All imports successful! 🎉');
  
} catch (error) {
  console.error('❌ Import error:', error.message);
  console.error('Stack:', error.stack);
}
