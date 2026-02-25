import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ScenarioTrainingSystem from '../lib/scenarioTrainingSystem';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';

const ScenarioUploadScreen = ({ navigation }) => {
  const [uploadMethod, setUploadMethod] = useState('text'); // 'text' or 'json'
  const [scenarioText, setScenarioText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [trainingSystem] = useState(new ScenarioTrainingSystem());

  const handleUpload = async () => {
    if (!scenarioText.trim()) {
      Alert.alert('Error', 'Please enter some scenario data to upload.');
      return;
    }

    setIsUploading(true);
    
    try {
      let parsedData;
      
      if (uploadMethod === 'json') {
        try {
          parsedData = JSON.parse(scenarioText);
        } catch (e) {
          Alert.alert('Error', 'Invalid JSON format. Please check your data.');
          setIsUploading(false);
          return;
        }
      } else {
        parsedData = scenarioText;
      }
      
      const result = await trainingSystem.uploadScenarios(parsedData);
      
      if (result.success) {
        Alert.alert(
          'Success!', 
          `Successfully uploaded ${result.count} scenarios. Claude will now use these examples to improve responses.`,
          [{ text: 'OK', onPress: () => setScenarioText('') }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to upload scenarios.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const loadExampleData = () => {
    if (uploadMethod === 'json') {
      const exampleJSON = `{
  "mystical_experiences": {
    "triggers": ["unity", "oneness", "divine", "god", "cosmic"],
    "examples": [
      {
        "userMessage": "I felt connected to everything in the universe",
        "goodResponse": "What a profound experience. That sense of universal connection can be deeply meaningful. I'm curious - what was that feeling like in your body?",
        "approach": "honor_then_embody",
        "therapeuticNotes": "Mystical experiences need validation and somatic integration."
      }
    ]
  }
}`;
      setScenarioText(exampleJSON);
    } else {
      const exampleText = `USER: I saw dark shadow figures that felt threatening
CLAUDE: Thank you for sharing something so vulnerable. Dark visions can be intense. Let's check in with your nervous system - how is your body feeling right now?
APPROACH: validate_first_then_regulate
TRIGGERS: dark, shadow, threatening, scary
NOTES: Shadow work requires extra safety and nervous system regulation

---

USER: I felt connected to everything in the universe
CLAUDE: What a profound experience. That sense of universal connection can be deeply meaningful. I'm curious - what was that feeling like in your body?
APPROACH: honor_then_embody
TRIGGERS: connected, universe, oneness, unity
NOTES: Mystical experiences need validation and somatic integration`;
      setScenarioText(exampleText);
    }
  };

  return (
    <LinearGradient
      colors={gradients.standard}
      start={{ x: 1.0, y: 0.0 }}
      end={{ x: 0.0, y: 1.0 }}
      style={{ flex: 1 }}
    >
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
    <ScrollView style={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Upload Training Scenarios</Text>
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>📚 Train Claude to Respond Better</Text>
        <Text style={styles.infoText}>
          Upload examples of user messages and good therapeutic responses. Claude will learn from these patterns to provide better integration support.
        </Text>
      </View>

      {/* Format Selection */}
      <View style={styles.formatSection}>
        <Text style={styles.sectionTitle}>Choose Format:</Text>
        <View style={styles.formatButtons}>
          <TouchableOpacity
            style={[styles.formatButton, uploadMethod === 'text' && styles.formatButtonActive]}
            onPress={() => setUploadMethod('text')}
          >
            <Text style={[styles.formatButtonText, uploadMethod === 'text' && styles.formatButtonTextActive]}>Text Format</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.formatButton, uploadMethod === 'json' && styles.formatButtonActive]}
            onPress={() => setUploadMethod('json')}
          >
            <Text style={[styles.formatButtonText, uploadMethod === 'json' && styles.formatButtonTextActive]}>JSON Format</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Format Instructions */}
      <View style={styles.instructionsSection}>
        <Text style={styles.sectionTitle}>Format Instructions:</Text>
        {uploadMethod === 'text' ? (
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>Use this format for each scenario:</Text>
            <Text style={styles.exampleText}>
              USER: [User's message]{"\n"}
              CLAUDE: [Good therapeutic response]{"\n"}
              APPROACH: [Therapeutic approach used]{"\n"}
              TRIGGERS: [Comma-separated keywords]{"\n"}
              NOTES: [Optional therapeutic notes]{"\n"}
              {"\n"}---{"\n"}
            </Text>
          </View>
        ) : (
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>JSON structure with categories and examples:</Text>
            <Text style={styles.exampleText}>
              {`{
  "category_name": {
    "triggers": ["keyword1", "keyword2"],
    "examples": [{
      "userMessage": "...",
      "goodResponse": "...",
      "approach": "..."
    }]
  }
}`}
            </Text>
          </View>
        )}
      </View>

      {/* Load Example Button */}
      <TouchableOpacity style={styles.exampleButton} onPress={loadExampleData}>
        <Text style={styles.exampleButtonText}>📝 Load Example Data</Text>
      </TouchableOpacity>

      {/* Text Input */}
      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>Scenario Data:</Text>
        <TextInput
          style={styles.textInput}
          value={scenarioText}
          onChangeText={setScenarioText}
          placeholder={uploadMethod === 'json' ? 'Paste JSON data here...' : 'Paste text scenarios here...'}
          multiline
          textAlignVertical="top"
        />
      </View>

      {/* Upload Button */}
      <TouchableOpacity 
        style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
        onPress={handleUpload}
        disabled={isUploading}
      >
        <Text style={styles.uploadButtonText}>
          {isUploading ? '⏳ Uploading...' : '🚀 Upload Scenarios'}
        </Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    fontSize: 16,
    color: colors.primary,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  infoSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  formatSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formatButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  formatButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  formatButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  formatButtonTextActive: {
    color: colors.textInverse,
  },
  instructionsSection: {
    margin: 16,
    marginTop: 0,
  },
  instructions: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  instructionText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.textSecondary,
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 4,
  },
  exampleButton: {
    margin: 16,
    marginTop: 0,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    alignItems: 'center',
  },
  exampleButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  inputSection: {
    margin: 16,
    marginTop: 0,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 200,
    maxHeight: 400,
  },
  uploadButton: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
  bottomPadding: {
    height: 32,
  },
};

export default ScenarioUploadScreen;